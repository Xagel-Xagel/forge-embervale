---
description: Vérifier, documenter et publier une nouvelle version de la Forge d'Embervale
---
Livre la version en cours de la Forge d'Embervale. Étapes, dans l'ordre, en t'arrêtant à la première qui échoue :

1. `npm run check` : le build doit passer et les tests afficher 0 échec. Si un test de `tests/share.test.js` échoue, ne modifie pas la valeur attendue : un lien de partage existant serait cassé (voir CLAUDE.md §2).
2. Si Playwright est installé : `npm run test:e2e`, puis ouvre et regarde les 4 captures de `tests/screenshots/` (clair/sombre, 1300 et 400 px). Vérifie : pas de texte illisible dans un des thèmes, pas de débordement horizontal à 400 px, graphe visible, calculateur rempli.
3. Relis le diff de `src/` : pas de couleur littérale hors jetons, pas de ressource externe hors Google Fonts / CDN autorisés, textes injectés passés par `esc()`, interface en français.
4. Mets à jour `CHANGELOG.md`, la version de `package.json`, et `docs/FORMULAS.md` / `docs/DATA_SOURCES.md` / `docs/ROADMAP.md` si le changement les touche.
5. Commit en français décrivant le changement, puis `git push origin main`.
6. Suis le déploiement : `gh run watch` (workflow « Publier sur GitHub Pages »). En cas d'échec, lis le log (`gh run view --log-failed`), corrige, repousse.
7. Vérifie le site en ligne : https://xagel-xagel.github.io/forge-embervale/ (rechargement forcé si l'ancienne version s'affiche).
8. Optionnel : si l'outil Artifact est disponible, republie aussi `dist/forge-embervale.html` sur https://claude.ai/artifact/GtbdfLTi6yPAcyNxexhV4f (lis d'abord l'artifact, puis publie avec `url`).
9. Résume en 2–3 phrases ce qui a changé pour l'utilisateur.

$ARGUMENTS
