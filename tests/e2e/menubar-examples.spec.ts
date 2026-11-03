import { expect, test } from "@playwright/test";
import { effectiveMode, MODES } from "./helpers";
import { openPopupMotionFixture } from "./popup-motion-fixture";

test("menubar real commands, selections, disabled parts, controlled opening and focus", async ({ page }, info) => {
  await page.goto("/components/menubar?motion=none");
  await page.waitForLoadState("networkidle");
  const card = (name: string) => page.locator(`[data-component-example="menubar/${name}"]`);
  const popup = page.locator('[data-slot="menubar-content"]');
  const close = async () => {
    await page.keyboard.press("Escape");
    await expect(popup).toHaveCount(0);
  };
  const top = page.locator('[data-preview="menubar"]');
  await top.getByRole("menuitem", { name: "File", exact: true }).press("ArrowDown");
  await page.keyboard.press("s");
  await expect(popup.getByRole("menuitem", { name: "Save", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(top.getByRole("status")).toHaveText("Saved locally");
  await expect(top.getByRole("menuitem", { name: "File", exact: true })).toBeFocused();
  await card("items").getByRole("menuitem", { name: "Actions" }).click();
  await popup.getByRole("menuitem", { name: "Keep open" }).click();
  await expect(popup).toBeVisible();
  await expect(card("items").locator('[role="status"]')).toHaveText("Still open");
  await expect(popup.getByRole("menuitem", { name: "Keep open" })).toHaveAttribute("data-inset", "true");
  await expect(popup.getByRole("menuitem", { name: "Delete" })).toHaveAttribute("data-variant", "destructive");
  await popup.getByRole("menuitem", { name: "Delete" }).click();
  await expect(popup).toHaveCount(0);
  await expect(card("items").getByRole("status")).toHaveText("Deleted locally");
  const view = card("selection").getByRole("menuitem", { name: "View", exact: true });
  const saved = await view.elementHandle();
  await view.click();
  await popup.getByRole("menuitemcheckbox", { name: "Sidebar", exact: true }).click();
  await popup.getByRole("menuitemcheckbox", { name: "Line numbers", exact: true }).click();
  await popup.getByRole("menuitemradio", { name: "Compact", exact: true }).click();
  await expect(card("selection").locator('[role="status"]')).toHaveText("Sidebar: hidden; density: compact");
  await expect(popup.getByRole("menuitemcheckbox", { name: "Line numbers", exact: true })).toHaveAttribute(
    "aria-checked",
    "false",
  );
  await close();
  for (const mode of ["full", "reduced", "none"]) {
    await page.getByRole("group", { name: "Motion mode" }).getByRole("button", { name: mode, exact: true }).click();
    expect(await view.evaluate((node, saved) => node === saved, saved)).toBe(true);
    await view.click();
    await expect(popup.getByRole("menuitemcheckbox", { name: "Sidebar", exact: true })).toHaveAttribute(
      "aria-checked",
      "false",
    );
    await expect(popup.getByRole("menuitemcheckbox", { name: "Line numbers", exact: true })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(popup.getByRole("menuitemradio", { name: "Compact", exact: true })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await close();
  }
  await card("grouping").getByRole("menuitem", { name: "Export", exact: true }).click();
  await expect(popup.getByRole("group", { name: "Document", exact: true })).toBeVisible();
  await expect(popup.getByRole("group", { name: "Help", exact: true })).toBeVisible();
  await expect(popup.getByRole("menuitem", { name: "Changelog" })).toHaveAttribute("href", "/docs/changelog");
  await popup.getByRole("menuitem", { name: /PDF/ }).press("Enter");
  await expect(card("grouping").getByRole("status")).toHaveText("PDF selected locally");
  await card("submenus").getByRole("menuitem", { name: "Organize" }).click();
  await popup.getByRole("menuitem", { name: "Move to" }).focus();
  await page.keyboard.press("ArrowRight");
  await page.locator('[data-slot="menubar-sub-content"]').getByRole("menuitem", { name: "Backlog" }).press("Enter");
  await expect(popup).toHaveCount(0);
  await expect(card("submenus").getByRole("status")).toHaveText("Backlog");
  for (const label of ["Disabled bar", "Disabled trigger"]) {
    const trigger = card("disabled").getByRole("menuitem", { name: label, exact: true });
    await expect(trigger).toHaveAttribute("aria-disabled", "true");
    await trigger.scrollIntoViewIfNeeded();
    const bounds = await trigger.boundingBox();
    if (!bounds) throw new Error("missing disabled trigger");
    await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await expect(popup).toHaveCount(0);
  }
  await card("disabled").getByRole("menuitem", { name: "Unavailable commands" }).press("ArrowDown");
  await expect(popup.getByRole("menuitem", { name: "Done", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(popup.getByRole("menuitem", { name: "Delete locked document" })).toBeFocused();
  for (const label of ["Delete locked document", "Locked sidebar", "Locked density", "Unavailable destination"]) {
    const item = popup.getByText(label, { exact: true });
    await expect(item).toHaveAttribute("aria-disabled", "true");
    await item.focus();
    await page.keyboard.press("Enter");
    await expect(popup).toBeVisible();
    await expect(page.locator('[data-slot="menubar-sub-content"]')).toHaveCount(0);
  }
  await expect(popup.getByRole("menuitemcheckbox")).toHaveAttribute("aria-checked", "true");
  await close();
  await card("controlled").getByRole("button", { name: "Open externally" }).click();
  await expect(popup).toBeVisible();
  const t = await card("controlled").locator('[data-slot="menubar-trigger"]').boundingBox();
  const p = await popup.boundingBox();
  if (!t || !p) throw new Error("missing controlled anchor");
  expect(Math.abs(p.y - t.y - t.height - 8)).toBeLessThan(1);
  await popup.getByRole("menuitem", { name: "Save", exact: true }).click();
  await expect(popup).toHaveCount(0);
  await expect(card("controlled").getByRole("status")).toHaveText("Saved locally");
  const focusPath = [];
  const captureFocus = () =>
    page.evaluate(() => {
      const active = document.activeElement;
      return {
        slot: active?.getAttribute("data-slot"),
        text: active?.textContent?.slice(0, 80),
        connected: !!active?.isConnected,
        body: active === document.body,
        hidden: !!active?.closest('[data-base-ui-focus-guard], [aria-hidden="true"], [inert]'),
        visible: !!active && getComputedStyle(active).visibility === "visible" && !!active.getClientRects().length,
        inPanel: !!active?.closest('[data-slot="menubar-content"]'),
        inBar: !!active?.closest('[data-slot="menubar"]'),
      };
    });
  for (const key of ["Tab", "Shift+Tab"]) {
    await view.press("ArrowDown");
    await expect(popup.getByRole("menuitemcheckbox", { name: "Sidebar", exact: true })).toBeFocused();
    focusPath.push({ key: `before ${key}`, focus: await captureFocus() });
    await page.keyboard.press(key);
    await page.evaluate(() => new Promise(requestAnimationFrame));
    const first = await captureFocus();
    focusPath.push({ key, focus: first });
    expect(first.connected && first.visible && !first.body && !first.hidden).toBe(true);
    if (key === "Shift+Tab") {
      await expect(view).toBeFocused();
      await expect(popup).toBeVisible();
      await page.keyboard.press("Shift+Tab");
      await page.evaluate(() => new Promise(requestAnimationFrame));
      focusPath.push({ key: "second Shift+Tab", focus: await captureFocus() });
    }
    await expect(popup).toHaveCount(0);
    const outside = await captureFocus();
    expect(
      outside.connected && outside.visible && !outside.body && !outside.hidden && !outside.inPanel && !outside.inBar,
    ).toBe(true);
  }
  await info.attach("actual-menubar-tab-focus", { body: JSON.stringify(focusPath), contentType: "application/json" });
});

test("menubar orientation, loop boundaries, RTL and placement use actual geometry", async ({ page }) => {
  await page.goto("/components/menubar?motion=none");
  await page.waitForLoadState("networkidle");
  const card = (name: string) => page.locator(`[data-component-example="menubar/${name}"]`);
  const popup = page.locator('[data-slot="menubar-content"]');
  for (const loop of [true, false]) {
    const bar = card("traversal").getByRole("menubar", { name: loop ? "Looping menus" : "Bounded menus" });
    const file = bar.getByRole("menuitem", { name: "File", exact: true });
    const view = bar.getByRole("menuitem", { name: "View", exact: true });
    await file.focus();
    await page.keyboard.press("ArrowLeft");
    await expect(loop ? view : file).toBeFocused();
    await view.focus();
    await page.keyboard.press("ArrowRight");
    await expect(loop ? file : view).toBeFocused();
    await file.press("ArrowDown");
    await page.keyboard.press("ArrowRight");
    await expect(popup.getByRole("menuitem", { name: "Edit command" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(popup).toHaveCount(0);
  }
  const vertical = card("orientation").getByRole("menubar", { name: "vertical menus" });
  await expect(vertical).toHaveAttribute("aria-orientation", "vertical");
  const vf = vertical.getByRole("menuitem", { name: "File", exact: true });
  const ve = vertical.getByRole("menuitem", { name: "Edit", exact: true });
  const a = await vf.boundingBox();
  const b = await ve.boundingBox();
  if (!a || !b) throw new Error("missing vertical bar");
  expect(b.y).toBeGreaterThan(a.y);
  expect(a.x).toBe(b.x);
  await vf.focus();
  await page.keyboard.press("ArrowDown");
  await expect(ve).toBeFocused();
  await ve.press("Enter");
  await expect(popup).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(popup).toHaveCount(0);
  for (const name of ["sides", "alignments", "logical-sides"]) {
    const triggers = card(name)
      .locator('[data-slot="menubar-trigger"]')
      .filter({ hasNotText: /^Help$/ });
    for (const trigger of await triggers.all()) {
      await trigger.click();
      await expect(popup).toBeVisible();
      const value = (await trigger.textContent())?.trim();
      const t = await trigger.boundingBox();
      const p = await popup.boundingBox();
      if (!t || !p) throw new Error("missing actual bounds");
      if (name === "sides") await expect(popup).toHaveAttribute("data-side", value ?? "");
      if (name === "logical-sides") {
        if (value === "inline-start") expect(p.x).toBeGreaterThan(t.x + t.width);
        else expect(p.x + p.width).toBeLessThan(t.x);
      }
      if (name === "alignments") {
        const f = value === "start" ? 0 : value === "end" ? 1 : 0.5;
        expect(Math.abs(p.x + p.width * f - t.x - t.width * f)).toBeLessThan(1);
      }
      await page.keyboard.press("Escape");
      await expect(popup).toHaveCount(0);
    }
  }
  const rtl = card("logical-sides").getByRole("menubar").first();
  await rtl.getByRole("menuitem", { name: "inline-start" }).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(rtl.getByRole("menuitem", { name: "Help" })).toBeFocused();
  for (const modal of [true, false]) {
    await card("modality")
      .getByRole("menuitem", { name: String(modal), exact: true })
      .click();
    await expect(popup).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          getComputedStyle(document.body).overflow === "hidden" ||
          getComputedStyle(document.documentElement).overflow === "hidden",
      ),
    ).toBe(modal);
    await page.keyboard.press("Escape");
    await expect(popup).toHaveCount(0);
  }
});

for (const os of [false, true])
  for (const mode of MODES)
    test(`menubar indicator frames and live cancellation ${mode}/${os}`, async ({ page }, info) => {
      await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
      await openPopupMotionFixture(page, "menubar", mode, 4);
      await page.locator('[data-slot="menubar-trigger"]').click();
      const item = page.getByRole("menuitemcheckbox", { name: "Comments", exact: true });
      const indicator = item.locator("[data-motion]");
      const frames = await item.evaluate(async (node) => {
        (node as HTMLElement).click();
        const frames = [];
        for (let i = 0; i < 22; i++) {
          await new Promise(requestAnimationFrame);
          const mark = node.querySelector("[data-motion]");
          if (!mark) throw new Error("missing real indicator");
          const s = getComputedStyle(mark);
          frames.push({
            opacity: Number(s.opacity),
            scale: s.transform === "none" ? 1 : new DOMMatrixReadOnly(s.transform).a,
          });
        }
        return frames;
      });
      await info.attach("actual-menubar-indicator-frames", {
        body: JSON.stringify(frames),
        contentType: "application/json",
      });
      const actual = effectiveMode(mode, os);
      if (actual !== "none") expect(frames.some((f) => f.opacity > 0 && f.opacity < 1)).toBe(true);
      else expect(frames.every((f) => f.opacity === 0)).toBe(true);
      if (actual === "full") expect(frames.some((f) => f.scale < 0.999)).toBe(true);
      else expect(frames.every((f) => f.scale === 1)).toBe(true);
      const saved = await indicator.elementHandle();
      const change = async (value: string) =>
        page.getByLabel("Fixture motion").evaluate((node, value) => {
          (node as HTMLSelectElement).value = value;
          node.dispatchEvent(new Event("change", { bubbles: true }));
        }, value);
      await change("full");
      await item.click();
      await expect(indicator).toHaveAttribute("data-motion", effectiveMode("full", os));
      await change("none");
      await expect(indicator).toHaveAttribute("data-motion", "none");
      await expect(indicator).toHaveCSS("opacity", "1");
      expect(
        await indicator.evaluate((node, saved) => node === saved && node.getAnimations().length === 0, saved),
      ).toBe(true);
    });
