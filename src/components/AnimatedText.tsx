import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate, Easing } from "remotion";

interface AnimatedTextProps {
  text: string;
  startFrame?: number;
  style?: React.CSSProperties;
  animation?: "fadeUp" | "scaleIn" | "typewriter" | "words";
  fontSize?: number;
  color?: string;
  fontWeight?: number;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  startFrame = 0,
  style = {},
  animation = "fadeUp",
  fontSize = 64,
  color = "#ffffff",
  fontWeight = 700,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const relativeFrame = frame - startFrame;

  const baseStyle: React.CSSProperties = {
    fontSize,
    color,
    fontWeight,
    fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
    lineHeight: 1.2,
    ...style,
  };

  if (animation === "fadeUp") {
    const opacity = interpolate(relativeFrame, [0, 20], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
    const translateY = interpolate(relativeFrame, [0, 20], [30, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
    return (
      <div style={{ ...baseStyle, opacity, transform: `translateY(${translateY}px)` }}>
        {text}
      </div>
    );
  }

  if (animation === "scaleIn") {
    const scale = spring({ frame: relativeFrame, fps, config: { damping: 12, stiffness: 200 } });
    const opacity = interpolate(relativeFrame, [0, 10], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return (
      <div style={{ ...baseStyle, opacity, transform: `scale(${scale})` }}>
        {text}
      </div>
    );
  }

  if (animation === "typewriter") {
    const charsToShow = Math.floor(
      interpolate(relativeFrame, [0, text.length * 2], [0, text.length], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    );
    return (
      <div style={baseStyle}>
        {text.slice(0, charsToShow)}
        {charsToShow < text.length && (
          <span style={{ opacity: frame % 10 < 5 ? 1 : 0 }}>|</span>
        )}
      </div>
    );
  }

  if (animation === "words") {
    const words = text.split(" ");
    return (
      <div style={{ ...baseStyle, display: "flex", flexWrap: "wrap", gap: "0.3em" }}>
        {words.map((word, i) => {
          const delay = i * 5;
          const opacity = interpolate(relativeFrame - delay, [0, 15], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });
          const y = interpolate(relativeFrame - delay, [0, 15], [20, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });
          return (
            <span key={i} style={{ opacity, transform: `translateY(${y}px)`, display: "inline-block" }}>
              {word}
            </span>
          );
        })}
      </div>
    );
  }

  return <div style={baseStyle}>{text}</div>;
};
