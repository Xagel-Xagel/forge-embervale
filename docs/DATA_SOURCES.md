# Sources des données

Relevé effectué fin octobre – début novembre 2026, sur la version 1.0 du jeu. Les sites cités lisent les fichiers du jeu ; ils peuvent se mettre à jour après un patch : revérifier avant de corriger une valeur.

| Données | Fichier | Source | Remarques |
|---|---|---|---|
| Arbre de compétences 1.0 (172 compétences, coûts, rangs, effets) | 01-data.js `SK` | [PinDrop – skill tree](https://pindrop.gg/enshrouded/skill-tree) | Textes traduits en français. La **position** des nœuds n'est pas publiée : le graphe (04-tree.js) est une reconstruction thématique. |
| Armures (7 panoplies), anneaux | 01-data.js `SETS`, `RINGS` | PinDrop, [wiki Enshrouded](https://enshrouded.wiki.gg) | Stats de base + 5 perks débloqués par amélioration. Pas de bonus de panoplie en 1.0. Pas de valeur d'armure finale. |
| Armes (53) | 01-data.js `WEAPONS` | [wiki Enshrouded](https://enshrouded.wiki.gg), guides | Dégâts = estimation au niveau requis. Type principal seulement. |
| Gemmes (29) | 05-gems.js | PinDrop / wiki | Effets et valeurs de base de la carte ; non convertis en dégâts. |
| Attributs | 02-calc.js | [MetaBot – mechanics](https://metabot.gg/en/enshrouded/mechanics), [wiki – Attributes](https://enshrouded.wiki.gg/wiki/Attributes) | |
| Faiblesses des ennemis (101) | 06-enemies.js | [PinDrop – enemy weaknesses](https://pindrop.gg/enshrouded/enemy-weaknesses), [PinDrop – enemies](https://pindrop.gg/enshrouded/enemies) | Valeur absente = 100. |
| Hollow Damned, Hollow Wretch | 06-enemies.js | [enshrouded.tools – 1.0](https://enshrouded.tools/1-0) | Absents de PinDrop. |
| Armure (−1 par point, plafond 60 %) | 20-optimizer.js `defense()` | Tutoriel en jeu, repris par [wiki – Combat Mechanics](https://enshrouded.wiki.gg/wiki/Combat_Mechanics) et enshroudedmap.com | Seule formule défensive officielle trouvée. |
| Modèle de dégâts, critiques | 02-calc.js | [enshroudedcompanion – calculateur](https://enshroudedcompanion.com), [NKB Gaming – DPS](https://nkbgaming.com), [shrouded.tools](https://shrouded.tools), MetaBot | Estimations communautaires concordantes sur le principe, pas sur les détails. |
| Builds prédéfinis | 01-data.js `PRESETS` | Inspirés de [KeenGamer – best builds 1.0](https://www.keengamer.com/articles/guides/enshrouded-1-0-best-builds-weapons-armor-skills/) + demandes de l'utilisateur | « Sadi Fourbe » : tank à vol de vie passif, demandé par l'utilisateur. |

## Conflits connus entre sources
- **Feux follets (wisps)** : valeurs différentes entre PinDrop et enshrouded.tools → **exclus**.
- **Fell Banshee**, **Hollow Reaper** : légers écarts → valeurs PinDrop retenues.
- Formule d'armure `Armure/(Armure+400)` (NKB) : non vérifiée, contredit le tutoriel → non utilisée.

## Sites inaccessibles depuis l'environnement d'origine
Le planificateur PinDrop (`pindrop.gg/enshrouded/skill-tree/...`) et certaines pages wikily.gg n'étaient pas lisibles par l'outil de récupération web. Depuis une machine normale (ou un navigateur piloté), ils le sont.
