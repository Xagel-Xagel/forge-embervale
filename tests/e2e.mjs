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
  await page.click('#vList'); await page.click('#vGraph');
  await page.fill('#dHit', '900');
  const txt = await page.textContent('#defOut');
  if (!/coups avant K\.O\./.test(txt)) errs.push('bloc défense vide');
  const name = `tests/screenshots/${w}-${scheme}.png`;
  await page.screenshot({path: join(root, name), fullPage: true});
  console.log(errs.length ? '✗' : '✓', name, errs.join(' | '));
  fail += errs.length; await page.close();
}
await browser.close();
process.exit(fail ? 1 : 0);
