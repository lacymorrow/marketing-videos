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

interface Stat {
  value: string;
  label: string;
}

interface Testimonial {
  quote: string;
  author: string;
  role: string;
}

interface SocialProofProps {
  productName: string;
  stats: Stat[];
  testimonial: Testimonial;
  brandColor: string;
}

export const SocialProof: React.FC<SocialProofProps> = ({
  productName,
  stats,
  testimonial,
  brandColor,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  const STATS_START = 20;
  const TESTIMONIAL_START = 120;
  const FADE_OUT = durationInFrames - 30;

  const globalOpacity = interpolate(
    frame,
    [FADE_OUT, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div style={{ position: "relative", width, height, overflow: "hidden", opacity: globalOpacity }}>
      <GradientBackground
        color1="#0a0a0a"
        color2="#111111"
        color3="#0a0a0a"
        pattern="linear"
        animated={false}
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
        {/* Product name */}
        <Sequence from={0} layout="none">
          <div
            style={{
              fontSize: 24,
              color: brandColor,
              fontWeight: 600,
              fontFamily: typography.body.family,
              letterSpacing: "0.1em",
              textTransform: "uppercase" as const,
              opacity: interpolate(frame, [0, 15], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            {productName}
          </div>
        </Sequence>

        {/* Stats row */}
        <Sequence from={STATS_START} layout="none">
          <div
            style={{
              display: "flex",
              gap: 80,
              marginTop: 60,
              marginBottom: 80,
              justifyContent: "center",
            }}
          >
            {stats.map((stat, i) => {
              const delay = i * 15;
              const statFrame = frame - STATS_START - delay;

              const scale = spring({
                frame: statFrame,
                fps,
                config: { damping: 12, stiffness: 180 },
              });

              const opacity = interpolate(statFrame, [0, 15], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });

              return (
                <div
                  key={i}
                  style={{
                    textAlign: "center" as const,
                    opacity,
                    transform: `scale(${Math.max(0, scale)})`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 72,
                      fontWeight: 800,
                      color: "#ffffff",
                      fontFamily: typography.body.family,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {stat.value}
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      color: "rgba(255,255,255,0.5)",
                      fontWeight: 500,
                      fontFamily: typography.body.family,
                      marginTop: 8,
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </Sequence>

        {/* Divider */}
        <Sequence from={TESTIMONIAL_START - 20} layout="none">
          <div
            style={{
              width: interpolate(
                frame - (TESTIMONIAL_START - 20),
                [0, 30],
                [0, 600],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
              ),
              height: 1,
              background: "rgba(255,255,255,0.1)",
            }}
          />
        </Sequence>

        {/* Testimonial */}
        <Sequence from={TESTIMONIAL_START} layout="none">
          <div
            style={{
              maxWidth: 800,
              textAlign: "center" as const,
              marginTop: 60,
            }}
          >
            {/* Quote mark */}
            <div
              style={{
                fontSize: 80,
                color: brandColor,
                fontFamily: "Georgia, serif",
                lineHeight: 0.5,
                opacity: interpolate(
                  frame - TESTIMONIAL_START,
                  [0, 15],
                  [0, 0.3],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                ),
              }}
            >
              &ldquo;
            </div>

            {/* Quote text */}
            <div
              style={{
                fontSize: 36,
                color: "rgba(255,255,255,0.9)",
                fontWeight: 400,
                fontFamily: typography.body.family,
                fontStyle: "italic" as const,
                lineHeight: 1.6,
                marginTop: 20,
                opacity: interpolate(
                  frame - TESTIMONIAL_START,
                  [5, 30],
                  [0, 1],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                ),
                transform: `translateY(${interpolate(
                  frame - TESTIMONIAL_START,
                  [5, 30],
                  [20, 0],
                  {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                    easing: Easing.out(Easing.cubic),
                  }
                )}px)`,
              }}
            >
              {testimonial.quote}
            </div>

            {/* Author */}
            <div
              style={{
                marginTop: 30,
                opacity: interpolate(
                  frame - TESTIMONIAL_START,
                  [20, 40],
                  [0, 1],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                ),
              }}
            >
              <div
                style={{
                  fontSize: 22,
                  color: "#ffffff",
                  fontWeight: 600,
                  fontFamily: typography.body.family,
                }}
              >
                {testimonial.author}
              </div>
              <div
                style={{
                  fontSize: 16,
                  color: "rgba(255,255,255,0.4)",
                  fontWeight: 400,
                  fontFamily: typography.body.family,
                  marginTop: 4,
                }}
              >
                {testimonial.role}
              </div>
            </div>
          </div>
        </Sequence>
      </div>
    </div>
  );
};
