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
 * AspectRatio has two browser specs. The first covers the facts the audit relies
 * on — the reserved box, every wrapper resolving its mode, the native destination
 * after a ratio change, and media that keeps its own fit instead of being
 * stretched by the host. The second covers the flight itself (#140): one axis is
 * interpolated from its measured origin and the crossed axis stays put, because
 * an authored ratio would otherwise re-derive an auto dimension from the flown
 * one.
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

/** Per-frame border box of the reserved wrapper, in document pixels. */
async function framesAfter(host: Locator, click: () => Promise<void>, count: number) {
  await click();
  return host.evaluate(async (node, total) => {
    const rows: { height: number; width: number }[] = [];
    for (let index = 0; index < total; index++) {
      await new Promise(requestAnimationFrame);
      const box = node.getBoundingClientRect();
      rows.push({ height: Math.round(box.height), width: Math.round(box.width) });
    }
    return rows;
  }, count);
}

/**
 * #140: a ratio change interpolates the one axis it moved instead of jumping to
 * the new box. Sampled at a quarter speed so a slow frame cannot swallow the
 * whole flight on CI.
 */
test("AspectRatio interpolates the dependent axis and holds the crossed one", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/components/aspect-ratio?motion=full&speed=0.25", { waitUntil: "domcontentloaded" });
  const demo = page.locator('[data-component-example="aspect-ratio/switch"]');
  const host = demo.locator('[data-slot="aspect-ratio"]');
  await demo.scrollIntoViewIfNeeded();
  await expect(host).toHaveAttribute("data-motion", "full");
  expect(await frame(host)).toEqual(WIDE);

  const square = await framesAfter(host, () => demo.getByRole("button", { name: "Square it" }).click(), 16);
  // The reserved box owns the dependent axis, so intermediate heights exist...
  expect(new Set(square.map((row) => row.height)).size).toBeGreaterThan(2);
  // ...while the crossed axis is held, so the ratio cannot re-derive its width.
  expect(new Set(square.map((row) => row.width))).toEqual(new Set([WIDE.width]));
  await expect.poll(async () => (await frame(host)).height, { timeout: 5_000 }).toBe(SQUARE.height);
  expect(await frame(host)).toEqual(SQUARE);

  const wide = await framesAfter(host, () => demo.getByRole("button", { name: "Widen it" }).click(), 16);
  expect(new Set(wide.map((row) => row.height)).size).toBeGreaterThan(2);
  expect(new Set(wide.map((row) => row.width))).toEqual(new Set([WIDE.width]));
  await expect.poll(async () => (await frame(host)).height, { timeout: 5_000 }).toBe(WIDE.height);
  expect(await frame(host)).toEqual(WIDE);

  // Both writers are released once the axis settles.
  await page.waitForTimeout(400);
  expect(await host.evaluate((node) => node.getAnimations().filter((a) => a.playState === "running").length)).toBe(0);
  expect(await host.evaluate((node) => [node.style.width, node.style.height])).toEqual(["", ""]);
});

test("AspectRatio lands the final ratio immediately in reduced and none", async ({ page }) => {
  for (const mode of ["reduced", "none"] as const) {
    await page.goto(`/components/aspect-ratio?motion=${mode}`, { waitUntil: "domcontentloaded" });
    const demo = page.locator('[data-component-example="aspect-ratio/switch"]');
    const host = demo.locator('[data-slot="aspect-ratio"]');
    await demo.scrollIntoViewIfNeeded();
    await expect(host).toHaveAttribute("data-motion", mode);

    const square = await framesAfter(host, () => demo.getByRole("button", { name: "Square it" }).click(), 4);
    expect(new Set(square.map((row) => row.height))).toEqual(new Set([SQUARE.height]));
    expect(await frame(host)).toEqual(SQUARE);

    const wide = await framesAfter(host, () => demo.getByRole("button", { name: "Widen it" }).click(), 4);
    expect(new Set(wide.map((row) => row.height))).toEqual(new Set([WIDE.height]));
    expect(await frame(host)).toEqual(WIDE);
  }
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
