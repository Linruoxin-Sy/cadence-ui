import { expect, test } from "@playwright/test";
import { effectiveMode, MODES, pressScale } from "./helpers";

for (const os of ["no-preference", "reduce"] as const)
  for (const mode of MODES)
    test(`Item examples: fixed variants, density, media and real links ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os });
      await page.goto(`/components/item?motion=${mode}&variant=muted`);
      await page.waitForLoadState("networkidle");
      const top = page.locator('[data-preview="item"]');
      await expect(top.getByRole("combobox")).toHaveCount(0);
      await expect(top.locator('[data-slot="item"]')).toHaveCount(2);
      const variants = page.locator('[data-component-example="item/variants"] [data-slot="item"]');
      expect(await variants.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-variant")))).toEqual([
        "default",
        "muted",
        "outline",
      ]);
      expect(
        new Set(await variants.evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().height))).size,
      ).toBe(1);
      expect(await variants.nth(0).evaluate((node) => getComputedStyle(node).backgroundColor)).toBe("rgba(0, 0, 0, 0)");
      expect(await variants.nth(1).evaluate((node) => getComputedStyle(node).backgroundColor)).not.toBe(
        "rgba(0, 0, 0, 0)",
      );
      expect(await variants.nth(2).evaluate((node) => getComputedStyle(node).borderColor)).not.toBe("rgba(0, 0, 0, 0)");
      const sizes = page.locator('[data-component-example="item/sizes"] [data-slot="item"]');
      expect(await sizes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-size")))).toEqual([
        "default",
        "sm",
        "xs",
      ]);
      const heights = await sizes.evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().height));
      expect(heights[0]).toBeGreaterThan(heights[1] ?? 0);
      expect(heights[1]).toBeGreaterThan(heights[2] ?? 0);
      const media = page.locator('[data-component-example="item/media"] [data-slot="item-media"]');
      expect(await media.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-variant")))).toEqual([
        "default",
        "icon",
        "image",
      ]);
      expect(await media.nth(1).evaluate((node) => node.getBoundingClientRect().width)).toBe(32);
      expect(await media.nth(2).evaluate((node) => node.getBoundingClientRect().width)).toBe(40);
      expect(
        await media.locator("img").evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0),
      ).toBe(true);
      const separator = page.locator('[data-component-example="item/separators"] [data-slot="item-separator"]');
      expect(
        await separator.evaluate((node) => ({
          height: node.getBoundingClientRect().height,
          margin: getComputedStyle(node).marginTop,
        })),
      ).toEqual({ height: 1, margin: "0px" });
      const metadata = page.locator('[data-component-example="item/header-footer"] [data-slot="item"]');
      expect(
        await metadata.evaluate((node) => {
          const header = node.querySelector('[data-slot="item-header"]')?.getBoundingClientRect();
          const content = node.querySelector('[data-slot="item-content"]')?.getBoundingClientRect();
          const footer = node.querySelector('[data-slot="item-footer"]')?.getBoundingClientRect();
          return (
            header &&
            content &&
            footer &&
            header.bottom <= content.top &&
            content.bottom <= footer.top &&
            Math.abs(header.width - footer.width) < 1
          );
        }),
      ).toBe(true);
      const download = top.getByRole("button", { name: "Download plan.md" });
      await expect(download).toHaveAttribute("data-motion", effectiveMode(mode, os === "reduce"));
      await download.scrollIntoViewIfNeeded();
      const pending = page.waitForEvent("download");
      expect(await pressScale(page, '[data-preview="item"] [data-slot="button"]')).toBeCloseTo(
        effectiveMode(mode, os === "reduce") === "full" ? 0.97 : 1,
        2,
      );
      expect((await pending).suggestedFilename()).toBe("plan.md");
      await download.focus();
      const keyboardDownload = page.waitForEvent("download");
      await download.press("Enter");
      await keyboardDownload;
      await expect(download).toBeFocused();
      await page.getByRole("group", { name: "Motion mode" }).getByRole("button", { name: "none", exact: true }).click();
      await expect(download).toHaveAttribute("data-motion", "none");
      expect(
        await page
          .locator('[data-slot="item"]')
          .evaluateAll((nodes) =>
            nodes.every((node) => !node.hasAttribute("data-motion") && node.getAnimations().length === 0),
          ),
      ).toBe(true);
      const row = page.locator('[data-component-example="item/whole-row-link"]').getByRole("link");
      await expect(row.locator("a, button")).toHaveCount(0);
      await row.focus();
      await row.press("Enter");
      await expect(page).toHaveURL(/\/docs\/installation$/);
    });

for (const os of ["no-preference", "reduce"] as const)
  for (const mode of MODES)
    test(`Field examples: real associations, responsive containers and caller-owned errors ${mode}/${os}`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: os });
      await page.goto(`/components/field?motion=${mode}&variant=horizontal`);
      await page.waitForLoadState("networkidle");
      const top = page.locator('[data-preview="field"]');
      await expect(top.getByRole("combobox")).toHaveCount(0);
      await expect(top.locator('[data-slot="field"]')).toHaveCount(1);
      const initialCheckbox = page.locator('[data-component-example="field/choice-card"]').getByRole("checkbox");
      await expect(initialCheckbox).toHaveAttribute("data-motion", effectiveMode(mode, os === "reduce"));
      const company = top.getByRole("textbox", { name: "Company", exact: true });
      await top.getByText("Company", { exact: true }).click();
      await expect(company).toBeFocused();
      await company.fill("Independent top draft");
      const orientations = page.locator('[data-component-example="field/orientation"]');
      await expect(orientations.locator('[data-orientation="vertical"]')).toHaveCSS("flex-direction", "column");
      await expect(orientations.locator('[data-orientation="horizontal"]')).toHaveCSS("flex-direction", "row");
      const responsive = page.locator('[data-component-example="field/responsive"] [data-slot="field"]');
      await page.setViewportSize({ width: 1280, height: 1000 });
      await expect(responsive.nth(0)).toHaveCSS("flex-direction", "row");
      await expect(responsive.nth(1)).toHaveCSS("flex-direction", "column");
      await page.setViewportSize({ width: 390, height: 1000 });
      await expect(responsive.nth(0)).toHaveCSS("flex-direction", "column");
      await expect(responsive.nth(1)).toHaveCSS("flex-direction", "column");
      await page.setViewportSize({ width: 1280, height: 1000 });
      const errors = page.locator('[data-component-example="field/caller-error"]');
      const vat = errors.getByRole("textbox", { name: "VAT number" });
      await expect(vat).toHaveAccessibleDescription(
        "That VAT number has the wrong number of digits. Include the country prefix.",
      );
      await expect(errors.getByRole("listitem")).toHaveCount(2);
      const original = await vat.elementHandle();
      await vat.fill("supplied-value");
      const toggle = errors.getByRole("button", { name: "Toggle supplied error" });
      await toggle.scrollIntoViewIfNeeded();
      expect(await pressScale(page, '[data-component-example="field/caller-error"] [data-slot="button"]')).toBeCloseTo(
        effectiveMode(mode, os === "reduce") === "full" ? 0.97 : 1,
        2,
      );
      await expect(errors.getByRole("alert")).toHaveCount(0);
      await expect(vat).toHaveAttribute("aria-invalid", "false");
      await expect(vat).toHaveAccessibleDescription("Use the number on your invoice.");
      for (let i = 0; i < 3; i++) await toggle.click();
      await expect(errors.getByRole("listitem")).toHaveCount(2);
      await expect(vat).toHaveValue("supplied-value");
      await vat.focus();
      await vat.press("Home");
      await vat.press("Shift+ArrowRight");
      await page
        .getByRole("group", { name: "Motion mode" })
        .getByRole("button", { name: "none", exact: true })
        .evaluate((button: HTMLButtonElement) => button.click());
      await expect(vat).toBeFocused();
      expect(
        await vat.evaluate(
          (node: HTMLInputElement, original) => [node === original, node.selectionStart, node.selectionEnd],
          original,
        ),
      ).toEqual([true, 0, 1]);
      await expect(company).toHaveValue("Independent top draft");
      const set = page.locator('[data-component-example="field/fieldset"]');
      await expect(set.locator("fieldset")).toHaveCount(2);
      await expect(set.getByRole("group", { name: "Billing details", exact: true })).toBeVisible();
      await expect(set.locator('legend[data-variant="label"]')).toHaveText("Invoice contact");
      expect(
        await set
          .locator('[data-slot="field-separator"]')
          .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-content"))),
      ).toEqual(["true", "false"]);
      const choice = page.locator('[data-component-example="field/choice-card"]');
      const checkbox = choice.getByRole("checkbox");
      await expect(checkbox).toBeChecked();
      await expect(checkbox).toHaveAccessibleName(/Team plan/);
      await expect(checkbox).toHaveAccessibleDescription("Unlimited projects for your team.");
      await choice.getByText("Team plan", { exact: true }).click();
      await expect(checkbox).not.toBeChecked();
      await checkbox.focus();
      await checkbox.press(" ");
      await expect(checkbox).toBeChecked();
      await expect(checkbox).toHaveAttribute("data-motion", "none");
      const ids = await page.locator("[id]").evaluateAll((nodes) => nodes.map((node) => node.id));
      expect(new Set(ids).size).toBe(ids.length);
      expect(
        await page
          .locator('[data-slot="field"]')
          .evaluateAll((nodes) =>
            nodes.every((node) => !node.hasAttribute("data-motion") && node.getAnimations().length === 0),
          ),
      ).toBe(true);
    });

for (const os of ["no-preference", "reduce"] as const)
  for (const mode of MODES)
    test(`Button Group examples: independent fixed orientations, text and separator geometry ${mode}/${os}`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: os });
      await page.goto(`/components/button-group?motion=${mode}&variant=vertical`);
      await page.waitForLoadState("networkidle");
      const top = page.locator('[data-preview="button-group"]');
      await expect(top.getByRole("combobox")).toHaveCount(0);
      const horizontal = top.getByRole("group", { name: "Zoom", exact: true });
      const vertical = top.getByRole("group", { name: "Vertical zoom", exact: true });
      await expect(horizontal).toHaveCSS("flex-direction", "row");
      await expect(vertical).toHaveCSS("flex-direction", "column");
      expect(
        await vertical
          .locator(":scope > *")
          .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().width)),
      ).toEqual([64, 64, 64]);
      const body = page.locator('[data-component-example="button-group/vertical"]');
      await expect(body.getByRole("status")).toHaveText("100%");
      await body.getByRole("button", { name: "Zoom in" }).click();
      await expect(body.getByRole("status")).toHaveText("125%");
      await expect(horizontal.getByRole("status")).toHaveText("100%");
      await expect(vertical.getByRole("status")).toHaveText("100%");
      const plus = horizontal.getByRole("button", { name: "Zoom in" });
      await plus.scrollIntoViewIfNeeded();
      expect(await pressScale(page, '[data-preview="button-group"] [aria-label="Zoom in"]')).toBeCloseTo(
        effectiveMode(mode, os === "reduce") === "full" ? 0.97 : 1,
        2,
      );
      await expect(horizontal.getByRole("status")).toHaveText("125%");
      await plus.focus();
      await plus.press("Enter");
      await plus.press(" ");
      await expect(horizontal.getByRole("status")).toHaveText("175%");
      const original = await plus.elementHandle();
      await page
        .getByRole("group", { name: "Motion mode" })
        .getByRole("button", { name: "none", exact: true })
        .evaluate((button: HTMLButtonElement) => button.click());
      await expect(plus).toBeFocused();
      await expect(plus).toHaveAttribute("data-motion", "none");
      expect(await plus.evaluate((node, original) => node === original, original)).toBe(true);
      await expect(horizontal.getByRole("status")).toHaveText("175%");
      await expect(body.getByRole("status")).toHaveText("125%");
      const corners = await horizontal.locator(":scope > *").evaluateAll((nodes) =>
        nodes.map((node) => {
          const css = getComputedStyle(node);
          return {
            tl: parseFloat(css.borderTopLeftRadius),
            tr: parseFloat(css.borderTopRightRadius),
            bl: parseFloat(css.borderBottomLeftRadius),
            br: parseFloat(css.borderBottomRightRadius),
          };
        }),
      );
      expect(corners[0]?.tl).toBeGreaterThan(0);
      expect(corners[0]?.tr).toBe(0);
      expect(corners[1]).toEqual({ tl: 0, tr: 0, bl: 0, br: 0 });
      expect(corners[2]?.tr).toBeGreaterThan(0);
      expect(corners[2]?.tl).toBe(0);
      const rules = page.locator(
        '[data-component-example="button-group/separator"] [data-slot="button-group-separator"]',
      );
      expect(
        await rules.evaluateAll((nodes) =>
          nodes.map((node) => {
            const rect = node.getBoundingClientRect();
            return { orientation: node.getAttribute("data-orientation"), width: rect.width, height: rect.height };
          }),
        ),
      ).toEqual([
        { orientation: "vertical", width: 1, height: 32 },
        { orientation: "horizontal", width: expect.any(Number), height: 1 },
      ]);
      expect(await rules.nth(1).evaluate((node) => node.getBoundingClientRect().width)).toBeGreaterThan(50);
      const text = page.locator('[data-component-example="button-group/static-text"]');
      await expect(text.locator('[data-slot="button-group-text"]')).toHaveJSProperty("tagName", "SPAN");
      await expect(text.locator('[data-slot="button-group-text"]')).not.toHaveAttribute("tabindex");
      expect(
        await page
          .locator('[data-slot="button-group"]')
          .evaluateAll((nodes) =>
            nodes.every((node) => !node.hasAttribute("data-motion") && node.getAnimations().length === 0),
          ),
      ).toBe(true);
      await text.getByRole("link", { name: "Registry", exact: true }).focus();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/docs\/registry$/);
    });
