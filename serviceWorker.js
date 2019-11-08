(function () {

    // ==============
    // Service Worker
    // ==============

    var swMain = function () {
        var prefeachs = [
            '/',
            '/toolbox/rng.html',
            '/toolbox/randomseat.html',
            '/toolbox/countdown.html',
            '/toolbox/countdown-ring.mp3',
            '/img/external-link.svg',
            '/toolbox/minesweeper.html',
            '/blog/style.css',
            '/blog/vcomputer.html',
            '/toolbox/vcomputer.html'
        ];

        var updateCache = function () {
            return caches.open('v1').then(function (cache) {
                return Promise.all(prefeachs.map(function (url) {
                    fetch(url).then(function (r) {
                        if (r.ok) cache.put(url, r);
                    });
                }));
            });
        };

        self.addEventListener('install', function (event) {
            event.waitUntil(updateCache());
        });

        self.addEventListener('fetch', function (event) {
            clients.get(event.clientId).then(function (client) {
                client.postMessage('fetch(): ' + event.request.url);
            });
            event.respondWith(caches.match(event.request).then(function (response) {
                if (response !== undefined) {
                    // when it's cached, return the cached response and update cache.
                    fetch(event.request).then(function (response) {
                        if (response.ok) {
                            caches.open('v1').then(function (cache) {
                                cache.put(event.request, response);
                            });
                        }
                    });
                    return response;
                } else {
                    return fetch(event.request).then(function (response) {
                        if (response.ok) {
                            var responseClone = response.clone();
                            caches.open('v1').then(function (cache) {
                                cache.put(event.request, responseClone);
                            });
                        }
                        return response;
                    });
                }
            }));
        });

        self.addEventListener('message', function (event) {
            
        });
    };

    var inServiceWorker = self.ServiceWorkerGlobalScope && self instanceof ServiceWorkerGlobalScope;

    if (inServiceWorker) {
        swMain();
        return;
    }
    console.log('initializing sw client...');

    var sw = self.sw = {
        onStateChanged: null,
        stateText: '',
        registered: null,
        notSupport: null,
        getTime: function () { return new Date().getTime(); }
    };

    var protocolFile = window.location.protocol == 'file:';

    var newVersionState = null;

    var swNotSupported = true;

    if (!navigator.serviceWorker) {
        sw.notSupport = "Your browser does not support service worker.";
    } else if (window.location.protocol != 'https:' && window.location.hostname != '127.0.0.1') {
        sw.notSupport = "To enable service worker, you have to access this site over HTTPS protocol.";
    } else {
        swNotSupported = false;
    }

    if (sw.notSupport) console.log('sw not supported: ' + sw.notSupport);

    var tryCall = function (x, args) { x && x.apply(this, args); };
    var stateChanged = function (text) {
        console.log('sw state changed: ' + text);
        sw.stateText = text;
        tryCall(sw.onStateChanged);
    };

    var swUrl = '/serviceWorker.js';
    var registration = null;
    var getAndCheck = function () {
        return navigator.serviceWorker.getRegistration(swUrl).then(function (r) {
            checkReg(r);
            return r;
        });
    };
    var checkReg = function (r) {
        registration = r;
        sw.registered = !!r;
        if (r) {
            console.log('registration: ', r);
            var cursw = r.active || r.waiting || r.installing;
            console.log('sw: (cur, active, waiting, installing)', cursw, r.active, r.waiting, r.installing);
            if (r.active && (r.waiting || r.installing)) newVersionState = (r.waiting || r.installing).state;
            updateState(cursw);
            cursw.addEventListener('statechange', function () {
                updateState(cursw);
            });
        } else {
            stateChanged('no registration');
        }
    };
    var updateState = function (sw) {
        stateChanged(sw.state + (newVersionState ? ' (new version: ' + newVersionState + ')' : ''));
    };
    var startListen = function () {
        navigator.serviceWorker.addEventListener('message', function (e) {
            console.log('message from sw: ', e);
        });
    };
    sw.toggle = function (force) {
        if (swNotSupported) {
            checkReg(null);
            return;
        }
        if (force === undefined) force = !registration;
        if (force) {
            localStorage.removeItem('noServiceWorker');
            stateChanged('register...');
            navigator.serviceWorker.register(swUrl).then(function (r) {
                checkReg(r);
            })['catch'](function (err) {
                console.warn('register', err);
                stateChanged('register error');
            });
        } else {
            localStorage.setItem('noServiceWorker', 'true');
            if (registration) {
                registration.unregister();
                checkReg(null);
            }
        }
    };
    sw.check = function (autoEnable) {
        if (swNotSupported) {
            sw.toggle();
            return;
        }
        startListen();
        return getAndCheck().then(function (r) {
            if (autoEnable && !r && localStorage.getItem('noServiceWorker') != 'true') {
                console.log('automatically enabling service worker...');
                sw.toggle(true);
            }
            return !!r;
        });
    };

    // ==============
    // Blog Render
    // ==============

    // render blog and check service worker.
    sw.blog = function () {
        renderBlog();
        sw.check(true);
    };

    var renderBlog = function () {
        var style = appendStyleLink('style.css');
        document.body.hidden = true;
        style.onload = function () {
            console.log('blog style loaded.');
            setTimeout(function () { document.body.hidden = false; }, 0);

        };
        style.onerror = function () {
            document.body.hidden = false;
            document.body.insertBefore(sw.buildDOM({
                tag: 'div#style-failed',
                style: 'color: red',
                textContent: 'Failed to load blog style!'
            }), header);
        };

        var header = sw.buildDOM({
            tag: 'div.header',
            child: {
                tag: 'div.header-inner',
                child: [{
                    tag: 'a#titlelink',
                    href: protocolFile ? '../index.html' : '../'
                }, {
                    tag: 'div#darkTheme.btn'
                }]
            }
        });
        document.body.insertBefore(header, document.body.firstChild);

        var siDarkTheme = new sw.SettingItem('darkTheme', 'bool', false)
            .bindToBtn(document.getElementById('darkTheme'), ['🔆', '🌙'])
            .render(function (val) {
                document.body.classList.toggle('dark', val);
            });

        console.info('blog theme rendered');
    }

    var appendStyle = function (text) {
        var style = document.createElement('style');
        style.appendChild(document.createTextNode(text));
        document.head.appendChild(style);
    };

    var appendStyleLink = function (uri) {
        var link = document.createElement('link');
        link.type = 'text/css';
        link.rel = 'stylesheet';
        link.href = uri;
        document.head.appendChild(link);
        return link;
    };

    // ==============
    // SettingItem API
    // ==============

    sw.SettingItem = (function () {
        var SettingItem = function (key, type, initial) {
            this.key = key;
            this.type = typeof type == 'string' ? SettingItem.types[type] : type;
            var str = key ? localStorage.getItem(key) : null;
            this.set(str ? this.type.deserilize(str) : initial, true);
        };
        SettingItem.prototype.render = function (fn, dontRaiseNow) {
            if (!dontRaiseNow) fn(this.data);
            var oldFn = this.onRender;
            var newFn = fn;
            if (oldFn) fn = function (x) { oldFn(x); newFn(x); };
            this.onRender = fn;
            return this;
        };
        SettingItem.prototype.bindToBtn = function (btn, prefix) {
            if (this.type != SettingItem.types.bool) throw new Error('only for bool type');
            var span = document.createElement('span');
            btn.insertBefore(span, btn.firstChild);
            this.render(function (x) {
                btn.classList.toggle('disabled', !x);
                prefix = prefix || ["❌", "✅"]
                span.textContent = prefix[+x];
            });
            var thiz = this;
            btn.addEventListener('click', function () { thiz.toggle(); });
            return this;
        };
        SettingItem.prototype.set = function (data, dontSave) {
            this.data = data;
            this.onRender && this.onRender(data);
            if (!dontSave && this.key) localStorage.setItem(this.key, this.type.serialize(data));
        };
        SettingItem.prototype.get = function () {
            return this.data;
        };
        SettingItem.prototype.toggle = function () {
            if (this.type != SettingItem.types.bool) throw new Error('only for bool type');
            this.set(!this.data);
        };
        SettingItem.prototype.loop = function (arr) {
            var curData = this.data;
            var oldIndex = arr.findIndex(function (x) { return x == curData; });
            var newData = arr[(oldIndex + 1) % arr.length];
            this.set(newData);
        };
        SettingItem.types = {
            bool: {
                serialize: function (data) { return data ? 'true' : 'false'; },
                deserilize: function (str) { return str == 'true' ? true : str == 'false' ? false : undefined; }
            },
            str: {
                serialize: function (x) { return x; },
                deserilize: function (x) { return x; }
            },
            json: {
                serialize: function (x) { return JSON.stringify(x); },
                deserilize: function (x) { return JSON.parse(x); }
            }
        };
        return SettingItem;
    })();

    // ==============
    // DOM API
    // ==============

    var createElementFromTag = function (tag) {
        var reg = /[#\.^]?[\w\-]+/y;
        var match;
        var ele;
        while (match = reg.exec(tag)) {
            var val = match[0];
            var ch = val[0];
            if (ch == '.') {
                ele.classList.add(val.substr(1));
            } else if (ch == '#') {
                ele.id = val.substr(1);
            } else {
                if (ele) throw new Error('unexpected multiple tags');
                ele = document.createElement(val);
            }
        }
        return ele;
    };

    var buildDomCore = function (obj, ttl) {
        if (ttl-- < 0) throw new Error('ran out of TTL');
        if (typeof (obj) === 'string') return document.createTextNode(obj);
        if (Node && obj instanceof Node) return obj;
        var node = createElementFromTag(obj.tag);
        for (var key in obj) {
            if (key != 'tag' && obj.hasOwnProperty(key)) {
                var val = obj[key];
                if (key == 'child') {
                    if (val instanceof Array) {
                        val.forEach(function (x) {
                            node.appendChild(buildDomCore(x, ttl));
                        });
                    } else {
                        node.appendChild(buildDomCore(val, ttl));
                    }
                } else {
                    node[key] = val;
                }
            }
        }
        return node;
    };

    sw.buildDOM = function (obj) {
        return buildDomCore(obj, 32);
    };

})();
