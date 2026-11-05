# Travaux en attente

Classés par valeur pour l'utilisateur. Chaque point indique ce qui bloque et comment le débloquer.

## Priorité haute
1. **Tracé réel de l'arbre de compétences.** Le graphe actuel est une reconstruction (groupes thématiques, liaisons inventées). L'utilisateur l'a demandé (« il te faut quoi pour avoir le tracé réel du jeu ? une image te suffirait ? »).
   - Sources possibles : une capture de l'arbre en jeu fournie par l'utilisateur (une image par zone, zoomée, suffit pour relever positions et liaisons), ou le planificateur PinDrop (pindrop.gg/enshrouded/skill-tree) ouvert dans un navigateur — ses données de liaison sont peut-être dans le JSON de la page.
   - Impact : remplacer `CLUSTERS`/`TOPO` (04-tree.js) par des positions et arêtes réelles ; garder le rendu Obsidian (30-graph.js) avec des ancres fixes.
   - ⚠️ Change `TOPO.pips` → **nouveau format de code `b3-`** obligatoire, avec lecture des anciens codes (voir CLAUDE.md §2). Pour b2, migrer en convertissant les nœuds d'attribut en comptes par attribut (comme b1) puis `normalize`.
   - Mettre à jour le libellé « reconstruction thématique » dans la page et les notes.
2. **Dégâts mixtes des armes.** Beaucoup d'armes infligent deux types (ex. tranchant + glace). Trouver la répartition (fichiers du jeu via PinDrop/enshrouded.tools) et l'ajouter à `WEAPONS` sous forme de parts ; `vsEnemy` devient `Σ part × multiplicateur`. Attention : ajouter un champ ne casse pas les codes, réordonner si.
3. **Valeurs d'armure par pièce.** Si une source 1.0 les publie, calculer l'armure physique/magique dans `compute()` (avec Plaques lourdes/brillantes) et pré-remplir le calculateur de défense.

## Priorité moyenne
4. Attaques des ennemis (dégâts et type par attaque) pour pré-remplir « Coup reçu ».
5. Intégrer les gemmes et perks d'arme qui ajoutent des dégâts (Lumière focalisée, Courants, Saignement…) dans un « DPS conditionnel » séparé.
6. Vérifier : bonus additifs ou multiplicatifs ; Aura de terre par rang ou totale ; compétences qui relèvent le plafond de 60 % ; modificateur deux mains ×1,5.
7. Feux follets : trancher entre les sources (vérification en jeu ou nouvelle extraction).
8. Points faibles, attaques impitoyables et furtives dans le classement (option « burst »).

## Confort
9. Accessibilité du graphe au clavier (aujourd'hui, la vue Liste sert d'alternative).
10. Mémoriser la cible et les réglages de défense (localStorage, try/catch).
11. Optimiseur multi-points (« meilleure répartition de N points ») — glouton sur `investments()` puis amélioration locale.
12. Comparaison A/B dans le calculateur (même cible, deux builds).
