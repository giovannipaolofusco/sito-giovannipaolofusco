(function () {
  const pulsante = document.querySelector('.condividi__btn');
  if (!pulsante) return;

  const esito = document.querySelector('.condividi__esito');
  const canonico = document.querySelector('link[rel="canonical"]');
  const indirizzo = canonico
    ? canonico.href
    : window.location.origin + window.location.pathname;
  const titolo = document.title;
  const inglese = (document.documentElement.lang || '').toLowerCase().startsWith('en');
  const testi = inglese
    ? { copiato: 'Link copied to the clipboard', copiaQui: 'Copy the link: ' }
    : { copiato: 'Link copiato negli appunti', copiaQui: 'Copia il link: ' };

  function annuncia(messaggio) {
    if (esito) esito.textContent = messaggio;
  }

  function mostraIndirizzo() {
    annuncia(testi.copiaQui + indirizzo);
  }

  function copiaLegacy() {
    const campo = document.createElement('textarea');
    campo.value = indirizzo;
    campo.setAttribute('readonly', '');
    campo.style.position = 'fixed';
    campo.style.top = '-1000px';
    document.body.appendChild(campo);
    campo.select();

    let riuscito = false;
    try {
      riuscito = document.execCommand('copy');
    } catch (errore) {
      riuscito = false;
    }

    document.body.removeChild(campo);
    return riuscito;
  }

  function copia() {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(indirizzo).then(function () {
        annuncia(testi.copiato);
      }, function () {
        if (copiaLegacy()) {
          annuncia(testi.copiato);
          return;
        }
        mostraIndirizzo();
      });
      return;
    }

    if (copiaLegacy()) {
      annuncia(testi.copiato);
      return;
    }

    mostraIndirizzo();
  }

  pulsante.addEventListener('click', function () {
    if (typeof navigator.share === 'function') {
      navigator
        .share({ title: titolo, url: indirizzo })
        .then(function () {
          annuncia('');
        })
        .catch(function (errore) {
          if (errore && errore.name === 'AbortError') return;
          copia();
        });
      return;
    }

    copia();
  });
})();
