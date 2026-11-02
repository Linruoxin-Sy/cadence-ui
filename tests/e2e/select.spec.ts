import { expect, test } from "@playwright/test";
import { MODES, openComponent } from "./helpers";

for (const theme of ["light", "dark"] as const) {
  for (const mode of MODES) {
    test(`Select handoff keeps the complete label in ${theme}/${mode}`, async ({ page }) => {
      await openComponent(page, "select", mode, "select-trigger");
      await page.evaluate((theme) => document.documentElement.classList.toggle("dark", theme === "dark"), theme);

      // Record every painted flight, including the first one after selection.
      await page.evaluate(() => {
        const state = {
          running: true,
          widths: [] as { box: number; text: number }[],
          landings: [] as { dx: number; dy: number }[],
          last: null as { left: number; top: number; target: Element } | null,
        };
        Object.assign(window, { selectFlight: state });
        const sample = () => {
          const clone = document.querySelector('[data-slot="select-handoff"]');
          if (clone) {
            const range = document.createRange();
            range.selectNodeContents(clone);
            state.widths.push({ box: clone.getBoundingClientRect().width, text: range.getBoundingClientRect().width });
            const target = [...document.querySelectorAll('[data-preview="select"] [data-slot="select-value"]')].find(
              (node) => getComputedStyle(node).opacity === "0",
            )?.firstElementChild;
            if (target) {
              const rect = clone.getBoundingClientRect();
              state.last = { left: rect.left, top: rect.top, target };
            }
          } else if (state.last) {
            const rect = state.last.target.getBoundingClientRect();
            state.landings.push({ dx: state.last.left - rect.left, dy: state.last.top - rect.top });
            state.last = null;
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
              landings: { dx: number; dy: number }[];
            };
          }
        ).selectFlight;
        state.running = false;
        return { widths: state.widths, landings: state.landings };
      });
      if (mode === "full") {
        expect(evidence.widths.length).toBeGreaterThan(0);
        expect(evidence.widths.every(({ box, text }) => box >= text)).toBe(true);
        expect(evidence.landings).toHaveLength(6);
        for (const { dx, dy } of evidence.landings) {
          expect(Math.abs(dx)).toBeLessThan(0.5);
          expect(Math.abs(dy)).toBeLessThan(0.5);
        }
      } else {
        expect(evidence.widths).toHaveLength(0);
      }
    });
  }
}
