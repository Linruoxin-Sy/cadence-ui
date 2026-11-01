import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test.describe(`sidebar ${reducedMotion}`, () => {
    test.use({ reducedMotion });
    for (const mode of ["full", "reduced", "none"] as const)
      test(`desktop and mobile ${mode}`, async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (e) => errors.push(e.message));
        await page.goto(`/components/sidebar?motion=${mode}`);
        await page.waitForLoadState("networkidle");
        const preview = page.locator('[data-preview="sidebar"]');
        const motion = preview.getByLabel("Panel motion");
        await motion.selectOption(mode);
        const trigger = preview.locator('[data-slot="sidebar-trigger"]');
        const panel = preview.locator('[data-slot="sidebar-container"]');
        const state = preview.getByTestId("sidebar-state");
        const effective = mode === "none" ? "none" : reducedMotion === "reduce" ? "reduced" : mode;
        await expect(panel).toHaveAttribute("data-motion", effective);
        const input = preview.getByRole("textbox", { name: "Search workspace" });
        await input.fill("retain me");
        await input.evaluate((el) => ((window as unknown as { sidebarInput: Element }).sidebarInput = el));
        for (const side of ["left", "right"]) {
          await preview.getByRole("combobox", { name: /^Side/ }).selectOption(side);
          for (const collapse of ["offcanvas", "icon"]) {
            await preview.getByLabel("Collapse mode").selectOption(collapse);
            await preview.getByRole("button", { name: "Expand", exact: true }).click();
            await expect(state).toContainText("expanded");
            const samples = await preview.evaluate(async (root) => {
              const b = Array.from(root.querySelectorAll("button")).find((b) => b.textContent === "Collapse");
              b?.click();
              const values = [];
              for (let i = 0; i < 16; i++) {
                await new Promise(requestAnimationFrame);
                const el = root.querySelector('[data-slot="sidebar-container"]');
                if (!el) throw new Error("Missing sidebar");
                values.push(getComputedStyle(el).transform);
              }
              return values;
            });
            await expect(state).toContainText("collapsed");
            if (collapse === "offcanvas" && effective === "full") expect(new Set(samples).size).toBeGreaterThan(2);
            if (effective !== "full") expect(samples.every((s) => s === "none")).toBe(true);
            await trigger.focus();
            await page.keyboard.press("Control+b");
            await expect(state).toContainText("expanded");
            await expect(input).toHaveValue("retain me");
          }
        }
        expect(await input.evaluate((el) => el === (window as unknown as { sidebarInput: Element }).sidebarInput)).toBe(
          true,
        );
        // Rapid reversal and downgrade preserve the same panel/input.
        await preview.getByLabel("Collapse mode").selectOption("offcanvas");
        await preview.evaluate(async (root) => {
          for (let i = 0; i < 8; i++) {
            Array.from(root.querySelectorAll("button"))
              .find((b) => b.textContent === (i % 2 ? "Expand" : "Collapse"))
              ?.click();
            await new Promise(requestAnimationFrame);
          }
        });
        await preview.getByRole("button", { name: "Collapse", exact: true }).click();
        await motion.selectOption("none");
        await expect.poll(() => panel.evaluate((el) => getComputedStyle(el).transform)).toBe("none");
        await page.emulateMedia({ reducedMotion: "reduce" });
        await motion.selectOption("full");
        await expect(panel).toHaveAttribute("data-motion", "reduced");
        await page.emulateMedia({ reducedMotion });
        await motion.selectOption(mode);
        for (const variant of ["sidebar", "floating", "inset"]) {
          await preview.getByLabel("Variant").selectOption(variant);
          await preview.getByRole("button", { name: "Expand", exact: true }).click();
          expect(await panel.evaluate((el) => el.getBoundingClientRect().width)).toBeGreaterThan(200);
        }
        await preview.getByLabel("Collapse mode").selectOption("none");
        await preview.getByRole("button", { name: "Collapse", exact: true }).click();
        await expect(preview.getByRole("textbox", { name: "Search workspace" })).toBeVisible();
        await preview.getByLabel("Collapse mode").selectOption("offcanvas");
        await page.setViewportSize({ width: 390, height: 1000 });
        await trigger.focus();
        const mobileSamples = await preview.evaluate(async (root) => {
          (root.querySelector('[data-slot="sidebar-trigger"]') as HTMLButtonElement).click();
          const samples = [];
          for (let i = 0; i < 18; i++) {
            await new Promise(requestAnimationFrame);
            const el = document.querySelector('[data-mobile="true"]');
            if (el) {
              const cs = getComputedStyle(el);
              samples.push({ translate: cs.translate, opacity: cs.opacity, duration: cs.transitionDuration });
            }
          }
          return samples;
        });
        expect(mobileSamples.length).toBeGreaterThan(0);
        if (effective === "full") expect(new Set(mobileSamples.map((s) => s.translate)).size).toBeGreaterThan(1);
        if (effective !== "full") expect(mobileSamples.every((s) => s.translate === "none")).toBe(true);
        if (effective === "none")
          expect(mobileSamples.every((s) => s.opacity === "1" && s.duration === "0s")).toBe(true);
        const dialog = page.getByRole("dialog", { name: "Sidebar", exact: true });
        await expect(dialog).toBeVisible();
        expect(await dialog.evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe("rgba(0, 0, 0, 0)");
        await expect(dialog).toHaveAttribute("data-motion", effective);
        const css = await dialog.evaluate((el) => {
          const s = getComputedStyle(el);
          return { translate: s.translate, duration: s.transitionDuration };
        });
        if (effective === "none") expect(css.duration).toBe("0s");
        if (effective !== "full") expect(css.translate).toBe("none");
        await dialog.getByRole("textbox").fill("mobile");
        await page.keyboard.press("Tab");
        await expect(dialog.getByRole("link", { name: "Overview" })).toBeFocused();
        await page.keyboard.press("Escape");
        await expect(dialog).toBeHidden();
        await expect(trigger).toBeFocused();
        await trigger.click();
        await expect(dialog).toBeVisible();
        // Live portal downgrade must cancel the CSS transition without replacing the popup.
        await dialog.evaluate((el) => ((window as unknown as { mobilePanel: Element }).mobilePanel = el));
        await motion.evaluate((el) => {
          const select = el as HTMLSelectElement;
          select.value = "none";
          select.dispatchEvent(new Event("change", { bubbles: true }));
        });
        await expect(dialog).toHaveAttribute("data-motion", "none");
        await expect.poll(() => dialog.evaluate((el) => el.getAnimations().length)).toBe(0);
        expect(await dialog.evaluate((el) => el === (window as unknown as { mobilePanel: Element }).mobilePanel)).toBe(
          true,
        );
        await page.mouse.click(10, 500);
        await expect(dialog).toBeHidden();
        expect(errors).toEqual([]);
      });
  });
}
for (const colorScheme of ["light", "dark"] as const)
  test.describe(`sidebar visual ${colorScheme}`, () => {
    test.use({ colorScheme });
    test("axe and responsive layouts", async ({ page }) => {
      await page.goto("/components/sidebar?motion=none");
      await page.waitForLoadState("networkidle");
      const preview = page.locator('[data-preview="sidebar"]');
      await preview.getByLabel("Panel motion").selectOption("none");
      for (const width of [1280, 390]) {
        await page.setViewportSize({ width, height: 1100 });
        if (width === 390) await preview.locator('[data-slot="sidebar-trigger"]').click();
        const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
        expect(results.violations).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await (width === 390 ? page.getByRole("dialog", { name: "Sidebar", exact: true }) : preview).screenshot({
          path: `.cache/sidebar-proof/sidebar-${colorScheme}-${width}.png`,
        });
        if (width === 390) await page.keyboard.press("Escape");
      }
    });
  });
