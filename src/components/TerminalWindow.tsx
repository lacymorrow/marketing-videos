import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { typography } from "../lib/brand";

interface TerminalLine {
  prompt?: string;
  command: string;
  output?: string;
  /** "shell" | "agent" | "reroute" */
  tag?: string;
  /** Delay before this line appears (frames) */
  delay?: number;
}

interface TerminalWindowProps {
  lines: TerminalLine[];
  startFrame?: number;
  /** Typing speed in frames per character */
  typingSpeed?: number;
  /** Terminal title */
  title?: string;
  /** Width as CSS value */
  width?: string | number;
  accentColor?: string;
}

const TAG_COLORS: Record<string, string> = {
  shell: "#22c55e",
  agent: "#c084fc",
  reroute: "#f97316",
};

const BAR_COLORS: Record<string, string> = {
  shell: "#22c55e",
  agent: "#c084fc",
  reroute: "#ef4444",
};

export const TerminalWindow: React.FC<TerminalWindowProps> = ({
  lines,
  startFrame = 0,
  typingSpeed = 2,
  title = "Terminal",
  width = "100%",
  accentColor = "#c084fc",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const relFrame = frame - startFrame;

  if (relFrame < 0) return null;

  // Scale in
  const scale = spring({
    frame: relFrame,
    fps,
    config: { damping: 14, stiffness: 120 },
  });
  const opacity = interpolate(relFrame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Calculate cumulative delays
  let cumulativeFrame = 0;
  const lineTimings = lines.map((line) => {
    const start = cumulativeFrame + (line.delay ?? 15);
    const typeFrames = line.command.length * typingSpeed;
    const outputDelay = 8;
    cumulativeFrame = start + typeFrames + (line.output ? outputDelay + 10 : 5);
    return { start, typeFrames, outputDelay };
  });

  return (
    <div
      style={{
        opacity,
        transform: `scale(${scale})`,
        width,
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: `0 0 60px ${accentColor}15, 0 25px 50px rgba(0,0,0,0.5)`,
        border: `1px solid rgba(255,255,255,0.08)`,
      }}
    >
      {/* Title bar */}
      <div
        style={{
          background: "#1a1a1a",
          padding: "14px 20px",
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
            textAlign: "center",
            fontSize: 13,
            color: "rgba(255,255,255,0.35)",
            fontFamily: typography.body.family,
          }}
        >
          {title}
        </div>
      </div>

      {/* Terminal body */}
      <div
        style={{
          background: "#0a0a0a",
          padding: "24px 28px",
          minHeight: 200,
          fontFamily: typography.body.family,
          fontSize: 18,
          lineHeight: 1.8,
        }}
      >
        {lines.map((line, i) => {
          const timing = lineTimings[i];
          const lineFrame = relFrame - timing.start;
          if (lineFrame < 0) return null;

          // Characters typed so far
          const charsTyped = Math.min(
            Math.floor(lineFrame / typingSpeed),
            line.command.length
          );
          const typingDone = charsTyped >= line.command.length;
          const showOutput = typingDone && lineFrame > timing.typeFrames + timing.outputDelay;

          // Cursor blink
          const showCursor = !typingDone || (lineFrame % 20 < 10);

          return (
            <React.Fragment key={i}>
              {/* Command line */}
              <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                {/* Color bar */}
                <div
                  style={{
                    width: 3,
                    height: 24,
                    borderRadius: 2,
                    background: BAR_COLORS[line.tag ?? "shell"] ?? "#666",
                    marginRight: 12,
                    opacity: interpolate(lineFrame, [0, 5], [0, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    }),
                  }}
                />
                <span style={{ color: "rgba(255,255,255,0.3)", marginRight: 8 }}>
                  {line.prompt ?? ">"}
                </span>
                <span style={{ color: "#fafafa" }}>
                  {line.command.slice(0, charsTyped)}
                </span>
                {!typingDone && showCursor && (
                  <span
                    style={{
                      display: "inline-block",
                      width: 10,
                      height: 20,
                      background: accentColor,
                      marginLeft: 1,
                    }}
                  />
                )}
                {/* Tag */}
                {typingDone && line.tag && (
                  <span
                    style={{
                      marginLeft: 12,
                      fontSize: 12,
                      padding: "2px 8px",
                      borderRadius: 4,
                      background: `${TAG_COLORS[line.tag] ?? "#666"}20`,
                      color: TAG_COLORS[line.tag] ?? "#666",
                      fontWeight: 500,
                      opacity: interpolate(
                        lineFrame - timing.typeFrames,
                        [0, 8],
                        [0, 1],
                        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                      ),
                    }}
                  >
                    {line.tag}
                  </span>
                )}
              </div>

              {/* Output */}
              {showOutput && line.output && (
                <div
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    paddingLeft: 27,
                    opacity: interpolate(
                      lineFrame - timing.typeFrames - timing.outputDelay,
                      [0, 10],
                      [0, 1],
                      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                    ),
                  }}
                >
                  {line.output}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
