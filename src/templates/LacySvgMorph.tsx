import React, { useMemo } from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { noise2D, noise3D } from "@remotion/noise";
import { typography } from "../lib/brand";

// ─── SVG Path Animation Template ─────────────────────────────────
// Animated SVG paths: morphing shapes, circuit-board line draws,
// and pulsing node network.

interface LacySvgMorphProps {
  accentColor: string;
  accentColor2: string;
  backgroundColor: string;
}

// Generate a morphing blob path
function blobPath(
  cx: number,
  cy: number,
  baseR: number,
  points: number,
  frame: number,
  seed: string,
  speed: number = 0.02
): string {
  const t = frame * speed;
  const segments: string[] = [];

  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const noiseVal = noise3D(seed, Math.cos(angle) * 2, Math.sin(angle) * 2, t);
    const r = baseR + noiseVal * baseR * 0.4;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;

    if (i === 0) {
      segments.push(`M ${x} ${y}`);
    } else {
      // Bezier curves for smooth blobs
      const prevAngle = ((i - 1) / points) * Math.PI * 2;
      const prevNoise = noise3D(
        seed,
        Math.cos(prevAngle) * 2,
        Math.sin(prevAngle) * 2,
        t
      );
      const prevR = baseR + prevNoise * baseR * 0.4;
      const prevX = cx + Math.cos(prevAngle) * prevR;
      const prevY = cy + Math.sin(prevAngle) * prevR;

      const cpLen = baseR * 0.55;
      const cp1x = prevX + Math.cos(prevAngle + Math.PI / 2) * cpLen;
      const cp1y = prevY + Math.sin(prevAngle + Math.PI / 2) * cpLen;
      const cp2x = x + Math.cos(angle - Math.PI / 2) * cpLen;
      const cp2y = y + Math.sin(angle - Math.PI / 2) * cpLen;

      segments.push(`C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${x} ${y}`);
    }
  }
  segments.push("Z");
  return segments.join(" ");
}

// Generate circuit-style connecting lines
interface CircuitNode {
  x: number;
  y: number;
  connections: number[];
  pulseDelay: number;
}

export const LacySvgMorph: React.FC<LacySvgMorphProps> = ({
  accentColor = "#c084fc",
  accentColor2 = "#22c55e",
  backgroundColor = "#09090b",
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps, durationInFrames } = useVideoConfig();

  // ─── Circuit nodes ─────────────────────────────────────
  const NODE_COUNT = 24;
  const nodes = useMemo<CircuitNode[]>(() => {
    return Array.from({ length: NODE_COUNT }, (_, i) => {
      const x = (noise2D("nx", i * 0.7, 0) * 0.5 + 0.5) * width * 0.8 + width * 0.1;
      const y = (noise2D("ny", 0, i * 0.7) * 0.5 + 0.5) * height * 0.8 + height * 0.1;
      // Connect to 1-3 nearest-ish nodes
      const connections: number[] = [];
      for (let j = 0; j < NODE_COUNT; j++) {
        if (j === i) continue;
        if (connections.length >= 2) break;
        const chance = noise2D("nc", i * 0.3, j * 0.3);
        if (chance > 0) connections.push(j);
      }
      return { x, y, connections, pulseDelay: i * 8 };
    });
  }, [width, height]);

  // Line draw progress
  const lineProgress = interpolate(frame, [10, 80], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Node pulse
  const nodePulse = (delay: number) => {
    const f = frame - delay;
    if (f < 0) return 0;
    return interpolate(f % 60, [0, 10, 30, 60], [0, 1, 0.6, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  };

  // Blob morphing
  const blob1 = blobPath(width * 0.3, height * 0.4, 200, 12, frame, "b1", 0.015);
  const blob2 = blobPath(width * 0.7, height * 0.55, 160, 10, frame, "b2", 0.02);
  const blob3 = blobPath(width * 0.5, height * 0.3, 120, 8, frame, "b3", 0.025);

  const blobOpacity = interpolate(frame, [0, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Title
  const TITLE_START = 25;
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

  // Stats
  const stats = [
    { value: "0ms", label: "Configuration" },
    { value: "6+", label: "AI Tools" },
    { value: "1 Line", label: "Install" },
  ];
  const STATS_START = 100;

  // CTA
  const CTA_START = 280;
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
      {/* Background SVG layer */}
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <defs>
          <filter id="blob-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="40" />
          </filter>
          <filter id="node-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Morphing blobs (background ambient color) */}
        <g opacity={blobOpacity * 0.15} filter="url(#blob-blur)">
          <path d={blob1} fill={accentColor} />
          <path d={blob2} fill={accentColor2} />
          <path d={blob3} fill={accentColor} />
        </g>

        {/* Circuit connections */}
        {nodes.map((node, i) =>
          node.connections.map((j) => {
            const target = nodes[j];
            const dx = target.x - node.x;
            const dy = target.y - node.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const dashLen = len;
            const dashOffset = dashLen * (1 - lineProgress);

            return (
              <line
                key={`${i}-${j}`}
                x1={node.x}
                y1={node.y}
                x2={target.x}
                y2={target.y}
                stroke={accentColor}
                strokeWidth={1}
                opacity={0.2}
                strokeDasharray={dashLen}
                strokeDashoffset={dashOffset}
              />
            );
          })
        )}

        {/* Circuit nodes */}
        {nodes.map((node, i) => {
          const pulse = nodePulse(node.pulseDelay);
          return (
            <g key={i} filter="url(#node-glow)">
              <circle
                cx={node.x}
                cy={node.y}
                r={3 + pulse * 4}
                fill={i % 3 === 0 ? accentColor2 : accentColor}
                opacity={0.3 + pulse * 0.5}
              />
            </g>
          );
        })}
      </svg>

      {/* Content overlay — absolute positioned to prevent layout shift */}
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
            top: "28%",
            left: "50%",
            transform: `translate(-50%, -50%) translateY(${titleFrame >= 0 ? titleY : 40}px)`,
            opacity: titleFrame >= 0 ? titleOpacity : 0,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 76,
              fontFamily: typography.heading.family,
              fontStyle: "italic",
              color: "#fafafa",
              textShadow: `0 0 50px ${accentColor}50`,
              whiteSpace: "nowrap",
            }}
          >
            Lacy <span style={{ color: accentColor }}>Shell</span>
          </div>
          <div
            style={{
              fontSize: 22,
              fontFamily: typography.body.family,
              color: "rgba(255,255,255,0.45)",
              marginTop: 14,
            }}
          >
            Talk to your terminal. It understands.
          </div>
        </div>

        {/* Stats row */}
        <div
          style={{
            position: "absolute",
            top: "55%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            gap: 80,
          }}
        >
          {stats.map((stat, i) => {
            const statFrame = frame - STATS_START - i * 15;
            const statOpacity = interpolate(statFrame, [0, 15], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const statScale = spring({
              frame: statFrame,
              fps,
              config: { damping: 12, stiffness: 150 },
            });
            return (
              <div
                key={i}
                style={{
                  opacity: statOpacity,
                  transform: `scale(${statScale})`,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 48,
                    fontFamily: typography.heading.family,
                    fontStyle: "italic",
                    color: i % 2 === 0 ? accentColor : accentColor2,
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontFamily: typography.body.family,
                    color: "rgba(255,255,255,0.4)",
                    marginTop: 6,
                  }}
                >
                  {stat.label}
                </div>
              </div>
            );
          })}
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
            lacy.sh
          </div>
        </div>
      </div>
    </div>
  );
};
