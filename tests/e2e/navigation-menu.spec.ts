import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { MODES } from "./helpers";
import { openPopupMotionFixture } from "./popup-motion-fixture";

// Base UI's safe polygon temporarily suppresses pointer events on sibling triggers.
// Move the real pointer so its global polygon listener can hand off, before actionability checks.
async function moveToTrigger(page: Page, trigger: Locator) {
  await trigger.scrollIntoViewIfNeeded();
  const box = await trigger.boundingBox();
  if (!box) throw new Error("Missing navigation trigger bounds");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 });
}

type EntranceFrame = { opacity: string; x: number; y: number; scale: number };

/**
 * Samples the popup's presence channels per frame from before the document loads, because
 * the entrance envelope is only a handful of frames. Frames accumulate across the whole
 * test; the first read below contains the first open only.
 */
async function recordEntrance(page: Page) {
  await page.addInitScript((selector: string) => {
    const frames: EntranceFrame[] = [];
    (window as unknown as { entrance: EntranceFrame[] }).entrance = frames;
    const tick = () => {
      const popup = document.querySelector(selector);
      if (popup) {
        const css = getComputedStyle(popup);
        const matrix = css.transform === "none" ? null : new DOMMatrixReadOnly(css.transform);
        frames.push({ opacity: css.opacity, x: matrix?.e ?? 0, y: matrix?.f ?? 0, scale: matrix?.a ?? 1 });
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, '[data-slot="navigation-menu-popup"]');
}

/**
 * Samples the shell's committed box per frame, and every property its own Web
 * Animations write, from before the document loads. A shared shell that consumes a
 * new destination must paint the sizes between the two, not only the frame it lands
 * on; the frame ring is the only honest place to see that.
 */
type ShellFrame = { width: number; height: number; written: string[] };

async function recordShell(page: Page) {
  await page.addInitScript((selector: string) => {
    const frames: { width: number; height: number; written: string[] }[] = [];
    (window as unknown as { shell: typeof frames }).shell = frames;
    const tick = () => {
      const popup = document.querySelector(selector);
      if (popup) {
        const box = popup.getBoundingClientRect();
        // Recipes are Web Animations: the written property is in the effect's
        // keyframes, never `transitionProperty`.
        const written = popup.getAnimations().flatMap((animation) => {
          const keyframes = (animation.effect as KeyframeEffect | null)?.getKeyframes() ?? [];
          return keyframes.flatMap((frame) =>
            Object.keys(frame).filter((key) => !["offset", "computedOffset", "easing", "composite"].includes(key)),
          );
        });
        frames.push({ width: box.width, height: box.height, written });
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, '[data-slot="navigation-menu-popup"]');
}

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test.describe(`navigation menu ${reducedMotion}`, () => {
    test.use({ reducedMotion });
    for (const mode of MODES) {
      test(`interaction and animation ${mode}`, async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (e) => errors.push(e.message));
        await recordEntrance(page);
        await recordShell(page);
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
        // `navigation-menu.popup.enter` is the anchored presence writer: opacity plus one
        // `distance.xs` approach from the resolved side (`bottom` ⇒ negative y) in full, a
        // short opacity-only envelope in reduced, and no transition at all in none. The
        // recipe selects no scale pose, so every mode keeps the popup at its own size.
        const entrance = await page.evaluate(() => (window as unknown as { entrance: EntranceFrame[] }).entrance);
        const travel = entrance.map((f) => Math.max(Math.abs(f.x), Math.abs(f.y)));
        const drift = entrance.map((f) => Math.abs(f.scale - 1));
        expect(entrance.length).toBeGreaterThan(1);
        if (effective === "full") {
          expect(Math.max(...travel)).toBeGreaterThan(0.5);
          // One resolved side, never a diagonal pose.
          expect(entrance.some((f) => Math.abs(f.x) > 0.01 && Math.abs(f.y) > 0.01)).toBe(false);
          expect(Math.abs(entrance.at(-1)?.y ?? Number.POSITIVE_INFINITY)).toBeLessThan(0.5);
        } else expect(Math.max(...travel)).toBeLessThan(0.01);
        expect(Math.max(...drift)).toBeLessThan(0.001);
        const opacity = entrance.map((f) => f.opacity);
        if (effective !== "none") expect(new Set(opacity).size).toBeGreaterThan(1);
        else expect(opacity.every((value) => value === "1")).toBe(true);
        const shellMark = await page.evaluate(() => (window as unknown as { shell: ShellFrame[] }).shell.length);
        const shellFrom = await popup.evaluate((el) => el.getBoundingClientRect().width);
        await moveToTrigger(page, build);
        await expect(build).toHaveAttribute("aria-expanded", "true");
        await expect(popup.getByRole("link", { name: "Templates", exact: true })).toBeVisible();
        // The shell owns width and height around the committed active content: the
        // primitive's destination is consumed and the next panel is never clipped.
        await expect
          .poll(() =>
            popup.evaluate((el) => {
              const active = el.querySelector('[data-slot="navigation-menu-content"][data-open]');
              if (!active) return false;
              const shell = el.getBoundingClientRect();
              const content = active.getBoundingClientRect();
              return shell.width >= content.width - 1 && shell.height >= content.height - 1;
            }),
          )
          .toBe(true);
        // `navigation-menu.viewport.resize` is one measured shell writer: full mode
        // follows the destination through the sizes between the two boxes (the frame
        // the primitive publishes the destination for is the origin the writer
        // replaces, never a one-frame jump), while reduced and none reach it immediately
        // and install no geometry writer at all.
        await expect.poll(() => popup.evaluate((el) => el.getAnimations().length)).toBe(0);
        const shellFrames = await page.evaluate(
          (at) => (window as unknown as { shell: ShellFrame[] }).shell.slice(at),
          shellMark,
        );
        const settled = shellFrames.at(-1)?.width ?? Number.POSITIVE_INFINITY;
        expect(settled).toBeGreaterThan(shellFrom + 10);
        const between = shellFrames.filter((frame) => frame.width > shellFrom + 1 && frame.width < settled - 1);
        if (effective === "full") {
          expect(shellFrames.some((frame) => frame.written.includes("width") && frame.written.includes("height"))).toBe(
            true,
          );
          expect(between.length, "the declared shell tween must paint intermediate sizes").toBeGreaterThan(1);
        } else {
          expect(
            shellFrames.every((frame) => !frame.written.includes("width") && !frame.written.includes("height")),
          ).toBe(true);
          expect(between.length, "reduced and none settle the destination immediately").toBe(0);
        }
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
        // The fixture's panels are keepMounted, so the retained content keeps Base
        // UI's closed popup in the document, hidden.
        await expect(popup).toHaveCount(1);
        await expect(popup).toBeHidden();
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
        // A switch owns paint and the committed shell, not the popup's own entrance: let
        // the first open finish so the sample window contains only the switch cause.
        await expect.poll(() => popup.evaluate((el) => el.getAnimations().length)).toBe(0);
        // Observe the actual shared popup across controlled switch / reversal / content update.
        const samples = await preview.evaluate(async (el) => {
          const popup = document.querySelector('[data-slot="navigation-menu-popup"]');
          const viewport = popup?.querySelector('[data-slot="navigation-menu-viewport"]');
          const switcher = Array.from(el.querySelectorAll("button")).find((b) => b.textContent === "Switch panel");
          if (!popup || !viewport || !switcher) throw new Error("Missing navigation popup, viewport or control");
          // Recipes are Web Animations, so the written property is in the effect's
          // keyframes; `transitionProperty` is undefined for every writer this popup
          // installs, including the geometry owner and the shared content transition.
          const written = (node: Element) =>
            node.getAnimations().flatMap((animation) => {
              const frames = (animation.effect as KeyframeEffect | null)?.getKeyframes() ?? [];
              return frames.flatMap((frame) =>
                Object.keys(frame).filter((key) => !["offset", "computedOffset", "easing", "composite"].includes(key)),
              );
            });
          switcher.click();
          const result = [];
          for (let i = 0; i < 35; i++) {
            await new Promise(requestAnimationFrame);
            if (i === 4 || i === 8) switcher.click();
            if (i === 16) (popup.querySelector("[data-open] button") as HTMLButtonElement).click();
            result.push({
              popup: written(popup),
              viewport: written(viewport),
              motion: popup.getAttribute("data-motion"),
              same: popup === document.querySelector('[data-slot="navigation-menu-popup"]'),
            });
          }
          return result;
        });
        expect(samples.every((s) => s.same)).toBe(true);
        expect(samples.every((s) => s.motion === effective)).toBe(true);
        // The switch paint is one writer on the shared viewport (`content.switch`); the
        // popup never replays its own presence for a switch inside it. On this panel pair
        // the directional travel stays the space-constrained opacity fallback, so full
        // and reduced both resolve to the opacity layer; none installs no writer.
        if (effective !== "none") expect(samples.some((s) => s.viewport.includes("opacity"))).toBe(true);
        else expect(samples.every((s) => s.viewport.length === 0 && s.popup.length === 0)).toBe(true);
        expect(samples.every((s) => !s.popup.includes("opacity") && !s.popup.includes("transform"))).toBe(true);
        // reduced and none install no geometry transition at all; the full-mode shell
        // tween over a destination the primitive supplies is asserted above.
        if (effective !== "full")
          expect(samples.every((s) => !s.popup.some((p) => p === "width" || p === "height" || p === "scale"))).toBe(
            true,
          );
        await page.getByLabel("Fixture motion", { exact: true }).selectOption("full");
        await learn.focus();
        await page.keyboard.press("ArrowDown");
        await expect(learn).toHaveAttribute("aria-expanded", "true");
        await expect(popup).toHaveAttribute("data-motion", reducedMotion === "reduce" ? "reduced" : "full");
        await expect.poll(() => popup.evaluate((el) => el.getAnimations().length)).toBe(0);
        // Base UI queues measurement before its resize; wait for the active panel's auto-size reset.
        await expect
          .poll(() =>
            popup.evaluate((el) => {
              const active = el.querySelector('[data-slot="navigation-menu-content"][data-open]');
              return (
                !!active?.querySelector('a[href="#installation"]') &&
                el.style.getPropertyValue("--popup-width") === "auto" &&
                el.style.getPropertyValue("--popup-height") === "auto" &&
                el.getAnimations().length === 0
              );
            }),
          )
          .toBe(true);
        // A live downgrade must cancel the writer it interrupts, so sample a genuine popup
        // entrance: a trigger click while the menu is open on a sibling is a content switch
        // (viewport paint plus the committed shell) and installs no popup animation at all.
        await page.locator("main").click({ position: { x: 2, y: 2 } });
        await expect(popup).toBeHidden();
        await learn.click();
        await expect(learn).toHaveAttribute("aria-expanded", "true");
        const downgrade = await page.evaluate(async () => {
          const popup = document.querySelector('[data-slot="navigation-menu-popup"]') as HTMLElement;
          await new Promise(requestAnimationFrame);
          const running = popup.getAnimations().length;
          const select = document.querySelector('[aria-label="Fixture motion"]') as HTMLSelectElement;
          select.value = "none";
          select.dispatchEvent(new Event("change", { bubbles: true }));
          for (let i = 0; i < 4; i++) await new Promise(requestAnimationFrame);
          return {
            running,
            remaining: popup.getAnimations().length,
            motion: popup.getAttribute("data-motion"),
            scale: getComputedStyle(popup).scale,
            same: popup === document.querySelector('[data-slot="navigation-menu-popup"]'),
          };
        });
        if (reducedMotion === "no-preference") expect(downgrade.running).toBeGreaterThan(0);
        expect(downgrade.remaining).toBe(0);
        expect(downgrade.motion).toBe("none");
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
        // setViewportSize can resolve before the positioner's resize update.
        await expect
          .poll(async () => {
            const bounds = await popup.boundingBox();
            return bounds ? Math.max(-bounds.x, bounds.x + bounds.width - 390) : Number.POSITIVE_INFINITY;
          })
          .toBeLessThanOrEqual(0);
        const r = await popup.boundingBox();
        if (!r) throw new Error("Missing popup bounds");
        expect(r.x).toBeGreaterThanOrEqual(0);
        expect(r.x + r.width).toBeLessThanOrEqual(390);
        await page.locator("main").click({ position: { x: 2, y: 2 } });
        await expect(popup).toBeHidden();
        expect(errors).toEqual([]);
      });
    }
  });
}
for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`navigation menu ${colorScheme}`, () => {
    test.use({ colorScheme });
    test("responsive visual and axe proof", async ({ page }, testInfo) => {
      // A whole-page WCAG scan at two widths runs over the docs route's full component
      // catalogue; under a parallel suite that is minutes of CPU, not the 30 s default.
      test.setTimeout(120_000);
      await page.goto("/components/navigation-menu?motion=none");
      await page.waitForLoadState("networkidle");
      // The mode arrives through a mount effect and the server always renders `full`, so
      // the attribute is the only honest hydration signal on this route. It is asserted
      // with this route's own budget: `openComponent` stops at 15 s, which a fully
      // parallel run of this heavy page can outlast, and a hover that lands first stays
      // resting on a trigger whose accept-open listener does not exist yet.
      const trigger = page.locator('[data-preview="navigation-menu"] [data-slot="navigation-menu-trigger"]').first();
      await expect(trigger).toHaveAttribute("data-motion", "none", { timeout: 60_000 });
      const preview = page.locator('[data-preview="navigation-menu"]');
      const build = preview.getByRole("button", { name: "Build" });
      for (const width of [1280, 390]) {
        await page.setViewportSize({ width, height: 1000 });
        await moveToTrigger(page, build);
        await expect(build).toHaveAttribute("aria-expanded", "true");
        const popup = page.locator('[data-slot="navigation-menu-popup"]:visible');
        await expect(popup).toBeVisible();
        // Scan a resting surface: an entrance still in flight is not what axe certifies.
        await expect.poll(() => popup.evaluate((el) => el.getAnimations().length)).toBe(0);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        expect(
          (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations,
        ).toEqual([]);
        await page.screenshot({ path: testInfo.outputPath(`navigation-menu-${colorScheme}-${width}.png`) });
      }
    });
  });
}
