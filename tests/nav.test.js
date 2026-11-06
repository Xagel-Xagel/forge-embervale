// Panneaux (1.18.0, HISTORY n° 25) : dispositions figées, ordre, taille, repli, fermeture, accordéon (< 640 px), mémoire (lsGet/lsSet, try/catch),
// adresse jamais touchée (le hash est le code de partage), seuls les panneaux du calculateur affichés sont rendus.
// Oracles littéraux : les listes attendues sont écrites ici, pas recalculées depuis DISPOS.
const fakeLs = (get, set) => ({getItem: get, setItem: set || (() => {})});
const withLs = (ls, fn) => { const keep = globalThis.localStorage; globalThis.localStorage = ls; try { return fn(); } finally { globalThis.localStorage = keep; } };
const spyOn = (names, fn) => { const keep = names.map(n => globalThis[n]), calls = []; names.forEach(n => { globalThis[n] = (...a) => { calls.push(n); }; });
  try { return fn(calls); } finally { names.forEach((n, i) => { globalThis[n] = keep[i]; }); } };
const noLs = fn => withLs(fakeLs(() => null), fn);
const withLay = (l, fn) => { const keep = lay, keepO = org, keepS = lastShown; lay = l; try { return fn(); } finally { lay = keep; org = keepO; lastShown = keepS; } };
const withMq = (phone, fn) => { const keep = globalThis.matchMedia; globalThis.matchMedia = () => ({matches: phone, addEventListener() {}}); try { return fn(); } finally { globalThis.matchMedia = keep; } };
const OPT = ['optCalc', 'optBo', 'optDef', 'optTab'];
const visible = () => lay.order.filter(isOpen), shownList = () => lay.order.filter(shown);

test('panneaux : les sept blocs d\'avant, dans l\'ordre, identifiants distincts ; cinq dispositions au menu', () => {
  assert.deepEqual(PANELS.map(p => p[0]), ['tree', 'eq', 'fiche', 'calc', 'bo', 'def', 'tab']);
  assert.deepEqual(PANELS.map(p => p[1]), ['Arbre', 'Équipement', 'Fiche', 'Calculateur', 'Build optimal', 'Défense', 'Tables']);
  assert.deepEqual(PANELS.map(p => p[2]), ['h-sk', 'h-eq', 'h-st', 'h-opt', 'h-bo', 'h-def', 'h-tab'], 'titres (aria-labelledby)');
  assert.deepEqual(Object.entries(DISPOS).map(([k, d]) => [k, d.l]), [['theo', 'Théoricien'], ['combat', 'Combat'], ['mini', 'Minimal'], ['all', 'Tout']]);
});

test('dispositions figées : panneaux ouverts dans l\'ordre, tailles, repliés, panneau déplié de l\'accordéon', () => {
  const want = {
    theo: {open: ['tree', 'fiche', 'eq', 'calc'], L: ['tree'], S: [], acc: 'tree'},
    combat: {open: ['calc', 'def'], L: ['calc'], S: [], acc: 'calc'},
    mini: {open: ['eq', 'fiche', 'tree'], L: [], S: ['tree'], acc: 'eq'},
    all: {open: ['tree', 'eq', 'fiche', 'calc', 'bo', 'def', 'tab'], L: ['tree'], S: [], acc: 'tree'}};
  for (const [k, w] of Object.entries(want)) withLay(mkDispo(k), () => {
    assert.equal(lay.v, 1); assert.equal(lay.preset, k);
    assert.deepEqual(visible(), w.open, k + ' : ouverts');
    assert.deepEqual(PIDS.filter(p => lay.size[p] === 'L'), w.L, k + ' : taille L');
    assert.deepEqual(PIDS.filter(p => lay.size[p] === 'S'), w.S, k + ' : taille S'); assert.deepEqual(lay.folded, w.S, k + ' : S = replié');
    assert.equal(lay.acc, w.acc, k + ' : accordéon');
    assert.deepEqual(shownList(), w.open.filter(p => !w.S.includes(p)), k + ' : affichés (bureau)');
  });
  const a = mkDispo('theo'); a.order.reverse(); a.closed.push('tree'); assert.deepEqual(mkDispo('theo').order, ['tree', 'fiche', 'eq', 'calc', 'bo', 'def', 'tab'], 'une copie modifiée ne touche pas la définition');
});

test('première visite, mémoire illisible ou d\'un autre format, stockage bloqué → Théoricien', () => {
  const asked = []; withLs(fakeLs(k => { asked.push(k); return null; }), loadLayout);
  assert.deepEqual(asked, ['forge-embervale-panneaux'], 'clé lue'); assert.notEqual(LS_PNL, LS, 'la disposition ne doit pas écraser les builds enregistrés');
  for (const [why, get] of [['absent', () => null], ['vide', () => ''], ['illisible', () => '{oups'], ['nombre', () => '3'], ['chaîne', () => '"theo"'], ['tableau', () => '[]'],
    ['version 2', () => '{"v":2,"preset":"combat"}'], ['sans version', () => '{"preset":"combat"}'], ['disposition inconnue', () => '{"v":1,"preset":"zz"}'],
    ['« Ma disposition » sans état', () => '{"v":1,"preset":"mine"}'], ['ordre pas une liste', () => '{"v":1,"preset":"mine","order":"tree","size":{},"folded":[],"closed":[]}'],
    ['stockage bloqué', () => { throw new Error('SecurityError'); }]]) {
    const l = withLs(fakeLs(get), loadLayout);
    assert.equal(l.preset, 'theo', why); assert.deepEqual(l.order.filter(k => !l.closed.includes(k)), ['tree', 'fiche', 'eq', 'calc'], why);
  }
});

test('mémoire lisible : disposition prête reprise du code ; « Ma disposition » relue, nettoyée (inconnus ignorés, absents ajoutés, S = replié)', () => {
  const rd = o => withLs(fakeLs(() => JSON.stringify(o)), loadLayout);
  let l = rd({v: 1, preset: 'combat', order: ['tab'], size: {calc: 'S'}, folded: [], closed: [], acc: 'def'});
  assert.deepEqual([l.preset, l.order.filter(k => !l.closed.includes(k)), l.size.calc, l.acc], ['combat', ['calc', 'def'], 'L', 'def'], 'Combat : définition du code, accordéon relu');
  assert.equal(rd({v: 1, preset: 'combat', acc: 'tree'}).acc, 'calc', 'accordéon sur un panneau fermé → premier ouvert');
  assert.equal(rd({v: 1, preset: 'combat', acc: null}).acc, null, 'accordéon tout replié : gardé');
  l = rd({v: 1, preset: 'mine', order: ['tab', 'zz', 'eq', 'tab'], size: {tab: 'L', eq: 'S', def: 'XL'}, folded: ['bo', 'zz'], closed: ['tree', 'qq'], acc: 'eq',
    mine: {order: ['def'], size: {}, folded: [], closed: []}});
  assert.equal(l.preset, 'mine');
  assert.deepEqual(l.order, ['tab', 'eq', 'tree', 'fiche', 'calc', 'bo', 'def'], 'inconnus et doublons ignorés, panneaux absents ajoutés à la fin');
  assert.deepEqual([l.size.tab, l.size.eq, l.size.def, l.size.fiche], ['L', 'S', 'M', 'M'], 'taille inconnue → M');
  assert.deepEqual(l.folded, ['bo', 'eq'], 'S implique replié'); assert.deepEqual(l.closed, ['tree']); assert.equal(l.acc, 'eq');
  assert.deepEqual(l.mine.order, ['def', 'tree', 'eq', 'fiche', 'calc', 'bo', 'tab'], '« Ma disposition » gardée à part, nettoyée');
  assert.equal(rd({v: 1, preset: 'theo', mine: 'oups'}).mine, undefined, '« Ma disposition » illisible : ignorée, la disposition prête reste');
});

test('enregistrement : clé propre, JSON relisible ; stockage plein ou bloqué : aucune exception', () => withLay(mkDispo('combat'), () => {
  const wrote = []; assert.equal(withLs(fakeLs(() => null, (k, v) => wrote.push([k, v])), saveLayout), true);
  assert.equal(wrote.length, 1); assert.equal(wrote[0][0], 'forge-embervale-panneaux');
  const back = JSON.parse(wrote[0][1]); assert.deepEqual([back.v, back.preset, back.acc], [1, 'combat', 'calc']);
  assert.deepEqual(withLs(fakeLs(() => wrote[0][1]), loadLayout), lay, 'relu tel quel');
  assert.equal(withLs(fakeLs(() => null, () => { throw new Error('QuotaExceededError'); }), saveLayout), false);
}));

test('changement manuel → « Ma disposition » (retenue à part) ; une disposition prête la garde ; « Ma disposition » la rend', () => withLay(mkDispo('theo'), () => noLs(() => {
  assert.equal(applyDispo('mine'), false, 'aucune disposition personnelle encore');
  assert.equal(setSize('eq', 'L'), true); assert.equal(lay.preset, 'mine'); assert.equal(lay.mine.size.eq, 'L');
  assert.equal(applyDispo('combat'), true); assert.deepEqual([lay.preset, visible()], ['combat', ['calc', 'def']]); assert.equal(lay.mine.size.eq, 'L', 'gardée');
  assert.equal(applyDispo('mine'), true); assert.deepEqual([lay.preset, visible(), lay.size.eq], ['mine', ['tree', 'fiche', 'eq', 'calc'], 'L']);
  lay.size.eq = 'M'; assert.equal(lay.mine.size.eq, 'L', 'copie, pas une référence partagée');
  assert.equal(applyDispo('zz'), false); assert.equal(lay.preset, 'mine');
  for (const [why, act] of [['taille', () => setSize('fiche', 'S')], ['ordre', () => movePanel('fiche', 1)], ['repli', () => foldPanel('eq')], ['fermeture', () => closePanel('calc')], ['ouverture', () => openPanel('bo')]]) {
    applyDispo(why === 'ouverture' ? 'theo' : 'all'); assert.equal(act(), true, why); assert.equal(lay.preset, 'mine', why + ' : pas basculé sur « Ma disposition »');
  }
})));

test('Monter / Descendre : échange avec le voisin ouvert (les fermés ne comptent pas), refusé aux bornes', () => withLay(mkDispo('theo'), () => noLs(() => {
  assert.equal(movePanel('eq', -1), true); assert.deepEqual(visible(), ['tree', 'eq', 'fiche', 'calc']);
  assert.equal(movePanel('tree', -1), false, 'premier'); assert.equal(movePanel('calc', 1), false, 'dernier ouvert (bo, def, tab fermés après lui)');
  assert.equal(movePanel('bo', -1), false, 'panneau fermé'); assert.equal(movePanel('zz', 1), false);
  assert.equal(movePanel('tree', 1), true); assert.deepEqual(visible(), ['eq', 'tree', 'fiche', 'calc']);
  applyDispo('all'); closePanel('fiche'); assert.equal(movePanel('calc', -1), true);
  assert.deepEqual(visible(), ['tree', 'calc', 'eq', 'bo', 'def', 'tab'], 'saute le panneau fermé');
  assert.deepEqual(lay.order, ['tree', 'calc', 'fiche', 'eq', 'bo', 'def', 'tab'], 'le fermé garde sa place');
})));

test('tailles et repli (bureau) : S = replié, M / L dépliés ; déplier un S le passe en M ; replier garde la taille', () => withLay(mkDispo('all'), () => noLs(() => {
  setSize('def', 'S'); assert.deepEqual([lay.size.def, isFolded('def'), shown('def')], ['S', true, false]);
  setSize('def', 'L'); assert.deepEqual([lay.size.def, isFolded('def'), shown('def')], ['L', false, true]);
  assert.equal(setSize('def', 'XL'), false); assert.equal(setSize('zz', 'M'), false); assert.equal(lay.size.def, 'L');
  foldPanel('def'); assert.deepEqual([lay.size.def, isFolded('def')], ['L', true], 'replier garde la taille L');
  foldPanel('def'); assert.deepEqual([lay.size.def, isFolded('def')], ['L', false]);
  setSize('tab', 'S'); foldPanel('tab', false); assert.deepEqual([lay.size.tab, isFolded('tab')], ['M', false], 'déplier un S → M');
  foldPanel('tab', true); foldPanel('tab', true); assert.deepEqual(lay.folded.filter(k => k === 'tab'), ['tab'], 'replié une seule fois');
})));

test('fermer / ouvrir : absent de la grille, plus rendu ; l\'accordéon passe au premier ouvert ; refusé deux fois', () => withLay(mkDispo('theo'), () => noLs(() => {
  assert.equal(closePanel('tree'), true); assert.deepEqual([visible(), shown('tree'), lay.acc], [['fiche', 'eq', 'calc'], false, 'fiche']);
  assert.equal(closePanel('tree'), false); assert.equal(openPanel('tree'), true); assert.equal(openPanel('tree'), false);
  assert.deepEqual(visible(), ['tree', 'fiche', 'eq', 'calc'], 'rouvert à sa place');
  for (const k of [...visible()]) closePanel(k);
  assert.deepEqual([visible(), lay.acc], [[], null], 'tout fermé');
})));

test('accordéon (< 640 px) : un seul panneau déplié ; déplier replie les autres ; ni la disposition ni les tailles ne changent', () => withMq(true, () => withLay(mkDispo('all'), () => noLs(() => {
  assert.deepEqual(shownList(), ['tree']);
  foldPanel('def'); assert.deepEqual([shownList(), lay.acc, lay.preset], [['def'], 'def', 'all']);
  foldPanel('def'); assert.deepEqual([shownList(), lay.acc], [[], null], 'replier le panneau ouvert : tous repliés');
  setSize('tab', 'S'); lay.preset = 'all'; foldPanel('tab'); assert.deepEqual(shownList(), ['tab'], 'un S se déplie en accordéon'); assert.equal(lay.size.tab, 'S', 'taille gardée pour le bureau');
  closePanel('tab'); assert.equal(lay.acc, 'tree', 'panneau déplié fermé → premier ouvert');
  const wrote = []; withLs(fakeLs(() => null, (k, v) => wrote.push(k)), () => foldPanel('eq')); assert.deepEqual(wrote, ['forge-embervale-panneaux'], 'panneau déplié retenu');
}))));

// ---- Faux éléments persistants : le faux DOM de dom-stub.cjs ne garde rien ; $ passe par document.querySelector,
// remplacé le temps d'un test par une table id → élément qui garde attributs, hidden, disabled, classes, parent, enfants (grille) et innerHTML.
function fakeDom(fn) {
  const keep = document.querySelector, els = {}, any = () => keep('#rien');
  const el = id => els[id] || (els[id] = mkEl(id));
  function mkEl(id) {
    const a = {}, e = {id, hidden: false, disabled: false, tabIndex: 0, parent: null, kids: [], cls: new Set(), innerHTML: '', textContent: '', top: 300, bottom: 340, scrolls: 0, focused: 0, offsetParent: {},
      get parentElement() { return e.parent; },
      setAttribute(k, v) { a[k] = String(v); }, getAttribute(k) { return k in a ? a[k] : null; },
      classList: {toggle(c, on) { if (on) e.cls.add(c); else e.cls.delete(c); }},
      appendChild(c) { if (c.parent && c.parent.kids) { const i = c.parent.kids.indexOf(c); if (i >= 0) c.parent.kids.splice(i, 1); } c.parent = e; e.kids.push(c); return c; },
      getBoundingClientRect() { return {top: e.top, bottom: e.bottom, left: 0, right: 0, width: 1000, height: 40}; },
      scrollIntoView() { e.scrolls++; }, focus() { e.focused++; }, querySelector(s) { return /^#[\w-]+$/.test(s) ? el(s.slice(1)) : any(); },
      querySelectorAll(s) { return s === '.pnl' ? e.kids.slice() : []; }, insertAdjacentHTML() {}};
    return new Proxy(e, {get: (o, k) => k in o ? o[k] : any()[k]});
  }
  el('optTarget').appendChild(el('optBar'));
  document.querySelector = s => /^#[\w-]+$/.test(s) ? el(s.slice(1)) : keep(s);
  try { return fn(el); } finally { document.querySelector = keep; }
}
const grid = el => el('pgrid').kids.map(p => p.id);

test('paintLayout (DOM observé) : ordre de la grille, fermés cachés, repliés (aria-expanded), tailles, rail, bornes Monter / Descendre, Organiser', () => fakeDom(el => noLs(() => withLay(mkDispo('theo'), () => spyOn(OPT, () => {
  paintLayout();
  assert.deepEqual(grid(el), ['p-tree', 'p-fiche', 'p-eq', 'p-calc', 'p-bo', 'p-def', 'p-tab'], 'ordre de la grille (et du focus)');
  assert.deepEqual(PIDS.filter(k => el('p-' + k).hidden), ['bo', 'def', 'tab'], 'fermés cachés');
  assert.deepEqual(PIDS.map(k => el('r-' + k).getAttribute('aria-pressed')), ['true', 'true', 'true', 'true', 'false', 'false', 'false'], 'rail : aria-pressed = ouvert');
  assert.deepEqual(PIDS.map(k => el('p-' + k).getAttribute('data-size')), ['L', 'M', 'M', 'M', 'M', 'M', 'M']);
  assert.deepEqual([el('pu-tree').disabled, el('pd-tree').disabled, el('pu-calc').disabled, el('pd-calc').disabled, el('pu-eq').disabled, el('pd-eq').disabled], [true, false, false, true, false, false]);
  assert.deepEqual([el('dispo').value, el('dispoMine').disabled, el('pEmpty').hidden], ['theo', true, true]);
  assert.deepEqual([el('org').getAttribute('aria-pressed'), el('orgDone').hidden, el('po-eq').hidden, el('pf-eq').hidden], ['false', true, true, false], 'lecture : seul Replier');
  setSize('eq', 'S');
  assert.deepEqual([el('pb-eq').hidden, el('pf-eq').getAttribute('aria-expanded'), el('pf-eq').textContent, el('p-eq').cls.has('folded')], [true, 'false', 'Déplier', true]);
  assert.deepEqual([el('ps-eq-S').getAttribute('aria-pressed'), el('ps-eq-M').getAttribute('aria-pressed'), el('dispo').value, el('dispoMine').disabled], ['true', 'false', 'mine', false]);
  foldPanel('eq'); assert.deepEqual([el('pb-eq').hidden, el('pf-eq').getAttribute('aria-expanded'), el('pf-eq').textContent], [false, 'true', 'Replier']);
  movePanel('calc', -1); assert.deepEqual(grid(el).slice(0, 4), ['p-tree', 'p-fiche', 'p-calc', 'p-eq']);
  setOrg(true); assert.deepEqual([el('org').getAttribute('aria-pressed'), el('orgDone').hidden, el('orgHint').hidden, el('po-eq').hidden, el('pf-eq').hidden, el('pgrid').cls.has('org')], ['true', false, false, false, true, true], 'Organiser');
  withMq(true, paintLayout); assert.equal(el('pf-eq').hidden, false, 'accordéon : Replier reste en Organiser');
  setOrg(false); assert.deepEqual([el('po-eq').hidden, el('pf-eq').hidden], [true, false]);
  for (const k of PIDS) closePanel(k); assert.equal(el('pEmpty').hidden, false, 'tout fermé : message');
})))));

test('rendu : seuls les panneaux du calculateur ouverts et dépliés ; un panneau qui apparaît est rendu, un panneau déjà affiché non', () => fakeDom(() => noLs(() => spyOn(OPT, calls => {
  const run = () => { calls.length = 0; renderOptNow(); return calls.slice(); };
  for (const [k, want] of [['theo', ['optCalc']], ['combat', ['optCalc', 'optDef']], ['mini', []], ['all', ['optCalc', 'optBo', 'optDef', 'optTab']]])
    withLay(mkDispo(k), () => assert.deepEqual(run(), want, k));
  withMq(true, () => withLay(mkDispo('all'), () => { lay.acc = 'def'; assert.deepEqual(run(), ['optDef'], 'accordéon : le seul déplié'); lay.acc = null; assert.deepEqual(run(), []); }));
  withLay(mkDispo('theo'), () => {
    paintLayout(); calls.length = 0; openPanel('def'); assert.deepEqual(calls, ['optCalc', 'optDef'], 'Défense ouverte : rendue');
    calls.length = 0; foldPanel('eq'); foldPanel('eq'); assert.deepEqual(calls, [], 'Équipement : rien du calculateur');
    calls.length = 0; setSize('def', 'L'); assert.deepEqual(calls, [], 'déjà affiché : pas de nouveau rendu');
    calls.length = 0; foldPanel('calc'); assert.deepEqual(calls, [], 'replié : rien');
    calls.length = 0; foldPanel('calc'); assert.deepEqual(calls, ['optCalc', 'optDef'], 'déplié : rendu');
    calls.length = 0; paintLayout(true); closePanel('calc'); openPanel('calc'); assert.deepEqual(calls, ['optCalc', 'optDef']);
  });
}))));

test('graphe : G.wake quand le panneau Arbre apparaît (vue Graphe seulement), pas quand il reste affiché', () => fakeDom(() => noLs(() => withLay(mkDispo('theo'), () => {
  const keepW = G.wake, keepV = view; let n = 0; G.wake = () => { n++; };
  try {
    paintLayout(); foldPanel('tree'); assert.equal(n, 0); foldPanel('tree'); assert.equal(n, 1, 'déplié : wake');
    setSize('tree', 'M'); assert.equal(n, 1, 'déjà affiché : l\'observateur de taille s\'en charge');
    closePanel('tree'); openPanel('tree'); assert.equal(n, 2);
    view = 'list'; closePanel('tree'); openPanel('tree'); assert.equal(n, 2, 'vue Liste : pas de canvas à recaler');
  } finally { G.wake = keepW; view = keepV; }
}))));

test('choix de la cible : dans le Calculateur s\'il est affiché, sinon dans Build optimal (qui dit sinon d\'où vient sa cible)', () => fakeDom(el => noLs(() => withLay(mkDispo('all'), () => spyOn(OPT, () => {
  paintLayout(); assert.deepEqual([el('optBar').parent.id, el('boTgtNote').hidden], ['optTarget', false], 'les deux affichés');
  foldPanel('calc'); assert.deepEqual([el('optBar').parent.id, el('boTgtNote').hidden], ['boTarget', true]);
  foldPanel('calc'); assert.deepEqual([el('optBar').parent.id, el('boTgtNote').hidden], ['optTarget', false], 'retour dans le Calculateur');
  closePanel('bo'); assert.deepEqual([el('optBar').parent.id, el('boTgtNote').hidden], ['optTarget', true]);
  closePanel('calc'); assert.equal(el('optBar').parent.id, 'optTarget', 'aucun des deux : la barre ne bouge pas');
})))));

test('panneaux : l\'adresse (code de partage) n\'est jamais touchée', () => {
  const keepH = location.hash, keepR = history.replaceState; let calls = 0;
  location.hash = '#b3-abc'; history.replaceState = () => { calls++; };
  try {
    fakeDom(() => noLs(() => withLay(mkDispo('theo'), () => spyOn(OPT, () => {
      for (const k of ['combat', 'mini', 'all', 'theo']) applyDispo(k);
      setSize('eq', 'L'); movePanel('eq', -1); foldPanel('fiche'); closePanel('calc'); openPanel('calc'); setOrg(true); setOrg(false); goPanel('def'); withMq(true, () => foldPanel('tab'));
    }))));
    assert.equal(location.hash, '#b3-abc'); assert.equal(calls, 0);
  } finally { location.hash = keepH; history.replaceState = keepR; }
});

test('démarrage : disposition retenue relue et appliquée au DOM (sans écriture ni rendu) ; illisible → Théoricien', () => {
  for (const [stored, preset, hid] of [['{"v":1,"preset":"combat"}', 'combat', ['tree', 'eq', 'fiche', 'bo', 'tab']], ['{oups', 'theo', ['bo', 'def', 'tab']], [null, 'theo', ['bo', 'def', 'tab']]])
    fakeDom(el => withLay(lay, () => spyOn([...OPT, 'lsSet'], calls => {
      withLs(fakeLs(() => stored), initPanels);
      assert.equal(lay.preset, preset, 'disposition retenue ' + stored); assert.deepEqual(calls, [], 'au démarrage : ni écriture ni rendu (renderAll suit)');
      assert.deepEqual(PIDS.filter(k => el('p-' + k).hidden), hid); assert.equal(el('dispo').value, preset);
    })));
});

test('commandes (DOM observé) : Replier, S / M / L, Monter (focus gardé), Fermer (focus sur le rail, message), rail, menu Disposition, Organiser / Terminé', () => {
  const said = [], keepT = globalThis.toast;
  try {
    globalThis.toast = t => said.push(t);
    fakeDom(el => noLs(() => withLay(lay, () => spyOn(OPT, () => {
      initPanels(); applyDispo('theo');
      el('pf-eq').onclick(); assert.equal(isFolded('eq'), true); el('pf-eq').onclick(); assert.equal(isFolded('eq'), false);
      el('ps-fiche-L').onclick(); assert.equal(lay.size.fiche, 'L');
      const f0 = el('pu-eq').focused; el('pu-eq').onclick(); assert.deepEqual(visible(), ['tree', 'eq', 'fiche', 'calc']); assert.equal(el('pu-eq').focused, f0 + 1, 'focus rendu à Monter');
      const d0 = el('pd-eq').focused; el('pu-eq').onclick(); assert.equal(visible()[0], 'eq'); assert.equal(el('pd-eq').focused, d0 + 1, 'borne atteinte (Monter désactivé) : focus sur Descendre');
      const u1 = el('pu-eq').focused, d1 = el('pd-eq').focused; el('pu-eq').onclick(); assert.deepEqual([el('pu-eq').focused, el('pd-eq').focused, visible()[0]], [u1, d1, 'eq'], 'Monter refusé : rien ne bouge');
      const r0 = el('r-calc').focused; el('px-calc').onclick(); assert.equal(isOpen('calc'), false); assert.equal(el('r-calc').focused, r0 + 1, 'focus sur le rail');
      assert.ok(said.some(t => t.includes('« Calculateur » fermé')), 'message de fermeture absent');
      el('r-calc').onclick(); assert.equal(isOpen('calc'), true, 'rail : rouvre'); el('r-calc').onclick(); assert.equal(isOpen('calc'), false, 'rail : masque');
      el('dispo').value = 'combat'; el('dispo').onchange({target: el('dispo')}); assert.equal(lay.preset, 'combat'); assert.ok(said.includes('Disposition : Combat'));
      el('org').onclick(); assert.equal(org, true); const o0 = el('org').focused; el('orgDone').onclick(); assert.equal(org, false); assert.equal(el('org').focused, o0 + 1, 'Terminé : focus sur Organiser');
    }))));
  } finally { globalThis.toast = keepT; }
});

test('téléphone (DOM observé) : barre basse Réglages · Arbre · Équipement · Cible · Plus ; ouvre et déplie le panneau, focus au bon endroit', () => withMq(true, () => fakeDom(el => noLs(() => withLay(lay, () => spyOn(OPT, () => {
  initPanels(); applyDispo('theo');
  assert.deepEqual(BBAR.map(b => b[1]), ['Réglages', 'Arbre', 'Équipement', 'Cible']); assert.deepEqual(BMORE, ['fiche', 'bo', 'def', 'tab']);
  for (const [b, k, f] of [['bb-eq', 'eq', 'pf-eq'], ['bb-reg', 'tree', 'lvl'], ['bb-cible', 'calc', 'oEnemy'], ['bb-tree', 'tree', 'pf-tree']]) {
    const f0 = el(f).focused, s0 = el('p-' + k).scrolls; el(b).onclick();
    assert.deepEqual(shownList(), [k], b); assert.equal(el(f).focused, f0 + 1, b + ' : focus sur #' + f); assert.equal(el('p-' + k).scrolls, s0 + 1, b + ' : panneau ramené');
  }
  assert.equal(lay.preset, 'theo', 'déplier en accordéon ne change pas la disposition');
  const m0 = el('bm-fiche').focused; el('bb-plus').onclick(); assert.deepEqual([el('bmore').hidden, el('bb-plus').getAttribute('aria-expanded'), el('bm-fiche').focused], [false, 'true', m0 + 1]);
  el('bm-def').onclick(); assert.deepEqual([el('bmore').hidden, shownList(), isOpen('def'), lay.preset], [true, ['def'], true, 'mine'], 'Plus → Défense (fermée) : ouverte, dépliée');
  el('bb-plus').onclick(); el('bmore').onkeydown({key: 'Escape'}); assert.equal(el('bmore').hidden, true, 'Échap ferme « Plus »');
  el('bb-plus').onclick(); const p0 = el('bb-plus').focused; el('bb-plus').onkeydown({key: 'Escape'}); assert.deepEqual([el('bmore').hidden, el('bb-plus').focused], [true, p0 + 1], 'Échap depuis « Plus »');
  el('bb-plus').onclick(); el('bmore').onkeydown({key: 'a'}); assert.equal(el('bmore').hidden, false, 'autre touche : reste ouvert'); el('bb-plus').onclick(); assert.equal(el('bmore').hidden, true, '« Plus » rebascule');
}))))));

test('build optimal en cours : replier, fermer, rouvrir ou changer de disposition ne l\'arrête pas ; passer de A à B l\'arrête et, panneau caché, le dit', () => {
  const keepBO = {busy: BO.busy, key: BO.key}, keepCur = cur;
  try {
    fakeDom(() => noLs(() => withLay(mkDispo('all'), () => spyOn(['boStopRun', 'toast', ...OPT], calls => {
      BO.busy = true; BO.key = boKey(B());
      foldPanel('bo'); foldPanel('bo'); closePanel('bo'); openPanel('bo'); setSize('bo', 'S'); applyDispo('theo'); applyDispo('all'); withMq(true, () => foldPanel('def'));
      assert.ok(!calls.includes('boStopRun'), 'un changement de panneau a arrêté le calcul');
      calls.length = 0; applyDispo('theo'); cur = 1 - cur; renderOptNow();
      assert.ok(calls.includes('boStopRun'), 'build A → B : calcul non arrêté'); assert.ok(calls.includes('toast'), 'arrêt, panneau Build optimal caché : aucun message');
      calls.length = 0; cur = keepCur; BO.busy = true; BO.key = 'périmée'; applyDispo('all'); calls.length = 0; renderOptNow();
      assert.ok(calls.includes('boStopRun') && !calls.includes('toast'), 'panneau Build optimal affiché : la carte le montre, pas de message en plus');
      calls.length = 0; BO.key = boKey(B()); BO.busy = true; renderOptNow(); assert.ok(!calls.includes('boStopRun'), 'clé valable : le calcul continue');
      calls.length = 0; BO.busy = false; BO.key = 'périmée'; renderOptNow(); assert.ok(!calls.includes('boStopRun'), 'aucun calcul en cours : rien à arrêter');
    }))));
  } finally { cur = keepCur; Object.assign(BO, keepBO); }
});

test('build optimal terminé, panneau caché : un message le dit ; affiché : pas de message', async () => {
  const keepRun = globalThis.boRun, keepToast = globalThis.toast, keepL = lay, said = [];
  const quick = function* (slot, en, N, F) { yield; return {res: BO_FAM.map(f => ({fk: f[0], fl: f[1], skip: true})), ms: 1, N, F, slot, en: ENEMIES.indexOf(en)}; };
  const done = async () => { const t0 = Date.now(); while (BO.busy) { if (Date.now() - t0 > 2000) throw new Error('calcul non terminé'); await new Promise(r => setTimeout(r, 3)); } };
  try {
    globalThis.boRun = quick; globalThis.toast = t => said.push(t);
    lay = mkDispo('all'); boStart(); lay = mkDispo('theo'); await done(); // calcul lancé, puis panneau fermé (disposition Théoricien)
    assert.ok(said.some(t => t === 'Build optimal calculé : résultats dans le panneau Build optimal'), 'aucun message à la fin du calcul, panneau caché');
    said.length = 0; lay = mkDispo('all'); boStart(); await done();
    assert.ok(!said.some(t => /Build optimal calculé/.test(t)), 'message inutile, panneau affiché');
  } finally { globalThis.boRun = keepRun; globalThis.toast = keepToast; lay = keepL; Object.assign(BO, {busy: false, out: null, part: null, key: '', stop: false, err: ''}); }
});

test('Tables : rendue une fois par cible (défilement gardé quand le build change), de nouveau quand la cible change', () => {
  const keepE = oEnemy, keepT = tabEn;
  try {
    fakeDom(el => withLay(mkDispo('all'), () => {
      tabEn = null; renderOptNow(); assert.ok(el('tabBody').innerHTML.includes('Table complète'), 'Tables non rendue');
      el('tabBody').innerHTML = 'repère'; builds[cur].lvl = builds[cur].lvl > 1 ? builds[cur].lvl - 1 : 2; renderOptNow();
      assert.equal(el('tabBody').innerHTML, 'repère', 'build changé : la table ne dépend pas du build, elle ne doit pas être refaite');
      oEnemy = (oEnemy + 1) % ENEMIES.length; renderOptNow(); assert.ok(el('tabBody').innerHTML.includes('Table complète'), 'cible changée : la ligne surlignée doit suivre');
    }));
  } finally { oEnemy = keepE; tabEn = keepT; builds[0] = fromPreset(PRESETS[0]); builds[1] = fromPreset(PRESETS[3]); }
});

test('plan « Répartir au mieux » : gardé quand on replie ou ferme le Calculateur, oublié dès que le build, la cible ou l\'arme analysée change', () => {
  const keepM = planMem, keepE = oEnemy, keepSl = oSlot;
  try {
    builds[0] = blankBuild('Plan'); builds[0].gear.w1 = WEAPONS[0][0]; cur = 0; oSlot = 'w1'; // arbre vide : 5 points s'investissent (un preset est déjà au plafond)
    fakeDom(el => noLs(() => withLay(mkDispo('theo'), () => {
      paintLayout(true); foldPanel('calc');
      planMem = {k: planKey(B()), P: planPoints(B(), oSlot, ENEMIES[oEnemy], 5), N: 5};
      assert.ok(planMem.P && planMem.P.steps.length, 'plan de test vide');
      foldPanel('calc'); assert.ok(el('planOut').innerHTML.includes('Appliquer le plan'), 'plan perdu en dépliant le Calculateur');
      el('planOut').innerHTML = ''; closePanel('calc'); openPanel('calc'); assert.ok(el('planOut').innerHTML.includes('Appliquer le plan'), 'plan perdu en rouvrant le Calculateur');
      for (const [why, ch, back] of [['build', () => { B().lvl--; }, () => { B().lvl++; }], ['cible', () => { oEnemy = (oEnemy + 1) % ENEMIES.length; }, () => { oEnemy = keepE; }],
        ['arme analysée', () => { oSlot = 'w2'; }, () => { oSlot = 'w1'; }]]) {
        el('planOut').innerHTML = ''; ch(); renderOptNow(); assert.equal(el('planOut').innerHTML, '', 'plan périmé affiché (' + why + ' changé)'); back();
      }
      el('planOut').innerHTML = ''; renderOptNow(); assert.ok(el('planOut').innerHTML.includes('Appliquer le plan'), 'réglages remis : le plan revient');
      const want = clone(planMem.P.t); el('planApply').onclick(); assert.equal(planMem, null, 'plan appliqué : oublié');
      assert.deepEqual(JSON.parse(JSON.stringify(B().sk)), want.sk, '« Appliquer le plan » n\'a pas appliqué le plan');
    })));
  } finally { planMem = keepM; oEnemy = keepE; oSlot = keepSl; builds[0] = fromPreset(PRESETS[0]); builds[1] = fromPreset(PRESETS[3]); cur = 0; }
});

test('clic sur un ennemi de Tables : cible changée, Calculateur ouvert et déplié (même fermé), focus sur son bouton Replier, message', () => {
  const keepE = oEnemy, keepT = tabEn, keepToast = globalThis.toast, said = [];
  try {
    globalThis.toast = t => said.push(t);
    fakeDom(el => noLs(() => withLay(mkDispo('mini'), () => {
      openPanel('tab'); tabEn = null; renderOptNow(); const i = ENEMIES.findIndex(e => e.n === 'Hollow Hound'); assert.notEqual(i, oEnemy); // fr ≠ anglais, traduction (°)
      const f0 = el('pf-calc').focused;
      el('mxBody').onclick({target: {closest: s => s === 'button[data-en]' ? {dataset: {en: String(i)}} : null}});
      assert.equal(oEnemy, i, 'cible'); assert.equal(shown('calc'), true, 'Calculateur non affiché'); assert.equal(said.at(-1), 'Cible : Chien Creux °'); assert.equal(el('pf-calc').focused, f0 + 1, 'focus non posé sur le Calculateur');
      assert.equal(el('optBar').parent.id, 'optTarget'); assert.ok(said.some(t => t.includes(nmT(ENEMIES[i])) && t.includes('°')), 'message de la nouvelle cible absent');
      const n = said.length; el('mxBody').onclick({target: {closest: () => null}}); assert.equal(said.length, n, 'clic hors d\'un nom : rien');
    })));
  } finally { globalThis.toast = keepToast; oEnemy = keepE; tabEn = keepT; }
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

// Tuiles Points et Flamme (1.17.0, HISTORY n° 23) : en tête des panneaux Arbre et Build optimal, le nombre de points et la Flamme en grand.
test('tuiles de l\'Arbre (DOM observé) : points à attribuer, points en trop, Flamme −/+ bornée, effet des nœuds de Flamme', () => {
  const keep = [builds[0], cur, view];
  try {
    fakeDom(el => {
      builds[0] = fromPreset(PRESETS.find(p => p.name === 'Mage critique (baguette)')); cur = 0; view = 'list';
      renderSkills();
      assert.deepEqual([el('ptLbl').textContent, el('ptLeft').textContent, el('ptLeft').cls.has('over'), el('spent').textContent], ['Points à attribuer', '14', false, '95 / 109 dépensés']);
      assert.equal(el('needLvl').textContent, 'niveau requis 18');
      assert.equal(el('flameFx').textContent, 'Exalté : +2 INT');
      builds[0].lvl = 1; renderSkills(); // 0 + 61 points pour 95 dépensés
      assert.deepEqual([el('ptLbl').textContent, el('ptLeft').textContent, el('ptLeft').cls.has('over')], ['Points en trop', '34', true]);
      assert.equal(el('needLvl').textContent, 'retirez-en ou montez de niveau'); assert.equal(el('bar').className, 'bar over');
      builds[0].lvl = 25;
      builds[0].lvl = 25; builds[0].flame = 2; renderSkills(); assert.equal(el('flameDn').disabled, false);
      const fl0 = el('flame').focused; stepFlame(-1); assert.equal(builds[0].flame, 1); assert.equal(el('flameDn').disabled, true, '− désactivé à 1');
      assert.equal(el('flame').focused, fl0 + 1, 'focus sur le champ à la borne');
      stepFlame(-1); assert.equal(builds[0].flame, 1, 'pas en dessous de 1');
      builds[0].flame = 10; stepFlame(1); assert.equal(builds[0].flame, 11); assert.equal(el('flameUp').disabled, true, '+ désactivé à 11');
      stepFlame(1); assert.equal(builds[0].flame, 11, 'pas au-dessus de 11');
      assert.equal(el('flameFx').textContent, 'Exalté : +5 INT');
      builds[0] = blankBuild('Vide'); renderSkills();
      assert.match(el('flameFx').textContent, /^aucun nœud de Flamme acquis/); assert.equal(el('ptLeft').textContent, '212');
    });
  } finally { [builds[0], cur, view] = keep; }
});

test('tuiles du Build optimal (DOM observé) : points et Flamme du calcul, −/+ bornés et réglés par build, désactivés pendant le calcul', () => {
  const keep = [builds[0], cur, BO.N.slice(), BO.F.slice(), BO.busy];
  try {
    fakeDom(el => {
      builds[0] = fromPreset(PRESETS.find(p => p.name === 'Mage critique (baguette)')); cur = 0; BO.N = [null, null]; BO.F = [null, null]; BO.busy = false;
      boTiles(); let h = el('boTiles').innerHTML;
      assert.match(h, /id="boN" min="0" max="212" value="109"/); assert.match(h, /id="boF" min="1" max="11" value="4"/);
      assert.match(h, /budget du build/); assert.match(h, /celle du build/);
      el('boFup').onclick(); assert.equal(BO.F[0], 5);
      assert.equal(el('boFh').textContent, 'sur 11 · réglée ici · build 4'); assert.ok(el('boFup').focused > 0, 'focus gardé sur +');
      el('boFdn').onclick(); assert.equal(BO.F[0], null, 'retour à la Flamme du build : plus de réglage propre');
      BO.F[0] = 11; boPaint(); assert.deepEqual([el('boFup').disabled, el('boFdn').disabled], [true, false]);
      BO.F[0] = 1; boPaint(); assert.deepEqual([el('boFup').disabled, el('boFdn').disabled], [false, true]);
      cur = 1; assert.equal(boF(B()), B().flame, 'le réglage du build A ne vaut pas pour B'); cur = 0;
      // borne atteinte au clic : le bouton se désactive, le focus passe au champ ; une saisie ne refait pas les tuiles
      BO.F[0] = 10; boTiles(); const f0 = el('boF').focused; el('boFup').onclick(); assert.equal(BO.F[0], 11);
      assert.equal(el('boFup').disabled, true); assert.equal(el('boF').focused, f0 + 1, 'focus sur le champ à la borne');
      const html = el('boTiles').innerHTML; el('boN').value = '50'; el('boN').onchange(); assert.equal(BO.N[0], 50);
      assert.equal(el('boTiles').innerHTML, html, 'saisie : tuiles non refaites'); assert.equal(el('boNh').textContent, 'réglé ici · build 109');
      assert.equal(el('boFh').textContent, 'sur 11 · réglée ici · build 4');
      BO.busy = true; boPaint(); for (const id of ['boGo', 'boN', 'boF', 'boFdn', 'boFup']) assert.equal(el(id).disabled, true, id + ' actif pendant le calcul');
      BO.F[0] = 5; boTiles(); const h2 = el('boTiles').innerHTML; // tuiles refaites pendant le calcul (changement d'onglet) : tout reste désactivé
      for (const id of ['boN', 'boF', 'boFdn', 'boFup']) assert.match(h2, new RegExp(`id="${id}"[^>]*disabled|disabled[^>]*id="${id}"`), id + ' actif dans les tuiles refaites pendant le calcul');
    });
  } finally { [builds[0], cur, BO.N, BO.F, BO.busy] = keep; }
});

// ---- Revue QA (avant la PR) : cas limites relevés par mutation (chaque test tue un mutant qui survivait)
test('mémoire abîmée : « mine » sans folded / closed / size, nom hérité du prototype → Théoricien, sans exception', () => {
  for (const o of [{v: 1, preset: 'mine', order: ['tree'], size: {}, closed: []}, {v: 1, preset: 'mine', order: ['tree'], size: {}, folded: []}, {v: 1, preset: 'mine', order: ['tree'], folded: [], closed: []},
    {v: 1, preset: 'toString'}, {v: 1, preset: '__proto__'}, {v: 1, preset: 'constructor'}, {v: 1, preset: 7}])
    assert.equal(withLs(fakeLs(() => JSON.stringify(o)), loadLayout).preset, 'theo', JSON.stringify(o));
  withLay(mkDispo('theo'), () => noLs(() => { assert.equal(applyDispo('toString'), false); assert.equal(lay.preset, 'theo'); }));
});

test('« Ma disposition » abîmée mais état valide : refaite depuis l\'état relu (on peut y revenir)', () => {
  const l = withLs(fakeLs(() => JSON.stringify({v: 1, preset: 'mine', order: ['def', 'tree'], size: {def: 'L'}, folded: [], closed: ['tab'], mine: 'oups'})), loadLayout);
  assert.deepEqual([l.preset, l.mine.order.slice(0, 2), l.mine.size.def, l.mine.closed], ['mine', ['def', 'tree'], 'L', ['tab']]);
  withLay(l, () => noLs(() => { applyDispo('combat'); assert.equal(applyDispo('mine'), true); assert.equal(lay.size.def, 'L'); }));
});

test('choisir une disposition prête l\'enregistre (une écriture) ; stockage bloqué : un seul message par visite', () => withLay(mkDispo('theo'), () => {
  const w = []; withLs(fakeLs(() => null, (k, v) => w.push([k, JSON.parse(v).preset])), () => applyDispo('combat'));
  assert.deepEqual(w, [['forge-embervale-panneaux', 'combat']]);
  const said = [], keepT = globalThis.toast, keepW = saveWarned;
  try {
    globalThis.toast = t => said.push(t); saveWarned = false;
    withLs(fakeLs(() => null, () => { throw new Error('SecurityError'); }), () => { applyDispo('mini'); setSize('eq', 'L'); });
    assert.deepEqual(said, ['Disposition non retenue : stockage du navigateur bloqué (elle vaut jusqu\'au rechargement)']);
  } finally { globalThis.toast = keepT; saveWarned = keepW; }
}));

test('retoucher une disposition prête remplace « Ma disposition » : un message le dit (pas la première fois, pas depuis « Ma disposition »)', () => withLay(mkDispo('theo'), () => noLs(() => {
  const said = [], keepT = globalThis.toast;
  try {
    globalThis.toast = t => said.push(t);
    setSize('eq', 'L'); assert.deepEqual(said, [], 'première « Ma disposition » : rien à remplacer');
    setSize('fiche', 'L'); assert.deepEqual(said, [], 'déjà sur « Ma disposition »');
    applyDispo('combat'); openPanel('tree');
    assert.deepEqual(said, ['« Ma disposition » remplacée par celle-ci (partie de Combat)']); assert.equal(lay.mine.size.calc, 'L');
  } finally { globalThis.toast = keepT; }
})));

test('accordéon : changer de disposition garde le panneau déplié s\'il reste ouvert, sinon le premier ouvert ; seuil exact 639 px', () => {
  withMq(true, () => withLay(mkDispo('all'), () => noLs(() => {
    lay.acc = 'def'; applyDispo('combat'); assert.equal(lay.acc, 'def'); applyDispo('mini'); assert.equal(lay.acc, 'eq');
    lay.acc = null; applyDispo('all'); assert.equal(lay.acc, 'tree', 'aucun déplié : premier ouvert');
  })));
  const q = [], keep = globalThis.matchMedia; globalThis.matchMedia = s => { q.push(s); return {matches: false}; };
  try { isAcc(); } finally { globalThis.matchMedia = keep; }
  assert.deepEqual(q, ['(max-width:639px)'], 'même seuil que styles.css');
});

test('passage bureau → téléphone (écouteur de matchMedia) : accordéon, « Plus » refermé', () => {
  let cb = null, phone = false; const keep = globalThis.matchMedia;
  globalThis.matchMedia = () => ({get matches() { return phone; }, addEventListener(t, f) { cb = f; }});
  try {
    fakeDom(el => noLs(() => withLay(lay, () => spyOn(OPT, () => {
      initPanels(); applyDispo('theo'); assert.equal(el('pf-fiche').getAttribute('aria-expanded'), 'true');
      el('bmore').hidden = false; phone = true; cb();
      assert.deepEqual(shownList(), ['tree']); assert.deepEqual([el('p-fiche').cls.has('folded'), el('pf-fiche').getAttribute('aria-expanded'), el('bmore').hidden], [true, 'false', true]);
      phone = false; cb(); assert.deepEqual(shownList(), ['tree', 'fiche', 'eq', 'calc'], 'retour bureau');
    }))));
  } finally { globalThis.matchMedia = keep; }
});

test('Organiser : aide cachée en lecture ; Fermer au téléphone (rail caché) : focus sur Organiser, message « Plus »', () => {
  const said = [], keepT = globalThis.toast;
  try {
    globalThis.toast = t => said.push(t);
    fakeDom(el => noLs(() => withLay(mkDispo('theo'), () => spyOn(OPT, () => { el('orgHint').hidden = false; paintLayout(); assert.equal(el('orgHint').hidden, true); setOrg(true); assert.equal(el('orgHint').hidden, false); }))));
    withMq(true, () => fakeDom(el => noLs(() => withLay(lay, () => spyOn(OPT, () => {
      initPanels(); applyDispo('theo'); el('r-calc').offsetParent = null; const o0 = el('org').focused;
      el('px-calc').onclick(); assert.equal(el('org').focused, o0 + 1); assert.equal(said.at(-1), 'Panneau « Calculateur » fermé : rouvrez-le depuis le rail (« Plus » en bas)');
    })))));
  } finally { globalThis.toast = keepT; }
});

test('clic sur un ennemi de Tables, Calculateur déjà affiché : il montre la nouvelle cible ; message littéral', () => {
  const keepE = oEnemy, keepT = tabEn, keepToast = globalThis.toast, said = [];
  try {
    globalThis.toast = t => said.push(t);
    fakeDom(el => noLs(() => withLay(mkDispo('all'), () => {
      paintLayout(true); tabEn = null; renderOptNow(); const i = ENEMIES.findIndex(e => e.n === 'Hollow Hound'); assert.notEqual(i, oEnemy);
      el('mxBody').onclick({target: {closest: s => s === 'button[data-en]' ? {dataset: {en: String(i)}} : null}});
      assert.ok(el('optBody').innerHTML.includes('Chien Creux'), 'Calculateur resté sur l\'ancienne cible'); assert.deepEqual(said, ['Cible : Chien Creux °']);
    })));
  } finally { globalThis.toast = keepToast; oEnemy = keepE; tabEn = keepT; }
});

test('build optimal périmé, aucun panneau du calculateur affiché : arrêté et dit ; panneau affiché mais hors de l\'écran : dit aussi', () => {
  const keepBO = {busy: BO.busy, key: BO.key}, keepH = globalThis.innerHeight;
  try {
    fakeDom(el => noLs(() => spyOn(['boStopRun', 'toast', ...OPT], calls => {
      withLay(mkDispo('mini'), () => { BO.busy = true; BO.key = 'périmée'; renderOptNow(); assert.deepEqual(calls.filter(c => c === 'boStopRun' || c === 'toast'), ['boStopRun', 'toast']); });
      withLay(mkDispo('all'), () => {
        globalThis.innerHeight = 900; el('p-bo').top = 2000; calls.length = 0; BO.busy = true; renderOptNow(); assert.ok(calls.includes('toast'), 'hors de l\'écran (plus bas) : aucun message');
        el('p-bo').top = 300; calls.length = 0; BO.busy = true; renderOptNow(); assert.ok(calls.includes('boStopRun') && !calls.includes('toast'), 'à l\'écran : la carte suffit');
      });
    })));
  } finally { Object.assign(BO, keepBO); globalThis.innerHeight = keepH; }
});

// ---- « Ma classe » (1.19.0, HISTORY n° 26) : barre collée Guerrier · Rôdeur · Mage. Oracles littéraux : familles, textes et zones écrits ici.
const CLS_TXT = {war: ['Guerrier', 'mêlée (épées, haches, masses, espadons)'], rng: ['Rôdeur', 'dagues et arcs'], mag: ['Mage', 'baguettes et bâtons']};
const withCls = fn => { const keep = [myCls, area, oFam, treeRefit, view, G.focus]; try { return fn(); } finally { [myCls, area, oFam, treeRefit, view, G.focus] = keep; } };

test('Ma classe (DOM observé) : chaque classe dans chaque disposition, bureau et accordéon — bouton pressé, Build optimal ouvert, déplié et calculé, arbre centré sur la zone, classement sur la classe ; re-cliquer la retire', () => withCls(() => {
  const said = [], keepT = globalThis.toast;
  try {
    globalThis.toast = t => said.push(t);
    for (const phone of [false, true]) for (const d of ['theo', 'combat', 'mini', 'all']) for (const k of ['war', 'rng', 'mag'])
      withMq(phone, () => fakeDom(el => noLs(() => withLay(mkDispo(d), () => spyOn(['boStart', ...OPT], calls => {
        const tag = `${phone ? 'téléphone' : 'bureau'} · ${d} · ${k}`, foc = []; G.focus = a => foc.push(a);
        myCls = null; area = 'all'; oFam = 'same'; treeRefit = false; view = 'graph'; paintLayout(true);
        const f0 = el('c-' + k).focused, s0 = el('p-bo').scrolls;
        assert.equal(setCls(k), true, tag);
        assert.deepEqual([myCls, area, oFam], [k, k, 'cls'], tag + ' : état');
        assert.deepEqual(['war', 'rng', 'mag'].map(c => el('c-' + c).getAttribute('aria-pressed')), ['war', 'rng', 'mag'].map(c => String(c === k)), tag + ' : aria-pressed');
        assert.ok(isOpen('bo') && shown('bo'), tag + ' : Build optimal ouvert et déplié');
        if (phone) assert.equal(lay.acc, 'bo', tag + ' : accordéon sur Build optimal');
        assert.equal(el('p-bo').scrolls, s0 + 1, tag + ' : panneau ramené à l\'écran');
        assert.equal(el('c-' + k).focused, f0 + 1, tag + ' : focus gardé sur le bouton de la classe');
        assert.deepEqual(calls.filter(c => c === 'boStart'), ['boStart'], tag + ' : un calcul lancé');
        if (shown('tree')) assert.deepEqual([foc, treeRefit], [[k], false], tag + ' : arbre affiché, centré tout de suite');
        else assert.deepEqual([foc, treeRefit], [[], true], tag + ' : arbre caché, centré à son retour');
        assert.deepEqual([el('oFamCls').disabled, el('oFamCls').textContent, el('oFam').value], [false, `Ma classe : ${CLS_TXT[k][0]} · ${CLS_TXT[k][1]}`, 'cls'], tag + ' : option du classement, choisie même Calculateur caché');
        assert.equal(said.at(-1), `${CLS_TXT[k][0]} : build optimal en calcul pour ${CLS_TXT[k][1]} ; arbre centré sur la zone ${CLS_TXT[k][0]}`, tag + ' : message');
        calls.length = 0; assert.equal(setCls(k), true, tag + ' : re-clic');
        assert.deepEqual([myCls, area, oFam], [null, 'all', 'same'], tag + ' : classe retirée');
        assert.ok(['war', 'rng', 'mag'].every(c => el('c-' + c).getAttribute('aria-pressed') === 'false'), tag + ' : plus aucun bouton pressé');
        assert.deepEqual([el('oFamCls').disabled, el('oFamCls').textContent, el('oFam').value, calls.includes('boStart')], [true, 'Ma classe (à choisir en haut)', 'same', false], tag + ' : option désactivée, « même famille », pas de calcul');
        assert.equal(said.at(-1), 'Classe retirée : le build optimal revient aux six familles d\'arme', tag);
      })))));
    const n = said.length; assert.deepEqual([setCls('core'), setCls('zz'), setCls(undefined), myCls, said.length], [false, false, false, null, n], 'classe inconnue : refusée, sans message');
  } finally { globalThis.toast = keepT; }
}));

test('Ma classe : changer de classe garde « Ma classe » dans le classement ; une famille choisie à la main est rendue à « même famille » au retrait seulement si c\'était la classe', () => withCls(() => fakeDom(() => noLs(() => withLay(mkDispo('all'), () => spyOn(['boStart', 'toast', ...OPT], () => {
  myCls = null; oFam = 'same'; setCls('war'); setCls('mag'); assert.deepEqual([myCls, area, oFam], ['mag', 'mag', 'cls'], 'Guerrier → Mage');
  oFam = 'bow'; setCls('mag'); assert.deepEqual([myCls, oFam], [null, 'bow'], 'famille choisie à la main : gardée au retrait');
}))))));

test('Ma classe : arbre caché au choix de la classe → centré sur sa zone quand il réapparaît, une seule fois', () => withCls(() => withMq(true, () => fakeDom(() => noLs(() => withLay(mkDispo('theo'), () => spyOn(['boStart', 'toast', ...OPT], () => {
  const foc = [], keepW = G.wake; let w = 0; G.focus = a => foc.push(a); G.wake = () => { w++; };
  try {
    myCls = null; view = 'graph'; paintLayout(true);
    setCls('rng'); assert.deepEqual([foc, treeRefit, shown('tree')], [[], true, false], 'accordéon : Build optimal déplié, arbre replié');
    foldPanel('tree', false); assert.deepEqual([w, foc, treeRefit], [1, ['rng'], false], 'arbre déplié : réveillé puis centré sur Rôdeur');
    foldPanel('bo', false); foldPanel('tree', false); assert.deepEqual(foc, ['rng'], 'pas recentré une deuxième fois');
  } finally { G.wake = keepW; }
})))))));

test('Ma classe (DOM observé) : classement du Calculateur limité aux familles de la classe, « Dégâts » / « Puissance » signalé quand ils se mêlent ; zone de chaque point proposé', () => withCls(() => fakeDom(el => noLs(() => withLay(mkDispo('all'), () => {
  const keepB = builds[0], keepC = cur;
  try {
    builds[0] = blankBuild('Classes'); cur = 0; // aucune arme : chaque ligne du classement porte ses boutons Arme 1 / Arme 2
    for (const [k, fams, mixed] of [['war', ['melee'], false], ['rng', ['dagger', 'bow'], true], ['mag', ['wand', 'staff'], true]]) {
      myCls = k; oFam = 'cls'; optCalc(B(), compute(B()), ENEMIES[oEnemy]);
      const h = el('optBody').innerHTML, ids = [...new Set([...h.matchAll(/data-eq="(\w+)"/g)].map(m => m[1]))];
      assert.equal(ids.length, Math.min(12, WEAPONS.filter(w => fams.includes(CAT[w[2]][1])).length), k + ' : les 12 premières armes de la classe');
      assert.deepEqual(ids.filter(id => !fams.includes(CAT[ITEMS[id].cat][1])), [], k + ' : arme hors classe');
      assert.equal(h.includes('ne se comparent pas directement'), mixed, k + ' : avertissement Dégâts / Puissance');
      assert.ok(h.includes(`classe ${CLS_TXT[k][0]} : ${CLS_TXT[k][1]}`), k + ' : étiquette du classement');
    }
    myCls = null; oFam = 'cls'; optCalc(B(), compute(B()), ENEMIES[oEnemy]); // classe retirée hors de la barre : comme « même famille » (aucune arme → toutes)
    assert.equal(new Set([...el('optBody').innerHTML.matchAll(/data-eq="(\w+)"/g)].map(m => m[1])).size, 12);
    // zones : chaque point proposé porte la pastille de sa zone (compétence : sa zone ; nœud d'attribut : celle de l'attribut)
    assert.deepEqual([invArea({kind: 'skill', id: 'warriorsPath'}), invArea({kind: 'skill', id: 'marksman'}), invArea({kind: 'skill', id: 'wandMastery'}), invArea({kind: 'skill', id: 'zz'})], ['war', 'rng', 'mag', undefined]);
    assert.deepEqual(['str', 'con', 'end', 'dex', 'int', 'spi'].map(a => invArea({kind: 'pip', id: TOPO.pips.find(p => p.attr === a).id})), ['war', 'war', 'rng', 'rng', 'mag', 'mag']);
    builds[0] = fromPreset(PRESETS[3]); myCls = null; oFam = 'same'; optCalc(B(), compute(B()), ENEMIES[oEnemy]);
    const inv = el('optBody')._inv.slice(0, 10), h = el('optBody').innerHTML; assert.ok(inv.length >= 3, 'Barbare : des points à proposer');
    for (const x of inv) assert.ok(h.includes(`${zoneTag(invArea(x))} ${esc(x.en)} · rang ${x.rank}/${x.max}`), x.label + ' : zone absente');
    assert.equal(zoneTag('mag'), '<span class="ztag" style="--ac:var(--mag)">Mage</span>'); assert.equal(zoneTag(undefined), '');
  } finally { builds[0] = keepB; cur = keepC; }
})))));
