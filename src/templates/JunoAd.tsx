/**
 * JunoAd: one competitor claim, answered with real footage.
 *
 * Who: a Mac user scrolling X who has seen the Muse, dots and Grok Bot spots.
 * Where: X feed, muted autoplay. 16:9 and 9:16.
 * Beats (t, seconds): hook headline over frame 0 of the footage, footage plays
 * (the wait while Juno works is sped up), end card with the counter-claim.
 * Frame 0 is the real desktop with Juno's pill, never an empty frame.
 * Accent: system blue, on the word Juno only. Flat macOS look, no glow.
 * Data: docs/juno-ads-campaign.json. Rules: docs/MOTION-RULES.md.
 */
import React from "react";
import {
	AbsoluteFill,
	Easing,
	Img,
	OffthreadVideo,
	Sequence,
	interpolate,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from "remotion";
import campaign from "../../docs/juno-ads-campaign.json";

const ink = {
	bg: "#0b0b0c",
	text: "#f5f5f7",
	mute: "#98989d",
	chip: "rgba(28,28,30,0.92)",
	accent: "#0a84ff",
	sans: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', system-ui, sans-serif",
};

const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
const easeIn = Easing.bezier(0.6, 0, 0.9, 0.35);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

type Segment = [number, number, number]; // [fromSec, toSec, playbackRate]
type Camera = [number, number, number, number]; // [clipSec, cx, cy, zoom]
type Clip = {
	file: string;
	poster: string;
	camera: Camera[];
	spoken: string;
	spokenAt: number;
	resultAt: number;
	segments: Segment[];
};
export type Ad = {
	id: string;
	status: string;
	headline: string[];
	clip: string;
	subline: string;
};

export const FPS = 30;
export const HOOK_SEC = 3;
export const CARD_SEC = 3.6;

export const clips = campaign.clips as Record<string, Clip>;
export const ads = campaign.ads as Ad[];

/** Output seconds a clip occupies after the speed ramps. */
export function clipPlaySec(clip: Clip) {
	return clip.segments.reduce((s, [a, b, r]) => s + (b - a) / r, 0);
}
export function adDurationFrames(ad: Ad) {
	return Math.round((HOOK_SEC + clipPlaySec(clips[ad.clip]) + CARD_SEC - 1) * FPS);
}
/** Map a clip-time (s) to output seconds, through the ramps. */
function clipTimeToOut(clip: Clip, t: number) {
	let out = 0;
	for (const [a, b, r] of clip.segments) {
		if (t <= b) return out + Math.max(0, t - a) / r;
		out += (b - a) / r;
	}
	return out;
}

const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
const MOVE_SEC = 0.8;
/** Camera at an output time (s since footage start): eased moves between keyframes. */
function cameraAt(clip: Clip, outSec: number) {
	const keys = clip.camera.map(([t, cx, cy, z]) => ({ at: clipTimeToOut(clip, t), cx, cy, z }));
	let cur = keys[0];
	for (let i = 1; i < keys.length; i++) {
		const k = keys[i];
		if (outSec < k.at) break;
		const p = interpolate(outSec, [k.at, k.at + MOVE_SEC], [0, 1], { ...clamp, easing: easeInOut });
		cur = { at: k.at, cx: cur.cx + (k.cx - cur.cx) * p, cy: cur.cy + (k.cy - cur.cy) * p, z: cur.z + (k.z - cur.z) * p };
	}
	return cur;
}

const Words: React.FC<{ lines: string[]; frame: number; size: number; start: number; exitAt: number }> = ({
	lines,
	frame,
	size,
	start,
	exitAt,
}) => {
	let i = 0;
	const exit = interpolate(frame, [exitAt, exitAt + 0.4 * FPS], [1, 0], { ...clamp, easing: easeIn });
	return (
		<div style={{ opacity: exit, transform: `translateY(${(1 - exit) * -24}px)` }}>
			{lines.map((line, li) => (
				<div key={li} style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: `0 ${size * 0.26}px` }}>
					{line.split(" ").map((w, wi) => {
						const at = start + i++ * 0.09 * FPS;
						const p = interpolate(frame, [at, at + 0.8 * FPS], [0, 1], { ...clamp, easing: easeOut });
						const juno = w.replace(/[^A-Za-z]/g, "") === "Juno";
						return (
							<span
								key={wi}
								style={{
									display: "inline-block",
									opacity: p,
									transform: `translateY(${(1 - p) * 28}px)`,
									color: juno ? ink.accent : ink.text,
									fontFamily: ink.sans,
									fontWeight: 600,
									fontSize: size,
									letterSpacing: -size * 0.025,
									lineHeight: 1.08,
								}}
							>
								{w}
							</span>
						);
					})}
				</div>
			))}
		</div>
	);
};

export const JunoAd: React.FC<{ ad: Ad }> = ({ ad }) => {
	const frame = useCurrentFrame();
	const { width, height, durationInFrames } = useVideoConfig();
	const clip = clips[ad.clip];
	const portrait = height > width;

	// Footage box: full-bleed in 16:9, letterboxed band in 9:16.
	// 9:16 shows a taller centre crop (cover) so the pill and the app read on a phone.
	const vidW = width;
	const vidH = portrait ? 760 : Math.round((width * 9) / 16);
	const vidY = portrait ? Math.round(height * 0.5 - vidH * 0.5) : 0;
	// The clip is laid out at cover size inside the box, then the camera pans and zooms it.
	const inH = vidH;
	const inW = Math.round((vidH * 16) / 9);

	const hookEnd = HOOK_SEC * FPS;
	const footStart = hookEnd - Math.round(0.4 * FPS); // footage starts under the exiting headline
	const cam = cameraAt(clip, Math.max(0, frame - footStart) / FPS);
	const tx = Math.min(0, Math.max(vidW - inW * cam.z, vidW / 2 - cam.cx * inW * cam.z));
	const ty = Math.min(0, Math.max(vidH - inH * cam.z, vidH / 2 - cam.cy * inH * cam.z));
	const camStyle: React.CSSProperties = {
		position: "absolute",
		left: 0,
		top: 0,
		width: inW,
		height: inH,
		transform: `translate(${tx}px, ${ty}px) scale(${cam.z})`,
		transformOrigin: "0 0",
	};
	const cardStart = durationInFrames - Math.round(CARD_SEC * FPS);

	// Caption: the spoken line, from when Juno hears it until the result lands.
	const capIn = footStart + Math.round(clipTimeToOut(clip, clip.spokenAt) * FPS);
	const capOut = footStart + Math.round((clipTimeToOut(clip, clip.resultAt) - 0.3) * FPS);
	const cap = Math.min(
		interpolate(frame, [capIn, capIn + 0.6 * FPS], [0, 1], { ...clamp, easing: easeOut }),
		interpolate(frame, [capOut, capOut + 0.3 * FPS], [1, 0], { ...clamp, easing: easeIn }),
	);

	const scrim = interpolate(frame, [hookEnd - 0.4 * FPS, hookEnd], [0.62, 0], { ...clamp, easing: easeIn });
	const cardIn = interpolate(frame, [cardStart, cardStart + 0.8 * FPS], [0, 1], { ...clamp, easing: easeOut });

	const h = portrait ? 76 : 104;
	const edge = Math.round(width * 0.06);

	// Build the footage as consecutive sequences, one per speed segment.
	let cursor = footStart;
	const pieces = clip.segments.map(([a, b, r], i) => {
		const len = Math.round(((b - a) / r) * FPS);
		const el = (
			<Sequence key={i} from={cursor} durationInFrames={len} layout="none">
				<OffthreadVideo
					src={staticFile(clip.file)}
					startFrom={Math.round(a * FPS)}
					endAt={Math.round(b * FPS)}
					playbackRate={r}
					muted
					style={camStyle}
				/>
			</Sequence>
		);
		cursor += len;
		return el;
	});

	return (
		<AbsoluteFill style={{ background: ink.bg }}>
			{/* Frame 0 is the first frame of the footage, held until footage starts. */}
			<div style={{ position: "absolute", left: 0, top: vidY, width: vidW, height: vidH, overflow: "hidden", background: ink.bg }}>
				{frame < footStart + 1 && <Img src={staticFile(clip.poster)} style={camStyle} />}
				{pieces}
			</div>

			{/* Hook */}
			<AbsoluteFill style={{ background: `rgba(0,0,0,${scrim})` }} />
			{frame < hookEnd + 2 && (
				<AbsoluteFill
					style={{
						justifyContent: portrait ? "flex-start" : "center",
						alignItems: "center",
						padding: portrait ? `${Math.round(height * 0.16)}px ${edge}px 0` : `0 ${edge}px`,
						textAlign: "center",
					}}
				>
					<Words lines={ad.headline} frame={frame} size={h} start={Math.round(0.2 * FPS)} exitAt={hookEnd - 0.4 * FPS} />
				</AbsoluteFill>
			)}

			{/* Spoken line */}
			<div
				style={{
					position: "absolute",
					left: "50%",
					top: portrait ? vidY + vidH + 56 : height - 150,
					transform: `translateX(-50%) translateY(${(1 - cap) * 16}px)`,
					opacity: cap,
					width: "max-content",
					maxWidth: width - edge * 2,
					background: ink.chip,
					borderRadius: 18,
					padding: "18px 28px",
					display: "flex",
					alignItems: "center",
					gap: 16,
					fontFamily: ink.sans,
					fontSize: portrait ? 36 : 34,
					color: ink.text,
					lineHeight: 1.3,
				}}
			>
				<svg width="26" height="36" viewBox="0 0 26 36" fill="none" style={{ flex: "none" }}>
					<rect x="7" y="2" width="12" height="20" rx="6" fill={ink.accent} />
					<path d="M3 16c0 6 4.5 10 10 10s10-4 10-10" stroke={ink.accent} strokeWidth="2.5" strokeLinecap="round" />
					<path d="M13 26v7M8 33h10" stroke={ink.accent} strokeWidth="2.5" strokeLinecap="round" />
				</svg>
				<span>“{clip.spoken}”</span>
			</div>

			{/* End card */}
			<AbsoluteFill style={{ background: `rgba(11,11,12,${cardIn * 0.94})`, pointerEvents: "none" }} />
			<AbsoluteFill
				style={{
					opacity: cardIn,
					transform: `translateY(${(1 - cardIn) * 24}px)`,
					justifyContent: "center",
					alignItems: "center",
					padding: `0 ${edge}px`,
					textAlign: "center",
					gap: portrait ? 36 : 28,
				}}
			>
				<Img src={staticFile(campaign.brand.icon)} style={{ width: portrait ? 168 : 140, height: portrait ? 168 : 140 }} />
				<div style={{ fontFamily: ink.sans, fontWeight: 700, fontSize: portrait ? 96 : 92, color: ink.text, letterSpacing: -3, lineHeight: 1 }}>Juno</div>
				<div style={{ fontFamily: ink.sans, fontWeight: 500, fontSize: portrait ? 50 : 50, color: ink.text, letterSpacing: -1, lineHeight: 1.25, maxWidth: portrait ? 900 : 1300 }}>
					{ad.subline}
				</div>
				<div style={{ fontFamily: ink.sans, fontWeight: 500, fontSize: portrait ? 40 : 38, color: ink.accent, marginTop: 4 }}>
					{campaign.brand.cta} · {campaign.brand.site}
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
