# Travaux en attente

Classés par valeur pour l'utilisateur. Chaque point indique ce qui bloque et comment le débloquer.
Purgée en 2.0.0 (HISTORY n° 27) : équipement, armes et perks, armure, ennemis, calculateur, défense, build optimal, panneaux et dispositions n'existent plus.

## Priorité haute
1. **Relire l'ordre des étapes et leurs raisons** (`src/js/06-objectifs.js`). Ce sont des choix du simulateur (hypothèse) : à valider ou corriger par l'utilisateur, objectif par objectif (QCM).
2. **Liaisons des combos.** Certains combos paient beaucoup de liaisons (Tank : nœuds éloignés en zone Mage). Piste : rendre utiles les liaisons obligatoires, ou réordonner les étapes pour des chemins plus courts ; à mesurer (coût à 212 points figé dans `tests/objectifs.test.js`). Depuis la 2.3.0, vos ajouts servent déjà de chemin au combo (recalcul) ; le combo sans ajout, lui, n'a pas changé.

## Priorité moyenne
3. **Objectifs supplémentaires** : les 4 anciens presets non repris (Mage de bataille, Arcaniste du bâton, Gardien du Shroud, Prêtre du feu) ou de nouveaux, sur demande. Ajout EN FIN de `FZ.goals`.
4. Vérifier : bonus additifs ou multiplicatifs ; Aura de terre par rang ou totale ; coût identique à chaque rang (déduction des fichiers).

## Confort
5. Accessibilité du graphe au clavier (aujourd'hui, la vue Liste sert d'alternative).
6. Téléphone : l'arbre vient en dernier dans la colonne ; le remonter après « Objectifs » si l'usage le demande.
