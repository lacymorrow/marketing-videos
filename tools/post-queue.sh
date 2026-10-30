#!/bin/bash
# post-queue.sh: post queued X posts on their day, from the existing 10-minute sweep on zero.
# Queue: tools/post-queue.tsv, tab-separated: <YYYY-MM-DD> <account> <clip|-> <community_id|-> <text>
# A due line posts once in the first tick at or after 09:00 local via x-post.sh, is recorded in
# ~/.paperclip/logs/post-queue.done (keyed by date+account+clip+community) and DMs Lacy on Slack.
# A failed post is recorded and never retried: fix it and run x-post.sh by hand.
# Standing approval from Lacy 2026-10-29 to post on X for Juno (memory x-posting-standing-ok).
set -uo pipefail
export PATH=/opt/homebrew/bin:/usr/local/bin:$PATH
T="$HOME/repo/marketing-videos/tools"; CLIPS="$HOME/repo/marketing-videos/public/takes/asks"
Q="$T/post-queue.tsv"; DONE="$HOME/.paperclip/logs/post-queue.done"
TODAY="${POST_QUEUE_TODAY:-$(date +%F)}"; HOUR="${POST_QUEUE_HOUR:-$(date +%H)}"; DRY="${POST_QUEUE_DRY_RUN:-}"
[ -s "$Q" ] || exit 0
[ "$HOUR" -ge 9 ] || exit 0
mkdir -p "$(dirname "$DONE")"; touch "$DONE"
while IFS=$'\t' read -r day acct clip comm text; do
  [ -n "$day" ] && [ -n "$acct" ] && [ -n "$text" ] || continue
  [[ "$day" < "$TODAY" || "$day" == "$TODAY" ]] || continue
  key="$day|$acct|$clip|$comm"
  grep -qF "	$key	" "$DONE" && continue
  if [ -n "$DRY" ]; then echo "dry-run: would post [$key] $text"; continue; fi
  args=(-u "$acct" -t "$text")
  [ "$clip" != "-" ] && args+=(-m "$CLIPS/juno-$clip.mp4")
  [ "$comm" != "-" ] && args+=(-c "$comm")
  out="$("$T/x-post.sh" "${args[@]}" 2>&1)"; rc=$?
  url="$(printf '%s' "$out" | grep -o 'https://x.com/[^ ]*' | tail -1)"
  if [ $rc -eq 0 ] && [ -n "$url" ]; then
    printf '%s\t%s\t%s\n' "$(date '+%F %T')" "$key" "$url" >> "$DONE"
    msg="Posted from @$acct: $url"
  else
    printf '%s\t%s\tFAIL rc=%s\n' "$(date '+%F %T')" "$key" "$rc" >> "$DONE"
    printf '%s\n%s\n' "[$key]" "$out" >> "$HOME/.paperclip/logs/post-queue.err"
    msg="Queued X post did NOT go out [$key] (exit $rc). Nothing will retry; see ~/.paperclip/logs/post-queue.err"
  fi
  echo "$(date '+%F %T') $msg"
  "$HOME/.openclaw/scripts/slack-post.sh" -c U3XC80UUQ -m "$msg" >/dev/null 2>&1 || true
done < "$Q"
