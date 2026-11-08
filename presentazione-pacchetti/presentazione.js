(function () {
  // Prezzo di lancio: vale per i contratti firmati entro il 31/12/2026 (Allegato
  // Tecnico, sezione 7). Il markup porta il listino; fino alla scadenza qui si
  // aggiunge il prezzo di lancio. Dopo, o se lo script non parte, resta il listino.
  var SCADENZA_LANCIO = new Date('2026-12-31T23:59:59+01:00').getTime();
  if (Date.now() <= SCADENZA_LANCIO) {
    document.documentElement.classList.add('lancio-attivo');
    document.querySelectorAll('[data-lancio]').forEach(function (el) {
      var listino = el.textContent.trim();
      el.textContent = '';
      var lancio = document.createElement('span');
      lancio.className = 'prezzo-lancio';
      lancio.textContent = el.getAttribute('data-lancio');
      var vecchio = document.createElement('s');
      vecchio.className = 'prezzo-listino';
      vecchio.textContent = listino;
      el.append(lancio, ' ', vecchio);
    });
  }

  var stage = document.getElementById('deckStage');
  if (!stage) return;

  var slides = Array.from(stage.querySelectorAll('.slide'));
  var sequenza = slides.filter(function (s) { return !s.classList.contains('slide--nascosta'); });
  var nascoste = slides.filter(function (s) { return s.classList.contains('slide--nascosta'); });
  var current = Math.max(0, slides.findIndex(function (s) { return s.classList.contains('active'); }));
  var ritorno = null;
  var animating = false;


  function scaleStage() {
    var factor = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    var x = (window.innerWidth - 1920 * factor) / 2;
    var y = (window.innerHeight - 1080 * factor) / 2;
    stage.style.transform = 'translate(' + x + 'px, ' + y + 'px) scale(' + factor + ')';
  }
  scaleStage();
  window.addEventListener('resize', scaleStage);
  window.addEventListener('orientationchange', scaleStage);

  var progressFill = document.getElementById('progressFill');
  var counter = document.getElementById('counter');
  var btnPrev = document.getElementById('btnPrev');
  var btnNext = document.getElementById('btnNext');
  var btnExtra = document.getElementById('btnExtra');

  // Posizione nella sequenza: una slide nascosta conta come quella da cui si e' partiti.
  function posizione() {
    var s = slides[current];
    var i = sequenza.indexOf(s);
    if (i >= 0) return i;
    return ritorno !== null ? sequenza.indexOf(slides[ritorno]) : 0;
  }

  function updateChrome() {
    var i = posizione();
    var nascosta = slides[current].classList.contains('slide--nascosta');
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

    var outgoing = slides[current];
    var incoming = slides[index];

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
    var i = sequenza.indexOf(slides[current]);
    if (i < sequenza.length - 1) goTo(slides.indexOf(sequenza[i + 1]), 'next');
  }
  function prev() {
    if (slides[current].classList.contains('slide--nascosta')) return chiudiExtra();
    var i = sequenza.indexOf(slides[current]);
    if (i > 0) goTo(slides.indexOf(sequenza[i - 1]), 'prev');
  }

  function apriExtra() {
    if (!nascoste.length || slides[current].classList.contains('slide--nascosta')) return;
    ritorno = current;
    goTo(slides.indexOf(nascoste[0]), 'next');
  }
  function chiudiExtra() {
    if (ritorno === null) return;
    var destinazione = ritorno;
    ritorno = null;
    goTo(destinazione, 'prev');
  }

  btnPrev.addEventListener('click', prev);
  btnNext.addEventListener('click', next);
  // Clic sui lati: a sinistra indietro, a destra avanti. Link e pulsanti restano
  // cliccabili, anche quelli dentro le slide.
  document.addEventListener('click', function (e) {
    if (e.target.closest('a, button, video')) return;
    var x = e.clientX / window.innerWidth;
    if (x < 0.4) prev(); else if (x > 0.6) next();
  });
  if (btnExtra) {
    btnExtra.addEventListener('click', function () {
      if (slides[current].classList.contains('slide--nascosta')) chiudiExtra(); else apriExtra();
    });
  }

  var btnFullscreen = document.getElementById('btnFullscreen');
  var ICON_ENTER = '<path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3"/>';
  var ICON_EXIT = '<path d="M9 3v3a2 2 0 0 1-2 2H4M15 3v3a2 2 0 0 0 2 2h3M4 16h3a2 2 0 0 1 2 2v3M20 16h-3a2 2 0 0 0-2 2v3"/>';

  if (document.fullscreenEnabled || document.webkitFullscreenEnabled) {
    var updateFullscreenIcon = function () {
      var isFull = !!(document.fullscreenElement || document.webkitFullscreenElement);
      btnFullscreen.querySelector('svg').innerHTML = isFull ? ICON_EXIT : ICON_ENTER;
      btnFullscreen.setAttribute('aria-label', isFull ? 'Esci da schermo intero' : 'Schermo intero');
    };
    btnFullscreen.addEventListener('click', function () {
      var el = document.documentElement;
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        var richiesta = (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
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

  var touchStartX = 0, touchStartY = 0;
  window.addEventListener('touchstart', function (e) {
    touchStartX = e.changedTouches[0].clientX;
    touchStartY = e.changedTouches[0].clientY;
  }, { passive: true });
  window.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - touchStartX;
    var dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next(); else prev();
    }
  }, { passive: true });

  updateChrome();
})();
