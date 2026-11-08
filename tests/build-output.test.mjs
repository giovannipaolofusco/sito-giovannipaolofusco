import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const output = (path) => join('dist', path);
const routePages = [
  'servizi',
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
    'assets/img/logo-nav.jpg',
    'assets/img/logo-nav.webp',
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
      /<picture>\s*<source srcset="\/assets\/img\/logo-nav\.webp" type="image\/webp">\s*<img[^>]*src="\/assets\/img\/logo-nav\.jpg"[^>]*>\s*<\/picture>/,
      page,
    );
  }
});

test('il Service Worker invalida la shell precedente del rilascio', () => {
  const worker = readFileSync(output('sw.js'), 'utf8');
  assert.match(worker, /gpf-shell-v33/);
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
    'en/progetti/index.html',
    'en/certificazioni/index.html',
    'en/cv/index.html',
    'en/contatti/index.html',
    'en/link/index.html',
  ];
  const structuredDataPages = [
    'index.html',
    'servizi/index.html',
    'progetti/index.html',
    'certificazioni/index.html',
    'cv/index.html',
    'contatti/index.html',
    'en/index.html',
    'en/servizi/index.html',
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
    'forfet' + 'tario',
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

// Presidio del 05/10/2026: ogni PDF pubblicato e' stato guardato da una persona.
// Il registro si aggiorna a mano, mai da uno script. Copre anche i PDF fatti di
// sole immagini, dove npm run test:pdf non trova testo da leggere.
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

// Presidio del 05/10/2026: la sezione 6bis aveva sfalsato indice e testo.
// Il test dice se un rimando punta a una sezione esistente, non se e' quella giusta.
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

// Presidio del 27/09/2026: le stesse pagine sono elencate a mano in piu' file
// (sitemap, shell del Service Worker, redirect da .html, llms.txt) e la CSP sta
// sia in _headers sia in ogni pagina. Nessun controllo segnalava un elenco
// dimenticato: /privacy/ mancava dalla shell e llms.txt usava URL senza barra.
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
