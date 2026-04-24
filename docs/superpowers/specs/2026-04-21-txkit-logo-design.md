# txKit Logo - Design Spec & Figma Make Prompt

**Date:** 2026-04-21
**Direction:** Stacked security layers - 3 shield-shapes (or rounded squares) stacked vertically with opacity ladder
**Supersedes:**
- ❌ Arrow-X / Stacked-Kit / Chevron-Flow (didn't encode identity)
- ❌ Aperture-Loupe with embedded "tx" monogram (Figma Make output was illegible)

---

## Positioning (why this direction)

txKit is a **security layer for Web3 transactions**. The logo should show *multiple layers of protection* literally - because that is what the library does: simulation → calldata preview → bounded approval → signature. Each layer catches what the previous one missed.

A prior Figma iteration that used **three stacked squares with graduated opacity** was on the right track visually - the brand reads as "layered trust" immediately. We are now formalizing that direction and extending it to shield-shapes (and comparing both).

---

## Core metaphor

The mark is a **stack of protective layers**, rendered as three overlapping shapes in a single brand color with graduated opacity. Reads as: *defense in depth, visible at a glance*.

- **Not** a single shield (too generic, too Trust-Wallet).
- **Not** a hexagon (too Web3-kitsch).
- **Not** a chain or coin.
- **Just** three clean layers stacked, each one a little smaller, a little more present than the last.

---

## Values encoded in geometry

1. **Defense in depth** - three layers, not one. Literal multi-layer protection.
2. **Transparency** - back layers are translucent; you can *see through* the protection.
3. **Simplicity** - a single shape repeated three times. No ornament.
4. **Drop-in readability** - three stacked shapes survive at 16×16.
5. **Brand flexibility** - same single color throughout; the hierarchy is opacity, not hue.

---

## Figma Make prompt (paste this into Figma Make)

> # txKit Logo - Stacked Security Layers
>
> Design a logo for **txKit**, an open-source React library that acts as a security layer for Web3 transactions. Users see exactly what they're signing - simulation, calldata preview, bounded approvals, anti-phishing - before anything reaches the wallet. Our previous iteration using three stacked squares with graduated opacity was on the right track; we are formalizing and extending that direction.
>
> ## Core metaphor
>
> The mark is a **stack of protective layers** - three overlapping shapes in a single brand color, with graduated opacity. Reads as: defense in depth, visible at a glance.
>
> **Not** a single shield. **Not** a hexagon. **Not** a chain, coin, key, gear, or arrow. Three clean layers, stacked.
>
> ## Construction spec (follow exactly)
>
> - **Canvas:** 24 × 24 units.
> - **Three identical shapes** (same silhouette, same stroke, no rotation) stacked with **vertical offset**, each layer slightly smaller than the one behind it.
> - **Stacking order (back to front):**
>   - **Layer 1 (back):** largest, opacity 25%.
>   - **Layer 2 (middle):** ~85% scale of back layer, opacity 55%, offset ~2u upward.
>   - **Layer 3 (front):** ~70% scale of back layer, opacity 100%, offset ~4u upward from back.
> - **Horizontal:** all three layers are horizontally centered on the canvas.
> - **Fill vs. stroke:** filled shapes (no stroke). Opacity ladder IS the hierarchy.
> - **Color:** single brand color throughout (indigo `#4338CA`). Do NOT use multiple hues.
> - **All layers must be visible** - back layer should not be so faint it disappears at 16px; front layer should not dominate so much that back two become invisible.
>
> ## Shape variants to generate (side-by-side comparison)
>
> Render each study at **128×128** and again at **16×16** immediately below. Label A-F.
>
> - **A. Shield stack** - classic shield silhouette (top rounded or flat, bottom tapered to a point), three layers. The "we are security" option.
> - **B. Rounded-square stack** - rounded squares with ~4u corner radius, three layers. The "we are modular infrastructure" option (matches prior Figma iteration user liked).
> - **C. Rounded-rectangle stack (landscape)** - same as B but 4:3 landscape proportions, three layers. Tests horizontal mass.
> - **D. Hexagon stack** - pointed-top hex, three layers. Honest Web3 aesthetic.
> - **E. Shield stack with monogram** - variant A, with a small lowercase "tx" (brand color, same opacity as its layer) embossed in the front layer only.
> - **F. Reverse opacity** - variant A but flipped: front layer 25%, back layer 100%. Tests "transparent shield in front of solid core" reading.
>
> ## Wordmark
>
> "txKit" as a single word - lowercase `tx`, capital `K`, lowercase `it`. Geometric grotesque (Inter, Geist, General Sans, Söhne). Tight tracking but not cramped. No ligatures, no italic, no all-caps.
>
> ## Lockups (for the chosen mark - generate for variant A and variant B both)
>
> - Horizontal: mark + `txKit` on one baseline.
> - Stacked: mark above `txKit`.
> - Icon-only: favicon and app icon.
>
> ## Color & monochrome
>
> - **Primary brand:** indigo `#4338CA` (OKLCH `0.511 0.262 276°`).
> - Show each lockup on neutral-50 (`#FAFAFA`) and neutral-950 (`#0A0A0A`).
> - **Monochrome version:** opacity is lost, so use **stroke-weight ladder** instead - back layer stroke 1u (outline only), middle layer stroke 2u (outline), front layer solid fill. This keeps the three-layer hierarchy readable in pure black on white.
>
> ## Hard constraints
>
> - No gradients, drop shadows, glows, 3D, or bevels.
> - Single hue throughout. Opacity is the only variation.
> - No ornament inside the layers (no gears, circuits, sparkles, hex grids).
> - Must read at 16×16 px. If the back layer disappears, increase its opacity floor.
> - SVG-native: shapes, fills, boolean ops only.
> - Icon works without the wordmark; wordmark works without the icon.
>
> ## Don'ts (style)
>
> No serif, no italic, no all-caps wordmark, no tagline baked into the logo, no holographic Web3 neon, no beveled glass, no background circles or pills behind the icon, no drop shadows on the layers.

---

## Decision points (resolve visually after Figma Make renders variants)

1. **Shape:** shield (A) vs. rounded square (B) vs. rounded rectangle (C) vs. hexagon (D). Most depends on whether "shield" reads as too generic for us specifically.
2. **Monogram inside or not:** variant E tests whether embedded "tx" helps or clutters.
3. **Opacity direction:** forward (A, solid-in-front) vs. reverse (F, transparent-in-front). Reverse reads as "transparent shield protecting a solid core", which is philosophically closer to anti-phishing (we are the transparent layer).

## Non-negotiables

- Three layers, not two, not four.
- Same silhouette repeated (not three different shapes).
- Single hue.
- Must work at 16×16.

## Next step after Figma Make returns variants

1. Pick the shape and opacity direction that reads most clearly at 16px.
2. Finalize monochrome version alongside color.
3. Export SVG, drop into `app/docs/public/logo.svg` and `README.md` header.
4. Update brand references in docs.
