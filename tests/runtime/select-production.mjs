import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import { installationPlan } from "../../scripts/installation.mjs";

assert(process.env.SELECT_URL && process.env.SELECT_SITE_OUTPUT && process.env.CADENCE_DIST_DIR);
const url = process.env.SELECT_URL,
  output = path.resolve(process.env.SELECT_SITE_OUTPUT);
await mkdir(output, { recursive: true });
const hash = (v) => createHash("sha256").update(v).digest("hex");
const registry = JSON.parse(await readFile("registry.json"));
const plan = installationPlan(registry.items, "select");
const report = {
  url,
  buildId: (await readFile(path.join(process.env.CADENCE_DIST_DIR, "BUILD_ID"), "utf8")).trim(),
  inputs: {},
  cases: [],
  errors: [],
  install: [],
  resources: {},
};
for (const file of new Set([
  ...plan.files.map((file) => file.path),
  "registry.json",
  "package.json",
  "pnpm-lock.yaml",
  "next.config.ts",
  "app/globals.css",
  "components/site/previews/select.tsx",
  "content/components/select.mdx",
  "public/r/select.json",
]))
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
      await page.goto(`${url}/components/select?motion=${mode}&speed=0.25`);
      const content = page.locator('[data-component-example="select/changing-selection"]'),
        effective = mode === "none" ? "none" : os === "reduce" ? "reduced" : mode;
      await page.waitForFunction(
        (mode) =>
          document.querySelector('[data-component-example="select/changing-selection"]')?.dataset.previewMotion ===
          mode,
        effective,
      );
      await content.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => {
        const node = document.querySelector(
          '[data-component-example="select/changing-selection"] [data-slot="select-trigger"]',
        );
        return node && !node.getAnimations().some((a) => a.playState === "running");
      });
      const trigger = content.getByRole("combobox", { name: "Changing plan" });
      await trigger.click();
      await page.waitForFunction(() => {
        let node = [...document.querySelectorAll('[role="option"]')].find((n) => n.textContent === "Plan BBB");
        if (!node) return false;
        for (; node; node = node.parentElement) {
          if (getComputedStyle(node).opacity !== "1" || node.hasAttribute("data-starting-style")) return false;
          if (
            node
              .getAnimations()
              .some(
                (a) =>
                  a.playState === "running" &&
                  a.effect
                    .getKeyframes()
                    .some((f) => ["opacity", "transform", "scale", "translate"].some((p) => p in f)),
              )
          )
            return false;
        }
        return true;
      });
      await page.getByRole("option", { name: "Plan BBB", exact: true }).click();
      await page.waitForTimeout(40);
      assert.equal(await trigger.locator('[data-slot="select-value"]').textContent(), "Plan BBB");
      const flights = await page.locator("[data-cadence-handoff-paint]").count();
      if (effective === "full") {
        assert.equal(flights, 1);
        assert.equal(
          await page.locator("[data-cadence-handoff-paint]").getAttribute("data-cadence-flight-text"),
          "BBB",
        );
      } else assert.equal(flights, 0);
      await page.screenshot({ path: path.join(output, `${mode}-${os}-selection.png`) });
      await page.waitForFunction(() => !document.querySelector("[data-cadence-handoff-paint]"), null, {
        timeout: 10000,
      });
      await content.getByRole("button", { name: "Update labels", exact: true }).click();
      await page.waitForTimeout(35);
      assert.equal(await trigger.locator('[data-slot="select-value"]').textContent(), "Plan B ready");
      const text = await page.locator("[data-cadence-text-layer]").count();
      if (effective !== "none") assert(text > 0);
      else assert.equal(text, 0);
      await page.waitForTimeout(1000);
      await content.getByRole("button", { name: "Change seats", exact: true }).click();
      await page.waitForTimeout(200);
      await content.getByRole("button", { name: "Change seats", exact: true }).click();
      await page.waitForTimeout(40);
      const reels = await page.locator("[data-cadence-reel]").count();
      if (effective === "full") assert(reels > 0);
      else assert.equal(reels, 0);
      await page
        .getByRole("group", { name: "Motion mode" })
        .getByRole("button", { name: "none", exact: true })
        .evaluate((n) => n.click());
      await page.waitForFunction(
        () =>
          document.querySelector('[data-component-example="select/changing-selection"] [data-slot="select-trigger"]')
            ?.dataset.motion === "none",
      );
      assert.equal(
        await page.locator("[data-cadence-handoff-layer],[data-cadence-text-layer],[data-cadence-reel]").count(),
        0,
      );
      assert.deepEqual(errors, []);
      report.cases.push({ mode, os, effective, flights, text, reels, errors });
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
      await page.goto(`${url}/components/select?motion=full&speed=0.25`);
      const content = page.locator('[data-component-example="select/changing-selection"]');
      await content.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => {
        const n = document.querySelector(
          '[data-component-example="select/changing-selection"] [data-slot="select-trigger"]',
        );
        return n && !n.getAnimations().some((a) => a.playState === "running");
      });
      const trigger = content.getByRole("combobox", { name: "Changing plan" });
      await trigger.click();
      await page.waitForFunction(() => {
        let node = [...document.querySelectorAll('[role="option"]')].find((n) => n.textContent === "Plan BBB");
        if (!node) return false;
        for (; node; node = node.parentElement) {
          if (getComputedStyle(node).opacity !== "1" || node.hasAttribute("data-starting-style")) return false;
          if (
            node
              .getAnimations()
              .some(
                (a) =>
                  a.playState === "running" &&
                  a.effect
                    .getKeyframes()
                    .some((f) => ["opacity", "transform", "scale", "translate"].some((p) => p in f)),
              )
          )
            return false;
        }
        return true;
      });
      await page.getByRole("option", { name: "Plan BBB", exact: true }).click();
      await page.waitForTimeout(45);
      assert.equal(await page.locator("[data-cadence-handoff-paint]").count(), 1);
      await page.screenshot({ path: path.join(output, `${theme}-${width}-flight.png`) });
      // Narrow headers intentionally hide the mode toolbar; exercise the public
      // URL setting for the stable audit after recording the actual full flight.
      await page.goto(`${url}/components/select?motion=none`);
      await content.scrollIntoViewIfNeeded();
      await page.waitForFunction(
        () =>
          document.querySelector('[data-component-example="select/changing-selection"]')?.dataset.previewMotion ===
          "none",
      );
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
        const own = page.locator('[data-installation-source="@components/cadence/select/index.tsx"]');
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
  await page.goto(`${url}/components/select`);
  const content = page.locator('[data-component-example="select/changing-selection"]');
  assert.equal(await content.locator('[data-slot="select-value"]').textContent(), "Plan AAA");
  assert((await content.locator('[data-slot="select-trigger"]').boundingBox()).height > 0);
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
