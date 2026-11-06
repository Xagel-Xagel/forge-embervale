# Architecture

## Modèle de données d'un build
```js
{
  name: 'Mage de bataille',
  gear: {head, chest, hands, legs, feet, w1, w2, r1, r2},   // identifiants de ITEMS
  gem:  {w1: 'g_curr', w2: 'g_light'},                      // identifiants de GEMS
  sk:   {wizard: 3, ...},                                   // rangs achetés dans l'arbre (hors équipement)
  pn:   {'pip:1rkw3ke': 1, ...},                            // nœuds d'attribut acquis (identifiant de jeu, base 36 ; source de vérité)
  pip:  {int: 11, ...},                                     // comptes dérivés de pn par syncPips()
  lvl: 50, exp: 114, flame: 11, upg: 5,                      // niveau, points d'exploration, Flamme, perks débloqués (0–5)
  tv: 1                                                      // build fait sur le tracé réel (absent = build enregistré avant la 1.9.0 → migré)
}
```
`compute(build)` renvoie la fiche : `attr`, `hp`, `mana`, `sta`, régénérations, `armPhys`/`armMag` (%), résistances, `critC`/`critD`, `merciless`, `sneak`, `vs` (bonus contre familles), `weapons[0..1]` (résultat de `weaponCalc`, + `gem`), `R(id)` = rang effectif (arbre + équipement), `gearRk`.

## Objets
- `ITEMS[id]` regroupe armures (`kind:'armor'`, `base`, `perks`), anneaux (`kind:'ring'`) et armes (`kind:'weapon'`, `cat`, `val`, `type`, `wperks`).
- Perks d'armure/anneau : `['s', stat, valeur]`, `['k', compétence, rangs]`, `['a', typeArmure]` ; débloqués dans l'ordre selon `upg`.

## Arbre (tracé réel du jeu 1.0)
- `TREE` (01-tree-data.js, généré par `scripts/tree-from-pindrop.mjs`) : `nodes` = `[identifiant de jeu base 36, clé, x, y]` (clé = id de compétence, `@str`… pour un attribut +1, `*` pour un départ), `links` = paires d'indices non orientées. Les nœuds d'attribut y sont rangés, par attribut, du moins cher au plus cher d'accès : cet ordre est leur `idx`.
- `TOPO` (04-tree.js) : nœuds `start` (12 Étincelles, gratuites), `skill` (id de SK), `pip` (`pip:<gid>`) aux coordonnées du jeu × `TREE_SCALE` ; `E` = les 312 liaisons réelles (avec leur longueur) ; `byGid` pour le partage. La Flamme (`hub`) est **logique** : reliée aux 12 départs par `nb` seulement, hors de `E`, jamais dessinée.
- `reach(b)` : parcours depuis la Flamme à travers les départs et les nœuds acquis. `dijkstra(b, R, stop)` : coûts depuis les nœuds reliés (pondérés par les nœuds non acquis) ; `pathTo` et la vue liste s'en servent.
- `normalize(b)` : (1) nœuds d'attribut : clés inconnues retirées, manque comblé par attribut avec les premiers nœuds par `idx` (presets, codes b1/b2, builds 1.8 n'ont que des comptes) ; (2) tout nœud isolé est relié par le chemin le moins cher, un Dijkstra multi-cibles par tour ; (3) les liaisons devenues inutiles et les nœuds d'attribut en surplus sont retirés tant que tout reste relié. `migrate(b, from)` = `normalize` + note non énumérable `b._mig` (ajouts, points) pour la fenêtre « Lien d'avant le tracé réel ».

## Partage (03-share.js)
- `FZ` : tables figées (objets, gemmes, ancien ordre de SK, attributs b1, anciens bits b2, identifiants de jeu des attributs et des compétences pour b3). Ajout en fin seulement ; empreintes vérifiées par share.test.js.
- `b3-<en-tête 8>-<équipement 18>-<masque attributs>-<masque compétences>-<rangs>[-g<gemmes 4>]-<contrôle 2>` : masques en base 36 sur `FZ.at` / `FZ.nd`, un chiffre de rang par compétence possédée (`0` si aucune), contrôle `b3sum` (FNV-1a modulo 36²). `decode` ne lève jamais d'exception (null si illisible, tronqué ou abîmé), accepte les majuscules. Un bit sans nœud (version plus récente, ou nœud retiré par un patch) ou un nœud devenu isolé : `migrate(b,'b3')` et fenêtre « Lien fait sur un tracé antérieur ».
- b1/b2 : lus via les tables figées en comptes d'attributs + compétences, puis `migrate`. À l'ouverture d'un tel lien, l'adresse reçoit le code b3 du build migré.

## Rendu
- Onglets des parties (1.15.0, 10-ui.js) : `SECS` (Arbre, Équipement, Calculateur, Build optimal, Défense, Tables) ; `showSec(id)` met à jour le motif ARIA (`role="tab"`/`tabpanel`, `aria-selected`, tabindex itinérant ; clavier ← → Début Fin), n'affiche que le panneau choisi, montre la fiche à droite d'Arbre et d'Équipement (dessous sous 1000 px), déplace le choix de la cible (`#optBar`) dans l'onglet Build optimal, retient l'onglet (`lsSet(id, LS_SEC)`), réveille le graphe (`G.wake`) et rend l'onglet du calculateur ouvert. Aucune écriture dans le hash. Au démarrage, `initSec()` (fin de 10-ui.js) relit l'onglet retenu et l'applique par `showSec(id, true)` avant la création du graphe (caché, il se cale à sa première ouverture). Clic : `secClick` (focus posé sur l'onglet) ; clavier : `secKey` (Alt, Ctrl, Cmd laissés au navigateur). Onglet déjà ouvert : ni écriture, ni rendu, seul le retour en haut de la partie. Messages : `toast()` dans `#toasts` (`role="status"`, empilés) ; arrêt ou fin du build optimal hors de son onglet, et « Comparer A et B » hors de la fiche, sont dits. La hauteur des onglets collés est mesurée dans `--navh` (fiche collée, `scroll-padding-top`).
- `renderAll()` = onglets A/B + équipement + arbre + fiche (+ calculateur, via la surcharge de `renderStats` dans 20-optimizer.js, avec un délai de 25 ms). `renderOptNow` arrête un build optimal périmé quel que soit l'onglet, puis ne rend que l'onglet ouvert (`optCalc`, `optBo`, `optDef`, `optTab`) ; Arbre et Équipement : rien. Tables ne dépend que de la cible : rendue une fois par cible (`tabEn`). Le plan « Répartir au mieux » est gardé dans `planMem` (clé `planKey` : emplacement A/B, cible, arme analysée, build) et réaffiché à l'ouverture du Calculateur.
- Graphe (30-graph.js) : chaque nœud est ancré à sa position réelle ; ressorts à la longueur réelle et rappel constant vers l'ancre, sans répulsion ni pré-chauffage : au repos, le tracé est exactement celui du jeu. Glisser un nœud l'étire (élastique), il revient à sa place (immédiatement si mouvement réduit). Libellés GUERRIER / RÔDEUR / MAGE au bord extérieur de chaque zone ; noms placés sans chevauchement par priorité (sélection, survol, recherche, acquis). Halos en sprites mis en cache ; survol avec fondu et hystérésis ; `G.refresh(o)` à chaque rendu, `G.focus(zone)`, `G.resize()` (taille + recadrage), `G.wake()` (taille seule, cadrage de l'utilisateur gardé). Caché (autre onglet, vue Liste), `W = 0` : rien n'est dessiné ; `resize` ne vide le canvas que si la taille change (l'observateur qui suit `wake` ne le vide pas une seconde fois : pas d'image vide).
- Couleurs du canvas lues depuis les jetons CSS (`--g-*`, `--war`, `--rng`, `--mag`, `--core`), relues quand le thème change.

## Build optimal (21-buildopt.js)
- Générateurs (`function*`) : `boRun` → `boFamily` (une par famille de `BO_FAM`) → `boWeapon` (armes non dominées de `boWeapons`, alternance `boTree` ↔ `boGear`) → `boFinish` (arme gagnante : arbre avec PV, `boLocal`, équipement revu). `boFill` rend la main après chaque achat ; `boDrain` termine d'un coup (tests).
- `boStart` exécute le générateur par tranches de 30 ms (`setTimeout`) ; horloge = temps de calcul seul (`BO.cpu`) ; `boProgress` met à jour le texte et les familles finies à chaque famille (le bouton « Arrêter », dans `#boProg`, n'est pas recréé), `boPaint` à chaque changement d'état ; une exception passe par `boFail` (message, bouton libéré). `BO.key` (emplacement A/B, cible, arme analysée, points, Flamme, améliorations) invalide les résultats périmés ; `BO.N` / `BO.F` sont propres à chaque build (null = valeurs du build) ; `boMerge` produit le build appliqué (nom, niveau, exploration, améliorations, autre arme et gemmes, pièces des emplacements laissés vides repris du build courant).

## Tests
`tests/run.mjs` exécute les scripts de `src/js` dans un contexte Node avec un faux DOM (Proxy qui accepte tout ; `globalThis.__rect` règle la taille rendue par `getBoundingClientRect`), puis les `*.test.js`. `tests/nav.test.js` remplace un temps `document.querySelector` par des faux éléments persistants (`fakeDom`) pour observer l'effet des onglets (ARIA, panneaux, fiche, barre de cible, focus, plan). La CI (`tests.yml`, chaque PR) lance aussi `tests/e2e.mjs` (Playwright 1.64.1, Chromium ; `E2E_LONGTASK_MS=500` relève le seuil des tâches longues sur ces machines plus lentes) et garde les captures 7 jours (artefact « captures-e2e »). Les tests d'interface ne vérifient donc que « pas d'exception » ; le rendu réel se vérifie avec `tests/e2e.mjs` (Playwright) et les captures (dont la carte « Build optimal », avec mesure des tâches longues).
