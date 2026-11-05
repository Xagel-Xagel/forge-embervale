// Codes de partage : stabilité et rétrocompatibilité. Si un de ces tests casse, des liens déjà partagés sont cassés.
test('aller-retour encode/decode pour chaque preset', () => {
  for (const p of PRESETS) {
    const b = fromPreset(p); const code = encode(b);
    assert.match(code, /^[0-9a-z-]+$/, 'caractères interdits dans le hash');
    const d = decode(code);
    assert.ok(d, p.name);
    assert.deepEqual(d.gear, b.gear, p.name + ' : équipement');
    assert.deepEqual(d.gem, b.gem, p.name + ' : gemmes');
    assert.deepEqual(d.pip, b.pip, p.name + ' : attributs');
    for (const s of SK) assert.equal(d.sk[s.id] || 0, b.sk[s.id] || 0, p.name + ' : ' + s.id);
    assert.deepEqual([d.lvl, d.exp, d.flame, d.upg], [b.lvl, b.exp, b.flame, b.upg]);
  }
});
// Code b2 figé le 2026-11-05 (Mage de bataille, version 8). Ne jamais modifier ces valeurs :
// si ce test casse, c'est que l'ordre de ITEMS, SK, GEMS ou des nœuds d'attribut (TOPO.pips) a bougé.
const REF_B2 = 'b2-1e360b05-0k0l0m0n0o2e2o1618-4do28ek0pq2n-0000001000000000000000110000000110000110010000001100100000010000000000000000000000000000000000000000000000000000000000001033011300013110101110111103030303130000100303111011-g0l0g';
const REF_BUILD = {"gear":{"head":"fla_h","chest":"fla_c","hands":"fla_g","legs":"fla_l","feet":"fla_f","w1":"w_bloodflow","w2":"w_guidance","r1":"rg_mf","r2":"rg_ths"},"gem":{"w1":"g_curr","w2":"g_light"},"sk":{"mageApprentice":3,"wandMastery":3,"wizard":3,"thunder":3,"arsonist":3,"blastCast":1,"wandSpec":1,"unity":3,"wandEvasion":1,"aerialWand":1,"blink":1,"waterAura":3,"manaCurrents":3,"quickCharge":3,"chainHit":1,"massDestr":1,"sting":1,"arcaneProlif":1,"fireResistance":3,"lifeEssences":3,"exalted":1,"arcaneConc":1,"doubleJump":1,"shroudResistance":1,"healer":1,"necromancer":1,"heavyPlates":1,"shinyPlates":1,"absorb":1,"iceman":1,"frost":1,"advNecro":1,"bloodletting":1,"healingRevive":1,"sharedMisery":1,"athlete":1,"crashDown":1,"splashDash":1,"lifeBurst":1,"thickSkin":1,"warden":1,"martyr":1,"upSlash":1,"bloodWarrior":1},"pip":{"int":11,"spi":11,"con":11}};
test('un code b2 déjà partagé se décode toujours à l\'identique', () => {
  const d = decode(REF_B2);
  assert.ok(d);
  assert.deepEqual(d.gear, REF_BUILD.gear);
  assert.deepEqual(d.gem, REF_BUILD.gem);
  assert.deepEqual(d.pip, REF_BUILD.pip);
  const sk = {}; for (const id in d.sk) if (d.sk[id] > 0) sk[id] = d.sk[id];
  assert.deepEqual(sk, REF_BUILD.sk);
  assert.equal(encode(d), REF_B2, 'ré-encodage différent');
});
test('ancien format b1 toujours lisible', () => {
  const old = 'b1-1e360b05-0k0l0m0n0o2e2o1618-0b00bb-0000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000033000300013110000010011103030303030000000303111001';
  const d = decode(old);
  assert.ok(d); assert.ok(spentPoints(d) > 0);
});
test('code invalide → null', () => { assert.equal(decode('n-importe-quoi'), null); });
