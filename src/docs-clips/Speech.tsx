import React from "react";
import { Easing, interpolate } from "remotion";
import { C, SANS } from "./theme";

type Speech = { t: number; text: string; duration: number };

export const SpeechPill: React.FC<{ speech: Speech; t: number; frame: number; bottom: number }> = ({ speech, t, frame, bottom }) => {
  const FADE_IN = 0.2;
  const TAIL = 0.45;
  const end = speech.t + speech.duration;
  const opacity = interpolate(t, [speech.t - FADE_IN, speech.t, end + TAIL - 0.25, end + TAIL], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  if (opacity <= 0) return null;
  const lift = interpolate(t, [speech.t - FADE_IN, speech.t], [10, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
  });
  const talking = t >= speech.t && t <= end;
  const typed = interpolate(t, [speech.t, speech.t + speech.duration * 0.85], [0, speech.text.length], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const shown = speech.text.slice(0, Math.round(typed));
  const bars = 9;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom, display: "flex", justifyContent: "center", opacity, transform: `translateY(${lift}px)` }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 16, padding: "14px 26px 14px 22px", borderRadius: 999,
        background: C.charcoal, color: C.cream, fontFamily: SANS, fontSize: 30, fontWeight: 500,
        boxShadow: "0 8px 24px rgba(44,44,44,0.22)", maxWidth: 1000,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, height: 34 }}>
          {Array.from({ length: bars }).map((_, i) => {
            const env = Math.sin((i / (bars - 1)) * Math.PI) * 0.6 + 0.4;
            const wob = 0.5 + 0.5 * Math.sin(frame * 0.55 + i * 1.7) * Math.sin(frame * 0.21 + i * 0.9);
            const h = talking ? 6 + 26 * env * (0.25 + 0.75 * Math.abs(wob)) : 6;
            return <div key={i} style={{ width: 4, height: h, borderRadius: 2, background: C.cream }} />;
          })}
        </div>
        <div style={{ whiteSpace: "nowrap" }}>
          {"\u201C"}{shown}<span style={{ visibility: "hidden" }}>{speech.text.slice(shown.length)}</span>{typed < speech.text.length ? <span style={{ visibility: "hidden" }}>{"\u201D"}</span> : "\u201D"}
        </div>
      </div>
    </div>
  );
};
