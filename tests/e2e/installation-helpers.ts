import { expect, type Page } from "@playwright/test";

/** Supports the per-document rollout and the final uniform Manual surface. */
export async function openComponentSource(page: Page, id: string) {
  const installation = page.locator("[data-installation]");
  if (await installation.count()) {
    await installation.getByRole("tab", { name: "Manual", exact: true }).click();
  } else {
    const details = page.locator(`[data-component-source="${id}"]`);
    if ((await details.getAttribute("open")) === null) await details.locator("summary").click();
  }
  const source = page.locator(`[data-component-source="${id}"]`);
  await expect(source).toBeVisible();
  return source;
}
