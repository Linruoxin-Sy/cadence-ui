import { expect, test } from "@playwright/test";
import { effectiveMode, MODES } from "./helpers";

for (const mode of MODES)
  for (const os of [false, true])
    test(`Separator fixed orientation, geometry and semantics ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
      await page.goto(`/components/separator?motion=${mode}&variant=vertical`);
      await page.waitForLoadState("networkidle");
      const top = page.locator('[data-preview="separator"]');
      await expect(top.getByRole("combobox")).toHaveCount(0);
      await expect(top.getByRole("separator")).toHaveCount(2);
      for (const orientation of ["horizontal", "vertical"]) {
        const card = page.locator(`[data-component-example="separator/${orientation}"]`);
        for (const scope of [top, card]) {
          await expect(scope).toHaveAttribute("data-preview-motion", effectiveMode(mode, os));
          const rule = scope.getByRole("separator").and(scope.locator(`[data-orientation="${orientation}"]`));
          await expect(rule).toHaveAttribute("aria-orientation", orientation);
          const box = await rule.boundingBox();
          expect(box).not.toBeNull();
          if (orientation === "horizontal") {
            expect(box?.height).toBe(1);
            expect(box?.width).toBeGreaterThan(100);
          } else {
            expect(box?.width).toBe(1);
            expect(box?.height).toBe(24);
          }
          expect(
            await rule.evaluate((node) => ({ tabIndex: node.tabIndex, animations: node.getAnimations().length })),
          ).toEqual({ tabIndex: -1, animations: 0 });
        }
      }
      const decorative = page.locator('[data-component-example="separator/decorative"]');
      await expect(decorative.getByRole("separator")).toHaveCount(0);
      await expect(decorative.locator('[data-slot="separator"]')).toHaveAttribute("role", "none");
      await expect(decorative.locator('[data-slot="separator"]')).toHaveAttribute("aria-hidden", "true");
    });
