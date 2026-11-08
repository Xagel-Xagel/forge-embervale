// Optimiseur HORS LIGNE des objectifs marqués `opt` (2.4.0 : hybrides, Exploration, Récolte) : ordre des éléments dans chaque étape.
// Critère (QCM du 2026-11-07) : combo complet au MOINDRE COÛT à 212 points (niveau 50, exploration 114, Flamme 11), puis, à coût égal,
// l'AVANCÉE LA PLUS RAPIDE : aire = somme des points d'étapes acquis (wpts) aux budgets 0, 4, 8 … 212 (Flamme 11).
// L'ordre des étapes (les priorités) n'est jamais changé, ni leur contenu : seul l'ordre des éléments à l'intérieur d'une étape bouge.
// Recherche : descente étape par étape — toutes les permutations jusqu'à 4 éléments, sinon le déplacement d'un élément —, répétée tant
// qu'elle gagne. Résultat = meilleur trouvé, pas un optimum prouvé. Le calcul est lourd (≈ 1 min) : il ne tourne jamais dans la page.
// N'écrit rien : imprime l'ordre à recopier dans src/js/06-objectifs.js (tests/objectifs.test.js fige ensuite le coût et l'aire).
// Usage : node scripts/optimiser-objectifs.mjs [id…] [--check]
//   --check : code de sortie 1 si un ordre meilleur que celui des données existe (à lancer après un patch du jeu ou `npm run tree`).
import {readFileSync, readdirSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// Données et moteur seulement (01 à 06) : pas d'interface, pas de faux DOM. Les `const` de ces scripts restent visibles d'ici (portée globale).
for (const f of readdirSync(join(root, 'src/js')).filter(f => /^0\d-.*\.js$/.test(f)).sort())
  vm.runInThisContext(readFileSync(join(root, 'src/js', f), 'utf8'), {filename: 'src/js/' + f});

const args = process.argv.slice(2), check = args.includes('--check'), ids = args.filter(a => !a.startsWith('--'));
const todo = GOALS.filter(g => g.opt && (!ids.length || ids.includes(g.id)));
for (const id of ids) if (!GOALS.some(g => g.id === id && g.opt)) { console.error(`Objectif inconnu ou non optimisé : ${id}`); process.exit(2); }

const TMP = '__optimiseur';
const ptsAt = B => { const lv = Math.min(50, 1 + Math.floor(B / 2)); return [lv, B - 2 * (lv - 1)]; };
// Moteur réel (runCombo, 06-objectifs.js) sur une copie de l'objectif dont les étapes sont réordonnées ; aucun cache.
const run = (g, steps, B) => { GOALI[TMP] = {...g, id: TMP, steps}; return runCombo([[TMP, 'p']], ...ptsAt(B), 11, null); };
const score = (g, steps) => { const cost = run(g, steps, 212).spent; let area = 0; for (let B = 0; B <= 212; B += 4) area += run(g, steps, B).wpts; return {cost, area}; };
const better = (a, b) => a.cost < b.cost || (a.cost === b.cost && a.area > b.area);
const perms = a => a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map(p => [x, ...p]));
const moves = ks => { if (ks.length <= 4) return perms(ks); const o = [];
  for (let i = 0; i < ks.length; i++) for (let j = 0; j < ks.length; j++) if (i !== j) { const q = [...ks]; const [x] = q.splice(i, 1); q.splice(j, 0, x); o.push(q); }
  return o; };
const withOrder = (steps, i, ord) => steps.map((s, j) => j === i ? [s[0], s[1], Object.fromEntries(ord.map(k => [k, s[2][k]]))] : s);
const items = g => g.steps.reduce((a, [, , it]) => a + Object.entries(it).reduce((x, [k, v]) => x + (isAttr(k) ? v : SKI[k].cost * v), 0), 0);

function optimise(g) {
  let cur = g.steps, best = score(g, cur), tried = 0;
  for (let pass = 0, gain = true; gain && pass < 8; pass++) { gain = false;
    for (let i = 0; i < cur.length; i++) { const ks = Object.keys(cur[i][2]); if (ks.length < 2) continue;
      for (const ord of moves(ks)) { const st = withOrder(cur, i, ord); tried++;
        const cost = run(g, st, 212).spent; if (cost > best.cost) continue; // l'aire seulement si le coût tient
        const s = score(g, st); if (better(s, best)) { cur = st; best = s; gain = true; } } } }
  return {steps: cur, best, tried};
}

let worse = 0; const t0 = Date.now();
for (const g of todo) {
  const n = items(g), now = score(g, g.steps), r = optimise(g), pct = a => (100 * a / (54 * n)).toFixed(1).replace('.', ',') + ' %';
  const same = !better(r.best, now);
  console.log(`\n${g.id} — ${g.n} : éléments ${n} pts`);
  console.log(`  données   : 212 pts → ${now.cost} pts (liaisons ${now.cost - n}) · aire ${now.area} (${pct(now.area)})`);
  console.log(`  meilleur  : 212 pts → ${r.best.cost} pts (liaisons ${r.best.cost - n}) · aire ${r.best.area} (${pct(r.best.area)}) · ${r.tried} ordres essayés`);
  if (same) console.log('  → l\'ordre des données est le meilleur trouvé');
  else { worse++; console.log('  → ordre à recopier dans src/js/06-objectifs.js :');
    r.steps.forEach(([t, , it], i) => console.log(`    ${i + 1}. ${t} : {${Object.entries(it).map(([k, v]) => k + ':' + v).join(',')}}`)); }
}
delete GOALI[TMP];
console.log(`\n${todo.length} objectif(s), ${((Date.now() - t0) / 1000).toFixed(0)} s` + (worse ? ` — ${worse} ordre(s) à mettre à jour` : ' — données à jour'));
if (check && worse) process.exit(1);
