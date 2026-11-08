(function () {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;
  if (typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') return;

  const gsap = window.gsap;
  gsap.registerPlugin(window.ScrollTrigger);

  function applyCardReveal(card, index) {
    gsap.fromTo(
      card,
      { opacity: 0, y: 44, scale: 0.96 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.7,
        delay: (index % 3) * 0.06,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 88%',
          end: 'bottom 12%',
          toggleActions: 'play none none none',
          onToggle: (self) => card.classList.toggle('is-scanner-active', self.isActive),
        },
      }
    );
  }

  const cards = gsap.utils.toArray('.reveal-card');
  cards.forEach((card, index) => applyCardReveal(card, index));

  const mm = gsap.matchMedia();
  mm.add('(min-width: 768px)', () => {
    const titleEl = document.querySelector('.story-pin-wrap__title');
    const introEl = document.querySelector('.story-pin-wrap__intro');
    if (!titleEl) return () => {};

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.story-pin-wrap',
        start: 'top 96px',
        end: '+=45%',
        scrub: 1,
        pin: true,
        pinSpacing: false,
      },
    });
    tl.to(titleEl, { scale: 0.72, transformOrigin: 'left top', ease: 'none' });
    if (introEl) tl.to(introEl, { opacity: 0.3, ease: 'none' }, '<');

    return () => {
      tl.scrollTrigger && tl.scrollTrigger.kill();
      tl.kill();
    };
  });
})();
