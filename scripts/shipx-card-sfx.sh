#!/usr/bin/env bash
# Regenerates the shipx-card sound pass and normalizes it to -16 LUFS for social.
set -euo pipefail
cd "$(dirname "$0")/.."
python3 scripts/shipx-card-sfx.py
ffmpeg -loglevel error -y -i public/shipx/card-sfx.raw.wav \
  -af loudnorm=I=-16:TP=-1.5:LRA=11 -ar 48000 public/shipx/card-sfx.wav
trash public/shipx/card-sfx.raw.wav
