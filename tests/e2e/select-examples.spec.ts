import { expect, test } from "@playwright/test";
import { effectiveMode, MODES } from "./helpers";

for (const os of [false, true])
  for (const mode of MODES)
    test(`Select additional forms: multiple values and fixed placement ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
      await page.goto(`/components/select?motion=${mode}`);
      await page.waitForLoadState("networkidle");
      const multiple = page.locator('[data-component-example="select/multiple"]');
      const trigger = multiple.getByRole("combobox");
      await expect(trigger).toHaveAttribute("data-motion", effectiveMode(mode, os));
      await expect(trigger).toContainText("Next.js");
      await expect(trigger).toContainText("Astro");
      await trigger.click();
      const listId = await trigger.getAttribute("aria-controls");
      const list = page.locator(`[id="${listId}"]`);
      await expect(list).toHaveAttribute("aria-multiselectable", "true");
      await list.getByRole("option", { name: "Remix", exact: true }).click();
      await expect(list).toBeVisible();
      await expect(list.getByRole("option", { name: "Remix", exact: true })).toHaveAttribute("aria-selected", "true");
      await list.getByRole("option", { name: "Astro", exact: true }).click();
      await expect(list.getByRole("option", { name: "Astro", exact: true })).toHaveAttribute("aria-selected", "false");
      await page.keyboard.press("Escape");
      await expect(trigger).toBeFocused();
      await expect(trigger).toContainText("Remix");
      await expect(trigger).not.toContainText("Astro");
      await expect(
        page.locator('[data-preview="select"]').getByRole("combobox", { name: "Framework", exact: true }),
      ).toHaveText(/Next.js/);
      const placement = page.locator('[data-component-example="select/placement"]');
      for (const name of [
        "top panel",
        "right panel",
        "bottom panel",
        "left panel",
        "start alignment",
        "center alignment",
        "end alignment",
      ]) {
        const control = placement.getByRole("combobox", { name: `Framework, ${name}`, exact: true });
        await control.click();
        const panelId = await control.getAttribute("aria-controls");
        const panel = page.locator(`[id="${panelId}"]`).locator("..");
        await expect(panel).toBeVisible();
        await expect(panel).toHaveAttribute("data-align-trigger", "false");
        await expect(panel).toHaveAttribute("data-side", /^(top|right|bottom|left)$/);
        const bounds = await panel.boundingBox();
        expect(bounds?.x).toBeGreaterThanOrEqual(0);
        expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(await page.evaluate(() => innerWidth));
        await page.keyboard.press("Escape");
        await expect(control).toBeFocused();
      }
    });
