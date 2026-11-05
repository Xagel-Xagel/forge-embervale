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
  // Battering Ram Hammer : contondant 50 % (×1,5) + glace 50 % (×0,8), chaque part avec ses propres bonus
  const [bl, ic] = v.wc.byType; assert.deepEqual([bl[0], bl[1], ic[0], ic[1]], ['blunt', .5, 'ice', .5]);
  assert.ok(Math.abs(v.hit - (bl[2] * 1.5 + ic[2] * 0.8) * (1 + v.tb.t / 100)) < 1e-9);
  assert.ok(v.m > 80 && v.m < 150, 'multiplicateur effectif entre les deux parts : ' + v.m);
});
test('dégâts mixtes : 16 armes 50/50 (fichiers 1.0), parts = 100 %, type principal inclus', () => {
  const mixed = WEAPONS.filter(w => ITEMS[w[0]].split.length > 1).map(w => w[0]);
  assert.equal(mixed.length, 16);
  for (const w of WEAPONS) { const it = ITEMS[w[0]];
    assert.ok(Math.abs(it.split.reduce((a, x) => a + x[1], 0) - 1) < 1e-9, w[0]);
    assert.ok(it.split.some(x => x[0] === it.type), w[0] + ' : type principal absent de la répartition');
    for (const [t] of it.split) assert.ok(TI[t] !== undefined, w[0] + ' : type ' + t); }
});
test('dégâts mixtes : un bonus de type ne compte que sur sa part', () => {
  const b = blankBuild(); b.gear.w1 = 'w_aurora'; // tranchant 50 % + glace 50 %
  const h0 = compute(b).weapons[0].hit;
  normalize(Object.assign(b, {sk: {slasher: 3}})); // +30 % tranchant (Taillade), chemin acheté si besoin
  const wc = compute(b).weapons[0]; const common = wc.parts.filter(p => !p[0].includes('(part ')).reduce((a, p) => a + p[1], 0);
  assert.ok(Math.abs(wc.hit - 109 * (0.5 * (1 + (common + 30) / 100) + 0.5 * (1 + common / 100))) < 1e-9);
  assert.ok(wc.hit > h0);
  assert.ok(Math.abs(wc.bonus - (wc.hit / 109 - 1) * 100) < 1e-9, 'bonus affiché = bonus effectif');
});
test('dégâts mixtes : immunité partielle, la part non immunisée frappe toujours', () => {
  const b = blankBuild(); b.gear.w1 = 'w_rot'; // contondant 50 % + Shroud 50 %, Fell immunisés au Shroud
  const v = effVs(b, 'w1', ENEMIES.find(e => e.n === 'Lord Vorgoth'));
  assert.ok(v.avg > 0 && v.m > 0 && v.m < 100, String(v.m));
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
test('optimiseur multi-points : budget respecté, arbre relié, gain = gain obtenu, au moins le meilleur achat unique', () => {
  const en = ENEMIES.find(e => e.n === 'Fell Black Knight');
  for (const i of [0, 3, 4]) for (const N of [5, 12, 30]) {
    const b = fromPreset(PRESETS[i]); const sp = spentPoints(b); const P = planPoints(b, 'w1', en, N);
    assert.ok(P, PRESETS[i].name); assert.ok(P.used <= N && spentPoints(P.t) - sp === P.used, `${PRESETS[i].name} N=${N} : ${P.used} pts`);
    assert.equal(TOPO.N.filter(n => owned(P.t, n) && !reach(P.t).has(n)).length, 0, 'plan non relié');
    assert.ok(Math.abs(effVs(P.t, 'w1', en).avg - P.avg) < 1e-6, 'gain annoncé ≠ gain obtenu');
    assert.equal(spentPoints(b), sp, 'le build d\'origine ne doit pas changer');
    for (const it of investments(b, 'w1', en)) if (it.cost <= N) assert.ok(P.avg >= it.avg - 1e-6, `${PRESETS[i].name} N=${N} : ${it.id} seul fait mieux`);
  }
});
