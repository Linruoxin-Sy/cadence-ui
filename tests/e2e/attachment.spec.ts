import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { effectiveMode, MODES, pressScale } from "./helpers";

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test.describe(`attachment ${reducedMotion}`, () => {
    test.use({ reducedMotion });
    for (const mode of MODES) {
      test(`state native input actions and live motion ${mode}`, async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (e) => errors.push(e.message));
        await page.goto(`/components/attachment?motion=none`);
        await page.waitForLoadState("networkidle");
        const p = page.locator('[data-preview="attachment"]');
        await expect
          .poll(() =>
            p.getByRole("img", { name: "Interface diagram" }).evaluate((el) => (el as HTMLImageElement).naturalWidth),
          )
          .toBeGreaterThan(0);
        await p.getByLabel("Attachment motion").selectOption(mode);
        const root = p.getByTestId("live-attachment");
        const title = root.locator('[data-slot="attachment-title"]');
        const actual = effectiveMode(mode, reducedMotion === "reduce");
        await expect(root).toHaveAttribute("data-motion", actual);
        await expect(title).toHaveAttribute("data-motion", actual);
        const frames = await title.evaluate(async (el) => {
          const frames = [];
          for (let i = 0; i < 22; i++) {
            await new Promise(requestAnimationFrame);
            const s = getComputedStyle(el);
            frames.push({
              opacity: Number(s.opacity),
              transform: s.transform,
              duration: s.transitionDuration,
              animations: el.getAnimations().length,
            });
          }
          (window as unknown as { attachmentTitle: Element }).attachmentTitle = el;
          return frames;
        });
        expect(frames.every((f) => f.transform === "none" && f.duration === "0s")).toBe(true);
        if (actual === "none") expect(frames.every((f) => f.opacity === 1 && f.animations === 0)).toBe(true);
        else expect(new Set(frames.map((f) => f.opacity)).size).toBeGreaterThan(2);
        const scale = await pressScale(page, '[data-preview="attachment"] [data-slot="attachment-action"]');
        if (actual === "full") expect(scale).toBeLessThan(1);
        else expect(scale).toBe(1);
        // Pointer up activates remove: reset gives a fresh card for the continuity checks.
        await p.getByRole("button", { name: "Reset attachment" }).click();
        await root.getByRole("button", { name: "Inspect sales-dashboard.pdf" }).focus();
        await page.keyboard.press("Enter");
        await expect(p.getByRole("status")).toHaveText("Inspecting sales-dashboard.pdf");
        await root.getByRole("button", { name: "Inspect sales-dashboard.pdf" }).click();
        const liveTitle = root.locator('[data-slot="attachment-title"]');
        await liveTitle.evaluate((el) => {
          (window as unknown as { retainedTitle: Element }).retainedTitle = el;
        });
        for (const state of ["processing", "done", "error", "idle", "uploading"]) {
          await p.getByLabel("State", { exact: true }).selectOption(state);
          await expect(root).toHaveAttribute("data-state", state);
          const animations = await liveTitle.evaluate((el) => el.getAnimations().length);
          if (!["uploading", "processing"].includes(state) || actual === "none") expect(animations).toBe(0);
        }
        await p.getByLabel("Attachment motion").selectOption("none");
        const stopped = await liveTitle.evaluate((el) => ({
          opacity: getComputedStyle(el).opacity,
          animations: el.getAnimations().length,
          same: el === (window as unknown as { retainedTitle: Element }).retainedTitle,
        }));
        expect(stopped).toEqual({ opacity: "1", animations: 0, same: true });
        await p.getByLabel("Attachment motion").selectOption("full");
        await expect(liveTitle).toHaveAttribute("data-motion", reducedMotion === "reduce" ? "reduced" : "full");
        expect(await liveTitle.evaluate((el) => el.getAnimations().length)).toBe(1);
        await page.emulateMedia({ reducedMotion: "reduce" });
        await expect(liveTitle).toHaveAttribute("data-motion", "reduced");
        await p.getByLabel("Size", { exact: true }).selectOption("xs");
        await p.getByLabel("Vertical", { exact: true }).check();
        await page.setViewportSize({ width: 390, height: 1000 });
        await expect(root).toHaveAttribute("data-orientation", "vertical");
        expect(
          await liveTitle.evaluate((el) => el === (window as unknown as { retainedTitle: Element }).retainedTitle),
        ).toBe(true);
        // Native File input owns FileList and browser form semantics, no request is made.
        await p.getByLabel("Choose a local file (name only)").setInputFiles({
          name: "a-long-selected-local-filename.txt",
          mimeType: "text/plain",
          buffer: Buffer.from("local file"),
        });
        await expect(liveTitle).toHaveText("a-long-selected-local-filename.txt");
        await expect(root).toHaveAttribute("data-state", "idle");
        const trigger = root.getByRole("button", { name: "Inspect a-long-selected-local-filename.txt" });
        await trigger.focus();
        await page.keyboard.press("Tab");
        await expect(root.getByRole("button", { name: "Remove a-long-selected-local-filename.txt" })).toBeFocused();
        await page.keyboard.press(" ");
        await expect(root).toHaveCount(0);
        await expect(p.getByRole("status")).toContainText("Removed");
        const group = p.getByRole("group", { name: "Reference files" });
        await group.focus();
        await page.keyboard.press("ArrowRight");
        await expect.poll(() => group.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
        await group.getByRole("link").last().focus();
        await page.keyboard.press("Enter");
        await expect(page).toHaveURL(/#attachment-details$/);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        expect(errors).toEqual([]);
      });
    }
  });
}
for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`attachment ${colorScheme}`, () => {
    test.use({ colorScheme });
    test("full page axe responsive variants and screenshots", async ({ page }) => {
      await page.goto("/components/attachment?motion=none");
      await page.waitForLoadState("networkidle");
      const p = page.locator('[data-preview="attachment"]');
      await p.getByLabel("Attachment motion").selectOption("none");
      await expect(page.locator("html")).toHaveClass(colorScheme === "dark" ? /dark/ : /^(?!.*dark)/);
      for (const width of [1280, 390]) {
        await page.setViewportSize({ width, height: 1100 });
        for (const vertical of [false, true]) {
          await p.getByLabel("Vertical", { exact: true }).setChecked(vertical);
          for (const size of ["default", "sm", "xs"]) {
            await p.getByLabel("Size", { exact: true }).selectOption(size);
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
          }
          expect(
            (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations,
          ).toEqual([]);
        }
        await p.getByLabel("Vertical", { exact: true }).uncheck();
        await p.getByLabel("Size", { exact: true }).selectOption("default");
        await page.screenshot({
          path: `.cache/attachment-proof/attachment-${colorScheme}-${width}.png`,
          fullPage: true,
        });
        await p.screenshot({ path: `.cache/attachment-proof/preview-${colorScheme}-${width}.png` });
      }
    });
  });
}
