#!/usr/bin/env python3
"""locate <app> <text> [--role R] [--all]: print "x y w h" (points) of the first
AX element whose label, description or value equals <text> (then contains it).
Reads `juno-cua ui-tree`, which needs only Accessibility."""
import json, subprocess, sys

args = [a for a in sys.argv[1:] if not a.startswith("--")]
app, text = args[0], args[1]
role = sys.argv[sys.argv.index("--role") + 1] if "--role" in sys.argv else None
show_all = "--all" in sys.argv
raw = subprocess.run(["juno-cua", "ui-tree", "--app", app], capture_output=True, text=True).stdout
tree = json.loads(raw[raw.index("{"):])

def walk(node, out):
    a = node.get("attributes", {})
    p = a.get("properties", {}) or {}
    pos, size = p.get("AXPosition"), p.get("AXSize")
    names = [str(x) for x in (a.get("label"), a.get("description"), node.get("value"), a.get("value")) if x]
    if pos and size:
        out.append((names, node.get("role") or a.get("role"), pos, size))
    for c in node.get("children", []) or []:
        walk(c, out)

items = []
walk(tree, items)
if show_all:
    for names, r, pos, size in items:
        if names:
            print(f'{r}\t{int(pos["x"])},{int(pos["y"])} {int(size["width"])}x{int(size["height"])}\t{" | ".join(names)[:90]}')
    sys.exit(0)
for exact in (True, False):
    for names, r, pos, size in items:
        if role and r != role:
            continue
        if any((n == text) if exact else (text.lower() in n.lower()) for n in names):
            print(int(pos["x"]), int(pos["y"]), int(size["width"]), int(size["height"]))
            sys.exit(0)
sys.exit(1)
