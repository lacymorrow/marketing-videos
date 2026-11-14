import React from "react";
import { Easing, interpolate } from "remotion";
import { DocEvent } from "./types";
import { C, SANS } from "./theme";

export const TAP_MAX = 0.4; // Juno cancels presses under 400 ms
const LEAD = 0.15;
const LINGER = 0.55;

interface Press {
  key: string;
  down: number;
  up: number;
  /** Set when the keys stand for a rebindable shortcut: draw its name, not the physical keys. */
  as?: string;
}

/** Pair keydown/keyup per key. An unmatched keydown is held to `end`. */
export const pairPresses = (events: DocEvent[], end: number): Press[] => {
  const open = new Map<string, { down: number; as?: string }>();
  const out: Press[] = [];
  const sorted = [...events].sort((a, b) => a.t - b.t);
  for (const e of sorted) {
    if (e.type === "keydown") {
      if (!open.has(e.key)) open.set(e.key, { down: e.t, as: e.as });
    } else if (e.type === "keyup" && open.has(e.key)) {
      const o = open.get(e.key)!;
      out.push({ key: e.key, down: o.down, up: e.t, as: o.as });
      open.delete(e.key);
    }
  }
  open.forEach((o, key) => out.push({ key, down: o.down, up: end, as: o.as }));
  return out;
};

interface Group {
  presses: Press[];
  start: number;
  end: number;
}

/** Presses that overlap (or nearly touch) form one combo. */
export const groupPresses = (presses: Press[]): Group[] => {
  const sorted = [...presses].sort((a, b) => a.down - b.down);
  const groups: Group[] = [];
  for (const p of sorted) {
    const g = groups[groups.length - 1];
    if (g && p.down <= g.end + 0.15) {
      g.presses.push(p);
      g.end = Math.max(g.end, p.up);
    } else groups.push({ presses: [p], start: p.down, end: p.up });
  }
  return groups;
};

const MOD_ORDER = ["fn", "ctrl", "opt", "ropt", "cmd", "shift"];
const order = (k: string) => {
  const i = MOD_ORDER.indexOf(k);
  return i === -1 ? 99 : i;
};

const Globe: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={C.charcoal} strokeWidth={1.7} strokeLinecap="round">
    <circle cx="12" cy="12" r="9" />
    <ellipse cx="12" cy="12" rx="4" ry="9" />
    <path d="M3 12h18M4.5 7.5h15M4.5 16.5h15" />
  </svg>
);

interface Label {
  symbol?: React.ReactNode;
  word?: string;
  wide?: boolean;
  width?: number;
}

const labelFor = (key: string): Label => {
  switch (key) {
    // Shortcuts people rebind are drawn by name, so the clip matches every keyboard.
    case "role:talk": return { word: "talk key", width: 150 };
    case "role:dictation": return { word: "dictation key", width: 196 };
    case "fn": return { symbol: <Globe size={26} />, word: "fn" };
    case "ctrl": return { symbol: "⌃", word: "control" };
    case "opt": return { symbol: "⌥", word: "option" };
    case "ropt": return { symbol: "⌥", word: "option" };
    case "cmd": return { symbol: "⌘", word: "command", wide: true };
    case "shift": return { symbol: "⇧", word: "shift", wide: true };
    case "esc": return { word: "esc" };
    case "return": return { symbol: "⏎", word: "return", wide: true };
    case "tab": return { symbol: "⇥", word: "tab" };
    case "space": return { word: "space", wide: true };
    default: return { symbol: key.length === 1 ? key.toUpperCase() : undefined, word: key.length === 1 ? undefined : key };
  }
};

const CAP_H = 68;
const RING_PAD = 6;

const Cap: React.FC<{ press: Press; t: number }> = ({ press, t }) => {
  const label = labelFor(press.key);
  const w = label.width ?? (label.wide ? 104 : 76);
  const dur = press.up - press.down;
  const isHold = dur >= TAP_MAX;
  const down = t >= press.down && t < press.up;

  // A tap is held visually for a short beat so a 80 ms press is still readable.
  const tapVisual = !isHold && t >= press.down && t < press.down + 0.22;
  const pressed = isHold ? down : tapVisual;

  let bounce = 0;
  if (!isHold) {
    // quick down-up-settle, ease curves only
    bounce = interpolate(t - press.down, [0, 0.07, 0.2], [0, 5, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.quad),
    });
  }
  const ty = isHold ? (down ? 2 : 0) : bounce;
  const ringP = isHold ? interpolate(t, [press.down, press.up], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  const showRing = isHold && t >= press.down && t <= press.up + 0.12;

  const rw = w + RING_PAD * 2;
  const rh = CAP_H + RING_PAD * 2;
  return (
    <div style={{ position: "relative", width: w, height: CAP_H, flex: "none" }}>
      {showRing && (
        <svg width={rw} height={rh} style={{ position: "absolute", left: -RING_PAD, top: -RING_PAD, overflow: "visible" }}>
          <rect x={2} y={2} width={rw - 4} height={rh - 4} rx={18} fill="none" stroke="rgba(44,44,44,0.14)" strokeWidth={3} />
          <rect
            x={2} y={2} width={rw - 4} height={rh - 4} rx={18} fill="none"
            stroke={C.charcoal} strokeWidth={3.5} strokeLinecap="round"
            pathLength={100} strokeDasharray={100} strokeDashoffset={100 - ringP * 100}
          />
        </svg>
      )}
      <div
        style={{
          position: "absolute", inset: 0, borderRadius: 14,
          background: pressed ? C.capFacePressed : C.capFace,
          border: `1.5px solid ${C.capEdge}`,
          boxShadow: pressed ? `0 1px 0 ${C.capShadow}` : `0 4px 0 ${C.capEdge}, 0 6px 10px ${C.capShadow}`,
          transform: `translateY(${ty}px)`,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          fontFamily: SANS, color: C.charcoal, gap: 2,
        }}
      >
        {label.symbol !== undefined && (
          <div style={{ fontSize: label.word ? 28 : 34, lineHeight: 1, fontWeight: 500 }}>{label.symbol}</div>
        )}
        {label.word && (
          <div style={{ fontSize: label.symbol !== undefined ? 15 : 22, lineHeight: 1.1, fontWeight: 600, letterSpacing: 0.2 }}>{label.word}</div>
        )}
      </div>
    </div>
  );
};

export const KeyCaps: React.FC<{ events: DocEvent[]; t: number; end: number; bottom: number }> = ({ events, t, end, bottom }) => {
  const groups = groupPresses(pairPresses(events, end));
  const g = groups.find((x) => t >= x.start - LEAD && t <= x.end + LINGER + (x.end - x.start < TAP_MAX ? 0.25 : 0));
  if (!g) return null;
  const tapOnly = g.end - g.start < TAP_MAX;
  const tail = LINGER + (tapOnly ? 0.25 : 0);
  const opacity = interpolate(t, [g.start - LEAD, g.start - LEAD + 0.15, g.end + tail - 0.2, g.end + tail], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const role = g.presses.find((p) => p.as)?.as;
  const keys = role
    ? [{ key: `role:${role}`, down: g.start, up: g.end }]
    : [...g.presses].sort((a, b) => order(a.key) - order(b.key) || a.down - b.down);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom, display: "flex", justifyContent: "center", opacity }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {keys.map((p, i) => (
          <React.Fragment key={p.key + i}>
            {i > 0 && <div style={{ fontFamily: SANS, fontSize: 30, fontWeight: 600, color: C.charcoalSoft, width: 18, textAlign: "center" }}>+</div>}
            <Cap press={p} t={t} />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
