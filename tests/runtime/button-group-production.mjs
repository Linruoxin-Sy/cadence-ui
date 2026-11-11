import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";

assert(
  process.env.BUTTON_GROUP_URL && process.env.BUTTON_GROUP_PRODUCTION && process.env.BUTTON_GROUP_PRODUCTION_OUTPUT,
);
const url = process.env.BUTTON_GROUP_URL,
  output = path.resolve(process.env.BUTTON_GROUP_PRODUCTION_OUTPUT);
await mkdir(output, { recursive: false });
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const report = {
  buildId: await readFile(path.join(process.env.BUTTON_GROUP_PRODUCTION, "BUILD_ID"), "utf8"),
  inputs: {},
  cases: [],
  manual: [],
  errors: [],
  scripts: [],
};
for (const file of [
  "registry.json",
  "registry/cadence/button-group/index.tsx",
  "registry/cadence/lib/button-group-layout.ts",
  "registry/cadence/lib/group-member.ts",
  "registry/cadence/button/index.tsx",
  "registry/cadence/lib/measured-geometry.ts",
  "registry/cadence/lib/label-layout.ts",
  "registry/cadence/lib/text-layout.ts",
  "registry/cadence/lib/text-presentation.ts",
  "registry/cadence/lib/css-motion.ts",
  "registry/cadence/lib/motion-presence.tsx",
  "registry/cadence/lib/motion.ts",
  "components/site/previews/button-group.tsx",
  "components/site/previews/examples.json",
  "content/components/button-group.mdx",
  "public/r/button-group.json",
  "tests/runtime/button-group-production.mjs",
])
  report.inputs[file] = hash(await readFile(file));
const browser = await chromium.launch({ headless: true });
try {
  for (const theme of ["light", "dark"])
    for (const width of [390, 1280]) {
      const record = { theme, width };
      report.cases.push(record);
      const context = await browser.newContext({ viewport: { width, height: 1000 }, colorScheme: theme });
      const page = await context.newPage();
      page.on("pageerror", (error) => report.errors.push(String(error)));
      await page.addInitScript(() =>
        Object.defineProperty(navigator, "clipboard", {
          value: {
            writeText: async (text) => {
              window.buttonGroupCopied = text;
            },
          },
        }),
      );
      const responses = [];
      page.on("response", (response) => {
        if (response.url().includes("/_next/") && response.url().split("?")[0].endsWith(".js"))
          responses.push(response);
      });
      await page.goto(`${url}/components/button-group?motion=full&speed=0.25#changing-joined-actions`);
      await page.waitForLoadState("networkidle");
      await page.evaluate((theme) => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        document.documentElement.dataset.theme = theme;
      }, theme);
      const demo = page.locator('[data-component-example="button-group/changing"]');
      await demo.scrollIntoViewIfNeeded();
      const group = demo.getByRole("group", { name: "Document actions" }),
        outputNode = await group.getByLabel("Pages", { exact: true }).elementHandle();
      await group.locator("[data-slot=button-group-number]").evaluate((node) => (node.id = "production-number"));
      await group
        .getByLabel("Document status")
        .locator("[data-slot=button-group-label]")
        .evaluate((node) => (node.id = "production-text"));
      const painted = async (kind) =>
        page.evaluate(async (kind) => {
          const result = [];
          for (let i = 0; i < 14; i++) {
            await new Promise(requestAnimationFrame);
            result.push(
              [...document.querySelectorAll(`[data-cadence-${kind}-owner="production-${kind}"] canvas`)].map(
                (canvas) => ({
                  ink: canvas
                    .getContext("2d")
                    .getImageData(0, 0, canvas.width, canvas.height)
                    .data.some((value, index) => index % 4 === 3 && value > 0),
                  opacity: Number(getComputedStyle(canvas).opacity),
                  transform: getComputedStyle(canvas).transform,
                }),
              ),
            );
          }
          return result;
        }, kind);
      await group.getByRole("button", { name: "More", exact: true }).click();
      const frames = await group.evaluate(async (node) => {
        const result = [];
        for (let i = 0; i < 14; i++) {
          await new Promise(requestAnimationFrame);
          result.push({
            width: node.getBoundingClientRect().width,
            effects: node.getAnimations({ subtree: true }).map((a) => ({
              target: a.effect.target.dataset.slot,
              frames: a.effect.getKeyframes(),
              duration: a.effect.getTiming().duration,
            })),
          });
        }
        return result;
      });
      record.frames = frames;
      assert(
        new Set(frames.map((row) => row.width)).size > 2,
        "production focused action has true geometry intermediates",
      );
      // Reels retain their stricter stable-ancestor preflight. Prove this
      // independent quantity action after the preceding membership flight.
      await page.waitForFunction(
        (node) =>
          !node
            .getAnimations({ subtree: true })
            .some((animation) =>
              animation.effect
                .getKeyframes()
                .some((frame) => "width" in frame || "height" in frame || "transform" in frame),
            ),
        await group.elementHandle(),
      );
      await group.getByRole("button", { name: "Copy", exact: true }).click();
      const numberPaint = await painted("number");
      record.numberPaint = numberPaint;
      assert(
        numberPaint.some((frame) => frame.some((pixel) => pixel.ink)) &&
          new Set(numberPaint.flatMap((frame) => frame.map((pixel) => pixel.transform))).size > 2,
        "production quantity paints actual pixels at distinct reel offsets",
      );
      await group.getByLabel("Pages", { exact: true }).filter({ hasText: "100" }).waitFor();
      assert(
        await group.getByLabel("Pages", { exact: true }).evaluate((node, original) => node === original, outputNode),
      );
      await group.getByRole("button", { name: "Save", exact: true }).click();
      const textPaint = await painted("text");
      record.textPaint = textPaint;
      assert(
        textPaint.some((frame) => frame.some((pixel) => pixel.ink && pixel.opacity > 0 && pixel.opacity < 1)),
        "production owned status paints actual intermediate changed-text opacity",
      );
      await group.getByRole("button", { name: "Saved", exact: true }).waitFor();
      assert.equal(await group.locator("[aria-pressed],[aria-selected],[data-slot*=indicator]").count(), 0);
      const screenshot = path.join(output, `${theme}-${width}-demo.png`);
      await demo.screenshot({ path: screenshot });
      await page.screenshot({ path: path.join(output, `${theme}-${width}-page.png`), fullPage: true });
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
        "no page horizontal overflow",
      );
      await page
        .getByRole("group", { name: "Motion mode", includeHidden: true })
        .getByRole("button", { name: "none", exact: true, includeHidden: true })
        .evaluate((node) => node.click());
      assert.equal(await group.getAttribute("data-motion"), "none");
      assert.equal(
        await group.evaluate(
          (node) =>
            node
              .getAnimations({ subtree: true })
              .filter((a) => a.playState === "running" && Number(a.effect.getTiming().duration) > 0).length,
        ),
        0,
      );
      if (theme === "light") {
        await page
          .locator("[data-installation]")
          .getByRole("tablist", { name: "Installation method" })
          .getByRole("tab", { name: "Manual", exact: true })
          .click();
        const copied = [];
        for (const file of [
          "button-group/index.tsx",
          "lib/button-group-layout.ts",
          "lib/group-member.ts",
          "lib/measured-geometry.ts",
          "lib/label-layout.ts",
          "lib/kbd-layout.ts",
          "lib/inline-presence.ts",
          "separator/index.tsx",
        ]) {
          const block = page.locator(`[data-installation-source="@components/cadence/${file}"]`);
          await block.getByRole("button", { name: "Copy", exact: true }).click();
          assert.equal(
            (await page.evaluate(() => window.buttonGroupCopied)).replaceAll("\r\n", "\n"),
            (await readFile(`registry/cadence/${file}`, "utf8")).replaceAll("\r\n", "\n"),
          );
          copied.push(file);
        }
        report.manual.push({ width, copied });
      }
      if (theme === "light" && width === 1280) {
        const axe = await new AxeBuilder({ page }).analyze();
        assert.deepEqual(
          axe.violations.map((row) => row.id),
          [],
        );
        report.axe = [];
        for (const response of responses) {
          const bytes = await response.body();
          report.scripts.push({ url: response.url(), sha: hash(bytes), gzip: gzipSync(bytes).length });
        }
      }
      record.screenshot = screenshot;
      await context.close();
    }
  assert.equal(
    hash(new Uint8Array(await (await fetch(`${url}/r/button-group.json`)).arrayBuffer())),
    report.inputs["public/r/button-group.json"],
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
