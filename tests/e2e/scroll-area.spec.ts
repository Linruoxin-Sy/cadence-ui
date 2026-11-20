import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { effectiveMode, MODES } from "./helpers";

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test.describe(`scroll area ${reducedMotion}`, () => {
    test.use({ reducedMotion });
    for (const mode of MODES) {
      test(`native scroll and scoped motion in ${mode}`, async ({ page }) => {
        const actual = effectiveMode(mode, reducedMotion === "reduce");
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
              slot: node.getAttribute("data-slot"),
              mode: node.getAttribute("data-motion"),
              animation: s.animationName,
              property: s.transitionProperty,
              duration: s.transitionDuration,
              opacity: s.opacity,
              behavior: s.scrollBehavior,
            };
          }),
        );
        for (const s of styles) {
          expect(s.animation, s.slot ?? "slot").toBe("none");
          expect(s.behavior, s.slot ?? "slot").toBe("auto");
          // The root is not an animated part; every animated part reports the resolved mode.
          if (s.slot === "scroll-area") expect(s.mode).toBeNull();
          else expect(s.mode, s.slot ?? "slot").toBe(actual);
          const properties = s.property.split(",").map((property) => property.trim());
          if (s.duration === "0s") continue;
          // Only the declared colour family may transition; nothing geometric or optical leaks in.
          for (const property of properties)
            expect(["background-color", "color", "box-shadow"], `${s.slot ?? "slot"} ${property}`).toContain(property);
        }
        // The inserted track's entrance must have settled instead of holding a hidden state.
        for (const track of await preview.locator('[data-slot="scroll-area-scrollbar"]').all())
          await expect.poll(() => track.evaluate((node) => getComputedStyle(node).opacity)).toBe("1");
        // A live downgrade retires every authored writer at the same target and keeps scrolling native.
        await page
          .getByRole("group", { name: "Motion mode" })
          .getByRole("button", { name: "none", exact: true })
          .click();
        await expect(roots.nth(0).locator('[data-slot="scroll-area-scrollbar"]').first()).toHaveAttribute(
          "data-motion",
          "none",
        );
        expect(
          await preview.evaluate((node) =>
            [
              ...node.querySelectorAll(
                '[data-slot="scroll-area-viewport"],[data-slot="scroll-area-scrollbar"],[data-slot="scroll-area-thumb"]',
              ),
            ].every((part) => getComputedStyle(part).transitionDuration === "0s"),
          ),
        ).toBe(true);
        expect(
          await preview.evaluate((node) =>
            [
              ...node.querySelectorAll(
                '[data-slot="scroll-area-viewport"],[data-slot="scroll-area-scrollbar"],[data-slot="scroll-area-thumb"]',
              ),
            ].every((part) => part.getAnimations().length === 0),
          ),
        ).toBe(true);
        await vertical.focus();
        await page.keyboard.press("ArrowDown");
        await expect.poll(() => vertical.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
        // Exercise caller-owned data and dimensions rather than mutating production DOM.
        const changing = page.locator('[data-component-example="scroll-area/changing-content"]');
        const updating = changing.locator('[data-slot="scroll-area-viewport"]');
        const thumb = changing.locator('[data-slot="scroll-area-thumb"]');
        const saved = await updating.elementHandle();
        const before = await thumb.evaluate((el) => el.getBoundingClientRect().height);
        await changing.getByRole("button", { name: "Change activity count" }).click();
        await expect(changing.getByRole("listitem")).toHaveCount(40);
        await updating.focus();
        await page.keyboard.press("ArrowDown");
        await expect.poll(() => updating.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
        await expect.poll(() => thumb.evaluate((el) => el.getBoundingClientRect().height)).toBeLessThan(before);
        await changing.getByRole("button", { name: "Resize activity panel" }).click();
        await expect.poll(() => updating.evaluate((el) => el.clientHeight)).toBe(286);
        expect(await updating.evaluate((el, handle) => el === handle, saved)).toBe(true);
        expect(errors).toEqual([]);
      });
    }
  });
}
for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`scroll area ${colorScheme}`, () => {
    test.use({ colorScheme });
    test("axe and desktop/narrow geometry", async ({ page }, testInfo) => {
      testInfo.setTimeout(90_000);
      await page.goto("/components/scroll-area?motion=none");
      await page.waitForLoadState("networkidle");
      // Base UI re-measures each viewport after hydration and only then exposes keyboard access.
      await page.waitForTimeout(800);
      await expect(page.locator("html")).toHaveClass(colorScheme === "dark" ? /dark/ : /^(?!.*dark)/);
      const preview = page.locator('[data-preview="scroll-area"]');
      for (const width of [1280, 390]) {
        await page.setViewportSize({ width, height: 844 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        expect(
          (
            await new AxeBuilder({ page })
              .include('[data-preview="scroll-area"]')
              .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
              .analyze()
          ).violations,
        ).toEqual([]);
        await preview.screenshot({ path: testInfo.outputPath(`scroll-area-${colorScheme}-${width}.png`) });
      }
    });
  });
}
