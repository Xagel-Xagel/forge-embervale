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
7. « Il te faut quoi pour avoir le tracé réel du jeu ? Une image te suffirait ? » → réponse : oui, des captures de l'arbre en jeu (ou le planificateur PinDrop dans le navigateur de l'utilisateur, avec son accord). **Pas encore fourni** → ROADMAP n° 1.
8. « Rajoute les pierres précieuses pour les armes aussi. » → 29 gemmes, un emplacement par arme, alerte si le type de dégâts ne déclenche pas l'effet.
9. « Récupère la formule de calcul des dégâts et résistances, et les résistances et faiblesses entre chaque type de dégât et monstre, pour un calculateur d'optimisation. » → 06-enemies.js + 20-optimizer.js (version 8).
10. « Prépare tout un package pour que Claude Code prenne le relais. » → ce dépôt.

## Décisions techniques
- Page unique autonome (contrainte Artifact) ; sources découpées dans `src/` et réassemblées par `scripts/build.mjs`.
- Noms d'objets en anglais (comme en jeu), compétences traduites avec le nom anglais en italique.
- Code de partage dans le hash (`#b2-…`), lisible sans serveur.
- Les estimations sont signalées comme telles dans l'interface (note « Comment lire ces chiffres », panneau « Formules utilisées »).
