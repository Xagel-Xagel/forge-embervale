// Fumée : l'interface se rend sans exception sur chaque preset (DOM simulé), en vue graphe et liste, dans chaque disposition (bureau et accordéon).
test('rendu complet de chaque preset, en vue graphe et liste, dans chaque disposition', () => {
  const keepL = lay, keepMq = globalThis.matchMedia;
  try {
    for (let i = 0; i < PRESETS.length; i++) {
      builds[0] = fromPreset(PRESETS[i]); cur = 0;
      for (const k of Object.keys(DISPOS)) for (const phone of [false, true]) {
        globalThis.matchMedia = () => ({matches: phone, addEventListener() {}});
        lay = mkDispo(k); paintLayout(); view = 'graph'; renderAll(); view = 'list'; renderAll(); renderOptNow();
      }
    }
  } finally { view = 'graph'; lay = keepL; globalThis.matchMedia = keepMq; builds[0] = fromPreset(PRESETS[0]); }
});

// « Ma classe » (1.19.0) : chaque preset avec chaque classe choisie dans la barre (disposition Tout : tous les panneaux rendus), bureau et accordéon, vue graphe et liste.
// Le calcul du build optimal n'est pas lancé ici (boStart remplacé) ; dispositions × classes : nav.test.js (DOM observé).
test('rendu complet de chaque preset avec chaque classe (bureau et accordéon, graphe et liste)', () => {
  const keepL = lay, keepMq = globalThis.matchMedia, keepS = globalThis.boStart, keepT = globalThis.toast, keep = [myCls, area, oFam, treeRefit];
  try {
    globalThis.boStart = () => {}; globalThis.toast = () => {};
    for (let i = 0; i < PRESETS.length; i++) {
      builds[0] = fromPreset(PRESETS[i]); cur = 0;
      for (const phone of [false, true]) for (const c of ['war', 'rng', 'mag']) {
        globalThis.matchMedia = () => ({matches: phone, addEventListener() {}});
        lay = mkDispo('all'); paintLayout(); myCls = null; view = 'graph'; assert.equal(setCls(c), true); renderAll(); view = 'list'; renderAll(); renderOptNow();
        assert.deepEqual([myCls, area, oFam], [c, c, 'cls'], PRESETS[i].name + ' · ' + c);
      }
    }
  } finally { view = 'graph'; lay = keepL; globalThis.matchMedia = keepMq; globalThis.boStart = keepS; globalThis.toast = keepT; [myCls, area, oFam, treeRefit] = keep; builds[0] = fromPreset(PRESETS[0]); }
});
