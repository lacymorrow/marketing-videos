# Docs clip rig (graphite)

Records Juno doing one task at a time, deterministically, and writes the
events.json that `../render.sh` turns into a clip (contract: `../EVENTS.md`).
Unlike the marketing rig (`tools/juno-demo-rig`, unscripted on purpose), docs
clips must come out the same every release.

- `rec.swift`: ScreenCaptureKit recorder; writes `<out>.t0`, the wall time of
  frame 0, so the event log maps onto the video exactly.
- `modkey.swift`: presses fn, Control, Right Option and other modifiers as flagsChanged events (juno-cua cannot send fn or one side of Option).
- `lib.sh`: stage, record, and logged actions (`hold_fn`, `say_line`,
  `press`, `click_at`, `focus`, `caption`).
- `finalize.py`: raw.mov + events.jsonl -> raw.mp4 + events.json.
- `locate.py`: AX lookup via juno-cua ui-tree, prints "x y w h".
- `scenes.sh`: one function per clip. `run.sh` on graphite runs a list of
  them, each gated on five idle minutes, and checks Juno's live settings after.
- `fixtures/`: files a scene stages on screen (the recipe for computer use).

After a recording, before `../render.sh`:

- `../scripts/squeeze.py <clip>` cuts the still stretches while the rig looks up
  the next control (Settings clips only; typing and `watch_for` waits are kept).
- `../scripts/tag-talk.py <clip> talk` marks fn presses in clips recorded before
  the rig wrote `"as"`, so the overlay says "talk key".

Never restore Juno's folder by hand while a scene is running or being killed:
`scenes.sh` does it from an EXIT trap, and two restores at once deleted the live
folder on 2026-11-13 (it came back from `$RIG/baseline`). `restore_juno` now
claims the backup with one `mv`, and neither function touches the folder while
any Juno process is alive (Juno can hang on quit with an MCP server running,
lacymorrow/juno#1006).

Install on graphite: copy this folder to `~/.cache/juno-docs-rig/`, then
`swiftc -O modkey.swift -o bin/modkey && swiftc -O rec.swift -o bin/rec`.

Needs, once per macOS update (they reset): Screen & System Audio Recording,
Accessibility and Full Disk Access for `/usr/libexec/sshd-keygen-wrapper`.
Runs only while nobody is using graphite.
