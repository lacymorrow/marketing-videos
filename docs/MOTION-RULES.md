# Motion rules for Lacy's Lab graphics

What "Claude Motion" is, why we already have it, and the numbers that make a graphic feel made instead of generated. Read this before building any channel graphic. The playbook (`AGENT-VIDEO-PLAYBOOK.md`) is the build loop; this file is the taste.

## Claude Motion, checked 2026-10-11

Anthropic launched Claude Motion on 2026-10-08 as a beta inside claude.ai. It is not a video model: Claude writes code that animates text, charts, shapes and images, you edit one word or one timing and the rest stays put, and you export an MP4. That is the same engine as this repo (Remotion, every frame a pure function of the frame number, headless Chromium plus ffmpeg).

It is on Team and Enterprise plans only. Anthropic's pricing page lists it as not included on Free, Pro, Max 5x or Max 20x, and this account's artifact types list has no Motion type. So today the way to make Claude Motion graphics is Claude Code in this repo. The prompt advice Anthropic gives still applies here: say who will watch it, where it will play, roughly how long it should be, and hand over the source material so the graphic is built from real content.

## The brief comes before any code

Every graphic starts as six lines in the storyboard's graphics table, then a brief in the component's header comment:

1. Who watches it and where (YouTube at 1440p, or a muted feed on a phone).
2. One idea. If the sentence has an "and", it is two graphics.
3. Length in seconds, and the beats as named timestamps in one `t` object.
4. What is on screen at frame 0. Frame 0 is the thumbnail on X and it autoplays muted, so it is never empty or black.
5. The one accent moment: what changed, the answer, or the winner. One per graphic.
6. Where it fits in the video, and the shot before and after it.

## Numbers

These are adapted from Anthropic's launch guidance, the open-source claude-motion toolkit (whaleyxbt) and the howseen motion-design skill, then bent to the house look: paper, ink, one blue accent, no glow, no gradients, no springs, no grain.

| Thing | Number |
|---|---|
| Entrance | 0.6 to 1.0 s on `theme.ease` (cubic ease-out) |
| Exit | half the entrance, 0.3 to 0.5 s, on `theme.easeIn` |
| Move between two states | 0.5 to 0.8 s on `theme.easeInOut` |
| Linear | only for things that never stop: a caret blink, a slow drift, a clock hand |
| Word stagger | 0.09 s per word |
| List items, chips, rows | 0.2 to 0.25 s apart |
| Dots, ticks, small marks | 0.06 s apart |
| Typing | 0.035 s per character; caret blinks about 2.4 times a second |
| Reading hold | at least 1 s for a short phrase, plus 0.25 s per word past three, at least 2 s on the last card |
| Scene overlap | the next thing starts before the last thing has fully left, never a cut to an empty frame |
| Safe area | nothing within 60 px of the edge at 1440p unless it is meant to be cropped |
| Phone test | the key line must read at 360 px wide; on the 2560 canvas that means body mono above ~56 px and display type around 130 to 180 px |
| Type | `theme.sans` for words, `theme.mono` for commands, labels, numbers. Nothing else |
| Colour | tokens from `theme` only. The accent marks the focal point and nothing else |
| Focal points | one per frame |
| Text in motion | never while it is being read. Land it, then hold |

When in doubt, hold longer and animate less.

## Transitions

Every transition is caused by something on screen. A row finishing turns into the next row. A command typed becomes the thing it did. A number counting up lands as the headline. No wipes, no crossfades between unrelated frames, no particles.

Persistent objects carry the story across beats: the prompt bar, the ticket card, the folder. Change what they mean, not what they are.

## What reads as generated

- Everything fading in at the same time with the same duration.
- Linear easing on anything that starts or stops.
- A gradient, a glow, a lens flare, a bounce.
- Two focal points. A caption and a headline fighting.
- A paragraph on screen. Say it in the voice; put four words on the frame.
- A fake number. Every figure in a graphic comes from the repo, the board, or a measurement, with the source in the component comment.
- Anything that "showcases". The graphic shows one thing happening.

## The loop (short form)

1. Beats into `t` first. No times hardcoded in JSX.
2. Build. Render the contact sheet: `scripts/contact-sheet.sh <composition> [frames...]`. It renders one still per beat at half scale and tiles them.
3. Read the sheet against the checklist below. Zoom into mid-transition frames, not only rest frames.
4. Fix, re-render the sheet, repeat until a pass finds nothing.
5. Render the video, `ffprobe` it (duration, audio stream if there is one), watch it once at phone size.

## Checklist

- One focal point per frame. No overlaps mid-transition.
- Nothing inside the 60 px edge.
- Frame 0 is a real picture.
- No clipped type. Key line readable at 360 px wide.
- Readable states hold long enough; the mid-hold frame shows settled text.
- Exits faster than entrances. No empty frames between beats.
- Only theme tokens. Accent on the focal point only.
- Recurring objects look the same in every beat.
- Every number traceable to its source comment.

## Sound

Only once picture timing is locked. The free numpy recipe in the playbook is enough: sparse, quiet, on the beat frames from `t`, normalized to -16 LUFS. Check sync numerically (onset time against `frame / 30`), not by ear.

## Graphics backlog for the first five demos (after the rough cuts post)

The rough cuts go up with no graphics on purpose. These come next, one per video, each small enough to build and review in one sitting. Brief, then build, then contact sheet.

| ID | Video | Seconds | Says (one idea) | Source of every number | Output |
|---|---|---|---|---|---|
| G-LAB | Channel | 3 | "Lacy's Lab", paper and ink, the blue accent lands on the apostrophe. Frame 0 shows the name. | none | `out/channel/lab-sting.mov` (ProRes 4444, transparent) |
| G-LS1 | Lacy shell | 6 | One line of text; the first word lights blue; a `$` or `?` lands beside it. "ls" goes left, "what" goes right. | README routing table | overlay over the terminal at B03 |
| G-SX1 | ShipX | existing | The 10 s card already built (`src/channel/shipx/`). Retime to 0.1.27 to 0.1.28 before reuse. | `npm view` | README gif + end card |
| G-HG1 | Guide | 6 | A URL is typed; a blank page; words appear under it in the book's voice; a lock closes. "Written when asked, kept forever." | guide-search.ts | overlay at B04 |
| G-PC1 | Fleet | 6 | Three numbers count up and land: 4,243 tickets, 2,967 done, 17,077 runs, since 2026-03-10. | board DB, read 2026-10-11 | overlay at B06 |
| G-JN1 | Juno | 5 | A pointer sits still in a corner while a highlight walks the accessibility tree to a button and presses it. | juno AX-first targeting | overlay at B03 |
| G-END | all five | 3 | End card: the URL in mono, nothing else. One component, five props. | each storyboard | end of each video |

Not in the backlog: logo stings per product, lower thirds with Lacy's name, anything with a face, subscribe animations.
