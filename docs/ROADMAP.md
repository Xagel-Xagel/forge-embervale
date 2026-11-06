# Travaux en attente

Classés par valeur pour l'utilisateur. Chaque point indique ce qui bloque et comment le débloquer.

## Priorité haute
0. **Harmonisation de l'interface — direction B « Panneaux » validée (2026-11-06).** Étude et plan : `docs/etudes/harmonisation-interface-2026-11-06.md` (3 phases, une PR chacune ; phase 1 = coque des panneaux, mode Organiser, dispositions, accordéon à 400 px). Maquettes : canevas Claude Design (lien dans l'étude).
1. **Presets : liaisons restantes.** Revue 1.10.0 faite (277 → 155 points de liaison). Reste : Sadi Fourbe (22, build de l'utilisateur, non touché) et les liaisons structurelles (ex. Rôdeur archer : Esprit calme, Lames venimeuses, Mithridatisé) ; envisager de rendre utiles les liaisons obligatoires (rang 3 si l'effet sert le rôle).
2. **Perks élémentaires des armes.** Les répartitions 1.0 sont intégrées (1.11.0) ; les 5 emplacements de perks de chaque arme aussi, chance et dégâts de coup critique comptés (1.17.0). Reste à savoir comment le jeu ajoute « Feu magique +10 % des dégâts de base » (PinDrop) : vérification en jeu ou nouvelle extraction ; aujourd'hui hors calcul.
3. **Valeurs d'armure par pièce — BLOQUÉ (2026-11-06).** PinDrop (https://pindrop.gg/enshrouded/armor) : pour les sets 1.0 (Emberguard, Crestflame…), « the game files do not store the number » ; seules les pièces d'avant la 1.0 ont une valeur (wiki). Déblocage : relevé en jeu par l'utilisateur. En attendant, le calculateur de défense prend l'armure de la fiche en jeu (saisie manuelle).
12. **Base des autres familles d'armes (fichiers 1.0).** Les fichiers 1.0 donnent un multiplicateur par arme, le même dans presque toute une famille (une main ×1, deux mains ×1,5, dagues ×1,1 sauf Valor Heart ×1, arcs ×0,5) ; baguettes et bâtons ont reçu une base commune en 1.17.0 (HISTORY n° 23). Aligner les autres familles changerait le classement des armes, le build optimal et les presets : à décider avec l'utilisateur (QCM). Source : PinDrop, pages armes (relevé du 2026-11-06 déjà fait).

## Priorité moyenne
4. **Attaques des ennemis — BLOQUÉ (2026-11-06).** PinDrop (pages ennemis, fichiers 1.0) : liste des attaques avec portée et menace, mais ni dégâts ni type ; seul un facteur relatif (« Damage scaling ×0.5 of the baseline enemy »). Déblocage : relevé en jeu. « Coup reçu » reste saisi à la main.
5. Intégrer les gemmes et perks d'arme qui ajoutent des dégâts (Lumière focalisée, Courants, Saignement, Sans pitié et Opportuniste contre une cible trempée…) dans un « DPS conditionnel » séparé.
6. Vérifier : nombre d'améliorations par rareté (hypothèse : 5 = les 5 perks d'une arme ou d'une armure) ; surcharge des baguettes (loi de tirage) ; bonus additifs ou multiplicatifs ; Aura de terre par rang ou totale ; compétences qui relèvent le plafond de 60 % ; modificateur deux mains ×1,5.
7. Feux follets : trancher entre les sources (vérification en jeu ou nouvelle extraction).
8. Points faibles, attaques impitoyables et furtives dans le classement (option « burst »).

## Confort
9. Accessibilité du graphe au clavier (aujourd'hui, la vue Liste sert d'alternative).
10. Mémoriser la cible et les réglages de défense (localStorage, try/catch).
11. Comparaison A/B dans le calculateur (même cible, deux builds).
