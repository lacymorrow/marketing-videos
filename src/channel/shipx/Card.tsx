import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame } from "remotion";
import { useRise } from "../parts";
import { clamp, sec, theme } from "../theme";

// The nine commands a release takes by hand, in shipx's step order, and the
// step each one becomes. Keep both columns true to ~/repo/shipx/src/steps.
const steps = [
  { cmd: "git status --porcelain", step: "Preflight" },
  { cmd: "npm version patch", step: "Bump 0.1.22 → 0.1.23" },
  { cmd: "git log v0.1.22..HEAD --oneline", step: "Changelog" },
  { cmd: 'git commit -am "release v0.1.23"', step: "Commit" },
  { cmd: "git tag v0.1.23", step: "Tag" },
  { cmd: "git push --follow-tags", step: "Push" },
  { cmd: "gh release create v0.1.23", step: "GitHub release" },
  { cmd: "npm publish", step: "npm publish" },
  { cmd: "npm view @lacymorrow/shipx version", step: "Verify on the registry" },
];

// Beats, in frames. 10 s total.
const t = {
  typeIn: 6, // first command lands
  typeGap: 9, // between commands
  prompt: sec(3.6), // `$ shipx` types over the list
  tick: sec(4.4), // first row turns into a finished step
  tickGap: 6,
  out: sec(6.9), // list leaves
  end: sec(7.3), // end card
};

const rowH = 92;
const listTop = 450;
const left = 700;

// 10 s social / README card for shipx. Nine hand-typed commands become one
// finished release, then the end card. Flat ink, one accent, house easing, no springs.
export const ShipxCard: React.FC = () => {
  const frame = useCurrentFrame();
  const listOut = interpolate(frame, [t.out, t.out + 12], [1, 0], { ...clamp, easing: theme.ease });
  const promptIn = useRise(t.prompt, 14);
  const typed = Math.floor(interpolate(frame, [t.prompt + 4, t.prompt + 16], [0, 5], clamp));

  return (
    <AbsoluteFill style={{ background: theme.ink, fontFamily: theme.mono }}>
      {/* Synthesized in scripts/shipx-card-sfx.py; timed to `t` above. */}
      <Audio src={staticFile("shipx/card-sfx.wav")} />
      <div style={{ opacity: listOut, translate: `0px ${(1 - listOut) * -24}px` }}>
        <div
          style={{
            position: "absolute",
            left,
            top: listTop - 170,
            fontSize: 76,
            fontWeight: 600,
            color: theme.paper,
            opacity: promptIn,
          }}
        >
          <span style={{ color: theme.mute }}>$ </span>
          {"shipx".slice(0, typed)}
          <Caret visible={frame >= t.prompt && frame < t.tick} />
        </div>
        {steps.map((s, i) => (
          <Row key={s.cmd} i={i} {...s} />
        ))}
      </div>
      <EndCard />
    </AbsoluteFill>
  );
};

const Row: React.FC<{ i: number; cmd: string; step: string }> = ({ i, cmd, step }) => {
  const frame = useCurrentFrame();
  const inAt = t.typeIn + i * t.typeGap;
  const doneAt = t.tick + i * t.tickGap;
  const rise = useRise(inAt, 10);
  const gone = useRise(doneAt, 5);
  const done = useRise(doneAt + 3, 10);
  const chars = Math.floor(interpolate(frame, [inAt, inAt + 8], [0, cmd.length], clamp));

  return (
    <div style={{ position: "absolute", left, top: listTop + i * rowH, fontSize: 56, height: rowH, opacity: rise }}>
      <div style={{ position: "absolute", whiteSpace: "pre", color: theme.mute, opacity: 1 - gone }}>
        <span style={{ opacity: 0.5 }}>$ </span>
        {cmd.slice(0, chars)}
      </div>
      <div style={{ position: "absolute", whiteSpace: "pre", color: theme.paper, opacity: done, translate: `${(1 - done) * 16}px 0px` }}>
        <span style={{ color: theme.accentOnInk }}>✓ </span>
        {step}
      </div>
    </div>
  );
};

const Caret: React.FC<{ visible: boolean }> = ({ visible }) => {
  const frame = useCurrentFrame();
  const on = visible && Math.floor(frame / 12) % 2 === 0;
  return <span style={{ display: "inline-block", width: 40, height: 76, marginLeft: 6, verticalAlign: "-10px", background: theme.paper, opacity: on ? 1 : 0 }} />;
};

const EndCard: React.FC = () => {
  const mark = useRise(t.end, 18);
  const line = useRise(t.end + 10, 18);
  const cta = useRise(t.end + 22, 18);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 36 }}>
      <div style={{ fontFamily: theme.sans, fontWeight: 600, fontSize: 220, letterSpacing: -6, color: theme.paper, opacity: mark, translate: `0px ${(1 - mark) * 28}px` }}>
        shipx
      </div>
      <div style={{ fontFamily: theme.sans, fontSize: 56, color: theme.mute, opacity: line, translate: `0px ${(1 - line) * 20}px` }}>
        Never half-ship a release.
      </div>
      <div style={{ marginTop: 40, fontSize: 52, color: theme.accentOnInk, opacity: cta, translate: `0px ${(1 - cta) * 16}px` }}>
        npx @lacymorrow/shipx
      </div>
    </AbsoluteFill>
  );
};
