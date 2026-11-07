// Codes figés (2.0.0 : ex-presets.test.js). Preset « Mage critique (baguette) » : refait en 1.17.0 (HISTORY n° 23) — chance de coup critique d'abord, puis dégâts critiques, puis dégâts moyens,
// perks d'arme comptés (chance et dégâts de coup critique), niveau 25 + 61 d'exploration = 109 points, Flamme 4. Première version : 1.14.0 (HISTORY n° 19).
const MCB = {name:'Mage critique (baguette)',cat:'mage',lvl:25,exp:61,flame:4,gear:{head:'fla_h',chest:'fla_c',hands:'fla_g',legs:'fla_l',feet:'fla_f',w1:'w_mythic',w2:'w_oracle',r1:'rg_eth',r2:'rg_anc'},gem:{w1:'g_storm',w2:'g_corrupt'},
  sk:{fatalPrecision:3,wizard:3,mageApprentice:3,wandMastery:3,thunder:3,darkArts:3,spellslinger:3,exalted:1,blastCast:1,chainHit:1,massDestr:1,terror:3,bloodletting:3},pip:{int:11,con:2}}; // preset de la 1.19.0, recopié tel quel (01-data.js)
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
test('Mage critique (baguette) : le code du preset s\'ouvre sur ce build ; celui de la 1.14.0 s\'ouvre toujours sur l\'ancien build', () => {
  const b = fromPreset(MCB), d = decode(MCB_CODE);
  assert.ok(d); assert.equal(encode(b), MCB_CODE);
  for (const k of ['gear', 'gem', 'sk', 'pip', 'pn', 'lvl', 'exp', 'flame', 'upg', 'tv']) assert.deepEqual(d[k], b[k], k);
  const d0 = decode(MCB_CODE_114); assert.ok(d0 && !d0._mig, 'lien de la 1.14.0 illisible ou migré');
  for (const k in MCB_114) assert.deepEqual(d0[k], MCB_114[k], '1.14.0 : ' + k);
});

// Codes des 16 builds prédéfinis de la 1.19.0, figés le 2026-11-07 (2.0.0 : presets supprimés, objectifs à la place). Ne jamais modifier ces valeurs :
// un lien partagé depuis un preset doit toujours s'ouvrir à l'identique (arbre, réglages, gemmes ; équipement relu, ignoré à l'écran).
// [nom, code, points dépensés, compétences, nœuds d'attribut]
const PRESET_CODES = [
  ["Mage de bataille", "b3-1e360b05-0k0l0m0n0o2e2o1618-4do28ejyark0-1mvvis7z3y7553tjrcoqj15p3amkqexf0g-1133313111111133131333131111-g0l0g-bh", 112, 28, 24],
  ["Rôdeur archer", "b3-1e360b05-0a0b0c0d0e271p1015-1r4x3zls-zevahqstnlqgnk7ofeothz4-113113313333111111111331333-g0n02-24", 104, 27, 17],
  ["Guerrier épée et bouclier", "b3-1e360b05-05060708091e1i1b11-2hwcf-fco77f8m3co0-1133113333131133111311131-g0h05-cz", 110, 25, 22],
  ["Barbare deux mains", "b3-1e360b05-0001020304201w111c-2hvjz-eglc2vn6peqo-11131113331331111131133-g0700-sz", 100, 23, 21],
  ["Assassin aux dagues", "b3-1e360b05-0f0g0h0i0j1p1q171c-4dueihog-47dxvuqtfvp65ta2c50nk8dikegv9c-11131111333111311111331331-g060c-ls", 92, 26, 15],
  ["Soigneur de groupe", "b3-1e360b05-0p0q0r0s0t2m2h150z-4do28ejyx5hc-6i27tdcrfbnrp9jlh98iu9i3dqzi3cim8-1311313313133131131313311-g0f0q-19", 104, 25, 24],
  ["Sadi Fourbe", "b3-1e360b05-05060708091v2j1611-3dsjaitfeio6-kte178vfx1n7m1695ecvpeea0hbj2qbk-1313311133313311111111331311313331313131-g0r0f-6y", 142, 40, 32],
  ["Sorcier de feu", "b3-1e360b05-0k0l0m0n0o2o2e160z-4do28ejyark0-ktdyvyd9s334h26bxysjeuqt3bh57rk0-11333131311331111131313133-g0g01-52", 104, 26, 24],
  ["Mage de foudre (baguette)", "b3-1e360b05-0k0l0m0n0o2f2k180z-4do28ejyark0-1mvybph8g0zg0sx9vwx2553ir4nmynuds0-113131311111131133331131111-g0b0l-4q", 102, 27, 24],
  ["Mage de glace (contrôle)", "b3-1e360b05-0k0v0m0n0o2p2s1a0z-4do28ejyark0-782ks0dckm10b2bcrrzs037535fkha9mo-1133331313131111311131313331-g0k0l-3g", 108, 28, 24],
  ["Nécromancien invocateur", "b3-1e360b05-0k0l0m0n0o2n2r190z-4do28ejyark0-102c9xmvpst5joiq5g3wg6jh49wuimxdfk-113133111333111111133133333-g0m0i-uy", 110, 27, 24],
  ["Arcaniste du bâton (critiques)", "b3-1e360b05-0u0l0m0n0o2k2j1518-4do28ejyark0-mg9isoxmpppxkerqwog7oh060q003c5c-113133131113311113111311133-g0b0e-rp", 107, 27, 24],
  ["Paladin soigneur", "b3-1e360b05-0p060r080t1e2m1511-3dy2uag9r4jq-leuqly5nc7q1ctsx8nvyg1cqme7rfpa8-13333331313111111313313131111-g040f-qk", 107, 29, 25],
  ["Gardien du Shroud (soutien)", "b3-1e360b05-0p0q0r0s0t2m2r190z-4do28ejyx5hc-6j3lhajwfpxgd1hwaz9dmd43j5df1hv7l-1133113131311313313113331311-g080p-ta", 107, 28, 24],
  ["Prêtre du feu (soin offensif)", "b3-1e360b05-0p0q0r0n0t2o2e1615-4do28ejyark0-6i35ggvvy1amn0agkak6u46x8xrcj0lkw-113333131131331313311111-g0g01-y6", 98, 24, 24],
  ["Mage critique (baguette)", "b3-0p1p0405-0k0l0m0n0o2h2m1715-3cbvkr8hc2dc-1iiv6ao6g0uoy0xl8l70m7yxv2gmd42i2o-1113131331133111311111113311-g0b0e-dy", 95, 28, 19]
];
test('codes des 16 anciens presets : décodés sans migration, mêmes points, ré-encodés à l\'identique', () => {
  for (const [n, code, sp, nsk, npn] of PRESET_CODES) { const d = decode(code);
    assert.ok(d, n); assert.equal(d._mig, undefined, n + ' : migré'); assert.deepEqual(d.obj, [], n + ' : objectifs');
    assert.deepEqual([spentPoints(d), Object.keys(d.sk).length, Object.keys(d.pn).length], [sp, nsk, npn], n);
    assert.equal(lostOf(d).length, 0, n + ' : non relié'); assert.equal(encode(d), code, n + ' : ré-encodage'); }
});
