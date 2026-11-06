import { readFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { expandInstallation } from "../../scripts/installation.mjs";
import { effectiveMode, MODES, pressScale } from "./helpers";
import { openComponentSource } from "./installation-helpers";
import { openPopupMotionFixture } from "./popup-motion-fixture";

const names: string[] = JSON.parse(readFileSync("components/site/previews/examples.json", "utf8")).attachment;
const card = (page: Page, id: string) => page.locator(`[data-component-example="attachment/${id}"]`);
const root = (scope: Locator) => scope.locator('[data-slot="attachment"]');
async function open(page: Page, mode = "none") {
  await page.goto(`/components/attachment?motion=${mode}`);
  await page.waitForLoadState("networkidle");
}
async function frames(title: Locator) {
  return title.evaluate(async (el) => {
    const result = [];
    for (let i = 0; i < 22; i++) {
      await new Promise(requestAnimationFrame);
      const s = getComputedStyle(el);
      result.push({
        opacity: Number(s.opacity),
        transform: s.transform,
        duration: s.transitionDuration,
        animations: el.getAnimations().length,
      });
    }
    return result;
  });
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
    test(`Attachment states, native file lifecycle and actions ${mode}/${os}`, async ({ page }, info) => {
      await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
      await open(page, mode);
      const actual = effectiveMode(mode, os);
      const top = page.locator('[data-preview="attachment"]');
      await expect(top.locator("select,input")).toHaveCount(0);
      await expect(root(top)).toHaveAttribute("data-state", "done");
      for (const state of ["idle", "uploading", "processing", "error", "done"]) {
        const r = card(page, "upload-state").locator(`[data-slot="attachment"][data-state="${state}"]`);
        await expect(r).toHaveAttribute("data-motion", actual);
        const f = await frames(r.locator('[data-slot="attachment-title"]'));
        await info.attach(`native-${state}-frames`, { body: JSON.stringify(f), contentType: "application/json" });
        expect(f.every((s) => s.transform === "none" && s.duration === "0s")).toBe(true);
        if (actual === "none" || !["uploading", "processing"].includes(state))
          expect(f.every((s) => s.opacity === 1 && s.animations === 0)).toBe(true);
        else expect(new Set(f.map((s) => s.opacity)).size).toBeGreaterThan(2);
      }
      const download = page.waitForEvent("download");
      await top.getByRole("link", { name: "Download project notes" }).press("Enter");
      expect((await download).suggestedFilename()).toBe("project-notes.txt");
      const c = card(page, "caller-owned-file-selection");
      const input = c.getByLabel("Choose a local file (name only)", { exact: true });
      const savedInput = await input.elementHandle();
      await input.focus();
      await input.setInputFiles({
        name: "a-long-selected-local-filename.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("local file"),
      });
      const r = root(c),
        title = r.locator('[data-slot="attachment-title"]');
      const savedTitle = await title.elementHandle();
      await expect(r).toHaveAttribute("data-state", "idle");
      await r.getByRole("button", { name: "Inspect a-long-selected-local-filename.txt" }).press("Enter");
      await expect(c.getByRole("status")).toContainText("10 bytes · text/plain");
      for (const [button, state] of [
        ["Start local simulation", "uploading"],
        ["Process locally", "processing"],
        ["Finish locally", "done"],
        ["Supply failure", "error"],
        ["Retry locally", "uploading"],
      ] as const) {
        await c.getByRole("button", { name: button, exact: true }).click();
        await expect(r).toHaveAttribute("data-state", state);
        expect(await title.evaluate((el, saved) => el === saved, savedTitle)).toBe(true);
        if (state === "error") {
          await expect(r).toHaveAttribute("aria-invalid", "true");
          await expect(r).toHaveAccessibleDescription("Connection lost. Retry when your application is ready.");
        }
        if (!["uploading", "processing"].includes(state) || actual === "none")
          expect(await title.evaluate((el) => el.getAnimations().length)).toBe(0);
      }
      expect(
        await input.evaluate((el) => {
          const entry = new FormData(el.closest("form") as HTMLFormElement).get("attachment");
          return entry instanceof File ? entry.name : null;
        }),
      ).toBe("a-long-selected-local-filename.txt");
      await input.focus();
      await input.setInputFiles({
        name: "replacement.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("replacement"),
      });
      await expect(input).toBeFocused();
      expect(await input.evaluate((el, saved) => el === saved, savedInput)).toBe(true);
      expect(await title.evaluate((el, saved) => el === saved, savedTitle)).toBe(true);
      await expect(title).toHaveText("replacement.txt");
      const trigger = r.getByRole("button", { name: "Inspect replacement.txt" });
      await trigger.focus();
      await page.keyboard.press("Tab");
      await expect(r.getByRole("button", { name: "Remove replacement.txt" })).toBeFocused();
      await page.keyboard.press(" ");
      await expect(r).toHaveCount(0);
      await expect(input).toBeFocused();
      expect(await input.evaluate((el) => (el as HTMLInputElement).files?.length)).toBe(0);
      await input.setInputFiles({ name: "reset.txt", mimeType: "text/plain", buffer: Buffer.from("reset") });
      await c.getByRole("button", { name: "Reset selection", exact: true }).click();
      await expect(root(c)).toHaveCount(0);
      await expect(input).toBeFocused();
      expect(await input.evaluate((el) => (el as HTMLInputElement).files?.length)).toBe(0);
      const actions = card(page, "trigger-and-actions");
      const link = actions.getByRole("link", { name: "Download review notes" });
      await link.focus();
      await page.keyboard.press("Tab");
      await expect(actions.getByRole("button", { name: "Save", exact: true })).toBeFocused();
      await actions.scrollIntoViewIfNeeded();
      const scale = await pressScale(
        page,
        '[data-component-example="attachment/trigger-and-actions"] [data-slot="attachment-action"]',
      );
      if (actual === "full") expect(scale).toBeLessThan(1);
      else expect(scale).toBe(1);
      await expect(actions.locator("output")).toHaveText("Downloads requested: 0; saved.");
      await expect(actions.getByRole("button", { name: "Delete locked review notes" })).toBeDisabled();
      await actions.getByRole("button", { name: "Saved", exact: true }).press(" ");
      await expect(actions.locator("output")).toHaveText("Downloads requested: 0; not saved.");
      const secondDownload = page.waitForEvent("download");
      await link.press("Enter");
      await secondDownload;
      await expect(actions.locator("output")).toHaveText("Downloads requested: 1; not saved.");
      await top.getByRole("button", { name: "Remove project notes" }).press(" ");
      await expect(root(top)).toHaveCount(0);
      await expect(top.getByText("No attached files.")).toBeVisible();
      expect(await top.locator("[tabindex='-1']").evaluate((el) => el === document.activeElement)).toBe(true);
      const ids = await page.locator("[id]").evaluateAll((els) => els.map((el) => el.id));
      expect(ids.length).toBe(new Set(ids).size);
    });

test("Attachment images, finite sizes, native group scrolling and render/ref composition", async ({ page }) => {
  await open(page);
  const images = card(page, "images").getByRole("img", { name: "Interface diagram" });
  await expect(images).toHaveCount(2);
  for (const img of await images.all())
    expect(await img.evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await expect(card(page, "images").locator('[data-state="done"] [data-variant="image"]')).toHaveCSS("opacity", "1");
  await expect(card(page, "images").locator('[data-state="processing"] [data-variant="image"]')).toHaveCSS(
    "opacity",
    "0.6",
  );
  for (const size of ["default", "sm", "xs"])
    await expect(card(page, "sizes").locator(`[data-slot="attachment"][data-size="${size}"]`)).toHaveCount(1);
  await page.setViewportSize({ width: 390, height: 900 });
  for (const direction of ["horizontal", "vertical"]) {
    const group = card(page, "scrollable-groups").getByRole("group", { name: `${direction} reference files` });
    await expect(group.locator('[data-slot="attachment"]')).toHaveCount(4);
    await group.focus();
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => group.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
    await group.getByRole("link").last().focus();
    await expect(group.getByRole("link").last()).toBeInViewport();
    const d = page.waitForEvent("download");
    await page.keyboard.press("Enter");
    expect((await d).suggestedFilename()).toBe("meeting-notes.txt");
  }
  const c = card(page, "custom-parts"),
    trigger = c.getByRole("button", { name: "Inspect custom notes" });
  await c.getByRole("button", { name: "Focus inspect", exact: true }).click();
  await expect(trigger).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(c.locator("output")).toHaveText("Inspections: 1");
  await c.getByRole("link", { name: "Download", exact: true }).focus();
  await page.keyboard.press("F2");
  await expect(trigger).toBeFocused();
  await expect(root(c)).toHaveCSS("border-top-style", "dashed");
  await expect(root(c)).toHaveCSS("border-top-left-radius", "0px");
  await expect(c.getByRole("link", { name: "Download", exact: true })).toHaveCSS("font-weight", "600");
});

for (const os of [false, true])
  test(`Attachment live header/OS cancellation and state continuity ${os}`, async ({ page }, info) => {
    await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
    await open(page, "full");
    const c = card(page, "caller-owned-file-selection"),
      input = c.locator('input[type="file"]');
    await input.setInputFiles({ name: "retained.txt", mimeType: "text/plain", buffer: Buffer.from("keep") });
    await c.getByRole("button", { name: "Start local simulation", exact: true }).click();
    const title = root(c).locator('[data-slot="attachment-title"]'),
      saved = await title.elementHandle(),
      savedInput = await input.elementHandle();
    await title.evaluate((el) => {
      (window as unknown as { attachmentAnimation: Animation | undefined }).attachmentAnimation = el.getAnimations()[0];
    });
    await c.getByRole("button", { name: "Process locally", exact: true }).click();
    expect(
      await title.evaluate(
        (el) => el.getAnimations()[0] === (window as unknown as { attachmentAnimation: Animation }).attachmentAnimation,
      ),
    ).toBe(true);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(title).toHaveAttribute("data-motion", "reduced");
    expect(
      await title.evaluate(
        (el) => el.getAnimations()[0] === (window as unknown as { attachmentAnimation: Animation }).attachmentAnimation,
      ),
    ).toBe(true);
    const mode = page.getByRole("group", { name: "Motion mode" });
    for (const requested of ["none", "reduced", "full"] as const) {
      await mode.getByRole("button", { name: requested, exact: true }).click();
      await expect(title).toHaveAttribute("data-motion", effectiveMode(requested, true));
      const sampled = await frames(title);
      await info.attach(`${requested}-live-frames`, { body: JSON.stringify(sampled), contentType: "application/json" });
      if (requested === "none") expect(sampled.every((f) => f.animations === 0 && f.opacity === 1)).toBe(true);
      else expect(new Set(sampled.map((f) => f.opacity)).size).toBeGreaterThan(2);
      expect(await title.evaluate((el, saved) => el === saved, saved)).toBe(true);
      expect(await input.evaluate((el, saved) => el === saved, savedInput)).toBe(true);
      expect(await input.evaluate((el) => (el as HTMLInputElement).files?.[0]?.name)).toBe("retained.txt");
    }
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await expect(title).toHaveAttribute("data-motion", "full");
    await c.getByRole("button", { name: "Finish locally", exact: true }).click();
    expect(await title.evaluate((el) => el.getAnimations().length)).toBe(0);
    await c.getByRole("button", { name: "Start local simulation", exact: true }).click();
    expect(await title.evaluate((el) => el.getAnimations().length)).toBe(1);
    await openComponentSource(page, "attachment");
    expect(await title.evaluate((el, saved) => el === saved, saved)).toBe(true);
    await expect(title).toHaveText("retained.txt");
  });

for (const mode of MODES)
  test(`Attachment first inserted quiet specimen and cold full deep link ${mode}`, async ({ page }, info) => {
    await page.addInitScript(() => {
      const w = window as unknown as { quietFrames: { opacity: string; animations: number; transform: string }[] };
      w.quietFrames = [];
      const sample = () => {
        const el = document.querySelector(
          '[data-component-example="attachment/without-motion"] [data-slot="attachment-title"]',
        );
        if (el) {
          const s = getComputedStyle(el);
          w.quietFrames.push({ opacity: s.opacity, animations: el.getAnimations().length, transform: s.transform });
        }
      };
      new MutationObserver(sample).observe(document, { subtree: true, childList: true, attributes: true });
      const tick = () => {
        sample();
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await page.goto(`/components/attachment?motion=${mode}#upload-state`);
    await page.waitForLoadState("networkidle");
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { quietFrames: unknown[] }).quietFrames.length))
      .toBeGreaterThan(12);
    const sampled = await page.evaluate(() => (window as unknown as { quietFrames: unknown[] }).quietFrames);
    await info.attach("actual-first-inserted-none", { body: JSON.stringify(sampled), contentType: "application/json" });
    expect(
      sampled.every(
        (f) =>
          (f as { opacity: string; animations: number; transform: string }).opacity === "1" &&
          (f as { animations: number }).animations === 0 &&
          (f as { transform: string }).transform === "none",
      ),
    ).toBe(true);
    const title = card(page, "upload-state").locator('[data-state="uploading"] [data-slot="attachment-title"]');
    await expect(title).toHaveAttribute("data-motion", mode);
    if (mode === "full") expect(await title.evaluate((el) => el.getAnimations().length)).toBe(1);
  });

for (const theme of ["light", "dark"] as const)
  for (const width of [1280, 390])
    test(`Attachment ${theme}/${width} all cards WCAG and containment`, async ({ page }, info) => {
      await mkdir(".cache/attachment-proof", { recursive: true });
      await page.addInitScript((theme) => localStorage.setItem("cadence-theme", theme), theme);
      await page.setViewportSize({ width, height: 1000 });
      await open(page);
      await expect(page.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /^(?!.*dark)/);
      const violations = (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
        .violations;
      await info.attach("raw-full-page-axe", { body: JSON.stringify(violations), contentType: "application/json" });
      expect(violations).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      for (const id of ["top", ...names]) {
        const c = id === "top" ? page.locator('[data-preview="attachment"]') : card(page, id);
        await c.scrollIntoViewIfNeeded();
        expect(
          await c.evaluate((el) => {
            const r = el.getBoundingClientRect();
            return r.left >= 0 && r.right <= innerWidth;
          }),
        ).toBe(true);
        for (const r of await root(c).all())
          expect(
            await r.evaluate((el) => {
              const group = el.closest('[data-slot="attachment-group"]');
              if (group) return true;
              const r = el.getBoundingClientRect(),
                p = el.closest("[data-preview], [data-component-example]")?.getBoundingClientRect();
              return !!p && r.left >= p.left && r.right <= p.right;
            }),
          ).toBe(true);
        await c.screenshot({ path: `.cache/attachment-proof/phase4m-${id}-${theme}-${width}.png` });
      }
      const c = card(page, "caller-owned-file-selection");
      await c.locator('input[type="file"]').setInputFiles({
        name: "a-very-long-caller-selected-document-name.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("selected"),
      });
      await c.getByRole("button", { name: "Supply failure", exact: true }).click();
      expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual(
        [],
      );
      await c.screenshot({ path: `.cache/attachment-proof/phase4m-error-${theme}-${width}.png` });
      await page.screenshot({ path: `.cache/attachment-proof/phase4m-full-${theme}-${width}.png`, fullPage: true });
    });

test("Attachment SSR, no-JS, distributed runnable code and inert legacy variant URLs", async ({
  page,
  browser,
  request,
}) => {
  const html = await (await request.get("/components/attachment")).text();
  expect(html).toContain("project-notes.txt");
  for (const name of names) expect(html).toContain(`attachment/${name}`);
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const p = await ctx.newPage();
  await p.goto("http://127.0.0.1:3100/components/attachment");
  await expect(p.locator('[data-preview="attachment"] [data-slot="attachment"]')).toBeVisible();
  for (const name of names) await expect(card(p, name)).toBeVisible();
  await ctx.close();
  const md = readFileSync("content/components/attachment.mdx", "utf8"),
    body = expandInstallation(
      md.slice(md.indexOf("## Installation")).trim(),
      JSON.parse(readFileSync("registry.json", "utf8")).items,
      "attachment",
    );
  const payload = await (await request.get("/r/attachment.json")).json();
  expect(payload.docs).toBe(body);
  const distributed = await (await request.get("/r/attachment.md")).text();
  expect(distributed).toContain(body);
  expect((distributed.slice(distributed.indexOf("## Usage")).match(/```tsx/g) || []).length).toBe(9);
  expect(await (await request.get("/llms-full.txt")).text()).toContain(body);
  await page.goto("/components/attachment?motion=none&speed=0.25&variant=xs&keep=yes#caller-owned-file-selection");
  await page.waitForLoadState("networkidle");
  const input = card(page, "caller-owned-file-selection").locator("input");
  const saved = await input.elementHandle();
  await input.setInputFiles({ name: "history.txt", mimeType: "text/plain", buffer: Buffer.from("keep") });
  await page.evaluate(() => {
    history.replaceState({ ...history.state, callerToken: "keep" }, "", location.href);
    history.pushState(history.state, "", "?motion=none&speed=0.25&variant=unknown&keep=yes#sizes");
  });
  await expect(root(page.locator('[data-preview="attachment"]'))).toHaveAttribute("data-size", "default");
  await page.goBack();
  await expect(page).toHaveURL(/variant=xs.*#caller-owned-file-selection/);
  await page.goForward();
  await expect(page).toHaveURL(/variant=unknown.*#sizes/);
  expect(await input.evaluate((el, saved) => el === saved, saved)).toBe(true);
  expect(await input.evaluate((el) => (el as HTMLInputElement).files?.[0]?.name)).toBe("history.txt");
  expect(await page.evaluate(() => history.state.callerToken)).toBe("keep");
  await page.evaluate(() => history.pushState(history.state, "", "?motion=none&speed=0.25&variant=all&keep=yes#sizes"));
  await expect(page).toHaveURL(/variant=all/);
  await expect(root(page.locator('[data-preview="attachment"]'))).toHaveAttribute("data-size", "default");
  await expect(page.locator('[aria-label="Attachment variant"]')).toHaveCount(0);
  await expect(input).toHaveAttribute("name", "attachment");
});

for (const os of [false, true])
  for (const mode of MODES)
    test(`Attachment actual first insertion and native layout updates ${mode}/${os}`, async ({ page }, info) => {
      await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
      await page.addInitScript(() => {
        const w = window as unknown as {
          attachmentFrames: { opacity: number; transform: string; animations: number }[];
        };
        w.attachmentFrames = [];
        const sample = () => {
          const el = document.querySelector('[data-attachment-fixture] [data-slot="attachment-title"]');
          if (el) {
            const s = getComputedStyle(el);
            w.attachmentFrames.push({
              opacity: Number(s.opacity),
              transform: s.transform,
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
      await openPopupMotionFixture(page, "attachment", mode, 4);
      const r = page.locator("[data-attachment-fixture]"),
        title = r.locator('[data-slot="attachment-title"]'),
        trigger = r.getByRole("button", { name: "Inspect retained report" });
      await expect(title).toHaveAttribute("data-motion", effectiveMode(mode, os));
      await expect
        .poll(() => page.evaluate(() => (window as unknown as { attachmentFrames: unknown[] }).attachmentFrames.length))
        .toBeGreaterThan(22);
      const sampled = await page.evaluate(
        () =>
          (window as unknown as { attachmentFrames: { opacity: number; transform: string; animations: number }[] })
            .attachmentFrames,
      );
      await info.attach("actual-first-insertion-frames", {
        body: JSON.stringify(sampled),
        contentType: "application/json",
      });
      expect(sampled.every((f) => f.transform === "none")).toBe(true);
      if (mode === "none") expect(sampled.every((f) => f.opacity === 1 && f.animations === 0)).toBe(true);
      else expect(new Set(sampled.map((f) => f.opacity)).size).toBeGreaterThan(2);
      const saved = await title.elementHandle();
      const focused = await trigger.elementHandle();
      await title.evaluate((el) => {
        (window as unknown as { retainedAttachmentAnimation: Animation | undefined }).retainedAttachmentAnimation =
          el.getAnimations()[0];
      });
      await trigger.focus();
      for (const [key, size, orientation] of [
        ["F2", "xs", "vertical"],
        ["F3", "default", "horizontal"],
      ] as const) {
        await page.keyboard.press(key);
        await expect(r).toHaveAttribute("data-size", size);
        await expect(r).toHaveAttribute("data-orientation", orientation);
        await expect(trigger).toBeFocused();
        expect(await title.evaluate((el, saved) => el === saved, saved)).toBe(true);
        expect(await trigger.evaluate((el, saved) => el === saved, focused)).toBe(true);
        expect(
          await title.evaluate(
            (el) =>
              el.getAnimations()[0] ===
              (window as unknown as { retainedAttachmentAnimation: Animation | undefined }).retainedAttachmentAnimation,
          ),
        ).toBe(true);
        const kinds = await r.evaluate((el) =>
          el.getAnimations({ subtree: true }).map((a) => ({
            kind: a.constructor.name,
            properties: (a.effect as KeyframeEffect)
              .getKeyframes()
              .flatMap((f) =>
                Object.keys(f).filter((k) => !["offset", "computedOffset", "easing", "composite"].includes(k)),
              ),
          })),
        );
        expect(kinds.every((a) => a.kind === "CSSAnimation" && a.properties.every((p) => p === "opacity"))).toBe(true);
        if (mode === "none") expect(kinds).toEqual([]);
      }
    });
