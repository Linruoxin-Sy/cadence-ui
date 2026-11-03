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
        await expect(preview.getByRole("tab")).toHaveCount(2);
        await expect(preview.locator("select")).toHaveCount(0);
        await expect(
          preview.getByRole("button", { name: /Toggle orientation|Resize list|Change selection/ }),
        ).toHaveCount(0);
        await preview.getByRole("tab", { name: "Activity" }).click();
        for (const vertical of [false, true]) {
          const verticalCard = page.locator('[data-component-example="tabs/vertical"]');
          const project = vertical
            ? verticalCard.locator('[data-slot="tabs"]').nth(0)
            : page.locator('[data-component-example="tabs/disabled"] [data-slot="tabs"]');
          const settings = vertical
            ? verticalCard.locator('[data-slot="tabs"]').nth(1)
            : page.locator('[data-component-example="tabs/line-style"] [data-slot="tabs"]');
          const overview = project.getByRole("tab", { name: "Overview" }),
            activity = project.getByRole("tab", { name: "Activity" });
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
          // Parent-only layout mutation bypasses React; the selected indicator stays attached.
          await project.evaluate((el) => {
            el.style.width = "285px";
          });
          await aligned(activity);
          await overview.click();
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
        const sizing = page.locator('[data-component-example="tabs/list-sizing"]');
        const sizingActivity = sizing.getByRole("tab", { name: "Activity" });
        await sizingActivity.click();
        const beforeWidth = (await sizing.getByRole("tablist").boundingBox())?.width;
        await sizing.getByRole("button", { name: "Resize list" }).click();
        expect((await sizing.getByRole("tablist").boundingBox())?.width).toBeGreaterThan(beforeWidth ?? 0);
        await aligned(sizingActivity);
        const controlled = page.locator('[data-component-example="tabs/controlled"]');
        const controlledRoot = await controlled.locator('[data-slot="tabs"]').elementHandle();
        await controlled.getByRole("button", { name: "Change selection" }).click();
        await expect(controlled.getByRole("tab", { name: "Activity" })).toHaveAttribute("aria-selected", "true");
        await controlled.getByRole("button", { name: "Change selection" }).click();
        await expect(controlled.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
        expect(
          await controlled.locator('[data-slot="tabs"]').evaluate((node, saved) => node === saved, controlledRoot),
        ).toBe(true);
        const persistent = page.locator('[data-component-example="tabs/persistent"]');
        const draft = persistent.getByRole("textbox", { name: "Draft text" });
        await draft.fill("A draft kept by its panel");
        const draftNode = await draft.elementHandle();
        await persistent.getByRole("tab", { name: "History" }).click();
        await expect(draft).toBeHidden();
        await persistent.getByRole("tab", { name: "Draft" }).click();
        await expect(draft).toHaveValue("A draft kept by its panel");
        await draft.focus();
        await page
          .getByRole("group", { name: "Motion mode" })
          .getByRole("button", { name: "none", exact: true })
          .evaluate((node) => (node as HTMLButtonElement).click());
        await expect(draft).toBeFocused();
        expect(await draft.evaluate((node, saved) => node === saved, draftNode)).toBe(true);
        await expect(sizingActivity).toHaveAttribute("aria-selected", "true");
        await expect(preview.getByRole("tab", { name: "Activity" })).toHaveAttribute("aria-selected", "true");
        const ids = await page.locator("[id]").evaluateAll((nodes) => nodes.map((node) => node.id));
        expect(new Set(ids).size).toBe(ids.length);
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
      await page.locator('[data-component-example="tabs/vertical"]').scrollIntoViewIfNeeded();
      await page.screenshot({ path: testInfo.outputPath(`tabs-${colorScheme}-vertical.png`) });
      await page.setViewportSize({ width: 390, height: 844 });
      await aligned(preview.getByRole("tab", { name: "Activity" }));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });
  });
}
