// Régénère src/js/01-tree-data.js (tracé réel de l'arbre 1.0) depuis le planificateur PinDrop.
// Usage : node scripts/tree-from-pindrop.mjs        (Node ≥ 18, aucune dépendance, réseau requis)
// Le bundle JS de https://pindrop.gg/enshrouded/skill-tree contient deux JSON.parse('…') : les noms des nœuds,
// et le tracé (nodes : id, type, classe, coût, rangs, x, y ; links : paires non orientées), extraits par PinDrop
// des fichiers du serveur dédié Enshrouded. Données distantes = non fiables : lues comme JSON, jamais exécutées.
import {readFileSync, writeFileSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const PAGE = 'https://pindrop.gg/enshrouded/skill-tree';
const UA = 'Mozilla/5.0 (X11; Linux x86_64) forge-embervale-tree-sync';
const AT = {Strength: 'str', Constitution: 'con', Endurance: 'end', Dexterity: 'dex', Intelligence: 'int', Spirit: 'spi'};
const fail = m => { console.error('✗ ' + m); process.exit(1); };
// Texte distant recopié en commentaire : liste blanche de caractères (impossible de fermer le commentaire ou d'injecter du code)
const safe = s => String(s ?? '?').replace(/[^\p{L}\p{N} .,;:()#_'+\/-]/gu, '').slice(0, 300);
const getOpt = async u => { try { const r = await fetch(u, {headers: {'user-agent': UA}, signal: AbortSignal.timeout(30000)}); return r.ok ? r.text() : ''; } catch { return ''; } };
const get = async u => { const r = await fetch(u, {headers: {'user-agent': UA}, signal: AbortSignal.timeout(30000)}); if (!r.ok) fail(`${u} : HTTP ${r.status}`); return r.text(); };

// Chaîne JS entre apostrophes → texte (sans eval)
function unescapeJs(s) {
  let o = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c !== '\\') { o += c; continue; }
    const n = s[++i];
    if (n === 'u' && s[i + 1] === '{') { const e = s.indexOf('}', i); if (e < 0) throw new Error('\\u{ non fermé'); o += String.fromCodePoint(parseInt(s.slice(i + 2, e), 16)); i = e; }
    else if (n === 'u') { o += String.fromCharCode(parseInt(s.slice(i + 1, i + 5), 16)); i += 4; }
    else if (n === 'x') { o += String.fromCharCode(parseInt(s.slice(i + 1, i + 3), 16)); i += 2; }
    else if (n === '\n') { /* continuation de ligne */ }
    else o += {n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0'}[n] ?? n;
  }
  return o;
}
const jsonModules = js => [...js.matchAll(/JSON\.parse\('((?:[^'\\]|\\.)*)'\)/gs)].map(m => { try { return JSON.parse(unescapeJs(m[1])); } catch { return null; } }).filter(Boolean);

// 1. Trouver le bundle qui porte le tracé
const html = await get(PAGE);
const chunks = [...new Set(html.match(/\/_next\/static\/[^"'\s]+?\.js(?![a-z0-9])/gi) || [])];
let tree, names, bundle;
for (const c of chunks) {
  const js = await getOpt(new URL(c, PAGE).href);
  if (!js.includes('"links":[[')) continue;
  for (const m of jsonModules(js)) {
    if (Array.isArray(m.nodes) && Array.isArray(m.links)) tree = m;
    else if (m.nodes && !Array.isArray(m.nodes) && typeof m.nodes === 'object') names = m.nodes;
  }
  if (tree && names) { bundle = c; break; }
}
if (!tree || !names) fail('tracé introuvable dans les bundles de ' + PAGE);

// 2. Compétences et attributs du simulateur
const ctx = vm.createContext({});
const {SK, PIPS} = vm.runInContext(readFileSync(join(root, 'src/js/01-data.js'), 'utf8') + ';({SK,PIPS})', ctx);
const norm = s => String(s).toLowerCase().replace(/[’‘]/g, "'").trim();
const byEn = new Map(SK.map(s => [norm(s.en), s]));
const AREA = {N: 'core', W: 'war', R: 'rng', M: 'mag'};

// 3. Clé de chaque nœud : '*' départ, '@attr' attribut +1, sinon id de compétence
const seen = new Set(), warn = [];
const nodes = tree.nodes.map(g => {
  if (!Number.isInteger(g.id) || g.id < 0 || g.id > 0xffffffff || !Number.isFinite(g.x) || !Number.isFinite(g.y)) fail('nœud mal formé : ' + JSON.stringify(g).slice(0, 120));
  let key;
  if (g.t === 'root') key = '*';
  else if (g.t === 'attribute' && g.attr) { if (!Object.hasOwn(AT, g.attr)) fail('attribut inconnu : ' + safe(g.attr)); key = '@' + AT[g.attr]; }
  else {
    const nm = names[String(g.id)]?.name, s = byEn.get(norm(nm));
    if (!s) fail(`nœud ${g.id} « ${nm} » : aucune compétence de SK ne porte ce nom anglais`);
    if (seen.has(s.id)) fail('compétence en double dans le tracé : ' + s.id);
    seen.add(s.id); key = s.id;
    if (g.cost !== s.cost) warn.push(`${s.id} : coût ${s.cost} dans SK, ${g.cost} dans le jeu`);
    if (g.max !== s.max) warn.push(`${s.id} : rangs ${s.max} dans SK, ${g.max} dans le jeu`);
    if (AREA[g.c] !== s.area) warn.push(`${s.id} : zone ${s.area} dans SK, ${AREA[g.c]} dans le jeu`);
  }
  return {gid: g.id, key, x: Math.round(g.x), y: Math.round(g.y), cost: key === '*' ? 0 : key[0] === '@' ? 1 : g.cost};
});
const missing = SK.filter(s => !seen.has(s.id)).map(s => s.id);
if (missing.length) fail('compétences de SK absentes du tracé : ' + missing.join(', '));
const roots = nodes.filter(n => n.key === '*');
if (roots.length !== 12) fail(roots.length + ' départs au lieu de 12');
for (const [k, , , , max] of PIPS) { const n = nodes.filter(x => x.key === '@' + k).length; if (n !== max) fail(`${n} nœuds ${k} au lieu de ${max} (PIPS)`); }

// 4. Liaisons
const byGid = new Map(nodes.map(n => [n.gid, n]));
for (const [a, b] of tree.links) if (!byGid.has(a) || !byGid.has(b) || a === b) fail('liaison invalide : ' + a + '-' + b);
const nb = new Map(nodes.map(n => [n, []]));
for (const [a, b] of tree.links) { nb.get(byGid.get(a)).push(byGid.get(b)); nb.get(byGid.get(b)).push(byGid.get(a)); }

// 5. Coût d'accès depuis les départs (Dijkstra) → ordre des nœuds d'attribut = index utilisé par normalize
const dist = new Map(roots.map(r => [r, 0])), Q = [...roots];
while (Q.length) {
  Q.sort((p, q) => dist.get(p) - dist.get(q)); const u = Q.shift();
  for (const v of nb.get(u)) { const d = dist.get(u) + v.cost; if (!dist.has(v) || d < dist.get(v)) { dist.set(v, d); if (!Q.includes(v)) Q.push(v); } }
}
const orphans = nodes.filter(n => !dist.has(n));
if (orphans.length) fail('nœuds non reliés aux départs : ' + orphans.map(n => n.key).join(', '));
const attrOrder = PIPS.map(p => p[0]);
const skOrder = new Map(SK.map((s, i) => [s.id, i]));
const rank = n => n.key === '*' ? [0, n.gid] : n.key[0] === '@' ? [1, attrOrder.indexOf(n.key.slice(1)), dist.get(n), n.gid] : [2, skOrder.get(n.key)];
nodes.sort((p, q) => { const a = rank(p), b = rank(q); for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i]; return 0; });
const idx = new Map(nodes.map((n, i) => [n.gid, i]));
const links = tree.links.map(([a, b]) => [idx.get(a), idx.get(b)].sort((p, q) => p - q)).sort((p, q) => p[0] - q[0] || p[1] - q[1]);

// 6. Écriture
const meta = tree._meta || {};
const build = safe((String(meta.source || '').match(/build \d+[^)]*/) || ['build inconnu'])[0]);
const date = new Date().toISOString().slice(0, 10);
const out = `/* Tracé réel de l'arbre de compétences 1.0 — fichier GÉNÉRÉ par scripts/tree-from-pindrop.mjs : ne pas éditer à la main.
   Source : ${PAGE} (bundle ${safe(bundle.split('/').pop())}), relevé le ${date}.
   Extrait par PinDrop des fichiers du jeu : ${safe(meta.source)}.${meta.patch1011 ? '\n   ' + safe(meta.patch1011) + '.' : ''}
   nodes : [identifiant du nœud dans le jeu (base 36), clé, x, y] ; clé = id de compétence (SK), '@str'… = nœud d'attribut +1,
   '*' = départ (Étincelle, gratuit). Coordonnées du jeu, y vers le bas (comme PinDrop). links : liaisons non orientées (indices de nodes).
   Nœuds d'attribut rangés, par attribut, du moins cher au plus cher d'accès depuis les départs, puis par identifiant : cet ordre sert d'index. */
const TREE={build:${JSON.stringify(build)},date:'${date}',nodes:[
${nodes.map(n => `[${JSON.stringify(n.gid.toString(36))},${JSON.stringify(n.key)},${n.x},${n.y}]`).join(',\n')}
],links:[
${links.map(l => `[${l[0]},${l[1]}]`).join(',').replace(/((?:\[\d+,\d+\],){12})/g, '$1\n')}
]};
`;
writeFileSync(join(root, 'src/js/01-tree-data.js'), out);
console.log(`✓ src/js/01-tree-data.js : ${nodes.length} nœuds (12 départs, ${nodes.filter(n => n.key[0] === '@').length} attributs, ${seen.size} compétences), ${links.length} liaisons — ${build}`);
for (const w of warn) console.log('  ⚠ ' + w);
