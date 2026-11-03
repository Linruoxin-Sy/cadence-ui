import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { effectiveMode, MODES, openComponent, pressScale, scoped } from "./helpers";

const examples: Record<string, string[]> = JSON.parse(await readFile("components/site/previews/examples.json", "utf8"));

const IDS = [
  "button",
  "badge",
  "kbd",
  "separator",
  "label",
  "input",
  "textarea",
  "card",
  "aspect-ratio",
  "avatar",
  "skeleton",
];
for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`B1 ${colorScheme}`, () => {
    test.use({ colorScheme });
    for (const id of IDS)
      test(`${id} complete page visual and accessibility`, async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (e) => errors.push(e.message));
        // Deterministic loaded image, plus the preview's independent real error fallback.
        await page.route("https://github.com/shadcn.png", (route) =>
          route.fulfill({
            contentType: "image/svg+xml",
            body: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="#334155"/></svg>',
          }),
        );
        await page.goto(`/components/${id}?motion=none`);
        await page.waitForLoadState("networkidle");
        await expect(page.locator("html")).toHaveClass(colorScheme === "dark" ? /dark/ : /^(?!.*dark)/);
        for (const width of [1280, 390]) {
          await page.setViewportSize({ width, height: 1100 });
          expect(
            (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations,
          ).toEqual([]);
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
          await page.screenshot({ path: `.cache/b1-proof/${id}-${colorScheme}-${width}.png`, fullPage: true });
          await page
            .locator(`[data-preview="${id}"]`)
            .screenshot({ path: `.cache/b1-proof/${id}-${colorScheme}-${width}-preview.png` });
          for (const name of examples[id] ?? [])
            await page.locator(`[data-component-example="${id}/${name}"]`).screenshot({
              path: `.cache/b1-proof/${id}-${colorScheme}-${width}-${name}.png`,
            });
          if (id === "kbd") {
            const trigger = page.locator('[data-component-example="kbd/tooltip"] button');
            await trigger.focus();
            await expect(page.getByRole("tooltip")).toBeVisible();
            expect(
              (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations,
            ).toEqual([]);
            await page
              .getByRole("tooltip")
              .screenshot({ path: `.cache/b1-proof/kbd-${colorScheme}-${width}-tooltip-open.png` });
            await trigger.press("Escape");
            await trigger.blur();
          }
        }
        expect(errors).toEqual([]);
      });
  });
}
for (const reducedMotion of ["no-preference", "reduce"] as const)
  test.describe(`B1 ${reducedMotion}`, () => {
    test.use({ reducedMotion });
    for (const mode of MODES) {
      test(`skeleton real continuous opacity ${mode}`, async ({ page }) => {
        const actual = effectiveMode(mode, reducedMotion === "reduce");
        await openComponent(page, "skeleton", mode, "skeleton", actual);
        const el = page.locator(scoped("skeleton", '[data-slot="skeleton"]')).first();
        const samples = await el.evaluate(async (node) => {
          const frames: { opacity: number; transform: string; name: string }[] = [];
          // Sample a whole real CSS cycle, independent of monitor refresh rate.
          const duration = Number.parseFloat(getComputedStyle(node).animationDuration) * 1000;
          const end = performance.now() + (duration > 0 ? duration + 100 : 100);
          while (performance.now() < end) {
            await new Promise(requestAnimationFrame);
            const s = getComputedStyle(node);
            frames.push({ opacity: Number(s.opacity), transform: s.transform, name: s.animationName });
          }
          return frames;
        });
        expect(samples.every((s) => s.transform === "none")).toBe(true);
        if (actual === "none") expect(samples.every((s) => s.opacity === 1 && s.name === "none")).toBe(true);
        else
          expect(
            Math.max(...samples.map((s) => s.opacity)) - Math.min(...samples.map((s) => s.opacity)),
          ).toBeGreaterThan(0.4);
        await el.evaluate((node) => {
          (window as unknown as { original: Element }).original = node;
        });
        const select = page.getByLabel("Skeleton motion");
        await select.selectOption("none");
        expect(
          await el.evaluate((node) => ({
            same: node === (window as unknown as { original: Element }).original,
            opacity: getComputedStyle(node).opacity,
            animations: node.getAnimations().length,
          })),
        ).toEqual({ same: true, opacity: "1", animations: 0 });
        // Explicit full restores this subtree inside an outer none scope.
        await page
          .getByRole("group", { name: "Motion mode" })
          .getByRole("button", { name: "none", exact: true })
          .click();
        await select.selectOption("full");
        await expect(el).toHaveAttribute("data-motion", effectiveMode("full", reducedMotion === "reduce"));
        expect(await el.evaluate((node) => node.getAnimations().length)).toBe(1);
        await page.emulateMedia({ reducedMotion: "reduce" });
        await expect(el).toHaveAttribute("data-motion", "reduced");
      });
      test(`button press and keyboard ${mode}`, async ({ page }) => {
        const actual = effectiveMode(mode, reducedMotion === "reduce");
        await openComponent(page, "button", mode, "button", actual);
        const selector = scoped("button", '[data-slot="button"]');
        const scale = await pressScale(page, selector);
        if (actual === "full") expect(scale).toBeLessThan(0.99);
        else expect(scale).toBe(1);
        const button = page.locator(selector).first();
        await button.focus();
        await page.keyboard.press("Enter");
        await page.keyboard.press(" ");
        await expect(button).toBeFocused();
        expect(await button.evaluate((node) => getComputedStyle(node).boxShadow)).not.toBe("none");
        const modeSwitch = page.getByRole("group", { name: "Motion mode" });
        await modeSwitch.getByRole("button", { name: "full", exact: true }).click();
        await button.evaluate((node) => {
          (window as unknown as { original: Element }).original = node;
        });
        const box = await button.boundingBox();
        if (!box) throw Error("button box");
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(80);
        // Change the provider without releasing the held pointer first.
        await modeSwitch
          .getByRole("button", { name: "none", exact: true })
          .evaluate((node: HTMLButtonElement) => node.click());
        await expect(button).toHaveAttribute("data-motion", "none");
        await expect
          .poll(() => button.evaluate((node) => getComputedStyle(node).transform))
          .toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
        await page.mouse.up();
        expect(await button.evaluate((node) => node === (window as unknown as { original: Element }).original)).toBe(
          true,
        );
        await page
          .getByRole("group", { name: "Motion mode" })
          .getByRole("button", { name: "none", exact: true })
          .click();
        await modeSwitch.getByRole("button", { name: "full", exact: true }).click();
        const restored = await pressScale(page, selector);
        if (reducedMotion === "no-preference") expect(restored).toBeLessThan(0.99);
        else expect(restored).toBe(1);
      });
    }
  });
for (const preference of ["no-preference", "reduce"] as const)
  test.describe(`B1 static ${preference}`, () => {
    test.use({ reducedMotion: preference });
    for (const mode of MODES)
      test(`B1 native interaction and static surfaces ${mode}`, async ({ page }) => {
        for (const id of [
          "input",
          "textarea",
          "label",
          "badge",
          "separator",
          "avatar",
          "aspect-ratio",
          "kbd",
          "card",
        ]) {
          await page.goto(`/components/${id}?motion=${mode}`);
          await page.waitForLoadState("networkidle");
          const p = page.locator(`[data-preview="${id}"]`);
          if (id === "input" || id === "textarea") {
            const field = p.getByRole("textbox", { name: id === "input" ? "Workspace" : "Comment", exact: true });
            await field.fill("cadence");
            await field.press("Home");
            await field.press("Shift+ArrowRight");
            await field.evaluate((node) => {
              (window as unknown as { field: Element }).field = node;
            });
            await page.setViewportSize({ width: 390, height: 1000 });
            await expect(field).toBeFocused();
            await expect(field).toHaveValue("cadence");
            expect(
              await field.evaluate((node: HTMLInputElement) => ({
                same: node === (window as unknown as { field: Element }).field,
                start: node.selectionStart,
                end: node.selectionEnd,
              })),
            ).toEqual({ same: true, start: 0, end: 1 });
            if (id === "input")
              await page
                .locator('[data-component-example="input/file"]')
                .getByLabel("Image", { exact: true })
                .setInputFiles({ name: "proof.png", mimeType: "image/png", buffer: Buffer.from("file") });
            await expect(p.getByRole("textbox", { name: "Disabled", exact: true })).toBeDisabled();
          }
          if (id === "label") {
            await p.getByText("Email", { exact: true }).click();
            await expect(p.getByRole("textbox", { name: "Email", exact: true })).toBeFocused();
            const box = p.getByRole("checkbox", { name: "Email me about releases" });
            await p.getByText("Email me about releases").click();
            await expect(box).not.toBeChecked();
            await box.focus();
            await box.press(" ");
            await expect(box).toBeChecked();
          }
          if (id === "badge") {
            const link = page
              .locator('[data-component-example="badge/link"]')
              .getByRole("link", { name: "3 releases" });
            await link.focus();
            await link.press("Enter");
            await expect(page).toHaveURL(/\/docs\/changelog$/);
            await page.goBack();
          }
          if (id === "separator") {
            await expect(p.getByRole("separator")).toHaveCount(2);
            for (const rule of await p.locator('[data-orientation="vertical"]').all()) {
              expect(await rule.evaluate((node) => node.getBoundingClientRect().height)).toBeGreaterThan(0);
            }
            await expect(
              page.locator(
                '[data-component-example="separator/decorative"] [aria-hidden="true"][data-slot="separator"]',
              ),
            ).toHaveCount(1);
          }
          if (id === "avatar") await expect(p.getByText("GH", { exact: true }).first()).toBeVisible();
          if (id === "aspect-ratio") {
            for (const box of await p.locator('[data-slot="aspect-ratio"]').all())
              expect(
                await box.evaluate((node) => {
                  const s = getComputedStyle(node);
                  return Math.abs(node.clientWidth / node.clientHeight - Number(s.getPropertyValue("--ratio"))) < 0.05;
                }),
              ).toBe(true);
          }
          if (id === "card") {
            const fit = p.getByTestId("fit-card");
            const before = await fit.evaluate((node) => node.getBoundingClientRect().height);
            await fit.evaluate((node) => {
              (window as unknown as { fit: Element }).fit = node;
            });
            const toggle = p.getByRole("button", { name: "Toggle content" });
            await toggle.focus();
            await toggle.press("Enter");
            await expect
              .poll(() => fit.evaluate((node) => node.getBoundingClientRect().height))
              .toBeGreaterThan(before);
            await expect(toggle).toBeFocused();
            await page.setViewportSize({ width: 390, height: 1000 });
            await expect
              .poll(() =>
                fit.evaluate((node) =>
                  Math.abs(
                    node.getBoundingClientRect().height -
                      (node.querySelector('[data-slot="card-flow"]')?.getBoundingClientRect().height ?? 0) -
                      2,
                  ),
                ),
              )
              .toBeLessThan(1);
            expect(await fit.evaluate((node) => node === (window as unknown as { fit: Element }).fit)).toBe(true);
            for (let i = 0; i < 4; i++) await toggle.click();
          }
          if (id === "kbd") await expect(p.locator("kbd").first()).not.toHaveAttribute("tabindex");
          // Static T0 parts have no transform/opacity animation, independent of the page mode.
          expect(
            await p
              .locator(`[data-slot="${id}"]`)
              .first()
              .evaluate(
                (node) =>
                  node
                    .getAnimations()
                    .filter(
                      (a) =>
                        a.effect instanceof KeyframeEffect &&
                        a.effect.getKeyframes().some((k) => "transform" in k || "opacity" in k),
                    ).length,
              ),
          ).toBe(0);
          await page.setViewportSize({ width: 1280, height: 1000 });
        }
      });
  });
