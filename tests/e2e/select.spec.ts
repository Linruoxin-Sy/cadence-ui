import { expect, test } from "@playwright/test";
import { MODES, openComponent } from "./helpers";

for (const theme of ["light", "dark"] as const) {
  for (const mode of MODES) {
    test(`Select retained label changes keep the current native value in ${theme}/${mode}`, async ({ page }) => {
      await openComponent(page, "select", mode, "select-trigger");
      await page.evaluate((theme) => document.documentElement.classList.toggle("dark", theme === "dark"), theme);
      await page.evaluate(() => {
        const samples: string[] = [];
        Object.assign(window, { retainedLabelFlights: samples });
        new MutationObserver((records) => {
          for (const record of records)
            for (const node of record.addedNodes)
              if (node instanceof HTMLElement && node.matches("[data-cadence-handoff-layer]"))
                samples.push(node.outerHTML);
        }).observe(document.body, { childList: true });
      });
      for (const name of ["Framework", "Framework, small"]) {
        const trigger = page.locator('[data-preview="select"]').getByRole("combobox", { name, exact: true });
        // Each pair retains at least one character. Until changed-run integration,
        // none may replay the entire label through the legacy transfer path.
        for (const label of ["Astro", "Next.js", "Remix"]) {
          await trigger.click();
          await expect(trigger).toHaveAttribute("aria-expanded", "true");
          const listId = await trigger.getAttribute("aria-controls");
          await page.locator(`[id="${listId}"]`).getByRole("option", { name: label, exact: true }).click();
          await expect(trigger.locator('[data-slot="select-value"]')).toHaveText(label);
          await expect(page.locator('[data-slot="select-handoff"]')).toHaveCount(0);
          await expect(trigger.locator('[data-slot="select-value"]')).toHaveCSS("opacity", "1");
          await expect(page.locator(`[id="${listId}"]`)).toBeHidden();
          await expect(trigger).toBeFocused();
        }
      }
      expect(
        await page.evaluate(() => (window as unknown as { retainedLabelFlights: string[] }).retainedLabelFlights),
      ).toEqual([]);
    });
  }
}
