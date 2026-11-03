import { expect, test } from "@playwright/test";

test("hover-card action, physical and logical placement, delays and controlled anchor", async ({ page }) => {
  await page.goto("/components/hover-card?motion=none");
  await page.waitForLoadState("networkidle");
  const popup = page.locator('[data-slot="hover-card-content"]');
  const action = page.locator('[data-component-example="hover-card/action"] a');
  await action.focus();
  await expect(popup).toBeVisible();
  await page.keyboard.press("ArrowDown");
  const follow = popup.getByRole("button", { name: "Follow", exact: true });
  await expect(follow).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(popup.getByRole("button", { name: "Following" })).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Escape");
  await expect(popup).toHaveCount(0);
  for (const name of ["sides", "alignments", "logical-sides"]) {
    const card = page.locator(`[data-component-example="hover-card/${name}"]`);
    for (const trigger of await card.locator('[data-slot="hover-card-trigger"]').all()) {
      await trigger.scrollIntoViewIfNeeded();
      await trigger.focus();
      await expect(popup).toBeVisible();
      const value = await trigger.textContent();
      const expected = value === "inline-start" ? "right" : value === "inline-end" ? "left" : value;
      if (name === "sides") await expect(popup).toHaveAttribute("data-side", expected ?? "");
      else if (name === "logical-sides") {
        const t = await trigger.boundingBox();
        const p = await popup.boundingBox();
        if (!t || !p) throw new Error("missing logical bounds");
        if (value === "inline-start") expect(p.x).toBeGreaterThan(t.x + t.width);
        else expect(p.x + p.width).toBeLessThan(t.x);
      } else {
        const t = await trigger.boundingBox();
        const p = await popup.boundingBox();
        if (!t || !p) throw new Error("missing placement boxes");
        const delta =
          value === "start"
            ? p.x - t.x
            : value === "end"
              ? p.x + p.width - t.x - t.width
              : p.x + p.width / 2 - t.x - t.width / 2;
        expect(Math.abs(delta)).toBeLessThan(2);
      }
      await page.keyboard.press("Escape");
      await expect(popup).toHaveCount(0);
    }
  }
  const delayed = page.locator('[data-component-example="hover-card/delay"] a');
  await page.getByRole("group", { name: "Motion mode" }).getByRole("button").first().focus();
  await delayed.hover();
  await page.waitForTimeout(150);
  await expect(popup).toHaveCount(0);
  await expect(popup).toBeVisible();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(100);
  await expect(popup).toBeVisible();
  await expect(popup).toHaveCount(0);
  const controlled = page.locator('[data-component-example="hover-card/controlled"]');
  await controlled.getByRole("button", { name: "Show preview" }).click();
  await expect(popup).toContainText("Caller-owned");
  const anchor = await controlled.getByRole("link").boundingBox();
  const box = await popup.boundingBox();
  if (!anchor || !box) throw new Error("missing controlled anchor");
  expect(Math.abs(box.y - anchor.y - anchor.height - 4)).toBeLessThan(2);
  await page.keyboard.press("Escape");
  await expect(popup).toHaveCount(0);
  await action.hover();
  await expect(popup.getByRole("button", { name: "Following" })).toBeVisible();
});
