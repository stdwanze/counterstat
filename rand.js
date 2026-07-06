this.open = function(e) {
    o = new WebSocket(l.url,n || []),
    o.binaryType = this.binaryType;
    var i = null;
    if (e) {
        if (this.maxReconnectAttempts && this.reconnectAttempts > this.maxReconnectAttempts)
            return
    } else
        u.dispatchEvent(d("connecting")),
        this.reconnectAttempts = 0;
    l.debug || t.debugAll;
    var a = o
      , r = setTimeout((function() {
        l.debug || t.debugAll,
        c = !0,
        a.close(),
        c = !1
    }
    ), l.timeoutInterval);
    o.onopen = function(n) {
        if (clearTimeout(r),
        (l.debug || t.debugAll) && console.debug("ReconnectingWebSocket", "onopen", l.url),
        l.protocol = o.protocol,
        l.readyState = WebSocket.OPEN,
        l.reconnectAttempts > 0)
            return o.close(),
            void window.location.reload();
        l.reconnectAttempts = 0;
        var i = d("open");
        i.isReconnect = e,
        e = !1,
        u.dispatchEvent(i)
    }
    ,
    o.onclose = function(n) {
        if (clearTimeout(r),
        o = null,
        s)
            l.readyState = WebSocket.CLOSED,
            u.dispatchEvent(d("close"));
        else {
            l.readyState = WebSocket.CONNECTING;
            var a = d("connecting");
            a.code = n.code,
            a.reason = n.reason,
            a.wasClean = n.wasClean,
            u.dispatchEvent(a),
            e || c || ((l.debug || t.debugAll) && console.debug("ReconnectingWebSocket", "onclose", l.url),
            u.dispatchEvent(d("close")));
            var r = l.reconnectInterval * Math.pow(l.reconnectDecay, l.reconnectAttempts);
            i || setTimeout((function() {
                l.reconnectAttempts++,
                l.open(!0)
            }
            ), r > l.maxReconnectInterval ? l.maxReconnectInterval : r)
        }
    }
    ,
    o.onmessage = function(e) {
        (l.debug || t.debugAll) && console.debug("ReconnectingWebSocket", "onmessage", l.url, e.data),
        console.debug("ReconnectingWebSocket", "解除心跳");
        var n = (JSON.parse(e.data).result_data || {}).token;
        !f.token && n && f.reset().init(n).start(),
        n && f.init(n);
        var a = JSON.parse(e.data);
        if (1 == a.result_code) {
            if (a.hasOwnProperty("result_data") && "string" === typeof a.result_data.service && "state" === a.result_data.service) {
                var r = d("globalMessage");
                r.data = e.data,
                u.dispatchEvent(r)
            } else if (a.hasOwnProperty("result_data") && "string" === typeof a.result_data.service && "connect" === a.result_data.service) {
                r = d("conformConnect");
                r.data = e.data,
                u.dispatchEvent(r)
            } else if (a.hasOwnProperty("result_data")) {
                r = d("message");
                r.data = e.data,
                u.dispatchEvent(r)
            }
        } else if (1 != a.result_code)
            if (a.hasOwnProperty("result_data") && "string" === typeof a.result_data.service && "notice" === a.result_data.service) {
                r = d("globalMessage");
                r.data = e.data,
                u.dispatchEvent(r),
                f.stop(),
                new RegExp(JSON.parse(e.data).result_code).test("100|101|103|104|106|108") && (i = !0)
            } else if (a.hasOwnProperty("result_data") && "string" === typeof a.result_data.service && "connect" === a.result_data.service) {
                r = d("conformConnect");
                r.data = e.data,
                u.dispatchEvent(r)
            } else if (a.hasOwnProperty("result_data")) {
                r = d("message");
                r.data = e.data,
                u.dispatchEvent(r)
            }
    }
    ,
    o.onerror = function(e) {
        if (void 0 != window.browserCaches && null != window.browserCaches && window.browserCaches)
            window.location.reload();
        else {
            if (0 == window.sockeflag) {
                var n = ["<br><cite>" + layui.fusion.i18n.localized("I18N_COMMON_NET_CANNOT_ACCESS") + "</cite>"].join("");
                layui.view.error(n),
                window.sockeflag = 1
            }
            (l.debug || t.debugAll) && console.debug("ReconnectingWebSocket", "onerror", l.url, e),
            u.dispatchEvent(d("error"))
        }
    }


    'ws://192.168.1.214:8082/ws/home/overview'