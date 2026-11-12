import { expect, test } from "@playwright/test";
import { effectiveMode, MODES } from "./helpers";

for (const mode of MODES)
  for (const os of [false, true]) {
    test(`Empty original parts and recovery ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
      await page.goto(`/components/empty?motion=${mode}`);
      await page.waitForLoadState("networkidle");
      const top = page.locator('[data-preview="empty"] [data-slot="empty"]');
      await expect(top).toHaveAttribute("data-motion", effectiveMode(mode, os));
      expect(await top.getAttribute("role")).toBeNull();
      expect(await top.getAttribute("aria-live")).toBeNull();
      expect(await top.evaluate((node) => getComputedStyle(node).borderTopWidth)).toBe("0px");
      await expect(top.locator('[data-slot="empty-icon"]')).toHaveAttribute("data-variant", "icon");
      await expect(top.getByRole("link", { name: "Browse components" })).toHaveAttribute("href", "/components");
      const second = page.locator('[data-component-example="empty/second-action"]');
      await second.getByRole("button", { name: "Clear filters" }).focus();
      await second.getByRole("button", { name: "Clear filters" }).press("Enter");
      await expect(second.locator('[data-slot="empty-description"]')).toHaveText(
        "Filters cleared. Save a component to fill this list.",
      );
      await expect(second.getByRole("button", { name: "Clear filters" })).toBeFocused();
      const media = page.locator('[data-component-example="empty/media"]');
      await expect(media.locator('[data-slot="empty-icon"][data-variant="default"]')).toHaveCount(1);
      await expect(page.locator('[data-component-example="empty/without-media"] [data-slot="empty-icon"]')).toHaveCount(
        0,
      );
    });
    test(`Empty caller changes and region reversal ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
      await page.goto(`/components/empty?motion=${mode}&speed=0.25`);
      await page.waitForLoadState("networkidle");
      const demo = page.locator('[data-component-example="empty/changing"]'),
        message = demo.locator('[data-slot="empty"]').first(),
        quantity = demo.locator('[aria-label="Remaining count"]');
      await demo.scrollIntoViewIfNeeded();
      const host = await message.elementHandle();
      const text = await message.locator('[data-slot="empty-title"] span').evaluateHandle((node) => node.firstChild);
      await demo.getByRole("button", { name: "Update empty state" }).click();
      await expect(message.locator('[data-slot="empty-title"]')).toHaveText("No archived components");
      await expect(quantity.locator('[data-slot="empty-description"]')).toHaveText("20");
      expect(await message.evaluate((node, before) => node === before, host)).toBe(true);
      expect(
        await message
          .locator('[data-slot="empty-title"] span')
          .evaluate((node, before) => node.firstChild === before, text),
      ).toBe(true);
      await expect(message.getByRole("link", { name: "Browse components" })).toBeVisible();
      const rows = await quantity.locator('[data-slot="empty-number"]').evaluate(async (host) => {
        const id = host.getAttribute("data-cadence-layout-anchor"),
          rows = [];
        for (let i = 0; i < 8; i++) {
          await new Promise(requestAnimationFrame);
          const layer = [...document.querySelectorAll<HTMLElement>("[data-cadence-number-layer]")].find(
            (node) => id && node.style.left.includes(`--cadence-display-${id} `),
          );
          rows.push(
            layer
              ? [...layer.querySelectorAll<HTMLElement>("[data-cadence-reel]")].map((node) =>
                  Number(node.dataset.phase),
                )
              : [],
          );
        }
        return rows;
      });
      if (mode === "full" && !os) expect(rows.some((row) => row.some((phase) => phase > 0 && phase < 1))).toBe(true);
      else expect(rows.every((row) => row.length === 0)).toBe(true);
      await demo.getByRole("button", { name: "Toggle results" }).click();
      await expect(demo.getByRole("link", { name: "Browse components" })).toHaveCount(0);
      await expect(
        demo.getByText("The application owns populated results. Toggle to restore the empty region."),
      ).toBeVisible();
      await demo.getByRole("button", { name: "Toggle results" }).click();
      await expect(demo.getByRole("link", { name: "Browse components" })).toHaveCount(1);
    });
  }
test("Empty SSR remains readable without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false }),
    page = await context.newPage();
  await page.goto(`${baseURL}/components/empty`);
  await expect(page.locator('[data-preview="empty"]').getByText("No saved components")).toBeVisible();
  await expect(page.locator('[data-component-example="empty/changing"] [data-slot="empty"]')).toHaveCount(2);
  await expect(page.locator('[data-preview="empty"]').getByRole("link", { name: "Browse components" })).toHaveAttribute(
    "href",
    "/components",
  );
  await context.close();
});
