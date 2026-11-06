// Test navigateur (optionnel) : nécessite Playwright.
//   npm i -D playwright && npx playwright install chromium
//   node tests/e2e.mjs            → captures dans tests/screenshots/
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
const SEC = ['tree', 'eq', 'calc', 'bo', 'def', 'tab'];
const tab = async (page, k) => { await page.click('#t-' + k); await page.waitForTimeout(80); };
const overflow = async (page, w, what, errs) => { const sw = await page.evaluate(() => document.documentElement.scrollWidth); if (sw > w) errs.push(`débordement horizontal (${what}) : ${sw}px > ${w}px`); };
// Motif ARIA des onglets : 1 tablist étiquetée, 6 tab, 1 seul sélectionné, chaque tab → son tabpanel (aria-controls / aria-labelledby), tabindex itinérant, seul le panneau choisi visible
const ariaErrs = page => page.evaluate(() => {
  const tl = document.querySelector('#secTabs'), tabs = [...tl.querySelectorAll('[role="tab"]')], bad = [];
  if (tl.getAttribute('role') !== 'tablist' || !tl.getAttribute('aria-label')) bad.push('tablist sans rôle ou sans étiquette');
  if (tabs.length !== 6) bad.push(tabs.length + ' onglets');
  const sel = tabs.filter(t => t.getAttribute('aria-selected') === 'true'); if (sel.length !== 1) bad.push(sel.length + ' onglets sélectionnés');
  for (const t of tabs) { const p = document.getElementById(t.getAttribute('aria-controls')), on = t.getAttribute('aria-selected') === 'true';
    if (!p || p.getAttribute('role') !== 'tabpanel' || p.getAttribute('aria-labelledby') !== t.id) { bad.push('panneau de ' + t.id); continue; }
    if ((p.offsetParent !== null) !== on) bad.push('visibilité de ' + p.id); if (t.tabIndex !== (on ? 0 : -1)) bad.push('tabindex de ' + t.id); }
  return bad; });
for (const [w, scheme] of [[1300, 'light'], [1300, 'dark'], [400, 'light'], [400, 'dark']]) {
  const page = await browser.newPage({viewport: {width: w, height: 900}, colorScheme: scheme});
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto(url); await page.waitForTimeout(900);
  // Débordement horizontal interdit ; onglets : motif ARIA, Arbre ouvert par défaut
  await overflow(page, w, 'Arbre', errs);
  errs.push(...(await ariaErrs(page)).map(e => 'ARIA : ' + e));
  if (await page.getAttribute('#t-tree', 'aria-selected') !== 'true') errs.push('Arbre non ouvert par défaut');
  // Onglets sur une ligne (grand écran) ou 3 × 2 (téléphone)
  const rows = await page.evaluate(() => new Set([...document.querySelectorAll('#secTabs [role="tab"]')].map(t => Math.round(t.getBoundingClientRect().top))).size);
  if (rows !== (w < 640 ? 2 : 1)) errs.push(`onglets sur ${rows} ligne(s)`);
  // Fiche : à droite du contenu (≥ 1000 px) ou dessous, dans Arbre et Équipement ; cachée ailleurs
  for (const k of SEC) {
    await tab(page, k);
    const f = await page.evaluate(k => { const a = document.querySelector('#ficheAside'), p = document.querySelector('#p-' + k).getBoundingClientRect(), r = a.getBoundingClientRect();
      return {vis: a.offsetParent !== null, right: r.left >= p.right - 1, below: r.top >= p.bottom - 1}; }, k);
    if (f.vis !== (k === 'tree' || k === 'eq')) errs.push(`fiche ${f.vis ? 'affichée' : 'cachée'} dans l'onglet ${k}`);
    else if (f.vis && !(w >= 1000 ? f.right : f.below)) errs.push(`fiche mal placée dans l'onglet ${k}`);
    errs.push(...(await ariaErrs(page)).map(e => `ARIA (${k}) : ` + e));
  }
  if (await page.evaluate(() => location.hash) !== '') errs.push('un onglet a écrit dans l\'adresse');
  // Parcours : changer de preset, de cible, acheter une recommandation, passer en vue liste
  await tab(page, 'tree');
  await page.selectOption('#preset', {label: 'Barbare deux mains'});
  await tab(page, 'calc');
  await page.selectOption('#oEnemy', {label: 'Hollow Hound'});
  await page.waitForTimeout(100);
  const buy = await page.$('[data-inv="0"]'); if (buy) await buy.click();
  if (!await page.isVisible('#p-calc .ofam')) errs.push('« Armes à classer » absent du calculateur');
  // Onglets collés : après défilement, la barre reste en haut de l'écran
  await page.evaluate(() => window.scrollTo(0, 900)); await page.waitForTimeout(50);
  const top = await page.evaluate(() => Math.round(document.querySelector('#secBar').getBoundingClientRect().top));
  if (top !== 0) errs.push(`onglets non collés en haut après défilement (haut à ${top}px)`);
  // Focus clavier : #oEnemy, placé sous les onglets collés (témoin), puis atteint par Maj+Tab depuis #oSlot, doit être ramené dessous ;
  // contre-épreuve : sans scroll-padding, il resterait caché (le test sait voir la panne)
  for (const pad of [true, false]) {
    const was = await page.evaluate(pad => { const a = document.querySelector('#oEnemy'), bar = document.querySelector('#secBar');
      document.documentElement.style.scrollPaddingTop = pad ? '' : '0px'; document.querySelector('#oSlot').focus(); window.scrollBy(0, a.getBoundingClientRect().top - 8);
      return a.getBoundingClientRect().top < bar.getBoundingClientRect().bottom; }, pad);
    await page.keyboard.press('Shift+Tab');
    const f = await page.evaluate(() => { const a = document.activeElement, r = a.getBoundingClientRect(), b = document.querySelector('#secBar').getBoundingClientRect(); document.documentElement.style.scrollPaddingTop = ''; return {id: a.id, hid: r.top < b.bottom}; });
    if (!was) errs.push('focus : témoin raté, #oEnemy n\'était pas sous les onglets');
    else if (f.id !== 'oEnemy') errs.push('focus : Maj+Tab a atteint ' + f.id + ' au lieu de #oEnemy');
    else if (pad && f.hid) errs.push('élément focalisé caché sous les onglets collés : #oEnemy');
    else if (!pad && !f.hid) errs.push('focus : la contre-épreuve sans scroll-padding ne cache rien (test aveugle)');
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await tab(page, 'tree');
  await page.click('#vList');
  await overflow(page, w, 'vue Liste', errs);
  await page.click('#vGraph');
  await tab(page, 'def');
  await page.fill('#dHit', '900');
  const txt = await page.textContent('#defOut');
  if (!/coups avant K\.O\./.test(txt)) errs.push('bloc défense vide');
  // Build optimal : calcul découpé (aucune tâche longue), un résultat par famille, détail ouvert pour la capture
  await tab(page, 'bo');
  if (!await page.isVisible('#p-bo #oEnemy') || await page.isVisible('#p-bo .ofam')) errs.push('choix de la cible absent de l\'onglet Build optimal (ou « Armes à classer » affiché)');
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
  // Une capture par onglet (Arbre = capture principale) ; aucun débordement horizontal dans chaque onglet
  for (const k of SEC) {
    await tab(page, k); await page.waitForTimeout(k === 'tree' ? 250 : 60);
    await page.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove())); // capture sans le message « Build optimal appliqué »
    await overflow(page, w, 'onglet ' + k, errs);
    await page.screenshot({path: join(root, `tests/screenshots/${w}-${scheme}${k === 'tree' ? '' : '-' + k}.png`), fullPage: true});
  }
  const name = `tests/screenshots/${w}-${scheme}.png`;
  console.log(errs.length ? '✗' : '✓', name, errs.join(' | '));
  fail += errs.length; await page.close();
}
// Build optimal pendant le calcul : un détail ouvert reste ouvert ; « Arrêter » cliqué lentement à la souris (appui puis relâché 150 ms plus tard) arrête bien
{
  const page = await browser.newPage({viewport: {width: 1300, height: 900}});
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(url); await page.waitForTimeout(600);
  await page.selectOption('#preset', {label: 'Barbare deux mains'}); await page.waitForTimeout(100);
  await tab(page, 'bo');
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
// Onglets au clavier (← → en boucle, Début, Fin), onglet retenu après rechargement, onglet retenu illisible → Arbre
{
  const page = await browser.newPage({viewport: {width: 1300, height: 900}});
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(url); await page.waitForTimeout(500);
  await page.focus('#t-tree');
  for (const [key, want] of [['ArrowRight', 'eq'], ['End', 'tab'], ['ArrowRight', 'tree'], ['ArrowLeft', 'tab'], ['Home', 'tree'], ['ArrowLeft', 'tab']]) {
    await page.keyboard.press(key); await page.waitForTimeout(40);
    const st = await page.evaluate(() => ({f: document.activeElement.id, s: [...document.querySelectorAll('#secTabs [aria-selected="true"]')].map(t => t.id).join()}));
    if (st.f !== 't-' + want || st.s !== 't-' + want) errs.push(`${key} : focus ${st.f}, sélection ${st.s} (attendu t-${want})`);
  }
  await tab(page, 'def'); await page.reload(); await page.waitForTimeout(500);
  if (await page.getAttribute('#t-def', 'aria-selected') !== 'true' || !await page.isVisible('#p-def')) errs.push('onglet Défense non retenu après rechargement');
  await page.evaluate(() => localStorage.setItem('forge-embervale-onglet', '{oups')); await page.reload(); await page.waitForTimeout(500);
  if (await page.getAttribute('#t-tree', 'aria-selected') !== 'true') errs.push('onglet retenu illisible : Arbre attendu');
  // Tables : un nom d'ennemi cliqué devient la cible et ouvre le calculateur (focus sur son onglet)
  await tab(page, 'tab');
  const en = await page.evaluate(() => { const b = document.querySelectorAll('#mxBody button[data-en]')[5]; b.scrollIntoView(); return b.dataset.en; });
  await page.click(`#mxBody button[data-en="${en}"]`); await page.waitForTimeout(80);
  const st = await page.evaluate(() => ({s: document.querySelector('#t-calc').getAttribute('aria-selected'), v: document.querySelector('#p-calc').offsetParent !== null, e: document.querySelector('#oEnemy').value, f: document.activeElement.id, top: Math.round(document.querySelector('#p-calc').getBoundingClientRect().top), bar: Math.round(document.querySelector('#secBar').getBoundingClientRect().bottom)}));
  if (st.s !== 'true' || !st.v) errs.push('clic sur un ennemi : calculateur non ouvert');
  if (st.e !== en) errs.push(`clic sur un ennemi : cible ${st.e} au lieu de ${en}`);
  if (st.f !== 't-calc') errs.push('clic sur un ennemi : focus sur ' + st.f);
  if (st.top < st.bar) errs.push(`haut du calculateur caché sous les onglets (${st.top}px < ${st.bar}px)`);
  console.log(errs.length ? '✗' : '✓', 'onglets : clavier, onglet retenu, clic dans la table', errs.join(' | '));
  fail += errs.length; await page.close();
}
// Graphe caché au démarrage (onglet retenu : Calculateur) : à la 1re ouverture d'Arbre, canvas à la taille du panneau, tracé cadré et dessiné
for (const w of [1300, 400]) {
  const ctx = await browser.newContext({viewport: {width: w, height: 900}});
  await ctx.addInitScript(() => { try { if (!sessionStorage.getItem('vu')) { localStorage.setItem('forge-embervale-onglet', '"calc"'); sessionStorage.setItem('vu', '1'); } } catch (e) {} });
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(url); await page.waitForTimeout(600);
  if (await page.isVisible('#gcv')) errs.push('graphe visible alors que le Calculateur est retenu');
  await tab(page, 'tree');
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
// Onglets, cas limites (revue QA) : build optimal qui survit aux changements d'onglet, barre de cible de retour dans le Calculateur, plan gardé,
// passage A → B, cases à cocher, « Comparer » hors de la fiche, défilement de Tables gardé, clavier (modificateurs, Entrée), arrêt dit, messages empilés
{
  const page = await browser.newPage({viewport: {width: 1300, height: 900}});
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  const toasts = () => page.textContent('#toasts');
  await page.goto(url); await page.waitForTimeout(500);
  await page.selectOption('#preset', {label: 'Barbare deux mains'}); await page.waitForTimeout(80);
  await tab(page, 'bo'); await page.click('#boGo');
  for (const k of ['tree', 'calc', 'tab', 'bo']) await tab(page, k);
  const fin = await page.waitForFunction(() => !BO.busy && BO.out, null, {timeout: 30000}).then(() => true, () => false);
  if (!fin || await page.evaluate(() => BO.stop)) errs.push('build optimal arrêté par un changement d\'onglet');
  else if (!await page.$('#boOut [data-boap]')) errs.push('build optimal : résultats absents après les changements d\'onglet');
  await tab(page, 'calc');
  if (!await page.isVisible('#p-calc #oEnemy') || !await page.isVisible('#p-calc .ofam')) errs.push('choix de la cible absent du Calculateur après Build optimal');
  await page.fill('#planN', '30'); await page.click('#planGo'); await page.waitForTimeout(150);
  if (!await page.$('#planApply')) errs.push('plan de test vide (30 points)');
  else { await tab(page, 'tree'); await tab(page, 'calc'); if (!await page.$('#planApply')) errs.push('plan « Répartir au mieux » perdu en changeant d\'onglet'); }
  await tab(page, 'def'); await page.click('#buildTabs .tab:nth-child(2)'); await page.waitForTimeout(80);
  if (!/^Build B/.test(await page.textContent('#defFor'))) errs.push('Défense : en-tête pas passé au build B');
  const cw = await page.evaluate(() => Math.max(...[...document.querySelectorAll('.dform input[type="checkbox"]')].map(c => c.getBoundingClientRect().width)));
  if (cw > 24) errs.push(`cases à cocher de la Défense étirées (${Math.round(cw)} px)`);
  await page.click('#cmp'); await page.waitForTimeout(30);
  if (!/Comparaison A et B/.test(await toasts())) errs.push('« Comparer A et B » hors de la fiche : aucun message');
  await page.click('#cmp');
  await tab(page, 'tab'); await page.evaluate(() => { document.querySelector('.mxs').scrollTop = 600; });
  await page.click('#buildTabs .tab:nth-child(1)'); await page.waitForTimeout(80); await tab(page, 'tab');
  const st = await page.evaluate(() => document.querySelector('.mxs').scrollTop);
  if (st < 590) errs.push(`table des ennemis remise en haut (${st} px) après A/B ou un nouveau clic sur l'onglet`);
  await page.focus('#t-tab'); await page.keyboard.press('Alt+ArrowRight'); await page.keyboard.press('Control+End'); await page.waitForTimeout(40);
  if (await page.getAttribute('#t-tab', 'aria-selected') !== 'true') errs.push('Alt+→ ou Ctrl+Fin a changé d\'onglet');
  await page.focus('#mxBody button[data-en="7"]'); await page.keyboard.press('Enter'); await page.waitForTimeout(80);
  const k2 = await page.evaluate(() => ({f: document.activeElement.id, s: document.querySelector('#t-calc').getAttribute('aria-selected'), e: document.querySelector('#oEnemy').value}));
  if (k2.f !== 't-calc' || k2.s !== 'true' || k2.e !== '7') errs.push(`Entrée sur un ennemi : focus ${k2.f}, Calculateur ${k2.s}, cible ${k2.e}`);
  if (!await page.isVisible('#p-calc .ofam')) errs.push('choix de la cible absent du Calculateur après un clic dans Tables');
  await tab(page, 'bo'); await page.click('#boGo'); await tab(page, 'tree');
  await page.click('#buildTabs .tab:nth-child(2)'); await page.waitForTimeout(150);
  const stop = await page.evaluate(() => ({busy: BO.busy, stop: BO.stop}));
  if (stop.busy || !stop.stop) errs.push('passage A → B pendant le calcul : build optimal non arrêté');
  if (!/build optimal arrêté/i.test(await toasts())) errs.push('build optimal arrêté hors de son onglet : aucun message');
  await page.evaluate(() => { toast('Premier message'); toast('Second message'); });
  const ov = await page.evaluate(() => { const r = [...document.querySelectorAll('#toasts .toast')].map(t => t.getBoundingClientRect()); return r.length < 2 || r.some((a, i) => r.some((b, j) => i < j && a.top < b.bottom - 1 && b.top < a.bottom - 1)); });
  if (ov) errs.push('messages superposés (ou absents)');
  console.log(errs.length ? '✗' : '✓', 'onglets : cas limites (calcul, cible, plan, A/B, Tables, clavier, messages)', errs.join(' | '));
  fail += errs.length; await page.close();
}
// Démarrage sur un onglet retenu du calculateur : contenu rendu (et, pour Build optimal, calcul qui aboutit)
for (const k of ['bo', 'def', 'tab']) {
  const ctx = await browser.newContext({viewport: {width: 1300, height: 900}});
  await ctx.addInitScript(k => { try { if (!sessionStorage.getItem('vu')) { localStorage.setItem('forge-embervale-onglet', JSON.stringify(k)); sessionStorage.setItem('vu', '1'); } } catch (e) {} }, k);
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(url); await page.waitForTimeout(600);
  if (await page.getAttribute('#t-' + k, 'aria-selected') !== 'true') errs.push('onglet retenu non rouvert');
  if (k === 'bo') {
    if (!await page.isVisible('#p-bo #oEnemy') || await page.isVisible('#p-bo .ofam') || !await page.isVisible('#boGo')) errs.push('Build optimal : carte ou choix de la cible absents');
    else { await page.click('#boGo'); if (!await page.waitForFunction(() => !BO.busy && BO.out && document.querySelector('#boOut [data-boap]'), null, {timeout: 30000}).then(() => true, () => false)) errs.push('Build optimal : calcul sans résultat'); }
  }
  if (k === 'def' && !/coups avant K\.O\./.test(await page.textContent('#defOut').catch(() => ''))) errs.push('Défense vide');
  if (k === 'tab' && (await page.$$('#mxBody tr')).length < 50) errs.push('table des ennemis vide');
  console.log(errs.length ? '✗' : '✓', 'démarrage sur l\'onglet ' + k, errs.join(' | '));
  fail += errs.length; await ctx.close();
}
// Zoom de l'utilisateur gardé et canvas recalé quand la fenêtre change pendant que le graphe est caché
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
  await tab(page, 'calc'); await page.setViewportSize({width: 1100, height: 800}); await page.waitForTimeout(120); await tab(page, 'tree'); await page.waitForTimeout(150);
  const b = await cam();
  if (Math.abs(a.dx - b.dx) > 1 || Math.abs(a.dy - b.dy) > 1) errs.push(`zoom ou cadrage perdu en changeant d'onglet (${Math.round(a.dx)},${Math.round(a.dy)} → ${Math.round(b.dx)},${Math.round(b.dy)})`);
  if (Math.abs(b.cw - b.want) > 1) errs.push(`canvas pas recalé à la nouvelle taille (${b.cw} px au lieu de ${b.want})`);
  console.log(errs.length ? '✗' : '✓', 'graphe : zoom gardé, canvas recalé après redimensionnement caché', errs.join(' | '));
  fail += errs.length; await page.close();
}
// Stockage du navigateur bloqué (accès à localStorage interdit) : aucune erreur, Arbre ouvert, onglets utilisables, « Enregistrer » le dit
{
  const ctx = await browser.newContext({viewport: {width: 1300, height: 900}});
  await ctx.addInitScript(() => { Object.defineProperty(window, 'localStorage', {configurable: true, get() { throw new DOMException('bloqué', 'SecurityError'); }}); });
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(url); await page.waitForTimeout(500);
  if (await page.evaluate(() => { try { localStorage; return 'accessible'; } catch (e) { return ''; } })) errs.push('blocage du stockage non simulé');
  if (await page.getAttribute('#t-tree', 'aria-selected') !== 'true') errs.push('Arbre attendu');
  for (const k of SEC) await tab(page, k);
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
// Lien d'avant le tracé réel (code b2 figé de share.test.js) : fenêtre de migration, puis l'adresse passe en b3
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
  for (const k of SEC) await tab(page, k);
  if (await page.evaluate(() => location.hash) !== h) errs.push('le code de partage de l\'adresse a changé en passant d\'un onglet à l\'autre');
  console.log(errs.length ? '✗' : '✓', name, errs.join(' | '));
  fail += errs.length; await page.close();
}
await browser.close();
process.exit(fail ? 1 : 0);
