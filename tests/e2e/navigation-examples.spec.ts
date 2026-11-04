import { expect, test } from "@playwright/test";
import { MODES } from "./helpers";

for (const os of ["no-preference", "reduce"] as const)
  for (const mode of MODES)
    test(`Pagination examples: finite sizes, link semantics, local results and boundaries ${mode}/${os}`, async ({
      page,
      context,
    }) => {
      await page.emulateMedia({ reducedMotion: os });
      await page.goto(`/components/pagination?motion=${mode}&variant=icon-lg&keep=yes`);
      await page.waitForLoadState("networkidle");
      const top = page.locator('[data-preview="pagination"]');
      await expect(top.getByRole("combobox")).toHaveCount(0);
      await expect(top.locator('[data-slot="pagination"]')).toHaveCount(1);
      await expect(top.locator('[aria-current="page"]')).toHaveText("2");
      await expect(top.locator('[aria-current="page"]')).toHaveAttribute("data-variant", "outline");
      await expect(top.getByRole("link", { name: "1", exact: true })).toHaveAttribute("data-variant", "ghost");
      const ellipsis = page.locator(
        '[data-component-example="pagination/collapsed"] [data-slot="pagination-ellipsis"]',
      );
      await expect(ellipsis).toHaveAttribute("aria-hidden", "true");
      expect(await ellipsis.evaluate((node) => (node as HTMLElement).tabIndex)).toBe(-1);
      const sizes = page.locator('[data-component-example="pagination/sizes"] [data-slot="pagination-link"]');
      expect(
        await sizes.evaluateAll((nodes) =>
          nodes.map((node) => ({ size: node.getAttribute("data-size"), height: node.getBoundingClientRect().height })),
        ),
      ).toEqual([
        { size: "default", height: 36 },
        { size: "xs", height: 24 },
        { size: "sm", height: 32 },
        { size: "lg", height: 40 },
        { size: "icon", height: 36 },
        { size: "icon-xs", height: 24 },
        { size: "icon-sm", height: 32 },
        { size: "icon-lg", height: 40 },
      ]);
      for (let i = 4; i < 8; i++)
        expect(await sizes.nth(i).evaluate((node) => node.getBoundingClientRect().width)).toBe([36, 24, 32, 40][i - 4]);
      const local = page.locator('[data-component-example="pagination/local-state"]');
      const results = local.getByRole("region", { name: "Invoice results" });
      const link = local.getByRole("link", { name: "2", exact: true });
      await expect(link).toHaveAttribute("aria-controls", (await results.getAttribute("id")) ?? "missing");
      const original = await link.elementHandle();
      const initialUrl = page.url();
      await link.focus();
      await link.press("Enter");
      await expect(results).toContainText("Invoice 1003");
      await expect(results).not.toContainText("Invoice 1001");
      await expect(link).toHaveAttribute("aria-current", "page");
      await expect(link).toBeFocused();
      expect(page.url()).toBe(initialUrl);
      await expect(top.locator('[aria-current="page"]')).toHaveText("2");
      await page
        .getByRole("group", { name: "Motion mode" })
        .getByRole("button", { name: "none", exact: true })
        .evaluate((button: HTMLButtonElement) => button.click());
      await expect(link).toBeFocused();
      expect(await link.evaluate((node, original) => node === original, original)).toBe(true);
      await expect(results).toContainText("Page 2 of 3");
      const popupEvent = context.waitForEvent("page");
      await link.click({ modifiers: ["Control"] });
      const popup = await popupEvent;
      await popup.waitForLoadState("domcontentloaded");
      expect(new URL(popup.url()).hash).not.toBe("");
      await popup.close();
      await expect(results).toContainText("Page 2 of 3");
      const boundary = page.locator('[data-component-example="pagination/boundary"]');
      const previous = boundary.locator('[aria-label="Go to previous page"]');
      await expect(previous).toHaveAttribute("aria-disabled", "true");
      await expect(previous).not.toHaveAttribute("href");
      const beforeBoundary = page.url();
      await previous.scrollIntoViewIfNeeded();
      const disabledBox = await previous.boundingBox();
      if (!disabledBox) throw new Error("missing disabled previous control");
      await page.mouse.click(disabledBox.x + disabledBox.width / 2, disabledBox.y + disabledBox.height / 2);
      expect(page.url()).toBe(beforeBoundary);
      await boundary.getByRole("link", { name: "1", exact: true }).focus();
      await page.keyboard.press("Shift+Tab");
      await expect(previous).not.toBeFocused();
      const labels = page.locator('[data-component-example="pagination/labels"]');
      await page.setViewportSize({ width: 390, height: 1000 });
      await expect(labels.getByText("Back", { exact: true })).not.toBeVisible();
      await expect(labels.getByRole("link", { name: "Back to previous page" })).toBeVisible();
      await expect(labels.getByRole("link", { name: "Forward to next page" })).toBeVisible();
      await page.setViewportSize({ width: 1280, height: 1000 });
      await expect(labels.getByText("Back", { exact: true })).toBeVisible();
      expect(
        await page
          .locator('[data-slot="pagination"]')
          .evaluateAll((nodes) =>
            nodes.every((node) => !node.hasAttribute("data-motion") && node.getAnimations().length === 0),
          ),
      ).toBe(true);
      const ids = await page.locator("[id]").evaluateAll((nodes) => nodes.map((node) => node.id));
      expect(new Set(ids).size).toBe(ids.length);
      await top.getByRole("link", { name: "Go to previous page" }).focus();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\?page=1#usage$/);
    });

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
