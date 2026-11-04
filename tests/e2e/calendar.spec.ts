import { mkdir, readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { effectiveMode, MODES } from "./helpers";

const names: string[] = JSON.parse(await readFile("components/site/previews/examples.json", "utf8")).calendar;
const card = (page: Page, name: string) => page.locator(`[data-component-example="calendar/${name}"]`);
const day = (scope: Locator, name: string) => scope.getByRole("button", { name: new RegExp(name, "i") });
async function open(page: Page, mode = "none") {
  await page.goto(`/components/calendar?motion=${mode}`);
  await page.waitForLoadState("networkidle");
}
async function setHeader(page: Page, mode: string) {
  await page.getByRole("group", { name: "Motion mode" }).getByRole("button", { name: mode, exact: true }).click();
}

for (const os of [false, true])
  for (const mode of MODES) {
    test(`Calendar selection navigation and live motion ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await open(page, mode);
      const top = page.locator('[data-preview="calendar"]');
      await expect(top.getByRole("combobox")).toHaveCount(0);
      const effective = effectiveMode(mode, os);
      for (const name of names) {
        for (const grid of await card(page, name).getByRole("grid").all())
          await expect(grid).toHaveAttribute("data-motion", name === "without-motion" ? "none" : effective);
      }
      const grid = top.getByRole("grid");
      await expect(grid).toHaveAttribute("data-motion", effective);
      await day(top, "November 12th").click();
      await page.keyboard.press("ArrowRight");
      await expect(day(top, "November 13th")).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(day(top, "November 13th")).toHaveAttribute("data-selected-single", "true");
      const frames = await top.evaluate(async (el) => {
        const table = el.querySelector("table");
        if (!table) throw new Error("Missing calendar grid");
        (el.querySelector('[aria-label="Go to the Next Month"]') as HTMLButtonElement).click();
        const samples = [];
        for (let i = 0; i < 50; i++) {
          await new Promise(requestAnimationFrame);
          const s = getComputedStyle(table);
          samples.push({ x: s.transform, opacity: s.opacity, same: table === el.querySelector("table") });
        }
        return samples;
      });
      expect(frames.every((f) => f.same)).toBe(true);
      if (effective === "full")
        expect(frames.some((f) => f.x !== "none" && f.x !== "matrix(1, 0, 0, 1, 0, 0)")).toBe(true);
      else expect(frames.every((f) => f.x === "none")).toBe(true);
      if (effective !== "none") expect(new Set(frames.map((f) => f.opacity)).size).toBeGreaterThan(1);
      else expect(frames.every((f) => f.opacity === "1")).toBe(true);
      await expect(grid).toHaveAttribute("aria-label", "December 2026");
      // Dispatch a real header click in the navigation task; retain the calendar focus/tree.
      await setHeader(page, "full");
      const cancellation = await top.evaluate(async (el) => {
        const table = el.querySelector("table");
        if (!table) throw new Error("Missing calendar grid");
        (el.querySelector('[aria-label="Go to the Previous Month"]') as HTMLButtonElement).click();
        await new Promise(requestAnimationFrame);
        await new Promise(requestAnimationFrame);
        const active = table.getAnimations().filter((a) => a.playState === "running").length;
        const button = document.querySelector(
          '[role="group"][aria-label="Motion mode"] button[data-mode="none"]',
        ) as HTMLButtonElement | null;
        const target =
          button ??
          [...document.querySelectorAll<HTMLButtonElement>('[role="group"][aria-label="Motion mode"] button')].find(
            (n) => n.textContent === "none",
          );
        if (!target) throw new Error("Missing header none button");
        target.click();
        const after = [];
        for (let i = 0; i < 12; i++) {
          await new Promise(requestAnimationFrame);
          after.push({
            mode: table.getAttribute("data-motion"),
            animations: table.getAnimations().length,
            transform: getComputedStyle(table).transform,
            opacity: getComputedStyle(table).opacity,
          });
        }
        return {
          active,
          after,
          remaining: table.getAnimations().length,
          transform: getComputedStyle(table).transform,
          same: table === el.querySelector("table"),
        };
      });
      expect(cancellation.active).toBeGreaterThan(0);
      expect(cancellation.remaining).toBe(0);
      expect(cancellation.transform).toBe("none");
      expect(cancellation.same).toBe(true);
      expect(
        cancellation.after.every(
          (f) => f.mode === "none" && f.animations === 0 && f.transform === "none" && f.opacity === "1",
        ),
      ).toBe(true);
      await expect(grid).toHaveAttribute("data-motion", "none");
      expect(errors).toEqual([]);
    });
  }

test("Calendar keyboard paths, controlled updates, drafts and independent selection", async ({ page }) => {
  await open(page);
  const c = card(page, "controlled-month-and-date"),
    grid = c.getByRole("grid"),
    note = c.getByRole("textbox");
  await note.fill("A real appointment draft");
  const node = await note.elementHandle(),
    table = await grid.elementHandle();
  await c.getByRole("button", { name: "Set November 20" }).press("Enter");
  const d20 = day(c, "November 20th");
  await expect(d20).toHaveAttribute("data-selected-single", "true");
  await d20.focus();
  await page.keyboard.press("PageDown");
  await expect(day(c, "December 20th")).toBeFocused();
  await page.keyboard.press("PageUp");
  await expect(d20).toBeFocused();
  await page.keyboard.press("Home");
  await expect(day(c, "November 16th")).toBeFocused();
  await page.keyboard.press("End");
  await expect(day(c, "November 22nd")).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(day(c, "November 15th")).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(day(c, "November 14th")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(day(c, "November 21st")).toBeFocused();
  await page.keyboard.press("Shift+PageDown");
  await expect(day(c, "November 21st, 2027")).toBeFocused();
  await page.keyboard.press("Shift+PageUp");
  await expect(day(c, "November 21st, 2026")).toBeFocused();
  await day(c, "December 1st").press("Space");
  await expect(day(c, "December 1st")).toHaveAttribute("data-selected-single", "true");
  await c.getByRole("button", { name: "Set November 20" }).click();
  await c.getByRole("button", { name: "Clear appointment" }).press("Space");
  await expect(c.locator(".rdp-footer")).toHaveText("No appointment");
  for (const mode of ["full", "reduced", "none"]) {
    await setHeader(page, mode);
    await expect(grid).toHaveAttribute("data-motion", mode);
    await expect(note).toHaveValue("A real appointment draft");
  }
  await page.getByText("Component source", { exact: true }).click();
  expect(await note.evaluate((el, saved) => el === saved, node)).toBe(true);
  expect(await grid.evaluate((el, saved) => el === saved, table)).toBe(true);
  await expect(page.locator('[data-preview="calendar"]').locator('[data-selected-single="true"]')).toHaveCount(1);
  await expect(card(page, "single-selection").locator('[data-selected-single="true"]')).toHaveCount(1);
  await day(c, "November 20th").focus();
  await page.keyboard.press("Tab");
  expect(await grid.evaluate((el) => el.contains(document.activeElement))).toBe(false);
  await page.keyboard.press("Shift+Tab");
  await expect(day(c, "November 20th")).toBeFocused();
  const ids = await page.locator("[id]").evaluateAll((nodes) => nodes.map((n) => n.id));
  expect(new Set(ids).size).toBe(ids.length);
});

test("Calendar multiple required min/max and excluded disabled ranges", async ({ page }) => {
  await open(page);
  const multiple = card(page, "multiple-dates");
  await day(multiple, "November 12th").click();
  await expect(day(multiple, "November 12th")).toHaveAttribute("data-selected-single", "true");
  await day(multiple, "November 13th").click();
  await day(multiple, "November 14th").click();
  await expect(multiple.locator(".rdp-footer")).toHaveText("3 dates");
  await day(multiple, "November 16th").press("Space");
  await expect(multiple.locator(".rdp-footer")).toHaveText("1 date");
  await expect(day(multiple, "November 16th")).toHaveAttribute("data-selected-single", "true");
  const range = card(page, "date-ranges");
  await expect(day(range, "November 14th")).toBeDisabled();
  await day(range, "November 12th").click();
  await day(range, "November 16th").click();
  await expect(range.locator('[data-range-middle="true"]')).toHaveCount(0);
  await expect(day(range, "November 16th")).toHaveAttribute("data-selected-single", "true");
  await expect(range.locator(".rdp-footer")).toContainText("Mon Nov 16 2026 – Choose an end");
  await day(range, "November 18th").click();
  await expect(range.locator('[data-range-start="true"]')).toHaveCount(1);
  await expect(range.locator('[data-range-end="true"]')).toHaveCount(1);
  await expect(range.locator('[data-range-middle="true"]')).toHaveCount(1);
  await day(card(page, "single-selection"), "November 12th").click();
  await expect(card(page, "single-selection").locator(".rdp-footer")).toHaveText("Choose a date");
});

test("Calendar native captions, locales, RTL, bounds and finite navigation variants", async ({ page }) => {
  await open(page);
  const captions = card(page, "caption-layouts");
  for (const [name, count] of [
    ["label", 0],
    ["dropdown", 2],
    ["dropdown-months", 1],
    ["dropdown-years", 1],
  ] as const) {
    const calendar = captions.locator(`[data-slot="calendar"][aria-label="${name} caption"]`);
    await expect(calendar.locator("select")).toHaveCount(count);
  }
  const dropdown = captions.locator('[data-slot="calendar"][aria-label="dropdown caption"]');
  await expect(dropdown.getByRole("grid")).toHaveAttribute("data-motion", "none");
  await dropdown.getByLabel("Choose the Month").selectOption("1");
  await expect(dropdown.getByRole("grid")).toHaveAttribute("aria-label", "February 2026");
  await dropdown.getByLabel("Choose the Year").selectOption("2027");
  await expect(dropdown.getByRole("grid")).toHaveAttribute("aria-label", "February 2027");
  const localized = card(page, "localized-navigation"),
    french = localized.locator('[lang="fr"]'),
    arabic = localized.locator('[lang="ar"]');
  await expect(french.getByRole("grid")).toHaveAttribute("aria-label", "novembre 2026");
  await expect(french.locator('th[scope="col"]').first()).toHaveText("lu");
  await french.getByRole("button", { name: "Mois suivant" }).press("Enter");
  await expect(french.getByRole("grid")).toHaveAttribute("aria-label", "décembre 2026");
  await expect(arabic).toHaveAttribute("dir", "rtl");
  const weekday = arabic.locator('th[scope="col"]').first();
  expect((await weekday.getAttribute("aria-label"))?.length).toBeGreaterThan(
    ((await weekday.textContent()) ?? "").length,
  );
  const arabicMonth = await arabic.getByRole("grid").getAttribute("aria-label");
  if (!arabicMonth) throw new Error("Missing Arabic month label");
  await arabic.getByRole("button", { name: "الشهر التالي" }).click();
  await expect(arabic.getByRole("grid")).not.toHaveAttribute("aria-label", arabicMonth);
  const browse = card(page, "browse-only"),
    bounded = browse.locator('[data-slot="calendar"][aria-label="Browse months without selecting"]');
  await expect(bounded.getByRole("button", { name: /previous month/i })).toBeDisabled();
  await bounded.getByRole("button", { name: /next month/i }).click();
  await expect(bounded.getByRole("button", { name: /next month/i })).toBeDisabled();
  await expect(bounded.getByRole("grid").getByRole("button")).toHaveCount(0);
  await expect(
    browse.locator('[data-slot="calendar"][aria-label="Navigation hidden"]').getByRole("navigation"),
  ).toHaveCount(0);
  for (const button of await browse
    .locator('[data-slot="calendar"][aria-label="Navigation disabled"]')
    .getByRole("button")
    .all())
    await expect(button).toBeDisabled();
  const variants = card(page, "navigation-button-variants");
  for (const [variant, token] of [
    ["default", "bg-primary"],
    ["secondary", "bg-secondary"],
    ["destructive", "bg-destructive"],
    ["outline", "border"],
    ["ghost", "hover:bg-accent"],
    ["link", "underline-offset-4"],
  ]) {
    const calendar = variants.locator(`[data-slot="calendar"][aria-label="${variant} navigation"]`),
      button = calendar.getByRole("button", { name: /next month/i });
    await expect(button).toHaveClass(new RegExp(token ?? "missing variant"));
    const bounds = await calendar.evaluate((el) => {
      const previous = el.querySelector('[aria-label="Go to the Previous Month"]')?.getBoundingClientRect();
      const next = el.querySelector('[aria-label="Go to the Next Month"]')?.getBoundingClientRect();
      const caption = el.querySelector(".rdp-caption_label")?.getBoundingClientRect();
      if (!previous || !next || !caption) throw new Error("Missing navigation geometry");
      return { left: previous.right, textLeft: caption.left, right: next.left, textRight: caption.right };
    });
    expect(bounds.left).toBeLessThanOrEqual(bounds.textLeft + 1);
    expect(bounds.right).toBeGreaterThanOrEqual(bounds.textRight - 1);
    await button.click();
    await expect(calendar.getByRole("grid")).toHaveAttribute("aria-label", "December 2026");
  }
});

for (const mode of MODES) {
  test(`Calendar rapid caption selections preserve both fields in ${mode}`, async ({ page }, info) => {
    await open(page, mode);
    const calendar = card(page, "caption-layouts").locator('[data-slot="calendar"][aria-label="dropdown caption"]');
    const grid = calendar.getByRole("grid");
    await expect(grid).toHaveAttribute("data-motion", mode);
    const node = await grid.elementHandle();
    const results: string[] = [];
    for (let repeat = 0; repeat < 8; repeat++) {
      // No intermediate month assertion: the next field is changed as soon as
      // Playwright finishes the preceding native-select action.
      await calendar.getByLabel("Choose the Month").selectOption("1");
      await calendar.getByLabel("Choose the Year").selectOption("2027");
      await expect(grid).toHaveAttribute("aria-label", "February 2027");
      results.push((await grid.getAttribute("aria-label")) ?? "");
      await calendar.getByLabel("Choose the Month").selectOption("10");
      await calendar.getByLabel("Choose the Year").selectOption("2026");
      await expect(grid).toHaveAttribute("aria-label", "November 2026");
      results.push((await grid.getAttribute("aria-label")) ?? "");
    }
    expect(await grid.evaluate((el, saved) => el === saved, node)).toBe(true);
    await info.attach("rapid-caption-results", { body: JSON.stringify(results), contentType: "application/json" });
  });

  test(`Calendar caption keyboard changes preserve both fields in ${mode}`, async ({ page }, info) => {
    await page.addInitScript(() => {
      const events: { key: string; trusted: boolean; label: string | null }[] = [];
      Object.assign(window, { captionKeys: events });
      document.addEventListener("keydown", (event) => {
        if (event.target instanceof HTMLSelectElement)
          events.push({ key: event.key, trusted: event.isTrusted, label: event.target.getAttribute("aria-label") });
      });
    });
    await open(page, mode);
    const calendar = card(page, "caption-layouts").locator('[data-slot="calendar"][aria-label="dropdown caption"]');
    const grid = calendar.getByRole("grid");
    await expect(grid).toHaveAttribute("data-motion", mode);
    const month = calendar.getByLabel("Choose the Month");
    const year = calendar.getByLabel("Choose the Year");
    for (let repeat = 0; repeat < 4; repeat++) {
      await month.focus();
      await page.keyboard.press("Home");
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Tab");
      await expect(year).toBeFocused();
      await page.keyboard.press("Home");
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowDown");
      await expect(grid).toHaveAttribute("aria-label", "February 2027");
      await month.focus();
      await page.keyboard.press("End");
      await page.keyboard.press("ArrowUp");
      await page.keyboard.press("Tab");
      await expect(year).toBeFocused();
      await page.keyboard.press("Home");
      await page.keyboard.press("ArrowDown");
      await expect(grid).toHaveAttribute("aria-label", "November 2026");
    }
    const events = await page.evaluate(
      () => (window as unknown as { captionKeys: { trusted: boolean }[] }).captionKeys,
    );
    expect(events.length).toBeGreaterThan(20);
    expect(events.every((event) => event.trusted)).toBe(true);
    await info.attach("caption-key-events", { body: JSON.stringify(events), contentType: "application/json" });
  });
}

test("Calendar disabled and hidden dates, week rows, custom day focus and caller styles", async ({ page }) => {
  await open(page, "full");
  const disabled = card(page, "disabled-dates");
  for (const date of ["November 1st", "November 5th", "November 14th"])
    await expect(day(disabled, date)).toBeDisabled();
  await expect(day(disabled, "November 11th")).toHaveCount(0);
  await day(disabled, "November 12th").press("Enter");
  await page.keyboard.press("ArrowLeft");
  await expect(day(disabled, "November 10th")).toBeFocused();
  const layout = card(page, "grid-layout");
  await expect(layout.locator('[aria-label="Fixed six-week grid"] tbody tr')).toHaveCount(6);
  await expect(layout.locator('[aria-label="Fixed six-week grid"] [scope="row"]')).toHaveCount(6);
  await expect(
    layout.locator('[aria-label="Current month only"]').getByRole("button", { name: /December 1st/i }),
  ).toHaveCount(0);
  const custom = card(page, "custom-day");
  await day(custom, "November 12th").press("Enter");
  await page.keyboard.press("ArrowRight");
  await expect(day(custom, "November 13th")).toBeFocused();
  await expect(custom.getByRole("grid")).toHaveAttribute("aria-label", "November 2026");
  await expect(custom.getByText("Bookings · November 2026", { exact: true })).toBeVisible();
  const style = await custom.evaluate(async (el) => {
    const table = el.querySelector("table");
    if (!table) throw new Error("Missing calendar grid");
    (el.querySelector('[aria-label="Go to the Next Month"]') as HTMLButtonElement).click();
    const frames = [];
    for (let i = 0; i < 16; i++) {
      await new Promise(requestAnimationFrame);
      const s = getComputedStyle(table);
      frames.push({ opacity: s.opacity, transform: s.transform });
    }
    return frames;
  });
  expect(style.every((f) => f.opacity === "1")).toBe(true);
  expect(style.some((f) => f.transform !== "none")).toBe(true);
});

test("Calendar running reverse, header cancellation and live system preference retain the same grid and focus", async ({
  page,
}, testInfo) => {
  await open(page, "full");
  const c = card(page, "controlled-month-and-date"),
    grid = c.getByRole("grid");
  await day(c, "November 12th").focus();
  const frames = await c.evaluate(async (el) => {
    const table = el.querySelector("table");
    if (!table) throw new Error("Missing calendar grid");
    (el.querySelector('[aria-label="Go to the Next Month"]') as HTMLButtonElement).click();
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    const first = table.getAnimations()[0];
    if (!first) throw new Error("Month motion did not start");
    const before = getComputedStyle(table).transform;
    (el.querySelector('[aria-label="Go to the Previous Month"]') as HTMLButtonElement).click();
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    return {
      before,
      oldState: first.playState,
      after: getComputedStyle(table).transform,
      running: table.getAnimations().filter((a) => a.playState === "running").length,
      same: table === el.querySelector("table"),
    };
  });
  expect(frames.before).not.toBe("none");
  expect(frames.after).not.toBe("none");
  expect(frames.oldState).toBe("idle");
  expect(frames.running).toBe(1);
  expect(frames.same).toBe(true);
  expect(Number(frames.before.split(",")[4])).toBeGreaterThan(0);
  expect(Number(frames.after.split(",")[4])).toBeLessThan(0);
  await testInfo.attach("reverse", { body: JSON.stringify(frames), contentType: "application/json" });
  await expect
    .poll(() => grid.evaluate((el) => el.getAnimations().filter((a) => a.playState === "running").length))
    .toBe(0);
  await day(c, "November 12th").focus();
  await page.keyboard.press("PageDown");
  await expect(day(c, "December 12th")).toBeFocused();
  // Prove running motion before the OS downgrade, then sample all later frames.
  expect(await grid.evaluate((el) => el.getAnimations().some((a) => a.playState === "running"))).toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(grid).toHaveAttribute("data-motion", "reduced");
  await expect(day(c, "December 12th")).toBeFocused();
  await expect.poll(() => grid.evaluate((el) => getComputedStyle(el).transform)).toBe("none");
  await expect.poll(() => grid.evaluate((el) => el.getAnimations().length)).toBe(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(grid).toHaveAttribute("data-motion", "full");
  await day(c, "December 12th").press("PageUp");
  expect(await grid.evaluate((el) => el.getAnimations().some((a) => a.playState === "running"))).toBe(true);
  await page
    .getByRole("group", { name: "Motion mode" })
    .getByRole("button", { name: "reduced", exact: true })
    .evaluate((el) => (el as HTMLButtonElement).click());
  await expect(grid).toHaveAttribute("data-motion", "reduced");
  await expect.poll(() => grid.evaluate((el) => el.getAnimations().length)).toBe(0);
  await expect(day(c, "November 12th")).toBeFocused();
});

for (const theme of ["light", "dark"])
  for (const width of [1280, 390]) {
    test(`Calendar named examples axe ${theme}/${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.addInitScript((value) => localStorage.setItem("cadence-theme", value), theme);
      await open(page);
      expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual(
        [],
      );
    });
    test(`Calendar named examples geometry and screenshots ${theme}/${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.addInitScript((value) => localStorage.setItem("cadence-theme", value), theme);
      await open(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const grids = card(page, "multiple-months").getByRole("grid");
      const first = await grids.nth(0).boundingBox(),
        second = await grids.nth(1).boundingBox();
      if (!first || !second) throw new Error("Missing month geometry");
      expect(width === 390 ? second.y > first.y : second.x > first.x).toBe(true);
      await card(page, "multiple-months")
        .getByRole("button", { name: /next month/i })
        .click();
      await expect(grids.nth(0)).toHaveAttribute("aria-label", "January 2027");
      await mkdir(".cache/calendar-proof", { recursive: true });
      // Document clips leave the real sticky header at page top, outside these cards.
      // Recentring a tall element screenshot can paint the header over its first row.
      for (const name of ["top", ...names]) {
        await page.evaluate(() => window.scrollTo(0, 0));
        const specimen = name === "top" ? page.locator('[data-preview="calendar"]') : card(page, name);
        const clip = await specimen.evaluate((el) => {
          const r = el.getBoundingClientRect();
          return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height };
        });
        await page.screenshot({ path: `.cache/calendar-proof/${name}-${theme}-${width}.png`, fullPage: true, clip });
      }
    });
  }

for (const hash of ["single-selection", "controlled-month-and-date", "localized-navigation"])
  test(`Calendar cold full deep link ${hash}`, async ({ page }) => {
    await page.goto(`/components/calendar?motion=full#${hash}`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator(`h2#${hash}`)).toBeInViewport();
    await expect(card(page, hash).getByRole("grid").first()).toBeVisible();
  });

test("Calendar fixed none is static on real insertion and first navigation", async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    const proof: {
      frames: { mode: string | null; opacity: string; transform: string; animations: number }[];
      done: boolean;
    } = { frames: [], done: false };
    Object.assign(window, { calendarInsertion: proof });
    const observer = new MutationObserver(() => {
      const grid = document.querySelector('[data-component-example="calendar/without-motion"] table');
      if (!grid) return;
      observer.disconnect();
      const sample = () => {
        const s = getComputedStyle(grid);
        proof.frames.push({
          mode: grid.getAttribute("data-motion"),
          opacity: s.opacity,
          transform: s.transform,
          animations: grid.getAnimations().length,
        });
        if (proof.frames.length < 12) requestAnimationFrame(sample);
        else proof.done = true;
      };
      sample();
    });
    observer.observe(document, { childList: true, subtree: true });
  });
  await open(page, "full");
  const proof = await page.evaluate(
    () =>
      (
        window as unknown as {
          calendarInsertion: {
            frames: { mode: string | null; opacity: string; transform: string; animations: number }[];
            done: boolean;
          };
        }
      ).calendarInsertion,
  );
  expect(proof.done).toBe(true);
  expect(proof.frames).toHaveLength(12);
  expect(
    proof.frames.every((f) => f.mode === "none" && f.opacity === "1" && f.transform === "none" && f.animations === 0),
  ).toBe(true);
  const fixed = card(page, "without-motion");
  await fixed.getByRole("button", { name: /next month/i }).click();
  await expect(fixed.getByRole("grid")).toHaveAttribute("aria-label", "December 2026");
  expect(await fixed.getByRole("grid").evaluate((el) => el.getAnimations().length)).toBe(0);
  await testInfo.attach("first-insertion", { body: JSON.stringify(proof), contentType: "application/json" });
});

test("Calendar no-JS retains actual dates, fixed shapes and initial caller values", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(`${baseURL}/components/calendar`);
    const top = page.locator('[data-preview="calendar"]');
    await expect(day(top, "November 12th")).toHaveAttribute("data-selected-single", "true");
    await expect(top.getByRole("combobox")).toHaveCount(0);
    await expect(card(page, "multiple-months").getByRole("grid")).toHaveCount(2);
    await expect(card(page, "controlled-month-and-date").getByRole("textbox")).toHaveValue("Keep this draft");
    await expect(day(card(page, "disabled-dates"), "November 5th")).toBeDisabled();
    await expect(card(page, "without-motion").getByRole("grid")).toHaveAttribute("data-motion", "none");
  } finally {
    await context.close();
  }
});
