import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";

assert(process.env.SEPARATOR_URL && process.env.SEPARATOR_SITE_OUTPUT && process.env.CADENCE_DIST_DIR);
const output = path.resolve(process.env.SEPARATOR_SITE_OUTPUT),
  url = process.env.SEPARATOR_URL;
await mkdir(output, { recursive: false });
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const report = {
  buildId: (await readFile(path.join(process.env.CADENCE_DIST_DIR, "BUILD_ID"), "utf8")).trim(),
  inputs: {},
  cases: [],
  errors: [],
  manual: [],
  scripts: [],
};
for (const file of [
  "registry.json",
  "registry/cadence/separator/index.tsx",
  "registry/cadence/lib/separator-layout.ts",
  "registry/cadence/lib/inline-presence.ts",
  "registry/cadence/lib/measured-geometry.ts",
  "components/site/previews/separator.tsx",
  "content/components/separator.mdx",
  "public/r/separator.json",
  "tests/runtime/separator-production.mjs",
])
  report.inputs[file] = hash(await readFile(file));
const browser = await chromium.launch({ headless: true });
try {
  for (const theme of ["light", "dark"])
    for (const width of [390, 1280]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, colorScheme: theme });
      const page = await context.newPage();
      page.on("pageerror", (error) => report.errors.push(String(error)));
      const responses = [];
      page.on("response", (response) => {
        if (response.url().includes("/_next/") && response.url().split("?")[0].endsWith(".js"))
          responses.push(response);
      });
      await page.goto(`${url}/components/separator?motion=full&speed=0.25#changing-a-boundary`);
      await page.waitForLoadState("networkidle");
      await page.evaluate((theme) => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        document.documentElement.dataset.theme = theme;
      }, theme);
      const demo = page.locator('[data-component-example="separator/changing"]');
      await demo.scrollIntoViewIfNeeded();
      const rule = demo.locator('[data-slot="separator"]');
      const sample = () =>
        rule.evaluate(async (node) => {
          const result = [];
          for (let i = 0; i < 12; i++) {
            await new Promise(requestAnimationFrame);
            const css = getComputedStyle(node),
              box = node.getBoundingClientRect();
            result.push({
              width: box.width,
              height: box.height,
              opacity: css.opacity,
              colour: css.backgroundColor,
              effects: node
                .getAnimations()
                .map((a) => ({ property: a.transitionProperty, frames: a.effect.getKeyframes() })),
            });
          }
          return result;
        });
      await demo.getByRole("button", { name: "Change length" }).click();
      const grow = await sample();
      assert(
        grow.some((f) => f.width > 80 && f.width < 160),
        "production definite length has middle frames",
      );
      await demo.getByRole("button", { name: "Change colour" }).click();
      const colour = await sample();
      assert(
        colour.some((f) => f.effects.some((a) => a.property === "background-color")),
        "production scoped colour clock",
      );
      await demo.getByRole("button", { name: "Change orientation" }).click();
      const replace = await sample();
      assert(replace.every((f) => f.width === 1 && f.height === 160));
      assert(
        replace.some((f) => Number(f.opacity) > 0 && Number(f.opacity) < 1),
        "production orientation fades",
      );
      await demo.screenshot({ path: path.join(output, `${theme}-${width}-demo.png`) });
      await page.screenshot({ path: path.join(output, `${theme}-${width}-page.png`), fullPage: true });
      await page
        .getByRole("group", { name: "Motion mode", includeHidden: true })
        .getByRole("button", { name: "none", exact: true, includeHidden: true })
        .evaluate((n) => n.click());
      assert.equal(await rule.evaluate((n) => n.getAnimations().length), 0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      if (theme === "light") {
        await context.grantPermissions(["clipboard-read", "clipboard-write"]);
        await page
          .locator("[data-installation]")
          .getByRole("tablist", { name: "Installation method" })
          .getByRole("tab", { name: "Manual", exact: true })
          .click();
        const copied = [];
        for (const file of [
          "separator/index.tsx",
          "lib/separator-layout.ts",
          "lib/inline-presence.ts",
          "lib/measured-geometry.ts",
        ]) {
          const block = page.locator(`[data-installation-source="@components/cadence/${file}"]`);
          await block.getByRole("button", { name: "Copy", exact: true }).click();
          assert.equal(
            (await page.evaluate(() => navigator.clipboard.readText())).replaceAll("\r\n", "\n"),
            (await readFile(`registry/cadence/${file}`, "utf8")).replaceAll("\r\n", "\n"),
          );
          copied.push(file);
        }
        report.manual.push({ width, copied });
      }
      if (theme === "light" && width === 1280) {
        const axe = await new AxeBuilder({ page }).analyze();
        assert.deepEqual(
          axe.violations.map((v) => v.id),
          [],
        );
        report.axe = [];
        for (const response of responses) {
          const bytes = await response.body();
          report.scripts.push({ url: response.url(), sha: hash(bytes), gzip: gzipSync(bytes).length });
        }
      }
      report.cases.push({ theme, width, grow, colour, replace });
      await context.close();
    }
  assert.equal(
    hash(new Uint8Array(await (await fetch(`${url}/r/separator.json`)).arrayBuffer())),
    report.inputs["public/r/separator.json"],
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
    errors: report.errors,
    pageJSGzip: report.observedPageJSGzip,
  }),
);
