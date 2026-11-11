import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import { installationPlan } from "../../scripts/installation.mjs";

assert(process.env.CARD_URL && process.env.CARD_SITE_OUTPUT && process.env.CADENCE_DIST_DIR);
const url = process.env.CARD_URL,
  output = path.resolve(process.env.CARD_SITE_OUTPUT);
await mkdir(output, { recursive: true });
const hash = (v) => createHash("sha256").update(v).digest("hex");
const registry = JSON.parse(await readFile("registry.json"));
const plan = installationPlan(registry.items, "card");
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
  "registry/cadence/card/index.tsx",
  "registry/cadence/lib/measured-geometry.ts",
  "registry/cadence/lib/text-presentation.ts",
  "components/site/previews/card.tsx",
  "content/components/card.mdx",
  "public/r/card.json",
])
  report.inputs[file] = hash(await readFile(file));
await writeFile(path.join(output, "runner.mjs"), await readFile(new URL(import.meta.url)));
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  for (const os of ["no-preference", "reduce"])
    for (const mode of ["full", "reduced", "none"]) {
      const context = await browser.newContext({ reducedMotion: os, viewport: { width: 1280, height: 1000 } });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.stack));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      await page.goto(`${url}/components/card?motion=${mode}&speed=0.25`);
      const content = page.locator('[data-component-example="card/changing-content"]');
      const effective = mode === "none" ? "none" : os === "reduce" ? "reduced" : mode;
      await page.waitForFunction(
        (m) => document.querySelector('[data-component-example="card/changing-content"]')?.dataset.previewMotion === m,
        effective,
      );
      await page.waitForFunction(
        () =>
          document
            .querySelector('[data-component-example="card/changing-content"] [data-slot="card"]')
            ?.style.getPropertyValue("--cadence-time-scale") === "4",
      );
      await content.scrollIntoViewIfNeeded();
      const card = content.locator('[data-slot="card"]');
      await page.waitForFunction(() => {
        const card = document.querySelector('[data-component-example="card/changing-content"] [data-slot="card"]');
        if (!card) return false;
        for (let node = card; node; node = node.parentElement)
          if (node.getAnimations().some((animation) => animation.playState === "running")) return false;
        return true;
      });
      assert.equal(await card.locator('[data-slot="card-title"]').textContent(), "Release pending");
      await card.locator('[data-slot="card-title"] [data-slot="card-text"]').evaluate((node) => {
        window.cardNativeText = node.firstChild;
      });
      await content.getByRole("button", { name: "Update record", exact: true }).click();
      await page.waitForTimeout(35);
      assert.equal(await card.locator('[data-slot="card-title"]').textContent(), "Release ready");
      const text = await page.locator("[data-cadence-text-layer] canvas").count();
      if (effective !== "none") assert(text > 0, "production record update must actually paint changed text");
      await page.evaluate(() => {
        window.cardTextPaint = [...document.querySelectorAll("[data-cadence-text-layer]")];
      });
      await content.getByRole("button", { name: "Change surface", exact: true }).click();
      await page.waitForTimeout(35);
      const surface = await card.evaluate(
        (node) =>
          node
            .getAnimations()
            .filter((animation) => animation.effect.getKeyframes().some((frame) => "backgroundColor" in frame)).length,
      );
      if (effective !== "none") assert(surface > 0, "production surface action must animate its own background");
      else assert.equal(surface, 0);
      if (effective !== "none")
        assert(
          await page.evaluate(
            () => window.cardTextPaint.length > 0 && window.cardTextPaint.every((n) => n.isConnected),
          ),
          "known ancestor background paint must preserve eligible changed-text layers",
        );
      else assert.equal(await page.locator("[data-cadence-text-layer]").count(), 0);
      assert.equal(await card.locator('[data-slot="card-title"]').textContent(), "Release ready");
      assert(
        await card
          .locator('[data-slot="card-title"] [data-slot="card-text"]')
          .evaluate((node) => node.firstChild === window.cardNativeText && getComputedStyle(node).opacity === "1"),
      );
      await page.waitForFunction(() => {
        const card = document.querySelector('[data-component-example="card/changing-content"] [data-slot="card"]');
        return (
          card &&
          !card
            .getAnimations()
            .some((animation) => animation.effect.getKeyframes().some((frame) => "backgroundColor" in frame))
        );
      });
      await content.getByRole("button", { name: "Add seat", exact: true }).click();
      await page.waitForTimeout(35);
      assert.equal(await card.locator('[data-slot="card-content"]').textContent(), "20");
      const reels = await page.locator("[data-cadence-reel]").count();
      if (effective === "full") assert(reels > 0, "production Card must paint quantity reels");
      else assert.equal(reels, 0);
      await content.getByRole("button", { name: "Change surface", exact: true }).click();
      await content.getByRole("button", { name: "Add seat", exact: true }).click();
      await page.waitForTimeout(35);
      const paintedQuantity = await card.evaluate((node) => ({
        value: node.querySelector('[data-slot="card-content"]').textContent,
        reels: document.querySelectorAll("[data-cadence-reel]").length,
        surface: node.getAnimations().filter((a) => a.effect.getKeyframes().some((f) => "backgroundColor" in f)).length,
      }));
      assert.equal(paintedQuantity.value, "21");
      assert.equal(paintedQuantity.reels, 0, "numeric reels retain their strict stable-ancestor-paint policy");
      if (effective !== "none")
        assert(paintedQuantity.surface > 0, "numeric fallback must preserve the independent surface owner");
      await content.getByRole("button", { name: "Change density", exact: true }).click();
      await page.waitForTimeout(35);
      const geometry = await card.evaluate(
        (n) =>
          n.getAnimations().filter((a) => a.effect.getKeyframes().some((f) => "height" in f || "width" in f)).length,
      );
      if (effective === "full") assert(geometry > 0);
      else assert.equal(geometry, 0);
      await content.screenshot({ path: path.join(output, `${os}-${mode}-content.png`) });
      await page.waitForFunction(() => {
        const card = document.querySelector('[data-component-example="card/changing-content"] [data-slot="card"]');
        return (
          card &&
          !card.getAnimations({ subtree: true }).some((animation) => animation.playState === "running") &&
          !document.querySelector("[data-cadence-text-layer],[data-cadence-reel]")
        );
      });
      await content.evaluate((node) => {
        const buttons = [...node.querySelectorAll("button")];
        buttons.find((button) => button.textContent === "Update record").click();
        buttons.find((button) => button.textContent === "Change surface").click();
      });
      await page.waitForTimeout(35);
      const concurrent = await card.evaluate((node) => ({
        title: node.querySelector('[data-slot="card-title"]').textContent,
        sameText:
          node.querySelector('[data-slot="card-title"] [data-slot="card-text"]').firstChild === window.cardNativeText,
        textLayers: document.querySelectorAll("[data-cadence-text-layer]").length,
        surface: node
          .getAnimations()
          .filter((animation) => animation.effect.getKeyframes().some((frame) => "backgroundColor" in frame)).length,
      }));
      assert.equal(concurrent.title, "Release pending");
      assert(concurrent.sameText);
      if (effective !== "none")
        assert(concurrent.textLayers > 0, "same-commit known background paint permits changed-text drawing");
      else assert.equal(concurrent.textLayers, 0);
      if (effective !== "none") assert(concurrent.surface > 0);
      else assert.equal(concurrent.surface, 0);
      await content.screenshot({ path: path.join(output, `${os}-${mode}-concurrent.png`) });
      await content.getByRole("button", { name: "Hide record", exact: true }).click();
      if (effective !== "none") {
        assert.equal(await card.getAttribute("aria-hidden"), "true");
        assert(await card.evaluate((n) => n.inert));
      }
      await content.getByRole("button", { name: "Show record", exact: true }).click();
      assert.equal(await card.locator('[data-slot="card-title"]').textContent(), "Release pending");
      await page
        .getByRole("group", { name: "Motion mode" })
        .getByRole("button", { name: "none", exact: true })
        .evaluate((n) => n.click());
      await page.waitForFunction(
        () =>
          document.querySelector('[data-component-example="card/changing-content"] [data-slot="card"]')?.dataset
            .motion === "none",
      );
      assert.equal(await page.locator("[data-cadence-reel],[data-cadence-text-layer]").count(), 0);
      assert.deepEqual(errors, []);
      report.cases.push({ mode, os, effective, text, surface, reels, paintedQuantity, geometry, concurrent, errors });
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
      await page.goto(`${url}/components/card?motion=none`);
      const content = page.locator('[data-component-example="card/changing-content"]');
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
        const own = page.locator('[data-installation-source="@components/cadence/card/index.tsx"]');
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
  await page.goto(`${url}/components/card`);
  const content = page.locator('[data-component-example="card/changing-content"]');
  assert.equal(await content.locator('[data-slot="card-title"]').textContent(), "Release pending");
  assert.equal(await content.locator('[data-slot="card-content"]').textContent(), "19");
  assert((await content.locator('[data-slot="card"]').boundingBox()).height > 0);
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
