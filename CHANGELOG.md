# Journal des versions

Numéros = versions de l'Artifact publié sur claude.ai (les premières étapes ont pu être publiées plusieurs fois).

## 1.9.0 — 2026-11-05 · Tracé réel de l'arbre de compétences
- L'arbre reprend le **tracé du jeu 1.0** : 243 nœuds à leur position réelle et 312 liaisons, extraits des fichiers du serveur dédié par PinDrop (`src/js/01-tree-data.js`, régénéré par `scripts/tree-from-pindrop.mjs`). Les 12 groupes thématiques inventés disparaissent (la 1.0 n'a pas de sous-arbres).
- Graphe : chaque nœud est ancré à sa vraie place (glisser = effet élastique, retour automatique), libellés GUERRIER / RÔDEUR / MAGE, noms sans chevauchement, la Flamme n'est plus dessinée (un vrai nœud occupe le centre). La règle devient « relié à un point de départ (Étincelle) ».
- **Nouveau code de partage `b3-`** (~125 caractères, 40 % plus court) fondé sur des tables figées : ajouter ou réordonner des données ne cassera plus de lien. Une somme de contrôle fait refuser un lien tronqué ou abîmé (message affiché) au lieu de donner un autre build.
- Les liens `b2-`/`b1-` et les builds enregistrés avant cette version s'ouvrent toujours : choix conservés, nœuds de liaison ajoutés, fenêtre qui les liste (et signale un éventuel dépassement de budget) ; l'adresse passe en `b3-`.
- Vue Liste : bouton « Acheter le chemin » pour un attribut dont aucun nœud n'est voisin ; à 400 px, les boutons +/− des attributs ne débordent plus.
- `normalize` retire les liaisons devenues inutiles et les attributs en surplus (ex. Sadi Fourbe 142 pts au lieu de 147) ; calculs de chemin plus rapides (un seul Dijkstra par tour).
- Le panneau « Formules utilisées » indique ce qui vient des fichiers (tracé) et ce qui est déduit (liaisons dans les deux sens, coût par rang).
- Revue `/code-review` : 15 points relevés, tous corrigés (dont le générateur, qui filtre désormais tout texte distant recopié).

## 1.8.0 — 2026-11-05 · Calculateur d'optimisation
- 101 ennemis × 8 multiplicateurs de dégâts (PinDrop, enshrouded.tools), table complète filtrable.
- Vos armes contre la cible, classement des 53 armes, meilleurs points à investir (chemin compris), bouton Acheter/Équiper.
- Défense : armure officielle (−1 par point, plafond 60 %), poison hors armure, résistances, Tour/Gardien/Aura de terre, coups avant K.O.
- Panneau « Formules utilisées et niveau de confiance ».
- Passage en dépôt : sources découpées dans `src/`, build, tests, documentation pour Claude Code.
- Publication sur GitHub Pages via la branche `gh-pages`, mise à jour par GitHub Actions (https://xagel-xagel.github.io/forge-embervale/), icône d'onglet, vraie page HTML (`dist/index.html`).

## Étapes précédentes (même journée)
- Gemmes d'arme (29), alerte de type de dégâts incompatible, code de partage `-g…`.
- Règle de liaison de l'arbre (père acquis obligatoire), achat du chemin le plus court, élagage, format de code `b2-` (rétrocompatible `b1-`).
- Correction du scintillement au survol des nœuds du graphe.
- Preset « Sadi Fourbe » (tank à vol de vie passif).
- Nouveaux presets mage et soin.
- Arbre de compétences en graphe à forces façon Obsidian.
- Version initiale : équipement, arbre en liste, fiche, comparaison A/B, sauvegarde, partage, presets.
