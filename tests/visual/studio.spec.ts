import { test, expect } from "@playwright/test";

test.describe("Properties Studio — visual baselines", () => {
  test("home / canvas", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-layer-id]');
    // Settle in case of font/SSR hydration paint
    await page.waitForTimeout(400);
    await expect(page).toHaveScreenshot("home.png", { fullPage: true });
  });

  test("properties panel — each layer", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-layer-id]');
    await page.waitForTimeout(400);

    const layers = await page.locator('[data-layer-id]').elementHandles();
    for (let i = 0; i < layers.length; i++) {
      await layers[i].click();
      await page.waitForTimeout(150);
      await expect(page).toHaveScreenshot(`properties-layer-${i}.png`, { fullPage: true });
    }
  });

  test("color picker popover", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-layer-id]');
    await page.waitForTimeout(400);
    await page.getByLabel(/^Color: /).first().click();
    await page.waitForTimeout(200);
    await expect(page).toHaveScreenshot("color-picker.png", { fullPage: true });
  });
});
