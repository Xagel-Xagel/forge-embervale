# Types de classes et combinaisons — étude (2026-11-08)

Demande (2026-11-07) : recenser les types de classes d'Enshrouded 1.0 (pures, hybrides, variantes d'arme, d'élément et de rôle), puis optimiser par type ; ajout en cours de route : « des modes full exploration ou récolte aussi ».

Indicateur : **profil 6 Sensible [R2 K2 A1]** — R2 : optimisation sur le graphe, sans modèle à copier ; K2 : `FZ.goals`, table figée (un ajout est définitif) ; A1 : une zone (objectifs, partage, interface, tests, docs).

Méthode : lecture de `SK`, `TREE`, des 12 objectifs et des 4 soutiens ; mesures par scripts hors `src/` (moteur `combo` réel, Dijkstra, ordres permutés, recherche locale par retrait et reconnexion) : « meilleur trouvé », pas un optimum prouvé. Vérification en ligne les 2026-11-07 et 2026-11-08.

## 1. Faits vérifiés en ligne
- **Pas de classe officielle** en 1.0 : un seul arbre, trois zones autour du Cœur (Warrior, Ranger, Mage), sans les sous-arbres de l'accès anticipé ([PinDrop – skill tree](https://pindrop.gg/enshrouded/skill-tree), mis à jour le 2026-11-06 ; BisectHosting, 2026-10-27). Le wiki.gg affiche encore les sous-arbres de l'accès anticipé (héritage non mis à jour).
- **Version** : 1.0.1.2 (Hotfix #5, 2026-11-04) ; aucun patch après le 2026-11-05 (API Steam, app 1203620 ; patched.gg) ; 1.0 sortie le 2026-10-15.
- **212 points** (98 de niveau + 114 d'exploration) : confirmé (PinDrop, 2026-11-06).
- Comptes : PinDrop annonce 166 compétences et 65 attributs, soit nos 172 et 59 si les 6 nœuds de Flamme comptent comme attributs (**déduit**).
- Sources communautaires inexactes : « Arch Nemesis » (KeenGamer) et « Headhunter » (PowerUp Gaming) n'existent pas dans l'arbre 1.0 relevé. « Battlemage » désigne un mage baguette + bâton chez KeenGamer, un hybride mêlée + magie chez PinDrop.
- **À vérifier, hors de cette étude** : PinDrop citerait un build de jeu 1285601 (tracé du dépôt : 1267041) ; le Patch #1 aurait changé des coûts de mana et de vigueur, pas de points (l'en-tête de `01-tree-data.js` parle de coûts mis à jour).

## 2. Structure de l'arbre (fichiers du jeu)
| Zone | Compétences | Tout au rang max | Départs | Profondeur médiane / max | Zone entière reliée |
|---|---|---|---|---|---|
| Cœur | 19 | 50 pts | 9 départs touchent une compétence du Cœur | 1 / 2 | 50 pts |
| Guerrier | 42 | 165 pts | 4 (Force, Constitution) | 4 / 9 | 174 pts (+9) |
| Rôdeur | 59 | 203 pts | 4 (Dextérité, Endurance) | 4 / 16 | 212 pts (+9) |
| Mage | 52 | 198 pts | 4 (Intelligence, Esprit) | 5 / 13 | 209 pts (+11) |

Profondeur : points de liaison pour atteindre un nœud depuis le départ le plus proche. Les 12 départs sont gratuits et reliés par la Flamme (simulateur) : **un hybride ne paie aucun trajet entre zones**, seulement la profondeur de ses nœuds.

## 3. Recensement
Classe **pure** = une zone ; **hybride** = deux zones, voire trois. Variantes tirées des descriptions de `SK` ; points au rang max → combo relié au moins cher.
- **Armes** : une main 10 → 16 (Guerrier) · deux mains 21 → 24 (G) · mêlée commune 54 → 76 (Cœur + G) · arc 50 → 58 (Rôdeur) · dagues 31 → 37 (R) · baguette 28 → 33 (Mage) · bâton 6 → 11 (M) · baguette ou bâton 9 → 14 (M) · mains nues 6 → 11 (M : Tour de main, Dégage !) · objets lancés 6 → 12 (R) · parade 18 → 30 (C + G + M).
- **Éléments** : feu 20 → 31 · glace 12 → 15 · foudre 12 → 22 · Shroud 6 → 9 (M) · poison 5 → 11 (R) · physique 31 → 52 (G + R).
- **Rôles** : tank 27 → 32 (G) · soin 31 → 43 (M + C + G) · invocation 23 → 40 (M + R : Maître des bêtes, Culture vukah) · contrôle 24 → 46 (G + R + M) · critique 47 → 71 (G + R + M).
- **Hors combat** : Récolte (outils, ressources) 19 → 19 (Cœur) · Exploration (déplacement, Shroud et dangers, nourriture et repos) 68 → 82 (surtout R).
- **Hybrides** : Guerrier + Mage (Tank 46 / 50 %, Paladin 38 / 53 % ; communauté : « Battlemage Hybrid », « Radiant Paladin ») · Guerrier + Rôdeur (Assassin, 12 % de Vétéran ; aucun build communautaire dédié) · Rôdeur + Mage (Mage critique, 4 % de Précision fatale ; aucun build communautaire : « Elemental Archer » est du Rôdeur pur) · trois zones (critique, contrôle ; « Solo Adventurer Hybrid »).

## 4. Couverture par les objectifs actuels
Liaisons du combo complet à 212 points, Flamme 11 : actuel → meilleur trouvé (contenu gardé, ordre libre).

| Objectif | Type | Zones (part des points) | Liaisons |
|---|---|---|---|
| Tank | G + M, tank | G 46 % · M 50 % · C 4 % | 22 → 22 |
| Épée et bouclier | G, une main | G 90 % · C 10 % | 6 → 6 |
| Barbare deux mains | G, deux mains | G 93 % · C 7 % | 10 → 5 |
| Archer | R, arc | R 96 % | 11 → 11 |
| Assassin aux dagues | R (+ Vétéran), dagues | R 86 % · G 12 % | 8 → 8 |
| Mage critique | M (+ Précision fatale), baguette | M 93 % · R 4 % · G 3 % | 29 → 26 |
| Sorcier de feu | M, bâton, feu | M 96 % | 8 → 8 |
| Mage de glace | M, glace, contrôle | M 96 % | 13 → 12 |
| Mage de foudre | M, baguette, foudre | M 96 % | 8 → 8 |
| Nécromancien | M, invocation, Shroud | M 96 % | 12 → 12 |
| Soigneur de groupe | M, soin | M 88 % · G 7 % · C 5 % | 12 → 8 |
| Paladin soigneur | G + M, soin | M 53 % · G 38 % · C 9 % | 19 → 15 |

Soutiens : Survie 18, Endurance 24, Résistances 30 → 27, Mana 13. Les 2 à 3 % de Guerrier des mages sont les 2 Constitution (HISTORY n° 13).
**Non couverts** : hybrides Guerrier + Rôdeur, Rôdeur + Mage, mêlée + sorts ; mains nues, poison, objets lancés, dompteur ; exploration, récolte.

## 5. Ce que rapporte chaque critère (mesuré sur les 12)
- **Combo complet au moindre coût** : 0 à 5 pts par objectif, 17 en tout ; Tank et Mage critique restent chers parce que leurs compétences sont éloignées, pas mal ordonnées (la recherche locale ne trouve rien de plus).
- En gardant l'ordre des étapes : 1 à 4 pts (Barbare, Soigneur, Paladin), aire sous la courbe d'avancée +0 à +1,5 point ; mais le combo change à 0 à 104 budgets sur 107 selon l'objectif : un ancien lien qui porte l'objectif s'ouvrirait souvent sans lui (`fitGoals`).
- **Étapes qui avancent le plus vite** (le plus proche d'abord, priorités perdues) : aire 70 % → 72 % en moyenne, jusqu'à +21 pts d'étapes à un budget donné (Archer à 40 pts).
- **Maximum d'effets à 212 points** : une zone entière tient (174, 212 et 209 pts) ; rien ne reste au secondaire ni au soutien.

## 6. Décisions (QCM, une à la fois)
1. Critère → **moindre coût du combo complet à 212 pts, puis l'avancée la plus rapide** ; l'ordre des étapes (priorités) est gardé.
2. Types → **hybrides manquants** : mêlée + sorts (Guerrier + Mage), Rôdeur + Mage, Guerrier + Rôdeur ; les 12 actuels ne changent pas.
3. Forme → **objectifs prêts + script hors ligne** (`scripts/optimiser-objectifs.mjs`), pour refaire le calcul après un patch.
4. Modes Exploration et Récolte (demande ajoutée) → **objectifs principaux** (groupe « Exploration et récolte »).
5. Contenu → **mélange** : build de la communauté 1.0 quand il existe (marqué « communauté »), sinon composé par le simulateur (« hypothèse »).

Décidé sans QCM, signalé avec le plan (validé) : noms ; aucune gemme (aucune source n'en cite) ; Voie du barbare retirée du build « Battlemage Hybrid » (bonus aux armes à deux mains, ne relie rien : mesuré).

## 7. Objectifs ajoutés (2.4.0)
Builds communautaires relus deux fois (PinDrop, Yurii Luzhko, mis à jour le 2026-11-07, « Checked against Enshrouded 1.0 » ; totaux 58, 50 et 13 pts recoupés avec nos coûts).

| Objectif | Source | Zones | Combo complet à 212 pts |
|---|---|---|---|
| Mage de bataille (épée et baguette) | « Battlemage Hybrid » sans Voie du barbare (communauté) | G 52 % · M 48 % | 57 pts, 0 liaison |
| Archer élémentaire (arc et éléments) | Rôdeur : « Elemental Archer » (communauté) ; Mage : Pyromane, Homme de glace, Tonnerre (simulateur) | R 74 % · M 26 % | 83 pts, 15 liaisons |
| Épée et arc | simulateur (paire mêlée + arc des builds « Solo Adventurer » et « Starter ») | G 55 % · R 42 % · C 3 % | 90 pts, 16 liaisons |
| Exploration | simulateur (aucun build) | R 71 % · G 13 % · C 12 % · M 4 % | 82 pts, 14 liaisons |
| Récolte | « Crafter Survivor » au rang max (communauté) + spécialisations pioche et hache (simulateur) | C 100 % | 25 pts, 0 liaison |

L'optimisation n'ordonne que les éléments de chaque étape ; sur ces contenus, elle gagne surtout en avancée (aire +0 à +1 point), le coût complet étant déjà le meilleur trouvé.
