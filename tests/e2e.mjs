// Test navigateur (optionnel) : nécessite Playwright.
//   npm i -D playwright && npx playwright install chromium
//   node tests/e2e.mjs            → captures dans tests/screenshots/ (clair / sombre × 1 300 / 400 px, A contre B, vue Liste, objectifs optimisés, lien b2)
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
const shot = n => join(root, 'tests/screenshots/' + n + '.png');
const report = (ok, what, errs) => { console.log(errs.length ? '✗' : '✓', what, errs.join(' | ')); fail += errs.length; };
const overflow = async (page, w, what, errs) => { const sw = await page.evaluate(() => document.documentElement.scrollWidth); if (sw > w) errs.push(`débordement horizontal (${what}) : ${sw}px > ${w}px`); };
// Graphe dessiné : canvas à la taille du cadre et pas d'une seule couleur
const drawn = page => page.evaluate(() => { const c = document.querySelector('#gcv'); if (!c.width || !c.height) return false;
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; const s = new Set(); for (let i = 0; i < d.length; i += 4 * 97) s.add(d[i] + ',' + d[i + 1] + ',' + d[i + 2]); return s.size > 3; });
// Cibles tactiles (téléphone) : boutons et menus de la page ≥ 44 px de haut
const smallTargets = page => page.evaluate(() => [...document.querySelectorAll('.toolbar button, .toolbar select, .steps button, .acts button, .acts select, .gsel select, .gemrow select, .pstep, .viewsw button, .area')]
  .filter(e => e.offsetParent !== null && e.getBoundingClientRect().height < 44 && !e.closest('.viewsw') && !e.classList.contains('area')).map(e => e.id || e.className));
// Tâches longues (calcul d'un combo) : relevées par PerformanceObserver
const watchLong = page => page.evaluate(() => { window.__long = []; new PerformanceObserver(l => { for (const e of l.getEntries()) window.__long.push(Math.round(e.duration)); }).observe({type: 'longtask', buffered: false}); });
const longs = page => page.evaluate(() => (window.__long || []).filter(Boolean));

// Captures : clair / sombre × 1 300 / 400 px ; A contre B ; vue Liste (bureau)
for (const w of [1300, 400]) for (const scheme of ['light', 'dark']) {
  const page = await browser.newPage({viewport: {width: w, height: 900}, colorScheme: scheme});
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(url); await page.waitForTimeout(500);
  await overflow(page, w, 'chargement', errs);
  if (!await drawn(page)) errs.push('graphe non dessiné');
  if (!/Tank \(d'après Sadi Fourbe\)/.test(await page.textContent('#why'))) errs.push('explication du build A absente');
  if (await page.inputValue('#goal1') !== 'tank' || await page.inputValue('#goal2') !== 'healer') errs.push('objectifs du build A au démarrage');
  if (w === 400) { const s = await smallTargets(page); if (s.length) errs.push('cibles < 44 px : ' + s.join(', ')); }
  await page.screenshot({path: shot(`${w}-${scheme}`), fullPage: true});
  // Fil des étapes : l'étape 5 descend au panneau « Enregistrez, partagez, comparez », sans toucher l'adresse
  await page.click('.steps [data-go="p-keep"]'); await page.waitForTimeout(700);
  if (!await page.evaluate(() => { const r = document.querySelector('#p-keep').getBoundingClientRect(); return r.top >= -2 && r.top < innerHeight; })) errs.push('étape 5 : panneau hors de vue');
  if (await page.evaluate(() => document.activeElement && document.activeElement.id) !== 'h-keep') errs.push('étape 5 : focus absent du titre');
  if (/#p-/.test(page.url())) errs.push('étape 5 : hash modifié');
  await page.evaluate(() => scrollTo(0, 0));
  await page.click('#cmp'); await page.waitForTimeout(80);
  if (await page.isHidden('#p-cmp')) errs.push('A contre B caché après « Comparer »');
  if (!/Mage critique \(baguette\) \+ Mage de foudre/.test(await page.textContent('#cmpBody'))) errs.push('A contre B : objectifs de B absents');
  await overflow(page, w, 'A contre B', errs);
  await page.locator('#p-cmp').screenshot({path: shot(`${w}-${scheme}-ab`)});
  if (w === 1300) { await page.click('#vList'); await page.waitForTimeout(80);
    if (await page.locator('#nodes .node').count() < 100) errs.push('vue Liste : compétences absentes');
    await page.locator('#p-tree').screenshot({path: shot(`${w}-${scheme}-liste`)}); }
  report(!errs.length, `captures ${w} px ${scheme}`, errs); await page.close();
}

// Objectifs : choix du principal et du secondaire, niveau, Flamme ; temps de calcul ; nœud imposé verrouillé (vue Liste)
{
  const page = await browser.newPage({viewport: {width: 1300, height: 900}});
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(url); await page.waitForTimeout(400); await watchLong(page);
  for (const [p, s] of [['archer', ''], ['necro', 'fire'], ['paladin', 'sword'], ['', '']]) {
    await page.selectOption('#goal1', p); await page.waitForTimeout(30); if (p) { await page.selectOption('#goal2', s); await page.waitForTimeout(30); } }
  await page.selectOption('#goal1', 'ice'); await page.selectOption('#goal2', 'storm');
  for (const v of ['20', '35', '50']) { await page.fill('#lvl', v); await page.press('#lvl', 'Tab'); await page.waitForTimeout(30); }
  for (let i = 0; i < 4; i++) await page.click('#flameDn'); await page.click('#flameUp');
  const why = await page.textContent('#why');
  if (!/Mage de glace \(contrôle\)/.test(why) || !/Mage de foudre \(baguette\)/.test(why)) errs.push('explication : objectifs choisis absents');
  if (!/Résultat/.test(why)) errs.push('ligne Résultat absente');
  const lt = (await longs(page)).filter(d => d > LONGTASK); if (lt.length) errs.push(`tâches longues > ${LONGTASK} ms : ${lt.join(', ')}`);
  await page.click('#vList'); await page.fill('#q', 'Homme de glace'); await page.waitForTimeout(80);
  const st = await page.evaluate(() => { const n = document.querySelector('#nodes .node'); return n ? [n.querySelector('.imp') ? 1 : 0, n.querySelector('.step button').disabled] : null; });
  if (!st || !st[0] || !st[1]) errs.push('nœud imposé : « imposé » ou « − » désactivé absents de la vue Liste');
  await page.fill('#lvl', '12'); await page.press('#lvl', 'Tab'); await page.waitForTimeout(50);
  if (!/il manque \d+ pts? pour/.test(await page.textContent('#why'))) errs.push('niveau 12 : étape en partie non signalée');
  await page.evaluate(() => { const d = document.querySelector('#why details.part') || document.querySelector('#why details'); d.open = true; document.querySelector('#why details').open = true; });
  await page.locator('#why').screenshot({path: shot('1300-pourquoi')});
  // 2.1.0 : 3e objectif « Soutien » (derniers points), gardé au changement de principal, partagé par le lien
  await page.fill('#lvl', '50'); await page.press('#lvl', 'Tab'); await page.selectOption('#goal1', 'archer'); await page.selectOption('#goal2', ''); await page.selectOption('#goal3', 'resist'); await page.waitForTimeout(50);
  const w3 = await page.textContent('#why'); if (!/Soutien/.test(w3) || !/Résistances élémentaires/.test(w3)) errs.push('soutien absent de « Pourquoi ce combo »');
  if (!/-o03zz[0-9a-z]{2}-/.test(await page.evaluate(() => encode(B())))) errs.push('soutien absent du code de partage');
  await page.evaluate(() => { for (const d of document.querySelectorAll('#why .wgoal:last-of-type details')) d.open = true; });
  await page.locator('#why').screenshot({path: shot('1300-soutien')});
  await page.selectOption('#goal1', ''); await page.waitForTimeout(50);
  if (!(await page.isDisabled('#goal3'))) errs.push('arbre libre : menu Soutien actif');
  if (!/Arbre libre/.test(await page.textContent('#toasts'))) errs.push('arbre libre : aucun message');
  report(!errs.length, 'objectifs (menus, réglages, temps, verrou)', errs); await page.close();
}

// 2.3.0 : un ajout avec objectif recalcule le combo (double-clic dans le graphe) ; message, temps, « vos ajouts », lien avec -a rouvert à l'identique
{
  const page = await browser.newPage({viewport: {width: 1300, height: 900}});
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(url); await page.waitForTimeout(400);
  await page.selectOption('#goal1', 'mageCrit'); await page.selectOption('#goal2', ''); await page.selectOption('#goal3', '');
  for (const [f, v] of [['#lvl', '40'], ['#exp', '2']]) { await page.fill(f, v); await page.press(f, 'Tab'); } await page.waitForTimeout(80);
  if (await page.evaluate(() => budget(B())) !== 80) errs.push('budget de 80 points non réglé');
  await page.locator('#gwrap').scrollIntoViewIfNeeded(); await page.waitForTimeout(80); await watchLong(page);
  const pt = await page.evaluate(() => { const n = window.G.nodes.find(x => x.id === 'pip:1wwtpca'); const [x, y] = window.G.screen(n); const r = document.querySelector('#gcv').getBoundingClientRect(); return [r.left + x, r.top + y]; });
  await page.mouse.dblclick(pt[0], pt[1]); await page.waitForTimeout(120);
  if (!/Combo recalculé : liaisons 30 pts → 27 pts · \+4 pts sur les étapes/.test(await page.textContent('#toasts'))) errs.push('ajout : pas de message de recalcul');
  const lt = (await longs(page)).filter(d => d > LONGTASK); if (lt.length) errs.push(`tâches longues > ${LONGTASK} ms : ${lt.join(', ')}`);
  const ms = await page.evaluate(() => { const b = B(), t = performance.now(); COMBO.clear(); imposed(b); return performance.now() - t; });
  if (ms > LONGTASK / 2) errs.push(`recalcul en ${Math.round(ms)} ms`); else console.log(`  recalcul du combo avec un ajout, dans le navigateur : ${ms.toFixed(1)} ms`);
  if (!/vos ajouts 1 pt/.test(await page.textContent('#why'))) errs.push('« vos ajouts » absent de « Pourquoi ce combo »');
  await page.evaluate(() => { for (const d of document.querySelectorAll('#why details')) d.open = true; });
  await page.locator('#why').screenshot({path: shot('1300-ajouts')});
  const code = await page.evaluate(() => encode(B())); if (!/-a[0-9a-z]+-[0-9a-z]+-[0-9a-z]{2}$/.test(code)) errs.push('ajouts absents du lien');
  await page.goto(url + '#' + code); await page.reload(); await page.waitForTimeout(500);
  if (await page.evaluate(() => encode(B())) !== code) errs.push('lien avec ajouts rouvert différemment');
  report(!errs.length, 'ajouts avec objectif (2.3.0)', errs); await page.close();
}

// 2.4.0 : objectifs optimisés — groupes du menu, étiquette « communauté », phrase sur l'ordre optimisé, gemmes gardées ; Récolte + Archer
for (const [w, scheme] of [[1300, 'light'], [1300, 'dark'], [400, 'light'], [400, 'dark']]) {
  const page = await browser.newPage({viewport: {width: w, height: 900}, colorScheme: scheme});
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(url); await page.waitForTimeout(400);
  const groups = await page.evaluate(() => [...document.querySelectorAll('#goal1 optgroup')].map(g => g.label));
  if (!groups.includes('Hybrides') || !groups.includes('Exploration et récolte')) errs.push('groupes du menu absents : ' + groups.join(', '));
  await page.selectOption('#goal1', 'battlemage'); await page.selectOption('#goal2', 'storm'); await page.waitForTimeout(60);
  if (!/gemmes inchangées/.test(await page.textContent('#toasts'))) errs.push('message « gemmes inchangées » absent');
  const why = await page.textContent('#why');
  if (!/communauté/.test(why) || !/Battlemage Hybrid/.test(why)) errs.push('source communautaire absente');
  if (!/calculé hors ligne/.test(why)) errs.push('phrase sur l\'ordre optimisé absente');
  await overflow(page, w, 'objectif hybride', errs);
  await page.evaluate(() => { const d = document.querySelector('#why details'); if (d) d.open = true; });
  await page.locator('#why').screenshot({path: shot(`${w}-${scheme}-hybride`)});
  await page.selectOption('#goal1', 'harvest'); await page.selectOption('#goal2', 'archer'); await page.waitForTimeout(60);
  const w2 = await page.textContent('#why'); if (!/Récolte/.test(w2) || !/Archer/.test(w2) || !/Crafter Survivor/.test(w2)) errs.push('Récolte + Archer : explication incomplète');
  await overflow(page, w, 'Récolte', errs);
  if (w === 1300) await page.locator('#why').screenshot({path: shot(`${w}-${scheme}-recolte`)});
  report(!errs.length, `objectifs optimisés ${w} px ${scheme}`, errs); await page.close();
}

// Lien avec objectifs (segment -o) : s'ouvre sur les mêmes objectifs ; un rendu ne change pas l'adresse
{
  const page = await browser.newPage({viewport: {width: 400, height: 900}});
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(url); await page.waitForTimeout(300);
  const code = await page.evaluate(() => encode(goalBuild('assassin', 'archer')));
  await page.goto(url + '#' + code); await page.reload(); await page.waitForTimeout(500);
  if (await page.inputValue('#goal1') !== 'assassin' || await page.inputValue('#goal2') !== 'archer') errs.push('objectifs du lien non repris');
  await page.click('#vList'); await page.click('#vGraph'); await page.selectOption('#goal2', 'sword');
  if (await page.evaluate(() => location.hash.slice(1)) !== code) errs.push('adresse modifiée sans « Partager »');
  await overflow(page, 400, 'lien', errs);
  report(!errs.length, 'lien avec objectifs', errs); await page.close();
}

// Stockage du navigateur bloqué (accès à localStorage interdit) : aucune erreur, « Enregistrer » le dit
{
  const ctx = await browser.newContext({viewport: {width: 1300, height: 900}});
  await ctx.addInitScript(() => { Object.defineProperty(window, 'localStorage', {configurable: true, get() { throw new DOMException('bloqué', 'SecurityError'); }}); });
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(url); await page.waitForTimeout(500);
  if (await page.evaluate(() => { try { localStorage; return 'accessible'; } catch (e) { return ''; } })) errs.push('blocage du stockage non simulé');
  await page.selectOption('#goal1', 'barb'); await page.click('#save'); await page.waitForTimeout(50);
  if (!/Enregistrement impossible/.test(await page.textContent('#toasts'))) errs.push('« Enregistrer » sans message');
  report(!errs.length, 'stockage bloqué', errs); await ctx.close();
}

// Tracé réel : un nœud glissé puis relâché revient exactement à sa position du jeu (mouvement normal puis réduit)
const home = page => page.evaluate(() => window.G.nodes.every(n => n.kind === 'hub' || (n.x === n.ax && n.y === n.ay)));
for (const motion of ['no-preference', 'reduce']) {
  const page = await browser.newPage({viewport: {width: 1300, height: 900}, reducedMotion: motion});
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(url); await page.waitForTimeout(500);
  if (!await home(page)) errs.push('nœuds hors de leur position réelle au chargement');
  await page.locator('#gwrap').scrollIntoViewIfNeeded();
  const pt = await page.evaluate(() => { const n = window.G.nodes.find(x => x.id === 'wizard'); const [x, y] = window.G.screen(n); const r = document.querySelector('#gcv').getBoundingClientRect(); return [r.left + x, r.top + y]; });
  await page.mouse.move(pt[0], pt[1]); await page.mouse.down(); await page.mouse.move(pt[0] + 60, pt[1] + 40, {steps: 6});
  if (await home(page)) errs.push('le glisser ne déplace pas le nœud');
  await page.mouse.up(); await page.waitForTimeout(motion === 'reduce' ? 100 : 2500);
  if (!await home(page)) errs.push('nœud glissé pas revenu à sa position réelle');
  report(!errs.length, 'retour au tracé réel (' + motion + ')', errs); await page.close();
}

// Lien d'avant le tracé réel (code b2 figé de share.test.js) : fenêtre de migration, puis l'adresse passe en b3
{
  const REF_B2 = 'b2-1e360b05-0k0l0m0n0o2e2o1618-4do28ek0pq2n-0000001000000000000000110000000110000110010000001100100000010000000000000000000000000000000000000000000000000000000000001033011300013110101110111103030303130000100303111011-g0l0g';
  const page = await browser.newPage({viewport: {width: 1300, height: 900}});
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(url + '#' + REF_B2); await page.waitForTimeout(700);
  if (!/d'avant le tracé réel/.test(await page.textContent('.modal .box').catch(() => '') || '')) errs.push('fenêtre de migration absente');
  if (!/^#b3-/.test(await page.evaluate(() => location.hash))) errs.push('adresse non passée en b3');
  if (await page.inputValue('#goal1') !== '') errs.push('lien b2 : objectif inattendu');
  await page.screenshot({path: shot('migration-b2')});
  report(!errs.length, 'lien b2', errs); await page.close();
}
await browser.close();
process.exit(fail ? 1 : 0);
