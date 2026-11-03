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
