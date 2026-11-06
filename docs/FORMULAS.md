# Formules de jeu utilisées

Niveau de confiance : **officiel** (texte du jeu), **fichiers** (valeurs extraites des fichiers du jeu par des sites tiers), **communauté** (estimation non vérifiée), **hypothèse** (choix du simulateur faute de source).

## Progression (fichiers / wiki)
| Règle | Valeur | Confiance |
|---|---|---|
| Niveau max | 50 ; équipement jusqu'au niveau 55 | fichiers |
| Points de compétence | 2 par niveau (98) + 114 d'exploration (Racines du Shroud 1 pt, Puits d'élixir 3 pts) = **212** | wiki |
| `budget(b)` | `2 × (niveau − 1) + exploration` | — |
| Bonus de panoplie | **aucun en 1.0** | fichiers (PinDrop) |
| Nœuds « Flamme » (Barbare, Démarche gracieuse, Exalté, Concentration arcanique, Peau épaisse, Flamme d'endurance) | +1 attribut tous les 2 niveaux de Flamme (Flamme max 11 → +5) | wiki |

## Attributs (MetaBot, wiki)
| Attribut | Effet par point |
|---|---|
| Constitution | +50 PV |
| Esprit | +20 mana |
| Endurance | +10 vigueur |
| Force | +5 % de dégâts de mêlée |
| Dextérité | +5 % de dégâts aux arcs et dagues |
| Intelligence | +5 % de dégâts magiques (baguettes, bâtons) |

Base : 100 PV, 100 mana, 100 vigueur. Critique de base : 10 % de chance, +80 % de dégâts.

Implémenté dans `compute()` (src/js/02-calc.js). Quelques compétences convertissent un attribut en PV : Athlète (3 × Force par rang), Vigueur voilée (3 × Dex), Essences de vie (3 × Int).

## Dégâts infligés (communauté)
```
coup     = base de l'arme × (1 + Σ bonus %)                        weaponCalc()
moyenne  = coup × (1 + chance de critique × dégâts critiques)
sur cible = coup × multiplicateur du type × (1 + bonus contre la famille)   vsEnemy()
```
- Σ bonus : attribut de la famille d'arme, compétences de famille (Voie du guerrier, Voie du barbare, Tranchant du titan, Tireur d'élite, Maîtrise des dagues, Apprenti mage, Maîtrise des baguettes, Lanceur de sorts), compétences de type (Taillade, Brute, Estoc, Perforation, Pyromane, Homme de glace, Tonnerre, Arts sombres), stats d'équipement.
- Arme mixte : `coup = Σ base × part × (1 + bonus communs + bonus du type de la part)`. Une compétence ou stat de type (Taillade, Pyromane, « tous dégâts contondants »…) ne joue que sur sa part (**hypothèse** : lecture littérale des descriptions).
- Perks d'arme (**fichiers** 1.0, PinDrop ; noms officiels MetaBot fr_FR) : 5 emplacements par arme, dans l'ordre ; **hypothèse** : un emplacement débloqué par amélioration, dans cet ordre (curseur Améliorations, 5 = les 5), comme pour les armures — les notes de version officielles disent seulement que l'amélioration débloque les perks et que la rareté fixe le nombre d'améliorations.
  - **Comptés** (1.17.0) : « Chance de coup critique » (+3 à +9 % selon le palier) ajoutée à la chance de CETTE arme, « Dégâts de coup critique » (+10 à +24 %) ajoutés à ses dégâts critiques : `moyenne = coup × (1 + chance de l'arme × dégâts critiques de l'arme)`, chance plafonnée à 100 %.
  - **Non comptés**, affichés : « Lourd (Feu) » et autres perks d'un type (« +10 % des dégâts de base », PinDrop : décision du 2026-11-06, la façon dont le jeu les ajoute n'étant pas dans les fichiers) ; « Tous les dégâts magiques de… » (portée non documentée) ; « Sans pitié » et « Opportuniste » (dégâts / chance de coup critique contre une cible **trempée** : conditionnels) ; Attaque impitoyable, dans le dos, vols, Renouvellement, rangs de compétence d'une arme (actifs quand l'arme n'est pas en main : non vérifié), contre une faction.
  - Surcharge des baguettes (« dégâts bonus jusqu'au pourcentage de surcharge », 12 à 27 %) : loi de tirage inconnue → affichée, non comptée.
- Critique : chance plafonnée à 100 % (`weaponCalc`). Rangs de compétence donnés par l'équipement (ex. Ring of the Ether : Précision fatale +3) : **ajoutés aux rangs achetés, sans plafond au maximum de la compétence** (**hypothèse** du simulateur, non vérifiée en ligne le 2026-11-06 ; si le jeu plafonne, Précision fatale et Sorcier restent à 3 rangs et le preset « Mage critique (baguette) » passe de 66 % / 123 % à 49 % / 120 %, et le +1 Apprenti mage du Ring of the Ancients ne compte plus). Deux fois le même anneau : refusé par le build optimal, accepté par la fiche (deux Ring of the Ether : 77 %) ; possible en jeu ou non : **non vérifié**.
- **Hypothèse** : le simulateur additionne tous ces bonus. Le jeu en multiplie peut-être certains entre eux (non documenté).
- Bonus contre une famille : « contre les Déchus » (Fell, équipement), Os en cendres (Creux, *Hollow*, +5 %/rang), Fléau des aigles (volants, +10 %/rang). Appliqués comme multiplicateur séparé (**hypothèse**).
- Base de l'arme : valeur du wiki d'avant la 1.0 au niveau requis (**communauté**), SAUF baguettes et bâtons (1.17.0) : les **fichiers** 1.0 donnent le même multiplicateur de dégâts à toute la famille (baguettes ×1, bâtons ×0,5 ; niveau 1–55 pour toutes), donc à niveau d'objet égal le même dégât de base → base commune = la plus haute valeur du wiki de la famille (91, 77 ; décision de l'utilisateur, HISTORY n° 23). Les autres familles (aussi presque toutes au même multiplicateur dans les fichiers) restent à faire (ROADMAP). Deux familles d'unités : « Dégâts » (mêlée, dagues, baguettes) et « Puissance » (arcs, bâtons), non comparables directement.
- Non comptés : modificateur deux mains (×1,5 selon MetaBot), points faibles, attaque impitoyable (×5 de base, +40 %/rang d'Opportunité), attaque furtive (×9 de base), perks d'arme autres que la chance et les dégâts de coup critique, surcharge, gemmes.

## Optimiseur multi-points (simulateur)
`planPoints(b, arme, ennemi, N)` (20-optimizer.js) : à chaque étape, liste les achats possibles (`investments`, chemin compris) dont le coût tient dans le reste des N points ; deux gloutons (meilleur gain par point, meilleur gain brut), puis amélioration locale (retirer une étape, re-remplir) tant que les dégâts moyens montent (1,5 s au plus). **Heuristique** : pas de preuve d'optimalité.

## Optimiseur de build complet (simulateur, 1.13.0)
`boRun(arme analysée, ennemi, N, Flamme, améliorations)` (21-buildopt.js) : pour chaque famille d'arme (mêlée une main, mêlée deux mains, dagues, arcs, baguettes, bâtons), cherche l'arme, les 5 pièces d'armure, 2 anneaux **différents** et l'arbre (depuis un arbre vide, N points) qui maximisent les dégâts moyens contre la cible (`vsEnemy`, comme le reste du calculateur). **Objectif lexicographique** : dégâts d'abord (tolérance relative 1e-9), puis PV.
1. Armes : dans une même catégorie et répartition des dégâts, une arme est écartée si une autre a une base, une chance et des dégâts de coup critique (perks débloqués par les améliorations du build) au moins égaux : elle ne peut pas faire mieux (1.17.0 ; avant, la base seule).
2. Arbre : deux gloutons (gain de dégâts par point, gain brut ; chemin le moins cher compris, comme `investments`) ; quand plus rien n'augmente les dégâts, gain de PV par point. Si aucun achat seul ne rapporte (Essences de vie sans Intelligence…), on regarde l'achat d'après et on prend le premier achat de la meilleure paire.
3. Équipement, arbre fixé : chaque pièce tour à tour, puis les 91 paires d'anneaux ; alternance arbre ↔ équipement jusqu'à ce que l'équipement ne change plus (5 tours au plus ; la phase PV ne tourne que pour l'arme gagnante de la famille).
4. Budget serré (un achat utile ne tient plus) : amélioration locale, retirer un rang ou un nœud d'attribut et re-remplir ; 300 re-remplissages au plus par famille (compteur partagé), pour un résultat identique sur toutes les machines. Mesure : jusqu'à +6 % de dégâts (Fell Black Knight, deux mains, 40 points). Si l'équipement change encore au 3e tour, l'arbre est refait une dernière fois pour cet équipement.
5. Calcul découpé (générateurs, au plus ~1 400 calculs de fiche entre deux pauses) : la page reste fluide, bouton « Arrêter ». Plafond : 10 s de **temps de calcul** (un onglet en arrière-plan ne compte pas) ; au-delà, les familles restantes sont signalées « non calculées » (cela dépend de l'appareil). La famille de l'arme analysée est toujours calculée la première.
6. Points libres : affichés « aucun achat repéré (seul ou par paire) n'augmente encore les dégâts ni les PV », ce que vérifient les tests pour les achats seuls.

**Heuristique** : pas une preuve d'optimalité. Contrôles (tests, comparateur propre aux tests) : aucune des 32 768 combinaisons d'armures ni des 91 paires d'anneaux ne fait mieux sur 3 cas ; aucun achat seul ne tient dans les points restants (budget large) ; aucun échange « retirer un nœud, en acheter un autre » ne fait mieux (budget serré, 2 cas) ; à 4 points, égal au meilleur des arbres reliés énumérés exhaustivement ; chaque preset est égalé ou battu à budget et Flamme égaux ; planchers de non-régression par famille (mesurés le 2026-11-06).
**Hypothèses et limites** : deux anneaux différents (doublon en jeu non vérifié) ; niveau requis des objets non vérifié (contenu de fin de jeu) ; pas de classement entre familles (« Dégâts » / « Puissance », vitesse d'attaque non comptée) ; gemmes non choisies (aucun effet chiffré) ; perks d'arme autres que la chance et les dégâts de coup critique, surcharge, armure des pièces, attaques des ennemis, points faibles, attaques impitoyables et furtives non comptés (ROADMAP 2 à 5, 8).

## Faiblesses des ennemis (fichiers)
Chaque ennemi a un multiplicateur caché par type : tranchant, perçant, contondant, poison, feu, glace, Shroud, foudre.
`1,2` = +20 % de dégâts subis, `0,8` = −20 %, `0` = immunisé. Tous les Fell sont immunisés au Shroud.
Pour une arme à dégâts mixtes, chaque part est multipliée séparément : `Σ (part × multiplicateur)`.
Répartition (**fichiers du jeu 1.0**, PinDrop) : 16 armes de mêlée et dagues à 50/50 (ex. Aurora Sword : tranchant + glace), les autres à 100 % d'un type (`WSPLIT`, 01-data.js).
Arcs et bâtons n'ont pas de répartition dans les fichiers : la flèche ou le sort la porte. Leur type reste indicatif (« selon la flèche / le sort »).
Multiplicateur affiché pour une arme mixte = moyenne des multiplicateurs pondérée par les dégâts de chaque part.

## Défense
```
armure    : subis = max(coup − armure, coup × (1 − plafond))       plafond = 60 %     officiel
            armure physique → tranchant, perçant, contondant
            armure magique  → feu, glace, foudre, Shroud
poison    : ignore l'armure ; seule la résistance au poison compte   officiel / wiki
résistance: subis × (1 − résistance %)                               hypothèse (ordre et cumul)
Tour      : −10 % physique si ≥ 3 ennemis à 20 m                     texte de compétence ; cumul = hypothèse
Gardien   : −10 % magique  si ≥ 3 ennemis à 20 m                     idem
Aura de terre : −10 %                                                texte ; « par rang ou total » non vérifié
coups avant K.O. = ⌈PV / subis⌉
```
Texte du tutoriel en jeu : « Each point of Armor reduces incoming damage by 1, up to a maximum of 60% damage reduction. » Le plafond peut être augmenté par des compétences (lesquelles et de combien : non vérifié), d'où le champ « Réduction max. » modifiable.
Une formule `Armure / (Armure + 400)` circule (NKB Gaming) mais n'est pas vérifiée et contredit le tutoriel : **non utilisée**.

L'armure finale de chaque pièce n'est pas dans les données publiques 1.0 : l'utilisateur saisit celle de sa fiche en jeu. Plaques lourdes / brillantes (+4 % d'armure des objets par rang) sont affichées en % mais pas appliquées à cette saisie (la fiche en jeu les inclut déjà, **hypothèse**).

## Arbre de compétences (fichiers / déduit)
| Règle | Valeur | Confiance |
|---|---|---|
| Tracé : positions et liaisons des 243 nœuds (12 départs, 59 attributs +1, 172 compétences) | `01-tree-data.js` | fichiers (serveur dédié 1.0, relevé PinDrop) |
| Achat : un nœud doit toucher un départ ou un nœud acquis relié à un départ | `canBuy` | fichiers + **déduit** : les liaisons sont stockées orientées, mais 9 nœuds n'ont aucun lien entrant, donc le jeu ne peut pas s'en servir comme prérequis (analyse PinDrop) |
| Coût d'un rang | coût du nœud, identique à chaque rang | **hypothèse** : les fichiers ne donnent qu'un coût par nœud (même hypothèse que PinDrop) |
| Flamme centrale | nœud logique reliant les 12 départs, non dessiné | représentation du simulateur |

## Optimiseur de points (`investments()`)
Pour chaque compétence non au maximum : on simule +1 rang ; si les dégâts moyens sur la cible augmentent, on calcule le vrai coût (rang suivant, ou chemin le moins cher depuis les nœuds reliés à un départ via `pathTo`, chemin compris), on applique, on mesure. Idem pour le prochain nœud d'attribut Force / Dextérité / Intelligence. Tri par gain par point. Le test `optimizer.test.js` vérifie que le gain annoncé est exactement celui obtenu après achat.
