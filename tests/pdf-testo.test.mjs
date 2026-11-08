import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

// Gira solo in locale con npm run test:pdf: pdftotext non e' fra il software
// garantito nel build di Netlify, quindi questo file resta fuori da test:build.
// Se pdftotext manca, il test fallisce: non si salta in silenzio.
const months = 'gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre'
  + '|january|february|march|april|may|june|july|august|september|october|november|december';
const day = '(?:0?[1-9]|[12][0-9]|3[01])';
const birthYear = '(?:19[4-9][0-9]|200[0-9]|201[0-2])';
const sensitive = new RegExp([
  '\\bnat[oa]\\b',
  'fiscale',
  `\\b${day}[/.-](?:0?[1-9]|1[0-2])[/.-]${birthYear}\\b`,
  `\\b${day}\\s+(?:${months})\\s+${birthYear}\\b`,
].join('|'), 'i');

test('pdftotext e\' disponibile', () => {
  execFileSync('pdftotext', ['-v'], { stdio: 'ignore' });
});

test('la ricerca riconosce i dati anagrafici e ignora le date dei certificati', () => {
  assert.match('Nato a Fondi il 09/05/2005', sensitive);
  assert.match('born on 9 May 2005', sensitive);
  assert.match('Codice Fiscale', sensitive);
  assert.doesNotMatch('Rilasciato il 17/03/2026', sensitive);
});

test('nessun PDF in dist/ ha dati anagrafici nel testo estraibile', () => {
  const pdfs = readdirSync('dist', { recursive: true })
    .map((file) => String(file).split('\\').join('/'))
    .filter((file) => file.toLowerCase().endsWith('.pdf'));
  assert.ok(pdfs.length > 0, 'nessun PDF trovato in dist/');
  const found = [];
  for (const file of pdfs) {
    const text = execFileSync('pdftotext', [join('dist', file), '-'], { encoding: 'utf8' });
    const hit = text.match(sensitive);
    if (hit) found.push(`${file}: «${hit[0]}»`);
  }
  assert.deepEqual(found, [], `dati anagrafici nel testo dei PDF:\n${found.join('\n')}`);
});
