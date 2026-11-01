import { mkdir } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { effectiveMode } from "./helpers";

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  for (const mode of ["full", "reduced", "none"] as const) {
    test(`data-table ${mode} / ${reducedMotion}`, async ({ page }) => {
      test.setTimeout(60000);
      await page.emulateMedia({ reducedMotion });
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto("/components/data-table?motion=none");
      await page.waitForLoadState("networkidle");
      const preview = page.locator('[data-preview="data-table"]').first();
      await expect(preview.getByRole("textbox", { name: "Filter emails" })).toBeVisible();
      await preview.getByLabel("Table motion").selectOption(mode);
      const effective = effectiveMode(mode, reducedMotion === "reduce");
      await expect(preview.locator('[data-slot="data-table"]')).toHaveAttribute("data-motion", effective);
      const input = preview.getByRole("textbox", { name: "Filter emails" });
      const table = preview.getByRole("table", { name: "Payments" });
      await input.evaluate((el) => el.setAttribute("data-identity", "input"));
      await table.evaluate((el) => el.setAttribute("data-identity", "table"));
      await input.fill("person01");
      await expect(preview.getByRole("status")).toContainText("0 of 1");
      await expect(input).toBeFocused();
      await input.fill("");
      const email = preview.getByRole("button", { name: "Email", exact: true });
      await email.click();
      await expect(preview.getByRole("columnheader", { name: "Email" })).toHaveAttribute("aria-sort", "ascending");
      await email.click();
      await expect(preview.getByRole("columnheader", { name: "Email" })).toHaveAttribute("aria-sort", "descending");
      await email.click();
      const box = await preview.getByRole("checkbox", { name: "Select person01@example.com" }).boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(16);
      expect(box?.height).toBeGreaterThanOrEqual(16);
      await preview.getByRole("checkbox", { name: "Select person01@example.com" }).focus();
      await page.keyboard.press("Space");
      await expect(preview.getByRole("status")).toContainText("1 of 23");
      await preview.getByRole("checkbox", { name: "Select all", exact: true }).click();
      await expect(preview.getByRole("status")).toContainText("10 of 23");
      await preview.getByRole("button", { name: "Next", exact: true }).click();
      await expect(preview.getByText("person11@example.com")).toBeVisible();
      await preview.getByRole("button", { name: "Next", exact: true }).click();
      await expect(preview.getByText("person23@example.com")).toBeVisible();
      await expect(preview.getByRole("button", { name: "Next", exact: true })).toBeDisabled();
      await preview.getByRole("button", { name: "Reset table" }).click();
      await preview.getByRole("button", { name: "Update first payment" }).click();
      await expect(preview.getByText("$999.00")).toBeVisible();
      const trigger = preview.getByRole("button", { name: "Columns", exact: true });
      await trigger.focus();
      await page.keyboard.press("ArrowDown");
      await expect(page.getByRole("menu")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(trigger).toBeFocused();
      const samples = await trigger.evaluate(async (el) => {
        (el as HTMLButtonElement).click();
        const samples = [];
        for (let i = 0; i < 24; i++) {
          await new Promise(requestAnimationFrame);
          const popup = document.querySelector('[data-slot="dropdown-menu-content"]');
          if (popup) {
            const cs = getComputedStyle(popup);
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
      await page.getByRole("menuitemcheckbox", { name: "status", exact: true }).click();
      await page.keyboard.press("Escape");
      await expect(preview.getByRole("columnheader", { name: "Status", exact: true })).toHaveCount(0);
      await input.fill("missing");
      await expect(preview.getByText("No results.")).toHaveAttribute("colspan", "4");
      await preview.getByLabel("Table motion").selectOption("none");
      await expect(table).toHaveAttribute("data-identity", "table");
      await expect(input).toHaveAttribute("data-identity", "input");
      await expect(input).toHaveValue("missing");
      expect(
        await table.evaluate((el) => ({
          transform: getComputedStyle(el).transform,
          animations: el.getAnimations().length,
        })),
      ).toEqual({ transform: "none", animations: 0 });
      await preview.getByRole("button", { name: "Reset table" }).click();
      await page.setViewportSize({ width: 390, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const scroll = preview.locator('[data-slot="table-container"]');
      expect(await scroll.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
      await table.focus();
      await page.keyboard.press("ArrowRight");
      await expect.poll(() => scroll.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
      expect(errors).toEqual([]);
    });
  }
}

for (const colorScheme of ["light", "dark"] as const)
  test(`data-table ${colorScheme} accessibility and responsive proof`, async ({ page }) => {
    test.setTimeout(60000);
    await page.emulateMedia({ colorScheme, reducedMotion: "no-preference" });
    await page.goto("/components/data-table?motion=none");
    await page.waitForLoadState("networkidle");
    const preview = page.locator('[data-preview="data-table"]').first();
    await expect(preview.getByRole("textbox", { name: "Filter emails" })).toBeVisible();
    await preview.getByLabel("Table motion").selectOption("none");
    await mkdir(".cache/data-table-proof", { recursive: true });
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      expect(results.violations).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: `.cache/data-table-proof/data-table-${colorScheme}-${width}.png`, fullPage: true });
      await preview.screenshot({ path: `.cache/data-table-proof/preview-${colorScheme}-${width}.png` });
    }
  });

test("data-table live portal downgrade and system preference preserves nodes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/components/data-table?motion=none");
  await page.waitForLoadState("networkidle");
  const preview = page.locator('[data-preview="data-table"]').first();
  await expect(preview.getByRole("textbox")).toBeVisible();
  await preview.getByRole("button", { name: "Columns", exact: true }).click();
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  await menu.evaluate((el) => el.setAttribute("data-identity", "portal"));
  // DOM select change keeps the portal open; pointer focus outside would dismiss it.
  await preview.getByLabel("Table motion").evaluate((el) => {
    (el as HTMLSelectElement).value = "none";
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(menu).toHaveAttribute("data-motion", "none");
  await expect(menu).toHaveAttribute("data-identity", "portal");
  expect(
    await menu.evaluate((el) => ({
      duration: getComputedStyle(el).transitionDuration,
      opacity: getComputedStyle(el).opacity,
      scale: getComputedStyle(el).scale,
      animations: el.getAnimations().length,
    })),
  ).toEqual({ duration: "0s", opacity: "1", scale: "none", animations: 0 });
  await preview.getByLabel("Table motion").evaluate((el) => {
    (el as HTMLSelectElement).value = "full";
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(menu).toHaveAttribute("data-motion", "full");
  expect(await menu.evaluate((el) => getComputedStyle(el).transitionDuration)).toBe("0.16s");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(menu).toHaveAttribute("data-motion", "reduced");
  expect(await menu.evaluate((el) => getComputedStyle(el).scale)).toBe("none");
  await expect(menu).toHaveAttribute("data-identity", "portal");
  await page.keyboard.press("Escape");
});

test("data-table row actions use the original ID and customer email", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/components/data-table?motion=none");
  await page.waitForLoadState("networkidle");
  const preview = page.locator('[data-preview="data-table"]').first();
  const trigger = preview.getByRole("button", { name: "Open menu" }).first();
  await trigger.click();
  await expect(page.getByRole("menuitem", { name: "Email customer" })).toHaveAttribute(
    "href",
    "mailto:person01@example.com",
  );
  await page.getByRole("menuitem", { name: "Copy payment ID" }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("payment-1");
  await expect(trigger).toBeFocused();
});
