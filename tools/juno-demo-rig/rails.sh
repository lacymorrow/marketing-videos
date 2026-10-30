#!/bin/bash
# Deterministic rails around a non-deterministic performance: gates, clean desktop, record, run the director persona, check, restore.
# Usage: GATE=60 MODEL=sonnet bash rails.sh [scene]     (scenes in scenes.txt; progress in ~/.cache/juno-demo-rig/progress)
cd "$(dirname "$0")"; . ./lib.sh; set -m 2>/dev/null
GATE=${GATE:-60}; MODEL=${MODEL:-sonnet}; PROG=$CACHE/progress; ATT=$CACHE/attempts; touch $PROG $ATT
ALLOWED=" Finder Juno juno Window Server Dock Control Center Notification Center Spotlight Calculator Spotify Music "
SETTINGS="$HOME/Library/Application Support/com.juno.desktop/app_settings.json"
juno_quiet(){ local l=$(grep -hE "agent-query-ready|Agent run complete|Queueing TTS|TurnTiming" "$(jlog)" | tail -1 | cut -c1-19); [ -z "$l" ] && { echo 9999; return; }
  local t=$(date -j -u -f "%Y-%m-%dT%H:%M:%S" "$l" +%s 2>/dev/null); echo $(( $(date +%s) - ${t:-0} )); }
juno_up(){ pgrep -q -f "Juno.app/Contents/MacOS/juno" || { log "Juno not running; launching"; open -a Juno; sleep 12; }; }
mic_now(){ python3 -c "import json,sys;print(json.load(open(sys.argv[1])).get('audio',{}).get('input_device') or 'default')" "$SETTINGS"; }
set_mic(){ local want=$1; [ "$(mic_now)" = "$want" ] && return 0
  log "switching Juno's microphone to $want (restart)"; osascript -e 'quit app "Juno"' >/dev/null 2>&1; sleep 3; pkill -f "Juno.app/Contents/MacOS/juno" 2>/dev/null; sleep 1
  python3 - "$SETTINGS" "$want" <<'PY'
import json,sys; p,w=sys.argv[1:3]; d=json.load(open(p)); d.setdefault('audio',{})['input_device']=None if w=='default' else w; json.dump(d,open(p,'w'),indent=2)
PY
  open -a Juno; sleep 12; }
displays(){ osascript -l JavaScript -e "ObjC.import('AppKit'); \$.NSScreen.screens.count" 2>/dev/null; }
apps(){ osascript -e 'tell application "System Events" to get name of every process whose background only is false' | tr ',' '\n' | sed 's/^ *//'; }
hide_others(){ osascript -e 'tell application "System Events" to tell process "juno" to click (first button of window "Juno Settings" whose subrole is "AXCloseButton")' >/dev/null 2>&1
  osascript -e 'tell application "System Events" to get name of every process whose visible is true and background only is false' | tr ',' '\n' | sed 's/^ *//' | grep -v -x "juno\|Finder" > $RUN/hidden
  activate; sleep 0.6   # no Cmd+Opt+H keystroke: a half-delivered chord once left Cmd+Opt held, and the director's Escape became Force Quit
  while read -r p; do [ -n "$p" ] && osascript -e "tell application \"System Events\" to set visible of process \"$p\" to false" >/dev/null 2>&1; done < $RUN/hidden
  osascript -e 'tell application "Finder" to close every window' >/dev/null 2>&1
  pgrep -xq "System Information" && { osascript -e 'quit app "System Information"' >/dev/null 2>&1; log "closed About This Mac"; }; }
unhide(){ pkill -INT -f "avfoundation" 2>/dev/null; while read -r p; do [ -n "$p" ] && osascript -e "tell application \"System Events\" to set visible of process \"$p\" to true" >/dev/null 2>&1; done < $RUN/hidden 2>/dev/null; : > $RUN/hidden; }
cleanup_apps(){ for a in Spotify Music; do pgrep -xq "$a" && osascript -e "tell application \"$a\" to pause" >/dev/null 2>&1; done
  for a in Calculator Spotify Music; do grep -qx "$a" $RUN/pre_apps 2>/dev/null && continue; pgrep -xq "$a" && { osascript -e "tell application \"$a\" to quit" >/dev/null 2>&1; log "quit $a (demo launched it)"; }; done; return 0; }
# a system banner (top right, owner NotificationCenter) stays in frame for the whole take; hover it and press its close button
dismiss_banners(){ local W=$(ptw) b; for try in 1 2; do
    b=$(osascript -l JavaScript "$DIR/winlist.js" 2>/dev/null | awk -F' [|] ' -v w="$W" '$1 ~ /Notification ?Center/ {split($4,a,/[ ,x]/); if (a[1] > w-500 && a[2] < 200 && a[3] >= 300) {print a[1], a[2], a[3], a[4]; exit}}')
    [ -z "$b" ] && return 0; set -- $b; log "banner on screen at $1,$2 ${3}x$4; closing it"
    cliclick m:$(( $1 + $3/2 )),$(( $2 + $4/2 )) w:1200 c:$(( $1 + 10 )),$(( $2 + 7 )); mark; sleep 1.5; done; }
screen_check(){ local bad=""; osascript -l JavaScript "$DIR/winlist.js" | awk -F' [|] ' '$5=="L0" {print $1}' | sort -u | while read -r o; do case "$ALLOWED" in *" $o "*) ;; *) echo "$o";; esac; done > $RUN/stray
  [ -s $RUN/stray ] && bad="unexpected window on screen: $(tr '\n' ' ' < $RUN/stray)"
  local FW=$(osascript -e 'tell application "Finder" to get POSIX path of (target of every Finder window as alias list)' 2>/dev/null | tr ',' '\n' | sed 's/^ *//' | grep .)
  [ -n "$FW" ] && log "finder windows: $(echo "$FW" | tr '\n' ' ')"
  local f; for f in $FW; do case "$f" in /Users/lacy/Desktop/@/) ;; *) bad="Finder shows $f";; esac; done
  echo "$bad"; }
run_scene(){ local NAME=$1 BRIEF=$2; local ST="$OUT/states-$NAME"; mkdir -p "$ST"; rm -f $RUN/abort $RUN/ended; mark; local L0=$(wc -l < $LOG); wc -l < "$(jlog)" > $RUN/n0   # the wait tool reads Juno's log from here, so earlier scenes never bleed in
  local TAKE="$OUT/juno-$NAME-$(date +%Y%m%d-%H%M).mov"; apps > $RUN/pre_apps
  osascript -e 'tell application "System Events" to tell process "BluetoothUIServer" to click button "Cancel" of window 1' >/dev/null 2>&1; allow_tcc
  # Finder in column view shows the parent folder's real names next to the staged folder; list view shows only the folder
  if [ "$(defaults read com.apple.finder FXPreferredViewStyle 2>/dev/null)" != Nlsv ]; then defaults write com.apple.finder FXPreferredViewStyle -string Nlsv; killall Finder 2>/dev/null; sleep 3; log "Finder default view set to list"; fi
  dismiss_banners
  ( XY=$(trayxy); hide_others; traymenu "New Chat"; sleep 1.2
    pane_open || { pillclick; sleep 2; }; cliclick m:$(( $(ptw)/2 )),400; mark; traymenu "Center Floating Bar"; sleep 1.5; pane_open || { pillclick; sleep 1.5; }
    osascript -e 'tell application "Finder" to close every window' >/dev/null 2>&1; cliclick m:1380,860; mark; sleep 1 )
  [ -f $RUN/abort ] && { log "ABORTED during setup by human presence"; return 9; }
  if [ "$(defaults read com.apple.finder CreateDesktop 2>/dev/null)" != 0 ] && [ "$(ls ~/Desktop 2>/dev/null | wc -l | tr -d ' ')" -gt 8 ]; then
    log "REFUSED: desktop icons are showing on a real Desktop ($(ls ~/Desktop | wc -l | tr -d ' ') items); run: defaults write com.apple.finder CreateDesktop -bool false; killall Finder"; notify "I will not record on $(hostname -s) while its real Desktop icons are showing. Hide them: defaults write com.apple.finder CreateDesktop -bool false; killall Finder"; return 1; fi
  local pre=$(screen_check); [ -n "$pre" ] && { log "desktop not clean before recording: $pre"; return 1; }
  log "recording $TAKE"; ffmpeg -hide_banner -loglevel error -f avfoundation -framerate 30 -pixel_format nv12 -capture_cursor 1 -i "Capture screen 0:none" -t 300 -c:v h264_videotoolbox -b:v 14M -pix_fmt yuv420p -y "$TAKE" </dev/null >/dev/null 2>&1 & local REC=$!; mark; sleep 2
  local kind=TYPED; [ "$SPEAK" = 1 ] && kind=SPOKEN
  local prompt="$(sed "s#TOOLS/#$DIR/tools/#g" $DIR/persona.md)

This is a $kind scene. $BRIEF"
  # job control off for this launch: as a separate process group inside Terminal the director gets SIGTTOU on its first tty ioctl and sits stopped forever
  set +m; ( cd $CACHE/shots && env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude -p "$prompt" --model $MODEL --max-turns 40 \
      --allowedTools "Bash($DIR/tools/cua:*)" "Bash($DIR/tools/say:*)" "Bash($DIR/tools/wait:*)" "Bash($DIR/tools/end:*)" "Read" \
      --disallowedTools "Edit" "Write" "WebFetch" "WebSearch" "Agent" < /dev/null > $RUN/director.out 2>&1 ) & local CL=$!; set -m 2>/dev/null
  local t0=$(date +%s); while kill -0 $CL 2>/dev/null; do [ -f $RUN/abort ] && { kill $CL 2>/dev/null; break; }; [ $(( $(date +%s) - t0 )) -gt 420 ] && { log "director ran past 7 minutes; stopping it"; pkill -9 -P $CL 2>/dev/null; kill -9 $CL 2>/dev/null; break; }; sleep 2; done; wait $CL 2>/dev/null
  log "director: $(tail -c 400 $RUN/director.out | tr '\n' ' ')"
  local bad=$(screen_check); sleep 1.5
  local id=$(barwin); [ -n "$id" ] && screencapture -l "$id" -o -x "$ST/end-pane.png" 2>/dev/null; screencapture -x -D 1 "$ST/end-screen.png" 2>/dev/null
  kill -INT $REC 2>/dev/null; for i in $(seq 1 30); do kill -0 $REC 2>/dev/null || break; sleep 0.5; done; wait $REC 2>/dev/null
  [ -s "$TAKE" ] || { log "REJECTED: recorder wrote no file"; notify "the screen recorder wrote nothing. Screen Recording is probably not granted for Terminal (System Settings > Privacy & Security > Screen & System Audio Recording)."; cleanup_apps; return 1; }
  cleanup_apps
  if [ -f $RUN/abort ]; then log "ABORTED by human presence; take trashed"; trash "$TAKE" 2>/dev/null; return 9; fi
  if [ -n "$bad" ]; then log "REJECTED: $bad; take trashed"; trash "$TAKE" 2>/dev/null; trash "$ST/end-screen.png" 2>/dev/null; return 1; fi
  [ -f $RUN/ended ] || { log "REJECTED: director never ended the scene; take trashed"; trash "$TAKE" 2>/dev/null; return 1; }
  tail -n +$((L0+1)) $LOG | grep -qE "said:|cua: type-text" || { log "REJECTED: nothing was ever sent to Juno; take trashed"; trash "$TAKE" 2>/dev/null; return 1; }
  grep -qiE "fail|could not|wrong|never|aborted" $RUN/ended && { log "REJECTED by the director's own note; take trashed"; trash "$TAKE" 2>/dev/null; return 1; }
  log "KEEP $NAME: $TAKE ($(ffprobe -v quiet -show_entries format=duration -of default=nw=1:nk=1 "$TAKE" 2>/dev/null)s) — $(cat $RUN/ended)"; echo "$NAME $TAKE" >> $CACHE/keepers; return 0; }

locked(){ osascript -l JavaScript "$(dirname "${BASH_SOURCE[0]}")/winlist.js" 2>/dev/null | awk -F' [|] ' '$1=="loginwindow" && $5 ~ /^L20[0-9][0-9]$/ {f=1} END {exit !f}'; }   # the lock screen is loginwindow's full-screen window at layer 2000+
selftest(){ local miss=""
  locked && { log "screen locked; waiting"; [ -f $RUN/lock-notified ] || { touch $RUN/lock-notified; notify "the screen on $(hostname -s) is locked, so I cannot record. Unlock it and set System Settings > Lock Screen > Require password to Never."; }; return 1; }
  screencapture -x -D 1 $RUN/selftest.png 2>/dev/null && [ -s $RUN/selftest.png ] || miss="$miss Screen Recording (for the app the rig runs from, normally Terminal);"
  osascript -e 'with timeout of 15 seconds
 tell application "System Events" to tell process "Dock" to get name of UI element 1
 end timeout' 2>&1 | grep -qi "assistive access" && miss="$miss Accessibility (for the app the rig runs from, normally Terminal);"
  osascript -e 'tell application "System Events" to get name of first process' >/dev/null 2>&1 || miss="$miss Automation: System Events (for the app the rig runs from, normally Terminal);"
  osascript -e 'tell application "Finder" to get name' >/dev/null 2>&1 || miss="$miss Automation: Finder (for the app the rig runs from, normally Terminal);"
  ls "$HOME/Desktop/@" >/dev/null 2>&1 || miss="$miss Desktop folder access (for the app the rig runs from, normally Terminal);"
  [ -n "$miss" ] && { log "self-test: missing$miss"; [ -f $RUN/selftest-notified ] && return 1; touch $RUN/selftest-notified; notify "before I can record on $(hostname -s) I need these granted in System Settings > Privacy & Security:$miss Screen-share in (vnc://100.86.145.8) and grant them to Terminal in System Settings > Privacy & Security."; return 1; }
  log "self-test: all permissions present"; return 0; }
ONLY=${1:-}
log "director rails; gate ${GATE}s; model $MODEL; done: $(tr '\n' ' ' < $PROG)"
rm -f $RUN/selftest-notified; until selftest; do sleep 60; done; rm -f $RUN/selftest-notified
while :; do
  bh=$(system_profiler SPAudioDataType 2>/dev/null | grep -c BlackHole); blocked=""
  next=""; while IFS='|' read -r n b; do [ -n "$ONLY" ] && [ "$n" != "$ONLY" ] && continue; grep -qx "$n" $PROG && continue
    case "$n" in voice-*) [ "$bh" -eq 0 ] && { blocked=1; continue; };; esac; next=$n; brief=$b; break; done < $DIR/scenes.txt
  [ -z "$next" ] && [ -n "$blocked" ] && { set_mic default; log "typed scenes done; spoken scenes wait for BlackHole"; sleep 120; continue; }
  [ -z "$next" ] && { set_mic default; log "all scenes done; keepers:"; cat $CACHE/keepers 2>/dev/null | tee -a $LOG; exit 0; }
  att=$(grep -cx "$next" $ATT); [ "${att:-0}" -ge 4 ] && { log "giving up on $next after 4 attempts"; echo "$next" >> $PROG; continue; }
  if locked; then log "screen locked; waiting"; [ -f $RUN/lock-notified ] || { touch $RUN/lock-notified; notify "the screen on $(hostname -s) is locked, so I cannot record. Unlock it and set System Settings > Lock Screen > Require password to Never."; }; sleep 60; continue; fi; rm -f $RUN/lock-notified
  while [ "$(displays)" -gt "${MAXD:-1}" ]; do log "waiting: extra display connected ($(displays) > ${MAXD:-1})"; sleep 30; done
  while [ "$(idle)" -lt "$GATE" ] || [ "$(juno_quiet)" -lt $((GATE+30)) ]; do sleep 5; done
  P=$(prompts); [ -n "$P" ] && { notify "a system prompt is waiting on screen ($(echo "$P" | tr '\n' ';')). Please screen-share in and answer it."; sleep 30; continue; }
  juno_up; if ! juno_has_ax; then log "Juno has no Accessibility; waiting"; [ -f $RUN/junoax-notified ] || { touch $RUN/junoax-notified; notify "Juno on $(hostname -s) lost Accessibility after its update, so it cannot drive the Mac. In System Settings > Privacy & Security > Accessibility switch Juno off and on (or remove and re-add it), then tell me and I will relaunch it."; }; sleep 120; continue; fi; rm -f $RUN/junoax-notified
  case "$(frame)" in *error*) nf=$(( $(cat $RUN/noframe 2>/dev/null || echo 0) + 1 )); echo $nf > $RUN/noframe; log "cannot see Juno's window; waiting"
      [ $nf -ge 3 ] && notify "I cannot see Juno's window through Accessibility. Check System Settings > Privacy & Security > Accessibility for Juno and Terminal, then quit and relaunch Juno."; sleep 20; continue;; *-*) log "bar off the main display; moving it to the main display"; mark; W=$(ptw); osascript -e "tell application \"System Events\" to tell process \"juno\" to set position of window 1 to {$(( (W-452)/2 )), 120}" >/dev/null 2>&1; cliclick m:$((W/2)),400; sleep 3; continue;; esac; : > $RUN/noframe
  case "$next" in voice-*) set_mic "BlackHole 2ch"; export SPEAK=1;; *) set_mic default; unset SPEAK;; esac
  [ -f $CACHE/announced-$(date +%F) ] || { touch $CACHE/announced-$(date +%F); notify "recording started on $(hostname -s): first scene is $next. I will only ping again if something needs you."; }
  echo "$next" >> $ATT; log "scene $next, attempt $((att+1)) (idle $(idle)s)"
  run_scene "$next" "$brief"; rc=$?
  unhide
  if [ $rc -eq 0 ]; then echo "$next" >> $PROG; else log "scene $next did not pass (rc $rc); windows restored; retry after the next idle stretch"; sleep 20; fi
done
