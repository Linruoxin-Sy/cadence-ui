import { expect, type Page } from "@playwright/test";

/** Open the uniform Manual source surface on every component page. */
export async function openComponentSource(page: Page, id: string) {
  const installation = page.locator("[data-installation]");
  await installation.getByRole("tab", { name: "Manual", exact: true }).click();
  const source = page.locator(`[data-component-source="${id}"]`);
  await expect(source).toBeVisible();
  return source;
}
