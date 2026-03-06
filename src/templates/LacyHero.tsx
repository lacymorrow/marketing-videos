import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
  Sequence,
} from "remotion";
import { noise2D } from "@remotion/noise";
import { ParticleField } from "../components/ParticleField";
import { TerminalWindow } from "../components/TerminalWindow";
import { typography } from "../lib/brand";

interface LacyHeroProps {
  accentColor: string;
  accentColor2: string;
  backgroundColor: string;
}

export const LacyHero: React.FC<LacyHeroProps> = ({
  accentColor = "#c084fc",
  accentColor2 = "#22c55e",
  backgroundColor = "#09090b",
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  // Scene phases
  const PARTICLE_START = 0;
  const TITLE_START = 20;
  const TERMINAL_START = 90;
  const CTA_START = 380;
  const FADE_OUT = durationInFrames - 40;

  // Exit fade
  const exitOpacity = interpolate(frame, [FADE_OUT, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Title animation
  const titleFrame = frame - TITLE_START;
  const titleOpacity = interpolate(titleFrame, [0, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const titleY = interpolate(titleFrame, [0, 30], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Subtitle
  const subFrame = titleFrame - 15;
  const subOpacity = interpolate(subFrame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Glowing accent line under title
  const lineWidth = interpolate(titleFrame, [10, 50], [0, 300], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Terminal slide up
  const termFrame = frame - TERMINAL_START;
  const termOpacity = interpolate(termFrame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const termY = interpolate(termFrame, [0, 25], [60, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // CTA
  const ctaFrame = frame - CTA_START;
  const ctaScale = spring({
    frame: ctaFrame,
    fps,
    config: { damping: 10, stiffness: 150 },
  });
  const ctaOpacity = interpolate(ctaFrame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Pulsing glow behind CTA
  const ctaGlow = Math.sin((frame - CTA_START) * 0.08) * 0.3 + 0.7;

  return (
    <div
      style={{
        width,
        height,
        background: backgroundColor,
        position: "relative",
        overflow: "hidden",
        opacity: exitOpacity,
      }}
    >
      {/* Particle field background */}
      <ParticleField
        count={100}
        color={accentColor}
        color2={accentColor2}
        sizeRange={[1, 3.5]}
        speed={0.006}
        opacityRange={[0.15, 0.6]}
        fadeInFrames={40}
        style="glow"
        connections={true}
        connectionDistance={130}
      />

      {/* Subtle radial gradient overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: `radial-gradient(ellipse at 50% 30%, ${accentColor}08 0%, transparent 70%)`,
        }}
      />

      {/* Content — absolute positioned elements to prevent layout shift */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 10,
        }}
      >
        {/* Title block — pinned at top region */}
        <div
          style={{
            position: "absolute",
            top: 80,
            left: 0,
            width: "100%",
            textAlign: "center",
            opacity: titleFrame >= 0 ? titleOpacity : 0,
            transform: `translateY(${titleFrame >= 0 ? titleY : 40}px)`,
          }}
        >
          <div
            style={{
              fontSize: 80,
              fontFamily: typography.heading.family,
              fontWeight: 400,
              color: "#fafafa",
              fontStyle: "italic",
              letterSpacing: "-0.01em",
            }}
          >
            Talk to your <em style={{ color: accentColor }}>shell</em>
          </div>
        </div>

        {/* Glowing accent line */}
        <div
          style={{
            position: "absolute",
            top: 178,
            left: "50%",
            transform: "translateX(-50%)",
            width: lineWidth,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
            boxShadow: `0 0 20px ${accentColor}60`,
            opacity: titleFrame >= 10 ? 1 : 0,
          }}
        />

        {/* Subtitle */}
        <div
          style={{
            position: "absolute",
            top: 196,
            left: "50%",
            transform: "translateX(-50%)",
            width: 600,
            textAlign: "center",
            opacity: subFrame >= 0 ? subOpacity : 0,
            fontSize: 22,
            fontFamily: typography.body.family,
            color: "rgba(255,255,255,0.5)",
            lineHeight: 1.6,
          }}
        >
          Commands run in your shell. Questions go to AI.
          <br />
          No prefixes. You type, it figures it out.
        </div>

        {/* Terminal demo */}
        <div
          style={{
            position: "absolute",
            top: 300,
            left: "50%",
            transform: `translateX(-50%) translateY(${termFrame >= 0 ? termY : 60}px)`,
            width: "80%",
            maxWidth: 800,
            opacity: termFrame >= 0 ? termOpacity : 0,
          }}
        >
          <TerminalWindow
            startFrame={0}
            title="lacy — zsh"
            accentColor={accentColor}
            typingSpeed={2}
            lines={[
              {
                command: "ls -la",
                tag: "shell",
                output: "drwxr-xr-x  12 user  staff  384 Feb 3 09:21 .",
                delay: 5,
              },
              {
                command: "what files are here",
                tag: "agent",
                output: "You have 12 files including package.json, src/, ...",
                delay: 20,
              },
              {
                command: "git status",
                tag: "shell",
                delay: 20,
              },
              {
                command: "fix the build error in src/index.ts",
                tag: "agent",
                delay: 15,
              },
              {
                command: "make sure the tests pass",
                tag: "reroute",
                output: "No rule for 'sure' → rerouting to AI...",
                delay: 20,
              },
            ]}
          />
        </div>

        {/* CTA */}
        <div
          style={{
            position: "absolute",
            bottom: 80,
            left: "50%",
            transform: `translateX(-50%) scale(${ctaFrame >= 0 ? ctaScale : 0})`,
            opacity: ctaFrame >= 0 ? ctaOpacity : 0,
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "14px 36px",
              borderRadius: 12,
              background: `${accentColor}15`,
              border: `1px solid ${accentColor}40`,
              boxShadow: `0 0 ${30 * ctaGlow}px ${accentColor}30`,
              fontFamily: typography.body.family,
              fontSize: 20,
              color: accentColor,
            }}
          >
            $ curl -fsSL lacy.sh/install | bash
          </div>
          <div
            style={{
              marginTop: 16,
              fontSize: 15,
              fontFamily: typography.body.family,
              color: "rgba(255,255,255,0.3)",
            }}
          >
            lacy.sh
          </div>
        </div>
      </div>
    </div>
  );
};
