// Noms français (07-noms.js) : complets, sans clé orpheline, recherche FR et EN, échappés, traduction du simulateur signalée.
test('chaque objet et chaque ennemi a un nom français ; aucune clé orpheline', () => {
  for (const it of Object.values(ITEMS)) assert.ok(typeof it.fr === 'string' && it.fr.trim(), it.id + ' : nom français manquant');
  for (const id in FR_ITEMS) assert.ok(ITEMS[id], 'FR_ITEMS : objet inconnu ' + id);
  for (const S of SETS) assert.ok(FR_SETS[S.set], S.set + ' : panoplie sans nom français');
  for (const it of Object.values(ITEMS)) if (it.kind === 'armor') assert.equal(it.setFr, FR_SETS[it.set], it.id);
  const names = new Set(ENEMIES.map(e => e.n));
  for (const n in FR_ENEMIES) assert.ok(names.has(n), 'FR_ENEMIES : ennemi inconnu ' + n);
  for (const e of ENEMIES) { assert.ok(e.fr && e.fr.trim(), e.n + ' : nom français manquant'); assert.ok(['o', 'd', 't'].includes(e.fs), e.n + ' : source ' + e.fs); }
});
test('noms français uniques (ennemis, objets) : deux entrées ne se confondent pas à l\'écran', () => {
  assert.equal(new Set(ENEMIES.map(e => e.fr)).size, ENEMIES.length, 'nom français d\'ennemi en double');
  const it = Object.values(ITEMS); assert.equal(new Set(it.map(i => i.fr)).size, it.length, 'nom français d\'objet en double');
});
test('valeurs de la liste validée (échantillon : officiel, déduit, traduction, factions)', () => {
  const E = n => ENEMIES.find(e => e.n === n);
  assert.deepEqual([ITEMS.w_bloodflow.fr, ITEMS.emb_h.fr, ITEMS.rg_anc.fr, ITEMS.emb_h.setFr], ['Baguette de flux sanguin', 'Casque de Gardebraise', 'Anneau des Anciens', 'Gardebraise']);
  assert.deepEqual([E('Scavenger Tyrant').fr, E('Scavenger Tyrant').fs], ['Maraudeur Tyran', 'o']);
  assert.deepEqual([E('Fell Black Knight').fr, E('Fell Black Knight').fs], ['Chevalier noir Déchu', 'd']);
  assert.deepEqual([E('Hollow Hound').fr, E('Hollow Hound').fs], ['Chien Creux', 't']);
  assert.deepEqual(Object.values(FACTIONS), ['Déchus', 'Creux', 'Maraudeurs', 'Vukah', 'Drak\'Dal', 'Faune', 'Anciens']);
});
test('recherche : français ou anglais, sans casse ni accents', () => {
  const fbk = ENEMIES.find(e => e.n === 'Fell Black Knight');
  for (const q of ['chevalier noir', 'CHEVALIER', 'dechu', 'Déchu', 'black knight', 'fell black']) assert.ok(nmMatch(fbk, q), q);
  assert.ok(!nmMatch(fbk, 'creux'));
  const prev = [oMxQ, oMxF];
  try {
    oMxF = 'all';
    for (const q of ['chien creux', 'hollow hound']) { oMxQ = q; const h = mxRows(); assert.match(h, /Chien Creux/, q); assert.equal((h.match(/data-en=/g) || []).length, 1, q + ' : un seul résultat'); }
    oMxQ = 'zzz'; assert.match(mxRows(), /Aucun ennemi/);
  } finally { [oMxQ, oMxF] = prev; }
});
test('affichage : français puis anglais en italique, ° seulement pour une traduction du simulateur, texte échappé', () => {
  const fbk = ENEMIES.find(e => e.n === 'Fell Black Knight'), hh = ENEMIES.find(e => e.n === 'Hollow Hound');
  assert.equal(nmH(fbk), 'Chevalier noir Déchu <span class="en">Fell Black Knight</span>');
  assert.match(nmH(hh), /^Chien Creux<sup class="trm" title="Traduction du simulateur[^"]*">°<\/sup> <span class="en">Hollow Hound<\/span>$/);
  assert.equal(nmT(hh), 'Chien Creux °'); assert.equal(nmT(fbk), 'Chevalier noir Déchu');
  assert.match(nmF(hh), /^Chien Creux<sup class="trm"[^>]*>°<\/sup>$/); assert.equal(nmF(fbk), 'Chevalier noir Déchu');
  assert.equal(nmH({fr: '<b>&', n: '"x\'', fs: 'o'}), '&lt;b&gt;&amp; <span class="en">&quot;x\'</span>');
  const n = ENEMIES.filter(e => e.fs === 't').length; assert.ok(n > 0 && n < ENEMIES.length, 'mélange officiel / traduction attendu');
});
