# Marketing Videos

AI-driven marketing video generation using [Remotion](https://remotion.dev) + React. Built to be driven by AI agents for automated, code-first video production.

## Why Remotion?

After evaluating 6 approaches (Remotion, Replit Animation, Adobe AE + nexrender, Motion Canvas, HeyGen API, Higgsfield Vibe Editor), Remotion won for agent-driven video because:

- **Code-first:** React/TypeScript components render as video frames
- **Agent skills:** Official Claude Code skills and MCP server exist
- **Free:** No per-video costs, no vendor lock-in
- **Batch-friendly:** One template, swap data, generate 50 variants
- **Multi-format:** 1920x1080, 1080x1080 (Instagram), 1080x1920 (TikTok/Reels)

Full research notes in `docs/RESEARCH.md`.

## Quick Start

```bash
npm install

# Preview in Remotion Studio (browser-based, live reload)
npm run dev

# Render a specific template
npm run render:launch    # Product Launch (hero/announcement)
npm run render:features  # Feature Showcase (cycle through features)
npm run render:social    # Social Proof (stats + testimonial)
npm run render:demo      # App Demo (screenshot + steps)

# Render all templates
npm run render:all

# Social media formats
npm run render:square    # 1080x1080 (Instagram/LinkedIn)
npm run render:vertical  # 1080x1920 (TikTok/Reels/Shorts)
```

## Templates

### 1. ProductLaunch
Hero announcement video. Product name scales in with spring physics, tagline fades up, features appear as glassmorphic cards, CTA button bounces in. Animated gradient mesh background with floating orbs.

### 2. FeatureShowcase
Cycles through features one by one with emoji icon, title, and description. Progress dots show position. Each feature animates in with staggered fade + slide. Great for Twitter/LinkedIn.

### 3. SocialProof
Stats counter animation (spring-based scale-in) + testimonial quote with attribution. Trust-building video for landing pages and ads.

### 4. AppDemo
Split layout: product name, tagline, and step-by-step walkthrough on the left; mock browser window with screenshot on the right. Supply a `screenshotUrl` or use the auto-generated placeholder UI.

## Customization

Edit `src/Root.tsx` to change default props for any template:

```tsx
const productLaunchDefaults = {
  productName: "ShipFast",
  tagline: "Launch your SaaS in days, not months",
  features: ["Auth included", "Payments ready", "SEO optimized"],
  ctaText: "Start building →",
  brandColor: "#6366f1",
  accentColor: "#ec4899",
  websiteUrl: "shipfast.dev",
};
```

### Rendering with Custom Props

```bash
npx remotion render src/index.ts ProductLaunch out/custom.mp4 \
  --props='{"productName":"MyApp","tagline":"The best app ever"}'
```

## Architecture

```
src/
├── Root.tsx                    # Composition definitions + default props
├── index.ts                   # Entry point (registerRoot)
├── components/                # Reusable animated components
│   ├── AnimatedText.tsx       # Text with fadeUp/scaleIn/typewriter/words animations
│   └── GradientBackground.tsx # Animated gradient backgrounds (mesh/radial/linear)
├── templates/                 # Full video templates
│   ├── ProductLaunch.tsx      # Hero/announcement
│   ├── FeatureShowcase.tsx    # Feature carousel
│   ├── SocialProof.tsx        # Stats + testimonials
│   └── AppDemo.tsx            # Product demo with browser mockup
├── lib/
│   └── animations.ts         # Shared animation utilities (fadeIn, scaleIn, stagger, etc.)
└── assets/                   # Logos, screenshots, fonts

docs/
├── REMOTION-SEQUENCE-LAYOUT.md  # Gotcha: Sequence layout="none" for flex containers
└── RESEARCH.md                  # Video generation tool comparison

out/                           # Rendered videos (gitignored)
```

## Key Learnings

### Sequence + Flex Layout Gotcha

Remotion's `<Sequence>` renders with `position: absolute` by default, which breaks flex container centering. **Always use `layout="none"`** on Sequences inside flex/grid containers. See `docs/REMOTION-SEQUENCE-LAYOUT.md`.

## Adding New Templates

1. Create `src/templates/MyTemplate.tsx` with your React component
2. Add a `<Composition>` entry in `src/Root.tsx` with default props
3. Add a render script to `package.json`
4. Run `npm run dev` to preview, then render

## Agent Integration

This project is designed to be driven by AI agents:

1. Describe the product (name, tagline, features, colors, URL)
2. Agent updates `defaultProps` in `Root.tsx`
3. Agent renders with `npm run render:all`
4. Videos appear in `out/`

Compatible with Remotion's official agent skills (`npx skills add remotion-dev/skills`) and MCP server for direct framework access.

## License

MIT
