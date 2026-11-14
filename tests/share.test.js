// Codes de partage : stabilité et rétrocompatibilité. Si un de ces tests casse, des liens déjà partagés sont cassés.
test('aller-retour encode/decode (b3) pour chaque objectif, seul et avec chaque secondaire', () => {
  for (const g of GOALS) for (const s of [null, ...GOALS.map(x => x.id)]) { if (s === g.id) continue;
    const b = goalBuild(g.id, s), p = {name: g.id + ' + ' + s}; const code = encode(b);
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
    assert.deepEqual(d.obj, b.obj, p.name + ' : objectifs');
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

// Code b3 figé le 2026-11-05 (preset Mage de bataille, version 1.9.0, tracé réel, avec somme de contrôle). Ne jamais modifier ces valeurs :
// si ce test casse, un lien b3 déjà partagé est cassé (tables figées FZ, tracé ou décodage).
const REF_B3 = 'b3-1e360b05-0k0l0m0n0o2e2o1618-4do28ek3ae4m-1mvvis7z3y7553tjrcoqjgz2bbcp0pt3k0-1111111111133313111111133131333131111-g0l0g-n7';
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
  for (const g of GEMS) assert.ok(FZ.gems.includes(g[0]), 'gemme à ajouter en fin de FZ.gems : ' + g[0]);
  for (const n of TOPO.N) {
    if (n.kind === 'pip') assert.ok(FZ.at.includes(n.gid), 'nœud d\'attribut à ajouter en fin de FZ.at : ' + n.gid);
    if (n.kind === 'skill') assert.ok(FZ.nd.includes(n.gid), 'compétence à ajouter en fin de FZ.nd : ' + n.id + ' (' + n.gid + ')');
  }
  for (const k of ['items', 'gems', 'sk', 'at', 'nd']) assert.equal(new Set(FZ[k]).size, FZ[k].length, 'doublon dans FZ.' + k);
});

const from36 = s => [...s].reduce((v, c) => v * 36n + BigInt(parseInt(c, 36)), 0n);
test('lien tronqué, corrompu ou d\'une version plus récente : refusé ou lu, jamais d\'exception', () => {
  // toutes les coupures d'un code b3 sont refusées (somme de contrôle)
  for (let i = 1; i < REF_B3.length; i++) assert.equal(decode(REF_B3.slice(0, i)), null, 'coupure au caractère ' + i);
  // un seul caractère abîmé (hors tirets) : refusé
  let bad = 0; for (let i = 3; i < REF_B3.length; i++) if (REF_B3[i] !== '-') for (const c of '0az') { const s = REF_B3.slice(0, i) + c + REF_B3.slice(i + 1); if (s !== REF_B3 && decode(s)) bad++; }
  assert.equal(bad, 0, 'caractère abîmé accepté');
  const sum = s => s + '-' + b3sum(s), p = REF_B3.split('-').slice(0, -1);   // sans la somme de contrôle
  assert.equal(decode(sum([...p.slice(0, 5), p[5] + '1', p[6]].join('-'))), null, 'un rang de trop');
  assert.equal(decode(sum([...p.slice(0, 5), '0' + p[5].slice(1), p[6]].join('-'))), null, 'rang nul');
  assert.equal(decode(REF_B3.toUpperCase()).sk.wizard, 3, 'majuscules acceptées');
  // bits au-delà des tables (code d'une version plus récente) : ignorés, le reste est intact, et c'est signalé
  const q = [...p]; q[3] = (from36(p[3]) | 1n << BigInt(FZ.at.length + 3)).toString(36); q[4] = (from36(p[4]) | 1n << BigInt(FZ.nd.length + 5)).toString(36); q[5] = p[5] + '2';
  const d = decode(sum(q.join('-'))), r = decode(REF_B3);
  assert.ok(d, 'code plus récent lisible'); assert.deepEqual(d.sk, r.sk); assert.deepEqual(d.pn, r.pn); assert.equal(d._mig.gone, 2);
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
  // build 1.8 sans aucun nœud d'attribut : doit aussi être migré (pas de marqueur tv)
  const core = loadSaved({name: 'Outils', gear: {}, gem: {}, sk: {miner: 1, pickSpec: 1, prospector: 1, qualityGear: 1}, pip: {}, pn: {}, lvl: 50, exp: 114, flame: 11, upg: 5});
  assert.equal(core._mig.from, 'saved'); assert.equal(core.tv, 1);
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
  // build enregistré au nouveau format : rechargé à l'identique, sans migration ; un nœud disparu (patch) ne fait perdre que lui
  const fresh = goalBuild('archer'); const again = loadSaved(JSON.parse(JSON.stringify(fresh)));
  assert.deepEqual(again.pn, fresh.pn); assert.deepEqual(again.sk, fresh.sk); assert.equal(again._mig, undefined);
  const patched = JSON.parse(JSON.stringify(fresh)); const keep = Object.keys(patched.pn); patched.pn['pip:retire-par-un-patch'] = 1; patched.pip.dex++;
  const p2 = loadSaved(patched); for (const id of keep) assert.ok(p2.pn[id], 'nœud valide perdu : ' + id);
});

test('ouvrir un lien b2 : build migré, puis adresse remplacée par son code b3', () => {
  let url = null; const rs = history.replaceState, saved = [builds[0], cur, compare]; history.replaceState = (s, t, u) => { url = u; };
  location.hash = '#' + REF_B2;
  let got;
  try { assert.equal(fromHash(), true); got = builds[0]; location.hash = '#' + REF_B3.slice(0, -4); assert.equal(fromHash(), false, 'lien abîmé refusé'); }
  finally { history.replaceState = rs; location.hash = ''; [builds[0], cur, compare] = saved; }
  assert.match(url, /^#b3-/);
  assert.deepEqual(decode(url).sk, got.sk);
  assert.equal(got._mig.from, 'b2');
});
test('un code b3 dont un nœud a disparu du tracé (patch) : migré et signalé, le reste conservé', () => {
  const n = TOPO.byId.wizard, g = n.gid; delete TOPO.byGid[g];
  let d; try { d = decode(REF_B3); } finally { TOPO.byGid[g] = n; }
  assert.equal(d._mig.from, 'b3'); assert.equal(d._mig.gone, 1); assert.notEqual(d.sk.wizard, 3, 'rang du nœud disparu non lu'); assert.equal(d.sk.thunder, 3);
});

// ---- 2.0.0 : objectifs dans le lien (segment -o), équipement inerte ----
test('tables figées des objectifs et des emplacements : rien de réordonné, tout objectif vivant présent', () => {
  // Empreintes figées le 2026-11-07. Ne jamais modifier : ajouter EN FIN seulement.
  assert.equal(fnv(FZ.goals.slice(0, 12).join(' ')), fnv('tank sword barb archer assassin mageCrit fire ice storm necro healer paladin'), 'objectifs');
  assert.deepEqual(FZ.slots, ['head', 'chest', 'hands', 'legs', 'feet', 'w1', 'w2', 'r1', 'r2']);
  for (const g of GOALS) assert.ok(FZ.goals.includes(g.id), 'objectif à ajouter en fin de FZ.goals : ' + g.id);
  assert.equal(new Set(FZ.goals).size, FZ.goals.length, 'doublon dans FZ.goals');
});
test('segment -o : principal seul, principal + secondaire, arbre libre sans segment ; somme de contrôle', () => {
  const a = goalBuild('tank'), b = goalBuild('tank', 'healer'), c = blankBuild();
  assert.match(encode(a), /-o00zz-[0-9a-z]{2}$/); assert.match(encode(b), /-o00[0-9a-z]{2}-[0-9a-z]{2}$/); assert.doesNotMatch(encode(c), /-o/);
  assert.deepEqual(decode(encode(b)).obj, ['tank', 'healer']); assert.deepEqual(decode(encode(a)).obj, ['tank', null]);
  const code = encode(b); for (let i = 1; i < code.length; i++) assert.equal(decode(code.slice(0, i)), null, 'coupure au caractère ' + i);
  // secondaire sans principal dans le build : pas de segment (rien d'imposé)
  const d = blankBuild(); d.obj = [null, 'healer']; assert.doesNotMatch(encode(d), /-o/);
});
test('objectif inconnu (lien d\'une version plus récente) ou changé depuis : retiré, arbre gardé tel quel, signalé', () => {
  const b = goalBuild('mageCrit', 'storm'), p = encode(b).split('-').slice(0, -1), sum = s => s + '-' + b3sum(s);
  const q = p.map(x => x[0] === 'o' && x.length === 5 ? 'o' + (FZ.goals.length + 3).toString(36).padStart(2, '0') + x.slice(3) : x);
  const d = decode(sum(q.join('-')));
  assert.ok(d); assert.deepEqual(d.obj, []); assert.equal(d._objLost, true); assert.deepEqual(d.sk, b.sk); assert.deepEqual(d.pn, b.pn);
  // combo imposé absent de l'arbre du lien (objectif modifié par une version suivante) : objectifs retirés, arbre inchangé
  const t = JSON.parse(JSON.stringify(b)); delete t.sk.fatalPrecision; prune(t); const e = decode(encode(t));
  assert.deepEqual(e.obj, []); assert.equal(e._objLost, true); assert.deepEqual(e.sk, t.sk);
  assert.equal(decode(encode(b))._objLost, undefined, 'lien intact : rien de signalé');
});
test('équipement d\'un ancien lien : relu et réécrit à l\'identique, jamais compté', () => {
  const d = decode(REF_B3); assert.deepEqual(d.gear, REF_B3_BUILD.gear); assert.equal(encode(d), REF_B3);
  const o = compute(d), e = JSON.parse(JSON.stringify(d)); e.gear = {}; assert.deepEqual(compute(e).attr, o.attr); assert.equal(compute(e).hp, o.hp);
});
test('segment -o : principal ou secondaire inconnu signalé ; « zz » en principal refusé ; secondaire = principal ignoré sans alerte', () => {
  const p = encode(goalBuild('archer', 'tank')).split('-').slice(0, -1), sum = s => s + '-' + b3sum(s), with_ = o => decode(sum(p.map(x => x[0] === 'o' && x.length === 5 ? 'o' + o : x).join('-')));
  const far = (FZ.goals.length + 40).toString(36).padStart(2, '0');
  const a = with_(far + 'zz'); assert.deepEqual(a.obj, []); assert.equal(a._objLost, true, 'principal inconnu');
  const b = with_('03' + far); assert.deepEqual(b.obj, ['archer', null]); assert.equal(b._objLost, true, 'secondaire inconnu');
  assert.equal(with_('zzzz'), null); assert.equal(with_('zz03'), null);
  const c = with_('0303'); assert.deepEqual(c.obj, ['archer', null]); assert.equal(c._objLost, undefined);
});

// ---- 2.1.0 : soutien dans le segment -o (2 caractères de plus, seulement s'il y en a un) ----
test('soutien : aller-retour principal + soutien et principal + secondaire + soutien ; sans soutien, code inchangé', () => {
  for (const t of SUPS) for (const s of [null, 'healer']) { const b = goalBuild('tank', s, 'x', t.id), code = encode(b), d = decode(code);
    assert.match(code, new RegExp(`-o00${s ? '[0-9a-z]{2}' : 'zz'}${FZ.goals.indexOf(t.id).toString(36).padStart(2, '0')}-[0-9a-z]{2}$`));
    assert.deepEqual(d.obj, ['tank', s, t.id]); assert.equal(d._objLost, undefined); assert.deepEqual(d.sk, b.sk); assert.deepEqual(d.pn, b.pn); assert.equal(encode(d), code); }
  const a = goalBuild('tank', 'healer'), code = encode(a); assert.match(code, /-o00[0-9a-z]{2}-[0-9a-z]{2}$/, 'sans soutien : 4 caractères');
  assert.deepEqual(decode(code).obj, ['tank', 'healer']); assert.equal(encode(decode(code)), code, 'lien 2.0.0 rouvert à l\'identique');
});
test('soutien : inconnu ou objectif ordinaire en soutien → retiré et signalé, le reste gardé ; « zz » en soutien refusé', () => {
  const b = goalBuild('archer', 'tank'), p = encode(b).split('-').slice(0, -1), sum = s => s + '-' + b3sum(s), with_ = o => decode(sum(p.map(x => x[0] === 'o' && x.length === 5 ? 'o' + o : x).join('-')));
  const ob = p.find(x => x[0] === 'o').slice(1), far = (FZ.goals.length + 40).toString(36).padStart(2, '0');
  const u = with_(ob + far); assert.deepEqual(u.obj, ['archer', 'tank']); assert.equal(u._objLost, true, 'soutien inconnu');
  const v = with_(ob + '00'); assert.deepEqual(v.obj, ['archer', 'tank']); assert.equal(v._objLost, true, 'Tank en soutien');
  assert.equal(with_(ob + 'zz'), null);
});

// ---- 2.3.0 : vos ajouts dans le lien (segment -a), seulement s'il y en a ; liens d'avant la 2.3.0 recalculés (QCM du 2026-11-07) ----
const withA = () => { const b = goalBuild('tank', 'healer', 'x', 'survie'); [b.lvl, b.exp] = ptsAt(140); rebuild(b); addRank(b, 'wetDog');
  addPipNode(b, TOPO.pips.find(x => !b.pn[x.id] && canBuy(b, x))); const imp = imposed(b), k = Object.keys(imp.sk).find(id => SKI[id].max > b.sk[id]);
  addRank(b, k); return b; }; // k : compétence imposée sous son rang maximum (votre rang au-dessus : up)
test('segment -a : aller-retour exact (compétence, nœud d\'attribut, rang au-dessus de l\'imposé) ; sans ajout, code de la 2.2.0', () => quiet(() => {
  const b = withA(), code = encode(b); assert.ok(Object.keys(b.ad.sk).length >= 1 && Object.keys(b.ad.pn).length === 1 && Object.keys(b.ad.up).length === 1, 'ajouts du test');
  assert.match(code, /-a[0-9a-z]+-[0-9]*[a-c][0-9a-c]*-[0-9a-z]{2}$/, 'rang au-dessus de l\'imposé : lettre');
  assert.match(code, /-o[0-9a-z]{6}-a[0-9a-z]+-[0-9a-z]+-[0-9a-z]{2}$/); assert.match(code, /^b3-[0-9a-z-]+$/);
  const d = decode(code); assert.ok(d); assert.deepEqual(d.ad, b.ad); assert.deepEqual(d.sk, b.sk); assert.deepEqual(d.pn, b.pn); assert.deepEqual(d.obj, b.obj);
  assert.equal(d._objLost, undefined); assert.equal(d._recalc, undefined); assert.equal(d._mig, undefined); assert.equal(encode(d), code);
  for (const g of GOALS) assert.doesNotMatch(encode(goalBuild(g.id, 'healer')), /-a/, g.id);
  const f = blankBuild(); f.sk = {...b.sk}; f.pn = {...b.pn}; f.ad = {...b.ad}; syncPips(f); assert.doesNotMatch(encode(f), /-a/, 'arbre libre : pas de segment');
}));
test('lien d\'avant la 2.3.0 avec ajouts (sans -a) : ajouts déduits de l\'arbre, combo recalculé et signalé ; sans effet, rouvert à l\'identique', () => quiet(() => {
  const [lv, ex] = ptsAt(80), z = combo('mageCrit', null, lv, ex, 11), old = blankBuild('ancien');
  Object.assign(old, {lvl: lv, exp: ex, obj: ['mageCrit', null], sk: {...z.sk}, pn: {...z.pn, 'pip:1wwtpca': 1}}); syncPips(old);
  const code = encode(old); assert.doesNotMatch(code, /-a/, 'code tel que l\'écrivait la 2.2.0');
  const d = decode(code); assert.deepEqual(d.obj, ['mageCrit', null]); assert.deepEqual(d.ad, {sk: {}, pn: {'pip:1wwtpca': 1}, up: {}});
  assert.deepEqual(d._recalc.links, [30, 27]); assert.deepEqual(d._recalc.wpts, [49, 53]); assert.equal(imposed(d).links, 27); assert.ok(d.pn['pip:1wwtpca']);
  assert.equal(lostOf(d).length, 0); assert.match(encode(d), /-a/);
  // ajout sans effet sur le combo : arbre identique, rien de signalé
  const R = reach(old), t = blankBuild(); Object.assign(t, {lvl: lv, exp: ex, obj: ['mageCrit', null], sk: {...z.sk}, pn: {...z.pn}}); syncPips(t);
  const n = TOPO.N.find(x => x.kind === 'skill' && !t.sk[x.id] && canBuy(t, x) && combo('mageCrit', null, lv, ex, 11, null, {sk: {[x.id]: 1}, pn: {}}).links === z.links);
  t.sk[n.id] = 1; const e = decode(encode(t)); assert.equal(e._recalc, undefined); assert.deepEqual(e.sk, t.sk); assert.deepEqual(e.ad, {sk: {[n.id]: 1}, pn: {}, up: {}});
}));
test('segment -a : refusé sans -o ou abîmé (rangs, masque) ; arbre qui ne correspond plus → arbre libre, arbre gardé, signalé', () => quiet(() => {
  const b = withA(), p = encode(b).split('-').slice(0, -1), sum = s => s + '-' + b3sum(s), io = p.findIndex(x => x[0] === 'o' && (x.length === 5 || x.length === 7));
  assert.equal(p[io + 1][0], 'a'); const at = (i, v) => decode(sum(p.map((x, j) => j === i ? v : x).filter(x => x !== null).join('-')));
  assert.equal(at(io, null), null, '-a sans -o'); assert.equal(at(io + 2, p[io + 2] + '1'), null, 'un rang de trop');
  assert.equal(at(io + 2, p[io + 2].slice(1) || '0'), null, 'un rang de moins'); assert.equal(at(io + 1, 'a' + (1n << 400n).toString(36)), null, 'masque au-delà de l\'arbre');
  const t = JSON.parse(JSON.stringify(b)), imp = imposed(b), k = Object.keys(imp.sk).find(id => !b.ad.sk[id] && (imp.want.sk[id] || 0) > 0); delete t.sk[k]; prune(t);
  const e = decode(encode(t)); assert.deepEqual(e.obj, []); assert.equal(e._objLost, true); assert.deepEqual(e.sk, t.sk); assert.deepEqual(e.ad, {sk: {}, pn: {}, up: {}});
}));
test('build enregistré avec ajouts : rechargé à l\'identique ; build d\'avant la 2.3.0 (sans « ad ») : ajouts déduits, recalculé', () => quiet(() => {
  const b = withA(), r = loadSaved(JSON.parse(JSON.stringify(b)));
  assert.deepEqual([r.obj, r.sk, r.pn, r.ad], [b.obj, b.sk, b.pn, b.ad]); assert.equal(r._recalc, undefined); assert.equal(r._objLost, undefined);
  const [lv, ex] = ptsAt(80), z = combo('mageCrit', null, lv, ex, 11), old = {name: 'ancien', gear: {}, gem: {}, sk: {...z.sk}, pn: {...z.pn, 'pip:1wwtpca': 1}, pip: {}, lvl: lv, exp: ex, flame: 11, upg: 5, tv: 1, obj: ['mageCrit', null]};
  syncPips(old); const o = loadSaved(old); assert.deepEqual(o.ad, {sk: {}, pn: {'pip:1wwtpca': 1}, up: {}}); assert.deepEqual(o._recalc.links, [30, 27]); assert.equal(imposed(o).links, 27);
}));
test('segment -a : forme canonique seulement (masque sans zéro en tête, rang dans l\'arbre) ; lien d\'avant la 2.3.0 avec un rang monté sur une liaison : rouvert à l\'identique', () => quiet(() => {
  const b = withA(), p = encode(b).split('-').slice(0, -1), sum = s => s + '-' + b3sum(s), io = p.findIndex(x => x[0] === 'o' && (x.length === 5 || x.length === 7));
  const at = (i, v) => decode(sum(p.map((x, j) => j === i ? v : x).join('-')));
  assert.equal(at(io + 1, 'a0' + p[io + 1].slice(1)), null, 'zéro en tête'); assert.equal(at(io + 1, 'a0'), null, 'masque nul');
  assert.equal(at(io + 2, p[io + 2].replace(/[1-3]/, 'z')), null, 'rang au-delà de l\'arbre');
  assert.doesNotThrow(() => loadSaved(null));
  // 2.2.0 : rang monté sur une liaison du combo (déduit en « up », pas en graine) → aucun point gratuit, arbre identique, rien de signalé
  const [lv, ex] = ptsAt(60); let n = 0;
  for (const g of GOALS) { const z = combo(g.id, null, lv, ex, 11), k = Object.keys(z.sk).find(id => !(z.want.sk[id] > 0) && SKI[id].max > z.sk[id]); if (!k) continue; n++;
    const old = blankBuild('ancien'); Object.assign(old, {lvl: lv, exp: ex, obj: [g.id, null], sk: {...z.sk, [k]: SKI[k].max}, pn: {...z.pn}}); syncPips(old);
    const d = decode(encode(old)); assert.deepEqual(d.obj, [g.id, null], g.id); assert.equal(d._recalc, undefined, g.id + ' : recalculé');
    assert.deepEqual(d.ad, {sk: {}, pn: {}, up: {[k]: SKI[k].max}}, g.id); assert.deepEqual(d.sk, old.sk, g.id); }
  assert.ok(n >= 3, 'trop peu de cas : ' + n);
}));

// 2.4.0 : objectifs optimisés (hybrides, Exploration, Récolte), ids en fin de FZ.goals ; aucun code existant ne change
test('2.4.0 · lien avec un objectif optimisé (principal, secondaire, avec soutien) : segment -o en fin de table, aller-retour exact', () => {
  const at = x => x ? FZ.goals.indexOf(x).toString(36).padStart(2, '0') : 'zz';
  for (const [p, s, t] of [['harvest', 'archer', null], ['battlemage', null, 'mana'], ['tank', 'explore', null], ['swordBow', 'elemArcher', 'survie'], ['lifesteal', 'healer', 'survie'], ['sword', 'lifesteal', null], ['lifestealFull', null, null], ['lifestealFull', 'harvest', 'survie']]) {
    const b = goalBuild(p, s, 'x', t), code = encode(b), d = decode(code), lbl = [p, s, t].join(' + ');
    assert.ok(code.includes('-o' + at(p) + at(s) + (t ? at(t) : '') + '-'), lbl + ' : ' + code);
    assert.ok(d && !d._objLost && !d._mig && !d._recalc, lbl); assert.deepEqual(d.obj, b.obj, lbl); assert.deepEqual([d.sk, d.pn, d.gem], [b.sk, b.pn, b.gem], lbl); }
  assert.deepEqual(FZ.goals.slice(12, 21), ['survie', 'vigueur', 'resist', 'mana', 'battlemage', 'elemArcher', 'swordBow', 'explore', 'harvest'], 'places figées des soutiens (2.1.0) et des objectifs optimisés (2.4.0)');
  assert.equal(FZ.goals.indexOf('lifesteal'), 21, 'Vol de vie (2.6.0) : place figée');
  assert.equal(FZ.goals.indexOf('lifestealFull'), 22, 'Vol de vie complet (2.7.0) : place figée');
});
// relecture QA 2.4.0 : un lien d'une version plus récente (objectif inconnu) sans segment -a passait par le recalcul « d'avant la 2.3.0 »
test('2.4.0 · lien d\'une version plus récente (secondaire inconnu, sans segment -a) : arbre gardé tel quel, jamais recalculé', () => {
  let n = 0, kept = 0; const far = (FZ.goals.length + 40).toString(36).padStart(2, '0');
  for (const [p, s] of [['barb', 'battlemage'], ['archer', 'tank'], ['mageCrit', 'storm'], ['tank', 'healer']]) for (const B of [40, 120, 212]) for (const fl of [1, 11]) {
    const b = goalBuild(p, s); [b.lvl, b.exp] = ptsAt(B); b.flame = fl; rebuild(b);
    const q = encode(b).split('-').slice(0, -1).map(x => x[0] === 'o' && x.length === 5 ? 'o' + x.slice(1, 3) + far : x).join('-'), d = decode(q + '-' + b3sum(q)), lbl = `${p} + ? · ${B} pts · Flamme ${fl}`; n++;
    assert.ok(d, lbl); assert.equal(d._objLost, true, lbl); assert.equal(d._recalc, undefined, lbl + ' : recalculé comme un lien d\'avant la 2.3.0');
    assert.deepEqual([d.sk, d.pn], [b.sk, b.pn], lbl + ' : arbre changé'); if (d.obj.length) { kept++; assert.deepEqual(d.obj, [p, null], lbl); } }
  assert.ok(n === 24 && kept > 0, `cas : ${n}, principal gardé : ${kept}`);
});
