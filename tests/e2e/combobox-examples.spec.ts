import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { effectiveMode, MODES } from "./helpers";
import { openPopupMotionFixture } from "./popup-motion-fixture";

const examples: string[] = JSON.parse(await readFile("components/site/previews/examples.json", "utf8")).combobox;
test("combobox real filtering, groups, controls, chips, caller values and native focus", async ({ page }, info) => {
  await page.goto("/components/combobox?motion=none");
  await page.waitForLoadState("networkidle");
  const card = (name: string) => page.locator(`[data-component-example="combobox/${name}"]`);
  const popup = page.locator('[data-slot="combobox-content"]');
  const close = async () => {
    if (await popup.count()) await page.keyboard.press("Escape");
    await expect(popup).toHaveCount(0);
  };
  const input = page.locator('[data-preview="combobox"]').getByRole("combobox");
  await input.fill("Rem");
  await expect(popup.getByRole("option")).toHaveCount(1);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(input).toHaveValue("Remix");
  await card("groups").getByRole("combobox").click();
  await expect(popup.getByRole("group", { name: "Frontend" })).toBeVisible();
  await expect(popup.getByRole("group", { name: "Backend" })).toBeVisible();
  await expect(popup.locator('[data-slot="combobox-separator"]')).toHaveCount(1);
  await card("groups").getByRole("combobox").fill("Ru");
  await expect(popup.getByRole("option")).toHaveCount(1);
  await expect(popup.getByRole("option")).toHaveText("Rust");
  await expect(popup.getByText("Frontend", { exact: true })).toHaveCount(0);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  for (const name of ["Clear and trigger", "Clear only"]) {
    const field = card("controls").getByRole("combobox", { name, exact: true });
    const frame = field.locator("xpath=..");
    await expect(field).toHaveValue("Astro");
    await frame.getByRole("button", { name: "Clear", exact: true }).click();
    await expect(field).toHaveValue("");
    await field.press("ArrowDown");
    await expect(popup).toBeVisible();
    await close();
  }
  await expect(
    card("controls")
      .getByRole("combobox", { name: "Trigger only" })
      .locator("xpath=..")
      .getByRole("button", { name: "Clear", exact: true }),
  ).toHaveCount(0);
  await expect(
    card("controls")
      .getByRole("combobox", { name: "Input only" })
      .locator("xpath=..")
      .getByRole("button", { name: "Show options" }),
  ).toHaveCount(0);
  const topics = card("multiple").getByRole("combobox", { name: "Editable topics", exact: true });
  await topics.fill("Test");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(card("multiple").getByRole("button", { name: "Remove Testing", exact: true })).toBeVisible();
  await close();
  await card("multiple").getByRole("button", { name: "Remove Design", exact: true }).click();
  await topics.focus();
  await page.keyboard.press("Backspace");
  await expect(card("multiple").getByRole("button", { name: "Remove Testing", exact: true })).toHaveCount(0);
  await close();
  const hiddenRemoval = card("multiple").getByRole("combobox", { name: "Topics without remove buttons", exact: true });
  const frame = hiddenRemoval.locator("xpath=..");
  await expect(frame.getByRole("button")).toHaveCount(0);
  await hiddenRemoval.press("Backspace");
  await expect(frame.locator('[data-slot="combobox-chip"]')).toHaveCount(1);
  await close();
  await expect(card("states").getByRole("combobox", { name: "Disabled framework" })).toBeDisabled();
  const readOnly = card("states").getByRole("combobox", { name: "Read-only framework" });
  await expect(readOnly).toHaveAttribute("readonly", "");
  await readOnly.press("ArrowDown");
  await expect(popup).toBeVisible();
  await popup.getByRole("option", { name: "Remix", exact: true }).click();
  await expect(readOnly).toHaveValue("Astro");
  await close();
  const invalid = card("states").getByRole("combobox", { name: "Required framework" });
  await expect(invalid).toHaveAccessibleDescription("Choose an available framework.");
  await invalid.fill("Nuxt");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(invalid).toHaveValue("Nuxt");
  await expect(popup.getByRole("option", { name: "Nuxt.js" })).toHaveAttribute("aria-disabled", "true");
  await close();
  const controlled = card("controlled").getByRole("combobox");
  const node = await controlled.elementHandle();
  await card("controlled").getByRole("button", { name: "Set Astro externally" }).click();
  await expect(controlled).toHaveValue("Astro");
  await card("controlled").getByRole("button", { name: "Submit selection" }).click();
  await expect(card("controlled").getByRole("status")).toHaveText("Selected: Astro; submitted: Astro");
  await controlled.fill("Svelte");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await card("controlled").getByRole("button", { name: "Submit selection" }).click();
  await expect(card("controlled").getByRole("status")).toHaveText("Selected: SvelteKit; submitted: SvelteKit");
  for (const mode of MODES) {
    await page.getByRole("group", { name: "Motion mode" }).getByRole("button", { name: mode, exact: true }).click();
    expect(await controlled.evaluate((n, saved) => n === saved, node)).toBe(true);
    await expect(controlled).toHaveValue("SvelteKit");
    await expect(input).toHaveValue("Remix");
  }
  await card("objects").getByRole("combobox").fill("Grace");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(card("objects").getByRole("status")).toHaveText("Assignee id: grace");
  const city = card("results").getByRole("combobox");
  await city.fill("To");
  await expect(popup.getByRole("option")).toHaveText("Tokyo");
  await city.fill("zz");
  await expect(popup.locator('[data-slot="combobox-empty"]')).toHaveText("No city found.");
  await city.fill("Pa");
  await expect(popup.getByRole("option")).toHaveText("Paris");
  await close();
  const auto = card("highlight").getByRole("combobox", { name: "Automatic bounded highlight" });
  await auto.fill("Ast");
  await expect(auto).toHaveAttribute("aria-activedescendant", /.+/);
  await page.keyboard.press("Enter");
  await expect(auto).toHaveValue("Astro");
  await card("custom-trigger").getByRole("button", { name: "Browse frameworks" }).click();
  await expect(popup).toBeVisible();
  await close();
  const focus = [];
  for (const key of ["Tab", "Shift+Tab"]) {
    await controlled.press("ArrowDown");
    await expect(popup).toBeVisible();
    await page.keyboard.press(key);
    await page.evaluate(() => new Promise(requestAnimationFrame));
    const observed = await page.evaluate(() => {
      const n = document.activeElement;
      return {
        tag: n?.tagName,
        text: n?.textContent?.slice(0, 80),
        connected: !!n?.isConnected,
        hidden: !!n?.closest('[aria-hidden="true"],[inert],[data-base-ui-focus-guard]'),
        visible: !!n?.getClientRects().length && getComputedStyle(n).visibility === "visible",
        body: n === document.body,
      };
    });
    focus.push({ key, ...observed });
    expect(observed.connected && observed.visible && !observed.hidden && !observed.body).toBe(true);
    await expect(popup).toHaveCount(0);
  }
  await info.attach("native-combobox-tab-focus", { body: JSON.stringify(focus), contentType: "application/json" });
});

for (const os of [false, true])
  for (const mode of MODES)
    test(`combobox all body portals inherit modes and retain references ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
      await page.goto(`/components/combobox?motion=${mode}`);
      await page.waitForLoadState("networkidle");
      for (const name of examples) {
        const card = page.locator(`[data-component-example="combobox/${name}"]`);
        for (const input of await card.getByRole("combobox", { includeHidden: true }).all()) {
          if (await input.isDisabled()) continue;
          await input.press("ArrowDown");
          const popup = page.locator('[data-slot="combobox-content"]');
          await expect(popup).toBeVisible();
          const label = await input.getAttribute("aria-label");
          const expected =
            label === "Instant framework"
              ? "none"
              : label === "Nested full framework"
                ? effectiveMode("full", os)
                : effectiveMode(mode, os);
          await expect(popup).toHaveAttribute("data-motion", expected);
          const controls = await input.getAttribute("aria-controls");
          expect(controls).toBeTruthy();
          expect(await popup.evaluate((n, id) => n.id === id || !!n.querySelector(`[id="${id}"]`), controls)).toBe(
            true,
          );
          const active = await input.getAttribute("aria-activedescendant");
          if (active) await expect(popup.locator(`[id="${active}"]`)).toBeVisible();
          await page.keyboard.press("Escape");
          await expect(popup).toHaveCount(0);
        }
      }
      const ids = await page.locator("[id]").evaluateAll((nodes) => nodes.map((n) => n.id));
      expect(new Set(ids).size).toBe(ids.length);
    });

for (const theme of ["light", "dark"])
  for (const width of [1280, 390])
    for (const name of examples)
      test(`combobox body screenshots and accessibility ${name}/${theme}/${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1000 });
        await page.addInitScript((theme) => localStorage.setItem("cadence-theme", theme), theme);
        await page.goto("/components/combobox?motion=none");
        await page.waitForLoadState("networkidle");
        const errors: string[] = [];
        page.on("pageerror", (e) => errors.push(e.message));
        const card = page.locator(`[data-component-example="combobox/${name}"]`);
        await card.scrollIntoViewIfNeeded();
        await card.screenshot({ path: `.cache/b5-proof/combobox-${name}-${theme}-${width}.png` });
        for (const input of await card.getByRole("combobox", { includeHidden: true }).all()) {
          if (await input.isDisabled()) continue;
          await input.press("ArrowDown");
          await expect(page.locator('[data-slot="combobox-content"]')).toBeVisible();
          expect(
            (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations,
          ).toEqual([]);
          await page.screenshot({
            path: `.cache/b5-proof/combobox-${name}-${await input.getAttribute("aria-label")}-${theme}-${width}-open.png`,
          });
          await page.keyboard.press("Escape");
          await expect(page.locator('[data-slot="combobox-content"]')).toHaveCount(0);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        expect(errors).toEqual([]);
      });

test("combobox placements, anchor sizing and loop boundaries", async ({ page }, info) => {
  await page.goto("/components/combobox?motion=none");
  await page.waitForLoadState("networkidle");
  const popup = page.locator('[data-slot="combobox-content"]');
  for (const name of ["sides", "alignments", "logical-sides"]) {
    for (const input of await page
      .locator(`[data-component-example="combobox/${name}"]`)
      .getByRole("combobox", { includeHidden: true })
      .all()) {
      await input.scrollIntoViewIfNeeded();
      await input.press("ArrowDown");
      await expect(popup).toBeVisible();
      const p = await popup.boundingBox(),
        a = await input.boundingBox();
      if (!p || !a) throw new Error("missing anchor geometry");
      await info.attach("actual-anchor-geometry", {
        body: JSON.stringify({
          label: await input.getAttribute("aria-label"),
          popup: p,
          anchor: a,
          frame: await input.locator("xpath=..").boundingBox(),
          positioner: await popup.locator("xpath=..").boundingBox(),
          css: await popup.evaluate((n) => ({
            anchor: getComputedStyle(n).getPropertyValue("--anchor-width"),
            width: getComputedStyle(n).width,
          })),
        }),
        contentType: "application/json",
      });
      const side = await popup.getAttribute("data-side"),
        label = await input.getAttribute("aria-label");
      if (name === "sides") {
        const requested = label?.replace("Side ", "");
        const opposite: Record<string, string> = { top: "bottom", bottom: "top", left: "right", right: "left" };
        expect([requested, opposite[requested ?? ""]]).toContain(side);
      }
      if (name === "alignments") {
        expect(side).toBe("bottom");
        const align = label?.replace("Align ", "");
        const expected =
          align === "start" ? a.x : align === "end" ? a.x + a.width - p.width : a.x + (a.width - p.width) / 2;
        expect(Math.abs(p.x - expected)).toBeLessThan(1);
        expect(p.width - Math.round(a.width)).toBe(28);
      }
      if (name === "logical-sides") {
        expect(side).toBe(label?.replace("RTL ", ""));
        const expectedX = side === "inline-start" ? a.x + a.width + 6 : a.x - p.width - 6;
        expect(Math.abs(p.x - expectedX)).toBeLessThan(1);
      }
      await page.keyboard.press("Escape");
      await expect(popup).toHaveCount(0);
    }
  }
  for (const modal of [false, true]) {
    const input = page
      .locator('[data-component-example="combobox/modality"]')
      .getByRole("combobox", { name: modal ? "Modal framework" : "Non-modal framework", exact: true });
    await input.press("ArrowDown");
    await expect(popup).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          getComputedStyle(document.body).overflow === "hidden" ||
          getComputedStyle(document.documentElement).overflow === "hidden",
      ),
    ).toBe(modal);
    await input.press("Tab");
    await expect(popup).toHaveCount(0);
  }
  const highlight = page.locator('[data-component-example="combobox/highlight"]');
  for (const automatic of [false, true]) {
    const input = highlight.getByRole("combobox", {
      name: automatic ? "Automatic bounded highlight" : "Manual looping highlight",
    });
    await input.press("ArrowDown");
    for (let i = 0; i < 6; i++) await page.keyboard.press("ArrowDown");
    const id = await input.getAttribute("aria-activedescendant");
    if (automatic) await expect(popup.getByRole("option", { name: "Astro" })).toHaveAttribute("id", id ?? "");
    else expect(id).not.toBe(await popup.getByRole("option", { name: "Astro" }).getAttribute("id"));
    await page.keyboard.press("Escape");
    await expect(popup).toHaveCount(0);
  }
});

for (const os of [false, true])
  for (const mode of MODES)
    test(`combobox actual indicator frames and live cancellation ${mode}/${os}`, async ({ page }, info) => {
      await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
      await openPopupMotionFixture(page, "combobox", mode, 4);
      await page.getByRole("combobox", { name: "Framework" }).press("ArrowDown");
      const target = page.getByRole("option", { name: "Astro", exact: true });
      await target.locator('[data-slot="combobox-item-indicator"]').evaluate((node) => {
        const state = window as unknown as {
          cbIndicator: { opacity: number; transform: string; animations: number }[];
          cbIndicatorRecording: boolean;
        };
        state.cbIndicator = [];
        state.cbIndicatorRecording = true;
        const sample = () => {
          const s = getComputedStyle(node);
          state.cbIndicator.push({
            opacity: Number(s.opacity),
            transform: s.transform,
            animations: node.getAnimations().length,
          });
          if (state.cbIndicatorRecording) requestAnimationFrame(sample);
        };
        sample();
      });
      await target.click();
      await expect(target).toHaveAttribute("aria-selected", "true");
      await page.waitForTimeout(230);
      const frames = await page.evaluate(() => {
        const state = window as unknown as {
          cbIndicator: { opacity: number; transform: string; animations: number }[];
          cbIndicatorRecording: boolean;
        };
        state.cbIndicatorRecording = false;
        return state.cbIndicator;
      });
      await info.attach("actual selected indicator frames", {
        body: JSON.stringify(frames),
        contentType: "application/json",
      });
      const actual = effectiveMode(mode, os);
      if (actual === "none")
        expect(frames.every((f) => (f.opacity === 0 || f.opacity === 1) && f.animations === 0)).toBe(true);
      else expect(frames.some((f) => f.opacity > 0 && f.opacity < 1)).toBe(true);
      if (actual !== "full")
        expect(frames.every((f) => /none|matrix\(1, 0, 0, 1, 0, 0\)/.test(f.transform))).toBe(true);
      await page.getByLabel("Fixture motion").evaluate((node) => {
        (node as HTMLSelectElement).value = "full";
        node.dispatchEvent(new Event("change", { bubbles: true }));
      });
      const saved = await target.locator('[data-slot="combobox-item-indicator"]').elementHandle();
      await target.click();
      await page.waitForTimeout(30);
      await page.getByLabel("Fixture motion").evaluate((node) => {
        (node as HTMLSelectElement).value = "reduced";
        node.dispatchEvent(new Event("change", { bubbles: true }));
      });
      await expect
        .poll(() =>
          target.locator('[data-slot="combobox-item-indicator"]').evaluate((n) => getComputedStyle(n).transform),
        )
        .toMatch(/none|matrix\(1, 0, 0, 1, 0, 0\)/);
      await page.getByLabel("Fixture motion").evaluate((node) => {
        (node as HTMLSelectElement).value = "none";
        node.dispatchEvent(new Event("change", { bubbles: true }));
      });
      await expect(page.locator('[data-slot="combobox-content"]')).toHaveAttribute("data-motion", "none");
      expect(
        await target.locator('[data-slot="combobox-item-indicator"]').evaluate((n, saved) => n === saved, saved),
      ).toBe(true);
      expect(
        await page
          .locator('[data-slot="combobox-item-indicator"]')
          .evaluateAll((nodes) => nodes.every((n) => n.getAnimations().length === 0)),
      ).toBe(true);
    });
