import { expect, test } from "@playwright/test";
import { expectMenubarSiblingAfterPointerHistory } from "../fixtures/menubar-pointer-history";

// This intentionally retains the upstream 1.9.0 failure until the distributed
// dependency is fixed. Enter recovery does not satisfy sibling arrow navigation.
for (const width of [1280, 390])
  for (const mode of ["full", "reduced", "none"] as const)
    test(`Menubar pointer history opens a sibling ${width}/${mode}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(`/components/menubar?motion=${mode}`);
      await page.waitForLoadState("networkidle");
      const bar = page.getByRole("menubar", { name: "Looping menus" });
      const trigger = await bar.getByRole("menuitem", { name: "Edit", exact: true }).elementHandle();
      await expectMenubarSiblingAfterPointerHistory(page, bar);
      await page.keyboard.press("Escape");
      await expect(bar.getByRole("menuitem", { name: "Edit", exact: true })).toBeFocused();
      expect(await trigger?.evaluate((node) => node.isConnected)).toBe(true);
    });
