import { mkdir } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { effectiveMode } from "./helpers";
import { expectMenuAccessibility } from "./menu-accessibility";
import { openPopupMotionFixture } from "./popup-motion-fixture";

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  for (const mode of ["full", "reduced", "none"] as const) {
    test(`date-picker ${mode} / ${reducedMotion}`, async ({ page }) => {
      test.setTimeout(60000);
      await page.emulateMedia({ reducedMotion });
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(`/components/date-picker?motion=${mode}`);
      await page.waitForLoadState("networkidle");
      const preview = page.locator('[data-preview="date-picker"]').first();
      const effective = effectiveMode(mode, reducedMotion === "reduce");
      const trigger = preview.getByRole("button", { name: /Appointment:/ });
      await trigger.focus();
      await page.keyboard.press("Space");
      const popup = page.getByRole("dialog", { name: "Appointment" });
      await expect(popup).toBeVisible();
      await expect(popup).toHaveAttribute("data-motion", effective);
      const selected = popup.getByRole("button", { name: /Thursday, November 12th/ });
      await expect(selected).toBeFocused();
      await page.keyboard.press("ArrowRight");
      await expect(popup.getByRole("button", { name: /Friday, November 13th/ })).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(trigger).toContainText("November 13th, 2026");
      await expect(popup.getByRole("button", { name: /November 5th/ })).toBeEnabled();
      const grid = popup.getByRole("grid");
      await grid.evaluate((el) => el.setAttribute("data-identity", "grid"));
      // A surface that contains keyboard focus keeps its paint native, so this programmatic
      // navigation (focus stays on the day) settles in every mode instead of fading a grid
      // the user is already reading.
      const focusedSamples = await popup.getByRole("button", { name: /next month/i }).evaluate(async (el) => {
        (el as HTMLButtonElement).click();
        const samples = [];
        for (let i = 0; i < 12; i++) {
          await new Promise(requestAnimationFrame);
          const grid = document.querySelector('[data-slot="calendar-month-grid"]');
          if (grid) {
            const cs = getComputedStyle(grid);
            samples.push({ transform: cs.transform, opacity: cs.opacity, animations: grid.getAnimations().length });
          }
        }
        return samples;
      });
      expect(focusedSamples.length).toBeGreaterThan(0);
      expect(focusedSamples.every((s) => s.transform === "none" && s.opacity === "1" && s.animations === 0)).toBe(true);
      await expect(grid).toHaveAttribute("aria-label", "December 2026");
      // A mouse-driven change takes focus out of the grid, so Calendar's own month paint runs:
      // full travels and fades, reduced keeps the fade without travel, none settles immediately.
      await page.evaluate(() => {
        const rows: { transform: string; opacity: string; animations: number }[] = [];
        (window as unknown as { __monthRows: typeof rows }).__monthRows = rows;
        const sample = () => {
          const grid = document.querySelector('[data-slot="calendar-month-grid"]');
          if (grid) {
            const cs = getComputedStyle(grid);
            rows.push({ transform: cs.transform, opacity: cs.opacity, animations: grid.getAnimations().length });
          }
          if (rows.length < 120) requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      });
      await popup.getByRole("button", { name: /next month/i }).click();
      await page.waitForTimeout(400);
      const mouseSamples = await page.evaluate(
        () =>
          (window as unknown as { __monthRows: { transform: string; opacity: string; animations: number }[] })
            .__monthRows,
      );
      expect(mouseSamples.length).toBeGreaterThan(0);
      if (effective === "full") expect(mouseSamples.some((s) => s.transform !== "none")).toBe(true);
      else expect(mouseSamples.every((s) => s.transform === "none")).toBe(true);
      if (effective === "full" || effective === "reduced")
        expect(new Set(mouseSamples.map((s) => s.opacity)).size).toBeGreaterThan(1);
      if (effective === "none") expect(mouseSamples.every((s) => s.opacity === "1" && s.animations === 0)).toBe(true);
      await expect(grid).toHaveAttribute("aria-label", "January 2027");
      await popup.getByRole("button", { name: /previous month/i }).click();
      await expect(grid).toHaveAttribute("aria-label", "December 2026");
      await expect(grid).toHaveAttribute("data-identity", "grid");
      await page.keyboard.press("Escape");
      await expect(trigger).toBeFocused();
      await expect(popup).toHaveCount(0);
      const samples = await trigger.evaluate(async (el) => {
        (el as HTMLButtonElement).click();
        const samples = [];
        for (let i = 0; i < 48; i++) {
          await new Promise(requestAnimationFrame);
          const p = document.querySelector('[data-slot="popover-content"]');
          if (p) {
            const cs = getComputedStyle(p);
            samples.push({ opacity: cs.opacity, scale: cs.scale, animations: p.getAnimations().length });
          }
        }
        return samples;
      });
      expect(samples.length).toBeGreaterThan(0);
      // Calendar autofocuses a day inside the panel, and the anchored presence never delays a
      // focused surface: the entry settles at its resting paint instead of fading or travelling.
      expect(samples.every((s) => s.opacity === "1" && s.scale === "none" && s.animations === 0)).toBe(true);
      expect(await popup.evaluate((el) => el.contains(document.activeElement))).toBe(true);
      await page.keyboard.press("Escape");
      const controlled = page.locator('[data-component-example="date-picker/controlled-date-and-clearing"]');
      const controlledTrigger = controlled.getByRole("button", { name: /Controlled appointment:/ });
      await controlled.getByRole("button", { name: "Clear date", exact: true }).click();
      await expect(controlledTrigger).toContainText("Pick a date");
      await controlled.getByRole("button", { name: "Set November 20", exact: true }).click();
      await expect(controlledTrigger).toContainText("November 20th, 2026");
      await expect(page.locator('[data-component-example="date-picker/locale"]').getByRole("button")).toContainText(
        "12 novembre 2026",
      );
      await expect(
        page
          .locator('[data-component-example="date-picker/disabled-dates"]')
          .getByRole("button", { name: /Unavailable:/ }),
      ).toBeDisabled();
      await page
        .locator('[data-component-example="date-picker/range-and-presets"]')
        .getByRole("button", { name: /Travel dates:/ })
        .click();
      const range = page.getByRole("dialog", { name: "Travel dates" });
      await range.getByRole("button", { name: /Tuesday, November 10th/ }).click();
      await range.getByRole("button", { name: /Sunday, November 15th/ }).click();
      await expect(
        page
          .locator('[data-component-example="date-picker/range-and-presets"]')
          .getByRole("button", { name: /Travel dates:/ }),
      ).toContainText("November 10th, 2026 – November 15th, 2026");
      await page.setViewportSize({ width: 390, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.keyboard.press("Escape");
      expect(errors).toEqual([]);
    });
  }
}

test("date-picker nested clock and live downgrade preserve popup and focused day", async ({ page }) => {
  await openPopupMotionFixture(page, "date-picker", "full", 4);
  const preview = page.locator('[data-preview="date-picker"]').first();
  const trigger = preview.getByRole("button", { name: /Fixture appointment:/ });
  await trigger.click();
  const popup = page.getByRole("dialog", { name: "Fixture appointment" });
  // A caller palette keeps the panel's colour paint immediate, so the nested clock is
  // observed where it is still authoritative: the inherited surface variable itself.
  expect(await popup.evaluate((el) => getComputedStyle(el).getPropertyValue("--cadence-time-scale").trim())).toBe("4");
  // Retarget an opening transition before it settles, then recover full.
  await popup.getByRole("button", { name: /next month/i }).click();
  const grid = popup.getByRole("grid");
  await grid.evaluate((el) => el.setAttribute("data-identity", "live-grid"));
  await page.getByLabel("Fixture motion", { exact: true }).evaluate((el) => {
    (el as HTMLSelectElement).value = "none";
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(grid).toHaveAttribute("data-identity", "live-grid");
  expect(
    await grid.evaluate((el) => ({ transform: getComputedStyle(el).transform, animations: el.getAnimations().length })),
  ).toEqual({ transform: "none", animations: 0 });
  await page.getByLabel("Fixture motion", { exact: true }).evaluate((el) => {
    (el as HTMLSelectElement).value = "full";
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await popup.getByRole("button", { name: /previous month/i }).click();

  await popup.evaluate((el) => el.setAttribute("data-identity", "popup"));
  const day = popup.getByRole("button", { name: /Thursday, November 12th/ });
  await day.evaluate((el) => el.setAttribute("data-identity", "day"));
  await day.focus();
  await page.getByLabel("Fixture motion", { exact: true }).evaluate((el) => {
    (el as HTMLSelectElement).value = "none";
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(popup).toHaveAttribute("data-identity", "popup");
  await expect(day).toBeFocused();
  await expect(day).toHaveAttribute("data-identity", "day");
  expect(
    await popup.evaluate((el) =>
      getComputedStyle(el)
        .transitionDuration.split(",")
        .every((time) => Number.parseFloat(time) === 0),
    ),
  ).toBe(true);
  await expect(popup).toHaveCSS("scale", "none");
  expect(await popup.evaluate((el) => el.getAnimations().length)).toBe(0);
  await page.getByLabel("Fixture motion", { exact: true }).evaluate((el) => {
    (el as HTMLSelectElement).value = "full";
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(popup).toHaveAttribute("data-motion", "reduced");
  await expect(popup).toHaveCSS("scale", "none");
  expect(await popup.evaluate((el) => getComputedStyle(el).getPropertyValue("--cadence-time-scale").trim())).toBe("4");
  await expect(day).toBeFocused();
  await expect(trigger).toContainText("November 12th, 2026");
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`date-picker ${colorScheme} accessibility and responsive proof`, async ({ page }) => {
    test.setTimeout(120000);
    await page.emulateMedia({ colorScheme, reducedMotion: "no-preference" });
    await page.goto("/components/date-picker?motion=none");
    await page.waitForLoadState("networkidle");
    const preview = page.locator('[data-preview="date-picker"]').first();
    await expect(page.locator("article table:not([data-installation] table)")).toHaveCount(2);
    await expect(page.getByRole("cell", { name: '"single" | "range"', exact: true })).toBeVisible();
    await mkdir(".cache/date-picker-proof", { recursive: true });
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await page
        .locator('[data-component-example="date-picker/range-and-presets"]')
        .getByRole("button", { name: /Travel dates:/ })
        .click();
      const rangePopup = page.getByRole("dialog", { name: "Travel dates" });
      await expect(rangePopup).toBeVisible();
      const box = await rangePopup.boundingBox();
      if (!box) throw new Error("Missing real range popup");
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
      const grids = await rangePopup.getByRole("grid").evaluateAll((nodes) =>
        nodes.map((node) => {
          const rect = node.getBoundingClientRect();
          return { x: rect.x, y: rect.y };
        }),
      );
      expect(grids).toHaveLength(2);
      if (width === 390) expect((grids[1]?.y ?? 0) - (grids[0]?.y ?? 0)).toBeGreaterThan(200);
      else expect((grids[1]?.x ?? 0) - (grids[0]?.x ?? 0)).toBeGreaterThan(200);
      await rangePopup.screenshot({ path: `.cache/date-picker-proof/phase4l-popup-${colorScheme}-${width}.png` });
      if (width === 390) {
        await rangePopup.hover();
        await page.mouse.wheel(0, 600);
        await expect.poll(() => rangePopup.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
        await expect(rangePopup.getByRole("button", { name: /December 31st/ })).toBeInViewport();
        await rangePopup.screenshot({
          path: `.cache/date-picker-proof/phase4l-popup-bottom-${colorScheme}-${width}.png`,
        });
      }
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      await test.info().attach(`range-raw-axe-${colorScheme}-${width}`, {
        body: JSON.stringify(results),
        contentType: "application/json",
      });
      expect(results.violations.filter((finding) => finding.id !== "aria-hidden-focus")).toEqual([]);
      await expectMenuAccessibility(page, async () => {
        if (!(await page.getByRole("dialog", { name: "Travel dates" }).count()))
          await page
            .locator('[data-component-example="date-picker/range-and-presets"]')
            .getByRole("button", { name: /Travel dates:/ })
            .click();
      });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({
        path: `.cache/date-picker-proof/phase4l-final-open-${colorScheme}-${width}.png`,
        fullPage: true,
      });
      await page.keyboard.press("Escape");
      await page.evaluate(() => window.scrollTo(0, 0));
      const closed = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      expect(closed.violations).toEqual([]);
      await page.screenshot({
        path: `.cache/date-picker-proof/phase4l-final-page-${colorScheme}-${width}.png`,
        fullPage: true,
      });
      await preview.screenshot({ path: `.cache/date-picker-proof/phase4l-final-top-${colorScheme}-${width}.png` });
    }
  });
}

test("date-picker interrupted close reopens the existing popup", async ({ page }) => {
  await openPopupMotionFixture(page, "date-picker", "full", 4);
  const preview = page.locator('[data-preview="date-picker"]').first();
  const trigger = preview.getByRole("button", { name: /Fixture appointment:/ });
  await trigger.click();
  const popup = page.getByRole("dialog", { name: "Fixture appointment" });
  await expect(popup).toHaveCSS("opacity", "1");
  const result = await trigger.evaluate(async (el) => {
    const popup = document.querySelector('[data-slot="popover-content"]');
    (el as HTMLButtonElement).click();
    for (let i = 0; i < 3; i++) await new Promise(requestAnimationFrame);
    (el as HTMLButtonElement).click();
    for (let i = 0; i < 3; i++) await new Promise(requestAnimationFrame);
    return popup === document.querySelector('[data-slot="popover-content"]');
  });
  expect(result).toBe(true);
  await expect(popup).toBeVisible();
  await expect(popup).toHaveCSS("opacity", "1");
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});
