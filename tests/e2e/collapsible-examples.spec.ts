import { mkdir, readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { effectiveMode, MODES } from "./helpers";

const names: string[] = JSON.parse(await readFile("components/site/previews/examples.json", "utf8")).collapsible;
const selector = (name: string) => `[data-component-example="collapsible/${name}"]`;
for (const os of ["no-preference", "reduce"] as const)
  for (const mode of MODES)
    test(`collapsible examples modes and independent disclosure ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os });
      await page.goto(`/components/collapsible?motion=${mode}`);
      await page.waitForLoadState("networkidle");
      const top = page.locator('[data-preview="collapsible"]');
      await expect(top.getByRole("button")).toHaveCount(1);
      await expect(top.getByRole("combobox")).toHaveCount(0);
      for (const name of names) {
        const card = page.locator(selector(name));
        await expect(card).toBeVisible();
        for (const [i, part] of (await card.locator('[data-slot="collapsible-content"]').all()).entries()) {
          const expected =
            name === "without-motion"
              ? i === 0
                ? "none"
                : effectiveMode("full", os === "reduce")
              : effectiveMode(mode, os === "reduce");
          await expect(part).toHaveAttribute("data-motion", expected);
          await expect(part).toHaveCSS("transition-duration", expected === "full" ? "0.32s" : "0s");
        }
      }
      const trigger = top.locator('[data-slot="collapsible-trigger"]');
      await trigger.press("Enter");
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await expect(trigger).toBeFocused();
      await trigger.press("Space");
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
      const controlled = page.locator(selector("controlled"));
      await controlled.getByRole("button", { name: "Open from outside" }).click();
      await expect(controlled.getByRole("status")).toHaveText("Details: open");
      await controlled.getByRole("button", { name: "Account details" }).press("Space");
      await expect(controlled.getByRole("status")).toHaveText("Details: closed");
      await controlled.getByRole("button", { name: "Open from outside" }).click();
      await controlled.getByRole("button", { name: "Close from outside" }).click();
      await expect(controlled.getByRole("status")).toHaveText("Details: closed");
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
      const custom = page.locator(selector("custom-trigger"));
      const nonNative = custom.getByRole("button", { name: "Non-native details" });
      await expect(nonNative).toHaveJSProperty("tagName", "DIV");
      await nonNative.press("Enter");
      await expect(nonNative).toHaveAttribute("aria-expanded", "true");
      await expect(nonNative).toBeFocused();
      await nonNative.press("Space");
      await expect(nonNative).toHaveAttribute("aria-expanded", "false");
      const button = custom.getByRole("button", { name: "Button details" });
      await expect(button).toHaveJSProperty("tagName", "BUTTON");
      await button.press("Space");
      await expect(button).toHaveAttribute("aria-expanded", "false");
    });

test("collapsible disabled navigation, persistent native draft and custom region", async ({ page }) => {
  await page.goto("/components/collapsible?motion=none");
  await page.waitForLoadState("networkidle");
  const disabled = page.locator(selector("disabled"));
  for (const [name, expanded] of [
    ["Locked project", "true"],
    ["Unavailable details", "false"],
  ] as const) {
    const trigger = disabled.getByRole("button", { name, exact: true });
    await expect(trigger).toBeDisabled();
    await trigger.press("Enter");
    await expect(trigger).toHaveAttribute("aria-expanded", expanded);
  }
  const available = disabled.getByRole("button", { name: "Available details", exact: true });
  await available.focus();
  await page.keyboard.press("Shift+Tab");
  // The previous card's code fence is also in the page's real focus order.
  // Backward navigation must skip both disabled triggers and leave this card.
  expect(
    await page.evaluate(() => {
      const active = document.activeElement;
      return (
        !!active &&
        active !== document.body &&
        active.isConnected &&
        !active.closest('[data-component-example="collapsible/disabled"]')
      );
    }),
  ).toBe(true);
  await page.keyboard.press("Tab");
  await expect(available).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(disabled.getByRole("link")).toBeFocused();
  const persistent = page.locator(selector("persistent"));
  const input = persistent.getByRole("textbox", { name: "Workspace note" });
  await input.fill("Retained native note");
  const saved = await input.elementHandle();
  const trigger = persistent.getByRole("button", { name: "Workspace draft" });
  await trigger.press("Enter");
  await expect(input).toBeHidden();
  await page.keyboard.press("Tab");
  expect(await saved?.evaluate((n) => n.isConnected && document.activeElement !== n)).toBe(true);
  await trigger.press("Space");
  await expect(input).toHaveValue("Retained native note");
  expect(await input.evaluate((n, original) => n === original, saved)).toBe(true);
  await trigger.focus();
  await page.keyboard.press("Tab");
  await expect(input).toBeFocused();
  const custom = page.locator(selector("custom-render"));
  await expect(custom.locator('section[data-slot="collapsible"]')).toHaveCount(1);
  await expect(custom.getByRole("region", { name: "Support resources" })).toBeVisible();
  await expect(custom.getByRole("link")).toHaveAttribute("href", "/docs/installation");
  const ids = await page.locator("[data-component-example] [id]").evaluateAll((nodes) => nodes.map((n) => n.id));
  expect(new Set(ids).size).toBe(ids.length);
  for (const part of await page
    .locator("[data-component-example] [aria-controls], [data-component-example] [aria-labelledby]")
    .all()) {
    // Default closed panels are unmounted, so their controls may reference an absent panel.
    const controls = await part.getAttribute("aria-controls");
    if (controls && (await part.getAttribute("aria-expanded")) === "false") continue;
    expect(
      await part.evaluate((n) =>
        ["aria-controls", "aria-labelledby"].every((attr) =>
          (n.getAttribute(attr) ?? "")
            .split(" ")
            .filter(Boolean)
            .every((id) => !!document.getElementById(id)),
        ),
      ),
    ).toBe(true);
  }
});

test("collapsible searchable panel retains until-found and handles beforematch", async ({ page }) => {
  await page.goto("/components/collapsible?motion=none");
  await page.waitForLoadState("networkidle");
  const card = page.locator(selector("searchable"));
  const panel = card.locator('[data-slot="collapsible-content"]');
  await expect(panel).toHaveAttribute("hidden", "until-found");
  // Proves the real Base UI event handler, not the browser's Find UI.
  await panel.dispatchEvent("beforematch");
  await expect(panel).not.toHaveAttribute("hidden");
  await expect(card.getByRole("button")).toHaveAttribute("aria-expanded", "true");
});

test("collapsible live system reduction cancels geometry and retains native node draft focus", async ({
  page,
}, info) => {
  await page.goto("/components/collapsible?motion=full&speed=0.25");
  await page.waitForLoadState("networkidle");
  const card = page.locator(selector("persistent"));
  const trigger = card.getByRole("button", { name: "Workspace draft" });
  const panel = card.locator('[data-slot="collapsible-content"]').first();
  const input = card.getByRole("textbox", { name: "Workspace note" });
  await input.fill("Live native draft");
  const saved = await input.elementHandle();
  await trigger.press("Enter");
  await expect.poll(() => panel.evaluate((n) => n.getAnimations().length)).toBeGreaterThan(0);
  await trigger.press("Space");
  await input.focus();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(panel).toHaveAttribute("data-motion", "reduced");
  const frames = await panel.evaluate(async (n) => {
    const rows = [];
    for (let i = 0; i < 12; i++) {
      await new Promise(requestAnimationFrame);
      rows.push({
        height: n.getBoundingClientRect().height,
        inner: n.firstElementChild?.getBoundingClientRect().height,
        animations: n.getAnimations().length,
        focus: document.activeElement?.tagName,
      });
    }
    return rows;
  });
  await info.attach("native cancellation frames", { body: JSON.stringify(frames), contentType: "application/json" });
  expect(frames.every((f) => f.animations === 0 && Math.abs(f.height - (f.inner ?? 0)) < 1)).toBe(true);
  await expect(input).toBeFocused();
  await expect(input).toHaveValue("Live native draft");
  expect(await input.evaluate((n, original) => n === original, saved)).toBe(true);
  await page.getByRole("group", { name: "Motion mode" }).getByRole("button", { name: "none", exact: true }).click();
  await expect(panel).toHaveAttribute("data-motion", "none");
  await page.getByText("Component source", { exact: true }).click();
  await expect(input).toHaveValue("Live native draft");
  expect(await input.evaluate((n, original) => n === original, saved)).toBe(true);
});

for (const theme of ["light", "dark"] as const)
  for (const width of [1280, 390])
    for (const name of ["top", ...names])
      test(`collapsible visual axe ${name}/${theme}/${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1100 });
        await page.addInitScript((value) => localStorage.setItem("cadence-theme", value), theme);
        await page.goto("/components/collapsible?motion=none");
        await page.waitForLoadState("networkidle");
        const sel = name === "top" ? '[data-preview="collapsible"]' : selector(name);
        const card = page.locator(sel);
        await card.scrollIntoViewIfNeeded();
        expect(
          (await new AxeBuilder({ page }).include(sel).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
            .violations,
        ).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await mkdir(".cache/collapsible-proof", { recursive: true });
        await card.screenshot({ path: `.cache/collapsible-proof/${name}-${theme}-${width}.png` });
      });

test("collapsible fixed none first inserted frames", async ({ page }, info) => {
  await page.addInitScript(() => {
    const rows: { duration: string; mode: string | null; animations: number }[] = [];
    (window as unknown as { collapsibleFirstFrames: typeof rows }).collapsibleFirstFrames = rows;
    let started = false;
    const observer = new MutationObserver(() => {
      const panel = document.querySelector(
        '[data-component-example="collapsible/without-motion"] [data-slot="collapsible-content"]',
      );
      if (!panel || started) return;
      started = true;
      let count = 0;
      const sample = () => {
        rows.push({
          duration: getComputedStyle(panel).transitionDuration,
          mode: panel.getAttribute("data-motion"),
          animations: panel.getAnimations().length,
        });
        if (++count < 12) requestAnimationFrame(sample);
      };
      sample();
    });
    observer.observe(document, { childList: true, subtree: true });
  });
  await page.goto("/components/collapsible?motion=full");
  await page.waitForLoadState("networkidle");
  const frames = await page.evaluate(
    () =>
      (window as unknown as { collapsibleFirstFrames: { duration: string; mode: string; animations: number }[] })
        .collapsibleFirstFrames,
  );
  await info.attach("actual fixed none insertion", { body: JSON.stringify(frames), contentType: "application/json" });
  expect(frames).toHaveLength(12);
  expect(frames.every((f) => f.mode === "none" && f.duration === "0s" && f.animations === 0)).toBe(true);
});

for (const anchor of ["usage", "changing-content", "without-motion"])
  test(`collapsible cold full deep link ${anchor}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(`/components/collapsible?motion=full#${anchor}`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator(`h2#${anchor}`)).toBeInViewport();
    await page.locator(`h2#${anchor}`).evaluate((n) => {
      const rect = n.getBoundingClientRect();
      if (rect.top < 0 || getComputedStyle(n.closest("article") ?? n).opacity === "0")
        throw new Error("deep link remains hidden");
    });
  });
