import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";

assert(process.env.EMPTY_URL && process.env.EMPTY_PRODUCTION && process.env.EMPTY_PRODUCTION_OUTPUT);
const output = path.resolve(process.env.EMPTY_PRODUCTION_OUTPUT),
  url = process.env.EMPTY_URL;
await mkdir(output, { recursive: false });
const hash = (value) => createHash("sha256").update(value).digest("hex");
const report = {
  buildId: (await readFile(path.join(process.env.EMPTY_PRODUCTION, "BUILD_ID"), "utf8")).trim(),
  inputs: {},
  cases: [],
  manual: [],
  scripts: [],
  errors: [],
};
for (const file of [
  "registry.json",
  "registry/cadence/empty/index.tsx",
  "registry/cadence/lib/empty-media.ts",
  "registry/cadence/lib/measured-geometry.ts",
  "registry/cadence/lib/text-layout.ts",
  "registry/cadence/lib/text-presentation.ts",
  "registry/cadence/lib/number-presentation.ts",
  "registry/cadence/lib/css-motion.ts",
  "components/site/previews/empty.tsx",
  "components/site/previews/examples.json",
  "content/components/empty.mdx",
  "public/r/empty.json",
  "tests/runtime/empty-production.mjs",
])
  report.inputs[file] = hash(await readFile(file));
await writeFile(path.join(output, "runner.mjs"), await readFile(new URL(import.meta.url)));
const browser = await chromium.launch({ headless: true });
const sample = (page) =>
  page.evaluate(() => {
    const demo = document.querySelector('[data-component-example="empty/changing"]'),
      root = demo.querySelector('[data-slot="empty"]');
    const parts = ["production-title", "production-description", "production-quantity"];
    const pixels = Object.fromEntries(
      parts.map((id) => [
        id,
        [...document.querySelectorAll(`[data-cadence-text-owner="${id}"],[data-cadence-number-owner="${id}"]`)].flatMap(
          (layer) =>
            [...layer.querySelectorAll("canvas")].map((canvas) => ({
              ink: canvas
                .getContext("2d")
                .getImageData(0, 0, canvas.width, canvas.height)
                .data.some((value, index) => index % 4 === 3 && value > 0),
              opacity: +getComputedStyle(canvas).opacity,
              transform: getComputedStyle(canvas).transform,
            })),
        ),
      ]),
    );
    return {
      pixels,
      height: root.getBoundingClientRect().height,
      media: +getComputedStyle(root.querySelector('[data-slot="empty-icon"]')).opacity,
      title: root.querySelector('[data-slot="empty-title"]').textContent,
      description: root.querySelector('[data-slot="empty-description"]').textContent,
      quantity: document.getElementById("production-quantity").textContent,
      paint: [
        root,
        root.querySelector('[data-slot="empty-icon"]'),
        root.querySelector('[data-slot="empty-title"]'),
        root.querySelector('[data-slot="empty-description"]'),
      ].map((node) => ({
        color: getComputedStyle(node).color,
        bg: getComputedStyle(node).backgroundColor,
        owners: node.getAnimations().filter((a) => a.transitionProperty === "color").length,
      })),
      running: root.getAnimations({ subtree: true }).filter((a) => a.playState === "running").length,
      mode: root.dataset.motion,
    };
  });
const frames = async (page, count = 12) => {
  const values = [];
  for (let i = 0; i < count; i++) {
    await page.evaluate(() => new Promise(requestAnimationFrame));
    values.push(await sample(page));
  }
  return values;
};
try {
  for (const theme of ["light", "dark"])
    for (const width of [390, 1280]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, colorScheme: theme }),
        page = await context.newPage(),
        record = { theme, width };
      report.cases.push(record);
      page.on("pageerror", (error) => report.errors.push(error.stack));
      page.on("console", (message) => {
        if (message.type() === "error") report.errors.push(message.text());
      });
      await page.addInitScript(() =>
        Object.defineProperty(navigator, "clipboard", {
          value: {
            writeText: async (text) => {
              window.emptyCopied = text;
            },
          },
        }),
      );
      const responses = [];
      page.on("response", (response) => {
        if (response.url().includes("/_next/") && response.url().split("?")[0].endsWith(".js"))
          responses.push(response);
      });
      await page.goto(`${url}/components/empty?motion=full&speed=0.25#changing-empty-state`);
      await page.waitForLoadState("networkidle");
      await page.evaluate((theme) => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        document.documentElement.dataset.theme = theme;
      }, theme);
      await page.waitForTimeout(1100);
      const demo = page.locator('[data-component-example="empty/changing"]'),
        message = demo.locator('[data-slot="empty"]').first(),
        quantity = demo.locator('[aria-label="Remaining count"]');
      await demo.scrollIntoViewIfNeeded();
      await message
        .locator('[data-slot="empty-title"] [data-slot="empty-text"]')
        .evaluate((node) => (node.id = "production-title"));
      await message
        .locator('[data-slot="empty-description"] [data-slot="empty-text"]')
        .evaluate((node) => (node.id = "production-description"));
      await quantity.locator('[data-slot="empty-number"]').evaluate((node) => (node.id = "production-quantity"));
      const host = await message.elementHandle();
      record.initial = await sample(page);
      await demo.getByRole("button", { name: "Update empty state", exact: true }).click();
      record.changed = await frames(page);
      const animated = ["production-title", "production-description"].filter((id) =>
        record.changed.some((row) =>
          row.pixels[id].some((pixel) => pixel.ink && pixel.opacity > 0 && pixel.opacity < 1),
        ),
      );
      // One bounded copy transaction per commit: a combined title/description
      // update animates one part and settles the other to its native readout.
      assert(animated.length >= 1, "production current ink on a changed copy part");
      assert(
        new Set(record.changed.map((row) => row.description)).size === 1,
        "production description never shows stale copy",
      );
      const digits = record.changed.flatMap((row) => row.pixels["production-quantity"]);
      assert(
        digits.some((pixel) => pixel.ink) && new Set(digits.map((pixel) => pixel.transform)).size > 2,
        "production moving quantity ink",
      );
      assert(
        record.changed.some((row) => row.media > 0 && row.media < 1),
        "production media middle opacity",
      );
      assert(await message.evaluate((node, before) => node === before, host));
      assert(record.changed.every((row) => row.title === "No archived components" && row.quantity === "20"));
      // Copy settles first, then the measured height retargets; sample that flight.
      const flight = [];
      for (let index = 0; index < 36; index++) {
        await page.waitForTimeout(70);
        flight.push(await sample(page));
      }
      record.heightFlight = flight;
      assert(
        new Set([...record.changed, ...flight].map((row) => row.height)).size > 2,
        "production measured height has intermediate values",
      );
      // Native preview mirror follows the component's single animated height.
      record.geometry = await message.evaluate((node) => ({
        height: node.getBoundingClientRect().height,
        own: node.style.height,
        ancestor: [...(node.parentElement.closest("[data-preview-body]")?.getAnimations() ?? [])].length,
      }));
      await page.waitForFunction(
        () =>
          ![
            ...document.querySelectorAll(
              '[data-cadence-text-owner="production-title"],[data-cadence-text-owner="production-description"],[data-cadence-number-owner="production-quantity"]',
            ),
          ].length,
      );
      record.target = await sample(page);
      await demo.getByRole("button", { name: "Change tone", exact: true }).click();
      record.colours = await frames(page, 8);
      await page.waitForTimeout(700);
      record.colourTarget = await sample(page);
      for (const index of [0, 1, 2, 3])
        assert(
          record.colours.some(
            (row) =>
              row.paint[index].color !== record.target.paint[index].color &&
              row.paint[index].color !== record.colourTarget.paint[index].color,
          ),
          `production foreground ${index}`,
        );
      for (const index of [0, 1])
        assert(
          record.colours.some(
            (row) =>
              row.paint[index].bg !== record.target.paint[index].bg &&
              row.paint[index].bg !== record.colourTarget.paint[index].bg,
          ),
          `production surface ${index}`,
        );
      assert(
        record.colours.every((row) => row.paint.every((part) => part.owners <= 1)),
        "one colour owner per physical host",
      );
      await demo.getByRole("button", { name: "Update empty state", exact: true }).evaluate((node) => node.click());
      await frames(page, 2);
      record.beforeNone = await sample(page);
      assert(
        ["production-title", "production-description"].some((id) =>
          record.beforeNone.pixels[id].some((pixel) => pixel.ink),
        ) && record.beforeNone.pixels["production-quantity"].some((pixel) => pixel.ink),
        "a live copy transaction and the digit reel are active before cancellation",
      );
      assert(record.beforeNone.media > 0 && record.beforeNone.media < 1);
      const mode = async (value) => {
        await page
          .getByRole("group", { name: "Motion mode", includeHidden: true })
          .getByRole("button", { name: value, exact: true, includeHidden: true })
          .evaluate((node) => node.click());
        await page.waitForFunction(
          (value) =>
            document.querySelector('[data-component-example="empty/changing"] [data-slot="empty"]').dataset.motion ===
            value,
          value,
        );
      };
      await mode("none");
      record.none = await sample(page);
      assert(record.none.pixels && Object.values(record.none.pixels).every((pixels) => pixels.length === 0));
      assert.equal(record.none.media, 1);
      assert.equal(record.none.running, 0);
      assert.equal(record.none.title, "No saved components");
      assert.equal(record.none.quantity, "21");
      await mode("full");
      record.restored = await sample(page);
      assert(Object.values(record.restored.pixels).every((pixels) => pixels.length === 0));
      await demo.getByRole("button", { name: "Toggle results" }).click();
      // This demo keeps a second, always-present region, so only the captured
      // outgoing host proves replacement; `.first()` re-resolves to that region.
      await page.waitForFunction((node) => !node.isConnected, host);
      assert.equal(await demo.getByRole("link", { name: "Browse components" }).count(), 0);
      await demo.getByRole("button", { name: "Toggle results" }).click();
      await demo.getByRole("link", { name: "Browse components" }).waitFor({ state: "visible" });
      await page.waitForTimeout(1100);
      record.screenshot = `${theme}-${width}.png`;
      await demo.screenshot({ path: path.join(output, record.screenshot) });
      if (theme === "light") {
        await page.getByRole("tab", { name: "Manual", exact: true }).click();
        const copied = [];
        for (const file of [
          "empty/index.tsx",
          "lib/empty-media.ts",
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
            (await page.evaluate(() => window.emptyCopied)).replaceAll("\r\n", "\n"),
            (await readFile(`registry/cadence/${file}`, "utf8")).replaceAll("\r\n", "\n"),
          );
          copied.push(file);
        }
        report.manual.push({ width, copied });
      }
      const axe = await new AxeBuilder({ page }).analyze();
      assert.deepEqual(axe.violations, []);
      record.axe = 0;
      for (const response of responses) {
        if (report.scripts.some((script) => script.url === response.url())) continue;
        const body = await response.body();
        report.scripts.push({ url: response.url(), sha: hash(body), gzip: gzipSync(body).length });
      }
      record.passed = true;
      await context.close();
    }
  report.observedPageJSGzip = report.scripts.reduce((sum, script) => sum + script.gzip, 0);
  assert.deepEqual(report.errors, []);
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
    views: report.cases.length,
    manual: report.manual.length,
    pageJSGzip: report.observedPageJSGzip,
  }),
);
