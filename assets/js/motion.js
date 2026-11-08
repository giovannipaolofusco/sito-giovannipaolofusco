(function () {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const hasFinePointer = window.matchMedia('(pointer: fine)').matches;

  if (prefersReducedMotion || isCoarsePointer || !hasFinePointer) {
    return;
  }

  const MAGNETIC_STRENGTH = 0.35;
  const MAGNETIC_MAX = 14;
  let activeMagnetic = null;

  document.addEventListener('mousemove', (event) => {
    const target = event.target.closest ? event.target.closest('.magnetic') : null;

    if (target !== activeMagnetic && activeMagnetic) {
      activeMagnetic.style.transform = 'translate3d(0, 0, 0)';
    }
    activeMagnetic = target;

    if (target) {
      const rect = target.getBoundingClientRect();
      const relX = event.clientX - (rect.left + rect.width / 2);
      const relY = event.clientY - (rect.top + rect.height / 2);
      const moveX = Math.max(-MAGNETIC_MAX, Math.min(MAGNETIC_MAX, relX * MAGNETIC_STRENGTH));
      const moveY = Math.max(-MAGNETIC_MAX, Math.min(MAGNETIC_MAX, relY * MAGNETIC_STRENGTH));
      target.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
    }
  });
})();
