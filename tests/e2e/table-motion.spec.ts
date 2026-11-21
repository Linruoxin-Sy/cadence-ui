import { expect, test } from "@playwright/test";
import { effectiveMode, MODES, openComponent } from "./helpers";

/**
 * Real-engine motion evidence for Table: `table.spec.ts` proves the settled
 * surface and the native semantics, and this file samples the two claims a
 * browser can actually observe — the scoped row paint clock, and a changed plain
 * cell committing as native content with no per-cell controller — across the
 * 3 × 2 mode matrix.
 *
 * jsdom cannot run these: it has no cascade and no transition timeline, so the
 * frames below are the only record that the shipped clock is the classified one.
 */

const example = (id: string) => `[data-component-example="table/${id}"]`;

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test.describe(`table motion ${reducedMotion}`, () => {
    test.use({ reducedMotion });
    for (const requested of MODES) {
      test(`row paint and changed cell text in ${requested}`, async ({ page }) => {
        const mode = effectiveMode(requested, reducedMotion === "reduce");
        await openComponent(page, "table", requested, "table-row", mode);

        const rows = page.locator(`${example("selected-rows")} [data-slot="table-row"]`);
        // The first row is the header; the second body row starts unselected.
        const second = rows.nth(2);
        const clock = await second.evaluate((node) => {
          const style = getComputedStyle(node);
          return {
            property: style.transitionProperty,
            duration: style.transitionDuration,
            delay: style.transitionDelay,
            motion: node.getAttribute("data-motion"),
          };
        });
        expect(clock.motion).toBe(mode);
        // Surface + inherited foreground only: never `all`, never motion/geometry.
        expect(clock.property.split(/,\s*/).sort()).toEqual(["background-color", "color"]);
        expect(clock.property).not.toMatch(/all|transform|opacity|filter|width|height/);
        expect(clock.delay).toBe("0s");
        const seconds = Number.parseFloat(clock.duration);
        if (mode === "none") expect(seconds).toBe(0);
        else expect(seconds).toBeGreaterThan(0);

        // A real state change: the second invoice joins the selection. The click and
        // the first frame are measured inside the page so the sampled window covers
        // the whole transition instead of starting after it settled.
        const paint = await page.evaluate(async () => {
          const target = document.querySelectorAll(
            '[data-component-example="table/selected-rows"] [data-slot="table-row"]',
          )[2];
          const input = document.querySelector<HTMLInputElement>(
            '[data-component-example="table/selected-rows"] input[aria-label="Include INV-002"]',
          );
          const samples: string[] = [];
          let frames = 0;
          const read = () => (target ? getComputedStyle(target).backgroundColor : "");
          const tick = () => {
            samples.push(read());
            if (++frames < 16) requestAnimationFrame(tick);
          };
          samples.push(read());
          requestAnimationFrame(tick);
          input?.click();
          await new Promise<void>((resolve) => {
            const settle = () => (frames >= 16 ? resolve() : requestAnimationFrame(settle));
            requestAnimationFrame(settle);
          });
          return samples;
        });
        await expect(second).toHaveAttribute("data-state", "selected");
        if (mode === "none") expect(new Set(paint.slice(2)).size).toBe(1);
        else expect(new Set(paint.slice(1)).size).toBeGreaterThan(1);
        expect(paint.every((value) => value !== "")).toBe(true);

        // A changed plain cell is the caller's native content: the value commits and
        // starts no controller, whatever the mode or OS preference.
        const status = page.locator(`${example("row-actions")} [data-slot="table-cell"]`).nth(0);
        await expect(status).toHaveText("Pending");
        await page.locator(`${example("row-actions")}`).scrollIntoViewIfNeeded();
        await page.waitForTimeout(400);
        const ran = await page.evaluate(async () => {
          const cell = document.querySelectorAll(
            '[data-component-example="table/row-actions"] [data-slot="table-cell"]',
          )[0];
          const button = cell?.parentElement?.querySelector("button");
          let maxAnimations = 0;
          let maxCanvases = 0;
          let frames = 0;
          const tick = () => {
            const tracked = document.getAnimations().filter((animation) => {
              const target = (animation.effect as KeyframeEffect | null)?.target as Element | null;
              return target !== null && Boolean(cell?.contains(target));
            });
            maxAnimations = Math.max(maxAnimations, tracked.length);
            maxCanvases = Math.max(maxCanvases, cell?.querySelectorAll("canvas").length ?? 0);
            if (++frames < 20) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          button?.click();
          await new Promise<void>((resolve) => {
            const settle = () => (frames >= 20 ? resolve() : requestAnimationFrame(settle));
            requestAnimationFrame(settle);
          });
          return { maxAnimations, maxCanvases, html: (cell?.innerHTML ?? "").slice(0, 200) };
        });
        await expect(status).toHaveText("Paid");
        // Table declares no text or number recipe: the changed value commits as
        // native content and starts no controller in any mode or OS preference.
        expect(ran.maxAnimations + ran.maxCanvases).toBe(0);
        expect(ran.html).toBe("Paid");
      });
    }
  });
}
