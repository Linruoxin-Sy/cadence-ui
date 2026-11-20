import { mkdir, readFile, writeFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, test } from "@playwright/test";
import { effectiveMode, MODES } from "./helpers";
import { openComponentSource } from "./installation-helpers";

const names: string[] = JSON.parse(await readFile("components/site/previews/examples.json", "utf8"))["scroll-area"];
const selector = (name: string) => `[data-component-example="scroll-area/${name}"]`;
const rootOf = (card: Locator) => card.locator('[data-slot="scroll-area"]');
const viewportOf = (card: Locator) => card.locator('[data-slot="scroll-area-viewport"]');
const ANIMATED_SLOTS = [
  "scroll-area-viewport",
  "scroll-area-scrollbar",
  "scroll-area-thumb",
  "scroll-area-text",
  "scroll-area-number",
];
async function motionParts(card: Locator, actual: string) {
  const states = await card.locator('[data-slot^="scroll-area"]').evaluateAll((nodes) =>
    nodes.map((node) => {
      const s = getComputedStyle(node);
      return {
        slot: node.getAttribute("data-slot") ?? "",
        mode: node.getAttribute("data-motion"),
        animation: s.animationName,
        property: s.transitionProperty,
        duration: s.transitionDuration,
        opacity: s.opacity,
        behavior: s.scrollBehavior,
        scale: s.scale,
        filter: s.filter,
      };
    }),
  );
  for (const s of states) {
    expect(s.behavior, s.slot).toBe("auto");
    expect(s.animation, s.slot).toBe("none");
    expect(s.scale, s.slot).toBe("none");
    expect(s.filter, s.slot).toBe("none");
    // Motion belongs to the viewport, the track and the thumb; the root and the two
    // direct display lanes carry no authored mode.
    if (ANIMATED_SLOTS.includes(s.slot)) expect(s.mode, s.slot).toBe(actual);
    else expect(s.mode, s.slot).toBeNull();
    if (s.duration === "0s") continue;
    const properties = s.property.split(",").map((property) => property.trim());
    for (const property of properties)
      expect(["background-color", "color", "box-shadow"], `${s.slot} ${property}`).toContain(property);
  }
}
for (const os of ["no-preference", "reduce"] as const)
  for (const mode of MODES)
    test(`scroll-area examples motion modes and independent updates ${mode}/${os}`, async ({ page }) => {
      test.setTimeout(90_000);
      const actual = effectiveMode(mode, os === "reduce");
      await page.emulateMedia({ reducedMotion: os });
      await page.goto(`/components/scroll-area?motion=${mode}`);
      await page.waitForLoadState("networkidle");
      const top = page.locator('[data-preview="scroll-area"]');
      await expect(top.locator("select, button")).toHaveCount(0);
      await expect(rootOf(top)).toHaveCount(2);
      // The requested mode arrives through an effect; the server tree is `full`.
      await expect(viewportOf(top).first()).toHaveAttribute("data-motion", actual);
      for (const name of names) await motionParts(page.locator(selector(name)), actual);
      const changing = page.locator(selector("changing-content"));
      const input = changing.getByRole("textbox");
      await input.fill("Preserved activity draft");
      const original = await input.elementHandle();
      const viewport = viewportOf(changing),
        savedViewport = await viewport.elementHandle();
      const button = changing.getByRole("button", { name: "Change activity count" });
      await expect(button).toHaveAttribute("data-motion", effectiveMode(mode, os === "reduce"));
      await expect(changing.getByRole("listitem")).toHaveCount(20);
      await button.press("Enter");
      await expect(changing.getByRole("status")).toHaveText("40 entries · Compact panel");
      await expect(changing.getByRole("listitem")).toHaveCount(40);
      await viewport.focus();
      await page.keyboard.press("PageDown");
      await expect.poll(() => viewport.evaluate((n) => n.scrollTop)).toBeGreaterThan(0);
      // Let native keyboard scrolling settle before checking preservation.
      await expect.poll(() => viewport.evaluate((n) => n.scrollTop)).toBeGreaterThan(100);
      await page.keyboard.press("End");
      await expect.poll(() => viewport.evaluate((n) => n.scrollHeight - n.clientHeight - n.scrollTop)).toBeLessThan(1);
      const scrollPosition = await viewport.evaluate((n) => n.scrollTop);

      for (const next of MODES) {
        await page.getByRole("group", { name: "Motion mode" }).getByRole("button", { name: next, exact: true }).click();
        await expect(button).toHaveAttribute("data-motion", effectiveMode(next, os === "reduce"));
        await expect(input).toHaveValue("Preserved activity draft");
        expect(await input.evaluate((n, h) => n === h, original)).toBe(true);
        expect(await viewport.evaluate((n, h) => n === h, savedViewport)).toBe(true);
        expect(await viewport.evaluate((n) => n.scrollTop)).toBe(scrollPosition);
        const nextMode = effectiveMode(next, os === "reduce");
        await expect(viewport).toHaveAttribute("data-motion", nextMode);
        await motionParts(changing, nextMode);
        if (nextMode === "none")
          expect(
            await changing.evaluate((node) =>
              [...node.querySelectorAll('[data-slot="scroll-area-scrollbar"],[data-slot="scroll-area-thumb"]')].every(
                (part) => part.getAnimations().length === 0 && getComputedStyle(part).transitionDuration === "0s",
              ),
            ),
          ).toBe(true);
      }
      await openComponentSource(page, "scroll-area");
      await expect(input).toHaveValue("Preserved activity draft");
      expect(await input.evaluate((n, h) => n === h, original)).toBe(true);
      await input.focus();
      await page.emulateMedia({ reducedMotion: os === "reduce" ? "no-preference" : "reduce" });
      await expect(input).toBeFocused();
      await expect(input).toHaveValue("Preserved activity draft");
      await motionParts(changing, "none");
      await mkdir(".cache/scroll-area/modes", { recursive: true });
      await page.screenshot({ path: `.cache/scroll-area/modes/${mode}-${os}.png` });
    });

test("scroll-area content growth resize root ref and native keyboard traversal", async ({ page }) => {
  await page.goto("/components/scroll-area?motion=none");
  await page.waitForLoadState("networkidle");
  const changing = page.locator(selector("changing-content")),
    viewport = viewportOf(changing),
    input = changing.getByRole("textbox");
  const thumb = changing.locator('[data-slot="scroll-area-thumb"]');
  await input.fill("A real draft");
  const original = await input.elementHandle();
  const before = (await thumb.boundingBox())?.height ?? 0;
  await changing.getByRole("button", { name: "Change activity count" }).press("Space");
  await viewport.focus();
  await page.keyboard.press("PageDown");
  await expect.poll(() => viewport.evaluate((n) => n.scrollTop)).toBeGreaterThan(100);
  await expect.poll(async () => (await thumb.boundingBox())?.height ?? 0).toBeLessThan(before);
  await page.keyboard.press("Home");
  await expect.poll(() => viewport.evaluate((n) => n.scrollTop)).toBe(0);
  await page.keyboard.press("Tab");
  await expect(input).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(viewport).toBeFocused();
  await changing.getByRole("button", { name: "Resize activity panel" }).press("Enter");
  await expect.poll(() => viewport.evaluate((n) => n.clientHeight)).toBe(286);
  await expect(input).toHaveValue("A real draft");
  expect(await input.evaluate((n, h) => n === h, original)).toBe(true);
  const caller = page.locator(selector("caller-rendering")),
    root = rootOf(caller),
    v = viewportOf(caller);
  await expect(root).toHaveJSProperty("tagName", "SECTION");
  await expect(root).toHaveCSS("max-width", "100%");
  await expect(root).toHaveClass(/border-primary/);
  await v.evaluate((n) => {
    n.scrollTop = 8;
  });
  await expect.poll(() => v.evaluate((n) => n.scrollTop)).toBe(8);
  await expect(root).not.toHaveAttribute("data-overflow-y-start");
  await v.focus();
  await page.keyboard.press("PageDown");
  await expect(root).toHaveAttribute("data-overflow-y-start");
  // Native PageDown may still be interpolating when the edge attribute appears.
  // Finish native navigation before testing the separate caller-owned action.
  await page.keyboard.press("End");
  await expect.poll(() => v.evaluate((n) => n.scrollHeight - n.clientHeight - n.scrollTop)).toBeLessThan(1);

  await caller.getByRole("button").press("Space");
  await expect.poll(() => v.evaluate((n) => n.scrollTop)).toBe(0);
  await v.focus();
  await page.keyboard.press("Tab");
  await expect(caller.getByRole("link").first()).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(caller.getByRole("link").nth(1)).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(caller.getByRole("link").first()).toBeFocused();
  const ids = await page.locator("[id]").evaluateAll((nodes) => nodes.map((n) => n.id));
  expect(new Set(ids).size).toBe(ids.length);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/docs\/changelog$/);
});

test("scroll-area two axes no-overflow mounting and RTL thumb geometry", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/components/scroll-area?motion=none");
  await page.waitForLoadState("networkidle");
  const both = page.locator(selector("both-axes")),
    v = viewportOf(both);
  expect(await v.evaluate((n) => n.scrollWidth > n.clientWidth && n.scrollHeight > n.clientHeight)).toBe(true);
  await v.focus();
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => v.evaluate((n) => n.scrollLeft)).toBeGreaterThan(0);
  await page.keyboard.press("PageDown");
  await expect.poll(() => v.evaluate((n) => n.scrollTop)).toBeGreaterThan(0);
  await expect(both.locator('[data-slot="scroll-area-scrollbar"]')).toHaveCount(2);
  const noOverflow = page.locator(selector("without-overflow"));
  for (const viewport of await viewportOf(noOverflow).all()) {
    expect(await viewport.evaluate((n) => n.clientHeight === n.scrollHeight && n.clientWidth === n.scrollWidth)).toBe(
      true,
    );
    await expect(viewport).toHaveAttribute("tabindex", "-1");
  }
  await expect(rootOf(noOverflow).nth(0).locator('[data-slot="scroll-area-scrollbar"]')).toHaveCount(0);
  await expect(
    rootOf(noOverflow).nth(1).locator('[data-slot="scroll-area-scrollbar"][data-orientation="horizontal"]'),
  ).toHaveCount(1);
  const rtl = page.locator(selector("rtl")),
    rv = viewportOf(rtl);
  await expect(rv).toHaveCSS("direction", "rtl");
  await rv.focus();
  await page.keyboard.press("ArrowLeft");
  await expect.poll(() => rv.evaluate((n) => n.scrollLeft)).toBeLessThan(0);
  await rv.evaluate((n) => {
    n.scrollLeft = 0;
  });
  const track = rtl.locator('[data-slot="scroll-area-scrollbar"]');
  await expect(track).toHaveAttribute("title", "Project phases track");
  await expect(track).toHaveCSS("height", "12px");
  await expect(track).toHaveCSS("padding", "2px");
  const thumb = track.locator('[data-slot="scroll-area-thumb"]');
  await thumb.scrollIntoViewIfNeeded();
  const box = await thumb.boundingBox();
  if (!box) throw Error("Missing RTL thumb");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 - 80, box.y + box.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect.poll(() => rv.evaluate((n) => n.scrollLeft)).toBeLessThan(-20);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("scroll-area no-JS preserves actual native two-axis scrolling and content", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.goto(`${baseURL}/components/scroll-area#both-axes`);
    const both = page.locator(selector("both-axes")),
      v = viewportOf(both);
    await expect(both.getByRole("listitem")).toHaveCount(20);
    await v.focus();
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => v.evaluate((n) => n.scrollLeft)).toBeGreaterThan(0);
    await page.keyboard.press("PageDown");
    await expect.poll(() => v.evaluate((n) => n.scrollTop)).toBeGreaterThan(0);
    await expect(page.locator(selector("changing-content")).getByRole("textbox")).toHaveValue("Keep this draft");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally {
    await context.close();
  }
});
test("scroll-area nested area owns its own viewport and direct display lanes", async ({ page }) => {
  await page.goto("/components/scroll-area?motion=full");
  await page.waitForLoadState("networkidle");
  const card = page.locator(selector("nested-display"));
  const outer = rootOf(card).nth(0);
  const countLane = rootOf(card).nth(1);
  const textLane = rootOf(card).nth(2);
  await expect(countLane.locator('[data-slot="scroll-area-number"]')).toHaveText("12");
  await expect(textLane.locator('[data-slot="scroll-area-text"]')).toHaveText("Inbox tasks are visible.");
  const outerViewport = viewportOf(outer).first();
  const countViewport = viewportOf(countLane).first();
  const saved = await countViewport.elementHandle();
  expect(await outerViewport.getAttribute("data-motion")).toBe("full");
  // The outer board has its own native range; the nested lanes stay at their own origin.
  await outerViewport.focus();
  await page.keyboard.press("PageDown");
  await expect.poll(() => outerViewport.evaluate((n) => n.scrollTop)).toBeGreaterThan(0);
  expect(await countViewport.evaluate((n) => n.scrollTop)).toBe(0);
  await card.getByRole("button", { name: "Change task totals" }).click();
  await expect(countLane.locator('[data-slot="scroll-area-number"]')).toHaveText("30");
  await expect(textLane.locator('[data-slot="scroll-area-text"]')).toHaveText("Archive tasks are visible.");
  expect(await countViewport.evaluate((n, handle) => n === handle, saved)).toBe(true);
  for (const lane of [outer, countLane, textLane])
    await expect(viewportOf(lane).first()).toHaveAttribute("data-motion", "full");
  // The outer board overflows, so its primitive does mount a track; the two bounded
  // lanes have no range and therefore no track to report a mode.
  await expect(outer.locator('[data-slot="scroll-area-thumb"]').first()).toHaveAttribute("data-motion", "full");
  for (const lane of [countLane, textLane])
    await expect(lane.locator('[data-slot="scroll-area-thumb"]')).toHaveCount(0);
});

test("scroll-area records layout shift and frame pacing during native scrolling", async ({ page }, info) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.addInitScript(() => {
    const store = { shifts: [] as number[], frames: [] as number[] };
    (window as unknown as { scrollAreaPerf: typeof store }).scrollAreaPerf = store;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) store.shifts.push((entry as PerformanceEntry & { value: number }).value);
    }).observe({ type: "layout-shift", buffered: true });
    let last = performance.now();
    const tick = (now: number) => {
      store.frames.push(now - last);
      last = now;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await page.goto("/components/scroll-area?motion=full");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
  const viewport = viewportOf(page.locator('[data-preview="scroll-area"]')).first();
  const box = await viewport.boundingBox();
  if (!box) throw new Error("missing viewport");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  for (let step = 0; step < 40; step++) {
    await page.mouse.wheel(0, 80);
    await page.waitForTimeout(16);
  }
  await page.waitForTimeout(400);
  const measured = await page.evaluate(() => {
    const store = (window as unknown as { scrollAreaPerf: { shifts: number[]; frames: number[] } }).scrollAreaPerf;
    const frames = store.frames.filter((delta) => delta > 0 && delta < 100).sort((a, b) => a - b);
    const median = frames[Math.floor(frames.length / 2)] ?? 0;
    return {
      frames: frames.length,
      medianFrameMs: Number(median.toFixed(2)),
      medianFps: median ? Number((1000 / median).toFixed(1)) : 0,
      cls: Number(store.shifts.reduce((total, value) => total + value, 0).toFixed(4)),
      scrollTop: document.querySelector<HTMLElement>('[data-preview="scroll-area"] [data-slot="scroll-area-viewport"]')
        ?.scrollTop,
    };
  });
  await info.attach("scroll-area layout shift and frame pacing", {
    body: JSON.stringify(measured, null, 2),
    contentType: "application/json",
  });
  await mkdir(".cache/scroll-area", { recursive: true });
  await writeFile(".cache/scroll-area/perf.json", `${JSON.stringify(measured, null, 2)}\n`);
  // Native scrolling never moves layout; this is the CLS the shipped insertion may add.
  expect(measured.cls).toBeLessThan(0.05);
  expect(measured.frames).toBeGreaterThan(30);
  // A hang guard, not the 55 fps acceptance: the measured value is attached above.
  expect(measured.medianFps).toBeGreaterThan(40);
});

for (const anchor of ["usage", "caller-rendering-and-sizing", "changing-content"])
  test(`scroll-area cold full deep link ${anchor}`, async ({ page }) => {
    await page.goto(`/components/scroll-area?motion=full#${anchor}`);
    await page.waitForLoadState("networkidle");
    const heading = page.locator(`h2#${anchor}`);
    await expect(heading).toBeInViewport();
    await expect.poll(() => heading.evaluate((n) => getComputedStyle(n.closest("article") ?? n).opacity)).toBe("1");
  });
for (const theme of ["light", "dark"] as const)
  for (const width of [1280, 390])
    for (const name of ["top", ...names])
      test(`scroll-area visual axe ${name}/${theme}/${width}`, async ({ page }) => {
        test.setTimeout(90_000);
        await page.setViewportSize({ width, height: 1100 });
        await page.addInitScript((value) => localStorage.setItem("cadence-theme", value), theme);
        await page.goto("/components/scroll-area?motion=none");
        await page.waitForLoadState("networkidle");
        const sel = name === "top" ? '[data-preview="scroll-area"]' : selector(name),
          card = page.locator(sel);
        await card.scrollIntoViewIfNeeded();
        // Base UI marks an overflowing viewport focusable in an effect after hydration.
        await page.waitForTimeout(600);
        expect(
          (await new AxeBuilder({ page }).include(sel).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
            .violations,
        ).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await mkdir(".cache/scroll-area/proof", { recursive: true });
        await card.screenshot({ path: `.cache/scroll-area/proof/${name}-${theme}-${width}.png` });
      });

for (const mode of ["full", "none"] as const)
  test(`scroll-area track insertion reports ${mode} from actual insertion`, async ({ page }, info) => {
    await page.goto(`/components/scroll-area?motion=${mode}`);
    await page.waitForLoadState("networkidle");
    await expect(viewportOf(page.locator('[data-preview="scroll-area"]')).first()).toHaveAttribute("data-motion", mode);
    const rows = await page.evaluate(
      () =>
        new Promise<{ slot: string; animation: string; property: string; duration: string; mode: string | null }[][]>(
          (resolve) => {
            const samples: {
              slot: string;
              animation: string;
              property: string;
              duration: string;
              mode: string | null;
            }[][] = [];
            let count = 0;
            const sample = () => {
              const root = document.querySelector('[data-preview="scroll-area"] [data-slot="scroll-area"]');
              samples.push(
                [root, ...(root?.querySelectorAll('[data-slot^="scroll-area"]') ?? [])].flatMap((node) => {
                  if (!node) return [];
                  const s = getComputedStyle(node);
                  return [
                    {
                      slot: node.getAttribute("data-slot") ?? "",
                      animation: s.animationName,
                      property: s.transitionProperty,
                      duration: s.transitionDuration,
                      mode: node.getAttribute("data-motion"),
                    },
                  ];
                }),
              );
              if (++count < 12) requestAnimationFrame(sample);
              else resolve(samples);
            };
            sample();
          },
        ),
    );
    await info.attach(`${mode} actual insertion`, { body: JSON.stringify(rows), contentType: "application/json" });
    expect(rows.length).toBeGreaterThan(6);
    const animated = [
      "scroll-area-viewport",
      "scroll-area-scrollbar",
      "scroll-area-thumb",
      "scroll-area-text",
      "scroll-area-number",
    ];
    for (const frame of rows)
      for (const s of frame) {
        expect(s.animation, s.slot).toBe("none");
        if (animated.includes(s.slot)) expect(s.mode, s.slot).toBe(mode);
        else expect(s.mode, s.slot).toBeNull();
        if (s.duration === "0s") continue;
        for (const property of s.property.split(",").map((value) => value.trim()))
          expect(["background-color", "color", "box-shadow"], `${s.slot} ${property}`).toContain(property);
      }
    if (mode === "none")
      for (const frame of rows)
        for (const s of frame)
          if (["scroll-area-viewport", "scroll-area-scrollbar", "scroll-area-thumb"].includes(s.slot))
            expect(s.duration, s.slot).toBe("0s");
  });
