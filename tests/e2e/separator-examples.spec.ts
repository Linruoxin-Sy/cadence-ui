import { expect, test } from "@playwright/test";
import { effectiveMode, MODES } from "./helpers";

for (const mode of MODES)
  for (const os of [false, true])
    test(`Separator fixed orientation, geometry and semantics ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
      await page.goto(`/components/separator?motion=${mode}&variant=vertical`);
      await page.waitForLoadState("networkidle");
      const top = page.locator('[data-preview="separator"]');
      await expect(top.getByRole("combobox")).toHaveCount(0);
      await expect(top.getByRole("separator")).toHaveCount(2);
      for (const orientation of ["horizontal", "vertical"]) {
        const card = page.locator(`[data-component-example="separator/${orientation}"]`);
        for (const scope of [top, card]) {
          await expect(scope).toHaveAttribute("data-preview-motion", effectiveMode(mode, os));
          const rule = scope.getByRole("separator").and(scope.locator(`[data-orientation="${orientation}"]`));
          await expect(rule).toHaveAttribute("aria-orientation", orientation);
          const box = await rule.boundingBox();
          expect(box).not.toBeNull();
          if (orientation === "horizontal") {
            expect(box?.height).toBe(1);
            expect(box?.width).toBeGreaterThan(100);
          } else {
            expect(box?.width).toBe(1);
            expect(box?.height).toBe(24);
          }
          expect(
            await rule.evaluate((node) => ({ tabIndex: node.tabIndex, animations: node.getAnimations().length })),
          ).toEqual({ tabIndex: -1, animations: 0 });
        }
      }
      const decorative = page.locator('[data-component-example="separator/decorative"]');
      await expect(decorative.getByRole("separator")).toHaveCount(0);
      await expect(decorative.locator('[data-slot="separator"]')).toHaveAttribute("role", "none");
      await expect(decorative.locator('[data-slot="separator"]')).toHaveAttribute("aria-hidden", "true");
    });

for (const mode of MODES)
  for (const os of [false, true])
    test(`Separator owned revisions, retained reversal and live cancellation ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
      await page.goto(`/components/separator?motion=${mode}&speed=0.25`);
      await page.waitForLoadState("networkidle");
      const demo = page.locator('[data-component-example="separator/changing"]');
      await demo.scrollIntoViewIfNeeded();
      const rule = demo.locator('[data-slot="separator"]');
      const host = await rule.elementHandle();
      await expect(rule).toHaveAttribute("data-motion", effectiveMode(mode, os));
      await demo.getByRole("button", { name: "Change length" }).click();
      const sizes = await rule.evaluate(async (node) => {
        const result = [];
        for (let i = 0; i < 12; i++) {
          await new Promise(requestAnimationFrame);
          result.push(node.getBoundingClientRect().width);
        }
        return result;
      });
      if (mode === "full" && !os) expect(sizes.some((size) => size > 80 && size < 160)).toBe(true);
      else expect(sizes.every((size) => size === 160)).toBe(true);
      await demo.getByRole("button", { name: "Change orientation" }).click();
      await expect(rule).toHaveAttribute("aria-orientation", "vertical");
      expect(await rule.evaluate((node, before) => node === before, host)).toBe(true);
      expect((await rule.boundingBox())?.width).toBe(1);
      await demo.getByRole("button", { name: "Toggle rule" }).click();
      if (effectiveMode(mode, os) !== "none") {
        await expect(rule).toHaveAttribute("aria-hidden", "true");
        await expect(rule).toHaveAttribute("inert");
        await demo.getByRole("button", { name: "Toggle rule" }).click();
        expect(await rule.evaluate((node, before) => node === before, host)).toBe(true);
      } else await demo.getByRole("button", { name: "Toggle rule" }).click();
      await demo.getByRole("button", { name: "Change colour" }).click();
      await page
        .getByRole("group", { name: "Motion mode" })
        .getByRole("button", { name: "none", exact: true })
        .evaluate((node: HTMLButtonElement) => node.click());
      await expect(rule).toHaveAttribute("data-motion", "none");
      expect(await rule.evaluate((node) => node.getAnimations().filter((a) => a.playState === "running").length)).toBe(
        0,
      );
      await demo.getByRole("button", { name: "Toggle rule" }).click();
      await expect(rule).toHaveCount(0);
    });

test("Separator SSR stays visible without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(`${baseURL}/components/separator`);
    const top = page.locator('[data-preview="separator"]');
    await expect(top.getByRole("separator")).toHaveCount(2);
    for (const rule of await top.getByRole("separator").all()) await expect(rule).toBeVisible();
  } finally {
    await context.close();
  }
});
