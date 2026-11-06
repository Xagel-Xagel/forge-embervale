// Perks d'arme (1.17.0, HISTORY n° 23) : 5 emplacements dans l'ordre des fichiers 1.0 (PinDrop), débloqués un par amélioration ;
// seuls « Chance de coup critique » et « Dégâts de coup critique » sont comptés, pour l'arme qui les porte.
const wb = (w1, w2, upg) => { const b = blankBuild('t'); b.gear = {w1, w2}; b.upg = upg; return b; };

test('perks d\'arme : chance de coup critique comptée emplacement par emplacement (Mythic Wand : emplacements 4 et 5)', () => {
  const cc = u => compute(wb('w_mythic', 'w_bloodflow', u)).weapons[0].cc;
  assert.deepEqual([0, 3, 4, 5].map(cc), [10, 10, 16, 22]);
  const o = compute(wb('w_mythic', 'w_bloodflow', 5));
  assert.deepEqual(o.weapons[0].cparts.slice(-2), [['Perk : Chance de coup critique', 6], ['Perk : Chance de coup critique', 6]]);
  assert.equal(o.weapons[1].cc, 10, 'la chance de la baguette 1 ne passe pas à l\'arme 2');
});

test('perks d\'arme : dégâts de coup critique comptés pour l\'arme qui les porte seulement (Wand Of Bloodflow : +22 % en emplacement 5)', () => {
  const o = compute(wb('w_bloodflow', 'w_mythic', 5)), [w, m] = o.weapons;
  assert.deepEqual([o.critD, w.cd, m.cd], [80, 102, 80]);
  assert.ok(Math.abs(w.avg - w.hit * (1 + w.cc / 100 * w.cd / 100)) < 1e-9, 'moyenne = coup × (1 + chance × dégâts critiques de l\'arme)');
  assert.deepEqual(w.cdparts, [['Perk : Dégâts de coup critique', 22]]);
  assert.equal(compute(wb('w_bloodflow', null, 4)).weapons[0].cd, 80, 'emplacement 5 pas encore débloqué');
});

test('perks d\'arme : chance plafonnée à 100 %, rangs de compétence des armes non comptés, autres perks sans effet sur les dégâts', () => {
  const b = fromPreset(PRESETS.find(p => p.name === 'Mage critique (baguette)')); b.gear.w2 = 'w_moor'; // Staff Of The Moor : Nécromancien +2 rangs
  const o = compute(b); assert.equal(o.gearRk.necromancer || 0, compute(fromPreset(PRESETS.find(p => p.name === 'Mage critique (baguette)'))).gearRk.necromancer || 0);
  const keep = ITEMS.w_mythic.wperks; ITEMS.w_mythic.wperks = [['precise', 95]]; // valeur fictive : 10 + 95 > 100
  try { assert.equal(compute(wb('w_mythic', null, 5)).weapons[0].cc, 100); } finally { ITEMS.w_mythic.wperks = keep; }
  // une arme sans perk compté : même moyenne qu'avec les perks retirés
  const s = wb('w_apprentice', null, 5), a = compute(s).weapons[0].avg; ITEMS.w_apprentice.wperks = []; try { assert.equal(compute(s).weapons[0].avg, a); } finally { ITEMS.w_apprentice.wperks = WEAPONS.find(w => w[0] === 'w_apprentice')[6]; }
});

test('base égale par famille : toutes les baguettes à 91, tous les bâtons à 77 (fichiers 1.0 : même multiplicateur)', () => {
  for (const [id, , cat, , val] of WEAPONS) { if (cat === 'wand') assert.equal(val, 91, id); if (cat === 'staff') assert.equal(val, 77, id); }
  // à build égal, deux baguettes de même type et sans perk compté font le même coup
  const h = id => compute(wb(id, null, 0)).weapons[0].hit; assert.equal(h('w_mythic'), h('w_ancdrak'));
});

test('gemmes : un perk « Lourd » d\'un type compte comme dégâts de ce type pour le déclenchement (format à emplacements)', () => {
  assert.equal(gemFit(GEMI.g_burn, ITEMS.w_bloodflow), true);
  assert.equal(gemFit(GEMI.g_burn, ITEMS.w_mythic), false);
  assert.equal(gemFit(GEMI.g_punct, ITEMS.w_flesh), true, 'Fleshgrinder : contondant, mais Lourd (Perforation)');
  assert.equal(gemFit(GEMI.g_storm, ITEMS.w_mythic), null, 'gemme sans type : toutes armes');
});

test('puces des perks d\'arme : emplacements grisés au-delà des améliorations, ✓ sur les perks comptés, unités', () => {
  const p = ITEMS.w_mythic.wperks.map((x, i) => wperkChip(x, i < 4));
  assert.match(p[0], /class="chip tag"/); assert.match(p[0], /Lourd \(Foudre\) \+10 %/); assert.doesNotMatch(p[0], /✓/);
  assert.match(p[3], /Chance de coup critique \+6 % ✓/); assert.match(p[4], /class="chip tag off"/);
  assert.match(wperkChip(['mleechF', 8], true), /Absorption de mana \+8</);
  assert.match(wperkChip(['k', 'necromancer', 2], false), /class="chip sk off">Nécromancien \+2 rangs \(non compté\)</);
});

// Revue QA 1.17.0
test('fiche : la carte d\'arme montre les dégâts critiques de l\'arme et leur détail ; la ligne de la fiche dit « base »', () => {
  const w = compute(wb('w_bloodflow', null, 5)).weapons[0], h = weaponBlock(w, 'Arme 1');
  assert.equal(Math.round(w.avg * 10) / 10, 100.3); // 91 × (1 + 0,10 × 1,02) = 100,28 : chance de base 10 %, 80 + 22 % de dégâts critiques
  assert.match(h, /<b>\+102 %<\/b><span>dégâts critiques/); assert.match(h, /Dégâts critiques · Perk : Dégâts de coup critique : \+22 %/);
  const h4 = weaponBlock(compute(wb('w_bloodflow', null, 4)).weapons[0], 'Arme 1');
  assert.match(h4, /<b>\+80 %<\/b>/); assert.doesNotMatch(h4, /Perk : Dégâts de coup critique/);
  assert.ok(rowsFor(compute(wb('w_bloodflow', null, 5))).some(r => r.lab === 'Dégâts critiques (base, hors perks d\'arme)' && r.v === 80));
});

test('puces : pas de ✓ sur un perk compté mais encore verrouillé ; rangs d\'arme marqués non comptés et absents de gearRk', () => {
  assert.doesNotMatch(wperkChip(['precise', 6], false), /✓/); assert.match(wperkChip(['precise', 6], true), /✓/);
  assert.match(wperkChip(['k', 'manaCurrents', 3], true), /Courants de mana \+3 rangs \(non compté\)/);
  const b = wb('w_storm', 'w_moor', 5); const o = compute(b); assert.equal(o.gearRk.manaCurrents, undefined); assert.equal(o.gearRk.necromancer, undefined);
});
