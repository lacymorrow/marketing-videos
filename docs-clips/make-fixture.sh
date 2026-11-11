#!/bin/bash
# Builds fixtures/sample/raw.mp4 (8 s, 1536x960, 30 fps) from a synthetic Mac-like screen.
set -euo pipefail
cd "$(dirname "$0")/.."
REPO="$(pwd)"
DIR=docs-clips/fixtures/sample
cd "$REPO"
./node_modules/.bin/remotion still src/index.ts DocFixtureScreen "$DIR/screen.png" >/dev/null
ffmpeg -v error -y -loop 1 -framerate 30 -i "$DIR/screen.png" -t 8 \
  -c:v libx264 -crf 18 -pix_fmt yuv420p -r 30 "$DIR/raw.mp4"
echo "$DIR/raw.mp4"
