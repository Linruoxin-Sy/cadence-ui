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

for (const os of ["no-preference", "reduce"] as const)
  for (const mode of MODES)
    test(`Radio Group examples: roving focus, disabled choices and native forms ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os });
      await page.goto(`/components/radio-group?motion=${mode}`);
      await page.waitForLoadState("networkidle");
      const top = page.locator('[data-preview="radio-group"]');
      await expect(top.getByRole("combobox")).toHaveCount(0);
      await expect(top.getByRole("radio")).toHaveCount(3);
      await expect(top.getByRole("radio", { name: "Team", exact: true })).toBeChecked();
      await expect(top.getByRole("radio").first()).toHaveAttribute("data-motion", effectiveMode(mode, os === "reduce"));
      const controlled = page.locator('[data-component-example="radio-group/controlled"]');
      const scale = controlled.getByRole("radio", { name: "Scale", exact: true });
      const saved = await scale.elementHandle();
      await controlled.locator("label").last().click();
      await expect(scale).toBeChecked();
      await expect(controlled.getByRole("status")).toHaveText("Selected plan: scale");
      await scale.focus();
      await page
        .getByRole("group", { name: "Motion mode" })
        .getByRole("button", { name: "none", exact: true })
        .evaluate((button: HTMLButtonElement) => button.click());
      await expect(scale).toBeFocused();
      await expect(scale).toBeChecked();
      expect(await scale.evaluate((node, saved) => node === saved, saved)).toBe(true);
      await controlled.getByRole("button", { name: "Choose Team" }).click();
      await expect(controlled.getByRole("radio", { name: "Team", exact: true })).toBeChecked();
      await expect(top.getByRole("radio", { name: "Team", exact: true })).toBeChecked();
      const available = page.locator('[data-component-example="radio-group/disabled"]');
      const starter = available.getByRole("radio", { name: "Starter", exact: true });
      const last = available.getByRole("radio", { name: "Scale", exact: true });
      const disabled = available.getByRole("radio", { name: "Enterprise (unavailable)", exact: true });
      await expect(disabled).toBeDisabled();
      await starter.focus();
      await starter.press("ArrowDown");
      await expect(last).toBeFocused();
      await expect(last).toBeChecked();
      await last.press("ArrowUp");
      await expect(starter).toBeFocused();
      await expect(starter).toBeChecked();
      await starter.press("ArrowLeft");
      await expect(last).toBeFocused();
      await last.press("ArrowRight");
      await expect(starter).toBeFocused();
      expect(
        await available
          .getByRole("radio")
          .evaluateAll((nodes) => nodes.filter((node) => (node as HTMLElement).tabIndex === 0).length),
      ).toBe(1);
      const invalid = page.locator('[data-component-example="radio-group/invalid"]');
      await expect(invalid.getByRole("radiogroup")).toHaveAccessibleDescription("Choose a plan to continue.");
      await expect(invalid.getByRole("radiogroup")).toHaveAttribute("aria-invalid", "true");
      for (const radio of await invalid.getByRole("radio").all())
        await expect(radio).toHaveAttribute("aria-invalid", "true");
      await invalid.locator("label").first().click();
      await expect(invalid.getByRole("radiogroup")).toHaveAttribute("aria-invalid", "true");
      const locked = page.locator('[data-component-example="radio-group/locked"]');
      for (const radio of await locked
        .getByRole("radiogroup", { name: "Disabled plan", exact: true })
        .getByRole("radio")
        .all())
        await expect(radio).toBeDisabled();
      const readOnly = locked.getByRole("radiogroup", { name: "Read-only plan", exact: true });
      const readOnlyTeam = readOnly.getByRole("radio").first();
      await readOnlyTeam.focus();
      await readOnlyTeam.press(" ");
      await readOnly.getByRole("radio").last().click();
      await expect(readOnlyTeam).toBeChecked();
      const horizontal = page.locator('[data-component-example="radio-group/horizontal"]');
      const rects = await horizontal
        .getByRole("radio")
        .evaluateAll((nodes) =>
          nodes.map((node) => ({ x: node.getBoundingClientRect().x, y: node.getBoundingClientRect().y })),
        );
      expect(rects[0]?.y).toBe(rects[1]?.y);
      expect(rects[1]?.x).toBeGreaterThan(rects[0]?.x ?? 0);
      const form = page.locator('[data-component-example="radio-group/form-submission"]');
      await form.getByRole("button", { name: "Submit shipping" }).click();
      await expect(form.getByRole("status")).toHaveText("Not submitted");
      expect(
        await form
          .locator("input")
          .evaluateAll((nodes) => nodes.some((node) => (node as HTMLInputElement).validity.valueMissing)),
      ).toBe(true);
      await form.locator("label").last().click();
      await form.getByRole("button", { name: "Submit shipping" }).click();
      await expect(form.getByRole("status")).toHaveText("Shipping: express");
      const ids = await page
        .locator('[data-component-example] [id], [data-preview="radio-group"] [id]')
        .evaluateAll((nodes) => nodes.map((node) => node.id));
      expect(new Set(ids).size).toBe(ids.length);
    });
