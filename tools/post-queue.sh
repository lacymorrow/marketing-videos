#!/bin/bash
# post-queue.sh: post queued X posts on their day, from the existing 10-minute sweep on zero.
#
# Queue: tools/post-queue.tsv, tab-separated: <YYYY-MM-DD> <account> <media|-> <community_id|-> <text>
#   account: junebug_ai or lacybuilds (both under xurl --app lacybuilds).
#   media:   a bench clip name (public/takes/asks/juno-<name>.mp4), a path under marketing-videos
#            (out/juno-ads/juno-ad-teammate-16x9.mp4) or an absolute path (/Users/lacy/repo/camfetti-internal/site/screen-grid.png).
#
# Rules:
#   1. A line posts once, in the first tick at or after its time on its day, via x-post.sh. The day column is
#      YYYY-MM-DD (time 09:00) or YYYY-MM-DD@HH (HH is the local hour, 00-23), so one account can post a few times a day
#      (LAC-8017, Lacy 2026-11-13). The @HH suffix is part of the dedupe key.
#   2. A line more than STALE_DAYS old is recorded STALE and skipped, so a stall never dumps a backlog in one tick
#      (10 posts sat unsent 2026-10-31 to 11-03 because the sweep line was never enabled).
#   3. Every outcome is one row in ~/.paperclip/logs/post-queue.done (key = date|account|media|community).
#      A failure also goes to post-queue.err and files ONE Paperclip issue for the Marketing Lead. Nothing retries by itself.
#   4. One Slack DM to Lacy per run (digest), not one per post.
#   5. Once a day: if fewer than MIN_DAYS future days carry a post, file one Paperclip issue for the Marketing Lead
#      to refill (at most once per REFILL_EVERY_DAYS). The queue is the calendar; an empty calendar is the defect.
#
# Standing approval: Lacy 2026-10-29 (X posts for Juno from @junebug_ai and @lacybuilds, memory x-posting-standing-ok)
# and 2026-11-03 ("constant, scheduled, monitored posting" for Juno, Prescription Finder, CamFetti and Linger).
# Still per piece: anything naming a client, a price change, a third party's failure, email, DMs, money.
set -uo pipefail
export PATH=/opt/homebrew/bin:/usr/local/bin:$PATH
MV="$HOME/repo/marketing-videos"; T="$MV/tools"; CLIPS="$MV/public/takes/asks"
Q="$T/post-queue.tsv"; L="$HOME/.paperclip/logs"; DONE="$L/post-queue.done"; ERR="$L/post-queue.err"
TASK="$HOME/.paperclip/scripts/paperclip-task.sh"; SLACK="$HOME/.openclaw/scripts/slack-post.sh"; LACY=U3XC80UUQ
TODAY="${POST_QUEUE_TODAY:-$(date +%F)}"; HOUR="${POST_QUEUE_HOUR:-$(date +%H)}"; DRY="${POST_QUEUE_DRY_RUN:-}"
STALE_DAYS=1; MIN_DAYS=5; REFILL_EVERY_DAYS=3
[ -s "$Q" ] || exit 0
[ "$HOUR" -ge 9 ] || exit 0
HOUR10=$((10#$HOUR))
mkdir -p "$L"; touch "$DONE"

day_add(){ date -j -v"$2"d -f %F "$1" +%F 2>/dev/null || date -d "$1 $2 day" +%F; }
STALE_BEFORE="$(day_add "$TODAY" "-$STALE_DAYS")"
notify(){ [ -n "$DRY" ] && { echo "dry-run: slack: $1"; return; }; "$SLACK" -c "$LACY" -m "$1" >/dev/null 2>&1 || true; }
ticket(){ # ticket <title> <description>; dedupes on a recent open title server-side
  [ -n "$DRY" ] && { echo "dry-run: ticket: $1"; return; }
  "$TASK" create --company LAC --assign "Marketing Lead" --priority high --title "$1" --description "$2" >>"$L/post-queue.tickets.log" 2>&1 || true
}

digest=""; fails=0
while IFS=$'\t' read -r day acct media comm text; do
  [ -n "$day" ] && [ -n "$acct" ] && [ -n "$text" ] || continue
  fday="$day"; day="${fday%%@*}"; hh=9; case "$fday" in *@*) hh=$((10#${fday##*@}));; esac
  [[ "$day" < "$TODAY" || "$day" == "$TODAY" ]] || continue
  [[ "$day" == "$TODAY" && "$HOUR10" -lt "$hh" ]] && continue
  key="$fday|$acct|$media|$comm"
  grep -qF "	$key	" "$DONE" && continue
  if [[ "$day" < "$STALE_BEFORE" ]]; then
    [ -n "$DRY" ] && { echo "dry-run: stale, skip [$key]"; continue; }
    printf '%s\t%s\tSTALE\n' "$(date '+%F %T')" "$key" >> "$DONE"
    digest+=$'\n'"Skipped as stale (over $STALE_DAYS day old): [$key]"
    continue
  fi
  if [ -n "$DRY" ]; then echo "dry-run: would post [$key] $text"; continue; fi
  args=(-u "$acct" -t "$text")
  if [ "$media" != "-" ]; then
    case "$media" in /*) path="$media";; */*) path="$MV/$media";; *) path="$CLIPS/juno-$media.mp4";; esac
    args+=(-m "$path")
  fi
  [ "$comm" != "-" ] && args+=(-c "$comm")
  out="$("$T/x-post.sh" "${args[@]}" 2>&1)"; rc=$?
  url="$(printf '%s' "$out" | grep -o 'https://x.com/[^ ]*' | tail -1)"
  if [ $rc -eq 0 ] && [ -n "$url" ]; then
    printf '%s\t%s\t%s\n' "$(date '+%F %T')" "$key" "$url" >> "$DONE"
    digest+=$'\n'"@$acct: $url"
  else
    fails=$((fails+1))
    printf '%s\t%s\tFAIL rc=%s\n' "$(date '+%F %T')" "$key" "$rc" >> "$DONE"
    printf '%s [%s]\n%s\n' "$(date '+%F %T')" "$key" "$out" >> "$ERR"
    digest+=$'\n'"FAILED @$acct [$key] exit $rc. Nothing retries. See ~/.paperclip/logs/post-queue.err"
    ticket "X post failed: @$acct $day ($media)" "post-queue.sh could not post this line of ~/repo/marketing-videos/tools/post-queue.tsv and will not retry it.

key: $key
text: $text

xurl output:
$out

Fix the cause (auth, media, text length), then post it by hand with tools/x-post.sh, then add a row to ~/.paperclip/logs/post-queue.done so the queue agrees. Log the URL on this issue. Runbook: tools/post-queue.sh header."
  fi
done < "$Q"
[ -n "$digest" ] && { echo "$(date '+%F %T')$digest"; notify "Post queue $TODAY:$digest"; }

# Depth check, once a day after the posting pass.
stamp="$L/.post-queue-depth-day"
if [ -n "$DRY" ] || [ "$(cat "$stamp" 2>/dev/null)" != "$TODAY" ]; then
  [ -z "$DRY" ] && echo "$TODAY" > "$stamp"
  future="$(awk -F'\t' -v t="$TODAY" '{d=$1; sub(/@.*/,"",d)} d > t && $5 != "" {print d}' "$Q" | sort -u)"
  ndays="$(printf '%s\n' "$future" | grep -c . || true)"
  last="$(printf '%s\n' "$future" | tail -1)"
  echo "$(date '+%F %T') depth: $ndays future days queued, last $last"
  if [ "$ndays" -lt "$MIN_DAYS" ]; then
    rstamp="$L/.post-queue-refill-asked"; ask=1
    if [ -s "$rstamp" ] && [ -z "$DRY" ]; then
      [[ "$(cat "$rstamp")" > "$(day_add "$TODAY" "-$REFILL_EVERY_DAYS")" ]] && ask=0
    fi
    if [ "$ask" = 1 ]; then
      [ -z "$DRY" ] && echo "$TODAY" > "$rstamp"
      ticket "Post queue runs dry after ${last:-today}: refill post-queue.tsv (Juno, Prescription Finder, CamFetti, Linger)" "Only $ndays future day(s) carry a post in ~/repo/marketing-videos/tools/post-queue.tsv (minimum $MIN_DAYS). Add at least 7 more days: one @junebug_ai post per day (Juno) and one @lacybuilds post per day rotating Juno, Prescription Finder, CamFetti and Linger.

Rules are in the header of tools/post-queue.sh and the parent calendar issue. Voice: lowercase, plain, one idea per post for @junebug_ai; first person as Lacy for @lacybuilds. No em dashes. Run humanizer. Never the same clip twice in one place. Linger posts carry no link until LAC-6248 clears. Commit the tsv. Then close this issue with the date range you added."
      digest+=$'\n'"Queue is thin: $ndays future days. Filed a refill issue for the Marketing Lead."
      notify "Post queue is thin: $ndays future day(s) left after $TODAY. Refill issue filed for the Marketing Lead."
    fi
  fi
fi
exit 0
