// Assemble src/ en :
//   dist/index.html            site complet (GitHub Pages, ou ouverture directe dans le navigateur)
//   dist/forge-embervale.html  même page au format Artifact claude.ai (sans doctype/html/head/body)
// Usage : node scripts/build.mjs        (aucune dépendance)
import {readFileSync, writeFileSync, readdirSync, mkdirSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = p => join(root, 'src', p);
const MAX = 16 * 1024 * 1024; // limite Artifact : 16 Mo
// Icône d'onglet : losange de braise (aucun fichier externe)
const ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#171b24"/><path d="M16 4l9 12-9 12-9-12z" fill="#f08a48"/><path d="M16 11l4 5-4 5-4-5z" fill="#fde7d6"/></svg>';

export function jsFiles() {
  return readdirSync(src('js')).filter(f => /^\d\d-.*\.js$/.test(f)).sort();
}

export function build({quiet = false} = {}) {
  const page = readFileSync(src('page.html'), 'utf8');
  const css = readFileSync(src('styles.css'), 'utf8');
  const scripts = jsFiles().map(f => {
    const code = readFileSync(src('js/' + f), 'utf8');
    if (/<\/script/i.test(code)) throw new Error(`${f} contient "</script" : la page serait cassée`);
    return `<script>\n${code}</script>`;
  }).join('\n');
  for (const m of ['<!-- INLINE:CSS -->', '<!-- INLINE:JS -->'])
    if (!page.includes(m)) throw new Error(`Marqueur ${m} absent de src/page.html`);
  // Pas de <!doctype>, <html>, <head> ni <body> : la plateforme Artifact ajoute le squelette à la publication.
  const out = page.replace('<!-- INLINE:CSS -->', () => `<style>\n${css}</style>`).replace('<!-- INLINE:JS -->', () => scripts);
  if (/<!doctype|<html[\s>]|<body[\s>]|<head[\s>]/i.test(out)) throw new Error('La page ne doit pas contenir doctype/html/head/body');
  if (Buffer.byteLength(out) > MAX) throw new Error('Page > 16 Mo');
  mkdirSync(join(root, 'dist'), {recursive: true});
  writeFileSync(join(root, 'dist/forge-embervale.html'), out);
  // Site web autonome (GitHub Pages, ouverture locale) : vrai document HTML, en-tête dans <head>.
  const headPart = page.slice(0, page.indexOf('<!-- INLINE:CSS -->')).trim();
  const bodyPart = page.slice(page.indexOf('<!-- INLINE:CSS -->') + '<!-- INLINE:CSS -->'.length).replace('<!-- INLINE:JS -->', () => scripts).trim();
  const site = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="Arbre de compétences Enshrouded 1.0 : choisissez un objectif, le simulateur place vos points selon votre niveau et votre Flamme, et explique pourquoi.">
<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(ICON)}">
${headPart}
<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
<style>
${css}</style>
</head>
<body>
${bodyPart}
</body>
</html>
`;
  writeFileSync(join(root, 'dist/index.html'), site);
  if (!quiet) console.log(`dist/index.html            site (GitHub Pages)\ndist/forge-embervale.html  ${(Buffer.byteLength(out) / 1024).toFixed(1)} Ko, format Artifact (${jsFiles().length} scripts)`);
  return out;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) build();
