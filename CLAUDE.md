# Forge d'Embervale — instructions pour Claude Code

Simulateur de stuff pour **Enshrouded 1.0** (équipement, gemmes, arbre de compétences, comparaison A/B, partage, calculateur d'optimisation contre les ennemis).
Le livrable est **une seule page HTML autonome**, publiée à deux endroits :
- **GitHub Pages (principal)** : https://xagel-xagel.github.io/forge-embervale/ — dépôt `Xagel-Xagel/forge-embervale`, déployé par `.github/workflows/pages.yml` à chaque push sur `main` (tests → build → copie du site sur la branche `gh-pages`, servie par GitHub Pages en mode « Deploy from a branch »). Ne jamais modifier `gh-pages` à la main. Un push sur `main` = mise en production : ne pousser sur `main` que du code testé.
- Artifact claude.ai (copie) : https://claude.ai/artifact/GtbdfLTi6yPAcyNxexhV4f (version 14 au 2026-11-06).

L'utilisateur (Vincent) parle français : **réponses, interface, commentaires et messages de commit en français.**

## Commandes

```bash
npm run build      # src/ → dist/index.html (site GitHub Pages) + dist/forge-embervale.html (format Artifact)
npm test           # tests Node sans dépendance (faux DOM) — doit rester à 0 échec
npm run dev        # serveur http://localhost:8080 avec reconstruction automatique
npm run test:e2e   # Playwright (optionnel) : 4 captures clair/sombre × 1300/400 px dans tests/screenshots/
npm run check      # build + tests
npm run tree       # régénère src/js/01-tree-data.js (tracé réel) depuis PinDrop — réseau requis, après un patch du jeu
```

Aucune dépendance npm n'est nécessaire hormis Playwright pour `test:e2e` (`npm i -D playwright && npx playwright install chromium`).

## Organisation

```
src/page.html        balisage + marqueurs <!-- INLINE:CSS --> et <!-- INLINE:JS -->
src/styles.css       tous les styles (jetons de couleur clair/sombre)
src/js/NN-*.js       scripts, injectés dans l'ordre du préfixe numérique, chacun dans son <script>
  01-data.js         ST (stats), SETS (armures), RINGS, CAT, WTYPE, WPERK, WEAPONS, SK (compétences), PIPS, AREAS, PRESETS
  01-tree-data.js    TREE : tracé réel de l'arbre 1.0 (243 nœuds x/y, 312 liaisons) — GÉNÉRÉ, ne pas éditer à la main
  02-calc.js         blankBuild, fromPreset, budget, compute(build) → fiche, weaponCalc
  03-share.js        tables figées FZ, encode/decode des codes de partage (b3-…, rétrocompatible b2- et b1-)
  04-tree.js         TOPO (depuis TREE), règles de liaison : reach, canBuy, dijkstra, pathTo, buyPath, prune, normalize, migrate
  05-gems.js         RAR, GEMS (29 gemmes), gemFit
  06-enemies.js      DTYPES (8 types de dégâts), FACTIONS, ENEMIES (101 ennemis × 8 multiplicateurs)
  10-ui.js           état (builds, cur, compare, sec…), onglets des parties (SECS, showSec), rendus (onglets A/B, équipement, arbre en liste, fiche), événements
  20-optimizer.js    calculateur : effVs, investments, buyInvest, planPoints, defense, renderOpt ; renderOptNow ne rend que l'onglet ouvert (optCalc, optBo, optDef, optTab) ; surcharge renderStats pour se rafraîchir
  21-buildopt.js     build optimal : boRun (générateurs, une famille d'arme après l'autre), boMerge, onglet « Build optimal » (boCard, boStart)
  30-graph.js        rendu canvas de l'arbre façon « graph view » d'Obsidian (positions réelles ancrées, survol, zoom), expose window.G (G.wake à l'ouverture de l'onglet Arbre)
  99-init.js         fromHash(); renderSaved(); renderAll();
scripts/build.mjs    assemblage + garde-fous (pas de </script> dans le JS, pas de doctype, < 16 Mo)
scripts/tree-from-pindrop.mjs  régénère src/js/01-tree-data.js depuis le planificateur PinDrop (réseau ; après un patch du jeu)
tests/               run.mjs (lanceur), *.test.js, dom-stub.cjs, e2e.mjs
docs/                ARCHITECTURE, FORMULAS, DATA_SOURCES, ROADMAP, HISTORY
```

Tous les scripts partagent la portée globale (comme dans le navigateur) : une `const` de 01-data.js est visible dans 10-ui.js. Pas de modules ES, pas de bundler : garder ce modèle.

**Ne jamais modifier `dist/` à la main** (il n'est pas versionné) : on édite `src/`, puis `npm run build`.

## Règles impératives

### 1. Contraintes de la page (valables pour l'Artifact ; les respecter garde les deux publications identiques)
- Pas de `<!doctype>`, `<html>`, `<head>`, `<body>` dans `src/page.html` ni dans `dist/forge-embervale.html` (claude.ai ajoute le squelette ; `dist/index.html` le reçoit du build). Le build le vérifie.
- Ressources externes : polices **Google Fonts uniquement** ; scripts seulement depuis cdnjs.cloudflare.com, cdn.jsdelivr.net/npm, unpkg.com (version exacte épinglée). Tout le reste est bloqué sans erreur visible : pas de fetch, pas d'images distantes, pas d'iframe.
- `alert`, `confirm`, `prompt`, `window.print()` ne marchent pas : utiliser `toast()` et `modal()` de 10-ui.js.
- `localStorage` peut lever une exception : toujours passer par `lsGet`/`lsSet` (try/catch, clé en paramètre). Il ne sert qu'aux builds enregistrés localement et à l'onglet ouvert (décision du 2026-11-06).
- Le hash de l'URL ne doit contenir que lettres, chiffres et tirets (c'est le code de partage) : aucune navigation dans le hash (les onglets sont des boutons, l'onglet ouvert vit dans `localStorage`).
- Couleurs : uniquement via les jetons CSS de `:root`, redéfinis dans les deux blocs sombres (`@media (prefers-color-scheme: dark)` avec `:root:not([data-theme="light"])`, et `:root[data-theme="dark"]`). Jamais de couleur littérale dans un composant, sauf les raretés de gemmes (RAR).
- Largeur téléphone (~400 px) : aucun défilement horizontal de la page ; les tableaux larges vont dans `.oscroll`. La gouttière latérale `max(16px, env(safe-area-inset-*))` est sur `body`.
- Pas de nouvelle dépendance si on peut l'éviter.

### 2. Compatibilité des codes de partage (liens déjà envoyés par l'utilisateur)
Les codes enregistrent des **places dans des tables figées** (`FZ`, en tête de 03-share.js), jamais l'ordre des données vivantes :
- `FZ.items` (objets), `FZ.gems` (gemmes) : formats b1, b2 et b3 ;
- `FZ.at`, `FZ.nd` : identifiants de jeu (base 36) des nœuds d'attribut et des compétences du tracé réel, format b3 ;
- `FZ.sk`, `FZ.b1`, `FZ.b2` : formats fermés b1/b2 (ancien ordre de SK, ancien tracé) — **ne changent plus jamais**.

Format actuel : `b3-<en-tête>-<équipement>-<masque attributs>-<masque compétences>-<rangs>[-g<gemmes>]-<contrôle>` (1 chiffre de rang par compétence possédée ; 2 caractères de contrôle : un code tronqué ou abîmé est refusé, avec un message). Les builds enregistrés portent `tv:1` (faits sur le tracé réel) ; sans ce marqueur, ils sont migrés au chargement.

Donc :
- **ajouter un objet, une gemme, une compétence ou un nœud : l'ajouter aussi EN FIN de sa table FZ** (le test des tables figées le réclame). L'ordre de SETS, RINGS, WEAPONS, GEMS, SK ou TREE peut alors changer sans casser de lien.
- Ne jamais réordonner ni retirer une entrée de `FZ` : les empreintes du test cassent, et des liens avec.
- Les codes b1/b2 datent de l'ancien tracé thématique : `decode` les lit via les tables figées, garde l'équipement, les compétences et les comptes d'attributs, puis `migrate` relie le tout au tracé réel (fenêtre « Lien d'avant le tracé réel »).
- `tests/share.test.js` contient des codes b2 et b3 figés : s'ils cassent, un lien existant est cassé. **Ne pas « corriger » le test en changeant une valeur attendue.** Pour b2, le test vérifie (décision du 2026-11-05) que chaque choix est conservé et que seuls des nœuds de liaison sont ajoutés.

### 3. Règle de l'arbre
Un nœud ne s'achète que s'il touche un point de départ (Étincelle, gratuit) ou un nœud acquis qui y est relié (`canBuy`). Retirer un nœud élague tout ce qui n'est plus relié (`prune`). Les presets, les codes importés et les builds enregistrés passent par `normalize`, qui achète le chemin le moins cher pour reconnecter. Toute nouvelle façon de modifier un build doit préserver cet invariant (testé dans rules.test.js, optimizer.test.js et share.test.js).

Le tracé (positions, liaisons) est celui des **fichiers du jeu 1.0**, relevé par PinDrop (`src/js/01-tree-data.js`, régénéré par `scripts/tree-from-pindrop.mjs`). La « Flamme » est un nœud **logique** du simulateur, reliant les 12 départs ; elle n'est jamais dessinée (un vrai nœud, Architecte aérien, occupe le centre). Liaisons non orientées et coût identique à chaque rang : déductions des fichiers (comme PinDrop), à présenter comme telles.

### 4. Honnêteté des données
- Chaque chiffre de jeu doit avoir une source dans `docs/DATA_SOURCES.md`. Ne rien inventer : si une valeur est inconnue, l'afficher comme telle ou demander.
- Distinguer dans l'interface et dans `docs/FORMULAS.md` ce qui est **officiel** (tutoriel en jeu), **extrait des fichiers du jeu** (PinDrop, enshrouded.tools), **estimé par la communauté**, ou **hypothèse** du simulateur.
- Le jeu évolue (patchs) : pour toute donnée « actuelle », vérifier en ligne avant de l'affirmer.

### 5. Langue et style
- Interface en français ; noms d'objets et d'ennemis en anglais (comme dans le jeu, qui n'a pas de traduction officielle utilisée par la communauté) ; noms de compétences traduits avec le nom anglais en italique.
- Typographie française : espace avant `%`, `:`, `?`, `!` ; nombres via `fmt()` (format fr-FR).
- Tout texte venant des données passe par `esc()` avant d'être injecté en HTML.
- Code compact dans le style existant (fonctions courtes sur une ligne, gabarits littéraux). Pas de reformatage massif : ça rend les diffs illisibles.

## Flux de travail attendu
1. Lire `docs/ROADMAP.md` (travaux en attente) et `docs/HISTORY.md` (demandes et décisions passées) avant une évolution importante.
2. Modifier `src/`, ajouter ou adapter un test dans `tests/`.
3. `npm run check` (0 échec), puis `npm run test:e2e` si Playwright est disponible, et **regarder les captures** (clair/sombre, 1300/400 px).
4. Mettre à jour `CHANGELOG.md` (et `docs/FORMULAS.md` / `docs/DATA_SOURCES.md` si besoin), incrémenter la version dans `package.json`.
5. Publier : commit puis `git push` sur `main` → GitHub Actions teste, construit et met à jour la branche `gh-pages` ; GitHub Pages republie ensuite le site en 1 à 2 minutes (vérifier le run avec `gh run list` / `gh run watch`). Pour un travail en cours, utiliser une branche et une pull request (le workflow `tests.yml` la vérifie). Optionnel : si l'outil Artifact est disponible, republier aussi `dist/forge-embervale.html` sur l'URL Artifact.

Voir `/livrer` (.claude/commands/livrer.md) pour la check-list complète.
