import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";
import { observeControllers } from "./observe-controllers.mjs";

const require = createRequire(import.meta.url);
const { createServer, transformWithEsbuild } = await import(
  pathToFileURL(require.resolve("vite", { paths: [path.dirname(require.resolve("vitest/node"))] }))
);
const config = (await import("./vite.config.mjs")).default;
const report = { sources: {}, cases: [], failures: [], errors: [] };
const negative = process.argv.includes("--negative");
const sourcePaths = [
  "registry/cadence/chart/index.tsx",
  "registry/cadence/carousel/index.tsx",
  "components/site/document-entrance.tsx",
];
for (const file of sourcePaths) {
  const text = negative
    ? execFileSync("git", ["show", `b365643:${file}`], { encoding: "utf8" })
    : readFileSync(file, "utf8");
  report.sources[file] = { text, sha256: createHash("sha256").update(text).digest("hex") };
}
const server = await createServer({
  ...config,
  plugins: negative
    ? [
        observeControllers,
        {
          name: "w2-engine-negative",
          enforce: "pre",
          async load(id) {
            const file = sourcePaths.find((p) => id.replaceAll("\\", "/").endsWith(`/${p}`));
            if (file)
              return (await transformWithEsbuild(report.sources[file].text, id, { loader: "tsx", jsx: "automatic" }))
                .code;
          },
        },
      ]
    : [observeControllers],
  configFile: false,
  logLevel: "error",
  esbuild: { jsx: "automatic" },
  server: { ...config.server, port: 3181 },
});
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  await server.listen();
  for (const os of ["no-preference", "reduce"])
    for (const mode of ["full", "reduced", "none"])
      for (const spec of [
        ...["Bar", "Line", "Area", "Pie", "Scatter", "Radar", "RadialBar", "Funnel"].map((series) => ({
          kind: "chart",
          series,
        })),
        { kind: "carousel" },
        ...["article", "section", "div"].flatMap((as) => [
          { kind: "entrance", as },
          { kind: "entrance", as, offscreen: "true" },
        ]),
      ]) {
        const { kind } = spec;
        if (
          process.env.W2_FILTER &&
          !`${kind}/${spec.series || spec.as || "loop"}/${mode}/${os}/${spec.offscreen || "visible"}`.includes(
            process.env.W2_FILTER,
          )
        )
          continue;
        const page = await browser.newPage({ reducedMotion: os });
        page.on("pageerror", (e) => report.errors.push(`${JSON.stringify(spec)}: ${e.stack}`));
        const label = `${kind}/${spec.series || spec.as || "loop"}/${mode}/${os}/${spec.offscreen || "visible"}`;
        const record = async (name, patch, verify) => {
          const r = await page.evaluate((p) => window.updateW2(p), patch);
          await page.waitForFunction((r) => window.w2frames?.some((s) => s.request === r && s.phase === "paint2"), r);
          const samples = await page.evaluate((r) => window.w2frames.filter((s) => s.request === r), r);
          report.cases.push({ label, name, samples });
          try {
            const paints = samples.filter((s) => ["paint1", "paint2"].includes(s.phase));
            assert.equal(paints.length, 2);
            assert(paints.every((s) => s.parts.length > 0));
            verify?.(paints);
          } catch (e) {
            report.failures.push(`${label}/${name}: ${e.message}`);
          }
          return samples;
        };
        await page.goto(`http://127.0.0.1:3181/w2-engines.html?${new URLSearchParams({ ...spec, mode })}`);
        await page.waitForFunction(() => window.w2insertions?.some((s) => s.phase === "paint2" && s.parts.length));
        const insertion = await page.evaluate(() => window.w2insertions);
        report.cases.push({ label, name: "initial", samples: insertion });
        if (kind === "entrance" && spec.offscreen && mode === "none") {
          await record("offscreen consumed entrance stays settled on full", { mode: "full" }, (paints) => {
            for (const f of paints)
              for (const p of f.parts) {
                assert.equal(p.opacity, 1);
                assert.equal(p.transform, "none");
                assert.equal(p.filter, "none");
                assert.equal(p.clip, "none");
              }
          });
          await record("restore initial none", { mode: "none" });
        }
        if (kind === "entrance" && spec.offscreen) {
          await page.evaluate(() => scrollTo(0, 1800));
          await page.waitForTimeout(80);
          report.cases.push({
            label,
            name: "offscreen entry",
            samples: [await page.evaluate(() => window.sampleW2("entry"))],
          });
        }
        if (kind === "carousel") await page.waitForFunction(() => window.embla);
        const start = async () => {
          await record("controlled target", { selected: true });
          if (kind === "carousel") await page.evaluate(() => window.embla.scrollTo(3));
          await page.waitForTimeout(90);
          report.cases.push({
            label,
            name: "partial",
            samples: [await page.evaluate(() => window.sampleW2("partial"))],
          });
        };
        const signature = (s) =>
          JSON.stringify(
            s.parts.map((p) => ({
              d: p.d,
              cx: p.cx,
              cy: p.cy,
              opacity: p.opacity,
              transform: p.transform,
              filter: p.filter,
              clip: p.clip,
            })),
          );
        const settled = (p) => {
          if (kind === "carousel") for (const s of p) assert(Math.abs(s.engine.location - s.engine.target) < 0.01);
          if (kind === "entrance")
            for (const s of p)
              for (const n of s.parts) {
                assert.equal(n.opacity, 1);
                assert.equal(n.transform, "none");
                assert.equal(n.filter, "none");
                assert.equal(n.clip, "none");
              }
          if (kind === "chart") {
            assert.equal(signature(p[0]), signature(p[1]));
          }
        };
        if (kind === "chart" && (mode !== "full" || os === "reduce")) {
          await page.waitForTimeout(100);
          const terminal = await page.evaluate(() => window.sampleW2("initial terminal reference"));
          report.cases.push({ label, name: "initial terminal reference", samples: [terminal] });
          try {
            const paints = insertion.filter((s) => s.phase.startsWith("paint"));
            assert(paints.length > 0);
            for (const f of paints) assert.equal(signature(f), signature(terminal));
          } catch (e) {
            report.failures.push(`${label}/initial first paints: ${e.message}`);
          }
        }
        await start();
        if (kind === "chart")
          await record("same-target positive inherited clock", { clock: 4 }, (paints) => {
            if (mode === "full" && os === "no-preference") {
              assert(paints[1].registered > 0);
              assert(paints[1].controllers.some((c) => c.state === "running" && c.appliedDuration === 880));
            }
          });
        const inherited = await record("same-target inherited zero", { clock: 0 }, settled);
        if (kind === "chart") {
          await page.waitForTimeout(100);
          const terminal = await page.evaluate(() => window.sampleW2("zero terminal reference"));
          report.cases.push({ label, name: "zero terminal reference", samples: [terminal] });
          try {
            for (const f of inherited.filter((s) => ["paint1", "paint2"].includes(s.phase)))
              assert.equal(signature(f), signature(terminal));
          } catch (e) {
            report.failures.push(`${label}/first paints versus terminal: ${e.message}`);
          }
        }
        await record(
          "explicit positive reverse",
          { selected: false, explicit: 8 },
          kind === "entrance" ? settled : undefined,
        );
        if (kind === "carousel") await page.evaluate(() => window.embla.scrollTo(0));
        await page.waitForTimeout(90);
        await record("same-target explicit zero", { explicit: 0 }, settled);
        await record("positive restart", { selected: true, explicit: 8 });
        if (kind === "carousel") await page.evaluate(() => window.embla.scrollTo(2));
        await page.waitForTimeout(90);
        await record("async none", { mode: "none" }, settled);
        if (kind === "carousel") {
          await record("dynamic slides", { count: 3 });
          await record("restore before active cleanup", { mode: "full", explicit: 8 });
          await page.evaluate(() => window.embla.scrollTo(1));
          await page.waitForTimeout(60);
          report.cases.push({
            label,
            name: "active track before cleanup",
            samples: [await page.evaluate(() => window.sampleW2("active cleanup"))],
          });
        }
        if (kind === "chart") {
          await record("restore before active controller cleanup", { mode: "full", explicit: 8, selected: false });
          await page.waitForTimeout(60);
          const active = await page.evaluate(() => window.sampleW2("active controller"));
          report.cases.push({ label, name: "active controller before cleanup", samples: [active] });
          if (os === "no-preference")
            try {
              assert(active.registered > 0);
              assert(
                active.controllers.some((c) => c.state === "running" && c.ticks > 0 && c.value > 0 && c.value < 1),
              );
            } catch (e) {
              report.failures.push(`${label}/real active controller: ${e.message}`);
            }
        }
        const detached = await record("cleanup", { mounted: false }, (p) => {
          for (const s of p) {
            for (const n of s.parts) assert.equal(n.connected, false);
            if (kind === "chart") assert.equal(s.registered, 0);
          }
        });
        await page.waitForTimeout(90);
        const after = await page.evaluate(() => window.sampleW2("detached later"));
        report.cases.push({
          label,
          name: "detached trajectory",
          before: detached.at(-1),
          after,
          events: await page.evaluate(() => window.w2events),
        });
        try {
          assert(after.parts.length > 0);
          if (kind === "carousel") assert.deepEqual(after.engine, detached.at(-1).engine);
          if (kind === "chart") assert.deepEqual(after.controllers, detached.at(-1).controllers);
          assert.equal(after.parts.length, detached.at(-1).parts.length);
          for (const [i, p] of after.parts.entries()) assert.equal(p.html, detached.at(-1).parts[i].html);
        } catch (e) {
          report.failures.push(`${label}/cleanup: ${e.message}`);
        }
        if (kind === "chart")
          report.cases.push({
            label,
            name: "complete public controller event history",
            controllers: await page.evaluate(() =>
              (window.w2controllers || []).map((c) => ({
                state: c.state,
                nativeState: c.handle.getState(),
                from: c.handle.getFrom(),
                to: c.handle.getTo(),
                ticks: c.ticks,
                updates: c.updates,
                applied: c.applied,
              })),
            ),
          });
        await page.close();
      }
} finally {
  await browser.close();
  await server.close();
  writeFileSync(
    process.argv.find((a) => a.endsWith(".json")) || "docs/evidence/w2-engines-current.json",
    JSON.stringify(report, null, 2) + "\n",
  );
}
console.log(JSON.stringify({ cases: report.cases.length, failures: report.failures, errors: report.errors }));
if (report.failures.length || report.errors.length) process.exitCode = 1;
