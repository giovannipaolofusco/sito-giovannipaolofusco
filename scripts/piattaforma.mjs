// Differenze fra Netlify e Cloudflare Pages, provate con wrangler pages dev 4.156.0 e @netlify/headers-parser 10.1.1.
import { execFileSync } from 'node:child_process';

// Cloudflare Pages imposta CF_PAGES=1 nell'ambiente di build
// (developers.cloudflare.com/pages/configuration/build-configuration/).
export const suCloudflare = (ambiente = process.env) => ambiente.CF_PAGES === '1';

// Blocchi che valgono solo su Cloudflare: gli indirizzi *.pages.dev e le anteprime non vanno
// indicizzati (esempio ufficiale della pagina "Headers"). Netlify NON deve vederli: il suo
// parser prende "https://..." per un header e aggancia il noindex al blocco precedente.
const SOLO_CLOUDFLARE = `
# Solo Cloudflare Pages (aggiunto dal build con CF_PAGES=1): pages.dev e anteprime fuori indice.
https://:project.pages.dev/*
  X-Robots-Tag: noindex

https://:version.:project.pages.dev/*
  X-Robots-Tag: noindex
`;

function blocchi(testo) {
  const righe = testo.split('\n');
  const out = [];
  let corrente = null;
  righe.forEach((riga, i) => {
    if (/^\S/.test(riga) && !riga.startsWith('#')) {
      corrente = { percorso: riga.trim(), riga: i, header: [] };
      out.push(corrente);
    } else if (corrente && /^\s+\S/.test(riga)) {
      corrente.header.push({ nome: riga.trim().split(':')[0].toLowerCase(), riga: i });
    }
  });
  return { righe, blocchi: out };
}

function copre(generale, specifico) {
  if (generale === specifico || !generale.endsWith('*')) return false;
  return specifico.startsWith(generale.slice(0, -1));
}

// Su Cloudflare le regole che corrispondono alla stessa richiesta si sommano, e due
// Cache-Control diventano un unico valore contraddittorio ("max-age=86400, ..., max-age=0").
// Prima del Cache-Control di un blocco piu' specifico si stacca quello ereditato con
// "! Cache-Control" (pagina "Headers", sezione sul detach). Netlify scarta quella riga,
// quindi si aggiunge solo nel file che va su Cloudflare.
export function headersPerCloudflare(testo) {
  const { righe, blocchi: elenco } = blocchi(testo);
  const inserimenti = new Set();
  for (const b of elenco) {
    const cache = b.header.find((h) => h.nome === 'cache-control');
    if (!cache) continue;
    const ereditato = elenco.some((a) => a !== b && copre(a.percorso, b.percorso) && a.header.some((h) => h.nome === 'cache-control'));
    if (ereditato) inserimenti.add(cache.riga);
  }
  const risultato = righe.flatMap((riga, i) => (inserimenti.has(i) ? ['  ! Cache-Control', riga] : [riga]));
  return risultato.join('\n').replace(/\s*$/, '\n') + SOLO_CLOUDFLARE;
}

// Quale commit e' online: Cloudflare, poi Netlify, poi git locale.
export function versione(ambiente = process.env, adesso = new Date()) {
  let commit = ambiente.CF_PAGES_COMMIT_SHA || ambiente.COMMIT_REF || '';
  let fonte = ambiente.CF_PAGES_COMMIT_SHA ? 'cloudflare-pages' : ambiente.COMMIT_REF ? 'netlify' : 'git';
  if (!commit) {
    try {
      commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    } catch {
      commit = 'sconosciuto';
      fonte = 'nessuna';
    }
  }
  return { commit, fonte, data: adesso.toISOString() };
}
