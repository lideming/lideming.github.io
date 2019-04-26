(function () {
    var swMain = function () {
        var prefeachs = [
            '/',
            '/toolbox/rng.html',
            '/toolbox/randomseat.html',
            '/toolbox/countdown.html',
            '/toolbox/countdown-ring.mp3'
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
                            let responseClone = response.clone();
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
    
    if (!navigator.serviceWorker) {
        swObj.notSupport = "Your browser does not support service worker.";
        return;
    }
    if (window.location.protocol != 'https:' && window.location.hostname != '127.0.0.1') {
        swObj.notSupport = "To enable service worker, you have to access this site over HTTPS protocol.";
        return;
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
        if (force === undefined) force = !registration;
        if (force) {
            localStorage.removeItem('noServiceWorker');
            stateChanged('register...');
            navigator.serviceWorker.register(swUrl).then(function (r) {
                checkReg(r);
            }).catch(function (err) {
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
        return getAndCheck().then(function (r) {
            if (autoEnable && !r && localStorage.getItem('noServiceWorker') != 'true') {
                console.log('automatically enabling service worker...');
                swObj.toggle(true);
            }
            return !!r;
        });
    };
})();
