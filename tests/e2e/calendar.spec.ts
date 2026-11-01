import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { MODES } from "./helpers";

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test.describe(`calendar ${reducedMotion}`, () => {
    test.use({ reducedMotion });
    for (const mode of MODES) {
      test(`selection navigation and live motion ${mode}`, async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (e) => errors.push(e.message));
        await page.goto(`/components/calendar?motion=${mode}`);
        await page.waitForLoadState("networkidle");
        const preview = page.locator('[data-preview="calendar"]');
        const grid = preview.getByRole("grid");
        const effective = reducedMotion === "reduce" && mode === "full" ? "reduced" : mode;
        await expect(grid).toHaveAttribute("data-motion", effective);
        await expect(preview.getByRole("button", { name: /November 5th/i })).toBeDisabled();
        await preview.getByRole("button", { name: /November 12th/i }).click();
        await page.keyboard.press("ArrowRight");
        await expect(preview.getByRole("button", { name: /November 13th/i })).toBeFocused();
        await page.keyboard.press("Enter");
        await expect(preview.getByRole("button", { name: /November 13th/i })).toHaveAttribute(
          "data-selected-single",
          "true",
        );
        // Sample from the interaction in the same task so the token's first frames cannot be missed.
        const frames = await preview.evaluate(async (el) => {
          const table = el.querySelector("table");
          if (!table) throw new Error("Missing calendar grid");
          (el.querySelector('[aria-label="Go to the Next Month"]') as HTMLButtonElement).click();
          const samples = [];
          for (let i = 0; i < 50; i++) {
            await new Promise(requestAnimationFrame);
            const s = getComputedStyle(table);
            samples.push({ x: s.transform, opacity: s.opacity, same: table === el.querySelector("table") });
          }
          return samples;
        });
        expect(frames.every((f) => f.same)).toBe(true);
        if (effective === "full")
          expect(frames.some((f) => f.x !== "none" && f.x !== "matrix(1, 0, 0, 1, 0, 0)")).toBe(true);
        else expect(frames.every((f) => f.x === "none")).toBe(true);
        if (effective !== "none") expect(new Set(frames.map((f) => f.opacity)).size).toBeGreaterThan(1);
        else expect(frames.every((f) => f.opacity === "1")).toBe(true);
        await expect(grid).toHaveAttribute("aria-label", "December 2026");
        await preview.getByLabel("Calendar motion").selectOption("full");
        const cancellation = await preview.evaluate(async (el) => {
          const table = el.querySelector("table");
          if (!table) throw new Error("Missing grid");
          (el.querySelector('[aria-label="Go to the Previous Month"]') as HTMLButtonElement).click();
          await new Promise(requestAnimationFrame);
          await new Promise(requestAnimationFrame);
          const active = table.getAnimations().filter((a) => a.playState === "running").length;
          const select = el.querySelector('[aria-label="Calendar motion"]') as HTMLSelectElement;
          select.value = "none";
          select.dispatchEvent(new Event("change", { bubbles: true }));
          await new Promise(requestAnimationFrame);
          await new Promise(requestAnimationFrame);
          return {
            active,
            remaining: table.getAnimations().length,
            transform: getComputedStyle(table).transform,
            same: table === el.querySelector("table"),
          };
        });
        expect(cancellation.active).toBeGreaterThan(0);
        expect(cancellation.remaining).toBe(0);
        expect(cancellation.transform).toBe("none");
        expect(cancellation.same).toBe(true);

        await preview.getByRole("button", { name: /next month/i }).click();
        await preview.getByLabel("Calendar motion").selectOption("none");
        await expect(grid).toHaveAttribute("data-motion", "none");
        await expect.poll(() => grid.evaluate((el) => getComputedStyle(el).transform)).toBe("none");
        await preview.getByRole("button", { name: "Set November 20" }).click();
        const day20 = preview.getByRole("button", { name: /November 20th/i });
        await expect(day20).toHaveAttribute("data-selected-single", "true");
        await day20.focus();
        await page.keyboard.press("PageDown");
        await expect(preview.getByRole("button", { name: /December 20th/i })).toBeFocused();
        await page.keyboard.press("PageUp");
        await expect(day20).toBeFocused();
        await page.keyboard.press("Home");
        await expect(preview.getByRole("button", { name: /November 16th/i })).toBeFocused();
        await page.keyboard.press("End");
        await expect(preview.getByRole("button", { name: /November 22nd/i })).toBeFocused();
        await preview.getByRole("button", { name: /December 1st/i }).click();
        await expect(preview.getByRole("button", { name: /December 1st/i })).toHaveAttribute(
          "data-selected-single",
          "true",
        );
        await preview.getByRole("button", { name: "Set November 20" }).click();
        await preview.getByLabel("Selection mode").selectOption("multiple");
        await preview.getByRole("button", { name: /November 12th/i }).click();
        await preview.getByRole("button", { name: /November 13th/i }).click();
        await expect(preview.getByText("2 dates", { exact: true })).toBeVisible();
        await preview.getByLabel("Selection mode").selectOption("range");
        await preview.getByRole("button", { name: /November 12th/i }).click();
        await preview.getByRole("button", { name: /November 16th/i }).click();
        await expect(preview.locator('[data-range-start="true"]')).toHaveCount(1);
        await expect(preview.locator('[data-range-end="true"]')).toHaveCount(1);
        await expect(preview.locator('[data-range-middle="true"]')).toHaveCount(3);
        await preview.getByLabel("Choose the Month").selectOption("1");
        await expect(grid).toHaveAttribute("aria-label", "February 2026");
        await preview.getByLabel("French").check();
        await expect(grid).toHaveAttribute("aria-label", "février 2026");
        await expect(preview.locator("th[scope=col]").first()).toHaveText("lu");
        if (reducedMotion === "no-preference") {
          await preview.getByLabel("Calendar motion").selectOption("full");
          await preview.getByRole("button", { name: /next month/i }).click();
          await page.emulateMedia({ reducedMotion: "reduce" });
          await expect(grid).toHaveAttribute("data-motion", "reduced");
          await expect.poll(() => grid.evaluate((el) => getComputedStyle(el).transform)).toBe("none");
        }
        expect(errors).toEqual([]);
      });
    }
  });
}
for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`calendar ${colorScheme}`, () => {
    test.use({ colorScheme });
    test("axe and responsive screenshots", async ({ page }, testInfo) => {
      await page.goto("/components/calendar?motion=none");
      await page.waitForLoadState("networkidle");
      await expect(page.locator("html")).toHaveClass(colorScheme === "dark" ? /dark/ : /^(?!.*dark)/);
      await page.getByLabel("Displayed months").selectOption("2");
      for (const width of [1280, 390]) {
        await page.setViewportSize({ width, height: 1100 });
        const bounds = await page.locator('[data-slot="calendar-month-grid"]').evaluateAll((nodes) =>
          nodes.map((n) => {
            const r = n.getBoundingClientRect();
            return { x: r.x, y: r.y, width: r.width };
          }),
        );
        expect(bounds).toHaveLength(2);
        if (width === 390) expect(bounds[1]?.y).toBeGreaterThan(bounds[0]?.y ?? 0);
        else expect(bounds[1]?.x).toBeGreaterThan(bounds[0]?.x ?? 0);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        expect(
          (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations,
        ).toEqual([]);
        await page
          .locator('[data-preview="calendar"]')
          .screenshot({ path: testInfo.outputPath(`calendar-${colorScheme}-${width}.png`) });
      }
    });
  });
}
