# Travaux en attente

Classés par valeur pour l'utilisateur. Chaque point indique ce qui bloque et comment le débloquer.

## Priorité haute
1. **Presets : liaisons restantes.** Revue 1.10.0 faite (277 → 155 points de liaison). Reste : Sadi Fourbe (22, build de l'utilisateur, non touché) et les liaisons structurelles (ex. Rôdeur archer : Esprit calme, Lames venimeuses, Mithridatisé) ; envisager de rendre utiles les liaisons obligatoires (rang 3 si l'effet sert le rôle).
2. **Perks élémentaires des armes.** Les répartitions 1.0 sont intégrées (1.11.0). Reste à savoir comment le jeu ajoute « Feu magique +10 % des dégâts de base » (PinDrop) : vérification en jeu ou nouvelle extraction ; aujourd'hui hors calcul.
3. **Valeurs d'armure par pièce — BLOQUÉ (2026-11-06).** PinDrop (https://pindrop.gg/enshrouded/armor) : pour les sets 1.0 (Emberguard, Crestflame…), « the game files do not store the number » ; seules les pièces d'avant la 1.0 ont une valeur (wiki). Déblocage : relevé en jeu par l'utilisateur. En attendant, le calculateur de défense prend l'armure de la fiche en jeu (saisie manuelle).

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
