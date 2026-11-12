import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { cameraAt, cameraTransform, fitLayout } from "./camera";
import { ClickMark, FocusMark } from "./Spatial";
import { KeyCaps } from "./KeyCaps";
import { SpeechPill } from "./Speech";
import { bodyFrames, clipWindow, DocClipProps, FPS, HEIGHT, localEvents, WIDTH } from "./types";
import { C } from "./theme";

export const resolveSrc = (s: string) => (/^(https?:|file:|data:|blob:)/.test(s) ? s : staticFile(s));

export const docClipMetadata = ({ props }: { props: DocClipProps }) => ({
  durationInFrames: bodyFrames(props.data),
  fps: FPS,
  width: WIDTH,
  height: HEIGHT,
});

/** Screen recording plus overlays driven only by events.json. */
export const DocClip: React.FC<DocClipProps & { hudBottom?: number }> = ({ data, videoSrc, hudBottom = 40 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const t = frame / FPS;
  const L = fitLayout(W, H, data.screen.width, data.screen.height);
  const events = localEvents(data);
  const win = clipWindow(data);
  const cam = cameraAt(L, events, t);

  return (
    <AbsoluteFill style={{ background: C.cream, overflow: "hidden" }}>
      {/* camera layer: video + everything pinned to screen coordinates */}
      <AbsoluteFill style={{ transform: cameraTransform(L, cam), transformOrigin: "0 0" }}>
        <OffthreadVideo
          src={resolveSrc(videoSrc)}
          startFrom={Math.round(win.start * FPS)}
          muted
          style={{ position: "absolute", left: L.vx, top: L.vy, width: L.vw, height: L.vh }}
        />
        {events.map((e, i) =>
          e.type === "focus" ? <FocusMark key={i} focus={e} t={t} L={L} z={cam.z} /> : null,
        )}
        {events.map((e, i) =>
          e.type === "click" ? <ClickMark key={i} click={e} t={t} L={L} z={cam.z} /> : null,
        )}
      </AbsoluteFill>
      {/* HUD layer: fixed to the output frame, never zooms */}
      <SpeechStack events={events} t={t} frame={frame} bottom={hudBottom + 92} />
      <KeyCaps events={events} t={t} end={win.length} bottom={hudBottom} />
    </AbsoluteFill>
  );
};

const SpeechStack: React.FC<{ events: ReturnType<typeof localEvents>; t: number; frame: number; bottom: number }> = ({ events, t, frame, bottom }) => (
  <>
    {events.map((e, i) =>
      e.type === "speech" ? <SpeechPill key={i} speech={e} t={t} frame={frame} bottom={bottom} /> : null,
    )}
  </>
);
