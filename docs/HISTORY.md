# Historique des demandes et décisions

Projet démarré le 2026-11-05 dans une session Claude (claude.ai), repris ensuite par Claude Code.

## Cadrage initial (QCM demandé par l'utilisateur avant toute action)
- Périmètre : armure (+ bonus de set), armes, bijoux / anneaux, arbre de compétences.
- Contenu : **fin de jeu uniquement**.
- Fonctions : totaux en direct, comparaison de deux builds, sauvegarde / partage, builds prédéfinis.
- Langue : **français**.
- Constat après recherche : la 1.0 n'a **pas de bonus de panoplie** → affiché clairement plutôt qu'inventé.

## Demandes successives (verbatim résumé) et réponses
1. « Page web interactive qui fera office de simulateur de stuff du jeu Enshrouded 1.0. Fait moi un QCM avant toute action. » → simulateur v1.
2. « Je veux avoir le même rendu visuel que l'arbre de compétence Enshrouded. J'aime beaucoup le rendu visuel équivalent au logiciel Obsidian. » → arbre en graphe canvas à forces, style « graph view » (30-graph.js).
3. « Crée plus de profils : mage, magie, heal. » → presets mage (feu, foudre, glace, nécromancien, arcaniste du bâton) et soin (soigneur de groupe, paladin, gardien du Shroud, prêtre du feu).
4. « Un stuff "Sadi Fourbe", un tank qui ne tape pas mais vole de la vie de façon passive aux ennemis. » → preset Sadi Fourbe (Aura radieuse, Contre-coup, Givre, Aura d'eau, Némésis, gemmes Blindage/Moisson d'âmes).
5. « Trop de scintillement lorsqu'on survole un point de compétence. » → fondu, hystérésis du survol, délai de sortie, halos pré-rendus au lieu de `shadowBlur`.
6. « Si le point central (le père) n'est pas sélectionné, le fils ne peut pas être sélectionné. Il faut au minimum une liaison. » → règle de liaison (`canBuy`, `prune`, `pathTo`, bouton « Acheter le chemin »), codes `b2-` avec nœuds d'attribut individuels.
7. « Il te faut quoi pour avoir le tracé réel du jeu ? Une image te suffirait ? » → réponse : oui, des captures de l'arbre en jeu (ou le planificateur PinDrop dans le navigateur de l'utilisateur, avec son accord). Réalisé ensuite sans captures (demande 12).
8. « Rajoute les pierres précieuses pour les armes aussi. » → 29 gemmes, un emplacement par arme, alerte si le type de dégâts ne déclenche pas l'effet.
9. « Récupère la formule de calcul des dégâts et résistances, et les résistances et faiblesses entre chaque type de dégât et monstre, pour un calculateur d'optimisation. » → 06-enemies.js + 20-optimizer.js (version 8).
10. « Prépare tout un package pour que Claude Code prenne le relais. » → ce dépôt.
11. « Objectif final : le mettre sur GitHub et y accéder avec mon navigateur. » → dépôt `Xagel-Xagel/forge-embervale`, GitHub Pages. Le déploiement par `actions/deploy-pages` restait bloqué sur « updating_pages » (incident GitHub en cours les 4–5 nov. 2026) → publication via la branche `gh-pages` (« Deploy from a branch »).

12. (Claude Code, 2026-11-05) « Remplacer l'arbre "reconstruction thématique" par le TRACÉ RÉEL du jeu » → 1.9.0 : tracé extrait du JSON du planificateur PinDrop (fichiers du serveur dédié 1.0), 0 écart avec nos 172 compétences ; format de partage `b3-` ; critique adversariale de la conception avant le code. QCM de l'utilisateur :
    - test du code b2 figé : **« choix conservés »** — valeurs figées intactes ; comme le build b2 ne peut plus être relié tel quel sur le vrai tracé (16 nœuds isolés, prouvé), le test vérifie que chaque choix est conservé et que seuls des nœuds de liaison sont ajoutés (la critique proposait de figer aussi la migration : non retenu) ;
    - format b3 : **« compact »** — places dans des tables figées d'identifiants du jeu, ~120 caractères (au lieu d'identifiants en clair, ~720).

13. (Claude Code, 2026-11-05) « Revoir les 15 presets sur le tracé réel (moins de points perdus en liaisons), chaque choix sourcé ; QCM avant d'écrire » → 1.10.0. Mesure : la perte venait surtout de la CON des mages (zone Guerrier) ; un placement plus malin des attributs ne gagnait rien (280 contre 277). QCM de l'utilisateur :
    - ampleur : **« Ajuster »** (garder chaque preset, retirer les nœuds lointains), pas de refonte d'après des builds communautaires ;
    - CON des mages et soigneurs : **« garder 2 CON voisins »** (ceux qui touchent un départ, 1 point chacun) ;
    - proposition complète (Rôdeur, Barbare, Assassin, Arcaniste, Prêtre ; Sadi inchangé) : **« Valider tout »**.
    Source de chaque choix : coût de liaison mesuré sur le tracé (fichiers du jeu via PinDrop) et effet de la compétence (`SK`).

14. (Claude Code, 2026-11-06) « La suite ? » → QCM : **dégâts mixtes** (ROADMAP n° 2) → 1.11.0. Source : pages armes de PinDrop (fichiers 1.0) — 100 % ou 50/50, rien d'autre ; l'« estimation » de PinDrop (formule du wiki d'avant la 1.0) donne d'autres parts, écartée. QCM : perks élémentaires **« hors calcul »** (pas d'hypothèse ajoutée).

15. (Claude Code, 2026-11-06) « Go » → ROADMAP n° 3 (armure par pièce) : aucune source 1.0 (PinDrop : valeur absente des fichiers pour les sets 1.0). QCM : **« bloquer, passer à la suite »**.

16. (Claude Code, 2026-11-06) ROADMAP n° 4 (attaques des ennemis) : fichiers 1.0 sans dégâts ni type par attaque (PinDrop). QCM : **« bloquer, passer à la suite »**.

17. (Claude Code, 2026-11-06) QCM « suite » : **optimiseur multi-points** (ROADMAP n° 11) → 1.12.0 : `planPoints` (gloutons + amélioration locale), formulaire « Répartir au mieux N points » et « Appliquer le plan ».

18. (Claude Code, 2026-11-06) « Optimiseur de build complet : pour un budget de points, proposer équipement, attributs et compétences qui maximisent un objectif ; bouton Appliquer ; QCM une question à la fois avant d'écrire » → 1.13.0 (`21-buildopt.js`). QCM de l'utilisateur :
    - objectif : **« Dégâts vs cible »** (les PV départagent les égalités et reçoivent les points restants) ; non retenus : faction, survie seule, compromis réglable ;
    - contraintes : **« la seule contrainte sera les points de compétence disponibles et le niveau de la Flamme du joueur »** (ni emplacements verrouillés, ni compétences gardées, ni classe) → l'optimiseur choisit aussi l'arme : un résultat par famille, sans classement entre familles (Dégâts ≠ Puissance) ;
    - méthode : **« Glouton + alternance »** (mesuré sur prototype : = recherche exhaustive de l'équipement sur 3 cas, ≈ 3 s) ; non retenus : faisceau, ruine et reconstruction ;
    - conception : **« Valider »** (gemmes non choisies, gemme gardée si compatible ; deux anneaux différents ; calcul découpé, plafond 10 s).
    Ajouts pendant le codage, signalés : regard à deux achats quand le glouton est bloqué (Essences de vie sans Intelligence), amélioration locale quand le budget manque (jusqu'à +6 % mesuré à 40 points).

19. (Claude Code, 2026-11-06) « Un stuff mage "full" dégâts critiques et chance de coup critique à la baguette → nouveau preset en fin de PRESETS + son code b3 ; QCM une question à la fois » (précédent : n° 4, Sadi Fourbe) → 1.14.0, preset « Mage critique (baguette) ». QCM de l'utilisateur :
    - objectif : **« chance puis dégâts critiques »** ; ennemi : **aucun** ;
    - anneaux : **66 % / 123 %** (Ether + Ancients) plutôt que 67 % / 104 % (Ether + Ring of Stamina) ;
    - utilitaires : **aucune** (les 2 CON de la décision n° 13 restent, exigées par le test des presets mage) ; points restants : **dégâts + effets critiques** ;
    - baguette : « pas de préférence, il faut faire le plus de dégâts » → Wand Of Bloodflow (428,7 contre 414,5 pour Ancient Drak Wand) ; arme 2 : **bâton** (Violet Storm, 392,0 de Puissance contre 350,2 pour Staff Of The Moor grâce à Tonnerre) ; nom : **« Mage critique (baguette) »**.

20. (Claude Code, 2026-11-06) « L'interface met tout sur une seule page (arbre, équipement, fiche, calculateur, build optimal, défense, tables) et on ne s'y retrouve plus → ajouter des menus ou une navigation par sections ; QCM une question à la fois » → 1.15.0. Outil : skill `frontend-design` (code ré-intégrable sous contraintes dures, fiche 07 de la banque de connaissances). QCM de l'utilisateur :
    - forme : **« onglets en haut »** (non retenus : menu latéral, menu repliable ☰, sommaire à ancres) ;
    - découpage : **« un onglet par outil »** — Arbre · Équipement · Calculateur · Build optimal · Défense · Tables (table des ennemis + formules), le choix de la cible affiché dans Calculateur et Build optimal ;
    - toujours visible : barre des builds au-dessus des onglets, **fiche à droite d'Arbre et d'Équipement** (dessous sur téléphone), pleine largeur ailleurs ;
    - 400 px : **« 2 lignes, collées en haut »** (3 × 2, la barre reste en haut pendant le défilement, partout) ;
    - mémoire : **« oui, dans ce navigateur »** (lsGet/lsSet ; règle de CLAUDE.md élargie).
    Ajouts pendant le codage, signalés : seul l'onglet ouvert du calculateur est rendu ; `scroll-padding-top` pour que les onglets collés ne cachent pas le focus clavier ; cases à cocher de la Défense corrigées (défaut antérieur). Après la revue QA : messages quand le build optimal s'arrête ou se termine hors de son onglet, plan « Répartir au mieux » gardé d'un onglet à l'autre, messages empilés et lus par les lecteurs d'écran.

21. (Claude Code, 2026-11-06) QCM « Suite » après la livraison de 1.15.0 : **« PR : CLAUDE.md v15 + e2e en CI »** — la revue QA avait relevé que la CI ne lançait pas le test navigateur ; non retenus : correction de CLAUDE.md seule, rien.

22. (Claude Code, 2026-11-06) « Traduire en français l'anglais qui reste à l'écran (objets, ennemis, factions, termes, restes d'interface) ; QCM une question à la fois ; liste validée avant d'écrire » → 1.16.0 (reprend la décision « noms en anglais » de CLAUDE.md §5). Vérifié en ligne : le jeu a une interface française officielle (Steam) ; MetaBot (fr_FR) affiche les noms des tables de textes du jeu pour les objets et les 20 boss ; PinDrop et enshrouded.tools n'ont plus de français ; le wiki FR est communautaire et incohérent. QCM de l'utilisateur :
    - périmètre : **objets, ennemis et factions, restes d'interface** (non retenu : termes de jeu comme « Shroud ») ;
    - source : **MetaBot + traduction du simulateur signalée** (non retenus : MetaBot seul, tout traduire) ;
    - affichage : **français + anglais en italique** (non retenus : français seul, bascule FR/EN) ; recherche : **français et anglais** ;
    - liste (`docs/etudes/traductions-noms-2026-11-06.md`, PR n° 10) : objets, factions, ennemis (dont 5 corrections d'erreurs de MetaBot) et interface **validés tels quels**.
    Ajouts pendant le codage, signalés : dans les listes déroulantes, français seul (pas d'italique possible dans une option) et l'anglais dans la carte en dessous ; recherche insensible aux accents. Après la revue QA : nom anglais affiché (marqué °) si un nom français manque, au lieu d'une page vide ; message « équipée » en français ; tests de chaque vue (13 mutations tuées sur 13).

23. (Claude Code, 2026-11-06) « Optimiser le preset "Mage critique (baguette)" en se focalisant sur les perks qu'on peut mettre sur les armes (et les gemmes) et les points de compétence à attribuer ; mettre davantage en avant le nombre de points et le niveau de la Flamme ; d'abord vérifier en ligne si les perks d'une arme sont fixes ou choisissables ; QCM une question à la fois avant d'écrire ; preset validé avant d'écrire les données » → 1.17.0 (précédent : n° 19). Vérifié en ligne : perks **fixes**, 5 emplacements dans l'ordre (fichiers 1.0 via PinDrop, wiki), débloqués par amélioration, la rareté tirée au butin fixant le nombre d'améliorations (notes de version) ; aucune reforge ; gemme au choix si l'arme a un emplacement ; MetaBot écrit « tirés » : désaccord signalé, « fixes » retenu. Constat : dans les fichiers 1.0, toutes les baguettes ont le multiplicateur ×1 et tous les bâtons ×0,5 (nos bases venaient du wiki d'avant la 1.0). QCM de l'utilisateur :
    - PR « CLAUDE.md : Artifact version 16 » : **merger** (PR n° 11) ;
    - objectif : **chance d'abord**, puis dégâts critiques, puis moyenne (non retenus : dégâts moyens, dégâts critiques d'abord) ;
    - base des armes : **égale par famille** pour baguettes et bâtons (91 / 77, la plus haute du wiki), autres familles en ROADMAP (n° 12) ; non retenus : garder le wiki, toutes les armes ;
    - armes : **Baguette mythique + Everblue de l'Oracle** (78 % / 73 % de chance) ; non retenus : Mythique + Bâton de guidance (72 % / 143 %), Mythique + Tempête violette, Baguette de Polymathe + Bâton de guidance (dégâts critiques d'abord) ;
    - budget : **réduit**, réponse libre **« 109 pts, Flamme 4 »**, puis **niveau 25** (exploration 61 déduite) ;
    - mise en avant : **tuiles en tête** d'Arbre et de Build optimal (non retenus : pastille collée partout, les deux, agrandir sur place) ;
    - preset proposé (Flame Arcanist ×5, anneaux de l'Éther et des Anciens reconduits du n° 19, gemmes Œil du cyclone et Corruption, compétences et rangs, 95 / 109 points) : **validé**, remplace la 1.14.0 à sa place ; l'ancien lien s'ouvre toujours sur l'ancien build.
    Signalés pendant l'échange : Flamme 4 = début de partie alors que le simulateur n'a que l'équipement de fin de jeu (aucun contrôle par Flamme) ; tout repose sur 5 améliorations (à 4 : 53 % / 120 % → 349,9). Ajouts pendant le codage : perks de critique comptés pour toutes les armes (la fiche montre chance et dégâts critiques par arme) ; filtre des armes dominées du build optimal revu (base + perks) ; surcharge des baguettes affichée, non comptée ; noms officiels des perks (MetaBot fr_FR). Après la revue QA (4 relecteurs, aucun bloquant) : une saisie ou un −/+ ne refait plus les tuiles (clic et focus gardés), focus sur le champ à la borne ; ✓ seulement sur un perk débloqué ; hypothèse « une amélioration par perk » signalée dans Équipement ; « Dégâts critiques (base, hors perks d'arme) » dans la fiche ; rangs de compétence d'une arme marqués « non compté » ; message au chargement d'un preset qui fixe niveau, exploration et Flamme ; améliorations bornées au chargement d'un build enregistré ; tests de domination à oracles littéraux (25 mutations tuées sur 25). Non fait, signalé : pas de message quand un ancien lien ou build enregistré change de chiffres (baguettes, bâtons, perks), comme pour les corrections de données précédentes.

24. (Claude Code, 2026-11-06) « L'interface est devenue confuse (je ne sais plus sur quoi cliquer, des informations dans tous les sens) et pas assez modulable ; état des lieux, rendus graphiques de 3 directions (Claude Design), QCM une question à la fois, aucun changement dans src/ » → étude `docs/etudes/harmonisation-interface-2026-11-06.md` (PR, branche `harmonisation-interface`). État des lieux mesuré (Playwright : hauteurs, contrôles, 65 textes d'aide ≈ 1 750 mots ; 440 px avant le premier onglet à 400 px ; réglages en 6 endroits). Outil : Claude Design, skill `/design` tapé par l'utilisateur (l'appel par Claude est refusé) ; canevas https://claude.ai/artifact/BiCNLFQ1CVyRCXk2XmePVd (3 directions × bureau clair / sombre, 400 px clair / sombre). QCM de l'utilisateur :
    - direction : **B · Panneaux** (non retenus : A Simple / Expert, C Parcours) ;
    - commandes : **mode « Organiser »** (un seul bouton Replier en lecture) ; réordonner : **boutons Monter / Descendre** (pas de glisser-déposer) ;
    - dispositions prêtes : **Théoricien, Combat, Minimal, Tout** ; 400 px : **accordéon + barre d'icônes en bas** ; Calculateur : **3 panneaux** (Cible, Classement, Prochains points).
    Plan en 3 phases (coque des panneaux ; en-tête + Réglages + fiche-résumé ; calculateur éclaté + aides + densités), une PR par phase. Signalé : texte des boutons primaires en sombre sous le contraste minimal (à corriger en phase 1).
25. (Claude Code, 2026-11-06) « Phase 1 du plan d'harmonisation (§6.2 de l'étude) : coque des panneaux, mode Organiser, dispositions, accordéon à 400 px ; version 1.18.0, branche + PR, QA avant la PR » → 1.18.0 (branche `panneaux-phase1`). Plus d'onglets : 7 panneaux (Arbre, Équipement, Fiche, Calculateur, Build optimal, Défense, Tables), tailles S (replié) / M / L, rail, dispositions Théoricien / Combat / Minimal / Tout figées dans le code (contenu tiré du QCM 4, adapté aux 7 panneaux de la phase 1 ; « Réglages » de la barre basse = tuiles de l'Arbre en attendant le panneau de la phase 2), « Ma disposition » retenue à part (champ `mine` ajouté au format `{v:1, …}` de l'étude : une disposition prête ne l'efface pas). Choix techniques : `foldPanel` (le nom `fold` existait déjà dans 07-noms.js) ; barre collée = disposition + Organiser seulement (la barre des builds, sur 5 lignes à 400 px, ne peut pas être collée avant le regroupement de la phase 2) ; seuls les panneaux du calculateur sont rendus à la demande (Arbre, Équipement, Fiche restent tenus à jour : peu coûteux, et « Appliquer » du build optimal écrit dans l'Équipement).

## Décisions techniques
- Page unique autonome (contrainte Artifact) ; sources découpées dans `src/` et réassemblées par `scripts/build.mjs`.
- Interface en panneaux (décision n° 25, qui remplace les onglets de la n° 20) : disposition retenue dans `localStorage` (`forge-embervale-panneaux`), jamais dans l'adresse ; seuls les panneaux du calculateur affichés sont calculés.
- Noms d'objets et d'ennemis en français (officiels via MetaBot, sinon traduits et marqués °), compétences traduites ; le nom anglais suit en italique et reste la clé interne (décision n° 22, qui remplace « noms en anglais »).
- Perks d'arme : 5 emplacements par arme (fichiers 1.0), débloqués par les améliorations ; seuls la chance et les dégâts de coup critique sont comptés, pour l'arme qui les porte (décision n° 23) ; baguettes et bâtons à base commune par famille.
- Code de partage dans le hash (`#b3-…`), lisible sans serveur ; tables figées `FZ` (ajout en fin seulement) pour que réordonner ou ajouter des données ne casse aucun lien.
- Tracé de l'arbre = fichiers du jeu (PinDrop) ; la Flamme est un nœud logique non dessiné ; coût identique à chaque rang et liaisons non orientées signalés comme déductions.
- Les estimations sont signalées comme telles dans l'interface (note « Comment lire ces chiffres », panneau « Formules utilisées »).
