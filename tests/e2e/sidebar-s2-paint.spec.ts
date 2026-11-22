import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { MODES } from "./helpers";

/**
 * Slice S2 browser evidence: item/surface paint and menu-action visibility.
 *
 * The two paint regions must keep one short colour clock per mode, a focused or invalid
 * region must land its declared paint at once while a disjoint region stays eligible, and
 * the showOnHover action must reveal/hide on one opacity channel with collapse authoritative.
 *
 * Screenshots are written under `.cache/sidebar-s2/` (ignored) so a reviewer inspects the
 * actual surfaces — hover, active, focus and invalid, both sides, light/dark, three modes.
 */
const proofRoot = process.env.CADENCE_SIDEBAR_S2_PROOF ?? ".cache/sidebar-s2";
const card = (page: Page, name: string) => page.locator(`[data-component-example="sidebar/${name}"]`);
const modeSwitch = (page: Page, mode: string) =>
  page.getByRole("group", { name: "Motion mode" }).getByRole("button", { name: mode, exact: true });

async function open(page: Page, mode: string, theme: string) {
  await page.addInitScript((value) => localStorage.setItem("cadence-theme", value), theme);
  await page.goto(`/components/sidebar?motion=${mode}`);
  await page.waitForLoadState("networkidle");
  await expect(page.locator('[data-preview="sidebar"]')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => document.getAnimations().every((animation) => animation.playState !== "running"));
  // A scope transport can commit its resolved clocks after hydration; wait for every
  // colour owner to hold its own explicit property list rather than the initial `all`.
  await page.waitForFunction(() => {
    const owners = [...document.querySelectorAll("[data-cadence-color]")];
    return owners.length > 0 && owners.every((node) => getComputedStyle(node).transitionProperty !== "all");
  });
}

/** Resolved colour clock of one owned region, in seconds. */
async function clocks(root: Locator) {
  return root.evaluate((scope) => {
    const read = (selector: string) => {
      const node = scope.querySelector(selector) as HTMLElement | null;
      if (!node) return null;
      const css = getComputedStyle(node);
      return {
        properties: css.transitionProperty.split(",").map((value) => value.trim()),
        seconds: css.transitionDuration.split(",").map((value) => Number.parseFloat(value)),
        delay: css.transitionDelay.split(",").map((value) => Number.parseFloat(value)),
      };
    };
    return {
      button: read('[data-slot="sidebar-menu-button"]'),
      action: read('[data-slot="sidebar-menu-action"]'),
      rail: read('[data-slot="sidebar-rail"]'),
      line: read('[data-sidebar="rail-line"]'),
      label: read('[data-slot="sidebar-group-label"]'),
      badge: read('[data-slot="sidebar-menu-badge"]'),
      inner: read('[data-slot="sidebar-inner"]'),
      inset: read('[data-slot="sidebar-inset"]'),
    };
  });
}

/** Whether the host currently runs a colour or opacity transition/animation. */
async function running(node: Locator) {
  return node.evaluate((element) =>
    element.getAnimations().map((animation) => ({
      property: "transitionProperty" in animation ? String(animation.transitionProperty) : "opacity",
      state: animation.playState,
    })),
  );
}

test("S2 paint regions keep one colour clock per region in every mode", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await mkdir(proofRoot, { recursive: true });
  for (const mode of MODES) {
    await open(page, mode, "light");
    const groups = card(page, "groups-and-actions");
    const left = await clocks(groups);
    const expected = mode === "full" ? 0.16 : mode === "reduced" ? 0.096 : 0;
    for (const [name, region] of Object.entries(left)) {
      if (!region) continue;
      expect(region.seconds.every((value) => value === 0) || region.seconds.length > 0).toBe(true);
      for (const value of region.seconds) expect(value).toBeCloseTo(expected, 5);
      for (const value of region.delay) expect(value).toBe(0);
      // One explicit property set: never `all`, and no colour owner animates opacity.
      expect(region.properties).not.toContain("all");
      expect(region.properties).not.toContain("opacity");
      if (name === "button") expect(region.properties).toContain("background-color");
      if (name === "label" || name === "badge") expect(region.properties).toEqual(["color"]);
      if (name === "line") expect(region.properties).toEqual(["background-color"]);
    }
    // The static shell (collapsible="none") owns its own surface clock.
    const staticShell = await clocks(card(page, "menu-styles"));
    expect(staticShell.inner).toBeNull();
    const staticPaint = await card(page, "menu-styles")
      .locator('[data-slot="sidebar"]')
      .first()
      .evaluate((element) => {
        const css = getComputedStyle(element as HTMLElement);
        return Number.parseFloat(css.transitionDuration);
      });
    expect(staticPaint).toBeCloseTo(expected, 5);
    await groups.screenshot({ path: join(proofRoot, `paint-${mode}-light.png`) });
  }
});

for (const mode of MODES)
  for (const theme of ["light", "dark"] as const)
    test(`S2 hover paint and focus settlement ${mode}/${theme}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await mkdir(proofRoot, { recursive: true });
      await open(page, mode, theme);
      for (const [side, example] of [
        ["left", "groups-and-actions"],
        ["right", "right-side"],
      ] as const) {
        const region = card(page, example);
        const button = region.locator('[data-slot="sidebar-menu-button"]').first();
        await button.hover();
        if (mode === "full") {
          // Hovering is ordinary item paint: an eligible scoped colour transition runs.
          await expect
            .poll(() => running(button), { intervals: [16, 32, 64], timeout: 4000 })
            .toEqual(expect.arrayContaining([{ property: "background-color", state: "running" }]));
        }
        await region.screenshot({ path: join(proofRoot, `hover-${mode}-${theme}-${side}.png`) });
        await page.waitForFunction((selector) => {
          const node = document.querySelector(selector) as HTMLElement | null;
          return !node || node.getAnimations().every((animation) => animation.playState !== "running");
        }, '[data-component-example="sidebar/groups-and-actions"] [data-slot="sidebar-menu-button"]');

        // Focus cancels the region's clock and lands its declared paint; the shell settles too.
        await button.focus();
        const focused = await clocks(region);
        const shell = example === "groups-and-actions" ? focused.inner : null;
        if (focused.button) for (const value of focused.button.seconds) expect(value).toBe(0);
        if (shell) for (const value of shell.seconds) expect(value).toBe(0);
        await region.screenshot({ path: join(proofRoot, `focus-${mode}-${theme}-${side}.png`) });

        // An unrelated row stays eligible for verified colour feedback.
        const rows = region.locator('[data-slot="sidebar-menu-button"]');
        if ((await rows.count()) > 1) {
          const disjoint = await rows.nth(1).evaluate((element) => {
            const value = getComputedStyle(element as HTMLElement).transitionDuration;
            return Number.parseFloat(value);
          });
          expect(disjoint).toBeCloseTo(mode === "full" ? 0.16 : mode === "reduced" ? 0.096 : 0, 5);
        }
      }
    });

test("S2 invalid region settles the containing shell in every mode", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await mkdir(proofRoot, { recursive: true });
  for (const mode of MODES) {
    await open(page, mode, "light");
    // The controlled navigation example carries the real SidebarInput in its header.
    const region = card(page, "controlled-navigation");
    const input = region.getByRole("textbox").first();
    await input.evaluate((element) => element.setAttribute("aria-invalid", "true"));
    const settled = await clocks(region);
    for (const [name, value] of Object.entries(settled))
      if (name === "inner" && value) for (const seconds of value.seconds) expect(seconds).toBe(0);
    await expect
      .poll(() => input.evaluate((element) => Number.parseFloat(getComputedStyle(element).transitionDuration)), {
        intervals: [32, 64],
        timeout: 4000,
      })
      .toBe(0);
    await region.screenshot({ path: join(proofRoot, `invalid-${mode}-light.png`) });
  }
});

test("S2 active route paint is state, not focus", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page, "full", "dark");
  const region = card(page, "menu-styles");
  // `isActive` reaches the DOM as a boolean state attribute, not a string value.
  const active = region.locator('[data-slot="sidebar-menu-button"][data-active]').first();
  await expect(active).toHaveCount(1);
  // A route's active state alone is not DOM focus, so the region stays eligible.
  const seconds = await active.evaluate((element) => Number.parseFloat(getComputedStyle(element).transitionDuration));
  expect(seconds).toBeCloseTo(0.16, 5);
  await region.screenshot({ path: join(proofRoot, "active-full-dark.png") });
});

test("S2 action reveal, hide and collapse use one opacity channel", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await mkdir(proofRoot, { recursive: true });
  for (const mode of MODES) {
    await open(page, mode, "light");
    const region = card(page, "groups-and-actions");
    // The example starts with one row (which carries the badge); a caller-added row
    // is the one that owns a showOnHover action.
    await region.getByRole("button", { name: "Add project" }).click();
    const row = region.locator('[data-slot="sidebar-menu-item"]').nth(1);
    const action = row.locator('[data-slot="sidebar-menu-action"]');
    await expect(action).toHaveCount(1);
    await expect(action).not.toHaveAttribute("data-action-exiting");
    expect(await action.evaluate((element) => Number.parseFloat(getComputedStyle(element).opacity))).toBe(0);

    await row.hover();
    if (mode === "none") {
      // None settles both directions immediately: no opacity flight at all.
      await expect
        .poll(() => action.evaluate((element) => Number.parseFloat(getComputedStyle(element).opacity)))
        .toBe(1);
      expect((await running(action)).filter((handle) => handle.property === "opacity")).toHaveLength(0);
    } else {
      await expect
        .poll(() => action.evaluate((element) => Number.parseFloat(getComputedStyle(element).opacity)), {
          intervals: [16, 32, 64],
          timeout: 4000,
        })
        .toBe(1);
    }
    await region.screenshot({ path: join(proofRoot, `action-reveal-${mode}-light.png`) });

    // Collapse stays authoritative: a pending or in-flight reveal is retired, never replayed.
    await region.getByRole("button", { name: "Toggle Project actions" }).click();
    await expect(region.locator('[data-slot="sidebar"]')).toHaveAttribute("data-collapsible", "icon");
    await expect(action).not.toHaveAttribute("data-action-exiting");
    expect(
      (
        await action.evaluate((element) =>
          element.getAnimations().filter((animation) => animation.playState === "running"),
        )
      ).length,
    ).toBe(0);
    await region.screenshot({ path: join(proofRoot, `action-collapsed-${mode}-light.png`) });
    // Re-expanding neither replays the consumed reveal nor leaves a hold behind.
    await region.getByRole("button", { name: "Toggle Project actions" }).click();
    await expect(action).not.toHaveAttribute("data-action-exiting");
    await page.mouse.move(0, 0);
    await expect
      .poll(() => action.evaluate((element) => Number.parseFloat(getComputedStyle(element).opacity)), {
        intervals: [32, 64],
        timeout: 4000,
      })
      .toBe(0);
  }
});

test("S2 mode switch keeps the resolved paint clocks", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page, "full", "light");
  const region = card(page, "groups-and-actions");
  const button = region.locator('[data-slot="sidebar-menu-button"]').first();
  await modeSwitch(page, "reduced").click();
  await expect(button).toHaveAttribute("data-motion", "reduced");
  expect(
    await button.evaluate((element) => Number.parseFloat(getComputedStyle(element).transitionDuration)),
  ).toBeCloseTo(0.096, 5);
  await modeSwitch(page, "none").click();
  await expect(button).toHaveAttribute("data-motion", "none");
  expect(await button.evaluate((element) => Number.parseFloat(getComputedStyle(element).transitionDuration))).toBe(0);
  await modeSwitch(page, "full").click();
  await expect(button).toHaveAttribute("data-motion", "full");
});
