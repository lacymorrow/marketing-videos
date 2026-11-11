import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { DocClip, resolveSrc } from "./DocClip";
import { bodyFrames, DocFilmProps, END_FRAMES, FPS, HEIGHT, localEvents, OPENER_FRAMES, WIDTH } from "./types";
import { C, SANS, SERIF } from "./theme";

export const docFilmMetadata = ({ props }: { props: DocFilmProps }) => ({
  durationInFrames: OPENER_FRAMES + bodyFrames(props.data) + END_FRAMES,
  fps: FPS,
  width: WIDTH,
  height: HEIGHT,
});

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Juno app icon, macOS squircle radius (22.37%). */
export const Mark: React.FC<{ size: number }> = ({ size }) => (
  <Img src={staticFile("docs-clips/juno-icon.png")} style={{ width: size, height: size, borderRadius: size * 0.2237, display: "block" }} />
);

const Opener: React.FC<{ title: string; chapter?: number }> = ({ title, chapter }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const appear = interpolate(t, [0, 0.5], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const rise = interpolate(t, [0.55, 1.1], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const cardO = interpolate(t, [0.7, 1.1], [0, 1], clamp);
  const cardY = interpolate(t, [0.7, 1.1], [14, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const out = interpolate(t, [1.35, 1.5], [1, 0], clamp);
  const size = 180;
  const label = chapter !== undefined ? `${String(chapter).padStart(2, "0")} · ${title}` : title;
  return (
    <AbsoluteFill style={{ background: C.cream, opacity: out, alignItems: "center", justifyContent: "center" }}>
      <div style={{
        position: "absolute", left: "50%", top: "50%", width: size, height: size,
        marginLeft: -size / 2, marginTop: -size / 2 - rise * 90,
        transform: `scale(${(0.9 + 0.1 * appear) * (1 - 0.3 * rise)})`, opacity: appear,
      }}>
        <Mark size={size} />
      </div>
      <div style={{
        position: "absolute", left: 0, right: 0, top: "50%", marginTop: 10, textAlign: "center",
        fontFamily: SERIF, fontSize: 64, color: C.charcoal, letterSpacing: -0.5,
        opacity: cardO, transform: `translateY(${cardY}px)`,
      }}>{label}</div>
    </AbsoluteFill>
  );
};

const EndCard: React.FC<{ slug: string }> = ({ slug }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const o = interpolate(t, [0, 0.3], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: C.cream, alignItems: "center", justifyContent: "center", opacity: o }}>
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <Mark size={84} />
        <div>
          <div style={{ fontFamily: SANS, fontSize: 24, color: C.charcoalSoft, marginBottom: 6 }}>Full steps at</div>
          <div style={{ fontFamily: SERIF, fontSize: 56, color: C.charcoal }}>junebug.ai/docs/{slug}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Captions: React.FC<{ props: DocFilmProps }> = ({ props }) => {
  const t = useCurrentFrame() / FPS;
  const cue = localEvents(props.data).find((e) => e.type === "caption" && t >= e.t && t < e.t + e.duration);
  if (!cue || cue.type !== "caption") return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 28, display: "flex", justifyContent: "center" }}>
      <div style={{
        padding: "10px 22px", borderRadius: 12, background: "rgba(44,44,44,0.9)", color: C.cream,
        fontFamily: SANS, fontSize: 30, fontWeight: 500, maxWidth: 1080, textAlign: "center", lineHeight: 1.25,
      }}>{cue.text}</div>
    </div>
  );
};

export const DocFilm: React.FC<DocFilmProps> = (props) => {
  const body = bodyFrames(props.data);
  return (
    <AbsoluteFill style={{ background: C.cream }}>
      <Sequence from={0} durationInFrames={OPENER_FRAMES}>
        <Opener title={props.data.title} chapter={props.data.chapter} />
      </Sequence>
      <Sequence from={OPENER_FRAMES} durationInFrames={body}>
        {/* HUD sits above the caption line in films */}
        <DocClip data={props.data} videoSrc={props.videoSrc} hudBottom={108} />
        <Captions props={props} />
        {props.voiceSrc ? <Audio src={resolveSrc(props.voiceSrc)} /> : null}
      </Sequence>
      <Sequence from={OPENER_FRAMES + body} durationInFrames={END_FRAMES}>
        <EndCard slug={props.data.slug} />
      </Sequence>
    </AbsoluteFill>
  );
};
