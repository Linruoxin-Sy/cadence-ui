import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { MODES } from "./helpers";

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test.describe(`scroll area ${reducedMotion}`, () => {
    test.use({ reducedMotion });
    for (const mode of MODES) {
      test(`native scroll and static motion in ${mode}`, async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await page.goto(`/components/scroll-area?motion=${mode}`);
        await page.waitForLoadState("networkidle");
        const preview = page.locator('[data-preview="scroll-area"]');
        const roots = preview.locator('[data-slot="scroll-area"]');
        const vertical = roots.nth(0).locator('[data-slot="scroll-area-viewport"]');
        const horizontal = roots.nth(1).locator('[data-slot="scroll-area-viewport"]');
        await vertical.focus();
        await expect(vertical).toBeFocused();
        await page.keyboard.press("ArrowDown");
        await expect.poll(() => vertical.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
        await horizontal.focus();
        await page.keyboard.press("ArrowRight");
        await expect.poll(() => horizontal.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
        // Native wheel and drag update content and the primitive's positional thumb.
        await vertical.focus();
        await vertical.hover({ position: { x: 40, y: 40 } });
        await expect
          .poll(async () => {
            await page.mouse.wheel(0, 160);
            return vertical.evaluate((el) => el.scrollTop);
          })
          .toBeGreaterThan(100);
        for (const [root, viewport, axis] of [
          [roots.nth(0), vertical, "vertical"],
          [roots.nth(1), horizontal, "horizontal"],
        ] as const) {
          await viewport.evaluate((el) => {
            el.scrollTop = 0;
            el.scrollLeft = 0;
          });
          const track = root.locator(`[data-slot="scroll-area-scrollbar"][data-orientation="${axis}"]`);
          const thumb = track.locator('[data-slot="scroll-area-thumb"]');
          await expect(thumb).toBeVisible();
          const box = await thumb.boundingBox();
          if (!box) throw new Error("missing thumb");
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await page.mouse.down();
          await page.mouse.move(
            box.x + box.width / 2 + (axis === "horizontal" ? 80 : 0),
            box.y + box.height / 2 + (axis === "vertical" ? 80 : 0),
            { steps: 5 },
          );
          await page.mouse.up();
          await expect
            .poll(() => viewport.evaluate((el, a) => (a === "vertical" ? el.scrollTop : el.scrollLeft), axis))
            .toBeGreaterThan(0);
        }
        const styles = await preview.locator('[data-slot^="scroll-area"]').evaluateAll((nodes) =>
          nodes.map((node) => {
            const s = getComputedStyle(node);
            return {
              animation: s.animationName,
              property: s.transitionProperty,
              duration: s.transitionDuration,
              opacity: s.opacity,
              behavior: s.scrollBehavior,
            };
          }),
        );
        for (const s of styles) {
          expect(s.animation).toBe("none");
          expect(s.opacity).toBe("1");
          expect(s.behavior).toBe("auto");
          if (s.duration !== "0s") expect(s.property).not.toMatch(/all|transform|opacity|filter/);
        }
        // Content changes are remeasured on native scroll or viewport resize (upstream semantics).
        const thumb = roots.nth(0).locator('[data-slot="scroll-area-thumb"]');
        const before = await thumb.evaluate((el) => el.getBoundingClientRect().height);
        await vertical.locator("ul").evaluate((el) => {
          el.append(el.cloneNode(true));
        });
        await vertical.evaluate((el) => {
          el.scrollTop = 1;
        });
        await expect.poll(() => thumb.evaluate((el) => el.getBoundingClientRect().height)).toBeLessThan(before);
        await roots.nth(0).evaluate((el) => {
          el.style.height = "300px";
        });
        await expect.poll(() => vertical.evaluate((el) => el.clientHeight)).toBe(298);
        expect(errors).toEqual([]);
      });
    }
  });
}
for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`scroll area ${colorScheme}`, () => {
    test.use({ colorScheme });
    test("axe and desktop/narrow geometry", async ({ page }, testInfo) => {
      await page.goto("/components/scroll-area?motion=none");
      await page.waitForLoadState("networkidle");
      await expect(page.locator("html")).toHaveClass(colorScheme === "dark" ? /dark/ : /^(?!.*dark)/);
      const preview = page.locator('[data-preview="scroll-area"]');
      for (const width of [1280, 390]) {
        await page.setViewportSize({ width, height: 844 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        expect(
          (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations,
        ).toEqual([]);
        await preview.screenshot({ path: testInfo.outputPath(`scroll-area-${colorScheme}-${width}.png`) });
      }
    });
  });
}
