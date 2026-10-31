import { expect, test } from "@playwright/test";

/**
 * The package-manager switcher is a site-wide preference, and the unit tests prove
 * that against jsdom. This is the same question in a real browser: the choice arrives
 * after hydration (the server cannot read storage), one click has to reach every fence
 * on the page, and the next page — and the next visit — has to start on it.
 */
test("one package-manager choice reaches every install command on the site", async ({ page }) => {
  await page.goto("/docs/installation");
  // The handler exists only after hydration; clicking earlier is a no-op, which would
  // read as a broken switcher.
  await page.waitForLoadState("networkidle");

  const lists = page.getByRole("tablist", { name: "Package manager" });
  await expect(lists).toHaveCount(4);

  // The server paints pnpm; every fence agrees before the reader touches anything.
  for (const list of await lists.all()) {
    await expect(list.getByRole("tab", { name: "pnpm" })).toHaveAttribute("aria-selected", "true");
  }

  await lists.first().getByRole("tab", { name: "npm", exact: true }).click();

  for (const list of await lists.all()) {
    await expect(list.getByRole("tab", { name: "npm", exact: true })).toHaveAttribute("aria-selected", "true");
  }

  // The visible panel is the npm command, and every fence — not only the clicked one —
  // moved with it.
  const panels = page.getByRole("tabpanel");
  await expect(panels.first()).toContainText("npx create-next-app@latest my-app");
  await expect(panels.first()).toContainText("cd my-app");
  await expect(panels.nth(1)).toContainText("npx shadcn@latest add @cadence/cadence-theme");
  expect(await page.evaluate(() => localStorage.getItem("cadence-package-manager"))).toBe("npm");

  // A reload is a new provider reading the stored value.
  await page.reload();
  await page.waitForLoadState("networkidle");
  for (const list of await page.getByRole("tablist", { name: "Package manager" }).all()) {
    await expect(list.getByRole("tab", { name: "npm", exact: true })).toHaveAttribute("aria-selected", "true");
  }

  // And the preference is not page-local: the home page's install commands agree.
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const homeLists = page.getByRole("tablist", { name: "Package manager" });
  await expect(homeLists).toHaveCount(2);
  for (const list of await homeLists.all()) {
    await expect(list.getByRole("tab", { name: "npm", exact: true })).toHaveAttribute("aria-selected", "true");
  }
});
