(function () {
  'use strict';

  var NUMERO_WHATSAPP = '393334919401';
  var EMAIL = 'info@giovannipaolofusco.it';
  var nodoCta = document.querySelector('[data-cta-testo]');
  var OGGETTO = (nodoCta && nodoCta.getAttribute('data-cta-oggetto')) || 'Progetto sito web';
  var MESSAGGIO_BASE = (nodoCta && nodoCta.getAttribute('data-cta-testo')) || 'Ciao Giovanni, ho visto la pagina Servizi sul tuo sito. Vorrei parlarti di un progetto.';

  var ridotto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var haGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  function avviaComposizioneHero() {
    var hero = document.querySelector('[data-hero-composizione]');
    var titolo = hero && hero.querySelector('[data-hero-titolo]');
    if (!hero || !titolo || ridotto || !haGsap) return;

    var testo = titolo.textContent.trim();
    var gruppi = testo.match(/\S+(?:\s+\S+)?/g) || [];
    if (!gruppi.length) return;

    titolo.setAttribute('aria-label', testo);
    titolo.textContent = '';
    gruppi.forEach(function (gruppo, indice) {
      var span = document.createElement('span');
      span.className = 'lista__hero-gruppo';
      span.setAttribute('aria-hidden', 'true');
      span.textContent = gruppo;
      titolo.appendChild(span);
      if (indice < gruppi.length - 1) titolo.appendChild(document.createTextNode(' '));
    });

    var etichetta = hero.querySelector('.servizi__etichetta');
    var sottotitolo = hero.querySelector('.lista__hero-sotto');
    var azioni = hero.querySelector('.lista__hero-azioni');
    var pannello = hero.querySelector('.lista__hero-partenza');
    var meta = hero.querySelector('.lista__hero-meta');
    var aurora = document.querySelector('.lista__hero-aurora');
    var parole = titolo.querySelectorAll('.lista__hero-gruppo');

    hero.setAttribute('data-hero-composizione', 'in-corso');
    gsap.timeline({
      defaults: { ease: 'power3.out' },
      onComplete: function () {
        hero.setAttribute('data-hero-composizione', 'completata');
        gsap.set([etichetta, sottotitolo, azioni, pannello, meta, aurora].filter(Boolean), {
          clearProps: 'opacity,visibility,transform'
        });
        gsap.set(parole, { clearProps: 'opacity,visibility,transform,clipPath' });
      }
    })
      .fromTo(aurora, { autoAlpha: 0.18, scale: 0.96 }, { autoAlpha: 0.55, scale: 1, duration: 0.42 }, 0)
      .fromTo(etichetta, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.25 }, 0.06)
      .fromTo(parole, { autoAlpha: 0, y: 18, clipPath: 'inset(0 0 100% 0)' }, { autoAlpha: 1, y: 0, clipPath: 'inset(0 0 0% 0)', duration: 0.38, stagger: 0.07 }, 0.12)
      .fromTo(sottotitolo, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.28 }, 0.43)
      .fromTo(azioni, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.26 }, 0.51)
      .fromTo(pannello, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.28 }, 0.58)
      .fromTo(meta, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.24 }, 0.65);
  }

  function componiCollegamenti(messaggio) {
    var testo = messaggio || MESSAGGIO_BASE;
    return {
      whatsapp: 'https://wa.me/' + NUMERO_WHATSAPP + '?text=' + encodeURIComponent(testo),
      email: 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(OGGETTO) + '&body=' + encodeURIComponent(testo)
    };
  }

  function aggiornaCta(messaggio) {
    var link = componiCollegamenti(messaggio);
    document.querySelectorAll('[data-cta="whatsapp"]').forEach(function (a) { a.href = link.whatsapp; });
    document.querySelectorAll('[data-cta="email"]').forEach(function (a) { a.href = link.email; });
  }

  aggiornaCta(MESSAGGIO_BASE);
  avviaComposizioneHero();

  var maniglia = document.querySelector('[data-cassetto-apri]');
  var pannelloCassetto = document.getElementById('cassetto-pannello');

  function apriCassetto(stato) {
    if (!maniglia || !pannelloCassetto) return;
    maniglia.setAttribute('aria-expanded', stato ? 'true' : 'false');
    pannelloCassetto.hidden = !stato;
  }

  if (maniglia && pannelloCassetto) {
    maniglia.addEventListener('click', function () {
      apriCassetto(maniglia.getAttribute('aria-expanded') !== 'true');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && maniglia.getAttribute('aria-expanded') === 'true') {
        apriCassetto(false);
        maniglia.focus();
      }
    });
    pannelloCassetto.addEventListener('focusout', function (e) {
      if (maniglia.getAttribute('aria-expanded') !== 'true') return;
      var dove = e.relatedTarget;
      if (dove && (pannelloCassetto.contains(dove) || dove === maniglia)) return;
      apriCassetto(false);
    });
  }

  function apriEsteso(id, voce) {
    var gruppo = document.getElementById(id);
    if (!gruppo || gruppo.tagName.toLowerCase() !== 'details') return false;
    gruppo.open = true;
    var titolo = voce ? document.getElementById(voce) : null;
    var bersaglio = titolo || gruppo;
    bersaglio.scrollIntoView({ block: 'start', behavior: ridotto ? 'auto' : 'smooth' });
    if (titolo) titolo.focus({ preventScroll: true });
    return true;
  }

  document.addEventListener('click', function (e) {
    var nodo = e.target;
    if (!nodo || !nodo.closest) return;
    var a = nodo.closest('a[href^="#esteso-"]');
    if (!a) return;
    if (apriEsteso(a.getAttribute('href').slice(1), a.getAttribute('data-voce'))) e.preventDefault();
  });

  // Su PC le voci di «Dentro il sito» aprono una finestra con la spiegazione.
  // Il testo e' quello delle voci per telefono: una fonte sola per i due casi.
  // Senza <dialog> resta il salto ai Raggi X scritto nell'href.
  var spiegazione = document.getElementById('spiegazione');
  var vociTelefono = Array.prototype.slice.call(document.querySelectorAll('.lista__indice--scorre .filtro__elemento'));
  var origineSpiegazione = null;
  if (spiegazione && typeof spiegazione.showModal === 'function' && vociTelefono.length) {
    var spiegazioneTitolo = document.getElementById('spiegazione-titolo');
    var spiegazioneCorta = document.getElementById('spiegazione-corta');
    var spiegazioneTesto = document.getElementById('spiegazione-testo');
    Array.prototype.slice.call(document.querySelectorAll('.lista__palco .lista__indice-riga')).forEach(function (riga) {
      var voce = vociTelefono[Number(riga.getAttribute('data-riga'))];
      var contenuto = voce && voce.querySelector('.filtro__contenuto');
      if (!contenuto) return;
      riga.setAttribute('aria-haspopup', 'dialog');
      riga.addEventListener('click', function (e) {
        e.preventDefault();
        spiegazioneTitolo.textContent = riga.querySelector('.lista__indice-testo').textContent;
        spiegazioneCorta.textContent = riga.querySelector('.lista__indice-corta').textContent;
        spiegazioneTesto.textContent = contenuto.textContent.trim();
        origineSpiegazione = riga;
        spiegazione.showModal();
      });
    });
    spiegazione.querySelector('.spiegazione__chiudi').addEventListener('click', function () {
      spiegazione.close();
    });
    // Clic sullo sfondo scuro, fuori dal riquadro: chiude come Esc.
    spiegazione.addEventListener('click', function (e) {
      if (e.target === spiegazione) spiegazione.close();
    });
    spiegazione.addEventListener('close', function () {
      if (origineSpiegazione) origineSpiegazione.focus({ preventScroll: true });
    });
  }

  var raggiPalco = document.getElementById('raggi-palco');
  var raggiDivisore = document.getElementById('raggi-taglio');
  var raggiSwitch = document.getElementById('raggi-switch');
  var raggiBottoni = Array.prototype.slice.call(document.querySelectorAll('.raggi__lente-btn'));
  var raggiStrati = Array.prototype.slice.call(document.querySelectorAll('.raggi__lente'));
  var raggiTesti = Array.prototype.slice.call(document.querySelectorAll('.raggi__lente-testo'));
  var raggiScorre = { v: 52 };
  var raggiTimer = 0;

  function raggiScriviTaglio(valore) {
    if (!raggiPalco) return;
    raggiPalco.style.setProperty('--taglio', String(Math.round(valore * 100) / 100));
  }

  function raggiSegnala(valore) {
    if (!raggiSwitch) return;
    raggiSwitch.setAttribute('aria-checked', valore < 50 ? 'true' : 'false');
  }

  function raggiScansiona() {
    if (!raggiPalco || ridotto) return;
    if (!window.matchMedia('(max-width: 767px)').matches) return;
    raggiPalco.style.setProperty('--raggi-corsa', raggiPalco.offsetHeight + 'px');
    raggiPalco.classList.remove('raggi__palco--scansione');
    void raggiPalco.offsetWidth;
    raggiPalco.classList.add('raggi__palco--scansione');
    window.clearTimeout(raggiTimer);
    raggiTimer = window.setTimeout(function () {
      raggiPalco.classList.remove('raggi__palco--scansione');
    }, 700);
  }

  if (raggiDivisore && raggiPalco) {
    raggiDivisore.addEventListener('input', function () {
      var v = Number(raggiDivisore.value);
      raggiScorre.v = v;
      raggiScriviTaglio(v);
      raggiSegnala(v);
    });
    raggiDivisore.addEventListener('change', raggiScansiona);
  }

  // Trascinamento libero della linea. Il cursore nativo, steso su tutto il palco,
  // su iPhone si muoveva solo prendendo il suo pallino largo 3px: ora e' il palco
  // ad ascoltare dito e mouse. Al tocco serve un movimento orizzontale (quello
  // verticale resta scorrimento della pagina, vedi touch-action nel CSS); col mouse
  // il clic porta la linea li'. L'input resta per tastiera e lettori di schermo.
  if (raggiDivisore && raggiPalco && window.PointerEvent) {
    var raggiTrascina = false;
    // Al tocco la direzione si decide dopo qualche pixel: un dito che va in
    // verticale sta scorrendo la pagina e non deve spostare la linea.
    var raggiDito = null;
    var raggiDalPuntatore = function (e) {
      var r = raggiPalco.getBoundingClientRect();
      var v = Math.min(100, Math.max(0, (e.clientX - r.left) / r.width * 100));
      raggiScorre.v = v;
      raggiDivisore.value = String(Math.round(v));
      raggiScriviTaglio(v);
      raggiSegnala(v);
    };
    raggiPalco.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (e.pointerType === 'mouse') {
        raggiTrascina = true;
        if (window.gsap) window.gsap.killTweensOf(raggiScorre);
        raggiPalco.setPointerCapture(e.pointerId);
        raggiDalPuntatore(e);
        return;
      }
      raggiDito = { x: e.clientX, y: e.clientY, id: e.pointerId };
    });
    raggiPalco.addEventListener('pointermove', function (e) {
      if (raggiDito && !raggiTrascina) {
        var dx = Math.abs(e.clientX - raggiDito.x);
        var dy = Math.abs(e.clientY - raggiDito.y);
        if (dx < 8 && dy < 8) return;
        if (dy >= dx) { raggiDito = null; return; }
        raggiTrascina = true;
        if (window.gsap) window.gsap.killTweensOf(raggiScorre);
        raggiPalco.setPointerCapture(raggiDito.id);
      }
      if (raggiTrascina) raggiDalPuntatore(e);
    });
    raggiPalco.addEventListener('pointerup', function () {
      raggiDito = null;
      if (!raggiTrascina) return;
      raggiTrascina = false;
      raggiScansiona();
    });
    raggiPalco.addEventListener('pointercancel', function () {
      raggiDito = null;
      raggiTrascina = false;
    });
  }

  if (raggiSwitch && raggiDivisore) {
    raggiSwitch.addEventListener('click', function () {
      var acceso = raggiSwitch.getAttribute('aria-checked') === 'true';
      var obiettivo = acceso ? 100 : 0;
      raggiDivisore.value = String(obiettivo);
      raggiSegnala(obiettivo);
      raggiScansiona();
      if (window.gsap && !ridotto) {
        window.gsap.to(raggiScorre, {
          v: obiettivo,
          duration: 0.7,
          ease: 'power3.inOut',
          overwrite: true,
          onUpdate: function () { raggiScriviTaglio(raggiScorre.v); }
        });
      } else {
        raggiScorre.v = obiettivo;
        raggiScriviTaglio(obiettivo);
      }
    });
  }

  function raggiScegliLente(nome) {
    raggiBottoni.forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-vista') === nome ? 'true' : 'false');
    });
    raggiStrati.forEach(function (l) { l.hidden = l.getAttribute('data-lente') !== nome; });
    raggiTesti.forEach(function (t) { t.hidden = t.getAttribute('data-testo') !== nome; });
  }

  raggiBottoni.forEach(function (b) {
    b.addEventListener('click', function () { raggiScegliLente(b.getAttribute('data-vista')); });
  });

  if (!haGsap) return;
  gsap.registerPlugin(ScrollTrigger);

  function avviaMotionTecnologico() {
    if (ridotto) return;

    var main = document.querySelector('main.servizi');
    if (!main) return;
    var scene = Array.prototype.slice.call(main.querySelectorAll(':scope > .servizi__sezione'))
      .filter(function (sezione) { return !sezione.classList.contains('lista__hero'); });
    if (!scene.length) return;

    var desktop = window.matchMedia('(min-width: 960px)').matches;
    var rail = null;
    var contatore = null;
    var punti = null;

    if (desktop) {
      rail = document.createElement('aside');
      rail.className = 'lista__motion-rail';
      rail.setAttribute('aria-hidden', 'true');
      rail.innerHTML = '<span class="lista__motion-rail-contatore"></span><span class="lista__motion-rail-pista"></span><span class="lista__motion-rail-punti"></span>';
      contatore = rail.querySelector('.lista__motion-rail-contatore');
      punti = rail.querySelector('.lista__motion-rail-punti');
      main.appendChild(rail);
    }

    function attiva(indice) {
      scene.forEach(function (sezione, posizione) {
        sezione.classList.toggle('is-motion-active', posizione === indice);
      });
      if (!punti || !contatore) return;
      Array.prototype.forEach.call(punti.children, function (punto, posizione) {
        punto.classList.toggle('is-active', posizione === indice);
      });
      contatore.textContent = String(indice + 1).padStart(2, '0') + ' / ' + String(scene.length).padStart(2, '0');
    }

    function bersagliScena(sezione) {
      var etichetta = sezione.querySelector('.servizi__etichetta');
      var titolo = sezione.querySelector('h2.servizi__titolo');
      var testo = titolo && titolo.nextElementSibling;
      var haTesto = testo && (testo.classList.contains('servizi__sottotitolo') || testo.classList.contains('servizi__testo'));
      return [etichetta, titolo, haTesto ? testo : null].filter(Boolean);
    }

    scene.forEach(function (sezione, indice) {
      sezione.setAttribute('data-motion-scena', String(indice + 1));
      if (punti) {
        var punto = document.createElement('i');
        punto.className = 'lista__motion-rail-punto';
        punti.appendChild(punto);
      }

      var bersagli = bersagliScena(sezione);
      if (bersagli.length) {
        gsap.fromTo(bersagli, { autoAlpha: 0, y: 20 }, {
          autoAlpha: 1,
          y: 0,
          duration: 0.38,
          stagger: 0.07,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sezione,
            start: 'top 78%',
            end: 'bottom 22%',
            toggleActions: 'play reverse play reverse'
          }
        });
      }

      ScrollTrigger.create({
        trigger: sezione,
        start: 'top 55%',
        end: 'bottom 55%',
        onEnter: function () { attiva(indice); },
        onEnterBack: function () { attiva(indice); }
      });
    });
  }

  var NAV = 80;
  var PASSO = 1;

  function posizione(el, radice) {
    var x = 0;
    var y = 0;
    var n = el;
    while (n && n !== radice) {
      x += n.offsetLeft;
      y += n.offsetTop;
      n = n.offsetParent;
    }
    return { x: x, y: y, w: el.offsetWidth, h: el.offsetHeight, cx: x + el.offsetWidth / 2, cy: y + el.offsetHeight / 2 };
  }

  function curva(x1, y1, x2, y2, spinta) {
    var mx = (x1 + x2) / 2;
    var my = (y1 + y2) / 2 - Math.abs(y2 - y1) * 0.16 - spinta;
    return 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' Q' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' ' + x2.toFixed(1) + ' ' + y2.toFixed(1);
  }

  function disegnaFili(palco) {
    var quadro = palco.querySelector('.lista__centro');
    var svg = palco.querySelector('.lista__fili');
    var pila = palco.querySelector('.lista__nucleo-pila');
    if (!quadro || !svg || !pila) return;
    var w = quadro.clientWidth;
    var h = quadro.clientHeight;
    if (!w || !h) return;
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    var pn = posizione(pila, quadro);
    Array.prototype.forEach.call(svg.querySelectorAll('.lista__filo'), function (f, i) {
      var sat = palco.querySelector('.lista__satellite--' + i);
      if (!sat) return;
      var ps = posizione(sat, quadro);
      var dx = ps.cx - pn.cx;
      var dy = ps.cy - pn.cy;
      var rx = pn.w / 2 + 5;
      var ry = pn.h / 2 + 5;
      var q = Math.sqrt((dx / rx) * (dx / rx) + (dy / ry) * (dy / ry));
      var k = q > 0 ? 1 / q : 0;
      f.setAttribute('d', 'M' + (pn.cx + dx * k).toFixed(1) + ' ' + (pn.cy + dy * k).toFixed(1) +
        ' L' + ps.cx.toFixed(1) + ' ' + ps.cy.toFixed(1));
    });
  }

  function costruisciAtto(palco) {
    var scena = palco.querySelector('.lista__scena');
    var pila = palco.querySelector('.lista__nucleo-pila');
    var telaio = palco.querySelector('.lista__nucleo-telaio');
    var carte = gsap.utils.toArray(palco.querySelectorAll('.lista__carta'));
    var righe = gsap.utils.toArray(palco.querySelectorAll('.lista__indice-riga'));
    var tracce = gsap.utils.toArray(palco.querySelectorAll('.lista__traccia'));
    var svgTracce = palco.querySelector('.lista__tracce');
    var fili = gsap.utils.toArray(palco.querySelectorAll('.lista__filo'));
    var barra = palco.querySelector('.lista__avanzamento-barra i');
    var vuoto = palco.querySelector('[data-vuoto]');
    var direzione = palco.getAttribute('data-direzione');
    var n = carte.length;
    if (!n || !scena || !pila) return;

    var misure = [];
    var stati = [];
    var i;
    for (i = 0; i < n; i++) {
      stati.push(gsap.utils.toArray(palco.querySelectorAll('[data-battuta="' + i + '"]')));
    }

    function ricalcola() {
      var sw = scena.clientWidth;
      var sh = scena.clientHeight;
      if (!sw || !sh) return;
      if (svgTracce) svgTracce.setAttribute('viewBox', '0 0 ' + sw + ' ' + sh);
      var pn = posizione(pila, scena);
      misure = carte.map(function (c, k) {
        var pc = posizione(c, scena);
        var pr = posizione(righe[k], scena);
        var bx = pr.x + pr.w - 14;
        var by = pr.cy;
        return { dx: bx - pc.cx, dy: by - pc.cy, nx: pn.cx - pc.cx, ny: pn.cy - pc.cy };
      });
      tracce.forEach(function (t, k) {
        var pr = posizione(righe[k], scena);
        t.setAttribute('d', curva(pn.cx, pn.cy, pr.x + pr.w + 3, pr.cy, 22));
      });
      disegnaFili(palco);
    }

    ricalcola();

    var partenza = {
      alto: { x: 0, y: -Math.round(scena.clientHeight * 0.62) - 40, rotate: 0 },
      lato: { x: 320, y: -40, rotate: 0 },
      fuori: { x: 300, y: 230, rotate: 2.5 }
    }[direzione] || { x: 0, y: -300, rotate: 0 };

    var lunghezza = Math.round(n * 232 + 420);

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: palco,
        start: 'top ' + NAV + 'px',
        end: '+=' + lunghezza,
        pin: palco,
        pinSpacing: true,
        pinType: 'transform',
        anticipatePin: 1,
        scrub: 0.75,
        invalidateOnRefresh: true,
        onRefreshInit: ricalcola,
        onRefresh: ricalcola
      }
    });

    gsap.set(palco.querySelectorAll('[data-battuta]'), { autoAlpha: 0 });
    gsap.set(carte, { autoAlpha: 0 });
    gsap.set(tracce, { attr: { 'stroke-dashoffset': 1 } });
    if (fili.length) gsap.set(fili, { attr: { 'stroke-dashoffset': 1 } });
    if (barra) gsap.set(barra, { scaleX: 0 });
    righe.forEach(function (r) { r.classList.remove('is-accesa'); });

    if (vuoto) {
      gsap.set(vuoto, { autoAlpha: 1 });
      tl.to(vuoto, { autoAlpha: 0, duration: 0.35, ease: 'none' }, 0.15);
    }

    for (i = 0; i < n; i++) {
      (function (k) {
        var t0 = k * PASSO;
        var carta = carte[k];
        var els = stati[k];
        var effetto = els.length ? els[0].getAttribute('data-effetto') : null;
        var suNucleo = effetto === 'stretta' || effetto === 'icona' || effetto === 'parallasse';
        var tS = t0 + 0.82;

        tl.fromTo(carta,
          { autoAlpha: 0, scale: 1.14, x: partenza.x, y: partenza.y, rotate: partenza.rotate },
          { autoAlpha: 1, scale: 1, x: 0, y: 0, rotate: 0, duration: 0.55, ease: 'power3.out' }, t0);

        if (direzione !== 'fuori') {
          tl.to(carta, {
            x: function () { return misure[k] ? misure[k].nx * 0.34 : 0; },
            y: function () { return misure[k] ? misure[k].ny * 0.34 : 0; },
            scale: 0.95, duration: 0.28, ease: 'power2.in'
          }, t0 + 0.55);
          if (!suNucleo) {
            tl.to(pila, { scale: 1.045, duration: 0.1, ease: 'power2.out', yoyo: true, repeat: 1 }, t0 + 0.76);
          }
        } else {
          tl.to(carta, { scale: 0.97, duration: 0.28, ease: 'power2.inOut' }, t0 + 0.55);
        }

        var generico = effetto !== 'sfoglia' && effetto !== 'icona' && effetto !== 'anello';

        if (effetto === 'sfoglia') {
          tl.fromTo(els, { autoAlpha: 1, rotationY: 0, transformOrigin: 'left center' },
            { autoAlpha: 0, rotationY: -76, duration: 0.6, ease: 'power2.in' }, tS);
        } else if (generico && els.length) {
          tl.fromTo(els, { autoAlpha: 0, scale: 0.84 },
            { autoAlpha: 1, scale: 1, duration: 0.42, ease: 'power3.out', stagger: 0.05 }, tS);
        }

        if (effetto === 'stretta') {
          tl.to(pila, { scaleX: 0.6, duration: 0.3, ease: 'power2.inOut' }, tS);
          tl.to(pila, { scaleX: 1, duration: 0.42, ease: 'power3.out' }, tS + 0.34);
        } else if (effetto === 'barra') {
          var riempimento = els[0].querySelector('i');
          if (riempimento) tl.fromTo(riempimento, { scaleX: 1 }, { scaleX: 0.32, duration: 0.5, ease: 'power2.inOut' }, tS + 0.08);
        } else if (effetto === 'tacche') {
          tl.fromTo(els[0].children, { y: -12, scaleY: 0.4 }, { y: 0, scaleY: 1, duration: 0.45, ease: 'power3.out', stagger: 0.07 }, tS + 0.05);
        } else if (effetto === 'anello') {
          tl.fromTo(els[0], { autoAlpha: 0, scaleX: 0.78, scaleY: 0.22, y: -52 }, { autoAlpha: 1, scaleX: 1, scaleY: 1, y: 0, duration: 0.6, ease: 'power3.inOut' }, tS);
        } else if (effetto === 'ridisegna') {
          tl.fromTo(els[0].children, { scaleX: 0.28 }, { scaleX: 1, duration: 0.5, ease: 'power3.out', stagger: 0.08 }, tS + 0.06);
        } else if (effetto === 'icona' && telaio) {
          tl.fromTo(els[0], { autoAlpha: 0, scale: 0.2, rotate: -8 }, { autoAlpha: 1, scale: 1, rotate: 0, duration: 0.34, ease: 'back.out(2)' }, tS);
          tl.to(telaio, { scale: 0.74, duration: 0.34, ease: 'power2.inOut' }, tS);
          tl.to(els[0], { autoAlpha: 0, scale: 0.2, duration: 0.3, ease: 'power2.in' }, tS + 0.5);
          tl.to(telaio, { scale: 1, duration: 0.4, ease: 'power3.out' }, tS + 0.48);
        } else if (effetto === 'parallasse' && telaio) {
          tl.fromTo(els[0].children, { y: 16 }, { y: -16, duration: 0.7, ease: 'none' }, tS);
          tl.to(telaio, { rotationY: -11, duration: 0.35, ease: 'power2.inOut', yoyo: true, repeat: 1 }, tS);
        } else if (effetto === 'satellite') {
          if (fili[k]) tl.fromTo(fili[k], { attr: { 'stroke-dashoffset': 1 } }, { attr: { 'stroke-dashoffset': 0 }, duration: 0.45, ease: 'none' }, tS);
          tl.to(pila, { scale: 1.022, duration: 0.11, ease: 'power2.out', yoyo: true, repeat: 1 }, tS + 0.34);
        }

        tl.to(carta, {
          x: function () { return misure[k] ? misure[k].dx : 0; },
          y: function () { return misure[k] ? misure[k].dy : 0; },
          scale: 0.24, autoAlpha: 0, duration: 0.55, ease: 'power2.in'
        }, t0 + 0.94);

        if (tracce[k]) {
          tl.fromTo(tracce[k], { attr: { 'stroke-dashoffset': 1 } },
            { attr: { 'stroke-dashoffset': 0 }, duration: 0.5, ease: 'none' }, t0 + 1);
        }
      }(i));
    }

    tl.to({}, { duration: 0.45 }, n * PASSO + 1.05);

    tl.eventCallback('onUpdate', function () {
      var t = tl.time();
      var accese = 0;
      while (accese < n && t >= accese * PASSO + 1.08) accese++;
      for (var j = 0; j < n; j++) {
        righe[j].classList.toggle('is-accesa', j < accese);
      }
      if (barra) gsap.set(barra, { scaleX: accese / n });
    });
  }

  function costruisciFinale(palco) {
    var scena = palco.querySelector('.lista__scena--finale');
    var pila = palco.querySelector('.lista__nucleo-pila');
    var svg = palco.querySelector('.lista__tracce--finale');
    var righe = gsap.utils.toArray(palco.querySelectorAll('.lista__colonna-riga'));
    var centro = palco.querySelector('.lista__centro--finale');
    var fili = gsap.utils.toArray(palco.querySelectorAll('.lista__filo'));
    var satelliti = gsap.utils.toArray(palco.querySelectorAll('.lista__satellite'));
    if (!scena || !pila || !svg || !righe.length) return;

    function ricalcola() {
      var sw = scena.clientWidth;
      var sh = scena.clientHeight;
      if (!sw || !sh) return;
      svg.setAttribute('viewBox', '0 0 ' + sw + ' ' + sh);
      var pn = posizione(pila, scena);
      righe.forEach(function (r, k) {
        var p = posizione(r, scena);
        var traccia = svg.querySelector('[data-finale-traccia="' + r.getAttribute('data-finale') + '"]');
        if (!traccia) return;
        var versoDestra = p.cx > pn.cx;
        traccia.setAttribute('d', curva(pn.cx, pn.cy, versoDestra ? p.x + 6 : p.x + p.w - 6, p.cy, 14));
      });
      disegnaFili(palco);
    }

    ricalcola();

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: palco,
        start: 'top ' + NAV + 'px',
        end: '+=760',
        pin: palco,
        pinSpacing: true,
        pinType: 'transform',
        anticipatePin: 1,
        scrub: 0.8,
        invalidateOnRefresh: true,
        onRefreshInit: ricalcola,
        onRefresh: ricalcola
      }
    });

    gsap.set(righe, { autoAlpha: 0, x: -8 });
    gsap.set(svg.querySelectorAll('.lista__traccia'), { attr: { 'stroke-dashoffset': 1 } });
    gsap.set(fili, { attr: { 'stroke-dashoffset': 1 } });
    gsap.set(satelliti, { autoAlpha: 0, scale: 0.85 });

    tl.fromTo(scena, { scale: 1.06 }, { scale: 0.93, duration: 2.6, ease: 'none' }, 0);
    tl.fromTo(centro, { autoAlpha: 0.45, y: 22 }, { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power3.out' }, 0);
    tl.to(satelliti, { autoAlpha: 1, scale: 1, duration: 0.42, ease: 'power3.out', stagger: 0.04 }, 0.15);
    tl.to(fili, { attr: { 'stroke-dashoffset': 0 }, duration: 0.4, ease: 'none', stagger: 0.04 }, 0.2);
    tl.to(righe, { autoAlpha: 1, x: 0, duration: 0.35, ease: 'power2.out', stagger: 0.026 }, 0.3);
    tl.to(svg.querySelectorAll('.lista__traccia'), { attr: { 'stroke-dashoffset': 0 }, duration: 0.5, ease: 'none', stagger: 0.026 }, 0.4);
  }

  function costruisciInvito() {
    var cornice = document.getElementById('invito-cornice');
    if (!cornice) return;
    gsap.fromTo(cornice,
      { scale: 0.46, opacity: 0.3 },
      {
        scale: 1,
        opacity: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: '#parliamone',
          start: 'top bottom',
          end: 'top 38%',
          scrub: 0.8,
          invalidateOnRefresh: true
        }
      });
  }

  function attivaFino(centro, indice) {
    var elementi = centro.querySelectorAll('[data-battuta]');
    Array.prototype.forEach.call(elementi, function (el) {
      var k = parseInt(el.getAttribute('data-battuta'), 10);
      el.classList.toggle('is-attivo', k <= indice);
    });
  }

  var mm = gsap.matchMedia();

  mm.add({
    desktop: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
    mobile: '(max-width: 767px) and (prefers-reduced-motion: no-preference)'
  }, function (contesto) {
    var palchi = gsap.utils.toArray('.lista__palco');

    if (contesto.conditions.desktop) {
      palchi.forEach(function (palco) {
        if (palco.getAttribute('data-palco') === 'finale') costruisciFinale(palco);
        else costruisciAtto(palco);
      });
      costruisciInvito();
      return;
    }

    palchi.forEach(function (palco) {
      var centro = palco.querySelector('.lista__centro');
      var sezione = palco.parentNode;
      if (!centro) return;
      centro.classList.add('lista__centro--pilotato');

      ScrollTrigger.create({
        trigger: palco,
        start: 'top bottom',
        end: 'bottom top',
        onRefresh: function () { disegnaFili(palco); }
      });

      var righe = gsap.utils.toArray(sezione.querySelectorAll('.lista__indice--scorre .lista__indice-riga'));
      if (!righe.length) return;

      righe.forEach(function (riga, k) {
        ScrollTrigger.create({
          trigger: riga,
          start: 'top 64%',
          end: 'bottom 36%',
          onToggle: function (self) {
            riga.classList.toggle('is-accesa', self.isActive);
            if (self.isActive) attivaFino(centro, k);
          },
          onEnterBack: function () { attivaFino(centro, k); }
        });
      });

      ScrollTrigger.create({
        trigger: righe[0],
        start: 'top bottom',
        end: 'top 64%',
        onLeaveBack: function () { attivaFino(centro, -1); }
      });
    });
  });

  if (!ridotto) {
    gsap.utils.toArray('.servizi__card--reveal').forEach(function (scheda, indice) {
      gsap.fromTo(scheda,
        { autoAlpha: 0, y: 24 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.42,
          delay: (indice % 2) * 0.04,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: scheda,
            start: 'top 86%',
            end: 'bottom 14%',
            toggleActions: 'play reverse play reverse',
            onToggle: function (self) {
              scheda.classList.toggle('is-scanner-active', self.isActive);
            }
          }
        });
    });
  }

  // Deve partire dopo i palchi con pin: questi estendono il documento e
  // determinano le coordinate reali delle scene successive.
  avviaMotionTecnologico();

  // Intersection Observer per l'indice (Cassetto)
  var linkCassetto = document.querySelectorAll('.lista__cassetto-link');
  if (linkCassetto.length > 0) {
    var sezioniDaOsservare = Array.from(linkCassetto).map(function(link) {
      var id = link.getAttribute('href');
      if (id && id.startsWith('#')) return document.getElementById(id.substring(1));
      return null;
    }).filter(Boolean);

    if (sezioniDaOsservare.length > 0 && 'IntersectionObserver' in window) {
      var opzioniObs = { root: null, rootMargin: '-20% 0px -60% 0px', threshold: 0 };
      var observerIndice = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            var idCorrente = '#' + entry.target.id;
            linkCassetto.forEach(function(link) {
              if (link.getAttribute('href') === idCorrente) {
                link.classList.add('attivo');
              } else {
                link.classList.remove('attivo');
              }
            });
          }
        });
      }, opzioniObs);

      sezioniDaOsservare.forEach(function(sezione) {
        observerIndice.observe(sezione);
      });
    }
  }

}());
