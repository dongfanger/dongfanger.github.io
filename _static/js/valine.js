window.onload = function() {
    var footer = document.getElementsByTagName("footer")[0];
    var div = document.createElement("div");
    div.id = "vcomments";
    footer.insertBefore(div, footer.children[0]);
    var script   = document.createElement("script");
    var code = "new Valine({el: '#vcomments', placeholder: 'Hi~',appId: '4c59iBGdQ3qOLaC1qwlKTMlm-gzGzoHsz', appKey: 'S397YG5KEGEQFGBV6UT4NTw1', avatar: 'hide', recordIP: false});";
    try {
        script.appendChild(document.createTextNode(code));
    }
    catch (ex) {
        script.text = code;
    }
    var body = document.getElementsByTagName("body")[0];
    body.appendChild(script);

    var vpower = document.querySelector('#vcomments > div.vpower.txt-right');
    vpower.remove();
}

