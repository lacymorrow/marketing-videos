import { Composition } from "remotion";
import { ProductLaunch } from "./templates/ProductLaunch";
import { FeatureShowcase } from "./templates/FeatureShowcase";
import { SocialProof } from "./templates/SocialProof";
import { AppDemo } from "./templates/AppDemo";
import { palettes, typography } from "./lib/brand";

// Use the devtools palette as default (swap to any palette from brand.ts)
const palette = palettes.devtools;

const productLaunchDefaults = {
  productName: "Your Product",
  tagline: "The future of productivity",
  features: ["Lightning fast", "AI-powered", "Beautiful UI"],
  ctaText: "Try it free →",
  brandColor: palette.primary,
  accentColor: palette.accent,
  logoUrl: "",
  websiteUrl: "yourproduct.com",
  fontFamily: typography.heading.family,
  bodyFontFamily: typography.body.family,
};

const featureShowcaseDefaults = {
  productName: "Your Product",
  features: [
    {
      title: "Smart Dashboard",
      description: "Real-time analytics at your fingertips",
      icon: "📊",
    },
    {
      title: "AI Assistant",
      description: "Get intelligent suggestions automatically",
      icon: "🤖",
    },
    {
      title: "Team Collaboration",
      description: "Work together seamlessly in real-time",
      icon: "👥",
    },
  ],
  brandColor: palette.primary,
  accentColor: palette.accent,
};

const socialProofDefaults = {
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
  brandColor: palette.accent,
};

const appDemoDefaults = {
  productName: "Your Product",
  tagline: "See it in action",
  screenshotUrl: "",
  steps: [
    { label: "Sign up in seconds", icon: "✨" },
    { label: "Connect your tools", icon: "🔗" },
    { label: "Watch the magic happen", icon: "🚀" },
  ],
  brandColor: palette.primary,
  accentColor: palette.accent,
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Product Launch - Hero/announcement style */}
      <Composition
        id="ProductLaunch"
        component={ProductLaunch}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={productLaunchDefaults}
      />

      {/* Feature Showcase - Cycle through features */}
      <Composition
        id="FeatureShowcase"
        component={FeatureShowcase}
        durationInFrames={360}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={featureShowcaseDefaults}
      />

      {/* Social Proof - Stats and testimonials */}
      <Composition
        id="SocialProof"
        component={SocialProof}
        durationInFrames={270}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={socialProofDefaults}
      />

      {/* App Demo - Show the product */}
      <Composition
        id="AppDemo"
        component={AppDemo}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={appDemoDefaults}
      />

      {/* Social media variants */}
      <Composition
        id="ProductLaunch-Square"
        component={ProductLaunch}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={productLaunchDefaults}
      />

      <Composition
        id="ProductLaunch-Vertical"
        component={ProductLaunch}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={productLaunchDefaults}
      />
    </>
  );
};
