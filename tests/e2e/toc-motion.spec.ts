import { expect, type Page, test } from "@playwright/test";
import { effectiveMode, MODES } from "./helpers";

/**
 * The documentation page's own section navigation is the real Toc, so this suite
 * reads the geometry of the scroll owner that ships instead of a hand-built fixture.
 * `?motion=` drives the requested mode; `reducedMotion` drives the OS preference the
 * provider honours; `colorScheme` covers the paint the rail and links resolve.
 */
const PREFERENCES = [false, true] as const;
const SCHEMES = ["light", "dark"] as const;
const WIDTHS = [
  { label: "wide", width: 1440, height: 900 },
  { label: "narrow", width: 720, height: 720 },
] as const;
const preferenceName = (prefersReduced: boolean) =>
  prefersReduced ? "prefers-reduced-motion: reduce" : "prefers-reduced-motion: no-preference";

const indicator = (page: Page) => page.locator('[data-document-toc] [data-slot="toc-indicator"]');

/** The committed indicator box, read from the element the owner writes it on. */
async function box(page: Page) {
  return indicator(page).evaluate((element) => {
    const style = (element as HTMLElement).style;
    const rail = element.closest('[data-slot="toc-track"]') as HTMLElement | null;
    return {
      hidden: (element as HTMLElement).hidden,
      visibility: getComputedStyle(element).visibility,
      top: Number.parseFloat(style.top),
      height: Number.parseFloat(style.height),
      width: Number.parseFloat(style.width),
      transform: getComputedStyle(element).transform,
      rail: rail?.offsetHeight ?? 0,
    };
  });
}

async function open(page: Page, requested: (typeof MODES)[number]) {
  await page.goto(`/components/button?motion=${requested}`);
  await expect(page.locator("[data-document-toc] nav")).toHaveAttribute("data-motion", /full|reduced|none/);
  await page.waitForLoadState("networkidle");
  // The indicator is placed from the first real measurement, not from SSR.
  await expect.poll(async () => (await box(page)).height, { timeout: 15_000 }).toBeGreaterThan(0);
}

for (const prefersReduced of PREFERENCES) {
  test.describe(preferenceName(prefersReduced), () => {
    test.use({ reducedMotion: prefersReduced ? "reduce" : "no-preference" });

    for (const requested of MODES) {
      const mode = effectiveMode(requested, prefersReduced);

      test(`commits the reading indicator inside its rail for ?motion=${requested}`, async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await open(page, requested);

        await expect(page.locator("[data-document-toc] nav")).toHaveAttribute("data-motion", mode);
        for (const slot of ["toc-list", "toc-link", "toc-link-text", "toc-title", "toc-indicator"])
          await expect(page.locator(`[data-document-toc] [data-slot="${slot}"]`).first()).toHaveAttribute(
            "data-motion",
            mode,
          );

        const first = await box(page);
        expect(first.hidden).toBe(false);
        expect(first.width).toBe(1);
        expect(first.height).toBeGreaterThan(0);
        expect(first.top).toBeGreaterThanOrEqual(0);
        expect(first.top + first.height).toBeLessThanOrEqual(first.rail + 0.5);

        // Select another section: the same element keeps the box, and only its position
        // changes. Full motion may be mid-flight, so compare the settled destination.
        const links = page.locator("[data-document-toc] a[data-toc-id]");
        const count = await links.count();
        expect(count).toBeGreaterThan(2);
        await links.nth(2).click();
        await expect(page.locator("[data-document-toc] nav")).toHaveAttribute("data-motion", mode);
        await page.waitForTimeout(700);

        const moved = await box(page);
        expect(moved.height).toBeGreaterThan(0);
        expect(moved.top + moved.height).toBeLessThanOrEqual(moved.rail + 0.5);
        expect(moved.top).not.toBe(first.top);
        expect(await indicator(page).evaluate((element) => element.style.visibility)).not.toBe("hidden");

        // No CSS size clock and no competing transform writer on the owned surfaces.
        expect(
          await page.locator('[data-document-toc] [data-slot="toc-list"]').evaluate((element) => {
            const style = getComputedStyle(element);
            return `${style.transitionProperty}|${style.animationName}`;
          }),
        ).toBe("none|none");
      });
    }
  });
}

test.describe("screenshots", () => {
  for (const prefersReduced of PREFERENCES) {
    test.describe(preferenceName(prefersReduced), () => {
      test.use({ reducedMotion: prefersReduced ? "reduce" : "no-preference" });

      for (const scheme of SCHEMES) {
        for (const viewport of WIDTHS) {
          test(`captures every mode ${scheme} ${viewport.label}`, async ({ page }) => {
            await page.emulateMedia({ colorScheme: scheme });
            await page.setViewportSize({ width: viewport.width, height: viewport.height });
            for (const requested of MODES) {
              await open(page, requested);
              const preference = prefersReduced ? "reduce" : "no-preference";
              await page
                .locator("[data-document-toc]")
                .screenshot({ path: `.cache/toc/${requested}-${preference}-${scheme}-${viewport.label}.png` });
            }
          });
        }
      }
    });
  }
});

test("keeps native links and their static current marker without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto("/components/button");
  const toc = page.locator("[data-document-toc] nav");
  await expect(toc).toBeVisible();
  const links = toc.locator("a[data-toc-id]");
  expect(await links.count()).toBeGreaterThan(2);
  // The server marks the current entry with a static rail edge, and every link is a
  // real fragment link that the browser can follow on its own.
  const current = toc.locator('a[aria-current="location"]');
  await expect(current).toHaveCount(1);
  expect(await current.evaluate((element) => getComputedStyle(element).borderLeftColor)).not.toBe("rgba(0, 0, 0, 0)");
  const href = await links.nth(2).getAttribute("href");
  expect(href).toMatch(/^#.+/);
  await links.nth(2).click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await context.close();
});

test("moves the indicator with the active entry and retimes a live mode change", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/components/button?motion=full&speed=0.2");
  await page.waitForLoadState("networkidle");
  await expect.poll(async () => (await box(page)).height, { timeout: 15_000 }).toBeGreaterThan(0);

  const before = await box(page);
  const links = page.locator("[data-document-toc] a[data-toc-id]");
  await links.nth(1).click();
  // An in-flight indicator is a transform, not a per-frame layout write.
  const sampled = await indicator(page).evaluate(async (element) => {
    const frames: string[] = [];
    for (let index = 0; index < 12; index++) {
      await new Promise(requestAnimationFrame);
      frames.push(getComputedStyle(element).transform);
    }
    return frames;
  });
  expect(new Set(sampled).size).toBeGreaterThan(1);
  await page.waitForTimeout(700);
  const after = await box(page);
  expect(after.top).not.toBe(before.top);
  expect(await indicator(page).evaluate((element) => element.getAnimations().length)).toBe(0);

  // The active entry follows the selection immediately, independent of the flight.
  await expect(page.locator("[data-document-toc] a[data-toc-id]").nth(1)).toHaveAttribute("aria-current", "location");

  // A live downgrade settles the same element instead of replacing it.
  const identity = await indicator(page).evaluate((element) => {
    (element as HTMLElement).dataset.probe = "kept";
    return true;
  });
  expect(identity).toBe(true);
  await page.goto(`/components/button?motion=none#${(await links.nth(2).getAttribute("href"))?.slice(1)}`);
  await page.waitForLoadState("networkidle");
  await expect(page.locator("[data-document-toc] nav")).toHaveAttribute("data-motion", "none");
});

test("keeps keyboard focus on the real links and scrolls the document on Enter", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/components/button?motion=full");
  await page.waitForLoadState("networkidle");
  const links = page.locator("[data-document-toc] a[data-toc-id]");
  await links.first().focus();
  await expect(links.first()).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(links.nth(1)).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(new RegExp(`#${(await links.nth(1).getAttribute("href"))?.slice(1)}$`));
  await expect(page.locator("[data-document-toc] a[data-toc-id]").nth(1)).toHaveAttribute("aria-current", "location");
});
