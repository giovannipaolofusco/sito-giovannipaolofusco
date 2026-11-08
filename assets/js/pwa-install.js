(function () {
  var VISITED_KEY = 'gpf-visited';
  var IOS_HINT_KEY = 'gpf-ios-hint';
  var IOS_HINT_GIORNI = 30;
  var hasVisitedBefore = sessionStorage.getItem(VISITED_KEY) === '1';
  sessionStorage.setItem(VISITED_KEY, '1');

  var isEn = document.documentElement.lang === 'en';

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () {});
    });
  }

  var deferredPrompt = null;
  var installBtn = null;

  function createInstallButton() {
    if (installBtn) return installBtn;
    installBtn = document.createElement('button');
    installBtn.type = 'button';
    installBtn.className = 'pwa-install-btn';
    installBtn.textContent = '⬇️ Installa app';
    installBtn.setAttribute('aria-label', 'Installa questo sito come app');
    installBtn.hidden = true;
    installBtn.addEventListener('click', function () {
      installBtn.hidden = true;
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(function () {
        deferredPrompt = null;
      });
    });
    document.body.appendChild(installBtn);
    return installBtn;
  }

  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    deferredPrompt = event;
    if (!hasVisitedBefore) return;
    createInstallButton().hidden = false;
  });

  window.addEventListener('appinstalled', function () {
    deferredPrompt = null;
    if (installBtn) installBtn.hidden = true;
  });

  function isIos() {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
  }

  function isInstalled() {
    return (
      navigator.standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches
    );
  }

  function hintDismissed() {
    try {
      var salvato = localStorage.getItem(IOS_HINT_KEY);
      if (!salvato) return false;
      var quando = parseInt(salvato, 10);
      if (!quando || isNaN(quando)) return false;
      return Date.now() - quando < IOS_HINT_GIORNI * 24 * 60 * 60 * 1000;
    } catch (error) {
      return false;
    }
  }

  function showIosHint() {
    var hint = document.createElement('aside');
    hint.className = 'pwa-ios-hint';

    var text = document.createElement('p');
    text.className = 'pwa-ios-hint__text';
    text.textContent = isEn
      ? 'Install this site as an app: tap Share, then "Add to Home Screen".'
      : 'Installa questo sito come app: tocca Condividi, poi "Aggiungi alla schermata Home".';

    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'pwa-ios-hint__close';
    close.textContent = '×';
    close.setAttribute('aria-label', isEn ? 'Dismiss this notice' : 'Chiudi questo avviso');
    close.addEventListener('click', function () {
      hint.parentNode.removeChild(hint);
      try {
        localStorage.setItem(IOS_HINT_KEY, String(Date.now()));
      } catch (error) {}
    });

    hint.appendChild(text);
    hint.appendChild(close);
    document.body.appendChild(hint);
  }

  if (isIos() && !isInstalled() && hasVisitedBefore && !hintDismissed()) {
    showIosHint();
  }
})();
