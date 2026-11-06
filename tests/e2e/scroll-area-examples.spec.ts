import { mkdir, readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, test } from "@playwright/test";
import { effectiveMode, MODES } from "./helpers";
import { openComponentSource } from "./installation-helpers";

const names: string[] = JSON.parse(await readFile("components/site/previews/examples.json", "utf8"))["scroll-area"];
const selector = (name: string) => `[data-component-example="scroll-area/${name}"]`;
const rootOf = (card: Locator) => card.locator('[data-slot="scroll-area"]');
const viewportOf = (card: Locator) => card.locator('[data-slot="scroll-area-viewport"]');
async function staticParts(card: Locator) {
  const states = await card.locator('[data-slot^="scroll-area"]').evaluateAll((nodes) =>
    nodes.map((node) => {
      const s = getComputedStyle(node);
      return {
        mode: node.getAttribute("data-motion"),
        animation: s.animationName,
        property: s.transitionProperty,
        duration: s.transitionDuration,
        opacity: s.opacity,
        behavior: s.scrollBehavior,
        scale: s.scale,
        filter: s.filter,
      };
    }),
  );
  for (const s of states) {
    expect(s.mode).toBeNull();
    expect(s.animation).toBe("none");
    expect(s.opacity).toBe("1");
    expect(s.behavior).toBe("auto");
    expect(s.scale).toBe("none");
    expect(s.filter).toBe("none");
    if (s.duration !== "0s") expect(s.property).not.toMatch(/all|transform|opacity|filter/);
  }
}
for (const os of ["no-preference", "reduce"] as const)
  for (const mode of MODES)
    test(`scroll-area examples static modes and independent updates ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os });
      await page.goto(`/components/scroll-area?motion=${mode}`);
      await page.waitForLoadState("networkidle");
      const top = page.locator('[data-preview="scroll-area"]');
      await expect(top.locator("select, button")).toHaveCount(0);
      await expect(rootOf(top)).toHaveCount(2);
      for (const name of names) await staticParts(page.locator(selector(name)));
      const changing = page.locator(selector("changing-content"));
      const input = changing.getByRole("textbox");
      await input.fill("Preserved activity draft");
      const original = await input.elementHandle();
      const viewport = viewportOf(changing),
        savedViewport = await viewport.elementHandle();
      const button = changing.getByRole("button", { name: "Change activity count" });
      await expect(button).toHaveAttribute("data-motion", effectiveMode(mode, os === "reduce"));
      await button.press("Enter");
      await expect(changing.getByRole("status")).toHaveText("40 entries · Compact panel");
      await expect(top.getByRole("listitem")).toHaveCount(26);
      await viewport.focus();
      await page.keyboard.press("PageDown");
      await expect.poll(() => viewport.evaluate((n) => n.scrollTop)).toBeGreaterThan(0);
      // Let native keyboard scrolling settle before checking preservation.
      await expect.poll(() => viewport.evaluate((n) => n.scrollTop)).toBeGreaterThan(100);
      await page.keyboard.press("End");
      await expect.poll(() => viewport.evaluate((n) => n.scrollHeight - n.clientHeight - n.scrollTop)).toBeLessThan(1);
      const scrollPosition = await viewport.evaluate((n) => n.scrollTop);

      for (const next of MODES) {
        await page.getByRole("group", { name: "Motion mode" }).getByRole("button", { name: next, exact: true }).click();
        await expect(button).toHaveAttribute("data-motion", effectiveMode(next, os === "reduce"));
        await expect(input).toHaveValue("Preserved activity draft");
        expect(await input.evaluate((n, h) => n === h, original)).toBe(true);
        expect(await viewport.evaluate((n, h) => n === h, savedViewport)).toBe(true);
        expect(await viewport.evaluate((n) => n.scrollTop)).toBe(scrollPosition);
        await staticParts(changing);
      }
      await openComponentSource(page, "scroll-area");
      await expect(input).toHaveValue("Preserved activity draft");
      expect(await input.evaluate((n, h) => n === h, original)).toBe(true);
      await input.focus();
      await page.emulateMedia({ reducedMotion: os === "reduce" ? "no-preference" : "reduce" });
      await expect(input).toBeFocused();
      await expect(input).toHaveValue("Preserved activity draft");
      await staticParts(changing);
    });

test("scroll-area content growth resize root ref and native keyboard traversal", async ({ page }) => {
  await page.goto("/components/scroll-area?motion=none");
  await page.waitForLoadState("networkidle");
  const changing = page.locator(selector("changing-content")),
    viewport = viewportOf(changing),
    input = changing.getByRole("textbox");
  const thumb = changing.locator('[data-slot="scroll-area-thumb"]');
  await input.fill("A real draft");
  const original = await input.elementHandle();
  const before = (await thumb.boundingBox())?.height ?? 0;
  await changing.getByRole("button", { name: "Change activity count" }).press("Space");
  await viewport.focus();
  await page.keyboard.press("PageDown");
  await expect.poll(() => viewport.evaluate((n) => n.scrollTop)).toBeGreaterThan(100);
  await expect.poll(async () => (await thumb.boundingBox())?.height ?? 0).toBeLessThan(before);
  await page.keyboard.press("Home");
  await expect.poll(() => viewport.evaluate((n) => n.scrollTop)).toBe(0);
  await page.keyboard.press("Tab");
  await expect(input).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(viewport).toBeFocused();
  await changing.getByRole("button", { name: "Resize activity panel" }).press("Enter");
  await expect.poll(() => viewport.evaluate((n) => n.clientHeight)).toBe(286);
  await expect(input).toHaveValue("A real draft");
  expect(await input.evaluate((n, h) => n === h, original)).toBe(true);
  const caller = page.locator(selector("caller-rendering")),
    root = rootOf(caller),
    v = viewportOf(caller);
  await expect(root).toHaveJSProperty("tagName", "SECTION");
  await expect(root).toHaveCSS("max-width", "100%");
  await expect(root).toHaveClass(/border-primary/);
  await v.evaluate((n) => {
    n.scrollTop = 8;
  });
  await expect.poll(() => v.evaluate((n) => n.scrollTop)).toBe(8);
  await expect(root).not.toHaveAttribute("data-overflow-y-start");
  await v.focus();
  await page.keyboard.press("PageDown");
  await expect(root).toHaveAttribute("data-overflow-y-start");
  // Native PageDown may still be interpolating when the edge attribute appears.
  // Finish native navigation before testing the separate caller-owned action.
  await page.keyboard.press("End");
  await expect.poll(() => v.evaluate((n) => n.scrollHeight - n.clientHeight - n.scrollTop)).toBeLessThan(1);

  await caller.getByRole("button").press("Space");
  await expect.poll(() => v.evaluate((n) => n.scrollTop)).toBe(0);
  await v.focus();
  await page.keyboard.press("Tab");
  await expect(caller.getByRole("link").first()).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(caller.getByRole("link").nth(1)).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(caller.getByRole("link").first()).toBeFocused();
  const ids = await page.locator("[id]").evaluateAll((nodes) => nodes.map((n) => n.id));
  expect(new Set(ids).size).toBe(ids.length);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/docs\/changelog$/);
});

test("scroll-area two axes no-overflow mounting and RTL thumb geometry", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/components/scroll-area?motion=none");
  await page.waitForLoadState("networkidle");
  const both = page.locator(selector("both-axes")),
    v = viewportOf(both);
  expect(await v.evaluate((n) => n.scrollWidth > n.clientWidth && n.scrollHeight > n.clientHeight)).toBe(true);
  await v.focus();
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => v.evaluate((n) => n.scrollLeft)).toBeGreaterThan(0);
  await page.keyboard.press("PageDown");
  await expect.poll(() => v.evaluate((n) => n.scrollTop)).toBeGreaterThan(0);
  await expect(both.locator('[data-slot="scroll-area-scrollbar"]')).toHaveCount(2);
  const noOverflow = page.locator(selector("without-overflow"));
  for (const viewport of await viewportOf(noOverflow).all()) {
    expect(await viewport.evaluate((n) => n.clientHeight === n.scrollHeight && n.clientWidth === n.scrollWidth)).toBe(
      true,
    );
    await expect(viewport).toHaveAttribute("tabindex", "-1");
  }
  await expect(rootOf(noOverflow).nth(0).locator('[data-slot="scroll-area-scrollbar"]')).toHaveCount(0);
  await expect(
    rootOf(noOverflow).nth(1).locator('[data-slot="scroll-area-scrollbar"][data-orientation="horizontal"]'),
  ).toHaveCount(1);
  const rtl = page.locator(selector("rtl")),
    rv = viewportOf(rtl);
  await expect(rv).toHaveCSS("direction", "rtl");
  await rv.focus();
  await page.keyboard.press("ArrowLeft");
  await expect.poll(() => rv.evaluate((n) => n.scrollLeft)).toBeLessThan(0);
  await rv.evaluate((n) => {
    n.scrollLeft = 0;
  });
  const track = rtl.locator('[data-slot="scroll-area-scrollbar"]');
  await expect(track).toHaveAttribute("title", "Project phases track");
  await expect(track).toHaveCSS("height", "12px");
  await expect(track).toHaveCSS("padding", "2px");
  const thumb = track.locator('[data-slot="scroll-area-thumb"]');
  await thumb.scrollIntoViewIfNeeded();
  const box = await thumb.boundingBox();
  if (!box) throw Error("Missing RTL thumb");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 - 80, box.y + box.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect.poll(() => rv.evaluate((n) => n.scrollLeft)).toBeLessThan(-20);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("scroll-area no-JS preserves actual native two-axis scrolling and content", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.goto(`${baseURL}/components/scroll-area#both-axes`);
    const both = page.locator(selector("both-axes")),
      v = viewportOf(both);
    await expect(both.getByRole("listitem")).toHaveCount(20);
    await v.focus();
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => v.evaluate((n) => n.scrollLeft)).toBeGreaterThan(0);
    await page.keyboard.press("PageDown");
    await expect.poll(() => v.evaluate((n) => n.scrollTop)).toBeGreaterThan(0);
    await expect(page.locator(selector("changing-content")).getByRole("textbox")).toHaveValue("Keep this draft");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally {
    await context.close();
  }
});
for (const anchor of ["usage", "caller-rendering-and-sizing", "changing-content"])
  test(`scroll-area cold full deep link ${anchor}`, async ({ page }) => {
    await page.goto(`/components/scroll-area?motion=full#${anchor}`);
    await page.waitForLoadState("networkidle");
    const heading = page.locator(`h2#${anchor}`);
    await expect(heading).toBeInViewport();
    await expect.poll(() => heading.evaluate((n) => getComputedStyle(n.closest("article") ?? n).opacity)).toBe("1");
  });
for (const theme of ["light", "dark"] as const)
  for (const width of [1280, 390])
    for (const name of ["top", ...names])
      test(`scroll-area visual axe ${name}/${theme}/${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1100 });
        await page.addInitScript((value) => localStorage.setItem("cadence-theme", value), theme);
        await page.goto("/components/scroll-area?motion=none");
        await page.waitForLoadState("networkidle");
        const sel = name === "top" ? '[data-preview="scroll-area"]' : selector(name),
          card = page.locator(sel);
        await card.scrollIntoViewIfNeeded();
        expect(
          (await new AxeBuilder({ page }).include(sel).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
            .violations,
        ).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await mkdir(".cache/scroll-area-proof", { recursive: true });
        await card.screenshot({ path: `.cache/scroll-area-proof/${name}-${theme}-${width}.png` });
      });

test("scroll-area T0 properties are static from actual insertion", async ({ page }, info) => {
  await page.addInitScript(() => {
    const rows: { animation: string; property: string; duration: string; mode: string | null }[][] = [];
    (window as unknown as { scrollAreaInsertion: typeof rows }).scrollAreaInsertion = rows;
    let started = false;
    new MutationObserver(() => {
      const root = document.querySelector('[data-component-example="scroll-area/vertical"] [data-slot="scroll-area"]');
      if (!root || started) return;
      started = true;
      let count = 0;
      const sample = () => {
        rows.push(
          [root, ...root.querySelectorAll('[data-slot^="scroll-area"]')].map((n) => {
            const s = getComputedStyle(n);
            return {
              animation: s.animationName,
              property: s.transitionProperty,
              duration: s.transitionDuration,
              mode: n.getAttribute("data-motion"),
            };
          }),
        );
        if (++count < 12) requestAnimationFrame(sample);
      };
      sample();
    }).observe(document, { childList: true, subtree: true });
  });
  await page.goto("/components/scroll-area?motion=none");
  await page.waitForLoadState("networkidle");
  const rows = await page.evaluate(
    () =>
      (
        window as unknown as {
          scrollAreaInsertion: { animation: string; property: string; duration: string; mode: string | null }[][];
        }
      ).scrollAreaInsertion,
  );
  await info.attach("T0 actual insertion", { body: JSON.stringify(rows), contentType: "application/json" });
  expect(rows).toHaveLength(12);
  for (const frame of rows)
    for (const s of frame) {
      expect(s.mode).toBeNull();
      expect(s.animation).toBe("none");
      if (s.duration !== "0s") expect(s.property).not.toMatch(/all|transform|opacity|filter/);
    }
});
