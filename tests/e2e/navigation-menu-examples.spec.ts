import { mkdir, readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { effectiveMode, MODES } from "./helpers";
import { openComponentSource } from "./installation-helpers";
import { openPopupMotionFixture } from "./popup-motion-fixture";

const names: string[] = JSON.parse(await readFile("components/site/previews/examples.json", "utf8"))["navigation-menu"];
const card = (page: Page, name: string) => page.locator(`[data-component-example="navigation-menu/${name}"]`);
const popup = (page: Page) => page.locator('[data-slot="navigation-menu-popup"]');
async function open(page: Page, mode = "none") {
  await page.goto(`/components/navigation-menu?motion=${mode}`);
  await page.waitForLoadState("networkidle");
}

for (const os of [false, true])
  for (const mode of MODES)
    test(`Navigation examples native traversal and measured update ${mode}/${os}`, async ({ page }, info) => {
      await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await open(page, mode);
      const top = page.locator('[data-preview="navigation-menu"]');
      await expect(top.getByRole("combobox")).toHaveCount(0);
      await expect(top.getByRole("button", { name: /switch panel|extra links|menu motion/i })).toHaveCount(0);
      const learn = top.getByRole("button", { name: "Learn", exact: true });
      const build = top.getByRole("button", { name: "Build", exact: true });
      await learn.hover();
      await expect(learn).toHaveAttribute("aria-expanded", "true");
      await expect(popup(page)).toHaveAttribute("data-motion", effectiveMode(mode, os));
      for (const target of [build, learn]) {
        const box = await target.boundingBox();
        if (!box) throw new Error("Missing real trigger bounds");
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 });
        await expect(target).toHaveAttribute("aria-expanded", "true");
      }
      await learn.focus();
      await page.keyboard.press("ArrowDown");
      await expect(learn).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(popup(page).getByRole("link", { name: "Installation", exact: true })).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(learn).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(popup(page)).toHaveCount(0);
      await page.keyboard.press("Space");
      await expect(learn).toHaveAttribute("aria-expanded", "true");
      await page.keyboard.press("ArrowRight");
      await expect(build).toBeFocused();
      await page.keyboard.press("ArrowDown");
      await expect(build).toHaveAttribute("aria-expanded", "true");
      await page.keyboard.press("Tab");
      await expect(popup(page).getByRole("link", { name: "Components", exact: true })).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(build).toBeFocused();
      await expect(popup(page)).toHaveCount(0);
      const changing = card(page, "changing-content");
      await changing.getByRole("button", { name: "Resources", exact: true }).click();
      const panel = popup(page);
      await expect.poll(() => panel.evaluate((el) => el.getAnimations().length)).toBe(0);
      const frames = await panel.evaluate(async (el) => {
        const initial = el.getBoundingClientRect();
        (el.querySelector("button") as HTMLButtonElement).click();
        const frames = [];
        for (let i = 0; i < 40; i++) {
          await new Promise(requestAnimationFrame);
          const s = getComputedStyle(el),
            r = el.getBoundingClientRect();
          frames.push({
            mode: el.getAttribute("data-motion"),
            width: r.width,
            height: r.height,
            opacity: s.opacity,
            scale: s.scale,
            same: el === document.querySelector('[data-slot="navigation-menu-popup"]'),
            properties: el.getAnimations().map((a) => (a as CSSTransition).transitionProperty),
          });
        }
        return { initial: { width: initial.width, height: initial.height }, frames };
      });
      await info.attach("actual in-panel update frames", {
        body: JSON.stringify(frames),
        contentType: "application/json",
      });
      expect(frames.frames.every((f) => f.same)).toBe(true);
      expect(frames.frames.at(-1)?.height).toBeGreaterThan(frames.initial.height);
      if (effectiveMode(mode, os) === "full")
        expect(frames.frames.some((f) => f.properties.includes("height") || f.properties.includes("width"))).toBe(true);
      else
        expect(frames.frames.every((f) => !f.properties.some((p) => ["height", "width", "scale"].includes(p)))).toBe(
          true,
        );
      if (effectiveMode(mode, os) === "none")
        expect(frames.frames.every((f) => !f.properties.length && f.opacity === "1")).toBe(true);
      await panel.getByRole("button", { name: "Show fewer guides" }).click();
      await expect(panel.getByRole("link", { name: "Accessibility guide" })).toHaveCount(0);
      await page.keyboard.press("Escape");
      expect(errors).toEqual([]);
    });

test("Navigation retained input switches without replacing its node and resets only after portal close", async ({
  page,
}) => {
  await open(page);
  const c = card(page, "retained-content");
  const notes = c.getByRole("button", { name: "Notes" });
  await notes.click();
  const input = popup(page).locator("input");
  await expect(input).toHaveAccessibleName("Resource note");
  const handle = await input.elementHandle();
  await input.fill("Caller draft survives switching");
  await c.getByRole("button", { name: "Guides" }).hover();
  await expect(popup(page).getByRole("link", { name: "Theming guide" })).toBeVisible();
  await expect(input).toBeHidden();
  expect(await input.evaluate((n) => !!n.closest("[hidden]"))).toBe(true);
  expect(
    await input.evaluate((n) => {
      n.focus();
      return n === document.activeElement;
    }),
  ).toBe(false);
  await notes.hover();
  await expect(input).toHaveValue("Caller draft survives switching");
  expect(await input.evaluate((n, old) => n === old, handle)).toBe(true);
  await input.focus();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(popup(page)).toHaveAttribute("data-motion", "none");
  await expect(input).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(notes).toBeFocused();
  await expect(input).toHaveCount(0);
  await notes.press("Enter");
  await expect(input).toHaveValue("Read the install guide");
  expect(await input.evaluate((n, old) => n === old, handle)).toBe(false);
});

test("Navigation finite orientations alignment disabled custom native parts and RTL", async ({ page }) => {
  await open(page);
  const vertical = card(page, "vertical"),
    triggers = vertical.locator('[data-slot="navigation-menu-trigger"]');
  await triggers.first().focus();
  await page.keyboard.press("ArrowDown");
  await expect(triggers.nth(1)).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(popup(page).getByRole("link", { name: "Registry integration" })).toBeVisible();
  await page.keyboard.press("ArrowUp");
  await expect(triggers.first()).toBeFocused();
  await page.keyboard.press("Escape");
  for (const align of ["start", "center", "end"]) {
    const trigger = card(page, "alignment").getByRole("button", { name: align, exact: true });
    await trigger.click();
    await expect(page.locator('[data-slot="navigation-menu-positioner"]')).toHaveAttribute("data-align", align);
    const [a, b] = await Promise.all([trigger.boundingBox(), popup(page).boundingBox()]);
    expect(a && b).toBeTruthy();
    if (a && b)
      expect(
        Math.abs(
          align === "start"
            ? a.x - b.x
            : align === "end"
              ? a.x + a.width - b.x - b.width
              : a.x + a.width / 2 - b.x - b.width / 2,
        ),
      ).toBeLessThan(2);
    await page.keyboard.press("Escape");
  }
  const disabled = card(page, "disabled-triggers");
  await expect(disabled.getByRole("button", { name: "Upcoming" })).toBeDisabled();
  await disabled.getByRole("button", { name: "Upcoming" }).locator("..").hover();
  await disabled.getByRole("button", { name: "Upcoming" }).locator("..").click();
  await expect(popup(page)).toHaveCount(0);
  await disabled.getByRole("button", { name: "Guides" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(disabled.getByRole("link", { name: "News" })).toBeFocused();
  await disabled.getByRole("button", { name: "Guides" }).focus();
  await page.keyboard.press("Tab");
  await expect(disabled.getByRole("button", { name: "Upcoming" })).toBeFocused();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Space");
  await expect(popup(page)).toHaveCount(0);
  await page.keyboard.press("Tab");
  await expect(disabled.getByRole("link", { name: "News" })).toBeFocused();
  const custom = card(page, "active-links");
  await custom.getByRole("button", { name: "Focus current page" }).click();
  await expect(custom.getByRole("link", { name: "Navigation Menu", exact: true })).toBeFocused();
  await expect(custom.getByRole("link", { name: "Navigation Menu", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(custom.locator('nav[data-custom-root="resources"]')).toHaveCount(1);
  await custom.getByRole("button", { name: "Resources" }).click();
  await expect(popup(page).locator('[data-slot="navigation-menu-content"]')).toHaveCSS("padding", "12px");
  await expect(custom.locator('[data-slot="navigation-menu-indicator"]')).toHaveCount(1);
  await page.keyboard.press("Escape");
  const rtl = card(page, "rtl");
  await rtl.getByRole("button", { name: "تعلم" }).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(rtl.getByRole("button", { name: "بناء" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(popup(page).getByRole("link", { name: "السجل" })).toBeVisible();
  await expect(popup(page).locator('[data-slot="navigation-menu-content"]')).toHaveAttribute("dir", "rtl");
  await expect(popup(page).getByRole("link", { name: "السجل" })).toHaveCSS("direction", "rtl");
});

test("Navigation caller values header/source updates and actual native link following", async ({ page }) => {
  await open(page);
  const c = card(page, "controlled-navigation");
  const nav = c.getByRole("navigation"),
    handle = await nav.elementHandle();
  await c.getByRole("button", { name: "Open Learn", exact: true }).press("Space");
  await expect(popup(page).getByRole("link", { name: "Installation", exact: true })).toBeVisible();
  await c.getByRole("button", { name: "Open Build", exact: true }).press("Enter");
  await expect(popup(page).getByRole("link", { name: "Registry integration" })).toBeVisible();
  await popup(page).getByRole("button", { name: "Close navigation" }).press("Enter");
  await expect(popup(page)).toHaveCount(0);
  await expect(c.getByRole("status")).toContainText("imperative-action");
  for (const mode of MODES)
    await page.getByRole("group", { name: "Motion mode" }).getByRole("button", { name: mode, exact: true }).click();
  await openComponentSource(page, "navigation-menu");
  expect(await nav.evaluate((n, old) => n === old, handle)).toBe(true);
  await c.getByRole("button", { name: "Build", exact: true }).click();
  await expect(popup(page)).toHaveAttribute("data-motion", "none");
  await page.keyboard.press("Escape");
  const links = card(page, "link-behavior");
  await links.getByRole("button", { name: "On this page" }).click();
  const keep = popup(page).getByRole("link", { name: "Keep menu open" });
  await keep.press("Enter");
  await expect(popup(page)).toBeVisible();
  const target = await keep.getAttribute("href");
  expect(new URL(page.url()).hash).toBe(target);
  await popup(page).getByRole("link", { name: "Close menu on follow" }).press("Enter");
  await expect(popup(page)).toHaveCount(0);
  const top = page.locator('[data-preview="navigation-menu"]');
  await top.getByRole("link", { name: "News" }).press("Enter");
  await expect(page).toHaveURL(/\/docs\/changelog/);
});

test("Navigation pointer intent delay preserves immediate keyboard activation", async ({ page }) => {
  await open(page);
  const trigger = card(page, "hover-delay").getByRole("button", { name: "Guides" });
  await trigger.hover();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await popup(page).hover();
  await expect(popup(page)).toBeVisible();
  await page.mouse.move(0, 0);
  await expect(popup(page)).toHaveCount(0);
  await trigger.press("Enter");
  await expect(popup(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

for (const next of ["none", "reduced", "os"])
  test(`Navigation native running geometry cancels before paint ${next}`, async ({ page }, info) => {
    await openPopupMotionFixture(page, "navigation-menu", "full", 4);
    const c = page.locator('[data-preview="navigation-menu"]');
    await c.getByRole("button", { name: "Learn", exact: true }).click();
    const p = popup(page);
    await expect.poll(() => p.evaluate((n) => n.getAnimations().length)).toBe(0);
    const button = p.getByRole("button", { name: "Toggle details" });
    await button.focus();
    await p.evaluate(async (n) => {
      (n.querySelector("button") as HTMLButtonElement).click();
      for (let i = 0; i < 3; i++) await new Promise(requestAnimationFrame);
      Object.assign(window, {
        navigationRunning: { node: n, animations: n.getAnimations().filter((a) => a.playState === "running") },
      });
    });
    expect(
      await page.evaluate(
        () =>
          (window as unknown as { navigationRunning: { animations: Animation[] } }).navigationRunning.animations.length,
      ),
    ).toBeGreaterThan(0);
    if (next === "os") await page.emulateMedia({ reducedMotion: "reduce" });
    else
      await page.getByLabel("Fixture motion", { exact: true }).evaluate((n: HTMLSelectElement, value) => {
        n.value = value;
        n.dispatchEvent(new Event("change", { bubbles: true }));
      }, next);
    await expect(p).toHaveAttribute("data-motion", next === "none" ? "none" : "reduced");
    const frames = await p.evaluate(async (n) => {
      const saved = (window as unknown as { navigationRunning: { node: Element; animations: Animation[] } })
        .navigationRunning;
      const frames = [];
      for (let i = 0; i < 12; i++) {
        await new Promise(requestAnimationFrame);
        frames.push({
          same: saved.node === n,
          scale: getComputedStyle(n).scale,
          animations: n.getAnimations().map((a) => (a as CSSTransition).transitionProperty),
          old: saved.animations.map((a) => a.playState),
        });
      }
      return frames;
    });
    await info.attach("running native geometry downgrade", {
      body: JSON.stringify(frames),
      contentType: "application/json",
    });
    expect(
      frames.every(
        (f) =>
          f.same &&
          f.scale === "none" &&
          !f.animations.some((p) => ["width", "height", "scale"].includes(p)) &&
          f.old.every((s) => s !== "running"),
      ),
    ).toBe(true);
    await expect(button).toBeFocused();
  });

for (const colorScheme of ["light", "dark"] as const)
  for (const width of [1280, 390])
    for (const name of ["top", ...names])
      test(`Navigation named examples axe and screenshots ${name}/${colorScheme}/${width}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme });
        await page.setViewportSize({ width, height: 1000 });
        await open(page);
        await mkdir(".cache/navigation-menu-proof", { recursive: true });
        const c = name === "top" ? page.locator('[data-preview="navigation-menu"]') : card(page, name);
        await c.scrollIntoViewIfNeeded();
        await expect(c).toBeVisible();
        await page.evaluate(() => scrollTo(0, 0));
        const r = await c.evaluate((n) => {
          const r = n.getBoundingClientRect();
          return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height };
        });
        await page.screenshot({
          path: `.cache/navigation-menu-proof/${name}-${colorScheme}-${width}.png`,
          fullPage: true,
          clip: r,
        });
        for (const trigger of await c
          .locator('[data-slot="navigation-menu-trigger"]:not([aria-disabled="true"])')
          .all()) {
          await trigger.click();
          await expect(popup(page)).toBeVisible();
          if (name === "changing-content") {
            await popup(page).getByRole("button", { name: "Show more guides" }).click();
            await expect(popup(page).getByRole("link", { name: "Accessibility guide" })).toBeVisible();
          }
          await expect.poll(() => popup(page).evaluate((n) => n.getAnimations().length)).toBe(0);
          const bounds = await popup(page).boundingBox();
          expect(bounds && bounds.x >= 0 && bounds.x + bounds.width <= width).toBeTruthy();
          expect(
            (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations,
          ).toEqual([]);
          await page.screenshot({
            path: `.cache/navigation-menu-proof/${name}-open-${await trigger.textContent()}-${colorScheme}-${width}.png`,
          });
          await page.keyboard.press("Escape");
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      });

for (const anchor of ["retained-content", "changing-panel-content", "vertical-navigation"])
  test(`Navigation cold full deep link ${anchor}`, async ({ page }) => {
    await page.goto(`/components/navigation-menu?motion=full#${anchor}`);
    const name =
      anchor === "changing-panel-content" ? "changing-content" : anchor === "vertical-navigation" ? "vertical" : anchor;
    const trigger = card(page, name).locator('[data-slot="navigation-menu-trigger"]').first();
    await trigger.click();
    await expect(popup(page)).toBeVisible();
  });

test("Navigation fixed none first insertion has no authored clock", async ({ page }, info) => {
  await open(page, "full");
  const c = card(page, "without-motion");
  await c.scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    const frames: unknown[] = [];
    Object.assign(window, { instantNavigation: frames });
    const sample = () => {
      for (const n of document.querySelectorAll(
        '[data-slot="navigation-menu-popup"], [data-slot="navigation-menu-popup"] [data-slot="navigation-menu-content"]',
      )) {
        const s = getComputedStyle(n);
        frames.push({
          slot: n.getAttribute("data-slot"),
          mode: n.getAttribute("data-motion"),
          opacity: s.opacity,
          scale: s.scale,
          animations: n.getAnimations().length,
        });
      }
    };
    const observer = new MutationObserver(sample);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true });
    let left = 12;
    const tick = () => {
      sample();
      if (--left) requestAnimationFrame(tick);
      else observer.disconnect();
    };
    (
      document.querySelector('[data-component-example="navigation-menu/without-motion"] button') as HTMLButtonElement
    ).click();
    requestAnimationFrame(tick);
  });
  await expect(popup(page)).toBeVisible();
  await page.waitForTimeout(250);
  const frames = await page.evaluate(
    () =>
      (
        window as unknown as {
          instantNavigation: { slot: string; mode: string; opacity: string; scale: string; animations: number }[];
        }
      ).instantNavigation,
  );
  await info.attach("none actual insertion", { body: JSON.stringify(frames), contentType: "application/json" });
  for (const slot of ["navigation-menu-popup", "navigation-menu-content"])
    expect(frames.filter((f) => f.slot === slot).length).toBeGreaterThanOrEqual(12);
  expect(frames.every((f) => f.mode === "none" && f.opacity === "1" && f.scale === "none" && f.animations === 0)).toBe(
    true,
  );
});
