import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { headersPerCloudflare, versione } from '../scripts/piattaforma.mjs';

const output = (path) => join('dist', path);
const routePages = [
  'servizi',
  'formazione-ai',
  'progetti',
  'certificazioni',
  'cv',
  'contatti',
  'privacy',
  'link',
];
const indexableRoutes = routePages.filter((route) => route !== 'link');

test('il build pubblica pagine fisiche con URL puliti', () => {
  assert.ok(existsSync(output('index.html')));
  assert.ok(existsSync(output('en/index.html')));

  for (const route of routePages) {
    assert.ok(existsSync(output(`${route}/index.html`)), route);
    assert.ok(existsSync(output(`en/${route}/index.html`)), `en/${route}`);
    assert.ok(!existsSync(output(`${route}.html`)), `${route}.html non deve essere pubblicato`);
    assert.ok(!existsSync(output(`en/${route}.html`)), `en/${route}.html non deve essere pubblicato`);
  }

  assert.ok(existsSync(output('404.html')));
  assert.ok(existsSync(output('en/404.html')));
});

test('il build include i file serviti da Netlify e le risorse pubbliche', () => {
  for (const file of [
    '_headers',
    '_redirects',
    '.well-known/security.txt',
    'sw.js',
    'site.webmanifest',
    'sitemap.xml',
    'robots.txt',
    'assets/css/style.css',
    'assets/js/script.js',
    'assets/img/logo-nav-ritratto.jpg',
    'assets/img/logo-nav-ritratto.webp',
    'presentazione-pacchetti/index.html',
    'presentazione-pacchetti/statico/index.html',
    'presentazione-pacchetti/fullstack/index.html',
    'presentazione-pacchetti/icone.svg',
    'presentazione-pacchetti/qr-contatto.svg',
  ]) {
    assert.ok(existsSync(output(file)), file);
  }
});

test('il logo di navigazione offre WebP senza togliere il fallback JPEG', () => {
  for (const page of ['servizi/index.html', 'en/servizi/index.html']) {
    const html = readFileSync(output(page), 'utf8');
    assert.match(
      html,
      /<picture>\s*<source srcset="\/assets\/img\/logo-nav-ritratto\.webp" type="image\/webp">\s*<img[^>]*src="\/assets\/img\/logo-nav-ritratto\.jpg"[^>]*>\s*<\/picture>/,
      page,
    );
  }
});

test('il Service Worker invalida la shell precedente del rilascio', () => {
  const worker = readFileSync(output('sw.js'), 'utf8');
  assert.match(worker, /gpf-shell-v46/);
});

test('i metadata e la sitemap usano l URL fisico con trailing slash', () => {
  const sitemap = readFileSync(output('sitemap.xml'), 'utf8');

  for (const route of indexableRoutes) {
    const italianUrl = `https://giovannipaolofusco.it/${route}/`;
    const englishUrl = `https://giovannipaolofusco.it/en/${route}/`;
    const italianPage = readFileSync(output(`${route}/index.html`), 'utf8');
    const englishPage = readFileSync(output(`en/${route}/index.html`), 'utf8');

    assert.match(italianPage, new RegExp(`rel="canonical" href="${italianUrl}"`));
    assert.match(englishPage, new RegExp(`rel="canonical" href="${englishUrl}"`));
    assert.match(sitemap, new RegExp(`<loc>${italianUrl}</loc>`));
    assert.match(sitemap, new RegExp(`<loc>${englishUrl}</loc>`));
  }
});

test('l output pubblico identifica il prestatore senza esporre dati esclusi', () => {
  const italianPages = [
    'index.html',
    '404.html',
    'servizi/index.html',
    'formazione-ai/index.html',
    'progetti/index.html',
    'certificazioni/index.html',
    'cv/index.html',
    'contatti/index.html',
    'link/index.html',
  ];
  const englishPages = [
    'en/index.html',
    'en/404.html',
    'en/servizi/index.html',
    'en/formazione-ai/index.html',
    'en/progetti/index.html',
    'en/certificazioni/index.html',
    'en/cv/index.html',
    'en/contatti/index.html',
    'en/link/index.html',
  ];
  const structuredDataPages = [
    'index.html',
    'servizi/index.html',
    'formazione-ai/index.html',
    'progetti/index.html',
    'certificazioni/index.html',
    'cv/index.html',
    'contatti/index.html',
    'en/index.html',
    'en/servizi/index.html',
    'en/formazione-ai/index.html',
    'en/progetti/index.html',
    'en/certificazioni/index.html',
    'en/cv/index.html',
    'en/contatti/index.html',
  ];

  for (const page of italianPages) {
    const html = readFileSync(output(page), 'utf8');
    assert.match(html, /P\. IVA 03388590592/, page);
    assert.match(html, /P\. IVA 03388590592 · Fondi \(LT\)/, `${page}: sede legale nel footer`);
  }

  for (const page of englishPages) {
    const html = readFileSync(output(page), 'utf8');
    assert.match(html, /VAT No\. 03388590592/, page);
    assert.match(html, /VAT No\. 03388590592 · Fondi \(LT\), Italy/, `${page}: registered office in the footer`);
  }

  for (const page of structuredDataPages) {
    const html = readFileSync(output(page), 'utf8');
    assert.match(html, /"vatID": "IT03388590592"/, page);
  }

  const contact = readFileSync(output('contatti/index.html'), 'utf8');
  const englishContact = readFileSync(output('en/contatti/index.html'), 'utf8');
  assert.match(contact, /Fondi \(LT\) · Attività di programmazione informatica/);
  assert.match(englishContact, /Fondi \(LT\), Italy · Computer programming activities/);

  const publicOutput = italianPages.concat(englishPages, [
    'privacy/index.html',
    'en/privacy/index.html',
    'contatto.vcf',
  ]).map((page) => readFileSync(output(page), 'utf8')).join('\n');
  const excludedTerms = [
    'FSC' + 'GNN',
    // «forfettario» e' ammesso: la dicitura IVA dei prezzi nomina il regime.
    'IN' + 'PS',
    'gestione' + ' previdenziale',
    '4/' + '2013'
  ];
  assert.doesNotMatch(publicOutput, new RegExp(excludedTerms.join('|'), 'i'));
  assert.doesNotMatch(readFileSync(output('contatto.vcf'), 'utf8'), /03388590592/);
});

// Il domicilio professionale e' pubblico solo nel corpo di Contatti e Privacy,
// IT ed EN: mai in <head>, JSON-LD o footer, e in nessun altro file di dist/.
test('il domicilio compare solo nelle quattro pagine ammesse', () => {
  const domicileTerm = /Nazario\s+Sauro/i;
  const domicile = 'Via Nazario Sauro 9, 04022 Fondi (LT)';
  const allowedPages = [
    'contatti/index.html',
    'privacy/index.html',
    'en/contatti/index.html',
    'en/privacy/index.html',
  ];

  for (const page of allowedPages) {
    const html = readFileSync(output(page), 'utf8');
    assert.equal(html.split(domicile).length - 1, 1, `${page}: domicilio una volta sola`);
    const head = html.split('</head>')[0];
    const footers = (html.match(/<footer[\s\S]*?<\/footer>/g) || []).join('\n');
    const jsonLd = (html.match(/<script[^>]*ld\+json[^>]*>[\s\S]*?<\/script>/g) || []).join('\n');
    assert.doesNotMatch(head, domicileTerm, `${page}: niente domicilio in <head>`);
    assert.doesNotMatch(footers, domicileTerm, `${page}: niente domicilio nel footer`);
    assert.doesNotMatch(jsonLd, domicileTerm, `${page}: niente domicilio nel JSON-LD`);
  }

  const textFile = /\.(html|txt|xml|vcf|json|webmanifest|js|mjs|css|svg)$/;
  const otherFiles = readdirSync('dist', { recursive: true })
    .map((file) => String(file).split('\\').join('/'))
    .filter((file) => textFile.test(file) && !allowedPages.includes(file));
  const sentinels = [
    'index.html',
    'servizi/index.html',
    'progetti/index.html',
    'llms.txt',
    'sitemap.xml',
    'contatto.vcf',
  ];
  for (const sentinel of sentinels) {
    assert.ok(otherFiles.includes(sentinel), `la scansione di dist/ include ${sentinel}`);
  }
  for (const file of otherFiles) {
    assert.doesNotMatch(readFileSync(output(file), 'utf8'), domicileTerm, `${file}: domicilio fuori dalle pagine ammesse`);
  }
});

// Ogni PDF pubblicato e' stato guardato da una persona: il registro si aggiorna a mano, mai da uno script.
test('ogni PDF in dist/ e\' nel registro delle impronte', () => {
  const registry = JSON.parse(readFileSync('tests/pdf-impronte.json', 'utf8'));
  const pdfs = readdirSync('dist', { recursive: true })
    .map((file) => String(file).split('\\').join('/'))
    .filter((file) => file.toLowerCase().endsWith('.pdf'))
    .sort();
  assert.ok(pdfs.length > 0, 'nessun PDF trovato in dist/');
  const problems = [];
  for (const file of pdfs) {
    const hash = createHash('sha256').update(readFileSync(output(file))).digest('hex');
    if (registry[file] === hash) continue;
    problems.push(`${registry[file] ? 'cambiato' : 'nuovo'}: ${file}\n  riga da incollare: "${file}": "${hash}",`);
  }
  assert.deepEqual(problems, [], [
    'PDF in dist/ fuori dal registro tests/pdf-impronte.json.',
    'Prima di registrare: apri il PDF, controlla dati anagrafici e firme, lancia npm run test:pdf',
    '',
    ...problems,
  ].join('\n'));
});

// Dice se un rimando punta a una sezione esistente, non se e' quella giusta.
test('la privacy numera le sezioni senza salti e i rimandi puntano a sezioni esistenti', () => {
  for (const [page, word] of [['privacy/index.html', 'sezione'], ['en/privacy/index.html', 'section']]) {
    const html = readFileSync(output(page), 'utf8');
    const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
    const titles = [...main.matchAll(/<h2[^>]*>\s*([^<.\s]+)\./g)].map((m) => m[1]);
    assert.ok(titles.length > 0, `${page}: nessun titolo h2 numerato`);
    assert.deepEqual(titles, titles.map((_, i) => String(i + 1)), `${page}: titoli h2 non numerati da 1 a N`);
    const index = main.match(/<nav[^>]*informativa__indice[\s\S]*?<\/nav>/);
    assert.ok(index, `${page}: indice non trovato`);
    const entries = (index[0].match(/<li[\s>]/g) || []).length;
    assert.equal(entries, titles.length, `${page}: ${entries} voci nell'indice, ${titles.length} sezioni nel testo`);
    const subsections = [...main.matchAll(/<h3[^>]*>\s*(\d+\.\d+)\s/g)].map((m) => m[1]);
    const references = [...main.replace(index[0], '').matchAll(new RegExp(`\\b${word}\\s+(\\d+)(?:\\.(\\d+))?`, 'gi'))];
    assert.ok(references.length > 0, `${page}: nessun rimando «${word} N» trovato`);
    for (const [text, section, sub] of references) {
      assert.ok(Number(section) >= 1 && Number(section) <= titles.length, `${page}: «${text}» punta a una sezione che non esiste`);
      if (sub) assert.ok(subsections.includes(`${section}.${sub}`), `${page}: «${text}» punta a una sottosezione che non esiste`);
    }
  }
});

test('le icone della presentazione conservano la licenza di Lucide', () => {
  const svg = readFileSync(output('presentazione-pacchetti/icone.svg'), 'utf8');
  assert.match(svg, /@license lucide-static v[\d.]+ - ISC/);
  assert.match(svg, /Copyright \(c\) \d{4} Lucide Icons and Contributors/);
  assert.match(svg, /Feather/);
});

// Le pagine sono elencate a mano in piu' file (sitemap, shell del Service Worker, redirect, llms.txt).
function paginaDellaSitemap() {
  return [...readFileSync(output('sitemap.xml'), 'utf8').matchAll(/<loc>https:\/\/giovannipaolofusco\.it([^<]*)<\/loc>/g)]
    .map((m) => m[1]);
}

test('ogni pagina della sitemap e\' nella shell del Service Worker, nei redirect e in llms.txt', () => {
  const sw = readFileSync(output('sw.js'), 'utf8');
  const redirect = readFileSync(output('_redirects'), 'utf8');
  const llms = readFileSync(output('llms.txt'), 'utf8');
  for (const pagina of paginaDellaSitemap()) {
    assert.match(sw, new RegExp(`["']${pagina.replace(/[/]/g, '\\/')}["']`), `shell del Service Worker: ${pagina}`);
    if (pagina !== '/' && pagina !== '/en/') {
      assert.ok(redirect.includes(`${pagina.replace(/\/$/, '')}.html`), `_redirects senza il 301 da .html: ${pagina}`);
    }
    assert.ok(llms.includes(`https://giovannipaolofusco.it${pagina})`), `llms.txt senza ${pagina} nella forma con la barra`);
  }
});

test('la CSP nelle pagine coincide con quella di _headers, regola per regola', () => {
  const regole = (valore) => Object.fromEntries(valore.split(';').map((r) => r.trim()).filter(Boolean)
    .map((r) => { const [nome, ...fonti] = r.split(/\s+/); return [nome, fonti.sort().join(' ')]; }));
  const intestazione = regole(readFileSync(output('_headers'), 'utf8').match(/Content-Security-Policy:\s*(.+)/)[1]);
  // frame-ancestors non vale dentro <meta>: sta solo nell'intestazione.
  delete intestazione['frame-ancestors'];
  for (const pagina of paginaDellaSitemap()) {
    const file = pagina === '/' ? 'index.html' : `${pagina.replace(/^\//, '')}index.html`;
    const meta = readFileSync(output(file), 'utf8').match(/http-equiv="Content-Security-Policy" content="([^"]*)"/);
    assert.ok(meta, `${file} senza CSP nella pagina`);
    assert.deepEqual(regole(meta[1]), intestazione, `CSP diversa da _headers in ${file}`);
  }
});

test('il titolo dell\'anteprima social coincide con il titolo di ogni pagina', () => {
  for (const pagina of paginaDellaSitemap()) {
    const file = pagina === '/' ? 'index.html' : `${pagina.replace(/^\//, '')}index.html`;
    const html = readFileSync(output(file), 'utf8');
    const titolo = html.match(/<title>(.*?)<\/title>/)[1];
    assert.equal(html.match(/property="og:title" content="([^"]*)"/)[1], titolo, `og:title in ${file}`);
    assert.equal(html.match(/name="twitter:title" content="([^"]*)"/)[1], titolo, `twitter:title in ${file}`);
  }
});

test('la chiave IndexNow e\' pubblicata in root con il proprio nome come contenuto', () => {
  const chiavi = readdirSync(output('')).filter((f) => /^[0-9a-f]{32}\.txt$/.test(f));
  assert.equal(chiavi.length, 1, 'serve una e una sola chiave IndexNow in root');
  assert.equal(readFileSync(output(chiavi[0]), 'utf8').trim(), chiavi[0].replace('.txt', ''));
});

// Un JSON-LD malformato non da' errori in pagina: Google lo scarta e basta.
test('il JSON-LD di ogni pagina della sitemap e\' JSON valido, senza recensioni', () => {
  for (const pagina of paginaDellaSitemap()) {
    const file = pagina === '/' ? 'index.html' : `${pagina.replace(/^\//, '')}index.html`;
    const blocchi = [...readFileSync(output(file), 'utf8').matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    for (const [, testo] of blocchi) {
      assert.doesNotThrow(() => JSON.parse(testo), `JSON-LD non valido in ${file}`);
      assert.doesNotMatch(testo, /AggregateRating|"Review"/, `recensioni marcate in ${file}`);
    }
  }
});

test('la formazione AI dichiara quattro Course completi, FAQPage e BreadcrumbList', () => {
  for (const file of ['formazione-ai/index.html', 'en/formazione-ai/index.html']) {
    const html = readFileSync(output(file), 'utf8');
    const grafo = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
    const corsi = grafo.filter((nodo) => nodo['@type'] === 'Course');
    assert.equal(corsi.length, 4, `${file}: quattro livelli`);
    // Il livello 4 ha il prezzo su richiesta: nessuna offerta inventata nel JSON-LD.
    assert.deepEqual(corsi.map((c) => c.offers?.price ?? null), ['390', '390', '490', '490'], `${file}: prezzi`);
    for (const corso of corsi) {
      assert.ok(corso.name && corso.description && corso.provider, `${file}: ${corso.name}`);
      if (corso.offers) {
        assert.equal(corso.offers.priceCurrency, 'EUR');
        assert.equal(corso.offers.category, 'Paid');
      }
      assert.equal(corso.hasCourseInstance.courseMode, 'Onsite');
      assert.match(corso.hasCourseInstance.courseWorkload, /^PT\dH$/);
    }
    const faq = grafo.find((nodo) => nodo['@type'] === 'FAQPage');
    assert.equal(faq.mainEntity.length, 7, `${file}: sette domande`);
    for (const domanda of faq.mainEntity) {
      assert.ok(html.includes(domanda.name), `${file}: domanda non visibile in pagina: ${domanda.name}`);
    }
    assert.ok(grafo.some((nodo) => nodo['@type'] === 'BreadcrumbList'), `${file}: breadcrumb`);
    // Prezzi e supplementi di viaggio non entrano mai in un effetto di comparsa.
    assert.doesNotMatch(html, /\bdata-motion\b/, `${file}: effetto di comparsa in pagina`);
    if (file.startsWith('en/')) {
      const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1].replace(/<[^>]+>/g, '');
      assert.doesNotMatch(h1, /\b(Corso|intelligenza|aziende|per)\b/, `${file}: titolo H1 in italiano: ${h1}`);
    }
    assert.equal((html.match(/class="lv__prezzo"/g) || []).length, 4, `${file}: quattro prezzi fermi`);
    const persona = grafo.find((nodo) => nodo['@type'] === 'Person');
    assert.equal(persona.vatID, 'IT03388590592');
    assert.equal(persona.areaServed.length, 6);
  }
});

// Un menu copiato da un'altra pagina puo' ripetere una voce.
test('il menu di ogni pagina ha voci uniche e una sola voce attiva', () => {
  const pagine = readdirSync('dist', { recursive: true }).map(String)
    .filter((file) => file.endsWith('.html') && !file.startsWith('presentazione'));
  for (const file of pagine) {
    const menu = readFileSync(output(file), 'utf8').match(/id="nav-links"[\s\S]*?<\/div>/);
    if (!menu) continue;
    const voci = [...menu[0].matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    assert.equal(new Set(voci).size, voci.length, `${file}: voce di menu duplicata (${voci.join(', ')})`);
    assert.ok((menu[0].match(/class="active"/g) || []).length <= 1, `${file}: piu' voci attive`);
  }
});

// I contatti diretti restano nel markup servito, leggibili anche se JavaScript non parte (regola di progetto).
test('le pagine principali usano lo stile comune e restano leggibili senza JavaScript', () => {
  const tolti = /home-init|hero-scene|photo-particles|intro-anim|scroll-story|badge-fascia|\/cv\.js|servizi\.js|cv\.css/;
  for (const pre of ['', 'en/']) {
    for (const pagina of ['index.html', 'servizi/index.html', 'progetti/index.html', 'certificazioni/index.html', 'cv/index.html', 'contatti/index.html']) {
      const file = pre + pagina;
      const html = readFileSync(output(file), 'utf8');
      assert.match(html, /\/assets\/css\/raggi\.css/, `${file}: foglio comune`);
      assert.match(html, /\/assets\/js\/raggi\.js/, `${file}: script comune`);
      assert.doesNotMatch(html, tolti, `${file}: script di una grafica tolta`);
      assert.match(html, /info@giovannipaolofusco\.it/, `${file}: email nel markup`);
      assert.match(html, /\+39 333 491 9401/, `${file}: telefono nel markup`);
    }
    const servizi = readFileSync(output(pre + 'servizi/index.html'), 'utf8');
    assert.match(servizi, new RegExp(`href="/${pre}formazione-ai/"`), `${pre}servizi: porta verso la formazione`);
    assert.equal((servizi.match(/class="rxq__voce"/g) || []).length, 8, `${pre}servizi: otto domande`);
    const dentro = (servizi.match(/<ul class="rx-dt__lista">(.*?)<\/ul>/s) || ['', ''])[1];
    assert.equal((dentro.match(/class="rx-dt__punto"/g) || []).length, 9, `${pre}servizi: nove voci in «Cosa c'è dentro ogni sito»`);
    assert.doesNotMatch(servizi, /rx-dt__punto"[^>]*hidden/, `${pre}servizi: voci nascoste nel markup servito`);
  }
});

// Il workflow notturno (.github/scripts/rendi-badge-html.py) scrive i badge fra i marcatori.
test('certificazioni: badge fra i marcatori e contatori coerenti con le card', () => {
  for (const file of ['certificazioni/index.html', 'en/certificazioni/index.html']) {
    const sorgente = readFileSync(file.replace('/index.html', '.html'), 'utf8');
    assert.equal(sorgente.split('<!-- BADGE:INIZIO -->').length - 1, 1, `${file}: una sola apertura`);
    assert.equal(sorgente.split('<!-- BADGE:FINE -->').length - 1, 1, `${file}: una sola chiusura`);
    assert.match(sorgente, /id="credly-badges-container"[^>]*>\s*<!-- BADGE:INIZIO -->/, `${file}: marcatori dentro il contenitore`);
    const html = readFileSync(output(file), 'utf8');
    const card = [...html.matchAll(/class="ct-badge pg__carta" data-cat="(\w+)"/g)].map((m) => m[1]);
    assert.ok(card.length > 0, `${file}: nessuna card`);
    const conta = (k) => (k === 'tutti' ? card.length : card.filter((c) => c === k).length);
    for (const m of html.matchAll(/data-conta="?(\w+)"?>(\d+)</g)) {
      assert.equal(Number(m[2]), conta(m[1]), `${file}: contatore ${m[1]}`);
    }
  }
});

// Senza preload il titolo a peso 800 si reimpagina all'arrivo del font (CLS).
test('le pagine principali precaricano i font della prima schermata', () => {
  for (const pre of ['', 'en/']) {
    for (const pagina of ['index.html', 'servizi/index.html', 'formazione-ai/index.html', 'progetti/index.html', 'certificazioni/index.html', 'cv/index.html', 'contatti/index.html']) {
      const head = readFileSync(output(pre + pagina), 'utf8').split('</head>')[0];
      for (const font of ['inter-v20-latin-800.woff2', 'inter-v20-latin-regular.woff2']) {
        assert.match(head, new RegExp(`<link[^>]*rel="?preload"?[^>]*${font.replace(/\./g, '\\.')}[^>]*crossorigin`), `${pre}${pagina}: preload di ${font}`);
      }
    }
  }
});

test('Formazione AI: durata "3 ore circa", dicitura IVA unica, email solo info@', () => {
  const casi = [
    ['formazione-ai/index.html', /3 ore circa, fino a 8 persone, da 390/, /<b>3 ore circa<\/b> per livello/, 'Prezzi finali: IVA non applicata (regime forfettario).'],
    ['en/formazione-ai/index.html', /[Aa]bout 3 hours, up to 8 people, from €390/, /<b>About 3 hours<\/b> per level/, 'Final prices: no VAT applied (Italian flat-rate scheme).'],
  ];
  for (const [file, meta, striscia, iva] of casi) {
    const html = readFileSync(output(file), 'utf8');
    const head = html.split('</head>')[0];
    assert.ok([...head.matchAll(new RegExp(meta.source, 'g'))].length >= 4, `${file}: meta, og, twitter e JSON-LD con la durata nuova`);
    assert.match(html, striscia, `${file}: striscia`);
    assert.equal(html.split(iva).length - 1, 2, `${file}: dicitura IVA nei due punti`);
    assert.doesNotMatch(html, /senza IVA da aggiungere|no VAT to add/, `${file}: dicitura vecchia`);
  }
  assert.match(readFileSync(output('.well-known/security.txt'), 'utf8'), /^Contact: mailto:info@giovannipaolofusco\.it$/m);
  for (const f of readdirSync('dist', { recursive: true }).map(String).filter((f) => /\.(html|txt|vcf|json)$/.test(f))) {
    assert.doesNotMatch(readFileSync(output(f), 'utf8'), /giovanni@giovannipaolofusco\.it/, `${f}: indirizzo di servizio pubblicato`);
  }
});

// Cloudflare scarta le righe con "301!" (wrangler pages dev 4.156.0), Netlify vuole il "!" solo se il file esiste.
test('_redirects funziona sia su Netlify sia su Cloudflare Pages', () => {
  const righe = readFileSync(output('_redirects'), 'utf8').split('\n').map((r) => r.trim()).filter((r) => r && !r.startsWith('#'));
  const conHost = /^https?:\/\//;
  for (const riga of righe) {
    const [da, , stato] = riga.split(/\s+/);
    if (conHost.test(da)) continue; // solo Netlify, Cloudflare le ignora
    if (stato === '404') continue; // solo Netlify, Cloudflare usa da solo il 404.html piu' vicino
    const file = output(da.replace(/^\//, ''));
    const esiste = existsSync(file) && !da.endsWith('/');
    if (stato.endsWith('!')) assert.ok(esiste, `${da}: "!" senza file dietro, su Cloudflare la riga verrebbe scartata`);
    else assert.ok(!esiste, `${da}: su Netlify la regola non scatta perche' il file esiste`);
  }
  assert.ok(righe.some((r) => r.startsWith('/link.html ') && /\s301$/.test(r)), 'il QR stampato su /link.html deve avere un 301 valido ovunque');
});


// Il parser di Netlify prende le righe
// "https://..." per un header e aggancia il noindex al blocco precedente, e scarta "! Header".
// Quindi il _headers pubblicato per Netlify e' il sorgente senza quelle righe, e quello per Cloudflare
// e' headersPerCloudflare(sorgente). La piattaforma si riconosce dal file pubblicato, perche'
// "CF_PAGES=1 npm run build && npm run test:build" passa CF_PAGES solo al build; se l'ambiente
// la dichiara (CF_PAGES=1 su Cloudflare, NETLIFY=true su Netlify) deve coincidere.
test('_headers: per Netlify senza righe solo-Cloudflare, per Cloudflare con detach e pages.dev', () => {
  const sorgente = readFileSync('_headers', 'utf8');
  const pubblicato = readFileSync(output('_headers'), 'utf8');
  const cf = headersPerCloudflare(sorgente);

  assert.doesNotMatch(sorgente, /^https?:\/\//m, 'riga con host nel _headers del repository');
  assert.doesNotMatch(sorgente, /^\s+!\s/m, 'riga "! Header" nel _headers del repository');
  for (const percorso of ['/assets/css/*', '/assets/js/*', '/assets/fonts/*']) {
    const blocco = cf.split(percorso + '\n')[1].split('\n\n')[0];
    assert.match(blocco, /^\s+! Cache-Control\n\s+Cache-Control:/, `${percorso}: detach prima del Cache-Control`);
  }
  assert.doesNotMatch(cf.split('/assets/*\n')[1].split('\n\n')[0], /!/, '/assets/*: niente da staccare');
  assert.match(cf, /^https:\/\/:project\.pages\.dev\/\*\n\s+X-Robots-Tag: noindex$/m);
  assert.match(cf, /^https:\/\/:version\.:project\.pages\.dev\/\*\n\s+X-Robots-Tag: noindex$/m);

  const piattaforma = pubblicato === sorgente ? 'netlify' : pubblicato === cf ? 'cloudflare' : null;
  assert.ok(piattaforma, 'dist/_headers non e\' ne\' la versione Netlify ne\' quella Cloudflare del sorgente');
  if (process.env.CF_PAGES === '1') assert.equal(piattaforma, 'cloudflare', 'build su Cloudflare con _headers da Netlify');
  if (process.env.NETLIFY === 'true') assert.equal(piattaforma, 'netlify', 'build su Netlify con _headers da Cloudflare');
});

test('versione.json dice quale commit e quale piattaforma hanno costruito il sito', () => {
  const v = JSON.parse(readFileSync(output('versione.json'), 'utf8'));
  assert.match(v.commit, /^[0-9a-f]{7,40}$/);
  assert.ok(!Number.isNaN(Date.parse(v.data)));
  assert.deepEqual(versione({ CF_PAGES_COMMIT_SHA: 'abc', COMMIT_REF: 'def' }).fonte, 'cloudflare-pages');
  assert.deepEqual(versione({ COMMIT_REF: 'def' }), { commit: 'def', fonte: 'netlify', data: versione({ COMMIT_REF: 'def' }).data });
});

// L'informativa dei corsi: linkata dal questionario e dalla Privacy, fuori da menu e sitemap, noindex.
test('l informativa dei corsi e\' pubblicata, noindex e fuori dalla sitemap', () => {
  const page = readFileSync(output('privacy-corsi/index.html'), 'utf8');
  assert.match(page, /<meta name="robots" content="noindex"/);
  assert.match(page, /<link rel="canonical" href="https:\/\/giovannipaolofusco\.it\/privacy-corsi\/"/);
  assert.doesNotMatch(readFileSync(output('sitemap.xml'), 'utf8'), /privacy-corsi/);
  assert.match(readFileSync(output('_headers'), 'utf8'), /\/privacy-corsi\/\*\n  X-Robots-Tag: noindex/);
  assert.match(readFileSync(output('privacy/index.html'), 'utf8'), /href="\/privacy-corsi\/"/);
});
