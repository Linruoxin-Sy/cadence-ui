import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { MODES } from "./helpers";

async function setMode(page: Page, mode: string) {
  await page
    .getByRole("group", { name: "Motion mode" })
    .getByRole("button", { name: mode, exact: true })
    .evaluate((node) => (node as HTMLButtonElement).click());
}

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test.describe(`chart ${reducedMotion}`, () => {
    test.use({ reducedMotion });
    for (const mode of MODES) {
      test(`data, engine clock, keyboard and downgrade ${mode}`, async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await page.goto(`/components/chart?motion=${mode}`);
        await page.waitForLoadState("networkidle");
        const top = page.locator('[data-preview="chart"]');
        await expect(top.locator("select")).toHaveCount(0);
        await expect(top.getByRole("button")).toHaveCount(0);
        await expect(top.locator(".recharts-bar")).toHaveCount(2);
        const preview = page.locator('[data-component-example="chart/live-data"]');
        let root = preview.locator('[data-live-chart="bar"] [data-slot="chart"]');
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
          const specimen = preview.locator(`[data-live-chart="${type}"]`);
          root = specimen.locator('[data-slot="chart"]');
          const fixed = page.locator(`[data-component-example="chart/${type}"]`);
          await expect(fixed.locator(`.recharts-${type}`).first()).toBeAttached();
          await expect(root.locator("svg")).toBeVisible();
          // Settle the mount, then update the actual series data.
          await sample();
          const before = await geometry();
          await specimen.getByRole("button").scrollIntoViewIfNeeded();
          // Record in the browser from the update event, so a protocol round trip
          // cannot consume the entire token clock on this multi-chart page.
          const frames = await root.evaluate(async (el) => {
            const button = el.closest("[data-live-chart]")?.querySelector("button");
            if (!(button instanceof HTMLButtonElement)) throw new Error("Missing update action");
            button.click();
            const values: string[] = [];
            for (let i = 0; i < 50; i++) {
              await new Promise(requestAnimationFrame);
              values.push([...el.querySelectorAll("svg path")].map((path) => path.getAttribute("d")).join("|"));
            }
            return values;
          });
          expect(frames.at(-1)).not.toBe(before);
          if (effective === "full") expect(new Set(frames).size).toBeGreaterThan(2);
          else expect(new Set(frames.slice(2)).size).toBe(1);
          const final = await geometry();
          await sample();
          expect(await geometry()).toBe(final); // explicit 5s duration/delay cannot bypass token clock
        }
        root = preview.locator('[data-live-chart="bar"] [data-slot="chart"]');
        const saved = await root.elementHandle();
        await sample();
        const surface = root.locator('svg[role="application"]');
        await surface.focus();
        await page.keyboard.press("ArrowRight");
        await expect(root.locator(".recharts-tooltip-wrapper")).toBeVisible();
        await page.keyboard.press("ArrowRight");
        await expect(root.locator(".recharts-tooltip-wrapper")).toContainText("Desktop");
        await setMode(page, "full");
        await preview.locator('[data-live-chart="bar"]').getByRole("button").click();
        await setMode(page, "none");
        await expect(root).toHaveAttribute("data-motion", "none");
        expect(await root.evaluate((node, original) => node === original, saved)).toBe(true);
        const stopped = await sample();
        expect(new Set(stopped.slice(2)).size).toBe(1);
        if (reducedMotion === "no-preference") {
          await setMode(page, "full");
          await preview.locator('[data-live-chart="bar"]').getByRole("button").click();
          await page.emulateMedia({ reducedMotion: "reduce" });
          await expect(root).toHaveAttribute("data-motion", "reduced");
          const systemStopped = await sample();
          expect(new Set(systemStopped.slice(2)).size).toBe(1);
        }
        const width = await root.locator("svg").getAttribute("width");
        await page.setViewportSize({ width: 390, height: 844 });
        await expect.poll(() => root.locator("svg").getAttribute("width")).not.toBe(width);
        const bar = preview.locator('[data-live-chart="bar"]');
        await bar.getByText("View data table").click();
        await expect(bar.getByRole("table")).toContainText("Jan");
        const tooltips = page.locator('[data-component-example="chart/tooltips"]');
        for (const marker of ["dot", "line", "dashed", "hidden", "formatted"]) {
          const tooltip = tooltips.locator(`[data-tooltip-example="${marker}"] .recharts-tooltip-wrapper`);
          await tooltip.scrollIntoViewIfNeeded();
          await expect(tooltip).toBeVisible();
          await expect(tooltip).toContainText(marker === "formatted" ? "visits" : "305");
          if (marker === "dashed") await expect(tooltip.locator(".border-dashed")).toBeVisible();
          if (marker === "hidden") await expect(tooltip.locator('[style*="--color-bg"]')).toHaveCount(0);
        }
        const legends = page.locator('[data-component-example="chart/legends"] figure');
        await expect(legends).toHaveCount(2);
        await expect(legends.nth(0).locator(".lucide-monitor")).toBeAttached();
        await expect(legends.nth(1).locator(".lucide-monitor")).toHaveCount(0);
        const ids = await page
          .locator("[data-chart]")
          .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-chart")));
        expect(new Set(ids).size).toBe(ids.length);
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
