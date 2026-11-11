import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { effectiveMode, MODES } from "./helpers";

for (const mode of MODES)
  for (const os of [false, true])
    test(`Kbd hints and real keyboard tooltip ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
      await page.goto(`/components/kbd?motion=${mode}`);
      await page.waitForLoadState("networkidle");
      const top = page.locator('[data-preview="kbd"]');
      await expect(top.locator('[data-slot="kbd"]')).toHaveCount(3);
      await expect(top.getByRole("button")).toHaveCount(0);
      const single = page.locator('[data-component-example="kbd/single"]');
      await expect(single.locator("kbd")).toHaveText("Esc");
      const combo = page.locator('[data-component-example="kbd/combination"]');
      await expect(combo.locator('[data-slot="kbd-group"] [data-slot="kbd"]')).toHaveText(["Ctrl", "Shift", "P"]);
      for (const card of [top, single, combo]) {
        await expect(card).toHaveAttribute("data-preview-motion", effectiveMode(mode, os));
        expect(await card.locator("kbd").evaluateAll((nodes) => nodes.every((node) => node.tabIndex === -1))).toBe(
          true,
        );
      }
      const trigger = page
        .locator('[data-component-example="kbd/tooltip"]')
        .getByRole("button", { name: "Save changes" });
      await trigger.focus();
      const tooltip = page.getByRole("tooltip");
      await expect(tooltip).toBeVisible();
      await expect(tooltip).toHaveAttribute("data-motion", effectiveMode(mode, os));
      await expect(tooltip.locator('[data-slot="kbd-group"] [data-slot="kbd"]')).toHaveText(["⌘", "S"]);
      expect(await trigger.getAttribute("aria-describedby")).toBe(await tooltip.getAttribute("id"));
      expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual(
        [],
      );
      await page.keyboard.press("Escape");
      await expect(tooltip).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await expect(trigger).not.toHaveAttribute("aria-describedby");
      await trigger.blur();
      await trigger.hover();
      await expect(tooltip).toBeVisible();
      await page
        .getByRole("group", { name: "Motion mode" })
        .getByRole("button", { name: "none", exact: true })
        .evaluate((button: HTMLButtonElement) => button.click());
      await expect(tooltip).toHaveAttribute("data-motion", "none");
      expect(await tooltip.evaluate((node) => node.getAnimations().length)).toBe(0);
    });
