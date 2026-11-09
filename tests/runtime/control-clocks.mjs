import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

assert(process.env.CADENCE_CONTROL_CLOCK_OUTPUT, "Use a fresh evidence directory");
const output = path.resolve(process.env.CADENCE_CONTROL_CLOCK_OUTPUT);
await mkdir(output, { recursive: false });
const require = createRequire(import.meta.url),
  vite = require.resolve("vite", { paths: [require.resolve("vitest/node")] });
const { build } = await import(pathToFileURL(require.resolve("esbuild", { paths: [vite] })));
const report = { rows: [], errors: [], failures: [], inputs: {}, resourcesClosed: false };
const result = await build({
  entryPoints: ["tests/runtime/control-clocks.jsx"],
  bundle: true,
  write: false,
  metafile: true,
  format: "iife",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"development"' },
});
for (const file of Object.keys(result.metafile.inputs))
  report.inputs[file] = createHash("sha256")
    .update(await readFile(file))
    .digest("hex");
await writeFile(path.join(output, "fixture.js"), result.outputFiles[0].contents);
await writeFile(path.join(output, "runner.mjs"), await readFile(new URL(import.meta.url)));
const browser = await chromium.launch({ headless: true });
report.browser = browser.version();
try {
  for (const theme of ["light", "dark"])
    for (const os of ["no-preference", "reduce"])
      for (const mode of ["full", "reduced", "none"]) {
        const context = await browser.newContext({ colorScheme: theme, reducedMotion: os });
        const page = await context.newPage(),
          row = { theme, os, mode, snapshots: {}, checks: [] };
        report.rows.push(row);
        page.on("pageerror", (error) => report.errors.push(String(error)));
        page.on("console", (message) => {
          if (message.type() === "error") report.errors.push(message.text());
        });
        const check = (label, condition) => {
          row.checks.push({ label, passed: !!condition });
          assert(condition, `${theme}/${os}/${mode}: ${label}`);
        };
        await page.setContent(
          `<html class="${theme}"><body><main id="root"></main><script>window.clockMode=${JSON.stringify(mode)}</script></body></html>`,
        );
        await page.addScriptTag({ content: result.outputFiles[0].text });
        await page.waitForFunction(() => window.clockUpdate);
        row.react = await page.evaluate(() => window.clockReact);
        const patch = async (value) => {
          await page.evaluate((value) => window.clockUpdate(value), value);
          await page.evaluate(
            () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
          );
        };
        const sample = (id = "clock-local") => page.evaluate((id) => window.clockSnapshot(id), id);
        await patch({ changed: true });
        let current = await sample();
        row.snapshots.changed = current;
        check(
          "real current semantic target remains native",
          (await page.locator("#clock-local").textContent()) === "Native content",
        );
        if (mode === "none")
          check(
            "none has no property writer or delay",
            Object.values(current.values).every((value) => !value.active) &&
              current.values.opacity.value === 1 &&
              current.values.x.value === 0,
          );
        else {
          check("eligible opacity keeps its own nonzero clock", current.values.opacity.active);
          check(
            "geometry restriction is per property",
            current.mode === "full"
              ? current.values.x.active
              : current.values.x.value === 0 && !current.values.x.active,
          );
        }
        await patch({ mode: "none" });
        current = await sample();
        row.snapshots.none = current;
        check(
          "same-target downgrade cancels both actual values",
          Object.values(current.values).every((value) => !value.active) &&
            current.values.opacity.value === 1 &&
            current.values.x.value === 0,
        );
        await patch({ mode: "full", timeScale: 0, changed: false });
        current = await sample();
        check(
          "zero clock preserves the effective mode and immediate values",
          current.mode === (os === "reduce" ? "reduced" : "full") &&
            Object.values(current.values).every((value) => !value.active) &&
            current.values.opacity.value === 0,
        );
        await patch({ timeScale: 3, changed: true, childMode: "none" });
        current = await sample();
        const nested = await sample("clock-nested");
        row.snapshots.mixed = { current, nested };
        check(
          "nested none cannot cancel eligible sibling opacity",
          current.values.opacity.active &&
            !nested.values.opacity.active &&
            nested.values.opacity.value === 1 &&
            nested.values.x.value === 0,
        );
        if (os === "no-preference") {
          const waiting = await sample("clock-spring");
          check(
            "new property spring captures its initial delay",
            waiting.values.x.active && waiting.values.x.value === 0,
          );
          await patch({ unrelated: true });
          const retained = await sample("clock-spring");
          check(
            "same-clock rerender retains the captured delay and phase",
            retained.values.x.active && retained.values.x.value === 0,
          );
          row.snapshots.sameClock = retained;
          await patch({ timeScale: 2 });
          const retimed = await sample("clock-spring");
          check(
            "same-target property spring retimes without replaying delay",
            retimed.values.x.active && retimed.values.x.value > 0,
          );
          row.snapshots.retimed = retimed;
        }
        await page.locator("#clock-nested").focus();
        await page.keyboard.press("Tab");
        await page.locator("#commit").focus();
        await page.keyboard.press("Enter");
        check(
          "native activation and focus are preserved",
          await page.evaluate(() => document.activeElement.id === "commit"),
        );
        await patch({ mounted: false });
        check(
          "StrictMode cleanup removes actual hosts",
          (await page.locator("#clock-local,#clock-nested").count()) === 0,
        );
        await page.evaluate(() => window.clockRoot.unmount());
        await context.close();
      }
  assert.deepEqual(report.errors, []);
} catch (error) {
  report.failures.push(String(error.stack));
} finally {
  await browser.close();
  report.resourcesClosed = true;
  await writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2));
}
console.log(JSON.stringify({ rows: report.rows.length, failures: report.failures, errors: report.errors }));
if (report.failures.length || report.errors.length) process.exitCode = 1;
