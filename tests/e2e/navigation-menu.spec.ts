import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { MODES, recordedScale, recordScale } from "./helpers";
import { openPopupMotionFixture } from "./popup-motion-fixture";

// Base UI's safe polygon temporarily suppresses pointer events on sibling triggers.
// Move the real pointer so its global polygon listener can hand off, before actionability checks.
async function moveToTrigger(page: Page, trigger: Locator) {
  await trigger.scrollIntoViewIfNeeded();
  const box = await trigger.boundingBox();
  if (!box) throw new Error("Missing navigation trigger bounds");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 });
}

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test.describe(`navigation menu ${reducedMotion}`, () => {
    test.use({ reducedMotion });
    for (const mode of MODES) {
      test(`interaction and animation ${mode}`, async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (e) => errors.push(e.message));
        await recordScale(page, '[data-slot="navigation-menu-popup"]');
        await page.addInitScript(() => {
          const samples: string[] = [];
          (window as unknown as { menuOpacity: string[] }).menuOpacity = samples;
          const tick = () => {
            const popup = document.querySelector('[data-slot="navigation-menu-popup"]');
            if (popup) samples.push(getComputedStyle(popup).opacity);
            requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
        await openPopupMotionFixture(page, "navigation-menu", mode);
        await page.waitForLoadState("networkidle");
        const preview = page.locator('[data-preview="navigation-menu"]');
        const learn = preview.getByRole("button", { name: "Learn" });
        const build = preview.getByRole("button", { name: "Build" });
        const popup = page.locator('[data-slot="navigation-menu-popup"]');
        const effective = reducedMotion === "reduce" && mode === "full" ? "reduced" : mode;
        await moveToTrigger(page, learn);
        await expect(learn).toHaveAttribute("aria-expanded", "true");
        await expect(popup).toHaveAttribute("data-motion", effective);
        await expect(popup.getByRole("link", { name: "Installation", exact: true })).toBeVisible();
        await expect.poll(() => popup.evaluate((el) => el.getAnimations().length)).toBe(0);
        const scale = await recordedScale(page);
        const opacity = await page.evaluate(() => (window as unknown as { menuOpacity: string[] }).menuOpacity);
        if (effective === "full") expect(scale.min).toBeLessThan(1);
        else expect(scale.min).toBe(1);
        if (effective !== "none") expect(new Set(opacity).size).toBeGreaterThan(1);
        else expect(opacity.every((value) => value === "1")).toBe(true);
        await moveToTrigger(page, build);
        await expect(build).toHaveAttribute("aria-expanded", "true");
        await expect(popup.getByRole("link", { name: "Templates", exact: true })).toBeVisible();
        await moveToTrigger(page, learn);
        await expect(learn).toHaveAttribute("aria-expanded", "true");
        await learn.focus();
        await page.keyboard.press("ArrowDown");
        await expect(learn).toBeFocused();
        await page.keyboard.press("Tab");
        await expect(
          popup
            .locator('[data-slot="navigation-menu-content"][data-open]')
            .getByRole("button", { name: "Toggle details" }),
        ).toBeFocused();
        await page.keyboard.press("Tab");
        await expect(popup.getByRole("link", { name: "Installation", exact: true })).toBeFocused();
        await page.keyboard.press("Escape");
        await expect(learn).toBeFocused();
        await expect(popup).toHaveCount(0);
        await page.keyboard.press("Enter");
        await expect(learn).toHaveAttribute("aria-expanded", "true");
        await page.keyboard.press("ArrowRight");
        await expect(build).toBeFocused();
        await page.keyboard.press("ArrowDown");
        await expect(build).toHaveAttribute("aria-expanded", "true");
        await page.keyboard.press("Escape");
        await expect(build).toBeFocused();
        await learn.click();
        await expect(learn).toHaveAttribute("aria-expanded", "true");
        // Observe the actual shared popup across controlled switch / reversal / content update.
        const samples = await preview.evaluate(async (el) => {
          const popup = document.querySelector('[data-slot="navigation-menu-popup"]');
          const switcher = Array.from(el.querySelectorAll("button")).find((b) => b.textContent === "Switch panel");
          if (!popup || !switcher) throw new Error("Missing navigation popup or control");
          switcher.click();
          const result = [];
          for (let i = 0; i < 35; i++) {
            await new Promise(requestAnimationFrame);
            if (i === 4 || i === 8) switcher.click();
            if (i === 16) (popup.querySelector("[data-open] button") as HTMLButtonElement).click();
            const s = getComputedStyle(popup);
            result.push({
              width: popup.getBoundingClientRect().width,
              height: popup.getBoundingClientRect().height,
              scale: s.scale,
              motion: popup.getAttribute("data-motion"),
              animations: popup.getAnimations().map((a) => (a as CSSTransition).transitionProperty),
              same: popup === document.querySelector('[data-slot="navigation-menu-popup"]'),
            });
          }
          return result;
        });
        expect(samples.every((s) => s.same)).toBe(true);
        if (effective === "full")
          expect(samples.some((s) => s.animations.some((p) => p === "width" || p === "height"))).toBe(true);
        else
          expect(
            samples.every((s) => !s.animations.some((p) => p === "width" || p === "height" || p === "scale")),
          ).toBe(true);
        await page.getByLabel("Fixture motion", { exact: true }).selectOption("full");
        await learn.focus();
        await page.keyboard.press("ArrowDown");
        await expect(learn).toHaveAttribute("aria-expanded", "true");
        await expect(popup).toHaveAttribute("data-motion", reducedMotion === "reduce" ? "reduced" : "full");
        await expect.poll(() => popup.evaluate((el) => el.getAnimations().length)).toBe(0);
        const downgrade = await preview.evaluate(async (el) => {
          const popup = document.querySelector('[data-slot="navigation-menu-popup"]');
          const switcher = Array.from(el.querySelectorAll("button")).find((b) => b.textContent === "Switch panel");
          if (!popup || !switcher) throw new Error("Missing navigation popup or control");
          const trigger = Array.from(el.querySelectorAll('[data-slot="navigation-menu-trigger"]')).find(
            (n) => n.textContent?.trim() === "Build",
          ) as HTMLButtonElement;
          trigger.click();
          for (let i = 0; i < 4; i++) await new Promise(requestAnimationFrame);
          const running = popup.getAnimations().length;
          const select = document.querySelector('[aria-label="Fixture motion"]') as HTMLSelectElement;
          select.value = "none";
          select.dispatchEvent(new Event("change", { bubbles: true }));
          for (let i = 0; i < 4; i++) await new Promise(requestAnimationFrame);
          return {
            running,
            remaining: popup.getAnimations().length,
            scale: getComputedStyle(popup).scale,
            same: popup === document.querySelector('[data-slot="navigation-menu-popup"]'),
          };
        });
        if (reducedMotion === "no-preference") expect(downgrade.running).toBeGreaterThan(0);
        expect(downgrade.remaining).toBe(0);
        expect(downgrade.scale).toBe("none");
        expect(downgrade.same).toBe(true);
        await preview.getByRole("button", { name: "Switch panel" }).click();
        await preview.getByLabel("Extra links").check();
        await preview.getByRole("button", { name: "Switch panel" }).click();
        if (reducedMotion === "no-preference") {
          await page.getByLabel("Fixture motion", { exact: true }).selectOption("full");
          await learn.focus();
          await page.keyboard.press("ArrowDown");
          await page.emulateMedia({ reducedMotion: "reduce" });
          await expect(popup).toHaveAttribute("data-motion", "reduced");
          expect(await popup.evaluate((el) => getComputedStyle(el).scale)).toBe("none");
        }
        await page.setViewportSize({ width: 390, height: 900 });
        await expect(popup).toBeVisible();
        const r = await popup.boundingBox();
        if (!r) throw new Error("Missing popup bounds");
        expect(r.x).toBeGreaterThanOrEqual(0);
        expect(r.x + r.width).toBeLessThanOrEqual(390);
        await page.locator("main").click({ position: { x: 2, y: 2 } });
        await expect(popup).toHaveCount(0);
        expect(errors).toEqual([]);
      });
    }
  });
}
for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`navigation menu ${colorScheme}`, () => {
    test.use({ colorScheme });
    test("responsive visual and axe proof", async ({ page }, testInfo) => {
      await page.goto("/components/navigation-menu?motion=none");
      await page.waitForLoadState("networkidle");
      for (const width of [1280, 390]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.locator('[data-preview="navigation-menu"]').getByRole("button", { name: "Build" }).hover();
        await expect(page.locator('[data-slot="navigation-menu-popup"]')).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        expect(
          (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations,
        ).toEqual([]);
        await page.screenshot({ path: testInfo.outputPath(`navigation-menu-${colorScheme}-${width}.png`) });
      }
    });
  });
}
