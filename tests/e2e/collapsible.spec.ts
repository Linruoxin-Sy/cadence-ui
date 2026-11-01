import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { effectiveMode, MODES, openComponent } from "./helpers";

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test.describe(`collapsible ${reducedMotion}`, () => {
    test.use({ reducedMotion });
    for (const requested of MODES) {
      test(`geometry and keyboard ${requested}`, async ({ page }) => {
        const mode = effectiveMode(requested, reducedMotion === "reduce");
        await openComponent(page, "collapsible", requested, "collapsible-content", mode);
        const preview = page.locator('[data-preview="collapsible"]');
        const second = preview.getByRole("button", { name: "Hide details" });
        const panel = preview.locator('[data-slot="collapsible-content"]');
        await expect(panel).toHaveAttribute("data-motion", mode);
        await expect
          .poll(() =>
            panel.evaluate((el) =>
              Math.abs(el.getBoundingClientRect().height - (el.firstElementChild?.getBoundingClientRect().height ?? 0)),
            ),
          )
          .toBeLessThan(1);
        expect(await panel.evaluate((el) => getComputedStyle(el).transitionDuration)).toBe(
          mode === "full" ? "0.32s" : "0s",
        );
        expect(await panel.evaluate((el) => getComputedStyle(el).transform)).toBe("none");
        const before = (await panel.boundingBox())?.height ?? 0;
        await preview.getByRole("button", { name: "Toggle extra detail" }).click();
        await expect.poll(async () => (await panel.boundingBox())?.height ?? 0).toBeGreaterThan(before + 10);
        await expect
          .poll(() =>
            panel.evaluate((el) =>
              Math.abs(el.getBoundingClientRect().height - (el.firstElementChild?.getBoundingClientRect().height ?? 0)),
            ),
          )
          .toBeLessThan(1);
        if (mode === "full") {
          // Sample on every frame across both reversals; no timing race in the test runner.
          const samples = await panel.evaluate(async (el) => {
            const trigger = el.parentElement?.querySelector('[data-slot="collapsible-trigger"]') as HTMLButtonElement;
            const heights: number[] = [];
            trigger.click();
            for (let i = 0; i < 6; i++) {
              await new Promise(requestAnimationFrame);
              heights.push(el.getBoundingClientRect().height);
            }
            const reversedAt = heights.at(-1) ?? 0;
            trigger.click();
            const reversalStart = el.getBoundingClientRect().height;
            for (let i = 0; i < 6; i++) {
              await new Promise(requestAnimationFrame);
              heights.push(el.getBoundingClientRect().height);
            }
            trigger.click();
            return { heights, reversedAt, reversalStart };
          });
          expect(Math.abs(samples.reversedAt - samples.reversalStart)).toBeLessThan(1);
          expect(Math.min(...samples.heights)).toBeGreaterThanOrEqual(0);
          expect(samples.heights[5]).toBeLessThan(samples.heights[0] ?? 0);
          expect(samples.heights[11]).toBeGreaterThan(samples.heights[6] ?? 0);
        } else await second.click();
        await expect(panel).toHaveCount(0);
        const trigger = preview.locator('[data-slot="collapsible-trigger"]');
        await trigger.focus();
        await page.keyboard.press("Enter");
        await expect(trigger).toHaveAttribute("aria-expanded", "true");
        await expect(trigger).toBeFocused();
        await page.keyboard.press(" ");
        await expect(trigger).toHaveAttribute("aria-expanded", "false");
      });
    }
  });
}
for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`collapsible ${colorScheme}`, () => {
    test.use({ colorScheme });
    test("axe, responsive content and screenshot", async ({ page }, testInfo) => {
      await openComponent(page, "collapsible", "none", "collapsible-content");
      expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual(
        [],
      );
      await page.screenshot({ path: testInfo.outputPath(`collapsible-${colorScheme}.png`) });
      await page.setViewportSize({ width: 390, height: 844 });
      const panel = page.locator('[data-preview="collapsible"] [data-slot="collapsible-content"]');
      await expect
        .poll(() =>
          panel.evaluate((el) =>
            Math.abs(el.getBoundingClientRect().height - (el.firstElementChild?.getBoundingClientRect().height ?? 0)),
          ),
        )
        .toBeLessThan(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });
  });
}
