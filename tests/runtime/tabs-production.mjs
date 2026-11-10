import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import { installationPlan } from "../../scripts/installation.mjs";

assert(process.env.TABS_URL && process.env.TABS_SITE_OUTPUT && process.env.CADENCE_DIST_DIR);
const url = process.env.TABS_URL,
  output = path.resolve(process.env.TABS_SITE_OUTPUT);
await mkdir(output, { recursive: true });
const hash = (v) => createHash("sha256").update(v).digest("hex");
const registry = JSON.parse(await readFile("registry.json"));
const plan = installationPlan(registry.items, "tabs");
const report = {
  url,
  buildId: (await readFile(path.join(process.env.CADENCE_DIST_DIR, "BUILD_ID"), "utf8")).trim(),
  inputs: {},
  cases: [],
  errors: [],
  install: [],
  resources: {},
};
for (const file of [
  "registry/cadence/tabs/index.tsx",
  "registry/cadence/lib/measured-geometry.ts",
  "registry/cadence/lib/text-presentation.ts",
  "components/site/previews/tabs.tsx",
  "content/components/tabs.mdx",
  "public/r/tabs.json",
])
  report.inputs[file] = hash(await readFile(file));
await writeFile(path.join(output, "runner.mjs"), await readFile(new URL(import.meta.url)));
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  for (const os of ["no-preference", "reduce"])
    for (const mode of ["full", "reduced", "none"]) {
      const context = await browser.newContext({ reducedMotion: os, viewport: { width: 1280, height: 1000 } }),
        page = await context.newPage(),
        errors = [];
      page.on("pageerror", (e) => errors.push(e.stack));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      await page.goto(`${url}/components/tabs?motion=${mode}&speed=0.25`);
      const content = page.locator('[data-component-example="tabs/changing-content"]'),
        effective = mode === "none" ? "none" : os === "reduce" ? "reduced" : mode;
      await page.waitForFunction(
        (m) => document.querySelector('[data-component-example="tabs/changing-content"]')?.dataset.previewMotion === m,
        effective,
      );
      await content.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => {
        const n = document.querySelector('[data-component-example="tabs/changing-content"] [data-slot="tabs-list"]');
        if (n?.style.getPropertyValue("--cadence-time-scale") !== "4") return false;
        for (let p = n; p; p = p.parentElement)
          if (p.getAnimations().some((a) => a.playState === "running")) return false;
        return true;
      });
      await content.getByRole("button", { name: "Change label", exact: true }).click();
      await page.waitForTimeout(45);
      assert.equal(await content.getByRole("tab").first().textContent(), "Overview");
      const reflow = await content
        .locator('[data-slot="tabs-list"]')
        .evaluate(
          (n) =>
            n.getAnimations().filter((a) => a.effect.getKeyframes().some((f) => "width" in f || "height" in f)).length,
        );
      if (effective === "full") assert(reflow > 0, "production intrinsic strip resize");
      else assert.equal(reflow, 0);
      await content.getByRole("button", { name: "Change panel content", exact: true }).click();
      await page.waitForTimeout(45);
      // Growth preserves the new content's automatic minimum immediately;
      // reverse it to prove a genuinely rendered, readable size interpolation.
      const startHeight = await content
        .locator('[data-slot="tabs-content"]')
        .evaluate((n) => n.getBoundingClientRect().height);
      await content.getByRole("button", { name: "Change panel content", exact: true }).click();
      await page.waitForTimeout(45);
      const geometry = await content
        .locator('[data-slot="tabs-content"]')
        .evaluate((n) => n.getAnimations().filter((a) => a.effect.getKeyframes().some((f) => "height" in f)).length);
      if (effective === "full") assert(geometry > 0, "production panel content geometry");
      else assert.equal(geometry, 0);
      const height = await content
        .locator('[data-slot="tabs-content"]')
        .evaluate((n) => n.getBoundingClientRect().height);
      if (effective === "full")
        assert(height < startHeight && height > 54, "production rendered panel intermediate height");
      await content.screenshot({ path: path.join(output, `${os}-${mode}-content.png`) });
      const quantity = page.locator('[data-component-example="tabs/quantities"]');
      await quantity.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => {
        const n = document.querySelector('[data-component-example="tabs/quantities"] [data-slot="tabs-trigger"]');
        for (let p = n; p; p = p.parentElement)
          if (p.getAnimations().some((a) => a.playState === "running")) return false;
        return !!n;
      });
      await quantity.getByRole("button", { name: "Update count", exact: true }).click();
      await page.waitForTimeout(45);
      assert.equal(await quantity.locator('[data-slot="tabs-content"]').textContent(), "20");
      const reels = await page.locator("[data-cadence-reel]").count();
      if (effective === "full") assert(reels > 0, "production direct quantity reels");
      else assert.equal(reels, 0);
      await page
        .getByRole("group", { name: "Motion mode" })
        .getByRole("button", { name: "none", exact: true })
        .evaluate((n) => n.click());
      await page.waitForFunction(
        () =>
          document.querySelector('[data-component-example="tabs/quantities"] [data-slot="tabs-content"]')?.dataset
            .motion === "none",
      );
      assert.equal(await page.locator("[data-cadence-text-layer],[data-cadence-reel]").count(), 0);
      assert.deepEqual(errors, []);
      report.cases.push({ mode, os, effective, reflow, geometry, reels, errors });
      await context.close();
    }
  for (const width of [390, 1280])
    for (const theme of ["light", "dark"]) {
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
        permissions: ["clipboard-read", "clipboard-write"],
      });
      await context.addInitScript((t) => localStorage.setItem("cadence-theme", t), theme);
      const page = await context.newPage();
      await page.goto(`${url}/components/tabs?motion=none`);
      const content = page.locator('[data-component-example="tabs/changing-content"]');
      await content.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await content.screenshot({ path: path.join(output, `${theme}-${width}-content.png`) });
      const violations = (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
        .violations;
      assert.deepEqual(violations, []);
      if (theme === "light") {
        const methods = page.locator("[data-installation]").getByRole("tablist", { name: "Installation method" });
        await methods.getByRole("tab", { name: "Command", exact: true }).focus();
        await page.keyboard.press("ArrowRight");
        await page.keyboard.press("Enter");
        for (const file of plan.files) {
          const block = page.locator(`[data-installation-source="${file.target}"]`);
          await block.waitFor({ state: "visible" });
          await block.getByRole("button", { name: "Copy", exact: true }).click();
          const copied = (await page.evaluate(() => navigator.clipboard.readText())).replaceAll("\r\n", "\n");
          const actual = await readFile(file.path, "utf8");
          assert.equal(copied, actual);
          report.install.push({ width, target: file.target, sha: hash(copied) });
        }
        const own = page.locator('[data-installation-source="@components/cadence/tabs/index.tsx"]');
        await own.getByRole("button", { name: "Show all", exact: true }).click();
        assert.equal(
          await own.getByRole("button", { name: "Show less", exact: true }).getAttribute("aria-expanded"),
          "true",
        );
        await methods.getByRole("tab", { name: "Command", exact: true }).click();
        await methods.getByRole("tab", { name: "Manual", exact: true }).click();
        assert.equal(
          await own.getByRole("button", { name: "Show less", exact: true }).getAttribute("aria-expanded"),
          "true",
        );
        await page.screenshot({ path: path.join(output, `${width}-installation.png`) });
      }
      report.cases.push({ width, theme, overflow: false, axe: 0 });
      await context.close();
    }
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${url}/components/tabs`);
  const content = page.locator('[data-component-example="tabs/changing-content"]');
  assert.equal(await content.locator('[data-slot="tabs-content"]').textContent(), "Release pending");
  assert.equal(
    await page.locator('[data-component-example="tabs/quantities"] [data-slot="tabs-content"]').textContent(),
    "19",
  );
  assert((await content.locator('[data-slot="tabs"]').boundingBox()).height > 0);
  await context.close();
  report.noJS = true;
  report.passed = true;
} catch (e) {
  report.errors.push(e.stack);
  throw e;
} finally {
  await browser.close();
  report.resources.browserClosed = true;
  await writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2));
}
