import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { effectiveMode, MODES } from "./helpers";
import { expectMenuAccessibility } from "./menu-accessibility";
import { openPopupMotionFixture } from "./popup-motion-fixture";

const ids = ["dropdown-menu", "context-menu", "menubar", "select", "combobox", "command", "toast"] as const;
type Id = (typeof ids)[number];
const slot = (id: Id) => (id === "command" ? "dialog-content" : id === "toast" ? "toast" : `${id}-content`);
async function open(page: Page, id: Id) {
  if (id === "command") await page.getByRole("button", { name: "Open command palette", exact: true }).click();
  else if (id === "toast") await page.getByRole("button", { name: "Show notification", exact: true }).click();
  else if (id === "combobox") await page.getByRole("combobox", { name: "Framework", exact: true }).click();
  else {
    const trigger = page.locator(`[data-preview="${id}"] [data-slot="${id}-trigger"]`).first();
    await trigger.click(id === "context-menu" ? { button: "right" } : {});
  }
  await expect(page.locator(`[data-slot="${slot(id)}"]`)).toBeVisible();
}
async function close(page: Page, id: Id) {
  if (id === "toast") await page.locator('[data-slot="toast-close"]').click();
  else await page.keyboard.press("Escape");
  if (id === "select") await expect(page.locator(`[data-slot="${slot(id)}"]`)).not.toBeVisible();
  else await expect(page.locator(`[data-slot="${slot(id)}"]`)).toHaveCount(0);
}
async function mode(page: Page, value: string) {
  if (new URL(page.url()).pathname === "/__fixtures/popup-motion") {
    await page.getByLabel("Fixture motion", { exact: true }).evaluate((node, value) => {
      (node as HTMLSelectElement).value = value;
      node.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
    return;
  }
  if (new URL(page.url()).pathname === "/components/select") {
    await page
      .getByRole("group", { name: "Motion mode" })
      .getByRole("button", { name: value, exact: true })
      .evaluate((node) => (node as HTMLButtonElement).click());
    return;
  }
  await page.getByLabel("Popup motion", { exact: true }).evaluate((node, value) => {
    (node as HTMLSelectElement).value = value;
    node.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
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
  test.describe(`B5 ${reducedMotion}`, () => {
    test.use({ reducedMotion });
    for (const requested of MODES)
      for (const id of ids)
        test(`${id} real frames entry exit local modes resize ${requested}`, async ({ page }) => {
          await page.goto(`/components/${id}?motion=${requested}`);
          await page.waitForLoadState("networkidle");
          const expected = effectiveMode(requested, reducedMotion === "reduce");
          await start(page, id);
          await open(page, id);
          const popup = page.locator(`[data-slot="${slot(id)}"]`);
          await expect(popup).toHaveAttribute("data-motion", expected);
          const entry = await samples(page);
          if (expected === "none") expect(entry.every((f) => f.opacity === 1 && f.animations === 0)).toBe(true);
          else expect(entry.some((f) => f.opacity > 0 && f.opacity < 1)).toBe(true);
          if (expected === "full") expect(entry.some((f) => f.scale < 0.999)).toBe(true);
          else expect(entry.every((f) => f.scale === 1)).toBe(true);
          await popup.evaluate((n) => {
            (window as unknown as { saved: Element }).saved = n;
          });
          if (id !== "select") await page.setViewportSize({ width: 390, height: 900 });
          expect(await popup.evaluate((n) => n === (window as unknown as { saved: Element }).saved)).toBe(true);
          await start(page, id);
          await close(page, id);
          const exit = await samples(page, 40);
          if (expected !== "none") expect(exit.some((f) => f.opacity > 0 && f.opacity < 1)).toBe(true);
          if (["dropdown-menu", "context-menu", "menubar"].includes(id))
            await openPopupMotionFixture(page, id, requested);
          await mode(page, "full");
          await start(page, id);
          await open(page, id);
          await expect(popup).toHaveAttribute("data-motion", effectiveMode("full", reducedMotion === "reduce"));
          expect((await samples(page)).some((f) => f.opacity > 0 && f.opacity < 1)).toBe(true);
          await mode(page, "none");
          await expect(popup).toHaveAttribute("data-motion", "none");
          await start(page, id);
          expect((await samples(page, 100)).every((f) => f.opacity === 1 && f.animations === 0)).toBe(true);
          await close(page, id);
        });
  });
for (const colorScheme of ["light", "dark"] as const)
  test.describe(`B5 visual ${colorScheme}`, () => {
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
          await page.screenshot({ path: `.cache/b5-proof/${id}-${colorScheme}-${width}.png`, fullPage: true });
          await open(page, id);
          if (id === "context-menu" || id === "menubar")
            await expectMenuAccessibility(page, async () => {
              await page.keyboard.press("Escape");
              await expect(page.locator(`[data-slot="${slot(id)}"]`)).toHaveCount(0);
              await open(page, id);
            });
          else
            expect(
              (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations,
            ).toEqual([]);
          await page.screenshot({ path: `.cache/b5-proof/${id}-${colorScheme}-${width}-open.png` });
          await close(page, id);
          if (id === "select") await expect(page.locator(`[data-slot="${slot(id)}"]`)).not.toBeVisible();
          else await expect(page.locator(`[data-slot="${slot(id)}"]`)).toHaveCount(0);
          await page.mouse.move(0, 0);
        }
        expect(errors).toEqual([]);
      });
  });

test.describe("B5 active transition interruption", () => {
  test.use({ reducedMotion: "no-preference" });
  for (const id of ids)
    test(`${id} cancels running geometry and opacity, reverses on stable nodes`, async ({ page }) => {
      if (["dropdown-menu", "context-menu", "menubar"].includes(id)) await openPopupMotionFixture(page, id, "none", 4);
      else await page.goto(`/components/${id}?motion=none&speed=0.25`);
      await page.waitForLoadState("networkidle");
      await mode(page, "full");
      await open(page, id);
      const popup = page.locator(`[data-slot="${slot(id)}"]`);
      await expect.poll(() => popup.evaluate((n) => n.getAnimations().length)).toBeGreaterThan(0);
      await popup.evaluate((n) => {
        (window as unknown as { saved: Element }).saved = n;
      });
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
      if (id === "dropdown-menu" || id === "menubar") {
        await mode(page, "full");
        await page.keyboard.press("Escape");
        await expect(popup).toHaveAttribute("data-ending-style", "");
        const trigger = page.locator(`[data-preview="${id}"] [data-slot="${id}-trigger"]`);
        if (id === "menubar") await trigger.press("ArrowDown");
        else await trigger.evaluate((node) => (node as HTMLElement).click());
        await expect(popup).not.toHaveAttribute("data-ending-style", "");
        expect(await popup.evaluate((node) => node === (window as unknown as { saved: Element }).saved)).toBe(true);
        await mode(page, "none");
      }
      await close(page, id);
    });
});

test("menus keyboard, typeahead, submenus, roving focus and disabled triggers", async ({ page }) => {
  for (const id of ["dropdown-menu", "context-menu", "menubar"] as const) {
    await page.goto(`/components/${id}?motion=none`);
    await page.waitForLoadState("networkidle");
    const trigger = page.locator(`[data-preview="${id}"] [data-slot="${id}-trigger"]`).first();
    await trigger.focus();
    await trigger.press(id === "context-menu" ? "Shift+F10" : "ArrowDown");
    const popup = page.locator(`[data-slot="${id}-content"]`);
    await expect(popup).toBeVisible();
    await page.keyboard.press(id === "dropdown-menu" ? "d" : id === "context-menu" ? "r" : "s");
    await expect(
      page.getByRole("menuitem", {
        name: id === "dropdown-menu" ? "Duplicate" : id === "context-menu" ? "Rename" : "Save",
        exact: false,
      }),
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    if (id === "menubar") {
      await trigger.press("ArrowRight");
      await expect(
        page.locator('[data-preview="menubar"]').getByRole("menuitem", { name: "Edit", exact: true }),
      ).toBeFocused();
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Escape");
      await expect(popup).toHaveCount(0);
      await page.locator('[data-component-example="menubar/submenus"] [data-slot="menubar-trigger"]').click();
    } else await open(page, id);
    const sub = page.locator(`[data-slot="${id}-sub-trigger"]`).first();
    await sub.focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator(`[data-slot="${id}-sub-content"]`)).toBeVisible();
    await page.keyboard.press("ArrowLeft");
    await expect(sub).toBeFocused();
    await sub.hover();
    await expect(page.locator(`[data-slot="${id}-sub-content"]`)).toBeVisible();
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    const disabled = page.locator(`[data-preview="${id}"] [data-slot="${id}-trigger"][disabled]`);
    if (await disabled.count()) await expect(disabled).toBeDisabled();
  }
});

for (const preference of ["no-preference", "reduce"] as const)
  test.describe(`B5 selection ${preference}`, () => {
    test.use({ reducedMotion: preference });
    for (const requested of MODES)
      test(`pointer and keyboard selection, morph, geometry and typing ${requested}`, async ({ page }) => {
        await page.goto(`/components/select?motion=${requested}`);
        await page.waitForLoadState("networkidle");
        const trigger = page
          .locator('[data-preview="select"]')
          .getByRole("combobox", { name: "Framework", exact: true });
        await trigger.click();
        await page.getByRole("option", { name: "Remix", exact: true }).click();
        await expect(trigger.locator('[data-slot="select-value"]')).toHaveText("Remix");
        await trigger.focus();
        await trigger.press("ArrowDown");
        await page.keyboard.press("a");
        await page.keyboard.press("Enter");
        await expect(trigger.locator('[data-slot="select-value"]')).toHaveText("Astro");
        await trigger.click();
        await page.setViewportSize({ width: 390, height: 900 });
        await expect(page.locator('[data-slot="select-content"]')).not.toBeVisible();
        await expect(trigger).toBeFocused();
        await page.goto(`/components/combobox?motion=${requested}`);
        await page.waitForLoadState("networkidle");
        const input = page.getByRole("combobox", { name: "Framework", exact: true });
        await input.fill("Rem");
        await expect(page.getByRole("option", { name: "Remix", exact: true })).toBeVisible();
        await expect(page.getByRole("option")).toHaveCount(1);
        await page.keyboard.press("ArrowDown");
        await page.keyboard.press("Enter");
        await expect(input).toHaveValue("Remix");
        await input.fill("zzzzzz");
        await expect(page.locator('[data-slot="combobox-empty"]')).toBeVisible();
        await page.keyboard.press("Escape");
        await input.fill("Ast");
        await page.getByRole("option", { name: "Astro", exact: true }).click();
        await expect(input).toHaveValue("Astro");
        await input.click();
        await page.keyboard.press("Tab");
        await expect(page.locator('[data-slot="combobox-content"]')).toHaveCount(0);
        expect(await page.locator("[inert]").count()).toBe(0);
        await page.goto(`/components/dropdown-menu?motion=${requested}`);
        await page.waitForLoadState("networkidle");
        await page.getByRole("button", { name: "View", exact: true }).click();
        const mark = page.getByRole("menuitemcheckbox", { name: "Comments", exact: true });
        await mark.click();
        await expect(mark).toHaveAttribute("aria-checked", "true");
        await mark.click();
        await expect(mark).toHaveAttribute("aria-checked", "false");
        const modeValue = effectiveMode(requested, preference === "reduce");
        const indicator = mark.locator("[data-motion]");
        await expect(indicator).toHaveAttribute("data-motion", modeValue);
        if (modeValue !== "full")
          expect(await indicator.evaluate((n) => getComputedStyle(n).transform)).toMatch(
            /none|matrix\(1, 0, 0, 1, 0, 0\)/,
          );
        await page.getByRole("menuitemradio", { name: "Compact", exact: true }).click();
        await expect(page.getByRole("menuitemradio", { name: "Compact", exact: true })).toHaveAttribute(
          "aria-checked",
          "true",
        );
      });
  });

for (const preference of ["no-preference", "reduce"] as const)
  test.describe(`B5 running recipes ${preference}`, () => {
    test.use({ reducedMotion: preference });
    for (const requested of MODES)
      test(`indicator frames and live cancellation ${requested}`, async ({ page }, info) => {
        await page.goto(`/components/dropdown-menu?motion=${requested}&speed=0.25`);
        await page.waitForLoadState("networkidle");
        await page.getByRole("button", { name: "View", exact: true }).click();
        const item = page.getByRole("menuitemcheckbox", { name: "Comments", exact: true });
        const indicator = item.locator("[data-motion]");
        await item.evaluate((n) => n.setAttribute("data-proof", ""));
        await page.evaluate(() => {
          const w = window as unknown as {
            indicatorFrames: { scale: number; opacity: number }[];
            recordIndicator: boolean;
          };
          w.indicatorFrames = [];
          w.recordIndicator = true;
          const tick = () => {
            const n = document.querySelector("[data-proof] [data-motion]");
            if (n) {
              const s = getComputedStyle(n);
              w.indicatorFrames.push({
                scale: s.transform === "none" ? 1 : new DOMMatrixReadOnly(s.transform).a,
                opacity: Number(s.opacity),
              });
            }
            if (w.recordIndicator) requestAnimationFrame(tick);
          };
          tick();
        });
        await item.click();
        await page.waitForTimeout(230);
        const frames = await page.evaluate(() => {
          const w = window as unknown as {
            indicatorFrames: { scale: number; opacity: number }[];
            recordIndicator: boolean;
          };
          w.recordIndicator = false;
          return w.indicatorFrames;
        });
        expect(frames.length).toBeGreaterThan(4);
        await info.attach("actual-dropdown-checkbox-frames", {
          body: JSON.stringify(frames),
          contentType: "application/json",
        });
        const expected = effectiveMode(requested, preference === "reduce");
        if (expected === "full") expect(frames.some((f) => f.scale > 0.96 && f.scale < 1)).toBe(true);
        else expect(frames.every((f) => f.scale === 1)).toBe(true);
        if (expected !== "none") expect(frames.some((f) => f.opacity > 0 && f.opacity < 1)).toBe(true);
        else expect(frames.every((f) => f.opacity === 0 || f.opacity === 1)).toBe(true);
        await openPopupMotionFixture(page, "dropdown-menu", requested, 4);
        await open(page, "dropdown-menu");
        await mode(page, "full");
        await item.click();
        await page.waitForTimeout(30);
        await indicator.evaluate((n) => {
          (window as unknown as { indicatorNode: Element }).indicatorNode = n;
        });
        await mode(page, "reduced");
        await expect
          .poll(() => indicator.evaluate((n) => getComputedStyle(n).transform))
          .toMatch(/none|matrix\(1, 0, 0, 1, 0, 0\)/);
        await mode(page, "none");
        expect(
          await indicator.evaluate((n) => n === (window as unknown as { indicatorNode: Element }).indicatorNode),
        ).toBe(true);
        expect(Number(await indicator.evaluate((n) => getComputedStyle(n).opacity))).toBe(0);
        await item.click();
        await item.click();
        await item.click();
        await expect(item).toHaveAttribute("aria-checked", "true");
        expect(Number(await indicator.evaluate((n) => getComputedStyle(n).opacity))).toBe(1);
      });
  });

for (const preference of ["no-preference", "reduce"] as const)
  test.describe(`B5 Select continuity ${preference}`, () => {
    test.use({ reducedMotion: preference });
    for (const requested of MODES)
      test(`handoff and measured width frames, resize and live cancellation ${requested}`, async ({ page }, info) => {
        await page.goto(`/components/select?motion=${requested}&speed=0.25`);
        await page.waitForLoadState("networkidle");
        const trigger = page
          .locator('[data-preview="select"]')
          .getByRole("combobox", { name: "Framework", exact: true });
        await page.evaluate(() => {
          const w = window as unknown as {
            selectFrames: { width: number; natural: number; flight: boolean; moving: boolean }[];
            selectRecording: boolean;
          };
          w.selectFrames = [];
          w.selectRecording = true;
          const tick = () => {
            const n = document.querySelector('[data-preview="select"] [data-slot="select-value"]') as HTMLElement;
            const text = n?.firstElementChild;
            const flight = document.querySelector('[data-slot="select-handoff"]');
            if (n && text) {
              const s = flight ? getComputedStyle(flight) : null;
              w.selectFrames.push({
                width: n.getBoundingClientRect().width,
                natural: text.getBoundingClientRect().width,
                flight: !!flight,
                moving: !!s && s.transform !== "none",
              });
            }
            if (w.selectRecording) requestAnimationFrame(tick);
          };
          tick();
        });
        await trigger.click();
        await page.getByRole("option", { name: "Remix", exact: true }).click();
        await page.waitForTimeout(250);
        const frames = await page.evaluate(() => {
          const w = window as unknown as {
            selectFrames: { width: number; natural: number; flight: boolean; moving: boolean }[];
            selectRecording: boolean;
          };
          w.selectRecording = false;
          return w.selectFrames;
        });
        const expected = effectiveMode(requested, preference === "reduce");
        await info.attach("actual-select-width-frames", {
          body: JSON.stringify(frames),
          contentType: "application/json",
        });
        if (expected === "full") {
          expect(frames.some((f) => f.flight && f.moving)).toBe(true);
          expect(frames.some((f) => Math.abs(f.width - f.natural) > 1)).toBe(true);
        } else {
          expect(frames.every((f) => !f.flight)).toBe(true);
          expect(frames.every((f) => Math.abs(f.width - f.natural) < 1)).toBe(true);
        }
        await mode(page, "full");
        await trigger.click();
        await page.getByRole("option", { name: "Next.js", exact: true }).click();
        await mode(page, "reduced");
        await expect(page.locator('[data-slot="select-handoff"]')).toHaveCount(0);
        const value = trigger.locator('[data-slot="select-value"]');
        const live = await value.evaluate((n) => ({
          delta: Math.abs(n.getBoundingClientRect().width - (n.firstElementChild?.getBoundingClientRect().width ?? 0)),
          mode: n.getAttribute("data-motion"),
          html: n.outerHTML,
        }));
        await info.attach("actual-select-live-commit", { body: JSON.stringify(live), contentType: "application/json" });
        expect(live.delta).toBeLessThan(1);
        await mode(page, "none");
        await trigger.click();
        await page.getByRole("option", { name: "Astro", exact: true }).click();
        await expect(trigger.locator('[data-slot="select-value"]')).toHaveText("Astro");
        await expect(trigger).toBeFocused();
      });
  });

test.describe("B5 native reversal", () => {
  test.use({ reducedMotion: "no-preference" });
  for (const id of ["dropdown-menu", "context-menu", "menubar", "select", "combobox", "command"] as const)
    test(`${id} reopens during exit on the same surface`, async ({ page }) => {
      if (["dropdown-menu", "context-menu", "menubar"].includes(id)) await openPopupMotionFixture(page, id, "full", 4);
      else await page.goto(`/components/${id}?motion=full&speed=0.25`);
      await page.waitForLoadState("networkidle");
      await open(page, id);
      const popup = page.locator(`[data-slot="${slot(id)}"]`);
      await page.waitForTimeout(180);
      await popup.evaluate((n) => {
        (window as unknown as { reversing: Element }).reversing = n;
      });
      await page.keyboard.press("Escape");
      await expect(popup).toHaveAttribute("data-ending-style", "");
      if (id === "command")
        await page
          .getByRole("button", { name: "Open command palette", exact: true })
          .evaluate((n) => (n as HTMLElement).click());
      else if (id === "combobox")
        await page.getByRole("combobox", { name: "Framework", exact: true }).press("ArrowDown");
      else if (id === "context-menu")
        await page
          .locator('[data-preview="context-menu"] [data-slot="context-menu-trigger"]')
          .first()
          .dispatchEvent("contextmenu", { button: 2, clientX: 500, clientY: 400 });
      else await page.locator(`[data-preview="${id}"] [data-slot="${id}-trigger"]`).first().press("ArrowDown");
      await expect(popup).not.toHaveAttribute("data-ending-style", "");
      expect(await popup.evaluate((n) => n === (window as unknown as { reversing: Element }).reversing)).toBe(true);
      await mode(page, "none");
      await close(page, id);
    });
});
