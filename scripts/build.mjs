import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, join, relative } from 'node:path';
import CleanCSS from 'clean-css';
import { minify as minifyHtml } from 'html-minifier-terser';
import sharp from 'sharp';
import { minify as minifyJavaScript } from 'terser';

const sourceRoot = process.cwd();
const outputRoot = join(sourceRoot, 'dist');
const routePages = ['servizi', 'progetti', 'certificazioni', 'cv', 'contatti', 'privacy', 'link'];
const publicFiles = [
  '_headers',
  '_redirects',
  'badges-extra.json',
  'badges.json',
  'contatto.vcf',
  'CV-Giovanni-Paolo-Fusco-EN.pdf',
  'CV-Giovanni-Paolo-Fusco.pdf',
  'favicon.ico',
  'cc8cc868c178b5f8fd031e3e98ff5cd5.txt', // chiave IndexNow (CLAUDE.md §6.14): nome e contenuto coincidono
  'llms.txt',
  'robots.txt',
  'site.webmanifest',
  'sitemap.xml',
  'sw.js',
];
const publicDirectories = ['.well-known', 'assets', 'file', 'presentazione-pacchetti'];

async function ensureParent(file) {
  await mkdir(dirname(file), { recursive: true });
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return listFiles(path);
    return [path];
  }));
  return files.flat();
}

function withNavigationLogoPicture(html) {
  return html.replace(
    /<img(?=[^>]*\bsrc="\/assets\/img\/logo-nav\.jpg")[^>]*>/g,
    (image) => `<picture><source srcset="/assets/img/logo-nav.webp" type="image/webp">${image}</picture>`,
  );
}

async function writeHtml(source, destination) {
  const sourceHtml = await readFile(source, 'utf8');
  const html = await minifyHtml(withNavigationLogoPicture(sourceHtml), {
    caseSensitive: true,
    collapseWhitespace: true,
    keepClosingSlash: true,
    minifyCSS: false,
    minifyJS: false,
    removeComments: true,
    removeRedundantAttributes: false,
  });
  await ensureParent(destination);
  await writeFile(destination, html);
}

async function minifyCss(file) {
  const source = await readFile(file, 'utf8');
  const result = new CleanCSS({ level: 2 }).minify(source);
  if (result.errors.length > 0) throw new Error(`${file}: ${result.errors.join('; ')}`);
  await writeFile(file, result.styles);
}

async function minifyJs(file) {
  const source = await readFile(file, 'utf8');
  const isModule = /^(?:import|export)\b/m.test(source);
  const result = await minifyJavaScript(source, {
    compress: true,
    format: { comments: false },
    mangle: true,
    module: isModule,
  });
  if (result.error) throw result.error;
  await writeFile(file, result.code);
}

async function minifyOutputAssets() {
  for (const file of await listFiles(outputRoot)) {
    const extension = extname(file).toLowerCase();
    const projectPath = relative(outputRoot, file);
    if (extension === '.css') await minifyCss(file);
    if (
      extension === '.js'
      && !projectPath.startsWith('assets/libs/')
      && !projectPath.endsWith('.min.js')
    ) await minifyJs(file);
  }
}

async function createWebpVariants() {
  const imageRoot = join(outputRoot, 'assets', 'img');
  for (const file of await listFiles(imageRoot)) {
    const extension = extname(file).toLowerCase();
    if (!['.jpg', '.jpeg', '.png'].includes(extension)) continue;
    const destination = file.slice(0, -extension.length) + '.webp';
    await sharp(file).webp({ quality: 82 }).toFile(destination);
  }
}

async function copyPublicFiles() {
  for (const directory of publicDirectories) {
    await cp(join(sourceRoot, directory), join(outputRoot, directory), { recursive: true });
  }
  for (const file of publicFiles) {
    await ensureParent(join(outputRoot, file));
    await cp(join(sourceRoot, file), join(outputRoot, file));
  }
}

async function buildPages() {
  await writeHtml(join(sourceRoot, 'index.html'), join(outputRoot, 'index.html'));
  await writeHtml(join(sourceRoot, '404.html'), join(outputRoot, '404.html'));
  await writeHtml(join(sourceRoot, 'en', 'index.html'), join(outputRoot, 'en', 'index.html'));
  await writeHtml(join(sourceRoot, 'en', '404.html'), join(outputRoot, 'en', '404.html'));

  for (const route of routePages) {
    await writeHtml(join(sourceRoot, `${route}.html`), join(outputRoot, route, 'index.html'));
    await writeHtml(join(sourceRoot, 'en', `${route}.html`), join(outputRoot, 'en', route, 'index.html'));
  }

  for (const page of ['index.html', 'statico/index.html', 'fullstack/index.html']) {
    await writeHtml(
      join(sourceRoot, 'presentazione-pacchetti', page),
      join(outputRoot, 'presentazione-pacchetti', page),
    );
  }
}

async function main() {
  await rm(outputRoot, { force: true, recursive: true });
  await mkdir(outputRoot, { recursive: true });
  await copyPublicFiles();
  await buildPages();
  await createWebpVariants();
  await minifyOutputAssets();
}

await main();
