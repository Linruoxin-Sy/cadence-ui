import { expect, type Page, test } from "@playwright/test";
import { effectiveMode, MODES, pressScale } from "./helpers";
import { openComponentSource } from "./installation-helpers";
import { expectMenuAccessibility } from "./menu-accessibility";
import { openPopupMotionFixture } from "./popup-motion-fixture";

const card = (page: Page, name: string) => page.locator(`[data-component-example="data-table/${name}"]`);
async function open(page: Page, mode = "none") {
  await page.goto(`/components/data-table?motion=${mode}`);
  await page.waitForLoadState("networkidle");
}
const runtimeErrors = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  const errors: string[] = [];
  runtimeErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
});
test.afterEach(({ page }) => expect(runtimeErrors.get(page)).toEqual([]));

for (const os of [false, true])
  for (const mode of MODES)
    test(`Data Table named data, selection and caller updates ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
      await open(page, mode);
      const effective = effectiveMode(mode, os);
      const top = page.locator('[data-preview="data-table"]');
      await expect(top.locator("select")).toHaveCount(0);
      await expect(top.getByRole("button", { name: "Update first payment" })).toHaveCount(0);
      for (const root of await page
        .locator('[data-component-example]:not([data-component-example$="/without-motion"]) [data-slot="data-table"]')
        .all())
        await expect(root).toHaveAttribute("data-motion", effective);
      const application = card(page, "application-data");
      for (const status of ["pending", "processing", "success", "failed"])
        await expect(application.getByText(status, { exact: true })).toBeVisible();
      const controlled = card(page, "controlled-sorting-and-pagination");
      await controlled.getByRole("button", { name: "Next", exact: true }).press("Enter");
      await expect(controlled.locator("output")).toContainText("Page 2");
      await expect(controlled.getByText("person06@example.com")).toBeVisible();
      await controlled.getByLabel("Rows per page").selectOption("20");
      await expect(controlled.locator("tbody tr")).toHaveCount(20);
      await controlled.getByRole("button", { name: "Email", exact: true }).press("Space");
      await expect(controlled.locator("output")).toContainText("ascending");
      await controlled.getByRole("button", { name: "Email", exact: true }).press("Enter");
      await expect(controlled.locator("output")).toContainText("descending");
      await controlled.getByRole("button", { name: "Reset sorting and page" }).click();
      await expect(controlled.locator("output")).toHaveText("Page 1; email sort: unsorted");
      await expect(controlled.getByLabel("Rows per page")).toHaveValue("5");
      const filtering = card(page, "controlled-filter");
      await expect(filtering.getByRole("textbox")).toHaveValue("person01");
      await filtering.getByRole("textbox").fill("PERSON02");
      await expect(filtering.getByText("person02@example.com", { exact: true })).toBeVisible();
      await expect(filtering.locator("output")).toContainText("PERSON02");
      await filtering.getByRole("button", { name: "Clear email filter" }).click();
      await expect(filtering.locator('[role="status"]')).toContainText("0 of 23");
      const selection = card(page, "row-selection");
      await expect(selection.getByRole("checkbox", { name: "Select all", exact: true })).toHaveAttribute(
        "aria-checked",
        "mixed",
      );
      await selection.getByRole("checkbox", { name: "Select all", exact: true }).press("Space");
      await expect(selection.locator('[role="status"]')).toContainText("10 of 23");
      await selection.getByRole("button", { name: "Next", exact: true }).click();
      await expect(selection.getByRole("checkbox", { name: "Select all", exact: true })).toHaveAttribute(
        "aria-checked",
        "false",
      );
      await selection.getByRole("textbox").fill("person01");
      await expect(selection.locator('[role="status"]')).toContainText("1 of 1");
      await expect(selection.locator("output")).toContainText("payment-10");
      await selection.getByRole("button", { name: "Clear selected IDs" }).click();
      await expect(selection.locator("output")).toHaveText("Selected IDs: none");
      const updates = card(page, "updating-rows"),
        input = updates.getByRole("textbox"),
        table = updates.getByRole("table");
      const savedInput = await input.elementHandle(),
        savedTable = await table.elementHandle();
      const row = await updates.getByText("lee@example.com", { exact: true }).evaluateHandle((el) => el.closest("tr"));
      await input.fill("example.com");
      await input.focus();
      const frames = await updates
        .getByRole("button", { name: "Update first payment", exact: true })
        .evaluate(async (button) => {
          const input = button.closest("[data-component-example]")?.querySelector("input");
          if (!input) throw new Error("Missing real filter");
          const frames = [];
          for (let i = 0; i < 12; i++) {
            (button as HTMLButtonElement).click();
            await new Promise(requestAnimationFrame);
            const table = button.closest("[data-component-example]")?.querySelector("table");
            if (!table) throw new Error("Missing real table");
            frames.push({
              focused: document.activeElement === input,
              value: input.value,
              transform: getComputedStyle(table).transform,
              animations: table.getAnimations().length,
            });
          }
          return frames;
        });
      expect(
        frames.every((f) => f.focused && f.value === "example.com" && f.transform === "none" && f.animations === 0),
      ).toBe(true);
      await updates.getByRole("button", { name: "Update first payment", exact: true }).click();
      await expect(updates.getByText("$999.00")).toBeVisible();
      await updates.getByRole("button", { name: "Reverse records" }).press("Space");
      expect(
        await updates
          .getByText("lee@example.com", { exact: true })
          .evaluate((el, saved) => el.closest("tr") === saved, row),
      ).toBe(true);
      await expect(updates.getByRole("checkbox", { name: "Select lee@example.com" })).toHaveAttribute(
        "aria-checked",
        "true",
      );
      await input.focus();
      for (const next of ["none", "reduced", "full"])
        await page.getByRole("group", { name: "Motion mode" }).getByRole("button", { name: next, exact: true }).click();
      await expect(input).toHaveValue("example.com");
      expect(await input.evaluate((el, saved) => el === saved, savedInput)).toBe(true);
      expect(await table.evaluate((el, saved) => el === saved, savedTable)).toBe(true);
      await openComponentSource(page, "data-table");
      await expect(input).toHaveValue("example.com");
      await updates.getByRole("button", { name: "Remove first payment" }).click();
      await expect(updates.locator('[role="status"]')).toContainText("0 of 3");
      await updates.getByRole("button", { name: "Restore records" }).click();
      await expect(updates.getByText("$42.00")).toBeVisible();
      await expect(top.getByRole("textbox")).toHaveValue("");
      await top.getByRole("button", { name: "Email", exact: true }).scrollIntoViewIfNeeded();
      const heldScale = await pressScale(page, '[data-preview="data-table"] th [data-slot="button"]');
      if (effectiveMode("full", os) === "full") expect(heldScale).toBeLessThan(1);
      else expect(heldScale).toBe(1);
      const ids = await page.locator("[id]").evaluateAll((nodes) => nodes.map((n) => n.id));
      expect(new Set(ids).size).toBe(ids.length);
    });

test("Data Table visibility, read-only empty results, native props and real menu focus", async ({ page }) => {
  await open(page);
  const c = card(page, "column-visibility"),
    trigger = c.getByRole("button", { name: "Columns", exact: true });
  await expect(c.getByRole("columnheader", { name: "Status", exact: true })).toHaveCount(0);
  await trigger.focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitemcheckbox")).toHaveCount(3);
  await expect(page.getByRole("menuitemcheckbox", { name: "status", exact: true })).toBeFocused();
  await page.keyboard.press("Space");
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(c.getByRole("columnheader", { name: "Status", exact: true })).toBeVisible();
  await c.getByRole("textbox").fill("lee");
  await trigger.click();
  await page.getByRole("menuitemcheckbox", { name: "email", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(c.getByRole("textbox")).toHaveValue("lee");
  await expect(c.getByRole("columnheader", { name: "Email", exact: true })).toHaveCount(0);
  const empty = card(page, "empty-results");
  await expect(empty.getByText("No results.")).toHaveCount(2);
  await expect(empty.getByText("No results.").first()).toHaveAttribute("colspan", "4");
  await expect(empty.getByText("No results.").last()).toHaveAttribute("colspan", "5");
  await empty.getByRole("textbox").first().fill("lee");
  await expect(empty.getByRole("textbox").first()).toHaveValue("no-match");
  const native = card(page, "native-container");
  await native.getByRole("button", { name: "Focus payment region" }).click();
  await expect(native.getByRole("region", { name: "Regional payments" })).toBeFocused();
  expect(await native.getByRole("region").evaluate((el) => getComputedStyle(el).borderTopStyle)).toBe("dashed");
  await native.getByRole("button", { name: "Email", exact: true }).click();
  await expect(native.locator("output")).toHaveText("Region clicks: 1");
  const fixed = card(page, "without-motion"),
    fixedTrigger = fixed.getByRole("button", { name: "Columns", exact: true });
  await page.getByRole("group", { name: "Motion mode" }).getByRole("button", { name: "full", exact: true }).click();
  await fixedTrigger.click();
  await expect(page.getByRole("menu")).toHaveAttribute("data-motion", "none");
  await expectMenuAccessibility(page, async () => {
    if (!(await page.getByRole("menu").count())) await fixedTrigger.click();
  });
  await page.keyboard.press("Escape");
  await expect(fixedTrigger).toBeFocused();
});

for (const mode of MODES)
  test(`Data Table menu first insertion and running cancellation ${mode}`, async ({ page }, testInfo) => {
    await openPopupMotionFixture(page, "data-table", mode, 4);
    const preview = page.locator('[data-preview="data-table"]');
    const trigger = preview.getByRole("button", { name: "Columns", exact: true });
    await page.evaluate(() => {
      const state = window as unknown as { frames: unknown[]; stop: boolean };
      state.frames = [];
      state.stop = false;
      const tick = () => {
        const el = document.querySelector('[data-slot="dropdown-menu-content"]');
        if (el) {
          const s = getComputedStyle(el);
          state.frames.push({
            opacity: s.opacity,
            scale: s.scale,
            duration: s.transitionDuration,
            animations: el.getAnimations().length,
          });
        }
        if (!state.stop) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await trigger.click();
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    if (mode !== "none") await expect.poll(() => menu.evaluate((el) => el.getAnimations().length)).toBeGreaterThan(0);
    const saved = await menu.elementHandle();
    if (mode !== "none") {
      await page.getByLabel("Fixture motion", { exact: true }).evaluate((el) => {
        (el as HTMLSelectElement).value = "none";
        el.dispatchEvent(new Event("change", { bubbles: true }));
      });
      await expect(menu).toHaveAttribute("data-motion", "none");
      expect(await menu.evaluate((el, prior) => el === prior, saved)).toBe(true);
      await expect.poll(() => menu.evaluate((el) => el.getAnimations().length)).toBe(0);
    }
    await expect(menu).toHaveCSS("opacity", "1");
    await expect(menu).toHaveCSS("scale", "none");
    const samples = await page.evaluate(async () => {
      for (let i = 0; i < 12; i++) await new Promise(requestAnimationFrame);
      const state = window as unknown as {
        frames: { opacity: string; scale: string; duration: string; animations: number }[];
        stop: boolean;
      };
      state.stop = true;
      return state.frames;
    });
    await testInfo.attach("actual-first-insertion-frames", {
      body: JSON.stringify(samples),
      contentType: "application/json",
    });
    expect(samples.length).toBeGreaterThan(0);
    if (mode === "none")
      expect(
        samples.every((f) => f.opacity === "1" && f.scale === "none" && f.duration === "0s" && f.animations === 0),
      ).toBe(true);
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  });

for (const hash of ["application-data", "updating-rows", "without-motion"])
  test(`Data Table cold full deep link ${hash}`, async ({ page }) => {
    await page.goto(`/components/data-table?motion=full#${hash}`);
    await page.waitForLoadState("networkidle");
    const c = card(page, hash);
    await c.getByRole("textbox").fill("lee");
    await expect(c.getByText("lee@example.com", { exact: true })).toBeVisible();
  });

for (const os of [false, true])
  test(`Data Table running exit reversal and OS downgrade ${os}`, async ({ page }, info) => {
    await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
    await openPopupMotionFixture(page, "data-table", "full", 4);
    const trigger = page.locator('[data-preview="data-table"]').getByRole("button", { name: "Columns", exact: true });
    await trigger.press("ArrowDown");
    const popup = page.locator('[data-slot="dropdown-menu-content"]');
    await expect(popup).toHaveCSS("opacity", "1");
    const saved = await popup.elementHandle();
    await page.keyboard.press("Escape");
    await expect(popup).toHaveAttribute("data-ending-style", "");
    expect(await popup.evaluate((el) => el.getAnimations().length)).toBeGreaterThan(0);
    await trigger.press("ArrowDown");
    await expect(popup).not.toHaveAttribute("data-ending-style", "");
    expect(await popup.evaluate((el, prior) => el === prior, saved)).toBe(true);
    await expect(popup).toHaveCSS("opacity", "1");
    await page.keyboard.press("Escape");
    await expect(popup).toHaveAttribute("data-ending-style", "");
    await trigger.press("ArrowDown");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(popup).toHaveAttribute("data-motion", "reduced");
    await expect(popup).toHaveCSS("scale", "none");
    const frames = await popup.evaluate(async (el) => {
      const values = [];
      for (let i = 0; i < 12; i++) {
        await new Promise(requestAnimationFrame);
        values.push({
          scale: getComputedStyle(el).scale,
          properties: el
            .getAnimations()
            .map((a) => (a instanceof CSSTransition ? a.transitionProperty : a.constructor.name)),
        });
      }
      return values;
    });
    await info.attach("OS-downgrade-native-frames", { body: JSON.stringify(frames), contentType: "application/json" });
    expect(frames.every((f) => f.scale === "none" && !f.properties.includes("scale"))).toBe(true);
    await page.getByLabel("Fixture motion", { exact: true }).evaluate((el) => {
      (el as HTMLSelectElement).value = "none";
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await expect(popup).toHaveAttribute("data-motion", "none");
    await expect.poll(() => popup.evaluate((el) => el.getAnimations().length)).toBe(0);
    expect(await popup.evaluate((el, prior) => el === prior, saved)).toBe(true);
    await page.keyboard.press("Escape");
    await expect(popup).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

test("Data Table fixed none production menu is visible on its first inserted frame", async ({ page }, info) => {
  await open(page, "full");
  // Keep the full document's entrance at the initial viewport until it settles.
  // Jumping to the last specimen during the initial clip can strand the target
  // outside the visible/hittable portion of the article.
  await expect(page.locator("article[data-document-entrance]")).toHaveCSS("clip-path", "none");
  const fixed = card(page, "without-motion"),
    trigger = fixed.getByRole("button", { name: "Columns", exact: true });
  await trigger.evaluate((node) => node.scrollIntoView({ block: "center" }));
  await page.evaluate(() => {
    const state = window as unknown as {
      noneFrames: { opacity: string; scale: string; duration: string; animations: number }[];
      noneDone: boolean;
    };
    state.noneFrames = [];
    state.noneDone = false;
    const tick = () => {
      const el = document.querySelector('[data-slot="dropdown-menu-content"]');
      if (el) {
        const s = getComputedStyle(el);
        state.noneFrames.push({
          opacity: s.opacity,
          scale: s.scale,
          duration: s.transitionDuration,
          animations: el.getAnimations().length,
        });
      }
      if (!state.noneDone) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await trigger.click();
  await expect(page.getByRole("menu")).toHaveAttribute("data-motion", "none");
  const frames = await page.evaluate(async () => {
    for (let i = 0; i < 12; i++) await new Promise(requestAnimationFrame);
    const state = window as unknown as {
      noneFrames: { opacity: string; scale: string; duration: string; animations: number }[];
      noneDone: boolean;
    };
    state.noneDone = true;
    return state.noneFrames;
  });
  await info.attach("fixed-none-production-first-insertion", {
    body: JSON.stringify(frames),
    contentType: "application/json",
  });
  expect(frames.length).toBeGreaterThanOrEqual(12);
  expect(
    frames.every((f) => f.opacity === "1" && f.scale === "none" && f.duration === "0s" && f.animations === 0),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});
