# Architecture

## Modèle de données d'un build
```js
{
  name: 'Mage de bataille',
  gear: {head, chest, hands, legs, feet, w1, w2, r1, r2},   // identifiants de ITEMS
  gem:  {w1: 'g_curr', w2: 'g_light'},                      // identifiants de GEMS
  sk:   {wizard: 3, ...},                                   // rangs achetés dans l'arbre (hors équipement)
  pn:   {'pip:int:0': 1, ...},                              // nœuds d'attribut acquis (source de vérité)
  pip:  {int: 11, ...},                                     // comptes dérivés de pn par syncPips()
  lvl: 50, exp: 114, flame: 11, upg: 5                       // niveau, points d'exploration, Flamme, perks débloqués (0–5)
}
```
`compute(build)` renvoie la fiche : `attr`, `hp`, `mana`, `sta`, régénérations, `armPhys`/`armMag` (%), résistances, `critC`/`critD`, `merciless`, `sneak`, `vs` (bonus contre familles), `weapons[0..1]` (résultat de `weaponCalc`, + `gem`), `R(id)` = rang effectif (arbre + équipement), `gearRk`.

## Objets
- `ITEMS[id]` regroupe armures (`kind:'armor'`, `base`, `perks`), anneaux (`kind:'ring'`) et armes (`kind:'weapon'`, `cat`, `val`, `type`, `wperks`).
- Perks d'armure/anneau : `['s', stat, valeur]`, `['k', compétence, rangs]`, `['a', typeArmure]` ; débloqués dans l'ordre selon `upg`.

## Arbre
- `TOPO.N` : nœuds `hub` (Flamme), `start` (12 départs, gratuits), `skill`, `pip` (attribut +1). `n.nb` = voisins.
- Arêtes construites en arbre dans chaque groupe + 3 liaisons entre zones voisines + liaisons entre groupes d'une même zone.
- `reach(b)` : parcours depuis la Flamme à travers les départs et les nœuds acquis. `pathTo` : Dijkstra pondéré par le coût des nœuds non acquis.

## Rendu
- `renderAll()` = onglets + équipement + arbre + fiche (+ calculateur, via la surcharge de `renderStats` dans 20-optimizer.js, avec un délai de 25 ms).
- Graphe (30-graph.js) : simulation de forces (répulsion, ressorts, ancres par groupe), pré-chauffée au chargement ; halos en sprites mis en cache ; survol avec fondu et hystérésis ; `G.refresh(o)` à chaque rendu, `G.focus(zone)`, `G.resize()`.
- Couleurs du canvas lues depuis les jetons CSS (`--g-*`, `--war`, `--rng`, `--mag`, `--core`), relues quand le thème change.

## Tests
`tests/run.mjs` exécute les scripts de `src/js` dans un contexte Node avec un faux DOM (Proxy qui accepte tout), puis les `*.test.js`. Les tests d'interface ne vérifient donc que « pas d'exception » ; le rendu réel se vérifie avec `tests/e2e.mjs` (Playwright) et les captures.
