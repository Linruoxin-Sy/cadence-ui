import { expect, test } from "@playwright/test";
import { effectiveMode, MODES } from "./helpers";

declare global {
  interface Window {
    stableKbd: Element | null;
    stableKbdText: ChildNode | null | undefined;
  }
}

for (const mode of MODES)
  for (const os of [false, true])
    test(`Kbd changing shortcuts preserve identities ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
      await page.goto(`/components/kbd?motion=${mode}&speed=0.25#changing-shortcuts`);
      await page.waitForLoadState("networkidle");
      const demo = page.locator('[data-component-example="kbd/changing"]');
      const chord = demo.locator('[data-slot="kbd-group"]').first();
      await expect(chord).toHaveAttribute("data-motion", effectiveMode(mode, os));
      await chord.evaluate((node) => {
        window.stableKbd = node.querySelector('[data-slot="kbd"]');
        window.stableKbdText = node.querySelector('[data-slot="kbd-text"]')?.firstChild;
      });
      await demo.getByRole("button", { name: "Change platform labels" }).click();
      await expect(chord.locator('[data-slot="kbd"]')).toHaveText(["Control", "Shift", "10"]);
      expect(
        await chord.evaluate(
          (node) =>
            window.stableKbd === node.querySelector('[data-slot="kbd"]') &&
            window.stableKbdText === node.querySelector('[data-slot="kbd-text"]')?.firstChild,
        ),
      ).toBe(true);
      await demo.getByRole("button", { name: "Toggle modifier" }).click();
      await expect(chord.locator('[data-slot="kbd"]')).toHaveText(["Control", "Shift", "10", "Fn"]);
      await demo.getByRole("button", { name: "Toggle modifier" }).click();
      await expect(chord.locator('[data-slot="kbd"]')).toHaveText(["Control", "Shift", "10"]);
      const trigger = demo.getByRole("button", { name: "Inspect changing shortcut" });
      await trigger.focus();
      await page.keyboard.press("Tab");
      await page.keyboard.press("Shift+Tab");
      await expect(page.getByRole("tooltip")).toBeVisible();
      await demo
        .getByRole("button", { name: "Change platform labels" })
        .evaluate((button: HTMLButtonElement) => button.click());
      await expect(page.getByRole("tooltip").locator('[data-slot="kbd"]')).toHaveText(["Ctrl", "Alt"]);
      await page
        .getByRole("group", { name: "Motion mode" })
        .getByRole("button", { name: "none", exact: true })
        .evaluate((button: HTMLButtonElement) => button.click());
      await expect(chord).toHaveAttribute("data-motion", "none");
      expect(await chord.evaluate((node) => node.getAnimations({ subtree: true }).length)).toBe(0);
      await page.keyboard.press("Escape");
      await expect(page.getByRole("tooltip")).toHaveCount(0);
      await expect(trigger).toBeFocused();
    });
