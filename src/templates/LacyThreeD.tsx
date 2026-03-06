import React, { useMemo, useRef } from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  Sequence,
} from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { noise3D } from "@remotion/noise";
import { typography } from "../lib/brand";

// ─── 3D Scene: Floating grid of cubes that morph and pulse ───────

interface CubeGridProps {
  accentColor: string;
  accentColor2: string;
  progress: number;
}

const CubeGrid: React.FC<CubeGridProps> = ({
  accentColor,
  accentColor2,
  progress,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const GRID = 8;
  const SPACING = 1.6;

  const cubes = useMemo(() => {
    const items: { x: number; y: number; z: number; i: number }[] = [];
    for (let x = 0; x < GRID; x++) {
      for (let y = 0; y < GRID; y++) {
        items.push({
          x: (x - GRID / 2 + 0.5) * SPACING,
          y: (y - GRID / 2 + 0.5) * SPACING,
          z: 0,
          i: x * GRID + y,
        });
      }
    }
    return items;
  }, []);

  const color1 = useMemo(() => new THREE.Color(accentColor), [accentColor]);
  const color2 = useMemo(() => new THREE.Color(accentColor2), [accentColor2]);

  // Rotate the whole group
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.x = Math.sin(progress * Math.PI * 2) * 0.3 + 0.5;
      groupRef.current.rotation.y = progress * Math.PI * 2 * 0.3;
    }
  });

  return (
    <group ref={groupRef}>
      {cubes.map((cube) => {
        // Noise-driven displacement
        const n = noise3D("grid", cube.x * 0.3, cube.y * 0.3, progress * 3);
        const zOffset = n * 2.5;
        const scale = 0.3 + (n * 0.5 + 0.5) * 0.7;
        const colorMix = n * 0.5 + 0.5;
        const c = color1.clone().lerp(color2, colorMix);

        return (
          <mesh
            key={cube.i}
            position={[cube.x, cube.y, zOffset]}
            scale={[scale, scale, scale]}
          >
            <boxGeometry args={[0.8, 0.8, 0.8]} />
            <meshStandardMaterial
              color={c}
              emissive={c}
              emissiveIntensity={0.3 + n * 0.3}
              roughness={0.4}
              metalness={0.6}
              transparent
              opacity={0.7 + n * 0.3}
            />
          </mesh>
        );
      })}
    </group>
  );
};

// ─── Floating sphere with wireframe ──────────────────────────────

const PulsingSphere: React.FC<{ color: string; progress: number }> = ({
  color,
  progress,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const c = useMemo(() => new THREE.Color(color), [color]);

  useFrame(() => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(progress * Math.PI * 4) * 0.15;
      meshRef.current.scale.set(scale, scale, scale);
      meshRef.current.rotation.y = progress * Math.PI * 2;
      meshRef.current.rotation.x = Math.sin(progress * Math.PI) * 0.3;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <icosahedronGeometry args={[2.2, 3]} />
      <meshStandardMaterial
        color={c}
        emissive={c}
        emissiveIntensity={0.2}
        wireframe
        transparent
        opacity={0.6}
      />
    </mesh>
  );
};

// ─── Main Template ───────────────────────────────────────────────

interface LacyThreeDProps {
  accentColor: string;
  accentColor2: string;
  backgroundColor: string;
  /** "cubes" | "sphere" */
  scene?: "cubes" | "sphere";
}

export const LacyThreeD: React.FC<LacyThreeDProps> = ({
  accentColor = "#c084fc",
  accentColor2 = "#22c55e",
  backgroundColor = "#09090b",
  scene = "cubes",
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps, durationInFrames } = useVideoConfig();

  const progress = frame / durationInFrames;

  // Title fade
  const titleOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const titleY = interpolate(frame, [0, 35], [50, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Sub text
  const subOpacity = interpolate(frame, [20, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // CTA
  const ctaOpacity = interpolate(frame, [durationInFrames - 120, durationInFrames - 90], [0, 1], {
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
      {/* 3D canvas */}
      <ThreeCanvas
        width={width}
        height={height}
        style={{ position: "absolute", top: 0, left: 0 }}
        camera={{ position: [0, 0, 12], fov: 50 }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1} color={accentColor} />
        <pointLight position={[-10, -5, 5]} intensity={0.5} color={accentColor2} />

        {scene === "cubes" ? (
          <CubeGrid
            accentColor={accentColor}
            accentColor2={accentColor2}
            progress={progress}
          />
        ) : (
          <PulsingSphere color={accentColor} progress={progress} />
        )}
      </ThreeCanvas>

      {/* Text overlay — absolute positioned to prevent layout shift */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        {/* Title */}
        <div
          style={{
            position: "absolute",
            top: "35%",
            left: "50%",
            transform: `translate(-50%, -50%) translateY(${titleY}px)`,
            opacity: titleOpacity,
            fontSize: 72,
            fontFamily: typography.heading.family,
            fontStyle: "italic",
            color: "#fafafa",
            textShadow: `0 0 40px ${accentColor}60, 0 4px 20px rgba(0,0,0,0.8)`,
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          Lacy <span style={{ color: accentColor }}>Shell</span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            position: "absolute",
            top: "46%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            opacity: subOpacity,
            fontSize: 26,
            fontFamily: typography.body.family,
            color: "rgba(255,255,255,0.6)",
            textShadow: "0 2px 10px rgba(0,0,0,0.8)",
            whiteSpace: "nowrap",
          }}
        >
          Your terminal, upgraded with AI
        </div>

        {/* CTA */}
        <Sequence from={durationInFrames - 120} layout="none">
          <div
            style={{
              position: "absolute",
              bottom: 120,
              left: "50%",
              transform: "translateX(-50%)",
              opacity: ctaOpacity,
              padding: "14px 36px",
              borderRadius: 12,
              background: `${accentColor}20`,
              border: `1px solid ${accentColor}50`,
              boxShadow: `0 0 30px ${accentColor}30`,
              fontFamily: typography.body.family,
              fontSize: 20,
              color: accentColor,
              whiteSpace: "nowrap",
            }}
          >
            $ brew install lacymorrow/tap/lacy
          </div>
        </Sequence>
      </div>
    </div>
  );
};
