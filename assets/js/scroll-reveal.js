// Comparsa allo scroll reversibile (CLAUDE.md §10ter): l'elemento compare
// entrando, torna nascosto quando esce del tutto dallo schermo e ricompare
// al passaggio successivo. Cio' che e' gia' visibile all'apertura non si anima.
export function initScrollReveal(options = {}) {
  const root = options.root || document.documentElement;
  const items = [...(options.items || document.querySelectorAll('[data-motion]'))];

  if (!items.length) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) return;

  const altezza = window.innerHeight;
  items.forEach((item) => {
    const r = item.getBoundingClientRect();
    if (r.top < altezza && r.bottom > 0) item.classList.add('is-in');
  });
  root.classList.add('js');

  // Soglie diverse per entrare e per uscire: con una sola, al bordo sfarfalla.
  const entrata = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('is-in');
    });
  }, { threshold: 0.01, rootMargin: '0px 0px -18% 0px' });

  const uscita = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) entry.target.classList.remove('is-in');
    });
  }, { threshold: 0 });

  items.forEach((item) => {
    entrata.observe(item);
    uscita.observe(item);
  });
}

initScrollReveal();
