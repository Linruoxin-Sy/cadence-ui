import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const examples: { toast: string[] } = JSON.parse(await readFile("components/site/previews/examples.json", "utf8"));

import { effectiveMode, MODES } from "./helpers";

for (const os of ["no-preference", "reduce"] as const)
  for (const mode of MODES)
    test(`toast examples inherited modes ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os });
      await page.goto(`/components/toast?motion=${mode}`);
      await page.waitForLoadState("networkidle");
      expect(await page.evaluate(() => scrollY)).toBe(0);
      for (const name of examples.toast) {
        const card = page.locator(`[data-component-example="toast/${name}"]`);
        await expect(card).toBeVisible();
        const buttons =
          name === "types"
            ? await card
                .getByRole("button")
                .filter({ hasText: /^Show / })
                .all()
            : name === "without-motion"
              ? await card.getByRole("button").all()
              : [card.getByRole("button").first()];
        for (const button of buttons) {
          await button.click();
          const toast = page.locator('[data-slot="toast"]').filter({ visible: true });
          await expect(toast).toHaveCount(1);
          await expect(toast).toHaveAttribute(
            "data-motion",
            name === "without-motion"
              ? ((await button.textContent()) ?? "").includes("instant")
                ? "none"
                : effectiveMode("full", os === "reduce")
              : effectiveMode(mode, os === "reduce"),
          );
          if (name === "types") {
            const type = ((await button.textContent()) ?? "").split(" ")[1];
            await expect(toast.locator('[data-slot="toast-icon"]')).toHaveCount(type === "plain" ? 0 : 1);
            if (type === "loading")
              expect(
                await toast
                  .locator("svg")
                  .first()
                  .evaluate((n) => n.getAnimations().length),
              ).toBe(0);
          }
          await page.locator('[data-slot="toast-close"]').click();
          await expect(page.locator('[data-slot="toast"]')).toHaveCount(0);
        }
      }
    });

test("toast examples actions progress isolation keyboard and real swipe", async ({ page }) => {
  await page.goto("/components/toast?motion=none");
  await page.waitForLoadState("networkidle");
  const card = (name: string) => page.locator(`[data-component-example="toast/${name}"]`);
  const toast = page.locator('[data-slot="toast"]');
  await card("actions").getByRole("button", { name: "Archive item", exact: true }).click();
  await page.getByRole("button", { name: "Restore item", exact: true }).press("Enter");
  await expect(card("actions").getByRole("status")).toHaveText("Item restored");
  await expect(toast).toHaveCount(0);
  const progress = card("progress");
  await progress.getByRole("button", { name: "Queue export", exact: true }).click();
  const saved = await toast.elementHandle();
  await progress.getByRole("button", { name: "Finish export", exact: true }).click();
  await expect(toast).toHaveAccessibleName("Export ready");
  expect(await toast.evaluate((n, saved) => n === saved, saved)).toBe(true);
  await progress.getByRole("button", { name: "Dismiss export", exact: true }).click();
  await expect(toast).toHaveCount(0);
  await expect(progress.getByRole("status")).toHaveText("Export ready");
  await progress.getByRole("button", { name: "Queue export", exact: true }).click();
  await page.locator('[data-slot="toast-close"]').click();
  await expect(toast).toHaveCount(0);
  await expect(progress.getByRole("button", { name: "Queue export", exact: true })).toBeEnabled();
  await expect(progress.getByRole("button", { name: "Finish export", exact: true })).toBeDisabled();
  await expect(card("actions").getByRole("status")).toHaveText("Item restored");
  await card("priority").getByRole("button", { name: "Urgent notification", exact: true }).click();
  await page.keyboard.press("F6");
  await expect(page.locator('[data-slot="toast-viewport"]').filter({ has: toast })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(toast).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(toast).toHaveCount(0);
  for (const direction of ["up", "down", "left", "right"]) {
    await card("swipe")
      .getByRole("button", { name: `Swipe ${direction}`, exact: true })
      .click();
    const r = await toast.boundingBox();
    if (!r) throw Error("missing toast");
    const x = r.x + r.width / 2,
      y = r.y + r.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(
      x + (direction === "right" ? 200 : direction === "left" ? -200 : 0),
      y + (direction === "down" ? 150 : direction === "up" ? -150 : 0),
      { steps: 12 },
    );
    await page.mouse.up();
    await expect(toast).toHaveCount(0);
  }
});
for (const theme of ["light", "dark"] as const)
  for (const width of [1280, 390])
    for (const name of examples.toast)
      test(`toast examples visual axe ${name}/${theme}/${width}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: theme });
        await page.setViewportSize({ width, height: 1000 });
        await page.goto("/components/toast?motion=none");
        await page.waitForLoadState("networkidle");
        {
          const card = page.locator(`[data-component-example="toast/${name}"]`);
          await card.scrollIntoViewIfNeeded();
          await card.screenshot({ path: `.cache/b5-proof/toast-${name}-${theme}-${width}.png` });
          await card.getByRole("button").first().click();
          expect(
            (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations,
          ).toEqual([]);
          await page.screenshot({ path: `.cache/b5-proof/toast-${name}-${theme}-${width}-open.png` });
          await page.locator('[data-slot="toast-close"]').click();
          await expect(page.locator('[data-slot="toast"]')).toHaveCount(0);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      });
