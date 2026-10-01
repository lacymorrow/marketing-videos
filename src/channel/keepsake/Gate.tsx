import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { useRise } from "../parts";
import { clamp, sec, theme } from "../theme";

// G2. The room did not change, the line did. One calibration pass, 601 frames:
// min 5, p50 75, p90 100, p99 150, max 342. Gate band 70 to 90, then 175 to 232.
const MARKS = [
  { label: "min", v: 5 },
  { label: "p50", v: 75 },
  { label: "p90", v: 100 },
  { label: "p99", v: 150 },
  { label: "max", v: 342 },
];
const TOP = 360;
const H = 840;
const PANEL_X = 1400;
const AXIS_X = PANEL_X + 300;
const BAR_W = 360;
const y = (v: number) => 300 + H - (v / TOP) * H;

export const Gate: React.FC = () => {
  const frame = useCurrentFrame();
  const appear = useRise(0, 20);
  const move = interpolate(frame, [sec(5), sec(8)], [0, 1], { ...clamp, easing: theme.ease });
  const lo = 70 + (175 - 70) * move;
  const hi = 90 + (232 - 90) * move;

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: PANEL_X, top: 90, width: 1060, height: 1260, background: theme.paper, border: `4px solid ${theme.ink}`, borderRadius: 18, opacity: appear, fontFamily: theme.sans }}>
        <div style={{ position: "absolute", left: 60, top: 40, fontSize: 30, letterSpacing: 5, color: theme.mute, textTransform: "uppercase", fontWeight: 500 }}>Energy, 601 frames</div>
      </div>
      <div style={{ opacity: appear }}>
        {/* the room: everything the calibration pass measured up to p99 */}
        <div style={{ position: "absolute", left: AXIS_X, top: y(150), width: BAR_W, height: y(5) - y(150), background: theme.rule }} />
        <div style={{ position: "absolute", left: AXIS_X + BAR_W + 30, top: y(30) - 28, fontFamily: theme.sans, fontSize: 40, fontWeight: 600, color: theme.ink }}>room</div>
        {MARKS.map((m) => (
          <React.Fragment key={m.label}>
            <div style={{ position: "absolute", left: AXIS_X - 24, top: y(m.v) - 2, width: BAR_W + 24, height: 4, background: theme.mute }} />
            <div style={{ position: "absolute", left: PANEL_X + 50, top: y(m.v) - 20, width: 220, textAlign: "right", fontFamily: theme.mono, fontSize: 30, color: theme.mute }}>
              {m.label} {m.v}
            </div>
          </React.Fragment>
        ))}
        {/* the gate band */}
        <div style={{ position: "absolute", left: AXIS_X - 12, top: y(hi), width: BAR_W + 24, height: y(lo) - y(hi), background: theme.accent, opacity: 0.85 }} />
        <div style={{ position: "absolute", left: AXIS_X + BAR_W + 30, top: (y(hi) + y(lo)) / 2 - 28, fontFamily: theme.sans, fontSize: 36, fontWeight: 600, color: theme.accent }}>
          gate {Math.round(lo)} to {Math.round(hi)}
        </div>
      </div>
    </AbsoluteFill>
  );
};
