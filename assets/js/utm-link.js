(function () {
  const CHIAVI = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'utm_term',
  ];

  const DEFAULT = {
    utm_source: 'instagram',
    utm_medium: 'bio',
    utm_campaign: 'link-bio',
  };

  const destinazione = document.querySelector('.link-bio__btn--primary');
  if (!destinazione) return;

  function ripulisci(valore) {
    return valore
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64);
  }

  const parametri = new URLSearchParams(window.location.search);
  const daUrl = {};

  CHIAVI.forEach(function (chiave) {
    if (!parametri.has(chiave)) return;
    const valore = ripulisci(parametri.get(chiave) || '');
    if (valore) daUrl[chiave] = valore;
  });

  const finali = daUrl.utm_source ? Object.assign({}, DEFAULT, daUrl) : DEFAULT;

  const url = new URL(destinazione.getAttribute('href'), window.location.href);

  if (url.origin !== window.location.origin) return;

  Object.keys(finali).forEach(function (chiave) {
    url.searchParams.set(chiave, finali[chiave]);
  });

  destinazione.setAttribute('href', url.pathname + url.search);
})();
