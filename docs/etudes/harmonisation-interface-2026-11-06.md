# Harmonisation de l'interface — étude du 2026-11-06

Demande (HISTORY n° 24, à venir) : « l'interface est devenue confuse (je ne sais plus sur quoi cliquer, des informations dans tous les sens) et pas assez modulable ». Session d'étude sans changement dans `src/` : état des lieux mesuré, trois directions dessinées (Claude Design), direction validée par QCM, plan d'implémentation pour une session de code.

Précédents : n° 20 (onglets, 1.15.0 — « un onglet par outil », fiche à droite d'Arbre et d'Équipement), n° 23 (tuiles Points / Flamme en tête d'Arbre et de Build optimal, perks d'arme, 1.17.0).

## 1. État des lieux (version 1.17.0, mesuré le 2026-11-06)

Méthode : `npm run test:e2e` (24 captures, clair / sombre × 1 300 / 400 px, `tests/screenshots/`) et un relevé Playwright par onglet (contrôles visibles, textes d'aide et leur nombre de mots, hauteur de page). Les thèmes clair et sombre sont identiques en structure (jetons CSS) : aucun écart entre eux, l'encombrement est le même.

### 1.1 Chiffres par onglet

| Onglet | Hauteur 1 300 px | Hauteur 400 px | Mots (panneau + fiche) | Contrôles visibles | Textes d'aide (mots) |
|---|---|---|---|---|---|
| Arbre | 1 438 px | 4 729 px | 135 + 723 | 11 boutons, 5 champs | 10 (306) |
| Équipement | 2 077 px | 6 501 px | 1 985 + 723 | 11 listes, 1 curseur | 16 (421) |
| Calculateur | 1 582 px | 2 757 px | 835 | 16 boutons, 3 listes, 1 champ | 7 (106) |
| Build optimal | 1 411 px | 2 751 px | 777 | 9 boutons, 2 listes, 2 champs | 19 (221) |
| Défense | 1 048 px | 1 766 px | 171 | 6 champs, 1 liste, 2 cases | 3 (55) |
| Tables | 1 395 px | 1 859 px | 1 836 | 101 boutons (noms), 1 liste, 1 champ | 10 (645) |

Au-dessus des onglets, sur chaque écran : en-tête + barre des builds (12 contrôles) = 222 px à 1 300 px, **440 px à 400 px** (plus d'un écran de téléphone avant le premier onglet). Pied de page « Sources » (105 mots) répété sous chaque onglet. Au total 65 textes d'aide, ≈ 1 750 mots ; les plus longs : « Comment lire ces chiffres » (197 mots, dans la fiche), formule « Build optimal » (121), avertissement « Heuristique » (86), « Ce qui n'est pas compté » (82), aide du graphe (47, superposée au tracé).

### 1.2 Ce qui surcharge, par partie

**Partout (barre des builds, en-tête, pied).**
- 12 contrôles à plat et de même poids (A/B, nom, Comparer, presets, Copier, Vider, Enregistrer, Mes builds, Supprimer, Partager, Importer) : quatre métiers mélangés (choisir le build, charger, enregistrer, partager). Sur 5 lignes à 400 px.
- Le contexte du build est répété trois fois : onglet A/B, champ du nom, étiquette « Build A · nom » dans l'en-tête de chaque panneau (Calculateur, Build optimal, Défense) et « A contre B » dans la fiche.
- « Comparer A et B » agit seulement sur la fiche, visible dans deux onglets sur six (un message le dit après coup).
- Le pied « Sources » est répété six fois ; la convention de nommage (°, anglais en italique) est expliquée dans le pied **et** dans la légende de la table des ennemis.

**Arbre.**
- En tête, quatre groupes de réglages côte à côte : tuile Points (avec Niveau et Exploration), tuile Flamme (avec l'effet en 3 lignes), 5 boutons de zones avec leurs points, recherche + « Prises seulement », commutateur Graphe / Liste, étiquette « 172 compétences · 59 nœuds · 12 départs ».
- L'aide du graphe (47 mots) est écrite **sur** le canvas, en haut à gauche ; à 400 px elle couvre le tiers supérieur du tracé.
- Légende de 7 entrées sous le graphe, boutons « Tout afficher · Réorganiser » dans le canvas, carte de nœud flottante : trois couches d'outils sur un même tracé.
- Doublon : les tuiles Points / Flamme existent aussi dans Build optimal avec un sens différent (« Points à attribuer » / « Points disponibles »).
- Fiche à droite (1 300 px) : coupée par son propre défilement interne ; à 400 px elle arrive après le graphe, 2 000 px plus bas.

**Équipement.**
- 9 emplacements, chacun : liste + 5 à 11 puces (stats de base + perks) + ligne grise (nom anglais, niveau, classe, source, panoplie) ; pour les armes : + puces (catégorie, dégâts, type, surcharge, 5 perks) + un texte d'hypothèse de 35 mots **répété pour chaque arme** + liste de gemme + carte de gemme (3 lignes).
- L'onglet le plus long (1 985 mots, 6 501 px à 400 px) ; aucun regroupement visuel (armures / armes / anneaux), rien ne se replie.
- Le curseur « Améliorations » est en haut, loin des perks qu'il grise (il faut défiler pour voir son effet).
- « panoplie Creux vénérable » répété sur 5 pièces ; les chiffres des armes sont repris dans la fiche à côté.

**Calculateur.**
- Barre de cible à 3 listes (Ennemi, Arme analysée, Armes à classer) ; la même barre est **déplacée** physiquement vers Build optimal quand on y va (la 3e liste cachée).
- Quatre cartes de même poids en grille 2 × 2 : faiblesses (8 cases + phrase de verdict + source), vos armes, classement (12 lignes × 6 colonnes, 24 boutons « Arme 1 / Arme 2 »), prochains points (table + formulaire « Répartir au mieux » + plan). La question utile (« où mettre mes points ») est en bas à droite.
- Le multiplicateur de la cible est montré quatre fois : cases, phrase, « type contre la cible » de chaque arme, colonne « Type » du classement.
- À 400 px, le classement se lit en défilement horizontal interne (colonnes Moyenne, vs équipée et boutons hors champ).

**Build optimal.**
- Avant le bouton : tuiles Points / Flamme (doublon d'Arbre), barre de cible (doublon du Calculateur), paragraphe de 36 mots ; après : 6 cartes de famille, chacune avec un détail de 10 à 15 lignes dont une ligne « Liaisons (chemin) » qui énumère jusqu'à 28 compétences « 1/3 », puis « Calculé en 2,2 s », puis 86 mots d'avertissement.
- Six boutons « Appliquer » primaires de même poids ; le bouton principal « Calculer » est au milieu de l'écran.
- L'avertissement « Heuristique… non comptés… » existe aussi dans Tables › Formules (121 + 82 mots).

**Défense.**
- L'onglet le plus léger (171 mots) mais isolé : les armures se tapent à la main (valeur absente des fichiers 1.0, ROADMAP n° 3) sans rappel de ce que le build apporte (armure % des objets, résistances sont dans la fiche, invisible ici).
- 8 champs sur une ligne à 1 300 px, 8 lignes à 400 px, avant le résultat.

**Tables.**
- 1 836 mots : table 101 × 8 (ouverte par défaut, 101 boutons-noms) + légende de 69 mots + 9 blocs de formules (576 mots) repliés.
- À 400 px, seule la colonne « Ennemi » est visible, les 8 multiplicateurs demandent un défilement horizontal interne.
- Formules et limites doublonnent les avertissements de Build optimal et la note de la fiche.

**Fiche du personnage.**
- 723 mots en mode A contre B : 6 tuiles d'attributs, 4 cartes d'arme (5 grands chiffres chacune, gemme, détail des bonus), table de 35 lignes, note de 197 mots.
- Visible seulement dans Arbre et Équipement ; collée à droite avec défilement interne (coupée à « Armes du build B » sur la capture 1 300 px) ; après tout le contenu à 400 px.
- Reprend les armes de l'onglet Équipement.

### 1.3 Hiérarchie floue (transversal)
- Trois étages d'onglets ou commutateurs : builds A/B → 6 parties → commutateurs internes (Graphe / Liste, détails, filtres), tous dessinés différemment.
- Les réglages sont éparpillés en six endroits : Niveau / Exploration / Flamme (tuiles d'Arbre), Améliorations (curseur d'Équipement), Points / Flamme du calcul (tuiles de Build optimal), Cible / Arme analysée (barre mobile Calculateur ↔ Build optimal), réglages de Défense, Comparer (barre des builds).
- La couleur primaire (braise) sert à Partager, Calculer, 6 × Appliquer, Appliquer le plan, Compris / Copier / Importer : aucun écran n'a un seul bouton principal.
- Les textes d'aide sont des paragraphes gris en bas de chaque carte ; rien n'est replié, rien n'est à la demande.

## 2. Socle commun (quelle que soit la direction)
- S1 · **Un seul endroit pour les réglages du personnage** : Niveau, Exploration, Flamme, Améliorations (les tuiles de Build optimal ne gardent que ce qui diffère du build).
- S2 · **Aide à la demande** : une phrase visible au plus par carte, le reste derrière un « ? » (popover ou `details`) ; la note de 197 mots et les formules ne vivent qu'à un endroit (Référence).
- S3 · **Barre des builds en trois groupes** (Build : A/B + nom + comparer · Charger : presets, mes builds, importer · Sortie : enregistrer, partager) ; à 400 px, un menu « ⋯ » pour les actions rares (Copier, Vider, Supprimer, Importer).
- S4 · **Pied « Sources » une fois**, replié, dans Référence.
- S5 · **Fiche-résumé toujours visible** (6 chiffres : PV, dégâts arme 1, moyenne, critique, armure phys. %, points restants) ; la fiche complète à la demande.
- S6 · **Un seul bouton primaire par écran.**
- Invariants : codes b1/b2/b3 et tables figées intouchés (aucune donnée ne change) ; règle de l'arbre intouchée ; `localStorage` seulement pour l'affichage retenu (comme l'onglet ouvert aujourd'hui) ; contraintes de la page (jetons, Google Fonts, 400 px sans défilement horizontal).

## 3. Trois directions proposées

### Direction A — « Simple / Expert » (deux niveaux d'affichage)
- Un interrupteur global **Simple | Expert** dans l'en-tête, mémorisé.
- **Simple** : 3 parties seulement — *Build* (équipement en 9 lignes compactes sans puces + arbre en graphe, fiche-résumé en bandeau), *Contre une cible* (cible + verdict : faiblesse, votre arme, 3 meilleures armes, 3 prochains points, carte « Encaisser » = Défense réduite, bouton « Proposer un build optimal »), *Référence* (tables, formules, sources).
- **Expert** : les 6 parties actuelles, puces et tables complètes, aides derrière « ? », tiroir « Réglages » (S1).
- Masqué en Simple : puces de perks, classement à 12, plan multi-points, formules, détails des cartes de build optimal. Déplacé : Défense devient une carte de « Contre une cible ». Fusionné : Calculateur + Build optimal + Défense.
- 400 px : cartes empilées, bandeau fiche-résumé collé en bas.

### Direction B — « Panneaux » (tableau de bord modulaire, repliable et réordonnable)
- Plus d'onglets de parties : une **grille de panneaux** (Réglages, Arbre, Équipement, Fiche, Cible & faiblesses, Classement des armes, Prochains points, Build optimal, Défense, Tables), chacun avec une barre : titre · replier · taille (S / M / L) · monter / descendre · fermer.
- Un **rail d'icônes** à gauche liste tous les panneaux (réafficher un panneau fermé) ; disposition mémorisée ; 3 dispositions prêtes : *Théoricien* (arbre + fiche + classement), *Combat* (cible + armes + défense), *Minimal* (équipement + fiche-résumé).
- Fusionné : Réglages du personnage = un panneau (S1). Éclaté : le Calculateur en 3 panneaux indépendants. Masqué : panneau « Aide » fermé par défaut, pied dans Tables.
- 400 px : accordéon (un panneau ouvert à la fois), barre d'icônes collée en bas.

### Direction C — « Parcours » (« Je veux un build pour… »)
- Quatre étapes numérotées en haut : **1 Objectif** (cible, famille d'arme, points & Flamme — ou un preset) → **2 Proposition** (6 cartes de build optimal, ou le preset chargé ; « Choisir ») → **3 Ajuster** (arbre + équipement, fiche-résumé collée) → **4 Vérifier & partager** (défense, comparer A/B, enregistrer, lien).
- Un **bandeau du build** persistant (nom, points restants, Flamme, 3 chiffres) ; un tiroir **Référence** (tables, formules, sources) accessible partout.
- Fusionné : Calculateur + Build optimal (étapes 1-2), Défense + partage (étape 4). Masqué : classement réduit à 5 lignes (+ « voir tout »), une phrase d'aide par étape (+ « en savoir plus »).
- 400 px : une étape par écran, « Suivant » collé en bas.

Idée en réserve (D, non dessinée) : « Feuille de personnage » — l'écran d'inventaire du jeu au centre (silhouette à 9 emplacements, attributs, 6 chiffres), tiroir latéral pour choisir une pièce, arbre en plein écran, calculateurs en cartes-verdicts sous la feuille.

## 4. Brief pour Claude Design (`/design`, lancé par l'utilisateur)

Canevas publié (privé, 12 planches + 3 notes « masqué / déplacé / fusionné ») : https://claude.ai/artifact/BiCNLFQ1CVyRCXk2XmePVd — rangée A : Simple / Expert, rangée B : Panneaux, rangée C : Parcours ; chaque rangée : bureau clair, bureau sombre, 400 px clair, 400 px sombre. Les planches sombres importent la planche claire avec le réglage « dark » (Tweaks) ; rendu non vérifié par Claude (règle de l'outil).
- Produit : Forge d'Embervale, simulateur de stuff Enshrouded 1.0, page unique, interface en français.
- Jetons à reprendre tels quels (`src/styles.css`) : fond `#e9ecef` / surface `#f7f8f9` / encre `#1b2029` / braise `#b8501a` / Shroud `#5d4594` (clair) ; `#10131a` / `#171b24` / `#e7e4dd` / `#f08a48` / `#a991e3` (sombre) ; zones Guerrier `#b03a35`, Rôdeur `#2f7a49`, Mage `#2f5fa8`. Polices : Alegreya SC (titres), Alegreya Sans (texte), IBM Plex Mono (chiffres).
- Contenu réel à montrer : build « Barbare deux mains » (Marteau de la chèvre *Goat Hammer*, 377 / 696, 60 % critique, 1 778 PV, 62 points à attribuer, Flamme 11) contre Chien Creux *Hollow Hound* (×1,5 contondant).
- Pour chaque direction : 4 planches — bureau clair, bureau sombre, 400 px clair, 400 px sombre — avec une légende « masqué / déplacé / fusionné ».

## 5. Direction retenue
_(à compléter après les QCM)_

## 6. Plan d'implémentation
_(à compléter après les QCM)_
