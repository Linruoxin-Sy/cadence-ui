import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { MODES } from "./helpers";

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test.describe(`table ${reducedMotion}`, () => {
    test.use({ reducedMotion });
    for (const mode of MODES) {
      test(`native static table in ${mode}`, async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await page.goto(`/components/table?motion=${mode}`);
        await page.waitForLoadState("networkidle");
        const preview = page.locator('[data-preview="table"]');
        const table = preview.getByRole("table");
        await expect(table).toHaveAccessibleName("Recent invoices for November.");
        await expect(table.getByRole("columnheader")).toHaveCount(4);
        await expect(table.getByRole("row")).toHaveCount(5);
        await table.getByRole("row").nth(1).hover();
        const styles = await preview.locator('[data-slot^="table"]').evaluateAll((nodes) =>
          nodes.map((node) => {
            const s = getComputedStyle(node);
            return {
              transform: s.transform,
              scale: s.scale,
              animation: s.animationName,
              transition: s.transitionProperty,
              duration: s.transitionDuration,
              opacity: s.opacity,
            };
          }),
        );
        for (const s of styles) {
          expect(s.transform).toBe("none");
          expect(s.scale).toBe("none");
          expect(s.animation).toBe("none");
          expect(s.opacity).toBe("1");
          if (s.duration !== "0s") expect(s.transition).not.toMatch(/all|transform|opacity|filter/);
        }
        expect(errors).toEqual([]);
      });
    }
  });
}
for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`table ${colorScheme}`, () => {
    test.use({ colorScheme });
    test("axe and desktop/narrow scrolling", async ({ page }, testInfo) => {
      await page.goto("/components/table?motion=none");
      await page.waitForLoadState("networkidle");
      await expect(page.locator("html")).toHaveClass(colorScheme === "dark" ? /dark/ : /^(?!.*dark)/);
      expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual(
        [],
      );
      const preview = page.locator('[data-preview="table"]');
      await preview.screenshot({ path: testInfo.outputPath(`table-${colorScheme}-desktop.png`) });
      await page.setViewportSize({ width: 390, height: 844 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await preview.screenshot({ path: testInfo.outputPath(`table-${colorScheme}-narrow-natural.png`) });
      // Exercise the actual documented wide table without changing its geometry.
      const wide = page.locator('[data-component-example="table/horizontal-overflow"]');
      const wideWrapper = wide.locator('[data-slot="table-container"]');
      const sizes = await wideWrapper.evaluate((el) => ({
        client: el.clientWidth,
        scroll: el.scrollWidth,
        overflow: getComputedStyle(el).overflowX,
      }));
      expect(sizes.overflow).toBe("auto");
      expect(sizes.scroll).toBeGreaterThan(sizes.client);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await wide.getByRole("table").focus();
      await expect(wide.getByRole("table")).toBeFocused();
      await page.keyboard.press("ArrowRight");
      await expect.poll(() => wideWrapper.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
      await wideWrapper.evaluate((el) => {
        el.scrollLeft = el.scrollWidth;
      });
      expect(await wideWrapper.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
      await expect(wide.getByRole("cell", { name: "$250.00" })).toBeInViewport();
      await wide.screenshot({ path: testInfo.outputPath(`table-${colorScheme}-narrow.png`) });
      expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual(
        [],
      );
    });
  });
}
