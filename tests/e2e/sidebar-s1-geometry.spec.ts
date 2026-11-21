import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { MODES } from "./helpers";

/**
 * Slice S1 browser evidence: the desktop container and the layout gap are one geometry
 * transaction. The panel's travel and the gap's reserved width must move together in every
 * frame, both sides must reverse through the same scalar, and reduced/none (including a live
 * downgrade) must land on the final gap and position.
 *
 * Screenshots are written under `.cache/sidebar-s1/` (ignored) so a reviewer can inspect the
 * actual surfaces instead of a description of them.
 */
const proofRoot = process.env.CADENCE_SIDEBAR_S1_PROOF ?? ".cache/sidebar-s1";
const preview = (page: Page) => page.locator('[data-preview="sidebar"]');
const card = (page: Page, name: string) => page.locator(`[data-component-example="sidebar/${name}"]`);
const trigger = (root: Locator) => root.locator('[data-slot="sidebar-trigger"]').first();
const modeSwitch = (page: Page, mode: string) =>
  page.getByRole("group", { name: "Motion mode" }).getByRole("button", { name: mode, exact: true });

async function open(page: Page, mode: string, theme = "light") {
  await page.addInitScript((value) => localStorage.setItem("cadence-theme", value), theme);
  await page.goto(`/components/sidebar?motion=${mode}`);
  await page.waitForLoadState("networkidle");
  await expect(page.locator('[data-preview="sidebar"]')).toBeVisible();
  // The page's own entrance owns the coordinate space while it runs and is expected to
  // settle natively; this slice's flight is measured on the settled shell.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== "running"));
}

type Geometry = {
  gap: number;
  alongSide: number;
  panelWidth: number;
  mode: string | undefined;
  state: string | undefined;
  transform: string;
  animations: number;
  gapAnimations: number;
};

/** Resolve the shell whether the scope is the wrapper itself or a card containing it. */
const shellSelector = '[data-slot="sidebar-wrapper"]';

/** One frame of the paired projection: the gap's reserved width and the panel's side offset. */
async function geometry(root: Locator): Promise<Geometry> {
  return root.evaluate((scope, selector) => {
    const wrapper = (scope.matches(selector) ? scope : scope.querySelector(selector)) as HTMLElement;
    const panel = wrapper.querySelector('[data-slot="sidebar-container"]') as HTMLElement;
    const gap = wrapper.querySelector('[data-slot="sidebar-gap"]') as HTMLElement;
    // An absolutely positioned panel resolves against the padding box, so a border on the
    // shell is not part of the reserved width.
    const box = wrapper.getBoundingClientRect();
    const left = box.left + wrapper.clientLeft;
    const right = left + wrapper.clientWidth;
    const panelBox = panel.getBoundingClientRect();
    return {
      gap: gap.getBoundingClientRect().width,
      alongSide: panel.dataset.side === "right" ? right - panelBox.right : panelBox.left - left,
      panelWidth: panelBox.width,
      mode: panel.dataset.motion,
      state: (panel.closest('[data-slot="sidebar"]') as HTMLElement).dataset.state,
      transform: getComputedStyle(panel).transform,
      animations: panel.getAnimations().length,
      gapAnimations: gap.getAnimations().length,
    };
  }, shellSelector);
}

/** Start a per-frame recorder before interacting, so the flight is observed rather than inferred. */
async function record(root: Locator, limit: number) {
  await root.evaluate(
    (scope, [limit, selector]) => {
      const wrapper = (scope.matches(selector) ? scope : scope.querySelector(selector)) as HTMLElement;
      const panel = wrapper.querySelector('[data-slot="sidebar-container"]') as HTMLElement;
      const gap = wrapper.querySelector('[data-slot="sidebar-gap"]') as HTMLElement;
      const store = globalThis as unknown as { __cadenceS1?: unknown[]; __cadenceS1gen?: number };
      const generation = (store.__cadenceS1gen ?? 0) + 1;
      store.__cadenceS1gen = generation;
      store.__cadenceS1 = [];
      const read = () => {
        const box = wrapper.getBoundingClientRect();
        const left = box.left + wrapper.clientLeft;
        const right = left + wrapper.clientWidth;
        const panelBox = panel.getBoundingClientRect();
        return {
          gap: gap.getBoundingClientRect().width,
          alongSide: panel.dataset.side === "right" ? right - panelBox.right : panelBox.left - left,
          panelWidth: panelBox.width,
          mode: panel.dataset.motion,
          state: (panel.closest('[data-slot="sidebar"]') as HTMLElement).dataset.state,
          transform: getComputedStyle(panel).transform,
          animations: panel.getAnimations().length,
          gapAnimations: gap.getAnimations().length,
        };
      };
      const tick = () => {
        // A newer recording owns the buffer; this generation stops instead of interleaving.
        if (store.__cadenceS1gen !== generation) return;
        const frames = store.__cadenceS1 as unknown[];
        frames.push(read());
        if (frames.length < limit) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    },
    [limit, shellSelector] as const,
  );
}

const recorded = (page: Page) =>
  page.evaluate(() => (globalThis as unknown as { __cadenceS1?: Geometry[] }).__cadenceS1 ?? []);
const waitForFrames = (page: Page, count: number) =>
  page.waitForFunction(
    (count) => {
      const frames = (globalThis as unknown as { __cadenceS1?: unknown[] }).__cadenceS1 ?? [];
      return frames.length >= count;
    },
    count,
    { timeout: 10_000 },
  );

/** Reserved width and visible position are the same scalar, so both stay consistent per frame. */
function expectCoupled(frames: Geometry[], tolerance = 0.75) {
  for (const frame of frames) {
    expect(Math.abs(frame.alongSide - (frame.gap - frame.panelWidth))).toBeLessThan(tolerance);
  }
}

test.beforeAll(async () => {
  await mkdir(proofRoot, { recursive: true });
});

for (const theme of ["light", "dark"] as const)
  for (const width of [1280, 390])
    for (const mode of MODES)
      test(`S1 desktop container and gap ${theme}/${width}/${mode}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await open(page, mode, theme);

        for (const [name, root] of [
          ["left", preview(page)],
          ["right", card(page, "right-side")],
        ] as const) {
          await expect(root).toBeVisible();
          const panel = root.locator('[data-slot="sidebar-container"]');
          if (width === 390) {
            // Below the breakpoint the desktop projection does not exist: the composition is
            // the mobile Sheet's own presentation, not a desktop writer.
            await expect(panel).toHaveCount(0);
            await root.screenshot({ path: join(proofRoot, `${theme}-${width}-${mode}-${name}.png`) });
            continue;
          }
          await expect(panel).toHaveAttribute("data-motion", mode);
          await expect(root.locator('[data-slot="sidebar-gap"]')).toHaveAttribute("data-motion", mode);
          const before = await geometry(root);
          expect(before.gap).toBeCloseTo(before.panelWidth, 0);
          expect(Math.abs(before.alongSide)).toBeLessThan(0.75);
          await root.screenshot({ path: join(proofRoot, `${theme}-${width}-${mode}-${name}-expanded.png`) });
          await trigger(root).click();
          if (mode === "full") {
            // Capture the pair while it travels, not only at its ends.
            await expect
              .poll(
                () => root.locator('[data-slot="sidebar-gap"]').evaluate((node) => node.getBoundingClientRect().width),
                { intervals: [16, 32], timeout: 4000 },
              )
              .toBeLessThan(before.panelWidth * 0.8);
            await root.screenshot({ path: join(proofRoot, `${theme}-${width}-${mode}-${name}-flight.png`) });
          }
          const after = await geometry(root);
          // The reserved gap and the panel's side offset are the same resting geometry.
          expectCoupled([after]);
          await expect(panel).toHaveAttribute("inert", "");
          if (mode === "full") {
            // Mid-flight the pair has already left the expanded geometry and is travelling.
            expect(after.gap).toBeLessThan(before.gap);
          } else {
            expect(after.gap).toBe(0);
            expect(after.transform).toBe("none");
            expect(after.animations).toBe(0);
            expect(after.gapAnimations).toBe(0);
          }
          await root.screenshot({ path: join(proofRoot, `${theme}-${width}-${mode}-${name}-collapsed.png`) });
        }

        if (width === 1280) {
          // collapsible="none" keeps its native width and installs no desktop writer.
          const staticShell = card(page, "collapse-modes").locator('[data-slot="sidebar-wrapper"]').nth(2);
          await expect(staticShell.locator('[data-slot="sidebar-container"]')).toHaveCount(0);
          await expect(staticShell.locator('[data-slot="sidebar-gap"]')).toHaveCount(0);
          const staticWidth = await staticShell
            .locator('[data-slot="sidebar"]')
            .evaluate((node) => node.getBoundingClientRect().width);
          await trigger(staticShell).click();
          await expect(staticShell.locator('[data-slot="sidebar-container"]')).toHaveCount(0);
          await expect(staticShell.locator('[data-slot="sidebar-gap"]')).toHaveCount(0);
          expect(
            await staticShell.locator('[data-slot="sidebar"]').evaluate((node) => node.getBoundingClientRect().width),
          ).toBe(staticWidth);
        }
      });

test("S1 full moves the projected pair for both sides and reverses one scalar", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page, "full");
  for (const root of [preview(page), card(page, "right-side")] as const) {
    // Normalise to the expanded rest state; the examples are independent providers.
    const resting = await geometry(root);
    if (resting.state !== "expanded" || resting.gap < resting.panelWidth - 0.5) {
      await trigger(root).click();
      await expect
        .poll(() => root.locator('[data-slot="sidebar-gap"]').evaluate((node) => node.getBoundingClientRect().width), {
          intervals: [50],
          timeout: 5000,
        })
        .toBeCloseTo(resting.panelWidth, 0);
    }
    await record(root, 70);
    await trigger(root).click();
    // Reverse while the collapse is still travelling.
    await expect
      .poll(() => root.locator('[data-slot="sidebar-gap"]').evaluate((node) => node.getBoundingClientRect().width), {
        intervals: [16, 32, 48],
        timeout: 4000,
      })
      .toBeLessThan(96);
    // Reverse through this shell's own trigger, so the moving trigger's actionability
    // window cannot delay the interruption into a finished collapse.
    await root.evaluate((scope) => {
      (scope.querySelector('[data-slot="sidebar-trigger"]') as HTMLElement).click();
    });
    await waitForFrames(page, 70);
    const frames = await recorded(page);
    expectCoupled(frames);
    expect(frames.every((frame) => frame.mode === "full")).toBe(true);
    expect(frames.some((frame) => frame.animations > 0)).toBe(true);
    const least = frames.reduce((min, frame) => (frame.gap < min.gap ? frame : min));
    const reversal = frames.indexOf(least);
    const start = frames.at(0)?.gap ?? 0;
    // The reversal happens between the ends: the pair neither finishes the collapse nor
    // restarts from the expanded geometry, which a second spring with a matching duration
    // would do. Provider state flips on the request, so the shape of the pair carries the proof.
    expect(reversal).toBeGreaterThan(2);
    expect(reversal).toBeLessThan(frames.length - 3);
    expect(least.gap).toBeGreaterThan(0);
    expect(least.gap).toBeLessThan(least.panelWidth);
    expect(frames.slice(reversal).some((frame) => frame.gap > least.gap)).toBe(true);
    expect(frames.at(-1)?.state).toBe("expanded");
    // The reopened scalar returns to the resting gap rather than stopping short.
    await expect
      .poll(() => root.locator('[data-slot="sidebar-gap"]').evaluate((node) => node.getBoundingClientRect().width), {
        intervals: [50],
        timeout: 5000,
      })
      .toBeCloseTo(start, 0);
  }
});

test("S1 icon collapse resizes the rail from the same clamped scalar", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page, "full");
  const root = card(page, "icon-navigation").locator('[data-slot="sidebar-wrapper"]').first();
  // The icon example starts as a rail; expand it first so the collapse can be observed.
  await expect
    .poll(
      async () => {
        const frame = await geometry(root);
        if (frame.state !== "expanded") await trigger(root).click();
        return frame.state === "expanded" && Math.abs(frame.gap - frame.panelWidth) < 1;
      },
      { intervals: [50], timeout: 8000 },
    )
    .toBe(true);
  const before = await geometry(root);
  expect(before.state).toBe("expanded");
  expect(before.gap).toBeCloseTo(before.panelWidth, 0);
  expect(Math.abs(before.alongSide)).toBeLessThan(0.75);
  await record(root, 70);
  await trigger(root).click();
  await waitForFrames(page, 70);
  const frames = await recorded(page);
  // Icon collapse owns width on both parts: the gap's reserved width and the panel's
  // width are one value in every frame, with no translation.
  expectCoupled(frames);
  expect(frames.every((frame) => Math.abs(frame.panelWidth - frame.gap) < 0.75)).toBe(true);
  expect(frames.some((frame) => frame.animations > 0)).toBe(true);
  expect(new Set(frames.map((frame) => Math.round(frame.gap))).size).toBeGreaterThan(2);
  const after = await geometry(root);
  expect(after.state).toBe("collapsed");
  expect(after.gap).toBeLessThan(before.gap);
  expect(after.gap).toBeCloseTo(after.panelWidth, 0);
  expectCoupled([after]);
  // Reduced drops travel and lands the rail immediately.
  await modeSwitch(page, "reduced").click();
  if (after.state === "collapsed") await trigger(root).click();
  await trigger(root).click();
  const settled = await geometry(root);
  expect(settled.mode).toBe("reduced");
  expect(settled.transform).toBe("none");
  expect(settled.animations).toBe(0);
  expectCoupled([settled]);
  await modeSwitch(page, "full").click();
});

test("S1 resolves each variant and width from the actual shell variables", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page, "full");
  const wrappers = card(page, "variants").locator('[data-slot="sidebar-wrapper"]');
  await expect(wrappers).toHaveCount(3);
  for (let index = 0; index < 3; index += 1) {
    const root = wrappers.nth(index);
    const before = await geometry(root);
    // Floating and inset shells pad the panel: the reserved gap still matches the panel
    // width exactly, so the same scalar can drive both.
    expect(before.gap).toBeCloseTo(before.panelWidth, 0);
    expect(Math.abs(before.alongSide)).toBeLessThan(0.75);
    await trigger(root).click();
    const after = await geometry(root);
    expect(after.gap).toBeLessThan(before.gap);
    expectCoupled([after]);
    await expect
      .poll(() => root.locator('[data-slot="sidebar-gap"]').evaluate((node) => node.getBoundingClientRect().width), {
        intervals: [50],
        timeout: 5000,
      })
      .toBe(0);
    const settled = await geometry(root);
    expect(settled.gap).toBe(0);
    expectCoupled([settled]);
  }
  await card(page, "variants").screenshot({ path: join(proofRoot, "variants-collapsed.png") });
});

test("S1 width-token change during a toggle retires the projection at the new extents", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page, "full");
  const root = preview(page);
  const resting = await geometry(root);
  if (resting.state !== "expanded") await trigger(root).click();
  const before = await geometry(root);
  await trigger(root).click();
  await expect
    .poll(() => root.locator('[data-slot="sidebar-gap"]').evaluate((node) => node.getBoundingClientRect().width), {
      intervals: [16, 32, 48],
      timeout: 4000,
    })
    .toBeLessThan(before.panelWidth * 0.8);
  // Widen the shell while the collapse is still travelling: the old extents must not keep
  // writing, and the released constraint must land on the new width.
  await root.evaluate((scope) => {
    const wrapper = (
      scope.matches('[data-slot="sidebar-wrapper"]') ? scope : scope.querySelector('[data-slot="sidebar-wrapper"]')
    ) as HTMLElement;
    wrapper.style.setProperty("--sidebar-width", "14rem");
  });
  await expect
    .poll(() => root.locator('[data-slot="sidebar-gap"]').evaluate((node) => node.getBoundingClientRect().width), {
      intervals: [50],
      timeout: 5000,
    })
    .toBe(0);
  const settled = await geometry(root);
  expect(settled.gap).toBe(0);
  expect(settled.panelWidth).toBeCloseTo(224, 0);
  expect(settled.transform).toBe("none");
  expectCoupled([settled]);
  const running = await root
    .locator('[data-slot="sidebar-container"]')
    .evaluate((node) => node.getAnimations().filter((animation) => animation.playState === "running").length);
  expect(running).toBe(0);
  // The new width is the extent a later toggle resolves.
  await page.waitForTimeout(400);
  await trigger(root).click();
  await expect
    .poll(() => root.locator('[data-slot="sidebar-gap"]').evaluate((node) => node.getBoundingClientRect().width), {
      intervals: [50],
      timeout: 5000,
    })
    .toBeCloseTo(224, 0);
  const reopened = await geometry(root);
  expect(reopened.panelWidth).toBeCloseTo(224, 0);
  expect(reopened.gap).toBeCloseTo(224, 0);
  expectCoupled([reopened]);
  await root.screenshot({ path: join(proofRoot, "width-token-widened.png") });
});

test("S1 live downgrade settles the coupled geometry while it is in flight", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page, "full");
  for (const mode of ["reduced", "none"] as const) {
    const root = preview(page);
    if ((await geometry(root)).state === "collapsed") await trigger(root).click();
    await record(root, 60);
    await trigger(root).click();
    // Downgrade while the collapse is still travelling.
    await expect
      .poll(() => root.locator('[data-slot="sidebar-gap"]').evaluate((node) => node.getBoundingClientRect().width), {
        intervals: [16, 32, 48],
        timeout: 4000,
      })
      .toBeLessThan(160);
    await modeSwitch(page, mode).click();
    await expect(root.locator('[data-slot="sidebar-container"]')).toHaveAttribute("data-motion", mode);
    const settled = await geometry(root);
    expect(settled.mode).toBe(mode);
    expect(settled.state).toBe("collapsed");
    expect(settled.transform).toBe("none");
    expect(settled.gapAnimations).toBe(0);
    expect(settled.gap).toBe(0);
    expectCoupled([settled]);
    await waitForFrames(page, 60);
    // The recorded descent keeps the pair consistent while the downgrade lands it.
    expectCoupled(await recorded(page));
    const running = await root
      .locator('[data-slot="sidebar-container"]')
      .evaluate((node) => node.getAnimations().filter((animation) => animation.playState === "running").length);
    expect(running).toBe(0);
    await root.screenshot({ path: join(proofRoot, `downgrade-${mode}.png`) });
    await modeSwitch(page, "full").click();
    await expect(root.locator('[data-slot="sidebar-container"]')).toHaveAttribute("data-motion", "full");
  }
});

test("S1 breakpoint change retires the desktop projection before the mobile sheet mounts", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page, "full");
  const root = preview(page);
  await trigger(root).click();
  await page.waitForFunction(
    () =>
      document.querySelector('[data-preview="sidebar"] [data-slot="sidebar-container"]')?.getAnimations().length === 1,
  );
  await page.setViewportSize({ width: 390, height: 900 });
  await expect(root.locator('[data-slot="sidebar-container"]')).toHaveCount(0);
  // No in-flight desktop transform survives into the mobile presentation.
  const running = await page.evaluate(
    () =>
      [...document.querySelectorAll("[data-motion]")].filter((node) =>
        node.getAnimations().some((animation) => animation.playState === "running"),
      ).length,
  );
  expect(running).toBe(0);
  await root.screenshot({ path: join(proofRoot, "breakpoint-mobile.png") });
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page, "full");
  const restored = await geometry(preview(page));
  // Released temporary constraints return to the natural layout.
  expect(restored.transform).toBe("none");
  expect(restored.animations).toBe(0);
  expectCoupled([restored]);
});
