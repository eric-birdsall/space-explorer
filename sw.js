// Service worker: lets the game work offline once it has been opened online.
// It always tries the network first, so a fresh version shows up as soon as there is one,
// and falls back to the saved copy when there is no connection.
const CACHE = 'space-explorer-v1';
const FILES = [
  './',
  'index.html',
  'css/style.css',
  'js/sprites.js',
  'js/audio.js',
  'js/input.js',
  'js/levels.js',
  'js/rules.js',
  'js/game.js',
  'js/render.js',
  'js/main.js',
  'js/touch.js',
  'manifest.webmanifest',
  'icons/icon-180.png',
  'icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
