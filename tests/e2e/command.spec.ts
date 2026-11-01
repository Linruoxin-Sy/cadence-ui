import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { computed, effectiveMode, MODES, openComponent, recordedScale, recordScale, scoped } from "./helpers";

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test.describe(`command ${reducedMotion}`, () => {
    test.use({ reducedMotion });
    for (const requested of MODES) {
      test(`popup motion ${requested}`, async ({ page }) => {
        const mode = effectiveMode(requested, reducedMotion === "reduce");
        await recordScale(page, '[data-slot="dialog-content"]');
        await openComponent(page, "command", requested, "command", mode);
        const trigger = page.getByRole("button", { name: "Open command palette" });
        await trigger.click();
        const popup = page.getByRole("dialog", { name: "Command Palette" });
        await expect(popup).toBeVisible();
        await expect(popup.getByRole("combobox")).toBeFocused();
        await expect(popup).toHaveAttribute("data-motion", mode);
        await expect.poll(() => computed(page, '[data-slot="dialog-content"]', "opacity")).toBe("1");
        expect(await computed(page, '[data-slot="dialog-content"]', "transition-duration")).toBe(
          { full: "0.22s", reduced: "0.132s", none: "0s" }[mode],
        );
        expect(await computed(page, '[data-slot="dialog-overlay"]', "transition-duration")).toBe(
          { full: "0.16s", reduced: "0.096s", none: "0s" }[mode],
        );
        const samples = await recordedScale(page);
        if (mode === "full") expect(samples.min).toBeLessThan(0.99);
        else expect(samples.min).toBe(1);
        await popup.getByRole("combobox").fill("zzzzzz");
        await expect(popup.getByText("No actions found.")).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(popup).not.toBeVisible();
        await expect(trigger).toBeFocused();
      });
    }
  });
}
for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`command ${colorScheme}`, () => {
    test.use({ colorScheme });
    test("keyboard path, axe and screenshots", async ({ page }, testInfo) => {
      await openComponent(page, "command", "none", "command");
      const preview = page.locator('[data-preview="command"]');
      await preview.screenshot({ path: testInfo.outputPath(`command-${colorScheme}-inline.png`) });
      expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual(
        [],
      );
      await page.getByRole("button", { name: "Open command palette" }).click();
      const popup = page.getByRole("dialog");
      await expect(popup.getByRole("combobox")).toBeFocused();
      expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual(
        [],
      );
      await popup.screenshot({ path: testInfo.outputPath(`command-${colorScheme}-dialog.png`) });
      await page.keyboard.press("Home");
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Enter");
      await expect(popup).not.toBeVisible();
      await expect(page.locator(scoped("command", '[role="status"]'))).toHaveText("settings");
    });
  });
}
