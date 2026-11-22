import { mkdir } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { effectiveMode } from "./helpers";
import { expectMenuAccessibility } from "./menu-accessibility";
import { openPopupMotionFixture } from "./popup-motion-fixture";

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  for (const mode of ["full", "reduced", "none"] as const) {
    test(`data-table ${mode} / ${reducedMotion}`, async ({ page }) => {
      test.setTimeout(180000);
      await page.emulateMedia({ reducedMotion });
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(`/components/data-table?motion=${mode}`);
      await page.waitForLoadState("networkidle");
      const preview = page.locator('[data-preview="data-table"]').first();
      await expect(preview.getByRole("textbox", { name: "Filter emails" })).toBeVisible();

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
      await preview.getByRole("button", { name: "Previous", exact: true }).click();
      await preview.getByRole("button", { name: "Previous", exact: true }).click();
      const trigger = preview.getByRole("button", { name: "Columns", exact: true });
      await trigger.focus();
      await page.keyboard.press("ArrowDown");
      await expect(page.getByRole("menu")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(trigger).toBeFocused();
      // The inherited menu writes its entrance with the shared anchored-presence
      // executor: a WAAPI opacity envelope (plus a short approach) whose clock the
      // menu carries as the recipe-enabled transport. A panel that takes the entry
      // focus legitimately settles that envelope, so the proof is the owner wiring
      // plus the absence of motion under `none`, not one interpolated frame.
      const samples = await trigger.evaluate(async (el) => {
        const frames: { opacity: number; travel: boolean; scale: number; animations: number }[] = [];
        (el as HTMLButtonElement).click();
        for (let i = 0; i < 40; i++) {
          await new Promise(requestAnimationFrame);
          const popup = document.querySelector('[data-slot="dropdown-menu-content"]');
          if (!popup) continue;
          const cs = getComputedStyle(popup);
          const matrix = new DOMMatrixReadOnly(cs.transform === "none" ? undefined : cs.transform);
          frames.push({
            opacity: Number(cs.opacity),
            travel: cs.translate !== "none" || Math.abs(matrix.m41) > 0.01 || Math.abs(matrix.m42) > 0.01,
            scale: cs.scale === "none" ? matrix.a : Number.parseFloat(cs.scale),
            animations: popup.getAnimations().length,
          });
        }
        return frames;
      });
      expect(samples.length).toBeGreaterThan(0);
      expect(samples.every((s) => s.scale === 1)).toBe(true);
      const menu = page.locator('[data-slot="dropdown-menu-content"]').last();
      await expect(menu).toHaveAttribute("data-motion", effective);
      if (effective === "none") {
        expect(samples.every((s) => s.opacity === 1 && !s.travel)).toBe(true);
        await expect.poll(() => menu.evaluate((el) => el.getAnimations().length)).toBe(0);
      } else {
        expect(samples.some((s) => s.animations > 0)).toBe(true);
      }
      await page.getByRole("menuitemcheckbox", { name: "status", exact: true }).click();
      await page.keyboard.press("Escape");
      await expect(preview.getByRole("columnheader", { name: "Status", exact: true })).toHaveCount(0);
      await input.fill("missing");
      await expect(preview.getByText("No results.")).toHaveAttribute("colspan", "4");
      await page.getByRole("group", { name: "Motion mode" }).getByRole("button", { name: "none", exact: true }).click();
      await expect(table).toHaveAttribute("data-identity", "table");
      await expect(input).toHaveAttribute("data-identity", "input");
      await expect(input).toHaveValue("missing");
      expect(
        await table.evaluate((el) => ({
          transform: getComputedStyle(el).transform,
          animations: el.getAnimations().length,
        })),
      ).toEqual({ transform: "none", animations: 0 });
      await input.fill("");
      await trigger.click();
      await page.getByRole("menuitemcheckbox", { name: "status", exact: true }).click();
      await page.keyboard.press("Escape");
      await expect(preview.getByRole("columnheader", { name: "Status", exact: true })).toBeVisible();
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
    test.setTimeout(180000);
    await page.emulateMedia({ colorScheme, reducedMotion: "no-preference" });
    await page.goto("/components/data-table?motion=none");
    await page.waitForLoadState("networkidle");
    const preview = page.locator('[data-preview="data-table"]').first();
    await expect(preview.getByRole("textbox", { name: "Filter emails" })).toBeVisible();

    await mkdir(".cache/data-table-proof", { recursive: true });
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      expect(results.violations).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        path: `.cache/data-table-proof/phase4k-final-page-${colorScheme}-${width}.png`,
        fullPage: true,
      });
      const topBox = await preview.boundingBox();
      const topRoot = await preview.locator('[data-slot="data-table"]').boundingBox();
      if (!topBox || !topRoot) throw new Error("Missing top table geometry");
      expect(topRoot.x).toBeGreaterThanOrEqual(topBox.x);
      expect(topRoot.x + topRoot.width).toBeLessThanOrEqual(topBox.x + topBox.width);
      await preview.screenshot({ path: `.cache/data-table-proof/phase4k-final-top-${colorScheme}-${width}.png` });
      for (const card of await page.locator("[data-component-example]").all()) {
        const name = (await card.getAttribute("data-component-example"))?.split("/")[1];
        const cardBox = await card.boundingBox();
        if (!cardBox) throw new Error("Missing card bounds");
        for (const root of await card.locator('[data-slot="data-table"]').all()) {
          const bounds = await root.boundingBox();
          if (!bounds) throw new Error("Missing native table composition");
          expect(bounds.x).toBeGreaterThanOrEqual(cardBox.x);
          expect(bounds.x + bounds.width).toBeLessThanOrEqual(cardBox.x + cardBox.width);
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        const clip = await card.boundingBox();
        if (!clip) throw new Error("Missing card geometry");
        await page.screenshot({
          path: `.cache/data-table-proof/phase4k-final-example-${name}-${colorScheme}-${width}.png`,
          fullPage: true,
          clip,
        });
      }
      const columns = preview.getByRole("button", { name: "Columns", exact: true });
      await columns.click();
      await expectMenuAccessibility(page, async () => {
        if (!(await page.getByRole("menu").count())) await columns.click();
      });
      if (!(await page.getByRole("menu").count())) await columns.click();
      await page.screenshot({ path: `.cache/data-table-proof/phase4k-final-menu-${colorScheme}-${width}.png` });
      await page.keyboard.press("Escape");
    }
  });

test("data-table live portal downgrade and system preference preserves nodes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openPopupMotionFixture(page, "data-table", "full");
  const preview = page.locator('[data-preview="data-table"]');
  await expect(preview.getByRole("textbox")).toBeVisible();
  await preview.getByRole("button", { name: "Columns", exact: true }).click();
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  await menu.evaluate((el) => el.setAttribute("data-identity", "portal"));
  // DOM select change keeps the portal open; pointer focus outside would dismiss it.
  await page.getByLabel("Fixture motion", { exact: true }).evaluate((el) => {
    (el as HTMLSelectElement).value = "none";
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  // A live downgrade retires the running envelope on the same panel it was
  // written to: the portal keeps its identity and reaches the `none` pose.
  await expect(menu).toHaveAttribute("data-motion", "none");
  await expect(menu).toHaveAttribute("data-identity", "portal");
  await expect.poll(() => menu.evaluate((el) => el.getAnimations().length)).toBe(0);
  expect(
    await menu.evaluate((el) => ({
      opacity: getComputedStyle(el).opacity,
      scale: getComputedStyle(el).scale,
      transform: getComputedStyle(el).transform,
    })),
  ).toEqual({ opacity: "1", scale: "none", transform: "none" });
  await page.getByLabel("Fixture motion", { exact: true }).evaluate((el) => {
    (el as HTMLSelectElement).value = "full";
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(menu).toHaveAttribute("data-motion", "full");
  // A reopened portal under `full` enters through its own controlled envelope,
  // so the upgrade is not a replay on the already-open panel.
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);
  const entryHandles = await preview.getByRole("button", { name: "Columns", exact: true }).evaluate(async (el) => {
    let max = 0;
    (el as HTMLButtonElement).click();
    for (let i = 0; i < 40; i++) {
      await new Promise(requestAnimationFrame);
      const popup = document.querySelector('[data-slot="dropdown-menu-content"]');
      if (popup) max = Math.max(max, popup.getAnimations().length);
    }
    return max;
  });
  expect(entryHandles).toBeGreaterThan(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const reopened = page.getByRole("menu");
  await expect(reopened).toHaveAttribute("data-motion", "reduced");
  expect(await reopened.evaluate((el) => getComputedStyle(el).scale)).toBe("none");
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
