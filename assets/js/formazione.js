(function () {
  const ridotto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (ridotto || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  const riempi = document.querySelector('.lv__riempi');
  const stop = document.querySelectorAll('.lv__stop');
  if (riempi) {
    gsap.fromTo(riempi, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.lv__linea', start: 'top 85%', end: 'top 35%', scrub: 0.5,
      onUpdate: function (s) { stop.forEach(function (x, i) { x.classList.toggle('is-raggiunta', s.progress >= i / 3 - 0.01); }); } } });
  }
  const vert = document.querySelector('.lv__vert-riempi');
  if (vert) {
    gsap.fromTo(vert, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.lv__percorso', start: 'top 60%', end: 'bottom 60%', scrub: 0.5 } });
    document.querySelectorAll('.lv__fermata').forEach(function (f) {
      ScrollTrigger.create({ trigger: f, start: 'top 60%', onEnter: function () { f.classList.add('is-raggiunta'); }, onLeaveBack: function () { f.classList.remove('is-raggiunta'); } });
    });
  }
  gsap.utils.toArray('.lv__titolo, .tn__docente .notte__h2, .pd__passo').forEach(function (t) {
    gsap.from(t, { y: 48, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: t, start: 'top 88%', toggleActions: 'play none none reverse' } });
  });
  const foto = document.querySelector('.tn__docente .terra__foto');
  if (foto) gsap.fromTo(foto, { yPercent: 8 }, { yPercent: -8, ease: 'none', scrollTrigger: { trigger: '.tn__docente', start: 'top bottom', end: 'bottom top', scrub: true } });
  if (window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.lv__scheda:not(.lv__scheda--verticale)').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(c, { rotateY: x * 7, rotateX: -y * 7, duration: 0.4, ease: 'power2.out' });
        c.style.setProperty('--mx', ((x + 0.5) * 100) + '%'); c.style.setProperty('--my', ((y + 0.5) * 100) + '%');
      });
      c.addEventListener('pointerleave', function () { gsap.to(c, { rotateX: 0, rotateY: 0, duration: 0.6, ease: 'power3.out' }); });
    });
  }
})();

// Su schermi piccoli i nomi della mappa sono illeggibili: il riquadro li ripete al tocco.
(function () {
  const figura = document.querySelector('.tn__figura');
  const mappa = figura && figura.querySelector('.pm');
  if (!mappa) return;
  const riquadro = document.createElement('div');
  riquadro.className = 'pm__suggerimento';
  riquadro.setAttribute('role', 'status');
  riquadro.hidden = true;
  figura.appendChild(riquadro);
  const citta = Array.prototype.slice.call(mappa.querySelectorAll('.pm__citta'));
  function mostra(ev) {
    let migliore = null, dmin = 26;
    citta.forEach(function (c) {
      const r = c.getBoundingClientRect();
      const d = Math.hypot(r.left + r.width / 2 - ev.clientX, r.top + r.height / 2 - ev.clientY);
      if (d < dmin) { dmin = d; migliore = c; }
    });
    if (!migliore) { riquadro.hidden = true; return; }
    const t = migliore.querySelector('title');
    riquadro.textContent = t ? t.textContent : '';
    const rf = figura.getBoundingClientRect(), rc = migliore.getBoundingClientRect();
    riquadro.hidden = false;
    const x = rc.left + rc.width / 2 - rf.left - riquadro.offsetWidth / 2;
    riquadro.style.left = Math.max(4, Math.min(x, rf.width - riquadro.offsetWidth - 4)) + 'px';
    riquadro.style.top = Math.max(4, rc.top - rf.top - riquadro.offsetHeight - 8) + 'px';
  }
  mappa.addEventListener('pointerdown', mostra);
  mappa.addEventListener('pointermove', function (ev) { if (ev.pointerType === 'mouse') mostra(ev); });
  mappa.addEventListener('pointerleave', function (ev) { if (ev.pointerType === 'mouse') riquadro.hidden = true; });
})();
