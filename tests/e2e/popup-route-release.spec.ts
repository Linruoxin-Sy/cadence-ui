import { expect, type Page, test } from "@playwright/test";
import { scoped } from "./helpers";

/**
 * A popup is a portal plus a focus trap, and both must leave with the route that
 * opened them. `component-route-lifecycle.spec.ts` covers a dialog; this file is
 * the same guarantee for the other eight popups, each opened from its own preview
 * so the trigger path is the one a reader uses.
 */
const POPUPS = [
  "alert-dialog",
  "popover",
  "tooltip",
  "hover-card",
  "sheet",
  "drawer",
  "dropdown-menu",
  "context-menu",
] as const;

type Popup = (typeof POPUPS)[number];

const portalled = (id: Popup) =>
  `[data-slot="${id === "drawer" ? "drawer-popup" : `${id}-content`}"], [data-slot="${id}-overlay"], [data-slot="${id}-sub-content"]`;

const bodyState = (page: Page) =>
  page.evaluate(
    () => `${getComputedStyle(document.body).overflow}|${getComputedStyle(document.documentElement).overflow}`,
  );

for (const id of POPUPS)
  test(`route departure releases the ${id} portal`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
    });

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/components/input?motion=none");
    await page.waitForLoadState("networkidle");
    const before = await bodyState(page);

    await page.goto(`/components/${id}?motion=full`);
    await page.waitForLoadState("networkidle");
    const opener = page.locator(scoped(id, `[data-slot="${id}-trigger"]`)).first();
    if (id === "tooltip" || id === "hover-card") {
      await opener.evaluate((node) => (node as HTMLElement).blur());
      await opener.focus();
    } else if (id === "context-menu") {
      await opener.click({ button: "right" });
    } else {
      await opener.click();
    }
    await expect(page.locator(portalled(id)).first()).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(/\/components\/input\?motion=none$/);
    await expect(page.locator('[data-preview="input"]')).toBeVisible();
    await expect(page.locator(portalled(id))).toHaveCount(0);
    await expect.poll(() => bodyState(page)).toBe(before);

    const input = page.locator('[data-preview="input"]').getByRole("textbox", { name: "Workspace", exact: true });
    await input.fill("Returned after the portal");
    await expect(input).toHaveValue("Returned after the portal");
    await expect(input).toBeFocused();

    expect(errors).toEqual([]);
  });
