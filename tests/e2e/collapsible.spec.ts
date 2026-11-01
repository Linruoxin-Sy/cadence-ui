import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, test } from "@playwright/test";
import { effectiveMode, MODES, openComponent } from "./helpers";

// Compare with the browser's natural auto-height layout, independent of the measurement formula.
async function expectNaturalHeight(panel: Locator) {
  await expect
    .poll(() =>
      panel.evaluate((el) => {
        const natural = el.cloneNode(true) as HTMLElement;
        natural.style.height = "auto";
        natural.style.transition = "none";
        el.after(natural);
        const difference = Math.abs(el.getBoundingClientRect().height - natural.getBoundingClientRect().height);
        natural.remove();
        return difference;
      }),
    )
    .toBeLessThan(1);
  expect(
    await panel.evaluate((el) => {
      const style = getComputedStyle(el);
      const bottom =
        el.getBoundingClientRect().bottom - parseFloat(style.borderBottomWidth) - parseFloat(style.paddingBottom);
      return (el.firstElementChild?.getBoundingClientRect().bottom ?? 0) <= bottom + 1;
    }),
  ).toBe(true);
}

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
        await expectNaturalHeight(panel);
        expect(await panel.evaluate((el) => getComputedStyle(el).transitionDuration)).toBe(
          mode === "full" ? "0.32s" : "0s",
        );
        expect(await panel.evaluate((el) => getComputedStyle(el).transform)).toBe("none");
        const before = (await panel.boundingBox())?.height ?? 0;
        await preview.getByRole("button", { name: "Toggle extra detail" }).click();
        await expect.poll(async () => (await panel.boundingBox())?.height ?? 0).toBeGreaterThan(before + 10);
        await expectNaturalHeight(panel);
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
      await expectNaturalHeight(panel);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });
  });
}

for (const mode of MODES) {
  test(`outer box model and closing lifecycle ${mode}`, async ({ page }) => {
    await openComponent(page, "collapsible", mode, "collapsible-content");
    const preview = page.locator('[data-preview="collapsible"]');
    const panel = preview.locator('[data-slot="collapsible-content"]');
    // Real React className input: p-4 border on the outer Panel, under Preflight border-box.
    await expect(panel).toHaveClass(/p-4/);
    await expectNaturalHeight(panel);
    for (const boxSizing of ["content-box", "border-box"] as const) {
      // Vertical-only style changes need remeasurement even when the inner size stays identical.
      await panel.evaluate((el, sizing) => {
        el.style.boxSizing = sizing;
        el.style.paddingTop = "23px";
        el.style.paddingBottom = "31px";
        el.style.borderTopWidth = "3px";
        el.style.borderBottomWidth = "5px";
      }, boxSizing);
      await expectNaturalHeight(panel);
      await preview.getByRole("button", { name: "Toggle extra detail" }).click();
      await expectNaturalHeight(panel);
      await page.setViewportSize({ width: boxSizing === "border-box" ? 390 : 900, height: 844 });
      await expectNaturalHeight(panel);
    }
    if (mode === "full") {
      const minimum = await panel.evaluate(async (el) => {
        const trigger = el.parentElement?.querySelector('[data-slot="collapsible-trigger"]') as HTMLButtonElement;
        trigger.click();
        const samples: number[] = [];
        while (el.isConnected) {
          samples.push(el.getBoundingClientRect().height);
          await new Promise(requestAnimationFrame);
        }
        return Math.min(...samples.filter((height) => height > 0));
      });
      // CSS cannot reduce a decorated border box below its padding + border (23+31+3+5).
      expect(minimum).toBeGreaterThanOrEqual(62);
      expect(minimum).toBeLessThan(63);
    } else await preview.locator('[data-slot="collapsible-trigger"]').click();
    await expect(panel).toHaveCount(0);
    await preview.locator('[data-slot="collapsible-trigger"]').click();
    await expectNaturalHeight(panel);
  });
}
