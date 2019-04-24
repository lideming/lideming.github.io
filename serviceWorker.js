var prefeachs = [
    '/',
    '/toolbox/rng.html',
    '/toolbox/randomseat.html',
    '/toolbox/countdown.html',
    '/toolbox/countdown-ring.mp3'
];

var updateCache = () => {
    return caches.open('v1').then((cache) => {
        return Promise.all(prefeachs.map((url) =>
            fetch(url).then((r) => {
                if (r.ok) cache.put(url, r);
            })));
    })
};

self.addEventListener('install', (event) => {
    event.waitUntil(updateCache());
});

self.addEventListener('fetch', (event) => {
    event.respondWith(caches.match(event.request).then((response) => {
        if (response !== undefined) {
            // when it's cached, return the cached response and update cache.
            fetch(event.request).then((response) => {
                if (response.ok) {
                    caches.open('v1').then((cache) => {
                        cache.put(event.request, response);
                    });
                }
            });
            return response;
        } else {
            return fetch(event.request).then((response) => {
                if (response.ok) {
                    let responseClone = response.clone();
                    caches.open('v1').then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            });
        }
    }));
});
