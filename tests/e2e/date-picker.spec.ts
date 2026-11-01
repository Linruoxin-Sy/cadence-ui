import { mkdir } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { effectiveMode } from "./helpers";

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  for (const mode of ["full", "reduced", "none"] as const) {
    test(`date-picker ${mode} / ${reducedMotion}`, async ({ page }) => {
      test.setTimeout(60000);
      await page.emulateMedia({ reducedMotion });
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto("/components/date-picker?motion=none");
      await page.waitForLoadState("networkidle");
      const preview = page.locator('[data-preview="date-picker"]').first();
      await preview.getByLabel("Picker motion").selectOption(mode);
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
      await expect(popup.getByRole("button", { name: /November 5th/ })).toBeDisabled();
      const grid = popup.getByRole("grid");
      await grid.evaluate((el) => el.setAttribute("data-identity", "grid"));
      const monthSamples = await popup.getByRole("button", { name: /next month/i }).evaluate(async (el) => {
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
      expect(monthSamples.length).toBeGreaterThan(0);
      if (effective === "full") expect(monthSamples.some((s) => s.transform !== "none")).toBe(true);
      else expect(monthSamples.every((s) => s.transform === "none")).toBe(true);
      if (effective === "reduced") expect(new Set(monthSamples.map((s) => s.opacity)).size).toBeGreaterThan(1);
      if (effective === "none") expect(monthSamples.every((s) => s.opacity === "1" && s.animations === 0)).toBe(true);
      await expect(grid).toHaveAttribute("aria-label", "December 2026");
      await popup.getByRole("button", { name: /previous month/i }).click();
      await expect(grid).toHaveAttribute("aria-label", "November 2026");
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
            samples.push({ opacity: cs.opacity, scale: cs.scale, duration: cs.transitionDuration });
          }
        }
        return samples;
      });
      expect(samples.length).toBeGreaterThan(0);
      if (effective === "full") {
        expect(new Set(samples.map((s) => s.opacity)).size).toBeGreaterThan(1);
        expect(new Set(samples.map((s) => s.scale)).size).toBeGreaterThan(1);
      } else expect(samples.every((s) => s.scale === "none")).toBe(true);
      if (effective === "none") expect(samples.every((s) => s.opacity === "1" && s.duration === "0s")).toBe(true);
      await page.keyboard.press("Escape");
      await preview.getByRole("button", { name: "Clear date", exact: true }).click();
      await expect(trigger).toContainText("Pick a date");
      await preview.getByRole("button", { name: "Set November 20", exact: true }).click();
      await expect(trigger).toContainText("November 20th, 2026");
      await preview.getByRole("button", { name: "Switch language", exact: true }).click();
      await expect(trigger).toContainText("20 novembre 2026");
      await expect(preview.getByRole("button", { name: /Unavailable:/ })).toBeDisabled();
      await preview.getByRole("button", { name: /Travel dates:/ }).click();
      const range = page.getByRole("dialog", { name: "Travel dates" });
      await range.getByRole("button", { name: /Tuesday, November 10th/ }).click();
      await range.getByRole("button", { name: /Sunday, November 15th/ }).click();
      await expect(preview.getByRole("button", { name: /Travel dates:/ })).toContainText(
        "November 10th, 2026 – November 15th, 2026",
      );
      await page.setViewportSize({ width: 390, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.keyboard.press("Escape");
      expect(errors).toEqual([]);
    });
  }
}

test("date-picker nested clock and live downgrade preserve popup and focused day", async ({ page }) => {
  await page.goto("/components/date-picker?motion=none");
  await page.waitForLoadState("networkidle");
  const preview = page.locator('[data-preview="date-picker"]').first();
  const trigger = preview.getByRole("button", { name: /Appointment:/ });
  await trigger.click();
  const popup = page.getByRole("dialog", { name: "Appointment" });
  await expect(popup).toHaveCSS("transition-duration", "0.64s");
  // Retarget an opening transition before it settles, then recover full.
  await popup.getByRole("button", { name: /next month/i }).click();
  const grid = popup.getByRole("grid");
  await grid.evaluate((el) => el.setAttribute("data-identity", "live-grid"));
  await preview.getByLabel("Picker motion").evaluate((el) => {
    (el as HTMLSelectElement).value = "none";
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(grid).toHaveAttribute("data-identity", "live-grid");
  expect(
    await grid.evaluate((el) => ({ transform: getComputedStyle(el).transform, animations: el.getAnimations().length })),
  ).toEqual({ transform: "none", animations: 0 });
  await preview.getByLabel("Picker motion").evaluate((el) => {
    (el as HTMLSelectElement).value = "full";
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await popup.getByRole("button", { name: /previous month/i }).click();

  await popup.evaluate((el) => el.setAttribute("data-identity", "popup"));
  const day = popup.getByRole("button", { name: /Thursday, November 12th/ });
  await day.evaluate((el) => el.setAttribute("data-identity", "day"));
  await day.focus();
  await preview.getByLabel("Picker motion").evaluate((el) => {
    (el as HTMLSelectElement).value = "none";
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(popup).toHaveAttribute("data-identity", "popup");
  await expect(day).toBeFocused();
  await expect(day).toHaveAttribute("data-identity", "day");
  await expect(popup).toHaveCSS("transition-duration", "0s");
  await expect(popup).toHaveCSS("scale", "none");
  expect(await popup.evaluate((el) => el.getAnimations().length)).toBe(0);
  await preview.getByLabel("Picker motion").evaluate((el) => {
    (el as HTMLSelectElement).value = "full";
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(popup).toHaveAttribute("data-motion", "reduced");
  await expect(popup).toHaveCSS("scale", "none");
  await expect(popup).toHaveCSS("transition-duration", "0.384s");
  await expect(day).toBeFocused();
  await expect(trigger).toContainText("November 12th, 2026");
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`date-picker ${colorScheme} accessibility and responsive proof`, async ({ page }) => {
    test.setTimeout(60000);
    await page.emulateMedia({ colorScheme, reducedMotion: "no-preference" });
    await page.goto("/components/date-picker?motion=none");
    await page.waitForLoadState("networkidle");
    const preview = page.locator('[data-preview="date-picker"]').first();
    await preview.getByLabel("Picker motion").selectOption("none");
    await expect(page.locator("article table")).toHaveCount(2);
    await expect(page.getByRole("cell", { name: '"single" | "range"', exact: true })).toBeVisible();
    await mkdir(".cache/date-picker-proof", { recursive: true });
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await preview.getByRole("button", { name: /Travel dates:/ }).click();
      await expect(page.getByRole("dialog", { name: "Travel dates" })).toBeVisible();
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      expect(results.violations).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `.cache/date-picker-proof/open-${colorScheme}-${width}.png`, fullPage: true });
      await page.keyboard.press("Escape");
      await page.evaluate(() => window.scrollTo(0, 0));
      const closed = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      expect(closed.violations).toEqual([]);
      await page.screenshot({
        path: `.cache/date-picker-proof/date-picker-${colorScheme}-${width}.png`,
        fullPage: true,
      });
      await preview.screenshot({ path: `.cache/date-picker-proof/preview-${colorScheme}-${width}.png` });
    }
  });
}

test("date-picker interrupted close reopens the existing popup", async ({ page }) => {
  await page.goto("/components/date-picker?motion=none");
  await page.waitForLoadState("networkidle");
  const preview = page.locator('[data-preview="date-picker"]').first();
  const trigger = preview.getByRole("button", { name: /Appointment:/ });
  await trigger.click();
  const popup = page.getByRole("dialog", { name: "Appointment" });
  await expect(popup).toBeVisible();
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
