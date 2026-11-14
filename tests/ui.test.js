// Fumée de l'interface (faux DOM) : chaque objectif, seul et avec un secondaire, en vue graphe et liste, comparaison A/B ; adresse jamais touchée par un rendu.
test('rendu complet de chaque objectif (seul, avec secondaire, arbre libre), vue graphe et liste, A contre B, sans exception', () => keepUi(() => {
  const keepT = globalThis.toast; globalThis.toast = () => {};
  try {
    for (const g of GOALS) for (const s of [null, 'healer', 'storm']) { builds[0] = goalBuild(g.id, s === g.id ? null : s, '', SUPS[GOALS.indexOf(g) % SUPS.length].id); cur = 0;
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
    builds[0] = blankBuild(); pickGoal(0, 'archer'); pickGoal(2, 'resist'); assert.deepEqual(B().obj, ['archer', null, 'resist']); assert.deepEqual(B().sk, combo('archer', null, 50, 114, 11, 'resist').sk);
    pickGoal(1, 'tank'); assert.deepEqual(B().obj, ['archer', 'tank', 'resist'], 'secondaire choisi : soutien gardé');
    pickGoal(0, 'ice'); assert.deepEqual(B().obj, ['ice', 'tank', 'resist'], 'nouveau principal : soutien gardé');
    pickGoal(2, ''); assert.deepEqual(B().obj, ['ice', 'tank']);
    const el = {}, keep = document.querySelector; document.querySelector = q => q === '#why' ? el : keep(q);
    try { builds[0] = goalBuild('archer', 'tank', 'x', 'mana'); renderWhy(); assert.match(el.innerHTML, /Soutien<\/span> Mana/); assert.match(el.innerHTML, /Secondaire<\/span> Tank/); } finally { document.querySelector = keep; }
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
// Haut de page explicite (2.2.0) : fil des étapes 1 → 5, chaque étape mène à un panneau existant, aucun bouton perdu
test('fil des étapes : 5 étapes dans l\'ordre, chacune vers un panneau numéroté ; tous les boutons du haut gardés', () => {
  const {readFileSync} = process.getBuiltinModule('node:fs'), html = readFileSync(process.getBuiltinModule('node:path').join(globalThis.__root, 'src/page.html'), 'utf8'); // racine du lanceur, pas le dossier courant (relecture QA 2.4.0)
  const go = [...html.matchAll(/data-go="([\w-]+)"><b>(\d)<\/b>/g)].map(m => [m[1], m[2]]);
  assert.deepEqual(go.map(g => g[1]), ['1', '2', '3', '4', '5']);
  for (const [id, n] of go) { const sec = html.match(new RegExp(`<section[^>]*id="${id}"[^>]*>\\s*<div class="ph"><h2[^>]*><span class="num">(\\d)</span>`)); assert.ok(sec, 'panneau ' + id); assert.equal(sec[1], n, 'numéro du panneau ' + id); }
  for (const id of ['buildTabs', 'buildName', 'cmp', 'save', 'saved', 'delSaved', 'share', 'import', 'copyAB', 'reset']) assert.equal(html.split(`id="${id}"`).length, 2, 'bouton #' + id);
  assert.ok(!/href="#/.test(html), 'aucun lien vers le hash (réservé au code de partage)');
});
test('goStep : descend au panneau, focus sur son titre, sans toucher l\'adresse ; panneau inconnu refusé', () => {
  const calls = [], h = {focus: o => calls.push(['focus', o])}, p = {querySelector: q => q === 'h2' ? h : null, scrollIntoView: o => calls.push(['scroll', o])};
  const keep = document.querySelector, rs = history.replaceState; let n = 0; history.replaceState = () => { n++; };
  document.querySelector = q => q === '#p-why' ? p : q === '#nope' ? null : keep(q);
  try { assert.equal(goStep('p-why'), true); assert.equal(goStep('nope'), false); } finally { document.querySelector = keep; history.replaceState = rs; }
  assert.deepEqual(calls, [['scroll', {behavior: 'smooth', block: 'start'}], ['focus', {preventScroll: true}]]); assert.equal(h.tabIndex, -1); assert.equal(n, 0);
});
// 2.3.0 : combo recalculé avec vos ajouts — rendu, message, « Pourquoi ce combo », lien d'avant la 2.3.0 signalé
test('ajouts avec objectif : rendu graphe et liste, message de recalcul, ligne « vos ajouts » et explication', () => keepUi(() => quiet(msgs => {
  builds[0] = goalBuild('mageCrit'); cur = 0; const b = B(); [b.lvl, b.exp] = ptsAt(80); rebuild(b); assert.ok(addPipNode(b, TOPO.byId['pip:1wwtpca']));
  assert.equal(msgs.at(-1), 'Combo recalculé : liaisons 30 pts → 27 pts · +4 pts sur les étapes');
  for (const v of ['graph', 'list']) { view = v; renderAll(); }
  const el = {}, keep = document.querySelector; document.querySelector = q => q === '#why' ? el : keep(q);
  try { renderWhy(); assert.match(el.innerHTML, /Liaisons 27 pts · vos ajouts 1 pt/); assert.match(el.innerHTML, /Vos ajouts comptent comme déjà acquis/); } finally { document.querySelector = keep; }
  // « Acheter le chemin » avec objectif : le chemin entre dans vos ajouts
  const far = TOPO.N.find(x => x.kind === 'skill' && !owned(b, x) && !canBuy(b, x) && pathTo(b, x)); buyTo(b, far);
  assert.ok(b.ad.sk[far.id] === 1 && owned(b, far)); assert.equal(lostOf(b).length, 0); assert.equal(lockOf(b, far), 0);
})));
test('lien d\'avant la 2.3.0 avec ajouts : message, adresse remplacée par le code recalculé (avec -a)', () => keepUi(() => quiet(msgs => {
  const [lv, ex] = ptsAt(80), z = combo('mageCrit', null, lv, ex, 11), old = blankBuild('ancien');
  Object.assign(old, {lvl: lv, exp: ex, obj: ['mageCrit', null], sk: {...z.sk}, pn: {...z.pn, 'pip:1wwtpca': 1}}); syncPips(old);
  let url = null; const rs = history.replaceState, st = globalThis.setTimeout; history.replaceState = (s, t, u) => { url = u; }; globalThis.setTimeout = f => f();
  location.hash = '#' + encode(old);
  try { assert.equal(fromHash(), true); } finally { history.replaceState = rs; globalThis.setTimeout = st; location.hash = ''; }
  assert.match(url, /^#b3-.*-a[0-9a-z]+-[0-9a-z]+-[0-9a-z]{2}$/); assert.ok(msgs.some(m => /^Lien ou build d'avant la 2\.3\.0 : combo recalculé avec vos ajouts/.test(m) && /\(liaisons 30 pts → 27 pts · \+4 pts sur les étapes\)$/.test(m)));
})));

// 2.4.0 : objectifs optimisés — source communautaire et ordre optimisé dans « Pourquoi ce combo » ; gemmes en place gardées par un objectif sans gemme
test('2.4.0 · « Pourquoi ce combo » : étiquette communauté et source, phrase sur l\'ordre optimisé ; message « gemmes inchangées »', () => keepUi(() => {
  const keepT = globalThis.toast, msgs = []; globalThis.toast = t => msgs.push(t);
  try {
    builds[0] = goalBuild('tank'); cur = 0; pickGoal(0, 'battlemage');
    assert.match(msgs.pop(), /^Combo « Mage de bataille \(épée et baguette\) » posé, gemmes inchangées$/); assert.deepEqual(B().gem, GOALI.tank.gem);
    pickGoal(0, 'ice'); assert.match(msgs.pop(), /^Combo « Mage de glace \(contrôle\) » posé, avec ses gemmes$/);
    const el = {}, keep = document.querySelector; document.querySelector = q => q === '#why' ? el : keep(q);
    try {
      builds[0] = goalBuild('battlemage'); renderWhy();
      assert.match(el.innerHTML, /<span class="tag est">communauté<\/span> « Battlemage Hybrid », PinDrop/);
      assert.match(el.innerHTML, /<span class="tag hyp">hypothèse<\/span> Voie du barbare retirée/, 'part du simulateur non dite');
      assert.match(el.innerHTML, /Pour « Mage de bataille \(épée et baguette\) », l'ordre des éléments de chaque étape est calculé hors ligne : combo complet au moindre coût à 212 points, puis l'avancée la plus rapide quand les points montent\./);
      builds[0] = goalBuild('swordBow', 'archer'); renderWhy(); assert.doesNotMatch(el.innerHTML, /tag est/, 'composé par le simulateur : pas d\'étiquette communauté');
      assert.match(el.innerHTML, /<span class="tag hyp">hypothèse<\/span> Contenu composé d'après les descriptions des compétences/, 'composé par le simulateur : étiquette hypothèse absente');
      assert.match(el.innerHTML, /Pour « Épée et arc », l'ordre/); assert.doesNotMatch(el.innerHTML, /Pour [^.]*« Archer »/, 'objectif d\'origine cité comme optimisé');
      builds[0] = goalBuild('archer', 'tank'); renderWhy(); assert.doesNotMatch(el.innerHTML, /calculé hors ligne/, 'objectifs d\'origine : pas de phrase sur l\'ordre optimisé');
    } finally { document.querySelector = keep; }
  } finally { globalThis.toast = keepT; }
}));
// 2.7.0 : « Réglez vos points » montre le maximum de chaque champ et du total (l'utilisateur croyait les points bloqués à 114)
test('2.7.0 · points : maximum du niveau (98), de l\'exploration (114) et du total (212) affichés ; calcul inchangé', () => keepUi(() => {
  const qs = document.querySelector, els = {}; document.querySelector = k => els[k] || (els[k] = qs(k)); // faux DOM : un élément par sélecteur, le temps du test
  try {
  builds[0] = blankBuild(); cur = 0; Object.assign(B(), {lvl: 20, exp: 30}); renderPoints();
  assert.equal($('#lvlMax').textContent, '98 pts max'); assert.equal($('#expMax').textContent, '114 pts max');
  assert.match($('#ptMax').textContent, /^Budget 68 sur 212 au maximum/); assert.equal(budget(B()), 68);
  Object.assign(B(), {lvl: 50, exp: 114}); renderPoints(); assert.match($('#ptMax').textContent, /^Budget 212 : le maximum/);
  assert.deepEqual([budget({lvl: 50, exp: 0}), budget({lvl: 1, exp: 114}), budget({lvl: 50, exp: 114})], [98, 114, 212], 'docs/FORMULAS.md');
  } finally { document.querySelector = qs; }
}));
