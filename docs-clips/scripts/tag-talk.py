#!/usr/bin/env python3
"""tag-talk.py <clip-dir> <talk|dictation>: mark every fn keydown in events.json as that
shortcut, for clips recorded before the rig wrote "as" itself."""
import json, sys
p = f"{sys.argv[1]}/events.json"; d = json.load(open(p))
for e in d["events"]:
    if e["type"] == "keydown" and e["key"] in ("fn", "ctrl"): e["as"] = sys.argv[2]
json.dump(d, open(p, "w"), indent=1)
