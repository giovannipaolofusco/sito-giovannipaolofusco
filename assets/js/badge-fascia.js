(function () {
  const fascia = document.querySelector('.badge-fascia');
  if (!fascia) return;

  const pista = fascia.querySelector('.badge-fascia__pista');
  if (!pista || !pista.querySelector('.card-credly')) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const VELOCITA = 45; // px al secondo
  let ultimoFrame;
  let inPausa = false;
  let timeoutRipresa;
  let scrollAccumulato = 0;
  let frameId = null;
  let inViewport = true;

  // Rimozione del pulsante pausa, se ancora presente nel markup statico
  const pulsante = fascia.querySelector('.badge-fascia__pausa');
  if (pulsante) pulsante.remove();

  // Forziamo lo stato in "--esplora" per disabilitare l'animazione CSS
  // e abilitare l'overflow nativo
  fascia.classList.add('badge-fascia--esplora');

  // Fallback contro un foglio di stile vecchio in cache: senza flex i badge
  // tornano a impilarsi. Il layout normale resta nel CSS; qui fissiamo solo
  // il minimo necessario per non degradare la navigazione durante il refresh.
  pista.style.display = 'flex';

  function annullaFrame() {
    if (frameId === null) return;
    cancelAnimationFrame(frameId);
    frameId = null;
  }

  function avvia() {
    if (inPausa || !inViewport || frameId !== null) return;
    frameId = requestAnimationFrame(scorri);
  }

  function scorri(timestamp) {
    frameId = null;
    if (inPausa || !inViewport) return;

    if (!ultimoFrame) ultimoFrame = timestamp;
    const delta = timestamp - ultimoFrame;
    ultimoFrame = timestamp;

    scrollAccumulato += (VELOCITA * delta) / 1000;
    if (scrollAccumulato >= 1) {
      const px = Math.floor(scrollAccumulato);
      fascia.scrollLeft += px;
      scrollAccumulato -= px;
    }

    const limite = pista.scrollWidth / 2;
    // Per evitare scatti, quando superiamo la meta' torniamo indietro in modo trasparente
    if (fascia.scrollLeft >= limite && limite > 0) {
      fascia.scrollLeft -= limite;
    }

    avvia();
  }

  function ferma() {
    inPausa = true;
    clearTimeout(timeoutRipresa);
    annullaFrame();
  }

  function riprendi() {
    clearTimeout(timeoutRipresa);
    timeoutRipresa = setTimeout(() => {
      // Se c'e' un elemento dentro con focus visibile, non riprendiamo
      if (fascia.querySelector(':focus-visible')) return;
      inPausa = false;
      ultimoFrame = undefined;
      avvia();
    }, 2000);
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        inViewport = entry.isIntersecting;
        if (!inViewport) {
          annullaFrame();
          fascia.dataset.badgePaused = 'offscreen';
          return;
        }
        delete fascia.dataset.badgePaused;
        ultimoFrame = undefined;
        avvia();
      });
    }, { threshold: 0.01 });
    observer.observe(fascia);
  }

  fascia.addEventListener('pointerdown', ferma, { passive: true });
  fascia.addEventListener('touchstart', ferma, { passive: true });
  
  fascia.addEventListener('pointerup', riprendi, { passive: true });
  fascia.addEventListener('pointerleave', riprendi, { passive: true });
  fascia.addEventListener('touchend', riprendi, { passive: true });
  
  // Qualsiasi scroll (es. touch drag nativo o rotellina) estende la pausa
  fascia.addEventListener('scroll', () => {
    if (inPausa) riprendi();
  }, { passive: true });

  fascia.addEventListener('focusin', function (evento) {
    const bersaglio = evento.target;
    if (!bersaglio.matches || !bersaglio.matches(':focus-visible')) return;
    ferma();
  });

  fascia.addEventListener('focusout', function (evento) {
    if (fascia.contains(evento.relatedTarget)) return;
    riprendi();
  });

  // Avvio
  avvia();
})();
