// Règles du jeu et de l'arbre : budget, liaisons, élagage.
test('budget max = 212 points (niveau 50 + 114 d\'exploration)', () => {
  assert.equal(budget(blankBuild()), 212);
  assert.equal(budget({lvl: 1, exp: 0}), 0);
});
test('build vide : 100 PV, 100 mana, 100 vigueur, attributs à 0', () => {
  const o = compute(blankBuild());
  assert.equal(o.hp, 100); assert.equal(o.mana, 100); assert.equal(o.sta, 100);
  for (const [k] of PIPS) assert.equal(o.attr[k], 0, k);
});
test('Flamme : +1 attribut tous les 2 niveaux par nœud de Flamme ; Rôdeur +1 DEX et END par rang ; santé selon Athlète, Vigueur voilée, Essences de vie', () => {
  const b = blankBuild(); b.flame = 11; for (const [id] of FLAME_NODES) b.sk[id] = 1; b.sk.ranger = 2; b.pip = {str: 2, dex: 1, int: 3}; delete b.pn; normalize(b);
  const o = compute(b), A = o.attr;
  assert.deepEqual([A.str, A.con, A.end, A.dex, A.int, A.spi].map((v, i) => v - (b.pip[PIPS[i][0]] || 0)), [5, 5, 7, 7, 5, 5]);
  b.sk.athlete = 3; b.sk.veiledVigor = 2; b.sk.lifeEssences = 1; const p = compute(b);
  assert.equal(p.hp, 100 + 50 * p.attr.con + 9 * p.attr.str + 6 * p.attr.dex + 3 * p.attr.int);
  b.flame = 1; assert.equal(compute(b).attr.str, b.pip.str, 'Flamme 1 : rien');
});
test('attributs : CON +50 PV, ESP +20 mana, END +10 vigueur', () => {
  const b = blankBuild(); b.pip = {con: 2, spi: 3, end: 4}; delete b.pn; normalize(b);
  const o = compute(b);
  assert.equal(o.hp, 200); assert.equal(o.mana, 160); assert.equal(o.sta, 140);
});
test('critique magique : bonus des compétences seuls (Sorcier aux baguettes et bâtons, Précision fatale partout)', () => {
  const b = blankBuild(); assert.deepEqual(compute(b).crit, {wand: 0, spell: 0, dmg: 0});
  b.sk.wizard = 3; b.sk.fatalPrecision = 2; assert.deepEqual(compute(b).crit, {wand: 16, spell: 10, dmg: 10});
  b.sk.wizard = 9; assert.equal(compute(b).crit.wand, 16, 'rang plafonné');
});
test('tracé réel : 243 nœuds, 312 liaisons, tout est relié aux 12 départs', () => {
  assert.equal(TREE.nodes.length, 243); assert.equal(TOPO.E.length, 312);
  assert.equal(TOPO.N.filter(n => n.kind === 'start').length, 12);
  for (const [k, , , , max] of PIPS) assert.equal(TOPO.pips.filter(p => p.attr === k).length, max, 'nœuds ' + k);
  const all = blankBuild(); for (const s of SK) all.sk[s.id] = 1; for (const p of TOPO.pips) all.pn[p.id] = 1; syncPips(all);
  assert.equal(reach(all).size, TOPO.N.length, 'nœud isolé dans le tracé');
  // la Flamme est logique : reliée aux seuls départs, absente des liaisons dessinées
  assert.ok([...TOPO.core.nb].every(n => n.kind === 'start'));
  assert.ok(TOPO.E.every(([p, q]) => p.kind !== 'hub' && q.kind !== 'hub'));
});
test('chemin : Dijkstra multi-cibles = coût et chemin de pathTo', () => {
  const b = goalBuild('assassin'); const R = reach(b), D = dijkstra(b, R);
  for (const n of TOPO.N) { if (R.has(n)) continue; const p = pathTo(b, n);
    assert.deepEqual(trace(D, n).map(x => x.id), p.map(x => x.id), n.id); assert.equal(D.dist.get(n), pathCost(b, p), n.id); }
});
test('un nœud ne s\'achète que s\'il touche un nœud acquis', () => {
  const b = blankBuild();
  assert.equal(canBuy(b, TOPO.byId.wizard), false);
  const path = pathTo(b, TOPO.byId.wizard);
  assert.ok(path && path.length > 1);
  buyPath(b, path);
  assert.ok(b.sk.wizard > 0);
  assert.equal(TOPO.N.filter(n => owned(b, n) && !reach(b).has(n)).length, 0);
});
test('retirer un nœud élague tout ce qui n\'est plus relié à un départ', () => {
  let cas = 0;
  for (const attr of ['int', 'spi', 'con']) {
    const b = goalBuild('storm'); const before = spentPoints(b);
    const pip = TOPO.pips.find(p => p.attr === attr && b.pn[p.id] && [...p.nb].some(n => n.kind === 'start'));
    if (!pip) continue; cas++;
    delete b.pn[pip.id]; syncPips(b); prune(b);
    assert.ok(spentPoints(b) <= before - 1, attr);
    assert.equal(TOPO.N.filter(n => owned(b, n) && !reach(b).has(n)).length, 0, attr + ' : nœud orphelin restant');
  }
  assert.ok(cas > 0, 'aucun nœud d\'attribut voisin d\'un départ : test vide');
});
test('normalize : comptes d\'attributs respectés, clés inconnues retirées sans perdre les autres', () => {
  const b = blankBuild(); b.pip = {int: 4, dex: 2}; delete b.pn; normalize(b);
  assert.equal(b.pip.int, 4); assert.equal(b.pip.dex, 2);
  const c = JSON.parse(JSON.stringify(b)); c.pn['pip:retire-par-un-patch'] = 1; c.pip.int = 5; normalize(c);
  assert.equal(c.pip.int, 5, 'le nœud inconnu est remplacé par un autre du même attribut');
  for (const id in b.pn) if (TOPO.byId[id].attr === 'dex') assert.ok(c.pn[id], 'nœud valide conservé : ' + id);
  assert.equal(TOPO.N.filter(n => owned(c, n) && !reach(c).has(n)).length, 0);
});
