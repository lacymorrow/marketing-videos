#!/usr/bin/env bash
# Render one half-scale still per frame and tile them into a contact sheet.
#   scripts/contact-sheet.sh <composition-id> <frame> [frame...]
#   scripts/contact-sheet.sh shipx-card 0 30 108 132 207 240
# Output: out/sheets/<composition>.png, stills in out/sheets/<composition>/fNNNN.png,
# tiled left to right, top to bottom, in the order given (4 per row).
# Read the sheet before rendering video (docs/MOTION-RULES.md, "The loop").
set -euo pipefail
comp="${1:?composition id}"; shift
[ "$#" -ge 1 ] || { echo "give at least one frame number" >&2; exit 1; }
dir="out/sheets/$comp"
mkdir -p "$dir"
files=()
for f in "$@"; do
  out="$dir/f$(printf '%04d' "$f").png"
  npx remotion still src/index.ts "$comp" "$out" --frame="$f" --scale=0.5 >/dev/null
  files+=("$out")
done
n=${#files[@]}
cols=$(( n < 4 ? n : 4 ))
rows=$(( (n + cols - 1) / cols ))
inputs=(); for f in "${files[@]}"; do inputs+=(-i "$f"); done
# Pad the last row with the final still so xstack gets a full grid.
while [ $(( ${#inputs[@]} / 2 )) -lt $(( cols * rows )) ]; do inputs+=(-i "${files[-1]}"); done
layout=""
for (( r=0; r<rows; r++ )); do for (( c=0; c<cols; c++ )); do
  x="0"; y="0"
  for (( k=0; k<c; k++ )); do x+="+w0"; done
  for (( k=0; k<r; k++ )); do y+="+h0"; done
  layout+="${layout:+|}${x}_${y}"
done; done
if [ "$n" -eq 1 ]; then cp "${files[0]}" "out/sheets/$comp.png"; else
  ffmpeg -loglevel error -y "${inputs[@]}" -filter_complex "xstack=inputs=$(( cols * rows )):layout=$layout" "out/sheets/$comp.png"
fi
echo "out/sheets/$comp.png  ($n stills, ${cols}x${rows}; order: $*)"
