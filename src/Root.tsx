import { Composition } from "remotion";
import { ProductLaunch } from "./templates/ProductLaunch";
import { FeatureShowcase } from "./templates/FeatureShowcase";
import { SocialProof } from "./templates/SocialProof";
import { AppDemo } from "./templates/AppDemo";
import { LacyHero } from "./templates/LacyHero";
import { LacyThreeD } from "./templates/LacyThreeD";
import { LacyFlowField } from "./templates/LacyFlowField";
import { LacySvgMorph } from "./templates/LacySvgMorph";
import { CrossOverPromo } from "./templates/CrossOverPromo";
import { JunoDemo, type CaptionCue } from "./templates/JunoDemo";
import { palettes, brands, typography } from "./lib/brand";

// ─── Lacy Shell ──────────────────────────────────────────────────
const lacy = brands.lacy;

const lacyLaunchDefaults = {
  productName: "Lacy Shell",
  tagline: "Talk to your terminal with AI",
  features: ["Auto-detect routing", "Smart reroute", "Zero config"],
  ctaText: "curl -fsSL lacy.sh/install | bash",
  brandColor: lacy.palette.primary,
  accentColor: lacy.palette.accent,
  logoUrl: "",
  websiteUrl: "lacy.sh",
  fontFamily: typography.heading.family,
  bodyFontFamily: typography.body.family,
};

const lacyFeaturesDefaults = {
  productName: "Lacy Shell",
  features: [
    {
      title: "Auto-Detect",
      description: "Commands run in your shell. Questions go to AI. No prefixes needed.",
      icon: "⚡",
    },
    {
      title: "Smart Reroute",
      description: "Ambiguous input? Tries the shell first. If it fails, reroutes to AI automatically.",
      icon: "🔀",
    },
    {
      title: "Live Indicator",
      description: "Green means shell. Magenta means AI. You always know what will happen.",
      icon: "🟢",
    },
    {
      title: "Preheated",
      description: "Background servers eliminate cold-start. Your AI is ready before you finish typing.",
      icon: "🔥",
    },
  ],
  brandColor: lacy.palette.primary,
  accentColor: lacy.palette.accent,
};

const lacySocialDefaults = {
  productName: "Lacy Shell",
  stats: [
    { value: "0ms", label: "Config Required" },
    { value: "6+", label: "AI Tools Supported" },
    { value: "1 line", label: "Install" },
  ],
  testimonial: {
    quote: "Type commands or natural language. It figures it out.",
    author: "lacy.sh",
    role: "Your terminal, upgraded",
  },
  brandColor: lacy.palette.accent,
};

const lacyDemoDefaults = {
  productName: "Lacy Shell",
  tagline: "Commands run. Questions route.",
  screenshotUrl: "",
  steps: [
    { label: "Install in one command", icon: "📦" },
    { label: "Pick your AI tool", icon: "🤖" },
    { label: "Just start typing", icon: "⌨️" },
  ],
  brandColor: lacy.palette.primary,
  accentColor: lacy.palette.accent,
};

// ─── Juno Demo ───────────────────────────────────────────────────
// Caption cues for 9:16 cut (burned-in, muted autoplay).
// Timings match scene boundaries in JunoDemo.tsx (30fps).
const junoCaptions: CaptionCue[] = [
  { startFrame: 20,  endFrame: 90,  text: "Your Mac. On autopilot." },
  { startFrame: 90,  endFrame: 148, text: "AI agent for macOS." },
  { startFrame: 130, endFrame: 220, text: "Just describe what you want." },
  { startFrame: 220, endFrame: 358, text: "\"Sort my Downloads folder by project\"" },
  { startFrame: 330, endFrame: 508, text: "See — screenshots, live context." },
  { startFrame: 480, endFrame: 658, text: "Act — click, type, drag natively." },
  { startFrame: 630, endFrame: 808, text: "Remember — cross-session memory." },
  { startFrame: 780, endFrame: 900, text: "Watch it work." },
  { startFrame: 900, endFrame: 1108, text: "Sorted 847 files in 3 seconds." },
  { startFrame: 1080, endFrame: 1320, text: "Automate anything." },
  { startFrame: 1320, endFrame: 1410, text: "juno.build — Download free beta." },
];

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* ─── Lacy Shell Hero (fancy particles + terminal) ──── */}

      <Composition
        id="LacyShell-Hero"
        component={LacyHero}
        durationInFrames={480}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          accentColor: "#c084fc",
          accentColor2: "#22c55e",
          backgroundColor: "#09090b",
        }}
      />

      {/* ─── Juno Demo — 3 aspect ratios ──────────────────── */}

      {/* 16:9 master (YouTube / reference) */}
      <Composition
        id="JunoDemo-Landscape"
        component={JunoDemo}
        durationInFrames={1410}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          showCaptions: false,
          captions: [],
          watermark: "DRAFT — not approved",
        }}
      />

      {/* 9:16 vertical — TikTok / Reels / Shorts, captions burned in */}
      <Composition
        id="JunoDemoVertical"
        component={JunoDemo}
        durationInFrames={1410}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          showCaptions: true,
          captions: junoCaptions,
          watermark: "DRAFT — not approved",
        }}
      />

      {/* 1:1 square — X / feed placements */}
      <Composition
        id="JunoDemoSquare"
        component={JunoDemo}
        durationInFrames={1410}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{
          showCaptions: false,
          captions: [],
          watermark: "DRAFT — not approved",
        }}
      />

      {/* ─── Three.js 3D Cube Grid ─────────────────────────── */}

      <Composition
        id="LacyShell-3D-Cubes"
        component={LacyThreeD}
        durationInFrames={360}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          accentColor: "#c084fc",
          accentColor2: "#22c55e",
          backgroundColor: "#09090b",
          scene: "cubes" as const,
        }}
      />

      <Composition
        id="LacyShell-3D-Sphere"
        component={LacyThreeD}
        durationInFrames={360}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          accentColor: "#c084fc",
          accentColor2: "#22c55e",
          backgroundColor: "#09090b",
          scene: "sphere" as const,
        }}
      />

      {/* ─── Canvas 2D Flow Field (generative art) ─────────── */}

      <Composition
        id="LacyShell-FlowField"
        component={LacyFlowField}
        durationInFrames={480}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          accentColor: "#c084fc",
          accentColor2: "#22c55e",
          backgroundColor: "#09090b",
        }}
      />

      {/* ─── SVG Morph (blobs + circuit nodes) ─────────────── */}

      <Composition
        id="LacyShell-SvgMorph"
        component={LacySvgMorph}
        durationInFrames={420}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          accentColor: "#c084fc",
          accentColor2: "#22c55e",
          backgroundColor: "#09090b",
        }}
      />

      {/* ─── Lacy Shell Videos ──────────────────────────────── */}

      <Composition
        id="LacyShell-Launch"
        component={ProductLaunch}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={lacyLaunchDefaults}
      />

      <Composition
        id="LacyShell-Features"
        component={FeatureShowcase}
        durationInFrames={420}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={lacyFeaturesDefaults}
      />

      <Composition
        id="LacyShell-Social"
        component={SocialProof}
        durationInFrames={270}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={lacySocialDefaults}
      />

      <Composition
        id="LacyShell-Demo"
        component={AppDemo}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={lacyDemoDefaults}
      />

      {/* Social formats */}
      <Composition
        id="LacyShell-Launch-Square"
        component={ProductLaunch}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={lacyLaunchDefaults}
      />

      <Composition
        id="LacyShell-Launch-Vertical"
        component={ProductLaunch}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={lacyLaunchDefaults}
      />

      {/* ─── CrossOver Promo (3 aspect ratios) ─────────────── */}

      <Composition
        id="CrossOver-Promo-Vertical"
        component={CrossOverPromo}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          accentColor: "#ff3a3a",
          backgroundColor: "#080808",
          ctaText: "Search 'CrossOver' on the Microsoft Store or grab it from GitHub.",
        }}
      />

      <Composition
        id="CrossOver-Promo-Landscape"
        component={CrossOverPromo}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          accentColor: "#ff3a3a",
          backgroundColor: "#080808",
          ctaText: "Search 'CrossOver' on the Microsoft Store or grab it from GitHub.",
        }}
      />

      <Composition
        id="CrossOver-Promo-Square"
        component={CrossOverPromo}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{
          accentColor: "#ff3a3a",
          backgroundColor: "#080808",
          ctaText: "Search 'CrossOver' on the Microsoft Store or grab it from GitHub.",
        }}
      />

      {/* ─── Generic Templates (for other projects) ─────────── */}

      <Composition
        id="ProductLaunch"
        component={ProductLaunch}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          productName: "Your Product",
          tagline: "The future of productivity",
          features: ["Lightning fast", "AI-powered", "Beautiful UI"],
          ctaText: "Try it free →",
          brandColor: palettes.devtools.primary,
          accentColor: palettes.devtools.accent,
          logoUrl: "",
          websiteUrl: "yourproduct.com",
          fontFamily: typography.heading.family,
          bodyFontFamily: typography.body.family,
        }}
      />

      <Composition
        id="FeatureShowcase"
        component={FeatureShowcase}
        durationInFrames={360}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          productName: "Your Product",
          features: [
            { title: "Smart Dashboard", description: "Real-time analytics at your fingertips", icon: "📊" },
            { title: "AI Assistant", description: "Get intelligent suggestions automatically", icon: "🤖" },
            { title: "Team Collaboration", description: "Work together seamlessly in real-time", icon: "👥" },
          ],
          brandColor: palettes.devtools.primary,
          accentColor: palettes.devtools.accent,
        }}
      />

      <Composition
        id="SocialProof"
        component={SocialProof}
        durationInFrames={270}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          productName: "Your Product",
          stats: [
            { value: "10,000+", label: "Active Users" },
            { value: "99.9%", label: "Uptime" },
            { value: "4.9★", label: "Rating" },
          ],
          testimonial: {
            quote: "This completely transformed how our team works.",
            author: "Jane Smith",
            role: "CTO at TechCorp",
          },
          brandColor: palettes.devtools.accent,
        }}
      />

      <Composition
        id="AppDemo"
        component={AppDemo}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          productName: "Your Product",
          tagline: "See it in action",
          screenshotUrl: "",
          steps: [
            { label: "Sign up in seconds", icon: "✨" },
            { label: "Connect your tools", icon: "🔗" },
            { label: "Watch the magic happen", icon: "🚀" },
          ],
          brandColor: palettes.devtools.primary,
          accentColor: palettes.devtools.accent,
        }}
      />
    </>
  );
};
