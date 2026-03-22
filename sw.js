// Fun & Growth Lab — Service Worker (最小構成)
// PWAとしてインストール可能にするための最小限の実装

const CACHE_NAME = 'fgl-v1';

self.addEventListener('install', e => {
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(clients.claim());
});

// ネットワーク優先でフォールバックなし（シンプル＆常に最新コンテンツ）
self.addEventListener('fetch', e => {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
