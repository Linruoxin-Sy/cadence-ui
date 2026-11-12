import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";

assert(process.env.ALERT_URL && process.env.ALERT_PRODUCTION && process.env.ALERT_PRODUCTION_OUTPUT);
const output = path.resolve(process.env.ALERT_PRODUCTION_OUTPUT),
  url = process.env.ALERT_URL;
await mkdir(output, { recursive: false });
const hash = (value) => createHash("sha256").update(value).digest("hex");
const report = {
  buildId: (await readFile(path.join(process.env.ALERT_PRODUCTION, "BUILD_ID"), "utf8")).trim(),
  inputs: {},
  cases: [],
  manual: [],
  scripts: [],
  errors: [],
};
for (const file of [
  "registry.json",
  "registry/cadence/alert/index.tsx",
  "registry/cadence/lib/alert-icon.ts",
  "registry/cadence/lib/measured-geometry.ts",
  "registry/cadence/lib/motion-transaction.ts",
  "registry/cadence/lib/text-layout.ts",
  "components/site/measured-height.tsx",
  "registry/cadence/lib/text-presentation.ts",
  "registry/cadence/lib/number-presentation.ts",
  "registry/cadence/lib/css-motion.ts",
  "components/site/previews/alert.tsx",
  "components/site/previews/examples.json",
  "content/components/alert.mdx",
  "public/r/alert.json",
  "tests/runtime/alert-production.mjs",
])
  report.inputs[file] = hash(await readFile(file));
await writeFile(path.join(output, "runner.mjs"), await readFile(new URL(import.meta.url)));
const browser = await chromium.launch({ headless: true });
try {
  for (const theme of ["light", "dark"])
    for (const width of [390, 1280]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, colorScheme: theme }),
        page = await context.newPage();
      const record = { theme, width };
      report.cases.push(record);
      page.on("pageerror", (error) => report.errors.push(error.stack));
      page.on("console", (message) => {
        if (message.type() === "error") report.errors.push(message.text());
      });
      await page.addInitScript(() =>
        Object.defineProperty(navigator, "clipboard", {
          value: {
            writeText: async (text) => {
              window.alertCopied = text;
            },
          },
        }),
      );
      const responses = [];
      page.on("response", (response) => {
        if (response.url().includes("/_next/") && response.url().split("?")[0].endsWith(".js"))
          responses.push(response);
      });
      await page.goto(`${url}/components/alert?motion=full&speed=0.25#changing-messages`);
      await page.waitForLoadState("networkidle");
      await page.evaluate((theme) => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        document.documentElement.dataset.theme = theme;
      }, theme);
      // Capture stable theme paint before exercising the independent content cause.
      await page.waitForTimeout(1100);
      const demo = page.locator('[data-component-example="alert/changing"]');
      await demo.scrollIntoViewIfNeeded();
      const message = demo.locator('[data-slot="alert"]:has(> [data-slot="alert-action"])');
      const quantity = demo.locator('[data-slot="alert"]:not(:has(> [data-slot="alert-action"]))');
      await quantity.locator('[data-slot="alert-number"]').evaluate((node) => (node.id = "production-quantity"));
      await message
        .locator('[data-slot="alert-title"] [data-slot="alert-text"]')
        .evaluate((node) => (node.id = "production-title"));
      await message
        .locator('[data-slot="alert-description"] [data-slot="alert-text"]')
        .evaluate((node) => (node.id = "production-description"));
      const original = await message.elementHandle();
      await demo.getByRole("button", { name: "Update message", exact: true }).click();
      record.messages = await message.evaluate(async (node) => {
        const rows = [];
        for (let i = 0; i < 12; i++) {
          await new Promise(requestAnimationFrame);
          const svg = node.querySelector(":scope > svg"),
            outgoing = node.querySelector('[data-slot="alert-icon-visual"]');
          rows.push({
            title: node.querySelector('[data-slot="alert-title"]').textContent,
            description: node.querySelector('[data-slot="alert-description"]').textContent,
            height: node.getBoundingClientRect().height,
            icon: svg && getComputedStyle(svg).opacity,
            overlay: getComputedStyle(outgoing).opacity,
            copies: outgoing.childElementCount,
            columns: getComputedStyle(node).gridTemplateColumns,
            text: ["production-title", "production-description"].map((id) => ({
              id,
              pixels: [...document.querySelectorAll(`[data-cadence-text-owner="${id}"] canvas`)].map((canvas) => ({
                opacity: +getComputedStyle(canvas).opacity,
                ink: canvas
                  .getContext("2d")
                  .getImageData(0, 0, canvas.width, canvas.height)
                  .data.some((v, i) => i % 4 === 3 && v > 0),
              })),
            })),
          });
        }
        return rows;
      });
      assert(record.messages.every((row) => row.title === "Deploy failed" && row.description.includes("ERR_042")));
      for (const id of ["production-title", "production-description"])
        assert(
          record.messages.some((row) =>
            row.text.some(
              (text) =>
                text.id === id && text.pixels.some((pixel) => pixel.ink && pixel.opacity > 0 && pixel.opacity < 1),
            ),
          ),
          `${id} actual production changed glyphs at middle opacity`,
        );
      assert(
        record.messages.some(
          (row) => row.copies === 1 && +row.icon > 0 && +row.icon < 1 && +row.overlay > 0 && +row.overlay < 1,
        ),
        "production icon crossfade has actual middle opacity",
      );
      assert(await message.evaluate((node, before) => node === before, original));
      await demo.getByRole("button", { name: "Add retry" }).click();
      record.reels = await page.evaluate(async () => {
        const rows = [];
        for (let i = 0; i < 14; i++) {
          await new Promise(requestAnimationFrame);
          rows.push(
            [...document.querySelectorAll('[data-cadence-number-owner="production-quantity"] canvas')].map(
              (canvas) => ({
                ink: canvas
                  .getContext("2d")
                  .getImageData(0, 0, canvas.width, canvas.height)
                  .data.some((v, i) => i % 4 === 3 && v > 0),
                transform: getComputedStyle(canvas).transform,
              }),
            ),
          );
        }
        return rows;
      });
      assert(
        record.reels.some((row) => row.some((pixel) => pixel.ink)) &&
          new Set(record.reels.flatMap((row) => row.map((pixel) => pixel.transform))).size > 2,
        "production quantity has actual moving glyph pixels",
      );
      assert.equal(await quantity.locator('[data-slot="alert-description"]').textContent(), "20");
      await page.waitForFunction(() => {
        const root = document.querySelector(
          '[data-component-example="alert/changing"] [data-slot="alert"]:has(> [data-slot="alert-action"])',
        );
        return (
          !document.querySelector('[data-cadence-number-owner="production-quantity"]') &&
          !document.querySelector('[data-cadence-text-owner="production-title"]') &&
          !document.querySelector('[data-cadence-text-owner="production-description"]') &&
          !root.getAnimations().some((animation) => animation.effect.getKeyframes().some((frame) => "height" in frame))
        );
      });
      await demo.getByRole("button", { name: "Update message", exact: true }).evaluate((node) => node.click());
      await demo.getByRole("button", { name: "Add retry", exact: true }).evaluate((node) => node.click());
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const cancellation = () =>
        page.evaluate(() => {
          const demo = document.querySelector('[data-component-example="alert/changing"]'),
            root = demo.querySelector('[data-slot="alert"]:has(> [data-slot="alert-action"])');
          const paint = (id) =>
            [
              ...document.querySelectorAll(`[data-cadence-text-owner="${id}"],[data-cadence-number-owner="${id}"]`),
            ].reduce((count, layer) => count + layer.querySelectorAll("canvas").length, 0);
          const layer = root.querySelector('[data-slot="alert-icon-visual"]');
          return {
            mode: root.dataset.motion,
            title: root.querySelector('[data-slot="alert-title"]').textContent,
            description: root.querySelector('[data-slot="alert-description"]').textContent,
            quantity: document.getElementById("production-quantity").textContent,
            titlePixels: paint("production-title"),
            descriptionPixels: paint("production-description"),
            numberPixels: paint("production-quantity"),
            icons: layer.childElementCount,
            iconOpacity: +getComputedStyle(root.querySelector(":scope > svg")).opacity,
            height: root.getAnimations().filter((a) => a.effect.getKeyframes().some((frame) => "height" in frame))
              .length,
            running: root
              .getAnimations({ subtree: true })
              .filter((a) => a.playState === "running" && Number(a.effect.getTiming().duration) > 0).length,
            rootColour: getComputedStyle(root).color,
            colourDuration: getComputedStyle(root).transitionDuration,
          };
        });
      record.beforeNone = await cancellation();
      assert(
        record.beforeNone.titlePixels > 0 &&
          record.beforeNone.descriptionPixels > 0 &&
          record.beforeNone.numberPixels > 0 &&
          record.beforeNone.icons === 1 &&
          record.beforeNone.height > 0,
        "each production owner is live before the combined downgrade",
      );
      const mode = async (value) => {
        await page
          .getByRole("group", { name: "Motion mode", includeHidden: true })
          .getByRole("button", { name: value, exact: true, includeHidden: true })
          .evaluate((node) => node.click());
        await page.waitForFunction(
          (value) =>
            document.querySelector('[data-component-example="alert/changing"] [data-slot="alert"]').dataset.motion ===
            value,
          value,
        );
      };
      await mode("none");
      record.none = await cancellation();
      assert.deepEqual(
        [
          record.none.titlePixels,
          record.none.descriptionPixels,
          record.none.numberPixels,
          record.none.icons,
          record.none.height,
          record.none.running,
        ],
        [0, 0, 0, 0, 0, 0],
      );
      assert.equal(record.none.iconOpacity, 1);
      assert.equal(record.none.title, "Deploy pending");
      assert.equal(record.none.description, "Awaiting build result.");
      assert.equal(record.none.quantity, "21");
      assert.equal(record.none.colourDuration, "0s");
      await mode("full");
      record.restored = await cancellation();
      assert.deepEqual(
        [
          record.restored.titlePixels,
          record.restored.descriptionPixels,
          record.restored.numberPixels,
          record.restored.icons,
          record.restored.height,
        ],
        [0, 0, 0, 0, 0],
        "restoring full never replays a settled target",
      );
      await demo.getByRole("button", { name: "Update message", exact: true }).click();
      await page.waitForTimeout(1000);
      await demo.getByRole("button", { name: "Change tone" }).click();
      record.colours = await message.evaluate(async (node) => {
        const rows = [];
        for (let i = 0; i < 8; i++) {
          await new Promise(requestAnimationFrame);
          rows.push({
            colour: getComputedStyle(node).color,
            owners: node.getAnimations().filter((a) => a.transitionProperty === "color").length,
            title: getComputedStyle(node.querySelector('[data-slot="alert-title"]')).color,
            icon: getComputedStyle(node.querySelector(":scope > svg")).color,
            titleOwners: node
              .querySelector('[data-slot="alert-title"]')
              .getAnimations()
              .filter((a) => a.transitionProperty === "color").length,
            descriptionOwners: node
              .querySelector('[data-slot="alert-description"]')
              .getAnimations()
              .filter((a) => a.transitionProperty === "color").length,
          });
        }
        return rows;
      });
      assert(
        new Set(record.colours.map((row) => row.colour)).size > 1 && record.colours.some((row) => row.owners === 1),
        "production tone change has one actual colour writer and middle paint",
      );
      assert(
        record.colours.every(
          (row) =>
            row.title === row.colour &&
            row.icon === row.colour &&
            row.titleOwners === 0 &&
            row.owners <= 1 &&
            row.descriptionOwners <= 1,
        ),
      );
      assert(
        record.colours.some((row) => row.descriptionOwners === 1),
        "production independent description has its own colour writer",
      );
      await mode("none");
      record.colourNone = await cancellation();
      assert.equal(record.colourNone.running, 0);
      assert.equal(record.colourNone.colourDuration, "0s");
      await mode("full");
      await demo.getByRole("button", { name: "Hide message" }).click();
      await message.waitFor({ state: "detached" });
      await demo.getByRole("button", { name: "Show message" }).click();
      assert.equal(await message.locator('[data-slot="alert-title"]').textContent(), "Deploy failed");
      await page.waitForTimeout(1000);
      const screenshot = `${theme}-${width}.png`;
      await demo.screenshot({ path: path.join(output, screenshot) });
      record.screenshot = screenshot;
      if (theme === "light") {
        const manual = page.getByRole("tab", { name: "Manual", exact: true });
        await manual.click();
        const copied = [];
        for (const file of [
          "alert/index.tsx",
          "lib/alert-icon.ts",
          "lib/measured-geometry.ts",
          "lib/provider.tsx",
          "lib/use-text-presentation.ts",
          "lib/use-number-presentation.ts",
          "lib/surface-presence.ts",
          "lib/css-motion.ts",
        ]) {
          const block = page.locator(`[data-installation-source="@components/cadence/${file}"]`);
          await block.getByRole("button", { name: "Copy", exact: true }).click();
          assert.equal(
            (await page.evaluate(() => window.alertCopied)).replaceAll("\r\n", "\n"),
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
      await context.close();
    }
  assert.equal(
    hash(new Uint8Array(await (await fetch(`${url}/r/alert.json`)).arrayBuffer())),
    report.inputs["public/r/alert.json"],
  );
  assert.deepEqual(report.errors, []);
  report.observedPageJSGzip = report.scripts.reduce((sum, item) => sum + item.gzip, 0);
  report.passed = true;
} catch (error) {
  report.failure = error.stack;
  throw error;
} finally {
  await browser.close();
  await writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2));
}
console.log(
  JSON.stringify({
    passed: report.passed,
    cases: report.cases.length,
    buildId: report.buildId,
    pageJSGzip: report.observedPageJSGzip,
  }),
);
