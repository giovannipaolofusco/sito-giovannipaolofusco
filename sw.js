const CACHE_NAME = 'gpf-shell-v43';
const NETWORK_TIMEOUT_MS = 3500;

const SHELL_ASSETS = [
  '/',
  '/servizi/',
  '/formazione-ai/',
  '/progetti/',
  '/certificazioni/',
  '/cv/',
  '/contatti/', '/privacy/',
  '/404',
  '/en/',
  '/en/servizi/',
  '/en/formazione-ai/',
  '/en/progetti/',
  '/en/certificazioni/',
  '/en/cv/',
  '/en/contatti/', '/en/privacy/',
  '/en/404',
  '/assets/css/style.css',
  '/assets/css/cookieconsent.css',
  '/assets/css/raggi.css',
  '/assets/js/raggi.js',
  '/assets/css/servizi.css',
  '/assets/css/formazione.css',
  '/assets/js/formazione.js',
  '/assets/js/formazione-3d.js',
  '/assets/js/script.js',
  '/assets/js/cookieconsent-config.js',
  '/site.webmanifest',
  '/assets/img/logo-nav-ritratto.jpg',
  '/assets/img/foto-ritratto.jpg',
  '/assets/img/foto-ritratto.webp',
  '/assets/js/tema.js',
  '/assets/js/webgl-support.js',
  '/assets/js/condividi.js',
  '/assets/libs/cookieconsent/cookieconsent-3.3.0.umd.js',
  '/assets/fonts/ibm-plex-mono-latin-regular.woff2',
  '/assets/fonts/ibm-plex-mono-latin-500.woff2',
  '/assets/favicon/favicon.ico',
  '/assets/favicon/icon.svg',
  '/assets/favicon/favicon-16x16.png',
  '/assets/favicon/favicon-32x32.png',
  '/assets/favicon/apple-touch-icon.png',
  '/assets/favicon/android-chrome-192x192.png',
  '/assets/favicon/android-chrome-512x512.png',
  '/assets/favicon/android-chrome-192x192-maskable.png',
  '/assets/favicon/android-chrome-512x512-maskable.png',
];

const EXCLUDED_PATHS = ['/link/', '/en/link/', '/link.html', '/en/link.html'];

function isDocument(request, url) {
  return (
    request.mode === 'navigate' ||
    url.pathname.endsWith('/') ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.json') ||
    url.pathname.endsWith('.vcf')
  );
}

// Le librerie hanno la versione nel nome: entrano in cache alla prima richiesta e non si riscaricano.
function isVersionedLib(url) {
  return url.pathname.startsWith('/assets/libs/');
}

function isPdf(url) {
  return url.pathname.endsWith('.pdf');
}

// CSS, JS, manifest e sprite SVG senza hash nel nome: si chiedono prima alla
// rete, come l'HTML. Serviti prima dalla cache, dopo un deploy arrivavano HTML
// nuovo e stili o icone vecchi alla prima vista.
function isRevalidatable(url) {
  return (
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.webmanifest') ||
    url.pathname.endsWith('.svg')
  );
}

function fetchAndCache(request) {
  return fetch(request).then((response) => {
    if (response.ok) {
      const clone = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
    }
    return response;
  });
}

function networkFirst(event) {
  const rete = fetchAndCache(event.request);
  event.waitUntil(rete.catch(() => {}));
  const riserva = new Promise((resolve) => {
    setTimeout(() => {
      caches.match(event.request).then((cached) => {
        if (cached) resolve(cached);
      });
    }, NETWORK_TIMEOUT_MS);
  });
  return Promise.race([rete.catch(() => caches.match(event.request)), riserva]);
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (EXCLUDED_PATHS.includes(url.pathname)) return;
  if (/\.(mp4|webm)$/.test(url.pathname)) return;

  if (!isVersionedLib(url) && (isDocument(event.request, url) || isPdf(url) || isRevalidatable(url))) {
    event.respondWith(networkFirst(event));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetchAndCache(event.request))
  );
});
