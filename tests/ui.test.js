// Fumée : l'interface se rend sans exception sur chaque preset (DOM simulé).
test('rendu complet de chaque preset, en vue graphe et liste', () => {
  for (let i = 0; i < PRESETS.length; i++) {
    builds[0] = fromPreset(PRESETS[i]); cur = 0;
    view = 'graph'; renderAll(); view = 'list'; renderAll(); renderOptNow();
  }
  view = 'graph';
});
