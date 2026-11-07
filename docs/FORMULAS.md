# Formules de jeu utilisées

Niveau de confiance : **officiel** (texte du jeu), **fichiers** (valeurs extraites des fichiers du jeu par des sites tiers), **communauté** (estimation non vérifiée), **hypothèse** (choix du simulateur faute de source).

## Progression (fichiers / wiki)
| Règle | Valeur | Confiance |
|---|---|---|
| Niveau max | 50 | fichiers |
| Points de compétence | 2 par niveau (98) + 114 d'exploration (Racines du Shroud 1 pt, Puits d'élixir 3 pts) = **212** | wiki |
| `budget(b)` | `2 × (niveau − 1) + exploration` | — |
| Nœuds « Flamme » (Barbare, Foulée gracieuse, Exalté, Concentration arcanique, Peau épaisse, Endurance de la Flamme) | +1 attribut tous les 2 niveaux de Flamme (Flamme max 11 → +5) | wiki |

## Attributs (MetaBot, wiki)
| Attribut | Effet par point |
|---|---|
| Constitution | +50 PV |
| Esprit | +20 mana |
| Endurance | +10 vigueur |
| Force | +5 % de dégâts de mêlée |
| Dextérité | +5 % de dégâts aux arcs et dagues |
| Intelligence | +5 % de dégâts magiques (baguettes, bâtons) |

Base : 100 PV, 100 mana, 100 vigueur. Les dégâts ne sont plus calculés depuis la 2.0.0 (équipement non pris en compte) : seuls les attributs, la santé, le mana et la vigueur sont affichés (ligne « Résultat », A contre B).

Implémenté dans `compute()` (src/js/02-calc.js). Quelques compétences convertissent un attribut en PV : Athlète (3 × Force par rang), Vigueur voilée (3 × Dex), Essences de vie (3 × Int) ; Rôdeur : +1 Dextérité et +1 Endurance par rang.

## Arbre de compétences (fichiers / déduit)
| Règle | Valeur | Confiance |
|---|---|---|
| Tracé : positions et liaisons des 243 nœuds (12 départs, 59 attributs +1, 172 compétences) | `01-tree-data.js` | fichiers (serveur dédié 1.0, relevé PinDrop) |
| Achat : un nœud doit toucher un départ ou un nœud acquis relié à un départ | `canBuy` | fichiers + **déduit** : les liaisons sont stockées orientées, mais 9 nœuds n'ont aucun lien entrant, donc le jeu ne peut pas s'en servir comme prérequis (analyse PinDrop) |
| Coût d'un rang | coût du nœud, identique à chaque rang | **hypothèse** : les fichiers ne donnent qu'un coût par nœud (même hypothèse que PinDrop) |
| Flamme centrale | nœud logique reliant les 12 départs, non dessiné | représentation du simulateur |

## Objectifs (simulateur, 2.0.0)
| Règle | Valeur | Confiance |
|---|---|---|
| Contenu d'un objectif | compétences, rangs, attributs et gemmes d'un ancien build prédéfini, tels quels | repris (presets 1.x) |
| Ordre des étapes, raisons affichées | `GOALS` (06-objectifs.js) | **hypothèse** du simulateur |
| Combo imposé (`combo`) | pour chaque élément des étapes, dans l'ordre : chemin le moins cher depuis l'arbre relié (`pathTo`, Dijkstra pondéré par les coûts), puis les rangs ; **arrêt au premier achat trop cher** ; liaisons devenues inutiles retirées en fin d'étape | **hypothèse** (algorithme du simulateur) |
| Nœuds de Flamme à la Flamme 1 | sautés (ils n'y donnent rien) | déduit de la règle « +1 tous les 2 niveaux » |
| Objectif secondaire | même calcul sur les points restants, après le principal (qui reste identique) | **hypothèse** |
| Objectif de soutien (2.1.0) | même calcul sur les derniers points, après principal et secondaire (identiques) ; compétences seules ; contenu, ordre et raisons : `SUPS` (06-objectifs.js) | **hypothèse** du simulateur |
| Nœud imposé | rang minimum = rang imposé ; ajouts libres au-dessus (invariant de l'arbre gardé) | choix du simulateur |
| Vos ajouts (2.3.0) | le combo est recalculé depuis les départs à chaque ajout ou retrait : vos nœuds comptent comme déjà acquis (coût nul pour ses chemins) ; il garde tout le budget, vos ajouts viennent en plus ; vos rangs comptent pour une étape (ce qu'elle en compte devient imposé), vos nœuds d'attribut s'ajoutent au compte des étapes ; un ajout non relié par le combo l'est par le chemin le moins cher | **hypothèse** du simulateur (QCM du 2026-11-07) |
| Garde-fou (2.3.0) | si le calcul avec vos ajouts avance moins les objectifs, ou coûte plus à avancée égale, l'ancien calcul (combo seul, ajouts posés dessus) est gardé, sauf s'il rendait imposé un de vos nœuds d'attribut ou une de vos liaisons | choix du simulateur |
