import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { chromium } from "@playwright/test";

assert(process.env.KBD_URL && process.env.KBD_SITE_OUTPUT && process.env.CADENCE_DIST_DIR);
const output = path.resolve(process.env.KBD_SITE_OUTPUT),
  url = process.env.KBD_URL;
await mkdir(output, { recursive: false });
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const report = {
  buildId: (await readFile(path.join(process.env.CADENCE_DIST_DIR, "BUILD_ID"), "utf8")).trim(),
  inputs: {},
  cases: [],
  errors: [],
  scripts: [],
};
for (const file of [
  "registry/cadence/kbd/index.tsx",
  "registry/cadence/lib/kbd-layout.ts",
  "registry/cadence/lib/inline-presence.ts",
  "components/site/previews/kbd.tsx",
  "content/components/kbd.mdx",
  "public/r/kbd.json",
  "public/r/registry.json",
  "registry.json",
  "tests/runtime/kbd-production.mjs",
])
  report.inputs[file] = hash(await readFile(file));
await writeFile(path.join(output, "runner.mjs"), await readFile(new URL(import.meta.url)));
const browser = await chromium.launch({ headless: true });
try {
  for (const theme of ["light", "dark"])
    for (const width of [390, 1280]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, colorScheme: theme });
      const page = await context.newPage();
      page.on("pageerror", (error) => report.errors.push(String(error)));
      const scripts = [];
      page.on("response", (response) => {
        if (response.url().includes("/_next/") && response.url().split("?")[0].endsWith(".js")) scripts.push(response);
      });
      await page.goto(`${url}/components/kbd?motion=full&speed=0.25#changing-shortcuts`);
      await page.waitForLoadState("networkidle");
      await page.evaluate((theme) => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        document.documentElement.dataset.theme = theme;
      }, theme);
      const demo = page.locator('[data-component-example="kbd/changing"]');
      await demo.scrollIntoViewIfNeeded();
      await page.waitForFunction(
        () =>
          ![...document.querySelectorAll('[data-component-example="kbd/changing"]')].some((node) => {
            for (let current = node; current; current = current.parentElement)
              if (current.getAnimations().some((a) => a.playState === "running")) return true;
            return false;
          }),
      );
      await demo.getByRole("button", { name: "Change platform labels" }).click();
      const grow = await demo.evaluate(async (node) => {
        const rows = [];
        for (let i = 0; i < 14; i++) {
          await new Promise(requestAnimationFrame);
          rows.push({
            labels: [...node.querySelectorAll("[data-slot=kbd]")].map((key) => key.textContent),
            canvas: document.querySelectorAll("[data-cadence-text-kind]").length,
            geometry: node.getAnimations({ subtree: true }).map((a) => a.effect.getKeyframes()),
            width: node.querySelector("[data-slot=kbd-group]").getBoundingClientRect().width,
          });
        }
        return rows;
      });
      await page.screenshot({ path: path.join(output, `${theme}-${width}-middle.png`), fullPage: true });
      await page.waitForTimeout(750);
      await demo.getByRole("button", { name: "Change platform labels" }).click();
      const shrink = await demo.evaluate(async (node) => {
        const rows = [];
        for (let i = 0; i < 12; i++) {
          await new Promise(requestAnimationFrame);
          rows.push({
            canvas: document.querySelectorAll("[data-cadence-text-kind]").length,
            width: node.querySelector("[data-slot=kbd-group]").getBoundingClientRect().width,
          });
        }
        return rows;
      });
      assert(
        grow.some((row) => row.canvas > 0) || shrink.some((row) => row.canvas > 0),
        "production changed labels must paint",
      );
      assert(
        Math.max(...shrink.map((row) => row.width)) - Math.min(...shrink.map((row) => row.width)) > 1,
        "production chord resize has genuine middle frames",
      );
      const trigger = demo.getByRole("button", { name: "Inspect changing shortcut" });
      await trigger.focus();
      await page.keyboard.press("Tab");
      await page.keyboard.press("Shift+Tab");
      await page.getByRole("tooltip").waitFor();
      await page.waitForTimeout(750);
      await demo.getByRole("button", { name: "Change platform labels" }).evaluate((node) => node.click());
      await page.waitForTimeout(70);
      await page.screenshot({ path: path.join(output, `${theme}-${width}-tooltip.png`), fullPage: true });
      const tooltip = await page.getByRole("tooltip").evaluate((node) => ({
        text: node.textContent,
        box: node.getBoundingClientRect().toJSON(),
        keys: [...node.querySelectorAll("[data-slot=kbd]")].map((key) => ({
          box: key.getBoundingClientRect().toJSON(),
          text: key.textContent,
        })),
        geometry: node.getAnimations({ subtree: true }).map((a) => a.effect.getKeyframes()),
      }));
      assert(
        tooltip.keys.every((key) => key.box.left >= tooltip.box.left && key.box.right <= tooltip.box.right + 1),
        "popup consumes one final allocation",
      );
      await page
        .getByRole("group", { name: "Motion mode", includeHidden: true })
        .getByRole("button", { name: "none", exact: true, includeHidden: true })
        .evaluate((node) => node.click());
      assert.equal(await demo.evaluate((node) => node.getAnimations({ subtree: true }).length), 0);
      await page.keyboard.press("Escape");
      await page.getByRole("tooltip").waitFor({ state: "detached" });
      if (theme === "light") {
        await context.grantPermissions(["clipboard-read", "clipboard-write"]);
        const methods = page.locator("[data-installation]").getByRole("tablist", { name: "Installation method" });
        await methods.getByRole("tab", { name: "Manual", exact: true }).click();
        const copied = [];
        for (const file of ["kbd/index.tsx", "lib/kbd-layout.ts", "lib/inline-entrance.ts", "lib/inline-presence.ts"]) {
          const block = page.locator(`[data-installation-source="@components/cadence/${file}"]`);
          await block.getByRole("button", { name: "Copy", exact: true }).click();
          const actual = (await page.evaluate(() => navigator.clipboard.readText())).replaceAll("\r\n", "\n");
          assert.equal(actual, await readFile(`registry/cadence/${file}`, "utf8"));
          copied.push(file);
        }
        report.manual ??= [];
        report.manual.push({ width, copied });
      }
      if (theme === "light" && width === 1280)
        for (const response of scripts) {
          const bytes = await response.body();
          report.scripts.push({ url: response.url(), sha: hash(bytes), gzip: gzipSync(bytes).length });
        }
      report.cases.push({ theme, width, grow, shrink, tooltip });
      await context.close();
    }
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${url}/components/kbd`);
  assert.equal(await page.locator("[data-preview=kbd] [data-slot=kbd]").first().textContent(), "Esc");
  assert(await page.locator("[data-preview=kbd]").isVisible());
  report.noJS = true;
  await context.close();
  const remote = await fetch(`${url}/r/kbd.json`);
  assert.equal(hash(new Uint8Array(await remote.arrayBuffer())), report.inputs["public/r/kbd.json"]);
  assert.deepEqual(report.errors, []);
  report.observedPageJSGzip = report.scripts.reduce((sum, item) => sum + item.gzip, 0);
} finally {
  await browser.close();
  await writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2));
}
console.log(
  JSON.stringify({
    cases: report.cases.length,
    noJS: report.noJS,
    errors: report.errors,
    buildId: report.buildId,
    pageJSGzip: report.observedPageJSGzip,
  }),
);
