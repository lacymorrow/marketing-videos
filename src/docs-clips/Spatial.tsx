import React from "react";
import { Easing, interpolate } from "remotion";
import { Layout, toPx } from "./camera";
import { MouseButton } from "./types";
import { C, SANS } from "./theme";

type Click = { t: number; x: number; y: number; button: MouseButton };
type Focus = { t: number; x: number; y: number; w: number; h: number; label?: string; duration: number };

const MouseGlyph: React.FC<{ button: MouseButton }> = ({ button }) => {
  const lit = C.accent;
  const body = "#fdfcfa";
  const f = (b: MouseButton) => (button === b ? lit : "none");
  return (
    <svg width={62} height={84} viewBox="0 0 44 60">
      <rect x={8} y={2} width={30} height={52} rx={15} fill={body} stroke={C.charcoal} strokeWidth={2.2} />
      <path d="M23 2v22" stroke={C.charcoal} strokeWidth={2} />
      <path d="M8 24h30" stroke={C.charcoal} strokeWidth={2} />
      {/* left / right button faces */}
      <path d="M23 3.2V23H9.2C9.6 12 15 4.4 23 3.2Z" fill={f("left")} />
      <path d="M23 3.2V23h13.8C36.4 12 31 4.4 23 3.2Z" fill={f("right")} />
      <rect x={20} y={9} width={6} height={12} rx={3} fill={button === "middle" ? lit : body} stroke={C.charcoal} strokeWidth={1.8} />
      {/* side buttons on the left edge */}
      <rect x={2} y={27} width={8} height={9} rx={3} fill={button === "button4" ? lit : body} stroke={C.charcoal} strokeWidth={1.8} />
      <rect x={2} y={38} width={8} height={9} rx={3} fill={button === "button5" ? lit : body} stroke={C.charcoal} strokeWidth={1.8} />
    </svg>
  );
};

const SIDE_NAME: Record<MouseButton, string> = { left: "", right: "", middle: "", button4: "4", button5: "5" };

export const ClickMark: React.FC<{ click: Click; t: number; L: Layout; z: number }> = ({ click, t, L, z }) => {
  const dt = t - click.t;
  if (dt < -0.15 || dt > 0.9) return null;
  const p = toPx(L, click.x, click.y);
  const r = interpolate(dt, [0, 0.5], [6, 46], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const ro = interpolate(dt, [0, 0.5], [0.9, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const mo = interpolate(dt, [-0.15, 0, 0.6, 0.9], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <>
      {dt >= 0 && (
        <div style={{
          position: "absolute", left: p.x - r, top: p.y - r, width: r * 2, height: r * 2, borderRadius: "50%",
          border: `4px solid ${C.accent}`, background: C.accentSoft, opacity: ro,
        }} />
      )}
      {/* glyph keeps a constant on-screen size while the camera is zoomed */}
      <div style={{ position: "absolute", left: p.x + 24, top: p.y + 14, opacity: mo, transform: `scale(${1 / z})`, transformOrigin: "0 0", display: "flex", alignItems: "flex-start", gap: 4 }}>
        <MouseGlyph button={click.button} />
        {SIDE_NAME[click.button] && (
          <div style={{ fontFamily: SANS, fontSize: 18, fontWeight: 700, color: C.accent, marginTop: 28 }}>{SIDE_NAME[click.button]}</div>
        )}
      </div>
    </>
  );
};

export const FocusMark: React.FC<{ focus: Focus; t: number; L: Layout; z: number }> = ({ focus, t, L, z }) => {
  const end = focus.t + focus.duration;
  const opacity = interpolate(t, [focus.t, focus.t + 0.2, end, end + 0.2], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (opacity <= 0) return null;
  const a = toPx(L, focus.x, focus.y);
  const pad = 7;
  const x = a.x - pad, y = a.y - pad, w = focus.w * L.scale + pad * 2, h = focus.h * L.scale + pad * 2;
  const chipAbove = y > 70;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, opacity }}>
      <div style={{
        position: "absolute", left: x, top: y, width: w, height: h, borderRadius: 12,
        border: `3.5px solid ${C.accent}`, background: C.accentSoft, boxShadow: "0 0 0 6px rgba(10,124,255,0.10)", boxSizing: "border-box",
      }} />
      {focus.label && (
        <div style={{
          position: "absolute", left: x, top: chipAbove ? y - 12 - 40 : y + h + 12, height: 40, lineHeight: "40px", transform: `scale(${1 / z})`,
          transformOrigin: chipAbove ? "0 100%" : "0 0",
          padding: "0 14px", borderRadius: 8, background: C.charcoal, color: C.cream, fontFamily: SANS, fontSize: 24, fontWeight: 600, whiteSpace: "nowrap",
        }}>{focus.label}</div>
      )}
    </div>
  );
};
