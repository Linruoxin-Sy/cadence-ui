import { expect, test } from "@playwright/test";
import { effectiveMode, MODES } from "./helpers";
import { openPopupMotionFixture } from "./popup-motion-fixture";

test("context-menu touch long press opens and moving the finger cancels", async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/components/context-menu?motion=none");
  await page.waitForLoadState("networkidle");
  const trigger = page.locator('[data-preview="context-menu"] [data-slot="context-menu-trigger"]');
  await trigger.scrollIntoViewIfNeeded();
  const box = await trigger.boundingBox();
  if (!box) throw new Error("missing touch target");
  const x = box.x + box.width / 2,
    y = box.y + box.height / 2;
  const cdp = await context.newCDPSession(page);
  try {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    await page.waitForTimeout(650);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    const popup = page.locator('[data-slot="context-menu-content"]');
    await expect(popup).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(popup).toHaveCount(0);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + 30, y }] });
    await page.waitForTimeout(650);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect(popup).toHaveCount(0);
  } finally {
    await cdp.detach();
  }
});

test("context-menu real targets, row alternative, local selection, disabled parts and caller closing", async ({
  page,
}) => {
  await page.goto("/components/context-menu?motion=none");
  await page.waitForLoadState("networkidle");
  const card = (name: string) => page.locator(`[data-component-example="context-menu/${name}"]`);
  const popup = page.locator('[data-slot="context-menu-content"]');
  const target = (name: string) => card(name).locator('[data-slot="context-menu-trigger"]').first();
  const dismiss = async () => {
    await page.keyboard.press("Escape");
    await expect(popup).toHaveCount(0);
  };
  const top = page.locator('[data-preview="context-menu"] [data-slot="context-menu-trigger"]');
  await top.focus();
  await top.press("Shift+F10");
  await page.keyboard.press("r");
  await expect(popup.getByRole("menuitem", { name: "Rename", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(popup).toHaveCount(0);
  await expect(top).toContainText("Roadmap (renamed).md");
  await expect(top).toBeFocused();

  await target("row-menu").click({ button: "right" });
  await popup.getByRole("menuitem", { name: "Rename", exact: true }).click();
  await expect(popup).toHaveCount(0);
  await expect(card("row-menu").locator('[role="status"]')).toHaveText("Rename selected locally");
  await card("row-menu").getByRole("button", { name: "Row actions", exact: true }).click();
  await page
    .locator('[data-slot="dropdown-menu-content"]')
    .getByRole("menuitem", { name: "Open", exact: true })
    .click();
  await expect(card("row-menu").locator('[role="status"]')).toHaveText("Open selected locally");

  const selection = target("selection");
  const saved = await selection.elementHandle();
  await selection.click({ button: "right" });
  await expect(popup.getByRole("group", { name: "Show", exact: true })).toBeVisible();
  await popup.getByRole("menuitemcheckbox", { name: "Grid", exact: true }).click();
  await popup.getByRole("menuitemradio", { name: "Date modified", exact: true }).click();
  await expect(popup).toBeVisible();
  await expect(card("selection").locator('[role="status"]')).toHaveText("Grid: hidden; sort: date");
  await dismiss();
  await page.getByRole("group", { name: "Motion mode" }).getByRole("button", { name: "reduced", exact: true }).click();
  await selection.click({ button: "right" });
  await expect(popup.getByRole("menuitemcheckbox", { name: "Grid", exact: true })).toHaveAttribute(
    "aria-checked",
    "false",
  );
  await expect(popup.getByRole("menuitemradio", { name: "Date modified", exact: true })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  expect(await selection.evaluate((node, saved) => node === saved, saved)).toBe(true);
  await dismiss();

  await target("submenus").press("Shift+F10");
  const sub = popup.getByRole("menuitem", { name: "Open with", exact: true });
  await sub.focus();
  await page.keyboard.press("ArrowRight");
  const child = page.locator('[data-slot="context-menu-sub-content"]');
  await expect(child).toBeVisible();
  await page.keyboard.press("ArrowLeft");
  await expect(sub).toBeFocused();
  await page.mouse.move(0, 0);
  await sub.hover();
  await expect(child).toBeVisible();
  await child.getByRole("menuitem", { name: "Editor", exact: true }).click();
  await expect(popup).toHaveCount(0);
  await expect(child).toHaveCount(0);
  await expect(card("submenus").locator('[role="status"]')).toHaveText("Editor");

  await target("items").click({ button: "right" });
  await popup.getByRole("menuitem", { name: "Keep open", exact: true }).click();
  await expect(popup).toBeVisible();
  await expect(card("items").locator('[role="status"]')).toHaveText("Still open");
  await expect(popup.getByRole("menuitem", { name: "Rename", exact: false })).toHaveAttribute("data-inset", "true");
  const locked = popup.getByRole("menuitem", { name: "Locked command", exact: true });
  await locked.focus();
  await expect(locked).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(card("items").locator('[role="status"]')).toHaveText("Still open");
  for (const label of ["Locked visibility", "Locked sort", "Unavailable app"]) {
    const item = popup.getByText(label, { exact: true });
    await expect(item).toHaveAttribute("aria-disabled", "true");
    await item.focus();
    await page.keyboard.press("Space");
    await expect(item).toBeFocused();
  }
  await expect(child).toHaveCount(0);
  await expect(popup.getByRole("menuitemcheckbox")).toHaveAttribute("aria-checked", "true");
  await expect(popup.getByRole("menuitemradio")).toHaveAttribute("aria-checked", "true");
  await popup.getByRole("menuitem", { name: "Delete", exact: false }).click();
  await expect(popup).toHaveCount(0);
  await expect(card("items").locator('[role="status"]')).toHaveText("Deleted locally");
  const disabled = card("items").getByText("Disabled target", { exact: true });
  await expect(disabled).toHaveAttribute("aria-disabled", "true");
  await disabled.scrollIntoViewIfNeeded();
  const disabledBox = await disabled.boundingBox();
  if (!disabledBox) throw new Error("missing disabled target");
  await page.mouse.click(disabledBox.x + disabledBox.width / 2, disabledBox.y + disabledBox.height / 2, {
    button: "right",
  });
  await expect(popup).toHaveCount(0);
  await disabled.focus();
  await disabled.press("Shift+F10");
  await expect(popup).toHaveCount(0);
  await target("controlled").click({ button: "right" });
  await expect(card("controlled").locator('[role="status"]')).toContainText("Open:");
  await popup.getByRole("menuitem", { name: "Close from caller", exact: true }).click();
  await expect(popup).toHaveCount(0);
  await expect(card("controlled").locator('[role="status"]')).toHaveText("Closed: Caller closed");
  const tabProof = [];
  for (const key of ["Tab", "Shift+Tab"]) {
    await selection.press("Shift+F10");
    await expect(popup).toBeVisible();
    await popup.getByRole("menuitemcheckbox", { name: "Grid", exact: true }).focus();
    await page.keyboard.press(key);
    if (key === "Tab") {
      await expect(popup).toBeVisible();
      await expect.poll(() => popup.evaluate((node) => node.contains(document.activeElement))).toBe(true);
    } else {
      await expect(popup).toHaveCount(0);
      await expect(selection).toBeFocused();
    }
    const focus = await page.evaluate(() => {
      const active = document.activeElement;
      const panel = document.querySelector('[data-slot="context-menu-content"]');
      return {
        open: !!panel,
        inside: !!panel?.contains(active),
        connected: !!active?.isConnected,
        slot: active?.getAttribute("data-slot"),
        hidden: !!active?.closest('[data-base-ui-focus-guard], [aria-hidden="true"], [inert]'),
      };
    });
    expect(focus.open).toBe(key === "Tab");
    expect(focus.inside).toBe(key === "Tab");
    expect(focus.connected).toBe(true);
    expect(focus.hidden).toBe(false);
    tabProof.push({ key, ...focus });
    if (key === "Tab") await dismiss();
    await expect(selection).toBeFocused();
  }
  await test
    .info()
    .attach("actual-context-menu-tab-focus", { body: JSON.stringify(tabProof), contentType: "application/json" });
});

test("context-menu fixed cursor sides, alignment, RTL and collision containment", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto("/components/context-menu?motion=none");
  await page.waitForLoadState("networkidle");
  const popup = page.locator('[data-slot="context-menu-content"]');
  for (const name of ["sides", "alignments", "logical-sides"]) {
    for (const trigger of await page
      .locator(`[data-component-example="context-menu/${name}"] [data-slot="context-menu-trigger"]`)
      .all()) {
      await trigger.scrollIntoViewIfNeeded();
      const t = await trigger.boundingBox();
      if (!t) throw new Error("missing actual context target");
      await trigger.evaluate((node) =>
        node.addEventListener(
          "contextmenu",
          (event) => {
            const pointer = event as MouseEvent;
            (window as unknown as { actualCursor: { x: number; y: number } }).actualCursor = {
              x: pointer.clientX,
              y: pointer.clientY,
            };
          },
          { once: true },
        ),
      );
      await trigger.click({ button: "right", position: { x: t.width / 2, y: t.height / 2 } });
      const { x, y } = await page.evaluate(
        () => (window as unknown as { actualCursor: { x: number; y: number } }).actualCursor,
      );
      const p = await popup.boundingBox();
      if (!p) throw new Error("missing pointer-anchored panel");
      const value = (await trigger.textContent())?.trim();
      const side = value === "inline-start" ? "right" : value === "inline-end" ? "left" : value;
      if (name === "alignments") {
        const fraction = value === "start" ? 0 : value === "end" ? 1 : 0.5;
        expect(Math.abs(p.x + p.width * fraction - x)).toBeLessThan(1);
      } else {
        if (side === "right") expect(Math.abs(p.x - x - 8)).toBeLessThan(1);
        if (side === "left") expect(Math.abs(p.x + p.width - x + 8)).toBeLessThan(1);
        if (side === "top") expect(Math.abs(p.y + p.height - y + 8)).toBeLessThan(1);
        if (side === "bottom") expect(Math.abs(p.y - y - 8)).toBeLessThan(1);
      }
      await page.keyboard.press("Escape");
      await expect(popup).toHaveCount(0);
    }
  }
});

for (const os of [false, true])
  for (const mode of MODES)
    test(`context-menu indicator frames and live cancellation ${mode}/${os}`, async ({ page }, info) => {
      await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
      await openPopupMotionFixture(page, "context-menu", mode, 4);
      await page.locator('[data-slot="context-menu-trigger"]').click({ button: "right" });
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
      await info.attach("actual-context-menu-indicator-frames", {
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
