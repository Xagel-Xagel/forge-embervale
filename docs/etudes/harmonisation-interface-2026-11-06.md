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

QCM 1 (2026-11-06) : **B · Panneaux** (non retenus : A Simple / Expert, recommandée pour le risque ; C Parcours). Affinages suivants, un QCM à la fois, rendus révisés à chaque réponse :

- QCM 2 · commandes des panneaux : **mode « Organiser »** — en lecture, un seul bouton Replier par panneau ; un bouton « Organiser les panneaux » affiche poignées, taille S / M / L, monter / descendre, fermer, puis « Terminé » (non retenus : boutons toujours visibles, chevron + menu ⋯).

- QCM 3 · réordonner (mode Organiser) : **boutons Monter / Descendre** seulement — clavier et doigt, même geste partout, pas de glisser-déposer (non retenus : glisser + boutons, glisser seul).

- QCM 4 · dispositions prêtes : **les quatre** — Théoricien (arbre en grand, fiche-résumé, équipement, classement), Combat (cible, vos armes, prochains points, défense), Minimal (réglages, équipement, fiche-résumé), Tout (les 10 panneaux dans l'ordre des onglets actuels) ; plus « Ma disposition » (mémorisée dans ce navigateur).

- QCM 5 · 400 px : **accordéon + barre d'icônes collée en bas** — un panneau ouvert à la fois, les autres en une ligne (titre + résumé) ; barre Réglages · Arbre · Équipement · Cible · Plus (non retenus : liste repliable à plusieurs ouverts, onglets 3 × 2 gardés sur téléphone).

- QCM 6 · Calculateur : **éclaté en 3 panneaux** — Cible & faiblesses (avec vos armes contre la cible), Classement des armes, Prochains points ; la cible choisie est partagée par tous les panneaux qui en dépendent (non retenus : un seul panneau « Contre une cible », 2 panneaux).

Décidé sans QCM (socle, section 2), à contester si besoin : aides en « ? » renvoyant au panneau Aide ; pied « Sources » dans Tables et Aide ; fiche-résumé = PV, dégâts / coup et moyenne de l'arme 1, chance de critique, armure physique des objets, points restants ; un seul bouton primaire par panneau (celui de l'action du panneau), « Partager » primaire dans l'en-tête.

## 6. Plan d'implémentation (direction B, pour une session de code)

### 6.1 Cible
- **Plus d'onglets de parties.** La page = en-tête collé (titre, build A/B, Charger ▾, Enregistrer, Partager, Disposition ▾, Organiser) + rail d'icônes à gauche + grille de panneaux. Le hash reste réservé au code de partage (aucune navigation dans l'adresse).
- **11 panneaux** (identifiant · contenu · ce qui change selon la taille S / M / L) :

| Id | Panneau | S | M | L (sur 2 colonnes) |
|---|---|---|---|---|
| `reg` | Réglages | Niveau, Exploration, Flamme, Améliorations (4 tuiles) | + points dépensés / budget, effet de la Flamme | = M |
| `tree` | Arbre | points à attribuer + zones (pas de graphe) | graphe 340 px, recherche | graphe 520 px, vue Liste disponible |
| `eq` | Équipement | une ligne de résumé | 9 lignes compactes (nom + 1 puce) | tout : puces, perks, gemmes, curseur |
| `fiche` | Fiche | 6 tuiles (résumé) | + 2 cartes d'arme | 35 statistiques, comparaison A / B |
| `cible` | Cible & faiblesses | liste des ennemis + phrase de verdict | + 8 cases + vos armes contre la cible | = M |
| `rank` | Classement des armes | 3 lignes | 5 lignes + « n autres » | 12 lignes, boutons Arme 1 / Arme 2, choix de famille |
| `pts` | Prochains points | 3 lignes | 10 lignes + « Répartir au mieux » | + plan détaillé |
| `bo` | Build optimal | dernier résultat en une ligne + Calculer | 6 cartes | + détails ouverts |
| `def` | Défense | 3 grands chiffres + coup / type | formulaire + table des 8 types | = M |
| `tab` | Tables | filtres + 10 lignes | table complète (défilement interne) | + formules + sources |
| `aide` | Aide | sommaire | textes d'aide regroupés (note de la fiche, graphe, perks, heuristique, limites, conventions de nommage) | = M |

- **État d'un panneau** : ouvert / fermé (fermé = absent de la grille, réouvrable depuis le rail), replié / déplié, taille. **Mode Organiser** (bouton global, `aria-pressed`) : affiche dans chaque en-tête Taille S / M / L, Monter, Descendre, Fermer ; « Terminé » le quitte. En lecture : un seul bouton Replier / Déplier par en-tête.
- **Dispositions** (menu) : Ma disposition (mémorisée), Théoricien, Combat, Minimal, Tout — définitions figées dans le code (ordre, tailles, repliés, fermés) ; tout changement manuel bascule sur « Ma disposition ». Première visite : Théoricien.
- **Grille** : 3 colonnes ≥ 1 000 px, 2 colonnes de 640 à 999 px (L = toute la largeur), 1 colonne < 640 px en **accordéon** (un seul déplié ; déplier replie les autres) + **barre d'icônes collée en bas** (Réglages · Arbre · Équipement · Cible · Plus → les autres) ; `scroll-padding-bottom` pour que la barre ne couvre jamais le focus.
- **Mémoire** (`lsGet` / `lsSet`, clé `forge-embervale-panneaux`) : `{v:1, preset, order, size, folded, closed, acc}` ; illisible ou absent → Théoricien (test « stockage bloqué » à garder). CLAUDE.md §1 à élargir : `localStorage` sert aux builds enregistrés, à la disposition des panneaux (remplace « l'onglet ouvert »).
- **Rendu** : ne rendre que les panneaux ouverts et dépliés (comme `renderOptNow` ne rend aujourd'hui que l'onglet ouvert) ; `G.wake` / `G.resize` sur un `ResizeObserver` du panneau Arbre (taille S ↔ M ↔ L, accordéon) ; un calcul de build optimal en cours survit au repli / à l'ouverture (état `BO`, messages existants).
- **Accessibilité** : panneau = `<section aria-labelledby>` ; bouton Replier `aria-expanded` + `aria-controls` ; rail = `<nav aria-label="Panneaux">` à boutons `aria-pressed` ; en Organiser, groupes `role="group"` étiquetés ; cibles ≥ 44 px à 400 px ; focus visible ; contraste du texte des boutons primaires en sombre à corriger (aujourd'hui `#fff` sur `--ember` `#f08a48` ≈ 2,3 : 1 → encre sombre sur braise).

### 6.2 Phases (une PR par phase, GO avant merge)

**Phase 1 — coque des panneaux** (les 7 blocs actuels deviennent des panneaux : Arbre, Équipement, Fiche, Calculateur, Build optimal, Défense, Tables ; tailles S = replié, M = normal, L = 2 colonnes).
- `src/page.html` : en-tête collé, rail, grille ; chaque `section.panel` reçoit un en-tête de panneau ; `#ficheAside` devient le panneau `fiche`.
- `src/styles.css` : `.pgrid`, `.pnl`, `.rail`, mode Organiser, accordéon < 640 px, barre basse, jetons seulement.
- `src/js/10-ui.js` : remplacer `SECS` / `showSec` / `initSec` par le gestionnaire de panneaux (`PANELS`, `DISPOS`, `layout`, `applyDispo`, `movePanel`, `setSize`, `fold`, `closePanel`, `openPanel`, `saveLayout`, `loadLayout`) ; `renderOptNow` rend les panneaux calculateur visibles ; `--navh` mesuré sur l'en-tête collé.
- `src/js/30-graph.js` : `G.wake` sur ResizeObserver du panneau.
- Tests : `tests/nav.test.js` → fonctions du gestionnaire (dispositions, ordre, taille, repli, fermeture, mémoire illisible) ; `tests/e2e.mjs` → rail, Organiser, 4 dispositions sans débordement horizontal (1 300 / 400 px), accordéon à un seul déplié, barre basse, focus non couvert, captures **par disposition** (clair / sombre × 1 300 / 400) ; `tests/ui.test.js` → chaque preset dans chaque disposition.
- Docs : CLAUDE.md (§1 localStorage, commandes des captures, organisation), CHANGELOG, HISTORY n° 24, version 1.18.0.
- Indicateur : **R1 K1 A2** (logique avec `showSec` pour modèle · interface et état · zones disjointes : balisage, styles, 10-ui, graphe, trois fichiers de tests).

**Phase 2 — en-tête, Réglages, fiche-résumé**
- En-tête regroupé (S3) : Charger ▾ (presets, mes builds, importer un code), menu ⋯ (Copier vers l'autre, Vider, Supprimer) ; à 400 px, Partager + ⋯ seulement visibles.
- Panneau `reg` : Niveau, Exploration, Flamme, Améliorations retirés d'Arbre et d'Équipement ; les tuiles de Build optimal ne gardent que « réglé ici » (N, F du calcul).
- Fiche : taille S = 6 tuiles, M = + armes, L = table complète ; note « Comment lire ces chiffres » déplacée dans Aide.
- Indicateur : **R1 K1 A1**.

**Phase 3 — calculateur éclaté, aides, densités**
- `20-optimizer.js` : `optCalc` scindé en `optCible`, `optRank`, `optPts` (un panneau chacun, cible partagée `oEnemy`) ; barre de cible plus déplacée (chaque panneau affiche « contre <cible> · changer »).
- Textes d'aide : une phrase visible au plus par panneau, « ? » → panneau Aide (ouvre et défile jusqu'au sujet) ; pied « Sources » dans Tables (L) et Aide ; avertissement « Heuristique » en une ligne + lien.
- Densités S / M / L de chaque panneau selon la table 6.1 (Équipement M = lignes compactes, Classement S / M / L, etc.).
- Indicateur : **R1 K1 A2**.

### 6.3 Invariants et garde-fous
- Aucune donnée ne change : tables figées `FZ`, codes b1 / b2 / b3, `share.test.js` intacts ; règle de l'arbre (`canBuy` / `prune` / `normalize`) intacte.
- Contraintes de la page : jetons de couleur dans les deux blocs sombres, Google Fonts seulement, aucune dépendance, 400 px sans défilement horizontal (tables larges dans `.oscroll`), `alert` / `confirm` interdits (toast / modal), hash réservé au partage.
- `npm run check` à 0 échec et `npm run test:e2e` regardé (captures par disposition) avant chaque PR ; `/livrer` pour publier (site Pages, Artifact).

### 6.4 Risques signalés
- Plusieurs panneaux calculateur ouverts = plus de rendus par modification : garder le débounce de `renderOpt`, ne rendre que le visible, surveiller « plus longue tâche » du test e2e.
- Le graphe canvas dans une grille redimensionnable : s'appuyer sur `G.resize` (déjà testé « canvas recalé après redimensionnement caché »).
- Les tests actuels nomment `#t-calc`, `#p-calc`, `#secTabs` : à réécrire, pas à contourner.
- Rendu des planches Claude Design non vérifié par Claude (règle de l'outil) : les planches sont des maquettes statiques, pas la référence pixel ; la référence reste le socle 6.1.

