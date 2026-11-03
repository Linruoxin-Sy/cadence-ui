import { expect, test } from "@playwright/test";
import { effectiveMode, MODES } from "./helpers";

for (const mode of MODES)
  for (const os of [false, true])
    test(`Badge fixed forms, icons and keyboard link ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
      await page.goto(`/components/badge?motion=${mode}&variant=link`);
      await page.waitForLoadState("networkidle");
      const top = page.locator('[data-preview="badge"]');
      const variants = page.locator('[data-component-example="badge/variants"]');
      for (const card of [top, variants]) {
        await expect(card).toHaveAttribute("data-preview-motion", effectiveMode(mode, os));
        await expect(card.getByRole("combobox")).toHaveCount(0);
        await expect(card.locator('[data-slot="badge"]')).toHaveCount(6);
        for (const variant of ["default", "secondary", "destructive", "outline", "ghost", "link"])
          await expect(card.locator(`[data-variant="${variant}"]`)).toBeVisible();
        await expect(card.getByRole("link")).toHaveCount(0);
      }
      const icons = page.locator('[data-component-example="badge/icon"]');
      await expect(icons.locator('[data-slot="badge"] > svg')).toHaveCount(3);
      for (const text of ["Verified", "Pending", "main"])
        await expect(icons.getByText(text, { exact: true })).toBeVisible();
      const link = page.locator('[data-component-example="badge/link"]').getByRole("link", { name: "3 releases" });
      await expect(link).toHaveAttribute("data-slot", "badge");
      await expect(link).toHaveAttribute("href", "/docs/changelog");
      await link.focus();
      await expect(link).toBeFocused();
      await link.press("Enter");
      await expect(page).toHaveURL(/\/docs\/changelog$/);
    });
