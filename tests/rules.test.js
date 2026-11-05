// Règles du jeu et de l'arbre : budget, liaisons, élagage.
test('budget max = 212 points (niveau 50 + 114 d\'exploration)', () => {
  assert.equal(budget(blankBuild()), 212);
  assert.equal(budget({lvl: 1, exp: 0}), 0);
});
test('build vide : 100 PV, 100 mana, 100 vigueur, 10 % de critique, +80 % de dégâts critiques', () => {
  const o = compute(blankBuild());
  assert.equal(o.hp, 100); assert.equal(o.mana, 100); assert.equal(o.sta, 100);
  assert.equal(o.critC, 10); assert.equal(o.critD, 80);
});
test('attributs : CON +50 PV, ESP +20 mana, END +10 vigueur', () => {
  const b = blankBuild(); b.pip = {con: 2, spi: 3, end: 4}; delete b.pn; normalize(b);
  const o = compute(b);
  assert.equal(o.hp, 200); assert.equal(o.mana, 160); assert.equal(o.sta, 140);
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
  const b = fromPreset(PRESETS[4]); const R = reach(b), D = dijkstra(b, R);
  for (const n of TOPO.N) { if (R.has(n)) continue; const p = pathTo(b, n);
    assert.deepEqual(trace(D, n).map(x => x.id), p.map(x => x.id), n.id); assert.equal(D.dist.get(n), pathCost(b, p), n.id); }
});
for (const p of PRESETS) test(`preset « ${p.name} » : relié à un départ et dans le budget`, () => {
  const b = fromPreset(p); const R = reach(b);
  const lost = TOPO.N.filter(n => owned(b, n) && !R.has(n));
  assert.equal(lost.length, 0, 'nœuds non reliés : ' + lost.map(n => n.id).join(', '));
  assert.ok(spentPoints(b) <= 212, spentPoints(b) + ' points');
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
    const b = fromPreset(PRESETS[0]); const before = spentPoints(b);
    const pip = TOPO.pips.find(p => p.attr === attr && b.pn[p.id] && [...p.nb].some(n => n.kind === 'start'));
    if (!pip) continue; cas++;
    delete b.pn[pip.id]; syncPips(b); prune(b);
    assert.ok(spentPoints(b) <= before - 1, attr);
    assert.equal(TOPO.N.filter(n => owned(b, n) && !reach(b).has(n)).length, 0, attr + ' : nœud orphelin restant');
  }
  assert.ok(cas > 0, 'aucun nœud d\'attribut voisin d\'un départ : test vide');
});
test('normalize : aucune liaison inutile laissée dans les presets', () => {
  for (const p of PRESETS) { const b = fromPreset(p);
    for (const n of TOPO.N) { const extra = n.kind === 'skill' ? b.sk[n.id] > 0 && !(n.id in p.sk) : n.kind === 'pip' && b.pn[n.id] && b.pip[n.attr] > (p.pip[n.attr] || 0);
      if (!extra) continue; const t = JSON.parse(JSON.stringify(b)); if (n.kind === 'skill') delete t.sk[n.id]; else delete t.pn[n.id]; syncPips(t);
      assert.ok(TOPO.N.some(m => owned(t, m) && !reach(t).has(m)), p.name + ' : ' + n.id + ' retirable sans rien couper'); }
  }
});
test('normalize : comptes d\'attributs respectés, clés inconnues retirées sans perdre les autres', () => {
  const b = blankBuild(); b.pip = {int: 4, dex: 2}; delete b.pn; normalize(b);
  assert.equal(b.pip.int, 4); assert.equal(b.pip.dex, 2);
  const c = JSON.parse(JSON.stringify(b)); c.pn['pip:retire-par-un-patch'] = 1; c.pip.int = 5; normalize(c);
  assert.equal(c.pip.int, 5, 'le nœud inconnu est remplacé par un autre du même attribut');
  for (const id in b.pn) if (TOPO.byId[id].attr === 'dex') assert.ok(c.pn[id], 'nœud valide conservé : ' + id);
  assert.equal(TOPO.N.filter(n => owned(c, n) && !reach(c).has(n)).length, 0);
});
