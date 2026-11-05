// Tests sans dépendance : node tests/run.mjs
// Charge un faux DOM (dom-stub.cjs), exécute les scripts de src/js dans l'ordre comme le ferait le navigateur
// (portée globale partagée), puis chaque fichier tests/*.test.js.
import {readFileSync, readdirSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const only = process.argv[2];
const results = [];
globalThis.assert = assert;
globalThis.test = (name, fn) => results.push({name, fn, file: globalThis.__file});

vm.runInThisContext(readFileSync(join(root, 'tests/dom-stub.cjs'), 'utf8'), {filename: 'dom-stub.cjs'});
const js = readdirSync(join(root, 'src/js')).filter(f => /^\d\d-.*\.js$/.test(f)).sort();
for (const f of js) vm.runInThisContext(readFileSync(join(root, 'src/js', f), 'utf8'), {filename: 'src/js/' + f});

const files = readdirSync(join(root, 'tests')).filter(f => f.endsWith('.test.js') && (!only || f.includes(only))).sort();
for (const f of files) { globalThis.__file = f; vm.runInThisContext(readFileSync(join(root, 'tests', f), 'utf8'), {filename: 'tests/' + f}); }

setTimeout(async () => {
  let ok = 0, ko = 0;
  for (const t of results) {
    try { await t.fn(); ok++; console.log('  ✓', t.file, '›', t.name); }
    catch (e) { ko++; console.log('  ✗', t.file, '›', t.name, '\n     ', e && e.message ? e.message.split('\n').join('\n      ') : e); }
  }
  console.log(`\n${ok} réussis, ${ko} échoués`);
  process.exit(ko ? 1 : 0);
}, 60); // laisse passer le premier rendu (debounce de l'optimiseur)
