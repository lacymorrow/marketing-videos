# Remotion Layout Rules

## Rule: No Flex Centering for Staggered Content

**Problem:** When elements appear one by one in a `display: flex; justify-content: center` container, each new element rebalances the center point, causing earlier elements to jump up. This is jarring.

**Fix:** Use `position: absolute` with fixed `top`/`bottom` values for each content block. Elements stay pinned at their positions regardless of what else appears.

```tsx
// ❌ Bad — flex centering shifts everything when new elements appear
<div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
  {showTitle && <Title />}
  {showFeatures && <Features />}  {/* This appearing pushes Title up */}
  {showCta && <CTA />}            {/* This pushes everything up again */}
</div>

// ✅ Good — absolute positioning, each element stays where it is
<div style={{ position: "relative", width: "100%", height: "100%" }}>
  <div style={{ position: "absolute", top: "25%", left: "50%", transform: "translate(-50%, -50%)" }}>
    <Title />
  </div>
  <div style={{ position: "absolute", top: "55%", left: "50%", transform: "translate(-50%, -50%)" }}>
    <Features />
  </div>
  <div style={{ position: "absolute", bottom: 100, left: "50%", transform: "translateX(-50%)" }}>
    <CTA />
  </div>
</div>
```

---

# Remotion `<Sequence>` Layout Gotcha

## The Problem

When using `<Sequence>` inside a flex container, elements cluster in the **top-left corner** instead of respecting the parent's `alignItems`/`justifyContent` centering.

### What it looks like
- Multiple animated elements all stacked at position (0, 0)
- Elements appear in the top-left instead of being centered
- Layout "jumps" when Sequences mount/unmount

## Root Cause

Remotion's `<Sequence>` renders a wrapper `<div>` with these default styles:

```css
position: absolute;
top: 0;
left: 0;
right: 0;
display: flex;
flex-direction: column;
```

**`position: absolute` pulls each Sequence out of the flex flow.** The parent container's `alignItems: "center"` and `justifyContent: "center"` have no effect on absolutely-positioned children. All Sequences stack at the top-left of their nearest positioned ancestor.

## The Fix

Add `layout="none"` to every `<Sequence>` that needs to participate in a flex layout:

```tsx
// ❌ BAD — Sequence creates absolute-positioned wrapper, breaks flex centering
<div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
  <Sequence from={0}>
    <MyComponent />      {/* Stuck at top-left */}
  </Sequence>
  <Sequence from={30}>
    <OtherComponent />   {/* Also stuck at top-left, overlapping */}
  </Sequence>
</div>

// ✅ GOOD — layout="none" removes the wrapper, elements stay in flex flow
<div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
  <Sequence from={0} layout="none">
    <MyComponent />      {/* Properly centered */}
  </Sequence>
  <Sequence from={30} layout="none">
    <OtherComponent />   {/* Properly centered, below MyComponent */}
  </Sequence>
</div>
```

## When to Use Each

| Layout Mode | Use When |
|---|---|
| **Default** (no `layout` prop) | Sequence is the only child, or you want it to fill its container absolutely |
| **`layout="none"`** | Sequence is inside a flex/grid container and must participate in the flow |

## Rule of Thumb

**If the parent uses `display: flex` or `display: grid`, use `layout="none"` on child Sequences.**

The only exception is if you intentionally want the Sequence to overlay/stack (like a transition between scenes).

## Affected Templates (Fixed)

- `ProductLaunch.tsx` — 6 Sequences in centered flex column
- `FeatureShowcase.tsx` — header Sequence + centered feature content
- `SocialProof.tsx` — 4 Sequences in centered flex column
- `AppDemo.tsx` — 4 Sequences across split flex layout
