# Plan — Final consistency + responsive + a11y + perf + visual regression

The 8 requests group into 5 work streams. Two items were partly addressed last turn (md grid, hue thumb edge clamp) — I'll re-audit and finish anything missed.

## 1. Final style audit — cinematic glass + radial-gradient consistency

Sweep every component still using ad-hoc colors / shadows and migrate to the shared design tokens (`--surface-input`, `--surface-chip`, `--shadow-panel`, `--shadow-input-inset`, `--panel-border`, edge highlight, top sheen).

Audit targets:
- `LayerPanel`, `PresetsPanel`, `CodePanel` — verify panel shell matches `PropertiesPanel` (same gradient + sheen + edge highlight + radius)
- `Canvas` chrome (Artboard label, HUDBadge, SelectionFrame, RotationHandle, Marquee) — chip + border tokens
- `controls/*` (ScrubInput, LinkedQuad, Slider, SegmentedControl, IconButton, Row, Section, ShortcutsHintBar) — confirm token usage, no raw `bg-white/…` hex/oklch literals
- Radix popovers (`popover-material` class) used by ColorField, dropdown menu, tooltip — single source of truth
- Inline-styled inputs (e.g. PropertiesPanel rename input) — keep intentional, but document why

Deliverable: any component using a one-off color/shadow gets switched to the tokens; add a missing token to `src/styles.css` if a real new variant is needed (no token sprawl).

## 2. ColorField — interaction precision + a11y

- **Hue thumb edges**: keep last turn's `calc(${hue/360} * (100% - 18px))` and apply the same inset math to the SV pad marker so the picker handle never clips at corners.
- **Pixel-exact mapping**: pointer math already uses `getBoundingClientRect`; add `touch-action: none` on SV pad + hue strip so touch drags don't scroll the panel, and round-trip through the same clamp helper so click==drag==value.
- **Keyboard + ARIA**:
  - SV pad: `role="slider"` pair via wrapper `role="group"`, arrow keys nudge `c`/`l` by 0.01, Shift = 0.1, Home/End = min/max.
  - Hue strip: `role="slider"` `aria-valuemin=0` `aria-valuemax=360` `aria-valuenow={hue}`, arrows ±1°, Shift ±10°.
  - Preset hue buttons: already buttons; add `aria-pressed` on the selected one.
  - Trigger button: `aria-label="Color: <value>"`.
  - Focus rings consistent with other controls (`focus-visible:ring-2 ring-white/40`).

## 3. Responsive sweep — sm / md / lg / xl

Verify in the live preview at 360 / 414 / 768 / 820 / 1024 / 1280 / 1440 widths:
- No horizontal scrollbar at any width.
- Header (3-col grid) collapses cleanly on sm — promote to `grid-cols-[auto_1fr_auto]` with `min-w-0` + `truncate` on title block, hide the subtitle on `<sm`, keep IconButtons in a `flex-wrap` row.
- `ShortcutsHintBar` already overflows on narrow widths — add `overflow-x-auto` + `scrollbar-none` or hide on `<md`.
- LayerPanel on sm: cap at `max-h-[35vh]` and ensure layer names use `truncate` + `min-w-0` (the `Hea…` truncation is intentional but should not break layout).
- PropertiesPanel inner 2-col grid (`md:max-xl:grid-cols-2`) added last turn — re-check that long values (oklch strings, rotation presets) still fit; if not, drop to 1-col below ~720px.
- Canvas: confirm `min-w-0` on its grid cell so the SVG/board can shrink, no overflow.
- Page wrapper: keep `mx-auto max-w-[1600px]` centered; add `px-2 sm:px-3` to outer padding for sm.

## 4. `md` breakpoint grid — finish PropertiesPanel fix

Last turn I moved PropertiesPanel to a full-width row on md (`md:col-span-2`) with a 2-col inner grid (`md:max-xl:grid-cols-2`). Final pass:
- Verify nothing in PropertiesPanel header bar truncates (layer rename input width was `w-40`; switch to `min-w-0 flex-1 max-w-[200px]`).
- Confirm the EffectsSection list items (drag handle, eye, trash) survive the narrower 2-col cells — add `min-w-0` + `shrink-0` per the responsive grid rule.
- Make the inner 2-col grid use `auto-rows-min` so sections don't stretch to equal height.

## 5. Performance polish

- `React.memo` on the four section components (`AppearanceSection`, `TransformSection`, `LayoutSection`, `EffectsSection`) — they re-render on every store change today.
- Replace any broad `useScene()` calls in leaf controls with selector-scoped subscriptions (`useScene(s => s.field)`) so a slider drag doesn't re-render the whole tree.
- Slider/ScrubInput: throttle store writes during pointer drag with `requestAnimationFrame` coalescing; commit once on `pointerup`. Keep visual value local during drag.
- ColorField SV/hue drag: same rAF coalesce.
- Use `will-change: transform` only during active drag on SelectionFrame/RotationHandle (toggle via class), not statically.
- Heavy popovers (ColorField, PresetsPanel previews): lazy-mount via Radix's default unmount-on-close behavior — verify, don't keep them mounted.
- Run `browser--performance_profile` before/after to confirm no INP regressions and LCP unchanged.

## 6. Visual regression tests

Add Playwright + a tiny snapshot suite (no CI wiring needed beyond `bun run test:visual`).

Files:
- `playwright.config.ts` — three projects: `mobile` (390×844), `tablet` (820×1180), `desktop` (1440×900); `expect.toHaveScreenshot` threshold ~0.2%.
- `tests/visual/studio.spec.ts` — for each viewport: load `/`, wait for canvas, screenshot full page; then select each layer in turn and snapshot the PropertiesPanel; open ColorField popover and snapshot.
- `tests/visual/__snapshots__/` baseline committed.
- `package.json` scripts: `test:visual`, `test:visual:update`.
- Doc note in `src/routes/README.md` on how to update baselines.

Out of scope: wiring this into a CI provider (project has no CI config yet) — leaving the `bun run` script as the entry point.

## Technical notes

- All work stays in frontend/presentation files: `src/components/**`, `src/routes/index.tsx`, `src/styles.css`, plus new test files.
- No store / business-logic changes beyond memoization + selector scoping (behavior-preserving).
- No new runtime deps except `@playwright/test` (dev dep).

## Verification checklist (after build mode)

1. `browser--view_preview` at 390 / 768 / 820 / 1024 / 1440 — no horizontal scroll, no truncated controls, PropertiesPanel centered.
2. Keyboard-drive the ColorField (Tab to trigger → Enter → Tab to SV pad → arrows → Tab to hue → arrows) — values change, focus visible.
3. `browser--performance_profile` — INP < 200ms while dragging a slider.
4. `bun run test:visual` — baseline snapshots generated, second run passes clean.
