import { interpolate, spring, Easing } from "remotion";

/**
 * Shared animation utilities for marketing video templates.
 * Use these to keep motion consistent across all templates.
 */

// Fade in with optional slide
export const fadeIn = (
  frame: number,
  startFrame: number,
  duration: number = 20,
  options?: { direction?: "up" | "down" | "left" | "right"; distance?: number }
) => {
  const opacity = interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  let translateX = 0;
  let translateY = 0;
  const dist = options?.distance ?? 40;

  if (options?.direction) {
    const translate = interpolate(
      frame,
      [startFrame, startFrame + duration],
      [dist, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
    );

    switch (options.direction) {
      case "up": translateY = translate; break;
      case "down": translateY = -translate; break;
      case "left": translateX = translate; break;
      case "right": translateX = -translate; break;
    }
  }

  return { opacity, transform: `translate(${translateX}px, ${translateY}px)` };
};

// Fade out
export const fadeOut = (frame: number, startFrame: number, duration: number = 15) => {
  const opacity = interpolate(frame, [startFrame, startFrame + duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  return { opacity };
};

// Scale up with bounce (spring)
export const scaleIn = (frame: number, fps: number, delay: number = 0) => {
  const scale = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 200, mass: 0.5 },
  });
  return { transform: `scale(${scale})` };
};

// Typewriter / counter effect value
export const countUp = (
  frame: number,
  startFrame: number,
  endFrame: number,
  targetValue: number
) => {
  const progress = interpolate(frame, [startFrame, endFrame], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return Math.round(progress * targetValue);
};

// Gradient background shift
export const gradientShift = (
  frame: number,
  totalFrames: number,
  color1: string,
  color2: string
) => {
  const angle = interpolate(frame, [0, totalFrames], [135, 225], {
    extrapolateRight: "clamp",
  });
  return `linear-gradient(${angle}deg, ${color1}, ${color2})`;
};

// Stagger delay for lists
export const stagger = (index: number, baseDelay: number = 0, gap: number = 10) =>
  baseDelay + index * gap;

// Pulse glow effect
export const pulseGlow = (frame: number, fps: number, color: string, intensity: number = 20) => {
  const pulse = Math.sin((frame / fps) * Math.PI * 2) * 0.5 + 0.5;
  const size = intensity * pulse;
  return `0 0 ${size}px ${size / 2}px ${color}40`;
};
