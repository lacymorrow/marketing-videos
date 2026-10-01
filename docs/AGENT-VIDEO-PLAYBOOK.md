# Agent video playbook

How an agent makes a short motion graphic in this repo, from the shipx card (2026-09-30,
`src/channel/shipx/`). Read this before building the next one.

## What "Opus makes motion graphics" actually means

The model does not generate video. It writes React (Remotion) where every frame is a pure
function of `useCurrentFrame()`, and headless Chromium plus FFmpeg render the MP4. That is
why results are crisp, exact, and cheap to change: edit a line, render again. The quality
comes from the loop, not the prompt: build, render stills, look, fix, then render video.

## The loop

1. **Story first.** Write the 10 seconds as beats before any code. One idea per card.
   The shipx card: nine hand-typed commands become a finished checklist, then the end card.
2. **Timing as one object.** Keep every beat in a single `t` const in frames
   (see `Card.tsx`). Audio, stills, and future retimes all key off it.
3. **Contact sheet before video.** Render 4 to 6 stills at `--scale=0.5`, tile them with
   ffmpeg `hstack`/`vstack`, and read the image. Look at mid-transition frames too, not
   just rest states. The first shipx pass looked fine at rest but had two crossfading rows
   overlapping into garbage ("GitHub releasete v0.1.23"). Fix: fade the old text out over
   5 frames, bring the new one in 3 frames later.
   ```bash
   npx remotion still src/index.ts shipx-card out/shipx/f170.png --frame=170 --scale=0.5
   ```
4. **Size for phones.** At 2560x1440, body mono under ~56px is unreadable on a phone feed.
5. **Render**, then verify with `ffprobe` (duration, an audio stream exists).

## Sound for free

`scripts/shipx-card-sfx.py` synthesizes the whole sound pass with numpy (no scipy, no
samples, no API, no license). Fixed RNG seed, so renders are reproducible.

- Recipes that sounded right: key click = low-passed noise burst (4 ms decay) plus a short
  1.6 to 2.4 kHz sine body, randomized per key; Enter = 150 Hz sine thunk plus a click;
  step done = sine plus a quiet 4x partial, 160 ms decay, notes rising through a major
  pentatonic; end = inharmonic bell (partials 1, 2, 2.76, 5.4) over a low chord pad.
- Keep it quiet and sparse. Typing at about 0.16 gain, plucks about 0.18.
- `scripts/shipx-card-sfx.sh` regenerates and normalizes to -16 LUFS (`loudnorm`), the
  usual target for social.
- Frame numbers in the script mirror `t` in the component. Retime both or neither.
- Check sync numerically, not by ear: find onset times in the wav and compare to
  `frame / 30`. Enter landed at 4.400 s and the bell at 7.302 s, both on their frames.
- Play it with `<Audio>` from `@remotion/media` (the skills' current recommendation), not
  the older `Audio` from `remotion`.

## Copy

Lacy rejected "Nine commands. One prompt." Counting commands sells typing less, which
every release tool already claims. The line that stayed sells the outcome only shipx
gives: "Never half-ship a release." (preflight refuses a dirty tree, npm publish retries
instead of dying after the tag is pushed, the registry is checked before "done").
Lesson: name the failure the tool prevents, not the mechanism. Offer two alternatives
with the pick, because copy is the part most likely to be rejected.

## House style beats the skills

The Remotion skills suggest `Easing.spring()`. Channel graphics do not use springs: flat,
one accent, `theme.ease` cubic ease-out (see `src/channel/theme.ts`). The skills also
suggest `Interactive.Div`; this repo uses plain divs, so match the surrounding code.

## Setup facts

- Remotion pinned to 4.0.531 across every `@remotion/*` package. Upgrade with
  `npx remotion upgrade`, then `npx remotion versions` should say all match.
- Install with `--legacy-peer-deps`.
- Remotion agent skills live in `.claude/skills/remotion-*` (repo) and
  `~/.claude/skills/remotion-*` (global, installed with
  `npx skills add remotion-dev/skills -g -a claude-code -y`).
- Work in a worktree under `.worktrees/` (ignored) so another session's branch in the main
  checkout is never touched.
