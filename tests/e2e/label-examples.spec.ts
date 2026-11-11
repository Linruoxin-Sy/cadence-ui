import { expect, test } from "@playwright/test";
import { effectiveMode, MODES } from "./helpers";

for (const mode of MODES)
  for (const os of [false, true])
    test(`Label associations, independent state and retained focus ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
      await page.goto(`/components/label?motion=${mode}`);
      await page.waitForLoadState("networkidle");
      const top = page.locator('[data-preview="label"]');
      const wrapping = page.locator('[data-component-example="label/wrapping"]');
      const disabled = page.locator('[data-component-example="label/disabled"]');
      for (const card of [top, wrapping, disabled])
        await expect(card).toHaveAttribute("data-preview-motion", effectiveMode(mode, os));
      const associations = await page.locator('[data-slot="label"][for]').evaluateAll((nodes) =>
        nodes.map((node) => {
          const target = node.getAttribute("for");
          return [...document.querySelectorAll("[id]")].filter((element) => element.id === target).length;
        }),
      );
      expect(associations.every((count) => count === 1)).toBe(true);
      const ids = await page.locator("[id]").evaluateAll((nodes) => nodes.map((node) => node.id));
      expect(new Set(ids).size).toBe(ids.length);
      const field = top.getByRole("textbox", { name: "Email", exact: true });
      await top.getByText("Email", { exact: true }).click();
      await expect(field).toBeFocused();
      await field.fill("draft@example.com");
      const topBox = top.getByRole("checkbox", { name: "Email me about releases" });
      await expect(topBox).toHaveAttribute("data-motion", effectiveMode(mode, os));
      const wrappedBox = wrapping.getByRole("checkbox", { name: "Email me about releases" });
      await expect(wrapping.locator("label input[type=checkbox]")).toHaveCount(1);
      await expect(wrapping.locator("label")).not.toHaveAttribute("for");
      await wrapping.getByText("Email me about releases").click();
      await expect(wrappedBox).not.toBeChecked();
      await expect(topBox).toBeChecked();
      await wrappedBox.focus();
      await wrappedBox.press(" ");
      await expect(wrappedBox).toBeChecked();
      await top.getByText("Email me about releases").click();
      await expect(topBox).not.toBeChecked();
      await expect(wrappedBox).toBeChecked();
      await expect(top.getByRole("textbox", { name: "Slug" })).toBeDisabled();
      await expect(top.getByRole("checkbox", { name: "Disabled preference" })).toBeDisabled();
      expect(
        await top
          .getByText("Disabled preference", { exact: true })
          .evaluate((node) => getComputedStyle(node.closest("label") as HTMLLabelElement).opacity),
      ).toBe("0.5");
      for (const name of ["Slug", "Workspace"]) {
        await expect(disabled.getByRole("textbox", { name })).toBeDisabled();
        expect(
          await disabled
            .getByText(name, { exact: true })
            .evaluate((node) => getComputedStyle(node.closest("label") as HTMLLabelElement).opacity),
        ).toBe("0.5");
      }
      await field.focus();
      const original = await field.elementHandle();
      await page
        .getByRole("group", { name: "Motion mode" })
        .getByRole("button", { name: "none", exact: true })
        .evaluate((button: HTMLButtonElement) => button.click());
      await expect(topBox).toHaveAttribute("data-motion", "none");
      await expect(field).toBeFocused();
      await expect(field).toHaveValue("draft@example.com");
      expect(await field.evaluate((node, before) => node === before, original)).toBe(true);
      await expect(wrappedBox).toBeChecked();
      await expect(topBox).not.toBeChecked();
    });

for (const mode of MODES)
  for (const os of [false, true])
    test(`Label changed name and quantity retain native input ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
      await page.goto(`/components/label?motion=${mode}`);
      await page.waitForLoadState("networkidle");
      const demo = page.locator('[data-component-example="label/changing"]');
      await demo.scrollIntoViewIfNeeded();
      const label = demo.locator('[data-slot="label"]').first();
      await expect(label).toHaveAttribute("data-motion", effectiveMode(mode, os));
      const input = demo.getByRole("textbox");
      await expect(input).toHaveAccessibleName("Email address");
      const before = await input.elementHandle();
      await input.fill("retained@example.com");
      // Email keeps native keyboard selection but does not expose selectionStart/End.
      await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
      await input.press("Control+Home");
      await input.press("Shift+ArrowRight");
      await input.press("Control+c");
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("r");
      await demo.getByRole("button", { name: "Rename field" }).evaluate((node: HTMLButtonElement) => node.click());
      await expect(input).toHaveAccessibleName("Work email address");
      await expect(input).toBeFocused();
      await expect(input).toHaveValue("retained@example.com");
      expect(await input.evaluate((node, old) => node === old, before)).toBe(true);
      expect(await input.evaluate((node: HTMLInputElement) => [node.selectionStart, node.selectionEnd])).toEqual([
        null,
        null,
      ]);
      await input.press("Control+c");
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("r");
      await demo.getByRole("button", { name: "Change quantity" }).click();
      await expect(demo.getByRole("checkbox", { name: "20", exact: true })).toBeVisible();
      await demo.getByRole("button", { name: "Rename field" }).click();
      await expect(label).toHaveText("Email address");
      await expect(label).toHaveAttribute("for", (await input.getAttribute("id")) as string);
    });

test("Label native associations also work without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(`${baseURL}/components/label`);
    const top = page.locator('[data-preview="label"]');
    await top.getByText("Email", { exact: true }).click();
    await expect(top.getByRole("textbox", { name: "Email", exact: true })).toBeFocused();
    const wrapping = page.locator('[data-component-example="label/wrapping"]');
    await wrapping.getByText("Email me about releases").click();
    await expect(wrapping.getByRole("checkbox")).not.toBeChecked();
  } finally {
    await context.close();
  }
});
