import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { effectiveMode, MODES } from "./helpers";

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test.describe(`bubble ${reducedMotion}`, () => {
    test.use({ reducedMotion });
    for (const mode of MODES)
      test(`entry and stable updates ${mode}`, async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (e) => errors.push(e.message));
        await page.goto("/components/bubble?motion=none");
        await page.waitForLoadState("networkidle");
        const p = page.locator('[data-preview="bubble"]');
        await p.getByLabel("Bubble motion").selectOption(mode);
        const actual = effectiveMode(mode, reducedMotion === "reduce");
        const root = p.getByTestId("reply-0");
        await expect(root).toHaveAttribute("data-motion", actual);
        // Install a MutationObserver before the actual React append, sampling the first style frame.
        await p.evaluate((el) => {
          const w = window as unknown as {
            entry: Promise<{ opacity: number; transform: string; duration: string; animations: number }[]>;
          };
          w.entry = new Promise((resolve) => {
            const observer = new MutationObserver(() => {
              const node = el.querySelector('[data-testid="reply-1"]');
              if (!node) return;
              observer.disconnect();
              const frames: { opacity: number; transform: string; duration: string; animations: number }[] = [];
              const sample = () => {
                const s = getComputedStyle(node);
                frames.push({
                  opacity: Number(s.opacity),
                  transform: s.transform,
                  duration: s.transitionDuration,
                  animations: node.getAnimations().length,
                });
                if (frames.length < 30) requestAnimationFrame(sample);
                else resolve(frames);
              };
              sample();
            });
            observer.observe(el, { subtree: true, childList: true });
          });
        });
        await p.getByRole("button", { name: "Add reply", exact: true }).click();
        const frames = await page.evaluate(
          () =>
            (
              window as unknown as {
                entry: Promise<{ opacity: number; transform: string; duration: string; animations: number }[]>;
              }
            ).entry,
        );
        expect(frames.every((f) => f.transform === "none")).toBe(true);
        const duration = actual === "none" ? "0s" : actual === "reduced" ? "0.528s" : "0.88s";
        expect(frames.every((f) => f.duration === duration)).toBe(true);
        if (actual === "none") expect(frames.every((f) => f.opacity === 1 && f.animations === 0)).toBe(true);
        else {
          expect(Math.min(...frames.map((f) => f.opacity))).toBeLessThan(0.9);
          expect(new Set(frames.map((f) => f.opacity)).size).toBeGreaterThan(2);
        }
        const action = p.getByRole("button", { name: "Show the review checklist" });
        await action.focus();
        await page.keyboard.press("Enter");
        await expect(p.getByRole("status")).toHaveText("Reply selected.");
        await root.evaluate((el) => {
          (window as unknown as { bubble: Element }).bubble = el;
        });
        await p.getByRole("button", { name: "Append text" }).evaluate((el: HTMLButtonElement) => el.click());
        await expect(action).toBeFocused();
        await expect(root).toContainText("Another local chunk.");
        expect(await root.evaluate((el) => el === (window as unknown as { bubble: Element }).bubble)).toBe(true);
        for (const variant of ["default", "secondary", "muted", "tinted", "outline", "ghost", "destructive"]) {
          await p.getByLabel("Variant", { exact: true }).selectOption(variant);
          await expect(root).toHaveAttribute("data-variant", variant);
        }
        await p.getByLabel("Alignment", { exact: true }).selectOption("end");
        await p.getByLabel("Alignment", { exact: true }).selectOption("start");
        await p.getByRole("button", { name: "Thumbs up", exact: true }).focus();
        await page.keyboard.press(" ");
        await expect(p.getByRole("button", { name: "Thumbs up", exact: true })).toHaveAttribute("aria-pressed", "true");
        // Downgrade during a newly mounted reply's fade, preserving the same DOM node.
        await p.getByLabel("Bubble motion").selectOption("full");
        await p.getByRole("button", { name: "Add reply", exact: true }).click();
        const live = p.getByTestId("reply-2");
        await live.evaluate((el) => {
          (window as unknown as { live: Element }).live = el;
        });
        await p.getByLabel("Bubble motion").selectOption("none");
        expect(
          await live.evaluate((el) => ({
            same: el === (window as unknown as { live: Element }).live,
            opacity: getComputedStyle(el).opacity,
            animations: el.getAnimations().length,
            duration: getComputedStyle(el).transitionDuration,
          })),
        ).toEqual({ same: true, opacity: "1", animations: 0, duration: "0s" });
        await p.getByLabel("Bubble motion").selectOption("full");
        await page.emulateMedia({ reducedMotion: "reduce" });
        await expect(live).toHaveAttribute("data-motion", "reduced");
        await page.setViewportSize({ width: 390, height: 1000 });
        expect(await root.evaluate((el) => el === (window as unknown as { bubble: Element }).bubble)).toBe(true);
        await p.getByRole("link", { name: "Read bubble details" }).focus();
        await page.keyboard.press("Enter");
        await expect(page).toHaveURL(/#bubble-details$/);
        expect(errors).toEqual([]);
      });
  });
}
for (const colorScheme of ["light", "dark"] as const)
  test.describe(`bubble ${colorScheme}`, () => {
    test.use({ colorScheme });
    test("responsive variants full page axe and screenshots", async ({ page }) => {
      await page.goto("/components/bubble?motion=none");
      await page.waitForLoadState("networkidle");
      const p = page.locator('[data-preview="bubble"]');
      await p.getByLabel("Bubble motion").selectOption("none");
      await expect(page.locator("html")).toHaveClass(colorScheme === "dark" ? /dark/ : /^(?!.*dark)/);
      for (const width of [1280, 390]) {
        await page.setViewportSize({ width, height: 1100 });
        for (const variant of ["default", "secondary", "muted", "tinted", "outline", "ghost", "destructive"]) {
          await p.getByLabel("Variant", { exact: true }).selectOption(variant);
          for (const side of ["top", "bottom"]) {
            await p.getByLabel("Reaction side").selectOption(side);
            for (const align of ["start", "end"]) {
              await p.getByLabel("Alignment", { exact: true }).selectOption(align);
              await p.getByLabel("Reaction alignment").selectOption(align);
              expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
            }
          }
          expect(
            (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations,
          ).toEqual([]);
        }
        await p.getByLabel("Variant", { exact: true }).selectOption("muted");
        await p.getByLabel("Alignment", { exact: true }).selectOption("start");
        await page.screenshot({ path: `.cache/bubble-proof/bubble-${colorScheme}-${width}.png`, fullPage: true });
        await p.screenshot({ path: `.cache/bubble-proof/preview-${colorScheme}-${width}.png` });
      }
    });
  });
// The early B9 item has mode tests in motion-matrix; add the complete-page visual gate here.
for (const colorScheme of ["light", "dark"] as const)
  test.describe(`code-block B9 ${colorScheme}`, () => {
    test.use({ colorScheme });
    test("responsive full page axe and screenshots", async ({ page }) => {
      await page.goto("/components/code-block?motion=none");
      await page.waitForLoadState("networkidle");
      for (const width of [1280, 390]) {
        await page.setViewportSize({ width, height: 1100 });
        expect(
          (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations,
        ).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.screenshot({ path: `.cache/bubble-proof/code-block-${colorScheme}-${width}.png`, fullPage: true });
        await page
          .locator('[data-preview="code-block"]')
          .screenshot({ path: `.cache/bubble-proof/code-preview-${colorScheme}-${width}.png` });
        // Edge can repeat pixels in a capture taller than its raster surface.
        // Overlapping viewport tiles preserve readable proof of the entire long mobile page.
        if (width === 390) {
          await page.setViewportSize({ width, height: 5000 });
          const height = await page.evaluate(() => document.documentElement.scrollHeight);
          for (let y = 0, tile = 0; y < height; y += 4500, tile++) {
            await page.evaluate((top) => scrollTo(0, top), y);
            await page.screenshot({ path: `.cache/bubble-proof/code-block-${colorScheme}-390-tile-${tile}.png` });
          }
        }
      }
    });
  });
