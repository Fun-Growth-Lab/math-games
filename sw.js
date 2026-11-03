// Fun & Growth Lab — Service Worker
// ページとスクリプトは新しいものを優先し、電波がないときは前に遊んだ分を使う。
// 画像はすぐ出して、裏で新しいものに入れかえる。音楽は容量が大きいので入れない。

const CACHE_NAME = 'fgl-v2';
const MAX_ENTRIES = 600;

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
            .then(() => clients.claim())
    );
});

async function trim(cache) {
    const keys = await cache.keys();
    for (let i = 0; i < keys.length - MAX_ENTRIES; i++) await cache.delete(keys[i]);
}

async function store(req, res) {
    if (!res || !res.ok || res.type !== 'basic') return;
    const cache = await caches.open(CACHE_NAME);
    await cache.put(req, res);
    await trim(cache);
}

self.addEventListener('fetch', e => {
    const req = e.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);
    if (url.origin !== location.origin) return;
    if (/\.(mp3|mp4)$/i.test(url.pathname) || req.headers.has('range')) return;

    if (/\.(webp|png|jpe?g|jfif|gif|svg)$/i.test(url.pathname)) {
        e.respondWith(caches.match(req).then(hit => {
            const net = fetch(req).then(res => {
                const copy = res.clone();
                e.waitUntil(store(req, copy));
                return res;
            });
            if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
            return net;
        }));
        return;
    }
    e.respondWith(
        fetch(req).then(res => {
            const copy = res.clone();
            e.waitUntil(store(req, copy));
            return res;
        }).catch(() => caches.match(req))
    );
});
