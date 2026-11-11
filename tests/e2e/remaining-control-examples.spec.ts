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

for (const os of ["no-preference", "reduce"] as const)
  for (const mode of MODES)
    test(`Toggle Group examples: fixed axes, roving focus and caller arrays ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os });
      await page.goto(`/components/toggle-group?motion=${mode}`);
      await page.waitForLoadState("networkidle");
      const top = page.locator('[data-preview="toggle-group"]');
      await expect(top.getByRole("group")).toHaveCount(1);
      await expect(top.getByRole("combobox")).toHaveCount(0);
      await expect
        .poll(
          async () =>
            await page
              .locator(
                '[data-component-example^="toggle-group/"]:not([data-component-example$="/without-motion"]) [data-motion]',
              )
              .evaluateAll((nodes) => [...new Set(nodes.map((n) => n.getAttribute("data-motion")))]),
        )
        .toEqual([effectiveMode(mode, os === "reduce")]);
      await top.getByRole("button", { name: "Align left", exact: true }).focus();
      await page.keyboard.press("ArrowLeft");
      await expect(top.getByRole("button", { name: "Align right", exact: true })).toBeFocused();
      const sizes = page.locator('[data-component-example="toggle-group/sizes"]');
      for (const [size, height] of [
        ["sm", 32],
        ["default", 36],
        ["lg", 40],
      ] as const) {
        const group = sizes.getByRole("group", { name: `${size} size`, exact: true });
        expect(
          await group.getByRole("button").evaluateAll((nodes) => nodes.map((n) => getComputedStyle(n).height)),
        ).toEqual([`${height}px`, `${height}px`]);
      }
      const spacing = page.locator('[data-component-example="toggle-group/spacing"]');
      expect(
        await spacing.getByRole("group").evaluateAll((nodes) => nodes.map((n) => getComputedStyle(n).gap)),
      ).toEqual(["0px", "4px"]);
      const vertical = page.locator('[data-component-example="toggle-group/vertical"]').getByRole("group");
      const buttons = vertical.getByRole("button");
      const boxes = await buttons.evaluateAll((nodes) =>
        nodes.map((n) => ({ x: n.getBoundingClientRect().x, y: n.getBoundingClientRect().y })),
      );
      if (!boxes[0] || !boxes[1]) throw Error("Missing vertical items");
      expect(boxes[1].y).toBeGreaterThan(boxes[0].y);
      expect(boxes[1].x).toBe(boxes[0].x);
      await buttons.first().focus();
      await buttons.first().press("ArrowDown");
      await expect(buttons.nth(1)).toBeFocused();
      await expect(buttons.first()).toHaveAttribute("aria-pressed", "true");
      await buttons.nth(1).press(" ");
      await expect(buttons.nth(1)).toHaveAttribute("aria-pressed", "true");
      const disabled = page.locator('[data-component-example="toggle-group/disabled"]');
      const partial = disabled.getByRole("group", { name: "Disabled item", exact: true });
      await partial.getByRole("button", { name: "Day", exact: true }).focus();
      await page.keyboard.press("ArrowRight");
      await expect(partial.getByRole("button", { name: "Month", exact: true })).toBeFocused();
      await page.keyboard.press("ArrowRight");
      await expect(partial.getByRole("button", { name: "Month", exact: true })).toBeFocused();
      for (const b of await disabled
        .getByRole("group", { name: "Disabled group", exact: true })
        .getByRole("button")
        .all())
        await expect(b).toBeDisabled();
      const required = page.locator('[data-component-example="toggle-group/segmented"]');
      await required.getByRole("button", { name: "Week", exact: true }).click();
      await expect(required.getByRole("button", { name: "Week", exact: true })).toHaveAttribute("aria-pressed", "true");
      const controlled = page.locator('[data-component-example="toggle-group/controlled"]');
      const right = controlled.getByRole("button", { name: "Right", exact: true });
      const saved = await right.elementHandle();
      await right.press("Enter");
      await expect(controlled.getByRole("status")).toHaveText("Selection: right");
      await page
        .getByRole("group", { name: "Motion mode" })
        .getByRole("button", { name: "none", exact: true })
        .evaluate((n: HTMLButtonElement) => n.click());
      await expect(right).toBeFocused();
      expect(await right.evaluate((n, saved) => n === saved, saved)).toBe(true);
      await right.press(" ");
      await expect(controlled.getByRole("status")).toHaveText("Selection: none");
      await controlled.getByRole("button", { name: "Align left externally" }).click();
      await expect(controlled.getByRole("status")).toHaveText("Selection: left");
      await expect(top.getByRole("button", { name: "Align left", exact: true })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });

for (const os of ["no-preference", "reduce"] as const)
  for (const mode of MODES)
    test(`Input OTP examples: independent drafts, completion, paste and locked fields ${mode}/${os}`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: os });
      await page.goto(`/components/input-otp?motion=${mode}`);
      await page.waitForLoadState("networkidle");
      const top = page.locator('[data-preview="input-otp"]');
      await expect(top.getByRole("textbox")).toHaveCount(1);
      await expect(top.getByRole("combobox")).toHaveCount(0);
      await expect(top.locator('[data-slot="input-otp-slot"]')).toHaveCount(6);
      await expect(top.locator('[data-slot="input-otp-separator"]')).toHaveCount(1);
      expect(
        await page
          .locator(
            '[data-component-example^="input-otp/"]:not([data-component-example$="/without-motion"]) [data-motion]',
          )
          .evaluateAll((nodes) => [...new Set(nodes.map((n) => n.getAttribute("data-motion")))]),
      ).toEqual([effectiveMode(mode, os === "reduce")]);
      const controlled = page.locator('[data-component-example="input-otp/controlled"]');
      const input = controlled.getByRole("textbox", { name: "Login code", exact: true });
      await input.fill("012345");
      await expect(controlled.getByRole("status")).toHaveText("Completed: 012345");
      await expect(top.getByRole("textbox")).toHaveValue("");
      const saved = await input.elementHandle();
      const chars = await controlled.locator('[data-slot="input-otp-slot"] > span').elementHandles();
      await input.focus();
      await input.evaluate((n: HTMLInputElement) => n.setSelectionRange(1, 3));
      await page
        .getByRole("group", { name: "Motion mode" })
        .getByRole("button", { name: "none", exact: true })
        .evaluate((n: HTMLButtonElement) => n.click());
      await expect(input).toBeFocused();
      await expect(input).toHaveValue("012345");
      expect(await input.evaluate((n: HTMLInputElement) => [n.selectionStart, n.selectionEnd])).toEqual([1, 3]);
      expect(await input.evaluate((n, saved) => n === saved, saved)).toBe(true);
      expect(
        await controlled
          .locator('[data-slot="input-otp-slot"] > span')
          .first()
          .evaluate((n, saved) => n === saved, chars[0]),
      ).toBe(true);
      await input.press("9");
      await expect(input).toHaveValue("09345");
      await controlled.getByRole("button", { name: "Clear login code" }).click();
      await expect(input).toHaveValue("");
      await expect(controlled.getByRole("status")).toHaveText("Not completed");
      const invalid = page.locator('[data-component-example="input-otp/invalid"]');
      const expired = invalid.getByRole("textbox", { name: "Expired code" });
      await expect(expired).toHaveAttribute("aria-invalid", "true");
      await expect(expired).toHaveAccessibleDescription("This code has expired. Request another code.");
      await expired.fill("1111");
      await expect(expired).toHaveAttribute("aria-invalid", "true");
      await expect(invalid.locator('[data-slot="input-otp-slot"][aria-invalid="true"]')).toHaveCount(4);
      const disabled = page.locator('[data-component-example="input-otp/disabled"]');
      await expect(disabled.getByRole("textbox", { name: "Unavailable code" })).toBeDisabled();
      const readOnly = disabled.getByRole("textbox", { name: "Read-only code" });
      await readOnly.focus();
      await readOnly.press("7");
      await expect(readOnly).toHaveValue("5678");
      const short = page.locator('[data-component-example="input-otp/without-separator"]');
      await expect(short.locator('[data-slot="input-otp-separator"]')).toHaveCount(0);
      await short.getByRole("textbox").fill("0012");
      await expect(short.getByRole("textbox")).toHaveValue("0012");
      await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
      await page.evaluate(() => navigator.clipboard.writeText("123-456"));
      const paste = page.locator('[data-component-example="input-otp/paste"]').getByRole("textbox");
      await paste.focus();
      await paste.press("ControlOrMeta+V");
      await expect(paste).toHaveValue("123456");
      await paste.press("ControlOrMeta+A");
      await paste.press("Backspace");
      await paste.pressSequentially("a7");
      await expect(paste).toHaveValue("7");
      const ids = await page.locator("[id]").evaluateAll((nodes) => nodes.map((n) => n.id));
      expect(new Set(ids).size).toBe(ids.length);
    });

for (const os of ["no-preference", "reduce"] as const)
  for (const mode of MODES)
    test(`Progress examples: labelled fractions, caller values and independent tracks ${mode}/${os}`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: os });
      await page.goto(`/components/progress?motion=${mode}`);
      await page.waitForLoadState("networkidle");
      const top = page.locator('[data-preview="progress"]');
      await expect(top.getByRole("slider")).toHaveCount(0);
      await expect(top.getByRole("combobox")).toHaveCount(0);
      await expect(top.getByRole("progressbar")).toHaveCount(3);
      expect(
        await page
          .locator(
            '[data-component-example^="progress/"]:not([data-component-example$="/without-motion"]) [data-motion]',
          )
          .evaluateAll((nodes) => [...new Set(nodes.map((n) => n.getAttribute("data-motion")))]),
      ).toEqual([effectiveMode(mode, os === "reduce")]);
      const label = page.locator('[data-component-example="progress/labelled"]');
      await expect(label.getByRole("progressbar")).toHaveAccessibleName("Uploading assets");
      await expect(label.locator('[data-slot="progress-value"]')).toHaveText("62%");
      const complete = page.locator('[data-component-example="progress/complete"]');
      await expect(complete.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
      await expect(complete.getByRole("status")).toHaveText("All files uploaded.");
      const custom = page.locator('[data-component-example="progress/range"]').getByRole("progressbar");
      await expect(custom).toHaveAttribute("aria-valuenow", "3");
      await expect(custom).toHaveAttribute("aria-valuemax", "5");
      await expect(custom).toHaveAttribute("aria-valuetext", "Step 3 of 5");
      await expect(custom.locator('[data-slot="progress-value"]')).toHaveText("60%");
      const composed = page.locator('[data-component-example="progress/composed"]');
      await expect(composed.locator('[data-slot="progress-track"]')).toHaveCount(2);
      expect(
        await composed
          .locator('[data-slot="progress-track"]')
          .evaluateAll((nodes) => nodes.map((n) => getComputedStyle(n).height)),
      ).toEqual(["6px", "8px"]);
      expect(
        await composed
          .locator('[data-slot="progress-indicator"]')
          .evaluateAll((nodes) => nodes.map((n) => new DOMMatrixReadOnly(getComputedStyle(n).transform).a)),
      ).toEqual([0.72, 0.72]);
      const pending = page.locator('[data-component-example="progress/indeterminate"]').getByRole("progressbar");
      await expect(pending).not.toHaveAttribute("aria-valuenow");
      const caller = page.locator('[data-component-example="progress/caller-progress"]');
      const range = caller.getByRole("slider", { name: "Upload progress", exact: true });
      const indicator = caller.locator('[data-slot="progress-indicator"]');
      const saved = await indicator.elementHandle();
      await range.fill("20");
      await range.focus();
      await expect(caller.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "20");
      await page
        .getByRole("group", { name: "Motion mode" })
        .getByRole("button", { name: "none", exact: true })
        .evaluate((n: HTMLButtonElement) => n.click());
      await expect(range).toBeFocused();
      expect(await indicator.evaluate((n, saved) => n === saved, saved)).toBe(true);
      expect(await indicator.evaluate((n) => new DOMMatrixReadOnly(getComputedStyle(n).transform).a)).toBeCloseTo(
        0.2,
        3,
      );
      await range.press("ArrowRight");
      await expect(caller.getByRole("status")).toHaveText("Uploaded 21%");
      await caller.getByRole("button", { name: "Complete upload" }).click();
      await expect(caller.getByRole("status")).toHaveText("Upload complete");
      await expect(caller.locator('[data-slot="progress-value"]')).toHaveText("100%");
      await expect(top.getByRole("progressbar", { name: "Uploading assets", exact: true })).toHaveAttribute(
        "aria-valuenow",
        "62",
      );
      await expect(caller.getByRole("progressbar")).not.toHaveAttribute("tabindex");
    });
