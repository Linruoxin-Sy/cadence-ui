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
      expect(
        await page
          .locator(
            '[data-component-example^="toggle-group/"]:not([data-component-example$="/without-motion"]) [data-motion]',
          )
          .evaluateAll((nodes) => [...new Set(nodes.map((n) => n.getAttribute("data-motion")))]),
      ).toEqual([effectiveMode(mode, os === "reduce")]);
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
