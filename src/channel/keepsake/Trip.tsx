import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { useRise } from "../parts";
import { sec, theme } from "../theme";

// G1. One sentence makes ten hops, and the device deletes its own copy at hop eight.
const HOPS = ["gate", "compress", "encrypt", "card", "index line", "Wi-Fi upload", "server checks", "device deletes", "transcribe", "search"];
const DELETE_HOP = 7;

const COLS = 5;
const BOX_W = 400;
const BOX_H = 170;
const GAP_X = 72;
const GAP_Y = 150;
const X0 = (2560 - (COLS * BOX_W + (COLS - 1) * GAP_X)) / 2;
const Y0 = 560;

// A type, not an interface: Remotion needs props assignable to Record<string, unknown>.
export type TripProps = {
  // Seconds at which each hop appears. Retime to the recorded voice.
  hopAt: number[];
  freezeAt: number;
}

export const tripDefaults: TripProps = {
  hopAt: HOPS.map((_, i) => 1 + i * 3.3),
  freezeAt: 35,
};

const Hop: React.FC<{ i: number; at: number; hot: boolean }> = ({ i, at, hot }) => {
  const t = useRise(sec(at));
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  const x = X0 + col * (BOX_W + GAP_X);
  const y = Y0 + row * (BOX_H + GAP_Y);
  return (
    <>
      {i > 0 && col > 0 ? (
        <div style={{ position: "absolute", left: x - GAP_X, top: y + BOX_H / 2 - 2, width: GAP_X * t, height: 4, background: theme.ink }} />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: x,
          top: y + (1 - t) * 16,
          width: BOX_W,
          height: BOX_H,
          boxSizing: "border-box",
          opacity: t,
          background: hot ? theme.accent : theme.panel,
          border: `4px solid ${hot ? theme.accent : theme.ink}`,
          borderRadius: 14,
          padding: "26px 30px",
          fontFamily: theme.sans,
        }}
      >
        <div style={{ fontSize: 26, color: hot ? theme.panel : theme.mute, fontFamily: theme.mono }}>{String(i + 1).padStart(2, "0")}</div>
        <div style={{ fontSize: 40, fontWeight: 600, marginTop: 14, color: hot ? theme.panel : theme.ink, lineHeight: 1.15 }}>{HOPS[i]}</div>
      </div>
    </>
  );
};

export const Trip: React.FC<TripProps> = ({ hopAt, freezeAt }) => {
  const frame = useCurrentFrame();
  const frozen = frame >= sec(freezeAt);
  return (
    <AbsoluteFill style={{ background: theme.paper }}>
      <div style={{ position: "absolute", left: X0, top: 400, fontFamily: theme.sans, fontWeight: 500, fontSize: 34, letterSpacing: 6, color: theme.mute, textTransform: "uppercase" }}>
        One sentence, ten hops
      </div>
      {HOPS.map((h, i) => (
        <Hop key={h} i={i} at={hopAt[i]} hot={frozen && i === DELETE_HOP} />
      ))}
    </AbsoluteFill>
  );
};
