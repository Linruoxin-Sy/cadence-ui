import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { chromium } from "@playwright/test";

assert(process.env.LABEL_URL && process.env.LABEL_SITE_OUTPUT && process.env.CADENCE_DIST_DIR);
const output = path.resolve(process.env.LABEL_SITE_OUTPUT),
  url = process.env.LABEL_URL;
await mkdir(output, { recursive: false });
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const report = {
  buildId: (await readFile(path.join(process.env.CADENCE_DIST_DIR, "BUILD_ID"), "utf8")).trim(),
  inputs: {},
  cases: [],
  errors: [],
  scripts: [],
  manual: [],
};
for (const file of [
  "registry/cadence/label/index.tsx",
  "registry/cadence/lib/label-layout.ts",
  "registry/cadence/lib/measured-geometry.ts",
  "registry/cadence/lib/inline-entrance.ts",
  "components/site/previews/label.tsx",
  "content/components/label.mdx",
  "public/r/label.json",
  "registry.json",
  "tests/runtime/label-production.mjs",
])
  report.inputs[file] = hash(await readFile(file));
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
      await page.goto(`${url}/components/label?motion=full&speed=0.25#changing-names-and-quantities`);
      await page.waitForLoadState("networkidle");
      await page.evaluate((theme) => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        document.documentElement.dataset.theme = theme;
      }, theme);
      const demo = page.locator('[data-component-example="label/changing"]');
      await demo.scrollIntoViewIfNeeded();
      await page.waitForTimeout(650);
      const input = demo.getByRole("textbox");
      await input.fill("review@example.com");
      const take = () =>
        demo.evaluate(async (node) => {
          const rows = [];
          for (let i = 0; i < 18; i++) {
            await new Promise(requestAnimationFrame);
            const label = node.querySelector("[data-slot=label]"),
              text = label.querySelector("[data-slot=label-text]");
            const key = text.getAttribute("data-cadence-layout-anchor");
            const paint = key
              ? [...document.querySelectorAll("[data-cadence-text-layer]")].filter((layer) =>
                  layer.style.left.includes(`anchor(--cadence-display-${key} left)`),
                ).length
              : 0;
            const quantity = node.querySelector("[data-slot=label-number]").getAttribute("data-cadence-layout-anchor");
            const reels = quantity
              ? [...document.querySelectorAll("[data-cadence-number-layer]")].filter((layer) =>
                  layer.style.left.includes(`anchor(--cadence-display-${quantity} left)`),
                ).length
              : 0;
            rows.push({
              text: label.textContent,
              width: label.getBoundingClientRect().width,
              paint,
              reels,
              frames: label.getAnimations().map((a) => a.effect.getKeyframes()),
            });
          }
          return rows;
        });
      await demo.getByRole("button", { name: "Rename field" }).click();
      const grow = await take();
      await page.screenshot({ path: path.join(output, `${theme}-${width}-page.png`), fullPage: true });
      await demo.getByRole("button", { name: "Rename field" }).click();
      const shrink = await take();
      assert(grow.some((f) => f.paint) || shrink.some((f) => f.paint), "production exact label paints changed runs");
      assert(new Set(shrink.map((f) => f.width)).size > 2, "production label size has real middle frames");
      assert(
        shrink.some((f) => f.paint && f.frames.length),
        "production same-label text and geometry coexist",
      );
      await demo.getByRole("button", { name: "Change quantity" }).click();
      const quantity = await take();
      assert(
        quantity.some((f) => f.reels > 0),
        "production exact numeric label rolls",
      );
      await demo.screenshot({ path: path.join(output, `${theme}-${width}-demo.png`) });
      await page
        .getByRole("group", { name: "Motion mode", includeHidden: true })
        .getByRole("button", { name: "none", exact: true, includeHidden: true })
        .evaluate((node) => node.click());
      assert.equal(await demo.evaluate((node) => node.getAnimations({ subtree: true }).length), 0);
      assert.equal(await demo.locator("[data-cadence-layout-anchor]").count(), 0);
      assert.equal(await input.inputValue(), "review@example.com");
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
        "narrow layout has no new horizontal overflow",
      );
      if (theme === "light") {
        await context.grantPermissions(["clipboard-read", "clipboard-write"]);
        await page
          .locator("[data-installation]")
          .getByRole("tablist", { name: "Installation method" })
          .getByRole("tab", { name: "Manual", exact: true })
          .click();
        const copied = [];
        for (const file of [
          "label/index.tsx",
          "lib/label-layout.ts",
          "lib/measured-geometry.ts",
          "lib/inline-entrance.ts",
        ]) {
          const block = page.locator(`[data-installation-source="@components/cadence/${file}"]`);
          await block.getByRole("button", { name: "Copy", exact: true }).click();
          const actual = (await page.evaluate(() => navigator.clipboard.readText())).replaceAll("\r\n", "\n");
          assert.equal(actual, (await readFile(`registry/cadence/${file}`, "utf8")).replaceAll("\r\n", "\n"));
          copied.push(file);
        }
        report.manual.push({ width, copied });
      }
      if (theme === "light" && width === 1280)
        for (const response of scripts) {
          const bytes = await response.body();
          report.scripts.push({ url: response.url(), sha: hash(bytes), gzip: gzipSync(bytes).length });
        }
      report.cases.push({ theme, width, grow, shrink, quantity });
      await context.close();
    }
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${url}/components/label`);
  const top = page.locator("[data-preview=label]");
  await top.getByText("Email", { exact: true }).click();
  assert(await top.getByRole("textbox", { name: "Email", exact: true }).evaluate((n) => n === document.activeElement));
  const wrapping = page.locator('[data-component-example="label/wrapping"]');
  await wrapping.getByText("Email me about releases").click();
  assert.equal(await wrapping.getByRole("checkbox").isChecked(), false);
  report.noJS = true;
  await context.close();
  assert.equal(
    hash(new Uint8Array(await (await fetch(`${url}/r/label.json`)).arrayBuffer())),
    report.inputs["public/r/label.json"],
  );
  assert.deepEqual(report.errors, []);
  report.observedPageJSGzip = report.scripts.reduce((sum, item) => sum + item.gzip, 0);
} finally {
  await browser.close();
  await writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2));
}
console.log(
  JSON.stringify({
    buildId: report.buildId,
    cases: report.cases.length,
    noJS: report.noJS,
    errors: report.errors,
    pageJSGzip: report.observedPageJSGzip,
  }),
);
