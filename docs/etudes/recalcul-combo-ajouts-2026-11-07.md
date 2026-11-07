# Recalcul du combo avec vos ajouts — étude (2026-11-07)

Demande (QCM du 2026-11-07) : après chaque ajout ou retrait de nœud, le combo imposé est recalculé **depuis les départs en tenant compte des ajouts** : un nœud déjà acquis ne coûte plus rien au combo (chemins plus courts, points libérés pour les étapes suivantes, le secondaire et le soutien).

Indicateur : **profil 6 Sensible [R2 K2 A1]** — R2 : moteur sans modèle à copier (invariant, glouton) ; K2 : codes de partage (liens déjà envoyés) ; A1 : une zone (06-objectifs, 03-share, 10-ui, 30-graph, tests).

## 1. Constat (2.2.0)
- `combo(p, s, lvl, exp, flame, t)` part d'un arbre **vide** ; `addsOf` = arbre − combo ; `rebuild` = combo ∪ ajouts ; les ajouts ne changent jamais le combo.
- Si le combo dépend des ajouts, la définition devient circulaire (les ajouts se lisent par différence avec le combo) : **il faut garder les ajouts dans le build**.

## 2. Conception proposée
1. **Graine** : le combo démarre d'un arbre qui contient vos ajouts. `dijkstra` compte déjà un nœud acquis à coût 0 : les chemins qui passent par vos ajouts sont gratuits pour le combo. Aucune autre règle de chemin ne change.
2. **Compétences** : vos rangs comptent pour l'étape (vous avez déjà le rang demandé → rien à payer). **Nœuds d'attribut** : les vôtres s'ajoutent au compte de l'étape (sinon « +1 Constitution » serait absorbé et le clic ne changerait rien).
3. **Liaisons** : recalculées de zéro à chaque clic ; `cleanLinks` garde son rôle, avec une vérification relative (un retrait de liaison ne doit couper aucun nœud relié, ajouts compris).
4. **Vos ajouts restent reliés** : s'il manque une liaison vers un ajout après les objectifs, le moteur l'achète (chemin le moins cher, au-delà du budget s'il le faut, puisque vos ajouts viennent en plus — Q1). Retenu après Q1 : pas de repli « relier d'abord » (il ne servait qu'au mode « payés d'abord »).
5. **Build** : nouveau champ `ad` (vos ajouts : rangs et nœuds d'attribut), enregistré avec le build ; l'arbre affiché = combo(objectifs, réglages, `ad`). Nouveau principal → `ad` vidé (comme aujourd'hui) ; arbre libre → inchangé.
6. **Lien** : segment optionnel `-a` (vos ajouts), **seulement s'il y en a**, avant le contrôle ; un code sans ajout reste octet pour octet celui de la 2.2.0.
7. **Retrait** : recalcul sans l'ajout ; un ajout qu'aucun calcul (avec ou sans vos ajouts) ne relie plus est élagué, message actuel (règle 3) ; idem au changement de réglage, de secondaire ou de soutien (comportement de la 2.2.0). Juste après un ajout, rien n'est élagué. Un nœud imposé reste non retirable (`lockOf`) ; +1 puis −1 sur un rang ne change rien.
8. **Pourquoi ce combo** : la ligne « Liaisons · vos ajouts · libres » reste ; la phrase « hypothèse » dit que vos ajouts comptent comme déjà acquis ; message court après un clic (« Combo recalculé : liaisons 24 pts → 20 pts · objectifs +7 pts ») ; carte d'un ajout : « le combo passe par ce nœud, sans le payer » quand il en porte une partie.
9. **Garde-fou (ajouté après Q1)** : en mode « en plus », le glouton fait moins bien avec les ajouts dans ≈ 2,5 % des cas (2 430 jeux d'ajouts : 33 reculs des objectifs, 28 cas plus chers à avancée égale). Le moteur calcule aussi l'ancien résultat (combo seul + ajouts) et garde le meilleur (avancée, puis points), sauf si l'ancien rendait imposé un de vos nœuds d'attribut ou une de vos liaisons.

## 3. Mesures (prototype jetable, hors `src/`)
- **Sans ajout** : 11 016 combos (12 objectifs × 3 secondaires × 3 soutiens × Flammes 1 et 11 × budgets 0 à 212) **identiques** au moteur actuel → coûts à 212 points figés inchangés.
- **816 jeux d'ajouts au hasard** (1 à 4 nœuds voisins de l'arbre), deux modes de budget : aucun ajout perdu, aucun nœud non relié.
- **Temps d'un recalcul** : médiane 3 ms, 99e centile 12 ms, maximum 31 ms (pas de tâche longue au clic) ; 7,4 ms mesurées dans Chromium (test Playwright, double-clic réel dans le graphe).
- **Sans ajout, avec secondaire** : 218 reculs sur 1 782 combos quand les points montent (déjà en 2.2.0 : le principal passe d'abord) ; « sans recul » ne vaut que pour le principal seul, avec ou sans ajouts.
- **Sans recul quand les points montent** (ajouts fixés, budgets 0 à 212 par pas de 4) : 3 888 combos, 0 recul.
- **3 177 ajouts uniques** voisins de l'arbre : l'ancien modèle dépasse le budget dans 1 259 cas ; liaisons moins chères dans 358 cas (mode « en plus ») ; mode « payés d'abord » : 309 cas sans recul des objectifs, 30 cas où les objectifs avancent plus loin **malgré** le coût de l'ajout (ex. Mage critique à 80 pts : Esprit +1, 1 pt → liaisons 30 → 27 pts).

## 4. Décisions (QCM, une à la fois)
- **Q1 Budget** → **« En plus, comme aujourd'hui »** (le combo garde tout le budget, dépassement possible). « Payés d'abord » (recommandé) écarté par l'utilisateur.
- **Q2 Verrou** → **« Devient imposé »** : un ajout que l'objectif demande (étape atteinte) est verrouillé ; vos rangs au-dessus restent retirables.
- **Q3 Anciens liens et builds enregistrés avec ajouts (2.0.0 à 2.2.0)** → **« Recalculé + message »** ; sans effet sur le combo, ouvert à l'identique.

## 5. Tests prévus
- Un ajout sur le chemin d'une étape libère des points (cas figé, liaisons en moins).
- Un retrait recalcule : retirer l'ajout rend exactement le combo sans ajout.
- Jamais de recul quand les points montent, ajouts fixés.
- Invariant (relié, budget, ajouts gardés, verrous) prouvé sur plusieurs milliers de combos avec ajouts au hasard.
- Liens : aller-retour avec ajouts (`-a`) ; code sans ajout identique ; anciens liens selon Q3 ; `share.test.js` et `codes-figes.test.js` intacts.

## 6. Livraison
Branche `combo-ajouts`, PR (tests Node, build, Playwright), relecture QA (logique, liens, mutations) ; version 2.3.0 ; `/livrer` seulement après GO.
