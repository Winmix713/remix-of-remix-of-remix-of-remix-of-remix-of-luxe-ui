
## Goal

Lift the existing functional editor to a true Apple / Linear / Figma quality bar before adding heavy editor features. The skeleton (store, canvas, layers, properties, code, presets, share) is already in place — this pass replaces the generic-Tailwind look with a coherent design system, real tactile controls, and basic direct manipulation on the canvas.

Out of scope for this phase: multi-select, marquee, rotation gesture, smart guides/snapping, undo/redo, keyboard shortcuts, alignment actions, grouping. Those land in Phase 2.

---

## 1. Design system foundation (`src/styles.css`)

Replace ad-hoc `oklch(...)` literals scattered through components with a single token layer. Add and document under `@theme inline`:

- **Surface stack** — `--surface-0/1/2/3` (canvas → panel → row → chip), each with paired hairline border tokens (`--hairline-soft/strong`) and top-edge highlight tokens (`--edge-highlight`).
- **Material recipes** — `--mat-panel` (rgba bg + `backdrop-filter: blur(24px) saturate(180%)`), `--mat-popover`, `--mat-chip`.
- **Elevation scale** — `--elev-1/2/3` per spec (ambient + key shadow pair).
- **Radius tokens** — `xs 6 / sm 8 / md 12 / lg 16 / xl 20 / pill 999`.
- **Typography tokens** — section label, field label, value, header (sizes, weights, tracking).
- **Motion tokens** — `--ease-out-soft` `cubic-bezier(.22,1,.36,1)`, durations `90 / 120 / 180 / 220 ms`.
- **Accent** — keep current blue but desaturate one notch; reserve glow strictly for `selected/active`.

Load **Inter** via `<link>` in `__root.tsx` head (per Tailwind v4 rule — no `@import` URL in CSS) and wire `--font-display: "Inter Display", "Inter", ...`.

Sweep components to replace inline `oklch(...)` strings with the new tokens (`bg-[var(--surface-1)]`, `border-[var(--hairline-soft)]`, etc.).

---

## 2. Premium control primitives (`src/components/controls/`)

New, reusable, all keyboard-accessible:

- **`ScrubInput`** — numeric field that scrubs on horizontal drag of the label/icon (Figma-style), supports `Shift = ×10`, `Alt = ÷10`, arrow keys, focus selects all, optional unit suffix.
- **`SegmentedControl`** — pill-track with sliding active indicator (`framer-motion`-free; CSS transform + `--ease-out-soft`). Replaces ad-hoc tab bars and the future Linked/Unlinked padding toggle.
- **`ColorField`** — swatch + hex/oklch input + popover with HSL sliders, alpha, eyedropper-style recent colors row. Built on Radix Popover.
- **`Slider`** — replace the bare `<input type=range>` with a styled track: 1.5 px rail, 12 px thumb with inner highlight + ambient shadow, fills to value, ticks at integers when range ≤ 20.
- **`IconButton`** / **`Chip`** — unify the four near-identical button styles currently inline across LayerPanel, PresetsPanel, CodePanel.
- **`LinkedQuad`** — the four-padding control with a chain icon in the middle that switches between linked (1 input drives all 4) and unlinked (T/R/B/L) modes, with a smooth row-height transition.
- **`Section`** — refined version of the existing helper: 11/600/0.18em uppercase label, 4 px icon gap, optional right-side action slot, hairline divider.

Every control gets full state coverage: idle / hover / active / focus-visible / disabled, with transitions on the 120 ms ease-out token.

---

## 3. Canvas direct manipulation (`src/components/canvas/`)

Stays bidirectional with the Zustand store — no local copy.

- **`SelectionFrame`** — overlay rendered for the selected layer: 1 px accent outline with 1 px inner white highlight for crispness on dark; 8 corner + 4 edge handles (8×8 px white squares with shadow), rotation handle stub (visual only this phase).
- **Drag to move** — pointer-down on a layer initiates move; updates `x/y` on `pointermove` via `requestAnimationFrame`-batched `updateLayer`. Pointer capture on the layer element, no global listeners.
- **Resize** — handles dispatch resize against the appropriate edge(s); `Shift` preserves aspect ratio; `Alt` resizes from center. Minimum 8×8 px.
- **Cursor feedback** — move cursor on hover, directional resize cursors per handle, grab/grabbing while dragging.
- **Hit testing** — clicking inside a layer selects it; clicking the canvas background deselects (already wired). Locked layers ignore pointer-down.
- **Live HUD** — small pill near the cursor during drag/resize showing `W × H` or `X, Y` in tabular-nums font.

All gesture logic in a single `useDragGesture` hook so Phase 2 can plug in snapping/undo without rewriting handlers.

---

## 4. Layers panel polish + drag-reorder

- Wire `@dnd-kit/sortable` (already installed) for vertical reorder with a 180 ms ease drop animation and a "lifted" shadow on the dragging row.
- Row redesign at 28 px compact height: type icon · name · spacer · visibility · lock · overflow menu. Hover reveals controls with a 120 ms fade rather than today's hard `opacity-0/100`.
- Active row uses a single inset ring + tinted surface; remove the current double-border feel.
- Header "+ Card / Btn / Text" becomes one `+` icon button opening a popover menu of layer presets — denser, more Linear-like.
- Rename in place: double-click the row name.

---

## 5. Properties panel polish + effect drag-reorder

- Replace bespoke `NumInput`/`SliderRow`/`ColorInput` with the new primitives from §2; the panel becomes mostly composition.
- **Appearance**: add the spec's `Mode` segmented control (Light / Dark / Auto override stored on the layer; affects rendering of the layer's text/contrast only — does not toggle the whole app theme).
- **Transform**: add rotation presets row (−90° / 0° / 90°) as a small segmented control next to the rotation slider.
- **Layout**: padding becomes the `LinkedQuad` control.
- **Effects**:
  - Each `EffectCard` becomes sortable via `@dnd-kit/sortable` with a grip on the left; reorder updates the `effects[]` array, which already drives render order.
  - Collapsible (Radix Collapsible) with 220 ms `--ease-out-soft` height + opacity transition.
  - "+ Add effect" `<select>` replaced by an icon button + Radix DropdownMenu listing the six kinds with icons and a short description.
  - Color fields inside effects use the new `ColorField` popover (currently a raw text input — biggest single quality gap).

---

## 6. Top chrome + tabs

- Header tabs become a real `SegmentedControl` instead of the current bespoke pill row; the active pill animates between positions.
- Add a subtle window-chrome top hairline + ambient highlight on the whole shell.
- Right side of header: replace static `⌘⌥P` text with a `Share` button + an overflow menu (Copy share link, Reset scene, Export JSON) — pulls existing logic from PresetsPanel so the top bar is useful, not decorative.

---

## 7. Code + Presets tab polish

- CodePanel: real syntax highlighting via `shiki` (lightweight, server-safe) with a dark theme matching the app (`vesper` or `min-dark`). Add a CSS / Tailwind segmented control reusing §2. "Copy" button gets the new IconButton with a 1200 ms success state.
- PresetsPanel: redesign rows to match LayerPanel density; inline rename, relative timestamps, thumbnail-less for now but with a layer-count + effect-count pill.

---

## 8. Effect rendering polish

Small, high-impact fidelity fixes in `src/lib/effects.ts`:

- Move `box-shadow` to the **outer wrapper only** when no `layerBlur` is active; today `filter: blur` and `box-shadow` on the same node clip the shadow. Conditionally split into an outer "shadow host" wrapping the blur-target so drop shadows survive layer blur — matches Figma.
- Glass `::before` gets a 1 px inner top highlight (`box-shadow: inset 0 1px 0 var(--edge-highlight)`) per the visionOS material spec.
- Noise default frequency dropped from `0.9` to `0.65` and `numOctaves` to `2`; current default looks like TV static.
- Texture `feDisplacementMap` needs an `in2` (the turbulence result) — currently no displacement is actually applied; fix the filter chain.

---

## 9. Acceptance checklist for this phase

Before declaring the pass done, eyeball each in the live preview:

1. No bare inline `oklch(...)` left in component JSX — all surfaces use tokens.
2. Every numeric field is scrubbable; arrow keys + Shift/Alt modifiers work.
3. Color editing happens in a popover, not a hex text box.
4. Padding control toggles linked/unlinked with animation.
5. Layers and effects can be reordered by drag with a visible lift + drop animation.
6. Selecting a layer on the canvas shows handles; dragging moves it; corner handles resize it; properties panel values update live.
7. Tab switch in the top bar animates the indicator.
8. Glass cards have a top inner highlight; drop shadows render correctly even on layers with `layerBlur`.
9. Hover/focus/active states exist on every control with consistent 120 ms transitions.
10. The empty canvas + collapsed panels look intentional, not unfinished.

---

## File map

```
src/
  styles.css                           (tokens + motion + radius scale)
  routes/__root.tsx                    (Inter font link)
  components/
    controls/
      ScrubInput.tsx
      SegmentedControl.tsx
      ColorField.tsx
      Slider.tsx
      IconButton.tsx
      LinkedQuad.tsx
      Section.tsx
    canvas/
      Canvas.tsx                       (cursor + bg click already there)
      EffectedBox.tsx                  (split outer shadow host vs blur target)
      SelectionFrame.tsx               (NEW)
      useDragGesture.ts                (NEW)
      HUDBadge.tsx                     (NEW)
    layers/LayerPanel.tsx              (dnd-kit reorder, compact rows, rename)
    properties/
      PropertiesPanel.tsx              (composition only)
      AppearanceSection.tsx
      TransformSection.tsx
      LayoutSection.tsx
      EffectsSection.tsx               (dnd-kit reorder, dropdown add)
      effect-cards/
        DropShadowCard.tsx
        InnerShadowCard.tsx
        LayerBlurCard.tsx
        GlassCard.tsx
        NoiseCard.tsx
        TextureCard.tsx
    codegen/CodePanel.tsx              (shiki highlight, segmented)
    presets/PresetsPanel.tsx           (denser rows, rename, timestamps)
  lib/
    effects.ts                         (filter chain fixes)
```

No new runtime dependencies beyond what's installed (`@dnd-kit/*`, `clsx`, `lz-string`, `lucide-react`, Radix primitives) plus **`shiki`** for code highlighting.

---

## Phase 2 (not in this plan, for reference)

Multi-select, marquee, rotation gesture, alignment guides + smart snapping, undo/redo (zustand `temporal` middleware), keyboard shortcuts, copy/paste, grouping. Built on top of the `useDragGesture` hook and the polished surfaces from Phase 1.
