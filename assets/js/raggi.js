(function () {
  const vista = document.querySelector('.rx__vista');
  const cursore = document.querySelector('.rx__cursore');
  if (vista && cursore) {
    const ferma = function () { vista.style.animation = 'none'; };
    const aggiorna = function () { vista.style.setProperty('--pos', cursore.value + '%'); };
    cursore.addEventListener('input', function () { ferma(); aggiorna(); });
    aggiorna();
    const trascina = function (ev) {
      const r = vista.getBoundingClientRect();
      cursore.value = Math.round(Math.max(0, Math.min(100, ((ev.clientX - r.left) / r.width) * 100)));
      aggiorna();
    };
    vista.addEventListener('pointerdown', function (ev) {
      ferma();
      trascina(ev);
      const fine = function () { window.removeEventListener('pointermove', trascina); window.removeEventListener('pointerup', fine); };
      window.addEventListener('pointermove', trascina);
      window.addEventListener('pointerup', fine);
    });
  }

  // Senza JavaScript le voci restano tutte leggibili.
  const pannelli = document.querySelectorAll('.rx-dt__pannello');
  pannelli.forEach(function (p, i) { p.hidden = i !== 0; });
  const voci = document.querySelectorAll('.rx-dt__voce[data-i]');
  voci.forEach(function (b) {
    b.addEventListener('click', function () {
      voci.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      pannelli.forEach(function (p) { p.hidden = p.dataset.i !== b.dataset.i; });
    });
  });

  const tasti = document.querySelectorAll('.rx-se__tasto');
  document.querySelectorAll('.rx-se__elenco').forEach(function (l) { l.hidden = l.dataset.v !== 'si'; });
  tasti.forEach(function (b) {
    b.addEventListener('click', function () {
      tasti.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      document.querySelectorAll('.rx-se__elenco').forEach(function (l) { l.hidden = l.dataset.v !== b.dataset.v; });
    });
  });

  const filtri = document.querySelectorAll('.pg__filtro');
  filtri.forEach(function (b) {
    b.addEventListener('click', function () {
      filtri.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      document.querySelectorAll('.pg__carta').forEach(function (c) { c.hidden = b.dataset.f !== 'tutti' && c.dataset.cat !== b.dataset.f; });
    });
  });

  const copia = document.querySelector('.co-copia');
  const esito = document.querySelector('.co-esito');
  if (copia && esito) {
    copia.addEventListener('click', function () {
      const testo = copia.dataset.copia;
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(testo).then(function () { esito.textContent = copia.dataset.ok + ' ' + testo; }, function () { esito.textContent = copia.dataset.ko + ' ' + testo; });
      } else {
        esito.textContent = copia.dataset.ko + ' ' + testo;
      }
    });
  }
})();
