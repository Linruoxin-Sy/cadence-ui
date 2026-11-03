import { expect, test } from "@playwright/test";
import { effectiveMode, MODES } from "./helpers";

for (const os of [false, true])
  for (const mode of MODES)
    test(`Toc examples: isolated anchors, controlled selection and scroll host ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
      await page.goto(`/components/toc?motion=${mode}&speed=0.25&variant=unknown&keep=yes`);
      await page.waitForLoadState("networkidle");
      const top = page.locator('[data-preview="toc"]');
      await expect(top.getByRole("link")).toHaveCount(2);
      await expect(top.locator("button, select")).toHaveCount(0);
      const nested = page.locator('[data-component-example="toc/nested"]');
      await expect(nested.getByRole("link", { name: "Props", exact: true })).toHaveAttribute("data-depth", "3");
      const pageToc = page.locator("[data-document-toc] nav");
      await expect(pageToc.getByRole("link", { name: "Scroll tracking", exact: true })).toHaveCount(1);
      await expect(pageToc.getByRole("link", { name: "Props", exact: true })).toHaveCount(0);
      for (const link of await page
        .locator('[data-preview="toc"] a[data-toc-id], [data-component-example^="toc/"] a[data-toc-id]')
        .all()) {
        const target = await link.getAttribute("data-toc-id");
        await expect(page.locator(`[id="${target}"]`)).toHaveCount(1);
      }
      const controlled = page.locator('[data-component-example="toc/controlled"]');
      const current = controlled.getByRole("link", { name: "Details", exact: true });
      await controlled.getByRole("button", { name: "Mark Details" }).click();
      await expect(current).toHaveAttribute("aria-current", "location");
      const indicator = controlled.locator('[data-slot="toc-indicator"]');
      const saved = await indicator.elementHandle();
      await controlled.getByRole("button", { name: "Clear highlight" }).click();
      await expect(controlled.locator('[aria-current="location"]')).toHaveCount(0);
      await controlled.getByRole("button", { name: "Mark Details" }).click();
      await expect(current).toHaveAttribute("aria-current", "location");
      const card = page.locator('[data-component-example="toc/scroll-tracking"]');
      const nav = card.getByRole("navigation", { name: "Article sections" });
      await expect(nav).toHaveAttribute("data-motion", effectiveMode(mode, os));
      const article = card.getByRole("region", { name: "Example article" });
      await article.scrollIntoViewIfNeeded();
      await article.hover();
      const windowY = await page.evaluate(() => window.scrollY);
      await page.mouse.wheel(0, 2000);
      await expect(nav.getByRole("link", { name: "API", exact: true })).toHaveAttribute("aria-current", "location");
      expect(await page.evaluate(() => window.scrollY)).toBe(windowY);
      await expect(current).toHaveAttribute("aria-current", "location");
      const first = nav.getByRole("link", { name: "Overview", exact: true });
      await first.focus();
      await first.press("Enter");
      const target = await first.getAttribute("data-toc-id");
      await expect(page.locator(`[id="${target}"]`)).toBeFocused();
      await expect(first).toHaveAttribute("aria-current", "location");
      expect(await article.evaluate((node) => node.scrollTop)).toBeLessThanOrEqual(1);
      const last = nav.getByRole("link", { name: "API", exact: true });
      await last.click();
      await page
        .getByRole("group", { name: "Motion mode" })
        .getByRole("button", { name: "none", exact: true })
        .evaluate((node) => (node as HTMLButtonElement).click());
      await expect(nav).toHaveAttribute("data-motion", "none");
      const lastTarget = await last.getAttribute("data-toc-id");
      await expect(page.locator(`[id="${lastTarget}"]`)).toBeFocused();
      await expect(last).toHaveAttribute("aria-current", "location");
      expect(await indicator.evaluate((node, original) => node === original, saved)).toBe(true);
      await expect(indicator).toHaveCSS("transform", "none");
      await expect(current).toHaveAttribute("aria-current", "location");
      expect(new URL(page.url()).searchParams.get("keep")).toBe("yes");
      expect(new URL(page.url()).searchParams.get("variant")).toBe("unknown");
      const ids = await page.locator("[id]").evaluateAll((nodes) => nodes.map((node) => node.id));
      expect(new Set(ids).size).toBe(ids.length);
    });

test("Toc example links reach real targets without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.goto(`${baseURL}/components/toc?variant=all`);
    const top = page.locator('[data-preview="toc"]');
    await top.getByRole("link", { name: "Details", exact: true }).click();
    const target = await top.getByRole("link", { name: "Details", exact: true }).getAttribute("data-toc-id");
    await expect(page.locator(`[id="${target}"]`)).toBeInViewport();
    const card = page.locator('[data-component-example="toc/scroll-tracking"]');
    await card.getByRole("link", { name: "API", exact: true }).click();
    const article = card.getByRole("region", { name: "Example article" });
    expect(await article.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
    await expect(article.getByRole("heading", { name: "API", exact: true })).toBeInViewport();
  } finally {
    await context.close();
  }
});
