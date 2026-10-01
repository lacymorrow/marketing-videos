import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { clamp, theme } from "./theme";

// 0 to 1 over `len` frames starting at `start`, on the house easing.
export const useRise = (start: number, len = 18) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [start, start + len], [0, 1], { ...clamp, easing: theme.ease });
};

interface CornerLabelProps {
  text: string;
  onPaper?: boolean;
}

// Small-caps provenance label: FROM THE LOG, NOT FILMED, RECREATED, STAGED AUDIO.
export const CornerLabel: React.FC<CornerLabelProps> = ({ text, onPaper = true }) => (
  <div
    style={{
      position: "absolute",
      left: 96,
      bottom: 88,
      padding: "14px 22px",
      fontFamily: theme.sans,
      fontWeight: 500,
      fontSize: 30,
      letterSpacing: 5,
      textTransform: "uppercase",
      color: onPaper ? theme.ink : theme.paper,
      background: onPaper ? theme.panel : theme.ink,
      border: `2px solid ${theme.ink}`,
    }}
  >
    {text}
  </div>
);
