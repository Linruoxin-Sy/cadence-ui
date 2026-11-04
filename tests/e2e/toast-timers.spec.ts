import { expect, test } from "@playwright/test";

test("toast timers pause on hover and focus, persistent messages and visible limit", async ({ page }) => {
  await page.goto("/components/toast?motion=none");
  await page.waitForLoadState("networkidle");
  const card = page.locator('[data-component-example="toast/timers"]');
  const timed = card.getByRole("button", { name: "Add timed notification", exact: true });
  const persistent = card.getByRole("button", { name: "Add persistent notification", exact: true });
  const toasts = page.locator('[data-slot="toast"]');
  await timed.click();
  await toasts.hover();
  await page.waitForTimeout(5200);
  await expect(toasts).toHaveCount(1);
  await page.keyboard.press("F6");
  await page.keyboard.press("Tab");
  await expect(toasts).toBeFocused();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(5200);
  await expect(toasts).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(toasts).toHaveCount(0);
  await timed.click();
  await page.mouse.move(0, 0);
  await expect(toasts).toHaveCount(0, { timeout: 6000 });
  for (let i = 0; i < 3; i++) await persistent.click();
  await expect(toasts).toHaveCount(3);
  await expect(page.locator('[data-slot="toast"][data-limited]')).toHaveCount(1);
  await page.waitForTimeout(5200);
  await expect(toasts.filter({ visible: true })).toHaveCount(3);
  await expect
    .poll(() => toasts.evaluateAll((ns) => ns.filter((n) => getComputedStyle(n).opacity === "1").length))
    .toBe(2);
  await card.getByRole("button", { name: "Clear timers", exact: true }).click();
  await expect(toasts).toHaveCount(0);
});
