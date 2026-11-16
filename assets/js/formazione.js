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
