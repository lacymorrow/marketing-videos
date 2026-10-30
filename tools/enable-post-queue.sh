#!/bin/bash
# enable-post-queue.sh: add post-queue.sh to the existing 10-minute sweep on zero (one line, idempotent).
# Lacy runs this once; the session's permission gate does not let an agent edit the sweep.
set -euo pipefail
S="$HOME/.paperclip/paperclip-sweep.sh"
grep -q 'post-queue.sh' "$S" && { echo "already enabled"; exit 0; }
python3 - "$S" <<'PY'
import sys
p=sys.argv[1]; s=open(p).read()
anchor='# Stranded-work report once a day'
line='run post-queue           /bin/bash "$HOME/repo/marketing-videos/tools/post-queue.sh" # approved @junebug_ai clips go out on their day (tools/post-queue.tsv, first tick at/after 09:00 local, once, Slack DM to Lacy). Not a tourniquet: it rides here because the rule is no new launchd jobs on zero. Lacy approved 2026-10-29. Delete this line when the queue file is empty and nothing more is planned.\n'
assert anchor in s, "anchor comment not found in sweep"
open(p,'w').write(s.replace(anchor, line+anchor, 1))
PY
bash -n "$S" && echo "enabled: $(grep -c 'post-queue.sh' "$S") line in $S"
