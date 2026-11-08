(function () {
  var root = document.documentElement;
  var blocchi = document.querySelectorAll('[data-cv-reveal]');
  if (!blocchi.length) return;

  var pocoMoto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (pocoMoto || !('IntersectionObserver' in window)) return;

  // Reversibile come scroll-reveal.js (CLAUDE.md §10ter): cio' che e' gia'
  // sullo schermo all'apertura resta fermo, il resto compare e scompare.
  var altezza = window.innerHeight;
  for (var i = 0; i < blocchi.length; i++) {
    var r = blocchi[i].getBoundingClientRect();
    if (r.top < altezza && r.bottom > 0) blocchi[i].classList.add('is-in');
  }
  root.classList.add('js');

  var entrata = new IntersectionObserver(function (voci) {
    voci.forEach(function (voce) {
      if (voce.isIntersecting) voce.target.classList.add('is-in');
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  var uscita = new IntersectionObserver(function (voci) {
    voci.forEach(function (voce) {
      if (!voce.isIntersecting) voce.target.classList.remove('is-in');
    });
  }, { threshold: 0 });

  for (var j = 0; j < blocchi.length; j++) {
    entrata.observe(blocchi[j]);
    uscita.observe(blocchi[j]);
  }
})();
