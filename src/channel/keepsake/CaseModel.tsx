import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import React, { useEffect, useMemo, useState } from "react";
import { cancelRender, continueRender, delayRender, staticFile, useVideoConfig } from "remotion";
import { type BufferGeometry, EdgesGeometry } from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { theme } from "../theme";

// Loads one of Lacy's real case STLs (public/keepsake/case, not in git) and
// centres it. Millimetres are kept, so two models in one scene are to scale.
// Call this in the composition, outside <Stage>: delayRender belongs to the
// Remotion tree, not to the react-three-fiber one inside the canvas.
export const useStl = (file: string) => {
  const [geometry, setGeometry] = useState<BufferGeometry | null>(null);
  const [handle] = useState(() => delayRender(`stl ${file}`));
  useEffect(() => {
    fetch(staticFile(`keepsake/case/${file}`))
      .then((r) => {
        if (!r.ok) throw new Error(`${file}: HTTP ${r.status}`);
        return r.arrayBuffer();
      })
      .then((buf) => {
        const g = new STLLoader().parse(buf);
        g.computeVertexNormals();
        g.center();
        setGeometry(g);
      })
      .catch((err) => cancelRender(err));
  }, [file, handle]);
  // The render is released by <Model> once the mesh has actually been drawn.
  return { geometry, drawn: () => continueRender(handle) };
};

export type Stl = ReturnType<typeof useStl>;

interface ModelProps {
  stl: Stl;
  turn: number;
  x?: number;
}

// These were modelled face-up on the print bed, so Z already points at the
// viewer and the long axis is Y. No uprighting needed, only the turn.
export const Model: React.FC<ModelProps> = ({ stl, turn, x = 0 }) => {
  const { geometry, drawn } = stl;
  // ThreeCanvas only draws when the frame changes. A model that finishes
  // loading after that would stay invisible, so draw once more, then release.
  const advance = useThree((state) => state.advance);
  useEffect(() => {
    if (!geometry) return;
    advance(performance.now());
    drawn();
  }, [geometry, advance, drawn]);
  // Ink edges on a white body: the case is white on a paper background, so
  // the drawing has to carry the shape.
  const edges = useMemo(() => (geometry ? new EdgesGeometry(geometry, 28) : null), [geometry]);
  if (!geometry || !edges) return null;
  return (
    <group position={[x, 0, 0]} rotation={[0, turn, 0]}>
      <mesh geometry={geometry}>
        <meshStandardMaterial color="#ffffff" roughness={0.9} metalness={0} flatShading polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={theme.ink} />
      </lineSegments>
    </group>
  );
};

// mmWide: how many millimetres the frame spans left to right.
export const Stage: React.FC<{ mmWide: number; children: React.ReactNode }> = ({ mmWide, children }) => {
  const { width, height } = useVideoConfig();
  const mmHigh = (mmWide * height) / width;
  return (
    <ThreeCanvas width={width} height={height} orthographic camera={{ position: [0, 40, 300], zoom: width / mmWide, near: 1, far: 1000 }} style={{ background: theme.paper }}>
      <ambientLight intensity={1.35} />
      <directionalLight position={[120, 200, 260]} intensity={1.5} />
      <directionalLight position={[-200, 40, 120]} intensity={0.25} />
      <group position={[0, mmHigh * 0.02, 0]}>{children}</group>
    </ThreeCanvas>
  );
};
