# Journal des versions

Numéros = versions de l'Artifact publié sur claude.ai (les premières étapes ont pu être publiées plusieurs fois).

## 1.17.0 — 2026-11-06 · Perks d'arme, Mage critique refait, Points et Flamme en grand
- **Perks d'arme 1.0** : chaque arme a ses **5 emplacements** dans l'ordre des fichiers du jeu (PinDrop), avec leur valeur, sous leur nom officiel français (MetaBot) ; un emplacement se débloque par amélioration (curseur Améliorations), comme pour les armures. Vérifié en ligne : les perks sont **fixes** par arme (pas de reforge) ; la **gemme**, elle, se choisit (Forge à gemmes) si l'arme a un emplacement.
- **Comptés dans les dégâts** : « Chance de coup critique » et « Dégâts de coup critique », pour l'arme qui les porte (fiche : chance et dégâts critiques par arme ; ✓ sur les puces de l'Équipement). Les autres perks (Lourd, Sans pitié, Opportuniste, vols…) et la **surcharge** des baguettes sont affichés, non comptés.
- **Base des baguettes et des bâtons** : les fichiers 1.0 donnent le même multiplicateur à toute la famille ; toutes les baguettes passent à 91 et tous les bâtons à 77 (la plus haute valeur du wiki). Les autres familles gardent l'estimation d'avant la 1.0 (ROADMAP).
- **Preset « Mage critique (baguette) » refait** (même place, choix de l'utilisateur, QCM) : chance d'abord ; **Baguette mythique** (Chance de coup critique +6 % ×2) et **Everblue de l'Oracle** (+7 %), gemmes Œil du cyclone et Corruption ; **niveau 25 + 61 d'exploration = 109 points, Flamme 4** ; baguette **78 % / 123 % → 436,8** (1.14.0 : 66 % / 123 % → 428,7), 95 points dépensés, 14 libres. Le lien donné pour la 1.14.0 ouvre toujours l'ancien build.
- **Points et Flamme en grand** : en tête des onglets Arbre et Build optimal, deux tuiles côte à côte (aussi à 400 px) : points à attribuer (ou en trop) et niveau de la Flamme avec boutons −/+ et l'effet des nœuds de Flamme du build (ex. « Exalté : +2 INT »).
- Anciens liens et builds enregistrés avec une baguette ou un bâton : mêmes objets et arbre, mais chiffres revus (base commune, perks de critique).
- Build optimal : une arme n'est écartée que si une autre de même catégorie et même répartition a une base **et** des perks de critique au moins égaux.

## 1.16.0 — 2026-11-06 · Noms en français
- Objets (armures, panoplies, armes, anneaux), ennemis et factions s'affichent **en français**, suivis du nom anglais en italique, comme les compétences (choix de l'utilisateur, QCM).
- Noms d'objets et de 13 ennemis : **noms officiels du jeu** (relevés sur MetaBot). Les 88 autres ennemis : **traduction du simulateur**, marquée ° (infobulle et légende de la table, mention sur la carte de la cible).
- Factions : Déchus, Creux, Maraudeurs, Drak'Dal, Anciens (officiels) ; Vukah et Faune inchangés. « Contre les Fell / Hollow » devient « Contre les Déchus / Creux » ; textes de compétences et de gemmes alignés.
- Le filtre de la table des ennemis trouve le nom français comme l'anglais, sans tenir compte des accents.
- Aucun lien de partage touché : les codes enregistrent des identifiants, pas des noms.

## 1.15.0 — 2026-11-06 · Navigation par onglets
- La page n'affiche plus tout à la suite : **six onglets** sous la barre des builds — Arbre, Équipement, Calculateur, Build optimal, Défense, Tables (table des 101 ennemis et formules) ; une seule partie visible à la fois (choix de l'utilisateur, QCM).
- La **fiche du personnage** reste à droite des onglets Arbre et Équipement (dessous sous 1000 px de large) ; les autres onglets prennent toute la largeur.
- Les onglets restent **collés en haut** pendant le défilement ; sur téléphone, ils tiennent sur **2 lignes de 3**. Rien ne passe dessous (focus clavier, haut des parties).
- La page **rouvre sur le dernier onglet** (stockage du navigateur, via `lsGet`/`lsSet` ; 1re visite ou stockage bloqué : Arbre). L'adresse ne change pas : le hash reste réservé au code de partage.
- Le choix de la cible (ennemi, arme analysée) apparaît dans Calculateur et Build optimal ; dans Tables, un nom d'ennemi cliqué devient la cible et ouvre le Calculateur.
- Clavier (motif ARIA des onglets) : ← et → en boucle, Début, Fin ; rôles `tab` / `tabpanel`, `aria-selected`.
- Plus rapide : seul l'onglet ouvert du calculateur est calculé ; le graphe caché ne se dessine plus, et se recale (taille, premier cadrage) quand on rouvre l'onglet Arbre, sans perdre le zoom.
- Corrigé au passage : les deux cases à cocher de la Défense étaient étirées sur toute la colonne (défaut déjà présent en 1.14.0).
- Messages : quand le build optimal s'arrête (réglages changés) ou se termine pendant qu'on est dans un autre onglet, un message le dit ; « Comparer A et B » coché hors d'Arbre et d'Équipement dit où voir la fiche. Les messages s'empilent sans se chevaucher et sont lus par les lecteurs d'écran.
- Le plan « Répartir au mieux » reste affiché d'un onglet à l'autre (tant que le build, la cible et l'arme analysée ne changent pas) ; la table des ennemis garde son défilement quand le build change.
- Revue QA (code-reviewer, pr-test-analyzer, silent-failure-hunter, test-critic) : constats corrigés. Les tests Node observent maintenant l'effet des onglets sur la page (faux éléments persistants) : 23 pannes simulées, toutes détectées ; test navigateur étendu (démarrage sur chaque onglet, A/B, stockage bloqué, zoom gardé, clavier, focus avec contre-épreuve).
- CLAUDE.md : l'Artifact claude.ai est en version 14 (et non 13) ; `localStorage` sert aussi à l'onglet ouvert.

## 1.14.0 — 2026-11-06 · Preset « Mage critique (baguette) »
- Nouveau preset (en fin de liste, groupe « Mage et magie ») : **chance de critique d'abord, puis dégâts critiques**, puis dégâts moyens ; aucune compétence utilitaire (choix de l'utilisateur, QCM).
- Chiffres (niveau 50, Flamme 11, améliorations 5) : **66 % de critique**, **123 % de dégâts critiques** ; Wand Of Bloodflow 428,7 de dégâts moyens (coup 236,6), Violet Storm 392,0 de Puissance ; 93 points dont 24 de liaison (Précision fatale est dans la zone Rôdeur).
- Plafond du jeu : 100 % de chance ; plafond atteignable à la baguette avec nos données et deux anneaux différents : **67 %** (Ring of the Ether + un anneau à +5 %), cédé d'1 point contre +19 de dégâts critiques (Ring of the Ancients), décision de l'utilisateur. Ce chiffre suppose que les rangs donnés par l'équipement dépassent le maximum de la compétence (**hypothèse**, sinon 49 %, voir FORMULAS).
- Liaisons obligatoires achetées au chargement (13 compétences au rang 1, 6 Esprit, 1 Dextérité) : ce ne sont pas des choix utilitaires.
- Non comptés : perks d'arme (« Précis », « Brutal », éléments), gemmes (aucune posée), attaques impitoyables et furtives, effets déclenchés par les critiques (Coup en chaîne, Destruction massive, Terreur, Saignée, Frappe et sort).
- CLAUDE.md : l'Artifact claude.ai est en version 13 (et non 12).

## 1.13.0 — 2026-11-06 · Build optimal (équipement + arbre)
- Calculateur, nouvelle carte **« Build optimal contre <ennemi> »** : pour des **points disponibles** et un **niveau de Flamme** donnés, l'optimiseur part d'un arbre vide et choisit l'arme, les 5 pièces d'armure, 2 anneaux et l'arbre qui maximisent les dégâts moyens contre la cible ; les PV départagent les égalités et reçoivent les points restants. Bouton **« Appliquer »** par résultat.
- **Un résultat par famille** (mêlée une main, mêlée deux mains, dagues, arcs, baguettes, bâtons), sans classement entre familles : « Dégâts » et « Puissance » ne se comparent pas et la vitesse d'attaque n'est pas comptée.
- Méthode : chaque arme non dominée est essayée ; arbre par deux gloutons (avec un regard à deux achats quand un achat seul ne rapporte rien, ex. Essences de vie sans Intelligence) ; équipement pièce par pièce + meilleure paire d'anneaux ; alternance jusqu'à stabilité ; amélioration locale quand le budget manque. Affiché « heuristique, pas une preuve d'optimalité ».
- Mesures : 0,6 à 3,5 s pour les 6 familles selon le budget (Node), aucune tâche de plus de 50 ms dans le navigateur (calcul découpé) ; bouton « Arrêter » (les familles finies restent applicables) ; plafond de 10 s de temps de calcul. Pendant le calcul, les champs et « Appliquer » sont inactifs ; une erreur est affichée et libère le bouton.
- Contrôles : aucune combinaison d'armures (32 768) ni paire d'anneaux (91) ne fait mieux sur 3 cas ; aucun échange d'un nœud ne fait mieux à budget serré ; égal à l'énumération exhaustive des arbres à 4 points ; chaque preset égalé ou battu à budget égal ; planchers par famille.
- « Points disponibles » et « Niveau de Flamme » : propres à chaque build (A, B), vides = valeurs du build ; une saisie hors bornes est ramenée et le message le dit.
- Revue QA (code-reviewer, pr-test-analyzer, silent-failure-hunter, test-critic) : constats corrigés (« Arrêter » qui ratait un clic, résultats partiels sans « Appliquer » actif, erreur qui figeait la carte, saisies figées après un calcul, tests renforcés par des oracles indépendants).
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
