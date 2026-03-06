import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Easing,
  Sequence,
  Img,
} from "remotion";
import { GradientBackground } from "../components/GradientBackground";
import { typography } from "../lib/brand";
import { AnimatedText } from "../components/AnimatedText";

interface Step {
  label: string;
  icon: string;
}

interface AppDemoProps {
  productName: string;
  tagline: string;
  screenshotUrl: string;
  steps: Step[];
  brandColor: string;
  accentColor: string;
}

export const AppDemo: React.FC<AppDemoProps> = ({
  productName,
  tagline,
  screenshotUrl,
  steps,
  brandColor,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  const INTRO_START = 0;
  const SCREENSHOT_START = 40;
  const STEPS_START = 120;
  const FADE_OUT = durationInFrames - 30;

  const globalOpacity = interpolate(
    frame,
    [FADE_OUT, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Mock screenshot (browser window frame) if no URL provided
  const renderMockScreen = () => {
    const screenScale = spring({
      frame: frame - SCREENSHOT_START,
      fps,
      config: { damping: 14, stiffness: 120 },
    });

    const screenOpacity = interpolate(
      frame - SCREENSHOT_START,
      [0, 20],
      [0, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    return (
      <div
        style={{
          opacity: screenOpacity,
          transform: `scale(${screenScale}) perspective(1200px) rotateY(-5deg)`,
          width: "100%",
          maxWidth: 900,
        }}
      >
        {/* Browser chrome */}
        <div
          style={{
            background: "#1e1e1e",
            borderRadius: "12px 12px 0 0",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f56" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ffbd2e" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#27c93f" }} />
          <div
            style={{
              flex: 1,
              marginLeft: 12,
              background: "#2d2d2d",
              borderRadius: 6,
              padding: "6px 12px",
              fontSize: 13,
              color: "rgba(255,255,255,0.4)",
              fontFamily: typography.body.family,
            }}
          >
            {productName.toLowerCase().replace(/\s+/g, "")}.com
          </div>
        </div>

        {/* Screen content */}
        <div
          style={{
            background: "#0f0f0f",
            borderRadius: "0 0 12px 12px",
            height: 400,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {screenshotUrl ? (
            <Img src={screenshotUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            /* Placeholder UI */
            <div style={{ padding: 40, width: "100%" }}>
              <div style={{ display: "flex", gap: 20, marginBottom: 24 }}>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: 80,
                      borderRadius: 8,
                      background: `linear-gradient(135deg, ${brandColor}20, ${accentColor}10)`,
                      border: `1px solid ${brandColor}20`,
                    }}
                  />
                ))}
              </div>
              <div
                style={{
                  height: 200,
                  borderRadius: 8,
                  background: `linear-gradient(135deg, ${brandColor}15, transparent)`,
                  border: `1px solid ${brandColor}15`,
                }}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: "relative", width, height, overflow: "hidden", opacity: globalOpacity }}>
      <GradientBackground
        color1="#050505"
        color2={brandColor + "15"}
        color3="#050505"
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
          alignItems: "center",
          padding: 80,
          zIndex: 10,
        }}
      >
        {/* Left side - text and steps */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            paddingRight: 60,
          }}
        >
          <Sequence from={INTRO_START} layout="none">
            <AnimatedText
              text={productName}
              animation="fadeUp"
              fontSize={56}
              color="#ffffff"
              fontWeight={800}
              style={{ letterSpacing: "-0.02em" }}
            />
          </Sequence>

          <Sequence from={INTRO_START + 10} layout="none">
            <AnimatedText
              text={tagline}
              animation="fadeUp"
              fontSize={24}
              color="rgba(255,255,255,0.6)"
              fontWeight={400}
              style={{ marginTop: 16 }}
            />
          </Sequence>

          {/* Steps */}
          <Sequence from={STEPS_START} layout="none">
            <div style={{ marginTop: 50, display: "flex", flexDirection: "column", gap: 24 }}>
              {steps.map((step, i) => {
                const delay = i * 20;
                const stepFrame = frame - STEPS_START - delay;

                const opacity = interpolate(stepFrame, [0, 20], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });
                const x = interpolate(stepFrame, [0, 20], [-30, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.out(Easing.cubic),
                });

                return (
                  <div
                    key={i}
                    style={{
                      opacity,
                      transform: `translateX(${x}px)`,
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: `${brandColor}20`,
                        border: `1px solid ${brandColor}30`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 24,
                      }}
                    >
                      {step.icon}
                    </div>
                    <div
                      style={{
                        fontSize: 22,
                        color: "rgba(255,255,255,0.8)",
                        fontWeight: 500,
                        fontFamily: typography.body.family,
                      }}
                    >
                      {step.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </Sequence>
        </div>

        {/* Right side - screenshot */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Sequence from={SCREENSHOT_START} layout="none">
            {renderMockScreen()}
          </Sequence>
        </div>
      </div>
    </div>
  );
};
