import { loadFont } from "@remotion/google-fonts/Poppins";
import { Easing } from "remotion";

const { fontFamily } = loadFont("normal", { weights: ["400", "500", "600"], subsets: ["latin"] });

// Channel graphics theme. One palette, one accent, one easing. Every channel
// scene imports this and nothing else for colour, type or motion.
// The look comes from the Keepsake case: white shell, black eyes, blue light.
export const theme = {
  paper: "#f6f5f1",
  ink: "#111214",
  mute: "#6f737b",
  rule: "#d3d2cc",
  panel: "#ffffff",
  accent: "#0a6cff",
  accentOnInk: "#5b9dff",
  sans: `${fontFamily}, system-ui, sans-serif`,
  mono: "ui-monospace, 'SF Mono', Menlo, monospace",
  ease: Easing.bezier(0.22, 1, 0.36, 1),
} as const;

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// All channel graphics are 1440p at 30 fps.
export const video = { width: 2560, height: 1440, fps: 30 } as const;

export const sec = (s: number) => Math.round(s * video.fps);
