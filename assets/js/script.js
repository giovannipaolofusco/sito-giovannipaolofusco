const SEGNAPOSTO_LOGO =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZSIvPjwvc3ZnPg==';

document.querySelectorAll('img.nav-logo').forEach((logo) => {
  const applicaSegnaposto = () => {
    logo.src = SEGNAPOSTO_LOGO;
  };
  logo.addEventListener('error', applicaSegnaposto, { once: true });
  if (logo.complete && logo.naturalWidth === 0) applicaSegnaposto();
});

const themeToggle = document.getElementById('theme-toggle');
const rootElement = document.documentElement;

const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

function updateToggleIcon() {
  const isDark = rootElement.getAttribute('data-theme') === 'dark';
  if (themeToggle) {
    themeToggle.innerHTML = isDark ? sunIcon : moonIcon;
  }
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) {
    themeMeta.content = isDark ? '#0a0a0a' : '#ffffff';
  }
}

updateToggleIcon();

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const isDark = rootElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      rootElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    } else {
      rootElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    }
    updateToggleIcon();
  });
}

const navToggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('nav-links');

if (navToggle && navLinks) {
  const mobileQuery = window.matchMedia('(max-width: 820px)');
  const labelOpen = navToggle.getAttribute('aria-label');
  const labelClose = navToggle.dataset.labelClose || labelOpen;
  const background = [document.querySelector('main'), document.querySelector('footer')].filter(Boolean);

  const setMenu = (isOpen) => {
    navLinks.classList.toggle('is-open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.setAttribute('aria-label', isOpen ? labelClose : labelOpen);
    rootElement.classList.toggle('menu-aperto', isOpen);
    background.forEach((el) => { el.inert = isOpen; });
  };

  const closeMenu = () => setMenu(false);

  navToggle.addEventListener('click', () => {
    const isOpen = !navLinks.classList.contains('is-open');
    setMenu(isOpen);
    if (isOpen) {
      const firstLink = navLinks.querySelector('a');
      if (firstLink) firstLink.focus();
    }
  });

  navLinks.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });

  document.addEventListener('click', (event) => {
    if (!navLinks.classList.contains('is-open')) return;
    if (navLinks.contains(event.target) || navToggle.contains(event.target)) return;
    closeMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navLinks.classList.contains('is-open')) {
      closeMenu();
      navToggle.focus();
    }
  });

  mobileQuery.addEventListener('change', (event) => {
    if (!event.matches) closeMenu();
  });
}

const credlyContainer = document.getElementById('credly-badges-container');

if (credlyContainer) {
  const currentLang = document.documentElement.lang || 'it';
  const isEn = currentLang === 'en';

  const credlyMessages = {
    loading: isEn ? 'Loading badges...' : 'Caricamento badge in corso...',
    noBadges: isEn ? 'No badges found.' : 'Nessun badge trovato.',
    error: isEn ? 'Unable to load badges at this time.' : 'Impossibile caricare i badge in questo momento.'
  };

  function normalizeBadges(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  }

  async function fetchCredlyBadges() {
    try {
      credlyContainer.innerHTML = `<p>${credlyMessages.loading}</p>`;
      const response = await fetch('/badges.json');

      if (!response.ok) {
        throw new Error('Network error');
      }

      const data = await response.json();

      let badgesArray = normalizeBadges(data);

      try {
        const extraResponse = await fetch('/badges-extra.json');
        if (extraResponse.ok) {
          badgesArray = badgesArray.concat(normalizeBadges(await extraResponse.json()));
        }
      } catch (extraError) {
      }

      badgesArray.sort((a, b) => {
        const dateA = new Date(a.issued_at_date || a.issued_at || 0).getTime() || 0;
        const dateB = new Date(b.issued_at_date || b.issued_at || 0).getTime() || 0;
        return dateB - dateA;
      });

      credlyContainer.innerHTML = '';
      
      if (badgesArray.length === 0) {
        credlyContainer.innerHTML = `<p>${credlyMessages.noBadges}</p>`;
        return;
      }

      badgesArray.forEach(badge => {
        const title = badge.badge_template?.name || badge.name || 'Certificazione';
        const imgUrl = badge.badge_template?.image?.url || badge.badge_template?.image_url || badge.image_url || '';
        const webpUrl = badge.badge_template?.image_webp || badge.image_webp || '';
        const date = badge.issued_at_date || badge.issued_at || '';
        
        let formattedDate = '';
        if (date) {
            const d = new Date(date);
            formattedDate = !isNaN(d.getTime()) ? d.toLocaleDateString(currentLang === 'en' ? 'en-US' : 'it-IT', { year: 'numeric', month: 'long', day: 'numeric' }) : date;
        }

        const badgeId = badge.id;
        const link = badge.badge_url || (badgeId ? `https://www.credly.com/badges/${badgeId}` : '#');

        const badgeCard = document.createElement('a');
        badgeCard.className = 'card-credly';
        badgeCard.href = /^https?:\/\//.test(link) ? link : '#';
        badgeCard.target = '_blank';
        badgeCard.rel = 'noopener noreferrer';

        if (imgUrl) {
          const immagine = document.createElement('img');
          immagine.src = imgUrl;
          immagine.alt = title;
          immagine.width = 110;
          immagine.height = 110;
          immagine.loading = 'lazy';

          if (webpUrl) {
            const picture = document.createElement('picture');
            const source = document.createElement('source');
            source.srcset = webpUrl;
            source.type = 'image/webp';
            picture.append(source, immagine);
            badgeCard.appendChild(picture);
          } else {
            badgeCard.appendChild(immagine);
          }
        }

        const titolo = document.createElement('h3');
        titolo.textContent = title;
        badgeCard.appendChild(titolo);

        if (formattedDate) {
          const data = document.createElement('p');
          data.className = 'credly-date';
          data.textContent = formattedDate;
          badgeCard.appendChild(data);
        }
        
        credlyContainer.appendChild(badgeCard);
      });
    } catch (error) {
      credlyContainer.innerHTML = `<p>${credlyMessages.error}</p>`;
    }
  }

  if (credlyContainer.querySelector('.card-credly')) {
  } else {
    fetchCredlyBadges();
  }
}

window.__ready = false;
(function () {
  const jump = new URLSearchParams(location.search).get('jump');
  const posizione = jump !== null && /^\d+$/.test(jump) ? parseInt(jump, 10) : null;

  function segnala() {
    if (posizione !== null) window.scrollTo(0, posizione);
    requestAnimationFrame(() => requestAnimationFrame(() => { window.__ready = true; }));
  }

  const attese = [
    document.fonts ? document.fonts.ready : Promise.resolve(),
    ...Array.from(document.images)
      .filter((img) => img.getBoundingClientRect().top < window.innerHeight * 1.5)
      // Un'immagine lazy che il browser non ha ancora richiesto non fa parte
      // dello stato a regime, e aspettarla appende __ready per sempre: decode()
      // su una lazy mai richiesta non si risolve. E' accaduto il 20/09/2026 con
      // la fascia dei badge, dove 21 immagini su 30 stavano fuori dalla vista
      // orizzontale: la regressione visiva scadeva senza dire perche'.
      .filter((img) => img.complete || img.loading !== 'lazy')
      .map((img) => (img.complete ? Promise.resolve() : img.decode().catch(() => {}))),
  ];

  const pronto = () => Promise.all(attese).then(() => setTimeout(segnala, 350));
  if (document.readyState === 'complete') pronto();
  else window.addEventListener('load', pronto, { once: true });
})();

// Funzione per evidenziare la lingua attiva
document.addEventListener('DOMContentLoaded', function() {
  // Trova il bottone della lingua corrente e aggiungi la classe active
  var pathname = window.location.pathname;
  var bottoneIT = document.querySelector('.lang-selector .lang-btn:not([href])'); // Bottone IT non ha href
  var bottoneEN = document.querySelector('.lang-btn[href*="en/"]'); // Bottone EN ha href che contiene "en/"

  if (pathname.includes('/en/')) {
    // Siamo nella versione inglese
    if (bottoneEN) bottoneEN.classList.add('active');
    if (bottoneIT) bottoneIT.classList.remove('active');
  } else {
    // Siamo nella versione italiana
    if (bottoneIT) bottoneIT.classList.add('active');
    if (bottoneEN) bottoneEN.classList.remove('active');
  }
});

// Pulsante «Gestisci preferenze cookie» (solo nelle informative). Lo apre la
// libreria del banner tramite data-cc; se la libreria non si e' caricata, il
// click non farebbe niente: si mostra un avviso invece (CLAUDE.md §4).
(function () {
  var pulsante = document.getElementById('riapri-preferenze-cookie');
  var avviso = document.getElementById('preferenze-non-disponibili');
  if (!pulsante || !avviso) return;
  pulsante.addEventListener('click', function () {
    var cmp = window.CookieConsent;
    if (cmp && typeof cmp.showPreferences === 'function') return;
    avviso.hidden = false;
  });
})();
