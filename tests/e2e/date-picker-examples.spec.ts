import { readFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const examples: Record<"date-picker", string[]> = JSON.parse(
  readFileSync("components/site/previews/examples.json", "utf8"),
);

import { effectiveMode, MODES } from "./helpers";
import { openPopupMotionFixture } from "./popup-motion-fixture";

const card = (page: Page, id: string) => page.locator(`[data-component-example="date-picker/${id}"]`);
async function open(page: Page, mode = "none") {
  await page.goto(`/components/date-picker?motion=${mode}`);
  await page.waitForLoadState("networkidle");
}
const runtimeErrors = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  const errors: string[] = [];
  runtimeErrors.set(page, errors);
  page.on("pageerror", (e) => errors.push(e.message));
});
test.afterEach(({ page }) => expect(runtimeErrors.get(page)).toEqual([]));

for (const os of [false, true])
  for (const mode of MODES)
    test(`Date Picker independent examples ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
      await open(page, mode);
      const top = page.locator('[data-preview="date-picker"]');
      await expect(top.getByRole("button")).toHaveCount(1);
      await expect(top.locator("select")).toHaveCount(0);
      for (const root of await page
        .locator('[data-component-example]:not([data-component-example$="/without-motion"]) [data-slot="date-picker"]')
        .all())
        await expect(root).toHaveAttribute("data-motion", effectiveMode(mode, os));
      const initial = card(page, "initial-values");
      await initial.getByRole("button", { name: /Optional date:/ }).press("Enter");
      let popup = page.getByRole("dialog", { name: "Optional date", exact: true });
      await popup.getByRole("button", { name: /November 12th/ }).click();
      await expect(initial.getByRole("button", { name: /Optional date:/ })).toContainText("November 12th");
      await popup.getByRole("button", { name: /November 12th/ }).click();
      await expect(initial.getByRole("button", { name: /Optional date:/ })).toContainText("Choose an optional date");
      await page.keyboard.press("Escape");
      await initial.getByRole("button", { name: /Read-only date:/ }).click();
      popup = page.getByRole("dialog", { name: "Read-only date", exact: true });
      await popup.getByRole("button", { name: /November 12th/ }).click();
      await expect(initial.getByRole("button", { name: /Read-only date:/ })).toContainText("November 20th");
      await page.keyboard.press("Escape");
      const controlled = card(page, "controlled-date-and-clearing");
      const trigger = controlled.getByRole("button", { name: /Controlled appointment:/ });
      await trigger.click();
      popup = page.getByRole("dialog", { name: "Controlled appointment", exact: true });
      const savedTrigger = await trigger.elementHandle();
      await popup.getByRole("button", { name: /next month/i }).click();
      await expect(popup.getByRole("grid")).toHaveAttribute("aria-label", "December 2026");
      await controlled.getByRole("button", { name: "Set November 20", exact: true }).click();
      await expect(trigger).toContainText("November 20th");
      await expect(popup).toHaveCount(0);
      expect(await trigger.evaluate((el, saved) => el === saved, savedTrigger)).toBe(true);
      await controlled.getByRole("button", { name: "Clear date", exact: true }).click();
      await expect(trigger).toContainText("Pick a date");
      await expect(top.getByRole("button")).toContainText("November 12th");
      const range = card(page, "range-and-presets");
      await range.getByRole("button", { name: "Apply travel preset", exact: true }).click();
      await expect(range.getByRole("button", { name: /Travel dates:/ })).toContainText(
        "November 10th, 2026 – November 15th, 2026",
      );
      await range.getByRole("button", { name: "Clear travel dates", exact: true }).click();
      await range.getByRole("button", { name: /Travel dates:/ }).click();
      popup = page.getByRole("dialog", { name: "Travel dates", exact: true });
      await popup.getByRole("button", { name: /November 10th/ }).click();
      await expect(range.locator("output")).toHaveText("Choose an end date");
      await popup.getByRole("button", { name: /November 15th/ }).click();
      await expect(range.locator("output")).toHaveText("Range complete");
      await page.keyboard.press("Escape");
      await card(page, "disabled-dates")
        .getByRole("button", { name: /Weekday appointment:/ })
        .click();
      popup = page.getByRole("dialog", { name: "Weekday appointment", exact: true });
      await expect(popup.getByRole("button", { name: /November 5th/ })).toBeDisabled();
      await expect(popup.getByRole("button", { name: /November 7th/ })).toBeDisabled();
      await page.keyboard.press("Escape");
      const invalid = card(page, "caller-errors").getByRole("button");
      await expect(invalid).toHaveAttribute("aria-invalid", "true");
      await expect(invalid).toHaveAccessibleDescription("Choose an appointment before submitting.");
      const ids = await page.locator("[id]").evaluateAll((els) => els.map((el) => el.id));
      expect(ids.length).toBe(new Set(ids).size);
    });

test("Date Picker birth captions, fixed locale, native drafts and custom parts", async ({ page }) => {
  await open(page);
  await card(page, "birth-dates").getByRole("button").click();
  let popup = page.getByRole("dialog", { name: "Birth date", exact: true });
  await expect(popup.getByRole("button", { name: /November 2nd/ })).toBeDisabled();
  await expect(popup.getByRole("combobox", { name: /year/i })).toHaveValue("2026");
  await popup.getByRole("combobox", { name: /year/i }).selectOption("2000");
  await expect(popup.getByRole("grid")).toHaveAttribute("aria-label", "November 2000");
  await page.keyboard.press("Escape");
  const localized = card(page, "locale").getByRole("button");
  await expect(localized).toContainText("12 novembre 2026");
  await localized.click();
  popup = page.getByRole("dialog", { name: "Rendez-vous", exact: true });
  await expect(popup.getByRole("grid")).toHaveAttribute("aria-label", "novembre 2026");
  await page.keyboard.press("Escape");
  const input = card(page, "date-input").getByLabel("Appointment date input", { exact: true });
  await input.fill("2026-11-20");
  await expect(card(page, "date-input").getByRole("button")).toContainText("November 20th");
  await input.fill("");
  await expect(card(page, "date-input").getByRole("button")).toContainText("Pick a date");
  await card(page, "date-input").getByRole("button").click();
  await page
    .getByRole("dialog", { name: "Date input calendar", exact: true })
    .getByRole("button", { name: /November 13th/ })
    .click();
  await expect(input).toHaveValue("2026-11-13");
  await page.keyboard.press("Escape");
  const time = card(page, "time").getByLabel("Meeting time", { exact: true });
  await time.fill("14:45");
  await card(page, "time").getByRole("button").click();
  await page
    .getByRole("dialog", { name: "Meeting day", exact: true })
    .getByRole("button", { name: /November 20th/ })
    .click();
  await page.keyboard.press("Escape");
  await expect(time).toHaveValue("14:45");
  await expect(input).toHaveValue("2026-11-13");
  const c = card(page, "custom-parts");
  await c.getByRole("button", { name: "Focus date trigger", exact: true }).click();
  const trigger = c.getByRole("button", { name: /Custom appointment:/ });
  await expect(trigger).toBeFocused();
  await trigger.press("Enter");
  await expect(c.locator("output")).toHaveText("Trigger activations: 1");
  await expect(page.getByRole("dialog", { name: "Custom appointment", exact: true })).toHaveClass(/border-dashed/);
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  const controlled = card(page, "controlled-month-and-open");
  await controlled.getByRole("button", { name: "Open December", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Controlled calendar", exact: true }).getByRole("grid"),
  ).toHaveAttribute("aria-label", "December 2026");
  await controlled.getByRole("button", { name: "Close calendar", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(controlled.locator("output")).toHaveText("Closed; displayed month: 12");
});

for (const mode of MODES)
  test(`Date Picker actual first insertion ${mode}`, async ({ page }, info) => {
    await openPopupMotionFixture(page, "date-picker", mode, 4);
    await page.evaluate(() => {
      const state = window as unknown as { frames: unknown[]; stop: boolean };
      state.frames = [];
      state.stop = false;
      const tick = () => {
        const el = document.querySelector('[data-slot="popover-content"]');
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
    await page.getByRole("button", { name: /Fixture appointment:/ }).press("Enter");
    const popup = page.getByRole("dialog");
    await expect(popup).toHaveCSS("opacity", "1");
    const frames = await page.evaluate(async () => {
      for (let i = 0; i < 12; i++) await new Promise(requestAnimationFrame);
      const s = window as unknown as {
        frames: { opacity: string; scale: string; duration: string; animations: number }[];
        stop: boolean;
      };
      s.stop = true;
      return s.frames;
    });
    await info.attach("actual-first-inserted-frames", {
      body: JSON.stringify(frames),
      contentType: "application/json",
    });
    expect(frames.length).toBeGreaterThanOrEqual(12);
    if (mode === "none")
      expect(
        frames.every((f) => f.opacity === "1" && f.scale === "none" && f.duration === "0s" && f.animations === 0),
      ).toBe(true);
    else expect(new Set(frames.map((f) => f.opacity)).size).toBeGreaterThan(1);
    if (mode === "full") expect(frames.some((f) => f.scale !== "none" && f.scale !== "1")).toBe(true);
    else expect(frames.every((f) => f.scale === "none")).toBe(true);
  });

test("Date Picker real fixed none, header and source retain independent state", async ({ page }, info) => {
  await open(page, "full");
  const fixed = card(page, "without-motion"),
    trigger = fixed.getByRole("button");
  await page.evaluate(() => {
    const s = window as unknown as { fixedFrames: unknown[]; fixedStop: boolean };
    s.fixedFrames = [];
    s.fixedStop = false;
    function tick() {
      const p = document.querySelector('[data-slot="popover-content"]');
      if (p) {
        const c = getComputedStyle(p);
        s.fixedFrames.push({
          opacity: c.opacity,
          scale: c.scale,
          duration: c.transitionDuration,
          animations: p.getAnimations().length,
        });
      }
      if (!s.fixedStop) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
  await trigger.click();
  const frames = await page.evaluate(async () => {
    for (let i = 0; i < 12; i++) await new Promise(requestAnimationFrame);
    const s = window as unknown as {
      fixedFrames: { opacity: string; scale: string; duration: string; animations: number }[];
      fixedStop: boolean;
    };
    s.fixedStop = true;
    return s.fixedFrames;
  });
  await info.attach("production-fixed-none-first-insertion", {
    body: JSON.stringify(frames),
    contentType: "application/json",
  });
  expect(frames.length).toBeGreaterThanOrEqual(12);
  expect(
    frames.every((f) => f.opacity === "1" && f.scale === "none" && f.duration === "0s" && f.animations === 0),
  ).toBe(true);
  await page.keyboard.press("Escape");
  const input = card(page, "time").getByLabel("Meeting time", { exact: true });
  await input.fill("13:45");
  const saved = await input.elementHandle();
  for (const mode of ["none", "reduced", "full"]) {
    await page.getByRole("group", { name: "Motion mode" }).getByRole("button", { name: mode, exact: true }).click();
    expect(await input.evaluate((el, s) => el === s, saved)).toBe(true);
    await expect(input).toHaveValue("13:45");
    await expect(page.locator('[data-preview="date-picker"] [data-slot="date-picker"]')).toHaveAttribute(
      "data-motion",
      mode,
    );
  }
  await page.getByText("Component source", { exact: true }).click();
  expect(await input.evaluate((el, s) => el === s, saved)).toBe(true);
  await expect(input).toHaveValue("13:45");
});

test("Date Picker SSR, no-JS, distribution and legacy URL", async ({ page, browser, request }) => {
  const response = await request.get("/components/date-picker"),
    html = await response.text();
  expect(response.ok()).toBe(true);
  for (const id of examples["date-picker"]) expect(html).toContain(`data-component-example="date-picker/${id}"`);
  expect(html).toContain("Appointment");
  const context = await browser.newContext({ javaScriptEnabled: false });
  const nojs = await context.newPage();
  await nojs.goto("/components/date-picker");
  await expect(nojs.locator('[data-preview="date-picker"]').getByRole("button")).toBeVisible();
  await expect(nojs.getByRole("heading", { name: "Range and presets", exact: true })).toBeVisible();
  await expect(nojs.locator("[data-component-example]")).toHaveCount(12);
  for (const id of examples["date-picker"])
    await expect(card(nojs, id).locator('[data-slot="date-picker"] button').first()).toBeVisible();
  await context.close();
  const md = await (await request.get("/r/date-picker.md")).text();
  expect(md).toContain("export function DateInput");
  expect(md).toContain("Choose an appointment before submitting.");
  expect((md.match(/export function/g) ?? []).length).toBe(13);
  const payload = await (await request.get("/r/date-picker.json")).json();
  expect(payload.docs).toContain("export function RangePresets");
  for (const variant of ["all", "range", "unknown"]) {
    await page.goto(`/components/date-picker?motion=none&speed=2&variant=${variant}&keep=yes#locale`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("[data-component-example]")).toHaveCount(12);
    await expect(page.locator('[data-preview="date-picker"] select')).toHaveCount(0);
    expect(page.url()).toContain(`variant=${variant}`);
    expect(page.url()).toContain("keep=yes#locale");
  }
});

for (const scheme of ["light", "dark"] as const)
  test(`Date Picker all cards ${scheme} at desktop and narrow widths`, async ({ page }) => {
    test.setTimeout(60000);
    await page.emulateMedia({ colorScheme: scheme });
    await open(page);
    await mkdir(".cache/date-picker-proof", { recursive: true });
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      expect(audit.violations).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      for (const [name, locator] of [
        ["top", page.locator('[data-preview="date-picker"]')],
        ...examples["date-picker"].map((id) => [id, card(page, id)] as const),
      ] as const) {
        const bounds = await locator.boundingBox();
        if (!bounds) throw new Error("Missing card");
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
        await page.evaluate(() => window.scrollTo(0, 0));
        const box = await locator.boundingBox();
        if (!box) throw new Error("Missing card");
        await page.screenshot({
          path: `.cache/date-picker-proof/phase4l-${name}-${scheme}-${width}.png`,
          clip: box,
          fullPage: true,
        });
      }
    }
  });

for (const id of ["controlled-date-and-clearing", "range-and-presets", "without-motion"])
  test(`Date Picker cold full deep link ${id}`, async ({ page }) => {
    await page.goto(`/components/date-picker?motion=full#${id}`);
    await page.waitForLoadState("networkidle");
    const c = card(page, id);
    const trigger = c.locator('[data-slot="date-picker"] button');
    await trigger.press("Enter");
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  });

for (const os of [false, true])
  test(`Date Picker running exit and external selection preserve live nodes ${os}`, async ({ page }, info) => {
    await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
    await openPopupMotionFixture(page, "date-picker", "full", 4);
    const trigger = page.getByRole("button", { name: /Fixture appointment:/ });
    await trigger.press("Enter");
    const popup = page.getByRole("dialog");
    await expect(popup).toHaveCSS("opacity", "1");
    const savedPopup = await popup.elementHandle();
    const day = popup.getByRole("button", { name: /November 12th/ });
    await day.focus();
    const savedDay = await day.elementHandle(),
      grid = popup.getByRole("grid"),
      savedGrid = await grid.elementHandle();
    await day.press("F2");
    await expect(trigger).toContainText("November 20th");
    await expect(day).toBeFocused();
    expect(await grid.evaluate((el, h) => el === h, savedGrid)).toBe(true);
    expect(await day.evaluate((el, h) => el === h, savedDay)).toBe(true);
    await page.keyboard.press("Escape");
    await expect(popup).toHaveAttribute("data-ending-style", "");
    expect(await popup.evaluate((el) => el.getAnimations().length)).toBeGreaterThan(0);
    await trigger.press("Enter");
    expect(await popup.evaluate((el, h) => el === h, savedPopup)).toBe(true);
    await expect(popup).toHaveCSS("opacity", "1");
    await popup.getByRole("button", { name: /next month/i }).click();
    await expect.poll(() => grid.evaluate((el) => el.getAnimations().length)).toBeGreaterThan(0);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(popup).toHaveCSS("scale", "none");
    await expect(grid).toHaveAttribute("data-motion", "reduced");
    const frames = await grid.evaluate(async (el) => {
      const samples = [];
      for (let i = 0; i < 12; i++) {
        await new Promise(requestAnimationFrame);
        samples.push({ transform: getComputedStyle(el).transform, opacity: getComputedStyle(el).opacity });
      }
      return samples;
    });
    await info.attach("live-OS-grid-frames", { body: JSON.stringify(frames), contentType: "application/json" });
    expect(frames.every((f) => f.transform === "none")).toBe(true);
    await page.getByLabel("Fixture motion", { exact: true }).evaluate((el) => {
      (el as HTMLSelectElement).value = "none";
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await expect(popup).toHaveCSS("transition-duration", "0s");
    expect(await grid.evaluate((el) => el.getAnimations().length)).toBe(0);
    expect(await grid.evaluate((el, h) => el === h, savedGrid)).toBe(true);
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  });

test("Date Picker legacy history retains native input, draft and caller state", async ({ page }, info) => {
  await page.goto("/components/date-picker?motion=none&speed=2&variant=range&keep=yes#time");
  await page.waitForLoadState("networkidle");
  const input = card(page, "time").getByLabel("Meeting time", { exact: true });
  await input.fill("14:45");
  await input.focus();
  const saved = await input.elementHandle();
  await page.evaluate(() => {
    history.replaceState({ ...history.state, callerToken: "preserved" }, "");
    history.pushState({ ...history.state, step: 2 }, "", "?motion=none&speed=2&variant=unknown&keep=yes#time");
  });
  await expect(input).toBeFocused();
  await page.goBack();
  const backFocus = await page.evaluate(() => ({
    tag: document.activeElement?.tagName,
    id: document.activeElement?.id,
  }));
  await expect(input).toHaveValue("14:45");
  expect(await input.evaluate((el, h) => el === h, saved)).toBe(true);
  expect(await page.evaluate(() => history.state.callerToken)).toBe("preserved");
  expect(page.url()).toContain("variant=range&keep=yes#time");
  await page.goForward();
  const forwardFocus = await page.evaluate(() => ({
    tag: document.activeElement?.tagName,
    id: document.activeElement?.id,
  }));
  await info.attach("native-history-focus-targets", {
    body: JSON.stringify({ backFocus, forwardFocus }),
    contentType: "application/json",
  });
  await input.focus();
  await expect(input).toBeFocused();
  expect(await input.evaluate((el, h) => el === h, saved)).toBe(true);
  await expect(input).toHaveValue("14:45");
  expect(page.url()).toContain("variant=unknown&keep=yes#time");
  await expect(page.locator("[data-component-example]")).toHaveCount(12);
});

test("Date Picker range minimum, maximum and excluded day reset incomplete selection", async ({ page }) => {
  await open(page);
  const c = card(page, "range-and-presets"),
    trigger = c.getByRole("button", { name: /Travel dates:/ });
  await trigger.click();
  const p = page.getByRole("dialog", { name: "Travel dates", exact: true });
  await p.getByRole("button", { name: /November 10th/ }).click();
  await p.getByRole("button", { name: /November 11th/ }).click();
  await expect(c.locator("output")).toHaveText("Choose an end date");
  await page.keyboard.press("Escape");
  await c.getByRole("button", { name: "Clear travel dates", exact: true }).click();
  await trigger.click();
  await p.getByRole("button", { name: /November 10th/ }).click();
  await p.getByRole("button", { name: /November 20th/ }).click();
  await expect(c.locator("output")).toHaveText("Choose an end date");
  await page.keyboard.press("Escape");
  await c.getByRole("button", { name: "Clear travel dates", exact: true }).click();
  await trigger.click();
  await p.getByRole("button", { name: /November 4th/ }).click();
  await p.getByRole("button", { name: /November 8th/ }).click();
  await expect(c.locator("output")).toHaveText("Choose an end date");
  await expect(trigger).toContainText("November 8th");
  await expect(trigger).not.toContainText("November 4th");
});
