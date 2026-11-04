import { readFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { effectiveMode, MODES } from "./helpers";
import { openPopupMotionFixture } from "./popup-motion-fixture";

const names: string[] = JSON.parse(readFileSync("components/site/previews/examples.json", "utf8")).bubble;
const card = (page: Page, id: string) => page.locator(`[data-component-example="bubble/${id}"]`);
const roots = (scope: Locator) => scope.locator('[data-slot="bubble"]');
async function open(page: Page, mode = "none") {
  await page.goto(`/components/bubble?motion=${mode}&speed=0.25`);
  await page.waitForLoadState("networkidle");
}
async function observeEntry(scope: Locator, selector: string) {
  await scope.evaluate((el, selector) => {
    const w = window as unknown as {
      entry: Promise<{ opacity: number; transform: string; duration: string; animations: number }[]>;
    };
    w.entry = new Promise((resolve) => {
      const observer = new MutationObserver(() => {
        const node = el.querySelector(selector);
        if (!node) return;
        observer.disconnect();
        const result: { opacity: number; transform: string; duration: string; animations: number }[] = [];
        const sample = () => {
          const s = getComputedStyle(node);
          result.push({
            opacity: Number(s.opacity),
            transform: s.transform,
            duration: s.transitionDuration,
            animations: node.getAnimations().length,
          });
          if (result.length < 30) requestAnimationFrame(sample);
          else resolve(result);
        };
        sample();
      });
      observer.observe(el, { childList: true, subtree: true });
    });
  }, selector);
}
async function assertEntry(page: Page, actual: string) {
  const frames = await page.evaluate(
    () =>
      (
        window as unknown as {
          entry: Promise<{ opacity: number; transform: string; duration: string; animations: number }[]>;
        }
      ).entry,
  );
  expect(frames.every((f) => f.transform === "none")).toBe(true);
  const duration = actual === "none" ? "0s" : actual === "reduced" ? "0.528s" : "0.88s";
  expect(frames.every((f) => f.duration === duration)).toBe(true);
  if (actual === "none") expect(frames.every((f) => f.opacity === 1 && f.animations === 0)).toBe(true);
  else {
    expect(Math.min(...frames.map((f) => f.opacity))).toBeLessThan(0.9);
    expect(new Set(frames.map((f) => f.opacity)).size).toBeGreaterThan(2);
  }
  return frames;
}
const errors = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  const found: string[] = [];
  errors.set(page, found);
  page.on("pageerror", (e) => found.push(e.message));
});
test.afterEach(({ page }) => expect(errors.get(page)).toEqual([]));

for (const os of [false, true])
  for (const mode of MODES) {
    test(`Bubble real entry, independent state and native updates ${mode}/${os}`, async ({ page }, info) => {
      await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
      await open(page, mode);
      const actual = effectiveMode(mode, os);
      const top = page.locator('[data-preview="bubble"]');
      await expect(top.locator("select,input")).toHaveCount(0);
      await expect(top.getByRole("button")).toHaveCount(1);
      await top.getByRole("button", { name: "Show the review checklist" }).press("Enter");
      await expect(top.getByRole("button")).toHaveAttribute("aria-expanded", "true");
      const variants = card(page, "variants");
      for (const variant of ["default", "secondary", "muted", "tinted", "outline", "ghost", "destructive"])
        await expect(variants.locator(`[data-variant="${variant}"]`)).toHaveAttribute("data-motion", actual);
      const c = card(page, "updating-text"),
        first = c.locator('[data-message-id="initial"]');
      const saved = await first.elementHandle();
      await observeEntry(c, '[data-message-id="reply-1"]');
      await c.getByRole("button", { name: "Add reply", exact: true }).click();
      await info.attach("actual-body-entry-rAF", {
        body: JSON.stringify(await assertEntry(page, actual)),
        contentType: "application/json",
      });
      const action = first.getByRole("button");
      await action.press("Enter");
      await expect(c.getByRole("status")).toHaveText("Selected initial.");
      await action.press("F2");
      await expect(action).toBeFocused();
      await expect(action).toContainText("Another local chunk.");
      expect(await first.evaluate((el, saved) => el === saved, saved)).toBe(true);
      expect(await first.evaluate((el) => el.getAnimations().length)).toBe(0);
      await c.getByRole("button", { name: "Append text", exact: true }).click();
      await expect(first).toContainText("Another local chunk. Another local chunk.");
      const reaction = card(page, "reactions").getByRole("button", { name: /👍 [01] thumbs up/ });
      await reaction.press(" ");
      await expect(reaction).toHaveAttribute("aria-pressed", "true");
      const links = card(page, "links-and-buttons");
      await links.getByRole("button").press("Enter");
      await expect(links.getByRole("button")).toHaveAttribute("aria-pressed", "true");
      await links.getByRole("link").press("Enter");
      const target = await links.getByRole("link").getAttribute("href");
      expect(await page.evaluate(() => decodeURIComponent(location.hash))).toBe(target);
      const custom = card(page, "custom-parts");
      await custom.getByRole("button", { name: "Focus custom reply" }).click();
      const reply = custom.getByRole("button", { name: "Custom reply · 0" });
      await expect(reply).toBeFocused();
      const same = await reply.elementHandle();
      await reply.press("Enter");
      await custom.getByRole("button", { name: "Custom reply · 1" }).press(" ");
      const counted = custom.getByRole("button", { name: "Custom reply · 2" });
      await expect(counted).toHaveAttribute("data-render-slot", "bubble-content");
      await expect(counted).toHaveCSS("font-weight", "500");
      await counted.press("F2");
      await expect(roots(custom)).toHaveAttribute("data-align", "end");
      await expect(counted).toBeFocused();
      expect(await counted.evaluate((el, same) => el === same, same)).toBe(true);
      await page.setViewportSize({ width: 390, height: 1000 });
      expect(await first.evaluate((el, saved) => el === saved, saved)).toBe(true);
    });
  }

for (const os of [false, true])
  for (const mode of MODES)
    test(`Bubble fixture native shape changes preserve reaction, node and focus ${mode}/${os}`, async ({
      page,
    }, info) => {
      await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
      await openPopupMotionFixture(page, "bubble", mode, 4);
      const p = page.locator('[data-preview="bubble"]'),
        first = p.getByTestId("reply-0");
      const reaction = p.getByRole("button", { name: "Thumbs up" });
      await reaction.press(" ");
      const savedReaction = await reaction.elementHandle();
      const action = first.locator('[data-slot="bubble-content"]'),
        saved = await action.elementHandle();
      for (const variant of ["outline", "secondary", "tinted", "ghost", "destructive", "default", "muted"]) {
        await action.press("F2");
        await expect(first).toHaveAttribute("data-variant", variant);
        await expect(action).toBeFocused();
      }
      await action.press("F3");
      await expect(first).toHaveAttribute("data-align", "end");
      await action.press("F4");
      await expect(p.locator('[data-slot="bubble-reactions"]')).toHaveAttribute("data-side", "top");
      await action.press("F6");
      await expect(p.locator('[data-slot="bubble-reactions"]')).toHaveAttribute("data-align", "start");
      await action.press("F7");
      await expect(action).toContainText("Another local chunk.");
      await expect(action).toBeFocused();
      await expect(reaction).toHaveAttribute("aria-pressed", "true");
      expect(await action.evaluate((el, saved) => el === saved, saved)).toBe(true);
      expect(await reaction.evaluate((el, saved) => el === saved, savedReaction)).toBe(true);
      await observeEntry(p, '[data-testid="reply-1"]');
      await p.getByRole("button", { name: "Add fixture reply" }).click();
      await info.attach("registry-fixture-entry", {
        body: JSON.stringify(await assertEntry(page, effectiveMode(mode, os))),
        contentType: "application/json",
      });
    });

for (const os of [false, true])
  test(`Bubble running entry cancels on same node, native focus retained ${os}`, async ({ page }, info) => {
    await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
    await openPopupMotionFixture(page, "bubble", "full", 4);
    const p = page.locator('[data-preview="bubble"]');
    await p.getByRole("button", { name: "Add fixture reply" }).click();
    const live = p.getByTestId("reply-1"),
      saved = await live.elementHandle();
    await expect
      .poll(() => live.evaluate((el) => el.getAnimations().filter((a) => a.playState === "running").length))
      .toBeGreaterThan(0);
    const before = await live.evaluate((el) => ({
      opacity: Number(getComputedStyle(el).opacity),
      duration: getComputedStyle(el).transitionDuration,
    }));
    expect(before.opacity).toBeLessThan(1);
    const content = live.locator('[data-slot="bubble-content"]');
    await content.focus();
    await page.getByLabel("Fixture motion", { exact: true }).evaluate((el: HTMLSelectElement) => {
      el.value = "none";
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await expect(live).toHaveAttribute("data-motion", "none");
    const after = await live.evaluate(async (el) => {
      const frames = [];
      for (let i = 0; i < 12; i++) {
        await new Promise(requestAnimationFrame);
        frames.push({
          opacity: getComputedStyle(el).opacity,
          animations: el.getAnimations().length,
          duration: getComputedStyle(el).transitionDuration,
        });
      }
      return frames;
    });
    expect(after.every((f) => f.opacity === "1" && f.animations === 0 && f.duration === "0s")).toBe(true);
    expect(await live.evaluate((el, saved) => el === saved, saved)).toBe(true);
    await expect(content).toBeFocused();
    await info.attach("running-cancellation", {
      body: JSON.stringify({ before, after }),
      contentType: "application/json",
    });
    await page.getByLabel("Fixture motion", { exact: true }).selectOption("full");
    await p.getByRole("button", { name: "Add fixture reply" }).click();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(p.getByTestId("reply-2")).toHaveAttribute("data-motion", "reduced");
    await expect(p.getByTestId("reply-2")).toHaveCSS("transform", "none");
  });

for (const mode of MODES)
  test(`Bubble actual fixed none first insertion and cold deep link ${mode}`, async ({ page }, info) => {
    await page.addInitScript(() => {
      const w = window as unknown as {
        quietFrames: { opacity: string; transform: string; duration: string; animations: number }[];
      };
      w.quietFrames = [];
      const sample = () => {
        const el = document.querySelector('[data-component-example="bubble/without-motion"] [data-slot="bubble"]');
        if (el) {
          const s = getComputedStyle(el);
          w.quietFrames.push({
            opacity: s.opacity,
            transform: s.transform,
            duration: s.transitionDuration,
            animations: el.getAnimations().length,
          });
        }
      };
      new MutationObserver(sample).observe(document, { subtree: true, childList: true, attributes: true });
      const tick = () => {
        sample();
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await page.goto(`/components/bubble?motion=${mode}#reactions`);
    await page.waitForLoadState("networkidle");
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { quietFrames: unknown[] }).quietFrames.length))
      .toBeGreaterThan(12);
    const frames = await page.evaluate(
      () =>
        (
          window as unknown as {
            quietFrames: { opacity: string; transform: string; duration: string; animations: number }[];
          }
        ).quietFrames,
    );
    expect(
      frames.every((f) => f.opacity === "1" && f.transform === "none" && f.duration === "0s" && f.animations === 0),
    ).toBe(true);
    await info.attach("actual-none-insertion", { body: JSON.stringify(frames), contentType: "application/json" });
    await expect(roots(card(page, "reactions")).first()).toHaveAttribute("data-motion", mode);
  });

test("Bubble real header and source keep caller values and nodes", async ({ page }) => {
  await open(page, "full");
  const top = page.locator('[data-preview="bubble"]');
  const c = card(page, "updating-text"),
    first = c.locator('[data-message-id="initial"]'),
    saved = await first.elementHandle();
  await first.getByRole("button").press("F2");
  const reaction = card(page, "reactions").getByRole("button", { name: /👍 [01] thumbs up/ });
  await reaction.click();
  const mode = page.getByRole("group", { name: "Motion mode" });
  for (const requested of MODES) {
    await mode.getByRole("button", { name: requested, exact: true }).click();
    await expect(roots(top).first()).toHaveAttribute("data-motion", requested);
    expect(await first.evaluate((el, saved) => el === saved, saved)).toBe(true);
    await expect(first).toContainText("Another local chunk.");
    await expect(reaction).toHaveAttribute("aria-pressed", "true");
  }
  await page.getByText("Component source", { exact: true }).click();
  expect(await first.evaluate((el, saved) => el === saved, saved)).toBe(true);
});

for (const theme of ["light", "dark"] as const)
  for (const width of [1280, 390])
    test(`Bubble ${theme}/${width} complete WCAG and all fixed geometry`, async ({ page }, info) => {
      await mkdir(".cache/bubble-proof", { recursive: true });
      await page.addInitScript((theme) => localStorage.setItem("cadence-theme", theme), theme);
      await page.setViewportSize({ width, height: 1000 });
      await open(page);
      const violations = (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
        .violations;
      await info.attach("raw-full-page-axe", { body: JSON.stringify(violations), contentType: "application/json" });
      expect(violations).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      for (const name of ["top", ...names]) {
        const c = name === "top" ? page.locator('[data-preview="bubble"]') : card(page, name);
        await c.scrollIntoViewIfNeeded();
        for (const el of await c.locator('[data-slot="bubble"], [data-slot="bubble-reactions"]').all())
          expect(
            await el.evaluate((el) => {
              const r = el.getBoundingClientRect(),
                p = el.closest("[data-preview], [data-component-example]")?.getBoundingClientRect();
              return !!p && r.left >= p.left && r.right <= p.right && r.width > 0;
            }),
          ).toBe(true);
        await c.screenshot({ path: `.cache/bubble-proof/phase4n-${name}-${theme}-${width}.png` });
      }
      for (const side of ["top", "bottom"])
        for (const align of ["start", "end"]) {
          const reaction = card(page, "reactions")
            .locator(`[data-slot="bubble-reactions"][data-side="${side}"][data-align="${align}"]`)
            .first();
          expect(
            await reaction.evaluate((el, side) => {
              const r = el.getBoundingClientRect(),
                p = el.parentElement?.getBoundingClientRect();
              return (
                !!p && (side === "top" ? r.top < p.top && r.bottom > p.top : r.top < p.bottom && r.bottom > p.bottom)
              );
            }, side),
          ).toBe(true);
        }
      await page.screenshot({ path: `.cache/bubble-proof/phase4n-full-${theme}-${width}.png`, fullPage: true });
    });

test("Bubble SSR, no-JS, distributed code and inert legacy URLs retain local state", async ({
  page,
  browser,
  request,
}) => {
  const html = await (await request.get("/components/bubble")).text();
  expect(html).toContain("The registry is ready for review.");
  for (const name of names) expect(html).toContain(`bubble/${name}`);
  const context = await browser.newContext({ javaScriptEnabled: false });
  const p = await context.newPage();
  try {
    await p.goto("http://127.0.0.1:3100/components/bubble");
    await expect(roots(p.locator('[data-preview="bubble"]')).first()).toBeVisible();
    for (const name of names) await expect(card(p, name)).toBeVisible();
  } finally {
    await context.close();
  }
  const md = readFileSync("content/components/bubble.mdx", "utf8"),
    body = md.slice(md.indexOf("## Installation")).trim();
  expect((await (await request.get("/r/bubble.json")).json()).docs).toBe(body);
  expect(await (await request.get("/r/bubble.md")).text()).toContain(body);
  expect(await (await request.get("/llms-full.txt")).text()).toContain(body);
  expect((body.match(/```tsx/g) || []).length).toBe(9);
  await page.goto("/components/bubble?motion=none&variant=outline&keep=yes#updating-text");
  await page.waitForLoadState("networkidle");
  const first = card(page, "updating-text").locator('[data-message-id="initial"]'),
    saved = await first.elementHandle();
  await first.getByRole("button").press("F2");
  await page.evaluate(() => {
    history.replaceState({ ...history.state, callerToken: "keep" }, "", location.href);
    history.pushState(history.state, "", "?motion=none&variant=unknown&keep=yes#reactions");
  });
  await page.goBack();
  await expect(page).toHaveURL(/variant=outline.*#updating-text/);
  await page.goForward();
  await expect(page).toHaveURL(/variant=unknown.*#reactions/);
  for (const variant of ["all", "destructive"])
    await page.evaluate(
      (variant) => history.pushState(history.state, "", `?motion=none&variant=${variant}&keep=yes#reactions`),
      variant,
    );
  expect(await first.evaluate((el, saved) => el === saved, saved)).toBe(true);
  await expect(first).toContainText("Another local chunk.");
  expect(await page.evaluate(() => history.state.callerToken)).toBe("keep");
  await expect(page.getByLabel("Bubble variant", { exact: true })).toHaveCount(0);
  await expect(roots(page.locator('[data-preview="bubble"]')).first()).toHaveAttribute("data-variant", "muted");
});

// The early B9 item has mode tests in motion-matrix; add the complete-page visual gate here.
for (const colorScheme of ["light", "dark"] as const)
  test.describe(`code-block B9 ${colorScheme}`, () => {
    test.use({ colorScheme });
    test("responsive full page axe and screenshots", async ({ page }) => {
      await page.goto("/components/code-block?motion=none");
      await page.waitForLoadState("networkidle");
      for (const width of [1280, 390]) {
        await page.setViewportSize({ width, height: 1100 });
        expect(
          (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations,
        ).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.screenshot({ path: `.cache/bubble-proof/code-block-${colorScheme}-${width}.png`, fullPage: true });
        await page
          .locator('[data-preview="code-block"]')
          .screenshot({ path: `.cache/bubble-proof/code-preview-${colorScheme}-${width}.png` });
        // Edge can repeat pixels in a capture taller than its raster surface.
        // Overlapping viewport tiles preserve readable proof of the entire long mobile page.
        if (width === 390) {
          await page.setViewportSize({ width, height: 5000 });
          const height = await page.evaluate(() => document.documentElement.scrollHeight);
          for (let y = 0, tile = 0; y < height; y += 4500, tile++) {
            await page.evaluate((top) => scrollTo(0, top), y);
            await page.screenshot({ path: `.cache/bubble-proof/code-block-${colorScheme}-390-tile-${tile}.png` });
          }
        }
      }
    });
  });
