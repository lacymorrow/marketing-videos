# Video Generation Research (March 2026)

## Goal
Find the best way for an AI agent to programmatically generate marketing videos for software projects.

## Options Evaluated

### 1. Remotion (React Video Framework) ✅ SELECTED
- **What:** React-based framework where components render as video frames
- **Agent Integration:** Official Claude Code agent skills, MCP server, community MCP for media
- **Cost:** Free for individuals/small companies
- **Pros:** Full code control, deterministic rendering, 1080p/4K, batch generation, version-controlled, no vendor lock-in
- **Cons:** Motion graphics style only (not photorealistic AI video)
- **Resources:**
  - https://remotion.dev
  - Agent skills: `npx skills add remotion-dev/skills`
  - MCP: stephengpope/remotion-media-mcp (images, video, music, SFX)
  - Reddit guide: r/MotionDesign "Complete Guide: How to Setup Remotion Agent Skills"

### 2. Replit Animation
- **What:** Replit built a video rendering engine that captures any web animation (framer-motion, CSS, canvas) to MP4 by intercepting browser time APIs
- **Agent Integration:** None (Replit-hosted only)
- **Cost:** Replit subscription
- **Verdict:** Impressive engineering (they literally lie to the browser about what time it is) but platform-locked. No local CLI, no MCP, can't integrate with OpenClaw. **Pass.**

### 3. Adobe After Effects + nexrender
- **What:** nexrender is a CLI/API for automating AE template rendering via JSON job definitions
- **Agent Integration:** Can generate JSON jobs, but can't create AE templates programmatically
- **Cost:** Adobe CC subscription (already available)
- **Verdict:** Good for template-based workflows where humans design in AE and agents swap data. Too heavy for our use case where the agent needs to design from scratch. **Backup option.**

### 4. Motion Canvas
- **What:** TypeScript framework for programmatic animations using Canvas API
- **Agent Integration:** Has agent skills (apoorvlathey/motion-canvas-skills) but smaller ecosystem
- **Cost:** Free (MIT)
- **Verdict:** Solid framework but Remotion has 10x the community, better docs, more agent tooling. **No advantage over Remotion.**

### 5. HeyGen API
- **What:** REST API for generating AI avatar talking-head videos
- **Agent Integration:** Good REST API, programmatic video generation
- **Cost:** Per-video pricing (expensive at scale)
- **Verdict:** Different category (presenter-style vs motion graphics). Good complement for explainer videos. **Complementary, not primary.**

### 6. Higgsfield Vibe Editor
- **What:** Text-prompt to motion graphics, partnership with Anthropic, likely built on Remotion
- **Agent Integration:** None yet (web platform only)
- **Cost:** Unknown
- **Verdict:** Promising concept but no API/CLI. If they open programmatic access, worth revisiting. **Not ready.**

## Decision
**Remotion** selected for:
1. Agent can write the video code directly (React/TypeScript)
2. Official agent skills and MCP server exist
3. Free, local rendering, no vendor lock-in
4. Multi-format output (landscape, square, vertical)
5. Batch generation is trivial (loop over data, render variants)
