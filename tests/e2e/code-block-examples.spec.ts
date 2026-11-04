import { mkdir, readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { effectiveMode, MODES } from "./helpers";

const names: string[] = JSON.parse(await readFile("components/site/previews/examples.json", "utf8"))["code-block"];
const cardSelector = (name: string) => `[data-component-example="code-block/${name}"]`;

test.use({ permissions: ["clipboard-read", "clipboard-write"] });

for (const os of ["no-preference", "reduce"] as const)
  for (const mode of MODES)
    test(`code-block examples inherit modes ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os });
      await page.goto(`/components/code-block?motion=${mode}`);
      await page.waitForLoadState("networkidle");
      expect(await page.evaluate(() => scrollY)).toBe(0);
      const top = page.locator('[data-preview="code-block"]');
      await expect(top.locator('[data-slot="code-block"]')).toHaveCount(1);
      await expect(top.getByRole("combobox")).toHaveCount(0);
      for (const name of names) {
        const card = page.locator(cardSelector(name));
        await expect(card).toBeVisible();
        const blocks = card.locator('[data-slot="code-block"]');
        for (const [index, block] of (await blocks.all()).entries()) {
          const resolved =
            name === "without-motion"
              ? index === 0
                ? "none"
                : effectiveMode("full", os === "reduce")
              : effectiveMode(mode, os === "reduce");
          await expect(block).toHaveAttribute("data-motion", resolved);
          for (const part of await block.locator("[data-motion]").all())
            await expect(part).toHaveAttribute("data-motion", resolved);
        }
      }
      const fold = top.locator('[data-slot="code-block-expand-button"]');
      await fold.press("Enter");
      await expect(fold).toHaveAttribute("aria-expanded", "true");
      const tabs = page.locator(cardSelector("content-tabs"));
      await tabs.getByRole("tab", { name: "pnpm", exact: true }).focus();
      await page.keyboard.press("End");
      await expect(tabs.getByRole("tab", { name: "yarn", exact: true })).toBeFocused();
      await expect(tabs.getByRole("tabpanel")).toHaveText(/yarn dlx/);
    });

test("code-block clipboard numbering diff and refused writes", async ({ page }) => {
  await page.goto("/components/code-block?motion=none");
  await page.waitForLoadState("networkidle");
  const top = page.locator('[data-preview="code-block"]');
  const source = await top
    .locator('[data-slot="code-block-line-content"]')
    .evaluateAll((nodes) => nodes.map((n) => (n.textContent === "\n" ? "" : n.textContent)).join("\n"));
  const copy = top.locator('[data-slot="code-block-copy-button"]');
  await copy.press("Enter");
  await expect(copy).toHaveAccessibleName("Copied");
  expect(await page.evaluate(async () => (await navigator.clipboard.readText()).replaceAll("\r\n", "\n"))).toBe(source);
  await expect(top.locator('[aria-live="polite"]')).toHaveText("Copied");
  const numbered = page.locator(cardSelector("line-numbers"));
  await expect(numbered.locator("pre")).toHaveCSS("counter-reset", "line 41");
  await numbered.getByRole("button", { name: "Copy", exact: true }).press("Space");
  expect(await page.evaluate(async () => (await navigator.clipboard.readText()).replaceAll("\r\n", "\n"))).toBe(
    "const response = await fetch(url);\n\nreturn response.json();",
  );
  const diff = page.locator(cardSelector("diff"));
  for (const variant of ["default", "added", "removed", "highlighted"])
    await expect(diff.locator(`[data-slot="code-block-line"][data-variant="${variant}"]`).first()).toBeVisible();
  expect(
    await diff
      .locator('[data-variant="added"]')
      .first()
      .evaluate((n) => getComputedStyle(n, "::after").content),
  ).toBe('"+"');
  expect(await diff.locator('[data-variant="removed"]').evaluate((n) => getComputedStyle(n, "::after").content)).toBe(
    '"−"',
  );
  await diff.getByRole("button", { name: "Copy", exact: true }).press("Enter");
  expect(await page.evaluate(async () => (await navigator.clipboard.readText()).replaceAll("\r\n", "\n"))).toBe(
    "for await (const chunk of reader) {\n  controller.enqueue(chunk);\n}",
  );
  await page.evaluate(() =>
    Object.defineProperty(navigator.clipboard, "writeText", {
      configurable: true,
      value: async () => {
        throw new Error("Permission denied");
      },
    }),
  );
  const floating = page.locator(cardSelector("floating-actions"));
  await floating.getByRole("button", { name: "Copy", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(floating.locator('[aria-live="polite"]')).toHaveText("Copy failed. Select and copy manually.");
  await expect(floating.getByRole("button", { name: "Copy", exact: true })).toBeFocused();
});

test("code-block content tabs keyboard panels IDs retained nodes and selected copy", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/components/code-block?motion=none");
  await page.waitForLoadState("networkidle");
  const card = page.locator(cardSelector("content-tabs"));
  const tabs = card.getByRole("tab");
  const pnpm = tabs.nth(0);
  const panel = card.locator('[data-slot="code-block-panel"]').first();
  const pre = panel.locator("pre");
  const node = await pre.elementHandle();
  await pre.focus();
  for (let i = 0; i < 12; i++) await page.keyboard.press("ArrowRight");
  await expect.poll(() => pre.evaluate((n) => n.scrollLeft)).toBeGreaterThan(0);
  const scroll = await pre.evaluate(async (n) => {
    let previous = n.scrollLeft,
      stable = 0;
    for (let i = 0; i < 120; i++) {
      await new Promise(requestAnimationFrame);
      const next = n.scrollLeft;
      stable = next === previous ? stable + 1 : 0;
      previous = next;
      if (stable === 8) return next;
    }
    throw new Error("native horizontal scroll did not settle");
  });
  expect(scroll).toBeGreaterThan(0);
  await pnpm.focus();
  await page.keyboard.press("ArrowRight");
  await expect(tabs.nth(1)).toBeFocused();
  await expect(pnpm).toHaveAttribute("tabindex", "-1");
  await expect(panel).toBeHidden();
  await expect(card.getByRole("tabpanel")).toHaveAttribute(
    "id",
    (await tabs.nth(1).getAttribute("aria-controls")) ?? "",
  );
  await page.keyboard.press("Tab");
  const copy = card.locator('[data-slot="code-block-copy-button"]');
  await expect(copy).toBeFocused();
  await page.keyboard.press("Enter");
  expect(await page.evaluate(async () => (await navigator.clipboard.readText()).replaceAll("\r\n", "\n"))).toBe(
    "npx shadcn@latest add @cadence/code-block",
  );
  await tabs.nth(1).focus();
  await page.keyboard.press("End");
  await expect(tabs.nth(2)).toBeFocused();
  await expect(copy).toHaveAccessibleName("Copy");
  await page.keyboard.press("ArrowRight");
  await expect(pnpm).toBeFocused();
  expect(await pre.evaluate((n, original) => n === original, node)).toBe(true);
  expect(await pre.evaluate((n) => n.scrollLeft)).toBe(scroll);
  const ids = await page.locator("[id]").evaluateAll((nodes) => nodes.map((n) => n.id));
  expect(ids.length).toBe(new Set(ids).size);
});

test("code-block controlled state append nodes focus and disclosure survive header changes", async ({ page }) => {
  await page.goto("/components/code-block?motion=none");
  await page.waitForLoadState("networkidle");
  const folding = page.locator(cardSelector("folding"));
  await expect(folding.locator('[data-slot="code-block-expand-button"]')).toHaveCount(2);
  await expect(folding.locator('[data-slot="code-block-expand-button"]').nth(1)).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  const fold = page.locator(cardSelector("controlled-fold"));
  const button = fold.locator('[data-slot="code-block-expand-button"]');
  await fold.getByRole("button", { name: "Expand from outside" }).click();
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await button.press("Space");
  await expect(button).toHaveAttribute("aria-expanded", "false");
  const controlled = page.locator(cardSelector("controlled-tabs"));
  await controlled.getByRole("button", { name: "Show output from outside" }).click();
  await expect(controlled.getByRole("tab", { name: "Output", exact: true })).toHaveAttribute("aria-selected", "true");
  await expect(
    page.locator(cardSelector("content-tabs")).getByRole("tab", { name: "pnpm", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  const updating = page.locator(cardSelector("updating-text"));
  const pre = updating.locator("pre").first();
  const highlightedLine = updating.locator('[data-slot="code-block-line"]').first();
  await expect(highlightedLine.locator('span[style*="--shiki-light"]').first()).toBeVisible();
  const original = await pre.elementHandle();
  const text = await pre.locator("code").evaluateHandle((n) => n.firstChild);
  const line = await highlightedLine.elementHandle();
  await updating.getByRole("button", { name: "Append a local chunk" }).click();
  await expect(pre).toContainText("Checked another route.");
  expect(await pre.locator("code").evaluate((n, original) => n.firstChild === original, text)).toBe(true);
  expect(await highlightedLine.evaluate((n, original) => n === original, line)).toBe(true);
  await pre.focus();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(updating.locator('[data-slot="code-block"]').first()).toHaveAttribute("data-motion", "none");
  await expect(pre).toBeFocused();
  await page.getByRole("group", { name: "Motion mode" }).getByRole("button", { name: "full", exact: true }).click();
  await expect(updating.locator('[data-slot="code-block"]').first()).toHaveAttribute("data-motion", "reduced");
  await page.getByText("Component source", { exact: true }).click();
  expect(await pre.evaluate((n, original) => n === original, original)).toBe(true);
  await expect(pre).toContainText("Checked another route.");
  await expect(controlled.getByRole("tab", { name: "Output", exact: true })).toHaveAttribute("aria-selected", "true");
});

for (const theme of ["light", "dark"])
  for (const width of [1280, 390])
    for (const name of ["top", ...names])
      test(`code-block visual axe ${name}/${theme}/${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.addInitScript((value) => localStorage.setItem("cadence-theme", value), theme);
        await page.goto("/components/code-block?motion=none");
        await page.waitForLoadState("networkidle");
        const selector = name === "top" ? '[data-preview="code-block"]' : cardSelector(name);
        const card = page.locator(selector);
        await card.scrollIntoViewIfNeeded();
        expect((await new AxeBuilder({ page }).include(selector).analyze()).violations).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        const box = await card.boundingBox();
        if (!box) throw new Error("missing specimen bounds");
        if (box.height > 700) {
          // Fit tall specimens beneath the real sticky header for an unobscured capture.
          await page.setViewportSize({ width, height: Math.ceil(box.height) + 200 });
          await card.evaluate((n) => window.scrollBy(0, n.getBoundingClientRect().top - 120));
        }
        await mkdir(".cache/code-block-proof", { recursive: true });
        await card.screenshot({ path: `.cache/code-block-proof/${name}-${theme}-${width}.png` });
      });

test("code-block fold reverses and active geometry cancels on live OS reduction", async ({ page }, info) => {
  await page.goto("/components/code-block?motion=full&speed=0.25");
  await page.waitForLoadState("networkidle");
  const card = page.locator(cardSelector("controlled-fold"));
  const viewport = card.locator('[data-slot="code-block-viewport"]');
  const toggle = card.locator('[data-slot="code-block-expand-button"]');
  const pre = viewport.locator("pre");
  const original = await pre.elementHandle();
  const folded = await viewport.evaluate((n) => n.getBoundingClientRect().height);
  await card.getByRole("button", { name: "Expand from outside" }).click();
  await expect.poll(() => viewport.evaluate((n) => n.getBoundingClientRect().height)).toBeGreaterThan(folded + 2);
  const mid = await viewport.evaluate((n) => n.getBoundingClientRect().height);
  const full = await pre.evaluate((n) => n.scrollHeight);
  expect(mid).toBeLessThan(full);
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect.poll(() => viewport.evaluate((n) => n.getBoundingClientRect().height)).toBeLessThan(folded + 1);
  await toggle.click();
  await expect.poll(() => viewport.evaluate((n) => n.getBoundingClientRect().height)).toBeGreaterThan(folded + 2);
  await pre.focus();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(viewport).toHaveAttribute("data-motion", "reduced");
  const samples = await viewport.evaluate(async (n) => {
    const result: number[] = [];
    for (let i = 0; i < 12; i++) {
      await new Promise(requestAnimationFrame);
      result.push(n.getBoundingClientRect().height);
    }
    return result;
  });
  await info.attach("live-geometry-first-frames", {
    body: JSON.stringify({ folded, mid, full, samples }),
    contentType: "application/json",
  });
  for (const height of samples) expect(height).toBeCloseTo(full, 0);
  await expect(pre).toBeFocused();
  expect(await pre.evaluate((n, original) => n === original, original)).toBe(true);
});

test("code-block fixed none insertion frames and cold deep link", async ({ page }, info) => {
  await page.addInitScript(() => {
    const store = window as unknown as {
      fixedFrames: { mode: string | null; transforms: string[]; durations: string[] }[];
    };
    store.fixedFrames = [];
    new MutationObserver(() => {
      const block = document.querySelector(
        '[data-component-example="code-block/without-motion"] [data-slot="code-block"]',
      );
      if (!block) return;
      store.fixedFrames.push({
        mode: block.getAttribute("data-motion"),
        transforms: [...block.querySelectorAll("[data-motion]")].map((n) => getComputedStyle(n).transform),
        durations: [...block.querySelectorAll("[data-motion]")].flatMap((n) => {
          const css = getComputedStyle(n),
            properties = css.transitionProperty.split(",").map((p) => p.trim()),
            times = css.transitionDuration.split(",");
          return properties.flatMap((property, index) =>
            /^(all|transform|translate|scale|rotate|opacity|filter|width|height)$/.test(property)
              ? [times[index % times.length] ?? "0s"]
              : [],
          );
        }),
      });
    }).observe(document, { childList: true, subtree: true });
  });
  await page.goto("/components/code-block?motion=full#without-motion");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("h2#without-motion")).toBeInViewport();
  const frames = await page.evaluate(() => (window as unknown as { fixedFrames: unknown[] }).fixedFrames);
  expect(frames.length).toBeGreaterThan(0);
  for (const frame of frames as { mode: string; transforms: string[]; durations: string[] }[]) {
    expect(frame.mode).toBe("none");
    for (const transform of frame.transforms) expect(["none", "matrix(1, 0, 0, 1, 0, 0)"]).toContain(transform);
    for (const duration of frame.durations)
      expect(duration.split(",").every((n) => Number.parseFloat(n) === 0)).toBe(true);
  }
  await info.attach("fixed-none-insertion", { body: JSON.stringify(frames), contentType: "application/json" });
});

for (const width of [1280, 390])
  test(`code-block no-JS retains complete folded source ${width}`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width, height: 844 } });
    try {
      const page = await context.newPage();
      await page.goto(`${baseURL}/components/code-block#usage`);
      const viewport = page.locator('[data-preview="code-block"] [data-slot="code-block-viewport"]');
      const sizes = await viewport.evaluate((n) => {
        const pre = n.querySelector("pre");
        if (!pre) throw new Error("missing native source");
        return { viewport: n.clientHeight, source: pre.scrollHeight };
      });
      expect(sizes.viewport).toBeGreaterThanOrEqual(sizes.source - 1);
      await expect(viewport.locator("pre")).toContainText("if (signal.aborted) break;");
      await expect(page.locator("h2#usage")).toBeInViewport();
    } finally {
      await context.close();
    }
  });

test("code-block appended output scrolls vertically by native keyboard", async ({ page }) => {
  await page.goto("/components/code-block?motion=none");
  await page.waitForLoadState("networkidle");
  const card = page.locator(cardSelector("updating-text"));
  for (let i = 0; i < 16; i++) await card.getByRole("button", { name: "Append a local chunk" }).click();
  const pre = card.locator("pre").first();
  await pre.focus();
  const before = await page.evaluate(() => scrollY);
  await page.keyboard.press("PageDown");
  await expect.poll(() => pre.evaluate((n) => n.scrollTop)).toBeGreaterThan(0);
  expect(await page.evaluate(() => scrollY)).toBe(before);
  await expect(pre).toBeFocused();
  await card.getByRole("button", { name: "Reset text", exact: true }).click();
  await expect(pre).toHaveText("Build started.\n");
});
