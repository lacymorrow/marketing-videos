import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { useRise } from "../parts";
import { clamp, sec, theme } from "../theme";

// G3. A 32-bit count wraps to a believable number.
// samples * 1000 in uint32 at 16 kHz overflows at 268.4 s.
const ROWS = [268, 269, 300, 600];
const indexed = (s: number) => Math.floor((((s * 16000 * 1000) % 2 ** 32) / 16000));
const fmt = (n: number) => n.toLocaleString("en-US");

const Row: React.FC<{ s: number; i: number }> = ({ s, i }) => {
  const frame = useCurrentFrame();
  const start = sec(0.8 + i * 2.6);
  const t = useRise(start);
  const roll = interpolate(frame, [start + 10, start + 50], [0, 1], { ...clamp, easing: theme.ease });
  const truth = s * 1000;
  const wrapped = indexed(s);
  const snapped = roll >= 1 && wrapped !== truth;
  const shown = roll < 1 ? Math.floor(truth * roll) : wrapped;
  return (
    <div style={{ position: "absolute", left: 560, top: 430 + i * 190, width: 1440, opacity: t, display: "flex", justifyContent: "space-between", alignItems: "baseline", fontFamily: theme.mono, borderBottom: `3px solid ${theme.rule}`, paddingBottom: 26 }}>
      <div style={{ fontSize: 84, color: theme.ink }}>{s} s</div>
      <div style={{ fontSize: 84, fontWeight: 600, color: snapped ? theme.accent : theme.ink }}>{fmt(shown)} ms</div>
    </div>
  );
};

export const Wrap: React.FC = () => (
  <AbsoluteFill style={{ background: theme.paper }}>
    <div style={{ position: "absolute", left: 560, top: 290, width: 1440, display: "flex", justifyContent: "space-between", fontFamily: theme.sans, fontWeight: 500, fontSize: 34, letterSpacing: 6, color: theme.mute, textTransform: "uppercase" }}>
      <div>Recorded</div>
      <div>What the index said</div>
    </div>
    {ROWS.map((s, i) => (
      <Row key={s} s={s} i={i} />
    ))}
  </AbsoluteFill>
);
