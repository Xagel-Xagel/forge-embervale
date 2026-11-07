// Fumée de l'interface (faux DOM) : chaque objectif, seul et avec un secondaire, en vue graphe et liste, comparaison A/B ; adresse jamais touchée par un rendu.
test('rendu complet de chaque objectif (seul, avec secondaire, arbre libre), vue graphe et liste, A contre B, sans exception', () => keepUi(() => {
  const keepT = globalThis.toast; globalThis.toast = () => {};
  try {
    for (const g of GOALS) for (const s of [null, 'healer', 'storm']) { builds[0] = goalBuild(g.id, s === g.id ? null : s); cur = 0;
      for (const v of ['graph', 'list']) for (const c of [false, true]) { view = v; compare = c; renderAll(); } }
    builds[0] = blankBuild(); view = 'list'; area = 'mag'; query = 'feu'; onlyOn = true; renderAll();
  } finally { globalThis.toast = keepT; }
}));
test('un rendu ne touche jamais l\'adresse (le hash est réservé au code de partage) ni le stockage', () => keepUi(() => {
  const rs = history.replaceState, wrote = []; let n = 0; history.replaceState = () => { n++; };
  try { withLs(fakeLs(() => null, k => wrote.push(k)), () => { renderAll(); view = 'list'; renderAll(); }); } finally { history.replaceState = rs; }
  assert.equal(n, 0); assert.deepEqual(wrote, []);
}));
test('choisir un objectif (menus) : combo posé et gemmes ; secondaire ; retour en arbre libre qui garde l\'arbre', () => keepUi(() => {
  const keepT = globalThis.toast, msgs = []; globalThis.toast = t => msgs.push(t);
  try {
    builds[0] = blankBuild(); cur = 0; pickGoal(0, 'ice');
    assert.deepEqual(B().obj, ['ice', null]); assert.deepEqual(B().sk, combo('ice', null, 50, 114, 11).sk); assert.deepEqual(B().gem, GOALI.ice.gem); assert.match(msgs.pop(), /Combo « Mage de glace/);
    pickGoal(1, 'necro'); assert.deepEqual(B().obj, ['ice', 'necro']); assert.deepEqual(B().sk, combo('ice', 'necro', 50, 114, 11).sk);
    pickGoal(0, 'necro'); assert.deepEqual(B().obj, ['necro', null], 'nouveau principal = ancien secondaire : secondaire retiré');
    const sk = {...B().sk}; pickGoal(0, ''); assert.deepEqual(B().obj, []); assert.deepEqual(B().sk, sk, 'arbre libre : arbre gardé'); assert.match(msgs.pop(), /Arbre libre/);
    setting('lvl', 20); assert.deepEqual(B().sk, sk, 'arbre libre : réglage sans effet sur l\'arbre');
  } finally { globalThis.toast = keepT; }
}));
test('builds enregistrés : enregistrer puis recharger donne le même build (objectifs, arbre, gemmes)', () => keepUi(() => {
  let store = null; const keepT = globalThis.toast; globalThis.toast = () => {};
  try { withLs(fakeLs(() => store, (k, v) => { store = v; }), () => {
    builds[0] = goalBuild('assassin', 'archer', 'Mon assassin'); cur = 0; saveCur();
    const s = JSON.parse(store); assert.equal(s.length, 1); const r = loadSaved(s[0]);
    for (const k of ['obj', 'sk', 'pn', 'pip', 'gem', 'lvl', 'exp', 'flame']) assert.deepEqual(r[k], builds[0][k], k); }); }
  finally { globalThis.toast = keepT; }
}));
test('« Pourquoi ce combo » : étape en partie, manque affiché, pastilles bornées à l\'étape', () => keepUi(() => {
  const el = {}, keep = document.querySelector; document.querySelector = q => q === '#why' ? el : keep(q);
  try {
    builds[0] = goalBuild('tank'); cur = 0; builds[0].lvl = 12; builds[0].exp = 0; rebuild(builds[0], null); renderWhy();
    assert.match(el.innerHTML, /il manque \d+ pts? pour/); assert.match(el.innerHTML, /class="wstep (part|no)"/);
    const chips = [...el.innerHTML.matchAll(/<span class="chip off">([^<]+)<\/span>/g)].map(m => m[1]); assert.ok(chips.some(t => /(\d+)\/(\d+)/.test(t) && +t.match(/(\d+)\//)[1] < +t.match(/\/(\d+)/)[1]), 'pastille « got/want » absente');
    builds[0] = goalBuild('tank', 'healer'); renderWhy();
    for (const m of el.innerHTML.matchAll(/(\d+)\/(\d+)<\/span>/g)) assert.ok(+m[1] <= +m[2], 'pastille au-delà de l\'étape : ' + m[0]);
    builds[0] = blankBuild(); renderWhy(); assert.match(el.innerHTML, /Aucun objectif/);
  } finally { document.querySelector = keep; }
}));
test('réglage avec objectif : le combo suit le nouveau budget', () => keepUi(() => {
  const keepT = globalThis.toast; globalThis.toast = () => {};
  try { builds[0] = goalBuild('mageCrit'); cur = 0; setting('lvl', 20);
    assert.deepEqual(B().sk, combo('mageCrit', null, 20, 114, 11).sk); assert.ok(spentPoints(B()) <= budget(B())); }
  finally { globalThis.toast = keepT; }
}));
test('graphe : nœud imposé sans anneau « ajouté », avec son étape ; nœud ajouté marqué « Ajouté par vous »', () => keepUi(() => {
  builds[0] = goalBuild('mageCrit'); cur = 0; const b = B(), n = TOPO.N.find(x => x.kind === 'skill' && !b.sk[x.id] && canBuy(b, x)); addRank(b, n.id);
  G.refresh(); const w = TOPO.byId.wizard;
  assert.equal(G.isAdd(w), false); assert.match(G.origin(b, w), /Imposé par « Mage critique \(baguette\) » · étape 1 : Chance de critique/);
  assert.equal(G.isAdd(n), true); assert.match(G.origin(b, n), /Ajouté par vous/);
}));
test('recherche sans accents ni majuscules', () => { assert.ok(fold('Égorgeur').includes(fold('EGORGEUR'))); assert.equal(fold('Pyromane'), 'pyromane'); });
