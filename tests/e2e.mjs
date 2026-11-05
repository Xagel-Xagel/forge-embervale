// Test navigateur (optionnel) : nécessite Playwright.
//   npm i -D playwright && npx playwright install chromium
//   node tests/e2e.mjs            → captures dans tests/screenshots/
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
for (const [w, scheme] of [[1300, 'light'], [1300, 'dark'], [400, 'light'], [400, 'dark']]) {
  const page = await browser.newPage({viewport: {width: w, height: 900}, colorScheme: scheme});
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto(url); await page.waitForTimeout(900);
  // Débordement horizontal interdit
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  if (sw > w) errs.push(`débordement horizontal : ${sw}px > ${w}px`);
  // Parcours : changer de preset, de cible, acheter une recommandation, passer en vue liste
  await page.selectOption('#preset', {label: 'Barbare deux mains'});
  await page.selectOption('#oEnemy', {label: 'Hollow Hound'});
  await page.waitForTimeout(100);
  const buy = await page.$('[data-inv="0"]'); if (buy) await buy.click();
  await page.click('#vList');
  const swl = await page.evaluate(() => document.documentElement.scrollWidth);
  if (swl > w) errs.push(`débordement horizontal en vue Liste : ${swl}px > ${w}px`);
  await page.click('#vGraph');
  await page.fill('#dHit', '900');
  const txt = await page.textContent('#defOut');
  if (!/coups avant K\.O\./.test(txt)) errs.push('bloc défense vide');
  const name = `tests/screenshots/${w}-${scheme}.png`;
  await page.screenshot({path: join(root, name), fullPage: true});
  console.log(errs.length ? '✗' : '✓', name, errs.join(' | '));
  fail += errs.length; await page.close();
}
// Tracé réel : après « Réorganiser », chaque nœud revient exactement à sa position du jeu (mouvement normal puis réduit)
const home = page => page.evaluate(() => window.G.nodes.every(n => n.kind === 'hub' || (n.x === n.ax && n.y === n.ay)));
for (const motion of ['no-preference', 'reduce']) {
  const page = await browser.newPage({viewport: {width: 1300, height: 900}, reducedMotion: motion});
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(url); await page.waitForTimeout(500);
  if (!await home(page)) errs.push('nœuds hors de leur position réelle au chargement');
  await page.click('#gShake'); await page.waitForTimeout(motion === 'reduce' ? 100 : 2500);
  if (!await home(page)) errs.push('nœuds pas revenus à leur position réelle');
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
  console.log(errs.length ? '✗' : '✓', name, errs.join(' | '));
  fail += errs.length; await page.close();
}
await browser.close();
process.exit(fail ? 1 : 0);
