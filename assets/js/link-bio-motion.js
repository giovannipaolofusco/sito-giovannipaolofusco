(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (typeof gsap === 'undefined') return;

  var giaVista = false;
  try {
    giaVista = sessionStorage.getItem('link-apertura-vista') === '1';
    sessionStorage.setItem('link-apertura-vista', '1');
  } catch (e) {
    giaVista = false;
  }

  function flotta(avatar) {
    if (!avatar) return;
    gsap.to(avatar, {
      y: -6,
      duration: 2.8,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    });
  }

  if (document.visibilityState === 'visible') {
    avvia();
  } else {
    document.addEventListener('visibilitychange', function attesa() {
      if (document.visibilityState !== 'visible') return;
      document.removeEventListener('visibilitychange', attesa);
      avvia();
    });
  }

  function avvia() {
    const avatar = document.querySelector('.link-bio__avatar-anello');
    const nome = document.querySelector('.link-bio__name');
    const tagline = document.querySelector('.link-bio__tagline');
    const elenco = document.querySelector('.link-bio__links');
    const pulsanti = gsap.utils.toArray('.link-bio__btn');

    if (giaVista) {
      flotta(avatar);
      return;
    }

    const entrata = gsap.timeline({ defaults: { ease: 'power3.out' } });
    const carica = { giro: 0 };

    document.body.classList.add('aurora-in-ingresso', 'alone-in-ingresso');
    entrata.call(
      function () {
        document.body.classList.remove('aurora-in-ingresso');
      },
      null,
      0.9
    );
    entrata.call(
      function () {
        document.body.classList.remove('alone-in-ingresso');
      },
      null,
      1.25
    );

    if (avatar) {
      avatar.classList.add('anello-in-carica');
      entrata
        .fromTo(
          avatar,
          { scale: 0.9, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.42 },
          0
        )
        .to(
          carica,
          {
            giro: 1,
            duration: 0.54,
            ease: 'power2.inOut',
            onUpdate: function () {
              avatar.style.setProperty('--carica', carica.giro + 'turn');
            },
            onComplete: function () {
              avatar.classList.remove('anello-in-carica');
              avatar.style.removeProperty('--carica');
            },
          },
          0.06
        );
    }

    if (nome) {
      entrata.fromTo(
        nome,
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.38 },
        0.38
      );
    }
    if (tagline) {
      entrata.fromTo(
        tagline,
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.38 },
        0.44
      );
    }
    if (pulsanti.length) {
      entrata.fromTo(
        pulsanti,
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.045 },
        0.48
      );
    }

    let concluso = false;
    function dopoEntrata() {
      if (concluso) return;
      concluso = true;

      flotta(avatar);

      if (elenco) elenco.classList.add('link-bio__links--riflesso');
    }

    const salvagente = setTimeout(function () {
      entrata.progress(1);
      dopoEntrata();
    }, 2500);

    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') entrata.progress(1);
    });

    entrata.eventCallback('onComplete', function () {
      clearTimeout(salvagente);
      dopoEntrata();
    });
  }
})();
