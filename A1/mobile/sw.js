const CACHE_NAME = 'a1-mobile-v1';
const urlsToCache = [
  '/A1/mobile/',
  '/A1/mobile/index.html',
  '/A1/mobile/index-tr.html',
  '/A1/mobile/index-en.html',
  '/A1/mobile/css/mobile-main.css',
  '/A1/mobile/css/mobile-language-selection.css',
  '/A1/shared/config.js',
  '/A1/shared/js/modules/core/utils.js',
  '/A1/shared/assets/logo.png',
  '/A1/shared/assets/logo_2.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});