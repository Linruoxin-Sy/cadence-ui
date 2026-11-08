import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { effectiveMode, MODES } from "./helpers";
import { openComponentSource } from "./installation-helpers";

const names: string[] = JSON.parse(await readFile("components/site/previews/examples.json", "utf8")).carousel;
const selector = (name: string) => `[data-component-example="carousel/${name}"]`;
const trackOf = (root: Locator) => root.locator('[data-slot="carousel-content"] > div');
async function frames(track: Locator, count = 18) {
  return track.evaluate(async (el, n) => {
    const values: string[] = [];
    for (let i = 0; i < n; i++) {
      await new Promise(requestAnimationFrame);
      values.push(getComputedStyle(el).transform);
    }
    return values;
  }, count);
}
async function aligned(root: Locator, slide: number, axis: "x" | "y" | "rtl" = "x") {
  await expect
    .poll(() =>
      root.evaluate(
        (el, args) => {
          const viewport = el.querySelector('[data-slot="carousel-content"]')?.getBoundingClientRect();
          const item = el
            .querySelectorAll('[data-slot="carousel-item"]')
            [args.slide - 1]?.firstElementChild?.getBoundingClientRect();
          if (!viewport || !item) throw Error("Missing geometry");
          return Math.abs(
            args.axis === "y"
              ? item.top - viewport.top
              : args.axis === "rtl"
                ? item.right - viewport.right
                : item.left - viewport.left,
          );
        },
        { slide, axis },
      ),
    )
    .toBeLessThan(2);
}
async function drag(page: Page, root: Locator, end = 0.15) {
  await root.scrollIntoViewIfNeeded();
  const box = await root.locator('[data-slot="carousel-content"]').boundingBox();
  if (!box) throw Error("Missing viewport");
  await page.mouse.move(box.x + box.width * 0.85, box.y + 60);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * end, box.y + 60, { steps: 20 });
  await page.mouse.up();
}

for (const os of ["no-preference", "reduce"] as const)
  for (const mode of MODES)
    test(`carousel ${mode}/${os}: real engine modes, axes, API, drag, loop and mutations`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.emulateMedia({ reducedMotion: os });
      await page.goto(`/components/carousel?motion=${mode}`);
      await page.waitForLoadState("networkidle");
      const effective = effectiveMode(mode, os === "reduce");
      const top = page.locator('[data-preview="carousel"]');
      const root = top.getByRole("region", { name: "Project highlights" });
      await expect(top.getByRole("button")).toHaveCount(2);
      await expect(top.getByRole("combobox")).toHaveCount(0);
      for (const name of names) {
        const roots = page.locator(selector(name)).locator('[data-slot="carousel"]');
        for (const [i, r] of (await roots.all()).entries()) {
          const expected =
            name === "without-motion" ? (i === 0 ? "none" : effectiveMode("full", os === "reduce")) : effective;
          await expect(r).toHaveAttribute("data-motion", expected);
          await expect(r.locator('[data-slot="carousel-content"]')).toHaveAttribute("data-motion", expected);
        }
      }
      await expect(root.getByRole("button", { name: "Previous slide" })).toBeDisabled();
      await root.getByRole("button", { name: "Next slide" }).click();
      const samples = await frames(trackOf(root));
      expect(new Set(samples).size)[effective === "full" ? "toBeGreaterThan" : "toBe"](effective === "full" ? 2 : 1);
      await aligned(root, 2);
      if (effective === "full") {
        const interruption = await root.evaluate(async (el) => {
          const track = el.querySelector('[data-slot="carousel-content"] > div');
          const next = el.querySelector<HTMLButtonElement>('[data-slot="carousel-next"]');
          const prev = el.querySelector<HTMLButtonElement>('[data-slot="carousel-previous"]');
          if (!track || !next || !prev) throw Error("Missing controls");
          const read = () => new DOMMatrixReadOnly(getComputedStyle(track).transform).m41;
          const start = read();
          next.click();
          for (let i = 0; i < 6; i++) await new Promise(requestAnimationFrame);
          const before = read();
          prev.click();
          return { travel: Math.abs(before - start), jump: Math.abs(read() - before) };
        });
        expect(interruption.travel).toBeGreaterThan(5);
        expect(interruption.jump).toBeLessThan(1);
        await aligned(root, 2);
      }
      await root.focus();
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("ArrowLeft");
      await aligned(root, 2);
      const api = page.locator(selector("api"));
      const apiRoot = api.getByRole("region");
      await expect(api.getByRole("status")).toHaveText("Slide 1 of 4 · Ready");
      await api.getByRole("button", { name: "Go to last slide" }).click();
      if (effective !== "full") expect(new Set(await frames(trackOf(apiRoot))).size).toBe(1);
      await aligned(apiRoot, 4);
      await expect(apiRoot.getByRole("button", { name: "Next slide" })).toBeDisabled();
      await expect(api.getByRole("status")).toHaveText("Slide 4 of 4 · Ready");
      const changing = page.locator(selector("changing-slides")),
        changingRoot = changing.getByRole("region");
      const saved = await trackOf(changingRoot).elementHandle();
      for (let i = 0; i < 3; i++) {
        await changingRoot.getByRole("button", { name: "Next slide" }).click();
        await aligned(changingRoot, i + 2);
      }
      const before = await changingRoot.boundingBox();
      await changing.getByRole("button", { name: "Resize track" }).click();
      expect((await changingRoot.boundingBox())?.width).toBeLessThan(before?.width ?? 0);
      await aligned(changingRoot, 4);
      await changing.getByRole("button", { name: "Change slides" }).click();
      await expect(changingRoot.getByRole("group")).toHaveCount(5);
      await changingRoot.getByRole("button", { name: "Next slide" }).click();
      await aligned(changingRoot, 5);
      await changing.getByRole("button", { name: "Change slides" }).click();
      await expect(changingRoot.getByRole("group")).toHaveCount(4);
      await aligned(changingRoot, 4);
      expect(await trackOf(changingRoot).evaluate((n, original) => n === original, saved)).toBe(true);
      const loop = page.locator(selector("looping")).getByRole("region");
      await loop.getByRole("button", { name: "Previous slide" }).click();
      await aligned(loop, 4);
      await loop.getByRole("button", { name: "Next slide" }).click();
      await aligned(loop, 1);
      const snap = page.locator(selector("drag")).getByRole("region", { name: "Snapping drag" });
      await drag(page, snap);
      const dragSamples = await frames(trackOf(snap));
      if (effective !== "full") expect(new Set(dragSamples).size).toBe(1);
      expect(Number(dragSamples.at(-1)?.split(",")[4])).toBeLessThan(-10);
      const vertical = page.locator(selector("vertical")).getByRole("region");
      await vertical.focus();
      await page.keyboard.press("ArrowRight");
      await aligned(vertical, 2, "y");
      await page.keyboard.press("ArrowLeft");
      await aligned(vertical, 1, "y");
      const rtl = page.locator(selector("rtl")).getByRole("region");
      await rtl.getByRole("button", { name: "Next slide" }).click();
      await aligned(rtl, 2, "rtl");
      await page.setViewportSize({ width: 390, height: 844 });
      await aligned(changingRoot, 4);
      await aligned(apiRoot, 4);
      await aligned(rtl, 2, "rtl");
      await aligned(vertical, 1, "y");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(errors).toEqual([]);
    });

test("carousel live downgrade, system cancellation, custom controls and state identity", async ({ page }, info) => {
  await page.goto("/components/carousel?motion=full&speed=0.25");
  await page.waitForLoadState("networkidle");
  // The API button can scroll into a part still hidden by the page entrance.
  // Start the engine assertions after its real visibility owner has finished.
  await expect
    .poll(() =>
      page
        .locator("[data-document-entrance]")
        .first()
        .evaluate((node) => getComputedStyle(node).clipPath),
    )
    .toBe("none");
  const card = page.locator(selector("api")),
    root = card.getByRole("region"),
    track = trackOf(root),
    node = await track.elementHandle();
  for (const mode of ["none", "reduced"] as const) {
    if (mode === "reduced") await root.getByRole("button", { name: "Previous slide" }).click();
    await page.getByRole("group", { name: "Motion mode" }).getByRole("button", { name: "full", exact: true }).click();
    await card.getByRole("button", { name: "Go to last slide" }).click();
    const running = await frames(track, 6);
    expect(new Set(running).size).toBeGreaterThan(2);
    await page.getByRole("group", { name: "Motion mode" }).getByRole("button", { name: mode, exact: true }).click();
    await expect(root).toHaveAttribute("data-motion", mode);
    await aligned(root, 4);
    expect(new Set(await frames(track)).size).toBe(1);
    expect(await track.evaluate((n, saved) => n === saved, node)).toBe(true);
    await expect(card.getByRole("status")).toHaveText("Slide 4 of 4 · Ready");
  }
  await page.getByRole("group", { name: "Motion mode" }).getByRole("button", { name: "full", exact: true }).click();
  const prev = root.getByRole("button", { name: "Previous slide" });
  await prev.focus();
  await page.keyboard.press("Enter");
  expect(new Set(await frames(track, 6)).size).toBeGreaterThan(2);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(prev).toBeFocused();
  await expect(root).toHaveAttribute("data-motion", "reduced");
  await aligned(root, 3);
  const samples = await frames(track);
  await info.attach("real engine system cancellation", {
    body: JSON.stringify(samples),
    contentType: "application/json",
  });
  expect(new Set(samples).size).toBe(1);
  expect(await track.evaluate((n, saved) => n === saved, node)).toBe(true);
  await openComponentSource(page, "carousel");
  await expect(card.getByRole("status")).toHaveText("Slide 3 of 4 · Ready");
  expect(await track.evaluate((n, saved) => n === saved, node)).toBe(true);
  const custom = page.locator(selector("custom-controls"));
  await expect(custom.getByRole("button", { name: "Earlier project" })).toBeDisabled();
  await custom.getByRole("region").focus();
  await page.keyboard.press("Tab");
  await expect(custom.getByRole("button", { name: "Later project" })).toBeFocused();
  await page.keyboard.press("Space");
  await aligned(custom.getByRole("region"), 2);
  await page.keyboard.press("Shift+Tab");
  await expect(custom.getByRole("button", { name: "Earlier project" })).toBeFocused();
  await page.keyboard.press("Enter");
  await aligned(custom.getByRole("region"), 1);
});

test("carousel fixed drag policies and geometric alignment", async ({ page }) => {
  await page.goto("/components/carousel?motion=none");
  await page.waitForLoadState("networkidle");
  const disabled = page.locator(selector("drag")).getByRole("region", { name: "Buttons only" });
  const before = await trackOf(disabled).evaluate((n) => getComputedStyle(n).transform);
  await drag(page, disabled);
  expect(new Set(await frames(trackOf(disabled)))).toEqual(new Set([before]));
  const free = page.locator(selector("drag")).getByRole("region", { name: "Free drag" });
  await drag(page, free, 0.55);
  const samples = await frames(trackOf(free));
  expect(new Set(samples).size).toBe(1);
  expect(Number(samples[0]?.split(",")[4])).toBeLessThan(-5);
  const between = await free.evaluate((n) => {
    const viewport = n.querySelector('[data-slot="carousel-content"]')?.getBoundingClientRect();
    if (!viewport) throw Error("Missing viewport");
    return [...n.querySelectorAll('[data-slot="carousel-item"]')].every(
      (item) => Math.abs((item.firstElementChild?.getBoundingClientRect().left ?? 0) - viewport.left) > 5,
    );
  });
  expect(between).toBe(true);
  for (const align of ["start", "center", "end"]) {
    const root = page.locator(selector("alignment")).getByRole("region", { name: `Align ${align}` });
    await expect
      .poll(() =>
        root.evaluate((n, align) => {
          const v = n.querySelector('[data-slot="carousel-content"]')?.getBoundingClientRect();
          const item = n.querySelectorAll('[data-slot="carousel-item"]')[1]?.getBoundingClientRect();
          if (!v || !item) throw Error("Missing geometry");
          // Embla aligns slide boxes; physical leading padding belongs inside them.
          return Math.abs(
            align === "start"
              ? item.left - v.left + 16
              : align === "end"
                ? item.right - v.right
                : (item.left + item.right + 16 - v.left - v.right) / 2,
          );
        }, align),
      )
      .toBeLessThan(2);
  }
  const multiple = page.locator(selector("multiple")).getByRole("region");
  const ratio = () =>
    multiple.evaluate(
      (n) =>
        (n.querySelector('[data-slot="carousel-item"]')?.getBoundingClientRect().width ?? 0) /
        (n.querySelector('[data-slot="carousel-content"] > div')?.getBoundingClientRect().width ?? 1),
    );
  expect(await ratio()).toBeCloseTo(0.5, 1);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await ratio()).toBeCloseTo(1, 1);
  const ids = await page.locator("[id]").evaluateAll((nodes) => nodes.map((n) => n.id));
  expect(new Set(ids).size).toBe(ids.length);
});

for (const theme of ["light", "dark"] as const)
  for (const width of [1280, 390])
    for (const name of ["top", ...names])
      test(`carousel visual axe ${name}/${theme}/${width}`, async ({ page }, info) => {
        await page.setViewportSize({ width, height: 1100 });
        await page.addInitScript((value) => localStorage.setItem("cadence-theme", value), theme);
        await page.goto("/components/carousel?motion=none");
        await page.waitForLoadState("networkidle");
        const sel = name === "top" ? '[data-preview="carousel"]' : selector(name),
          card = page.locator(sel);
        await card.scrollIntoViewIfNeeded();
        expect(
          (await new AxeBuilder({ page }).include(sel).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
            .violations,
        ).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await card.screenshot({ path: info.outputPath(`${name}-${theme}-${width}.png`) });
      });
for (const anchor of ["usage", "changing-slides", "without-motion"])
  test(`carousel cold full deep link ${anchor}`, async ({ page }) => {
    await page.goto(`/components/carousel?motion=full#${anchor}`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator(`h2#${anchor}`)).toBeInViewport();
    expect(
      await page.locator(`h2#${anchor}`).evaluate((n) => getComputedStyle(n.closest("article") ?? n).opacity),
    ).not.toBe("0");
  });

test("carousel fixed none has no interpolation from insertion or first navigation", async ({ page }, info) => {
  await page.addInitScript(() => {
    const rows: { mode: string | null; animations: number; duration: string }[] = [];
    (window as unknown as { carouselFirstFrames: typeof rows }).carouselFirstFrames = rows;
    let started = false;
    new MutationObserver(() => {
      const root = document.querySelector('[data-component-example="carousel/without-motion"] [data-slot="carousel"]');
      const track = root?.querySelector('[data-slot="carousel-content"] > div');
      if (!root || !track || started) return;
      started = true;
      let count = 0;
      const sample = () => {
        rows.push({
          mode: root.getAttribute("data-motion"),
          animations: track.getAnimations().length,
          duration: getComputedStyle(track).transitionDuration,
        });
        if (++count < 12) requestAnimationFrame(sample);
      };
      sample();
    }).observe(document, { childList: true, subtree: true });
  });
  await page.goto("/components/carousel?motion=full");
  await page.waitForLoadState("networkidle");
  const rows = await page.evaluate(
    () =>
      (window as unknown as { carouselFirstFrames: { mode: string; animations: number; duration: string }[] })
        .carouselFirstFrames,
  );
  await info.attach("fixed none actual insertion", { body: JSON.stringify(rows), contentType: "application/json" });
  expect(rows).toHaveLength(12);
  expect(rows.every((r) => r.mode === "none" && r.animations === 0 && r.duration === "0s")).toBe(true);
  const root = page.locator(selector("without-motion")).getByRole("region", { name: "Immediate projects" });
  await root.getByRole("button", { name: "Next slide" }).click();
  await aligned(root, 2);
  expect(new Set(await frames(trackOf(root))).size).toBe(1);
});

test("carousel vertical pointer drag and narrow custom controls keep native keyboard access", async ({ page }) => {
  await page.goto("/components/carousel?motion=none");
  await page.waitForLoadState("networkidle");
  const root = page.locator(selector("vertical")).getByRole("region");
  await root.scrollIntoViewIfNeeded();
  const box = await root.locator('[data-slot="carousel-content"]').boundingBox();
  if (!box) throw Error("Missing viewport");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.85);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.15, { steps: 20 });
  await page.mouse.up();
  expect(new Set(await frames(trackOf(root))).size).toBe(1);
  await aligned(root, 2, "y");
  await page.setViewportSize({ width: 390, height: 844 });
  const top = page.locator('[data-preview="carousel"]'),
    topRoot = top.getByRole("region");
  await topRoot.focus();
  await page.keyboard.press("Tab");
  await expect(top.getByRole("button", { name: "Next slide" })).toBeFocused();
  await page.keyboard.press("Enter");
  await aligned(topRoot, 2);
  await page.keyboard.press("Shift+Tab");
  await expect(top.getByRole("button", { name: "Previous slide" })).toBeFocused();
  await page.keyboard.press("Space");
  await aligned(topRoot, 1);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
});
