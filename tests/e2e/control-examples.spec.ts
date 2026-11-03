import { expect, test } from "@playwright/test";
import { effectiveMode, MODES } from "./helpers";

for (const os of ["no-preference", "reduce"] as const)
  for (const mode of MODES)
    test(`Checkbox examples: independent states, native fields and caller updates ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os });
      await page.goto(`/components/checkbox?motion=${mode}`);
      await page.waitForLoadState("networkidle");
      const top = page.locator('[data-preview="checkbox"]');
      await expect(top.getByRole("combobox")).toHaveCount(0);
      await expect(top.getByRole("checkbox")).toHaveCount(5);
      await expect(top.getByRole("checkbox", { name: "Indeterminate", exact: true })).toHaveAttribute(
        "aria-checked",
        "mixed",
      );
      await expect(top.getByRole("checkbox", { name: "Disabled", exact: true })).toBeDisabled();
      await expect(top.getByRole("checkbox", { name: "Unchecked", exact: true })).toHaveAttribute(
        "data-motion",
        effectiveMode(mode, os === "reduce"),
      );
      const controlled = page.locator('[data-component-example="checkbox/controlled"]');
      const box = controlled.getByRole("checkbox");
      const saved = await box.elementHandle();
      await controlled.locator("label").click();
      await expect(box).toBeChecked();
      await expect(controlled.getByRole("status")).toHaveText("Terms accepted");
      await expect(top.getByRole("checkbox", { name: "Unchecked", exact: true })).not.toBeChecked();
      await box.focus();
      await page
        .getByRole("group", { name: "Motion mode" })
        .getByRole("button", { name: "none", exact: true })
        .evaluate((button: HTMLButtonElement) => button.click());
      await expect(box).toBeFocused();
      await expect(box).toBeChecked();
      expect(await box.evaluate((node, saved) => node === saved, saved)).toBe(true);
      await box.press(" ");
      await expect(box).not.toBeChecked();
      await box.press(" ");
      await controlled.getByRole("button", { name: "Reset acceptance" }).click();
      await expect(box).not.toBeChecked();
      const states = page.locator('[data-component-example="checkbox/states"]');
      await expect(states.getByRole("checkbox").first()).toBeChecked();
      const mixed = states.getByRole("checkbox").last();
      await expect(mixed).toHaveAttribute("aria-checked", "mixed");
      expect(
        await states
          .locator('input[type="checkbox"]')
          .last()
          .evaluate((node: HTMLInputElement) => node.indeterminate),
      ).toBe(true);
      const invalid = page.locator('[data-component-example="checkbox/invalid"]');
      const invalidBox = invalid.getByRole("checkbox");
      await expect(invalidBox).toHaveAttribute("aria-invalid", "true");
      await expect(invalidBox).toHaveAccessibleDescription("You must accept the terms to continue.");
      await invalidBox.click();
      await expect(invalidBox).toHaveAttribute("aria-invalid", "true");
      const disabled = page.locator('[data-component-example="checkbox/disabled"]');
      for (const node of await disabled.getByRole("checkbox").all()) {
        if (await node.isDisabled()) continue;
        await node.focus();
        await node.press(" ");
        await expect(node).toBeFocused();
        await expect(node).toBeChecked();
      }
      await expect(disabled.getByRole("checkbox").nth(0)).not.toBeChecked();
      await expect(disabled.getByRole("checkbox").nth(1)).toBeChecked();
      await expect(disabled.locator("label").first()).toHaveCSS("opacity", "0.5");
      const settings = page.locator('[data-component-example="checkbox/settings"]');
      await expect(settings.getByRole("checkbox")).toHaveAccessibleDescription("Every Monday, 09:00.");
      const form = page.locator('[data-component-example="checkbox/form-submission"]');
      const native = form.locator('input[type="checkbox"]');
      await form.getByRole("button", { name: "Submit consent" }).click();
      expect(await native.evaluate((node: HTMLInputElement) => node.validity.valueMissing)).toBe(true);
      await expect(form.getByRole("status")).toHaveText("Not submitted");
      await form.locator("label").click();
      await form.getByRole("button", { name: "Submit consent" }).click();
      await expect(form.getByRole("status")).toHaveText("Submitted consent: accepted");
      const ids = await page
        .locator('[data-component-example] [id], [data-preview="checkbox"] [id]')
        .evaluateAll((nodes) => nodes.map((node) => node.id));
      expect(new Set(ids).size).toBe(ids.length);
    });
