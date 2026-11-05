# Travaux en attente

Classés par valeur pour l'utilisateur. Chaque point indique ce qui bloque et comment le débloquer.

## Priorité haute
1. **Revoir les presets sur le tracé réel.** Depuis la 1.9.0, `normalize` leur ajoute des nœuds de liaison (ex. un mage à 11 CON traverse la zone Guerrier : Voie du guerrier, Taillade, Plaques lourdes…). Choisir des attributs et compétences cohérents avec le vrai tracé, sources à l'appui ; les codes b3 déjà partagés ne bougent pas.
2. **Dégâts mixtes des armes.** Beaucoup d'armes infligent deux types (ex. tranchant + glace). Trouver la répartition (fichiers du jeu via PinDrop/enshrouded.tools) et l'ajouter à `WEAPONS` sous forme de parts ; `vsEnemy` devient `Σ part × multiplicateur`. Ajouter un champ ou réordonner ne casse pas les codes (tables figées `FZ`, CLAUDE.md §2).
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
