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
