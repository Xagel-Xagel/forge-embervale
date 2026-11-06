// Preset « Mage critique (baguette) » (1.14.0, HISTORY n° 19) : chance de critique d'abord, puis dégâts critiques, puis dégâts moyens.
const MCB = PRESETS.find(p => p.name === 'Mage critique (baguette)');
// Code donné à l'utilisateur le 2026-11-06 : doit toujours s'ouvrir sur ce build (les tables figées FZ le garantissent).
const MCB_CODE = 'b3-1e360b05-0k0l0m0n0o2e2k1715-3cencn1z0074-1ih7d8e9f8qsx34sge6rve21mskomgod1c-11131333113311131111113311-7u';

test('Mage critique (baguette) : 66 % de critique et 123 % de dégâts critiques à la baguette', () => {
  assert.ok(MCB);
  const o = compute(fromPreset(MCB)), w = o.weapons[0];
  assert.equal(w.w.cat, 'wand'); assert.equal(o.weapons[1].w.cat, 'staff');
  assert.equal(w.cc, 66); assert.equal(o.critD, 123);
});

test('Mage critique (baguette) : aucun équipement ne domine (chance, dégâts critiques, puis dégâts moyens à égalité)', () => {
  const b = fromPreset(MCB), o0 = compute(b), cc0 = o0.weapons[0].cc, cd0 = o0.critD, a0 = o0.weapons[0].avg;
  const opt = sl => Object.values(ITEMS).filter(i => i.kind === 'armor' && i.slot === sl).map(i => i.id);
  const check = (gear, lbl) => { const t = JSON.parse(JSON.stringify(b)); Object.assign(t.gear, gear);
    const o = compute(t), cc = o.weapons[0].cc, cd = o.critD, a = o.weapons[0].avg;
    assert.ok(!(cc >= cc0 && cd >= cd0 && (cc > cc0 || cd > cd0)), `${lbl} : ${cc} % / ${cd} %`);
    assert.ok(!(cc === cc0 && cd === cd0 && a > a0 + 1e-9), `${lbl} : même critique, ${a} de moyenne`); return [cc, cd]; };
  let best = 0, cdBest = 0;
  // deux anneaux différents (règle du build optimal, HISTORY n° 18 ; deux fois le même anneau : non vérifié en jeu)
  for (const h of opt('head')) for (const c of opt('chest')) RINGS.forEach((x, i) => RINGS.forEach((y, j) => { if (i >= j) return;
    const [cc, cd] = check({head: h, chest: c, r1: x[0], r2: y[0]}, `${h} ${c} ${x[0]} ${y[0]}`);
    if (cc > best) { best = cc; cdBest = cd } else if (cc === best) cdBest = Math.max(cdBest, cd); }));
  for (const sl of ['hands', 'legs', 'feet']) for (const id of opt(sl)) check({[sl]: id}, id);
  // décision de l'utilisateur : 67 % / 104 % écarté pour 66 % / 123 % (Ring of the Ancients au lieu d'un anneau à +5 %)
  assert.equal(best, 67); assert.equal(cdBest, 104); assert.equal(cc0, 66); assert.equal(cd0, 123);
});

test('Mage critique (baguette) : la baguette et le bâton sont les plus forts de leur famille dans ce build', () => {
  const b = fromPreset(MCB);
  assert.equal(ITEMS[b.gear.w1].cat, 'wand'); assert.equal(ITEMS[b.gear.w2].cat, 'staff');
  const avg = (sl, id) => { const t = JSON.parse(JSON.stringify(b)); t.gear[sl] = id; return compute(t).weapons[sl === 'w1' ? 0 : 1].avg; };
  for (const [sl, cat] of [['w1', 'wand'], ['w2', 'staff']]) { const a0 = avg(sl, b.gear[sl]);
    for (const [id] of WEAPONS) if (ITEMS[id].cat === cat) assert.ok(avg(sl, id) <= a0 + 1e-9, `${sl} : ${id} fait mieux que ${b.gear[sl]}`); }
});

test('Mage critique (baguette) : aucune compétence ni Intelligence de plus n\'augmente la critique ni les dégâts des deux armes', () => {
  const b = fromPreset(MCB), key = o => [o.weapons[0].cc, o.critD, o.weapons[0].avg, o.weapons[1].avg], k0 = key(compute(b));
  const same = (t, lbl) => key(compute(t)).forEach((v, i) => assert.ok(v <= k0[i] + 1e-9, `${lbl} augmenterait ${['la chance', 'les dégâts critiques', 'la baguette', 'le bâton'][i]}`));
  for (const s of SK) { if ((b.sk[s.id] || 0) >= s.max) continue; const t = JSON.parse(JSON.stringify(b)); t.sk[s.id] = s.max; same(t, s.id); }
  const t = JSON.parse(JSON.stringify(b)); t.pip.int = PIPS.find(p => p[0] === 'int')[4]; same(t, 'Intelligence au maximum');
});

test('Mage critique (baguette) : le code donné à l\'utilisateur s\'ouvre sur ce build', () => {
  const b = fromPreset(MCB), d = decode(MCB_CODE);
  assert.ok(d); assert.equal(encode(b), MCB_CODE);
  for (const k of ['gear', 'gem', 'sk', 'pip', 'pn', 'lvl', 'exp', 'flame', 'upg', 'tv']) assert.deepEqual(d[k], b[k], k);
});
