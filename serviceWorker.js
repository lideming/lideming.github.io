(function () {
    var swMain = function () {
        var prefeachs = [
            '/',
            '/toolbox/rng.html',
            '/toolbox/randomseat.html',
            '/toolbox/countdown.html',
            '/toolbox/countdown-ring.mp3',
            '/img/external-link.svg',
            '/toolbox/minesweeper.html',
            '/blog/style.css'
        ];

        var updateCache = function () {
            return caches.open('v1').then(function (cache) {
                return Promise.all(prefeachs.map(function (url) {
                    fetch(url).then(function (r) {
                        if (r.ok) cache.put(url, r);
                    });
                }));
            })
        };

        self.addEventListener('install', function (event) {
            event.waitUntil(updateCache());
        });

        self.addEventListener('fetch', function (event) {
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
    };

    var inServiceWorker = self.ServiceWorkerGlobalScope && self instanceof ServiceWorkerGlobalScope;

    if (inServiceWorker) {
        swMain();
        return;
    }
    console.log('initializing sw client...');

    var swObj = self.sw = {
        onStateChanged: null,
        stateText: '',
        registered: null,
        notSupport: null
    };

    var newVersionState = null;

    var swNotSupported = true;
    
    if (!navigator.serviceWorker) {
        swObj.notSupport = "Your browser does not support service worker.";
    } else if (window.location.protocol != 'https:' && window.location.hostname != '127.0.0.1') {
        swObj.notSupport = "To enable service worker, you have to access this site over HTTPS protocol.";
    } else {
        swNotSupported = false;
    }

    var tryCall = function (x, args) { x && x.apply(this, args); };
    var stateChanged = function (text) {
        console.log('sw state changed: ' + text);
        swObj.stateText = text;
        tryCall(swObj.onStateChanged);
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
        swObj.registered = !!r;
        if (r) {
            console.log('registration: ', r);
            var sw = r.active || r.waiting || r.installing;
            console.log('sw: (cur, active, waiting, installing)', sw, r.active, r.waiting, r.installing);
            if (r.active && (r.waiting || r.installing)) newVersionState = (r.waiting || r.installing).state;
            updateState(sw);
            sw.addEventListener('statechange', function () {
                updateState(sw);
            });
        } else {
            stateChanged('no registration');
        }
    };
    var updateState = function (sw) {
        stateChanged(sw.state + (newVersionState ? ' (new version: ' + newVersionState + ')' : ''));
    }
    swObj.toggle = function (force) {
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
    swObj.check = function (autoEnable) {
        if (swNotSupported) {
            swObj.toggle();
            return;
        }
        return getAndCheck().then(function (r) {
            if (autoEnable && !r && localStorage.getItem('noServiceWorker') != 'true') {
                console.log('automatically enabling service worker...');
                swObj.toggle(true);
            }
            return !!r;
        });
    };

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
    };

    var renderBlog = function () {
        appendStyleLink('style.css');

        var header = document.createElement('div');
        header.className = 'header';
        var inner = document.createElement('div');
        inner.className = 'header-inner';
        header.appendChild(inner);
        var title = document.createElement('a');
        title.href = '../';
        inner.appendChild(title);
        var btnDark = document.createElement('div');
        btnDark.className = 'btn';
        btnDark.id = 'darkTheme';
        inner.appendChild(btnDark);
        document.body.insertBefore(header, document.body.firstChild);

        var SI = (function () {
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
            SettingItem.prototype.bindToBtn = function (btn) {
                if (this.type != SettingItem.types.bool) throw new Error('only for bool type');
                var span = document.createElement('span');
                btn.insertBefore(span, btn.firstChild);
                this.render(function (x) {
                    btn.classList.toggle('disabled', !x);
                    span.textContent = x ? "✅" : "❌";
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
                }
            };
            return SettingItem;
        })();
        
        var siDarkTheme = new SI('darkTheme', 'bool', false)
        .bindToBtn(btnDark)
        .render(function (val) {
            document.body.classList.toggle('dark', val);
        });

        console.info('blog theme rendered');
    }

    // render blog and check service worker.
    swObj.blog = function () {
        renderBlog();
        swObj.check(true);
    };
})();
