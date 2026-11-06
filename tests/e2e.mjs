// Test navigateur (optionnel) : nécessite Playwright.
//   npm i -D playwright && npx playwright install chromium
//   node tests/e2e.mjs            → captures dans tests/screenshots/ (une par disposition, clair / sombre × 1 300 / 400 px)
//   E2E_LONGTASK_MS=500 node tests/e2e.mjs   → seuil des tâches longues (200 ms par défaut ; 500 ms en CI, machines plus lentes)
import {build} from '../scripts/build.mjs';
import {mkdirSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let chromium;
try { ({chromium} = await import('playwright')); } catch { console.error('Playwright absent : npm i -D playwright && npx playwright install chromium'); process.exit(2); }
build({quiet: true});
mkdirSync(join(root, 'tests/screenshots'), {recursive: true});
const url = pathToFileURL(join(root, 'dist/index.html')).href;
const browser = await chromium.launch();
let fail = 0;
const LONGTASK = +process.env.E2E_LONGTASK_MS || 200;
const PIDS = ['tree', 'eq', 'fiche', 'calc', 'bo', 'def', 'tab'];
// Oracles littéraux : panneaux ouverts de chaque disposition, dans l'ordre (étude, QCM 4)
const DISPO = {theo: ['tree', 'fiche', 'eq', 'calc'], combat: ['calc', 'def'], mini: ['eq', 'fiche', 'tree'], all: ['tree', 'eq', 'fiche', 'calc', 'bo', 'def', 'tab']};
const LSK = 'forge-embervale-panneaux';
const overflow = async (page, w, what, errs) => { const sw = await page.evaluate(() => document.documentElement.scrollWidth); if (sw > w) errs.push(`débordement horizontal (${what}) : ${sw}px > ${w}px`); };
const dispo = async (page, k) => { await page.selectOption('#dispo', k); await page.waitForTimeout(80); };
// Afficher un panneau par l'interface : rail (fermé) puis Replier / Déplier (replié) ; téléphone : bouton Replier de l'accordéon (ou « Plus » s'il est fermé)
const show = async (page, k) => {
  const st = await page.evaluate(k => ({open: !document.querySelector('#p-' + k).hidden, folded: document.querySelector('#pb-' + k).hidden, phone: matchMedia('(max-width:639px)').matches}), k);
  if (!st.open) { if (st.phone) { await page.evaluate(k => goPanel(k), k); } else await page.click('#r-' + k); }
  if (await page.evaluate(k => document.querySelector('#pb-' + k).hidden, k)) await page.click('#pf-' + k);
  await page.waitForTimeout(80);
};
const openList = page => page.evaluate(() => [...document.querySelectorAll('#pgrid > .pnl')].filter(p => !p.hidden).map(p => p.id.slice(2)));
const shownList = page => page.evaluate(() => [...document.querySelectorAll('#pgrid > .pnl')].filter(p => !p.hidden && !p.querySelector('.pbody').hidden).map(p => p.id.slice(2)));
// Accessibilité des panneaux : rail étiqueté (aria-pressed = ouvert), section étiquetée par son titre, Replier (aria-expanded / aria-controls), groupes Organiser étiquetés
const ariaErrs = page => page.evaluate(() => {
  const bad = [], rail = document.querySelector('nav#rail');
  if (!rail || rail.getAttribute('aria-label') !== 'Panneaux') bad.push('rail sans nav étiquetée « Panneaux »');
  for (const p of document.querySelectorAll('#pgrid > section.pnl')) {
    const k = p.id.slice(2), h = document.getElementById(p.getAttribute('aria-labelledby')), f = document.querySelector('#pf-' + k), r = document.querySelector('#r-' + k), b = document.getElementById(f && f.getAttribute('aria-controls'));
    if (!h || !p.contains(h) || !/^H2$/.test(h.tagName)) bad.push('titre de ' + p.id);
    if (!b || !p.contains(b)) bad.push('aria-controls de ' + k);
    else if (f.getAttribute('aria-expanded') !== String(!b.hidden)) bad.push('aria-expanded de ' + k);
    if (!r || r.getAttribute('aria-pressed') !== String(!p.hidden)) bad.push('rail de ' + k);
    const g = document.querySelector('#po-' + k); if (!g || g.getAttribute('role') !== 'group' || !g.getAttribute('aria-label')) bad.push('groupe Organiser de ' + k);
  }
  return bad; });
// Cibles tactiles (téléphone) : boutons et listes visibles de la barre collée, des en-têtes de panneau et de la barre basse ≥ 44 px
const smallTargets = page => page.evaluate(() => [...document.querySelectorAll('#pBar button, #pBar select, .ptools button, #bbar button, #bmore button')]
  .filter(b => b.offsetParent !== null).map(b => [b.id, b.getBoundingClientRect()]).filter(([, r]) => r.height < 43.5 || r.width < 43.5).map(([id, r]) => `${id} ${Math.round(r.width)}×${Math.round(r.height)}`));

for (const [w, scheme] of [[1300, 'light'], [1300, 'dark'], [400, 'light'], [400, 'dark']]) {
  const page = await browser.newPage({viewport: {width: w, height: 900}, colorScheme: scheme});
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto(url); await page.waitForTimeout(900);
  const phone = w < 640;
  // Première visite : Théoricien ; aucun débordement ; ARIA ; accordéon (un seul déplié) au téléphone
  await overflow(page, w, 'Théoricien', errs);
  errs.push(...(await ariaErrs(page)).map(e => 'ARIA : ' + e));
  if (await page.inputValue('#dispo') !== 'theo') errs.push('première visite : Théoricien attendu');
  if ((await openList(page)).join() !== DISPO.theo.join()) errs.push('Théoricien : panneaux ' + (await openList(page)).join());
  if ((await shownList(page)).join() !== (phone ? 'tree' : DISPO.theo.join())) errs.push('panneaux dépliés au démarrage : ' + (await shownList(page)).join());
  // Grille : Arbre en L sur 2 colonnes (3 colonnes à 1 300 px) ; une seule colonne au téléphone ; rail ou barre basse
  const geo = await page.evaluate(() => { const r = k => document.querySelector('#p-' + k).getBoundingClientRect(); return {t: r('tree'), f: r('fiche'), e: r('eq'), c: r('calc'), rail: getComputedStyle(document.querySelector('#rail')).display !== 'none', bb: getComputedStyle(document.querySelector('#bbar')).display !== 'none'}; /* barre basse fixe : offsetParent toujours nul */ });
  if (phone) { if (new Set([geo.t.left, geo.f.left, geo.e.left, geo.c.left].map(Math.round)).size !== 1) errs.push('téléphone : panneaux pas sur une colonne'); if (geo.rail || !geo.bb) errs.push('téléphone : rail affiché ou barre basse absente'); }
  else {
    if (!(geo.t.width > geo.f.width * 1.8)) errs.push(`Arbre (L) pas sur deux colonnes (${Math.round(geo.t.width)} / ${Math.round(geo.f.width)} px)`);
    if (Math.abs(geo.f.top - geo.t.top) > 1 || geo.f.left < geo.t.right) errs.push('Fiche pas à droite de l\'Arbre');
    if (Math.abs(geo.e.top - geo.c.top) > 1 || !(geo.c.left > geo.e.right)) errs.push('Équipement et Calculateur pas côte à côte');
    if (!geo.rail || geo.bb) errs.push('bureau : rail absent ou barre basse affichée');
  }
  if (phone) { const s = await smallTargets(page); if (s.length) errs.push('cibles < 44 px : ' + s.join(', ')); }
  // Parcours : changer de preset, de cible, acheter une recommandation, passer en vue liste
  await page.selectOption('#preset', {label: 'Barbare deux mains'});
  await show(page, 'calc');
  await page.selectOption('#oEnemy', String(await page.evaluate(() => ENEMIES.findIndex(e => e.n === 'Hollow Hound'))));
  if (!/Chien Creux.*Hollow Hound/.test(await page.textContent('#p-calc .ocard h3').catch(() => ''))) errs.push('Calculateur : nom français + anglais absent de la carte de la cible');
  await page.waitForTimeout(100);
  const buy = await page.$('[data-inv="0"]'); if (buy) await buy.click();
  if (!await page.isVisible('#p-calc .ofam')) errs.push('« Armes à classer » absent du calculateur');
  // Barre collée : après défilement, elle reste en haut de l'écran
  await page.evaluate(() => window.scrollTo(0, 900)); await page.waitForTimeout(50);
  const top = await page.evaluate(() => Math.round(document.querySelector('#pBar').getBoundingClientRect().top));
  if (top !== 0) errs.push(`barre des panneaux non collée en haut après défilement (haut à ${top}px)`);
  // Focus clavier : #oEnemy, placé sous la barre collée (témoin), puis atteint par Maj+Tab depuis #oSlot, doit être ramené dessous ;
  // contre-épreuve : sans scroll-padding, il resterait caché (le test sait voir la panne)
  for (const pad of [true, false]) {
    const was = await page.evaluate(pad => { const a = document.querySelector('#oEnemy'), bar = document.querySelector('#pBar');
      document.documentElement.style.scrollPaddingTop = pad ? '' : '0px'; document.querySelector('#oSlot').focus(); window.scrollBy(0, a.getBoundingClientRect().top - 8);
      return a.getBoundingClientRect().top < bar.getBoundingClientRect().bottom; }, pad);
    await page.keyboard.press('Shift+Tab');
    const f = await page.evaluate(() => { const a = document.activeElement, r = a.getBoundingClientRect(), b = document.querySelector('#pBar').getBoundingClientRect(); document.documentElement.style.scrollPaddingTop = ''; return {id: a.id, hid: r.top < b.bottom}; });
    if (!was) errs.push('focus : témoin raté, #oEnemy n\'était pas sous la barre collée');
    else if (f.id !== 'oEnemy') errs.push('focus : Maj+Tab a atteint ' + f.id + ' au lieu de #oEnemy');
    else if (pad && f.hid) errs.push('élément focalisé caché sous la barre collée : #oEnemy');
    else if (!pad && !f.hid) errs.push('focus : la contre-épreuve sans scroll-padding ne cache rien (test aveugle)');
  }
  // Téléphone : la barre basse ne couvre jamais le focus (#oSlot placé dessous, atteint par Tab depuis #oEnemy) ; contre-épreuve sans scroll-padding-bottom
  if (phone) for (const pad of [true, false]) {
    const was = await page.evaluate(pad => { const a = document.querySelector('#oSlot'), bb = document.querySelector('#bbar').getBoundingClientRect();
      document.documentElement.style.scrollPaddingBottom = pad ? '' : '0px'; document.querySelector('#oEnemy').focus(); window.scrollBy(0, a.getBoundingClientRect().bottom - innerHeight + 10);
      return a.getBoundingClientRect().bottom > bb.top; }, pad);
    await page.keyboard.press('Tab');
    const f = await page.evaluate(() => { const a = document.activeElement, r = a.getBoundingClientRect(), b = document.querySelector('#bbar').getBoundingClientRect(); document.documentElement.style.scrollPaddingBottom = ''; return {id: a.id, hid: r.bottom > b.top}; });
    if (!was) errs.push('focus (bas) : témoin raté, #oSlot n\'était pas sous la barre basse');
    else if (f.id !== 'oSlot') errs.push('focus (bas) : Tab a atteint ' + f.id);
    else if (pad && f.hid) errs.push('élément focalisé caché sous la barre basse : #oSlot');
    else if (!pad && !f.hid) errs.push('focus (bas) : la contre-épreuve ne cache rien (test aveugle)');
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await show(page, 'tree');
  await page.click('#vList');
  await overflow(page, w, 'vue Liste', errs);
  await page.click('#vGraph');
  await show(page, 'def');
  await page.fill('#dHit', '900');
  if (!/coups avant K\.O\./.test(await page.textContent('#defOut'))) errs.push('bloc défense vide');
  // Build optimal : calcul découpé (aucune tâche longue), un résultat par famille, détail ouvert pour la capture
  await dispo(page, 'all'); await show(page, 'bo');
  await page.evaluate(() => { window.__lt = null; try { const l = []; new PerformanceObserver(o => o.getEntries().forEach(e => l.push(e.duration))).observe({type: 'longtask'}); window.__lt = l; } catch (e) {} });
  const t0 = Date.now(); await page.click('#boGo');
  const done = await page.waitForFunction(() => !BO.busy && BO.out, null, {timeout: 30000}).then(() => true, () => false);
  if (!done) errs.push('build optimal : calcul non terminé après 30 s');
  else {
    const st = await page.evaluate(() => ({n: document.querySelectorAll('#boOut [data-boap]').length, skip: BO.out.res.filter(r => r.skip).length, lt: window.__lt && Math.max(0, ...window.__lt)}));
    if (st.lt === null) errs.push('build optimal : tâches longues non mesurables (PerformanceObserver « longtask » absent)');
    else if (st.lt > LONGTASK) errs.push(`build optimal : tâche longue de ${Math.round(st.lt)} ms (page figée)`);
    if (st.n + st.skip !== 6 || st.n < 1) errs.push(`build optimal : ${st.n} résultats, ${st.skip} familles non calculées`);
    console.log(`  build optimal (${w} px, ${scheme}) : ${Date.now() - t0} ms, plus longue tâche ${Math.round(st.lt || 0)} ms${st.skip ? `, ${st.skip} familles sautées (temps)` : ''}`);
    await page.click('#boOut details summary');
  }
  await overflow(page, w, 'build optimal', errs);
  // « Appliquer » (famille Mêlée deux mains) : l'arme 1 du build devient celle du résultat, et la carte garde ses résultats (+0 % pour cette famille)
  if (done && await page.$('#boOut [data-boap="m2"]')) {
    const want = await page.evaluate(() => BO.out.res.find(r => r.fk === 'm2').w.id);
    await page.click('#boOut [data-boap="m2"]');
    const ok = await page.waitForFunction(id => document.querySelector('#slot-w1').value === id, want, {timeout: 3000}).then(() => true, () => false);
    if (!ok) errs.push('« Appliquer » n\'a pas équipé l\'arme du build optimal');
    await page.waitForTimeout(80);
    if (!/\+0 %<\/b> de dégâts, \+0 PV/.test(await page.innerHTML('#boOut'))) errs.push('après « Appliquer », la carte ne montre plus les résultats (+0 % attendu)');
  }
  // Une capture par disposition (Théoricien = capture principale) ; panneaux ouverts dans l'ordre ; aucun débordement ; accordéon : au plus un déplié
  for (const k of ['theo', 'combat', 'mini', 'all']) {
    await dispo(page, k); await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(k === 'theo' ? 250 : 80);
    await page.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove())); // capture sans les messages
    if ((await openList(page)).join() !== DISPO[k].join()) errs.push(`${k} : panneaux ouverts ${(await openList(page)).join()}`);
    if (phone && (await shownList(page)).length > 1) errs.push(`${k} : accordéon à ${(await shownList(page)).length} panneaux dépliés`);
    await overflow(page, w, 'disposition ' + k, errs);
    errs.push(...(await ariaErrs(page)).map(e => `ARIA (${k}) : ` + e));
    await page.screenshot({path: join(root, `tests/screenshots/${w}-${scheme}${k === 'theo' ? '' : '-' + k}.png`), fullPage: true});
  }
  // Mode Organiser : capture (Tout), cibles ≥ 44 px au téléphone, aucun débordement
  await page.click('#org'); await page.waitForTimeout(60);
  if (phone) { const s = await smallTargets(page); if (s.length) errs.push('Organiser, cibles < 44 px : ' + s.join(', ')); }
  await overflow(page, w, 'Organiser', errs);
  await page.screenshot({path: join(root, `tests/screenshots/${w}-${scheme}-organiser.png`), fullPage: false});
  await page.click('#orgDone');
  const name = `tests/screenshots/${w}-${scheme}.png`;
  console.log(errs.length ? '✗' : '✓', name, errs.join(' | '));
  fail += errs.length; await page.close();
}
// Mode Organiser (bureau) : boutons, taille L, Monter (focus gardé), Fermer (focus sur le rail), « Ma disposition » retenue après rechargement ; mémoire illisible → Théoricien
{
  const page = await browser.newPage({viewport: {width: 1300, height: 900}});
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(url); await page.waitForTimeout(500);
  if (await page.isVisible('#po-eq') || !await page.isVisible('#pf-eq')) errs.push('lecture : commandes d\'organisation visibles ou Replier absent');
  await page.click('#org'); await page.waitForTimeout(40);
  if (await page.getAttribute('#org', 'aria-pressed') !== 'true' || !await page.isVisible('#orgDone') || !await page.isVisible('#po-eq') || await page.isVisible('#pf-eq')) errs.push('Organiser : état des boutons');
  await page.click('#ps-eq-L'); await page.waitForTimeout(40);
  const wd = await page.evaluate(() => [document.querySelector('#p-eq').getBoundingClientRect().width, document.querySelector('#p-fiche').getBoundingClientRect().width]);
  if (!(wd[0] > wd[1] * 1.8)) errs.push(`taille L : Équipement pas sur deux colonnes (${Math.round(wd[0])} px)`);
  if (await page.getAttribute('#ps-eq-L', 'aria-pressed') !== 'true') errs.push('taille L non marquée (aria-pressed)');
  await page.click('#pu-calc'); await page.waitForTimeout(40);
  const mv = await page.evaluate(() => ({o: [...document.querySelectorAll('#pgrid > .pnl')].filter(p => !p.hidden).map(p => p.id.slice(2)).join(), f: document.activeElement.id}));
  if (mv.o !== 'tree,fiche,calc,eq') errs.push('Monter : ordre ' + mv.o);
  if (mv.f !== 'pu-calc') errs.push('Monter : focus sur ' + mv.f);
  await page.click('#px-fiche'); await page.waitForTimeout(40);
  const cl = await page.evaluate(() => ({h: document.querySelector('#p-fiche').hidden, r: document.querySelector('#r-fiche').getAttribute('aria-pressed'), f: document.activeElement.id, d: document.querySelector('#dispo').value}));
  if (!cl.h || cl.r !== 'false') errs.push('Fermer : panneau encore affiché');
  if (cl.f !== 'r-fiche') errs.push('Fermer : focus sur ' + cl.f + ' au lieu du rail');
  if (cl.d !== 'mine') errs.push('changement manuel : « Ma disposition » non choisie (' + cl.d + ')');
  await page.click('#orgDone'); await page.waitForTimeout(40);
  if (await page.getAttribute('#org', 'aria-pressed') !== 'false' || await page.isVisible('#po-eq')) errs.push('Terminé : Organiser pas quitté');
  if (await page.evaluate(() => document.activeElement.id) !== 'org') errs.push('Terminé : focus pas rendu à Organiser');
  // Replier au clavier (Entrée) : aria-expanded, corps caché
  await page.focus('#pf-calc'); await page.keyboard.press('Enter'); await page.waitForTimeout(40);
  if (await page.getAttribute('#pf-calc', 'aria-expanded') !== 'false' || await page.isVisible('#optBody')) errs.push('Replier au clavier sans effet');
  await page.keyboard.press('Enter'); await page.waitForTimeout(40);
  await page.reload(); await page.waitForTimeout(500);
  const re = await page.evaluate(() => ({d: document.querySelector('#dispo').value, o: [...document.querySelectorAll('#pgrid > .pnl')].filter(p => !p.hidden).map(p => p.id.slice(2)).join(), s: document.querySelector('#p-eq').dataset.size}));
  if (re.d !== 'mine' || re.o !== 'tree,calc,eq' || re.s !== 'L') errs.push(`« Ma disposition » non retenue après rechargement (${re.d}, ${re.o}, ${re.s})`);
  await dispo(page, 'combat'); await dispo(page, 'mine');
  if ((await openList(page)).join() !== 'tree,calc,eq') errs.push('« Ma disposition » perdue après une disposition prête');
  await page.click('#r-def'); await page.waitForTimeout(80);
  if (!await page.isVisible('#defOut') || await page.getAttribute('#r-def', 'aria-pressed') !== 'true') errs.push('rail : Défense non rouverte ou non rendue');
  await page.evaluate(k => localStorage.setItem(k, '{oups'), LSK); await page.reload(); await page.waitForTimeout(500);
  if (await page.inputValue('#dispo') !== 'theo' || (await openList(page)).join() !== DISPO.theo.join()) errs.push('mémoire illisible : Théoricien attendu');
  if (await page.evaluate(() => location.hash) !== '') errs.push('un panneau a écrit dans l\'adresse');
  console.log(errs.length ? '✗' : '✓', 'Organiser : taille, ordre, fermeture, « Ma disposition » retenue', errs.join(' | '));
  fail += errs.length; await page.close();
}
// Téléphone : accordéon (un seul déplié), barre basse (Réglages → #lvl, Cible → #oEnemy, Plus → Défense), Échap ferme « Plus »
{
  const page = await browser.newPage({viewport: {width: 400, height: 800}});
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(url); await page.waitForTimeout(500);
  await page.click('#pf-eq'); await page.waitForTimeout(60);
  if ((await shownList(page)).join() !== 'eq') errs.push('accordéon : déplier Équipement → ' + (await shownList(page)).join());
  await page.click('#pf-eq'); await page.waitForTimeout(60);
  if ((await shownList(page)).length) errs.push('accordéon : replier le seul déplié → ' + (await shownList(page)).join());
  for (const [b, k, f] of [['#bb-reg', 'tree', 'lvl'], ['#bb-cible', 'calc', 'oEnemy'], ['#bb-eq', 'eq', 'pf-eq'], ['#bb-tree', 'tree', 'pf-tree']]) {
    await page.click(b); await page.waitForTimeout(80);
    const st = await page.evaluate(() => { const a = document.activeElement, r = a.getBoundingClientRect(), t = document.querySelector('#pBar').getBoundingClientRect().bottom, bb = document.querySelector('#bbar').getBoundingClientRect().top; return {f: a.id, vis: r.top >= t - 1 && r.bottom <= bb + 1}; });
    if ((await shownList(page)).join() !== k) errs.push(`${b} : déplié ${(await shownList(page)).join()} au lieu de ${k}`);
    if (st.f !== f) errs.push(`${b} : focus sur ${st.f} au lieu de ${f}`); else if (!st.vis) errs.push(`${b} : focus caché par une barre`);
  }
  if (await page.inputValue('#dispo') !== 'theo') errs.push('accordéon : la disposition a changé');
  await page.click('#bb-plus'); await page.waitForTimeout(40);
  if (!await page.isVisible('#bmore') || await page.getAttribute('#bb-plus', 'aria-expanded') !== 'true') errs.push('« Plus » ne s\'ouvre pas');
  if (await page.evaluate(() => document.activeElement.id) !== 'bm-fiche') errs.push('« Plus » ouvert : focus pas sur le premier choix');
  await page.screenshot({path: join(root, 'tests/screenshots/400-plus.png')});
  await page.click('#bm-def'); await page.waitForTimeout(80);
  if ((await shownList(page)).join() !== 'def' || await page.isVisible('#bmore')) errs.push('Plus → Défense : ' + (await shownList(page)).join());
  if (!/coups avant K\.O\./.test(await page.textContent('#defOut').catch(() => ''))) errs.push('Défense ouverte depuis « Plus » mais vide');
  await page.click('#bb-plus'); await page.keyboard.press('Escape'); await page.waitForTimeout(40);
  if (await page.isVisible('#bmore') || await page.evaluate(() => document.activeElement.id) !== 'bb-plus') errs.push('Échap : « Plus » reste ouvert ou focus perdu');
  // Passage téléphone → bureau : la grille revient (disposition d'origine, tout déplié)
  await page.setViewportSize({width: 1300, height: 900}); await page.waitForTimeout(120);
  if ((await shownList(page)).join() !== 'tree,fiche,eq,calc,def') errs.push('retour bureau : ' + (await shownList(page)).join());
  console.log(errs.length ? '✗' : '✓', 'téléphone : accordéon et barre basse', errs.join(' | '));
  fail += errs.length; await page.close();
}
// Build optimal pendant le calcul : un détail ouvert reste ouvert ; « Arrêter » cliqué lentement à la souris (appui puis relâché 150 ms plus tard) arrête bien
{
  const page = await browser.newPage({viewport: {width: 1300, height: 900}});
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(url); await page.waitForTimeout(600);
  await page.selectOption('#preset', {label: 'Barbare deux mains'}); await page.waitForTimeout(100);
  await show(page, 'bo');
  await page.click('#boGo');
  const first = await page.waitForFunction(() => BO.busy && BO.part && document.querySelector('#boOut details'), null, {timeout: 20000}).then(() => true, () => false);
  if (!first) errs.push('aucune famille affichée pendant le calcul');
  else {
    const fk = await page.evaluate(() => { const d = document.querySelector('#boOut details'); d.open = true; return d.dataset.fk; });
    await page.waitForFunction(() => BO.part && BO.part.res.length >= 2, null, {timeout: 20000}).catch(() => {});
    if (!await page.evaluate(k => { const d = document.querySelector(`#boOut details[data-fk="${k}"]`); return !!(d && d.open); }, fk)) errs.push('le détail ouvert se referme quand une famille se termine');
    if (await page.$('#boOut [data-boap]')) errs.push('bouton « Appliquer » actif pendant le calcul');
    const box = await (await page.$('#boStop')).boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.waitForTimeout(150); await page.mouse.up();
    await page.waitForTimeout(100);
    const st = await page.evaluate(() => ({busy: BO.busy, stop: BO.stop, txt: document.querySelector('#boOut').textContent}));
    if (st.busy || !st.stop) errs.push('« Arrêter » (clic lent) n\'a pas arrêté le calcul');
    else if (!/Calcul arrêté avant la fin/.test(st.txt)) errs.push('arrêt non signalé à l\'écran');
  }
  console.log(errs.length ? '✗' : '✓', 'build optimal : détails ouverts et « Arrêter » pendant le calcul', errs.join(' | '));
  fail += errs.length; await page.close();
}
// Graphe caché au démarrage (disposition retenue : Combat, Arbre fermé) : à sa 1re ouverture (rail), canvas à la taille du panneau, tracé cadré et dessiné
for (const w of [1300, 400]) {
  const ctx = await browser.newContext({viewport: {width: w, height: 900}});
  await ctx.addInitScript(k => { try { if (!sessionStorage.getItem('vu')) { localStorage.setItem(k, '{"v":1,"preset":"combat"}'); sessionStorage.setItem('vu', '1'); } } catch (e) {} }, LSK);
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(url); await page.waitForTimeout(600);
  if (await page.isVisible('#gcv')) errs.push('graphe visible alors que la disposition Combat est retenue');
  if (w < 640) await page.click('#bb-tree'); else await page.click('#r-tree');
  await page.locator('#gwrap').scrollIntoViewIfNeeded();
  // dessiné = le pixel d'un nœud (Mage, au centre de son disque) diffère du fond (le fond seul remplit déjà tout le canvas)
  const drawn = await page.waitForFunction(() => { const cv = document.querySelector('#gcv'), d = Math.min(2, devicePixelRatio || 1), c = cv.getContext('2d'), [x, y] = window.G.screen(window.G.nodes.find(n => n.id === 'wizard'));
    const at = (x, y) => [...c.getImageData(Math.round(x * d), Math.round(y * d), 1, 1).data].join(); return cv.width > 0 && at(x, y) !== at(2, 2); }, null, {timeout: 3000}).then(() => true, () => false);
  const g = await page.evaluate(() => { const cv = document.querySelector('#gcv'), r = document.querySelector('#gwrap').getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
    const out = window.G.nodes.filter(n => n.kind !== 'hub').filter(n => { const [x, y] = window.G.screen(n); return x < 0 || y < 0 || x > r.width || y > r.height; }).length;
    return {cw: cv.width, want: Math.round(r.width * d), out}; });
  if (!g.cw || Math.abs(g.cw - g.want) > 1) errs.push(`canvas ${g.cw}px de large au lieu de ${g.want}px`);
  if (g.out) errs.push(`${g.out} nœuds hors du cadre à la première ouverture`);
  if (!drawn) errs.push('graphe non dessiné à la première ouverture (nœud de la couleur du fond)');
  console.log(errs.length ? '✗' : '✓', `graphe caché au démarrage puis ouvert (${w} px)`, errs.join(' | '));
  fail += errs.length; await ctx.close();
}
// Cas limites (revue QA) : build optimal qui survit au repli, à la fermeture et aux dispositions, barre de cible dans le Calculateur, plan gardé,
// passage A → B, cases à cocher, « Comparer » sans fiche affichée, défilement de Tables gardé, Entrée sur un ennemi, arrêt dit, messages empilés
{
  const page = await browser.newPage({viewport: {width: 1300, height: 900}});
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  const toasts = () => page.textContent('#toasts');
  await page.goto(url); await page.waitForTimeout(500);
  await page.selectOption('#preset', {label: 'Barbare deux mains'}); await page.waitForTimeout(80);
  await dispo(page, 'all'); await page.click('#boGo');
  await page.click('#pf-bo'); await page.click('#pf-bo'); await page.click('#r-bo'); await dispo(page, 'combat'); await dispo(page, 'all');
  const fin = await page.waitForFunction(() => !BO.busy && BO.out, null, {timeout: 30000}).then(() => true, () => false);
  if (!fin || await page.evaluate(() => BO.stop)) errs.push('build optimal arrêté par un repli, une fermeture ou une disposition');
  else if (!await page.$('#boOut [data-boap]')) errs.push('build optimal : résultats absents après les changements de panneaux');
  if (!await page.isVisible('#p-calc #oEnemy') || !await page.isVisible('#p-calc .ofam')) errs.push('choix de la cible absent du Calculateur (Tout)');
  if (!/Cible : .*Calculateur/.test(await page.textContent('#boTgtNote').catch(() => ''))) errs.push('Build optimal : origine de la cible non dite');
  await page.click('#pf-calc'); await page.waitForTimeout(60);
  if (!await page.isVisible('#p-bo #oEnemy') || await page.isVisible('#p-bo .ofam') || await page.isVisible('#boTgtNote')) errs.push('Calculateur replié : choix de la cible absent de Build optimal (ou « Armes à classer » affiché)');
  await page.click('#pf-calc'); await page.waitForTimeout(60);
  await page.fill('#planN', '30'); await page.click('#planGo'); await page.waitForTimeout(150);
  if (!await page.$('#planApply')) errs.push('plan de test vide (30 points)');
  else { await page.click('#pf-calc'); await page.click('#pf-calc'); await page.waitForTimeout(60); if (!await page.$('#planApply')) errs.push('plan « Répartir au mieux » perdu en repliant le Calculateur'); }
  await page.click('#buildTabs .tab:nth-child(2)'); await page.waitForTimeout(80);
  if (!/^Build B/.test(await page.textContent('#defFor'))) errs.push('Défense : en-tête pas passé au build B');
  const cw = await page.evaluate(() => Math.max(...[...document.querySelectorAll('.dform input[type="checkbox"]')].map(c => c.getBoundingClientRect().width)));
  if (cw > 24) errs.push(`cases à cocher de la Défense étirées (${Math.round(cw)} px)`);
  await page.click('#pf-fiche'); await page.click('#cmp'); await page.waitForTimeout(30);
  if (!/Comparaison A et B .*panneau Fiche/.test(await toasts())) errs.push('« Comparer A et B », fiche repliée : aucun message');
  await page.click('#cmp'); await page.click('#pf-fiche');
  await page.evaluate(() => { document.querySelector('.mxs').scrollTop = 600; });
  await page.click('#buildTabs .tab:nth-child(1)'); await page.waitForTimeout(80);
  const st = await page.evaluate(() => document.querySelector('.mxs').scrollTop);
  if (st < 590) errs.push(`table des ennemis remise en haut (${st} px) après A/B`);
  await page.click('#pf-calc'); await page.waitForTimeout(40); // Calculateur replié : Entrée sur un ennemi le déplie
  await page.focus('#mxBody button[data-en="7"]'); await page.keyboard.press('Enter'); await page.waitForTimeout(80);
  const k2 = await page.evaluate(() => ({f: document.activeElement.id, s: !document.querySelector('#pb-calc').hidden, e: document.querySelector('#oEnemy').value, top: Math.round(document.querySelector('#p-calc').getBoundingClientRect().top), bar: Math.round(document.querySelector('#pBar').getBoundingClientRect().bottom)}));
  if (k2.f !== 'pf-calc' || !k2.s || k2.e !== '7') errs.push(`Entrée sur un ennemi : focus ${k2.f}, Calculateur déplié ${k2.s}, cible ${k2.e}`);
  if (k2.top < k2.bar) errs.push(`haut du calculateur caché sous la barre collée (${k2.top}px < ${k2.bar}px)`);
  if (!await page.isVisible('#p-calc .ofam')) errs.push('choix de la cible absent du Calculateur après un clic dans Tables');
  await page.click('#boGo'); await page.click('#pf-bo');
  await page.click('#buildTabs .tab:nth-child(2)'); await page.waitForTimeout(150);
  const stop = await page.evaluate(() => ({busy: BO.busy, stop: BO.stop}));
  if (stop.busy || !stop.stop) errs.push('passage A → B pendant le calcul : build optimal non arrêté');
  if (!/build optimal arrêté/i.test(await toasts())) errs.push('build optimal arrêté, panneau replié : aucun message');
  await page.evaluate(() => { toast('Premier message'); toast('Second message'); });
  const ov = await page.evaluate(() => { const r = [...document.querySelectorAll('#toasts .toast')].map(t => t.getBoundingClientRect()); return r.length < 2 || r.some((a, i) => r.some((b, j) => i < j && a.top < b.bottom - 1 && b.top < a.bottom - 1)); });
  if (ov) errs.push('messages superposés (ou absents)');
  console.log(errs.length ? '✗' : '✓', 'panneaux : cas limites (calcul, cible, plan, A/B, Tables, clavier, messages)', errs.join(' | '));
  fail += errs.length; await page.close();
}
// Démarrage sur une disposition retenue : contenu des panneaux du calculateur rendu (et, pour Build optimal, calcul qui aboutit)
for (const [k, want] of [['combat', ['optBody', 'defOut']], ['all', ['optBody', 'boGo', 'defOut', 'mxBody']]]) {
  const ctx = await browser.newContext({viewport: {width: 1300, height: 900}});
  await ctx.addInitScript(([key, k]) => { try { if (!sessionStorage.getItem('vu')) { localStorage.setItem(key, JSON.stringify({v: 1, preset: k})); sessionStorage.setItem('vu', '1'); } } catch (e) {} }, [LSK, k]);
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(url); await page.waitForTimeout(600);
  if (await page.inputValue('#dispo') !== k) errs.push('disposition retenue non reprise');
  for (const id of want) if (!(await page.evaluate(id => { const e = document.getElementById(id); return e && e.offsetParent !== null && e.innerHTML.length > 20 || (e && e.tagName === 'BUTTON' && e.offsetParent !== null); }, id))) errs.push('#' + id + ' vide ou caché');
  if (k === 'all') { await page.click('#boGo'); if (!await page.waitForFunction(() => !BO.busy && BO.out && document.querySelector('#boOut [data-boap]'), null, {timeout: 30000}).then(() => true, () => false)) errs.push('Build optimal : calcul sans résultat'); }
  console.log(errs.length ? '✗' : '✓', 'démarrage sur la disposition ' + k, errs.join(' | '));
  fail += errs.length; await ctx.close();
}
// Zoom de l'utilisateur gardé et canvas recalé quand la fenêtre change pendant que l'Arbre est replié
{
  const page = await browser.newPage({viewport: {width: 1300, height: 900}});
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(url); await page.waitForTimeout(500);
  await page.locator('#gwrap').scrollIntoViewIfNeeded();
  const box = await page.locator('#gcv').boundingBox();
  await page.mouse.move(box.x + box.width / 3, box.y + box.height / 3); await page.mouse.wheel(0, -500); await page.waitForTimeout(120);
  const cam = () => page.evaluate(() => { const n = window.G.nodes.find(x => x.id === 'wizard'), r = document.querySelector('#gwrap').getBoundingClientRect(), [x, y] = window.G.screen(n), cv = document.querySelector('#gcv');
    return {dx: x - r.width / 2, dy: y - r.height / 2, cw: cv.width, want: Math.round(r.width * Math.min(2, devicePixelRatio || 1))}; });
  const a = await cam();
  await page.click('#pf-tree'); await page.setViewportSize({width: 1100, height: 800}); await page.waitForTimeout(120); await page.click('#pf-tree'); await page.waitForTimeout(150);
  const b = await cam();
  if (Math.abs(a.dx - b.dx) > 1 || Math.abs(a.dy - b.dy) > 1) errs.push(`zoom ou cadrage perdu en repliant l'Arbre (${Math.round(a.dx)},${Math.round(a.dy)} → ${Math.round(b.dx)},${Math.round(b.dy)})`);
  if (Math.abs(b.cw - b.want) > 1) errs.push(`canvas pas recalé à la nouvelle taille (${b.cw} px au lieu de ${b.want})`);
  await page.click('#org'); await page.click('#ps-tree-M'); await page.waitForTimeout(150); // taille L → M : l'observateur du panneau recale le canvas
  const c = await cam(); if (Math.abs(c.cw - c.want) > 1) errs.push(`taille L → M : canvas pas recalé (${c.cw} px au lieu de ${c.want})`);
  console.log(errs.length ? '✗' : '✓', 'graphe : zoom gardé, canvas recalé (repli, fenêtre, taille)', errs.join(' | '));
  fail += errs.length; await page.close();
}
// Stockage du navigateur bloqué (accès à localStorage interdit) : aucune erreur, Théoricien, panneaux utilisables, « Enregistrer » le dit
{
  const ctx = await browser.newContext({viewport: {width: 1300, height: 900}});
  await ctx.addInitScript(() => { Object.defineProperty(window, 'localStorage', {configurable: true, get() { throw new DOMException('bloqué', 'SecurityError'); }}); });
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(url); await page.waitForTimeout(500);
  if (await page.evaluate(() => { try { localStorage; return 'accessible'; } catch (e) { return ''; } })) errs.push('blocage du stockage non simulé');
  if (await page.inputValue('#dispo') !== 'theo') errs.push('Théoricien attendu');
  for (const k of ['combat', 'mini', 'all']) await dispo(page, k);
  await page.click('#org'); await page.click('#pd-tree'); await page.click('#px-tab'); await page.click('#orgDone'); await page.click('#r-tab');
  if (await page.inputValue('#dispo') !== 'mine') errs.push('« Ma disposition » non choisie (stockage bloqué)');
  errs.push(...(await ariaErrs(page)).map(e => 'ARIA : ' + e));
  await page.click('#save'); await page.waitForTimeout(50);
  if (!/Enregistrement impossible/.test(await page.textContent('#toasts'))) errs.push('« Enregistrer » sans message');
  console.log(errs.length ? '✗' : '✓', 'stockage bloqué', errs.join(' | '));
  fail += errs.length; await ctx.close();
}
// Tracé réel : après « Réorganiser », chaque nœud revient exactement à sa position du jeu (mouvement normal puis réduit)
const home = page => page.evaluate(() => window.G.nodes.every(n => n.kind === 'hub' || (n.x === n.ax && n.y === n.ay)));
for (const motion of ['no-preference', 'reduce']) {
  const page = await browser.newPage({viewport: {width: 1300, height: 900}, reducedMotion: motion});
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(url); await page.waitForTimeout(500);
  if (!await home(page)) errs.push('nœuds hors de leur position réelle au chargement');
  await page.click('#gShake'); await page.waitForTimeout(motion === 'reduce' ? 100 : 2500);
  if (!await home(page)) errs.push('nœuds pas revenus à leur position réelle après « Réorganiser »');
  // glisser un nœud puis le relâcher : il doit s'être déplacé, puis revenir exactement à sa place
  await page.locator('#gwrap').scrollIntoViewIfNeeded();
  const pt = await page.evaluate(() => { const n = window.G.nodes.find(x => x.id === 'wizard'); const [x, y] = window.G.screen(n); const r = document.querySelector('#gcv').getBoundingClientRect(); return [r.left + x, r.top + y]; });
  await page.mouse.move(pt[0], pt[1]); await page.mouse.down(); await page.mouse.move(pt[0] + 60, pt[1] + 40, {steps: 6});
  if (await home(page)) errs.push('le glisser ne déplace pas le nœud');
  await page.mouse.up(); await page.waitForTimeout(motion === 'reduce' ? 100 : 2500);
  if (!await home(page)) errs.push('nœud glissé pas revenu à sa position réelle');
  console.log(errs.length ? '✗' : '✓', 'retour au tracé réel (' + motion + ')', errs.join(' | '));
  fail += errs.length; await page.close();
}
// Lien d'avant le tracé réel (code b2 figé de share.test.js) : fenêtre de migration, puis l'adresse passe en b3 et ne bouge plus avec les panneaux
{
  const REF_B2 = 'b2-1e360b05-0k0l0m0n0o2e2o1618-4do28ek0pq2n-0000001000000000000000110000000110000110010000001100100000010000000000000000000000000000000000000000000000000000000000001033011300013110101110111103030303130000100303111011-g0l0g';
  const page = await browser.newPage({viewport: {width: 1300, height: 900}});
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(url + '#' + REF_B2); await page.waitForTimeout(700);
  const txt = await page.textContent('.modal .box').catch(() => '');
  if (!/d'avant le tracé réel/.test(txt || '')) errs.push('fenêtre de migration absente');
  const h = await page.evaluate(() => location.hash);
  if (!/^#b3-/.test(h)) errs.push('adresse non passée en b3 : ' + h.slice(0, 12));
  const name = 'tests/screenshots/migration-b2.png';
  await page.screenshot({path: join(root, name)});
  await page.click('.modal #mok');
  for (const k of ['combat', 'mini', 'all', 'theo']) await dispo(page, k);
  await page.click('#pf-eq'); await page.click('#r-def');
  if (await page.evaluate(() => location.hash) !== h) errs.push('le code de partage de l\'adresse a changé avec les panneaux');
  console.log(errs.length ? '✗' : '✓', name, errs.join(' | '));
  fail += errs.length; await page.close();
}
await browser.close();
process.exit(fail ? 1 : 0);
