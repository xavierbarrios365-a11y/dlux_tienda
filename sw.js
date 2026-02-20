const CACHE_NAME = 'dlux-v1.2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './logo.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }));
    })
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // Bypass cache for Google Apps Script API calls
  if (url.href.includes('exec')) {
    return e.respondWith(fetch(e.request));
  }
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
