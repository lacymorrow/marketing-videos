#!/usr/bin/env bash
# Juno docs clip rig. Runs on graphite. Every scene is deterministic: the same
# steps, the same settings profile, and an event log on the recorder's clock,
# so the Remotion overlays are drawn from data (docs-clips/EVENTS.md).
#
#   source lib.sh; begin <slug> "<title>" <chapter>; ...steps...; end_clip
set -euo pipefail
export PATH=/usr/local/bin:/opt/homebrew/bin:$PATH
RIG=${RIG:-$HOME/.cache/juno-docs-rig}
BIN=$RIG/bin
JUNO_SUPPORT="$HOME/Library/Application Support/com.juno.desktop"
OUT=${OUT:-$RIG/clips}

now() { perl -MTime::HiRes=time -e 'printf "%.4f", time'; }
cua() { juno-cua --format json "$@" 2>/dev/null | sed -n '/^{/,$p'; }

# --- event log -------------------------------------------------------------
ev() { # ev <type> <json-fields-without-braces>
  printf '{"t":%s,"type":"%s"%s}\n' "$(now)" "$1" "${2:+,$2}" >> "$CLIP/events.jsonl"
}

# --- stage -----------------------------------------------------------------
# One known profile for every clip: Lacy's settings minus chat history, bar
# centred. The original folder is restored by `restore_juno` (and the
# baseline snapshot in $RIG/baseline is never touched).
reset_juno() {
  osascript -e 'quit app "Juno"' >/dev/null 2>&1 || true
  for _ in $(seq 1 20); do pgrep -qf 'Juno.app/Contents/MacOS' || break; sleep 0.5; done
  if [ ! -d "$RIG/live-backup" ]; then cp -Rp "$JUNO_SUPPORT" "$RIG/live-backup"; fi
  rm -rf "$JUNO_SUPPORT"; cp -Rp "$RIG/profile" "$JUNO_SUPPORT"
  open -a /Applications/Juno.app
  for _ in $(seq 1 40); do pgrep -qf 'Juno.app/Contents/MacOS' && break; sleep 0.5; done
  sleep 6
}
restore_juno() {
  [ -d "$RIG/live-backup" ] || return 0
  osascript -e 'quit app "Juno"' >/dev/null 2>&1 || true; sleep 3
  rm -rf "$JUNO_SUPPORT"; mv "$RIG/live-backup" "$JUNO_SUPPORT"
  open -a /Applications/Juno.app
}

# --- recording -------------------------------------------------------------
begin() { # begin <slug> <title> [chapter]
  SLUG=$1; TITLE=$2; CHAPTER=${3:-0}
  CLIP=$OUT/$SLUG; rm -rf "$CLIP"; mkdir -p "$CLIP"; : > "$CLIP/events.jsonl"
  if [ -n "${DRY:-}" ]; then now > "$CLIP/raw.mov.t0"; REC_PID=; return 0; fi  # DRY=1: steps only, no recording
  "$BIN/rec" "$CLIP/raw.mov" > "$CLIP/rec.log" 2>&1 &
  REC_PID=$!
  for _ in $(seq 1 40); do [ -s "$CLIP/raw.mov.t0" ] && break; sleep 0.25; done
  [ -s "$CLIP/raw.mov.t0" ] || { echo "recorder did not start: $(cat "$CLIP/rec.log")" >&2; exit 1; }
  sleep 0.8   # a still lead-in frame for the poster and the fade
}
end_clip() {
  sleep 0.8
  if [ -n "${DRY:-}" ]; then echo "dry run: $CLIP/events.jsonl"; return 0; fi
  kill -INT "$REC_PID"; wait "$REC_PID" || true
  python3 "$RIG/finalize.py" "$CLIP" "$SLUG" "$TITLE" "$CHAPTER"
  echo "clip: $CLIP"
}

# --- actions (each one logs what a viewer should see) ----------------------
hold_keys() { # hold_keys <ms> <key>... (fn, ctrl, ropt, opt, cmd, shift)
  local ms=$1; shift
  for k in "$@"; do ev keydown "\"key\":\"$k\""; done
  "$BIN/modkey" hold "$ms" "$@"
  for k in "$@"; do ev keyup "\"key\":\"$k\""; done
}
keys_down() { for k in "$@"; do ev keydown "\"key\":\"$k\""; done; "$BIN/modkey" down "$@"; }
keys_up()   { "$BIN/modkey" up "$@"; for k in "$@"; do ev keyup "\"key\":\"$k\""; done; }
say_line() { # say_line "<text>": spoken into BlackHole, which Juno listens on
  local text=$1 t0 t1
  t0=$(now); say -a "BlackHole 2ch" "$text"; t1=$(now)
  printf '{"t":%s,"type":"speech","text":"%s","duration":%.2f}\n' "$t0" "$text" "$(echo "$t1 - $t0" | bc)" >> "$CLIP/events.jsonl"
}
press() { # press <key> [modifier]  e.g. press comma cmd
  local key=$1 mod=${2:-}
  [ -n "$mod" ] && ev keydown "\"key\":\"$mod\""
  ev keydown "\"key\":\"$key\""
  if [ -n "$mod" ]; then cua press-key --key "$key" --modifier "$mod" >/dev/null; else cua press-key --key "$key" >/dev/null; fi
  sleep 0.15
  ev keyup "\"key\":\"$key\""; [ -n "$mod" ] && ev keyup "\"key\":\"$mod\""
  true
}
glide() { # glide <x> <y>: ease the pointer there over ~0.5 s so viewers can follow it
  local x=$1 y=$2 sx sy
  read -r sx sy < <(cua cursor-position | python3 -c 'import json,sys;d=json.load(sys.stdin);print(int(d["x"]),int(d["y"]))')
  for i in 1 2 3 4 5 6 7 8 9 10 11 12; do
    local p; p=$(python3 -c "import math;t=$i/12;print(0.5-0.5*math.cos(math.pi*t))")
    cua mouse-move --x "$(python3 -c "print($sx+($x-$sx)*$p)")" --y "$(python3 -c "print($sy+($y-$sy)*$p)")" >/dev/null
    sleep 0.035
  done
}
click_at() { # click_at <x> <y> [button]
  local x=$1 y=$2 b=${3:-left}
  glide "$x" "$y"; sleep 0.2
  ev click "\"x\":$x,\"y\":$y,\"button\":\"$b\""
  cua click --x "$x" --y "$y" --button "$b" >/dev/null
}
focus() { # focus <x> <y> <w> <h> <label> <seconds>: highlight and zoom target
  printf '{"t":%s,"type":"focus","x":%s,"y":%s,"w":%s,"h":%s,"label":"%s","duration":%s}\n' "$(now)" "$1" "$2" "$3" "$4" "$5" "$6" >> "$CLIP/events.jsonl"
}
caption() { # caption "<text>" <seconds>  (films only)
  printf '{"t":%s,"type":"caption","text":"%s","duration":%s}\n' "$(now)" "$1" "$2" >> "$CLIP/events.jsonl"
}
pause() { sleep "$1"; }

# AX lookup: prints "x y w h" of the first element whose title/label/value matches.
locate() { python3 "$RIG/locate.py" "$@"; }   # locate <app> <text> -> "x y w h"
center() { python3 -c "import sys;x,y,w,h=map(int,sys.argv[1:5]);print(x+w//2, y+h//2)" $1 $2 $3 $4; }
