import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

interface GradientBackgroundProps {
  color1?: string;
  color2?: string;
  color3?: string;
  animated?: boolean;
  pattern?: "mesh" | "radial" | "linear" | "noise";
  children?: React.ReactNode;
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
  color1 = "#0f0c29",
  color2 = "#302b63",
  color3 = "#24243e",
  animated = true,
  pattern = "mesh",
  children,
}) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  const angle = animated
    ? interpolate(frame, [0, durationInFrames], [135, 225], { extrapolateRight: "clamp" })
    : 135;

  const getBackground = () => {
    switch (pattern) {
      case "mesh":
        return {
          background: `
            radial-gradient(at 20% 20%, ${color1} 0px, transparent 50%),
            radial-gradient(at 80% 20%, ${color2} 0px, transparent 50%),
            radial-gradient(at 50% 80%, ${color3} 0px, transparent 50%),
            ${color1}
          `,
        };
      case "radial":
        return {
          background: `radial-gradient(ellipse at 50% 50%, ${color1}, ${color2}, ${color3})`,
        };
      case "linear":
        return {
          background: `linear-gradient(${angle}deg, ${color1}, ${color2}, ${color3})`,
        };
      case "noise":
        return {
          background: `linear-gradient(${angle}deg, ${color1}, ${color2})`,
        };
      default:
        return { background: color1 };
    }
  };

  return (
    <div
      style={{
        width,
        height,
        position: "absolute",
        top: 0,
        left: 0,
        ...getBackground(),
        overflow: "hidden",
      }}
    >
      {/* Animated floating orbs for depth */}
      {animated && (
        <>
          <div
            style={{
              position: "absolute",
              width: 400,
              height: 400,
              borderRadius: "50%",
              background: `${color2}30`,
              filter: "blur(80px)",
              left: interpolate(frame, [0, durationInFrames], [-100, width * 0.3]),
              top: interpolate(frame, [0, durationInFrames], [height * 0.2, height * 0.4]),
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 300,
              height: 300,
              borderRadius: "50%",
              background: `${color3}25`,
              filter: "blur(60px)",
              right: interpolate(frame, [0, durationInFrames], [-50, width * 0.2]),
              bottom: interpolate(frame, [0, durationInFrames], [height * 0.1, height * 0.3]),
            }}
          />
        </>
      )}
      {children}
    </div>
  );
};
