(function () {
  var salvato = null;
  try {
    salvato = localStorage.getItem('theme');
  } catch (e) {}
  if (salvato === 'dark' || (!salvato && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
