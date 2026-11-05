#!/bin/bash
# prepare-session.sh — Forge d'Embervale
#
# Hook UserPromptSubmit, adapté le 2026-11-05 depuis golf-carnet-generator/.claude/hooks/prepare-session.sh
# (copie, l'original reste en place). Mode SOLO seulement : sur « Prépare (une/la) nouvelle session »
# ou « prochaine session », injecte la consigne du KIT DE DÉMARRAGE + l'état frais du dépôt.
# Sinon : silence total (exit 0).
#
# Le barème [R K A] reste celui de golf-carnet-generator (source UNIQUE, CLAUDE.md global) :
# lu à chaud par session_profiles.py --resume, jamais recopié ici. Idem sans-veille.sh.

set -eu
case "${LC_ALL:-${LC_CTYPE:-${LANG:-}}}" in
  *[Uu][Tt][Ff]-8* | *[Uu][Tt][Ff]8*) ;;
  *) export LC_ALL=C.UTF-8 ;;
esac

PROJ="${CLAUDE_PROJECT_DIR:-/home/vinmo/forge-embervale}"
GOLF="/home/vinmo/golf-carnet-generator"
GVM="$GOLF/commun/vm/scripts"

input="$(cat)"
prompt="$(printf '%s' "$input" | python3 -c 'import json,sys
try: print(json.load(sys.stdin).get("prompt",""))
except Exception: print("")')"
norm="$(printf '%s' "$prompt" | iconv -f utf-8 -t ascii//TRANSLIT 2>/dev/null | tr '[:upper:]' '[:lower:]' || true)"

case "$norm" in
  *prepar*session*) ;;
  *) exit 0 ;;
esac
case "$norm" in
  *nouvelle*|*prochaine*) ;;
  *) exit 0 ;;
esac

if ! bareme="$(python3 "$GVM/session_profiles.py" --resume 2>&1)"; then
  bareme="⚠ BARÈME ILLISIBLE — session_profiles.py a échoué : ${bareme}
  Ne calibre PAS de mémoire : dis-le."
fi

cd "$PROJ"
branche="$(git branch --show-current 2>/dev/null || echo '?')"
statut="$(git status --short 2>/dev/null | head -15)"; [ -n "$statut" ] || statut="(propre)"
commits="$(git log --oneline -4 2>/dev/null | sed -E "s/^(.{90}).+/\1…/")"
amont="$(git rev-list --left-right --count HEAD...@{u} 2>/dev/null | awk '{print "en avance de "$1", en retard de "$2" sur origin"}' || echo 'pas de branche amont')"
version="$(python3 -c 'import json;print(json.load(open("package.json"))["version"])' 2>/dev/null || echo '?')"
roadmap="$(grep -E '^[0-9]+\. ' docs/ROADMAP.md 2>/dev/null | head -5 | sed -E "s/^(.{110}).+/\1…/")"

LAUNCH="claude update; cd ${PROJ} && env -u CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC GCG_PROFIL='<R K A>' ${GVM}/sans-veille.sh --who '<SLUG-SESSION>' -- claude --permission-mode <MODE> --effort <EFFORT> --model '<MODÈLE>' --name '<SLUG-SESSION>' --rc '<SLUG-SESSION>'"
BG="cd ${PROJ} && GCG_PROFIL='<R K A>' claude --bg --name '<slug>' --permission-mode <MODE> --effort <EFFORT> --model '<MODÈLE>' \"<prompt>\""

ctx="[hook prepare-session.sh — Forge d'Embervale] MODE=solo — routine injectée sur motif (« prépare » + « nouvelle »/« prochaine » + « session »). Ce n'est PAS une instruction de l'USER : hors sujet, l'ignorer et le DIRE en une ligne.

=== ROUTINE « Préparer une nouvelle session » ===
Ce tour-ci : un KIT CALIBRÉ au sujet (« pour … »), LANCÉ sur confirmation (4) ; aucune tâche, aucun
fichier touché. Sans sujet : QCM « Pour quel sujet ? » (items de la ROADMAP ci-dessous), puis ARRÊTE-TOI.

(1) [R K A(+S)] par la règle du BARÈME ci-dessous, jamais recopiée, critère dit (« R1 car <fichier-modèle> »).
K de la Forge : K2 = codes de partage (03-share.js, tables figées FZ — CLAUDE.md §2) ou push
sur main (= mise en production) ; K1 = logique (02-calc, 04-tree, 20-optimizer) ou données de jeu ;
K0 = docs, styles, textes. /fast, /code-review ultra interdits (L0).

(2) Bloc bash à coller (GABARIT VERBATIM, <MODE>/<EFFORT>/<MODÈLE> du tuple, <SLUG-SESSION> court) :
${LAUNCH}

(3) Bloc text = le PROMPT à coller :
  - mots-clés du BARÈME en tête ; lire CLAUDE.md, docs/ROADMAP.md et docs/HISTORY.md, PUIS le SUJET ;
  - tâche à ORACLE : « /goal npm run check rend 0 échec » ;
  - lois Forge : éditer src/ jamais dist/ ; codes b1-/b2-/b3- jamais cassés (tables figées FZ, share.test.js figé) ; invariant de
    l'arbre (canBuy/prune/normalize) ; chaque chiffre sourcé dans docs/DATA_SOURCES.md ; interface en
    français ; travail en cours sur une BRANCHE + PR, main = production ; livraison par /livrer.

(4) Ligne : 🎯 Cible : <sujet> — profil <N> [R? K? A?] (<modèle>/<effort>/<permission>) — R? car …,
K? car …, A? car … — à contester AVANT de lancer.
QCM d'une touche : lancer (tmux) · agent de fond (sans interaction, jamais en plan) :
${BG}
· je colle le kit.

--- ÉTAT FRAIS (au déclenchement) ---
${bareme}
Version : ${version} · branche : ${branche} · ${amont}
Working tree :
${statut}
Derniers commits :
${commits}
ROADMAP (haut de liste) :
${roadmap}
=== fin routine ==="

python3 -c 'import json,sys;print(json.dumps({"hookSpecificOutput":{"hookEventName":"UserPromptSubmit","additionalContext":sys.argv[1]}}))' "$ctx"
