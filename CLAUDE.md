# Forge d'Embervale — instructions pour Claude Code

Planificateur d'**arbre de compétences** pour **Enshrouded 1.0** (2.0.0, « grand ménage », HISTORY n° 27) : objectifs prêts (principal + secondaire + soutien) dont le combo est imposé selon les points et la Flamme, et expliqué ; ajouts libres ; gemmes ; builds A/B, enregistrés, partagés. L'équipement n'est pas pris en compte.
Le livrable est **une seule page HTML autonome**, publiée à deux endroits :
- **GitHub Pages (principal)** : https://xagel-xagel.github.io/forge-embervale/ — dépôt `Xagel-Xagel/forge-embervale`, déployé par `.github/workflows/pages.yml` à chaque push sur `main` (tests → build → copie du site sur la branche `gh-pages`, servie par GitHub Pages en mode « Deploy from a branch »). Ne jamais modifier `gh-pages` à la main. Un push sur `main` = mise en production : ne pousser sur `main` que du code testé.
- Artifact claude.ai (copie) : https://claude.ai/artifact/GtbdfLTi6yPAcyNxexhV4f (version 21 au 2026-11-08, 2.4.0).

L'utilisateur (Vincent) parle français : **réponses, interface, commentaires et messages de commit en français.**

## Commandes

```bash
npm run build      # src/ → dist/index.html (site GitHub Pages) + dist/forge-embervale.html (format Artifact)
npm test           # tests Node sans dépendance (faux DOM) — doit rester à 0 échec
npm run dev        # serveur http://localhost:8080 avec reconstruction automatique
npm run test:e2e   # Playwright : captures clair/sombre × 1300/400 px (page, A contre B, vue Liste au bureau, « Pourquoi ce combo », ajouts avec objectif, objectifs optimisés, lien b2) dans tests/screenshots/ ; aussi lancé par la CI sur chaque PR
npm run check      # build + tests
npm run tree       # régénère src/js/01-tree-data.js (tracé réel) depuis PinDrop — réseau requis, après un patch du jeu
npm run optimiser  # ordre des éléments des objectifs optimisés (hors ligne, ≈ 20 s, n'écrit rien) ; -- --check : erreur si un meilleur ordre existe (après un patch ou npm run tree)
```

Aucune dépendance npm n'est nécessaire hormis Playwright pour `test:e2e` (`npm i -D playwright && npx playwright install chromium`).

## Organisation

```
src/page.html        balisage + marqueurs <!-- INLINE:CSS --> et <!-- INLINE:JS -->
src/styles.css       tous les styles (jetons de couleur clair/sombre)
src/js/NN-*.js       scripts, injectés dans l'ordre du préfixe numérique, chacun dans son <script>
  01-data.js         SK (compétences), SKI, PIPS (attributs), AREAS (zones)
  01-tree-data.js    TREE : tracé réel de l'arbre 1.0 (243 nœuds x/y, 312 liaisons) — GÉNÉRÉ, ne pas éditer à la main
  02-calc.js         blankBuild (gear, upg : inertes), spentPoints, budget, levelNeeded, FLAME_NODES, compute(build) → attributs, santé, mana, vigueur
  03-share.js        tables figées FZ, encode/decode des codes de partage (b3-… avec segments -o des objectifs et -a de vos ajouts, rétrocompatible b2- et b1-)
  04-tree.js         TOPO (depuis TREE), règles de liaison : reach, canBuy, dijkstra, pathTo, buyPath, prune, normalize, migrate
  05-gems.js         RAR, GEMS (29 gemmes), GEMI, GTYPE
  06-objectifs.js    GOALS (19 objectifs, étapes et raisons : 12 repris des presets ; 7 optimisés — 2.4.0 : 3 hybrides, Exploration, Récolte ; 2.6.0 : Vol de vie (mêlée) ; 2.7.0 : Vol de vie complet (mêlée) — champs opt, src « communauté », ordre des éléments figé par le script), SUPS (4 objectifs de soutien, compétences seules, 2.1.0), combo (moteur, en cache ; 2.3.0 : recalculé avec vos ajouts b.ad, gratuits pour lui), imposed, addsOf, regen, rebuild, setGoals, lockOf, fitGoals, goalBuild
  10-ui.js           état (builds, cur, compare, area, view…), rendus (onglets A/B, points, objectifs, « Pourquoi ce combo », gemmes, arbre en liste, A contre B), événements, fil des étapes (goStep), partage, builds enregistrés
  30-graph.js        rendu canvas de l'arbre façon « graph view » d'Obsidian (positions réelles ancrées, survol, zoom ; imposé plein, ajouté en pointillé), expose window.G
  99-init.js         fromHash(); renderSaved(); renderAll();
scripts/build.mjs    assemblage + garde-fous (pas de </script> dans le JS, pas de doctype, < 16 Mo)
scripts/tree-from-pindrop.mjs  régénère src/js/01-tree-data.js depuis le planificateur PinDrop (réseau ; après un patch du jeu)
scripts/optimiser-objectifs.mjs  ordre des éléments de chaque étape des objectifs opt : moindre coût du combo complet à 212 pts, puis aire d'avancée (imprime l'ordre à recopier)
tests/               run.mjs (lanceur), 00-aides.test.js (aides), *.test.js, dom-stub.cjs, e2e.mjs
docs/                ARCHITECTURE, FORMULAS, DATA_SOURCES, ROADMAP, HISTORY
```

Tous les scripts partagent la portée globale (comme dans le navigateur) : une `const` de 01-data.js est visible dans 10-ui.js. Pas de modules ES, pas de bundler : garder ce modèle.

**Ne jamais modifier `dist/` à la main** (il n'est pas versionné) : on édite `src/`, puis `npm run build`.

## Règles impératives

### 1. Contraintes de la page (valables pour l'Artifact ; les respecter garde les deux publications identiques)
- Pas de `<!doctype>`, `<html>`, `<head>`, `<body>` dans `src/page.html` ni dans `dist/forge-embervale.html` (claude.ai ajoute le squelette ; `dist/index.html` le reçoit du build). Le build le vérifie.
- Ressources externes : polices **Google Fonts uniquement** ; scripts seulement depuis cdnjs.cloudflare.com, cdn.jsdelivr.net/npm, unpkg.com (version exacte épinglée). Tout le reste est bloqué sans erreur visible : pas de fetch, pas d'images distantes, pas d'iframe.
- `alert`, `confirm`, `prompt`, `window.print()` ne marchent pas : utiliser `toast()` et `modal()` de 10-ui.js.
- `localStorage` peut lever une exception : toujours passer par `lsGet`/`lsSet` (try/catch, clé en paramètre). Il ne sert qu'aux builds enregistrés localement (clé `forge-embervale-builds`) ; la disposition des panneaux a disparu en 2.0.0 (HISTORY n° 27).
- Le hash de l'URL ne doit contenir que lettres, chiffres et tirets (c'est le code de partage) : aucune navigation dans le hash.
- Couleurs : uniquement via les jetons CSS de `:root`, redéfinis dans les deux blocs sombres (`@media (prefers-color-scheme: dark)` avec `:root:not([data-theme="light"])`, et `:root[data-theme="dark"]`). Jamais de couleur littérale dans un composant, sauf les raretés de gemmes (RAR).
- Largeur téléphone (~400 px) : aucun défilement horizontal de la page ; les tableaux larges vont dans `.oscroll`. La gouttière latérale `max(16px, env(safe-area-inset-*))` est sur `body`.
- Pas de nouvelle dépendance si on peut l'éviter.

### 2. Compatibilité des codes de partage (liens déjà envoyés par l'utilisateur)
Les codes enregistrent des **places dans des tables figées** (`FZ`, en tête de 03-share.js), jamais l'ordre des données vivantes :
- `FZ.items` (objets), `FZ.gems` (gemmes) : formats b1, b2 et b3 ;
- `FZ.at`, `FZ.nd` : identifiants de jeu (base 36) des nœuds d'attribut et des compétences du tracé réel, format b3 ;
- `FZ.goals` : objectifs (segment `-o`, 2.0.0 ; soutiens `SUPS` en fin, 2.1.0 : 6 caractères seulement avec un soutien ; objectifs optimisés en fin, 2.4.0 ; Vol de vie en fin, 2.6.0 ; Vol de vie complet en fin, 2.7.0) ; `FZ.slots` : emplacements d'équipement (relus, inertes) ;
- `FZ.sk`, `FZ.b1`, `FZ.b2` : formats fermés b1/b2 (ancien ordre de SK, ancien tracé) — **ne changent plus jamais**.

Format actuel : `b3-<en-tête>-<équipement>-<masque attributs>-<masque compétences>-<rangs>[-g<gemmes>][-o<objectifs>[-a<ajouts>-<rangs>]]-<contrôle>` (1 chiffre de rang par compétence possédée ; segment `-a` de vos ajouts, 2.3.0, seulement avec objectifs et s'il y en a : bits sur les nœuds possédés, dans l'ordre du code, pas de table FZ, puis un caractère par compétence (votre nœud : son rang ; vos rangs au-dessus d'un nœud imposé : rang + 9) ; sans lui, `fitGoals` déduit les ajouts de l'arbre et recalcule s'il le faut (message) ; 2 caractères de contrôle : un code tronqué ou abîmé est refusé, avec un message). Les builds enregistrés portent `tv:1` (faits sur le tracé réel) ; sans ce marqueur, ils sont migrés au chargement.

Donc :
- **ajouter une gemme, une compétence, un nœud ou un objectif : l'ajouter aussi EN FIN de sa table FZ** (le test des tables figées le réclame). L'ordre de GEMS, SK, GOALS ou TREE peut alors changer sans casser de lien.
- L'équipement (2.0.0) n'est plus pris en compte : celui d'un ancien lien est relu (`FZ.items`, `FZ.slots`) et réécrit tel quel, jamais affiché ni compté. Les champs `gear` et `upg` des builds restent donc, inertes.
- Changer le contenu d'un objectif : un lien qui le porte et dont l'arbre ne contient plus le combo s'ouvre en arbre libre, arbre gardé (`fitGoals`, message).
- Ne jamais réordonner ni retirer une entrée de `FZ` : les empreintes du test cassent, et des liens avec.
- Les codes b1/b2 datent de l'ancien tracé thématique : `decode` les lit via les tables figées, garde l'équipement, les compétences et les comptes d'attributs, puis `migrate` relie le tout au tracé réel (fenêtre « Lien d'avant le tracé réel »).
- `tests/share.test.js` et `tests/codes-figes.test.js` (codes des 16 anciens presets) contiennent des codes figés : s'ils cassent, un lien existant est cassé. **Ne pas « corriger » le test en changeant une valeur attendue.** Pour b2, le test vérifie (décision du 2026-11-05) que chaque choix est conservé et que seuls des nœuds de liaison sont ajoutés.

### 3. Règle de l'arbre
Un nœud ne s'achète que s'il touche un point de départ (Étincelle, gratuit) ou un nœud acquis qui y est relié (`canBuy`). Retirer un nœud élague tout ce qui n'est plus relié (`prune`). Les combos des objectifs (`combo`, chemin le moins cher), les codes importés et les builds enregistrés passent par les mêmes règles (`normalize`, qui achète le chemin le moins cher pour reconnecter. Un nœud imposé par un objectif ne se retire pas (`lockOf`) ; les ajouts de l'utilisateur, si. Avec objectif (2.3.0), un ajout ou un retrait passe par les ajouts du build (`b.ad` : vos nœuds `sk`/`pn`, vos rangs au-dessus d'un nœud imposé `up`) et le combo est recalculé depuis les départs (`regen`, vos nœuds gratuits pour lui) ; retirer un de vos nœuds élague les ajouts qu'il était seul à relier (`removeAdd`) ; un recalcul sans changement ne retire rien. Toute nouvelle façon de modifier un build doit préserver cet invariant (testé dans rules.test.js, objectifs.test.js et share.test.js).

Le tracé (positions, liaisons) est celui des **fichiers du jeu 1.0**, relevé par PinDrop (`src/js/01-tree-data.js`, régénéré par `scripts/tree-from-pindrop.mjs`). La « Flamme » est un nœud **logique** du simulateur, reliant les 12 départs ; elle n'est jamais dessinée (un vrai nœud, Architecte aérien, occupe le centre). Liaisons non orientées et coût identique à chaque rang : déductions des fichiers (comme PinDrop), à présenter comme telles.

### 4. Honnêteté des données
- Chaque chiffre de jeu doit avoir une source dans `docs/DATA_SOURCES.md`. Ne rien inventer : si une valeur est inconnue, l'afficher comme telle ou demander.
- Distinguer dans l'interface et dans `docs/FORMULAS.md` ce qui est **officiel** (tutoriel en jeu), **extrait des fichiers du jeu** (PinDrop, enshrouded.tools), **estimé par la communauté**, ou **hypothèse** du simulateur.
- Le jeu évolue (patchs) : pour toute donnée « actuelle », vérifier en ligne avant de l'affirmer.

### 5. Langue et style
- Interface en français. Compétences et gemmes : nom français, le nom anglais suit en italique ; la recherche porte sur les deux. Termes de jeu (Shroud, Flamme) inchangés. (Les noms d'objets et d'ennemis de la décision n° 22 ont disparu avec eux en 2.0.0.)
- Objectifs : l'ordre des étapes et les raisons sont des **choix du simulateur**, affichés comme hypothèse ; une raison ne cite que des effets présents dans les descriptions de `SK`.
- Typographie française : espace avant `%`, `:`, `?`, `!` ; nombres via `fmt()` (format fr-FR).
- Tout texte venant des données passe par `esc()` avant d'être injecté en HTML.
- Code compact dans le style existant (fonctions courtes sur une ligne, gabarits littéraux). Pas de reformatage massif : ça rend les diffs illisibles.

## Flux de travail attendu
1. Lire `docs/ROADMAP.md` (travaux en attente) et `docs/HISTORY.md` (demandes et décisions passées) avant une évolution importante.
2. Modifier `src/`, ajouter ou adapter un test dans `tests/`.
3. `npm run check` (0 échec), puis `npm run test:e2e` si Playwright est disponible, et **regarder les captures** (clair/sombre, 1300/400 px, A contre B, vue Liste, « Pourquoi ce combo », ajouts avec objectif, objectifs optimisés). Objectif optimisé modifié : `npm run optimiser -- --check`.
4. Mettre à jour `CHANGELOG.md` (et `docs/FORMULAS.md` / `docs/DATA_SOURCES.md` si besoin), incrémenter la version dans `package.json`.
5. Publier : commit puis `git push` sur `main` → GitHub Actions teste, construit et met à jour la branche `gh-pages` ; GitHub Pages republie ensuite le site en 1 à 2 minutes (vérifier le run avec `gh run list` / `gh run watch`). Pour un travail en cours, utiliser une branche et une pull request (le workflow `tests.yml` la vérifie : tests Node, build, test navigateur Playwright ; captures dans l'artefact « captures-e2e » du run). Optionnel : si l'outil Artifact est disponible, republier aussi `dist/forge-embervale.html` sur l'URL Artifact.

Voir `/livrer` (.claude/commands/livrer.md) pour la check-list complète.
