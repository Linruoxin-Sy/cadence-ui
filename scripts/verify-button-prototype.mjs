import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect } from "@playwright/test";
import { summarizeLayoutShifts } from "./site-js-budget.mjs";

export async function auditButtonPrototype(browser, origin, baseline, dir) {
  const checks = [];
  async function check(name, run) {
    try {
      const detail = await run();
      checks.push({ name, status: "PASS", detail });
    } catch (e) {
      checks.push({ name, status: "FAIL", error: e.stack });
      console.log(e.message);
    }
    console.log(`${name}: ${checks.at(-1).status}`);
    await writeFile(path.join(dir, "functionality.json"), JSON.stringify(checks, null, 2));
  }
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();
  page.setDefaultTimeout(7000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const ready = async (url = "/components/button?motion=none") => {
    await page.goto(origin + url);
    await page.waitForFunction(() => window.__prototypeReady);
    await page.waitForLoadState("networkidle");
  };
  await check("cold route source/TOC/16 original specimens", async () => {
    await ready();
    assert.equal(await page.locator('[data-preview="button"] [data-slot="button"]').count(), 16);
    const toc = await page
      .locator('nav[aria-label="On this page"] a')
      .evaluateAll((nodes) =>
        nodes.map((a) => ({ text: a.textContent, target: document.querySelector(a.hash)?.textContent })),
      );
    assert.ok(toc.length > 5);
    assert.ok(toc.every((x) => x.text === x.target));
    await page.locator("article details summary").focus();
    await page.keyboard.press("Enter");
    const copy = page.locator("article details").getByRole("button", { name: "Copy", exact: true }).first();
    await copy.click();
    const payload = JSON.parse(await readFile("public/r/button.json", "utf8"));
    assert.equal(
      (await page.evaluate(() => navigator.clipboard.readText())).replaceAll("\r\n", "\n"),
      payload.files[0].content.replaceAll("\r\n", "\n"),
    );
    return { toc, buttons: 16 };
  });
  await check("all actual package managers clipboard and remembered selection", async () => {
    const list = page.getByRole("tablist", { name: "Package manager" });
    const values = await list.getByRole("tab").allTextContents();
    assert.deepEqual(values, ["pnpm", "npm", "yarn"]);
    const commands = {
      pnpm: "pnpm dlx shadcn@latest add @cadence/button",
      npm: "npx shadcn@latest add @cadence/button",
      yarn: "yarn dlx shadcn@latest add @cadence/button",
    };
    for (const name of values) {
      await list.getByRole("tab", { name, exact: true }).click();
      await expect(list.getByRole("tab", { name, exact: true })).toHaveAttribute("aria-selected", "true");
      await list
        .locator('xpath=ancestor::*[@data-slot="code-block"]')
        .getByRole("button", { name: /Copy|Copied/, exact: true })
        .click();
      assert.equal(await page.evaluate(() => navigator.clipboard.readText()), commands[name]);
    }
    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(list.getByRole("tab", { name: "yarn", exact: true })).toHaveAttribute("aria-selected", "true");
    return values;
  });
  await check("variant history stable specimen and focus", async () => {
    await ready("/components/button?motion=none&variant=outline#usage");
    const select = page.getByLabel("Button variant", { exact: true });
    await expect(select).toHaveValue("outline");
    await page
      .locator('[data-preview="button"] button')
      .first()
      .evaluate((node) => (window.__specimen = node));
    await select.focus();
    await select.selectOption("secondary");
    await expect(select).toBeFocused();
    await page.goBack();
    await expect(select).toHaveValue("outline");
    await page.goForward();
    await expect(select).toHaveValue("secondary");
    assert.equal(
      await page
        .locator('[data-preview="button"] button')
        .first()
        .evaluate((node) => node === window.__specimen),
      true,
    );
    assert.equal(new URL(page.url()).hash, "#usage");
  });
  await check("persistent sidebar navigation search filters and real result target", async () => {
    await ready();
    const nav = page.locator("aside").getByRole("navigation", { name: "Documentation" });
    await nav.evaluate((node) => (window.__sidebar = node));
    const atoms = nav.getByRole("button", { name: /Atoms/ });
    await atoms.click();
    await expect(atoms).toHaveAttribute("aria-expanded", "false");
    await page
      .getByRole("navigation", { name: "Main", exact: true })
      .getByRole("link", { name: "Components", exact: true })
      .click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Components");
    assert.equal(await nav.evaluate((node) => node === window.__sidebar), true);
    await expect(atoms).toHaveAttribute("aria-expanded", "false");
    const search = page.getByRole("searchbox", { name: "Search components" });
    await search.fill("Button");
    await search.press("Enter");
    await page.getByRole("combobox", { name: /^Intensity/ }).selectOption("subtle");
    await page.getByRole("combobox", { name: /^Complexity/ }).selectOption("S");
    await page.getByRole("combobox", { name: /^Category/ }).selectOption("feedback");
    await expect(page.getByRole("status")).toContainText("1 of 58");
    await page
      .locator("[data-catalog-results]")
      .getByRole("link")
      .filter({ has: page.getByRole("heading", { name: /^Button S$/ }) })
      .click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Button");
    await page.getByRole("link", { name: "Next: Badge" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Badge");
    await page.goBack();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Button");
    assert.equal(await nav.evaluate((node) => node === window.__sidebar), true);
  });
  await check("theme mode speed controls and persistence", async () => {
    await ready();
    await page.getByRole("button", { name: "Toggle color theme" }).click();
    assert.equal(await page.evaluate(() => localStorage.getItem("cadence-theme")), "dark");
    await page
      .getByRole("group", { name: "Motion mode" })
      .getByRole("button", { name: "reduced", exact: true })
      .click();
    await expect(page.locator('[data-preview="button"]')).toHaveAttribute("data-preview-motion", "reduced");
    await page.getByRole("combobox", { name: "Motion speed", exact: true }).click();
    await page.getByRole("option", { name: "0.25×", exact: true }).click();
    assert.equal(await page.evaluate(() => localStorage.getItem("cadence-motion-speed")), "0.25");
    await page.reload();
    await page.waitForLoadState("networkidle");
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains("dark")), true);
    await expect(page.getByRole("combobox", { name: "Motion speed", exact: true })).toContainText("0.25");
  });
  await check("actual held press modes OS preference live cancellation and node focus", async () => {
    const samples = [];
    for (const os of ["no-preference", "reduce"]) {
      await page.emulateMedia({ reducedMotion: os });
      for (const mode of ["full", "reduced", "none"]) {
        await ready(`/components/button?motion=${mode}&speed=1`);
        const button = page.locator('[data-preview="button"] [data-slot="button"]').first();
        await button.scrollIntoViewIfNeeded();
        await button.focus();
        await button.evaluate((node) => (window.__held = node));
        await button.hover();
        await page.mouse.down();
        await page.waitForTimeout(260);
        const scale = await button.evaluate((node) => new DOMMatrixReadOnly(getComputedStyle(node).transform).a);
        const expected = mode === "full" && os !== "reduce" ? 0.97 : 1;
        assert.ok(Math.abs(scale - expected) < 0.01, `${mode}/${os} ${scale}`);
        await page.mouse.up();
        samples.push({ mode, os, scale });
      }
    }
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await ready("/components/button?motion=full&speed=0.25");
    const button = page.locator('[data-preview="button"] [data-slot="button"]').first();
    await button.scrollIntoViewIfNeeded();
    await button.focus();
    await button.evaluate((node) => (window.__held = node));
    await button.hover();
    await page.mouse.down();
    await page.waitForTimeout(35);
    await page.evaluate(() => {
      const select = document.querySelector('select[aria-label="Button motion"]');
      select.value = "none";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await expect(button).toHaveAttribute("data-motion", "none");
    await expect
      .poll(() => button.evaluate((node) => new DOMMatrixReadOnly(getComputedStyle(node).transform).a))
      .toBe(1);
    assert.equal(await button.evaluate((node) => node === window.__held), true);
    await expect(button).toBeFocused();
    await page.mouse.up();
    return samples;
  });
  await check("SSR noJS complete content and baseline text/anchors", async () => {
    const nojs = await browser.newContext({ javaScriptEnabled: false });
    try {
      const candidate = await nojs.newPage();
      const product = await nojs.newPage();
      await candidate.goto(`${origin}/components/button`);
      await product.goto(`${baseline}/components/button`);
      const extract = async (p) =>
        p.locator("article").evaluate((node) => ({
          text: node.textContent,
          links: [...node.querySelectorAll("a")].map((a) => [a.textContent, a.getAttribute("href")]),
          headings: [...node.querySelectorAll("h1,h2,h3")].map((n) => [n.tagName, n.id, n.textContent]),
        }));
      assert.deepEqual(await extract(candidate), await extract(product));
      assert.equal(await candidate.locator('[data-preview="button"] button').count(), 16);
      return { identicalArticleTextLinksHeadings: true };
    } finally {
      await nojs.close();
    }
  });
  for (const width of [1440, 390])
    for (const theme of ["light", "dark"])
      await check(`visual axe responsive ${width} ${theme}`, async () => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion: "no-preference" });
        await ready("/components/button?motion=none");
        await page.evaluate((theme) => {
          localStorage.setItem("cadence-theme", theme);
          document.documentElement.classList.toggle("dark", theme === "dark");
        }, theme);
        await page.evaluate(() => scrollTo(0, 0));
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        const violations = (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
          .violations;
        await page.screenshot({ path: path.join(dir, `candidate-${width}-${theme}.png`), fullPage: true });
        const base = await context.newPage();
        await base.setViewportSize({ width, height: 900 });
        await base.goto(`${baseline}/components/button?motion=none`);
        await base.waitForLoadState("networkidle");
        await base.evaluate((theme) => document.documentElement.classList.toggle("dark", theme === "dark"), theme);
        await base.screenshot({ path: path.join(dir, `baseline-${width}-${theme}.png`), fullPage: true });
        await base.close();
        if (width === 390) {
          await page.locator("summary").filter({ hasText: "Browse" }).click();
          await expect(
            page.locator("details.md\\:hidden").getByRole("navigation", { name: "Documentation" }),
          ).toBeVisible();
        }
        assert.deepEqual(violations, []);
        return { axeViolations: 0 };
      });
  checks.push({ name: "runtime errors", status: errors.length ? "FAIL" : "PASS", detail: errors });
  for (const width of [1440, 390])
    await check(`bounded full-mode interaction CLS ${width}`, async () => {
      const isolated = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "no-preference" });
      try {
        await isolated.addInitScript(() => {
          window.__shifts = [];
          window.__firstFrames = [];
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries())
              window.__shifts.push({
                value: entry.value,
                startTime: entry.startTime,
                hadRecentInput: entry.hadRecentInput,
              });
          }).observe({ type: "layout-shift", buffered: true });
          const frame = () => {
            const button = document.querySelector('[data-preview="button"] button');
            if (button && window.__firstFrames.length < 3)
              window.__firstFrames.push({
                time: performance.now(),
                mode: button.dataset.motion,
                transform: getComputedStyle(button).transform,
              });
            if (window.__firstFrames.length < 3) requestAnimationFrame(frame);
          };
          requestAnimationFrame(frame);
        });
        const p = await isolated.newPage();
        await p.goto(`${origin}/components/button?motion=full`);
        await p.waitForFunction(() => window.__prototypeReady);
        await p.waitForLoadState("networkidle");
        await p.getByLabel("Button variant", { exact: true }).selectOption("outline");
        await p.locator("article details summary").click();
        await p.getByRole("tab", { name: "npm", exact: true }).click();
        await p
          .getByRole("navigation", { name: "On this page" })
          .getByRole("link", { name: "API", exact: true })
          .click();
        await p.waitForTimeout(15000);
        const detail = await p.evaluate(() => ({ shifts: window.__shifts, firstFrames: window.__firstFrames }));
        detail.cls = summarizeLayoutShifts(detail.shifts);
        assert.ok(detail.cls < 0.02);
        assert.equal(detail.firstFrames.length, 3);
        return detail;
      } finally {
        await isolated.close();
      }
    });
  await context.close();
  await writeFile(path.join(dir, "functionality.json"), JSON.stringify(checks, null, 2));
  return checks;
}
