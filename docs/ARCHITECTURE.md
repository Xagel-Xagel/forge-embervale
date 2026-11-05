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
- `renderAll()` = onglets + équipement + arbre + fiche (+ calculateur, via la surcharge de `renderStats` dans 20-optimizer.js, avec un délai de 25 ms).
- Graphe (30-graph.js) : chaque nœud est ancré à sa position réelle ; ressorts à la longueur réelle et rappel constant vers l'ancre, sans répulsion ni pré-chauffage : au repos, le tracé est exactement celui du jeu. Glisser un nœud l'étire (élastique), il revient à sa place (immédiatement si mouvement réduit). Libellés GUERRIER / RÔDEUR / MAGE au bord extérieur de chaque zone ; noms placés sans chevauchement par priorité (sélection, survol, recherche, acquis). Halos en sprites mis en cache ; survol avec fondu et hystérésis ; `G.refresh(o)` à chaque rendu, `G.focus(zone)`, `G.resize()`.
- Couleurs du canvas lues depuis les jetons CSS (`--g-*`, `--war`, `--rng`, `--mag`, `--core`), relues quand le thème change.

## Tests
`tests/run.mjs` exécute les scripts de `src/js` dans un contexte Node avec un faux DOM (Proxy qui accepte tout), puis les `*.test.js`. Les tests d'interface ne vérifient donc que « pas d'exception » ; le rendu réel se vérifie avec `tests/e2e.mjs` (Playwright) et les captures.
