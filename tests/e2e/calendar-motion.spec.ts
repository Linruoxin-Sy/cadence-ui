import { expect, type Page, test } from "@playwright/test";
import { effectiveMode, MODES } from "./helpers";

/**
 * Real-engine evidence for the calendar motion contract. jsdom can time a hook but
 * cannot answer what the browser paints: these cases read the committed month shell,
 * the actual month grid and the real day/navigation buttons in all three modes under
 * both OS preferences. `?motion=` drives the requested mode and `reducedMotion` drives
 * the OS preference the provider honours, so each cell names both.
 */
const PREFERENCES = [false, true] as const;
const SCHEMES = ["light", "dark"] as const;
const WIDTHS = [
  { label: "wide", width: 1440, height: 1000 },
  { label: "narrow", width: 720, height: 900 },
] as const;
const preferenceName = (prefersReduced: boolean) =>
  prefersReduced ? "prefers-reduced-motion: reduce" : "prefers-reduced-motion: no-preference";
const single = (page: Page) => page.locator('[data-component-example="calendar/single-selection"]');
const weekRows = (page: Page) => page.locator('[data-component-example="calendar/week-row-height"]');

async function open(page: Page, requested: (typeof MODES)[number]) {
  await page.goto(`/components/calendar?motion=${requested}`);
  await page.waitForLoadState("networkidle");
  await expect
    .poll(
      () =>
        page
          .locator("[data-document-entrance]")
          .first()
          .evaluate((node) => getComputedStyle(node).clipPath),
      { timeout: 60_000 },
    )
    .toBe("none");
}

/** The declared paint family and its effective clock on one real owner. */
async function paintClock(page: Page, selector: string) {
  return page
    .locator(selector)
    .first()
    .evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        mode: element.getAttribute("data-motion"),
        property: style.transitionProperty,
        duration: style.transitionDuration.split(",").map((time) => Number.parseFloat(time)),
        delay: style.transitionDelay,
      };
    });
}

/** Sample the month shell's committed height while a month change is applied. */
async function heightFrames(page: Page, frames = 24) {
  const shell = weekRows(page).locator('[data-slot="calendar-month"]');
  return shell.evaluate(async (element, count) => {
    const samples: number[] = [];
    for (let index = 0; index < count; index++) {
      await new Promise(requestAnimationFrame);
      samples.push(Math.round(element.getBoundingClientRect().height));
    }
    return samples;
  }, frames);
}

for (const prefersReduced of PREFERENCES) {
  test.describe(preferenceName(prefersReduced), () => {
    test.use({ reducedMotion: prefersReduced ? "reduce" : "no-preference" });

    for (const requested of MODES) {
      const mode = effectiveMode(requested, prefersReduced);

      test(`paints the real day, navigation and month owners for ?motion=${requested}`, async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 1000 });
        await open(page, requested);
        const scope = single(page);

        for (const slot of [
          "calendar",
          "calendar-month",
          "calendar-month-grid",
          "calendar-caption-label",
          "calendar-nav-previous",
          "calendar-nav-next",
        ])
          await expect(scope.locator(`[data-slot="${slot}"]`).first()).toHaveAttribute("data-motion", mode);

        // Every real date cell and navigation button is one scoped paint owner.
        const day = await paintClock(page, '[data-component-example="calendar/single-selection"] [data-slot="button"]');
        expect(day.mode).toBe(mode);
        expect(day.property).toBe("background-color, color");
        expect(day.delay).toBe("0s");
        expect(day.duration.every((time) => (mode === "none" ? time === 0 : time > 0))).toBe(true);
        for (const selector of [
          '[data-component-example="calendar/single-selection"] [data-slot="calendar-nav-previous"]',
          '[data-component-example="calendar/single-selection"] [data-slot="calendar-nav-next"]',
        ]) {
          const owner = await paintClock(page, selector);
          expect(owner.property).toBe("background-color, color");
          expect(owner.duration.every((time) => (mode === "none" ? time === 0 : time > 0))).toBe(true);
        }

        // Navigation keeps DayPicker's native activation and owns no press layer.
        await expect(scope.locator('[data-slot="calendar-nav-next-feedback"]')).toHaveCount(0);

        // A committed month change paints the same grid table, and the shell follows
        // the committed week count: animated in full, immediate otherwise.
        const grid = scope.getByRole("grid");
        const height = heightFrames(page);
        await scope.getByRole("button", { name: /next month/i }).click();
        const samples = await height;
        await expect(grid).toHaveAttribute("aria-label", /(?:December|January|February)/);
        const distinct = new Set(samples).size;
        if (mode === "full") expect(distinct).toBeGreaterThan(1);
        else expect(distinct).toBe(1);
        expect(samples.at(-1)).toBeGreaterThan(0);

        // Keyboard navigation keeps the semantic day focused on the same table.
        const day12 = scope.getByRole("button", { name: /November 12th/i });
        await day12.focus();
        await page.keyboard.press("ArrowRight");
        await expect(scope.getByRole("button", { name: /November 13th/i })).toBeFocused();
        await expect(grid).toHaveAttribute("data-motion", mode);
      });
    }

    test("captures the committed calendar in every mode and scheme", async ({ page }) => {
      for (const scheme of SCHEMES) {
        await page.emulateMedia({ colorScheme: scheme });
        for (const viewport of WIDTHS) {
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          for (const requested of MODES) {
            await open(page, requested);
            const preference = prefersReduced ? "reduce" : "no-preference";
            await weekRows(page).screenshot({
              path: `.cache/calendar/${requested}-${preference}-${scheme}-${viewport.label}.png`,
            });
            await single(page).screenshot({
              path: `.cache/calendar/${requested}-${preference}-${scheme}-${viewport.label}-selection.png`,
            });
          }
        }
      }
    });
  });
}

test("keeps the first month readable without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await page.goto("/components/calendar");
  const grid = page.locator('[data-component-example="calendar/single-selection"]').getByRole("grid").first();
  await expect(grid).toBeVisible();
  expect(await grid.locator("tbody tr").count()).toBeGreaterThan(3);
  expect(await grid.evaluate((node) => getComputedStyle(node).opacity)).toBe("1");
  await expect(page.getByRole("button", { name: /November 12th/i }).first()).toBeVisible();
  await context.close();
});
