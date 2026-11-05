// Serveur local avec reconstruction automatique : node scripts/serve.mjs [port]
// Ouvre http://localhost:8080 (sert dist/index.html) ; chaque modification de src/ relance le build.
import {createServer} from 'node:http';
import {readFileSync, watch} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from './build.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const port = +process.argv[2] || 8080;
const safeBuild = () => { try { build({quiet: true}); console.log(new Date().toLocaleTimeString('fr-FR'), 'build OK'); } catch (e) { console.error('Build échoué :', e.message); } };
safeBuild();
let t; watch(join(root, 'src'), {recursive: true}, () => { clearTimeout(t); t = setTimeout(safeBuild, 120); });
createServer((req, res) => {
  try { res.writeHead(200, {'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store'}); res.end(readFileSync(join(root, 'dist/index.html'))); }
  catch (e) { res.writeHead(500); res.end(String(e)); }
}).listen(port, () => console.log(`http://localhost:${port}`));
