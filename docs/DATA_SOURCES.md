# Sources des données

Relevé effectué fin octobre – début novembre 2026, sur la version 1.0 du jeu. Les sites cités lisent les fichiers du jeu ; ils peuvent se mettre à jour après un patch : revérifier avant de corriger une valeur.

| Données | Fichier | Source | Remarques |
|---|---|---|---|
| Arbre de compétences 1.0 (172 compétences, coûts, rangs, effets) | 01-data.js `SK` | [PinDrop – skill tree](https://pindrop.gg/enshrouded/skill-tree) | Textes traduits en français. Coûts, rangs et zones recoupés avec le tracé ci-dessous le 2026-11-05 : 0 écart. |
| **Tracé de l'arbre 1.0** : 243 nœuds (12 départs « Spark », 59 attributs +1, 172 compétences) avec positions x/y, 312 liaisons | 01-tree-data.js `TREE` | [PinDrop – skill tree](https://pindrop.gg/enshrouded/skill-tree) : JSON embarqué dans le bundle du planificateur, extrait par PinDrop des fichiers du **serveur dédié Enshrouded** (Steam app 2278520, build 1267041 release_1.0 ; coûts de 3 nœuds mis à jour au patch #1) | Relevé le 2026-11-05 par `scripts/tree-from-pindrop.mjs` (lecture du JSON, jamais exécuté). Liaisons **non orientées** et **même coût à chaque rang** : déductions de PinDrop (9 nœuds n'ont aucun lien entrant ; un seul coût par nœud dans les fichiers). PinDrop confirme qu'il n'y a **pas de sous-arbres** en 1.0 : les 12 groupes de l'ancienne reconstruction ont été retirés. La Flamme centrale reliant les départs est une représentation du simulateur. |
| Gemmes (29) | 05-gems.js | [PinDrop – gems](https://pindrop.gg/enshrouded/gems) / wiki | Effets et valeurs de base de la carte ; descriptifs, jamais comptés (2.0.0 : deux emplacements, sans arme). |
| Attributs (effets par point, nœuds de Flamme, santé / mana / vigueur de base) | 02-calc.js `compute` | [MetaBot – mechanics](https://metabot.gg/en/enshrouded/mechanics), [wiki – Attributes](https://enshrouded.wiki.gg/wiki/Attributes) | Sans équipement depuis la 2.0.0. |
| **Objectifs (12)** | 06-objectifs.js `GOALS` | Compétences, rangs, attributs et gemmes repris **tels quels** des builds prédéfinis 1.x (inspirés de [KeenGamer – best builds 1.0](https://www.keengamer.com/articles/guides/enshrouded-1-0-best-builds-weapons-armor-skills/) + demandes de l'utilisateur ; Tank = « Sadi Fourbe ») ; vérifié par `tests/objectifs.test.js` contre les codes figés des presets | **Aucun chiffre de jeu nouveau.** Ordre des étapes et raisons : **hypothèse** du simulateur ; les effets cités dans les raisons viennent des descriptions de `SK`. |


## Conflits connus entre sources
Aucun sur les données gardées en 2.0.0 (les conflits sur les ennemis, l'armure et les perks d'arme concernaient des données supprimées ; voir l'historique git).

## Accès aux sites
Le planificateur PinDrop n'était pas lisible par l'outil de récupération web de l'environnement d'origine (claude.ai). Depuis une machine normale, la page et son bundle JS se téléchargent sans navigateur : c'est ce que fait `scripts/tree-from-pindrop.mjs`. Certaines pages wikily.gg restent à vérifier depuis un navigateur.
