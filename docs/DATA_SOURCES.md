# Sources des données

Relevé effectué fin octobre – début novembre 2026, sur la version 1.0 du jeu. Les sites cités lisent les fichiers du jeu ; ils peuvent se mettre à jour après un patch : revérifier avant de corriger une valeur.

| Données | Fichier | Source | Remarques |
|---|---|---|---|
| Arbre de compétences 1.0 (172 compétences, coûts, rangs, effets) | 01-data.js `SK` | [PinDrop – skill tree](https://pindrop.gg/enshrouded/skill-tree) | Textes traduits en français. Coûts, rangs et zones recoupés avec le tracé ci-dessous le 2026-11-05 : 0 écart. |
| **Tracé de l'arbre 1.0** : 243 nœuds (12 départs « Spark », 59 attributs +1, 172 compétences) avec positions x/y, 312 liaisons | 01-tree-data.js `TREE` | [PinDrop – skill tree](https://pindrop.gg/enshrouded/skill-tree) : JSON embarqué dans le bundle du planificateur, extrait par PinDrop des fichiers du **serveur dédié Enshrouded** (Steam app 2278520, build 1267041 release_1.0 ; coûts de 3 nœuds mis à jour au patch #1) | Relevé le 2026-11-05 par `scripts/tree-from-pindrop.mjs` (lecture du JSON, jamais exécuté). Liaisons **non orientées** et **même coût à chaque rang** : déductions de PinDrop (9 nœuds n'ont aucun lien entrant ; un seul coût par nœud dans les fichiers). PinDrop confirme qu'il n'y a **pas de sous-arbres** en 1.0 : les 12 groupes de l'ancienne reconstruction ont été retirés. La Flamme centrale reliant les départs est une représentation du simulateur. |
| Armures (7 panoplies), anneaux | 01-data.js `SETS`, `RINGS` | PinDrop, [wiki Enshrouded](https://enshrouded.wiki.gg) | Stats de base + 5 perks débloqués par amélioration. Pas de bonus de panoplie en 1.0. Pas de valeur d'armure finale. |
| Armes (53) | 01-data.js `WEAPONS` | [wiki Enshrouded](https://enshrouded.wiki.gg), guides | Dégâts = estimation au niveau requis. Type principal seulement. |
| Gemmes (29) | 05-gems.js | PinDrop / wiki | Effets et valeurs de base de la carte ; non convertis en dégâts. |
| Attributs | 02-calc.js | [MetaBot – mechanics](https://metabot.gg/en/enshrouded/mechanics), [wiki – Attributes](https://enshrouded.wiki.gg/wiki/Attributes) | |
| Faiblesses des ennemis (101) | 06-enemies.js | [PinDrop – enemy weaknesses](https://pindrop.gg/enshrouded/enemy-weaknesses), [PinDrop – enemies](https://pindrop.gg/enshrouded/enemies) | Valeur absente = 100. |
| Hollow Damned, Hollow Wretch | 06-enemies.js | [enshrouded.tools – 1.0](https://enshrouded.tools/1-0) | Absents de PinDrop. |
| Armure (−1 par point, plafond 60 %) | 20-optimizer.js `defense()` | Tutoriel en jeu, repris par [wiki – Combat Mechanics](https://enshrouded.wiki.gg/wiki/Combat_Mechanics) et enshroudedmap.com | Seule formule défensive officielle trouvée. |
| Modèle de dégâts, critiques | 02-calc.js | [enshroudedcompanion – calculateur](https://enshroudedcompanion.com), [NKB Gaming – DPS](https://nkbgaming.com), [shrouded.tools](https://shrouded.tools), MetaBot | Estimations communautaires concordantes sur le principe, pas sur les détails. |
| Builds prédéfinis | 01-data.js `PRESETS` | Inspirés de [KeenGamer – best builds 1.0](https://www.keengamer.com/articles/guides/enshrouded-1-0-best-builds-weapons-armor-skills/) + demandes de l'utilisateur | « Sadi Fourbe » : tank à vol de vie passif, demandé par l'utilisateur. Revue 1.10.0 : attributs et compétences ajustés d'après le coût de liaison mesuré sur le tracé réel (`01-tree-data.js`, PinDrop) et l'effet des compétences (`SK`) — voir HISTORY n° 13. |

## Conflits connus entre sources
- **Feux follets (wisps)** : valeurs différentes entre PinDrop et enshrouded.tools → **exclus**.
- **Fell Banshee**, **Hollow Reaper** : légers écarts → valeurs PinDrop retenues.
- Formule d'armure `Armure/(Armure+400)` (NKB) : non vérifiée, contredit le tutoriel → non utilisée.

## Accès aux sites
Le planificateur PinDrop n'était pas lisible par l'outil de récupération web de l'environnement d'origine (claude.ai). Depuis une machine normale, la page et son bundle JS se téléchargent sans navigateur : c'est ce que fait `scripts/tree-from-pindrop.mjs`. Certaines pages wikily.gg restent à vérifier depuis un navigateur.
