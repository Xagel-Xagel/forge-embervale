# Journal des versions

Numéros = versions de l'Artifact publié sur claude.ai (les premières étapes ont pu être publiées plusieurs fois).

## 1.8.0 — 2026-11-05 · Calculateur d'optimisation
- 101 ennemis × 8 multiplicateurs de dégâts (PinDrop, enshrouded.tools), table complète filtrable.
- Vos armes contre la cible, classement des 53 armes, meilleurs points à investir (chemin compris), bouton Acheter/Équiper.
- Défense : armure officielle (−1 par point, plafond 60 %), poison hors armure, résistances, Tour/Gardien/Aura de terre, coups avant K.O.
- Panneau « Formules utilisées et niveau de confiance ».
- Passage en dépôt : sources découpées dans `src/`, build, tests, documentation pour Claude Code.
- Publication sur GitHub Pages par GitHub Actions (https://xagel-xagel.github.io/forge-embervale/), icône d'onglet, vraie page HTML (`dist/index.html`).

## Étapes précédentes (même journée)
- Gemmes d'arme (29), alerte de type de dégâts incompatible, code de partage `-g…`.
- Règle de liaison de l'arbre (père acquis obligatoire), achat du chemin le plus court, élagage, format de code `b2-` (rétrocompatible `b1-`).
- Correction du scintillement au survol des nœuds du graphe.
- Preset « Sadi Fourbe » (tank à vol de vie passif).
- Nouveaux presets mage et soin.
- Arbre de compétences en graphe à forces façon Obsidian.
- Version initiale : équipement, arbre en liste, fiche, comparaison A/B, sauvegarde, partage, presets.
