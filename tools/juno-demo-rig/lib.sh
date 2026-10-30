# Shared by rails.sh and the director's tools. State lives in files under $CACHE so separate processes agree.
export PATH="/usr/local/bin:/opt/homebrew/bin:$HOME/.local/bin:$PATH"   # ssh sessions on graphite start without Homebrew or claude on PATH
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"; CACHE=~/.cache/juno-demo-rig; RUN=$CACHE/run; mkdir -p $RUN $CACHE/audio $CACHE/shots
LOG=$CACHE/director.log; OUT=~/repo/marketing-videos/public/takes
KOKORO=$CACHE/kokoro; VOICE=${VOICE:-af_bella}
log(){ echo "$(date +%H:%M:%S) $*" | tee -a $LOG >&2; }
jlog(){ ls -t ~/Library/Logs/Juno/juno-*.log | head -1; }
ptw(){ cat $RUN/ptw 2>/dev/null || osascript -l JavaScript -e "ObjC.import('AppKit'); \$.NSScreen.mainScreen.frame.size.width" 2>/dev/null | cut -d. -f1 | tee $RUN/ptw; }
notify(){ bash "$DIR/tools/notify" "$@"; }
prompts(){ osascript -l JavaScript "$DIR/winlist.js" 2>/dev/null | awk -F' [|] ' '$1 ~ /UserNotificationCenter|SecurityAgent|universalAccessAuthWarn|CoreServicesUIAgent|SystemUIServer|loginwindow/ && $5=="L0" {print $1": "$2}' | sort -u; }
idle(){ ioreg -c IOHIDSystem | awk '/HIDIdleTime/ {print int($NF/1000000000); exit}'; }
mark(){ date +%s > $RUN/last; }
# juno-cua returns before long key sequences finish landing; wait until the input counter stops resetting, then stamp
settle(){ local i; for i in $(seq 1 60); do [ "$(idle)" -ge 1 ] && break; sleep 0.25; done; mark; }
juno_has_ax(){ local f=$(jlog); local n=$(grep -n "Starting Juno application" "$f" | tail -1 | cut -d: -f1); tail -n +${n:-1} "$f" | grep -q "Accessibility permissions not granted" && return 1; return 0; }
juno_busy(){ local l=$(grep -hE "Agent execution started|Agent execution finished|Agent run complete" "$(jlog)" | tail -1); case "$l" in *started*) return 0;; *) return 1;; esac; }
juno_since_finish(){ local l=$(grep -hE "Agent execution finished|Agent run complete" "$(jlog)" | tail -1 | cut -c1-19); [ -z "$l" ] && { echo 9999; return; }
  local t=$(date -j -u -f "%Y-%m-%dT%H:%M:%S" "$l" +%s 2>/dev/null); echo $(( $(date +%s) - ${t:-0} )); }
# Juno's own clicks, typing and speech reset the idle counter too; excuse them while she runs and for a minute after she finishes
guard(){ [ "$DRY" = 1 ] && return 0; [ -f $RUN/abort ] && exit 9; juno_busy && { mark; return 0; }; [ "$(juno_since_finish)" -lt 60 ] && { mark; return 0; }; local i=$(idle) last=$(cat $RUN/last 2>/dev/null || echo 0); local since=$(( $(date +%s) - last ))
  if [ "$i" -lt $(( since - 2 )) ]; then log "ABORT: a person is at the keyboard (idle ${i}s, last mark ${since}s ago; last input from: $(pmset -g assertions 2>/dev/null | grep -oE 'process:[^ ]+' | head -1))"; touch $RUN/abort; exit 9; fi; }
newlog(){ local n0=$(cat $RUN/n0 2>/dev/null || echo 0); tail -n +$((n0+1)) "$(jlog)" | grep -v "Debug mode\|heartbeat\|Registered tool\|Registered basic\|StreamingCommit" | cut -c12-200; }
trayxy(){ osascript -e 'tell application "System Events" to tell process "juno" to get {position, size} of menu bar item 1 of menu bar 2' 2>/dev/null | tr -d ' ' | awk -F, '{printf "%d %d", $1+$3/2, $2+$4/2}'; }
barwin(){ osascript -l JavaScript "$DIR/winlist.js" | awk -F' [|] ' '$1=="Juno" && $2=="Tauri App" {print $3; exit}'; }
frame(){ local r=$(osascript -e 'tell application "System Events" to tell process "juno" to get {position, size} of window 1' 2>&1)
  case "$r" in *error*) log "AX could not see Juno's window ($r); using the window server"  # Juno's AX tree is sometimes empty while its windows are up
    r=$(osascript -l JavaScript "$DIR/winlist.js" 2>/dev/null | awk -F' [|] ' '$1=="Juno" && ($5=="L0"||$5=="L3") && $4 !~ / 600x700$/ {print $4; exit}' | sed -E 's/[, x]+/ /g' | awk 'NF==4 {printf "%d, %d, %d, %d", $1,$2,$3,$4}')
    [ -z "$r" ] && r="error: no Juno window";; esac; echo "$r"; }
btn(){ bash "$DIR/axfind.sh" AXButton "$1" | grep -v "Open in window" | head -1; }
centre(){ echo "$1" | awk '{printf "%d %d", $1+$3/2, $2+$4/2}'; }
click(){ local c=$(centre "$1"); guard; cliclick m:${c% *},${c#* } w:250 c:${c% *},${c#* }; mark; }
XY=""; tray(){ [ -z "$XY" ] && XY=$(trayxy); [ -z "$XY" ] && { log "tray: Juno's menu bar item is not reachable through Accessibility; skipping"; return 1; }; guard; cliclick c:${XY% *},${XY#* }; mark; }
# the pill sits at the bottom centre of Juno's transparent 452x574 window; the pane opens upward inside the same window
# the microphone button sits 350 px right of the Juno window's left edge, on the pill row
micxy(){ local w=$(osascript -l JavaScript "$DIR/winlist.js" 2>/dev/null | awk -F' [|] ' '$1=="Juno" && $4 ~ / 452x574$/ {print $4; exit}' | sed -E 's/[, x]+/ /g')
  [ -z "$w" ] && return 1; set -- $w; echo "$(( $1 + 350 )) $(( $2 + $4 - 44 ))"; }
micclick(){ local p=$(micxy) || { log "micclick: no Juno window"; return 1; }; guard; cliclick m:${p% *},${p#* } w:200 c:${p% *},${p#* }; mark; }
pillclick(){ local w=$(osascript -l JavaScript "$DIR/winlist.js" 2>/dev/null | awk -F' [|] ' '$1=="Juno" && $4 ~ / 452x574$/ {print $4; exit}' | sed -E 's/[, x]+/ /g')
  [ -z "$w" ] && { log "pillclick: no Juno window"; return 1; }; set -- $w; guard; cliclick m:$(( $1 + $3/2 )),$(( $2 + $4 - 44 )) w:200 c:$(( $1 + $3/2 )),$(( $2 + $4 - 44 )); mark; }
traymenu(){ [ -z "$XY" ] && XY=$(trayxy); [ -z "$XY" ] && { log "traymenu $1: Juno's menu bar item is not reachable through Accessibility; skipping"; return 1; }; guard; cliclick rc:${XY% *},${XY#* }; mark; sleep 1; osascript -e "tell application \"System Events\" to tell process \"juno\" to click menu item \"$1\" of menu 1 of menu bar item 1 of menu bar 2" >/dev/null 2>&1; mark; }
pane_open(){ grep -h "bar_pane" "$(jlog)" | tail -1 | grep -q registered; }
allow_tcc(){ osascript -e 'tell application "System Events" to tell process "UserNotificationCenter" to click button "Allow" of window 1' >/dev/null 2>&1 && log "pressed Allow on a file-access prompt"; }
activate(){ osascript -e 'tell application "Juno" to activate'; mark; sleep 0.4; }
last_answer(){ python3 - <<'PY'
import json,glob,os,re
fs=sorted(glob.glob(os.path.expanduser('~/Library/Application Support/com.juno.desktop/conversation-*.json')),key=os.path.getmtime)
if not fs: print("(no conversation yet)"); raise SystemExit
m=json.load(open(fs[-1]))['conversation']['messages']
a=[x for x in m if x.get('role')=='Assistant']
if not a: print("(no answer yet)"); raise SystemExit
t=a[-1]['content']; btns=re.findall(r'label="([^"]+)"',t); t=re.sub(r'<[^>]+>','',t).strip()
print(t[:1500]); print("BUTTONS:", ", ".join(btns) if btns else "(none)")
PY
}
speak_file(){ local h=$(printf %s "$VOICE|$1" | md5 -q); local f=$CACHE/audio/$h.wav
  [ -f "$f" ] || "$KOKORO/.venv/bin/python" -I "$DIR/kokoro/render.py" "$KOKORO/models" "$VOICE" "$f" "$1" >/dev/null 2>&1; echo "$f"; }

# --- no-accessibility fallback: pill geometry relative to Juno's window (pill centre sits ~420px below the window top) ---
winxy(){ osascript -l JavaScript "$DIR/winlist.js" | awk -F' [|] ' '$1=="Juno" && $2=="Tauri App" {split($4,a,/[ ,x]/); print a[1], a[2]; exit}'; }
pill(){ local w=$(winxy); [ -z "$w" ] && return 1; local x=${w% *} y=${w#* }; case $1 in
  text) echo "$((x+110)) $((y+420))";; mic) echo "$((x+350)) $((y+420))";; send) echo "$((x+378)) $((y+420))";; esac; }
clickxy(){ guard; cliclick m:${1% *},${1#* } w:200 c:${1% *},${1#* }; mark; }
turn_started(){ newlog | grep -qiE "agent-query-ready|TurnTiming|Agent run|llm_request|Processing (user|query)|user message|Queueing TTS"; }
button_query(){ python3 - "$1" <<'PY'
import json,glob,os,re,sys
lab=sys.argv[1].lower()
fs=sorted(glob.glob(os.path.expanduser('~/Library/Application Support/com.juno.desktop/conversation-*.json')),key=os.path.getmtime)
m=json.load(open(fs[-1]))['conversation']['messages'] if fs else []
for x in reversed(m):
    if x.get('role')!='Assistant': continue
    for q,l in re.findall(r'<QueryButton[^>]*query="([^"]+)"[^>]*label="([^"]+)"',x['content'])+[(q,l) for l,q in re.findall(r'<QueryButton[^>]*label="([^"]+)"[^>]*query="([^"]+)"',x['content'])]:
        if l.lower()==lab or lab in l.lower(): print(q); raise SystemExit
    break
PY
}
