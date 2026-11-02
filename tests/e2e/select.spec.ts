import { expect, test } from "@playwright/test";
import { MODES, openComponent } from "./helpers";

for (const theme of ["light", "dark"] as const) {
  for (const mode of MODES) {
    test(`Select handoff keeps the complete label in ${theme}/${mode}`, async ({ page }) => {
      await openComponent(page, "select", mode, "select-trigger");
      await page.evaluate((theme) => document.documentElement.classList.toggle("dark", theme === "dark"), theme);

      // Record every painted flight, including the first one after selection.
      await page.evaluate(() => {
        const state = { running: true, widths: [] as { box: number; text: number }[] };
        Object.assign(window, { selectFlight: state });
        const sample = () => {
          const clone = document.querySelector('[data-slot="select-handoff"]');
          if (clone) {
            const range = document.createRange();
            range.selectNodeContents(clone);
            state.widths.push({ box: clone.getBoundingClientRect().width, text: range.getBoundingClientRect().width });
          }
          if (state.running) requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      });

      for (const name of ["Framework", "Framework, small"]) {
        const trigger = page.getByRole("combobox", { name, exact: true });
        // Both directions matter: the new label may be wider than the measured
        // destination when Base UI has not committed its Value label yet.
        for (const label of ["Astro", "Next.js", "Remix"]) {
          await trigger.click();
          await expect(trigger).toHaveAttribute("aria-expanded", "true");
          const listId = await trigger.getAttribute("aria-controls");
          await page.locator(`[id="${listId}"]`).getByRole("option", { name: label, exact: true }).click();
          await expect(trigger.locator('[data-slot="select-value"]')).toHaveText(label);
          await expect(page.locator('[data-slot="select-handoff"]')).toHaveCount(0);
          await expect(trigger.locator('[data-slot="select-value"]')).toHaveCSS("opacity", "1");
          await expect(page.locator(`[id="${listId}"]`)).toBeHidden();
        }
      }

      const evidence = await page.evaluate(() => {
        const state = (
          window as unknown as {
            selectFlight: {
              running: boolean;
              widths: { box: number; text: number }[];
            };
          }
        ).selectFlight;
        state.running = false;
        return { widths: state.widths };
      });
      if (mode === "full") {
        expect(evidence.widths.length).toBeGreaterThan(0);
        expect(evidence.widths.every(({ box, text }) => box >= text)).toBe(true);
      } else {
        expect(evidence.widths).toHaveLength(0);
      }
    });
  }
}
