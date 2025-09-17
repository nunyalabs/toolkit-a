// Robust Service Worker for offline-first PWA
const VERSION = 'v1.0.0';
const PRECACHE = `toolkit-precache-${VERSION}`;
const RUNTIME = `toolkit-runtime-${VERSION}`;

const PRECACHE_URLS = [
  'index.html',
  'style.css',
  'app.js', // legacy entry in case of older references
  'js/main.js',
  'js/storage.js',
  'js/participants.js',
  'js/idi.js',
  'js/fgd.js',
  'js/audio.js',
  'js/dashboard.js',
  'js/pwa.js',
  'manifest.json',
  'icons/icon.svg',
  // CDN assets (opaque responses are fine for precache)
  'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/css/bootstrap.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/js/bootstrap.bundle.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.11.1/font/bootstrap-icons.min.css'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(PRECACHE).then(cache => cache.addAll(PRECACHE_URLS)).then(self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => ![PRECACHE, RUNTIME].includes(k)).map(k => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

// Stale-while-revalidate for same-origin and CDN static assets
function isCDN(url) {
  return /cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com/.test(url);
}

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle GET
  if (req.method !== 'GET') return;

  // App-shell style navigation requests fallback to index.html
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('index.html'))
    );
    return;
  }

  // Static assets: use SWR
  if (url.origin === location.origin || isCDN(url.href)) {
    event.respondWith(
      caches.open(RUNTIME).then(async cache => {
        const cached = await cache.match(req);
        const networkPromise = fetch(req).then(res => {
          if (res && res.status === 200 && res.type === 'basic') cache.put(req, res.clone());
          return res;
        }).catch(() => cached);
        return cached || networkPromise;
      })
    );
    return;
  }
});

