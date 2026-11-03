import { expect, test } from "@playwright/test";
import { effectiveMode, MODES } from "./helpers";

for (const os of ["no-preference", "reduce"] as const)
  for (const mode of MODES)
    test(`Toggle examples: fixed shapes, commands and explicit form state ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os });
      await page.goto(`/components/toggle?motion=${mode}`);
      await page.waitForLoadState("networkidle");
      const top = page.locator('[data-preview="toggle"]');
      await expect(top.getByRole("button")).toHaveCount(4);
      await expect(top.getByRole("combobox")).toHaveCount(0);
      const variants = page.locator('[data-component-example="toggle/variants"]');
      await expect(variants.getByRole("button", { pressed: true })).toHaveCount(2);
      expect(
        await variants.getByRole("button").evaluateAll((nodes) => nodes.map((n) => getComputedStyle(n).borderTopWidth)),
      ).toEqual(["0px", "0px", "1px", "1px"]);
      const sizes = page.locator('[data-component-example="toggle/sizes"]');
      expect(
        await sizes.getByRole("button").evaluateAll((nodes) => nodes.map((n) => getComputedStyle(n).height)),
      ).toEqual(["32px", "36px", "40px"]);
      expect(
        await page
          .locator('[data-component-example^="toggle/"]:not([data-component-example$="/without-motion"]) [data-motion]')
          .evaluateAll((nodes) => [...new Set(nodes.map((n) => n.getAttribute("data-motion")))]),
      ).toEqual([effectiveMode(mode, os === "reduce")]);
      const controlled = page.locator('[data-component-example="toggle/controlled"]');
      const italic = controlled.getByRole("button", { name: "Italic", exact: true });
      const saved = await italic.elementHandle();
      await italic.press("Enter");
      await expect(italic).toHaveAttribute("aria-pressed", "true");
      await expect(controlled.getByRole("status")).toHaveText("Italic enabled");
      await expect(top.getByRole("button", { name: "Italic", exact: true })).toHaveAttribute("aria-pressed", "false");
      await page
        .getByRole("group", { name: "Motion mode" })
        .getByRole("button", { name: "none", exact: true })
        .evaluate((n: HTMLButtonElement) => n.click());
      await expect(italic).toBeFocused();
      expect(await italic.evaluate((n, saved) => n === saved, saved)).toBe(true);
      await italic.press(" ");
      await expect(italic).toHaveAttribute("aria-pressed", "false");
      await italic.click();
      await controlled.getByRole("button", { name: "Clear italic" }).click();
      await expect(italic).toHaveAttribute("aria-pressed", "false");
      const disabled = page.locator('[data-component-example="toggle/disabled"]');
      for (const button of await disabled.getByRole("button").all()) await expect(button).toBeDisabled();
      await expect(disabled.getByRole("button", { name: "Unavailable on" })).toHaveAttribute("aria-pressed", "true");
      const form = page.locator('[data-component-example="toggle/form-submission"]');
      await form.getByRole("button", { name: "Save formatting" }).click();
      await expect(form.getByRole("status")).toHaveText("Submitted bold: absent");
      await form.getByRole("button", { name: "Bold", exact: true }).click();
      await form.getByRole("button", { name: "Save formatting" }).click();
      await expect(form.getByRole("status")).toHaveText("Submitted bold: enabled");
      await form.getByRole("button", { name: "Bold", exact: true }).press(" ");
      await form.getByRole("button", { name: "Save formatting" }).click();
      await expect(form.getByRole("status")).toHaveText("Submitted bold: absent");
    });
