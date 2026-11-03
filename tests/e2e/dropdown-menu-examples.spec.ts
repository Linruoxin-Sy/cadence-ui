import { expect, test } from "@playwright/test";

test("dropdown-menu commands, local selection, grouping, disabled items and external opening", async ({ page }) => {
  await page.goto("/components/dropdown-menu?motion=none");
  await page.waitForLoadState("networkidle");
  const card = (name: string) => page.locator(`[data-component-example="dropdown-menu/${name}"]`);
  const popup = page.locator('[data-slot="dropdown-menu-content"]');
  await card("items").getByRole("button").click();
  await expect(popup.locator('[data-variant="default"]').first()).toBeVisible();
  await expect(popup.locator('[data-variant="destructive"]')).toBeVisible();
  await expect(popup.getByRole("menuitem", { name: "Keep open" })).toHaveAttribute("data-inset", "true");
  await popup.getByRole("menuitem", { name: "Keep open" }).click();
  await expect(popup).toBeVisible();
  await expect(card("items").locator('[role="status"]')).toHaveText("Still open");
  await popup.getByRole("menuitem", { name: "Delete", exact: false }).click();
  await expect(popup).toHaveCount(0);
  await expect(card("items").locator('[role="status"]')).toHaveText("Delete selected locally");
  const viewTrigger = card("selection").getByRole("button");
  const viewNode = await viewTrigger.elementHandle();
  await viewTrigger.click();
  await popup.getByRole("menuitemcheckbox", { name: "Comments", exact: true }).click();
  await popup.getByRole("menuitemradio", { name: "Compact", exact: true }).click();
  await expect(card("selection").locator('[role="status"]')).toHaveText("Comments: shown; density: compact");
  await page.keyboard.press("Escape");
  await expect(popup).toHaveCount(0);
  await expect(popup).toHaveCount(0);
  await page.getByRole("group", { name: "Motion mode" }).getByRole("button", { name: "reduced", exact: true }).click();
  await expect(popup).toHaveCount(0);
  await viewTrigger.click();
  await expect(popup.getByRole("menuitemcheckbox", { name: "Comments", exact: true })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await expect(popup.getByRole("menuitemradio", { name: "Compact", exact: true })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  expect(await viewTrigger.evaluate((node, saved) => node === saved, viewNode)).toBe(true);

  await page.keyboard.press("Escape");
  await expect(popup).toHaveCount(0);
  await card("grouping").getByRole("button").click();
  await expect(popup.getByRole("group", { name: "Pull request", exact: true })).toBeVisible();
  await expect(popup.getByRole("group", { name: "History", exact: true })).toBeVisible();
  await expect(popup.getByRole("group", { name: "Project commands", exact: true })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(popup).toHaveCount(0);
  await card("submenus").getByRole("button").click();
  await popup.getByRole("menuitem", { name: "Move to", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  const submenu = page.locator('[data-slot="dropdown-menu-sub-content"]');
  await expect(submenu).toBeVisible();
  await submenu.getByRole("menuitem", { name: "Backlog", exact: true }).press("Enter");
  await expect(popup).toHaveCount(0);
  await expect(submenu).toHaveCount(0);
  await expect(card("submenus").locator('[role="status"]')).toHaveText("Backlog");
  await expect(card("disabled").getByRole("button", { name: "Disabled trigger", exact: true })).toBeDisabled();
  await card("disabled").getByRole("button", { name: "Unavailable commands" }).press("ArrowDown");
  await expect(popup.getByRole("menuitem", { name: "Done", exact: true })).toBeFocused();
  for (const role of ["menuitem", "menuitemcheckbox", "menuitemradio"] as const) {
    for (const item of await popup
      .getByRole(role)
      .filter({ hasNotText: /^Done$/ })
      .all())
      await expect(item).toHaveAttribute("aria-disabled", "true");
  }
  await page.keyboard.press("ArrowDown");
  await expect(popup.getByRole("menuitem", { name: "Delete locked item", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(popup).toBeVisible();
  await expect(popup.getByRole("menuitemcheckbox", { name: "Locked visibility" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await page.keyboard.press("Escape");
  await expect(popup).toHaveCount(0);
  await card("controlled").getByRole("button", { name: "Open externally" }).click();
  await expect(popup).toBeVisible();
  const anchor = await card("controlled").locator('[data-slot="dropdown-menu-trigger"]').boundingBox();
  const panel = await popup.boundingBox();
  if (!anchor || !panel) throw new Error("missing controlled menu anchor");
  expect(Math.abs(panel.y - anchor.y - anchor.height - 4)).toBeLessThan(1);

  await popup.getByRole("menuitem", { name: "Copy", exact: true }).click();
  await expect(popup).toHaveCount(0);
  await expect(card("controlled").locator('[role="status"]')).toHaveText("Copied locally");
  await expect(page.locator('[data-preview="dropdown-menu"] [role="status"]')).toHaveText("No action yet");
  for (const key of ["Tab", "Shift+Tab"]) {
    await viewTrigger.press("ArrowDown");
    await expect(popup).toBeVisible();
    await page.keyboard.press(key);
    await expect(popup).toHaveCount(0);
    expect(
      await page.evaluate(() => {
        const active = document.activeElement;
        return (
          !!active?.isConnected &&
          active !== document.body &&
          !active.closest('[data-base-ui-focus-guard], [aria-hidden="true"], [inert]')
        );
      }),
    ).toBe(true);
  }
});

test("dropdown-menu fixed placement, alignment and RTL geometry", async ({ page }) => {
  await page.goto("/components/dropdown-menu?motion=none");
  await page.waitForLoadState("networkidle");
  const popup = page.locator('[data-slot="dropdown-menu-content"]');
  for (const name of ["sides", "alignments", "logical-sides"]) {
    const card = page.locator(`[data-component-example="dropdown-menu/${name}"]`);
    for (const trigger of await card.getByRole("button").all()) {
      await trigger.click();
      await expect(popup).toBeVisible();
      const value = await trigger.textContent();
      const side = value === "inline-start" ? "right" : value === "inline-end" ? "left" : value;
      if (name === "sides") await expect(popup).toHaveAttribute("data-side", side ?? "");
      const t = await trigger.boundingBox();
      const p = await popup.boundingBox();
      if (!t || !p) throw new Error("missing menu bounds");
      if (name === "logical-sides") {
        if (value === "inline-start") expect(p.x).toBeGreaterThan(t.x + t.width);
        else expect(p.x + p.width).toBeLessThan(t.x);
      }
      if (name === "alignments") {
        const fraction = value === "start" ? 0 : value === "end" ? 1 : 0.5;
        expect(Math.abs(p.x + p.width * fraction - t.x - t.width * fraction)).toBeLessThan(1);
      }
      await page.keyboard.press("Escape");
      await expect(popup).toHaveCount(0);
      await expect(popup).toHaveCount(0);
    }
  }
});
