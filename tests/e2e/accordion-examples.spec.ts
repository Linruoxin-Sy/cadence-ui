import { mkdir, readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { effectiveMode, MODES } from "./helpers";

const names: string[] = JSON.parse(await readFile("components/site/previews/examples.json", "utf8")).accordion;
const selector = (name: string) => `[data-component-example="accordion/${name}"]`;
for (const os of ["no-preference", "reduce"] as const)
  for (const mode of MODES)
    test(`accordion examples modes and independent disclosure ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os });
      await page.goto(`/components/accordion?motion=${mode}`);
      await page.waitForLoadState("networkidle");
      const resolved = effectiveMode(mode, os === "reduce");
      const top = page.locator('[data-preview="accordion"]');
      await expect(top.getByRole("button")).toHaveCount(3);
      await expect(top.getByRole("combobox")).toHaveCount(0);
      for (const name of names) {
        const card = page.locator(selector(name));
        await expect(card).toBeVisible();
        for (const [i, part] of (await card.locator('[data-slot="accordion-content"]').all()).entries()) {
          const expected =
            name === "without-motion" ? (i === 0 ? "none" : effectiveMode("full", os === "reduce")) : resolved;
          await expect(part).toHaveAttribute("data-motion", expected);
          await expect(part).toHaveCSS("transition-duration", expected === "full" ? "0.32s" : "0s");
        }
      }
      const first = top.getByRole("button", { name: "How do I install a component?" });
      const second = top.getByRole("button", { name: "Can I reduce the motion?" });
      await second.press("Enter");
      await expect(first).toHaveAttribute("aria-expanded", "false");
      await expect(second).toHaveAttribute("aria-expanded", "true");
      await expect(second).toBeFocused();
      await second.press("Space");
      await expect(second).toHaveAttribute("aria-expanded", "false");
      const multiple = page.locator(selector("multiple"));
      await multiple.getByRole("button", { name: "Delivery", exact: true }).press("Enter");
      await expect(multiple.getByRole("button", { name: "Returns", exact: true })).toHaveAttribute(
        "aria-expanded",
        "true",
      );
      const controlled = page.locator(selector("controlled"));
      await controlled.getByRole("button", { name: "Open account from outside" }).click();
      await expect(controlled.getByRole("status")).toHaveText("Open sections: account");
      await controlled.getByRole("button", { name: "Account settings" }).press("Space");
      await expect(controlled.getByRole("status")).toHaveText("Open sections: none");
      await controlled.getByRole("button", { name: "Open account from outside" }).click();
      await controlled.getByRole("button", { name: "Close from outside" }).click();
      await expect(controlled.getByRole("status")).toHaveText("Open sections: none");
      await expect(multiple.getByRole("button", { name: "Returns", exact: true })).toHaveAttribute(
        "aria-expanded",
        "true",
      );
    });

test("accordion disabled native navigation, persistent drafts, custom panel and legacy orientation", async ({
  page,
}) => {
  await page.goto("/components/accordion?motion=none");
  await page.waitForLoadState("networkidle");
  const disabled = page.locator(selector("disabled"));
  const available = disabled.getByRole("button", { name: "Available settings" });
  await available.focus();
  await page.keyboard.press("ArrowDown");
  await expect(available).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(disabled.getByRole("button", { name: "Settings help" })).toBeFocused();
  for (const name of ["Unavailable section", "Read-only summary", "Locked next step"]) {
    const trigger = disabled.getByRole("button", { name, exact: true });
    await expect(trigger).toBeDisabled();
    const expanded = await trigger.getAttribute("aria-expanded");
    await trigger.press("Enter");
    await expect(trigger).toHaveAttribute("aria-expanded", expanded ?? "false");
  }
  const persistent = page.locator(selector("persistent"));
  for (const [label, heading] of [
    ["Workspace note", "Workspace draft"],
    ["Panel note", "Panel draft"],
  ]) {
    const input = persistent.getByRole("textbox", { name: label });
    await input.fill(`Retained ${label}`);
    const saved = await input.elementHandle();
    const trigger = persistent.getByRole("button", { name: heading });
    await trigger.press("Enter");
    await expect(input).toBeHidden();
    await page.keyboard.press("Tab");
    expect(await saved?.evaluate((n) => n.isConnected && document.activeElement !== n)).toBe(true);
    await trigger.press("Space");
    await expect(input).toHaveValue(`Retained ${label}`);
    expect(await input.evaluate((n, original) => n === original, saved)).toBe(true);
    await trigger.focus();
    await page.keyboard.press("Tab");
    await expect(input).toBeFocused();
  }
  const custom = page.locator(selector("custom-render"));
  await expect(custom.locator('section[data-slot="accordion-content"]')).toHaveAttribute("role", "region");
  await expect(custom.getByRole("link")).toHaveAttribute("href", "/docs/installation");
  const orientation = page.locator(selector("orientation"));
  for (const value of ["vertical", "horizontal"]) {
    await expect(orientation.locator(`[data-slot="accordion"][data-orientation="${value}"]`)).toHaveCount(1);
    const first = orientation.getByRole("button", { name: `${value} state`, exact: true });
    await first.focus();
    await page.keyboard.press("ArrowRight");
    await expect(first).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(orientation.getByRole("button", { name: `Next ${value} section` })).toBeFocused();
  }
  const ids = await page.locator("[data-component-example] [id]").evaluateAll((nodes) => nodes.map((n) => n.id));
  expect(new Set(ids).size).toBe(ids.length);
  for (const part of await page
    .locator("[data-component-example] [aria-controls], [data-component-example] [aria-labelledby]")
    .all()) {
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

test("accordion searchable panels retain until-found and handle beforematch", async ({ page }) => {
  await page.goto("/components/accordion?motion=none");
  await page.waitForLoadState("networkidle");
  const card = page.locator(selector("searchable"));
  for (const panel of await card.locator('[data-slot="accordion-content"]').all()) {
    await expect(panel).toHaveAttribute("hidden", "until-found");
    // Exercise the Base UI event handler; this does not certify the browser's Find UI.
    await panel.dispatchEvent("beforematch");
    await expect(panel).not.toHaveAttribute("hidden");
    const id = await panel.getAttribute("aria-labelledby");
    await expect(page.locator(`[id="${id}"]`)).toHaveAttribute("aria-expanded", "true");
  }
});

test("accordion live system reduction cancels geometry and retains native node draft focus", async ({ page }, info) => {
  await page.goto("/components/accordion?motion=full&speed=0.25");
  await page.waitForLoadState("networkidle");
  const card = page.locator(selector("persistent"));
  const trigger = card.getByRole("button", { name: "Workspace draft" });
  const panel = card.locator('[data-slot="accordion-content"]').first();
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
  await expect(input).toHaveValue("Live native draft");
  expect(await input.evaluate((n, original) => n === original, saved)).toBe(true);
});

for (const theme of ["light", "dark"] as const)
  for (const width of [1280, 390])
    for (const name of ["top", ...names])
      test(`accordion visual axe ${name}/${theme}/${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1100 });
        await page.addInitScript((value) => localStorage.setItem("cadence-theme", value), theme);
        await page.goto("/components/accordion?motion=none");
        await page.waitForLoadState("networkidle");
        const sel = name === "top" ? '[data-preview="accordion"]' : selector(name);
        const card = page.locator(sel);
        await card.scrollIntoViewIfNeeded();
        expect(
          (await new AxeBuilder({ page }).include(sel).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
            .violations,
        ).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await mkdir(".cache/accordion-proof", { recursive: true });
        await card.screenshot({ path: `.cache/accordion-proof/${name}-${theme}-${width}.png` });
      });

test("accordion fixed none first inserted frames", async ({ page }, info) => {
  await page.addInitScript(() => {
    const rows: { duration: string; mode: string | null; animations: number }[] = [];
    (window as unknown as { accordionFirstFrames: typeof rows }).accordionFirstFrames = rows;
    let started = false;
    const observer = new MutationObserver(() => {
      const panel = document.querySelector(
        '[data-component-example="accordion/without-motion"] [data-slot="accordion-content"]',
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
  await page.goto("/components/accordion?motion=full");
  await page.waitForLoadState("networkidle");
  const frames = await page.evaluate(
    () =>
      (window as unknown as { accordionFirstFrames: { duration: string; mode: string; animations: number }[] })
        .accordionFirstFrames,
  );
  await info.attach("actual fixed none insertion", { body: JSON.stringify(frames), contentType: "application/json" });
  expect(frames).toHaveLength(12);
  expect(frames.every((f) => f.mode === "none" && f.duration === "0s" && f.animations === 0)).toBe(true);
});

for (const anchor of ["usage", "changing-content", "without-motion"])
  test(`accordion cold full deep link ${anchor}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(`/components/accordion?motion=full#${anchor}`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator(`h2#${anchor}`)).toBeInViewport();
    await page.locator(`h2#${anchor}`).evaluate((n) => {
      const rect = n.getBoundingClientRect();
      if (rect.top < 0 || getComputedStyle(n.closest("article") ?? n).opacity === "0")
        throw new Error("deep link remains hidden");
    });
  });
