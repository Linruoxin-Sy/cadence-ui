import { expect, test } from "@playwright/test";

test("tooltip placement geometry, delay group, disabled wrapper and controlled anchor", async ({ page }) => {
  await page.goto("/components/tooltip?motion=none");
  await page.waitForLoadState("networkidle");
  const card = (name: string) => page.locator(`[data-component-example="tooltip/${name}"]`);
  const surface = page.locator('[data-slot="tooltip-content"]');
  const close = async () => {
    await page.keyboard.press("Escape");
    await expect(surface).toHaveCount(0);
    await page.mouse.move(0, 0);
  };
  for (const side of ["top", "right", "bottom", "left"]) {
    const trigger = card("sides").getByRole("button", { name: side, exact: true });
    await trigger.scrollIntoViewIfNeeded();
    await trigger.focus();
    await expect(surface).toHaveAttribute("data-side", side);
    const anchor = await trigger.boundingBox();
    const panel = await surface.boundingBox();
    if (!anchor || !panel) throw new Error("missing tooltip geometry");
    if (side === "top") expect(panel.y + panel.height).toBeLessThan(anchor.y);
    if (side === "bottom") expect(panel.y).toBeGreaterThan(anchor.y + anchor.height);
    if (side === "left") expect(panel.x + panel.width).toBeLessThan(anchor.x);
    if (side === "right") expect(panel.x).toBeGreaterThan(anchor.x + anchor.width);
    await close();
  }
  for (const align of ["start", "center", "end"]) {
    const trigger = card("alignments").getByRole("button", { name: align, exact: true });
    await trigger.focus();
    await expect(surface).toBeVisible();
    const anchor = await trigger.boundingBox();
    const panel = await surface.boundingBox();
    if (!anchor || !panel) throw new Error("missing tooltip alignment");
    const fraction = { start: 0, center: 0.5, end: 1 }[align] ?? 0;
    expect(Math.abs(panel.x + panel.width * fraction - anchor.x - anchor.width * fraction)).toBeLessThan(1);
    await close();
  }
  for (const side of ["inline-start", "inline-end"]) {
    const trigger = card("logical-sides").getByRole("button", { name: side, exact: true });
    await trigger.focus();
    await expect(surface).toBeVisible();
    const anchor = await trigger.boundingBox();
    const panel = await surface.boundingBox();
    if (!anchor || !panel) throw new Error("missing logical tooltip geometry");
    if (side === "inline-start") expect(panel.x).toBeGreaterThan(anchor.x + anchor.width);
    else expect(panel.x + panel.width).toBeLessThan(anchor.x);
    await close();
  }
  const upload = card("delay").getByRole("button", { name: "Upload help" });
  await upload.scrollIntoViewIfNeeded();
  await upload.evaluate((node) => {
    node.addEventListener(
      "mouseenter",
      () => {
        (window as unknown as { tooltipEnteredAt: number }).tooltipEnteredAt = performance.now();
      },
      { once: true },
    );
    const observer = new MutationObserver(() => {
      if (document.querySelector('[data-slot="tooltip-content"]')) {
        (window as unknown as { tooltipInsertedAt: number }).tooltipInsertedAt = performance.now();
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
  await upload.hover();
  await page.waitForTimeout(120);
  await expect(surface).toHaveCount(0);
  await expect(surface).toHaveText("Upload files up to 10 MB");
  expect(
    await page.evaluate(() => {
      const state = window as unknown as { tooltipEnteredAt: number; tooltipInsertedAt: number };
      return state.tooltipInsertedAt - state.tooltipEnteredAt;
    }),
  ).toBeGreaterThanOrEqual(280);
  await card("delay").getByRole("button", { name: "Share help" }).hover();
  await expect(surface).toHaveText("Only invited people can read this project");
  await close();
  await page.getByRole("group", { name: "Motion mode" }).getByRole("button", { name: "full", exact: true }).click();
  const wrapper = card("disabled").locator('[data-slot="tooltip-trigger"]');
  const disabled = wrapper.getByRole("button", { name: "Deploy", exact: true });
  await expect(disabled).toBeDisabled();
  await wrapper.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(wrapper).toBeFocused();
  await expect(surface).toHaveText("Finish the required fields first");
  await expect(wrapper).toHaveAttribute("aria-describedby", (await surface.getAttribute("id")) ?? "");
  const saved = await wrapper.elementHandle();
  for (const reducedMotion of ["reduce", "no-preference"] as const) {
    await page.emulateMedia({ reducedMotion });
    await expect(surface).toHaveAttribute("data-motion", reducedMotion === "reduce" ? "reduced" : "full");
    await expect(wrapper).toBeFocused();
    expect(await wrapper.evaluate((node, saved) => node === saved, saved)).toBe(true);
  }
  await page.getByRole("group", { name: "Motion mode" }).getByRole("button", { name: "none", exact: true }).click();
  await expect(surface).toHaveCount(0);
  await expect(wrapper).not.toHaveAttribute("aria-describedby");
  await card("controlled").getByRole("button", { name: "Show shortcut", exact: true }).click();
  await expect(surface).toHaveText("Press ⌘K to search");
  const help = card("controlled").getByRole("button", { name: "Keyboard help" });
  await expect(help).toHaveAttribute("aria-describedby", (await surface.getAttribute("id")) ?? "");
  await close();
  await expect(card("controlled").getByRole("button", { name: "Show shortcut", exact: true })).toBeVisible();
});
