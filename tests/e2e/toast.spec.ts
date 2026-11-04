import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { computed, effectiveMode, MODES, openComponent, recordedScale, recordScale } from "./helpers";

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test.describe(`toast ${reducedMotion}`, () => {
    test.use({ reducedMotion });
    for (const requested of MODES) {
      test(`motion and dismissal ${requested}`, async ({ page }) => {
        const mode = effectiveMode(requested, reducedMotion === "reduce");
        await recordScale(page, '[data-slot="toast"]');
        await openComponent(page, "toast", requested, "toast-demo", mode);
        const trigger = page.getByRole("button", { name: "Show notification", exact: true });
        await trigger.click();
        const toast = page.locator('[data-slot="toast"]');
        await expect(toast).toHaveAttribute("data-motion", mode);
        await expect(toast).toHaveAccessibleName("Changes saved");
        await expect(trigger).toBeFocused();
        await expect.poll(() => computed(page, '[data-slot="toast"]', "opacity")).toBe("1");
        expect(await computed(page, '[data-slot="toast"]', "transition-duration")).toBe(
          { full: "0.22s", reduced: "0.132s", none: "0s" }[mode],
        );
        const samples = await recordedScale(page);
        if (mode === "full") expect(samples.min).toBeLessThan(0.99);
        else {
          expect(samples.min).toBe(1);
          expect(await computed(page, '[data-slot="toast"]', "transform")).toBe("none");
        }
        expect(await computed(page, '[data-slot="toast"]', "transition-property")).not.toMatch(/height|bottom|all/);
        await page.keyboard.press("F6");
        await expect(page.locator('[data-slot="toast-viewport"]').filter({ has: toast })).toBeFocused();
        await page.keyboard.press("Tab");
        await expect(toast).toBeFocused();
        await page.keyboard.press("Escape");
        await expect(toast).toHaveCount(0);
      });
    }
  });
}
for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`toast ${colorScheme}`, () => {
    test.use({ colorScheme });
    test("stack, action, axe and screenshots", async ({ page }, testInfo) => {
      await openComponent(page, "toast", "none", "toast-demo");
      const types = page.locator('[data-component-example="toast/types"]');
      await types.getByRole("button", { name: "Show success", exact: true }).click();
      await types.getByRole("button", { name: "Show error", exact: true }).click();
      const toasts = page.locator('[data-slot="toast"]');
      await expect(toasts).toHaveCount(2);
      const boxes = await toasts.evaluateAll((elements) =>
        elements.map((el) => {
          const r = el.getBoundingClientRect();
          return { top: r.top, bottom: r.bottom };
        }),
      );
      const [front, behind] = boxes;
      if (!front || !behind) throw new Error("Expected two notification boxes");
      expect(behind.bottom).toBeLessThanOrEqual(front.top);
      expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual(
        [],
      );
      await page.screenshot({ path: testInfo.outputPath(`toast-${colorScheme}.png`) });
      await types.getByRole("button", { name: "Clear types", exact: true }).click();
      await expect(toasts).toHaveCount(0);
      const actions = page.locator('[data-component-example="toast/actions"]');
      await actions.getByRole("button", { name: "Archive item", exact: true }).click();
      await page.getByRole("button", { name: "Restore item", exact: true }).click();
      await expect(actions.getByRole("status")).toHaveText("Item restored");
      await expect(toasts).toHaveCount(0);
    });
  });
}
