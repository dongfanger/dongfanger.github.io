/* 自定义中文搜索分词(纯 JS bigram, 零依赖)
 *
 * 背景: mkdocs 1.6.1 自带的 lunr.zh.js 依赖 @node-rs/jieba(Node 端 Rust 模块),
 * 浏览器里 nodejieba 是 undefined,搜索时 nodejieba.cut() 抛错,索引建到一半崩掉,
 * 中文搜索因此完全失效。
 *
 * 本文件在构建后由 tools/post_build.py 覆盖 site/search/lunr.zh.js,worker 里
 * 通过 importScripts 加载,this.use(lunr.zh) 生效。
 *
 * 策略:
 *  - 索引: 中文段拆成 unigram + bigram,英文/数字保持整词
 *  - 查询: 中文段转成 bigram 的 AND(要求相邻二字对同时出现),英文/数字整词
 */
(function () {
  if (typeof lunr === 'undefined') return;

  var tokenizer = function (obj) {
    if (obj == null || obj === undefined) return [];
    if (Array.isArray(obj)) return obj.map(function (t) { return new lunr.Token(String(t).toLowerCase()); });
    var str = String(obj).trim().toLowerCase();
    var tokens = [];
    var re = /[a-z0-9]+|[一-龥]+/g, m;
    while ((m = re.exec(str)) !== null) {
      var seg = m[0];
      if (/^[a-z0-9]+$/.test(seg)) {
        tokens.push(seg);
      } else {
        var chars = seg.split('');
        for (var i = 0; i < chars.length; i++) {
          tokens.push(chars[i]);
          if (i < chars.length - 1) tokens.push(chars[i] + chars[i + 1]);
        }
      }
    }
    return tokens.map(function (t) { return new lunr.Token(t); });
  };

  var querySegment = function (str) {
    str = String(str).trim().toLowerCase();
    var parts = [];
    var re = /[a-z0-9]+|[一-龥]+/g, m;
    while ((m = re.exec(str)) !== null) {
      var seg = m[0];
      if (/^[a-z0-9]+$/.test(seg)) { parts.push(seg); continue; }
      var chars = seg.split('');
      if (chars.length === 1) parts.push(chars[0]);
      else if (chars.length === 2) parts.push(seg);
      else {
        var g = [];
        for (var i = 0; i < chars.length - 1; i++) g.push('+' + chars[i] + chars[i + 1]);
        parts.push(g.join(' '));
      }
    }
    return parts.join(' ');
  };

  // 插件: 清空索引/查询 pipeline(去掉英文 trimmer/stemmer/stopword),只用自定义 tokenizer
  lunr.zh = function () {
    this.pipeline.reset();
    this.searchPipeline.reset();
    this.tokenizer = tokenizer;
  };
  lunr.zh.tokenizer = tokenizer;
  lunr.zh.querySegment = querySegment;

  // 中文 query 转 bigram AND
  if (lunr.Index && lunr.Index.prototype.search) {
    var _searchOrig = lunr.Index.prototype.search;
    lunr.Index.prototype.search = function (qs) {
      if (typeof qs === 'string' && qs.trim()) qs = querySegment(qs);
      return _searchOrig.call(this, qs);
    };
  }
})();
