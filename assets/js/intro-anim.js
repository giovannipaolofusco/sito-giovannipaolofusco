(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (typeof gsap === 'undefined') return;

  try {
    if (sessionStorage.getItem('intro-vista') === '1') return;
    sessionStorage.setItem('intro-vista', '1');
  } catch (e) {}

  var aurora = document.querySelector('.intro-aurora');
  if (!aurora) return;

  var radice = document.documentElement;
  radice.classList.add('intro-attiva');

  gsap.timeline({
    onComplete: function () {
      radice.classList.remove('intro-attiva');
    }
  })
    .fromTo(aurora, { opacity: 0, scale: 0.65 }, { opacity: 1, scale: 1.12, duration: 0.45, ease: 'power2.out' }, 0)
    .to(aurora, { opacity: 0, duration: 0.5, ease: 'power2.in' }, 0.45);
})();
