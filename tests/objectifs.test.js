// Objectifs (2.0.0) : combo imposé selon les points et la Flamme, objectif secondaire, verrou, ajouts de l'utilisateur, explication.
const lvlExp = B => { const lv = Math.min(50, 1 + Math.floor(B / 2)); return [lv, B - 2 * (lv - 1)]; };
const asB = c => ({sk: c.sk, pn: c.pn, pip: c.pip});

test('chaque objectif, budgets 0 à 212, Flammes 1, 4 et 11 : relié, dans le budget, et jamais de recul quand les points montent', () => {
  for (const g of GOALS) for (const [fl, step] of [[11, 4], [4, 10], [1, 10]]) { let prev = null;
    for (let B = 0; B <= 212; B += step) { const c = combo(g.id, null, ...lvlExp(B), fl), lbl = `${g.id} · ${B} pts · Flamme ${fl}`;
      assert.ok(c.spent <= B, lbl + ' : ' + c.spent + ' dépensés'); assert.equal(c.spent, spentPoints(asB(c)), lbl);
      assert.equal(lostOf(asB(c)).length, 0, lbl + ' : non relié');
      for (const k in c.want.sk) assert.ok((c.sk[k] || 0) >= c.want.sk[k], lbl + ' : ' + k);
      if (prev) { for (const k in prev.sk) assert.ok((c.want.sk[k] || 0) >= prev.sk[k], lbl + ' : ' + k + ' perdu');
        for (const k in prev.pip) assert.ok((c.want.pip[k] || 0) >= prev.pip[k], lbl + ' : ' + k + ' perdu'); }
      prev = {sk: {...c.want.sk}, pip: {...c.want.pip}}; } }
});

test('coût du combo complet à 212 points, Flamme 11 (mesuré le 2026-11-07) ; toutes les étapes complètes', () => {
  const COST = {tank: 142, sword: 110, barb: 105, archer: 104, assassin: 91, mageCrit: 98, fire: 104, ice: 109, storm: 102, necro: 110, healer: 108, paladin: 111};
  Object.assign(COST, {battlemage: 57, elemArcher: 83, swordBow: 90, explore: 82, harvest: 25}); // 2.4.0 : objectifs optimisés, mesurés le 2026-11-08 (scripts/optimiser-objectifs.mjs)
  COST.lifesteal = 82; // 2.6.0 : Vol de vie, mesuré le 2026-11-14
  COST.lifestealFull = 212; // 2.7.0 : Vol de vie complet, tous les points, mesuré le 2026-11-14
  for (const g of GOALS) { const c = combo(g.id, null, 50, 114, 11);
    assert.equal(c.spent, COST[g.id], g.id); assert.ok(c.rep[0].steps.every(s => s.st === 'ok'), g.id + ' : étape incomplète');
    for (const [, , items] of g.steps) for (const [k, v] of Object.entries(items)) assert.equal(isAttr(k) ? c.want.pip[k] : c.want.sk[k], v, g.id + ' : ' + k);
    assert.equal(c.links, c.spent - g.steps.reduce((a, [, , it]) => a + Object.entries(it).reduce((x, [k, v]) => x + (isAttr(k) ? v : SKI[k].cost * v), 0), 0), g.id + ' : liaisons'); }
  const t = combo('tank', 'healer', 50, 114, 11);
  assert.deepEqual([t.spent, t.left, t.rep[0].pts, t.rep[1].pts], [185, 27, 142, 43]);
});

test('objectif = ancien preset tel quel : chaque compétence et attribut des étapes est dans le code figé du preset, au même rang', () => {
  const P = {tank: 'Sadi Fourbe', sword: 'Guerrier épée et bouclier', barb: 'Barbare deux mains', archer: 'Rôdeur archer', assassin: 'Assassin aux dagues', mageCrit: 'Mage critique (baguette)',
    fire: 'Sorcier de feu', ice: 'Mage de glace (contrôle)', storm: 'Mage de foudre (baguette)', necro: 'Nécromancien invocateur', healer: 'Soigneur de groupe', paladin: 'Paladin soigneur'};
  assert.deepEqual(GOALS.filter(x => !x.opt).map(x => x.id), Object.keys(P), 'les 12 objectifs d\'origine (les objectifs optimisés de la 2.4.0 ne viennent pas d\'un preset)');
  for (const g of GOALS.filter(x => !x.opt)) { const d = decode(PRESET_CODES.find(x => x[0] === P[g.id])[1]), it = {};
    for (const [, , items] of g.steps) Object.assign(it, items);
    for (const [k, v] of Object.entries(it)) if (isAttr(k)) assert.ok(d.pip[k] >= v, g.id + ' : ' + k); else assert.equal(d.sk[k], v, g.id + ' : ' + k);
    for (const k in d.sk) if (d.sk[k] > 1) assert.ok(k in it, g.id + ' : ' + k + ' (rang ' + d.sk[k] + ') absent des étapes'); }
});

test('secondaire : le principal passe d\'abord, à l\'identique ; le secondaire prend les points restants, sans dépasser', () => {
  for (const [p, s] of [['tank', 'healer'], ['mageCrit', 'storm'], ['archer', 'assassin'], ['paladin', 'sword'], ['harvest', 'archer'], ['battlemage', 'storm']]) for (const B of [40, 120, 212]) {
    const a = combo(p, null, ...lvlExp(B), 11), c = combo(p, s, ...lvlExp(B), 11);
    assert.deepEqual(c.rep[0], a.rep[0], `${p} + ${s} à ${B}`); assert.ok(c.spent <= B && c.spent >= a.spent, `${p} + ${s} à ${B}`);
    assert.equal(c.rep[1].id, s); assert.equal(lostOf(asB(c)).length, 0); }
  assert.equal(combo('tank', 'tank', 50, 114, 11).rep.length, 1, 'secondaire = principal : ignoré');
});

test('Flamme 1 : les nœuds « +1 tous les 2 niveaux de Flamme » sont sautés et signalés, le reste de l\'étape est acheté', () => {
  const c = combo('mageCrit', null, 50, 114, 1), st = c.rep[0].steps.find(s => 'exalted' in s.items);
  assert.ok(!c.sk.exalted || !c.want.sk.exalted, 'Exalté acheté à la Flamme 1'); assert.deepEqual(st.skip, ['exalted']); assert.equal(st.st, 'ok'); assert.equal(c.want.pip.con, 2);
  assert.ok(combo('mageCrit', null, 50, 114, 2).want.sk.exalted, 'Flamme 2 : Exalté acheté');
});

test('explication : étape en partie ou pas encore, avec les points qui manquent et l\'élément visé', () => {
  for (const g of GOALS) for (const B of [0, 6, 30]) { if (B >= combo(g.id, null, 50, 114, 11).spent) continue; // Récolte (2.4.0) : complète dès 25 pts
    const c = combo(g.id, null, ...lvlExp(B), 11), st = c.rep[0].steps;
    const i = st.findIndex(s => s.st !== 'ok'); assert.ok(i >= 0, g.id + ' complet avec ' + B + ' pts');
    assert.ok(st[i].miss > 0 && st[i].miss <= 99 && st[i].at in st[i].items, g.id + ' à ' + B + ' : manque');
    assert.ok(st.slice(i + 1).every(s => s.st === 'no' && !s.miss), g.id + ' : étapes suivantes'); }
  const z = combo('tank', null, 1, 0, 11); assert.equal(z.spent, 0); assert.equal(z.rep[0].steps[0].st, 'no');
});

test('verrou : un nœud imposé ne se retire pas ; un rang ajouté au-dessus se retire ; arbre libre : tout se retire', () => {
  const b = goalBuild('mageCrit', null), toasts = []; const keepT = globalThis.toast; globalThis.toast = t => toasts.push(t);
  try {
    assert.equal(remRank(b, 'wizard'), false); assert.equal(b.sk.wizard, 3); assert.match(toasts.pop(), /Imposé par l'objectif « Mage critique \(baguette\) »/);
    const pip = TOPO.pips.find(p => b.pn[p.id]); assert.equal(remPipNode(b, pip), false); assert.ok(b.pn[pip.id]);
    assert.equal(remPip(b, 'int'), false, 'tous les nœuds INT sont imposés');
    // ajout au-dessus du combo, puis retrait
    const n = TOPO.N.find(x => x.kind === 'skill' && !b.sk[x.id] && canBuy(b, x)); assert.ok(addRank(b, n.id)); assert.equal(remRank(b, n.id), true); assert.ok(!b.sk[n.id]);
    setGoals(b, null, null); assert.deepEqual(b.obj, []); assert.equal(remRank(b, 'wizard'), true); assert.equal(b.sk.wizard, 2);
  } finally { globalThis.toast = keepT; }
});

test('ajouts : gardés quand le secondaire ou les réglages changent (s\'ils restent reliés), retirés quand le principal change', () => {
  const b = goalBuild('tank', null), R = reach(b), n = TOPO.N.find(x => x.kind === 'skill' && !b.sk[x.id] && canBuy(b, x, R) && x.sk.max === 1);
  assert.ok(n); addRank(b, n.id); const spent = spentPoints(b);
  setGoals(b, 'tank', 'healer'); assert.equal(b.sk[n.id], 1, 'secondaire changé : ajout perdu'); assert.ok(spentPoints(b) > spent);
  const A = addsOf(b); b.lvl = 30; rebuild(b, A); assert.equal(b.sk[n.id], 1, 'niveau changé : ajout perdu'); assert.equal(lostOf(b).length, 0);
  assert.ok(spentPoints(b) - n.sk.cost <= budget(b), 'combo imposé au-delà du budget');
  setGoals(b, 'archer', null); const ar = combo('archer', null, 30, 114, 11); assert.deepEqual([b.sk, b.pn], [ar.sk, ar.pn], 'principal changé : le combo seul');
  assert.deepEqual(b.gem, GOALI.archer.gem, 'gemmes de l\'objectif posées'); assert.equal(lostOf(b).length, 0);
  // budget 0 : plus rien d'imposé, un ajout qui ne touche aucun départ n'est plus relié → élagué
  const c = goalBuild('mageCrit'), far = TOPO.N.find(x => x.kind === 'skill' && !c.sk[x.id] && canBuy(c, x) && [...x.nb].every(m => m.kind !== 'start'));
  addRank(c, far.id); const A2 = addsOf(c); c.lvl = 1; c.exp = 0; const gone = rebuild(c, A2);
  assert.ok(gone.some(x => x.id === far.id) && !c.sk[far.id], 'ajout non relié gardé'); assert.equal(spentPoints(c), 0); assert.equal(lostOf(c).length, 0);
});

test('build enregistré avec objectifs : rechargé à l\'identique, objectifs gardés ; objectif inconnu retiré', () => {
  const b = goalBuild('necro', 'fire'); addRank(b, TOPO.N.find(x => x.kind === 'skill' && !b.sk[x.id] && canBuy(b, x)).id);
  const s = JSON.parse(JSON.stringify(b)), r = loadSaved(s);
  assert.deepEqual(r.obj, ['necro', 'fire']); assert.deepEqual(r.sk, b.sk); assert.deepEqual(r.pn, b.pn); assert.equal(r._objLost, undefined);
  const u = loadSaved({...s, obj: ['inconnu', 'fire']}); assert.deepEqual(u.obj, []); assert.equal(u._objLost, true); assert.deepEqual(u.sk, b.sk);
  const v = loadSaved({...s, obj: undefined}); assert.deepEqual(v.obj, []); assert.equal(v._objLost, undefined, 'build d\'avant la 2.0.0 : rien à signaler');
});

test('ajout d\'un nœud d\'attribut : gardé au changement de secondaire, retiré par −1 de préférence aux nœuds imposés', () => {
  const b = goalBuild('mageCrit'), R = reach(b), p = TOPO.pips.find(x => x.attr === 'str' && !b.pn[x.id] && canBuy(b, x, R));
  assert.ok(p, 'aucun nœud de Force achetable'); assert.ok(addPipNode(b, p));
  setGoals(b, 'mageCrit', 'storm'); assert.ok(b.pn[p.id], 'ajout d\'attribut perdu');
  const imp = Object.keys(imposed(b).pn); assert.equal(remPip(b, 'str'), true); assert.ok(!b.pn[p.id], 'le nœud ajouté n\'est pas celui retiré');
  for (const id of imp) assert.ok(b.pn[id], 'nœud imposé retiré : ' + id);
  // un attribut mixte (imposés + ajouté) : −1 retire l'ajouté
  const c = goalBuild('tank'), q = TOPO.pips.find(x => x.attr === 'con' && !c.pn[x.id] && canBuy(c, x));
  if (q) { addPipNode(c, q); assert.equal(remPip(c, 'con'), true); assert.ok(!c.pn[q.id]); assert.equal(c.pip.con, imposed(c).pip.con); }
});
test('secondaire = principal : ignoré (setGoals)', () => {
  const b = blankBuild(); setGoals(b, 'tank', 'tank'); assert.deepEqual(b.obj, ['tank', null]);
});
test('un combo ne s\'arrête jamais alors que le prochain achat est payable ; le manque affiché est exact', () => {
  let n = 0;
  for (const g of GOALS) for (const fl of [1, 11]) for (let lv = 1; lv <= 50; lv += 7) for (const ex of [0, 20, 114]) {
    const c = combo(g.id, null, lv, ex, fl), st = c.rep[0].steps.find(s => s.miss); if (!st) continue; n++;
    const b = {sk: {...c.sk}, pn: {...c.pn}, pip: {...c.pip}}, k = st.at; let cost;
    if (isAttr(k)) { const D = dijkstra(b, reach(b), u => u.kind === 'pip' && u.attr === k && !owned(b, u)); cost = D.dist.get(D.hit); }
    else cost = b.sk[k] > 0 ? SKI[k].cost : pathCost(b, pathTo(b, TOPO.byId[k]));
    assert.equal(cost - c.left, st.miss, `${g.id} niv. ${lv} expl. ${ex} Flamme ${fl} : ${k}`); assert.ok(st.miss > 0); }
  assert.ok(n > 50, 'trop peu de combos arrêtés : ' + n);
});

// ---- 2.1.0 : 3e objectif « Soutien » (compétences seules, derniers points) ----
test('soutien : compétences seules, toutes connues, ids en fin de FZ.goals ; jamais en principal ni en secondaire', () => {
  for (const g of SUPS) { assert.ok(GOALI[g.id].sup, g.id); assert.ok(FZ.goals.indexOf(g.id) >= 12, g.id + ' : à ajouter en fin de FZ.goals'); assert.ok(!GOALS.some(x => x.id === g.id), g.id + ' dans GOALS');
    for (const [, why, items] of g.steps) { assert.ok(why.length > 10); for (const k in items) { assert.ok(!isAttr(k), g.id + ' : attribut ' + k); assert.ok(SKI[k], g.id + ' : ' + k); assert.ok(items[k] <= SKI[k].max, g.id + ' : rang ' + k); } } }
  const b = blankBuild(); setGoals(b, 'survie', 'mana', 'resist'); assert.deepEqual(b.obj, []);
  setGoals(b, 'tank', 'survie', 'archer'); assert.deepEqual(b.obj, ['tank', null], 'soutien en secondaire ou objectif ordinaire en soutien : ignorés');
  setGoals(b, 'tank', null, 'survie'); assert.deepEqual(b.obj, ['tank', null, 'survie']);
});
// pas de test « sans recul » pour le soutien : quand les points montent, le principal en prend davantage et le soutien peut en recevoir moins (il a les derniers)
test('soutien : passe en dernier, principal et secondaire à l\'identique ; relié, dans le budget', () => {
  for (const t of SUPS) for (const [p, s] of [['tank', null], ['mageCrit', 'storm'], ['archer', null]]) for (const fl of [1, 11]) {
    for (let B = 0; B <= 212; B += 8) { const a = combo(p, s, ...lvlExp(B), fl), c = combo(p, s, ...lvlExp(B), fl, t.id), lbl = `${p}+${s}+${t.id} · ${B} pts · Flamme ${fl}`;
      assert.ok(c.spent <= B, lbl); assert.equal(lostOf(asB(c)).length, 0, lbl + ' : non relié');
      assert.deepEqual(c.rep.slice(0, -1).map(r => r.steps.map(x => x.st)), a.rep.map(r => r.steps.map(x => x.st)), lbl + ' : principal/secondaire changés');
      for (const k in a.want.sk) assert.ok((c.sk[k] || 0) >= a.want.sk[k], lbl + ' : ' + k);
      assert.equal(c.rep.at(-1).role, 't'); assert.ok(c.spent >= a.spent, lbl);
      } }
  const c = combo('archer', null, 50, 114, 11, 'resist'); assert.ok(c.rep[1].pts > 0, 'Archer seul à 212 points : le soutien reçoit des points');
});
test('soutien : nœuds verrouillés, ajouts gardés au changement de soutien, retiré au retour en arbre libre', () => {
  const b = goalBuild('archer', null, 'x', 'resist'), imp = imposed(b), k = Object.keys(imp.sk).find(id => (imp.want.sk[id] || 0) > 0 && GOALI.resist.steps.some(s => id in s[2]));
  assert.ok(k); assert.ok(lockOf(b, TOPO.byId[k]) > 0, 'nœud du soutien verrouillé');
  const keepT = globalThis.toast; globalThis.toast = () => {}; try { assert.equal(remRank(b, k), false); } finally { globalThis.toast = keepT; }
  const R = reach(b), n = TOPO.N.find(x => x.kind === 'skill' && !b.sk[x.id] && canBuy(b, x, R) && x.sk.max === 1); addRank(b, n.id);
  setGoals(b, 'archer', null, 'mana'); assert.equal(b.sk[n.id], 1, 'soutien changé : ajout perdu'); assert.deepEqual(b.obj, ['archer', null, 'mana']);
  setGoals(b, 'archer', null, null); assert.deepEqual(b.obj, ['archer', null], 'sans soutien : forme d\'avant la 2.1.0');
});

// ---- 2.3.0 : combo recalculé avec vos ajouts (déjà acquis = gratuit pour le combo ; ajouts « en plus », QCM du 2026-11-07) ----
const atPts = (g, B, s, t) => { const b = goalBuild(g, s || null, '', t); [b.lvl, b.exp] = ptsAt(B); rebuild(b); return b; };
const addNode = (b, n) => n.kind === 'pip' ? addPipNode(b, n) : addRank(b, n.id);
let rndSeed = 12345; const rnd = () => (rndSeed = (rndSeed * 1103515245 + 12345) % 2147483648) / 2147483648;
// ajouts au hasard (suite fixe) : k nœuds voisins de l'arbre, posés un par un
const randomAdds = (tree, k) => { const t = {sk: {...tree.sk}, pn: {...tree.pn}, pip: {}}, A = {sk: {}, pn: {}}; syncPips(t);
  for (let j = 0; j < k; j++) { const R = reach(t), c = TOPO.N.filter(x => (x.kind === 'skill' || x.kind === 'pip') && !owned(t, x) && canBuy(t, x, R)); if (!c.length) break;
    const x = c[Math.floor(rnd() * c.length)]; if (x.kind === 'skill') { t.sk[x.id] = 1; A.sk[x.id] = 1; } else { t.pn[x.id] = 1; A.pn[x.id] = 1; } syncPips(t); }
  return A; };

test('2.3.0 · un ajout sur le chemin d\'une étape libère des points pour les suivantes (cas figés, mesurés le 2026-11-07)', () => quiet(msgs => {
  for (const [g, B, id, l0, l1, w0, w1] of [['mageCrit', 80, 'pip:1wwtpca', 30, 27, 49, 53], ['tank', 140, 'wetDog', 24, 20, 113, 120]]) {
    const b = atPts(g, B), n = TOPO.byId[id], c0 = imposed(b), lbl = `${g} à ${B} pts + ${id}`;
    assert.deepEqual([c0.links, c0.wpts], [l0, w0], lbl + ' : avant'); assert.ok(!owned(b, n) && canBuy(b, n), lbl + ' : achetable');
    assert.ok(addNode(b, n)); const c1 = imposed(b);
    assert.deepEqual([c1.links, c1.wpts], [l1, w1], lbl + ' : après (liaisons, avancée des objectifs)');
    assert.equal(lockOf(b, n), 0, lbl + ' : l\'ajout reste à vous'); assert.equal(lostOf(b).length, 0, lbl + ' : non relié');
    assert.equal(spentPoints(b), c1.spent + nodeCost(n), lbl + ' : arbre = imposé + ajout'); assert.equal(spentPoints(b) - c1.buy, nodeCost(n), lbl + ' : « vos ajouts »');
    assert.ok(c1.buy <= B, lbl + ' : le combo garde son budget'); assert.equal(msgs.pop(), `Combo recalculé : liaisons ${l0} pts → ${l1} pts · +${w1 - w0} pts sur les étapes`);
    assert.match(G.origin(b, n), /Ajouté par vous · le combo passe par ce nœud/); }
}));

test('2.3.0 · un retrait recalcule : sans l\'ajout, le combo d\'avant revient ; +1 puis −1 sur un rang imposé ne change rien', () => quiet(() => {
  const b = atPts('mageCrit', 80), t0 = {sk: {...b.sk}, pn: {...b.pn}}, n = TOPO.byId['pip:1wwtpca'];
  addPipNode(b, n); assert.notDeepEqual(b.pn, t0.pn); assert.ok(remPipNode(b, n));
  assert.deepEqual([b.sk, b.pn], [t0.sk, t0.pn]); assert.deepEqual(b.ad, {sk: {}, pn: {}, up: {}}); assert.equal(imposed(b).links, 30);
  const c = atPts('tank', 140), t1 = {sk: {...c.sk}, pn: {...c.pn}}; addRank(c, 'wetDog'); assert.ok(remRank(c, 'wetDog')); assert.deepEqual([c.sk, c.pn], [t1.sk, t1.pn]);
  let k = 0;
  for (const g of GOALS) { const d = goalBuild(g.id), imp = imposed(d), t2 = {sk: {...d.sk}, pn: {...d.pn}};
    for (const id of Object.keys(imp.sk).filter(x => SKI[x].max > d.sk[x])) { const r = d.sk[id], n2 = TOPO.byId[id]; k++;
      assert.ok(addRank(d, id)); assert.equal(d.sk[id], r + 1, g.id + ' : ' + id); assert.deepEqual(d.ad.up, {[id]: r + 1}, g.id + ' : rang au-dessus de l\'imposé');
      assert.equal(lockOf(d, n2), r, g.id + ' : rang imposé gardé sous votre ajout'); assert.deepEqual([imposed(d).sk, imposed(d).pn], [imp.sk, imp.pn], g.id + ' : combo changé par un rang au-dessus');
      assert.ok(remRank(d, id)); assert.deepEqual([d.sk, d.pn], [t2.sk, t2.pn], g.id + ' : ' + id + ' (+1 −1)'); assert.deepEqual(d.ad, {sk: {}, pn: {}, up: {}});
      assert.equal(remRank(d, id), false, g.id + ' : sous le rang imposé, refusé'); } }
  assert.ok(k > 20, 'trop peu de rangs essayés : ' + k);
}));

// comme sans ajout : le principal seul (avec un secondaire ou un soutien, le principal prend davantage quand les points montent, eux peuvent en recevoir moins)
test('2.3.0 · jamais de recul quand les points montent, ajouts fixés (ajouts au hasard, Flammes 1 et 11)', () => {
  let n = 0;
  for (const g of GOALS) for (const fl of [1, 11]) {
    for (let trial = 0; trial < 3; trial++) { const A = randomAdds(combo(g.id, null, 50, 114, fl), 1 + 2 * trial); let prev = null;
      for (let B = 0; B <= 212; B += 12) { const c = combo(g.id, null, ...ptsAt(B), fl, null, A), lbl = `${g.id} · Flamme ${fl} · ${B} pts`; n++;
        if (prev) { for (const k in prev.sk) assert.ok((c.want.sk[k] || 0) >= prev.sk[k], lbl + ' : ' + k + ' perdu');
          for (const k in prev.pip) assert.ok((c.want.pip[k] || 0) >= prev.pip[k], lbl + ' : ' + k + ' perdu'); }
        prev = {sk: {...c.want.sk}, pip: {...c.want.pip}}; } } }
  assert.ok(n > 1200, 'trop peu de combos : ' + n);
});

test('2.3.0 · invariant avec ajouts (1 000+ combos au hasard) : relié, ajouts gardés et à vous, budget du combo, jamais pire que l\'ancien calcul', () => {
  let n = 0, better = 0;
  for (const g of GOALS) for (const [s, t] of [[null, null], ['healer', null], ['storm', 'survie'], ['archer', 'mana'], ['tank', 'resist']]) { if (s === g.id) continue;
    for (const fl of [1, 11]) for (let B = 4; B <= 212; B += 26) { const [lv, ex] = ptsAt(B), z = combo(g.id, s, lv, ex, fl, t), A = randomAdds(z, 1 + Math.floor(rnd() * 5));
      const c = combo(g.id, s, lv, ex, fl, t, A), tr = treeOf(c, A), b = {sk: tr.sk, pn: tr.pn, pip: {}}, lbl = `${g.id}+${s}+${t} · ${B} pts · Flamme ${fl}`; syncPips(b); n++;
      assert.equal(lostOf(b).length, 0, lbl + ' : non relié');
      for (const id in A.sk) assert.ok(b.sk[id] >= A.sk[id], lbl + ' : ajout perdu ' + id);
      for (const id in A.pn) { assert.ok(b.pn[id], lbl + ' : ajout perdu ' + id); assert.ok(!c.pn[id], lbl + ' : votre nœud d\'attribut est devenu imposé ' + id); }
      for (const id in A.sk) if (!(c.want.sk[id] > 0)) assert.ok(!c.sk[id], lbl + ' : votre liaison est devenue imposée ' + id);
      for (const k in c.want.sk) assert.ok((b.sk[k] || 0) >= c.want.sk[k], lbl + ' : ' + k);
      assert.equal(c.spent, spentPoints({sk: c.sk, pn: c.pn, pip: c.pip}), lbl); assert.equal(c.links, c.buy - c.wbuy, lbl);
      assert.equal(c.buy, c.rep.reduce((a, r) => a + r.pts, 0), lbl); assert.ok(c.buy <= lv * 2 - 2 + ex, lbl + ' : achats du combo au-delà du budget');
      const old = z.spent + Object.keys(A.sk).reduce((a, id) => a + SKI[id].cost * A.sk[id], 0) + Object.keys(A.pn).length, i = c.prog.findIndex((v, j) => v !== z.prog[j]);
      assert.ok(i >= 0 ? c.prog[i] > z.prog[i] : spentPoints(b) <= old, lbl + ` : pire que l'ancien calcul (${z.prog} → ${c.prog} pts par objectif, ${old} → ${spentPoints(b)} pts)`);
      if (i >= 0 || spentPoints(b) < old) better++; } }
  assert.ok(n > 1000, 'trop peu de combos : ' + n); assert.ok(better > n / 10, 'les ajouts ne servent presque jamais : ' + better + ' / ' + n);
});

// QCM du 2026-11-07 : imposé quand le combo l'aurait aussi sans lui ; s'il n'atteint l'étape que grâce à votre nœud, celui-ci reste retirable (+1 puis −1 annule)
test('2.3.0 · un de vos nœuds qu\'une étape compte : imposé si le combo l\'aurait seul, retirable sinon (QCM du 2026-11-07)', () => quiet(() => {
  let later = 0, undo = 0;
  for (const g of GOALS) for (const B of [20, 40, 60, 90]) { const b = atPts(g.id, B), c = imposed(b), R = reach(b), st = c.rep[0].steps.find(x => x.st === 'no'); if (!st) continue;
    const k = Object.keys(st.items).find(id => !isAttr(id) && !b.sk[id] && canBuy(b, TOPO.byId[id], R) && !FLAME_NODES.some(f => f[0] === id)); if (!k) continue;
    const n = TOPO.byId[k], t0 = {sk: {...b.sk}, pn: {...b.pn}}, lbl = `${g.id} à ${B} pts : ${k}`; assert.ok(addRank(b, k)); assert.deepEqual(b.ad.sk, {[k]: 1}, lbl);
    if (imposed(b).claim[k]) { assert.equal(lockOf(b, n), 0, lbl + ' : verrouillé alors que le combo ne l\'a que grâce à vous');
      assert.ok(remRank(b, k), lbl); assert.deepEqual([b.sk, b.pn], [t0.sk, t0.pn], lbl + ' : +1 puis −1 n\'annule pas'); undo++; continue; }
    b.lvl = 50; b.exp = 114; rebuild(b); const w = imposed(b).want.sk[k];
    assert.ok(w >= 1 && lockOf(b, n) === w, lbl + ' : à 212 points, le combo l\'a seul : imposé au rang de l\'étape'); assert.equal(remRank(b, k), b.sk[k] > w, lbl); later++; }
  assert.ok(later >= 3 && undo >= 1, `trop peu de cas : ${later} imposés, ${undo} retirables`);
}));

test('2.3.0 · vos nœuds d\'attribut s\'ajoutent au compte des étapes et restent à vous', () => quiet(() => {
  let k = 0;
  for (const g of GOALS) { const b = goalBuild(g.id), w = {...imposed(b).want.pip}, R = reach(b);
    for (const p of TOPO.pips.filter(x => w[x.attr] && !b.pn[x.id] && canBuy(b, x, R)).slice(0, 2)) { const n0 = b.pip[p.attr]; k++;
      assert.ok(addPipNode(b, p)); assert.equal(b.pip[p.attr], n0 + 1, g.id + ' : ' + p.attr + ' absorbé'); assert.equal(lockOf(b, p), 0);
      assert.deepEqual(imposed(b).want.pip, w, g.id + ' : compte des étapes changé'); assert.ok(remPipNode(b, p)); assert.equal(b.pip[p.attr], n0); } }
  assert.ok(k >= 6, 'trop peu de cas : ' + k);
}));

test('2.3.0 · retirer un ajout élague les ajouts qui n\'étaient reliés que par lui (règle 3), avec le message', () => quiet(msgs => {
  const b = goalBuild('mageCrit'); let x = null, y = null;
  for (const X of TOPO.N.filter(n => (n.kind === 'skill' || n.kind === 'pip') && !owned(b, n) && canBuy(b, n))) {
    const Y = [...X.nb].find(m => (m.kind === 'skill' || m.kind === 'pip') && !owned(b, m) && [...m.nb].every(q => q === X || !owned(b, q) && q.kind !== 'start'));
    if (Y) { x = X; y = Y; break; } }
  assert.ok(x && y, 'aucune paire trouvée'); assert.ok(addNode(b, x)); assert.ok(addNode(b, y)); assert.ok(owned(b, y));
  assert.ok(x.kind === 'pip' ? remPipNode(b, x) : remRank(b, x.id)); assert.ok(!owned(b, x) && !owned(b, y), 'ajout relié seulement par le nœud retiré : gardé');
  assert.deepEqual(b.ad, {sk: {}, pn: {}, up: {}}); assert.ok(msgs.some(m => /^Plus reliés à un point de départ, donc retirés/.test(m))); assert.equal(lostOf(b).length, 0);
}));

// ---- 2.3.0, relecture QA : rangs au-dessus de l'imposé, « Acheter le chemin » puis ±1, recalcul sans effet, rang maximum ----
test('2.3.0 · +1 sur un nœud imposé, budget serré : votre rang au-dessus, combo inchangé, aucun point gratuit ; −1 annule', () => quiet(() => {
  let k = 0;
  for (const g of GOALS) for (const B of [18, 40, 90]) { const b = atPts(g.id, B), imp = imposed(b), t0 = {sk: {...b.sk}, pn: {...b.pn}};
    for (const id of Object.keys(imp.sk).filter(x => SKI[x].max > b.sk[x]).slice(0, 3)) { const sp = spentPoints(b), lbl = `${g.id} à ${B} pts : ${id}`; k++;
      assert.ok(addRank(b, id)); assert.equal(spentPoints(b), sp + SKI[id].cost, lbl + ' : un clic, un rang'); assert.equal(spentPoints(b) - imposed(b).buy, SKI[id].cost, lbl + ' : « vos ajouts »');
      assert.deepEqual([imposed(b).sk, imposed(b).pn], [imp.sk, imp.pn], lbl + ' : combo changé'); assert.ok(remRank(b, id)); assert.deepEqual([b.sk, b.pn], [t0.sk, t0.pn], lbl + ' : −1'); } }
  assert.ok(k > 40, 'trop peu de cas : ' + k);
}));
test('2.3.0 · « Acheter le chemin », puis +1 et −1 sur un nœud du chemin : rien ne change', () => quiet(() => {
  let k = 0;
  for (const [g, s, far] of [['tank', 'healer', 'miner'], ['healer', null, 'sneakAttack'], ['archer', null, 'shockResistance'], ['mageCrit', 'storm', 'lumberjack']]) {
    const b = goalBuild(g, s), n = TOPO.byId[far]; if (owned(b, n)) continue; buyTo(b, n); assert.ok(owned(b, n), g + ' : ' + far);
    const t0 = {sk: {...b.sk}, pn: {...b.pn}}, a0 = JSON.stringify(b.ad);
    for (const id of Object.keys(b.ad.sk).filter(x => SKI[x].max > b.sk[x])) { k++; assert.ok(addRank(b, id)); assert.ok(remRank(b, id), g + ' : ' + id);
      assert.deepEqual([b.sk, b.pn], [t0.sk, t0.pn], g + ' : ' + id + ' (+1 −1)'); assert.equal(JSON.stringify(b.ad), a0, g + ' : vos ajouts changés'); } }
  assert.ok(k >= 3, 'trop peu de cas : ' + k);
}));
test('2.3.0 · un recalcul sans changement ne retire aucun ajout (ajouts au hasard, reliés ou non par le combo)', () => quiet(() => {
  let n = 0;
  for (const g of GOALS) for (const B of [40, 120, 212]) { const b = atPts(g.id, B);
    for (let j = 0; j < 6; j++) { const R = reach(b), c = TOPO.N.filter(x => (x.kind === 'skill' || x.kind === 'pip') && !owned(b, x) && canBuy(b, x, R)); if (!c.length) break; addNode(b, c[Math.floor(rnd() * c.length)]); }
    const t0 = {sk: {...b.sk}, pn: {...b.pn}}, a0 = JSON.stringify(b.ad); n++;
    assert.deepEqual(regen(b, false, imposed(b)), [], g.id); assert.deepEqual([b.sk, b.pn], [t0.sk, t0.pn], g.id + ' à ' + B); assert.equal(JSON.stringify(b.ad), a0, g.id + ' à ' + B); }
  assert.ok(n >= 30);
}));
test('2.3.0 · au rang maximum, +1 ne fait rien (ni ajout ni recalcul)', () => quiet(msgs => {
  const b = goalBuild('tank'), t0 = JSON.stringify([b.sk, b.pn, b.ad]); assert.equal(b.sk.nemesis, 3);
  assert.equal(addRank(b, 'nemesis'), false); assert.equal(JSON.stringify([b.sk, b.pn, b.ad]), t0); assert.equal(msgs.length, 0);
}));

// ---- 2.4.0 : objectifs optimisés (hybrides, Exploration, Récolte ; étude docs/etudes/classes-combinaisons-2026-11-08.md) ----
const OPT = () => GOALS.filter(g => g.opt);
const zoneShare = g => { const z = {}; let t = 0;
  for (const [, , it] of g.steps) for (const [k, v] of Object.entries(it)) { const a = isAttr(k) ? PIPS.find(p => p[0] === k)[3] : SKI[k].area, c = isAttr(k) ? v : SKI[k].cost * v; z[a] = (z[a] || 0) + c; t += c; }
  for (const a in z) z[a] /= t; return z; };
// Moteur réel sur un objectif aux étapes réordonnées, comme scripts/optimiser-objectifs.mjs : coût à 212 points ; aire = Σ wpts aux budgets 0, 4 … 212 (Flamme 11)
const optRun = (g, steps, B) => { GOALI.__t = {...g, id: '__t', steps}; try { return runCombo([['__t', 'p']], ...ptsAt(B), 11, null); } finally { delete GOALI.__t; } };
const optArea = (g, steps) => { let a = 0; for (let B = 0; B <= 212; B += 4) a += optRun(g, steps, B).wpts; return a; };

test('2.4.0 · 5 objectifs optimisés : ids en fin de FZ.goals, groupes, source marquée, aucune gemme ; chaque hybride sur ses deux zones', () => {
  assert.deepEqual(OPT().map(g => g.id), ['battlemage', 'elemArcher', 'swordBow', 'explore', 'harvest', 'lifesteal', 'lifestealFull']);
  for (const g of OPT().filter(x => !x.id.startsWith('lifesteal'))) { assert.ok(FZ.goals.indexOf(g.id) >= 16, g.id + ' : à ajouter en fin de FZ.goals'); assert.deepEqual(g.gem, {}, g.id + ' : gemme sans source');
    for (const [, why] of g.steps) assert.ok(why.length > 20, g.id + ' : raison'); }
  for (const [id, zs] of Object.entries({battlemage: ['war', 'mag'], elemArcher: ['rng', 'mag'], swordBow: ['war', 'rng']})) { const z = zoneShare(GOALI[id]);
    assert.equal(GOALI[id].grp, 'hyb', id); for (const a of zs) assert.ok(z[a] >= 0.15, `${id} : ${a} à ${Math.round(100 * (z[a] || 0))} %`); }
  for (const id of ['explore', 'harvest']) assert.equal(GOALI[id].grp, 'util', id);
  assert.equal(zoneShare(GOALI.harvest).core, 1, 'Récolte : Cœur seulement'); assert.ok(zoneShare(GOALI.explore).rng > 0.5, 'Exploration : surtout Rôdeur');
  for (const id of ['battlemage', 'elemArcher', 'harvest']) assert.match(GOALI[id].src, /PinDrop/, id + ' : source communautaire');
  for (const id of ['swordBow', 'explore']) assert.equal(GOALI[id].src, undefined, id + ' : composé par le simulateur, sans source');
  for (const g of OPT()) assert.ok(typeof g.sim === 'string' && g.sim.length > 20, g.id + ' : la part du simulateur doit être dite (étiquette « hypothèse »)');
  assert.match(GOALI.elemArcher.sim, /n'est pas vérifié/, 'Archer élémentaire : effet des multiplicateurs du Mage sur les arcs non vérifié, à dire');
});
test('2.4.0 · aire d\'avancée figée (Σ des points d\'étapes aux budgets 0, 4 … 212, Flamme 11 ; mesurée le 2026-11-08 par scripts/optimiser-objectifs.mjs)', () => {
  const AREA = {battlemage: 2572, elemArcher: 2816, swordBow: 3077, explore: 2887, harvest: 1259, lifesteal: 2771, lifestealFull: 4831}; // lifesteal : 2.6.0, lifestealFull : 2.7.0, mesurées le 2026-11-14
  for (const g of OPT()) { assert.equal(optArea(g, g.steps), AREA[g.id], g.id); assert.equal(optRun(g, g.steps, 212).spent, combo(g.id, null, 50, 114, 11).spent, g.id + ' : moteur'); }
});
test('2.4.0 · ordre optimisé : aucun échange de deux éléments voisins d\'une étape ne fait mieux (coût à 212 points, puis aire)', () => {
  let n = 0;
  for (const g of OPT()) { const c0 = optRun(g, g.steps, 212).spent, a0 = optArea(g, g.steps);
    g.steps.forEach(([t, w, it], i) => { const ks = Object.keys(it);
      for (let j = 0; j + 1 < ks.length; j++) { const q = [...ks]; [q[j], q[j + 1]] = [q[j + 1], q[j]]; n++;
        const st = g.steps.map((x, k) => k === i ? [t, w, Object.fromEntries(q.map(y => [y, it[y]]))] : x), c = optRun(g, st, 212).spent;
        if (c > c0) continue; const a = optArea(g, st);
        assert.ok(c === c0 && a <= a0, `${g.id} · ${t} : ${q[j]} avant ${q[j + 1]} fait mieux (${c} pts, aire ${a} contre ${c0} pts, aire ${a0})`); } }); }
  assert.ok(n >= 40, 'trop peu d\'échanges essayés : ' + n);
});
test('2.4.0 · un principal sans gemme garde les gemmes en place ; un principal avec gemmes pose les siennes', () => {
  const b = goalBuild('tank'); assert.deepEqual(b.gem, GOALI.tank.gem);
  setGoals(b, 'harvest', 'archer'); assert.deepEqual(b.obj, ['harvest', 'archer']); assert.deepEqual(b.gem, GOALI.tank.gem, 'gemmes en place perdues');
  assert.ok(b.sk.lumberjack === 3 && b.sk.marksman === 3, 'Récolte puis Archer en secondaire');
  setGoals(b, 'archer', null); assert.deepEqual(b.gem, GOALI.archer.gem); assert.deepEqual(goalBuild('explore').gem, {}, 'build neuf : aucune gemme');
});
test('2.6.0 · Vol de vie (mêlée) : en fin de FZ.goals, Guerrier, soins de mêlée d\'abord, gemme et absence de vol de vie dans l\'arbre dites', () => {
  const g = GOALI.lifesteal; assert.equal(FZ.goals.indexOf('lifesteal'), 21); assert.equal(g.grp, 'war'); assert.ok(zoneShare(g).war > 0.5, 'surtout Guerrier');
  assert.deepEqual(g.gem, {w1: 'g_blust'}); assert.match(g.sim, /soif de sang/i); assert.match(g.sim, /n'est pas pris en compte/); assert.equal(g.src, undefined, 'composé par le simulateur');
  assert.ok('battleHeal' in g.steps[0][2] && 'veteran' in g.steps[0][2], 'Soin de bataille et Vétéran en première étape');
  for (const k of ['battleHeal', 'bloodWarrior', 'goodMetab', 'athlete']) assert.ok(g.steps.some(([, , it]) => k in it), k);
  const b = blankBuild(); setGoals(b, 'lifesteal', null); assert.equal(b.gem.w1, 'g_blust', 'la gemme est posée avec le combo');
});
test('2.7.0 · Vol de vie complet (mêlée) : en fin de FZ.goals, dépense les 212 points (Flamme 11), reprend Vol de vie (mêlée) en tête', () => {
  const g = GOALI.lifestealFull, base = GOALI.lifesteal; assert.equal(FZ.goals.indexOf('lifestealFull'), 22); assert.equal(g.grp, 'war'); assert.ok(zoneShare(g).war > 0.5, 'surtout Guerrier');
  assert.deepEqual(g.gem, {w1: 'g_blust'}); assert.match(g.sim, /n'est pas pris en compte/); assert.equal(g.src, undefined, 'composé par le simulateur');
  base.steps.forEach(([t, , it], i) => { assert.equal(g.steps[i][0], t); for (const [k, v] of Object.entries(it)) assert.ok(g.steps[i][2][k] >= v, t + ' : ' + k); });
  const c = combo('lifestealFull', null, 50, 114, 11); assert.deepEqual([c.spent, c.left], [212, 0]); assert.ok(c.rep[0].steps.every(s => s.st === 'ok'));
  const SK0 = new Set(SK.map(s => s.id)); for (const [, why, it] of g.steps) { assert.ok(why.length > 20); for (const k in it) assert.ok(isAttr(k) || SK0.has(k), k); }
});
