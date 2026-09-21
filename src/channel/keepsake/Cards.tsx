import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CornerLabel, useRise } from "../parts";
import { clamp, theme } from "../theme";

const useInOut = (len = 12) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return interpolate(frame, [0, len, durationInFrames - len, durationInFrames - 1], [0, 1, 1, 0], clamp);
};

export type LogCardProps = {
  // Exact quotes from the log. Wrap the part to highlight in [[double brackets]].
  lines: string[];
  label: string;
}

// G4, G6. Transparent log card. Never retype a log as if it were a live session.
export const LogCard: React.FC<LogCardProps> = ({ lines, label }) => {
  const o = useInOut();
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <div style={{ position: "absolute", left: 96, bottom: 210, maxWidth: 2200, background: theme.ink, borderRadius: 14, padding: "44px 56px", fontFamily: theme.mono, fontSize: 52, lineHeight: 1.5, color: theme.paper }}>
        {lines.map((line) => (
          <div key={line} style={{ whiteSpace: "pre" }}>
            {line.split(/(\[\[.*?\]\])/).map((part, i) =>
              part.startsWith("[[") ? (
                <span key={i} style={{ color: theme.accentOnInk, fontWeight: 600 }}>{part.slice(2, -2)}</span>
              ) : (
                <span key={i}>{part}</span>
              ),
            )}
          </div>
        ))}
      </div>
      <CornerLabel text={label} />
    </AbsoluteFill>
  );
};

export type NumberCardProps = {
  rows: { n: string; what: string }[];
  label: string;
  source: string;
}

// G5. Nothing failed, so nothing was logged.
export const NumberCard: React.FC<NumberCardProps> = ({ rows, label, source }) => (
  <AbsoluteFill style={{ background: theme.paper, fontFamily: theme.sans }}>
    {rows.map((r, i) => (
      <NumberRow key={r.what} {...r} i={i} />
    ))}
    <div style={{ position: "absolute", right: 96, bottom: 100, fontFamily: theme.mono, fontSize: 28, color: theme.mute }}>{source}</div>
    <CornerLabel text={label} />
  </AbsoluteFill>
);

const NumberRow: React.FC<{ n: string; what: string; i: number }> = ({ n, what, i }) => {
  const t = useRise(8 + i * 22);
  return (
    <div style={{ position: "absolute", left: 560, top: 300 + i * 260 + (1 - t) * 16, opacity: t, display: "flex", alignItems: "baseline", gap: 56 }}>
      <div style={{ width: 360, textAlign: "right", fontSize: 200, fontWeight: 600, color: n === "0" ? theme.accent : theme.ink, lineHeight: 1 }}>{n}</div>
      <div style={{ fontSize: 64, color: theme.ink }}>{what}</div>
    </div>
  );
};

// G7, G8, G9. A provenance label over live footage.
export const Label: React.FC<{ text: string }> = ({ text }) => {
  const o = useInOut(8);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <CornerLabel text={text} />
    </AbsoluteFill>
  );
};
