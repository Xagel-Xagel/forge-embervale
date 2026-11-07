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
  for (const g of GOALS) { const d = decode(PRESET_CODES.find(x => x[0] === P[g.id])[1]), it = {};
    for (const [, , items] of g.steps) Object.assign(it, items);
    for (const [k, v] of Object.entries(it)) if (isAttr(k)) assert.ok(d.pip[k] >= v, g.id + ' : ' + k); else assert.equal(d.sk[k], v, g.id + ' : ' + k);
    for (const k in d.sk) if (d.sk[k] > 1) assert.ok(k in it, g.id + ' : ' + k + ' (rang ' + d.sk[k] + ') absent des étapes'); }
});

test('secondaire : le principal passe d\'abord, à l\'identique ; le secondaire prend les points restants, sans dépasser', () => {
  for (const [p, s] of [['tank', 'healer'], ['mageCrit', 'storm'], ['archer', 'assassin'], ['paladin', 'sword']]) for (const B of [40, 120, 212]) {
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
  for (const g of GOALS) for (const B of [0, 6, 30]) { const c = combo(g.id, null, ...lvlExp(B), 11), st = c.rep[0].steps;
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
