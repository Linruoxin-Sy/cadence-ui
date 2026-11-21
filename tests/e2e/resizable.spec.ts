import { mkdir, readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { effectiveMode, MODES } from "./helpers";
import { openComponentSource } from "./installation-helpers";

const names: string[] = JSON.parse(await readFile("components/site/previews/examples.json", "utf8")).resizable;
const card = (page: Page, name: string) => page.locator(`[data-component-example="resizable/${name}"]`);
const group = (scope: Locator) => scope.locator('[data-slot="resizable-panel-group"]');
const panels = (scope: Locator) => scope.locator('[data-slot="resizable-panel"]');
const value = async (handle: Locator) => Number(await handle.getAttribute("aria-valuenow"));
async function drag(page: Page, handle: Locator, delta: number, vertical = false, release = true) {
  await handle.scrollIntoViewIfNeeded();
  const box = await handle.boundingBox();
  if (!box) throw new Error("Missing real separator");
  const x = box.x + box.width / 2,
    y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + (vertical ? 0 : delta), y + (vertical ? delta : 0), { steps: 5 });
  if (release) await page.mouse.up();
  return { x, y };
}
/**
 * Native allocation stays timeless: the group and panel roots keep no authored
 * writer in any mode. The rule and its grip own only their declared opacity/colour
 * channel, so they carry the resolved mode and settle at their target instead of
 * holding a running clock. Panel children are exact caller content: no display host
 * exists to sample.
 */
const ownedSlots = '[data-slot="resizable-handle-rule"], [data-slot="resizable-handle-grip"]';
async function expectSurfaces(scope: Locator, mode: string) {
  const native = await scope
    .locator('[data-slot="resizable-panel-group"], [data-slot="resizable-panel"]')
    .evaluateAll((nodes) =>
      nodes.map((node) => {
        const style = getComputedStyle(node);
        return {
          motion: node.getAttribute("data-motion"),
          animations: node.getAnimations({ subtree: true }).length,
          duration: style.transitionDuration,
          transform: style.transform,
          opacity: style.opacity,
        };
      }),
    );
  expect(native.length).toBeGreaterThan(0);
  for (const state of native)
    expect(state).toEqual({ motion: null, animations: 0, duration: "0s", transform: "none", opacity: "1" });

  const owned = await scope.locator(ownedSlots).evaluateAll((nodes) =>
    nodes.map((node) => {
      const style = getComputedStyle(node);
      const animations = node.getAnimations({ subtree: true });
      return {
        slot: node.getAttribute("data-slot"),
        motion: node.getAttribute("data-motion"),
        running: animations.filter((animation) => animation.playState === "running").length,
        started: animations.length,
        duration: style.transitionDuration,
        opacity: style.opacity,
      };
    }),
  );
  expect(owned.length).toBeGreaterThan(0);
  for (const state of owned) {
    expect(state.motion).toBe(mode);
    expect(state.running).toBe(0);
    expect(state.opacity).toBe("1");
    if (mode === "none") {
      expect(state.started).toBe(0);
      expect(state.duration).toBe("0s");
    }
  }
}

/** Settled surfaces: no writer may still hold a clock when a mode has resolved. */
/**
 * Settled surfaces: no writer may still hold a clock, and every owned surface must have
 * resolved to the requested mode. The page rewrites `data-motion` once it knows the
 * resolved mode, so a fast machine can sample the default before that lands; polling
 * both facts still requires the exact final state instead of relaxing the assertion.
 */
async function settleSurfaces(scope: Locator, mode: string) {
  await expect
    .poll(
      async () =>
        scope.locator(ownedSlots).evaluateAll((nodes, expected) => {
          if (nodes.length === 0) return "no owned surface";
          const unsettled = nodes.filter(
            (node) =>
              node.getAttribute("data-motion") !== expected ||
              node.getAnimations({ subtree: true }).some((animation) => animation.playState === "running"),
          ).length;
          return unsettled === 0 ? "settled" : `${unsettled}/${nodes.length} unsettled`;
        }, mode),
      { timeout: 15_000 },
    )
    .toBe("settled");
  await expectSurfaces(scope, mode);
}

for (const os of ["no-preference", "reduce"] as const)
  for (const mode of MODES)
    test(`resizable native axes, imperative updates and static modes ${mode}/${os}`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      const resolved = effectiveMode(mode, os === "reduce");
      await page.emulateMedia({ reducedMotion: os });
      await page.addInitScript(() => {
        const frames: boolean[] = [];
        (window as unknown as { resizableFirstFrames: boolean[] }).resizableFirstFrames = frames;
        const tick = () => {
          // Native allocation is the invariant: the library writes panel geometry
          // directly, so no group/panel frame may carry an authored writer.
          const nodes = Array.from(
            document.querySelectorAll('[data-slot="resizable-panel-group"], [data-slot="resizable-panel"]'),
          );
          if (nodes.length)
            frames.push(
              nodes.every((n) => {
                const s = getComputedStyle(n);
                return (
                  !n.hasAttribute("data-motion") &&
                  n.getAnimations().length === 0 &&
                  s.transform === "none" &&
                  s.opacity === "1" &&
                  s.transitionDuration === "0s"
                );
              }),
            );
          if (frames.length < 12) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      await page.goto(`/components/resizable?motion=${mode}`);
      await page.waitForLoadState("networkidle");
      const firstFrames = await page.evaluate(
        () => (window as unknown as { resizableFirstFrames: boolean[] }).resizableFirstFrames,
      );
      expect(firstFrames).toHaveLength(12);
      expect(firstFrames.every(Boolean)).toBe(true);
      const top = page.locator('[data-preview="resizable"]');
      await expect(top.locator("select, button, input")).toHaveCount(0);
      for (const name of names) await settleSurfaces(card(page, name), resolved);
      for (const name of ["horizontal", "vertical"]) {
        const c = card(page, name),
          h = c.getByRole("separator");
        const vertical = name === "vertical",
          initial = vertical ? 55 : 40;
        await expect(h).toHaveAttribute("aria-orientation", vertical ? "horizontal" : "vertical");
        await h.focus();
        await page.keyboard.press(vertical ? "ArrowDown" : "ArrowRight");
        expect(await value(h)).toBe(initial + 5);
        await page.keyboard.press(vertical ? "ArrowRight" : "ArrowDown");
        expect(await value(h)).toBe(initial + 5);
        await page.keyboard.press("End");
        expect(await value(h)).toBe(vertical ? 75 : 70);
        await page.keyboard.press("Home");
        expect(await value(h)).toBe(vertical ? 25 : 20);
        await h.dblclick();
        expect(await value(h)).toBe(initial);
        const { x, y } = await drag(page, h, 35, vertical, false);
        await expect.poll(() => value(h)).toBeGreaterThan(initial);
        await page.mouse.move(x - (vertical ? 0 : 15), y - (vertical ? 15 : 0), { steps: 3 });
        await expect.poll(() => value(h)).toBeLessThan(initial);
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.mouse.move(x + (vertical ? 0 : 900), y + (vertical ? 900 : 0), { steps: 3 });
        expect(await value(h)).toBe(vertical ? 75 : 70);
        await page.mouse.move(x - (vertical ? 0 : 900), y - (vertical ? 900 : 0), { steps: 3 });
        expect(await value(h)).toBe(vertical ? 25 : 20);
        await page.mouse.up();
        await settleSurfaces(c, effectiveMode(mode, true));
        await page.emulateMedia({ reducedMotion: os });
        await page.evaluate(() => new Promise(requestAnimationFrame));
        await settleSurfaces(c, resolved);
      }
      const external = card(page, "external-updates"),
        input = external.getByRole("textbox"),
        h = external.getByRole("separator"),
        status = external.getByRole("status");
      await input.fill("Persistent workspace draft");
      const saved = await input.elementHandle(),
        savedGroup = await group(external).elementHandle();
      await h.focus();
      await page.keyboard.press("ArrowRight");
      await expect(status).toContainText("Files 45% · user");
      await expect(status).toContainText("previous 40%");
      await external.getByRole("button", { name: "Resize to 55%", exact: true }).press("Enter");
      await expect(status).toContainText("Files 55% · external");
      await expect(status).toContainText("requested 55%");
      await external.getByRole("button", { name: "Inspect layout" }).press("Space");
      await expect(external.locator("[data-inspection]")).toHaveText(/55% \/ \d+px · expanded · layout 55%/);
      await h.dblclick();
      await expect(status).toContainText("Files 40%");
      await external.getByRole("button", { name: "Collapse", exact: true }).click();
      await expect(status).toContainText("Files 0% · external");
      await external.getByRole("button", { name: "Inspect layout" }).click();
      await expect(external.locator("[data-inspection]")).toContainText("collapsed · layout 0%");
      await external.getByRole("button", { name: "Expand", exact: true }).click();
      expect(await value(h)).toBeGreaterThanOrEqual(20);
      await h.focus();
      await page.keyboard.press("Home");
      expect(await value(h)).toBe(0);
      await page.keyboard.press("Enter");
      expect(await value(h)).toBeGreaterThanOrEqual(20);
      // Resetting to the already-applied 40% is a no-op and emits no completed callback.
      await external.getByRole("button", { name: "Resize to 55%", exact: true }).click();
      await external.getByRole("button", { name: "Reset layout", exact: true }).click();
      await expect(status).toContainText("· external");
      await drag(page, h, 30, false, false);
      expect(await value(h)).toBeGreaterThan(40);
      await expect(status).toContainText("· external");
      const liveValue = await status.textContent();
      expect(liveValue).not.toContain("live 40%");
      await page.mouse.up();
      await expect(status).toContainText("· user");
      await external.getByRole("button", { name: "Reset layout", exact: true }).click();
      const button = external.getByRole("button", { name: "Resize to 55%", exact: true });
      await expect(button).toHaveAttribute("data-motion", effectiveMode(mode, os === "reduce"));
      // Press feedback belongs to the composed Button and its own suites; this specimen only
      // borrows a Button as the caller-owned trigger, so its paint is asserted there, not here.
      await input.focus();
      // Actual public APIs run through their caller-owned actions. Native click() does not steal draft focus.
      for (let i = 0; i < 12; i++) {
        await external
          .getByRole("button", { name: i % 2 ? "Reset layout" : "Resize to 55%", exact: true })
          .evaluate((n) => (n as HTMLButtonElement).click());
        await page.evaluate(() => new Promise(requestAnimationFrame));
        await settleSurfaces(external, resolved);
        await expect(input).toBeFocused();
      }
      for (const next of MODES) {
        await page.getByRole("group", { name: "Motion mode" }).getByRole("button", { name: next, exact: true }).click();
        await expect(button).toHaveAttribute("data-motion", effectiveMode(next, os === "reduce"));
        await expect(input).toHaveValue("Persistent workspace draft");
        // A live same-target mode change reconciles the retained surfaces in place.
        await settleSurfaces(external, effectiveMode(next, os === "reduce"));
      }
      await openComponentSource(page, "resizable");
      expect(await input.evaluate((n, saved) => n === saved, saved)).toBe(true);
      expect(await group(external).evaluate((n, saved) => n === saved, savedGroup)).toBe(true);
      await input.focus();
      await page.keyboard.press("Tab");
      await expect(h).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(input).toBeFocused();
      await page.setViewportSize({ width: 390, height: 900 });
      await expect(input).toHaveValue("Persistent workspace draft");
      await expect(card(page, "horizontal").getByRole("separator")).toHaveAttribute("aria-valuenow", "20");
      expect(errors).toEqual([]);
    });

for (const os of ["no-preference", "reduce"] as const)
  for (const mode of MODES)
    test(`resizable panel content revisions stay immediate, live mode and drag ${mode}/${os}`, async ({ page }) => {
      const resolved = effectiveMode(mode, os === "reduce");
      await page.emulateMedia({ reducedMotion: os });
      await page.addInitScript(() => {
        type Frame = { slot: string; animations: number; opacity: string; transform: string };
        const store = window as unknown as { contentFrames: Frame[] };
        store.contentFrames = [];
        // Panel children are exact caller content: the wrapper adds no display host, so
        // the sample covers every native panel child in the specimen. Recording the
        // computed paint values per frame proves whether anything actually ran.
        const tick = () => {
          for (const node of Array.from(
            document.querySelectorAll(
              '[data-component-example="resizable/display-revision"] [data-slot="resizable-panel"]',
            ),
          )) {
            for (const element of [node, ...Array.from(node.querySelectorAll("*"))]) {
              const style = getComputedStyle(element);
              store.contentFrames.push({
                slot: element.getAttribute("data-slot") ?? element.tagName.toLowerCase(),
                animations: element.getAnimations({ subtree: true }).length,
                opacity: style.opacity,
                transform: style.transform,
              });
            }
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      await page.goto(`/components/resizable?motion=${mode}&speed=0.25#display-revision`);
      await page.waitForLoadState("networkidle");
      const demo = card(page, "display-revision");
      const content = (text: string, value: string) =>
        expect(demo.locator('[data-slot="resizable-panel"]')).toHaveText([text, `${value}`]);
      await content("Draft attached", "1000");
      // No display host exists: a plain string and a number render as exact caller content.
      await expect(demo.locator('[data-slot="resizable-panel-text"]')).toHaveCount(0);
      await expect(demo.locator('[data-slot="resizable-panel-number"]')).toHaveCount(0);
      await settleSurfaces(demo, resolved);
      await page.evaluate(() => {
        const store = window as unknown as { stablePanels?: Element[] };
        store.stablePanels = Array.from(
          document.querySelectorAll(
            '[data-component-example="resizable/display-revision"] [data-slot="resizable-panel"]',
          ),
        );
      });
      await demo.getByRole("button", { name: "Revise panels" }).click();
      await content("Draft awaiting review", "1001");
      // The panels themselves keep their identity across a revision.
      expect(
        await page.evaluate(() => {
          const store = window as unknown as { stablePanels?: Element[] };
          const panels = Array.from(
            document.querySelectorAll(
              '[data-component-example="resizable/display-revision"] [data-slot="resizable-panel"]',
            ),
          );
          return (
            panels.length === (store.stablePanels?.length ?? -1) &&
            panels.every((n, i) => store.stablePanels?.[i] === n)
          );
        }),
      ).toBe(true);
      // Recorded frames prove that content revision is timeless in every mode.
      const frames = await page.evaluate(
        () =>
          (
            window as unknown as {
              contentFrames: { slot: string; animations: number; opacity: string; transform: string }[];
            }
          ).contentFrames,
      );
      expect(frames.length).toBeGreaterThan(0);
      expect(Math.max(...frames.map((frame) => frame.animations))).toBe(0);
      expect(new Set(frames.map((frame) => `${frame.opacity}/${frame.transform}`)).size).toBe(1);
      // A selected descendant settles immediately; nothing replaces itself visually.
      await demo.getByRole("button", { name: "Revise panels" }).click();
      await content("Draft approved", "1002");
      await demo.evaluate((root) => {
        const panel = root.querySelector('[data-slot="resizable-panel"]') as HTMLElement;
        const range = document.createRange();
        range.selectNodeContents(panel);
        const selection = panel.ownerDocument.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      });
      await demo.getByRole("button", { name: "Revise panels" }).click();
      await content("Draft attached", "1003");
      expect(
        await demo.evaluate((root) =>
          root
            .querySelectorAll('[data-slot="resizable-panel"]')
            .values()
            .toArray()
            .every((node) => node.getAnimations({ subtree: true }).length === 0),
        ),
      ).toBe(true);
      await page.evaluate(() => document.getSelection()?.removeAllRanges());
      // A live same-target mode change settles in place and rewrites nothing.
      await demo.getByRole("button", { name: "Revise panels" }).click();
      await page.getByRole("group", { name: "Motion mode" }).getByRole("button", { name: "none", exact: true }).click();
      await content("Draft awaiting review", "1004");
      await settleSurfaces(demo, "none");
      await expect(demo.locator('[data-slot="resizable-panel-text"]')).toHaveCount(0);
      // The native divider keeps working after every content revision.
      const h = demo.getByRole("separator");
      await h.focus();
      const handleValue = await value(h);
      await page.keyboard.press("ArrowRight");
      expect(await value(h)).toBe(handleValue + 5);
      await content("Draft awaiting review", "1004");
      await settleSurfaces(demo, "none");
    });

test("resizable server markup, no-JS panels and hydration keep the content contract", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(`${baseURL}/components/resizable?motion=full#display-revision`);
    const demo = page.locator('[data-component-example="resizable/display-revision"]');
    await expect(demo).toBeVisible();
    await expect(demo.locator('[data-slot="resizable-panel-group"]')).toHaveCount(1);
    await expect(demo.locator('[data-slot="resizable-panel"]')).toHaveCount(2);
    // Static content is already final and exact: no display host is generated.
    await expect(demo.locator('[data-slot="resizable-panel"]')).toHaveText(["Draft attached", "1000"]);
    await expect(demo.locator('[data-slot="resizable-panel-text"]')).toHaveCount(0);
    await expect(demo.locator('[data-slot="resizable-panel-number"]')).toHaveCount(0);
    const rule = demo.locator('[data-slot="resizable-handle-rule"]');
    await expect(rule).toBeVisible();
    // Without JavaScript no clock starts; static content is already final.
    expect(await rule.evaluate((node) => node.getAnimations().length)).toBe(0);
    expect(
      await demo
        .locator('[data-slot="resizable-panel-group"]')
        .evaluate((node) => getComputedStyle(node).transitionDuration),
    ).toBe("0s");
  } finally {
    await context.close();
  }
});

test("resizable collapse thresholds, preview strategies, locks and double-click semantics", async ({ page }) => {
  await page.goto("/components/resizable?motion=none");
  await page.waitForLoadState("networkidle");
  const collapse = card(page, "collapsible-panels"),
    h = collapse.getByRole("separator");
  await h.focus();
  await page.keyboard.press("Enter");
  expect(await value(h)).toBe(8);
  await page.keyboard.press("Enter");
  expect(await value(h)).toBe(35);
  await page.keyboard.press("Home");
  expect(await value(h)).toBe(8);
  await page.keyboard.press("End");
  expect(await value(h)).toBe(60);
  await h.dblclick();
  expect(await value(h)).toBe(35);
  await drag(page, h, -900);
  expect(await value(h)).toBe(8);
  await drag(page, h, 900);
  expect(await value(h)).toBe(60);
  const previews = group(card(page, "resize-previews"));
  for (let i = 0; i < 2; i++) {
    const c = previews.nth(i),
      handle = c.getByRole("separator"),
      first = panels(c).first();
    const before = (await first.boundingBox())?.width ?? 0;
    await drag(page, handle, 30, false, false);
    if (i === 0) expect((await first.boundingBox())?.width).toBeGreaterThan(before + 20);
    else {
      expect((await first.boundingBox())?.width).toBeCloseTo(before, 0);
      await expect(page.locator("div.h-full.w-1.bg-primary")).toBeVisible();
    }
    await page.mouse.up();
    expect((await first.boundingBox())?.width).toBeGreaterThan(before + 20);
    await handle.focus();
    const previous = await value(handle);
    await page.keyboard.press("ArrowLeft");
    expect(await value(handle)).toBe(previous - 5);
  }
  const locks = group(card(page, "locked-layouts"));
  for (let i = 0; i < 3; i++) {
    const c = locks.nth(i),
      handles = c.getByRole("separator"),
      first = panels(c).first();
    const width = (await first.boundingBox())?.width ?? 0;
    await drag(page, handles.first(), 40);
    expect((await first.boundingBox())?.width).toBeCloseTo(width, 0);
    if (i === 0) {
      await expect(handles.first()).not.toHaveAttribute("aria-disabled");
      await handles.first().focus();
      await page.keyboard.press("ArrowRight");
      expect((await first.boundingBox())?.width).toBeCloseTo(width, 0);
      await handles.nth(1).focus();
      await page.keyboard.press("Home");
      expect((await first.boundingBox())?.width).toBeCloseTo(width, 0);
    }
    if (i === 2) {
      await expect(handles.first()).toHaveAttribute("aria-disabled", "true");
      await expect(handles.first()).not.toHaveAttribute("tabindex");
    }
    if (i > 0) {
      await handles.nth(1).focus();
      await page.keyboard.press("Home");
      if (i === 1) expect((await first.boundingBox())?.width).toBeCloseTo(width, 0);
      else expect((await first.boundingBox())?.width).toBeLessThan(width - 10);
    }
  }
  const custom = card(page, "custom-parts"),
    handle = custom.getByRole("separator");
  await custom.getByRole("button", { name: "Focus divider" }).press("Enter");
  await expect(handle).toBeFocused();
  await page.keyboard.press("ArrowRight");
  expect(await value(handle)).toBe(45);
  await handle.dblclick();
  expect(await value(handle)).toBe(45);
  await expect(custom.getByRole("status")).toContainText("2");
  await expect(handle).toHaveCSS("width", "8px");
  await expect(panels(custom).first().locator(":scope > div")).toHaveCSS("font-weight", "600");
});

test("resizable parent width strategies, nested F6, independent handles and native focus", async ({ page }) => {
  await page.goto("/components/resizable?motion=none");
  await page.waitForLoadState("networkidle");
  const container = card(page, "container-resize"),
    groups = group(container);
  const before = await Promise.all(
    [0, 1].map(async (i) => (await panels(groups.nth(i)).first().boundingBox())?.width ?? 0),
  );
  await container.getByRole("button", { name: "Narrow container" }).press("Space");
  await expect
    .poll(async () => (await panels(groups.nth(0)).first().boundingBox())?.width ?? 0)
    .toBeLessThan((before[0] ?? 0) * 0.85);
  expect((await panels(groups.nth(1)).first().boundingBox())?.width).toBeCloseTo(100, 0);
  await container.getByRole("button", { name: "Restore container" }).click();
  const nested = card(page, "nested-panels"),
    files = nested.getByRole("separator", { name: "Resize nested files" }),
    inspector = nested.getByRole("separator", { name: "Resize nested inspector" }),
    preview = nested.getByRole("separator", { name: "Resize nested preview" });
  await files.focus();
  await page.keyboard.press("F6");
  await expect(inspector).toBeFocused();
  await page.keyboard.press("Shift+F6");
  await expect(files).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(preview).toBeFocused();
  await page.keyboard.press("ArrowDown");
  expect(await value(preview)).toBe(55);
  await page.keyboard.press("F6");
  await expect(preview).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(inspector).toBeFocused();
  const styles = card(page, "handle-styles");
  await expect(styles.getByRole("separator").first().locator("svg")).toHaveCount(0);
  await expect(styles.getByRole("separator").nth(1).locator("svg")).toHaveCount(1);
  // Upstream parity: a horizontal separator turns the decorative grip a quarter turn,
  // and that stays applied through the rule element that now hosts the grip.
  const upright = card(page, "vertical");
  await expect(upright.getByRole("separator")).toHaveAttribute("aria-orientation", "horizontal");
  expect(
    await upright.locator('[data-slot="resizable-handle-grip"]').evaluate((node) => {
      const style = getComputedStyle(node);
      return style.rotate === "none" ? style.transform : style.rotate;
    }),
  ).not.toBe("none");
  const ids = await page.locator('[data-slot="resizable-panel"][id]').evaluateAll((nodes) => nodes.map((n) => n.id));
  expect(new Set(ids).size).toBe(ids.length);
});

for (const theme of ["light", "dark"] as const)
  for (const width of [1280, 390])
    test(`resizable all named specimens visual and accessible ${theme}/${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript((t) => localStorage.setItem("cadence-theme", t), theme);
      await page.goto("/components/resizable?motion=none");
      await page.waitForLoadState("networkidle");
      expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual(
        [],
      );
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await mkdir(".cache/resizable-proof", { recursive: true });
      for (const name of ["top", ...names]) {
        const c = name === "top" ? page.locator('[data-preview="resizable"]') : card(page, name);
        const rect = await c.evaluate((n) => {
          const r = n.getBoundingClientRect();
          return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height };
        });
        expect(rect.x).toBeGreaterThanOrEqual(0);
        expect(rect.x + rect.width).toBeLessThanOrEqual(width);
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({
          path: `.cache/resizable-proof/${name}-${theme}-${width}.png`,
          fullPage: true,
          clip: rect,
        });
      }
    });

for (const anchor of ["external-updates", "nested-panels", "resize-previews"])
  test(`resizable cold full deep link ${anchor}`, async ({ page }) => {
    await page.goto(`/components/resizable?motion=full#${anchor}`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator(`h2#${anchor}`)).toBeInViewport();
    const c = card(page, anchor);
    await expect(c).toBeVisible();
    await c.getByRole("separator").first().focus();
    await page.keyboard.press("ArrowRight");
    expect(await value(c.getByRole("separator").first())).toBeGreaterThan(30);
  });
