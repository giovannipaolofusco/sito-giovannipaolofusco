import { canUseWebGL3D } from './webgl-support.js';

// La scena 3D parte a pagina caricata e con il browser libero: Three.js pesa
// piu' di 700 KB decompressi e non deve contendere il primo disegno al testo.
// Su telefono aspetta anche il primo gesto (tocco, tasto o scorrimento): con la
// sola attesa del load il tempo di blocco della home restava oltre i 200 ms.
const SOLO_DOPO_UN_GESTO = window.matchMedia('(max-width: 767px)').matches;

function quandoLibero(avvia) {
  const inCoda = () => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(avvia, { timeout: 2000 });
    } else {
      setTimeout(avvia, 300);
    }
  };
  const dopoIlLoad = () => {
    if (document.readyState === 'complete') {
      inCoda();
    } else {
      window.addEventListener('load', inCoda, { once: true });
    }
  };
  if (!SOLO_DOPO_UN_GESTO) {
    dopoIlLoad();
    return;
  }
  const eventi = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
  const alPrimoGesto = () => {
    eventi.forEach((nome) => window.removeEventListener(nome, alPrimoGesto));
    dopoIlLoad();
  };
  eventi.forEach((nome) => window.addEventListener(nome, alPrimoGesto, { once: true, passive: true }));
}

const heroContainer = document.querySelector('.hero__3d');
if (heroContainer && canUseWebGL3D()) {
  const heroObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      heroObserver.disconnect();
      quandoLibero(() => {
        import('./hero-scene.js').then((module) => module.initHeroScene(heroContainer));
      });
    }
  }, { rootMargin: '200px' });
  heroObserver.observe(heroContainer);
}

const photoWrap = document.querySelector('.about__photo-wrap');
const photoImg = photoWrap ? photoWrap.querySelector('.about__photo') : null;
const photoCanvasHost = photoWrap ? photoWrap.querySelector('.about__particles') : null;

if (photoWrap && photoImg && photoCanvasHost && canUseWebGL3D()) {
  const photoObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      photoObserver.disconnect();
      // Anche il particellare usa Three.js: su telefono la sezione e' gia' vicina
      // all'apertura, quindi senza attesa conterebbe il primo disegno alla hero.
      const start = () => {
        quandoLibero(() => {
          import('./photo-particles.js').then((module) => module.initPhotoParticles(photoCanvasHost, photoImg));
        });
      };
      if (photoImg.complete) {
        start();
      } else {
        photoImg.addEventListener('load', start, { once: true });
      }
    }
  }, { rootMargin: '150px' });
  photoObserver.observe(photoWrap);
}
