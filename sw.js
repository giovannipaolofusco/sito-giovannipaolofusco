const CACHE_NAME = 'gpf-shell-v33';
const NETWORK_TIMEOUT_MS = 3500;

const SHELL_ASSETS = [
  '/',
  '/servizi/',
  '/progetti/',
  '/certificazioni/',
  '/cv/',
  '/contatti/', '/privacy/',
  '/404',
  '/en/',
  '/en/servizi/',
  '/en/progetti/',
  '/en/certificazioni/',
  '/en/cv/',
  '/en/contatti/', '/en/privacy/',
  '/en/404',
  '/assets/css/style.css',
  '/assets/css/cookieconsent.css',
  '/assets/css/cv.css',
  '/assets/css/servizi.css',
  '/assets/js/script.js',
  '/assets/js/cookieconsent-config.js',
  '/site.webmanifest',
  '/assets/img/logo-nav.jpg',
  '/assets/img/foto-chi-sono.jpg',
  '/assets/img/foto-chi-sono.webp',
  '/assets/js/motion.js',
  '/assets/js/tema.js',
  '/assets/js/intro-anim.js',
  '/assets/js/home-init.js',
  '/assets/js/scroll-story.js',
  '/assets/js/cv.js',
  '/assets/js/servizi.js',
  '/assets/js/webgl-support.js',
  '/assets/js/hero-scene.js',
  '/assets/js/photo-particles.js',
  '/assets/js/condividi.js',
  '/assets/js/badge-fascia.js',
  '/assets/libs/three/three.module-r185.min.js',
  '/assets/libs/three/three.core-r185.min.js',
  '/assets/libs/cookieconsent/cookieconsent-3.1.0.umd.js',
  '/assets/libs/gsap/gsap-3.15.0.min.js',
  '/assets/libs/gsap/ScrollTrigger-3.15.0.min.js',
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
    const clone = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
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

  if (isDocument(event.request, url) || isPdf(url) || isRevalidatable(url)) {
    event.respondWith(networkFirst(event));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetchAndCache(event.request))
  );
});
