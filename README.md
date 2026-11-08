# giovannipaolofusco.it

**Italiano** · [English](#english)

Codice sorgente del mio sito personale e professionale: https://giovannipaolofusco.it

Sono Giovanni Paolo Fusco, sviluppatore web a Fondi (LT). Realizzo siti statici veloci per attività locali. Questo repository è il sito che uso per presentarmi, costruito con lo stesso metodo che uso per i clienti.

## Com'è fatto

| Parte | Scelta |
|---|---|
| Pagine | HTML, CSS e JavaScript senza framework, in italiano e inglese (`/en/`) |
| Build | `scripts/build.mjs`: lascia le sorgenti leggibili nella root e pubblica solo `dist/`, con HTML, CSS e JS minificati e immagini ottimizzate con `sharp` |
| Test | `node --test` controlla l'output del build (se fallisce, il deploy su Netlify si ferma) e il testo dei PDF |
| Hosting | Netlify, con header di sicurezza in `_headers` e redirect in `_redirects` |
| Offline | Service Worker (`sw.js`) per la cache delle risorse |
| Certificazioni | GitHub Actions aggiorna ogni giorno i badge Credly in `badges.json` |
| Sicurezza | `/.well-known/security.txt` con il contatto per le segnalazioni |

## Avvio in locale

```bash
npm install
npm run build
npm run test:build
npx serve dist
```

Serve Node 22.

## Note

Questo repository contiene solo la versione attuale del sito. Documenti interni, bozze e strumenti di lavoro restano fuori.

---

## English

Source code of my personal and professional website: https://giovannipaolofusco.it

I'm Giovanni Paolo Fusco, a web developer in Fondi, Italy. I build fast static websites for local businesses. This repository is the site I use to present myself, built with the same method I use for clients.

- Plain HTML, CSS and JavaScript, no framework, in Italian and English (`/en/`).
- `scripts/build.mjs` keeps readable sources in the root and publishes only `dist/`, minified, with images optimized by `sharp`.
- `node --test` checks the build output (a failure stops the Netlify deploy) and the PDF text.
- Hosted on Netlify with security headers (`_headers`) and redirects (`_redirects`), plus a Service Worker for caching.
- A daily GitHub Actions job refreshes Credly badges.

**Run locally:** `npm install && npm run build && npx serve dist` (Node 22).
