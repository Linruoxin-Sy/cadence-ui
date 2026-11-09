import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";

assert(process.env.BADGE_SITE_OUTPUT && process.env.CADENCE_DIST_DIR && process.env.BADGE_URL);
const output = path.resolve(process.env.BADGE_SITE_OUTPUT);
await mkdir(output, { recursive: true });
const url = process.env.BADGE_URL;
const hash = (v) => createHash("sha256").update(v).digest("hex");
const report = {
  buildId: (await readFile(path.join(process.env.CADENCE_DIST_DIR, "BUILD_ID"), "utf8")).trim(),
  url,
  cases: [],
  errors: [],
  inputs: {},
  resources: {},
};
for (const f of [
  "registry/cadence/badge/index.tsx",
  "registry/cadence/lib/text-layout.ts",
  "components/site/previews/badge.tsx",
  "content/components/badge.mdx",
  "public/r/badge.json",
])
  report.inputs[f] = hash(await readFile(f));
await writeFile(path.join(output, "runner.mjs"), await readFile(new URL(import.meta.url)));
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  for (const os of ["no-preference", "reduce"])
    for (const mode of ["full", "reduced", "none"]) {
      const context = await browser.newContext({ reducedMotion: os, viewport: { width: 1280, height: 960 } });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.stack));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      await page.goto(`${url}/components/badge?motion=${mode}&speed=0.25`);
      const content = page.locator('[data-component-example="badge/changing-content"]');
      const effective = mode === "none" ? "none" : os === "reduce" ? "reduced" : mode;
      await page.waitForFunction(
        (m) => document.querySelector('[data-component-example="badge/changing-content"]')?.dataset.previewMotion === m,
        effective,
      );
      await page.waitForFunction(
        () =>
          document
            .querySelector('[data-component-example="badge/changing-content"] [data-slot="badge"]')
            ?.style.getPropertyValue("--cadence-time-scale") === "4",
      );
      await content.scrollIntoViewIfNeeded();
      assert.equal(await content.locator('[data-slot="badge"]').nth(0).textContent(), "Status retry");
      await content.getByRole("button", { name: "Change status", exact: true }).click();
      await page.waitForTimeout(35);
      assert.equal(await content.locator('[data-slot="badge"]').nth(0).textContent(), "Status ready");
      const text = await page.locator("[data-cadence-text-layer] canvas").count();
      if (effective !== "none") assert(text > 0, "production Badge must draw changed status pixels");
      else assert.equal(text, 0);
      await content.getByRole("button", { name: "Increase quantity", exact: true }).click();
      await page.waitForTimeout(35);
      assert.equal(await content.locator('[data-slot="badge"]').nth(1).textContent(), "20");
      const reels = await page.locator("[data-cadence-reel]").count();
      if (effective === "full") assert(reels > 0, "production Badge must draw compact quantity reels");
      else assert.equal(reels, 0);
      await content.screenshot({ path: path.join(output, `${os}-${mode}-content.png`) });
      const presence = page.locator('[data-component-example="badge/presence"]');
      await presence.getByRole("button", { name: "Toggle status", exact: true }).click();
      const badge = presence.locator('[data-slot="badge"]');
      await badge.waitFor();
      await page.waitForTimeout(25);
      const entering = await badge.evaluate((n) =>
        n.getAnimations().map((a) => ({ state: a.playState, frames: a.effect.getKeyframes() })),
      );
      if (effective !== "none") assert(entering.some((a) => a.state === "running"));
      await presence.getByRole("button", { name: "Toggle status", exact: true }).click();
      const exiting = await presence
        .locator("[data-ending-style]")
        .evaluateAll((ns) => ns.map((n) => ({ inert: n.inert, hidden: n.getAttribute("aria-hidden") })));
      if (effective !== "none") assert(exiting.some((n) => n.inert && n.hidden === "true"));
      await presence.locator("[data-ending-style]").waitFor({ state: "detached" });
      const icons = page.locator('[data-component-example="badge/icon"]');
      assert.equal(await icons.locator('[data-slot="badge"] > svg').count(), 3);
      const link = page.locator('[data-component-example="badge/link"]').getByRole("link", { name: "3 releases" });
      await link.focus();
      assert(await link.evaluate((n) => n === document.activeElement));
      await link.press("Enter");
      await page.waitForURL(/\/docs\/changelog$/);
      assert.deepEqual(errors, []);
      report.cases.push({ mode, os, effective, text, reels, entering, exiting, errors });
      await context.close();
    }
  for (const width of [390, 1280])
    for (const theme of ["light", "dark"]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 } });
      await context.addInitScript((t) => localStorage.setItem("cadence-theme", t), theme);
      const page = await context.newPage();
      await page.goto(`${url}/components/badge?motion=none`);
      const content = page.locator('[data-component-example="badge/changing-content"]');
      await content.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await content.screenshot({ path: path.join(output, `${theme}-${width}-content.png`) });
      const violations = (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
        .violations;
      assert.deepEqual(violations, []);
      report.cases.push({ width, theme, overflow: false, axe: 0 });
      await context.close();
    }
  const copyContext = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"] });
  const copyPage = await copyContext.newPage();
  await copyPage.goto(`${url}/components/badge?motion=none`);
  await copyPage.locator("[data-installation]").getByRole("tab", { name: "Manual", exact: true }).click();
  const block = copyPage.locator('[data-installation-source="@components/cadence/badge/index.tsx"]');
  await block.getByRole("button", { name: "Copy", exact: true }).click();
  const copied = await copyPage.evaluate(() => navigator.clipboard.readText());
  const payload = JSON.parse(await readFile("public/r/badge.json", "utf8"));
  assert.equal(copied.replaceAll("\r\n", "\n"), payload.files[0].content);
  report.updatedSourceCopy = { target: payload.files[0].target, sha: hash(copied.replaceAll("\r\n", "\n")) };
  await copyContext.close();
  const noJS = await browser.newContext({ javaScriptEnabled: false });
  const page = await noJS.newPage();
  await page.goto(`${url}/components/badge`);
  const content = page.locator('[data-component-example="badge/changing-content"]');
  assert.equal(await content.locator('[data-slot="badge"]').nth(0).textContent(), "Status retry");
  assert.equal(await content.locator('[data-slot="badge"]').nth(1).textContent(), "19");
  await noJS.close();
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
