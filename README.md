# Forge d'Embervale

Planificateur d'**arbre de compétences** pour **Enshrouded 1.0**, en français, dans une seule page web.

- Choisissez un **objectif** (12 objectifs prêts : Tank, Épée et bouclier, Archer, Mage critique, Soigneur…) et, si vous voulez, un **secondaire** : le site place vos points selon votre niveau, votre exploration et votre Flamme, et **explique pourquoi**, étape par étape. Vous ajoutez ensuite ce que vous voulez ; les nœuds imposés ne se retirent pas.
- Arbre au **tracé réel du jeu** (243 nœuds et leurs liaisons, 212 points) en graphe façon Obsidian ou en liste, avec la règle de liaison aux points de départ.
- **Gemmes** des deux armes (effets décrits) ; l'équipement n'est pas pris en compte.
- Deux builds A et B, comparaison A contre B, sauvegarde locale et code de partage dans le lien (les anciens liens s'ouvrent toujours).

**Utiliser l'outil : https://xagel-xagel.github.io/forge-embervale/**

Le site est republié automatiquement par GitHub Actions à chaque push sur `main` (tests, build, puis copie du site sur la branche `gh-pages` servie par GitHub Pages). Une copie existe aussi en Artifact claude.ai : https://claude.ai/artifact/GtbdfLTi6yPAcyNxexhV4f

## Démarrer
Prérequis : Node.js 18 ou plus récent.
```bash
npm run dev     # http://localhost:8080, reconstruit à chaque modification de src/
npm test        # tests
npm run build   # dist/index.html (le site, s'ouvre aussi par double-clic) et dist/forge-embervale.html (format Artifact)
```
Avec Claude Code : lancez `claude` dans ce dossier ; il lit `CLAUDE.md` automatiquement. La commande `/livrer` enchaîne vérifications et publication.

## Documentation
- `CLAUDE.md` — règles du projet (à lire en premier)
- `docs/ARCHITECTURE.md` — modèle de données, arbre, rendu, tests
- `docs/FORMULAS.md` — formules de jeu et niveau de confiance
- `docs/DATA_SOURCES.md` — origine de chaque donnée, conflits connus
- `docs/ROADMAP.md` — travaux en attente
- `docs/HISTORY.md` — demandes et décisions passées

Projet de fan, sans lien avec Keen Games. Données issues de PinDrop, enshrouded.tools, du wiki Enshrouded et de MetaBot (voir `docs/DATA_SOURCES.md`).
