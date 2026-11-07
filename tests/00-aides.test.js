// Aides partagées par les tests (chargé en premier : ordre alphabétique). Aucun test ici.
// fromPreset : chargement d'un ancien build prédéfini (1.x), recopié ici depuis 02-calc.js (supprimé en 2.0.0) pour les codes figés.
globalThis.fromPreset = p => { const b = blankBuild(p.name); for (const k of ['lvl', 'exp', 'flame', 'upg']) if (p[k] != null) b[k] = p[k];
  b.gear = {...p.gear}; b.gem = {...(p.gem || {})}; b.sk = {...p.sk}; b.pip = {...p.pip}; delete b.pn; return normalize(b); };
// Stockage du navigateur simulé le temps d'une fonction
globalThis.fakeLs = (get, set) => ({getItem: get, setItem: set || (() => {})});
globalThis.withLs = (ls, fn) => { const keep = globalThis.localStorage; globalThis.localStorage = ls; try { return fn(); } finally { globalThis.localStorage = keep; } };
// Arbre relié : aucun nœud acquis hors de portée d'un départ
globalThis.lostOf = b => TOPO.N.filter(n => owned(b, n) && !reach(b).has(n));
// État de l'interface gardé et rendu après une fonction (builds, onglet, vue…)
globalThis.keepUi = fn => { const keep = [JSON.parse(JSON.stringify(builds)), cur, compare, area, onlyOn, query, view];
  try { return fn(); } finally { [builds, cur, compare, area, onlyOn, query, view] = [keep[0].map(x => fitGoals(normalize(Object.assign(blankBuild(), x)))), ...keep.slice(1)]; } };
// 2.3.0 : niveau et exploration qui donnent B points ; messages (toast) recueillis le temps d'une fonction
globalThis.ptsAt = B => { const lv = Math.min(50, 1 + Math.floor(B / 2)); return [lv, B - 2 * (lv - 1)]; };
globalThis.quiet = fn => { const keep = globalThis.toast, msgs = []; globalThis.toast = t => msgs.push(t); try { return fn(msgs); } finally { globalThis.toast = keep; } };
