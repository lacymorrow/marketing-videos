#!/usr/bin/env bash
# Renders the graphics for the Keepsake build video into out/keepsake/.
# IDs match ~/repo/keepsake/media/video-keepsake-recorder/storyboard.md.
# Opaque scenes render as H.264 mp4. Overlays render as ProRes 4444 with alpha
# for Resolve or Final Cut. Usage: ./render-keepsake.sh [id ...]
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p out/keepsake

opaque=(g1-trip g3-wrap g5-96-boots)
overlay=(g2-gate g4-capped g6-converter g7-staged g8-not-filmed g9-recreated)
want=("$@")

wanted() {
  [ ${#want[@]} -eq 0 ] && return 0
  for w in "${want[@]}"; do [ "$w" = "$1" ] && return 0; done
  return 1
}

for id in "${opaque[@]}"; do
  wanted "$id" || continue
  npx remotion render src/index.ts "$id" "out/keepsake/$id.mp4" --crf=16
done

for id in "${overlay[@]}"; do
  wanted "$id" || continue
  npx remotion render src/index.ts "$id" "out/keepsake/$id.mov" \
    --codec=prores --prores-profile=4444 --image-format=png --pixel-format=yuva444p10le
done
