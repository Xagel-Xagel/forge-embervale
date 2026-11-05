// Calculateur d'optimisation : formules de défense et cohérence des recommandations.
const D = (o) => Object.assign({hit: 600, type: 'cut', armP: 300, armM: 200, cap: 60, crowd: false, aura: false}, o);
const O = compute(blankBuild());
test('armure : −1 dégât par point', () => { assert.equal(defense(O, D(), 'cut').dmg, 300); });
test('armure : réduction plafonnée à 60 %', () => { assert.equal(defense(O, D({armP: 1000}), 'cut').dmg, 240); });
test('le poison ignore l\'armure', () => { assert.equal(defense(O, D({armP: 5000}), 'poison').dmg, 600); });
test('armure magique pour feu/glace/foudre/Shroud', () => { assert.equal(defense(O, D(), 'fire').dmg, 400); });
test('Aura de terre : −10 % après armure', () => { assert.equal(Math.round(defense(O, D({aura: true}), 'cut').dmg), 270); });
test('multiplicateur ennemi appliqué au type de l\'arme', () => {
  const b = fromPreset(PRESETS[3]); // Barbare : marteau contondant
  const hound = ENEMIES.find(e => e.n === 'Hollow Hound');
  const v = effVs(b, 'w1', hound);
  assert.equal(v.m, 150);
  assert.ok(Math.abs(v.hit - v.wc.hit * 1.5 * (1 + v.tb.t / 100)) < 1e-9);
});
test('immunité : 0 dégât et aucune recommandation', () => {
  const b = fromPreset(PRESETS[5]); // soigneur, bâton de Shroud
  const fell = ENEMIES.find(e => e.n === 'Lord Vorgoth');
  assert.equal(effVs(b, 'w1', fell).avg, 0);
  assert.equal(investments(b, 'w1', fell).length, 0);
});
test('le gain annoncé = le gain obtenu après achat', () => {
  for (const i of [0, 3, 6, 12]) {
    const b = fromPreset(PRESETS[i]); const en = ENEMIES.find(e => e.n === 'Fell Black Knight');
    const inv = investments(b, 'w1', en); if (!inv.length) continue;
    const sp = spentPoints(b); buyInvest(b, inv[0]);
    assert.equal(spentPoints(b) - sp, inv[0].cost, PRESETS[i].name + ' : coût');
    assert.ok(Math.abs(effVs(b, 'w1', en).avg - inv[0].avg) < 1e-6, PRESETS[i].name + ' : gain');
    assert.equal(TOPO.N.filter(n => owned(b, n) && !reach(b).has(n)).length, 0, 'achat non relié');
  }
});
