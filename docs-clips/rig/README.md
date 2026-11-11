# Docs clip rig (graphite)

Records Juno doing one task at a time, deterministically, and writes the
events.json that `../render.sh` turns into a clip (contract: `../EVENTS.md`).
Unlike the marketing rig (`tools/juno-demo-rig`, unscripted on purpose), docs
clips must come out the same every release.

- `rec.swift`: ScreenCaptureKit recorder; writes `<out>.t0`, the wall time of
  frame 0, so the event log maps onto the video exactly.
- `fnkey.swift`: holds or taps the globe key (juno-cua has no fn).
- `lib.sh`: stage, record, and logged actions (`hold_fn`, `say_line`,
  `press`, `click_at`, `focus`, `caption`).
- `finalize.py`: raw.mov + events.jsonl -> raw.mp4 + events.json.
- `scenes.sh`: one function per clip.

Install on graphite: copy this folder to `~/.cache/juno-docs-rig/`, then
`swiftc -O fnkey.swift -o bin/fnkey && swiftc -O rec.swift -o bin/rec`.

Needs, once per macOS update (they reset): Screen & System Audio Recording,
Accessibility and Full Disk Access for `/usr/libexec/sshd-keygen-wrapper`.
Runs only while nobody is using graphite.
