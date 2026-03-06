/**
 * Brand Style System
 * Generated from UI/UX Pro Max design system analysis.
 *
 * Style: Flat Design (2D, minimalist, bold colors, clean lines)
 * Typography: Space Grotesk (headings) + DM Sans (body)
 * Palette: Developer Tools / Dark Mode
 */

// ─── Color Palettes ──────────────────────────────────────────────

export const palettes = {
  /** Default: lacy.sh brand (dark + violet/green) */
  devtools: {
    name: "Lacy Shell",
    primary: "#09090b",
    secondary: "#18181b",
    accent: "#c084fc",
    background: "#09090b",
    text: "#fafafa",
    textMuted: "rgba(250, 250, 250, 0.5)",
    surface: "rgba(192, 132, 252, 0.06)",
    border: "rgba(192, 132, 252, 0.15)",
  },

  /** Vibrant: Electric blue + purple for high-energy videos */
  electric: {
    name: "Electric",
    primary: "#6366F1",
    secondary: "#8B5CF6",
    accent: "#EC4899",
    background: "#0A0A0F",
    text: "#F8FAFC",
    textMuted: "rgba(248, 250, 252, 0.6)",
    surface: "rgba(99, 102, 241, 0.08)",
    border: "rgba(99, 102, 241, 0.15)",
  },

  /** Warm: Amber/gold for premium/luxury feel */
  premium: {
    name: "Premium",
    primary: "#1C1917",
    secondary: "#44403C",
    accent: "#CA8A04",
    background: "#0C0A09",
    text: "#FAFAF9",
    textMuted: "rgba(250, 250, 249, 0.5)",
    surface: "rgba(202, 138, 4, 0.06)",
    border: "rgba(202, 138, 4, 0.15)",
  },

  /** Ocean: Cool blue for trust/enterprise */
  ocean: {
    name: "Ocean",
    primary: "#0F172A",
    secondary: "#1E3A5F",
    accent: "#38BDF8",
    background: "#020617",
    text: "#F0F9FF",
    textMuted: "rgba(240, 249, 255, 0.6)",
    surface: "rgba(56, 189, 248, 0.06)",
    border: "rgba(56, 189, 248, 0.12)",
  },
} as const;

export type PaletteName = keyof typeof palettes;
export type Palette = (typeof palettes)[PaletteName];

// ─── Typography ──────────────────────────────────────────────────

export const typography = {
  heading: {
    family: "'Instrument Serif', Georgia, serif",
    weights: { regular: 400 },
  },
  body: {
    family: "'DM Mono', 'SF Mono', 'Fira Code', monospace",
    weights: { regular: 400, medium: 500 },
  },
  /** Google Fonts import URL */
  googleFontsUrl:
    "https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Instrument+Serif&display=swap",
} as const;

// ─── Video Sizes ─────────────────────────────────────────────────

export const sizes = {
  landscape: { width: 1920, height: 1080, label: "16:9 (YouTube, Web)" },
  square: { width: 1080, height: 1080, label: "1:1 (Instagram, LinkedIn)" },
  vertical: { width: 1080, height: 1920, label: "9:16 (TikTok, Reels, Shorts)" },
} as const;

// ─── Animation Tokens ────────────────────────────────────────────

export const motion = {
  /** Micro-interactions: 150-200ms */
  fast: { durationFrames: 5, easing: "ease-out" },
  /** Standard transitions: 200-300ms */
  normal: { durationFrames: 8, easing: "ease-out" },
  /** Emphasis animations: 400-600ms */
  slow: { durationFrames: 15, easing: "ease-in-out" },
  /** Spring configs */
  spring: {
    snappy: { damping: 15, stiffness: 200, mass: 0.5 },
    bouncy: { damping: 10, stiffness: 150, mass: 0.8 },
    smooth: { damping: 20, stiffness: 120, mass: 1 },
  },
} as const;

// ─── Spacing Scale ───────────────────────────────────────────────

export const spacing = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 40,
  xl: 64,
  xxl: 96,
  /** Safe padding from video edges */
  safePadding: 80,
} as const;

// ─── Brand Presets ───────────────────────────────────────────────

/**
 * Pre-configured brand styles for Lacy's projects.
 * Add new projects here as needed.
 */
export const brands = {
  /** Lacy Shell - AI terminal upgrade */
  lacy: {
    palette: palettes.devtools,
    productName: "Lacy Shell",
    tagline: "Your terminal, upgraded",
    websiteUrl: "lacy.sh",
  },

  /** Build And Serve - web/digital agency */
  buildandserve: {
    palette: palettes.electric,
    productName: "Build And Serve",
    tagline: "Web development that ships",
    websiteUrl: "buildandserve.com",
  },

  /** Default/generic */
  default: {
    palette: palettes.devtools,
    productName: "Your Product",
    tagline: "The future starts here",
    websiteUrl: "example.com",
  },
} as const;

// ─── Helper: Get Full Brand Config ──────────────────────────────

export function getBrandConfig(brandName: keyof typeof brands = "default") {
  const brand = brands[brandName];
  return {
    ...brand,
    typography,
    motion,
    spacing,
  };
}
