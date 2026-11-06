// Preset « Mage critique (baguette) » (1.14.0, HISTORY n° 19) : chance de critique d'abord, puis dégâts critiques, puis dégâts moyens.
const MCB = PRESETS.find(p => p.name === 'Mage critique (baguette)');
// Code donné à l'utilisateur le 2026-11-06 : doit toujours s'ouvrir sur ce build (les tables figées FZ le garantissent).
const MCB_CODE = 'b3-1e360b05-0k0l0m0n0o2e2k1715-3cencn1z0074-1ih7d8e9f8qsx34sge6rve21mskomgod1c-11131333113311131111113311-7u';

test('Mage critique (baguette) : en fin de PRESETS, 66 % de critique et 123 % de dégâts critiques à la baguette', () => {
  assert.equal(PRESETS.at(-1), MCB);
  const o = compute(fromPreset(MCB)), w = o.weapons[0];
  assert.equal(w.w.cat, 'wand');
  assert.equal(w.cc, 66); assert.equal(o.critD, 123);
});

test('Mage critique (baguette) : aucune tête, aucun torse ni aucune paire d\'anneaux ne domine (chance, puis dégâts critiques)', () => {
  const b = fromPreset(MCB), o0 = compute(b), cc0 = o0.weapons[0].cc, cd0 = o0.critD;
  const opt = sl => Object.values(ITEMS).filter(i => i.kind === 'armor' && i.slot === sl).map(i => i.id);
  let best = 0;
  for (const h of opt('head')) for (const c of opt('chest')) RINGS.forEach((x, i) => RINGS.forEach((y, j) => { if (i >= j) return;
    const t = JSON.parse(JSON.stringify(b)); Object.assign(t.gear, {head: h, chest: c, r1: x[0], r2: y[0]});
    const o = compute(t), cc = o.weapons[0].cc, cd = o.critD; best = Math.max(best, cc);
    assert.ok(!(cc >= cc0 && cd >= cd0 && (cc > cc0 || cd > cd0)), `${h} ${c} ${x[0]} ${y[0]} : ${cc} % / ${cd} %`); }));
  // décision de l'utilisateur : 1 point de chance cédé contre +19 de dégâts critiques (Ring of the Ancients au lieu d'un anneau à +5 %)
  assert.equal(best, 67); assert.equal(cc0, best - 1);
});

test('Mage critique (baguette) : la baguette et le bâton sont les plus forts de leur famille dans ce build', () => {
  const b = fromPreset(MCB), avg = (sl, id) => { const t = JSON.parse(JSON.stringify(b)); t.gear[sl] = id; return compute(t).weapons[sl === 'w1' ? 0 : 1].avg; };
  for (const [sl, cat] of [['w1', 'wand'], ['w2', 'staff']]) { const a0 = avg(sl, b.gear[sl]);
    for (const [id] of WEAPONS) if (ITEMS[id].cat === cat) assert.ok(avg(sl, id) <= a0 + 1e-9, `${sl} : ${id} fait mieux que ${b.gear[sl]}`); }
});

test('Mage critique (baguette) : chaque compétence de dégâts de baguette est au maximum (rien ne reste à acheter pour la moyenne)', () => {
  const b = fromPreset(MCB), a0 = compute(b).weapons[0].avg;
  for (const s of SK) { if ((b.sk[s.id] || 0) >= s.max) continue; const t = JSON.parse(JSON.stringify(b)); t.sk[s.id] = s.max;
    assert.ok(compute(t).weapons[0].avg <= a0 + 1e-9, s.id + ' augmenterait les dégâts moyens'); }
  assert.equal(b.pip.int, 11);
});

test('Mage critique (baguette) : le code donné à l\'utilisateur s\'ouvre sur ce build', () => {
  const b = fromPreset(MCB), d = decode(MCB_CODE);
  assert.ok(d); assert.equal(encode(b), MCB_CODE);
  for (const k of ['gear', 'gem', 'sk', 'pip', 'pn']) assert.deepEqual(d[k], b[k], k);
});
