import { Easing, interpolate } from "remotion";
import { DocEvent, FPS } from "./types";

export const ZOOM = 1.3;
export const ZOOM_EASE = 0.3; // seconds

export interface Layout {
  W: number;
  H: number;
  /** video rect inside the output frame */
  vx: number;
  vy: number;
  vw: number;
  vh: number;
  /** points -> output px */
  scale: number;
}

export const fitLayout = (W: number, H: number, sw: number, sh: number): Layout => {
  const scale = Math.min(W / sw, H / sh);
  const vw = sw * scale;
  const vh = sh * scale;
  return { W, H, vx: (W - vw) / 2, vy: (H - vh) / 2, vw, vh, scale };
};

export const toPx = (L: Layout, x: number, y: number) => ({ x: L.vx + x * L.scale, y: L.vy + y * L.scale });

const ease = Easing.inOut(Easing.cubic);

export interface Camera {
  z: number;
  /** source point (output px) shown at frame center */
  vcx: number;
  vcy: number;
}

/** Zoom envelope driven by focus events. Ease in 300 ms, hold, ease out 300 ms. */
export const cameraAt = (L: Layout, events: DocEvent[], t: number): Camera => {
  let best = 0;
  let target = { x: L.W / 2, y: L.H / 2 };
  for (const e of events) {
    if (e.type !== "focus") continue;
    const end = e.t + e.duration;
    const p = interpolate(t, [e.t, e.t + ZOOM_EASE, end, end + ZOOM_EASE], [0, 1, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: ease,
    });
    if (p > best) {
      best = p;
      target = toPx(L, e.x + e.w / 2, e.y + e.h / 2);
    }
  }
  const z = 1 + (ZOOM - 1) * best;
  // view center slides from frame center to the rect center
  let vcx = L.W / 2 + (target.x - L.W / 2) * best;
  let vcy = L.H / 2 + (target.y - L.H / 2) * best;
  // clamp so the visible window stays inside the video rect
  const hw = L.W / (2 * z);
  const hh = L.H / (2 * z);
  const clamp = (v: number, lo: number, hi: number) => (lo > hi ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v)));
  vcx = clamp(vcx, L.vx + hw, L.vx + L.vw - hw);
  vcy = clamp(vcy, L.vy + hh, L.vy + L.vh - hh);
  return { z, vcx, vcy };
};

export const cameraTransform = (L: Layout, c: Camera) =>
  `translate(${L.W / 2 - c.vcx * c.z}px, ${L.H / 2 - c.vcy * c.z}px) scale(${c.z})`;

export const secs = (frame: number) => frame / FPS;
