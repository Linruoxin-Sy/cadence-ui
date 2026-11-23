import { expect, type Locator, test } from "@playwright/test";
import { effectiveMode, MODES } from "./helpers";

const WIDE = { width: 448, height: 252 };
const SQUARE = { width: 448, height: 448 };

async function frame(host: Locator) {
  return host.evaluate((node) => {
    const box = node.getBoundingClientRect();
    return { width: Math.round(box.width), height: Math.round(box.height) };
  });
}

/**
 * AspectRatio has no other browser spec. This covers the facts the audit relies
 * on while the ratio flight itself is tracked in #140: the reserved box, every
 * wrapper resolving its mode, the native destination after a ratio change, and
 * media that keeps its own fit instead of being stretched by the host.
 */
for (const mode of MODES)
  test(`AspectRatio reserves media space and lands the native ratio ${mode}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(`/components/aspect-ratio?motion=${mode}`, { waitUntil: "domcontentloaded" });
    const top = page.locator('[data-preview="aspect-ratio"]');
    await expect(top).toHaveAttribute("data-preview-motion", effectiveMode(mode, false));

    const wrappers = await top.locator('[data-slot="aspect-ratio"]').all();
    expect(wrappers.length).toBeGreaterThan(0);
    for (const wrapper of wrappers) await expect(wrapper).toHaveAttribute("data-motion", mode);

    const demo = page.locator('[data-component-example="aspect-ratio/switch"]');
    await demo.scrollIntoViewIfNeeded();
    const host = demo.locator('[data-slot="aspect-ratio"]');
    expect(await frame(host)).toEqual(WIDE);

    await demo.getByRole("button", { name: "Square it" }).click();
    await expect.poll(async () => (await frame(host)).height, { timeout: 5_000 }).toBe(SQUARE.height);
    expect(await frame(host)).toEqual(SQUARE);

    await demo.getByRole("button", { name: "Widen it" }).click();
    await expect.poll(async () => (await frame(host)).height, { timeout: 5_000 }).toBe(WIDE.height);
    expect(await frame(host)).toEqual(WIDE);

    // The host owns the reserved box; the media keeps its own fit and the host is
    // not scaled to fake a ratio it no longer has.
    expect(await host.evaluate((node) => getComputedStyle(node).transform)).toBe("none");
    const image = host.locator("img");
    expect(await image.evaluate((node) => getComputedStyle(node).objectFit)).toBe("cover");

    // The destination is not left behind a running writer once it settles.
    await page.waitForTimeout(400);
    expect(await host.evaluate((node) => node.getAnimations().filter((a) => a.playState === "running").length)).toBe(0);
  });

test("AspectRatio reserves its box without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(`${baseURL}/components/aspect-ratio`);
    const wrappers = page.locator('[data-preview="aspect-ratio"] [data-slot="aspect-ratio"]');
    expect(await wrappers.count()).toBeGreaterThan(0);
    const first = wrappers.first();
    await expect(first).toBeVisible();
    expect(await first.evaluate((node) => node.getAttribute("aria-hidden"))).toBe(null);
  } finally {
    await context.close();
  }
});
