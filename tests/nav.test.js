// Onglets des parties (1.15.0) : liste, onglet retenu dans ce navigateur (lsGet/lsSet, try/catch), repli sur Arbre,
// adresse jamais touchée (le hash est le code de partage), seul l'onglet ouvert du calculateur est rendu.
const fakeLs = (get, set) => ({getItem: get, setItem: set || (() => {})});
const withLs = (ls, fn) => { const keep = globalThis.localStorage; globalThis.localStorage = ls; try { return fn(); } finally { globalThis.localStorage = keep; } };
const spyOn = (names, fn) => { const keep = names.map(n => globalThis[n]), calls = []; names.forEach(n => { globalThis[n] = (...a) => { calls.push(n); }; });
  try { fn(calls); } finally { names.forEach((n, i) => { globalThis[n] = keep[i]; }); } };

test('onglets : les six parties retenues au QCM, dans l\'ordre, identifiants distincts', () => {
  assert.deepEqual(SECS.map(s => s[1]), ['Arbre', 'Équipement', 'Calculateur', 'Build optimal', 'Défense', 'Tables']);
  assert.equal(new Set(SECS.map(s => s[0])).size, 6);
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
      calls.length = 0; BO.busy = false; BO.key = 'périmée'; renderOptNow(); assert.ok(!calls.includes('boStopRun'), 'aucun calcul en cours : rien à arrêter');
    });
  } finally { Object.assign(BO, keepBO); showSec(keep, true); }
});

test('graphe : G.wake suit la taille (cachée = largeur 0, puis nouvelle taille) sans changer le cadrage ; G.resize recadre', () => {
  const n = G.nodes.find(x => x.id === 'wizard'), keepA = area;
  try {
    area = 'all'; globalThis.__rect = null; G.wake(); G.focus('war'); const [x, y] = G.screen(n); // cadrage de l'utilisateur : zone Guerrier, différent de « Tout »
    globalThis.__rect = {width: 0, height: 0, left: 0, top: 0}; G.wake();
    assert.deepEqual(G.screen(n), [x - 500, y], 'graphe caché : largeur 0 (rien n\'est dessiné), caméra inchangée');
    globalThis.__rect = {width: 800, height: 500, left: 0, top: 0}; G.wake();
    assert.deepEqual(G.screen(n), [x - 100, y - 50], 'nouvelle taille prise, même caméra (zoom de l\'utilisateur gardé, pas de recadrage sur « Tout »)');
    G.resize(); assert.notDeepEqual(G.screen(n), [x - 100, y - 50], 'resize recadre sur la zone choisie (« Tout »)');
  } finally { globalThis.__rect = null; area = keepA; G.wake(); G.resize(); }
});

// ---- Faux éléments persistants : le faux DOM de dom-stub.cjs ne garde rien ; $ passe par document.querySelector,
// remplacé le temps d'un test par une table id → élément qui garde attributs, hidden, tabIndex, classes, parent et innerHTML.
function fakeDom(fn) {
  const keep = document.querySelector, els = {}, any = () => keep('#rien');
  const el = id => els[id] || (els[id] = mkEl(id));
  function mkEl(id) {
    const a = {}, e = {id, hidden: false, tabIndex: 0, parent: null, cls: new Set(), innerHTML: '', top: 300, bottom: 340, scrolls: 0, focused: 0,
      setAttribute(k, v) { a[k] = String(v); }, getAttribute(k) { return k in a ? a[k] : null; },
      classList: {toggle(c, on) { if (on) e.cls.add(c); else e.cls.delete(c); }},
      appendChild(c) { c.parent = e; return c; }, getBoundingClientRect() { return {top: e.top, bottom: e.bottom, left: 0, right: 0, width: 1000, height: 40}; },
      scrollIntoView() { e.scrolls++; }, focus() { e.focused++; }, querySelector(s) { return /^#[\w-]+$/.test(s) ? el(s.slice(1)) : any(); }, querySelectorAll() { return []; }};
    return new Proxy(e, {get: (o, k) => k in o ? o[k] : any()[k]});
  }
  el('optBar').parent = el('optTarget');
  document.querySelector = s => /^#[\w-]+$/.test(s) ? el(s.slice(1)) : keep(s);
  try { return fn(el); } finally { document.querySelector = keep; }
}
const noLs = fn => withLs(fakeLs(() => null), fn);
const PARENT = {calc: 'optTarget', bo: 'boTarget'};

test('showSec (DOM observé) : un seul onglet sélectionné, tabindex itinérant, un seul panneau, fiche et barre de cible au bon endroit', () => {
  const keep = sec;
  try {
    fakeDom(el => noLs(() => spyOn(['optCalc', 'optBo', 'optDef', 'optTab'], () => {
      let bar = 'optTarget';
      // tree → bo → calc → bo → tab → calc : la barre de cible revient bien dans le Calculateur après Build optimal
      for (const k of ['tree', 'bo', 'calc', 'bo', 'tab', 'def', 'calc', 'eq']) {
        showSec(k);
        for (const [j] of SECS) {
          assert.equal(el('t-' + j).getAttribute('aria-selected'), String(j === k), `aria-selected de t-${j} (ouvert : ${k})`);
          assert.equal(el('t-' + j).tabIndex, j === k ? 0 : -1, `tabIndex de t-${j} (ouvert : ${k})`);
          assert.equal(el('p-' + j).hidden, j !== k, `panneau p-${j} (ouvert : ${k})`);
        }
        const side = k === 'tree' || k === 'eq';
        assert.equal(el('ficheAside').hidden, !side, 'fiche dans ' + k); assert.equal(el('secLay').cls.has('side'), side, 'colonne de la fiche dans ' + k);
        if (PARENT[k]) bar = PARENT[k];
        assert.equal(el('optBar').parent.id, bar, 'barre de cible dans ' + k);
      }
    })));
  } finally { noLs(() => showSec(keep, true)); }
});

test('showSec (DOM observé) : page défilée → haut de la partie ramené sous les onglets ; sinon rien ne bouge ; même onglet : ni rendu ni écriture', () => {
  const keep = sec;
  try {
    fakeDom(el => spyOn(['optCalc', 'optBo', 'optDef', 'optTab', 'lsSet'], calls => {
      showSec('def', true); el('secBar').bottom = 60;
      el('p-calc').top = 20; showSec('calc'); assert.equal(el('p-calc').scrolls, 1, 'partie cachée sous les onglets : ramenée');
      assert.deepEqual(calls, ['lsSet', 'optCalc']);
      calls.length = 0; el('p-calc').top = 400; showSec('calc'); assert.equal(el('p-calc').scrolls, 1, 'partie déjà visible : pas de défilement');
      assert.deepEqual(calls, [], 'onglet déjà ouvert : ni écriture ni rendu');
      el('p-calc').top = 10; showSec('calc'); assert.equal(el('p-calc').scrolls, 2, 'clic sur l\'onglet ouvert, page défilée : retour en haut de la partie');
    }));
  } finally { noLs(() => showSec(keep, true)); }
});

test('build optimal en cours : changer d\'onglet ne l\'arrête pas ; passer de A à B l\'arrête et, hors de son onglet, le dit', () => {
  const keep = sec, keepBO = {busy: BO.busy, key: BO.key}, keepCur = cur;
  try {
    fakeDom(() => noLs(() => spyOn(['boStopRun', 'toast', 'optCalc', 'optBo', 'optDef', 'optTab'], calls => {
      showSec('tree', true); BO.busy = true; BO.key = boKey(B());
      for (const [k] of SECS) showSec(k);
      assert.ok(!calls.includes('boStopRun'), 'un changement d\'onglet a arrêté le calcul');
      calls.length = 0; showSec('def', true); cur = 1 - cur; renderOptNow();
      assert.ok(calls.includes('boStopRun'), 'build A → B : calcul non arrêté'); assert.ok(calls.includes('toast'), 'arrêt hors de l\'onglet Build optimal : aucun message');
      calls.length = 0; cur = keepCur; BO.busy = true; BO.key = 'périmée'; showSec('bo', true); renderOptNow();
      assert.ok(calls.includes('boStopRun') && !calls.includes('toast'), 'dans l\'onglet Build optimal, la carte le montre : pas de message en plus');
    })));
  } finally { cur = keepCur; Object.assign(BO, keepBO); noLs(() => showSec(keep, true)); }
});

test('build optimal terminé hors de son onglet : un message le dit ; dans son onglet : pas de message', async () => {
  const keep = sec, keepRun = globalThis.boRun, keepToast = globalThis.toast, said = [];
  const quick = function* (slot, en, N, F) { yield; return {res: BO_FAM.map(f => ({fk: f[0], fl: f[1], skip: true})), ms: 1, N, F, slot, en: ENEMIES.indexOf(en)}; };
  const done = async () => { const t0 = Date.now(); while (BO.busy) { if (Date.now() - t0 > 2000) throw new Error('calcul non terminé'); await new Promise(r => setTimeout(r, 3)); } };
  try {
    globalThis.boRun = quick; globalThis.toast = t => said.push(t);
    showSec('calc', true); boStart(); await done();
    assert.ok(said.some(t => /Build optimal calculé/.test(t)), 'aucun message à la fin du calcul hors de son onglet');
    said.length = 0; showSec('bo', true); boStart(); await done();
    assert.ok(!said.some(t => /Build optimal calculé/.test(t)), 'message inutile dans l\'onglet Build optimal');
  } finally { globalThis.boRun = keepRun; globalThis.toast = keepToast; Object.assign(BO, {busy: false, out: null, part: null, key: '', stop: false, err: ''}); showSec(keep, true); }
});

test('Tables : rendue une fois par cible (défilement gardé quand le build change), de nouveau quand la cible change', () => {
  const keepE = oEnemy, keepT = tabEn, keepS = sec;
  try {
    fakeDom(el => {
      showSec('tab', true); tabEn = null; renderOptNow(); assert.ok(el('tabBody').innerHTML.includes('Table complète'), 'Tables non rendue');
      el('tabBody').innerHTML = 'repère'; builds[cur].lvl = builds[cur].lvl > 1 ? builds[cur].lvl - 1 : 2; renderOptNow();
      assert.equal(el('tabBody').innerHTML, 'repère', 'build changé : la table ne dépend pas du build, elle ne doit pas être refaite');
      oEnemy = (oEnemy + 1) % ENEMIES.length; renderOptNow(); assert.ok(el('tabBody').innerHTML.includes('Table complète'), 'cible changée : la ligne surlignée doit suivre');
    });
  } finally { oEnemy = keepE; tabEn = keepT; showSec(keepS, true); builds[0] = fromPreset(PRESETS[0]); builds[1] = fromPreset(PRESETS[3]); }
});

test('plan « Répartir au mieux » : gardé d\'un onglet à l\'autre, oublié dès que le build, la cible ou l\'arme analysée change', () => {
  const keepS = sec, keepM = planMem, keepE = oEnemy, keepSl = oSlot;
  try {
    builds[0] = blankBuild('Plan'); builds[0].gear.w1 = WEAPONS[0][0]; cur = 0; oSlot = 'w1'; // arbre vide : 5 points s'investissent (un preset est déjà au plafond)
    fakeDom(el => noLs(() => {
      showSec('tree', true);
      planMem = {k: planKey(B()), P: planPoints(B(), oSlot, ENEMIES[oEnemy], 5), N: 5};
      assert.ok(planMem.P && planMem.P.steps.length, 'plan de test vide');
      showSec('calc'); assert.ok(el('planOut').innerHTML.includes('Appliquer le plan'), 'plan perdu en rouvrant le Calculateur');
      for (const [why, ch, back] of [['build', () => { B().lvl--; }, () => { B().lvl++; }], ['cible', () => { oEnemy = (oEnemy + 1) % ENEMIES.length; }, () => { oEnemy = keepE; }],
        ['arme analysée', () => { oSlot = 'w2'; }, () => { oSlot = 'w1'; }]]) {
        el('planOut').innerHTML = ''; ch(); renderOptNow(); assert.equal(el('planOut').innerHTML, '', 'plan périmé affiché (' + why + ' changé)'); back();
      }
      el('planOut').innerHTML = ''; renderOptNow(); assert.ok(el('planOut').innerHTML.includes('Appliquer le plan'), 'réglages remis : le plan revient');
      const want = clone(planMem.P.t); el('planApply').onclick(); assert.equal(planMem, null, 'plan appliqué : oublié');
      assert.deepEqual(JSON.parse(JSON.stringify(B().sk)), want.sk, '« Appliquer le plan » n\'a pas appliqué le plan');
    }));
  } finally { planMem = keepM; oEnemy = keepE; oSlot = keepSl; builds[0] = fromPreset(PRESETS[0]); builds[1] = fromPreset(PRESETS[3]); cur = 0; showSec(keepS, true); }
});

test('démarrage : l\'onglet retenu est relu et appliqué au DOM (sans écriture ni rendu) ; illisible → Arbre', () => {
  const keep = sec;
  try {
    for (const [stored, want] of [['"def"', 'def'], ['"bo"', 'bo'], ['{oups', 'tree'], [null, 'tree']])
      fakeDom(el => spyOn(['optCalc', 'optBo', 'optDef', 'optTab', 'lsSet'], calls => {
        withLs(fakeLs(() => stored), initSec);
        assert.equal(sec, want, 'onglet retenu ' + stored); assert.deepEqual(calls, [], 'au démarrage : ni écriture ni rendu (renderAll suit)');
        assert.equal(el('t-' + want).getAttribute('aria-selected'), 'true'); assert.equal(el('p-' + want).hidden, false, 'panneau de l\'onglet retenu caché');
        for (const [j] of SECS) if (j !== want) assert.equal(el('p-' + j).hidden, true, 'panneau ' + j + ' visible au démarrage');
        assert.equal(el('optBar').parent.id, want === 'bo' ? 'boTarget' : 'optTarget', 'barre de cible au démarrage');
      }));
  } finally { showSec(keep, true); }
});

test('clavier : ← → en boucle, Début, Fin, focus sur l\'onglet atteint ; Alt, Ctrl, Cmd et autres touches laissés au navigateur', () => {
  const keep = sec;
  try {
    fakeDom(el => noLs(() => spyOn(['optCalc', 'optBo', 'optDef', 'optTab'], () => {
      showSec('tree', true);
      const press = (key, from, mod) => { const e = Object.assign({key, target: {id: from}, pd: 0, preventDefault() { e.pd++; }}, mod || {}); secKey(e); return e; };
      for (const [key, from, want] of [['End', 't-tree', 'tab'], ['ArrowRight', 't-tab', 'tree'], ['ArrowLeft', 't-tree', 'tab'], ['Home', 't-tab', 'tree'], ['ArrowRight', 't-tree', 'eq']]) {
        const f0 = el('t-' + want).focused, e = press(key, from);
        assert.equal(sec, want, key + ' depuis ' + from); assert.equal(el('t-' + want).focused, f0 + 1, 'focus sur t-' + want); assert.equal(e.pd, 1, 'défilement de la page empêché');
      }
      for (const mod of [{altKey: true}, {ctrlKey: true}, {metaKey: true}]) { const e = press('ArrowRight', 't-eq', mod); assert.equal(sec, 'eq', JSON.stringify(mod)); assert.equal(e.pd, 0); }
      const e = press('a', 't-eq'); assert.equal(sec, 'eq'); assert.equal(e.pd, 0, 'touche ordinaire : rien d\'empêché');
    })));
  } finally { showSec(keep, true); }
});

test('clic : sur un onglet, focus posé dessus ; sur un ennemi de Tables, cible changée, Calculateur ouvert, focus sur son onglet, message', () => {
  const keepS = sec, keepE = oEnemy, keepT = tabEn, keepToast = globalThis.toast, said = [];
  try {
    globalThis.toast = t => said.push(t);
    fakeDom(el => noLs(() => {
      showSec('tree', true); secClick('def'); assert.equal(sec, 'def'); assert.equal(el('t-def').focused, 1, 'focus non posé sur l\'onglet cliqué');
      tabEn = null; showSec('tab'); const i = (oEnemy + 7) % ENEMIES.length;
      el('mxBody').onclick({target: {closest: s => s === 'button[data-en]' ? {dataset: {en: String(i)}} : null}});
      assert.equal(oEnemy, i, 'cible'); assert.equal(sec, 'calc', 'Calculateur non ouvert'); assert.equal(el('t-calc').focused, 1, 'focus non posé sur l\'onglet Calculateur');
      assert.equal(el('optBar').parent.id, 'optTarget'); assert.ok(said.some(t => t.includes(ENEMIES[i].n)), 'message de la nouvelle cible absent');
      const n = said.length; el('mxBody').onclick({target: {closest: () => null}}); assert.equal(said.length, n, 'clic hors d\'un nom : rien');
    }));
  } finally { globalThis.toast = keepToast; oEnemy = keepE; tabEn = keepT; showSec(keepS, true); }
});
