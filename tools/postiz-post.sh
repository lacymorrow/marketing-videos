#!/bin/bash
# postiz-post.sh: schedule one post through the self-hosted Postiz (postiz.buildandserve.com).
#   postiz-post.sh -a <channel> -t "text" [-m file]
# channel = the Postiz integration identifier or name fragment, e.g. linkedin, youtube, facebook.
# Key: ~/.config/postiz/api-key (chmod 600, Postiz Settings > Public API). Never print it.
# Posts are scheduled 2 minutes out. Prints "postiz:<post id>" on success. Every post is appended to
# ~/.paperclip/logs/postiz-posts.log. Approval: Lacy 2026-11-13 (full autonomy across his sites and platforms).
set -euo pipefail
export PATH=/opt/homebrew/bin:/usr/local/bin:$PATH
CH=""; TEXT=""; MEDIA=""
while [ $# -gt 0 ]; do case "$1" in
  -a) CH="$2"; shift 2;; -t) TEXT="$2"; shift 2;; -m) MEDIA="$2"; shift 2;;
  *) echo "postiz-post.sh: unknown arg $1" >&2; exit 2;; esac; done
[ -n "$CH" ] && [ -n "$TEXT" ] || { echo "usage: postiz-post.sh -a channel -t text [-m file]" >&2; exit 2; }
KEYF="$HOME/.config/postiz/api-key"; [ -s "$KEYF" ] || { echo "no Postiz key at $KEYF" >&2; exit 1; }
export POSTIZ_API_KEY="$(cat "$KEYF")" POSTIZ_API_URL="${POSTIZ_API_URL:-https://postiz.buildandserve.com/api}"
js(){ sed -n '/^[\[{]/,$p'; }  # the CLI prints an emoji header line before the JSON
ID="$(postiz integrations:list | js | jq -r --arg c "$CH" '.[] | select((.identifier|ascii_downcase|test($c)) or (.name|ascii_downcase|test($c))) | .id' | head -1)"
[ -n "$ID" ] || { echo "no Postiz channel matches '$CH'" >&2; exit 1; }
M=()
if [ -n "$MEDIA" ]; then
  [ -f "$MEDIA" ] || { echo "media missing: $MEDIA" >&2; exit 1; }
  URL=""; for try in 1 2 3; do  # video uploads hit ECONNRESET once on 2026-11-14
    URL="$(postiz upload "$MEDIA" 2>/dev/null | js | jq -r '.path // .url // empty' 2>/dev/null || true)"; [ -n "$URL" ] && break; sleep 5; done
  [ -n "$URL" ] || { echo "media upload failed: $MEDIA" >&2; exit 1; }
  M=(-m "$URL")
fi
WHEN="$(date -u -v+2M +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -d '+2 min' +%Y-%m-%dT%H:%M:%SZ)"
OUT="$(postiz posts:create -c "$TEXT" ${M[@]+"${M[@]}"} -s "$WHEN" -i "$ID" | js)"
PID="$(printf '%s' "$OUT" | jq -r '.. | .id? // empty' 2>/dev/null | head -1)"
[ -n "$PID" ] || { echo "postiz create gave no id: $OUT" >&2; exit 1; }
mkdir -p "$HOME/.paperclip/logs"; printf '%s %s postiz:%s | %s\n' "$(date '+%F %T')" "$CH" "$PID" "$TEXT" >> "$HOME/.paperclip/logs/postiz-posts.log"
echo "postiz:$PID"
