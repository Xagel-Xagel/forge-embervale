# Travaux en attente

Classés par valeur pour l'utilisateur. Chaque point indique ce qui bloque et comment le débloquer.
Purgée en 2.0.0 (HISTORY n° 27) : équipement, armes et perks, armure, ennemis, calculateur, défense, build optimal, panneaux et dispositions n'existent plus.

## Priorité haute
1. **Relire l'ordre des étapes et leurs raisons** (`src/js/06-objectifs.js`). Ce sont des choix du simulateur (hypothèse) : à valider ou corriger par l'utilisateur, objectif par objectif (QCM).
2. **Liaisons des combos.** Certains combos paient beaucoup de liaisons (Tank : nœuds éloignés en zone Mage). Piste : rendre utiles les liaisons obligatoires, ou réordonner les étapes pour des chemins plus courts ; à mesurer (coût à 212 points figé dans `tests/objectifs.test.js`). Depuis la 2.3.0, vos ajouts servent déjà de chemin au combo (recalcul) ; le combo sans ajout, lui, n'a pas changé. Mesuré le 2026-11-07 (étude `classes-combinaisons-2026-11-08.md`) : réordonner les 12 ne gagne que 0 à 5 pts à 212 pts (17 en tout), 1 à 4 pts en gardant l'ordre des étapes ; les liaisons chères (Tank 22, Mage critique 29) viennent de compétences éloignées, pas de l'ordre. `npm run optimiser` peut traiter un objectif existant (champ `opt`), mais son combo change alors aux budgets partiels : un ancien lien qui le porte perdrait l'objectif (GO de l'utilisateur requis).

## Priorité moyenne
3. **Objectifs supplémentaires** : fait en partie en 2.4.0 (3 hybrides, Exploration, Récolte). Restent : les 4 anciens presets non repris (Mage de bataille baguette + bâton, Arcaniste du bâton, Gardien du Shroud, Prêtre du feu : tous Mage pur) et les variantes sans objectif (mains nues, poison, objets lancés, dompteur ; aucun build communautaire au 2026-11-07). Ajout EN FIN de `FZ.goals`.
4. **Vérifier le tracé** : PinDrop citerait le build 1285601 (mis à jour le 2026-11-06), notre tracé vient du 1267041 ; les notes du Patch #1 parlent de coûts de mana et de vigueur, l'en-tête de `01-tree-data.js` de coûts mis à jour. Débloquer : `npm run tree` (réseau), comparer, puis `npm run optimiser -- --check`.
5. Vérifier : Pyromane, Homme de glace et Tonnerre s'appliquent-ils aux tirs des arcs élémentaires (Archer élémentaire, 2.4.0 : affiché « non vérifié ») ; bonus additifs ou multiplicatifs ; Aura de terre par rang ou totale ; coût identique à chaque rang (déduction des fichiers).

## Confort
6. Accessibilité du graphe au clavier (aujourd'hui, la vue Liste sert d'alternative).
7. Téléphone : l'arbre vient en dernier dans la colonne ; le remonter après « Objectifs » si l'usage le demande.
