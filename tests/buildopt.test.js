// Optimiseur de build complet (21-buildopt.js) : contrats, et oracles indépendants de l'algorithme
// (presets faits à la main, recherche exhaustive des armures, achats un par un recalculés avec pathTo).
const BEN = n => ENEMIES.find(e => e.n === n);
const FBK = BEN('Fell Black Knight'), HH = BEN('Hollow Hound');
const lost = b => TOPO.N.filter(n => owned(b, n) && !reach(b).has(n)).length;
const RUNS = {}, SLICES = {}; // chaque calcul complet est fait une fois, en mesurant la plus longue tranche (temps entre deux « yield »)
const full = (en, N, F) => RUNS[`${en.n}|${N}|${F}`] ??= (() => {
  const g = boRun('w1', en, N, F, 5, null, 1e9); let r, mx = 0, n = 0;
  do { const t = Date.now(); r = g.next(); mx = Math.max(mx, Date.now() - t); n++; } while (!r.done);
  SLICES[`${en.n}|${N}|${F}`] = {mx, n}; return r.value; })();
const ARMOR_BY_SLOT = BO_AS.map(sl => SETS.map(S => (S.p.find(p => p[2] === sl) || [])[0]).filter(Boolean)); // liste refaite depuis SETS

test('build optimal : un résultat par famille, budget et Flamme respectés, arbre relié, score annoncé = score recalculé', () => {
  for (const [en, N, F] of [[FBK, 212, 11], [HH, 60, 7]]) {
    const o = full(en, N, F);
    assert.deepEqual(o.res.map(r => r.fk), ['m1', 'm2', 'dag', 'bow', 'wand', 'staff']);
    for (const r of o.res) {
      const tag = `${en.n} N=${N} ${r.fl}`;
      assert.ok(!r.skip, tag + ' : non calculée');
      assert.equal(boFamOf(r.w), r.fk, tag + ' : arme hors famille');
      assert.equal(r.b.gear.w1, r.w.id, tag);
      assert.ok(r.used <= N && spentPoints(r.b) === r.used, `${tag} : ${spentPoints(r.b)} pts`);
      assert.equal(r.b.flame, F, tag);
      assert.equal(lost(r.b), 0, tag + ' : nœud non relié à un départ');
      for (const id in r.b.sk) assert.ok(r.b.sk[id] >= 1 && r.b.sk[id] <= SKI[id].max, `${tag} : rang de ${id}`);
      assert.ok(Math.abs(effVs(r.b, 'w1', en).avg - r.s.d) < 1e-9 && compute(r.b).hp === r.s.hp, tag + ' : score annoncé ≠ recalculé');
      assert.ok(r.b.gear.r1 && r.b.gear.r2 && r.b.gear.r1 !== r.b.gear.r2, tag + ' : deux anneaux différents');
      BO_AS.forEach(sl => { if (r.b.gear[sl]) assert.equal(ITEMS[r.b.gear[sl]].slot, sl, tag); });
      assert.ok(r.s.d > 0, tag + ' : aucun dégât');
    }
  }
});

test('build optimal : au moins aussi bon que chaque preset de sa famille, à budget et Flamme égaux', () => {
  for (const p of PRESETS) {
    const b = fromPreset(p), fk = boFamOf(ITEMS[b.gear.w1]), ps = boScore(b, 'w1', FBK);
    const r = boDrain(boFamily(fk, 'w1', FBK, spentPoints(b), b.flame, b.upg));
    assert.ok(!boGt(ps, r.s), `${p.name} : le preset fait mieux (${fmt(ps.d)} / ${ps.hp} PV contre ${fmt(r.s.d)} / ${r.s.hp} PV)`);
  }
});

test('build optimal : aucune des 32 768 combinaisons d\'armures ne fait mieux (arme, anneaux et arbre fixés)', () => {
  for (const [en, N, F, fk] of [[FBK, 212, 11, 'm2'], [HH, 60, 7, 'wand'], [HH, 60, 7, 'dag']]) {
    const r = full(en, N, F).res.find(x => x.fk === fk), t = clone(r.b), A = ARMOR_BY_SLOT.map(l => [undefined, ...l]);
    let better = null;
    for (const h of A[0]) for (const c of A[1]) for (const g of A[2]) for (const l of A[3]) for (const f of A[4]) {
      [h, c, g, l, f].forEach((id, i) => boSet(t, BO_AS[i], id));
      if (!better && boGt(boScore(t, 'w1', en), r.s)) better = [h, c, g, l, f].join(' ');
    }
    assert.equal(better, null, `${en.n} ${fk} : ${better}`);
  }
});

test('build optimal : aucun achat seul (chemin compris) ne tient dans les points restants et n\'augmente dégâts ou PV', () => {
  for (const [en, N, F] of [[FBK, 212, 11], [HH, 60, 7]]) for (const r of full(en, N, F).res) {
    const left = N - r.used; if (!left) continue;
    const check = (t, cost, what) => { if (cost <= left) assert.ok(!boGt(boScore(t, 'w1', en), r.s), `${en.n} ${r.fl} : ${what} (${cost} pts) ferait mieux`); };
    for (const s of SK) {
      const rk = r.b.sk[s.id] || 0; if (rk >= s.max) continue; const t = clone(r.b);
      if (rk) { t.sk[s.id] = rk + 1; check(t, s.cost, s.id); continue; }
      const pth = pathTo(t, TOPO.byId[s.id]); if (!pth) continue; const c = pathCost(t, pth); buyPath(t, pth); check(t, c, s.id);
    }
    for (const p of TOPO.pips) {
      if (r.b.pn[p.id]) continue; const t = clone(r.b), pth = pathTo(t, p); if (!pth) continue;
      const c = pathCost(t, pth); buyPath(t, pth); check(t, c, p.id);
    }
  }
});

test('build optimal : armes non dominées, chaque arme de la famille est couverte par une arme au moins aussi forte', () => {
  for (const [fk, , f] of BO_FAM) {
    const cand = boWeapons(fk);
    for (const [id] of WEAPONS) {
      const w = ITEMS[id]; if (!f(w.cat)) continue;
      assert.ok(cand.some(c => c.cat === w.cat && JSON.stringify(c.split) === JSON.stringify(w.split) && c.val >= w.val), `${fk} : ${w.n}`);
    }
    assert.ok(cand.every(c => f(c.cat)), fk);
  }
});

test('build optimal : cible immunisée à tout → 0 dégât, les PV sont quand même maximisés', () => {
  const imm = {n: 'Cible de test immunisée', f: 'wild', lv: '—', m: [0, 0, 0, 0, 0, 0, 0, 0], boss: false};
  const r = boDrain(boFamily('bow', 'w1', imm, 30, 11, 5));
  assert.equal(r.s.d, 0);
  assert.ok(r.used <= 30 && lost(r.b) === 0);
  assert.ok(r.s.hp > compute(blankBuild()).hp + 500, 'PV : ' + r.s.hp);
});

test('build optimal : « Appliquer » garde nom, niveau, améliorations, l\'autre arme et sa gemme ; partage b3 sans perte', () => {
  const o = full(FBK, 212, 11);
  for (const [pi, fk] of [[3, 'm1'], [4, 'dag']]) { // Barbare (gemme Fracture, contondant) → hache tranchante ; Assassin (gemme sans type)
    const b = fromPreset(PRESETS[pi]); b.lvl = 42; b.exp = 100; b.upg = 5;
    const r = o.res.find(x => x.fk === fk), m = boMerge(r, b, o);
    assert.deepEqual([m.name, m.lvl, m.exp, m.upg, m.flame, m.tv], [b.name, 42, 100, 5, 11, 1]);
    assert.equal(m.gear.w2, b.gear.w2); assert.equal(m.gem.w2, b.gem.w2);
    const g = GEMI[b.gem.w1];
    assert.equal(m.gem.w1, gemFit(g, ITEMS[m.gear.w1]) === false ? undefined : g.id, PRESETS[pi].name + ' : gemme');
    const s = boScore(m, 'w1', FBK); assert.ok(Math.abs(s.d - r.s.d) < 1e-9 && s.hp === r.s.hp, 'le build appliqué ≠ le résultat affiché');
    assert.equal(lost(m), 0);
    const d = decode(encode(m));
    assert.ok(d && !d._mig, 'code b3 illisible ou migré');
    assert.deepEqual([d.gear, d.gem, d.pn, d.pip, d.flame], [m.gear, m.gem, m.pn, m.pip, m.flame]);
    for (const sk of SK) assert.equal(d.sk[sk.id] || 0, m.sk[sk.id] || 0, sk.id);
  }
  assert.equal(o.res.find(x => x.fk === 'm1').b.gem.w1, undefined, 'le résultat lui-même ne choisit pas de gemme');
});

test('build optimal : calcul découpé (la page reste fluide) et plafond de temps', () => {
  for (const [en, N, F] of [[FBK, 212, 11], [HH, 60, 7]]) {
    const o = full(en, N, F), {mx, n} = SLICES[`${en.n}|${N}|${F}`];
    console.log(`      mesure (${en.n}, ${N} pts) : ${fmt(o.ms / 1000, 2)} s, ${n} tranches, la plus longue ${mx} ms`);
    assert.ok(mx < 250, `une tranche dure ${mx} ms : la page figerait`);
  }
  const p = boDrain(boRun('w1', HH, 150, 11, 5, 'bow', 0)); // plafond nul : seule la famille de l'arme analysée est calculée
  assert.ok(p.res.find(x => x.fk === 'bow').s, 'famille de l\'arme analysée non calculée');
  assert.equal(p.res.filter(x => x.skip).length, 5);
});

test('build optimal : la carte se rend avec les résultats ; « Appliquer » remplace le build courant', () => {
  const keep = [builds[0], cur, oEnemy, oSlot];
  builds[0] = fromPreset(PRESETS[3]); cur = 0; oEnemy = ENEMIES.indexOf(FBK); oSlot = 'w1'; BO.N = 212; BO.F = 11;
  BO.out = full(FBK, 212, 11); BO.key = boKey(B()); BO.busy = false;
  const html = boOutHtml();
  assert.ok(html.includes('data-boap="m2"') && html.includes('Calculé en'), 'résultats absents');
  renderOptNow();
  boApply('m2');
  assert.equal(B().gear.w1, BO.out.res.find(x => x.fk === 'm2').w.id); assert.equal(B().gear.w2, 'w_darkwood'); assert.equal(lost(B()), 0);
  BO.N = 150; assert.ok(boOutHtml().includes('relancez'), 'des résultats périmés restent affichés');
  [builds[0], cur, oEnemy, oSlot] = keep; Object.assign(BO, {out: null, N: null, F: null, key: ''});
});
