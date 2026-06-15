# Visual regression tests

Smoke tests that catch unintentional drift in the cinematic glass + radial-gradient styling across mobile / tablet / desktop viewports.

## Setup (one-time)

```bash
bun add -d @playwright/test
bunx playwright install chromium
```

## Run

```bash
bun run test:visual         # compare against baselines
bun run test:visual:update  # write new baselines (after intentional design changes)
```

Baselines live next to the spec under `tests/visual/studio.spec.ts-snapshots/`.

The dev server (`bun run dev`) is started automatically by Playwright and
reused if already running.
