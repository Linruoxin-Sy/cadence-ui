import { expect, test } from "@playwright/test";
import { MODES } from "./helpers";

for (const os of ["no-preference", "reduce"] as const)
  for (const mode of MODES)
    test(`Breadcrumb examples: native disclosure, decorative separators and router links ${mode}/${os}`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: os });
      await page.goto(`/components/breadcrumb?motion=${mode}&variant=unknown`);
      await page.waitForLoadState("networkidle");
      const top = page.locator('[data-preview="breadcrumb"]');
      await expect(top.getByRole("combobox")).toHaveCount(0);
      await expect(top.locator('[data-slot="breadcrumb"]')).toHaveCount(2);
      const card = page.locator('[data-component-example="breadcrumb/collapsed"]');
      const summary = card.locator("summary");
      const ancestor = card.getByRole("link", { name: "Documentation", exact: true });
      await expect(ancestor).not.toBeVisible();
      await summary.focus();
      await summary.press("Enter");
      await expect(ancestor).toBeVisible();
      await expect(ancestor).toHaveAttribute("href", "/docs");
      await expect(top.locator("details")).not.toHaveAttribute("open");
      await summary.press(" ");
      await expect(ancestor).not.toBeVisible();
      await expect(summary).toBeFocused();
      const current = card.locator('[aria-current="page"]');
      await expect(current).toHaveJSProperty("tagName", "SPAN");
      await expect(current).toHaveAttribute("aria-disabled", "true");
      expect(await current.evaluate((node) => (node as HTMLElement).tabIndex)).toBe(-1);
      const separators = page.locator(
        '[data-component-example="breadcrumb/separator"] [data-slot="breadcrumb-separator"]',
      );
      expect(await separators.allTextContents()).toEqual(["/", "/"]);
      for (const separator of await separators.all()) {
        await expect(separator).toHaveAttribute("aria-hidden", "true");
        await expect(separator).toHaveAttribute("role", "presentation");
        await expect(separator.locator("svg")).toHaveCount(0);
      }
      const chevron = top.locator('[data-slot="breadcrumb-separator"] svg').first();
      expect(await chevron.evaluate((node) => node.getBoundingClientRect().width)).toBe(14);
      expect(
        await page
          .locator('[data-slot="breadcrumb"]')
          .evaluateAll((nodes) =>
            nodes.every((node) => !node.hasAttribute("data-motion") && node.getAnimations().length === 0),
          ),
      ).toBe(true);
      const router = page.locator('[data-component-example="breadcrumb/router"] a').last();
      await expect(router).toHaveAttribute("data-slot", "breadcrumb-link");
      await expect(router).toHaveAttribute("href", "/components");
      await router.focus();
      await router.press("Enter");
      await expect(page).toHaveURL(/\/components$/);
    });

test("Breadcrumb: collapsed ancestors remain operable without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(`${baseURL}/components/breadcrumb`);
    const card = page.locator('[data-component-example="breadcrumb/collapsed"]');
    await card.locator("summary").focus();
    await page.keyboard.press("Enter");
    const ancestor = card.getByRole("link", { name: "Documentation", exact: true });
    await expect(ancestor).toBeVisible();
    await ancestor.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/docs$/);
  } finally {
    await context.close();
  }
});
