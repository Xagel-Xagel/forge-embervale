# Forge d'Embervale

Simulateur de stuff pour **Enshrouded 1.0**, en français, dans une seule page web.

- Équipement de fin de jeu : 7 panoplies, anneaux, 53 armes, 29 gemmes, améliorations 0 à 5.
- Arbre de compétences 1.0 au **tracé réel du jeu** (243 nœuds et leurs liaisons, 212 points) en graphe façon Obsidian, avec la règle de liaison aux points de départ.
- Fiche en direct, comparaison de deux builds A/B, 15 builds prédéfinis, sauvegarde locale et code de partage dans le lien.
- Calculateur d'optimisation : faiblesses de 101 ennemis × 8 types de dégâts, classement des armes contre une cible, meilleurs points à investir, calcul des dégâts subis.

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
