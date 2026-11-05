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
test('chaque compétence est placée une seule fois dans l\'arbre', () => {
  for (const s of SK) assert.ok(TOPO.byId[s.id], s.id + ' absent de TOPO');
  const inClusters = CLUSTERS.flatMap(c => c[4]);
  assert.equal(new Set(inClusters).size, inClusters.length, 'compétence présente dans deux groupes');
  for (const id of inClusters) assert.ok(SKI[id], 'groupe : compétence inconnue ' + id);
});
test('objets : catégories et perks connus', () => {
  for (const w of WEAPONS) { assert.ok(CAT[w[2]], w[0] + ' : catégorie'); assert.ok(WTYPE[w[5]], w[0] + ' : type'); for (const p of w[6]) assert.ok(WPERK[p], w[0] + ' : perk ' + p); }
  for (const it of Object.values(ITEMS)) if (it.perks) for (const p of it.perks) {
    if (p[0] === 's') assert.ok(ST[p[1]], it.id + ' : stat ' + p[1]);
    if (p[0] === 'k') assert.ok(SKI[p[1]], it.id + ' : compétence ' + p[1]);
  }
  for (const it of Object.values(ITEMS)) if (it.base) for (const k in it.base) assert.ok(ST[k], it.id + ' : stat de base ' + k);
});
test('builds prédéfinis : toutes les références existent', () => {
  for (const p of PRESETS) {
    for (const [sl, id] of Object.entries(p.gear)) { assert.ok(ITEMS[id], `${p.name} : objet ${id}`); assert.ok(SLOTS.some(s => s[0] === sl), `${p.name} : emplacement ${sl}`); }
    for (const id in p.sk) assert.ok(SKI[id], `${p.name} : compétence ${id}`);
    for (const g of Object.values(p.gem || {})) assert.ok(GEMI[g], `${p.name} : gemme ${g}`);
    assert.ok(['mage', 'heal', 'tank', 'war', 'rng'].includes(p.cat), p.name + ' : catégorie');
  }
});
test('gemmes : 29, identifiants uniques, palier 1 à 7', () => {
  assert.equal(GEMS.length, 29);
  assert.equal(new Set(GEMS.map(g => g[0])).size, GEMS.length);
  for (const g of GEMS) { assert.ok(RAR[g[3]], g[0]); assert.ok(g[4] >= 1 && g[4] <= 7, g[0]); }
});
test('ennemis : 8 multiplicateurs entre 0 et 300, faction connue', () => {
  assert.ok(ENEMIES.length >= 100);
  for (const e of ENEMIES) {
    assert.equal(e.m.length, 8, e.n);
    for (const v of e.m) assert.ok(v >= 0 && v <= 300, e.n + ' : ' + v);
    assert.ok(FACTIONS[e.f], e.n + ' : faction');
  }
  assert.equal(new Set(ENEMIES.map(e => e.n)).size, ENEMIES.length, 'nom d\'ennemi en double');
});
test('les Fell sont immunisés au Shroud', () => {
  for (const e of ENEMIES.filter(e => e.f === 'fell')) assert.equal(e.m[TI.shroud], 0, e.n);
});
