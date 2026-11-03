import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

const catalog: Record<string, string[]> = JSON.parse(await readFile("components/site/previews/examples.json", "utf8"));

for (const id of (["sheet", "drawer"] as const).filter((id) => catalog[id])) {
  const slot = id === "drawer" ? "drawer-popup" : "sheet-content";
  test(`${id} controlled drafts, saved state, focus and OS changes`, async ({ page }) => {
    await page.goto(`/components/${id}?motion=full`);
    await page.waitForLoadState("networkidle");
    const card = page.locator(`[data-component-example="${id}/controlled"]`);
    const trigger = card.locator(`[data-slot="${id}-trigger"]`);
    const popup = page.locator(`[data-slot="${slot}"]`);
    await trigger.click();
    const input = popup.getByRole("textbox");
    await input.fill("Retained working draft");
    const node = await input.elementHandle();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(popup).toHaveAttribute("data-motion", "reduced");
    await expect(input).toBeFocused();
    expect(await input.evaluate((element, node) => element === node, node)).toBe(true);
    await expect(input).toHaveValue("Retained working draft");
    await popup.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(popup).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(card.getByRole("status")).not.toContainText("Retained working draft");
    await trigger.press("Enter");
    await expect(input).toHaveValue("Retained working draft");
    await input.press("Enter");
    await expect(popup).toHaveCount(0);
    await expect(card.getByRole("status")).toHaveText("Saved: Retained working draft");
    await expect(page.locator(`[data-preview="${id}"] [role="status"]`)).not.toContainText("Retained working draft");
    const ids = await page.locator("[id]").evaluateAll((nodes) => nodes.map((node) => node.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
  test(`${id} fixed edges and modality use real geometry and focus`, async ({ page }) => {
    await page.goto(`/components/${id}?motion=none`);
    await page.waitForLoadState("networkidle");
    const popup = page.locator(`[data-slot="${slot}"]`);
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 900 });
      const directions = page.locator(`[data-component-example="${id}/${id === "sheet" ? "edges" : "directions"}"]`);
      for (const trigger of await directions.locator(`[data-slot="${id}-trigger"]`).all()) {
        await trigger.click();
        await expect(popup).toBeVisible();
        const direction = await trigger.textContent();
        const box = await popup.boundingBox();
        if (!box) throw new Error("missing panel geometry");
        if (direction === "right") expect(Math.abs(box.x + box.width - width)).toBeLessThan(1);
        if (direction === "left") expect(Math.abs(box.x)).toBeLessThan(1);
        if (direction === "top" || direction === "up") expect(Math.abs(box.y)).toBeLessThan(1);
        if (direction === "bottom" || direction === "down") expect(Math.abs(box.y + box.height - 900)).toBeLessThan(1);
        await page.keyboard.press("Escape");
        await expect(popup).toHaveCount(0);
        await expect(trigger).toBeFocused();
      }
    }
    await page.setViewportSize({ width: 1280, height: 900 });
    const modes = page.locator(`[data-component-example="${id}/modality"]`);
    for (const value of ["true", "false", "trap-focus"]) {
      await modes.getByRole("button", { name: value, exact: true }).click();
      await expect(popup).toBeVisible();
      await expect(page.locator(`[data-slot="${id}-overlay"]`)).toHaveCount(id === "sheet" || value === "true" ? 1 : 0);
      const overflow = await page.locator("body").evaluate((node) => getComputedStyle(node).overflow);
      expect(overflow === "hidden").toBe(value === "true");
      if (value !== "false") {
        for (let i = 0; i < 5; i++) {
          await page.keyboard.press("Tab");
          expect(await popup.evaluate((node) => node.contains(document.activeElement))).toBe(true);
        }
      } else {
        await page.getByRole("group", { name: "Motion mode" }).getByRole("button").first().focus();
        expect(await popup.evaluate((node) => !node.contains(document.activeElement))).toBe(true);
      }
      await page.keyboard.press("Escape");
      await expect(popup).toHaveCount(0);
    }
  });
}

test("sheet real filters, footer close and long inner scrolling", async ({ page }) => {
  await page.goto("/components/sheet?motion=none");
  await page.waitForLoadState("networkidle");
  const top = page.locator('[data-preview="sheet"]');
  const popup = page.locator('[data-slot="sheet-content"]');
  await top.getByRole("button").click();
  await popup.getByRole("button", { name: "Clear selection" }).click();
  await expect(popup.getByRole("checkbox")).not.toBeChecked();
  await popup.getByRole("button", { name: "Apply filters" }).click();
  await expect(top.getByRole("status")).toHaveText("All items");
  await page.locator('[data-component-example="sheet/footer-close"] button').click();
  await expect(popup.getByRole("button", { name: "Close", exact: true })).toHaveCount(0);
  await popup.getByRole("button", { name: "Done", exact: true }).click();
  await page.locator('[data-component-example="sheet/long-list"] button').click();
  await expect(popup.getByRole("heading", { name: "Activity", exact: true })).toBeFocused();
  const list = popup.getByRole("region", { name: "Activity entries" });
  expect(await list.evaluate((node) => node.scrollTop)).toBe(0);
  await page.keyboard.press("Tab");
  await expect(list.getByRole("link").first()).toBeFocused();
  await list.press("PageDown");
  await expect.poll(() => list.evaluate((node) => node.scrollTop)).toBeGreaterThan(100);
  await list.press("Control+Home");
  await expect.poll(() => list.evaluate((node) => node.scrollTop)).toBe(0);
  await list.hover();
  await page.mouse.wheel(0, 800);
  await expect.poll(() => list.evaluate((node) => node.scrollTop)).toBeGreaterThan(400);
  await expect(popup.getByRole("button", { name: "Done", exact: true })).toBeInViewport();
});

if (catalog.drawer)
  test("drawer handle, local move and snap-point external updates", async ({ page }) => {
    await page.goto("/components/drawer?motion=none");
    await page.waitForLoadState("networkidle");
    const popup = page.locator('[data-slot="drawer-popup"]');
    const top = page.locator('[data-preview="drawer"]');
    await top.getByRole("button").click();
    await popup.getByRole("button", { name: "Archive", exact: true }).click();
    await expect(top.getByRole("status")).toHaveText("Archive");
    const handles = page.locator('[data-component-example="drawer/handle"]');
    for (const hasHandle of [false, true]) {
      await handles.getByRole("button", { name: hasHandle ? "With handle" : "Without handle", exact: true }).click();
      await expect(popup.locator('[data-slot="drawer-swipe-handle"]')).toHaveCount(hasHandle ? 1 : 0);
      if (hasHandle)
        await expect(popup.locator('[data-slot="drawer-swipe-handle"]')).toHaveAttribute("aria-hidden", "true");
      await page.keyboard.press("Escape");
      await expect(popup).toHaveCount(0);
    }
    await page.locator('[data-component-example="drawer/snap-points"] button').click();
    await expect(popup.getByRole("status")).toHaveText("Snap: 0.5");
    const node = await popup.elementHandle();
    const peek = await popup.boundingBox();
    await popup.getByRole("button", { name: "Expand", exact: true }).click();
    await expect(popup.getByRole("status")).toHaveText("Snap: 1");
    const expanded = await popup.boundingBox();
    if (!peek || !expanded) throw new Error("missing snap geometry");
    expect(expanded.y).toBeLessThan(peek.y - 100);
    expect(await popup.evaluate((element, node) => element === node, node)).toBe(true);
    await popup.getByRole("button", { name: "Peek", exact: true }).click();
    await expect(popup.getByRole("status")).toHaveText("Snap: 0.5");
    expect((await popup.boundingBox())?.y).toBeCloseTo(peek.y, 0);
  });
