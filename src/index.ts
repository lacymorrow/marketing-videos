import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";
import { typography } from "./lib/brand";

// Load brand fonts
const link = document.createElement("link");
link.rel = "stylesheet";
link.href = typography.googleFontsUrl;
document.head.appendChild(link);

registerRoot(RemotionRoot);
