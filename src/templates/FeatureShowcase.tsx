import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Easing,
  Sequence,
} from "remotion";
import { GradientBackground } from "../components/GradientBackground";
import { typography } from "../lib/brand";
import { AnimatedText } from "../components/AnimatedText";

interface Feature {
  title: string;
  description: string;
  icon: string;
}

interface FeatureShowcaseProps {
  productName: string;
  features: Feature[];
  brandColor: string;
  accentColor: string;
}

export const FeatureShowcase: React.FC<FeatureShowcaseProps> = ({
  productName,
  features,
  brandColor,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  // Each feature gets ~90 frames (3 seconds at 30fps)
  const FRAMES_PER_FEATURE = Math.floor((durationInFrames - 60) / features.length);
  const INTRO_FRAMES = 30;

  // Determine which feature is active
  const featureFrame = frame - INTRO_FRAMES;
  const activeIndex = Math.min(
    Math.floor(featureFrame / FRAMES_PER_FEATURE),
    features.length - 1
  );
  const localFrame = featureFrame - activeIndex * FRAMES_PER_FEATURE;

  // Intro fade
  const introOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Exit fade
  const exitOpacity = interpolate(
    frame,
    [durationInFrames - 20, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div style={{ position: "relative", width, height, overflow: "hidden", opacity: Math.min(introOpacity, exitOpacity) }}>
      <GradientBackground
        color1="#0a0a0a"
        color2={brandColor + "40"}
        color3="#0a0a0a"
        pattern="mesh"
      />

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 80,
          zIndex: 10,
        }}
      >
        {/* Header - product name at top */}
        <Sequence from={0} layout="none">
          <div style={{ position: "absolute", top: 80, left: 80 }}>
            <AnimatedText
              text={productName}
              animation="fadeUp"
              fontSize={32}
              color="rgba(255,255,255,0.5)"
              fontWeight={500}
            />
          </div>
        </Sequence>

        {/* Progress dots */}
        {frame >= INTRO_FRAMES && (
          <div style={{ display: "flex", gap: 12, marginBottom: 60 }}>
            {features.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === activeIndex ? 40 : 12,
                  height: 12,
                  borderRadius: 6,
                  background: i === activeIndex ? accentColor : "rgba(255,255,255,0.2)",
                }}
              />
            ))}
          </div>
        )}

        {/* Active feature card */}
        {frame >= INTRO_FRAMES && activeIndex >= 0 && activeIndex < features.length && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center" as const,
              maxWidth: 800,
            }}
          >
            {/* Icon */}
            <div
              style={{
                fontSize: 80,
                opacity: interpolate(localFrame, [0, 15], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
                transform: `scale(${spring({
                  frame: localFrame,
                  fps,
                  config: { damping: 10, stiffness: 150 },
                })})`,
              }}
            >
              {features[activeIndex].icon}
            </div>

            {/* Title */}
            <div
              style={{
                marginTop: 30,
                fontSize: 72,
                fontWeight: 800,
                color: "#ffffff",
                fontFamily: typography.body.family,
                letterSpacing: "-0.02em",
                opacity: interpolate(localFrame, [5, 25], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
                transform: `translateY(${interpolate(localFrame, [5, 25], [30, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.out(Easing.cubic),
                })}px)`,
              }}
            >
              {features[activeIndex].title}
            </div>

            {/* Description */}
            <div
              style={{
                marginTop: 20,
                fontSize: 32,
                color: "rgba(255,255,255,0.7)",
                fontFamily: typography.body.family,
                fontWeight: 400,
                maxWidth: 700,
                lineHeight: 1.5,
                opacity: interpolate(localFrame, [15, 35], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
                transform: `translateY(${interpolate(localFrame, [15, 35], [20, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.out(Easing.cubic),
                })}px)`,
              }}
            >
              {features[activeIndex].description}
            </div>

            {/* Accent line */}
            <div
              style={{
                marginTop: 40,
                height: 4,
                borderRadius: 2,
                background: accentColor,
                width: interpolate(localFrame, [10, 40], [0, 200], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.out(Easing.cubic),
                }),
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
