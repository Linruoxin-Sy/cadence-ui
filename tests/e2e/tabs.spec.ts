import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, test } from "@playwright/test";
import { effectiveMode, MODES, openComponent } from "./helpers";

async function aligned(tab: Locator, line = false, vertical = false) {
  await expect
    .poll(() =>
      tab.evaluate(
        (el, options) => {
          const a = el.getBoundingClientRect();
          const indicator = el.querySelector('[data-slot="tabs-indicator"]');
          if (!indicator) return 999;
          const b = indicator.getBoundingClientRect();
          return options.line
            ? options.vertical
              ? Math.abs(a.top + 1 - b.top) + Math.abs(a.bottom - 1 - b.bottom)
              : Math.abs(a.left + 1 - b.left) + Math.abs(a.right - 1 - b.right)
            : Math.abs(a.left + 1 - b.left) +
                Math.abs(a.right - 1 - b.right) +
                Math.abs(a.top + 1 - b.top) +
                Math.abs(a.bottom - 1 - b.bottom);
        },
        { line, vertical },
      ),
    )
    .toBeLessThan(2);
}
for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test.describe(`tabs ${reducedMotion}`, () => {
    test.use({ reducedMotion });
    for (const requested of MODES) {
      test(`selection, interruption, layouts and keyboard ${requested}`, async ({ page }) => {
        const mode = effectiveMode(requested, reducedMotion === "reduce");
        const errors: string[] = [];
        page.on("pageerror", (e) => errors.push(e.message));
        await openComponent(page, "tabs", requested, "tabs-trigger", mode);
        const preview = page.locator('[data-preview="tabs"]');
        const roots = preview.locator('[data-slot="tabs"]');
        const project = roots.nth(0),
          settings = roots.nth(1);
        const overview = project.getByRole("tab", { name: "Overview" }),
          activity = project.getByRole("tab", { name: "Activity" });
        for (const vertical of [false, true]) {
          if (vertical) await preview.getByRole("button", { name: "Toggle orientation" }).click();
          await expect(project).toHaveAttribute("data-orientation", vertical ? "vertical" : "horizontal");
          if (vertical) await expect(project.getByRole("tablist")).toHaveAttribute("aria-orientation", "vertical");
          await overview.click();
          await aligned(overview);
          // Sample before/after synchronous retarget and subsequent frames in the browser.
          const trace = await activity.evaluate(async (el) => {
            const root = el.closest('[data-slot="tabs"]');
            if (!root) throw Error("missing root");
            const first = root.querySelector('[role="tab"]') as HTMLElement;
            const position = () => {
              const active = root.querySelector('[aria-selected="true"] [data-slot="tabs-indicator"]');
              if (!active) throw Error("missing indicator");
              const r = active.getBoundingClientRect();
              return { x: r.x, y: r.y, transform: getComputedStyle(active).transform };
            };
            (el as HTMLElement).click();
            const points = [];
            for (let i = 0; i < 6; i++) {
              await new Promise(requestAnimationFrame);
              points.push(position());
            }
            const before = position();
            first.click();
            const immediate = position();
            for (let i = 0; i < 6; i++) {
              await new Promise(requestAnimationFrame);
              points.push(position());
            }
            (el as HTMLElement).click();
            return { points, before, immediate };
          });
          await expect(activity).toHaveAttribute("aria-selected", "true");
          await aligned(activity);
          if (mode !== "full") {
            const styles = await activity.locator('[data-slot="tabs-indicator"]').evaluate((el) => {
              const s = getComputedStyle(el);
              return { transform: s.transform, transition: s.transitionDuration, animation: s.animationName };
            });
            expect(styles).toEqual({ transform: "none", transition: "0s", animation: "none" });
          }
          if (mode === "full") {
            expect(trace.points.some((p) => p.transform !== "none")).toBe(true);
            expect(Math.hypot(trace.before.x - trace.immediate.x, trace.before.y - trace.immediate.y)).toBeLessThan(2);
          } else {
            expect(trace.points.every((p) => p.transform === "none")).toBe(true);
          }
          await expect(settings.getByRole("tab", { name: "Account" })).toHaveAttribute("aria-selected", "true");
          await preview.getByRole("button", { name: "Resize list" }).click();
          await aligned(activity);
          // Parent-only layout mutation bypasses React; the selected indicator stays attached.
          await project.evaluate((el) => {
            el.style.width = "285px";
          });
          await aligned(activity);
          await preview.getByRole("button", { name: "Change selection" }).click();
          await expect(overview).toHaveAttribute("aria-selected", "true");
          await aligned(overview);
          await overview.focus();
          await page.keyboard.press(vertical ? "ArrowDown" : "ArrowRight");
          await expect(activity).toBeFocused();
          await expect(overview).toHaveAttribute("aria-selected", "true");
          await page.keyboard.press("Enter");
          await expect(activity).toHaveAttribute("aria-selected", "true");
          await page.keyboard.press(vertical ? "ArrowDown" : "ArrowRight");
          await expect(project.getByRole("tab", { name: "Locked" })).toBeFocused();
          await page.keyboard.press("Space");
          await expect(activity).toHaveAttribute("aria-selected", "true");
          await page.keyboard.press("Home");
          await expect(overview).toBeFocused();
          await page.keyboard.press("Space");
          await expect(overview).toHaveAttribute("aria-selected", "true");
          const account = settings.getByRole("tab", { name: "Account" }),
            notifications = settings.getByRole("tab", { name: "Notifications" });
          await account.focus();
          await page.keyboard.press(vertical ? "ArrowDown" : "ArrowRight");
          await expect(notifications).toHaveAttribute("aria-selected", "true");
          await aligned(notifications, true, vertical);
          await account.click();
          await aligned(account, true, vertical);
          expect(await project.locator('[data-slot="tabs-content"]').count()).toBe(1);
          expect(await settings.locator('[data-slot="tabs-content"]').count()).toBe(2);
        }
        expect(errors).toEqual([]);
      });
    }
  });
}
for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`tabs ${colorScheme}`, () => {
    test.use({ colorScheme });
    test("axe, responsive layout and three visual states", async ({ page }, testInfo) => {
      await openComponent(page, "tabs", "none", "tabs-trigger");
      const preview = page.locator('[data-preview="tabs"]');
      expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual(
        [],
      );
      await page.screenshot({ path: testInfo.outputPath(`tabs-${colorScheme}-initial.png`) });
      await preview.getByRole("tab", { name: "Activity" }).click();
      await expect
        .poll(() => preview.getByRole("tab", { name: "Activity" }).evaluate((el) => el.getAnimations().length))
        .toBe(0);
      await page.screenshot({ path: testInfo.outputPath(`tabs-${colorScheme}-selected.png`) });
      await preview.getByRole("button", { name: "Toggle orientation" }).click();
      await page.screenshot({ path: testInfo.outputPath(`tabs-${colorScheme}-vertical.png`) });
      await page.setViewportSize({ width: 390, height: 844 });
      await aligned(preview.getByRole("tab", { name: "Activity" }));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });
  });
}
