// Noms français dans chaque vue (après nav.test.js, dont il reprend fakeDom) : listes, fiche d'arme, Calculateur, Tables, Build optimal, messages.
const HH2 = () => ENEMIES.find(e => e.n === 'Hollow Hound'), FBK2 = () => ENEMIES.find(e => e.n === 'Fell Black Knight');
const optText = (html, v) => (html.match(new RegExp(`<option value="${v}">([^<]*)</option>`)) || [])[1];
function withBuild(preset, gear, fn) {
  const keepB = builds[0], keepC = cur, keepS = lay, keepE = oEnemy, keepT = tabEn, keepToast = globalThis.toast, said = [];
  try {
    globalThis.toast = t => said.push(t);
    builds[0] = fromPreset(PRESETS.find(p => p.name === preset)); Object.assign(builds[0].gear, gear || {}); cur = 0;
    return fakeDom(el => noLs(() => fn(el, said)));
  } finally { builds[0] = keepB; cur = keepC; oEnemy = keepE; tabEn = keepT; globalThis.toast = keepToast; lay = keepS; }
}

test('listes d\'équipement : chaque option montre le nom français, pas l\'anglais', () => {
  for (const sl of ['w1', 'r1', 'head', 'chest', 'hands', 'legs', 'feet']) {
    const h = slotOpts(sl), ids = [...h.matchAll(/<option value="(\w+)">/g)].map(m => m[1]);
    assert.ok(ids.length > 5, sl);
    for (const id of ids) { const t = optText(h, id), it = ITEMS[id]; assert.ok(t.startsWith(esc(it.fr)), `${sl} ${id} : ${t}`); if (it.fr !== it.n) assert.ok(!t.includes(esc(it.n)), `${id} : anglais dans l'option`); }
  }
  assert.match(optText(slotOpts('w1'), 'w_bloodflow'), /^Baguette de flux sanguin · niv\. 45$/);
});
test('liste des cibles : nom français, ° pour une traduction, groupes = factions françaises', () => {
  const h = enemyOpts();
  assert.equal(optText(h, ENEMIES.indexOf(HH2())), 'Chien Creux °');
  assert.equal(optText(h, ENEMIES.indexOf(FBK2())), 'Chevalier noir Déchu');
  assert.deepEqual([...h.matchAll(/<optgroup label="([^"]*)">/g)].map(m => m[1]), Object.values(FACTIONS).map(esc));
  assert.equal((h.match(/<option /g) || []).length, ENEMIES.length);
});
test('Calculateur : carte de la cible, armes, classement et immunité en français + anglais, mention de la traduction', () => {
  withBuild('Barbare deux mains', null, el => {
    oEnemy = ENEMIES.indexOf(HH2()); lay = mkDispo('all'); renderOptNow();
    const h = el('optBody').innerHTML, c = compute(B()), w1 = c.weapons[0].w;
    assert.ok(h.includes(`<h3>${nmH(HH2())}</h3>`), 'carte de la cible');
    assert.ok(h.includes('nom traduit par le simulateur'), 'mention de la traduction');
    assert.ok(h.includes(`<b>${nmH(w1)}</b></div>`), 'arme 1 équipée');
    assert.ok(h.includes(`<h3>Meilleures armes contre ${nmF(HH2())}</h3>`) && nmF(HH2()).endsWith('°</sup>'), 'titre du classement');
    assert.ok(h.includes(`<td class="nm"><b>${nmH(w1)}</b>`), 'ligne du classement');
    oEnemy = ENEMIES.indexOf(FBK2()); renderOptNow();
    assert.ok(!el('optBody').innerHTML.includes('nom traduit par le simulateur'), 'mention absente pour un nom déduit');
  });
  withBuild('Barbare deux mains', {w1: 'w_moor'}, el => {
    oEnemy = ENEMIES.indexOf(FBK2()); lay = mkDispo('all'); renderOptNow();
    assert.ok(el('optBody').innerHTML.includes(`${nmF(FBK2())} est immunisé aux dégâts`), 'message d\'immunité');
  });
});
test('fiche d\'arme et Tables : français puis anglais en italique', () => {
  const b = fromPreset(PRESETS.find(p => p.name === 'Barbare deux mains')), wc = compute(b).weapons[0];
  assert.ok(weaponBlock(wc, 'Arme 1').includes(`<h3>${nmH(wc.w)}</h3>`));
  const keep = [oMxQ, oMxF];
  try { oMxF = 'all'; oMxQ = '  chien creux  '; assert.ok(mxRows().includes(`>${nmH(HH2())}</button><small>Creux · niv.`), 'ligne de la table'); }
  finally { [oMxQ, oMxF] = keep; }
});
test('Build optimal : cible, arme et pièces en français ; message « appliqué » en français', () => {
  withBuild('Barbare deux mains', null, (el, said) => {
    const en = HH2(); oEnemy = ENEMIES.indexOf(en); lay = mkDispo('all'); renderOptNow();
    assert.ok(el('boBody').innerHTML.includes(`dégâts contre <b>${nmF(en)}</b>`), 'paragraphe de la cible');
    const o = boDrain(boRun('w1', en, 10, 11, 5, 'm1', 0)), r = o.res.find(x => x && x.fk === 'm1'), h = boCards(o, false);
    assert.ok(r && !r.skip && r.w.fr !== r.w.n, 'famille calculée');
    assert.ok(h.includes(`<b>${nmH(r.w)}</b> <small`), 'arme proposée');
    const m = boMerge(r, B(), o), arm = ITEMS[m.gear.chest] || ITEMS[m.gear.head];
    if (arm) assert.ok(h.includes(nmH(arm)), 'pièce d\'armure');
    Object.assign(BO, {out: o, busy: false, key: boKey(B())}); boApply('m1');
    assert.ok(said.some(t => t.startsWith('Build optimal appliqué') && t.includes(nmT(r.w))), said.join(' | '));
  });
});
