import { expect, test } from "@playwright/test";

/**
 * `/docs/**` and `/components/**` live in one route-group layout, so crossing
 * between them must not unmount the sidebar. A remount re-arms every row's
 * entrance and resets the disclosure state, which is the flash this guards.
 *
 * The probe attribute is written onto the live `<aside>`; React only replaces it
 * if the layout is remounted, so it is the cheapest proof of continuity.
 */
test("keeps the sidebar mounted when crossing docs and components", async ({ page }) => {
  await page.goto("/docs/installation");
  await page.waitForLoadState("networkidle");

  const aside = page.locator("aside");
  const docsHeader = aside.getByRole("button", { name: "Docs", exact: true });
  await expect(docsHeader).toBeVisible();

  await aside.evaluate((element) => {
    element.dataset.sidebarProbe = "mounted";
  });

  // Collapse DOCS first: a remount would reopen it, so this assertion fails
  // alongside the probe if the layout ever stops being shared.
  await docsHeader.click();
  await expect(docsHeader).toHaveAttribute("aria-expanded", "false");

  await aside.locator('a[href="/components/button"]').click();
  await expect(page).toHaveURL(/\/components\/button$/);

  await expect(aside).toHaveAttribute("data-sidebar-probe", "mounted");
  await expect(docsHeader).toHaveAttribute("aria-expanded", "false");

  // Cross back in the other direction; expanding DOCS is allowed to animate its
  // rows, but the sidebar itself must remain the same mount.
  await docsHeader.click();
  await aside.locator('a[href="/docs/theming"]').click();
  await expect(page).toHaveURL(/\/docs\/theming$/);

  await expect(aside).toHaveAttribute("data-sidebar-probe", "mounted");
  await expect(docsHeader).toHaveAttribute("aria-expanded", "true");
});
