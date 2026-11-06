import { mkdir, readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { effectiveMode, MODES } from "./helpers";
import { openComponentSource } from "./installation-helpers";
import { openPopupMotionFixture } from "./popup-motion-fixture";

const runtimeErrors = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  const errors: string[] = [];
  runtimeErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
});
test.afterEach(({ page }) => expect(runtimeErrors.get(page) ?? []).toEqual([]));

const names: string[] = JSON.parse(await readFile("components/site/previews/examples.json", "utf8")).sidebar;
const card = (page: Page, name: string) => page.locator(`[data-component-example="sidebar/${name}"]`);
const panel = (root: Locator) => root.locator('[data-slot="sidebar-container"]');
const trigger = (root: Locator) => root.locator('[data-slot="sidebar-trigger"]');
async function open(page: Page, mode = "none") {
  await page.goto(`/components/sidebar?motion=${mode}`);
  await page.waitForLoadState("networkidle");
}
async function snapshot(root: Locator) {
  return panel(root).evaluate(async (el) => {
    const frames = [];
    for (let n = 0; n < 16; n++) {
      await new Promise(requestAnimationFrame);
      const s = getComputedStyle(el);
      frames.push({
        transform: s.transform,
        opacity: s.opacity,
        width: el.getBoundingClientRect().width,
        cssWidth: s.width,
        animations: el.getAnimations().length,
      });
    }
    return frames;
  });
}

for (const os of [false, true])
  for (const mode of MODES)
    test(`Sidebar native examples and retained desktop identity ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
      await open(page, mode);
      const top = page.locator('[data-preview="sidebar"]'),
        effective = effectiveMode(mode, os);
      await expect(top.getByRole("combobox")).toHaveCount(0);
      await expect(top.locator("select")).toHaveCount(0);
      await expect(trigger(top)).toHaveCount(1);
      await expect(panel(top)).toHaveAttribute("data-motion", effective);
      const input = top.getByRole("textbox"),
        saved = await input.elementHandle(),
        savedPanel = await panel(top).elementHandle();
      await input.fill("Inbox");
      await expect(top.getByRole("link")).toHaveCount(1);
      await input.focus();
      await page.keyboard.press("Tab");
      await expect(top.getByRole("link", { name: "Inbox", exact: true })).toBeFocused();
      await page.keyboard.press("Enter");
      expect(new URL(page.url()).hash).not.toBe("");
      await trigger(top).press("Space");
      await expect(panel(top)).toHaveAttribute("inert", "");
      if (effective !== "full") expect((await snapshot(top)).every((f) => f.transform === "none")).toBe(true);
      await trigger(top).press("Enter");
      await expect(panel(top)).not.toHaveAttribute("inert");
      await expect(input).toHaveValue("Inbox");
      expect(await input.evaluate((n, h) => n === h, saved)).toBe(true);
      expect(await panel(top).evaluate((n, h) => n === h, savedPanel)).toBe(true);
      const variants = card(page, "variants");
      for (const variant of ["sidebar", "floating", "inset"]) {
        const shell = variants.locator(`[data-slot="sidebar"][data-variant="${variant}"]`);
        await expect(shell).toBeVisible();
        await expect(panel(shell)).toHaveAttribute("data-motion", effective);
        expect(await panel(shell).evaluate((el) => el.getBoundingClientRect().width)).toBeGreaterThan(180);
      }
      const right = card(page, "right-side");
      await expect(panel(right)).toHaveAttribute("data-side", "right");
      const expanded = await panel(right).boundingBox();
      await trigger(right).click();
      await expect(panel(right)).toHaveAttribute("inert", "");
      if (effective !== "full") expect((await snapshot(right)).every((f) => f.transform === "none")).toBe(true);
      await trigger(right).click();
      await expect(panel(right)).not.toHaveAttribute("inert");
      expect(expanded?.width).toBeGreaterThan(180);
      const modes = card(page, "collapse-modes"),
        wrappers = modes.locator('[data-slot="sidebar-wrapper"]');
      await expect(panel(wrappers.nth(0))).toHaveAttribute("inert", "");
      const icon = wrappers.nth(1);
      expect((await panel(icon).boundingBox())?.width).toBeCloseTo(48, 0);
      await trigger(icon).click();
      expect((await panel(icon).boundingBox())?.width).toBeGreaterThan(180);
      const staticShell = wrappers.nth(2);
      await trigger(staticShell).click();
      await expect(staticShell.getByRole("textbox")).toBeVisible();
      await expect(panel(staticShell)).toHaveCount(0);
      const controlled = card(page, "controlled-navigation");
      await controlled.getByRole("button", { name: "Collapse desktop", exact: true }).click();
      await expect(controlled.locator("[data-sidebar-state]")).toContainText("collapsed");
      await controlled.getByRole("button", { name: "Expand desktop", exact: true }).click();
      await expect(controlled.getByLabel("Desktop changes")).toHaveText("Desktop changes: 2");
      expect((await page.context().cookies()).find((c) => c.name === "sidebar_state")?.value).toBe("true");
      const draft = card(page, "caller-updates").getByRole("textbox"),
        node = await draft.elementHandle();
      await draft.fill("Retain my project draft");
      const first = card(page, "caller-updates").getByRole("button", { name: "Website", exact: true }),
        firstNode = await first.elementHandle();
      await card(page, "caller-updates").getByRole("button", { name: "Add project", exact: true }).click();
      await expect(
        card(page, "caller-updates").getByRole("button", { name: "Desktop app", exact: true }),
      ).toBeVisible();
      await card(page, "caller-updates").getByRole("button", { name: "Remove project", exact: true }).click();
      expect(await first.evaluate((n, h) => n === h, firstNode)).toBe(true);
      for (const requested of MODES)
        await page
          .getByRole("group", { name: "Motion mode" })
          .getByRole("button", { name: requested, exact: true })
          .click();
      await openComponentSource(page, "sidebar");
      expect(await draft.evaluate((n, h) => n === h, node)).toBe(true);
      await expect(draft).toHaveValue("Retain my project draft");
      const ids = await page.locator("[id]").evaluateAll((nodes) => nodes.map((n) => n.id));
      expect(new Set(ids).size).toBe(ids.length);
    });

test("Sidebar parts, native actions, tooltips and caller-owned loading", async ({ page }) => {
  await open(page);
  const styles = card(page, "menu-styles");
  for (const size of ["sm", "default", "lg"])
    await expect(styles.locator(`[data-slot="sidebar-menu-button"][data-size="${size}"]`).first()).toBeVisible();
  await expect(styles.getByRole("button", { name: "Disabled command" })).toBeDisabled();
  await expect(styles.getByRole("button", { name: "Active command" })).toHaveAttribute("aria-pressed", "true");
  const actions = card(page, "groups-and-actions");
  await actions.getByRole("button", { name: "Add project", exact: true }).press("Enter");
  const opts = actions.getByRole("button", { name: "Options for Project 2" });
  await opts.focus();
  await expect(opts).toHaveCSS("opacity", "1");
  await opts.press("Space");
  await expect(actions.getByRole("status")).toHaveText("Options for Project 2");
  await actions.getByRole("button", { name: "Settings options", exact: true }).click();
  await expect(actions.getByRole("status")).toHaveText("Settings options");
  await expect(actions.getByLabel("3 updates")).toHaveText("3");
  const sub = card(page, "sub-navigation");
  await expect(sub.getByRole("link", { name: "md project", exact: true })).toHaveAttribute("aria-current", "page");
  await trigger(sub).click();
  await expect(sub.locator('[data-slot="sidebar-menu-sub"]')).toBeHidden();
  const loading = card(page, "loading-navigation");
  await expect(loading.locator('[data-slot="sidebar-menu-skeleton"]')).toHaveCount(2);
  await loading.getByRole("button", { name: "Show navigation", exact: true }).click();
  await expect(loading.getByRole("button", { name: "Website", exact: true })).toBeVisible();
  await loading.getByRole("button", { name: "Reload navigation", exact: true }).click();
  await expect(loading.locator('[data-slot="sidebar-menu-skeleton"]')).toHaveCount(2);
  const custom = card(page, "custom-parts");
  await custom.getByRole("button", { name: "Focus project link" }).click();
  await expect(custom.getByRole("link")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(custom.getByRole("status")).toHaveText("Native clicks: 1");
  await expect(panel(custom)).toHaveAttribute("dir", "rtl");
  await trigger(custom).click();
  await expect(panel(custom)).toHaveAttribute("inert", "");
  await expect(panel(custom)).toHaveCSS("transform", "none");
  const icon = card(page, "icon-navigation");
  const link = icon.getByRole("link", { name: "Inbox", exact: true });
  await link.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("tooltip", { name: "Inbox", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  const rail = icon.locator('[data-slot="sidebar-rail"]');
  await expect(rail).toHaveAttribute("tabindex", "-1");
  await rail.click();
  expect((await panel(icon).boundingBox())?.width).toBeGreaterThan(180);
});

for (const os of [false, true])
  for (const mode of MODES)
    test(`Sidebar single-provider live motion reversal cancellation and mobile ${mode}/${os}`, async ({
      page,
    }, info) => {
      await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
      await openPopupMotionFixture(page, "sidebar", mode, 4);
      const root = page.locator('[data-slot="sidebar-wrapper"]'),
        p = panel(root),
        t = trigger(root),
        effective = effectiveMode(mode, os);
      await expect(p).toHaveAttribute("data-motion", effective);
      const input = root.getByRole("textbox"),
        node = await input.elementHandle(),
        pn = await p.elementHandle();
      await input.fill("desktop draft");
      await input.focus();
      // This isolated registry entry proves the window shortcut, including inside an input.
      await page.keyboard.press("Control+b");
      await expect(p).toHaveAttribute("inert", "");
      await expect(input).not.toBeFocused();
      const closing = await snapshot(root);
      await page.keyboard.press("Control+b");
      await expect(p).not.toHaveAttribute("inert");
      await input.focus();
      const opening = await snapshot(root);
      await info.attach("native sidebar frame samples", {
        body: JSON.stringify({ closing, opening }),
        contentType: "application/json",
      });
      expect(new Set([...closing, ...opening].map((frame) => frame.cssWidth)).size).toBe(1);
      // DOMRect subtracts fractional translated coordinates; retain the raw values and
      // bound only their floating-point error (observed span 0.000122px), not real resizing.
      const widths = [...closing, ...opening].map((frame) => frame.width);
      expect(Math.max(...widths) - Math.min(...widths)).toBeLessThan(0.001);
      if (effective === "full") {
        expect(new Set(closing.map((f) => f.transform)).size).toBeGreaterThan(2);
        expect(new Set(opening.map((f) => f.transform)).size).toBeGreaterThan(2);
      } else expect([...closing, ...opening].every((f) => f.transform === "none" && f.animations === 0)).toBe(true);
      await expect.poll(() => p.evaluate((el) => getComputedStyle(el).transform)).toBe("none");
      await expect(input).toBeFocused();
      expect(await input.evaluate((n, h) => n === h, node)).toBe(true);
      expect(await p.evaluate((n, h) => n === h, pn)).toBe(true);
      // Real pointer starts an offcanvas spring, then a non-pointer mode event cancels it.
      await t.click();
      await page.getByLabel("Fixture motion", { exact: true }).selectOption("none");
      await expect(p).toHaveCSS("transform", "none");
      expect((await snapshot(root)).every((f) => f.transform === "none" && f.animations === 0)).toBe(true);
      await page.getByLabel("Fixture motion", { exact: true }).selectOption("full");
      await t.click();
      await input.focus();
      await page.getByLabel("Fixture motion", { exact: true }).evaluate((el) => {
        const select = el as HTMLSelectElement;
        select.value = "none";
        select.dispatchEvent(new Event("change", { bubbles: true }));
      });
      await expect(input).toBeFocused();
      await expect(input).toHaveValue("desktop draft");
      await expect(p).toHaveCSS("transform", "none");
      await page.getByLabel("Fixture motion", { exact: true }).evaluate((el) => {
        const select = el as HTMLSelectElement;
        select.value = "full";
        select.dispatchEvent(new Event("change", { bubbles: true }));
      });
      await t.click();
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect(p).toHaveAttribute("data-motion", "reduced");
      await expect(p).toHaveCSS("transform", "none");
      await page.setViewportSize({ width: 390, height: 900 });
      await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
      await page.getByLabel("Fixture motion", { exact: true }).selectOption(mode);
      await t.focus();
      const frames = await t.evaluate(async (el) => {
        (el as HTMLButtonElement).click();
        const frames = [];
        for (let i = 0; i < 18; i++) {
          await new Promise(requestAnimationFrame);
          const p = document.querySelector('[data-mobile="true"]');
          if (p) {
            const s = getComputedStyle(p);
            frames.push({
              translate: s.translate,
              opacity: s.opacity,
              duration: s.transitionDuration,
              animations: p.getAnimations().length,
            });
          }
        }
        return frames;
      });
      await info.attach("actual mobile first-entry frames", {
        body: JSON.stringify(frames),
        contentType: "application/json",
      });
      expect(frames.length).toBeGreaterThan(0);
      if (effective === "reduced") {
        expect(new Set(frames.map((frame) => frame.opacity)).size).toBeGreaterThan(1);
        expect(frames.some((frame) => frame.duration !== "0s")).toBe(true);
      }
      if (effective === "full") expect(new Set(frames.map((f) => f.translate)).size).toBeGreaterThan(1);
      else expect(frames.every((f) => f.translate === "none")).toBe(true);
      if (effective === "none")
        expect(frames.every((f) => f.opacity === "1" && f.duration === "0s" && f.animations === 0)).toBe(true);
      const dialog = page.getByRole("dialog", { name: "Sidebar", exact: true });
      await expect(dialog).toHaveAttribute("data-motion", effective);
      expect(await dialog.evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe("rgba(0, 0, 0, 0)");
      await dialog.getByRole("textbox").fill("mobile local");
      await page.keyboard.press("Tab");
      await expect(dialog.getByRole("link", { name: "Overview", exact: true })).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(dialog.getByRole("textbox")).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(dialog.getByRole("link", { name: "Overview", exact: true })).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(dialog.getByRole("textbox")).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(t).toBeFocused();
      await t.press("Enter");
      await expect(dialog.getByRole("textbox")).toHaveValue("");
      if (effective !== "none") {
        await expect.poll(() => dialog.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
        const reversing = await dialog.elementHandle();
        await page.keyboard.press("Control+b");
        await page.waitForFunction(() =>
          document
            .querySelector('[data-mobile="true"]')
            ?.getAnimations()
            .some((a) => a.playState === "running"),
        );
        await page.keyboard.press("Control+b");
        await expect(dialog).toBeVisible();
        expect(await dialog.evaluate((n, h) => n === h, reversing)).toBe(true);
      }
      const mobile = await dialog.elementHandle();
      const mobileInput = await dialog.getByRole("textbox").elementHandle();
      await dialog.getByRole("textbox").fill("same popup");
      await dialog.getByRole("textbox").focus();
      await page.getByLabel("Fixture motion", { exact: true }).evaluate((el) => {
        const s = el as HTMLSelectElement;
        s.value = "none";
        s.dispatchEvent(new Event("change", { bubbles: true }));
      });
      await expect(dialog).toHaveAttribute("data-motion", "none");
      await expect.poll(() => dialog.evaluate((el) => el.getAnimations().length)).toBe(0);
      expect(await dialog.evaluate((n, h) => n === h, mobile)).toBe(true);
      await expect(dialog.getByRole("textbox")).toBeFocused();
      await expect(dialog.getByRole("textbox")).toHaveValue("same popup");
      expect(await dialog.getByRole("textbox").evaluate((n, h) => n === h, mobileInput)).toBe(true);
      // Outside the left 18rem Sheet is an actual backdrop hit target.
      await page.mouse.click(380, 500);
      await expect(dialog).toBeHidden();
    });

test("Sidebar mobile caller draft survives close and real breakpoint remount", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await open(page);
  const c = card(page, "mobile-behavior"),
    t = trigger(c);
  await t.click();
  const dialog = page.getByRole("dialog", { name: "Sidebar", exact: true });
  await expect(dialog).toHaveAttribute("data-side", "right");
  const draft = dialog.getByRole("textbox", { name: "Persistent mobile draft" });
  await draft.fill("retain mobile draft");
  await dialog.getByRole("button", { name: "Close navigation" }).press("Space");
  await expect(dialog).toBeHidden();
  await t.click();
  await expect(draft).toHaveValue("retain mobile draft");
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(c.getByRole("textbox", { name: "Persistent mobile draft" })).toHaveValue("retain mobile draft");
});

for (const theme of ["light", "dark"] as const)
  for (const width of [1280, 390])
    for (const part of [0, 1])
      test(`Sidebar all fixed examples visual and axe ${theme}/${width}/${part}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1000 });
        await page.addInitScript((value) => localStorage.setItem("cadence-theme", value), theme);
        await open(page);
        expect(
          (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations,
        ).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await mkdir(".cache/sidebar-proof", { recursive: true });
        for (const name of ["top", ...names].slice(part * 7, (part + 1) * 7)) {
          const c = name === "top" ? page.locator('[data-preview="sidebar"]') : card(page, name);
          const r = await c.boundingBox();
          if (!r) throw new Error("missing card");
          await page.evaluate(() => scrollTo(0, 0));
          await page.screenshot({
            path: `.cache/sidebar-proof/${name}-${theme}-${width}.png`,
            fullPage: true,
            clip: { x: r.x, y: r.y + (await page.evaluate(() => scrollY)), width: r.width, height: r.height },
          });
        }
        if (width === 390 && part === 1) {
          await trigger(card(page, "mobile-behavior")).click();
          const d = page.getByRole("dialog", { name: "Sidebar", exact: true });
          await expect(d).toBeVisible();
          expect(
            (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations,
          ).toEqual([]);
          await d.screenshot({ path: `.cache/sidebar-proof/mobile-open-${theme}-${width}.png` });
          await page.keyboard.press("Escape");
        }
      });

for (const name of ["variants", "caller-updates", "without-motion"])
  test(`Sidebar cold full deep link ${name}`, async ({ page }) => {
    await page.goto(`/components/sidebar?motion=full#${name}`);
    await page.waitForLoadState("networkidle");
    await expect(card(page, name)).toBeInViewport();
    await trigger(card(page, name)).first().click();
  });

test("Sidebar fixed none is neutral from its actual first insertion", async ({ page }) => {
  await page.addInitScript(() => {
    const samples: { transform: string; opacity: string; animations: number; duration: string }[] = [];
    (window as unknown as { sidebarFirst: typeof samples }).sidebarFirst = samples;
    let found = false;
    const observer = new MutationObserver(() => {
      const node = document.querySelector(
        '[data-component-example="sidebar/without-motion"] [data-slot="sidebar-container"]',
      );
      if (!node || found) return;
      found = true;
      const sample = () => {
        const style = getComputedStyle(node);
        samples.push({
          transform: style.transform,
          opacity: style.opacity,
          animations: node.getAnimations().length,
          duration: style.transitionDuration,
        });
        if (samples.length < 12) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    observer.observe(document, { subtree: true, childList: true });
  });
  await open(page, "full");
  const frames = await page.evaluate(
    () =>
      (
        window as unknown as {
          sidebarFirst: { transform: string; opacity: string; animations: number; duration: string }[];
        }
      ).sidebarFirst,
  );
  expect(frames).toHaveLength(12);
  expect(
    frames.every((f) => f.transform === "none" && f.opacity === "1" && f.animations === 0 && f.duration === "0s"),
  ).toBe(true);
});

for (const theme of ["light", "dark"] as const)
  test(`Sidebar opened compact tooltip and project actions ${theme}`, async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem("cadence-theme", value), theme);
    await open(page);
    const icon = card(page, "icon-navigation");
    const inbox = icon.getByRole("link", { name: "Inbox", exact: true });
    await inbox.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    const tooltip = page.getByRole("tooltip", { name: "Inbox", exact: true });
    await expect(tooltip).toBeVisible();
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual(
      [],
    );
    await tooltip.screenshot({ path: `.cache/sidebar-proof/icon-tooltip-${theme}-1280.png` });
    await page.keyboard.press("Escape");
    const actions = card(page, "groups-and-actions");
    await actions.getByRole("button", { name: "Add project", exact: true }).press("Enter");
    const options = actions.getByRole("button", { name: "Options for Project 2" });
    await options.focus();
    await expect(options).toHaveCSS("opacity", "1");
    await options.press("Space");
    await expect(actions.getByRole("status")).toHaveText("Options for Project 2");
    await page.evaluate(() => scrollTo(0, 0));
    const r = await actions.boundingBox();
    if (!r) throw new Error("missing project actions");
    await page.screenshot({ path: `.cache/sidebar-proof/project-actions-${theme}-1280.png`, fullPage: true, clip: r });
  });
