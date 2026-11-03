import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const theme of ["light", "dark"])
  test(`alert-dialog compact and pending visual ${theme}`, async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem("cadence-theme", value), theme);
    await page.goto("/components/alert-dialog?motion=none");
    await page.waitForLoadState("networkidle");
    const surface = page.locator('[data-slot="alert-dialog-content"]');
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page
        .locator('[data-component-example="alert-dialog/sizes"]')
        .getByRole("button", { name: "Archive", exact: true })
        .click();
      expect((await surface.boundingBox())?.width).toBe(320);
      await expect(surface.locator('[data-slot="alert-dialog-footer"]')).toHaveCSS(
        "grid-template-columns",
        "131px 131px",
      );
      expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual(
        [],
      );
      await page.screenshot({ path: `.cache/b4-proof/alert-dialog-compact-${theme}-${width}-open.png` });
      await page.keyboard.press("Escape");
      await expect(surface).toHaveCount(0);
      await page.locator('[data-component-example="alert-dialog/pending"]').getByRole("button").click();
      await surface.getByRole("button", { name: "Delete draft", exact: true }).click();
      expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual(
        [],
      );
      await page.screenshot({ path: `.cache/b4-proof/alert-dialog-pending-${theme}-${width}-working.png` });
      await surface.getByRole("button", { name: "Complete request" }).click();
      await expect(surface).toHaveCount(0);
    }
  });
