import React, { useMemo } from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  Sequence,
} from "remotion";
import { noise2D, noise3D } from "@remotion/noise";
import { typography } from "../lib/brand";

// ─── Canvas 2D Flow Field ────────────────────────────────────────
// Renders flowing lines that follow a Perlin noise vector field,
// creating organic, generative art patterns.

interface FlowLinePoint {
  x: number;
  y: number;
}

interface FlowLine {
  points: FlowLinePoint[];
  color: string;
  width: number;
  opacity: number;
}

interface LacyFlowFieldProps {
  accentColor: string;
  accentColor2: string;
  backgroundColor: string;
}

export const LacyFlowField: React.FC<LacyFlowFieldProps> = ({
  accentColor = "#c084fc",
  accentColor2 = "#22c55e",
  backgroundColor = "#09090b",
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps, durationInFrames } = useVideoConfig();

  const LINE_COUNT = 120;
  const STEPS_PER_LINE = 60;
  const NOISE_SCALE = 0.002;
  const STEP_SIZE = 4;

  const t = frame * 0.008;

  // Generate flow lines
  const lines = useMemo(() => {
    const result: FlowLine[] = [];
    for (let i = 0; i < LINE_COUNT; i++) {
      const startX = noise2D("sx", i * 0.7, t) * width * 0.5 + width * 0.5;
      const startY = noise2D("sy", t, i * 0.7) * height * 0.5 + height * 0.5;

      const points: FlowLinePoint[] = [{ x: startX, y: startY }];
      let x = startX;
      let y = startY;

      for (let s = 0; s < STEPS_PER_LINE; s++) {
        const angle = noise3D("flow", x * NOISE_SCALE, y * NOISE_SCALE, t) * Math.PI * 4;
        x += Math.cos(angle) * STEP_SIZE;
        y += Math.sin(angle) * STEP_SIZE;

        if (x < -50 || x > width + 50 || y < -50 || y > height + 50) break;
        points.push({ x, y });
      }

      const colorMix = noise2D("cm", i * 0.5, t * 2) * 0.5 + 0.5;
      result.push({
        points,
        color: colorMix > 0.5 ? accentColor : accentColor2,
        width: 1 + noise2D("lw", i * 0.3, 0) * 2,
        opacity: 0.15 + noise2D("lo", 0, i * 0.2) * 0.35 + 0.2,
      });
    }
    return result;
  }, [frame, width, height, accentColor, accentColor2]);

  // Progressive reveal: lines draw in over time
  const revealProgress = interpolate(frame, [0, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Title
  const TITLE_START = 30;
  const titleFrame = frame - TITLE_START;
  const titleOpacity = interpolate(titleFrame, [0, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const titleScale = interpolate(titleFrame, [0, 30], [0.9, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Features cycle
  const features = [
    { label: "Auto-detect", desc: "Shell or AI? Figured out instantly." },
    { label: "Smart Reroute", desc: "Typos become AI queries, not errors." },
    { label: "Preheated", desc: "Models warm before you type." },
    { label: "Any Agent", desc: "Claude, Gemini, Codex, or your own." },
  ];
  const FEATURE_START = 120;
  const FEATURE_DURATION = 75;
  const featureIndex = Math.min(
    Math.floor((frame - FEATURE_START) / FEATURE_DURATION),
    features.length - 1
  );
  const featureFrame = (frame - FEATURE_START) % FEATURE_DURATION;
  const featureOpacity = frame >= FEATURE_START
    ? interpolate(featureFrame, [0, 15, FEATURE_DURATION - 15, FEATURE_DURATION], [0, 1, 1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;
  const featureY = frame >= FEATURE_START
    ? interpolate(featureFrame, [0, 15], [20, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
      })
    : 20;

  // CTA
  const CTA_START = FEATURE_START + features.length * FEATURE_DURATION + 20;
  const ctaFrame = frame - CTA_START;
  const ctaOpacity = interpolate(ctaFrame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Exit
  const exitOpacity = interpolate(frame, [durationInFrames - 30, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

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
      {/* Flow field SVG */}
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <defs>
          <filter id="flow-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {lines.map((line, i) => {
          if (line.points.length < 2) return null;
          const visibleCount = Math.floor(line.points.length * revealProgress);
          const visiblePoints = line.points.slice(0, Math.max(2, visibleCount));
          const d =
            `M ${visiblePoints[0].x} ${visiblePoints[0].y} ` +
            visiblePoints
              .slice(1)
              .map((p) => `L ${p.x} ${p.y}`)
              .join(" ");
          return (
            <path
              key={i}
              d={d}
              fill="none"
              stroke={line.color}
              strokeWidth={line.width}
              opacity={line.opacity}
              strokeLinecap="round"
              filter="url(#flow-glow)"
            />
          );
        })}
      </svg>

      {/* Vignette overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: `radial-gradient(ellipse at center, transparent 30%, ${backgroundColor}ee 80%)`,
        }}
      />

      {/* Text content — absolute positioned to prevent layout shift */}
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
        {/* Title */}
        <div
          style={{
            position: "absolute",
            top: "25%",
            left: "50%",
            transform: `translate(-50%, -50%) scale(${titleFrame >= 0 ? titleScale : 0.9})`,
            opacity: titleFrame >= 0 ? titleOpacity : 0,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 84,
              fontFamily: typography.heading.family,
              fontStyle: "italic",
              color: "#fafafa",
              textShadow: `0 0 60px ${accentColor}40`,
              whiteSpace: "nowrap",
            }}
          >
            Lacy <span style={{ color: accentColor }}>Shell</span>
          </div>
          <div
            style={{
              fontSize: 24,
              fontFamily: typography.body.family,
              color: "rgba(255,255,255,0.5)",
              marginTop: 12,
            }}
          >
            The AI-native terminal
          </div>
        </div>

        {/* Feature cycle */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: `translate(-50%, -50%) translateY(${frame >= FEATURE_START ? featureY : 20}px)`,
            opacity: featureOpacity,
            textAlign: "center",
          }}
        >
          {frame >= FEATURE_START && featureIndex < features.length && (
            <>
              <div
                style={{
                  fontSize: 44,
                  fontFamily: typography.heading.family,
                  fontStyle: "italic",
                  color: accentColor2,
                }}
              >
                {features[featureIndex].label}
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontFamily: typography.body.family,
                  color: "rgba(255,255,255,0.5)",
                  marginTop: 8,
                }}
              >
                {features[featureIndex].desc}
              </div>
            </>
          )}
        </div>

        {/* CTA */}
        <div
          style={{
            position: "absolute",
            bottom: 100,
            left: "50%",
            transform: "translateX(-50%)",
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
              fontFamily: typography.body.family,
              fontSize: 20,
              color: accentColor,
            }}
          >
            $ npx lacy
          </div>
          <div
            style={{
              marginTop: 14,
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
