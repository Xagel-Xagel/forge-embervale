// Fumée : l'interface se rend sans exception sur chaque preset (DOM simulé), en vue graphe et liste, et chaque onglet du calculateur.
test('rendu complet de chaque preset, en vue graphe et liste, dans chaque onglet', () => {
  const keep = sec;
  try {
    for (let i = 0; i < PRESETS.length; i++) {
      builds[0] = fromPreset(PRESETS[i]); cur = 0;
      view = 'graph'; renderAll(); view = 'list'; renderAll();
      for (const [k] of SECS) { showSec(k, true); renderOptNow(); }
    }
  } finally { view = 'graph'; showSec(keep, true); }
});
