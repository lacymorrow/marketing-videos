export type KeyId = string;
export type MouseButton = "left" | "right" | "middle" | "button4" | "button5";

export type DocEvent =
  | { t: number; type: "keydown" | "keyup"; key: KeyId; as?: "talk" | "dictation" }
  | { t: number; type: "speech"; text: string; duration: number }
  | { t: number; type: "click"; x: number; y: number; button: MouseButton }
  | { t: number; type: "focus"; x: number; y: number; w: number; h: number; label?: string; chip?: boolean; duration: number }
  | { t: number; type: "caption"; text: string; duration: number };

export interface DocClipData {
  slug: string;
  title: string;
  chapter?: number;
  video: string;
  screen: { width: number; height: number };
  duration: number;
  trim?: { start: number; end: number };
  events: DocEvent[];
}

export interface DocClipProps {
  data: DocClipData;
  /** http(s) URL, or a file name inside the Remotion public dir. */
  videoSrc: string;
}

export interface DocFilmProps extends DocClipProps {
  /** Optional voiceover (.aiff/.m4a), URL or public-dir file name. Starts with the body. */
  voiceSrc?: string;
}

export const FPS = 30;
export const WIDTH = 1280;
export const HEIGHT = 800;
export const OPENER_FRAMES = 45; // 1.5 s
export const END_FRAMES = 45; // 1.5 s

/** Clip window in source seconds. */
export const clipWindow = (d: DocClipData) => {
  const start = d.trim?.start ?? 0;
  const end = d.trim?.end ?? d.duration;
  return { start, end, length: Math.max(0.1, end - start) };
};

export const bodyFrames = (d: DocClipData) => Math.round(clipWindow(d).length * FPS);

/** Events shifted so t=0 is the start of the trimmed clip. */
export const localEvents = (d: DocClipData): DocEvent[] => {
  const s = clipWindow(d).start;
  return d.events.map((e) => ({ ...e, t: e.t - s }));
};
