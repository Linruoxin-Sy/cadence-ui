import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { effectiveMode, MODES } from "./helpers";
import { openPopupMotionFixture } from "./popup-motion-fixture";

const ids = ["dialog", "alert-dialog", "sheet", "drawer", "popover", "tooltip", "hover-card"] as const;
type Id = (typeof ids)[number];
const slot = (id: Id) => (id === "drawer" ? "drawer-popup" : `${id}-content`);
const hover = (id: Id) => id === "tooltip" || id === "hover-card";
async function open(page: Page, id: Id) {
  const trigger = page.locator(`[data-preview="${id}"] [data-slot="${id}-trigger"]`).first();
  if (hover(id)) await trigger.hover();
  else await trigger.click();
  await expect(page.locator(`[data-slot="${slot(id)}"]`)).toBeVisible();
}
async function mode(page: Page, value: string) {
  if (new URL(page.url()).pathname === "/__fixtures/popup-motion") {
    await page.getByLabel("Fixture motion", { exact: true }).evaluate((node, value) => {
      (node as HTMLSelectElement).value = value;
      node.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
    return;
  }
  await page
    .getByRole("group", { name: "Motion mode" })
    .getByRole("button", { name: value, exact: true })
    .evaluate((node) => (node as HTMLButtonElement).click());
}
async function start(page: Page, id: Id) {
  await page.evaluate((slot) => {
    const w = window as unknown as {
      samples: {
        opacity: number;
        scale: number;
        moving: boolean;
        animations: number;
        backdrop: number | null;
        backdropAnimations: number;
      }[];
      recording: boolean;
    };
    w.samples = [];
    w.recording = true;
    const tick = () => {
      const n = document.querySelector(`[data-slot="${slot}"]`);
      if (n) {
        const s = getComputedStyle(n);
        const backdrop = document.querySelector(`[data-slot="${slot.replace(/-(content|popup)$/, "-overlay")}"]`);
        const m = new DOMMatrixReadOnly(s.transform === "none" ? undefined : s.transform);
        w.samples.push({
          opacity: Number(s.opacity),
          scale: s.scale === "none" ? m.a : parseFloat(s.scale),
          moving: s.translate !== "none" || Math.abs(m.m41) > 0.01 || Math.abs(m.m42) > 0.01,
          animations: n.getAnimations().length,
          backdrop: backdrop ? Number(getComputedStyle(backdrop).opacity) : null,
          backdropAnimations: backdrop?.getAnimations().length ?? 0,
        });
      }
      if (w.recording) requestAnimationFrame(tick);
    };
    tick();
  }, slot(id));
}
async function samples(page: Page, wait = 450) {
  await page.waitForTimeout(wait);
  return page.evaluate(() => {
    const w = window as unknown as {
      samples: {
        opacity: number;
        scale: number;
        moving: boolean;
        animations: number;
        backdrop: number | null;
        backdropAnimations: number;
      }[];
      recording: boolean;
    };
    w.recording = false;
    return w.samples;
  });
}
for (const reducedMotion of ["no-preference", "reduce"] as const)
  test.describe(`B4 ${reducedMotion}`, () => {
    test.use({ reducedMotion });
    for (const requested of MODES)
      for (const id of ids)
        test(`${id} entry exit live modes focus and resize ${requested}`, async ({ page }) => {
          await page.goto(`/components/${id}?motion=${requested}`);
          await page.waitForLoadState("networkidle");
          const expected = effectiveMode(requested, reducedMotion === "reduce");
          await start(page, id);
          await open(page, id);
          const popup = page.locator(`[data-slot="${slot(id)}"]`);
          await expect(popup).toHaveAttribute("data-motion", expected);
          const entry = await samples(page);
          if (["dialog", "alert-dialog", "sheet", "drawer"].includes(id) && expected !== "none")
            expect(entry.some((f) => f.backdrop !== null && f.backdrop > 0 && f.backdrop < 1)).toBe(true);
          if (expected === "none")
            expect(
              entry.every(
                (f) =>
                  f.opacity === 1 &&
                  f.animations === 0 &&
                  (f.backdrop === null || f.backdrop === 1) &&
                  f.backdropAnimations === 0,
              ),
            ).toBe(true);
          else expect(entry.some((f) => f.opacity > 0 && f.opacity < 1)).toBe(true);
          if (!["sheet", "drawer"].includes(id)) {
            if (expected === "full") expect(entry.some((f) => f.scale < 0.999)).toBe(true);
            else expect(entry.every((f) => f.scale === 1)).toBe(true);
          }
          if (["sheet", "drawer"].includes(id) && expected === "full") expect(entry.some((f) => f.moving)).toBe(true);
          await popup.evaluate((n) => {
            (window as unknown as { saved: Element }).saved = n;
          });
          await page.setViewportSize({ width: 390, height: 900 });
          expect(await popup.evaluate((n) => n === (window as unknown as { saved: Element }).saved)).toBe(true);
          if (["dialog", "alert-dialog", "sheet", "drawer"].includes(id)) {
            for (let i = 0; i < 8; i++) {
              await page.keyboard.press("Tab");
              expect(await popup.evaluate((n) => n.contains(document.activeElement))).toBe(true);
            }
          }
          await start(page, id);
          await page.keyboard.press("Escape");
          await expect(popup).toHaveCount(0);
          const exit = await samples(page, 50);
          if (["dialog", "alert-dialog", "sheet", "drawer"].includes(id) && expected !== "none")
            expect(exit.some((f) => f.backdrop !== null && f.backdrop > 0 && f.backdrop < 1)).toBe(true);
          if (expected !== "none") expect(exit.some((f) => f.opacity > 0 && f.opacity < 1)).toBe(true);
          await page.mouse.move(0, 0);
          await page.setViewportSize({ width: 1280, height: 900 });
          await openPopupMotionFixture(page, id, requested);
          // Restore the inherited clock. Explicit nested scopes are exercised separately below.
          await mode(page, "full");
          await start(page, id);
          await open(page, id);
          await expect(popup).toHaveAttribute("data-motion", effectiveMode("full", reducedMotion === "reduce"));
          const nested = await samples(page);
          expect(nested.some((f) => f.opacity > 0 && f.opacity < 1)).toBe(true);
          // Reopen and downgrade while CSS is running, without replacing its DOM node.
          await page.keyboard.press("Escape");
          await expect(popup).toHaveCount(0);
          await page.mouse.move(0, 0);
          await open(page, id);
          await popup.evaluate((n) => {
            (window as unknown as { saved: Element }).saved = n;
          });
          await mode(page, "reduced");
          await expect(popup).toHaveAttribute("data-motion", "reduced");
          expect(await popup.evaluate((n) => getComputedStyle(n).transitionProperty)).toBe("opacity");
          await mode(page, "none");
          await expect(popup).toHaveAttribute("data-motion", "none");
          await start(page, id);
          const stopped = await samples(page, 160);
          expect(
            stopped.every(
              (f) =>
                f.opacity === 1 &&
                f.animations === 0 &&
                (f.backdrop === null || f.backdrop === 1) &&
                f.backdropAnimations === 0,
            ),
          ).toBe(true);
          expect(await popup.evaluate((n) => n === (window as unknown as { saved: Element }).saved)).toBe(true);
          await page.keyboard.press("Escape");
          await expect(popup).toHaveCount(0);
        });
  });
for (const colorScheme of ["light", "dark"] as const)
  test.describe(`B4 visual ${colorScheme}`, () => {
    test.use({ colorScheme });
    for (const id of ids)
      test(`${id} full page and open surface axe`, async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (e) => errors.push(e.message));
        await page.route("https://github.com/shadcn.png", (r) =>
          r.fulfill({
            contentType: "image/svg+xml",
            body: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="#334155"/></svg>',
          }),
        );
        await page.goto(`/components/${id}?motion=none`);
        await page.waitForLoadState("networkidle");
        for (const width of [1280, 390]) {
          await page.setViewportSize({ width, height: 1000 });
          expect(
            (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations,
          ).toEqual([]);
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
          await page.screenshot({
            path: `.cache/shared-cleanup-proof/b4/${id}-${colorScheme}-${width}.png`,
            fullPage: true,
          });
          await open(page, id);
          expect(
            (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations,
          ).toEqual([]);
          await page.screenshot({ path: `.cache/shared-cleanup-proof/b4/${id}-${colorScheme}-${width}-open.png` });
          await page.keyboard.press("Escape");
          await expect(page.locator(`[data-slot="${slot(id)}"]`)).toHaveCount(0);
          await page.mouse.move(0, 0);
        }
        expect(errors).toEqual([]);
      });
  });

test.describe("B4 active transition interruption", () => {
  test.use({ reducedMotion: "no-preference" });
  for (const id of ids)
    test(`${id} cancels running geometry and opacity, reverses on stable nodes`, async ({ page }) => {
      await openPopupMotionFixture(page, id, "none", 4);
      await page.waitForLoadState("networkidle");
      await mode(page, "full");
      await open(page, id);
      const popup = page.locator(`[data-slot="${slot(id)}"]`);
      await expect.poll(() => popup.evaluate((n) => n.getAnimations().length)).toBeGreaterThan(0);
      await popup.evaluate((n) => {
        (window as unknown as { saved: Element }).saved = n;
      });
      const draft = popup.getByLabel("Fixture draft", { exact: true });
      const draftNode = (await draft.count()) ? await draft.elementHandle() : null;
      if (draftNode) await draft.fill("Typed while animating");
      await mode(page, "reduced");
      await expect(popup).toHaveAttribute("data-motion", "reduced");
      expect(
        await popup.evaluate((n) =>
          n
            .getAnimations()
            .every(
              (a) =>
                !(a.effect as KeyframeEffect)
                  .getKeyframes()
                  .some((f) => "transform" in f || "translate" in f || "scale" in f),
            ),
        ),
      ).toBe(true);
      // The fade is still running when none is committed.
      await expect
        .poll(() =>
          popup.evaluate((n) =>
            n.getAnimations().some((a) => (a.effect as KeyframeEffect).getKeyframes().some((f) => "opacity" in f)),
          ),
        )
        .toBe(true);
      await mode(page, "none");
      await expect(popup).toHaveAttribute("data-motion", "none");
      await start(page, id);
      expect(
        (await samples(page, 200)).every(
          (f) =>
            f.opacity === 1 &&
            f.animations === 0 &&
            (f.backdrop === null || f.backdrop === 1) &&
            f.backdropAnimations === 0,
        ),
      ).toBe(true);
      expect(await popup.evaluate((n) => n === (window as unknown as { saved: Element }).saved)).toBe(true);
      if (draftNode) {
        await expect(draft).toHaveValue("Typed while animating");
        await expect(draft).toBeFocused();
        expect(await draft.evaluate((node, saved) => node === saved, draftNode)).toBe(true);
      }
      await mode(page, "full");
      const trigger = page.locator(`[data-preview="${id}"] [data-slot="${id}-trigger"]`).first();
      if (!hover(id)) {
        await page.keyboard.press("Escape");
        await expect(popup).toHaveAttribute("data-ending-style", "");
        await trigger.evaluate((n) => (n as HTMLElement).click());
        await expect(popup).not.toHaveAttribute("data-ending-style", "");
        expect(await popup.evaluate((n) => n === (window as unknown as { saved: Element }).saved)).toBe(true);
      } else {
        // Pointer leave/re-enter cancels the primitive's close delay, not an animation timer.
        await page.mouse.move(0, 0);
        await trigger.hover();
        expect(await popup.evaluate((n) => n === (window as unknown as { saved: Element }).saved)).toBe(true);
      }
      await mode(page, "none");
      await page.keyboard.press("Escape");
      await expect(popup).toHaveCount(0);
      if (!hover(id)) await expect(trigger).toBeFocused();
    });
});

for (const preference of ["no-preference", "reduce"] as const)
  test.describe(`B4 swipe ${preference}`, () => {
    test.use({ reducedMotion: preference });
    for (const requested of MODES)
      test(`drawer direct touch dismissal ${requested}`, async ({ page }) => {
        await page.goto(`/components/drawer?motion=${requested}`);
        await page.waitForLoadState("networkidle");
        await open(page, "drawer");
        const popup = page.locator('[data-slot="drawer-popup"]');
        await page.waitForTimeout(400);
        const before = await popup.boundingBox();
        const handle = await popup.locator('[data-slot="drawer-swipe-handle"]').boundingBox();
        if (!before || !handle) throw new Error("missing drawer handle");
        const cdp = await page.context().newCDPSession(page);
        const x = handle.x + handle.width / 2;
        const y = handle.y + handle.height / 2;
        await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
        for (let step = 1; step <= 8; step++) {
          await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y + step * 30 }] });
          await page.waitForTimeout(16);
        }
        expect((await popup.boundingBox())?.y).toBeGreaterThan(before.y + 20);
        await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
        await expect(popup).toHaveCount(0);
        await cdp.detach();
      });
  });

test.describe("B4 keyboard placements", () => {
  for (const id of ids)
    test(`${id} every preview placement and keyboard route`, async ({ page }) => {
      await page.goto(`/components/${id}?motion=none`);
      await page.waitForLoadState("networkidle");
      const triggers = page.locator(`[data-preview="${id}"] [data-slot="${id}-trigger"]`);
      for (let i = 0; i < (await triggers.count()); i++) {
        const trigger = triggers.nth(i);
        await trigger.focus();
        if (!hover(id)) await trigger.press(i % 2 ? " " : "Enter");
        const popup = page.locator(`[data-slot="${slot(id)}"]`);
        await expect(popup).toBeVisible();
        const box = await popup.boundingBox();
        if (!box) throw new Error("missing popup bounds");
        expect(box.width).toBeGreaterThan(0);
        if (id === "sheet") {
          const side = await popup.getAttribute("data-side");
          if (side === "left") expect(Math.abs(box.x)).toBeLessThan(1);
          if (side === "right") expect(Math.abs(box.x + box.width - (page.viewportSize()?.width ?? 0))).toBeLessThan(1);
        }
        await page.keyboard.press("Escape");
        await expect(popup).toHaveCount(0);
        if (!hover(id)) await expect(trigger).toBeFocused();
        await page.getByRole("group", { name: "Motion mode" }).getByRole("button").first().focus();
      }
    });
});
