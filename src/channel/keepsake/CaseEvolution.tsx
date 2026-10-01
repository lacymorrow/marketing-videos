import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { sec, theme } from "../theme";
import { Model, Stage, useStl } from "./CaseModel";

// G10. The jellyfish case, every exported iteration in order, from Lacy's own
// STL files. Dates are the export dates of the files.
export type CaseEvolutionProps = {
  steps: { file: string; date: string }[];
  perStep: number;
};

export const CaseEvolution: React.FC<CaseEvolutionProps> = ({ steps, perStep }) => {
  const frame = useCurrentFrame();
  const len = sec(perStep);
  const i = Math.min(steps.length - 1, Math.floor(frame / len));
  // One slow continuous sway across the whole graphic, never past three
  // quarters, so the face stays readable and cuts between iterations read as
  // the same object changing.
  const turn = Math.sin((frame / (steps.length * len)) * Math.PI * 2) * 0.7;
  return (
    <AbsoluteFill style={{ background: theme.paper }}>
      {steps.map((s, n) => (
        <Sequence key={s.file} from={n * len} durationInFrames={len} layout="none">
          <AbsoluteFill>
            <Step file={s.file} turn={turn} />
          </AbsoluteFill>
        </Sequence>
      ))}
      <div style={{ position: "absolute", left: 160, bottom: 150, fontFamily: theme.sans, color: theme.ink }}>
        <div style={{ fontSize: 34, letterSpacing: 6, color: theme.mute, textTransform: "uppercase", fontWeight: 500 }}>Case, iteration</div>
        <div style={{ fontSize: 150, fontWeight: 600, lineHeight: 1.1 }}>
          {i + 1}
          <span style={{ color: theme.mute, fontWeight: 400 }}> of {steps.length}</span>
        </div>
        <div style={{ fontFamily: theme.mono, fontSize: 34, color: theme.mute }}>{steps[i].date}</div>
      </div>
    </AbsoluteFill>
  );
};

const Step: React.FC<{ file: string; turn: number }> = ({ file, turn }) => {
  const stl = useStl(file);
  return (
    <Stage mmWide={230}>
      <Model stl={stl} turn={turn} />
    </Stage>
  );
};

// G11. Prototype one next to prototype two, to scale.
export const CaseScale: React.FC<{ one: string; two: string }> = ({ one, two }) => {
  const frame = useCurrentFrame();
  const turn = Math.sin(frame * 0.02) * 0.7;
  const a = useStl(one);
  const b = useStl(two);
  return (
    <AbsoluteFill style={{ background: theme.paper }}>
      <Stage mmWide={260}>
        <Model stl={a} turn={turn} x={-45} />
        <Model stl={b} turn={turn} x={45} />
      </Stage>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 140, display: "flex", justifyContent: "center", gap: 520, fontFamily: theme.sans, fontSize: 44, fontWeight: 600, color: theme.ink }}>
        <div style={{ width: 400, textAlign: "center" }}>
          one<div style={{ fontFamily: theme.mono, fontSize: 30, fontWeight: 400, color: theme.mute, marginTop: 10 }}>38 x 80 x 21 mm</div>
        </div>
        <div style={{ width: 400, textAlign: "center", color: theme.accent }}>
          two<div style={{ fontFamily: theme.mono, fontSize: 30, fontWeight: 400, color: theme.mute, marginTop: 10 }}>27 x 23 x 12 mm</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
