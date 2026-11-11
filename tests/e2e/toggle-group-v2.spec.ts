import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const os of ["no-preference", "reduce"] as const)
  for (const mode of ["full", "reduced", "none"] as const) {
    test(`ToggleGroup changing content ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os });
      await page.goto(`/components/toggle-group?motion=${mode}&speed=0.25#changing-content`);
      const demo = page.locator('[data-component-example="toggle-group/changing-content"]');
      const group = demo.getByRole("group", { name: "Changing range", exact: true });
      const week = group.getByRole("button", { name: "Week", exact: true });
      await expect(week).toHaveAttribute("aria-pressed", "true");
      const saved = await week.elementHandle();
      await demo.getByRole("button", { name: "Change label", exact: true }).click();
      await expect(group.getByRole("button", { name: "Day overview", exact: true })).toBeVisible();
      await demo.getByRole("button", { name: "Reorder items", exact: true }).click();
      expect(await week.evaluate((node, old) => node === old, saved)).toBe(true);
      await week.focus();
      await page.keyboard.down("Space");
      await demo
        .getByRole("button", { name: "Change together", exact: true })
        .evaluate((node: HTMLButtonElement) => node.click());
      await expect(week).toBeFocused();
      const ownership = await group.evaluate(async (node) => {
        const samples = [];
        for (let i = 0; i < 5; i++) {
          await new Promise(requestAnimationFrame);
          const marker = node.querySelector<HTMLElement>(':scope > [data-slot="toggle-group-indicator"]');
          samples.push(
            marker
              ?.getAnimations()
              .filter((animation) =>
                (animation.effect as KeyframeEffect)?.getKeyframes().some((frame) => "transform" in frame),
              ).length,
          );
        }
        return samples;
      });
      expect(ownership.every((count) => count !== undefined && count <= 1)).toBe(true);
      await page.keyboard.up("Space");
      expect(await week.evaluate((node, old) => node === old, saved)).toBe(true);
      await demo.getByRole("button", { name: "Use multiple selection", exact: true }).click();
      await group.getByRole("button", { name: "Month", exact: true }).click();
      await expect(week).toHaveAttribute("aria-pressed", "true");
      await expect(group.getByRole("button", { name: "Month", exact: true })).toHaveAttribute("aria-pressed", "true");
      await expect(group.locator(':scope > [data-slot="toggle-group-indicator"]')).toBeHidden();
      await expect(group.locator('[data-slot="toggle-group-local-indicator"]')).toHaveCount(3);
      await demo.getByRole("button", { name: "Clear selection", exact: true }).click();
      await expect(group.getByRole("button", { pressed: true })).toHaveCount(0);
      await demo.getByRole("button", { name: "Use single selection", exact: true }).click();
      await expect(week).toHaveAttribute("aria-pressed", "true");
      const quantity = demo.getByRole("group", { name: "Explicit quantities", exact: true });
      await expect(
        quantity.getByRole("button", { name: "2026", exact: true }).locator('[data-slot="animated-number"]'),
      ).toHaveCount(0);
      await demo.getByRole("button", { name: "Add an item", exact: true }).click();
      await expect(quantity.getByRole("button", { pressed: true }).locator('[data-slot="animated-number"]')).toHaveText(
        "20",
      );
      const axe = await new AxeBuilder({ page })
        .include('[data-component-example="toggle-group/changing-content"]')
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(axe.violations).toEqual([]);
    });
  }
