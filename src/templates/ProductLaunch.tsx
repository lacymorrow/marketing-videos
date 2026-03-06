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
import { ParticleField } from "../components/ParticleField";
import { typography } from "../lib/brand";
import { AnimatedText } from "../components/AnimatedText";

interface ProductLaunchProps {
  productName: string;
  tagline: string;
  features: string[];
  ctaText: string;
  brandColor: string;
  accentColor: string;
  logoUrl: string;
  websiteUrl: string;
}

export const ProductLaunch: React.FC<ProductLaunchProps> = ({
  productName,
  tagline,
  features,
  ctaText,
  brandColor,
  accentColor,
  logoUrl,
  websiteUrl,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  // Scene timing (in frames at 30fps)
  const INTRO_START = 0;
  const TAGLINE_START = 30;
  const FEATURES_START = 90;
  const CTA_START = 210;
  const FADE_OUT = durationInFrames - 30;

  // Global fade out
  const globalOpacity = interpolate(
    frame,
    [FADE_OUT, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div style={{ position: "relative", width, height, overflow: "hidden", opacity: globalOpacity }}>
      <GradientBackground
        color1={brandColor}
        color2={accentColor}
        color3="#0a0a0a"
        pattern="mesh"
      />

      {/* Particle field overlay */}
      <ParticleField
        count={60}
        color={accentColor}
        color2={brandColor}
        sizeRange={[1, 3]}
        speed={0.005}
        opacityRange={[0.1, 0.4]}
        fadeInFrames={30}
        style="glow"
        connections={false}
      />

      {/* Content container */}
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
          padding: "80px",
          zIndex: 10,
        }}
      >
        {/* Product name */}
        <Sequence from={INTRO_START} layout="none">
          <AnimatedText
            text={productName}
            animation="scaleIn"
            fontSize={Math.min(96, width * 0.05)}
            color="#ffffff"
            fontWeight={800}
            style={{ letterSpacing: "-0.02em", textAlign: "center" }}
          />
        </Sequence>

        {/* Tagline */}
        <Sequence from={TAGLINE_START} layout="none">
          <AnimatedText
            text={tagline}
            animation="fadeUp"
            fontSize={Math.min(42, width * 0.022)}
            color="rgba(255,255,255,0.8)"
            fontWeight={400}
            style={{ marginTop: 20, textAlign: "center" }}
          />
        </Sequence>

        {/* Divider line */}
        <Sequence from={TAGLINE_START + 15} layout="none">
          <div
            style={{
              marginTop: 40,
              height: 2,
              background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
              width: interpolate(
                frame - (TAGLINE_START + 15),
                [0, 30],
                [0, Math.min(400, width * 0.3)],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
              ),
            }}
          />
        </Sequence>

        {/* Features */}
        <Sequence from={FEATURES_START} layout="none">
          <div
            style={{
              display: "flex",
              gap: Math.min(40, width * 0.03),
              marginTop: 60,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {features.map((feature, i) => {
              const delay = i * 12;
              const featureFrame = frame - FEATURES_START - delay;

              const opacity = interpolate(featureFrame, [0, 20], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              const scale = spring({
                frame: featureFrame,
                fps,
                config: { damping: 12, stiffness: 180 },
              });

              return (
                <div
                  key={i}
                  style={{
                    opacity,
                    transform: `scale(${Math.max(0, scale)})`,
                    background: "rgba(255,255,255,0.1)",
                    backdropFilter: "blur(10px)",
                    borderRadius: 16,
                    padding: "20px 32px",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "#ffffff",
                    fontSize: Math.min(22, width * 0.012),
                    fontFamily: typography.body.family,
                    fontWeight: 500,
                  }}
                >
                  {feature}
                </div>
              );
            })}
          </div>
        </Sequence>

        {/* CTA */}
        <Sequence from={CTA_START} layout="none">
          <div style={{ marginTop: 60 }}>
            <AnimatedText
              text={ctaText}
              animation="scaleIn"
              fontSize={Math.min(36, width * 0.019)}
              color="#ffffff"
              fontWeight={700}
              style={{
                background: accentColor,
                padding: "16px 48px",
                borderRadius: 50,
                display: "inline-block",
              }}
            />
          </div>
        </Sequence>

        {/* Website URL */}
        <Sequence from={CTA_START + 20} layout="none">
          <AnimatedText
            text={websiteUrl}
            animation="fadeUp"
            fontSize={Math.min(20, width * 0.011)}
            color="rgba(255,255,255,0.5)"
            fontWeight={400}
            style={{ marginTop: 20 }}
          />
        </Sequence>
      </div>
    </div>
  );
};
