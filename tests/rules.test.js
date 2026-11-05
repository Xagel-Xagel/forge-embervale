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
for (const p of PRESETS) test(`preset « ${p.name} » : relié à la Flamme et dans le budget`, () => {
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
test('retirer un nœud élague tout ce qui n\'est plus relié à la Flamme', () => {
  for (const attr of ['int', 'spi', 'con']) {
    const b = fromPreset(PRESETS[0]); const before = spentPoints(b);
    const pip = TOPO.pips.find(p => p.attr === attr && b.pn[p.id] && p.nb.has(TOPO.core));
    if (!pip) continue;
    delete b.pn[pip.id]; syncPips(b); prune(b);
    assert.ok(spentPoints(b) <= before - 1, attr);
    assert.equal(TOPO.N.filter(n => owned(b, n) && !reach(b).has(n)).length, 0, attr + ' : nœud orphelin restant');
  }
});
