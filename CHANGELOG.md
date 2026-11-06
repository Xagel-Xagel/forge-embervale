# Journal des versions

Numéros = versions de l'Artifact publié sur claude.ai (les premières étapes ont pu être publiées plusieurs fois).

## 1.13.0 — 2026-11-06 · Build optimal (équipement + arbre)
- Calculateur, nouvelle carte **« Build optimal contre <ennemi> »** : pour des **points disponibles** et un **niveau de Flamme** donnés, l'optimiseur part d'un arbre vide et choisit l'arme, les 5 pièces d'armure, 2 anneaux et l'arbre qui maximisent les dégâts moyens contre la cible ; les PV départagent les égalités et reçoivent les points restants. Bouton **« Appliquer »** par résultat.
- **Un résultat par famille** (mêlée une main, mêlée deux mains, dagues, arcs, baguettes, bâtons), sans classement entre familles : « Dégâts » et « Puissance » ne se comparent pas et la vitesse d'attaque n'est pas comptée.
- Méthode : chaque arme non dominée est essayée ; arbre par deux gloutons (avec un regard à deux achats quand un achat seul ne rapporte rien, ex. Essences de vie sans Intelligence) ; équipement pièce par pièce + meilleure paire d'anneaux ; alternance jusqu'à stabilité ; amélioration locale quand le budget manque. Affiché « heuristique, pas une preuve d'optimalité ».
- Mesures : 0,6 à 3,5 s pour les 6 familles selon le budget (Node), aucune tâche de plus de 50 ms dans le navigateur (calcul découpé, bouton « Arrêter ») ; plafond de 10 s. Contrôles : aucune des 32 768 combinaisons d'armures ne fait mieux sur 3 cas, chaque preset est égalé ou battu à budget égal.
- Gemmes non choisies (aucun effet chiffré) : la gemme actuelle reste si elle est compatible avec la nouvelle arme ; l'autre arme, le nom, le niveau et l'exploration du build ne changent pas.
- CLAUDE.md : l'Artifact claude.ai est en version 12 (et non 11).

## 1.12.0 — 2026-11-06 · Optimiseur multi-points
- Calculateur, carte « Où placer vos prochains points » : **« Répartir au mieux N points »** donne le plan d'achat (nœuds, coûts, cumul) qui maximise les dégâts moyens de l'arme analysée contre la cible, chemins d'accès compris ; bouton « Appliquer le plan ».
- Méthode : deux gloutons (gain par point, gain brut) puis amélioration locale (retirer une étape et re-remplir) ; affichée comme non garantie optimale. Le plan s'arrête quand plus rien n'augmente les dégâts.

## 1.11.0 — 2026-11-06 · Dégâts mixtes des armes
- Les 16 armes à deux types de dégâts (ex. Aurora Sword : tranchant 50 % + glace 50 %) sont calculées part par part contre chaque ennemi, d'après les **fichiers du jeu 1.0** (PinDrop) ; les 21 autres armes de mêlée, dagues et baguettes restent à 100 % d'un type.
- Une compétence de type (Taillade, Pyromane, Tonnerre…) ne compte que sur sa part ; le détail des bonus l'indique (« part tranchant 50 % »).
- Immunité partielle : un Fell, immunisé au Shroud, subit encore la part contondante de Rotblood.
- Arcs et bâtons : type affiché « selon la flèche / le sort » (aucune répartition dans les fichiers).
- Gemmes : l'alerte de type tient compte des deux types de l'arme. Perks élémentaires toujours hors calcul (formule inconnue).

## 1.10.0 — 2026-11-05 · Presets revus sur le tracé réel
- Les 15 builds prédéfinis perdent beaucoup moins de points en nœuds de liaison : **277 → 155** au total (mesure : points dépensés après `normalize` − points choisis).
- Mages et soigneurs : **2 CON** au lieu de 6 à 11 — les deux nœuds CON voisins d'un départ (1 point chacun) ; les autres imposaient de traverser la zone Guerrier (Voie du guerrier, Taillade, Plaques…).
- Rôdeur archer : CON 11 → 2, sans *Peau épaisse* (24 → 11) ; Barbare : FOR 11 → 10, le 11ᵉ coûtait 4 liaisons (9 → 5) ; Assassin : DEX 7 → 6 (12 → 9) ; Arcaniste et Prêtre du feu : sans *Précision fatale* (zone Rôdeur, 5 liaisons chacun). Sadi Fourbe inchangé (build demandé par l'utilisateur).
- Tests : plafond de points de liaison par preset, règle des 2 CON. Les codes `b3-` déjà partagés ne changent pas (ils enregistrent leurs propres nœuds).

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
