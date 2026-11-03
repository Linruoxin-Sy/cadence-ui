import { expect, test } from "@playwright/test";
import { effectiveMode } from "./helpers";

for (const mode of ["full", "reduced", "none"] as const)
  for (const os of [false, true])
    test(`Input examples: native states and caller-owned value ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
      await page.goto(`/components/input?motion=${mode}`);
      await page.waitForLoadState("networkidle");
      const top = page.locator('[data-preview="input"]');
      await expect(top.locator("input")).toHaveCount(4);
      await expect(top.locator('input[type="file"]')).toHaveCount(0);
      await top.getByRole("textbox", { name: "Workspace", exact: true }).fill("Independent draft");
      const controlled = page.locator('[data-component-example="input/controlled"]');
      const field = controlled.getByRole("textbox");
      await controlled.getByRole("button", { name: "Use workspace name" }).click();
      await expect(field).toHaveValue("Cadence UI");
      await field.fill("Typed draft");
      await expect(controlled.getByRole("status")).toHaveText("Value: Typed draft");
      await field.press("Home");
      await field.press("Shift+ArrowRight");
      const node = await field.elementHandle();
      await page
        .getByRole("group", { name: "Motion mode" })
        .getByRole("button", { name: "none", exact: true })
        .evaluate((button) => (button as HTMLButtonElement).click());
      await expect(field).toBeFocused();
      await expect(field).toHaveValue("Typed draft");
      expect(
        await field.evaluate(
          (el, saved) => ({
            same: el === saved,
            start: (el as HTMLInputElement).selectionStart,
            end: (el as HTMLInputElement).selectionEnd,
          }),
          node,
        ),
      ).toEqual({ same: true, start: 0, end: 1 });
      await expect(top.getByRole("textbox", { name: "Workspace", exact: true })).toHaveValue("Independent draft");
      const invalid = page.locator('[data-component-example="input/invalid"] input');
      await expect(invalid).toHaveAttribute("aria-invalid", "true");
      await expect(invalid).toHaveAccessibleDescription("Enter a complete email address.");
      await invalid.fill("edited@example.com");
      await expect(invalid).toHaveAttribute("aria-invalid", "true");
      const states = page.locator('[data-component-example="input/disabled-readonly"]');
      await expect(states.getByRole("textbox", { name: "Disabled", exact: true })).toBeDisabled();
      const readonly = states.getByRole("textbox", { name: "Read-only", exact: true });
      await readonly.focus();
      await readonly.press("x");
      await expect(readonly).toBeFocused();
      await expect(readonly).toHaveValue("cadence-ui");
      await expect(states.getByRole("textbox", { name: "Filled", exact: true })).toBeEditable();
      const file = page.locator('[data-component-example="input/file"]').getByLabel("Image", { exact: true });
      await file.setInputFiles({ name: "proof.png", mimeType: "image/png", buffer: Buffer.from("file") });
      expect(await file.evaluate((el) => (el as HTMLInputElement).files?.[0]?.name)).toBe("proof.png");
      await expect(top).toHaveAttribute("data-preview-motion", "none");
      for (const input of await page.locator('[data-component-example^="input/"] input').all())
        expect(
          await input.evaluate(
            (el) =>
              el
                .getAnimations()
                .filter(
                  (a) =>
                    a.effect instanceof KeyframeEffect &&
                    a.effect.getKeyframes().some((k) => "transform" in k || "opacity" in k),
                ).length,
          ),
        ).toBe(0);
      // Check the originally requested resolved mode on an ordinary composition before any local override.
      await page.getByRole("group", { name: "Motion mode" }).getByRole("button", { name: mode, exact: true }).click();
      await expect(controlled).toHaveAttribute("data-preview-motion", effectiveMode(mode, os));
    });
