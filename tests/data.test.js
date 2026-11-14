// Intégrité des données : identifiants uniques, références valides, formats attendus.
test('identifiants de compétences uniques et complets', () => {
  const ids = SK.map(s => s.id);
  assert.equal(new Set(ids).size, ids.length, 'doublon dans SK');
  for (const s of SK) {
    assert.ok(['core', 'war', 'rng', 'mag'].includes(s.area), s.id + ' : zone inconnue');
    assert.ok(s.cost >= 1 && s.max >= 1 && s.max <= 35, s.id + ' : coût/rang invalide');
    assert.ok(s.fr && s.en && s.d, s.id + ' : texte manquant');
  }
});
test('chaque compétence correspond à un seul nœud du tracé réel', () => {
  const keys = TREE.nodes.map(n => n[1]).filter(k => k !== '*' && k[0] !== '@');
  assert.equal(new Set(keys).size, keys.length, 'compétence présente deux fois dans le tracé');
  for (const k of keys) assert.ok(SKI[k], 'tracé : compétence inconnue ' + k);
  for (const s of SK) assert.ok(TOPO.byId[s.id] && TOPO.byId[s.id].kind === 'skill', s.id + ' absent du tracé');
  assert.equal(new Set(TREE.nodes.map(n => n[0])).size, TREE.nodes.length, 'identifiant de jeu en double');
  for (const [i, j] of TREE.links) assert.ok(TREE.nodes[i] && TREE.nodes[j] && i !== j, 'liaison invalide ' + i + '-' + j);
});
test('objectifs : références valides, rangs et attributs dans les bornes, gemmes connues, une étape au moins', () => {
  assert.equal(GOALS.filter(g => !g.opt).length, 12, 'les 12 objectifs d\'origine'); assert.equal(GOALS.filter(g => g.opt).length, 6, 'objectifs optimisés (5 en 2.4.0, Vol de vie en 2.6.0)');
  assert.equal(new Set(GOALS.map(g => g.id)).size, GOALS.length);
  assert.deepEqual(GOAL_GRP, [['war', 'Guerrier'], ['rng', 'Rôdeur'], ['mag', 'Mage'], ['sup', 'Soins'], ['hyb', 'Hybrides'], ['util', 'Exploration et récolte']], 'groupes du menu des objectifs');
  for (const g of GOALS) {
    assert.ok(g.n && GOAL_GRP.some(x => x[0] === g.grp) && AREAS.some(a => a[0] === g.area), g.id + ' : nom, groupe ou zone');
    for (const v of Object.values(g.gem)) assert.ok(GEMI[v], g.id + ' : gemme ' + v);
    assert.ok(g.steps.length >= 1, g.id);
    const seen = new Set();
    for (const [t, why, items] of g.steps) { assert.ok(t && why && Object.keys(items).length, g.id + ' : étape vide');
      for (const [k, v] of Object.entries(items)) { assert.ok(!seen.has(k), g.id + ' : ' + k + ' deux fois'); seen.add(k);
        if (isAttr(k)) assert.ok(Number.isInteger(v) && v >= 1 && v <= PIPS.find(p => p[0] === k)[4], g.id + ' : ' + k);
        else assert.ok(SKI[k] && Number.isInteger(v) && v >= 1 && v <= SKI[k].max, g.id + ' : ' + k); } }
  }
});
test('gemmes : 29, identifiants uniques, palier 1 à 7', () => {
  assert.equal(GEMS.length, 29);
  assert.equal(new Set(GEMS.map(g => g[0])).size, GEMS.length);
  for (const g of GEMS) { assert.ok(RAR[g[3]], g[0]); assert.ok(g[4] >= 1 && g[4] <= 7, g[0]); }
});
