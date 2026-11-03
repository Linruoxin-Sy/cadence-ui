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

for (const mode of ["full", "reduced", "none"] as const)
  for (const os of [false, true])
    test(`Textarea examples: CSS growth, native resize and independent drafts ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
      await page.goto(`/components/textarea?motion=${mode}`);
      await page.waitForLoadState("networkidle");
      const top = page.locator('[data-preview="textarea"]');
      await expect(top.getByRole("textbox")).toHaveCount(1);
      await top.getByRole("textbox").fill("Independent comment");
      const growing = page.locator('[data-component-example="textarea/auto-growing"] textarea');
      const before = await growing.evaluate((el) => el.getBoundingClientRect().height);
      await growing.fill(Array.from({ length: 25 }, (_, i) => `Line ${i}`).join("\n"));
      expect(await growing.evaluate((el) => el.getBoundingClientRect().height)).toBeGreaterThan(before);
      expect(await growing.evaluate((el) => el.getBoundingClientRect().height)).toBeLessThanOrEqual(192);
      expect(await growing.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
      await growing.fill("Short");
      expect(await growing.evaluate((el) => el.getBoundingClientRect().height)).toBeCloseTo(before, 0);
      const resize = page.locator('[data-component-example="textarea/resizable"] textarea');
      expect(
        await resize.evaluate((el) => ({
          sizing: getComputedStyle(el).getPropertyValue("field-sizing"),
          resize: getComputedStyle(el).resize,
        })),
      ).toEqual({ sizing: "fixed", resize: "vertical" });
      await resize.scrollIntoViewIfNeeded();
      const box = await resize.boundingBox();
      expect(box).not.toBeNull();
      if (!box) throw new Error("Missing resize handle");
      await page.mouse.move(box.x + box.width - 4, box.y + box.height - 4);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width - 4, box.y + box.height + 40, { steps: 5 });
      await page.mouse.up();
      expect(await resize.evaluate((el) => el.getBoundingClientRect().height)).toBeGreaterThan(box.height + 20);
      expect(await resize.evaluate((el) => el.getBoundingClientRect().width)).toBeCloseTo(box.width, 0);
      const controlled = page.locator('[data-component-example="textarea/controlled"]');
      await expect(controlled).toHaveAttribute("data-preview-motion", effectiveMode(mode, os));
      await controlled.getByRole("button", { name: "Use review note" }).click();
      const field = controlled.getByRole("textbox");
      await expect(field).toHaveValue("Ready for review.");
      await field.fill("Two\nlines");
      await expect(field).toHaveAccessibleDescription("9 / 280 characters");
      await field.press("Home");
      const node = await field.elementHandle();
      await page
        .getByRole("group", { name: "Motion mode" })
        .getByRole("button", { name: "none", exact: true })
        .evaluate((button) => (button as HTMLButtonElement).click());
      await expect(field).toBeFocused();
      expect(await field.evaluate((el, saved) => el === saved, node)).toBe(true);
      await expect(field).toHaveValue("Two\nlines");
      await expect(top.getByRole("textbox")).toHaveValue("Independent comment");
      const invalid = page.locator('[data-component-example="textarea/invalid"] textarea');
      await expect(invalid).toHaveAttribute("aria-invalid", "true");
      await expect(invalid).toHaveAccessibleDescription("Keep it under 280 characters.");
      const states = page.locator('[data-component-example="textarea/disabled-readonly"]');
      await expect(states.getByRole("textbox", { name: "Disabled", exact: true })).toBeDisabled();
      const readonly = states.getByRole("textbox", { name: "Read-only", exact: true });
      await readonly.focus();
      await readonly.press("x");
      await expect(readonly).toBeFocused();
      await expect(readonly).toHaveValue("The release notes are ready for review.");
      for (const textarea of await page.locator('[data-component-example^="textarea/"] textarea').all())
        expect(
          await textarea.evaluate(
            (el) =>
              el
                .getAnimations()
                .filter(
                  (a) =>
                    a.effect instanceof KeyframeEffect &&
                    a.effect.getKeyframes().some((k) => "height" in k || "transform" in k || "opacity" in k),
                ).length,
          ),
        ).toBe(0);
    });

for (const mode of ["full", "reduced", "none"] as const)
  for (const os of [false, true])
    test(`Card examples: fixed sizes and immediate content measurement ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
      await page.goto(`/components/card?motion=${mode}&variant=sm`);
      await page.waitForLoadState("networkidle");
      const top = page.locator('[data-preview="card"]');
      await expect(top.locator('[data-slot="card"]')).toHaveCount(1);
      await expect(top.locator('[data-slot="card"]')).toHaveAttribute("data-size", "default");
      await expect(top.getByRole("combobox")).toHaveCount(0);
      await expect(top.getByRole("button", { name: "Toggle content" })).toHaveCount(0);
      await expect(top.getByRole("link", { name: "Open setup" })).toHaveAttribute("href", "/docs/installation");
      const sizes = page.locator('[data-component-example="card/sizes"]');
      const padding: number[] = [];
      for (const size of ["default", "sm"]) {
        const card = sizes.locator(`[data-slot="card"][data-size="${size}"]`);
        await expect(card).toBeVisible();
        padding.push(
          await card
            .locator('[data-slot="card-content"]')
            .evaluate((el) => Number.parseFloat(getComputedStyle(el).paddingLeft)),
        );
      }
      expect(padding[0]).toBeGreaterThan(padding[1] ?? 0);
      const header = page.locator('[data-component-example="card/header-action"]');
      await expect(header.locator('[data-slot="card-action"]').getByRole("link", { name: "Setup" })).toHaveAttribute(
        "href",
        "/docs/installation",
      );
      const boundaries = page.locator('[data-component-example="card/boundaries"]');
      expect(
        await boundaries.locator('[data-slot="card-header"]').evaluate((el) => getComputedStyle(el).borderBottomWidth),
      ).toBe("1px");
      expect(
        await boundaries.locator('[data-slot="card-footer"]').evaluate((el) => getComputedStyle(el).borderTopWidth),
      ).toBe("1px");
      const content = page.locator('[data-component-example="card/content-sized"]');
      await expect(content).toHaveAttribute("data-preview-motion", effectiveMode(mode, os));
      const fit = content.getByTestId("fit-card");
      const toggle = content.getByRole("button", { name: "Toggle content" });
      await expect(toggle).toHaveAttribute("data-motion", effectiveMode(mode, os));
      const fitNode = await fit.elementHandle();
      await toggle.focus();
      const before = await fit.evaluate((el) => el.getBoundingClientRect().height);
      await toggle.press("Enter");
      await expect.poll(() => fit.evaluate((el) => el.getBoundingClientRect().height)).toBeGreaterThan(before);
      await page
        .getByRole("group", { name: "Motion mode" })
        .getByRole("button", { name: "none", exact: true })
        .evaluate((button) => (button as HTMLButtonElement).click());
      await expect(toggle).toBeFocused();
      await expect(toggle).toHaveAttribute("data-motion", "none");
      await expect(fit).toContainText("The surface follows its own content immediately.");
      await page.setViewportSize({ width: 390, height: 1000 });
      await expect
        .poll(() =>
          fit.evaluate((el) =>
            Math.abs(
              el.getBoundingClientRect().height -
                (el.querySelector('[data-slot="card-flow"]')?.getBoundingClientRect().height ?? 0) -
                2,
            ),
          ),
        )
        .toBeLessThan(1);
      expect(await fit.evaluate((el, saved) => el === saved, fitNode)).toBe(true);
      expect(
        await fit.evaluate(
          (el) =>
            el
              .getAnimations()
              .filter(
                (a) =>
                  a.effect instanceof KeyframeEffect &&
                  a.effect
                    .getKeyframes()
                    .some((k) => "height" in k || "width" in k || "transform" in k || "opacity" in k),
              ).length,
        ),
      ).toBe(0);
      await toggle.press("Enter");
      await expect(fit).toContainText("Short content.");
    });
