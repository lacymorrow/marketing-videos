#!/bin/bash
# Render all three Juno Demo cuts
set -e
cd "$(dirname "$0")"

echo "[1/3] Rendering 9:16 vertical (with captions)..."
./node_modules/.bin/remotion render src/index.ts JunoDemoVertical out/juno-demo-9x16.mp4
echo "✓ 9:16 done: out/juno-demo-9x16.mp4"

echo "[2/3] Rendering 1:1 square..."
./node_modules/.bin/remotion render src/index.ts JunoDemoSquare out/juno-demo-1x1.mp4
echo "✓ 1:1 done: out/juno-demo-1x1.mp4"

echo "[3/3] Rendering 16:9 landscape master..."
./node_modules/.bin/remotion render src/index.ts JunoDemo-Landscape out/juno-demo-16x9.mp4
echo "✓ 16:9 done: out/juno-demo-16x9.mp4"

echo ""
echo "All renders complete. QC check:"
ffprobe -v quiet -print_format json -show_streams out/juno-demo-9x16.mp4 2>&1 | python3 -c "
import json,sys
d=json.load(sys.stdin)
v=[s for s in d['streams'] if s['codec_type']=='video'][0]
print(f'  9:16: {v[\"width\"]}x{v[\"height\"]}, {v[\"r_frame_rate\"]}fps, {float(v[\"duration\"]):.1f}s')
"
ffprobe -v quiet -print_format json -show_streams out/juno-demo-1x1.mp4 2>&1 | python3 -c "
import json,sys
d=json.load(sys.stdin)
v=[s for s in d['streams'] if s['codec_type']=='video'][0]
print(f'  1:1:  {v[\"width\"]}x{v[\"height\"]}, {v[\"r_frame_rate\"]}fps, {float(v[\"duration\"]):.1f}s')
"
