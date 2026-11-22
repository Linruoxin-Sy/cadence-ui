import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { effectiveMode, MODES, type Mode } from "./helpers";

/**
 * Slice S3 browser evidence: plain labels and string badges replace changed graphemes in
 * place, a plain numeric badge rolls changed places, a hidden lane settles content without
 * visual work, and the mobile panel inherits Sheet's own entry/exit with no desktop
 * animation alongside it.
 *
 * Screenshots are written under `.cache/sidebar-s3/` (ignored) so a reviewer can inspect
 * the actual surfaces instead of a description of them.
 */
const proofRoot = process.env.CADENCE_SIDEBAR_S3_PROOF ?? ".cache/sidebar-s3";
const preview = (page: Page) => page.locator('[data-preview="sidebar"]');
const card = (page: Page, name: string) => page.locator(`[data-component-example="sidebar/${name}"]`);
const trigger = (root: Locator) => root.locator('[data-slot="sidebar-trigger"]').first();

/** Opens the page and waits for the resolved mode to reach the DOM, not just SSR.
 * A mobile layout renders no panel label before the sheet opens, so that cell waits
 * for the sheet's own attribute instead of a label. */
async function open(
  page: Page,
  requested: Mode,
  theme: string,
  preference: "no-preference" | "reduce" = "no-preference",
  readiness: "label" | "sheet" = "label",
) {
  const expected = effectiveMode(requested, preference === "reduce");
  await page.emulateMedia({ reducedMotion: preference });
  await page.addInitScript((value) => localStorage.setItem("cadence-theme", value), theme);
  await page.goto(`/components/sidebar?motion=${requested}`);
  if (readiness === "label")
    await expect(card(page, "changing-labels").locator("[data-motion-lane]").first()).toHaveAttribute(
      "data-motion",
      expected,
      { timeout: 15_000 },
    );
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  await expect
    .poll(() => page.evaluate(() => document.getAnimations().every((animation) => animation.playState !== "running")), {
      timeout: 10_000,
    })
    .toBe(true);
  return expected;
}

type VisualWork = { textLayers: number; numberLayers: number; reels: number; textPaints: number };

/** Count every text/number paint the component actually creates, from the commit onward. */
async function recordWork(page: Page) {
  await page.evaluate(() => {
    const store = globalThis as unknown as {
      __s3?: { work: VisualWork; observer: MutationObserver };
    };
    const work: VisualWork = { textLayers: 0, numberLayers: 0, reels: 0, textPaints: 0 };
    const count = (node: Node) => {
      if (!(node instanceof HTMLElement)) return;
      if (node.dataset.cadenceTextLayer !== undefined) work.textLayers++;
      if (node.dataset.cadenceNumberLayer !== undefined) work.numberLayers++;
      if (node.dataset.cadenceReel !== undefined) work.reels++;
      if (node.dataset.cadenceTextKind !== undefined) work.textPaints++;
      for (const child of node.querySelectorAll<HTMLElement>("*")) {
        if (child.dataset.cadenceReel !== undefined) work.reels++;
        if (child.dataset.cadenceTextKind !== undefined) work.textPaints++;
        if (child.dataset.cadenceTextLayer !== undefined) work.textLayers++;
        if (child.dataset.cadenceNumberLayer !== undefined) work.numberLayers++;
      }
    };
    const observer = new MutationObserver((records) => {
      for (const record of records) for (const node of record.addedNodes) count(node);
    });
    observer.observe(document.body, { subtree: true, childList: true });
    store.__s3 = { work, observer };
  });
}

async function work(page: Page): Promise<VisualWork> {
  return page.evaluate(() => (globalThis as unknown as { __s3: { work: VisualWork } }).__s3.work);
}

test.describe("S3 changed labels and counts", () => {
  for (const theme of ["light", "dark"] as const)
    for (const requested of MODES)
      for (const preference of ["no-preference", "reduce"] as const)
        test(`changed label, string badge and count ${requested}/${preference}/${theme}`, async ({ page }) => {
          const expected = await open(page, requested, theme, preference);
          await mkdir(proofRoot, { recursive: true });
          const example = card(page, "changing-labels");
          await example.scrollIntoViewIfNeeded();
          const label = example.locator('[data-slot="sidebar-group-label-text"]');
          const menu = example.locator('[data-slot="sidebar-menu-button-label"]', { hasText: "Website" });
          const badge = example.locator('[data-slot="sidebar-menu-badge-count"]');
          await expect(label).toHaveText("My projects");
          await expect(menu).toHaveText("Website");
          await expect(badge).toHaveText("3");
          // A usable lane reports itself, so a label update may start its run.
          await expect(label).toHaveAttribute("data-motion", expected);
          await expect(label).toHaveAttribute("data-motion-lane", "usable");
          await recordWork(page);
          await example.getByRole("button", { name: "Switch scope" }).click();
          await example.getByRole("button", { name: "Receive item" }).click();
          await expect(label).toHaveText("All projects");
          await expect(menu).toHaveText("Website archive");
          await expect(badge).toHaveText("0");
          // Give the run and the reel their first frames before reading what actually ran.
          await page.waitForTimeout(1200);
          const ran = await work(page);
          if (expected === "none") {
            // None establishes content with no text paint, no reel and no delay.
            expect(ran.textLayers, "none starts no changed-run").toBe(0);
            expect(ran.numberLayers, "none starts no reel").toBe(0);
            expect(ran.textPaints, "none paints no text layer").toBe(0);
          } else {
            // Full and reduced both paint a changed run; reduced keeps short opacity only.
            expect(ran.textLayers, `${expected} changed-run paints`).toBeGreaterThan(0);
            expect(ran.textPaints, `${expected} changed-run canvases`).toBeGreaterThan(0);
          }
          if (expected === "reduced") {
            expect(ran.numberLayers, "reduced settles the count immediately").toBe(0);
            expect(ran.reels, "reduced settles the count immediately").toBe(0);
          }
          if (expected === "full") {
            expect(ran.numberLayers, "full owns one numeric layer").toBeGreaterThan(0);
            expect(ran.reels, "full rolls the changed place").toBeGreaterThan(0);
          }
          await example.screenshot({ path: join(proofRoot, `labels-${requested}-${preference}-${theme}.png`) });
        });

  for (const theme of ["light", "dark"] as const)
    test(`a hidden icon lane settles content and reveals it later ${theme}`, async ({ page }) => {
      await open(page, "full", theme);
      await mkdir(proofRoot, { recursive: true });
      const example = card(page, "changing-labels");
      await example.scrollIntoViewIfNeeded();
      const label = example.locator('[data-slot="sidebar-group-label-text"]');
      // Collapse off-canvas first: the lane is hidden before the update arrives.
      await trigger(example).click();
      await expect(example.locator('[data-slot="sidebar"]')).toHaveAttribute("data-state", "collapsed");
      await expect(label).toHaveAttribute("data-motion-lane", "hidden");
      await recordWork(page);
      await example.getByRole("button", { name: "Switch scope" }).click();
      await example.getByRole("button", { name: "Receive item" }).click();
      // The hidden lane still establishes the current value.
      await expect(label).toHaveText("All projects");
      await expect(example.locator('[data-slot="sidebar-menu-badge-count"]')).toHaveText("0");
      await page.waitForTimeout(1200);
      const hidden = await work(page);
      expect(hidden.textLayers, "a hidden lane starts no run").toBe(0);
      expect(hidden.numberLayers, "a hidden lane starts no reel").toBe(0);
      await trigger(example).click();
      await expect(label).toHaveAttribute("data-motion-lane", "usable");
      // Expansion reveals the established value; the consumed update never replays.
      await expect(label).toHaveText("All projects");
      await page.waitForTimeout(600);
      await example.screenshot({ path: join(proofRoot, `hidden-lane-${theme}.png`) });
    });
});

test.describe("S3 mobile composition", () => {
  for (const theme of ["light", "dark"] as const)
    for (const requested of MODES)
      for (const preference of ["no-preference", "reduce"] as const)
        test(`mobile sheet entry and exit ${requested}/${preference}/${theme}`, async ({ page }) => {
          await page.setViewportSize({ width: 500, height: 900 });
          const expected = await open(page, requested, theme, preference, "sheet");
          await mkdir(proofRoot, { recursive: true });
          // The desktop tree is not rendered next to the mobile one; the SSR markup is
          // desktop-shaped until hydration resolves the breakpoint, so poll, do not sample.
          await expect
            .poll(() => preview(page).locator('[data-slot="sidebar-container"]').count(), { timeout: 15_000 })
            .toBe(0);
          await trigger(preview(page)).click();
          const sheet = page.getByRole("dialog");
          await expect(sheet).toBeVisible();
          await expect(sheet).toHaveAttribute("data-slot", "sheet-content");
          await expect(sheet).toHaveAttribute("data-motion", expected, { timeout: 15_000 });
          // Labels inside the open sheet use a usable lane.
          await expect(sheet.locator("[data-motion-lane]").first()).toHaveAttribute("data-motion-lane", "usable");
          await page.waitForTimeout(600);
          await page.screenshot({ path: join(proofRoot, `mobile-open-${requested}-${preference}-${theme}.png`) });
          await page.keyboard.press("Escape");
          await expect(sheet).toBeHidden();
          await expect(preview(page).locator('[data-slot="sidebar-container"]')).toHaveCount(0);
          await page.waitForTimeout(600);
          await page.screenshot({ path: join(proofRoot, `mobile-closed-${requested}-${preference}-${theme}.png`) });
        });

  test("a breakpoint change retires the desktop projection before the sheet", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await open(page, "full", "light");
    await mkdir(proofRoot, { recursive: true });
    const shell = preview(page);
    // Start a desktop collapse and cross the breakpoint while it is still running.
    await trigger(shell).click();
    await page.setViewportSize({ width: 500, height: 900 });
    await expect(shell.locator('[data-slot="sidebar-container"]')).toHaveCount(0);
    // Nothing the desktop owner started survives into the sheet's own presentation.
    await expect
      .poll(
        () =>
          page.evaluate(
            () =>
              document.getAnimations().filter((animation) => {
                const target = (animation as unknown as { effect?: { target?: Element | null } }).effect?.target;
                return Boolean(target?.closest('[data-slot="sidebar"], [data-slot="sidebar-container"]'));
              }).length,
          ),
        { timeout: 10_000 },
      )
      .toBe(0);
    await trigger(shell).click();
    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();
    await page.waitForTimeout(600);
    const transform = await sheet.evaluate((node) => getComputedStyle(node).transform);
    expect(transform === "none" || transform === "matrix(1, 0, 0, 1, 0, 0)").toBe(true);
    await page.screenshot({ path: join(proofRoot, "breakpoint-mobile.png") });
  });
});
