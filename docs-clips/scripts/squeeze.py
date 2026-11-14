#!/usr/bin/env python3
"""squeeze.py <clip-dir> [max_gap]: cut dead time from a Settings clip before render.

The rig finds every control by reading the accessibility tree, which takes a few
seconds per lookup, so a recording sits still between actions. Any stretch with
no visible event longer than max_gap (default 1.6 s) is cut down to max_gap:
0.6 s kept after the last thing that happened, the rest kept before the next
(the pointer starts gliding ~0.6 s before a click). Captions are not drawn in
clips, so they do not count as something happening. Events are shifted to
match. The original is kept as raw.full.mp4, and a second run starts from it.
Only for clips where nothing on screen moves while the rig thinks (Settings);
never for a clip where Juno is working or answering."""
import json, os, re, subprocess, sys

clip = sys.argv[1]; max_gap = float(sys.argv[2]) if len(sys.argv) > 2 else 1.6
HEAD = 0.6
p = os.path.join(clip, "events.json"); d = json.load(open(p))
orig = d.get("squeeze", {}).get("events") or d["events"]
full = os.path.join(clip, "raw.full.mp4"); raw = os.path.join(clip, d["video"])
if not os.path.exists(full): os.rename(raw, full)
dur = d.get("squeeze", {}).get("duration") or d["duration"]

# busy spans: anything a viewer sees
spans = []
for e in orig:
    if e["type"] == "caption": continue
    spans.append((e["t"], e["t"] + float(e.get("duration", 0.3))))
# busy.jsonl (rig, Unix times): typing and anything else with no overlay event
bp = os.path.join(clip, "busy.jsonl")
if os.path.exists(bp):
    t0 = float(open(os.path.join(clip, "raw.mov.t0")).read())
    for line in open(bp):
        b = json.loads(re.sub(r':\s*\.', ':0.', line));  # older rig: bc wrote ".75"
        spans.append((b["t"] - t0, b["t"] - t0 + float(b["duration"])))
spans.sort()
cuts, last = [], 0.0
for a, b in spans:
    if a - last > max_gap:
        cuts.append((last + HEAD, a - (max_gap - HEAD)))
    last = max(last, b)
if dur - last > max_gap + 0.8: cuts.append((last + HEAD + 0.8, dur - (max_gap - HEAD)))

def shift(t):
    s = 0.0
    for a, b in cuts:
        if t >= b: s += b - a
        elif t > a: s += t - a
    return round(t - s, 3)

keep = []; cur = 0.0
for a, b in cuts: keep.append((cur, a)); cur = b
keep.append((cur, dur))
sel = "+".join(f"between(t,{a:.3f},{b:.3f})" for a, b in keep)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", full, "-vf", f"select='{sel}',setpts=N/FRAME_RATE/TB",
                "-an", "-c:v", "libx264", "-crf", "12", "-preset", "fast", "-pix_fmt", "yuv420p", raw], check=True)
new = []
for e in orig:
    e2 = dict(e); e2["t"] = shift(e["t"]); new.append(e2)
d["squeeze"] = {"events": orig, "duration": dur, "cuts": cuts}
d["events"] = new; d["duration"] = round(dur - sum(b - a for a, b in cuts), 3)
json.dump(d, open(p, "w"), indent=1)
print(f"cut {sum(b - a for a, b in cuts):.1f}s in {len(cuts)} spans -> {d['duration']}s")
