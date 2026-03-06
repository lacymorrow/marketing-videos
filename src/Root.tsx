import { Composition } from "remotion";
import { ProductLaunch } from "./templates/ProductLaunch";
import { FeatureShowcase } from "./templates/FeatureShowcase";
import { SocialProof } from "./templates/SocialProof";
import { AppDemo } from "./templates/AppDemo";

// Default props for each template
const productLaunchDefaults = {
  productName: "Your Product",
  tagline: "The future of productivity",
  features: ["Lightning fast", "AI-powered", "Beautiful UI"],
  ctaText: "Try it free →",
  brandColor: "#6366f1",
  accentColor: "#ec4899",
  logoUrl: "",
  websiteUrl: "yourproduct.com",
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
  brandColor: "#6366f1",
  accentColor: "#ec4899",
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
  brandColor: "#6366f1",
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
  brandColor: "#6366f1",
  accentColor: "#ec4899",
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
