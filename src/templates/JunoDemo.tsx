/**
 * JunoDemo — Juno v4 "quiet craft" design
 * Shared component renders into 16:9, 9:16, and 1:1 canvases.
 * Caption data injected via props for the 9:16 cut.
 */
import React from "react";
import {
	AbsoluteFill,
	interpolate,
	useCurrentFrame,
	useVideoConfig,
	spring,
	Easing,
	Audio,
	staticFile,
} from "remotion";

// ─── Brand tokens ─────────────────────────────────────────────────

const JUNO = {
	bg: "#08090a",
	surface: "#111318",
	border: "#1e2330",
	accent: "#4f8ef7",    // blue-white highlight
	accentGlow: "rgba(79,142,247,0.15)",
	text: "#f0f2f7",
	textMuted: "#6b7280",
	textDim: "#9ca3af",
	mono: "'DM Mono', 'SF Mono', 'Fira Code', monospace",
	sans: "'DM Mono', system-ui, sans-serif",
};

// ─── Scene timing at 30fps ────────────────────────────────────────
// Total: ~1410 frames = 47s

const T = {
	HOOK:     { start: 0,    end: 150  },   // 5s  — hook + headline
	COMMAND:  { start: 120,  end: 360  },   // 8s  — command bar demo
	FEATURE1: { start: 330,  end: 510  },   // 6s  — "See" feature
	FEATURE2: { start: 480,  end: 660  },   // 6s  — "Act" feature
	FEATURE3: { start: 630,  end: 810  },   // 6s  — "Remember" feature
	DEMO:     { start: 780,  end: 1110 },   // 11s — demo card
	CTA:      { start: 1080, end: 1410 },   // 11s — CTA + watermark
};

// ─── Caption cue type ─────────────────────────────────────────────

export interface CaptionCue {
	startFrame: number;
	endFrame: number;
	text: string;
}

// ─── Props ────────────────────────────────────────────────────────

export interface JunoDemoProps {
	showCaptions?: boolean;
	captions?: CaptionCue[];
	watermark?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────

function fadeIn(frame: number, start: number, dur = 20) {
	return interpolate(frame, [start, start + dur], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
}

function slideUp(frame: number, start: number, dur = 24, dist = 32) {
	const t = interpolate(frame, [start, start + dur], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	return { opacity: 1 - t, transform: `translateY(${t * dist}px)` };
}

// ─── Sub-components ───────────────────────────────────────────────

const CommandBar: React.FC<{
	frame: number;
	width: number;
	text: string;
	subtext?: string;
}> = ({ frame, width, text, subtext }) => {
	const barWidth = Math.min(width * 0.83, 892);
	const cursor = Math.floor(frame / 15) % 2 === 0;

	return (
		<div
			style={{
				width: barWidth,
				background: JUNO.surface,
				border: `1px solid ${JUNO.border}`,
				borderRadius: 12,
				padding: "20px 28px",
				display: "flex",
				flexDirection: "column",
				gap: 8,
				boxShadow: `0 0 40px ${JUNO.accentGlow}, 0 2px 24px rgba(0,0,0,0.6)`,
			}}
		>
			<div
				style={{
					fontFamily: JUNO.mono,
					fontSize: Math.min(22, barWidth / 36),
					color: JUNO.text,
					letterSpacing: -0.3,
					display: "flex",
					alignItems: "center",
					gap: 2,
				}}
			>
				<span style={{ color: JUNO.accent, marginRight: 10 }}>›</span>
				{text}
				{cursor && (
					<span
						style={{
							display: "inline-block",
							width: 2,
							height: "1.1em",
							background: JUNO.accent,
							marginLeft: 2,
							verticalAlign: "middle",
						}}
					/>
				)}
			</div>
			{subtext && (
				<div
					style={{
						fontFamily: JUNO.mono,
						fontSize: Math.min(14, barWidth / 58),
						color: JUNO.textMuted,
					}}
				>
					{subtext}
				</div>
			)}
		</div>
	);
};

const FeatureCard: React.FC<{
	icon: string;
	title: string;
	desc: string;
	opacity: number;
	transform: string;
}> = ({ icon, title, desc, opacity, transform }) => (
	<div
		style={{
			background: JUNO.surface,
			border: `1px solid ${JUNO.border}`,
			borderRadius: 12,
			padding: "20px 24px",
			opacity,
			transform,
			minWidth: 200,
		}}
	>
		<div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
		<div
			style={{
				fontFamily: JUNO.mono,
				fontSize: 16,
				fontWeight: 500,
				color: JUNO.text,
				marginBottom: 6,
			}}
		>
			{title}
		</div>
		<div
			style={{
				fontFamily: JUNO.mono,
				fontSize: 13,
				color: JUNO.textMuted,
				lineHeight: 1.5,
			}}
		>
			{desc}
		</div>
	</div>
);

const Caption: React.FC<{ text: string; bottom: number }> = ({ text, bottom }) => (
	<div
		style={{
			position: "absolute",
			bottom,
			left: "50%",
			transform: "translateX(-50%)",
			background: "rgba(0,0,0,0.85)",
			color: JUNO.text,
			fontFamily: JUNO.mono,
			fontSize: 34,
			fontWeight: 500,
			padding: "12px 28px",
			borderRadius: 8,
			textAlign: "center",
			maxWidth: 900,
			lineHeight: 1.4,
			backdropFilter: "blur(4px)",
		}}
	>
		{text}
	</div>
);

// ─── Main component ───────────────────────────────────────────────

export const JunoDemo: React.FC<JunoDemoProps> = ({
	showCaptions = false,
	captions = [],
	watermark,
}) => {
	const frame = useCurrentFrame();
	const { width, height, fps } = useVideoConfig();

	const isVertical = height > width;
	const isSquare = height === width;
	const isLandscape = width > height;

	// Responsive sizing
	const headerFontSize = isVertical ? 52 : isSquare ? 46 : 64;
	const subFontSize = isVertical ? 22 : isSquare ? 18 : 26;
	const safePad = isVertical ? 60 : 80;

	// ── Scene: HOOK ──────────────────────────────────────────────
	const hookOpacity = interpolate(frame, [T.HOOK.start, T.HOOK.start + 30, T.HOOK.end - 20, T.HOOK.end], [0, 1, 1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	// Split headline into two lines for vertical
	const headline1 = "Your Mac.";
	const headline2 = "On autopilot.";

	// ── Scene: COMMAND ───────────────────────────────────────────
	const cmdOpacity = interpolate(frame, [T.COMMAND.start, T.COMMAND.start + 20, T.COMMAND.end - 20, T.COMMAND.end], [0, 1, 1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	// Typewriter effect for command text
	const fullCmd = "Sort my Downloads folder by project";
	const cmdLen = Math.floor(
		interpolate(frame, [T.COMMAND.start + 10, T.COMMAND.start + 80], [0, fullCmd.length], {
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
		})
	);
	const cmdText = fullCmd.slice(0, cmdLen);

	// Response appears after typing
	const responseOpacity = fadeIn(frame, T.COMMAND.start + 90, 20);

	// ── Features ─────────────────────────────────────────────────
	const features = [
		{ icon: "👁", title: "See", desc: "Screenshots, accessibility tree, live context", scene: T.FEATURE1 },
		{ icon: "⚡", title: "Act", desc: "Click, type, drag — any macOS UI natively", scene: T.FEATURE2 },
		{ icon: "🧠", title: "Remember", desc: "Cross-session memory, multi-agent orchestration", scene: T.FEATURE3 },
	];

	// ── Scene: DEMO ───────────────────────────────────────────────
	const demoOpacity = interpolate(frame, [T.DEMO.start, T.DEMO.start + 20, T.DEMO.end - 20, T.DEMO.end], [0, 1, 1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const demoSteps = [
		"📁 Scanned 847 files in ~/Downloads",
		"🗂 Grouped into 12 project folders",
		"✅ Moved 204 files — done in 3.2s",
	];

	const demoStepFrames = demoSteps.map((_, i) =>
		fadeIn(frame, T.DEMO.start + 40 + i * 50, 15)
	);

	// ── Scene: CTA ────────────────────────────────────────────────
	const ctaOpacity = interpolate(frame, [T.CTA.start, T.CTA.start + 30], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	// ── Active caption ────────────────────────────────────────────
	const activeCaption = captions.find(
		(c) => frame >= c.startFrame && frame < c.endFrame
	);

	// ── Ambient particles (subtle background life) ────────────────
	const particles = Array.from({ length: 6 }, (_, i) => {
		const x = (i * 17 + 7) % 100;
		const y = (i * 23 + 13) % 100;
		const drift = Math.sin((frame / fps) * 0.3 + i * 1.1) * 8;
		const opacity = 0.04 + Math.sin((frame / fps) * 0.5 + i) * 0.02;
		return { x, y: y + drift, opacity, size: 120 + i * 40 };
	});

	// ─────────────────────────────────────────────────────────────
	// RENDER
	// ─────────────────────────────────────────────────────────────

	return (
		<AbsoluteFill style={{ background: JUNO.bg, overflow: "hidden" }}>
			{/* Ambient glow orbs */}
			{particles.map((p, i) => (
				<div
					key={i}
					style={{
						position: "absolute",
						left: `${p.x}%`,
						top: `${p.y}%`,
						width: p.size,
						height: p.size,
						borderRadius: "50%",
						background: JUNO.accent,
						opacity: p.opacity,
						filter: "blur(60px)",
						transform: "translate(-50%, -50%)",
						pointerEvents: "none",
					}}
				/>
			))}

			{/* ── HOOK scene ─────────────────────────────────────── */}
			{frame < T.HOOK.end + 20 && (
				<div
					style={{
						position: "absolute",
						inset: 0,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						padding: safePad,
						opacity: hookOpacity,
						gap: isVertical ? 24 : 16,
					}}
				>
					{/* Logo mark */}
					<div
						style={{
							width: 56,
							height: 56,
							borderRadius: 14,
							background: JUNO.accent,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							marginBottom: 8,
							boxShadow: `0 0 32px ${JUNO.accentGlow}`,
						}}
					>
						<span style={{ fontSize: 28 }}>◎</span>
					</div>

					<div
						style={{
							fontFamily: JUNO.mono,
							fontSize: headerFontSize,
							fontWeight: 500,
							color: JUNO.text,
							textAlign: "center",
							letterSpacing: -1.5,
							lineHeight: 1.1,
						}}
					>
						{isVertical ? (
							<>
								<div>{headline1}</div>
								<div>{headline2}</div>
							</>
						) : (
							`${headline1} ${headline2}`
						)}
					</div>

					<div
						style={{
							fontFamily: JUNO.mono,
							fontSize: subFontSize,
							color: JUNO.textMuted,
							textAlign: "center",
							maxWidth: isVertical ? 600 : 800,
							lineHeight: 1.6,
						}}
					>
						AI agent for macOS — sees, acts, remembers.
					</div>
				</div>
			)}

			{/* ── COMMAND scene ──────────────────────────────────── */}
			{frame >= T.COMMAND.start && frame < T.COMMAND.end + 20 && (
				<div
					style={{
						position: "absolute",
						inset: 0,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						padding: safePad,
						opacity: cmdOpacity,
						gap: 32,
					}}
				>
					<div
						style={{
							fontFamily: JUNO.mono,
							fontSize: isVertical ? 28 : 20,
							color: JUNO.textMuted,
							textAlign: "center",
						}}
					>
						Just describe what you want.
					</div>

					<CommandBar
						frame={frame}
						width={width - safePad * 2}
						text={cmdText}
					/>

					{/* Response appears */}
					<div
						style={{
							opacity: responseOpacity,
							fontFamily: JUNO.mono,
							fontSize: isVertical ? 20 : 16,
							color: JUNO.textDim,
							textAlign: "center",
						}}
					>
						Juno will handle it — no script needed.
					</div>
				</div>
			)}

			{/* ── FEATURES scenes ────────────────────────────────── */}
			{features.map((f, i) => {
				const sc = f.scene;
				const opacity = interpolate(
					frame,
					[sc.start, sc.start + 20, sc.end - 20, sc.end],
					[0, 1, 1, 0],
					{ extrapolateLeft: "clamp", extrapolateRight: "clamp" }
				);
				if (opacity <= 0) return null;

				const { opacity: slideOp, transform } = slideUp(frame, sc.start, 24);

				if (isVertical) {
					// Stacked vertical layout
					return (
						<div
							key={i}
							style={{
								position: "absolute",
								inset: 0,
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								justifyContent: "center",
								padding: safePad,
								opacity,
								gap: 32,
							}}
						>
							<div style={{ fontSize: 80 }}>{f.icon}</div>
							<div
								style={{
									fontFamily: JUNO.mono,
									fontSize: 52,
									fontWeight: 500,
									color: JUNO.text,
									transform,
									opacity: slideOp,
								}}
							>
								{f.title}
							</div>
							<div
								style={{
									fontFamily: JUNO.mono,
									fontSize: 26,
									color: JUNO.textMuted,
									textAlign: "center",
									maxWidth: 700,
									lineHeight: 1.6,
									transform,
									opacity: slideOp,
								}}
							>
								{f.desc}
							</div>
						</div>
					);
				}

				// Landscape / square: card layout
				return (
					<div
						key={i}
						style={{
							position: "absolute",
							inset: 0,
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center",
							padding: safePad,
							opacity,
							gap: 24,
						}}
					>
						<div
							style={{
								fontFamily: JUNO.mono,
								fontSize: isSquare ? 36 : 44,
								fontWeight: 500,
								color: JUNO.text,
								transform,
								opacity: slideOp,
								display: "flex",
								alignItems: "center",
								gap: 16,
							}}
						>
							<span>{f.icon}</span> {f.title}
						</div>
						<div
							style={{
								fontFamily: JUNO.mono,
								fontSize: isSquare ? 20 : 24,
								color: JUNO.textMuted,
								textAlign: "center",
								maxWidth: isSquare ? 700 : 900,
								lineHeight: 1.6,
							}}
						>
							{f.desc}
						</div>
					</div>
				);
			})}

			{/* ── DEMO scene ─────────────────────────────────────── */}
			{frame >= T.DEMO.start && frame < T.DEMO.end + 20 && (
				<div
					style={{
						position: "absolute",
						inset: 0,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						padding: safePad,
						opacity: demoOpacity,
						gap: 32,
					}}
				>
					<div
						style={{
							fontFamily: JUNO.mono,
							fontSize: isVertical ? 28 : 22,
							color: JUNO.textMuted,
						}}
					>
						Watch it work.
					</div>

					{/* Demo terminal window */}
					<div
						style={{
							width: Math.min(width - safePad * 2, 900),
							background: JUNO.surface,
							border: `1px solid ${JUNO.border}`,
							borderRadius: 16,
							overflow: "hidden",
							boxShadow: "0 8px 64px rgba(0,0,0,0.6)",
						}}
					>
						{/* Window chrome */}
						<div
							style={{
								padding: "14px 20px",
								borderBottom: `1px solid ${JUNO.border}`,
								display: "flex",
								alignItems: "center",
								gap: 8,
							}}
						>
							{["#ff5f57", "#ffbd2e", "#28c840"].map((c, i) => (
								<div
									key={i}
									style={{
										width: 12,
										height: 12,
										borderRadius: "50%",
										background: c,
									}}
								/>
							))}
							<span
								style={{
									fontFamily: JUNO.mono,
									fontSize: 13,
									color: JUNO.textMuted,
									marginLeft: 8,
								}}
							>
								Juno — Running task
							</span>
						</div>

						{/* Output lines */}
						<div
							style={{
								padding: "20px 24px",
								display: "flex",
								flexDirection: "column",
								gap: 14,
								minHeight: isVertical ? 200 : 160,
							}}
						>
							{demoSteps.map((step, i) => (
								<div
									key={i}
									style={{
										fontFamily: JUNO.mono,
										fontSize: isVertical ? 22 : 16,
										color: i === 2 ? JUNO.accent : JUNO.textDim,
										opacity: demoStepFrames[i],
										display: "flex",
										alignItems: "center",
										gap: 8,
									}}
								>
									{step}
								</div>
							))}
						</div>
					</div>
				</div>
			)}

			{/* ── CTA scene ──────────────────────────────────────── */}
			{frame >= T.CTA.start && (
				<div
					style={{
						position: "absolute",
						inset: 0,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						padding: safePad,
						opacity: ctaOpacity,
						gap: isVertical ? 32 : 20,
					}}
				>
					<div
						style={{
							fontFamily: JUNO.mono,
							fontSize: isVertical ? 48 : isSquare ? 40 : 52,
							fontWeight: 500,
							color: JUNO.text,
							textAlign: "center",
							letterSpacing: -1,
						}}
					>
						Automate anything.
					</div>
					<div
						style={{
							fontFamily: JUNO.mono,
							fontSize: isVertical ? 22 : 18,
							color: JUNO.textMuted,
							textAlign: "center",
						}}
					>
						juno.build
					</div>

					{/* CTA button */}
					<div
						style={{
							background: JUNO.accent,
							color: JUNO.bg,
							fontFamily: JUNO.mono,
							fontSize: isVertical ? 24 : 18,
							fontWeight: 500,
							padding: isVertical ? "18px 48px" : "14px 36px",
							borderRadius: 10,
							marginTop: 8,
							boxShadow: `0 0 32px ${JUNO.accentGlow}`,
						}}
					>
						Download free beta →
					</div>
				</div>
			)}

			{/* ── Burned-in captions (9:16 only) ─────────────────── */}
			{showCaptions && activeCaption && (
				<Caption
					text={activeCaption.text}
					bottom={isVertical ? 220 : 100}
				/>
			)}

			{/* ── Watermark ─────────────────────────────────────── */}
			{watermark && (
				<div
					style={{
						position: "absolute",
						top: 24,
						right: 30,
						fontFamily: JUNO.mono,
						fontSize: 14,
						color: "rgba(255,255,255,0.25)",
						letterSpacing: 1,
					}}
				>
					{watermark}
				</div>
			)}
		</AbsoluteFill>
	);
};
