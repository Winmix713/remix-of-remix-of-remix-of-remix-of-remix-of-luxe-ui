import { defineConfig, devices } from "@playwright/test";

/**
 * Visual regression smoke tests.
 * Run locally:
 *   bun add -d @playwright/test
 *   bunx playwright install chromium
 *   bun run test:visual         # first run: generates baselines
 *   bun run test:visual         # subsequent: compares against baselines
 *   bun run test:visual:update  # update baselines after intentional changes
 */
export default defineConfig({
  testDir: "./tests/visual",
  fullyParallel: true,
  reporter: [["list"]],
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.002,
      animations: "disabled",
      caret: "hide",
    },
  },
  webServer: {
    command: "bun run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "mobile",  use: { ...devices["iPhone 13"] } },
    { name: "tablet",  use: { ...devices["iPad (gen 7)"] } },
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
  ],
});
