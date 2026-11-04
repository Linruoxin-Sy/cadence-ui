import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { effectiveMode, MODES, openComponent } from "./helpers";

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test.describe(`accordion ${reducedMotion}`, () => {
    test.use({ reducedMotion });
    for (const requested of MODES) {
      test(`geometry and keyboard ${requested}`, async ({ page }) => {
        const mode = effectiveMode(requested, reducedMotion === "reduce");
        await openComponent(page, "accordion", requested, "accordion-content", mode);
        const preview = page.locator('[data-preview="accordion"]');
        const first = preview.getByRole("button", { name: "How do I install a component?" });
        const changing = page.locator('[data-component-example="accordion/changing-content"]');
        const second = changing.getByRole("button", { name: "Can I reduce the motion?" });
        await second.press("Enter");
        await second.focus();
        await page.keyboard.press("Enter");
        const panel = changing.getByRole("region", { name: "Can I reduce the motion?" });
        await expect(panel).toHaveAttribute("data-motion", mode);
        await expect(second).toBeFocused();
        await expect(first).toHaveAttribute("aria-expanded", "true");
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
        await changing.getByRole("button", { name: "Toggle details" }).click();
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
            const trigger = document.getElementById(el.getAttribute("aria-labelledby") ?? "") as HTMLButtonElement;
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
        await first.focus();
        await page.keyboard.press("Tab");
        await expect(preview.getByRole("button", { name: "Can I reduce the motion?" })).toBeFocused();
        await second.focus();
        await page.keyboard.press(" ");
        await expect(second).toHaveAttribute("aria-expanded", "true");
      });
    }
  });
}
for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`accordion ${colorScheme}`, () => {
    test.use({ colorScheme });
    test("axe, responsive content and screenshot", async ({ page }, testInfo) => {
      await openComponent(page, "accordion", "none", "accordion-content");
      expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual(
        [],
      );
      await page.screenshot({ path: testInfo.outputPath(`accordion-${colorScheme}.png`) });
      await page.setViewportSize({ width: 390, height: 844 });
      const panel = page.locator('[data-preview="accordion"] [data-slot="accordion-content"]');
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
