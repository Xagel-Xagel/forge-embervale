// Onglets des parties (1.15.0) : liste, onglet retenu dans ce navigateur (lsGet/lsSet, try/catch), repli sur Arbre,
// adresse jamais touchée (le hash est le code de partage), seul l'onglet ouvert du calculateur est rendu.
const fakeLs = (get, set) => ({getItem: get, setItem: set || (() => {})});
const withLs = (ls, fn) => { const keep = globalThis.localStorage; globalThis.localStorage = ls; try { return fn(); } finally { globalThis.localStorage = keep; } };
const spyOn = (names, fn) => { const keep = names.map(n => globalThis[n]), calls = []; names.forEach(n => { globalThis[n] = (...a) => { calls.push(n); }; });
  try { fn(calls); } finally { names.forEach((n, i) => { globalThis[n] = keep[i]; }); } };

test('onglets : les six parties retenues au QCM, dans l\'ordre, identifiants distincts', () => {
  assert.deepEqual(SECS.map(s => s[1]), ['Arbre', 'Équipement', 'Calculateur', 'Build optimal', 'Défense', 'Tables']);
  assert.equal(new Set(SECS.map(s => s[0])).size, 6);
  assert.deepEqual(OPT_SECS, ['calc', 'bo', 'def', 'tab'], 'onglets rendus par renderOptNow');
});

test('onglet retenu : relu s\'il est connu, Arbre sinon (absent, inconnu, illisible, pas une chaîne, stockage bloqué)', () => {
  const asked = [];
  assert.equal(withLs(fakeLs(k => { asked.push(k); return JSON.stringify('bo'); }), secSaved), 'bo');
  assert.deepEqual(asked, [LS_SEC], 'clé lue');
  for (const [why, get] of [['absent', () => null], ['inconnu', () => '"zz"'], ['illisible', () => '{oups'], ['nombre', () => '3'], ['vide', () => ''],
    ['stockage bloqué', () => { throw new Error('SecurityError'); }]])
    assert.equal(withLs(fakeLs(get), secSaved), 'tree', why);
});

test('ouvrir un onglet le retient (clé propre, JSON) ; stockage plein ou bloqué : aucune exception ; onglet inconnu → Arbre', () => {
  const keep = sec;
  try {
    const wrote = [];
    withLs(fakeLs(() => null, (k, v) => wrote.push([k, v])), () => showSec('def'));
    assert.equal(sec, 'def'); assert.deepEqual(wrote, [[LS_SEC, '"def"']]);
    assert.notEqual(LS_SEC, LS, 'l\'onglet ne doit pas écraser les builds enregistrés');
    withLs(fakeLs(() => null, () => { throw new Error('QuotaExceededError'); }), () => showSec('tab'));
    assert.equal(sec, 'tab');
    withLs(fakeLs(() => null), () => showSec('nope')); assert.equal(sec, 'tree');
    const wrote2 = []; withLs(fakeLs(() => null, (k, v) => wrote2.push(k)), () => showSec('calc', true));
    assert.equal(sec, 'calc'); assert.deepEqual(wrote2, [], 'au démarrage (quiet), rien n\'est écrit');
  } finally { withLs(fakeLs(() => null), () => showSec(keep, true)); }
});

test('builds enregistrés : lsGet / lsSet sans clé gardent leur comportement (liste vide si absent ou illisible)', () => {
  for (const [why, get] of [['absent', () => null], ['vide', () => ''], ['illisible', () => '{oups'], ['bloqué', () => { throw new Error('x'); }]])
    assert.deepEqual(withLs(fakeLs(get), () => lsGet()), [], why);
  const asked = [];
  assert.deepEqual(withLs(fakeLs(k => { asked.push(k); return '[{"name":"x"}]'; }), () => lsGet()), [{name: 'x'}]);
  assert.deepEqual(asked, [LS]);
  const wrote = []; assert.equal(withLs(fakeLs(() => null, (k, v) => wrote.push([k, v])), () => lsSet([1])), true);
  assert.deepEqual(wrote, [[LS, '[1]']]);
  assert.equal(withLs(fakeLs(() => null, () => { throw new Error('x'); }), () => lsSet([1])), false);
});

test('onglets : l\'adresse (code de partage) n\'est jamais touchée', () => {
  const keepH = location.hash, keepR = history.replaceState, keepS = sec; let calls = 0;
  location.hash = '#b3-abc'; history.replaceState = () => { calls++; };
  try { withLs(fakeLs(() => null), () => { for (const [k] of SECS) showSec(k); }); assert.equal(location.hash, '#b3-abc'); assert.equal(calls, 0); }
  finally { location.hash = keepH; history.replaceState = keepR; withLs(fakeLs(() => null), () => showSec(keepS, true)); }
});

test('renderOptNow ne rend que l\'onglet ouvert ; Arbre et Équipement : aucun rendu du calculateur', () => {
  const keep = sec, want = {tree: [], eq: [], calc: ['optCalc'], bo: ['optBo'], def: ['optDef'], tab: ['optTab']};
  try {
    spyOn(['optCalc', 'optBo', 'optDef', 'optTab'], calls => {
      for (const [k] of SECS) { calls.length = 0; showSec(k, true); renderOptNow(); assert.deepEqual(calls, want[k], 'onglet ' + k); }
      calls.length = 0; withLs(fakeLs(() => null), () => showSec('def')); assert.deepEqual(calls, ['optDef'], 'ouvrir un onglet du calculateur le rend aussitôt');
      calls.length = 0; withLs(fakeLs(() => null), () => showSec('eq')); assert.deepEqual(calls, [], 'Équipement : rien à rendre');
    });
  } finally { showSec(keep, true); }
});

test('build optimal en cours : un réglage changé l\'arrête, quel que soit l\'onglet ouvert', () => {
  const keep = sec, keepBO = {busy: BO.busy, key: BO.key};
  try {
    spyOn(['boStopRun', 'optCalc', 'optBo', 'optDef', 'optTab'], calls => {
      for (const [k] of SECS) { calls.length = 0; showSec(k, true); BO.busy = true; BO.key = 'périmée'; renderOptNow(); assert.ok(calls.includes('boStopRun'), 'onglet ' + k); }
      calls.length = 0; BO.key = boKey(B()); renderOptNow(); assert.ok(!calls.includes('boStopRun'), 'clé valable : le calcul continue');
    });
  } finally { Object.assign(BO, keepBO); showSec(keep, true); }
});

test('graphe : G.wake recale la taille sans changer le cadrage ; G.resize recadre', () => {
  const n = G.nodes.find(x => x.id === 'wizard');
  G.focus('war'); const a = G.screen(n);
  G.wake(); assert.deepEqual(G.screen(n), a, 'wake ne doit pas recadrer (zoom de l\'utilisateur gardé)');
  G.resize(); const b = G.screen(n); assert.notDeepEqual(b, a, 'resize recadre sur la zone choisie');
});
