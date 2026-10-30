#!/bin/bash
# x-post.sh: one post on X through xurl, with the options the `post` subcommand lacks.
#   x-post.sh -u <account> -t "text" [-m file.mp4|png] [-c community_id] [-q quote_tweet_id] [-r reply_to_id]
# Accounts: junebug_ai, lacybuilds (both under --app lacybuilds). Every post is appended to
# ~/.paperclip/logs/x-posts.log as "<time> <account> <tweet url> | <text>". Standing approval from Lacy 2026-10-29.
set -euo pipefail
export PATH=/opt/homebrew/bin:/usr/local/bin:$PATH
USER_=""; TEXT=""; MEDIA=""; COMMUNITY=""; QUOTE=""; REPLY=""
while [ $# -gt 0 ]; do case "$1" in
  -u) USER_="$2"; shift 2;; -t) TEXT="$2"; shift 2;; -m) MEDIA="$2"; shift 2;;
  -c) COMMUNITY="$2"; shift 2;; -q) QUOTE="$2"; shift 2;; -r) REPLY="$2"; shift 2;;
  *) echo "x-post.sh: unknown arg $1" >&2; exit 2;; esac; done
[ -n "$USER_" ] && [ -n "$TEXT" ] || { echo "usage: x-post.sh -u account -t text [-m media] [-c community] [-q quote] [-r reply]" >&2; exit 2; }
X=(xurl --app lacybuilds -u "$USER_" --auth oauth2)
MID=""
if [ -n "$MEDIA" ]; then
  MID="$("${X[@]}" media upload "$MEDIA" | grep -o '"id": *"[0-9]*"' | head -1 | grep -o '[0-9]*')"
  [ -n "$MID" ] || { echo "media upload failed" >&2; exit 1; }
  for _ in $(seq 1 45); do "${X[@]}" media status "$MID" | grep -q '"state": *"succeeded"' && break; sleep 2; done
fi
BODY="$(TEXT="$TEXT" MID="$MID" COMMUNITY="$COMMUNITY" QUOTE="$QUOTE" REPLY="$REPLY" python3 -c '
import json,os
b={"text":os.environ["TEXT"]}
if os.environ["MID"]: b["media"]={"media_ids":[os.environ["MID"]]}
if os.environ["COMMUNITY"]: b["community_id"]=os.environ["COMMUNITY"]
if os.environ["QUOTE"]: b["quote_tweet_id"]=os.environ["QUOTE"]
if os.environ["REPLY"]: b["reply"]={"in_reply_to_tweet_id":os.environ["REPLY"]}
print(json.dumps(b))')"
OUT="$("${X[@]}" -X POST /2/tweets -d "$BODY" 2>&1)"
ID="$(printf '%s' "$OUT" | grep -o '"id": *"[0-9]*"' | head -1 | grep -o '[0-9]*')"
if [ -z "$ID" ]; then echo "$OUT" >&2; exit 1; fi
URL="https://x.com/$USER_/status/$ID"
mkdir -p "$HOME/.paperclip/logs"
printf '%s %s %s | %s%s\n' "$(date '+%F %T')" "$USER_" "$URL" "$TEXT" "${COMMUNITY:+ [community $COMMUNITY]}${QUOTE:+ [quote $QUOTE]}" >> "$HOME/.paperclip/logs/x-posts.log"
echo "$URL"
