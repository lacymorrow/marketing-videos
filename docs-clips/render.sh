#!/bin/bash
# Render a Juno docs clip.  Usage: docs-clips/render.sh <clip-dir> [--film]
# <clip-dir> holds events.json + the recording it names (raw.mp4), and optionally voice.m4a/voice.aiff (film).
# Output in <clip-dir>/out/: <slug>.mp4 (H.264, <=900 KB target), <slug>.webm (VP9), <slug>.jpg, and <slug>.vtt for films.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CLIP="${1:?usage: render.sh <clip-dir> [--film]}"
FILM=0; [ "${2:-}" = "--film" ] && FILM=1
CLIP="$(cd "$CLIP" && pwd)"
OUT="$CLIP/out"; STAGE="$OUT/.stage"; mkdir -p "$OUT"
TOOLS="$ROOT/docs-clips/scripts/clip-tools.mjs"
SLUG="$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1])).slug)' "$CLIP/events.json")"
COMP=DocClip; [ $FILM = 1 ] && COMP=DocFilm
MAX_KB="${MAX_KB:-900}"   # text in UI clips smears below this

PROPS="$(node "$TOOLS" props "$CLIP" "$STAGE")"
MASTER="$OUT/.master.mp4"
(cd "$ROOT" && ./node_modules/.bin/remotion render src/index.ts "$COMP" "$MASTER" \
  --props="$PROPS" --public-dir="$STAGE" --codec=h264 --crf=14 --log=error)

AUDIO=(-an); [ $FILM = 1 ] && AUDIO=(-c:a aac -b:a 64k)
# Step CRF up until the file fits the budget (clips only; films are not capped).
for CRF in 27 29 31 33 35 37; do
  ffmpeg -v error -y -i "$MASTER" -c:v libx264 -preset slow -crf "$CRF" -pix_fmt yuv420p -movflags +faststart -r 30 "${AUDIO[@]}" "$OUT/$SLUG.mp4"
  KB=$(( $(stat -f%z "$OUT/$SLUG.mp4") / 1024 ))
  [ $FILM = 1 ] || [ "$KB" -le "$MAX_KB" ] && break
done
# Browsers take the WebM first, so it must never be the heavier file.
MP4_B=$(stat -f%z "$OUT/$SLUG.mp4")
for VCRF in 38 42 46 50 54; do
  ffmpeg -v error -y -i "$MASTER" -c:v libvpx-vp9 -crf "$VCRF" -b:v 0 -row-mt 1 -pix_fmt yuv420p -r 30 "${AUDIO[@]/aac/libopus}" "$OUT/$SLUG.webm"
  [ $FILM = 1 ] || [ "$(stat -f%z "$OUT/$SLUG.webm")" -le "$MP4_B" ] && break
done
PT="$(node "$TOOLS" poster "$CLIP" $([ $FILM = 1 ] && echo --film))"
ffmpeg -v error -y -ss "$PT" -i "$MASTER" -frames:v 1 -q:v 3 "$OUT/$SLUG.jpg"
[ $FILM = 1 ] && node "$TOOLS" vtt "$CLIP" > "$OUT/$SLUG.vtt"
rm -rf "$STAGE" "$MASTER"
echo "crf=$CRF"; ls -l "$OUT" | awk 'NR>1{print $5, $9}'
