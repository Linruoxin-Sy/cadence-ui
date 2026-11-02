import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";
import { readEvidence } from "./evidence-file.mjs";
import { observeAnimate } from "./observe-animate.mjs";

const require = createRequire(import.meta.url);
const { createServer, transformWithEsbuild } = await import(
  pathToFileURL(require.resolve("vite", { paths: [path.dirname(require.resolve("vitest/node"))] }))
);
const config = (await import("./vite.config.mjs")).default;
const report = { sources: {}, cases: [], failures: [], errors: [] };
for (const id of ["select", "code-block", "sidebar", "calendar", "tabs"]) {
  const text = readFileSync(`registry/cadence/${id}/index.tsx`, "utf8");
  report.sources[id] = { text, sha256: createHash("sha256").update(text).digest("hex") };
}
const negative = process.argv.includes("--negative");
const old = negative ? readEvidence("docs/evidence/w2-geometry-initial.json").sources : null;
if (negative) report.sources = old;
const server = await createServer({
  ...config,
  plugins: negative
    ? [
        observeAnimate,
        {
          name: "w2-exact-negative",
          enforce: "pre",
          async load(id) {
            const match = Object.keys(old).find((k) =>
              id.replaceAll("\\", "/").endsWith(`/registry/cadence/${k}/index.tsx`),
            );
            if (match)
              return (await transformWithEsbuild(old[match].text, id, { loader: "tsx", jsx: "automatic" })).code;
          },
        },
      ]
    : [observeAnimate],
  configFile: false,
  logLevel: "error",
  esbuild: { jsx: "automatic" },
  server: { ...config.server, port: 3181 },
});
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  await server.listen();
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:3181/w2-geometry.html?kind=code&mode=full");
  await page.waitForFunction(() => window.updateW2);
  const update = async (p) => {
    const r = await page.evaluate((p) => window.updateW2(p), p);
    await page.waitForFunction((r) => window.w2frames.some((s) => s.request === r && s.phase === "paint2"), r);
  };
  await update({ clock: 1, selected: true, lines: 30 });
  await page.waitForTimeout(100);
  await update({ selected: false });
  await page.waitForTimeout(250);
  await update({ selected: true, lines: 4 });
  await page.waitForTimeout(400);
  const samples = await page.evaluate(() => window.w2frames);
  report.cases.push({ label: "actual viewport reversal resize", samples });
  const values = samples.flatMap((s) =>
    s.parts.filter((p) => p.slot === "code-block-viewport" && p.connected).map((p) => p.height),
  );
  assert(values.length > 0);
  report.minimum = Math.min(...values);
  report.failures = values.filter((x) => x < 71.9).map((x) => `height ${x} below closed72`);
  console.log({ minimum: report.minimum, failures: report.failures.length });
  await page.close();
} finally {
  await browser.close();
  await server.close();
  writeFileSync(
    process.argv.find((a) => a.endsWith(".json")) || "docs/evidence/w2-viewport-clamp-negative.json",
    JSON.stringify(report, null, 2) + "\n",
  );
}
if (report.failures.length) process.exitCode = 1;
