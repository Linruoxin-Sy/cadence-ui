import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const os of ["no-preference", "reduce"] as const)
  for (const mode of ["full", "reduced", "none"] as const) {
    test(`Toggle v2 changing label ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os });
      await page.goto(`/components/toggle?motion=${mode}&speed=0.25#changing-label`);
      const demo = page.locator('[data-component-example="toggle/changing-label"]');
      const toggle = demo.getByRole("button", { name: "Preview", exact: true });
      await expect(toggle).toBeVisible();
      const node = await toggle.elementHandle();
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-pressed", "true");
      await demo.getByRole("button", { name: "Change label" }).click();
      const updated = demo.getByRole("button", { name: "Preview with formatting", exact: true });
      await expect(updated).toHaveAttribute("aria-pressed", "true");
      expect(await updated.evaluate((n, old) => n === old, node)).toBe(true);
      await expect(updated).toHaveAttribute(
        "data-motion",
        mode === "none" ? "none" : os === "reduce" ? "reduced" : mode,
      );
      await demo.getByRole("button", { name: "Change label" }).click();
      await expect(toggle).toHaveAttribute("aria-pressed", "true");
      await toggle.press("Space");
      await expect(toggle).toHaveAttribute("aria-pressed", "false");
      const axe = await new AxeBuilder({ page })
        .include('[data-component-example="toggle/changing-label"]')
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(axe.violations).toEqual([]);
    });
  }
