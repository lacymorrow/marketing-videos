# doc clip events.json (contract between the graphite recorder and Remotion)

One file per clip, next to the recording: `<slug>/events.json` + `<slug>/raw.mp4`.

```jsonc
{
  "slug": "change-your-keys",          // url-safe, = docs clip name
  "title": "Change the talk key",      // used by the film chapter card
  "chapter": 3,                         // film chapter number (films only)
  "video": "raw.mp4",                   // 30 fps CFR H.264, already cropped to the display
  "screen": { "width": 1536, "height": 960 },   // display size in POINTS; all x/y/w/h below are points, origin top-left
  "duration": 7.4,                      // seconds of raw.mp4 to use
  "trim": { "start": 0.0, "end": 7.4 }, // optional
  "events": [
    { "t": 1.20, "type": "keydown", "key": "fn" },            // key ids: fn, ctrl, opt, ropt, cmd, shift, esc, return, tab, space, or a single char
    { "t": 2.80, "type": "keyup",   "key": "fn" },
    { "t": 1.30, "type": "speech",  "text": "Open Calculator", "duration": 1.3 },   // spoken by the user (wake phrase or talk)
    { "t": 3.10, "type": "click",   "x": 412, "y": 300, "button": "left" },         // left | right | middle | button4 | button5
    { "t": 3.00, "type": "focus",   "x": 380, "y": 280, "w": 260, "h": 44, "label": "Shortcuts", "duration": 1.8 }, // highlight + zoom target
    { "t": 0.00, "type": "caption", "text": "Open Settings with Command-Comma.", "duration": 2.0 }                   // films only (VTT + burned-in optional)
  ]
}
```

Rules
- keydown/keyup always come in pairs per key; a held key is keydown..keyup. A tap is a pair < 0.4 s apart and must READ differently from a hold (Juno cancels presses under 400 ms).
- Modifier combos are simultaneous keydowns (e.g. fn + ctrl for dictation); render as one combo of caps.
- Times are seconds from the start of raw.mp4.

## Rendering

```
docs-clips/render.sh <clip-dir> [--film]      # needs <clip-dir>/events.json + the video it names
docs-clips/make-fixture.sh                    # regenerates fixtures/sample/raw.mp4 (gitignored)
```

Output lands in `<clip-dir>/out/`. Films pick up `voice.m4a` or `voice.aiff` from the clip dir.
