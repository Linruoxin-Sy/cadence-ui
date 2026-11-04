import { expect, test } from "@playwright/test";

test("toast header updates preserve caller state, active portal and native focus", async ({ page }) => {
  await page.goto("/components/toast?motion=none");
  await page.waitForLoadState("networkidle");
  const progress = page.locator('[data-component-example="toast/progress"]');
  const queue = progress.getByRole("button", { name: "Queue export", exact: true });
  await queue.click();
  const toast = page.locator('[data-slot="toast"]');
  const saved = await toast.elementHandle();
  for (const mode of ["full", "reduced", "none"]) {
    await page.getByRole("group", { name: "Motion mode" }).getByRole("button", { name: mode, exact: true }).click();
    await expect(toast).toHaveAttribute("data-motion", mode);
    expect(await toast.evaluate((n, saved) => n === saved, saved)).toBe(true);
    await expect(progress.getByRole("status")).toHaveText("Export queued");
    await expect(queue).toBeDisabled();
  }
  await page.keyboard.press("F6");
  await page.keyboard.press("Tab");
  await expect(toast).toBeFocused();
  await page
    .getByRole("group", { name: "Motion mode" })
    .getByRole("button", { name: "reduced", exact: true })
    .evaluate((n) => (n as HTMLButtonElement).click());
  await expect(toast).toBeFocused();
  expect(await toast.evaluate((n, saved) => n === saved, saved)).toBe(true);
  await page.keyboard.press("Escape");
  await expect(toast).toHaveCount(0);
  await expect(queue).toBeEnabled();
  await progress.getByRole("button", { name: "Queue export", exact: true }).click();
  await progress.getByRole("button", { name: "Finish export", exact: true }).click();
  await expect(progress.getByRole("status")).toHaveText("Export ready");
  await page.keyboard.press("F6");
  await page.keyboard.press("Tab");
  await expect(toast).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Close toast", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(toast).toHaveCount(0);
  await expect(progress.getByRole("status")).toHaveText("Export ready");
});
