import React from "react";
import {
	useCurrentFrame,
	useVideoConfig,
	spring,
	interpolate,
	Easing,
	AbsoluteFill,
} from "remotion";

// ─── Scene timing at 30fps (total 900 frames = 30s) ──────────────

const T = {
	HOOK: { start: 0, end: 78 },
	BODY1: { start: 70, end: 160 },
	BODY2: { start: 152, end: 272 },
	BODY3: { start: 264, end: 354 },
	BODY4: { start: 346, end: 436 },
	PROOF: { start: 428, end: 548 },
	CTA: { start: 540, end: 900 },
};

// ─── SVG Crosshair Primitives ────────────────────────────────────

const BadCrosshair: React.FC<{ size: number }> = ({ size }) => (
	<svg width={size} height={size} viewBox="0 0 100 100">
		<line x1="0" y1="50" x2="100" y2="50" stroke="white" strokeWidth="10" />
		<line x1="50" y1="0" x2="50" y2="100" stroke="white" strokeWidth="10" />
	</svg>
);

const TinyCrosshair: React.FC<{ size: number }> = ({ size }) => (
	<svg width={size} height={size} viewBox="0 0 100 100">
		<circle cx="50" cy="50" r="2" fill="white" />
		<line x1="0" y1="50" x2="45" y2="50" stroke="white" strokeWidth="1" />
		<line x1="55" y1="50" x2="100" y2="50" stroke="white" strokeWidth="1" />
		<line x1="50" y1="0" x2="50" y2="45" stroke="white" strokeWidth="1" />
		<line x1="50" y1="55" x2="50" y2="100" stroke="white" strokeWidth="1" />
	</svg>
);

const BlockyCrosshair: React.FC<{ size: number }> = ({ size }) => (
	<svg width={size} height={size} viewBox="0 0 100 100">
		<rect x="38" y="0" width="24" height="38" fill="white" />
		<rect x="38" y="62" width="24" height="38" fill="white" />
		<rect x="0" y="38" width="38" height="24" fill="white" />
		<rect x="62" y="38" width="38" height="24" fill="white" />
	</svg>
);

const ProCrosshair: React.FC<{ size: number; color: string; opacity?: number }> = ({
	size,
	color,
	opacity = 1,
}) => (
	<svg width={size} height={size} viewBox="0 0 100 100" style={{ opacity }}>
		<line x1="0" y1="50" x2="40" y2="50" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
		<line x1="60" y1="50" x2="100" y2="50" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
		<line x1="50" y1="0" x2="50" y2="40" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
		<line x1="50" y1="60" x2="50" y2="100" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
		<circle cx="50" cy="50" r="3" fill={color} />
	</svg>
);

const DotSight: React.FC<{ size: number; color: string }> = ({ size, color }) => (
	<svg width={size} height={size} viewBox="0 0 100 100">
		<circle cx="50" cy="50" r="22" fill="none" stroke={color} strokeWidth="2.5" />
		<circle cx="50" cy="50" r="4" fill={color} />
		<line x1="28" y1="50" x2="5" y2="50" stroke={color} strokeWidth="2" />
		<line x1="72" y1="50" x2="95" y2="50" stroke={color} strokeWidth="2" />
		<line x1="50" y1="28" x2="50" y2="5" stroke={color} strokeWidth="2" />
		<line x1="50" y1="72" x2="50" y2="95" stroke={color} strokeWidth="2" />
	</svg>
);

const ChevronSight: React.FC<{ size: number; color: string }> = ({ size, color }) => (
	<svg width={size} height={size} viewBox="0 0 100 100">
		<polyline
			points="25,35 50,65 75,35"
			fill="none"
			stroke={color}
			strokeWidth="3.5"
			strokeLinejoin="round"
			strokeLinecap="round"
		/>
		<line x1="50" y1="65" x2="50" y2="85" stroke={color} strokeWidth="2" strokeLinecap="round" />
	</svg>
);

const TriangleSight: React.FC<{ size: number; color: string }> = ({ size, color }) => (
	<svg width={size} height={size} viewBox="0 0 100 100">
		<polygon points="50,10 90,85 10,85" fill="none" stroke={color} strokeWidth="3" />
		<circle cx="50" cy="55" r="4" fill={color} />
	</svg>
);

// ─── Scene wrapper with cross-fade ───────────────────────────────

const Scene: React.FC<{
	start: number;
	end: number;
	children: React.ReactNode;
}> = ({ start, end, children }) => {
	const frame = useCurrentFrame();
	const FADE = 8;

	const opacity = interpolate(
		frame,
		[start, start + FADE, end - FADE, end],
		[0, 1, 1, 0],
		{
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
			easing: Easing.inOut(Easing.cubic),
		}
	);

	// Note: children are always rendered (React evaluates JSX eagerly).
	// All scene-relative frame calculations inside must use Math.max(0, frame - start)
	// to avoid negative indices. Visibility is controlled by opacity only.
	return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

// ─── Main component ───────────────────────────────────────────────

export interface CrossOverPromoProps {
	accentColor?: string;
	backgroundColor?: string;
	ctaText?: string;
}

export const CrossOverPromo: React.FC<CrossOverPromoProps> = ({
	accentColor = "#ff3a3a",
	backgroundColor = "#080808",
}) => {
	const frame = useCurrentFrame();
	const { fps, width, height } = useVideoConfig();

	const isVertical = height > width * 1.1;
	const u = Math.min(width, height) / 1080;
	const pad = Math.min(width, height) * 0.075;
	const gap = (n: number) => Math.min(width, height) * n;

	const fs = {
		hook: gap(isVertical ? 0.072 : 0.06),
		body: gap(isVertical ? 0.052 : 0.044),
		bodySub: gap(isVertical ? 0.038 : 0.032),
		stat: gap(isVertical ? 0.1 : 0.085),
		statLabel: gap(isVertical ? 0.033 : 0.027),
		badge: gap(isVertical ? 0.038 : 0.032),
		cta: gap(isVertical ? 0.056 : 0.046),
		ctaSub: gap(isVertical ? 0.038 : 0.032),
		url: gap(isVertical ? 0.028 : 0.022),
	};

	const glowPulse = 0.5 + 0.5 * Math.sin(frame * 0.06);

	return (
		<AbsoluteFill
			style={{ backgroundColor, fontFamily: "'DM Mono', 'SF Mono', 'Fira Code', monospace" }}
		>
			{/* Ambient glow */}
			<AbsoluteFill
				style={{
					background: `radial-gradient(ellipse 60% 30% at 50% 110%, ${accentColor}${Math.round(
						(8 + glowPulse * 6) * 2.55
					)
						.toString(16)
						.padStart(2, "0")} 0%, transparent 100%)`,
					pointerEvents: "none",
				}}
			/>

			{/* Corner crosshair decoration */}
			<div
				style={{
					position: "absolute",
					top: pad * 0.6,
					right: pad * 0.6,
					opacity: interpolate(frame, [60, 90], [0, 0.12], {
						extrapolateLeft: "clamp",
						extrapolateRight: "clamp",
					}),
					pointerEvents: "none",
				}}
			>
				<ProCrosshair size={gap(0.1)} color={accentColor} />
			</div>

			{/* ══════════════════════════════════════════
			    SCENE 1 — HOOK
			    ══════════════════════════════════════════ */}
			<Scene start={T.HOOK.start} end={T.HOOK.end}>
				<AbsoluteFill>
					<AbsoluteFill
						style={{
							background: "radial-gradient(ellipse 80% 80% at 50% 50%, #1c0000 0%, #080808 75%)",
						}}
					/>
					<AbsoluteFill
						style={{
							backgroundImage:
								"repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.15) 3px, rgba(0,0,0,0.15) 4px)",
							pointerEvents: "none",
						}}
					/>

					{/* Bad crosshairs */}
					{(
						[
							{ x: 0.22, y: 0.28, size: 0.09, type: "bad", delay: 0 },
							{ x: 0.68, y: 0.22, size: 0.055, type: "tiny", delay: 3 },
							{ x: 0.15, y: 0.65, size: 0.11, type: "blocky", delay: 5 },
							{ x: 0.72, y: 0.65, size: 0.08, type: "bad", delay: 2 },
						] as Array<{ x: number; y: number; size: number; type: string; delay: number }>
					).map(({ x, y, size, type, delay }, i) => {
						const f = Math.max(0, frame - delay);
						const s = spring({ frame: f, fps, config: { damping: 10, stiffness: 280 } });
						const wobble = Math.sin(frame * 0.15 + i * 1.3) * 2.5;
						const sz = gap(size);
						return (
							<div
								key={i}
								style={{
									position: "absolute",
									left: width * x - sz / 2,
									top: height * y - sz / 2,
									transform: `scale(${Math.max(0, s)}) rotate(${wobble}deg)`,
									opacity: 0.65,
									filter: "blur(0.5px)",
								}}
							>
								{type === "bad" && <BadCrosshair size={sz} />}
								{type === "tiny" && <TinyCrosshair size={sz} />}
								{type === "blocky" && <BlockyCrosshair size={sz} />}
							</div>
						);
					})}

					{/* Red diagonal strike */}
					{(() => {
						const progress = interpolate(frame, [18, 45], [0, 1], {
							extrapolateLeft: "clamp",
							extrapolateRight: "clamp",
							easing: Easing.out(Easing.cubic),
						});
						return (
							<AbsoluteFill style={{ pointerEvents: "none" }}>
								<svg width={width} height={height} style={{ position: "absolute" }}>
									<line
										x1={width * 0.04}
										y1={height * 0.04}
										x2={width * 0.04 + width * 0.92 * progress}
										y2={height * 0.04 + height * 0.92 * progress}
										stroke={accentColor}
										strokeWidth={Math.max(2, 3 * u)}
										opacity={0.55}
										strokeLinecap="round"
									/>
								</svg>
							</AbsoluteFill>
						);
					})()}

					{/* Hook text */}
					<AbsoluteFill
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "flex-end",
							padding: `${pad}px`,
							paddingBottom: `${height * 0.1}px`,
						}}
					>
						{(() => {
							const f = Math.max(0, frame - 15);
							const s = spring({ frame: f, fps, config: { damping: 14, stiffness: 240 } });
							const opacity = interpolate(frame, [15, 30], [0, 1], {
								extrapolateLeft: "clamp",
								extrapolateRight: "clamp",
							});
							return (
								<div
									style={{
										fontSize: fs.hook,
										fontWeight: 800,
										color: "#ffffff",
										textAlign: "center",
										lineHeight: 1.2,
										letterSpacing: "-0.02em",
										transform: `scale(${Math.max(0, s)})`,
										opacity,
										textShadow: "0 2px 20px rgba(0,0,0,0.8)",
										maxWidth: width * 0.9,
									}}
								>
									"Your crosshair looks like it was drawn in{" "}
									<span style={{ color: accentColor }}>MS Paint.</span>"
								</div>
							);
						})()}
					</AbsoluteFill>
				</AbsoluteFill>
			</Scene>

			{/* ══════════════════════════════════════════
			    SCENE 2 — BODY 1
			    ══════════════════════════════════════════ */}
			<Scene start={T.BODY1.start} end={T.BODY1.end}>
				<AbsoluteFill
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						padding: `${pad}px`,
						gap: gap(0.06),
					}}
				>
					{(() => {
						const f = Math.max(0, frame - T.BODY1.start);
						const s = spring({ frame: f, fps, config: { damping: 16, stiffness: 200 } });
						const pulse = 0.85 + 0.15 * Math.sin(f * 0.12);
						const sz = gap(0.24);
						return (
							<div
								style={{
									transform: `scale(${Math.max(0, s)})`,
									filter: `drop-shadow(0 0 ${20 * pulse * u}px ${accentColor}) drop-shadow(0 0 ${40 * pulse * u}px ${accentColor}55)`,
								}}
							>
								<ProCrosshair size={sz} color={accentColor} />
							</div>
						);
					})()}

					{(() => {
						const f = Math.max(0, frame - T.BODY1.start - 12);
						const opacity = interpolate(f, [0, 20], [0, 1], {
							extrapolateLeft: "clamp",
							extrapolateRight: "clamp",
						});
						const y = interpolate(f, [0, 20], [24, 0], {
							extrapolateLeft: "clamp",
							extrapolateRight: "clamp",
							easing: Easing.out(Easing.cubic),
						});
						return (
							<div
								style={{
									fontSize: fs.body,
									fontWeight: 700,
									color: "#ffffff",
									textAlign: "center",
									lineHeight: 1.3,
									opacity,
									transform: `translateY(${y}px)`,
									maxWidth: width * 0.85,
									letterSpacing: "-0.01em",
								}}
							>
								One app. One crosshair.{" "}
								<span style={{ color: accentColor }}>Pinned to your screen</span>{" "}
								no matter what you're playing.
							</div>
						);
					})()}
				</AbsoluteFill>
			</Scene>

			{/* ══════════════════════════════════════════
			    SCENE 3 — BODY 2
			    ══════════════════════════════════════════ */}
			<Scene start={T.BODY2.start} end={T.BODY2.end}>
				<AbsoluteFill
					style={{
						display: "flex",
						flexDirection: isVertical ? "column" : "row",
						alignItems: "center",
						justifyContent: "center",
						padding: `${pad}px`,
						gap: gap(0.06),
					}}
				>
					{(() => {
						const f = Math.max(0, frame - T.BODY2.start);
						const crosshairs: Array<{ render: (sz: number) => React.ReactElement; label: string }> = [
							{ render: (sz) => <ProCrosshair size={sz} color={accentColor} />, label: "Classic" },
							{ render: (sz) => <DotSight size={sz} color="#44ff88" />, label: "Dot" },
							{ render: (sz) => <ChevronSight size={sz} color="#ffcc00" />, label: "Chevron" },
							{ render: (sz) => <TriangleSight size={sz} color="#bb88ff" />, label: "Triangle" },
						];
						const cardSz = gap(isVertical ? 0.22 : 0.14);
						const xhSz = cardSz * 0.55;
						const activeIdx = Math.floor(f / 40) % crosshairs.length;

						return (
							<div
								style={{
									display: "flex",
									flexDirection: isVertical ? "row" : "column",
									gap: cardSz * 0.18,
								}}
							>
								{crosshairs.map(({ render, label }, i) => {
									const delay = i * 8;
									const s = spring({
										frame: Math.max(0, f - delay),
										fps,
										config: { damping: 14, stiffness: 200 },
									});
									const isActive = activeIdx === i;
									return (
										<div
											key={i}
											style={{
												width: cardSz,
												height: cardSz,
												background: isActive ? "rgba(255,58,58,0.12)" : "rgba(255,255,255,0.04)",
												border: `${isActive ? 2 : 1}px solid ${
													isActive ? accentColor : "rgba(255,255,255,0.12)"
												}`,
												borderRadius: cardSz * 0.12,
												display: "flex",
												flexDirection: "column",
												alignItems: "center",
												justifyContent: "center",
												gap: cardSz * 0.1,
												transform: `scale(${Math.max(0, s)}) ${isActive ? "scale(1.05)" : ""}`,
												boxShadow: isActive ? `0 0 ${cardSz * 0.3}px ${accentColor}33` : "none",
											}}
										>
											{render(xhSz)}
											<span
												style={{
													fontSize: fs.statLabel * 0.85,
													color: isActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)",
													fontWeight: 600,
												}}
											>
												{label}
											</span>
										</div>
									);
								})}
							</div>
						);
					})()}

					{(() => {
						const f = Math.max(0, frame - T.BODY2.start - 18);
						const opacity = interpolate(f, [0, 20], [0, 1], {
							extrapolateLeft: "clamp",
							extrapolateRight: "clamp",
						});
						const y = interpolate(f, [0, 20], [24, 0], {
							extrapolateLeft: "clamp",
							extrapolateRight: "clamp",
							easing: Easing.out(Easing.cubic),
						});
						return (
							<div
								style={{
									fontSize: fs.body,
									fontWeight: 700,
									color: "#ffffff",
									textAlign: isVertical ? "center" : "left",
									lineHeight: 1.35,
									opacity,
									transform: `translateY(${y}px)`,
									maxWidth: isVertical ? width * 0.88 : width * 0.42,
								}}
							>
								Swap between real optics, dots, chevrons — or drag in{" "}
								<span style={{ color: accentColor }}>literally any image</span>.
								<br />
								<span style={{ color: "rgba(255,255,255,0.55)", fontSize: fs.bodySub }}>
									Your logo, a pizza emoji, whatever.
								</span>
							</div>
						);
					})()}
				</AbsoluteFill>
			</Scene>

			{/* ══════════════════════════════════════════
			    SCENE 4 — BODY 3: Game names
			    ══════════════════════════════════════════ */}
			<Scene start={T.BODY3.start} end={T.BODY3.end}>
				<AbsoluteFill
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						padding: `${pad}px`,
						gap: gap(0.045),
					}}
				>
					{(() => {
						const f = Math.max(0, frame - T.BODY3.start);
						const games: Array<{ name: string; color: string }> = [
							{ name: "VALORANT", color: "#ff4655" },
							{ name: "APEX LEGENDS", color: "#cd4b2e" },
							{ name: "CS2", color: "#fac23c" },
							{ name: "FORTNITE", color: "#00c8e6" },
							{ name: "OVERWATCH 2", color: "#f99e1a" },
							{ name: "R6 SIEGE", color: "#3298d1" },
						];
						// Safe modulo: always positive
						const rawIdx = Math.floor(f / 15);
						const idx = ((rawIdx % games.length) + games.length) % games.length;
						const { name, color } = games[idx];
						const flashF = f % 15;
						const gOpacity = interpolate(flashF, [0, 3, 12, 15], [0, 1, 1, 0], {
							extrapolateLeft: "clamp",
							extrapolateRight: "clamp",
						});
						return (
							<div
								style={{
									fontSize: fs.stat * 0.85,
									fontWeight: 900,
									color,
									opacity: gOpacity,
									letterSpacing: "0.08em",
									textShadow: `0 0 40px ${color}77`,
									lineHeight: 1,
									textAlign: "center",
								}}
							>
								{name}
							</div>
						);
					})()}

					{(() => {
						const f = Math.max(0, frame - T.BODY3.start);
						const s = spring({ frame: f, fps, config: { damping: 18, stiffness: 160 } });
						const sz = gap(0.14);
						return (
							<div
								style={{
									transform: `scale(${Math.max(0, s)})`,
									filter: `drop-shadow(0 0 ${16 * u}px ${accentColor}88)`,
								}}
							>
								<ProCrosshair size={sz} color={accentColor} />
							</div>
						);
					})()}

					{(() => {
						const f = Math.max(0, frame - T.BODY3.start - 10);
						const opacity = interpolate(f, [0, 20], [0, 1], {
							extrapolateLeft: "clamp",
							extrapolateRight: "clamp",
						});
						return (
							<div
								style={{
									fontSize: fs.body,
									fontWeight: 700,
									color: "#ffffff",
									textAlign: "center",
									lineHeight: 1.3,
									opacity,
									maxWidth: width * 0.85,
								}}
							>
								Same crosshair across{" "}
								<span style={{ color: accentColor }}>every game</span>.
								<br />
								<span style={{ color: "rgba(255,255,255,0.5)", fontSize: fs.bodySub }}>
									Even the ones with garbage defaults.
								</span>
							</div>
						);
					})()}
				</AbsoluteFill>
			</Scene>

			{/* ══════════════════════════════════════════
			    SCENE 5 — BODY 4: Customization
			    ══════════════════════════════════════════ */}
			<Scene start={T.BODY4.start} end={T.BODY4.end}>
				<AbsoluteFill
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						padding: `${pad}px`,
						gap: gap(0.05),
					}}
				>
					{(() => {
						const f = Math.max(0, frame - T.BODY4.start);
						const colors = [accentColor, "#ff69b4", "#00ff88", "#00d4ff", "#ffcc00", "#ffffff"];
						const activeIdx = ((Math.floor(f / 22) % colors.length) + colors.length) % colors.length;
						const activeColor = colors[activeIdx];
						const dotSz = gap(0.048);
						const xhSz = gap(0.16);

						return (
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
									gap: gap(0.03),
								}}
							>
								<div style={{ filter: `drop-shadow(0 0 ${20 * u}px ${activeColor}aa)` }}>
									<ProCrosshair size={xhSz} color={activeColor} />
								</div>

								<div style={{ display: "flex", gap: dotSz * 0.4, alignItems: "center" }}>
									{colors.map((c, i) => {
										const delay = i * 6;
										const s = spring({
											frame: Math.max(0, f - delay),
											fps,
											config: { damping: 12, stiffness: 220 },
										});
										const isActive = activeIdx === i;
										return (
											<div
												key={i}
												style={{
													width: dotSz * (isActive ? 1.35 : 1),
													height: dotSz * (isActive ? 1.35 : 1),
													borderRadius: "50%",
													background: c,
													transform: `scale(${Math.max(0, s)})`,
													boxShadow: isActive ? `0 0 ${dotSz}px ${c}` : "none",
												}}
											/>
										);
									})}
								</div>
							</div>
						);
					})()}

					{(() => {
						const f = Math.max(0, frame - T.BODY4.start - 10);
						const opacity = interpolate(f, [0, 18], [0, 1], {
							extrapolateLeft: "clamp",
							extrapolateRight: "clamp",
						});
						return (
							<div
								style={{
									fontSize: fs.body,
									fontWeight: 700,
									color: "#ffffff",
									textAlign: "center",
									lineHeight: 1.35,
									opacity,
									maxWidth: width * 0.85,
								}}
							>
								Make it bigger. Make it <span style={{ color: "#ff69b4" }}>pink</span>.
								<br />
								Colorblind? <span style={{ color: "#00ff88" }}>Sorted.</span>
								<br />
								<span style={{ color: accentColor }}>Windows, Mac, Linux.</span>{" "}
								<span style={{ color: "rgba(255,255,255,0.5)", fontSize: fs.bodySub }}>
									All of them.
								</span>
							</div>
						);
					})()}

					{(() => {
						const f = Math.max(0, frame - T.BODY4.start - 35);
						const platforms = ["WINDOWS", "MACOS", "LINUX"];
						return (
							<div style={{ display: "flex", gap: gap(0.025) }}>
								{platforms.map((p, i) => {
									const delay = i * 10;
									const s = spring({
										frame: Math.max(0, f - delay),
										fps,
										config: { damping: 14, stiffness: 200 },
									});
									const opacity = interpolate(Math.max(0, f - delay), [0, 15], [0, 1], {
										extrapolateLeft: "clamp",
										extrapolateRight: "clamp",
									});
									return (
										<div
											key={i}
											style={{
												fontSize: fs.statLabel,
												color: "rgba(255,255,255,0.65)",
												fontWeight: 600,
												letterSpacing: "0.1em",
												opacity,
												transform: `scale(${Math.max(0, s)})`,
												border: "1px solid rgba(255,255,255,0.18)",
												padding: `${gap(0.012)}px ${gap(0.024)}px`,
												borderRadius: gap(0.012),
											}}
										>
											{p}
										</div>
									);
								})}
							</div>
						);
					})()}
				</AbsoluteFill>
			</Scene>

			{/* ══════════════════════════════════════════
			    SCENE 6 — PROOF BEAT
			    ══════════════════════════════════════════ */}
			<Scene start={T.PROOF.start} end={T.PROOF.end}>
				<AbsoluteFill
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						padding: `${pad}px`,
						gap: gap(0.045),
					}}
				>
					{(() => {
						const f = Math.max(0, frame - T.PROOF.start);
						const starSz = gap(0.062);
						return (
							<div style={{ display: "flex", gap: starSz * 0.18, alignItems: "center" }}>
								{[0, 1, 2, 3, 4].map((i) => {
									const s = spring({
										frame: Math.max(0, f - i * 6),
										fps,
										config: { damping: 10, stiffness: 280 },
									});
									return (
										<div
											key={i}
											style={{
												fontSize: starSz,
												transform: `scale(${Math.max(0, s)})`,
												lineHeight: 1,
												color: "#ffd700",
												textShadow: `0 0 ${starSz * 0.5}px #ffd70088`,
											}}
										>
											★
										</div>
									);
								})}
							</div>
						);
					})()}

					{(() => {
						const f = Math.max(0, frame - T.PROOF.start - 18);
						const stats = [
							{ value: "4.8", label: "stars" },
							{ value: "217K", label: "monthly users" },
							{ value: "530+", label: "crosshairs" },
						];
						return (
							<div
								style={{
									display: "flex",
									flexDirection: isVertical ? "column" : "row",
									gap: gap(isVertical ? 0.04 : 0.07),
									alignItems: "center",
								}}
							>
								{stats.map(({ value, label }, i) => {
									const delay = i * 14;
									const s = spring({
										frame: Math.max(0, f - delay),
										fps,
										config: { damping: 12, stiffness: 200 },
									});
									const opacity = interpolate(Math.max(0, f - delay), [0, 15], [0, 1], {
										extrapolateLeft: "clamp",
										extrapolateRight: "clamp",
									});
									return (
										<div
											key={i}
											style={{
												textAlign: "center",
												opacity,
												transform: `scale(${Math.max(0, s)})`,
											}}
										>
											<div
												style={{
													fontSize: fs.stat,
													fontWeight: 900,
													color: accentColor,
													lineHeight: 1,
													letterSpacing: "-0.02em",
												}}
											>
												{value}
											</div>
											<div
												style={{
													fontSize: fs.statLabel,
													color: "rgba(255,255,255,0.45)",
													fontWeight: 500,
													marginTop: gap(0.01),
													letterSpacing: "0.04em",
												}}
											>
												{label}
											</div>
										</div>
									);
								})}
							</div>
						);
					})()}

					{(() => {
						const f = Math.max(0, frame - T.PROOF.start - 48);
						const opacity = interpolate(f, [0, 20], [0, 1], {
							extrapolateLeft: "clamp",
							extrapolateRight: "clamp",
						});
						const badges: Array<{ text: string; color: string; border: string }> = [
							{ text: "Free.", color: "#ffffff", border: "rgba(255,255,255,0.15)" },
							{ text: "Open source.", color: "#ffffff", border: "rgba(255,255,255,0.15)" },
							{ text: "Not bannable.", color: "#22c55e", border: "rgba(34,197,94,0.35)" },
						];
						return (
							<div
								style={{
									display: "flex",
									gap: gap(0.02),
									flexWrap: "wrap",
									justifyContent: "center",
									opacity,
								}}
							>
								{badges.map(({ text, color, border }, i) => (
									<div
										key={i}
										style={{
											fontSize: fs.badge,
											fontWeight: 700,
											color,
											background: "rgba(255,255,255,0.05)",
											border: `1px solid ${border}`,
											padding: `${gap(0.013)}px ${gap(0.026)}px`,
											borderRadius: gap(0.012),
										}}
									>
										{text}
									</div>
								))}
							</div>
						);
					})()}
				</AbsoluteFill>
			</Scene>

			{/* ══════════════════════════════════════════
			    SCENE 7 — CTA
			    ══════════════════════════════════════════ */}
			<Scene start={T.CTA.start} end={T.CTA.end}>
				<AbsoluteFill
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						padding: `${pad}px`,
						gap: gap(0.055),
					}}
				>
					{(() => {
						const f = Math.max(0, frame - T.CTA.start);
						const s = spring({ frame: f, fps, config: { damping: 13, stiffness: 180 } });
						const sz = gap(0.19);
						return (
							<div
								style={{
									transform: `scale(${Math.max(0, s)})`,
									textAlign: "center",
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
									gap: gap(0.025),
								}}
							>
								<div style={{ filter: `drop-shadow(0 0 ${24 * u}px ${accentColor}88)` }}>
									<ProCrosshair size={sz * 0.55} color={accentColor} />
								</div>
								<div
									style={{
										fontSize: sz * 0.46,
										fontWeight: 900,
										color: "#ffffff",
										letterSpacing: "0.12em",
										textTransform: "uppercase" as const,
									}}
								>
									CROSSOVER
								</div>
							</div>
						);
					})()}

					{(() => {
						const f = Math.max(0, frame - T.CTA.start - 22);
						const opacity = interpolate(f, [0, 20], [0, 1], {
							extrapolateLeft: "clamp",
							extrapolateRight: "clamp",
						});
						const y = interpolate(f, [0, 20], [22, 0], {
							extrapolateLeft: "clamp",
							extrapolateRight: "clamp",
							easing: Easing.out(Easing.cubic),
						});
						return (
							<div
								style={{
									fontSize: fs.cta,
									fontWeight: 700,
									color: "#ffffff",
									textAlign: "center",
									lineHeight: 1.4,
									opacity,
									transform: `translateY(${y}px)`,
									maxWidth: width * 0.85,
								}}
							>
								Search <span style={{ color: accentColor }}>'CrossOver'</span>
								<br />
								Microsoft Store or GitHub.
								<br />
								<span style={{ color: "rgba(255,255,255,0.5)", fontSize: fs.ctaSub }}>
									It's free. It's always been free.
								</span>
							</div>
						);
					})()}

					{(() => {
						const f = Math.max(0, frame - T.CTA.start - 50);
						const s = spring({ frame: f, fps, config: { damping: 14, stiffness: 200 } });
						const opacity = interpolate(f, [0, 15], [0, 1], {
							extrapolateLeft: "clamp",
							extrapolateRight: "clamp",
						});
						return (
							<div
								style={{
									fontSize: fs.url,
									color: "rgba(255,255,255,0.4)",
									fontFamily: "'DM Mono', monospace",
									letterSpacing: "0.04em",
									opacity,
									transform: `scale(${Math.max(0, s)})`,
									background: "rgba(255,255,255,0.04)",
									border: "1px solid rgba(255,255,255,0.1)",
									padding: `${gap(0.014)}px ${gap(0.028)}px`,
									borderRadius: gap(0.018),
								}}
							>
								github.com/lacymorrow/crossover
							</div>
						);
					})()}
				</AbsoluteFill>
			</Scene>
		</AbsoluteFill>
	);
};
