#!/bin/bash
# LAC-8637 regression: the banned-juno branch of tools/post-queue.sh.
# Asserts: (1) banned key lands in $DONE, (2) skip-only digest sends no DM, (3) a FAILED line still DMs,
# (4) a second run over the same row is a no-op. Runs against a throwaway HOME with stubbed slack/x-post/task.
# Usage: tests/post-queue-ban.test.sh [script]   (default: tools/post-queue.sh next to this tests/ dir)
set -u
SRC="${1:-$(cd "$(dirname "$0")/.." && pwd)/tools/post-queue.sh}"
pass=0; failn=0
ok(){ echo "ok   $1"; pass=$((pass+1)); }
bad(){ echo "FAIL $1"; failn=$((failn+1)); }

setup(){ # setup <tsv-body>; sets H, DONE, DM
  H="$(mktemp -d)"; mkdir -p "$H/repo/marketing-videos/tools" "$H/.paperclip/logs" "$H/.paperclip/scripts" "$H/.openclaw/scripts"
  cp "$SRC" "$H/repo/marketing-videos/tools/post-queue.sh"
  printf '%b' "$1" > "$H/repo/marketing-videos/tools/post-queue.tsv"
  DM="$H/dm.log"; DONE="$H/.paperclip/logs/post-queue.done"
  printf '#!/bin/bash\necho "$@" >> "%s"\n' "$DM" > "$H/.openclaw/scripts/slack-post.sh"
  printf '#!/bin/bash\nexit 0\n' > "$H/.paperclip/scripts/paperclip-task.sh"
  printf '#!/bin/bash\nexit 1\n' > "$H/repo/marketing-videos/tools/x-post.sh"
  chmod +x "$H/.openclaw/scripts/slack-post.sh" "$H/.paperclip/scripts/paperclip-task.sh" "$H/repo/marketing-videos/tools/x-post.sh"
  echo 2026-11-19 > "$H/.paperclip/logs/.post-queue-depth-day"
}
run(){ HOME="$H" POST_QUEUE_TODAY=2026-11-19 POST_QUEUE_HOUR=12 bash "$H/repo/marketing-videos/tools/post-queue.sh" >"$H/out.log" 2>&1; }
BAN='2026-11-19@10\tjunebug_ai\tout/juno-ads/juno-ad-x-9x16.mp4\t-\tbanned post\n'
KEY='2026-11-19@10|junebug_ai|out/juno-ads/juno-ad-x-9x16.mp4|-'

setup "$BAN"; run
grep -qF "	$KEY	BANNED" "$DONE" && ok "ban key recorded in DONE" || bad "ban key recorded in DONE"
[ ! -s "$DM" ] && ok "skip-only digest sends no DM" || bad "skip-only digest sends no DM: $(cat "$DM")"
grep -q 'Skipped, weak Juno demo is banned' "$H/out.log" && ok "skip line kept in log digest" || bad "skip line kept in log digest"
n1=$(wc -l < "$DONE"); run; n2=$(wc -l < "$DONE")
[ "$n1" = "$n2" ] && [ ! -s "$DM" ] && ! grep -q Skipped "$H/out.log" && ok "second run is a no-op" || bad "second run is a no-op ($n1 -> $n2 rows)"
[ "$(( $(wc -l < "$DONE") ))" = 1 ] && ok "exactly one DONE row" || bad "exactly one DONE row"

setup "${BAN}2026-11-19@11\tjunebug_ai\t-\t-\tplain post\n"; run
grep -q 'FAILED @junebug_ai' "$DM" 2>/dev/null && ok "FAILED line still DMs" || bad "FAILED line still DMs"
grep -q 'Skipped, weak Juno demo' "$DM" 2>/dev/null && ok "skip line rides along in the DM" || bad "skip line rides along in the DM"

# A posted URL must still DM (the other half of the gate: without it a mutant that drops the URL arm passes).
setup '2026-11-19@11\tjunebug_ai\t-\t-\tplain post\n'
printf '#!/bin/bash\necho https://x.com/junebug_ai/status/1\nexit 0\n' > "$H/repo/marketing-videos/tools/x-post.sh"; run
grep -q 'https://x.com/junebug_ai/status/1' "$DM" 2>/dev/null && ok "posted URL still DMs" || bad "posted URL still DMs"

# LAC-8641: the thin-queue line must reach the log, not only the DM. Depth stamp removed so the depth check runs.
setup '2026-11-18@10\tjunebug_ai\t-\t-\told post\n'; rm -f "$H/.paperclip/logs/.post-queue-depth-day"; run
grep -q 'Queue is thin' "$H/out.log" && ok "thin-queue line is logged" || bad "thin-queue line is logged"
grep -q 'Post queue is thin' "$DM" 2>/dev/null && ok "thin-queue still DMs" || bad "thin-queue still DMs"

echo "$pass passed, $failn failed"; [ "$failn" = 0 ]
