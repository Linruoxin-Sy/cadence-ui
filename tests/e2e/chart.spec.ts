import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { MODES } from "./helpers";

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test.describe(`chart ${reducedMotion}`, () => {
    test.use({ reducedMotion });
    for (const mode of MODES) {
      test(`data, engine clock, keyboard and downgrade ${mode}`, async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await page.goto(`/components/chart?motion=${mode}`);
        await page.waitForLoadState("networkidle");
        const preview = page.locator('[data-preview="chart"]');
        const root = preview.locator('[data-slot="chart"]');
        const effective = reducedMotion === "reduce" && mode === "full" ? "reduced" : mode;
        await expect(root).toHaveAttribute("data-motion", effective);
        const geometry = () =>
          root.locator("svg path").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d")).join("|"));
        const sample = () =>
          root.evaluate(async (el) => {
            const values: string[] = [];
            for (let i = 0; i < 50; i++) {
              await new Promise(requestAnimationFrame);
              values.push([...el.querySelectorAll("svg path")].map((p) => p.getAttribute("d")).join("|"));
            }
            return values;
          });
        for (const type of ["bar", "line", "area", "pie"]) {
          await preview.getByLabel("Chart type").selectOption(type);
          await expect(root.locator("svg")).toBeVisible();
          // Settle the mount, then update the actual series data.
          await sample();
          const before = await geometry();
          await preview.getByRole("button", { name: "Update data" }).click();
          const frames = await sample();
          expect(frames.at(-1)).not.toBe(before);
          if (effective === "full") expect(new Set(frames).size).toBeGreaterThan(2);
          else expect(new Set(frames.slice(2)).size).toBe(1);
          const final = await geometry();
          await sample();
          expect(await geometry()).toBe(final); // explicit 5s duration/delay cannot bypass token clock
        }
        await preview.getByLabel("Chart type").selectOption("bar");
        await sample();
        const surface = root.locator('svg[role="application"]');
        await surface.focus();
        await page.keyboard.press("ArrowRight");
        await expect(root.locator(".recharts-tooltip-wrapper")).toBeVisible();
        await page.keyboard.press("ArrowRight");
        await expect(root.locator(".recharts-tooltip-wrapper")).toContainText("Desktop");
        await preview.getByLabel("Chart motion").selectOption("full");
        await preview.getByRole("button", { name: "Update data" }).click();
        await preview.getByLabel("Chart motion").selectOption("none");
        await expect(root).toHaveAttribute("data-motion", "none");
        const stopped = await sample();
        expect(new Set(stopped.slice(2)).size).toBe(1);
        if (reducedMotion === "no-preference") {
          await preview.getByLabel("Chart motion").selectOption("full");
          await preview.getByRole("button", { name: "Update data" }).click();
          await page.emulateMedia({ reducedMotion: "reduce" });
          await expect(root).toHaveAttribute("data-motion", "reduced");
          const systemStopped = await sample();
          expect(new Set(systemStopped.slice(2)).size).toBe(1);
        }
        const width = await root.locator("svg").getAttribute("width");
        await page.setViewportSize({ width: 390, height: 844 });
        await expect.poll(() => root.locator("svg").getAttribute("width")).not.toBe(width);
        await preview.getByText("View data table").click();
        await expect(preview.getByRole("table")).toContainText("Jan");
        expect(errors).toEqual([]);
      });
    }
  });
}
for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`chart ${colorScheme}`, () => {
    test.use({ colorScheme });
    test("axe and responsive screenshots", async ({ page }, testInfo) => {
      await page.goto("/components/chart?motion=none");
      await page.waitForLoadState("networkidle");
      await expect(page.locator("html")).toHaveClass(colorScheme === "dark" ? /dark/ : /^(?!.*dark)/);
      for (const width of [1280, 390]) {
        await page.setViewportSize({ width, height: 844 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        const chart = page.locator('[data-preview="chart"] [data-slot="chart"]');
        expect(await chart.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
        expect(
          (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations,
        ).toEqual([]);
        await page
          .locator('[data-preview="chart"]')
          .screenshot({ path: testInfo.outputPath(`chart-${colorScheme}-${width}.png`) });
      }
    });
  });
}
