import { expect, type Locator, type Page } from "@playwright/test";

/** Desired behavior after real pointer/Escape history. This currently reproduces
 * the Base UI focus-opening limitation; callers must retain the failure as a
 * finding, rather than treating Enter recovery as passing this assertion. */
export async function expectMenubarSiblingAfterPointerHistory(page: Page, bar: Locator) {
  for (const label of ["File", "Edit", "View"]) {
    await bar.getByRole("menuitem", { name: label, exact: true }).click();
    await expect(page.locator('[data-slot="menubar-content"]')).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator('[data-slot="menubar-content"]')).toHaveCount(0);
    await page.mouse.move(0, 0);
  }
  await bar.getByRole("menuitem", { name: "File", exact: true }).press("ArrowDown");
  await expect(page.getByRole("menuitem", { name: "File command", exact: true })).toBeFocused();
  await expect(bar).toHaveAttribute("data-has-submenu-open", "");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("menuitem", { name: "Edit command", exact: true })).toBeVisible();
}
