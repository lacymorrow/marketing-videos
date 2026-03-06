import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { noise2D, noise3D } from "@remotion/noise";

interface ParticleFieldProps {
  /** Number of particles */
  count?: number;
  /** Base color (hex) */
  color?: string;
  /** Secondary color for variety */
  color2?: string;
  /** Particle size range [min, max] */
  sizeRange?: [number, number];
  /** Speed multiplier */
  speed?: number;
  /** Noise scale (lower = smoother, larger patterns) */
  noiseScale?: number;
  /** Opacity range [min, max] */
  opacityRange?: [number, number];
  /** Fade in duration in frames */
  fadeInFrames?: number;
  /** Style: "dots" | "lines" | "glow" */
  style?: "dots" | "lines" | "glow";
  /** Connect nearby particles with lines */
  connections?: boolean;
  /** Max connection distance */
  connectionDistance?: number;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  seed: number;
  colorIndex: number;
}

export const ParticleField: React.FC<ParticleFieldProps> = ({
  count = 80,
  color = "#c084fc",
  color2 = "#22c55e",
  sizeRange = [1, 4],
  speed = 0.008,
  noiseScale = 0.003,
  opacityRange = [0.2, 0.8],
  fadeInFrames = 30,
  style = "glow",
  connections = true,
  connectionDistance = 120,
}) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  // Generate stable particle positions
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      x: noise2D("px", i * 0.1, 0) * 0.5 + 0.5,
      y: noise2D("py", 0, i * 0.1) * 0.5 + 0.5,
      size: noise2D("ps", i * 0.3, 0) * 0.5 + 0.5,
      seed: i,
      colorIndex: i % 3,
    }));
  }, [count]);

  // Global fade in
  const globalOpacity = interpolate(frame, [0, fadeInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Compute animated positions
  const animatedParticles = particles.map((p) => {
    const t = frame * speed;
    const nx = p.x * width + noise3D("mx", p.x * 2, p.y * 2, t) * 150;
    const ny = p.y * height + noise3D("my", p.x * 2 + 100, p.y * 2 + 100, t) * 150;
    const size =
      sizeRange[0] +
      p.size * (sizeRange[1] - sizeRange[0]) +
      noise3D("ms", p.seed * 0.1, 0, t) * 1.5;
    const opacity =
      opacityRange[0] +
      (noise3D("mo", p.seed * 0.2, 0, t) * 0.5 + 0.5) *
        (opacityRange[1] - opacityRange[0]);

    return { ...p, x: nx, y: ny, size: Math.max(0.5, size), opacity };
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width,
        height,
        overflow: "hidden",
        opacity: globalOpacity,
      }}
    >
      <svg width={width} height={height} xmlns="http://www.w3.org/2000/svg">
        <defs>
          {style === "glow" && (
            <filter id="particle-glow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )}
        </defs>

        {/* Connection lines */}
        {connections &&
          animatedParticles.map((p1, i) =>
            animatedParticles.slice(i + 1).map((p2, j) => {
              const dx = p1.x - p2.x;
              const dy = p1.y - p2.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist > connectionDistance) return null;
              const lineOpacity =
                (1 - dist / connectionDistance) * 0.15 * Math.min(p1.opacity, p2.opacity);
              return (
                <line
                  key={`${i}-${j}`}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={color}
                  strokeWidth={0.5}
                  opacity={lineOpacity}
                />
              );
            })
          )}

        {/* Particles */}
        {animatedParticles.map((p, i) => {
          const c = p.colorIndex === 0 ? color : p.colorIndex === 1 ? color2 : color;
          return (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={p.size}
              fill={c}
              opacity={p.opacity}
              filter={style === "glow" ? "url(#particle-glow)" : undefined}
            />
          );
        })}
      </svg>
    </div>
  );
};
