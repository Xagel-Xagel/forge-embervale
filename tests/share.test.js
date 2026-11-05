// Codes de partage : stabilité et rétrocompatibilité. Si un de ces tests casse, des liens déjà partagés sont cassés.
test('aller-retour encode/decode (b3) pour chaque preset', () => {
  for (const p of PRESETS) {
    const b = fromPreset(p); const code = encode(b);
    assert.match(code, /^b3-[0-9a-z-]+$/, 'caractères interdits dans le hash');
    const d = decode(code);
    assert.ok(d, p.name);
    assert.deepEqual(d.pn, b.pn, p.name + ' : nœuds d\'attribut exacts');
    assert.equal(d._mig, undefined, p.name + ' : un code b3 ne se migre pas');
    assert.deepEqual(d.gear, b.gear, p.name + ' : équipement');
    assert.deepEqual(d.gem, b.gem, p.name + ' : gemmes');
    assert.deepEqual(d.pip, b.pip, p.name + ' : attributs');
    for (const s of SK) assert.equal(d.sk[s.id] || 0, b.sk[s.id] || 0, p.name + ' : ' + s.id);
    assert.deepEqual([d.lvl, d.exp, d.flame, d.upg], [b.lvl, b.exp, b.flame, b.upg]);
  }
});
// Code b2 figé le 2026-11-05 (Mage de bataille, version 8). Ne jamais modifier ces valeurs :
// si ce test casse, c'est que l'ordre des tables figées FZ (objets, compétences, gemmes, anciens nœuds d'attribut) a bougé.
// Depuis la 1.9.0 (tracé réel de l'arbre), un code b2 ne peut plus redonner exactement le même build : ses nœuds
// ne sont pas tous reliés sur le vrai tracé. Décision de l'utilisateur (2026-11-05) : chaque choix est conservé
// à l'identique et seuls des nœuds de liaison (compétences au rang 1, nœuds d'attribut) sont ajoutés.
const REF_B2 = 'b2-1e360b05-0k0l0m0n0o2e2o1618-4do28ek0pq2n-0000001000000000000000110000000110000110010000001100100000010000000000000000000000000000000000000000000000000000000000001033011300013110101110111103030303130000100303111011-g0l0g';
const REF_BUILD = {"gear":{"head":"fla_h","chest":"fla_c","hands":"fla_g","legs":"fla_l","feet":"fla_f","w1":"w_bloodflow","w2":"w_guidance","r1":"rg_mf","r2":"rg_ths"},"gem":{"w1":"g_curr","w2":"g_light"},"sk":{"mageApprentice":3,"wandMastery":3,"wizard":3,"thunder":3,"arsonist":3,"blastCast":1,"wandSpec":1,"unity":3,"wandEvasion":1,"aerialWand":1,"blink":1,"waterAura":3,"manaCurrents":3,"quickCharge":3,"chainHit":1,"massDestr":1,"sting":1,"arcaneProlif":1,"fireResistance":3,"lifeEssences":3,"exalted":1,"arcaneConc":1,"doubleJump":1,"shroudResistance":1,"healer":1,"necromancer":1,"heavyPlates":1,"shinyPlates":1,"absorb":1,"iceman":1,"frost":1,"advNecro":1,"bloodletting":1,"healingRevive":1,"sharedMisery":1,"athlete":1,"crashDown":1,"splashDash":1,"lifeBurst":1,"thickSkin":1,"warden":1,"martyr":1,"upSlash":1,"bloodWarrior":1},"pip":{"int":11,"spi":11,"con":11}};
test('un code b2 déjà partagé s\'ouvre toujours : choix conservés, seuls des nœuds de liaison ajoutés', () => {
  const d = decode(REF_B2);
  assert.ok(d);
  assert.deepEqual(d.gear, REF_BUILD.gear);
  assert.deepEqual(d.gem, REF_BUILD.gem);
  assert.deepEqual([d.lvl, d.exp, d.flame, d.upg], [50, 114, 11, 5]);
  for (const [id, r] of Object.entries(REF_BUILD.sk)) assert.equal(d.sk[id], r, 'rang de ' + id);
  for (const id in d.sk) if (!(id in REF_BUILD.sk)) assert.equal(d.sk[id], 1, 'liaison ' + id + ' au rang 1');
  for (const [a, n] of Object.entries(REF_BUILD.pip)) assert.ok(d.pip[a] >= n, 'attribut ' + a);
  assert.equal(TOPO.N.filter(n => owned(d, n) && !reach(d).has(n)).length, 0, 'build non relié à un départ');
  assert.equal(d._mig.from, 'b2'); assert.ok(d._mig.pts > 0);
  assert.deepEqual(decode(REF_B2).sk, d.sk, 'migration non déterministe');
  const c = encode(d); assert.match(c, /^b3-/, 'le ré-encodage se fait désormais en b3');
  const e = decode(c);
  assert.deepEqual(e.sk, d.sk); assert.deepEqual(e.pn, d.pn); assert.deepEqual(e.gear, d.gear); assert.deepEqual(e.gem, d.gem);
  assert.equal(encode(e), c, 'code b3 instable');
});
test('ancien format b1 toujours lisible', () => {
  const old = 'b1-1e360b05-0k0l0m0n0o2e2o1618-0b00bb-0000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000033000300013110000010011103030303030000000303111001';
  const d = decode(old);
  assert.ok(d); assert.ok(spentPoints(d) > 0);
});
test('code invalide → null', () => { assert.equal(decode('n-importe-quoi'), null); });

// Code b3 figé le 2026-11-05 (preset Mage de bataille, version 1.9.0, tracé réel). Ne jamais modifier ces valeurs :
// si ce test casse, un lien b3 déjà partagé est cassé (tables figées FZ, tracé ou décodage).
const REF_B3 = 'b3-1e360b05-0k0l0m0n0o2e2o1618-4do28ek3ae4m-1mvvis7z3y7553tjrcoqjgz2bbcp0pt3k0-1111111111133313111111133131333131111-g0l0g';
const REF_B3_BUILD = {"gear":{"head":"fla_h","chest":"fla_c","hands":"fla_g","legs":"fla_l","feet":"fla_f","w1":"w_bloodflow","w2":"w_guidance","r1":"rg_mf","r2":"rg_ths"},"gem":{"w1":"g_curr","w2":"g_light"},"sk":{"mageApprentice":3,"wandMastery":3,"wizard":3,"thunder":3,"arsonist":3,"blastCast":1,"wandSpec":1,"unity":3,"wandEvasion":1,"aerialWand":1,"blink":1,"waterAura":3,"manaCurrents":3,"quickCharge":3,"chainHit":1,"massDestr":1,"sting":1,"arcaneProlif":1,"fireResistance":3,"lifeEssences":3,"exalted":1,"arcaneConc":1,"doubleJump":1,"eternalSpark":1,"healer":1,"healingRevive":1,"radiantAura":1,"spellslinger":1,"barbariansPath":1,"warriorsPath":1,"heavyPlates":1,"shinyPlates":1,"absorb":1,"slasher":1,"runner":1,"finesse":1,"bash":1},"pip":{"int":11,"spi":11,"con":11,"str":3,"end":1},"pn":["pip:101011r","pip:110miev","pip:13cdgsq","pip:14r1h78","pip:14rs954","pip:16sd25b","pip:1aeg1z2","pip:1f1pjpd","pip:1lm4k0r","pip:1ob651f","pip:1qjlln9","pip:1rkw3ke","pip:1rv6bfd","pip:1skigoj","pip:1th8yhf","pip:1wwtpca","pip:1xv3exe","pip:27th6o","pip:7tyb4s","pip:8qaa6k","pip:9vl5y4","pip:9y2o4y","pip:a3gm4i","pip:an50g0","pip:axd60g","pip:b7lnsa","pip:beub9v","pip:fj7jpn","pip:hmo27n","pip:ipgty9","pip:itley","pip:j06qca","pip:oal925","pip:q9awwi","pip:s8qir2","pip:u3ewct","pip:utqucn"]};
test('un code b3 déjà partagé se décode toujours à l\'identique', () => {
  const d = decode(REF_B3);
  assert.ok(d);
  assert.deepEqual([d.lvl, d.exp, d.flame, d.upg], [50, 114, 11, 5]);
  assert.deepEqual(d.gear, REF_B3_BUILD.gear);
  assert.deepEqual(d.gem, REF_B3_BUILD.gem);
  const sk = {}; for (const id in d.sk) if (d.sk[id] > 0) sk[id] = d.sk[id];
  assert.deepEqual(sk, REF_B3_BUILD.sk);
  assert.deepEqual(Object.keys(d.pn).sort(), REF_B3_BUILD.pn);
  assert.deepEqual(d.pip, REF_B3_BUILD.pip);
  assert.equal(d._mig, undefined);
  assert.equal(encode(d), REF_B3, 'ré-encodage différent');
});

const fnv = s => { let h = 0x811c9dc5; for (const c of s) { h ^= c.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); };
test('tables figées du partage : rien de réordonné, tout identifiant vivant présent', () => {
  // Empreintes de l'ordre figé le 2026-11-05. Ne jamais modifier : un écart = des liens cassés. Ajouter EN FIN ne change pas ces préfixes.
  assert.equal(fnv(FZ.items.slice(0, 102).join(' ')), '0349b950', 'objets');
  assert.equal(fnv(FZ.gems.slice(0, 29).join(' ')), 'a5f8c568', 'gemmes');
  assert.equal(fnv(FZ.at.slice(0, 59).join(' ')), '995a011f', 'nœuds d\'attribut (b3)');
  assert.equal(fnv(FZ.nd.slice(0, 172).join(' ')), '07f500a2', 'compétences (b3)');
  // Formats fermés (b1, b2) : ces tables ne changent plus du tout.
  assert.equal(fnv(FZ.sk.join(' ')), 'e77d2ca9', 'compétences (b1, b2)');
  assert.equal(fnv(FZ.b2), '2c0e4952', 'anciens nœuds d\'attribut (b2)');
  assert.deepEqual(FZ.b1, [['str', 11], ['con', 11], ['end', 8], ['dex', 7], ['int', 11], ['spi', 11]]);
  for (const id of Object.keys(ITEMS)) assert.ok(FZ.items.includes(id), 'objet à ajouter en fin de FZ.items : ' + id);
  for (const g of GEMS) assert.ok(FZ.gems.includes(g[0]), 'gemme à ajouter en fin de FZ.gems : ' + g[0]);
  for (const n of TOPO.N) {
    if (n.kind === 'pip') assert.ok(FZ.at.includes(n.gid), 'nœud d\'attribut à ajouter en fin de FZ.at : ' + n.gid);
    if (n.kind === 'skill') assert.ok(FZ.nd.includes(n.gid), 'compétence à ajouter en fin de FZ.nd : ' + n.id + ' (' + n.gid + ')');
  }
  for (const k of ['items', 'gems', 'sk', 'at', 'nd']) assert.equal(new Set(FZ[k]).size, FZ[k].length, 'doublon dans FZ.' + k);
});

const from36 = s => [...s].reduce((v, c) => v * 36n + BigInt(parseInt(c, 36)), 0n);
test('lien tronqué, corrompu ou d\'une version plus récente : refusé ou lu, jamais d\'exception', () => {
  // toutes les coupures d'un code b3 sont refusées, sauf juste avant les gemmes (code valide, sans gemmes)
  const cut = REF_B3.lastIndexOf('-g');
  for (let i = 1; i < REF_B3.length; i++) {
    const d = decode(REF_B3.slice(0, i));
    if (i === cut) assert.ok(d && !d.gem.w1, 'coupure juste avant les gemmes'); else assert.equal(d, null, 'coupure au caractère ' + i);
  }
  const p = REF_B3.split('-');
  assert.equal(decode([...p.slice(0, 5), p[5] + '1', p[6]].join('-')), null, 'un rang de trop');
  assert.equal(decode([...p.slice(0, 5), '0' + p[5].slice(1), p[6]].join('-')), null, 'rang nul');
  assert.equal(decode(REF_B3.toUpperCase()).sk.wizard, 3, 'majuscules acceptées');
  // bits au-delà des tables (code d'une version plus récente) : ignorés, le reste est intact
  const q = [...p]; q[3] = (from36(p[3]) | 1n << BigInt(FZ.at.length + 3)).toString(36); q[4] = (from36(p[4]) | 1n << BigInt(FZ.nd.length + 5)).toString(36); q[5] = p[5] + '2';
  const d = decode(q.join('-')), r = decode(REF_B3);
  assert.ok(d, 'code plus récent lisible'); assert.deepEqual(d.sk, r.sk); assert.deepEqual(d.pn, r.pn);
  // codes abîmés au hasard (déterministe) : décodage sans exception, et tout build obtenu est relié
  let seed = 7; const rnd = n => (seed = seed * 16807 % 2147483647) % n; const A = '0123456789abcdefghijklmnopqrstuvwxyz';
  const old = 'b1-1e360b05-0k0l0m0n0o2e2o1618-0b00bb-0000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000033000300013110000010011103030303030000000303111001';
  for (let t = 0; t < 240; t++) {
    const base = [REF_B2, REF_B3, old][t % 3].split('');
    for (let k = 1 + rnd(3); k > 0; k--) { const i = 3 + rnd(base.length - 3); if (base[i] !== '-') base[i] = A[rnd(36)]; }
    const s = base.join(''); let b;
    assert.doesNotThrow(() => { b = decodeCode(s); }, s);
    if (b) assert.equal(TOPO.N.filter(n => owned(b, n) && !reach(b).has(n)).length, 0, 'build non relié : ' + s);
  }
});

test('un build enregistré avant le tracé réel (1.8) se recharge : choix conservés, relié, jamais de _mig enregistré', () => {
  const old = {name: 'Ancien', gear: {...REF_BUILD.gear}, gem: {...REF_BUILD.gem}, sk: {...REF_BUILD.sk}, pip: {...REF_BUILD.pip}, pn: {}, lvl: 50, exp: 114, flame: 11, upg: 5};
  for (const [a, n] of Object.entries(REF_BUILD.pip)) for (let i = 0; i < n; i++) old.pn[`pip:${a}:${i}`] = 1;
  const b = loadSaved(old);
  for (const [id, r] of Object.entries(REF_BUILD.sk)) assert.equal(b.sk[id], r, id);
  for (const [a, n] of Object.entries(REF_BUILD.pip)) assert.ok(b.pip[a] >= n, a);
  assert.equal(TOPO.N.filter(n => owned(b, n) && !reach(b).has(n)).length, 0, 'build non relié');
  assert.equal(b._mig.from, 'saved');
  assert.ok(!('_mig' in JSON.parse(JSON.stringify(b))), '_mig ne doit jamais être enregistré');
  // très ancien build sans nœuds d'attribut : les comptes servent de base
  const older = {...old, pn: undefined}; delete older.pn;
  assert.ok(loadSaved(older).pip.int >= 11, 'comptes d\'attributs perdus');
  // build enregistré au nouveau format : rechargé à l'identique, sans migration
  const fresh = fromPreset(PRESETS[1]); const again = loadSaved(JSON.parse(JSON.stringify(fresh)));
  assert.deepEqual(again.pn, fresh.pn); assert.deepEqual(again.sk, fresh.sk); assert.equal(again._mig, undefined);
});

test('ouvrir un lien b2 : build migré, puis adresse remplacée par son code b3', () => {
  let url = null; const rs = history.replaceState; history.replaceState = (s, t, u) => { url = u; };
  location.hash = '#' + REF_B2;
  try { assert.equal(fromHash(), true); } finally { history.replaceState = rs; location.hash = ''; }
  assert.match(url, /^#b3-/);
  assert.deepEqual(decode(url).sk, builds[0].sk);
  assert.equal(builds[0]._mig.from, 'b2');
});
