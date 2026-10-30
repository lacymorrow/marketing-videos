#!/usr/bin/env bash
# Render every ready ad in docs/juno-ads-campaign.json in 16:9 and 9:16 to out/juno-ads/.
set -uo pipefail
cd "$(dirname "$0")/.."
ids=$(node -e 'for (const a of require("./docs/juno-ads-campaign.json").ads) if (a.status==="ready") console.log(a.id)')
for id in $ids; do for fmt in 16x9 9x16; do
  out="out/juno-ads/juno-ad-$id-$fmt.mp4"
  npx remotion render src/index.ts "JunoAd-$id-$fmt" "$out" --codec h264 --crf 18 --log=error && echo "DONE $out" || echo "FAILED $out"
done; done
echo "ALL RENDERS FINISHED"
