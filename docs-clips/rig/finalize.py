#!/usr/bin/env python3
"""Turn a rig take into the docs-clips contract (docs-clips/EVENTS.md).

raw.mov + raw.mov.t0 + events.jsonl (Unix times) ->
raw.mp4 (30 fps CFR H.264) + events.json (seconds from the first frame).
"""
import json
import subprocess
import sys
from pathlib import Path

clip, slug, title, chapter = Path(sys.argv[1]), sys.argv[2], sys.argv[3], int(sys.argv[4])
t0 = float((clip / "raw.mov.t0").read_text())

subprocess.run(
    ["ffmpeg", "-y", "-loglevel", "error", "-i", str(clip / "raw.mov"),
     "-vf", "fps=30,format=yuv420p", "-c:v", "libx264", "-crf", "16", "-preset", "slow",
     str(clip / "raw.mp4")],
    check=True,
)
probe = json.loads(subprocess.run(
    ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", str(clip / "raw.mp4")],
    capture_output=True, text=True, check=True).stdout)
duration = round(float(probe["format"]["duration"]), 2)

# Display size in points, which is what juno-cua and AX coordinates use.
w, h = subprocess.run(
    ["osascript", "-l", "JavaScript", "-e",
     "ObjC.import('AppKit'); var f=$.NSScreen.mainScreen.frame; f.size.width+' '+f.size.height"],
    capture_output=True, text=True, check=True).stdout.split()

events = []
for line in (clip / "events.jsonl").read_text().splitlines():
    e = json.loads(line)
    e["t"] = round(e["t"] - t0, 3)
    if e["t"] < 0:
        continue
    events.append(e)
events.sort(key=lambda e: e["t"])

(clip / "events.json").write_text(json.dumps({
    "slug": slug, "title": title, "chapter": chapter, "video": "raw.mp4",
    "screen": {"width": int(float(w)), "height": int(float(h))},
    "duration": duration, "events": events,
}, indent=2))
print(f"{slug}: {duration}s, {len(events)} events")
