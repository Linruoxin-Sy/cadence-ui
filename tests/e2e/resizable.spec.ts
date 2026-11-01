import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { MODES } from "./helpers";

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test.describe(`resizable ${reducedMotion}`, () => {
    test.use({ reducedMotion });
    for (const mode of MODES) {
      test(`immediate pointer keyboard and imperative layout ${mode}`, async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (e) => errors.push(e.message));
        await page.goto(`/components/resizable?motion=${mode}`);
        await page.waitForLoadState("networkidle");
        const preview = page.locator('[data-preview="resizable"]');
        const handle = preview.getByRole("separator");
        const report = preview.getByTestId("layout-report");
        const input = preview.getByRole("textbox", { name: "Draft" });
        await input.fill("persistent draft");
        await input.evaluate((el) => {
          (window as unknown as { originalInput: Element }).originalInput = el;
        });
        for (const vertical of [false, true]) {
          await preview.getByLabel("Vertical", { exact: true }).setChecked(vertical);
          await preview.getByRole("button", { name: "Reset layout", exact: true }).click();
          await expect(handle).toHaveAttribute("aria-orientation", vertical ? "horizontal" : "vertical");
          await handle.focus();
          await page.keyboard.press(vertical ? "ArrowDown" : "ArrowRight");
          await expect(report).toHaveText("Explorer 45% · user");
          await page.keyboard.press("End");
          await expect(report).toHaveText("Explorer 60% · user");
          await page.keyboard.press("Home");
          await expect(report).toHaveText("Explorer 0% · user");
          await page.keyboard.press("Enter");
          await expect(report).toHaveText(/Explorer (?:20|60)% · user/);
          await preview.getByRole("button", { name: "Reset layout", exact: true }).click();
          const box = await handle.boundingBox();
          if (!box) throw new Error("Missing divider");
          const x = box.x + box.width / 2;
          const y = box.y + box.height / 2;
          await page.mouse.move(x, y);
          await page.mouse.down();
          await page.mouse.move(x + (vertical ? 0 : 45), y + (vertical ? 45 : 0), { steps: 5 });
          // Observe direct resize while the pointer is still down, then reverse.
          await expect.poll(async () => Number(await handle.getAttribute("aria-valuenow"))).toBeGreaterThan(40);
          await page.mouse.move(x - (vertical ? 0 : 15), y - (vertical ? 15 : 0), { steps: 3 });
          await expect.poll(async () => Number(await handle.getAttribute("aria-valuenow"))).toBeLessThan(40);
          // Mode downgrade during a live gesture must keep direct manipulation functional.
          await preview.getByLabel("Panel motion").evaluate((el) => {
            const select = el as HTMLSelectElement;
            select.value = "none";
            select.dispatchEvent(new Event("change", { bubbles: true }));
          });
          await page.mouse.move(x + (vertical ? 0 : 700), y + (vertical ? 700 : 0), { steps: 3 });
          await expect(handle).toHaveAttribute("aria-valuenow", "60");
          await page.mouse.move(x - (vertical ? 0 : 700), y - (vertical ? 700 : 0), { steps: 3 });
          await expect(handle).toHaveAttribute("aria-valuenow", "0");
          await page.mouse.up();
          await expect(report).toContainText("user");
          await preview.getByLabel("Panel motion").selectOption(mode);
          await preview.getByRole("button", { name: "Reset layout", exact: true }).click();
          await preview.getByRole("button", { name: "Resize to 55%", exact: true }).click();
          await expect(report).toContainText("Explorer 55%");
          await handle.dblclick();
          await expect(report).toContainText("Explorer 40%");
          await preview.getByRole("button", { name: "Collapse", exact: true }).click();
          await expect(report).toHaveText("Explorer 0% · external");
          await preview.getByRole("button", { name: "Expand", exact: true }).click();
          await expect.poll(async () => Number(await handle.getAttribute("aria-valuenow"))).toBeGreaterThanOrEqual(20);
          await preview.getByRole("button", { name: "Resize to 55%", exact: true }).click();
          await expect(report).toHaveText("Explorer 55% · external");
          await preview.getByLabel("Lock layout").check();
          await handle.focus();
          await page.keyboard.press(vertical ? "ArrowUp" : "ArrowLeft");
          await expect(report).toHaveText("Explorer 55% · external");
          await preview.getByLabel("Lock layout").uncheck();
        }
        // Synchronous rapid external updates retain the actual input and expose no animation clock.
        const samples = await preview.evaluate(async (el) => {
          const button = (name: string) =>
            Array.from(el.querySelectorAll("button")).find((b) => b.textContent === name) as HTMLButtonElement;
          const rows = [];
          for (let i = 0; i < 12; i++) {
            button(i % 2 ? "Reset layout" : "Resize to 55%").click();
            if (i === 3) {
              const select = el.querySelector("select") as HTMLSelectElement;
              select.value = "none";
              select.dispatchEvent(new Event("change", { bubbles: true }));
            }
            await new Promise(requestAnimationFrame);
            rows.push(
              Array.from(el.querySelectorAll('[data-slot^="resizable"]')).map((node) => {
                const s = getComputedStyle(node);
                return {
                  active: node.getAnimations().length,
                  duration: s.transitionDuration,
                  transform: s.transform,
                  opacity: s.opacity,
                };
              }),
            );
          }
          return rows.flat();
        });
        expect(
          samples.every((s) => s.active === 0 && s.duration === "0s" && s.transform === "none" && s.opacity === "1"),
        ).toBe(true);
        await page.emulateMedia({ reducedMotion: "reduce" });
        await preview.getByLabel("Panel motion").selectOption("full");
        await page.setViewportSize({ width: 390, height: 1000 });
        await preview.getByRole("button", { name: "Reset layout", exact: true }).click();
        await expect(report).toHaveText(/Explorer 40%/);
        await expect(input).toHaveValue("persistent draft");
        expect(
          await input.evaluate((el) => el === (window as unknown as { originalInput: Element }).originalInput),
        ).toBe(true);
        expect(errors).toEqual([]);
      });
    }
  });
}
for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`resizable ${colorScheme}`, () => {
    test.use({ colorScheme });
    test("whole page axe and responsive geometry", async ({ page }) => {
      await page.goto("/components/resizable?motion=none");
      await page.waitForLoadState("networkidle");
      await expect(page.locator("html")).toHaveClass(colorScheme === "dark" ? /dark/ : /^(?!.*dark)/);
      const preview = page.locator('[data-preview="resizable"]');
      for (const width of [1280, 390]) {
        await page.setViewportSize({ width, height: 1100 });
        for (const vertical of [false, true]) {
          await preview.getByLabel("Vertical", { exact: true }).setChecked(vertical);
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
          expect(
            (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations,
          ).toEqual([]);
          const bounds = await preview.locator('[data-slot="resizable-panel-group"]').boundingBox();
          expect(bounds).toBeTruthy();
          expect((bounds?.x ?? -1) >= 0 && (bounds?.x ?? 0) + (bounds?.width ?? 0) <= width).toBe(true);
        }
        await preview.getByLabel("Vertical", { exact: true }).uncheck();
        await preview.screenshot({ path: `.cache/resizable-proof/resizable-${colorScheme}-${width}.png` });
      }
    });
  });
}
