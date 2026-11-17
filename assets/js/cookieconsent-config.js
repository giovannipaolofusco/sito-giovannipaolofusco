import '/assets/libs/cookieconsent/cookieconsent-3.3.0.umd.js';

await new Promise((fatto) => {
  const foglio = document.createElement('link');
  foglio.rel = 'stylesheet';
  foglio.href = '/assets/css/cookieconsent.css';
  foglio.onload = fatto;
  foglio.onerror = fatto;
  document.head.append(foglio);
});

window.dataLayer = window.dataLayer || [];
function gtag() {
  window.dataLayer.push(arguments);
}
window.gtag = gtag;

gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'granted',
  security_storage: 'granted',
  wait_for_update: 500
});

CookieConsent.run({
  cookie: {
    expiresAfterDays: 186
  },
  guiOptions: {
    consentModal: {
      layout: 'box inline',
      position: 'bottom right',
      equalWeightButtons: true,
      flipButtons: false
    },
    preferencesModal: {
      layout: 'box',
      position: 'right',
      equalWeightButtons: true,
      flipButtons: false
    }
  },
  onConsent: function () {
    if (CookieConsent.acceptedCategory('analytics')) {
      gtag('consent', 'update', { analytics_storage: 'granted' });
      loadGoogleAnalytics();
    }
  },
  onChange: function ({ changedCategories }) {
    if (changedCategories.includes('analytics')) {
      if (CookieConsent.acceptedCategory('analytics')) {
        gtag('consent', 'update', { analytics_storage: 'granted' });
        loadGoogleAnalytics();
      } else {
        gtag('consent', 'update', { analytics_storage: 'denied' });
        CookieConsent.eraseCookies(['_ga', '_gid', '_gat', /^_ga_/]);
        window.location.reload();
      }
    }
  },
  categories: {
    necessary: {
      readOnly: true
    },
    analytics: {}
  },
  language: {
    default: 'it',
    autoDetect: 'document',
    translations: {
      it: {
        consentModal: {
          title: 'Statistiche solo se accetti',
          description: 'Google Analytics 4 misura le visite solo se accetti. La X chiude senza attivarlo.',
          acceptAllBtn: 'Accetta tutti',
          acceptNecessaryBtn: 'Rifiuta tutti',
          showPreferencesBtn: 'Gestisci preferenze',
          closeIconLabel: 'Chiudi senza accettare',
          footer: '<a href="/privacy/">Privacy Policy</a>'
        },
        preferencesModal: {
          title: 'Preferenze sui cookie',
          acceptAllBtn: 'Accetta tutti',
          acceptNecessaryBtn: 'Rifiuta tutti',
          savePreferencesBtn: 'Salva preferenze',
          closeIconLabel: 'Chiudi',
          sections: [
            {
              title: 'Cosa scegli qui',
              description: 'Se attivare Google Analytics. I cookie tecnici ricordano solo la tua scelta.'
            },
            {
              title: 'Cookie tecnici <span class="pm__badge">Sempre attivi</span>',
              description: 'Questi cookie sono essenziali per il funzionamento del sito, incluso il salvataggio delle tue preferenze di consenso.',
              linkedCategory: 'necessary'
            },
            {
              title: 'Statistiche',
              description: 'Google Analytics 4, fornito da Google Ireland Limited, raccoglie a fini statistici le pagine visitate, il tempo trascorso e il dispositivo utilizzato, con un identificativo del browser (cookie _ga). I dati possono essere trasferiti negli Stati Uniti (EU-U.S. Data Privacy Framework): dettagli nella Privacy Policy.',
              linkedCategory: 'analytics'
            }
          ]
        }
      },
      en: {
        consentModal: {
          title: 'Analytics only if you accept',
          description: 'Google Analytics 4 measures visits only if you accept. The X closes without enabling it.',
          acceptAllBtn: 'Accept all',
          acceptNecessaryBtn: 'Reject all',
          showPreferencesBtn: 'Manage preferences',
          closeIconLabel: 'Close without accepting',
          footer: '<a href="/en/privacy/">Privacy Policy</a>'
        },
        preferencesModal: {
          title: 'Cookie preferences',
          acceptAllBtn: 'Accept all',
          acceptNecessaryBtn: 'Reject all',
          savePreferencesBtn: 'Save preferences',
          closeIconLabel: 'Close',
          sections: [
            {
              title: 'What you choose here',
              description: 'Whether to turn on Google Analytics. Essential cookies only remember your choice.'
            },
            {
              title: 'Essential cookies <span class="pm__badge">Always on</span>',
              description: 'These cookies are essential for the operation of the website, including saving your consent preferences.',
              linkedCategory: 'necessary'
            },
            {
              title: 'Analytics',
              description: 'Google Analytics 4, provided by Google Ireland Limited, collects pages visited, time spent and device used for statistical purposes, with a browser identifier (_ga cookie). Data may be transferred to the United States (EU-U.S. Data Privacy Framework): details in the Privacy Policy.',
              linkedCategory: 'analytics'
            }
          ]
        }
      }
    }
  }
});


function loadGoogleAnalytics() {
  if (window._gaLoaded) return;
  window._gaLoaded = true;
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=G-DZV6MBTHN0';
  document.head.appendChild(script);
  gtag('js', new Date());
  gtag('config', 'G-DZV6MBTHN0', { anonymize_ip: true });
}
