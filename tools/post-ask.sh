#!/bin/bash
# post-ask.sh <reminders|calendar|mail>: upload one bench clip and post it from @junebug_ai.
# Copy approved by Lacy 2026-10-29. One clip per morning: reminders, calendar, mail.
set -euo pipefail
NAME="${1:-}"
DIR="$HOME/repo/marketing-videos/public/takes/asks"
case "$NAME" in
  reminders) TEXT='say it once and keep typing. juno sets the reminder and shows you the card so you know it took. then it folds back into a dot.';;
  calendar)  TEXT='no switching to the calendar. ask how long you'"'"'ve got, the dot grows into the answer, and it'"'"'s gone again before your next sentence.';;
  mail)      TEXT='the draft was already in mail. you say who it goes to and what to ask. juno finds it and sends it, then shows you what went out.';;
  *) echo "usage: post-ask.sh reminders|calendar|mail" >&2; exit 2;;
esac
X=(xurl --app lacybuilds -u junebug_ai --auth oauth2)
ID="$("${X[@]}" media upload "$DIR/juno-$NAME.mp4" | grep -o '"id": *"[0-9]*"' | head -1 | grep -o '[0-9]*')"
[ -n "$ID" ] || { echo "upload failed" >&2; exit 1; }
for _ in $(seq 1 30); do
  "${X[@]}" media status "$ID" | grep -q '"state": *"succeeded"' && break
  sleep 2
done
"${X[@]}" post "$TEXT" --media-id "$ID"
