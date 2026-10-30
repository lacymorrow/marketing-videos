#!/bin/bash
# Start the rails in a Terminal.app window on this Mac's own screen (Terminal holds the Screen Recording, Accessibility and
# Desktop grants and the unlocked keychain). Ghostty did the job until 2026-10-15, when it stopped opening windows.
# Usage: bash start.sh [scene]      Stop: bash stop.sh      Log: ~/.cache/juno-demo-rig/director.log
cd "$(dirname "$0")"; mkdir -p ~/.cache/juno-demo-rig
pgrep -f "^bash rails.sh" >/dev/null && { echo "rails already running"; exit 1; }
mkdir ~/.cache/juno-demo-rig/start.lock 2>/dev/null || { echo "another start is in progress"; exit 1; }; trap "rmdir ~/.cache/juno-demo-rig/start.lock 2>/dev/null" EXIT
locked(){ osascript -l JavaScript "$(dirname "${BASH_SOURCE[0]}")/winlist.js" 2>/dev/null | awk -F' [|] ' '$1=="loginwindow" && $5 ~ /^L20[0-9][0-9]$/ {f=1} END {exit !f}'; }   # the lock screen is loginwindow's full-screen window at layer 2000+
locked && { echo "the screen is locked; unlock it (and set Lock Screen > Require password to Never), then start again."; exit 1; }
CMD="cd $PWD && MAXD=${MAXD:-2} GATE=${GATE:-60} MODEL=${MODEL:-sonnet} bash rails.sh $* 2>&1 | tee -a ~/.cache/juno-demo-rig/rails.out"
osascript -e "with timeout of 120 seconds
tell application \"Terminal\"
  do script \"$CMD\"
end tell
end timeout" >/dev/null 2>&1 || { echo "Terminal refused: answer the Automation prompt on the Mac (let sshd control Terminal), then start again."; exit 1; }
sleep 6; pgrep -f "^bash rails.sh" >/dev/null && echo "rails started in Terminal (log: ~/.cache/juno-demo-rig/director.log)" || { echo "rails did not start"; tail -3 ~/.cache/juno-demo-rig/rails.out 2>/dev/null; exit 1; }
