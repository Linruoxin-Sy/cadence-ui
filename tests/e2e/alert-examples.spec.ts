import { expect, test } from "@playwright/test";
import { effectiveMode, MODES } from "./helpers";

for (const mode of MODES)
  for (const os of [false, true]) {
    test(`Alert original grid and native action ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
      await page.goto(`/components/alert?motion=${mode}`);
      await page.waitForLoadState("networkidle");
      const top = page.locator('[data-preview="alert"]');
      await expect(top.getByRole("alert")).toHaveCount(2);
      await expect(top.getByRole("combobox")).toHaveCount(0);
      const plain = page.locator('[data-component-example="alert/without-icon"]');
      await expect(plain.getByRole("alert")).toHaveAttribute("data-motion", effectiveMode(mode, os));
      expect(
        await plain.getByRole("alert").evaluate((n) => Number.parseFloat(getComputedStyle(n).gridTemplateColumns)),
      ).toBe(0);
      const action = page.locator('[data-component-example="alert/action"]');
      await action.getByRole("button", { name: "Dismiss", exact: true }).focus();
      await action.getByRole("button", { name: "Dismiss", exact: true }).press("Enter");
      await expect(action.getByRole("alert")).toHaveCount(0);
      await action.getByRole("button", { name: "Show alert" }).click();
      await expect(action.getByRole("alert")).toHaveCount(1);
    });
    test(`Alert committed updates, reels and caller presence ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
      await page.goto(`/components/alert?motion=${mode}&speed=0.25`);
      await page.waitForLoadState("networkidle");
      const demo = page.locator('[data-component-example="alert/changing"]');
      await demo.scrollIntoViewIfNeeded();
      const message = demo.locator('[data-slot="alert"]:has(> [data-slot="alert-action"])'),
        quantity = demo.getByRole("alert").nth(1);
      await expect(message).toHaveAttribute("data-motion", effectiveMode(mode, os));
      const host = await message.elementHandle(),
        text = await message
          .locator('[data-slot="alert-title"] [data-slot="alert-text"]')
          .evaluateHandle((n) => n.firstChild);
      await demo.getByRole("button", { name: "Update message", exact: true }).click();
      await expect(message.locator('[data-slot="alert-title"]')).toHaveText("Deploy failed");
      expect(await message.evaluate((n, before) => n === before, host)).toBe(true);
      expect(
        await message
          .locator('[data-slot="alert-title"] [data-slot="alert-text"]')
          .evaluate((n, before) => n.firstChild === before, text),
      ).toBe(true);
      expect(await message.locator(":scope > svg").count()).toBe(1);
      await quantity.scrollIntoViewIfNeeded();
      await demo.getByRole("button", { name: "Add retry" }).click();
      await expect(quantity.locator('[data-slot="alert-description"]')).toHaveText("20");
      const samples = await quantity.locator('[data-slot="alert-number"]').evaluate(async (host) => {
        const rows = [];
        for (let i = 0; i < 10; i++) {
          await new Promise(requestAnimationFrame);
          const id = host.getAttribute("data-cadence-layout-anchor");
          const layer = [...document.querySelectorAll<HTMLElement>("[data-cadence-number-layer]")].find(
            (n) => id && n.style.left.includes(`--cadence-display-${id} `),
          );
          rows.push(
            layer
              ? [...layer.querySelectorAll<HTMLElement>("[data-cadence-reel]")].map((n) => Number(n.dataset.phase))
              : [],
          );
        }
        return rows;
      });
      if (mode === "full" && !os) expect(samples.some((r) => r.some((p) => p > 0 && p < 1))).toBe(true);
      else expect(samples.every((r) => r.length === 0)).toBe(true);
      await demo.getByRole("button", { name: "Change tone" }).click();
      await expect(message).toHaveClass(/text-destructive/);
      await demo.getByRole("button", { name: "Hide message" }).click();
      await expect(message).toHaveCount(0);
      await demo.getByRole("button", { name: "Show message" }).click();
      await expect(demo.getByRole("alert").first().locator('[data-slot="alert-title"]')).toHaveText("Deploy failed");
    });
  }
test("Alert SSR stays visible without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}/components/alert`);
  const top = page.locator('[data-preview="alert"]');
  await expect(top.getByRole("alert")).toHaveCount(2);
  await expect(top.getByText("Registry ready")).toBeVisible();
  await expect(page.locator('[data-component-example="alert/changing"]').getByRole("alert")).toHaveCount(2);
  await context.close();
});
