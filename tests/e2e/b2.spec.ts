import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { effectiveMode, MODES, openComponent, pressScale } from "./helpers";

const examples: Record<string, string[]> = JSON.parse(await readFile("components/site/previews/examples.json", "utf8"));

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test.describe(`B2 ${reducedMotion}`, () => {
    test.use({ reducedMotion });
    for (const mode of MODES) {
      test(`spinner real rotation and live mode ${mode}`, async ({ page }) => {
        await page.addInitScript(() => {
          const store = window as unknown as { firstStatic: { transform: string; animations: number }[] };
          store.firstStatic = [];
          const observer = new MutationObserver(() => {
            const node = document.querySelector('[data-testid="static-spinner"]');
            if (node && store.firstStatic.length === 0) {
              store.firstStatic.push({
                transform: getComputedStyle(node).transform,
                animations: node.getAnimations().length,
              });
            }
          });
          observer.observe(document, { childList: true, subtree: true });
        });
        const actual = effectiveMode(mode, reducedMotion === "reduce");
        await openComponent(page, "spinner", mode, "spinner", actual);
        const spinner = page.locator('[data-preview="spinner"] [data-slot="spinner"]').first();
        const sample = () =>
          spinner.evaluate(async (node) => {
            const frames: { transform: string; opacity: string; animations: number }[] = [];
            const end = performance.now() + 250;
            while (performance.now() < end) {
              await new Promise(requestAnimationFrame);
              const s = getComputedStyle(node);
              frames.push({ transform: s.transform, opacity: s.opacity, animations: node.getAnimations().length });
            }
            return frames;
          });
        const frames = await sample();
        expect(await page.evaluate(() => (window as unknown as { firstStatic: unknown[] }).firstStatic)).toEqual([
          { transform: "none", animations: 0 },
        ]);
        expect(frames.every((s) => s.opacity === "1")).toBe(true);
        if (actual === "none") expect(frames.every((s) => s.transform === "none" && s.animations === 0)).toBe(true);
        else {
          expect(new Set(frames.map((s) => s.transform)).size).toBeGreaterThan(3);
          expect(frames.every((s) => s.animations === 1)).toBe(true);
        }
        await spinner.evaluate((node) => {
          (window as unknown as { spinner: Element }).spinner = node;
        });
        const select = page.getByLabel("Spinner motion");
        await select.selectOption("none");
        expect((await sample()).every((s) => s.transform === "none" && s.animations === 0)).toBe(true);
        await page
          .getByRole("group", { name: "Motion mode" })
          .getByRole("button", { name: "none", exact: true })
          .click();
        await select.selectOption("full");
        await expect(spinner).toHaveAttribute("data-motion", effectiveMode("full", reducedMotion === "reduce"));
        expect(new Set((await sample()).map((s) => s.transform)).size).toBeGreaterThan(3);
        await page.emulateMedia({ reducedMotion: "reduce" });
        await expect(spinner).toHaveAttribute("data-motion", "reduced");
        expect(await spinner.evaluate((node) => node === (window as unknown as { spinner: Element }).spinner)).toBe(
          true,
        );
      });
      test(`native controls, navigation and static surfaces ${mode}`, async ({ page }) => {
        for (const id of [
          "alert",
          "empty",
          "item",
          "field",
          "button-group",
          "input-group",
          "breadcrumb",
          "pagination",
        ]) {
          await page.goto(`/components/${id}?motion=${mode}`);
          await page.waitForLoadState("networkidle");
          const p = page.locator(`[data-preview="${id}"]`);
          if (id === "field" || id === "input-group") {
            const input = p.getByRole("textbox", {
              name: id === "field" ? "Company" : "Search components",
              exact: true,
            });
            if (id === "field") {
              await p.getByText("Company", { exact: true }).click();
              await expect(input).toBeFocused();
            } else {
              await p.locator('[data-slot="input-group-addon"]').first().click();
              await expect(input).toBeFocused();
            }
            await input.fill("cadence");
            await input.press("Home");
            await input.press("Shift+ArrowRight");
            await input.evaluate((node) => {
              (window as unknown as { field: Element }).field = node;
            });
            await page.setViewportSize({ width: 390, height: 1000 });
            await expect(input).toBeFocused();
            expect(
              await input.evaluate((node: HTMLInputElement) => [
                node === (window as unknown as { field: Element }).field,
                node.selectionStart,
                node.selectionEnd,
              ]),
            ).toEqual([true, 0, 1]);
            await expect(
              id === "field"
                ? page.locator('[data-component-example="field/caller-error"] [aria-invalid="true"]')
                : p.locator('[aria-invalid="true"]'),
            ).toHaveCount(1);
            if (id === "field") {
              const responsive = page
                .locator('[data-component-example="field/responsive"] [data-orientation="responsive"]')
                .first();
              expect(await responsive.evaluate((node) => getComputedStyle(node).flexDirection)).toBe("column");
              const error = page.locator('[data-component-example="field/caller-error"]');
              const vat = error.getByRole("textbox", { name: "VAT number" });
              await vat.fill("supplied-value");
              for (let i = 0; i < 4; i++) {
                await error.getByRole("button", { name: "Toggle supplied error" }).click();
                await expect(vat).toHaveAttribute("aria-invalid", i % 2 === 0 ? "false" : "true");
              }
              await expect(vat).toHaveValue("supplied-value");
              await expect(error.locator('[data-slot="field-error"]')).toBeVisible();
              await page.setViewportSize({ width: 1280, height: 1000 });
              expect(await responsive.evaluate((node) => getComputedStyle(node).flexDirection)).toBe("row");
            }
          }
          if (id === "item") {
            const row = page.locator('[data-component-example="item/whole-row-link"]').getByRole("link");
            await row.focus();
            await row.press("Enter");
            await expect(page).toHaveURL(/\/docs\/installation$/);
            await page.goBack();
            await page.waitForLoadState("networkidle");
          }
          if (["breadcrumb", "pagination"].includes(id)) {
            const link = p.locator("a[href]").first();
            await link.focus();
            await link.press("Enter");
            await expect(page).toHaveURL(new RegExp(`#${id}$`));
            if (id !== "item") await expect(p.locator('[aria-current="page"]').first()).toBeVisible();
          }
          const buttons = p.getByRole("button");
          if (await buttons.count()) {
            await buttons.first().scrollIntoViewIfNeeded();
            const scale = await pressScale(page, `[data-preview="${id}"] [data-slot="button"]`);
            if (effectiveMode(mode, reducedMotion === "reduce") === "full") expect(scale).toBeLessThan(0.99);
            else expect(scale).toBe(1);
            const button = buttons.first();
            await button.focus();
            await button.press("Enter");
            await button.press(" ");
            await expect(button).toBeFocused();
            expect(await button.evaluate((node) => getComputedStyle(node).boxShadow)).not.toBe("none");
          }
          expect(
            await p
              .locator(`[data-slot="${id}"]`)
              .first()
              .evaluate((node) => node.getAnimations().length),
          ).toBe(0);
          await page.setViewportSize({ width: 1280, height: 1000 });
        }
      });
    }
  });
}

const IDS = ["alert", "empty", "item", "field", "button-group", "input-group", "breadcrumb", "pagination", "spinner"];
for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`B2 ${colorScheme}`, () => {
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
          if (id === "alert") {
            const action = page.locator('[data-component-example="alert/action"] [data-slot="alert-action"]');
            expect(
              await action.evaluate((node) => {
                const left = node.getBoundingClientRect().left;
                return [
                  ...(node.parentElement?.querySelectorAll(
                    '[data-slot="alert-title"], [data-slot="alert-description"]',
                  ) ?? []),
                ].every((text) => text.getBoundingClientRect().right <= left);
              }),
            ).toBe(true);
          }
          if (id === "button-group") {
            expect(
              await page
                .locator('[data-preview="button-group"] [data-slot="button-group-separator"]')
                .evaluate((node) => node.getBoundingClientRect().height),
            ).toBeGreaterThan(0);
          }
          await page.screenshot({ path: `.cache/b2-proof/${id}-${colorScheme}-${width}.png`, fullPage: true });
          await page
            .locator(`[data-preview="${id}"]`)
            .screenshot({ path: `.cache/b2-proof/${id}-${colorScheme}-${width}-preview.png` });
          for (const name of examples[id] ?? [])
            await page.locator(`[data-component-example="${id}/${name}"]`).screenshot({
              path: `.cache/b2-proof/${id}-${colorScheme}-${width}-${name}.png`,
            });
        }
        expect(errors).toEqual([]);
      });
  });
}
