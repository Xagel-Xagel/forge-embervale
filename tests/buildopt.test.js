// Optimiseur de build complet (21-buildopt.js).
// Oracles indépendants de l'algorithme : comparateur et score écrits ici (pas boGt ni boScore), presets faits à la main,
// listes d'objets refaites depuis SETS / RINGS, énumérations exhaustives, achats et échanges recalculés avec pathTo / prune.
const BEN = n => ENEMIES.find(e => e.n === n);
const FBK = BEN('Fell Black Knight'), HH = BEN('Hollow Hound');
const lost = b => TOPO.N.filter(n => owned(b, n) && !reach(b).has(n)).length;
// Score et ordre propres aux tests : dégâts moyens d'abord (écart relatif > 1e-9), puis PV
const score = (b, slot, en) => ({d: (effVs(b, slot, en) || {avg: 0}).avg, hp: compute(b).hp});
const better = (x, y) => { const e = 1e-9 * Math.max(1, Math.abs(y.d)); return x.d - y.d > e || (Math.abs(x.d - y.d) <= e && x.hp > y.hp); };
const ARMOR = ['head', 'chest', 'hands', 'legs', 'feet'].map(sl => SETS.map(S => (S.p.find(p => p[2] === sl) || [])[0]).filter(Boolean));
const RING_IDS = RINGS.map(r => r[0]);

// Chaque calcul complet est fait une fois ; on compte les appels à compute() entre deux « yield » (mesure déterministe du découpage)
const RUNS = {}, SLICES = {};
const full = (en, N, F) => RUNS[`${en.n}|${N}|${F}`] ??= (() => {
  const real = globalThis.compute; let cnt = 0, mx = 0, mxMs = 0, n = 0; globalThis.compute = b => { cnt++; return real(b); };
  try {
    const g = boRun('w1', en, N, F, 5, null, 1e9); let r;
    do { cnt = 0; const t = Date.now(); r = g.next(); mx = Math.max(mx, cnt); mxMs = Math.max(mxMs, Date.now() - t); n++; } while (!r.done);
    SLICES[`${en.n}|${N}|${F}`] = {mx, mxMs, n}; return r.value;
  } finally { globalThis.compute = real; }
})();
const FAM_RUNS = {};
const fam = (fk, slot, en, N, F, upg) => FAM_RUNS[[fk, slot, en.n, N, F, upg].join('|')] ??= boDrain(boFamily(fk, slot, en, N, F, upg));

test('build optimal : ordre lexicographique de boGt (dégâts, puis PV, tolérance 1e-9)', () => {
  assert.ok(boGt({d: 2, hp: 0}, {d: 1, hp: 1e6}), 'les dégâts priment');
  assert.ok(boGt({d: 1, hp: 9}, {d: 1, hp: 5}), 'à dégâts égaux, les PV départagent');
  assert.ok(!boGt({d: 1 + 1e-12, hp: 0}, {d: 1, hp: 5}), 'écart de dégâts sous la tolérance : les PV décident');
  assert.ok(!boGt({d: 1, hp: 5}, {d: 1, hp: 5}) && !boGt({d: 0, hp: 5}, {d: 0, hp: 5}), 'égalité stricte');
  assert.ok(boGt({d: 0, hp: 6}, {d: 0, hp: 5}), 'cible immunisée : les PV décident');
});

test('build optimal : un résultat par famille, budget et Flamme respectés, arbre relié, score annoncé = score recalculé', () => {
  for (const [en, N, F] of [[FBK, 212, 11], [HH, 60, 7]]) {
    const o = full(en, N, F);
    assert.deepEqual(o.res.map(r => r.fk), ['m1', 'm2', 'dag', 'bow', 'wand', 'staff']);
    assert.deepEqual([o.N, o.F, o.slot, o.en], [N, F, 'w1', ENEMIES.indexOf(en)]);
    for (const r of o.res) {
      const tag = `${en.n} N=${N} ${r.fl}`, s = score(r.b, 'w1', en);
      assert.ok(!r.skip && !r.none, tag + ' : non calculée');
      assert.equal(boFamOf(ITEMS[r.b.gear.w1]), r.fk, tag + ' : arme hors famille');
      assert.ok(spentPoints(r.b) <= N && spentPoints(r.b) === r.used, `${tag} : ${spentPoints(r.b)} pts`);
      assert.equal(r.b.flame, F, tag);
      assert.equal(lost(r.b), 0, tag + ' : nœud non relié à un départ');
      for (const id in r.b.sk) assert.ok(r.b.sk[id] >= 1 && r.b.sk[id] <= SKI[id].max, `${tag} : rang de ${id}`);
      assert.ok(Math.abs(s.d - r.s.d) < 1e-9 && s.hp === r.s.hp, tag + ' : score annoncé ≠ recalculé');
      assert.ok(r.b.gear.r1 && r.b.gear.r2 && r.b.gear.r1 !== r.b.gear.r2, tag + ' : deux anneaux différents');
      for (const sl of ['head', 'chest', 'hands', 'legs', 'feet']) if (r.b.gear[sl]) assert.equal(ITEMS[r.b.gear[sl]].slot, sl, tag);
      assert.ok(s.d > 0, tag + ' : aucun dégât');
    }
  }
});

// Planchers mesurés le 2026-11-06 (1.13.0) : [dégâts moyens, PV] par famille. Ils gardent les gloutons, la phase PV,
// le regard à deux achats et l'amélioration locale. Si les DONNÉES du jeu changent (patch), re-mesurer et le dire dans le CHANGELOG ;
// ne jamais baisser un plancher pour faire passer un changement de l'algorithme.
const FLOORS = {
  'Fell Black Knight|212|11': {m1: [493.72, 2464], m2: [843.39, 2464], dag: [511.97, 2006], bow: [372.92, 1986], wand: [514.41, 1974], staff: [470.42, 1974]},
  'Hollow Hound|60|7': {m1: [915.03, 905], m2: [1548.55, 905], dag: [451.85, 742], bow: [299.58, 682], wand: [699.73, 685], staff: [523.47, 563]}
};
test('build optimal : planchers de non-régression par famille (budget large et budget serré)', () => {
  for (const [en, N, F] of [[FBK, 212, 11], [HH, 60, 7]]) for (const r of full(en, N, F).res) {
    const [d, hp] = FLOORS[`${en.n}|${N}|${F}`][r.fk], tag = `${en.n} N=${N} ${r.fl}`;
    assert.ok(r.s.d >= d - 0.01, `${tag} : ${fmt(r.s.d, 2)} dégâts < plancher ${d}`);
    if (r.s.d <= d + 0.01) assert.ok(r.s.hp >= hp, `${tag} : ${r.s.hp} PV < plancher ${hp} à dégâts égaux`);
  }
});

test('build optimal : au moins aussi bon que chaque preset de sa famille, à budget, Flamme et améliorations égaux', () => {
  for (const p of PRESETS) {
    const b = fromPreset(p), ps = score(b, 'w1', FBK), r = fam(boFamOf(ITEMS[b.gear.w1]), 'w1', FBK, spentPoints(b), b.flame, b.upg);
    assert.ok(!better(ps, r.s), `${p.name} : le preset fait mieux (${fmt(ps.d)} / ${ps.hp} PV contre ${fmt(r.s.d)} / ${r.s.hp} PV)`);
  }
});

test('build optimal : aucune des 32 768 combinaisons d\'armures ni des 91 paires d\'anneaux ne fait mieux (le reste fixé)', () => {
  for (const [en, N, F, fk] of [[FBK, 212, 11, 'm2'], [HH, 60, 7, 'wand'], [HH, 60, 7, 'dag']]) {
    const r = full(en, N, F).res.find(x => x.fk === fk), t = clone(r.b), A = ARMOR.map(l => [undefined, ...l]), set = (sl, id) => { if (id) t.gear[sl] = id; else delete t.gear[sl]; };
    let found = null;
    for (const h of A[0]) for (const c of A[1]) for (const g of A[2]) for (const l of A[3]) for (const f of A[4]) {
      [h, c, g, l, f].forEach((id, i) => set(['head', 'chest', 'hands', 'legs', 'feet'][i], id));
      if (!found && better(score(t, 'w1', en), r.s)) found = [h, c, g, l, f].join(' ');
    }
    assert.equal(found, null, `${en.n} ${fk} : armures ${found}`);
    const u = clone(r.b);
    for (let i = 0; i < RING_IDS.length; i++) for (let j = i + 1; j < RING_IDS.length; j++) {
      u.gear.r1 = RING_IDS[i]; u.gear.r2 = RING_IDS[j];
      assert.ok(!better(score(u, 'w1', en), r.s), `${en.n} ${fk} : anneaux ${RING_IDS[i]} + ${RING_IDS[j]}`);
    }
  }
});

test('build optimal : emplacement d\'armure laissé vide → aucune pièce ne change dégâts ni PV (texte « au choix » exact)', () => {
  let empty = 0;
  for (const [en, N, F] of [[FBK, 212, 11], [HH, 60, 7]]) for (const r of full(en, N, F).res) for (const [i, sl] of ['head', 'chest', 'hands', 'legs', 'feet'].entries()) {
    if (r.b.gear[sl]) continue; empty++;
    for (const id of ARMOR[i]) { const t = clone(r.b); t.gear[sl] = id; const s = score(t, 'w1', en);
      assert.ok(Math.abs(s.d - r.s.d) < 1e-9 && s.hp === r.s.hp, `${en.n} ${r.fl} : ${id} change le score`); }
  }
  assert.ok(empty > 0, 'aucun emplacement vide : ce test ne vérifie plus rien');
});

test('build optimal : aucun achat seul (chemin compris) ne tient dans les points restants et n\'augmente dégâts ou PV', () => {
  let checked = 0;
  for (const [en, N, F] of [[FBK, 212, 11]]) for (const r of full(en, N, F).res) {
    const left = N - r.used; assert.ok(left > 0, r.fl + ' : budget large, des points doivent rester libres');
    const check = (t, cost, what) => { if (cost > left) return; checked++; assert.ok(!better(score(t, 'w1', en), r.s), `${en.n} ${r.fl} : ${what} (${cost} pts) ferait mieux`); };
    for (const s of SK) {
      const rk = r.b.sk[s.id] || 0; if (rk >= s.max) continue; const t = clone(r.b);
      if (rk) { t.sk[s.id] = rk + 1; check(t, s.cost, s.id); continue; }
      const pth = pathTo(t, TOPO.byId[s.id]); if (!pth) continue; const c = pathCost(t, pth); buyPath(t, pth); check(t, c, s.id);
    }
    for (const p of TOPO.pips) { if (r.b.pn[p.id]) continue; const t = clone(r.b), pth = pathTo(t, p); if (!pth) continue; const c = pathCost(t, pth); buyPath(t, pth); check(t, c, p.id); }
  }
  assert.ok(checked > 500, 'trop peu d\'achats vérifiés : ' + checked);
});

test('build optimal : budget serré, aucun échange « retirer un nœud, en acheter un autre » ne fait mieux', () => {
  for (const [fk, en, N] of [['dag', HH, 60], ['m2', FBK, 40]]) {
    const r = fam(fk, 'w1', en, N, 11, 5); assert.equal(r.used, N, `${fk} : le budget serré doit être entièrement dépensé`);
    let tries = 0;
    for (const u of [...Object.keys(r.b.sk).filter(id => r.b.sk[id] > 0), ...Object.keys(r.b.pn)]) {
      const b0 = clone(r.b); if (b0.pn[u]) delete b0.pn[u]; else if (--b0.sk[u] <= 0) delete b0.sk[u]; syncPips(b0); prune(b0); const left = N - spentPoints(b0);
      for (const v of [...SK.map(s => TOPO.byId[s.id]), ...TOPO.pips]) {
        if (v.id === u) continue; const t = clone(b0); let cost;
        if (v.kind === 'skill' && (t.sk[v.id] || 0) > 0) { if (t.sk[v.id] >= v.sk.max) continue; t.sk[v.id]++; cost = v.sk.cost; }
        else { if (owned(t, v)) continue; const p = pathTo(t, v); if (!p) continue; cost = pathCost(t, p); if (cost > left) continue; buyPath(t, p); }
        if (cost > left) continue; tries++;
        assert.ok(!better(score(t, 'w1', en), r.s), `${en.n} ${fk} N=${N} : −${u} +${v.id} fait mieux`);
      }
    }
    assert.ok(tries > 1000, `${fk} : ${tries} échanges seulement`);
  }
});

test('build optimal : petit budget, égal au meilleur des arbres reliés énumérés exhaustivement (équipement fixé)', () => {
  for (const [fk, en, N] of [['m2', FBK, 4], ['dag', HH, 4]]) {
    const r = fam(fk, 'w1', en, N, 11, 5), seen = new Set(); let best = null;
    const key = b => JSON.stringify([Object.entries(b.sk).filter(x => x[1] > 0).sort(), Object.keys(b.pn).sort()]);
    const rec = b => {
      const k = key(b); if (seen.has(k)) return; seen.add(k);
      const e = score(b, 'w1', en); if (!best || better(e, best)) best = e;
      const left = N - spentPoints(b), R = reach(b);
      for (const v of TOPO.N) {
        if (v.kind !== 'skill' && v.kind !== 'pip') continue;
        if (owned(b, v)) { if (v.kind === 'skill' && b.sk[v.id] < v.sk.max && v.sk.cost <= left) { const t = clone(b); t.sk[v.id]++; rec(t); } continue; }
        if (nodeCost(v) <= left && canBuy(b, v, R)) { const t = clone(b); if (v.kind === 'skill') t.sk[v.id] = 1; else { t.pn[v.id] = 1; syncPips(t); } rec(t); }
      }
    };
    const b0 = clone(r.b); b0.sk = {}; b0.pn = {}; b0.pip = {}; rec(b0);
    assert.ok(seen.size > 1000, 'énumération trop petite : ' + seen.size);
    assert.ok(!better(best, r.s), `${en.n} ${fk} N=${N} : un arbre fait ${fmt(best.d, 2)} / ${best.hp} PV contre ${fmt(r.s.d, 2)} / ${r.s.hp}`);
  }
});

test('build optimal : armes non dominées (base, chance et dégâts de coup critique des perks débloqués), chaque arme couverte par une au moins aussi forte', () => {
  const same = (c, w) => c.cat === w.cat && JSON.stringify(c.split) === JSON.stringify(w.split), ge = (x, y) => x.every((v, n) => v >= y[n]);
  for (const u of [0, 2, 4, 5]) for (const [fk, , f] of BO_FAM) {
    const cand = boWeapons(fk, u); assert.ok(cand.length > 0, fk);
    for (const [id] of WEAPONS) { const w = ITEMS[id]; if (!f(w.cat)) continue;
      assert.ok(cand.some(c => same(c, w) && ge(boPk(c, u), boPk(w, u))), `${fk}, ${u} améliorations : ${w.n} non couverte`); }
    for (const c of cand) assert.ok(!cand.some(d => d !== c && same(d, c) && ge(boPk(d, u), boPk(c, u))), `${fk}, ${u} améliorations : ${c.n} dominée mais gardée`);
    assert.ok(cand.every(c => f(c.cat)), fk);
  }
  // sur de vrais builds (preset mage critique, Barbare), remplacer une arme écartée par celle qui la couvre ne baisse jamais la moyenne
  for (const p of [PRESETS.find(q => q.name === 'Mage critique (baguette)'), PRESETS[3]]) { const b = fromPreset(p), fk = boFamOf(ITEMS[b.gear.w1]), cand = boWeapons(fk, b.upg), f = BO_FAM.find(x => x[0] === fk)[2];
    const avg = id => { const t = clone(b); t.gear.w1 = id; return compute(t).weapons[0].avg; };
    let out = 0;
    for (const [id] of WEAPONS) { const w = ITEMS[id]; if (!f(w.cat) || cand.includes(w)) continue; out++;
      const c = cand.find(c => same(c, w) && ge(boPk(c, b.upg), boPk(w, b.upg))); assert.ok(avg(c.id) >= avg(id) - 1e-9, `${p.name} : ${c.n} < ${w.n}`); }
    assert.ok(out > 0, p.name + ' : aucune arme écartée, contrôle vide');
  }
});

test('build optimal : cible immunisée à tout → 0 dégât, les PV sont quand même maximisés', () => {
  const imm = {n: 'Cible de test immunisée', f: 'wild', lv: '—', m: [0, 0, 0, 0, 0, 0, 0, 0], boss: false};
  const r = boDrain(boFamily('bow', 'w1', imm, 30, 11, 5));
  assert.equal(r.s.d, 0);
  assert.ok(r.used <= 30 && lost(r.b) === 0);
  assert.ok(r.s.hp >= 2156, 'PV : ' + r.s.hp + ' (plancher mesuré le 2026-11-06 : 2 156)');
});

test('build optimal : arme analysée en arme 2, améliorations < 5, Flamme différente', () => {
  const r2 = fam('m2', 'w2', FBK, 60, 11, 5), b = fromPreset(PRESETS[0]); // Mage de bataille : baguette en arme 1
  assert.ok(!r2.b.gear.w1 && boFamOf(ITEMS[r2.b.gear.w2]) === 'm2');
  const m = boMerge(r2, b, {slot: 'w2', F: 11});
  assert.equal(m.gear.w1, b.gear.w1, 'arme 1 du build gardée'); assert.equal(m.gear.w2, r2.b.gear.w2);
  assert.equal(m.gem.w1, b.gem.w1, 'gemme de l\'arme 1 gardée');
  const s = score(m, 'w2', FBK); assert.ok(Math.abs(s.d - r2.s.d) < 1e-9 && s.hp === r2.s.hp, 'score en arme 2');
  const lo = fam('m2', 'w1', FBK, 60, 11, 2), hi = fam('m2', 'w1', FBK, 60, 11, 5);
  assert.equal(lo.b.upg, 2); const sl = score(lo.b, 'w1', FBK); assert.ok(Math.abs(sl.d - lo.s.d) < 1e-9 && sl.hp === lo.s.hp);
  assert.ok(lo.s.d < hi.s.d, `2 perks débloqués (${fmt(lo.s.d)}) doivent faire moins que 5 (${fmt(hi.s.d)})`);
  const f3 = fam('m2', 'w1', FBK, 60, 3, 5); assert.equal(f3.b.flame, 3); assert.ok(f3.s.d < hi.s.d, 'Flamme 3 < Flamme 11 (Barbare)');
});

test('build optimal : « Appliquer » (boMerge) garde nom, niveau, améliorations, autre arme et gemmes ; pièces gardées ; partage b3', () => {
  const o = full(FBK, 212, 11);
  // Barbare : gemme typée incompatible avec l'arme gagnante (choisie d'après elle : depuis 1.17.0 les perks de critique comptent et le gagnant mêlée une main
  // est un marteau contondant, compatible avec la Fracture d'avant) → retirée ; Assassin : gemme sans type, gardée
  const m1w = ITEMS[o.res.find(x => x.fk === 'm1').b.gear.w1], off = GEMS.map(g => GEMI[g[0]]).find(g => gemFit(g, m1w) === false);
  assert.ok(off, 'aucune gemme incompatible avec ' + m1w.n + ' : la branche « retirée » n\'est plus exercée');
  for (const [pi, fk, gem, set] of [[3, 'm1', undefined, off.id], [4, 'dag', 'g_toxic']]) {
    const b = fromPreset(PRESETS[pi]); b.lvl = 42; b.exp = 100; b.upg = 3; if (set) b.gem.w1 = set;
    const r = o.res.find(x => x.fk === fk), m = boMerge(r, b, o);
    assert.deepEqual([m.name, m.lvl, m.exp, m.upg, m.flame, m.tv], [b.name, 42, 100, 3, 11, 1]);
    assert.equal(m.gear.w2, b.gear.w2); assert.equal(m.gem.w2, b.gem.w2);
    assert.equal(m.gem.w1, gem, PRESETS[pi].name + ' : gemme de l\'arme 1');
    assert.equal(lost(m), 0);
    const d = decode(encode(m));
    assert.ok(d && !d._mig, 'code b3 illisible ou migré');
    assert.deepEqual([d.gear, d.gem, d.pn, d.pip, d.flame, d.lvl, d.exp, d.upg], [m.gear, m.gem, m.pn, m.pip, m.flame, m.lvl, m.exp, m.upg]);
    for (const sk of SK) assert.equal(d.sk[sk.id] || 0, m.sk[sk.id] || 0, sk.id);
  }
  // emplacement vide dans le résultat : la pièce du build est gardée, et le score affiché (build fusionné) = le score du résultat, pour les 6 familles
  const bar = fromPreset(PRESETS[3]); let kept = 0;
  for (const r of o.res) {
    const m = boMerge(r, bar, o), s = score(m, 'w1', FBK);
    assert.ok(Math.abs(s.d - r.s.d) < 1e-9 && s.hp === r.s.hp, r.fl + ' : le build appliqué ≠ le résultat affiché');
    for (const sl of ['head', 'chest', 'hands', 'legs', 'feet', 'r1', 'r2']) if (!r.b.gear[sl] && bar.gear[sl]) { assert.equal(m.gear[sl], bar.gear[sl], r.fl + ' ' + sl); kept++; }
  }
  assert.ok(kept > 0, 'aucune pièce gardée : la branche n\'est plus exercée');
  assert.equal(o.res.find(x => x.fk === 'm1').b.gem.w1, undefined, 'le résultat lui-même ne choisit pas de gemme');
});

test('build optimal : calcul découpé (au plus 2 000 calculs de fiche entre deux pauses) et plafond de temps de calcul', () => {
  for (const [en, N, F] of [[FBK, 212, 11], [HH, 60, 7]]) {
    const o = full(en, N, F), {mx, mxMs, n} = SLICES[`${en.n}|${N}|${F}`];
    console.log(`      mesure (${en.n}, ${N} pts) : ${fmt(o.ms / 1000, 2)} s, ${n} tranches, au plus ${mx} calculs (${mxMs} ms) par tranche`);
    assert.ok(mx <= 2000, `${mx} calculs de fiche sans rendre la main : la page figerait`);
  }
  let k = 0; const clock = () => 6000 * k++; // horloge factice : 6 s de calcul par famille → 2 familles, puis plafond de 10 s
  const p = boDrain(boRun('w1', HH, 30, 11, 5, 'bow', 10000, clock));
  assert.deepEqual(p.res.filter(x => !x.skip).map(x => x.fk).sort(), ['bow', 'm1'], 'famille analysée puis une seule autre');
  assert.equal(p.res.filter(x => x.skip).length, 4);
  const keep = globalThis.boWeapons; globalThis.boWeapons = () => [];
  try { assert.deepEqual(boDrain(boFamily('bow', 'w1', HH, 30, 11, 5)), {fk: 'bow', fl: 'Arcs', none: true}, 'famille sans arme'); }
  finally { globalThis.boWeapons = keep; }
});

// ---------- Interface (faux DOM : prouve les états et les textes, pas le rendu) ----------
const until = async (f, ms = 4000) => { const t0 = Date.now(); while (!f()) { if (Date.now() - t0 > ms) throw new Error('délai dépassé'); await new Promise(r => setTimeout(r, 3)); } };
const withUi = async fn => {
  const keep = [builds[0], builds[1], cur, oEnemy, oSlot, globalThis.boRun];
  builds[0] = fromPreset(PRESETS[3]); builds[1] = fromPreset(PRESETS[0]); builds[1].lvl = 20; cur = 0; oEnemy = ENEMIES.indexOf(FBK); oSlot = 'w1';
  Object.assign(BO, {run: BO.run + 1, busy: false, out: null, part: null, key: '', N: [null, null], F: [null, null], stop: false, err: ''});
  try { await fn(); }
  finally { BO.run++; [builds[0], builds[1], cur, oEnemy, oSlot, globalThis.boRun] = keep; Object.assign(BO, {busy: false, out: null, part: null, key: '', N: [null, null], F: [null, null], stop: false, err: ''}); }
};
// Faux calculs : rejouent de vrais résultats (Fell Black Knight, 212 pts, Flamme 11) avec des pauses
const REAL = () => full(FBK, 212, 11);
function* fakeRun(slot, en, N, F) { const res = {}; for (const r of REAL().res.slice(0, 3)) { yield; yield; res[r.fk] = r; yield {res: {...res}, fam: r.fl}; }
  return {res: BO_FAM.map(f => res[f[0]] || {fk: f[0], fl: f[1], skip: true}), ms: 5, N, F, slot, en: ENEMIES.indexOf(en)}; }
const endless = c => function* () { const r = REAL().res[1]; yield {res: {[r.fk]: r}, fam: r.fl}; for (;;) { c.n++; yield; } };

test('build optimal (interface) : résultats affichés, « Appliquer » remplace le build, la clé reste valable', async () => withUi(async () => {
  globalThis.boRun = fakeRun; boStart(); assert.ok(BO.busy);
  await until(() => !BO.busy); assert.equal(BO.out.N, 212); assert.equal(BO.out.res.filter(x => x.skip).length, 3);
  const html = boOutHtml(); assert.ok(html.includes('data-boap="m2"') && html.includes('temps de calcul maximal') && html.includes('Calculé en'));
  renderOptNow();
  const want = BO.out.res.find(x => x.fk === 'm2').b.gear.w1, w2 = builds[0].gear.w2; boApply('m2');
  assert.equal(B().gear.w1, want); assert.equal(B().gear.w2, w2); assert.equal(lost(B()), 0);
  assert.equal(BO.key, boKey(B()), 'clé non rafraîchie après « Appliquer »');
  assert.ok(boOutHtml().includes('<b class="d-0">+0 %</b> de dégâts, +0 PV'), 'la famille appliquée doit afficher +0 % et +0 PV par rapport au build');
  const before = clone(B()); boApply('bow'); assert.deepEqual(B(), before, 'famille non calculée appliquée');
}));

test('build optimal (interface) : chaque réglage changé invalide les résultats et bloque « Appliquer »', async () => withUi(async () => {
  globalThis.boRun = fakeRun; boStart(); await until(() => !BO.busy);
  const changes = [() => { cur = 1; }, () => { oEnemy = ENEMIES.indexOf(HH); }, () => { oSlot = 'w2'; }, () => { BO.N[0] = 150; }, () => { BO.F[0] = 7; }, () => { builds[0].upg = 2; }];
  for (const [i, ch] of changes.entries()) {
    const keep = [cur, oEnemy, oSlot, BO.N[0], BO.F[0], builds[0].upg]; ch();
    assert.ok(boOutHtml().includes('relancez'), 'réglage ' + i + ' : résultats périmés affichés');
    const before = clone(B()); boApply('m2'); assert.deepEqual(B(), before, 'réglage ' + i + ' : « Appliquer » a modifié le build');
    [cur, oEnemy, oSlot, BO.N[0], BO.F[0], builds[0].upg] = keep;
  }
  assert.ok(!boOutHtml().includes('relancez'), 'réglages remis : résultats de nouveau valables');
}));

test('build optimal (interface) : pendant le calcul, « Appliquer » inactif ; « Arrêter » garde les familles finies', async () => withUi(async () => {
  const c = {n: 0}; globalThis.boRun = endless(c); boStart();
  await until(() => BO.part); assert.ok(BO.busy);
  const html = boOutHtml(); assert.ok(html.includes('Appliquer à la fin du calcul') && !html.includes('data-boap'), 'bouton actif pendant le calcul');
  assert.ok(boProgHtml().includes('boStop'), 'bouton Arrêter absent');
  const before = clone(B()); boApply('m2'); assert.deepEqual(B(), before);
  boStopRun(); assert.ok(!BO.busy && BO.stop); assert.deepEqual(BO.out.res.map(x => x.fk), ['m2']);
  assert.ok(boOutHtml().includes('Calcul arrêté avant la fin') && boOutHtml().includes('Non calculée (calcul arrêté)'));
  const n = c.n; await new Promise(r => setTimeout(r, 30)); assert.equal(c.n, n, 'le calcul continue après « Arrêter »');
  boApply('m2'); assert.equal(B().gear.w1, BO.out.res[0].b.gear.w1, 'une famille finie avant l\'arrêt s\'applique');
}));

test('build optimal (interface) : changer de cible pendant le calcul l\'arrête ; un 2e lancement remplace le 1er', async () => withUi(async () => {
  const c = {n: 0}; globalThis.boRun = endless(c); boStart(); await until(() => BO.part);
  oEnemy = ENEMIES.indexOf(HH); renderOptNow(); assert.ok(!BO.busy, 'calcul non arrêté'); assert.ok(boOutHtml().includes('relancez'));
  const n = c.n; await new Promise(r => setTimeout(r, 20)); assert.equal(c.n, n);
  oEnemy = ENEMIES.indexOf(FBK); const c1 = {n: 0}; globalThis.boRun = endless(c1); boStart(); await until(() => c1.n > 0);
  BO.N[0] = 100; globalThis.boRun = fakeRun; BO.busy = false; boStart(); // 2e lancement (le bouton est désactivé à l'écran : appel direct)
  const n1 = c1.n; await until(() => !BO.busy); await new Promise(r => setTimeout(r, 20));
  assert.equal(c1.n, n1, 'le 1er calcul avance encore'); assert.equal(BO.out.N, 100, 'résultats du 1er calcul');
}));

test('build optimal (interface) : une erreur pendant le calcul est dite et libère le bouton', async () => withUi(async () => {
  globalThis.boRun = function* () { yield; throw new Error('panne de test'); };
  const err = console.error, logged = []; console.error = (...a) => logged.push(a.join(' '));
  try { boStart(); await until(() => !BO.busy); } finally { console.error = err; }
  assert.ok(logged.some(l => l.includes('panne de test')), 'erreur non journalisée dans la console');
  assert.ok(BO.err.includes('panne de test')); assert.ok(boProgHtml().includes('Erreur pendant le calcul'));
  globalThis.boRun = fakeRun; boStart(); await until(() => !BO.busy); assert.equal(BO.err, '', 'erreur non effacée au calcul suivant');
}));

test('build optimal (interface) : saisies ramenées et affichées, valeurs propres à chaque build, build sans arme', async () => withUi(async () => {
  const e = {value: '500'}; assert.equal(boRead(e, 'N'), 212); assert.equal(e.value, '212');
  e.value = ''; assert.equal(boRead(e, 'N'), budget(B())); assert.equal(BO.N[0], null, 'valeur du build : pas figée');
  e.value = '7.4'; assert.equal(boRead(e, 'F'), 7); e.value = '0'; assert.equal(boRead(e, 'F'), 1); e.value = '0'; assert.equal(boRead(e, 'N'), 0);
  e.value = '150'; boRead(e, 'N'); cur = 1; assert.equal(boN(B()), budget(builds[1]), 'la saisie du build A ne doit pas valoir pour B'); cur = 0; assert.equal(boN(B()), 150);
  builds[0] = blankBuild('Vide'); BO.N[0] = null; globalThis.boRun = fakeRun; boStart(); await until(() => !BO.busy);
  const html = boOutHtml(); assert.ok(html.includes('data-boap') && !html.includes('Par rapport à votre build'));
}));
