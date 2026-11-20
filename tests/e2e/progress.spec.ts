import { mkdir } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { awaitRangeStepper, effectiveMode, MODES, openComponent, scoped } from "./helpers";

const PROOF = ".cache/progress/browser";
const PREFERENCES = [false, true] as const;

function fillScale(node: Element) {
  const transform = getComputedStyle(node).transform;
  return transform === "none" ? 1 : new DOMMatrixReadOnly(transform).a;
}

test.beforeAll(async () => {
  await mkdir(PROOF, { recursive: true });
});

for (const prefersReduced of PREFERENCES)
  for (const requested of MODES) {
    const mode = effectiveMode(requested, prefersReduced);
    const os = prefersReduced ? "reduce" : "no-preference";

    test(`progress ${requested}/${os} resolves ${mode}`, async ({ page }, info) => {
      await page.emulateMedia({ reducedMotion: os });
      await openComponent(page, "progress", requested, "progress", mode);
      const root = page.locator(scoped("progress", '[data-slot="progress"]')).first();
      const fill = page.locator(scoped("progress", '[data-slot="progress-indicator"]')).first();
      const track = page.locator(scoped("progress", '[data-slot="progress-track"]')).first();
      const value = page.locator(scoped("progress", '[data-slot="progress-value"]')).first();
      const pulse = page.locator('[data-component-example="progress/indeterminate"] [data-slot="progress-indicator"]');
      const callerProgressbar = page
        .locator('[data-component-example="progress/caller-progress"]')
        .getByRole("progressbar");
      const stepper = page
        .locator('[data-component-example="progress/caller-progress"]')
        .getByRole("slider", { name: "Upload progress", exact: true });

      // One declared root mode reaches every owned part.
      for (const part of [root, fill, track, value, pulse]) await expect(part).toHaveAttribute("data-motion", mode);
      // The pulse is a client loop, not a server style: sample it only once the
      // runtime that owns the page is live, without flipping the mode under test.
      await awaitRangeStepper(stepper, callerProgressbar);

      // The determinate fill is the committed value, written by transform on a
      // full-width host: a width tween would relayout the track every frame.
      const labelled = page.locator('[data-component-example="progress/labelled"]');
      const labelledFill = labelled.locator('[data-slot="progress-indicator"]');
      expect((await labelledFill.evaluate((node) => (node as HTMLElement).style.width)) ?? "100%").toBe("100%");
      expect(await labelled.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("62");
      expect(await labelledFill.evaluate(fillScale)).toBeCloseTo(0.62, 3);
      await expect(labelled.locator('[data-slot="progress-value"]')).toHaveText("62%");

      // Non-default min/max, locale formatting and a custom aria text keep the
      // same fraction without inventing a second scale.
      const range = page.locator('[data-component-example="progress/range"]');
      await expect(range.getByRole("progressbar")).toHaveAttribute("aria-valuetext", "Step 3 of 5");
      await expect(range.locator('[data-slot="progress-value"]')).toHaveText("60%");
      expect(await range.locator('[data-slot="progress-indicator"]').evaluate(fillScale)).toBeCloseTo(0.6, 3);

      // The indeterminate pulse is the only continuous owner. Reduced and none
      // keep a static full-width shape, and none releases every animation family.
      // The shared loop is visibility-gated so off-screen marquees cost nothing:
      // bring the specimen into view before sampling, or "no loop" would be the
      // answer for the wrong reason.
      await pulse.evaluate((node) => node.scrollIntoView({ block: "center" }));
      await page.waitForTimeout(mode === "full" ? 600 : 50);
      const pulseSamples = await pulse.evaluate(async (node) => {
        const values: string[] = [];
        const end = performance.now() + 500;
        while (performance.now() < end) {
          await new Promise(requestAnimationFrame);
          values.push(getComputedStyle(node).opacity);
        }
        return values;
      });
      await info.attach(`pulse-${requested}-${os}`, {
        body: JSON.stringify({ mode, samples: [...new Set(pulseSamples)].slice(0, 8) }),
        contentType: "application/json",
      });
      expect(new Set(pulseSamples).size > 1).toBe(mode === "full");
      expect(await pulse.evaluate((node) => new DOMMatrixReadOnly(getComputedStyle(node).transform).a)).toBe(1);
      if (mode === "none") expect(await root.evaluate((node) => node.getAnimations({ subtree: true }).length)).toBe(0);

      // Readable text never waits on the fill: the formatted value is current in
      // every mode, and the label keeps its own characters.
      const complete = page.locator('[data-component-example="progress/complete"]');
      await expect(complete.locator('[data-slot="progress-value"]')).toHaveText("100%");
      await expect(complete.getByRole("status")).toHaveText("All files uploaded.");
      const labelled2 = page.locator('[data-component-example="progress/labelled"]');
      await expect(labelled2.locator('[data-slot="progress-label"]')).toHaveText("Uploading assets");

      await page.screenshot({
        path: `${PROOF}/progress-${requested}-${os}.png`,
        clip: { x: 0, y: 0, width: 1280, height: 900 },
      });
    });

    test(`progress ${requested}/${os} live retarget and same-node cancellation`, async ({ page }, info) => {
      await page.emulateMedia({ reducedMotion: os });
      await openComponent(page, "progress", requested, "progress", mode);
      const caller = page.locator('[data-component-example="progress/caller-progress"]');
      const fillHost = caller.locator('[data-slot="progress-indicator"]');
      const range = caller.getByRole("slider", { name: "Upload progress", exact: true });
      const stable = await fillHost.elementHandle();

      // A controlled input only retargets once React owns it; the server mode and
      // the resolved mode coincide in this cell, so prove the runtime is live first.
      await awaitRangeStepper(range, caller.getByRole("progressbar"));

      // A focused native range keeps its focus through a mode change, and the fill
      // host is the same node — a remount would lose both.
      await range.focus();
      await range.fill("20");
      await expect(caller.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "20");
      await expect(caller.locator('[data-slot="progress-value"]')).toHaveText("20%");
      expect(await range.evaluate((node) => node.ownerDocument.activeElement === node)).toBe(true);

      // Retarget while the first travel is still running, then downgrade to none:
      // the newest committed value wins immediately and no old writer survives.
      await range.fill("80");
      await page
        .getByRole("group", { name: "Motion mode" })
        .getByRole("button", { name: "none", exact: true })
        .evaluate((button: HTMLButtonElement) => button.click());
      await expect(fillHost).toHaveAttribute("data-motion", "none");
      await expect(caller.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "80");
      await page.waitForTimeout(120);
      expect(await fillHost.evaluate(fillScale)).toBeCloseTo(0.8, 2);
      expect(await fillHost.evaluate((node) => node.getAnimations({ subtree: true }).length)).toBe(0);
      expect(await fillHost.evaluate((node, previous) => node === previous, stable)).toBe(true);

      // Back to full with a reversal: the fill must travel from its presented 0.8
      // toward 0.3, never jump to (or past) a stale 0.2 baseline.
      await page
        .getByRole("group", { name: "Motion mode" })
        .getByRole("button", { name: "full", exact: true })
        .evaluate((button: HTMLButtonElement) => button.click());
      // Sample from inside the page: starting the recorder before the value is
      // committed is what proves the travel, and a test-side sampler races it.
      await fillHost.evaluate((node) => {
        const store = window as unknown as { __progressFillSamples?: number[] };
        store.__progressFillSamples = [];
        const tick = () => {
          const transform = getComputedStyle(node).transform;
          store.__progressFillSamples?.push(transform === "none" ? 1 : new DOMMatrixReadOnly(transform).a);
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      await range.fill("30");
      await page.waitForTimeout(400);
      const samples = await page.evaluate(
        () => (window as unknown as { __progressFillSamples: number[] }).__progressFillSamples,
      );
      await info.attach(`reverse-${requested}-${os}`, {
        body: JSON.stringify({ mode, first: samples[0], last: samples.at(-1) }),
        contentType: "application/json",
      });
      if (mode === "full") expect(Math.max(...samples)).toBeGreaterThan(0.3);
      expect(samples.at(-1) ?? 0).toBeCloseTo(0.3, 2);
      await expect(caller.locator('[data-slot="progress-value"]')).toHaveText("30%");
      await expect(caller.getByRole("status")).toHaveText("Uploaded 30%");
    });
  }

test("progress renders its committed value without any JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/components/progress");
  const labelled = page.locator('[data-component-example="progress/labelled"]');
  await expect(labelled.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "62");
  await expect(labelled.locator('[data-slot="progress-value"]')).toHaveText("62%");
  const fill = labelled.locator('[data-slot="progress-indicator"]');
  expect(await fill.evaluate(fillScale)).toBeCloseTo(0.62, 2);
  // The server value is the resolved full-mode contract; no JS is needed to read it.
  await expect(fill).toHaveAttribute("data-motion", "full");
  await page.screenshot({ path: `${PROOF}/progress-no-js.png`, clip: { x: 0, y: 0, width: 1280, height: 900 } });
  await context.close();
});

test("progress hydrates the labelled specimen without warnings", async ({ page }) => {
  const problems: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" || /hydrat|did not match/i.test(message.text())) problems.push(message.text());
  });
  page.on("pageerror", (error) => problems.push(error.message));
  await page.goto("/components/progress?motion=full");
  await page.waitForLoadState("networkidle");
  await expect(page.locator('[data-component-example="progress/labelled"] [data-slot="progress-value"]')).toHaveText(
    "62%",
  );
  expect(problems).toEqual([]);
});

for (const theme of ["light", "dark"] as const)
  for (const width of [1280, 390])
    test(`progress ${theme}/${width} keeps readable bounds`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem("cadence-theme", value), theme);
      await page.setViewportSize({ width, height: 1000 });
      await page.goto("/components/progress?motion=full");
      await page.waitForLoadState("networkidle");
      await expect(page.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /^(?!.*dark)/);
      const specimen = page.locator("[data-preview='progress']");
      await specimen.evaluate((node) => node.scrollIntoView({ block: "center" }));
      // The value copy is visible and never clipped by the track it describes.
      for (const part of ['[data-slot="progress-label"]', '[data-slot="progress-value"]']) {
        const node = specimen.locator(part).first();
        await expect(node).toBeVisible();
        expect(await node.evaluate((element) => getComputedStyle(element).fontSize)).not.toBe("0px");
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `${PROOF}/progress-${theme}-${width}.png` });
    });
