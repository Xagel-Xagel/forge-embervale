// Preset « Mage critique (baguette) » : refait en 1.17.0 (HISTORY n° 23) — chance de coup critique d'abord, puis dégâts critiques, puis dégâts moyens,
// perks d'arme comptés (chance et dégâts de coup critique), niveau 25 + 61 d'exploration = 109 points, Flamme 4. Première version : 1.14.0 (HISTORY n° 19).
const MCB = PRESETS.find(p => p.name === 'Mage critique (baguette)');
// Code du preset 1.17.0 : doit toujours s'ouvrir sur ce build (les tables figées FZ le garantissent).
const MCB_CODE = 'b3-0p1p0405-0k0l0m0n0o2h2m1715-3cbvkr8hc2dc-1iiv6ao6g0uoy0xl8l70m7yxv2gmd42i2o-1113131331133111311111113311-g0b0e-dy';
// Code donné à l'utilisateur le 2026-11-06 pour la 1.14.0 : le preset a changé, mais ce lien doit toujours ouvrir le build de la 1.14.0, figé ci-dessous.
const MCB_CODE_114 = 'b3-1e360b05-0k0l0m0n0o2e2k1715-3cencn1z0074-1ih7d8e9f8qsx34sge6rve21mskomgod1c-11131333113311131111113311-7u';
const MCB_114 = {gear: {head: 'fla_h', chest: 'fla_c', hands: 'fla_g', legs: 'fla_l', feet: 'fla_f', w1: 'w_bloodflow', w2: 'w_violet', r1: 'rg_eth', r2: 'rg_anc'}, gem: {},
  sk: {marksman: 1, sniper: 1, vitalitySurge: 1, fatalPrecision: 3, healingRevive: 1, mageApprentice: 3, arsonist: 3, wizard: 3, chainHit: 1, massDestr: 1, terror: 3, bloodletting: 3,
    shroudMitigation: 1, healer: 1, exalted: 1, thunder: 3, waterAura: 1, eternalSpark: 1, lifeEssences: 1, shroudResistance: 1, sharedMisery: 1, manaCurrents: 1, spellslinger: 3,
    wandMastery: 3, aerialWand: 1, blastCast: 1},
  pip: {con: 2, dex: 1, int: 11, spi: 6},
  pn: {'pip:27th6o': 1, 'pip:1rkw3ke': 1, 'pip:11qot5x': 1, 'pip:101011r': 1, 'pip:16sd25b': 1, 'pip:7tyb4s': 1, 'pip:13cdgsq': 1, 'pip:u3ewct': 1, 'pip:a3gm4i': 1, 'pip:beub9v': 1,
    'pip:110miev': 1, 'pip:fj7jpn': 1, 'pip:1rv6bfd': 1, 'pip:1lm4k0r': 1, 'pip:itley': 1, 'pip:1th8yhf': 1, 'pip:oal925': 1, 'pip:1wwtpca': 1, 'pip:14r1h78': 1, 'pip:1xv3exe': 1},
  lvl: 50, exp: 114, flame: 11, upg: 5, tv: 1};
const r1 = v => Math.round(v * 10) / 10;
// chance, puis dégâts critiques, puis moyenne (règle « chance d'abord » choisie par l'utilisateur)
const lex = (a, b) => a.cc - b.cc || a.cd - b.cd || (Math.abs(a.avg - b.avg) > 1e-9 ? a.avg - b.avg : 0);

test('Mage critique (baguette) : 109 points (niveau 25 + 61), Flamme 4 ; baguette 78 % / 123 % → 436,8, bâton 73 % / 123 % → 388,7', () => {
  assert.ok(MCB);
  const b = fromPreset(MCB), o = compute(b), [w, s] = o.weapons;
  assert.deepEqual([b.lvl, b.exp, b.flame, b.upg, budget(b), spentPoints(b)], [25, 61, 4, 5, 109, 95]);
  assert.deepEqual([w.w.id, s.w.id, b.gem.w1, b.gem.w2], ['w_mythic', 'w_oracle', 'g_storm', 'g_corrupt']);
  assert.deepEqual([w.cc, w.cd, r1(w.avg)], [78, 123, 436.8]);
  assert.deepEqual([s.cc, s.cd, r1(s.avg)], [73, 123, 388.7]);
  // les perks comptés : Chance de coup critique +6 % (emplacements 4 et 5) sur la baguette, +7 % (emplacement 4) sur le bâton
  assert.deepEqual(w.cparts.filter(p => p[0].startsWith('Perk')).map(p => p[1]), [6, 6]);
  assert.deepEqual(s.cparts.filter(p => p[0].startsWith('Perk')).map(p => p[1]), [7]);
  // Exalté à la Flamme 4 : +2 Intelligence (11 nœuds + 2)
  assert.equal(o.attr.int, 13);
});

test('Mage critique (baguette) : tout repose sur 5 améliorations (perks des emplacements 4-5, Précision fatale +3 de l\'anneau de l\'Éther)', () => {
  const b = fromPreset(MCB), at = u => { const t = JSON.parse(JSON.stringify(b)); t.upg = u; const w = compute(t).weapons[0]; return [w.cc, w.cd, r1(w.avg)]; };
  assert.deepEqual(at(4), [53, 120, 349.9]);
  assert.deepEqual(at(3), [47, 100, 314.4]);
});

test('Mage critique (baguette) : aucun équipement ne domine (chance, dégâts critiques, puis dégâts moyens à égalité)', () => {
  const b = fromPreset(MCB), w0 = compute(b).weapons[0];
  const opt = sl => Object.values(ITEMS).filter(i => i.kind === 'armor' && i.slot === sl).map(i => i.id);
  const check = (gear, lbl) => { const t = JSON.parse(JSON.stringify(b)); Object.assign(t.gear, gear); const w = compute(t).weapons[0];
    assert.ok(!(w.cc >= w0.cc && w.cd >= w0.cd && (w.cc > w0.cc || w.cd > w0.cd)), `${lbl} : ${w.cc} % / ${w.cd} %`);
    assert.ok(!(w.cc === w0.cc && w.cd === w0.cd && w.avg > w0.avg + 1e-9), `${lbl} : même critique, ${w.avg} de moyenne`); return w; };
  let best = 0, cdBest = 0;
  // deux anneaux différents (règle du build optimal, HISTORY n° 18 ; deux fois le même anneau : non vérifié en jeu)
  for (const h of opt('head')) for (const c of opt('chest')) RINGS.forEach((x, i) => RINGS.forEach((y, j) => { if (i >= j) return;
    const w = check({head: h, chest: c, r1: x[0], r2: y[0]}, `${h} ${c} ${x[0]} ${y[0]}`);
    if (w.cc > best) { best = w.cc; cdBest = w.cd } else if (w.cc === best) cdBest = Math.max(cdBest, w.cd); }));
  for (const sl of ['hands', 'legs', 'feet']) for (const id of opt(sl)) check({[sl]: id}, id);
  // décision de l'utilisateur (n° 19, reconduite au n° 23) : 79 % / 104 % (anneau d'endurance) écarté pour 78 % / 123 % (anneau des Anciens)
  assert.deepEqual([best, cdBest, w0.cc, w0.cd], [79, 104, 78, 123]);
});

test('Mage critique (baguette) : baguette et bâton sont les meilleurs de leur famille, chance d\'abord, dans ce build', () => {
  const b = fromPreset(MCB);
  for (const [sl, cat, i] of [['w1', 'wand', 0], ['w2', 'staff', 1]]) { const w0 = compute(b).weapons[i];
    for (const [id] of WEAPONS) { if (ITEMS[id].cat !== cat) continue; const t = JSON.parse(JSON.stringify(b)); t.gear[sl] = id;
      assert.ok(lex(compute(t).weapons[i], w0) <= 0, `${sl} : ${id} passe devant ${b.gear[sl]}`); } }
});

test('Mage critique (baguette) : aucune compétence ni Intelligence de plus n\'augmente chance, dégâts critiques ni moyenne des deux armes', () => {
  const b = fromPreset(MCB), key = o => o.weapons.flatMap(w => [w.cc, w.cd, w.avg]), k0 = key(compute(b));
  const same = (t, lbl) => key(compute(t)).forEach((v, i) => assert.ok(v <= k0[i] + 1e-9, `${lbl} augmenterait ${['la chance', 'les dégâts critiques', 'la moyenne'][i % 3]} de l'arme ${1 + (i > 2)}`));
  for (const s of SK) { if ((b.sk[s.id] || 0) >= s.max) continue; const t = JSON.parse(JSON.stringify(b)); t.sk[s.id] = s.max; same(t, s.id); }
  const t = JSON.parse(JSON.stringify(b)); t.pip.int = PIPS.find(p => p[0] === 'int')[4]; same(t, 'Intelligence au maximum');
});

test('Mage critique (baguette) : le code du preset s\'ouvre sur ce build ; celui de la 1.14.0 s\'ouvre toujours sur l\'ancien build', () => {
  const b = fromPreset(MCB), d = decode(MCB_CODE);
  assert.ok(d); assert.equal(encode(b), MCB_CODE);
  for (const k of ['gear', 'gem', 'sk', 'pip', 'pn', 'lvl', 'exp', 'flame', 'upg', 'tv']) assert.deepEqual(d[k], b[k], k);
  const d0 = decode(MCB_CODE_114); assert.ok(d0 && !d0._mig, 'lien de la 1.14.0 illisible ou migré');
  for (const k in MCB_114) assert.deepEqual(d0[k], MCB_114[k], '1.14.0 : ' + k);
});
