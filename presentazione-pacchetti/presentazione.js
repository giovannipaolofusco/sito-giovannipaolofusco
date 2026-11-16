(function () {
  // Il markup porta il listino: fino alla scadenza si aggiunge il prezzo di lancio, dopo o senza JavaScript resta il listino.
  const SCADENZA_LANCIO = new Date('2026-12-31T23:59:59+01:00').getTime();
  if (Date.now() <= SCADENZA_LANCIO) {
    document.documentElement.classList.add('lancio-attivo');
    document.querySelectorAll('[data-lancio]').forEach(function (el) {
      const listino = el.textContent.trim();
      el.textContent = '';
      const lancio = document.createElement('span');
      lancio.className = 'prezzo-lancio';
      lancio.textContent = el.getAttribute('data-lancio');
      const vecchio = document.createElement('s');
      vecchio.className = 'prezzo-listino';
      vecchio.textContent = listino;
      el.append(lancio, ' ', vecchio);
    });
  }

  const stage = document.getElementById('deckStage');
  if (!stage) return;

  const slides = Array.from(stage.querySelectorAll('.slide'));
  const sequenza = slides.filter(function (s) { return !s.classList.contains('slide--nascosta'); });
  const nascoste = slides.filter(function (s) { return s.classList.contains('slide--nascosta'); });
  let current = Math.max(0, slides.findIndex(function (s) { return s.classList.contains('active'); }));
  let ritorno = null;
  let animating = false;

  function scaleStage() {
    const factor = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    const x = (window.innerWidth - 1920 * factor) / 2;
    const y = (window.innerHeight - 1080 * factor) / 2;
    stage.style.transform = 'translate(' + x + 'px, ' + y + 'px) scale(' + factor + ')';
  }
  scaleStage();
  window.addEventListener('resize', scaleStage);
  window.addEventListener('orientationchange', scaleStage);

  const progressFill = document.getElementById('progressFill');
  const counter = document.getElementById('counter');
  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  const btnExtra = document.getElementById('btnExtra');

  // Posizione nella sequenza: una slide nascosta conta come quella da cui si e' partiti.
  function posizione() {
    const s = slides[current];
    const i = sequenza.indexOf(s);
    if (i >= 0) return i;
    return ritorno !== null ? sequenza.indexOf(slides[ritorno]) : 0;
  }

  function updateChrome() {
    const i = posizione();
    const nascosta = slides[current].classList.contains('slide--nascosta');
    progressFill.style.width = ((i + 1) / sequenza.length * 100) + '%';
    counter.textContent = nascosta ? 'Extra' : (i + 1) + ' / ' + sequenza.length;
    btnPrev.disabled = !nascosta && i === 0;
    btnNext.disabled = !nascosta && i === sequenza.length - 1;
    if (btnExtra) {
      btnExtra.setAttribute('aria-pressed', nascosta ? 'true' : 'false');
      btnExtra.textContent = nascosta ? 'Torna alla presentazione' : btnExtra.getAttribute('data-etichetta');
    }
  }

  function goTo(index, dir) {
    if (animating || index < 0 || index >= slides.length || index === current) return;
    animating = true;
    stage.setAttribute('data-dir', dir);

    const outgoing = slides[current];
    const incoming = slides[index];

    outgoing.classList.add('leaving');
    incoming.classList.add('entering');
    incoming.classList.add('active');

    void incoming.offsetWidth;
    incoming.classList.remove('entering');

    current = index;
    updateChrome();

    window.setTimeout(function () {
      outgoing.classList.remove('active', 'leaving');
      incoming.classList.remove('entering');
      animating = false;
    }, 340);
  }

  function next() {
    if (slides[current].classList.contains('slide--nascosta')) return chiudiExtra();
    const i = sequenza.indexOf(slides[current]);
    if (i < sequenza.length - 1) goTo(slides.indexOf(sequenza[i + 1]), 'next');
  }
  function prev() {
    if (slides[current].classList.contains('slide--nascosta')) return chiudiExtra();
    const i = sequenza.indexOf(slides[current]);
    if (i > 0) goTo(slides.indexOf(sequenza[i - 1]), 'prev');
  }

  function apriExtra() {
    if (!nascoste.length || slides[current].classList.contains('slide--nascosta')) return;
    ritorno = current;
    goTo(slides.indexOf(nascoste[0]), 'next');
  }
  function chiudiExtra() {
    if (ritorno === null) return;
    const destinazione = ritorno;
    ritorno = null;
    goTo(destinazione, 'prev');
  }

  btnPrev.addEventListener('click', prev);
  btnNext.addEventListener('click', next);
  // Clic sui lati: a sinistra indietro, a destra avanti. Link e pulsanti restano
  // cliccabili, anche quelli dentro le slide.
  document.addEventListener('click', function (e) {
    if (e.target.closest('a, button, video')) return;
    const x = e.clientX / window.innerWidth;
    if (x < 0.4) prev(); else if (x > 0.6) next();
  });
  if (btnExtra) {
    btnExtra.addEventListener('click', function () {
      if (slides[current].classList.contains('slide--nascosta')) chiudiExtra(); else apriExtra();
    });
  }

  const btnFullscreen = document.getElementById('btnFullscreen');
  const ICON_ENTER = '<path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3"/>';
  const ICON_EXIT = '<path d="M9 3v3a2 2 0 0 1-2 2H4M15 3v3a2 2 0 0 0 2 2h3M4 16h3a2 2 0 0 1 2 2v3M20 16h-3a2 2 0 0 0-2 2v3"/>';

  if (document.fullscreenEnabled || document.webkitFullscreenEnabled) {
    const updateFullscreenIcon = function () {
      const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement);
      btnFullscreen.querySelector('svg').innerHTML = isFull ? ICON_EXIT : ICON_ENTER;
      btnFullscreen.setAttribute('aria-label', isFull ? 'Esci da schermo intero' : 'Schermo intero');
    };
    btnFullscreen.addEventListener('click', function () {
      const el = document.documentElement;
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        const richiesta = (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
        if (richiesta && richiesta.catch) richiesta.catch(function () {});
      } else {
        (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      }
    });
    document.addEventListener('fullscreenchange', updateFullscreenIcon);
    document.addEventListener('webkitfullscreenchange', updateFullscreenIcon);
  } else {
    btnFullscreen.style.display = 'none';
  }

  window.addEventListener('keydown', function (e) {
    if (e.target.closest && e.target.closest('video')) return;
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); }
    else if (e.key === 'Home') { e.preventDefault(); ritorno = null; goTo(slides.indexOf(sequenza[0]), 'prev'); }
    else if (e.key === 'End') { e.preventDefault(); ritorno = null; goTo(slides.indexOf(sequenza[sequenza.length - 1]), 'next'); }
    else if ((e.key === 'p' || e.key === 'P') && nascoste.length) {
      e.preventDefault();
      if (slides[current].classList.contains('slide--nascosta')) chiudiExtra(); else apriExtra();
    }
    else if (e.key === 'Escape' && slides[current].classList.contains('slide--nascosta')) { chiudiExtra(); }
  });

  let touchStartX = 0, touchStartY = 0;
  window.addEventListener('touchstart', function (e) {
    touchStartX = e.changedTouches[0].clientX;
    touchStartY = e.changedTouches[0].clientY;
  }, { passive: true });
  window.addEventListener('touchend', function (e) {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next(); else prev();
    }
  }, { passive: true });

  updateChrome();
})();
