import { expect, test } from "@playwright/test";
import { effectiveMode, MODES } from "./helpers";

for (const mode of MODES)
  for (const os of [false, true]) {
    test(`Button Group native joins and readouts ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
      await page.goto(`/components/button-group?motion=${mode}`);
      await page.waitForLoadState("networkidle");
      const top = page.locator('[data-preview="button-group"]');
      await expect(top).toHaveAttribute("data-preview-motion", effectiveMode(mode, os));
      const zoom = top.getByRole("group", { name: "Zoom", exact: true });
      await expect(zoom.locator("output")).toHaveText("100%");
      await zoom.getByRole("button", { name: "Zoom in" }).click();
      await expect(zoom.locator("output")).toHaveText("125%");
      const vertical = top.getByRole("group", { name: "Vertical zoom" });
      await expect(vertical).toHaveAttribute("data-orientation", "vertical");
      await expect(vertical.locator("output")).toHaveText("100%");
      const guides = page.locator('[data-component-example="button-group/separator"]');
      await expect(guides.getByRole("separator")).toHaveCount(2);
      for (const rule of await guides.getByRole("separator").all())
        expect(await rule.evaluate((node) => node.getAnimations().length)).toBe(0);
      await expect(
        page.locator('[data-component-example="button-group/static-text"]').getByRole("link", { name: "Registry" }),
      ).toHaveAttribute("href", "/docs/registry");
    });
    test(`Button Group keyed actions and live cancellation ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
      await page.goto(`/components/button-group?motion=${mode}&speed=0.25#changing-joined-actions`);
      await page.waitForLoadState("networkidle");
      const demo = page.locator('[data-component-example="button-group/changing"]');
      const group = demo.getByRole("group", { name: "Document actions" });
      const save = await group.getByRole("button", { name: "Save", exact: true }).elementHandle();
      const output = await group.getByLabel("Pages", { exact: true }).elementHandle();
      await group.getByRole("button", { name: "More", exact: true }).click();
      await expect(group.getByRole("button", { name: "Copy", exact: true })).toBeVisible();
      const widths = await group.evaluate(async (node) => {
        const values = [];
        for (let index = 0; index < 12; index++) {
          await new Promise(requestAnimationFrame);
          values.push(node.getBoundingClientRect().width);
        }
        return values;
      });
      if (effectiveMode(mode, os) === "full") expect(new Set(widths).size).toBeGreaterThan(2);
      else expect(new Set(widths).size).toBe(1);
      expect(
        await group.getByRole("button", { name: "Save", exact: true }).evaluate((node, saved) => node === saved, save),
      ).toBe(true);
      await group.getByRole("button", { name: "Copy", exact: true }).click();
      await expect(group.getByLabel("Pages", { exact: true })).toHaveText("100");
      expect(await group.getByLabel("Pages", { exact: true }).evaluate((node, saved) => node === saved, output)).toBe(
        true,
      );
      await group.getByRole("button", { name: "Save", exact: true }).focus();
      await page.keyboard.press("Space");
      await expect(group.getByRole("button", { name: "Saved", exact: true })).toBeFocused();
      await expect(group.locator("[aria-selected],[aria-pressed],[data-slot*=indicator]")).toHaveCount(0);
      await page
        .getByRole("group", { name: "Motion mode", exact: true })
        .getByRole("button", { name: "none", exact: true })
        .evaluate((node) => (node as HTMLButtonElement).click());
      await expect(group).toHaveAttribute("data-motion", "none");
      expect(
        await group.evaluate(
          (node) =>
            node
              .getAnimations({ subtree: true })
              .filter(
                (animation) => animation.playState === "running" && Number(animation.effect?.getTiming().duration) > 0,
              ).length,
        ),
      ).toBe(0);
      await group.getByRole("button", { name: "Less", exact: true }).click();
      await expect(group.getByRole("button", { name: "Copy", exact: true })).toHaveCount(0);
      await expect(group.getByLabel("Pages", { exact: true })).toHaveText("100");
    });
  }

test("Button Group no-JavaScript markup stays visible with native links", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/components/button-group#changing-joined-actions");
  const demo = page.locator('[data-component-example="button-group/changing"]');
  await expect(demo.getByRole("group", { name: "Document actions" })).toBeVisible();
  await expect(demo.getByLabel("Pages", { exact: true })).toHaveText("99");
  expect(await demo.getByRole("group").evaluate((node) => getComputedStyle(node).opacity)).toBe("1");
  await expect(
    page.locator('[data-component-example="button-group/static-text"]').getByRole("link", { name: "Registry" }),
  ).toHaveAttribute("href", "/docs/registry");
  await context.close();
});
