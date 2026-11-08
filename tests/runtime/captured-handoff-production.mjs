import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { chromium } from "@playwright/test";
import { measureInitialScripts, summarizeLayoutShifts } from "../../scripts/site-js-budget.mjs";

const output = path.resolve(
  process.env.HANDOFF_PRODUCTION_OUTPUT ??
    `.cache/motion-v2-execution/s08c-captured-origin/production-cost-${Date.now()}`,
);
await mkdir(output, { recursive: false });
const dist = path.resolve(process.env.CADENCE_DIST_DIR);
const hash = (value) => createHash("sha256").update(value).digest("hex");
const report = {
  buildId: (await readFile(path.join(dist, "BUILD_ID"), "utf8")).trim(),
  runnerSHA: hash(await readFile(new URL(import.meta.url))),
  rows: [],
  errors: [],
  resources: {},
};
await writeFile(path.join(output, "runner.mjs"), await readFile(new URL(import.meta.url)));
const reserved = net.createServer();
await new Promise((resolve) => reserved.listen(0, "127.0.0.1", resolve));
const port = reserved.address().port;
await new Promise((resolve) => reserved.close(resolve));
const server = spawn(
  process.execPath,
  [path.resolve("node_modules/next/dist/bin/next"), "start", "--port", String(port)],
  {
    env: { ...process.env, CADENCE_DIST_DIR: path.relative(process.cwd(), dist) },
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let log = "";
server.stdout.on("data", (bytes) => {
  log += bytes;
});
server.stderr.on("data", (bytes) => {
  log += bytes;
});
const receipt = () => {
  const result = spawnSync(
    "powershell.exe",
    [
      "-NoProfile",
      "-Command",
      `Get-CimInstance Win32_Process -Filter 'ProcessId = ${server.pid}' | Select-Object ProcessId,CreationDate,CommandLine | ConvertTo-Json -Compress`,
    ],
    { encoding: "utf8", windowsHide: true },
  );
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim() ? JSON.parse(result.stdout) : null;
};
report.resources.start = receipt();
report.resources.port = port;
let browser;
try {
  for (let attempt = 0; attempt < 100; attempt++) {
    assert.equal(server.exitCode, null, log);
    if (
      await fetch(`http://127.0.0.1:${port}/components/select`).then(
        (r) => r.ok,
        () => false,
      )
    )
      break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({ channel: "msedge", headless: true });
  for (const width of [1280, 390])
    for (const id of ["button", "select"]) {
      const context = await browser.newContext({
        viewport: { width, height: width === 390 ? 844 : 720 },
        isMobile: width === 390,
      });
      try {
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", (e) => errors.push(e.stack));
        await page.addInitScript(() => {
          window.contentShifts = [];
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries())
              window.contentShifts.push({
                value: entry.value,
                startTime: entry.startTime,
                hadRecentInput: entry.hadRecentInput,
              });
          }).observe({ type: "layout-shift", buffered: true });
        });
        const scripts = await measureInitialScripts(
          page,
          `http://127.0.0.1:${port}/components/${id}?motion=full`,
          `[data-preview="${id}"]`,
        );
        const bindings = [];
        for (const file of scripts.files) {
          const relative = new URL(file.url).pathname.replace(/^\/_next\//, "");
          assert(relative.startsWith("static/"));
          const bytes = await readFile(path.join(dist, relative));
          const actual = hash(bytes);
          assert.equal(actual, file.sha256);
          bindings.push({ relative, sha: actual });
        }
        const cold = await page.evaluate(() => window.contentShifts);
        const preview = page.locator(`[data-preview="${id}"]`);
        if (id === "button") await preview.getByRole("button").first().click();
        else {
          const trigger = preview.getByRole("combobox", { name: "Framework", exact: true });
          await trigger.click();
          await page.getByRole("option", { name: "Astro", exact: true }).click();
        }
        await page.waitForTimeout(1000);
        const interaction = await page.evaluate(() => window.contentShifts);
        report.rows.push({
          id,
          width,
          scripts,
          bindings,
          coldCLS: summarizeLayoutShifts(cold),
          interactionCLS: summarizeLayoutShifts(interaction),
          shifts: interaction,
          errors,
          passedPageBudget: scripts.gzipBytes <= scripts.limit,
        });
        await page.screenshot({ path: path.join(output, `${id}-${width}.png`) });
      } finally {
        await context.close();
      }
    }
} catch (error) {
  report.errors.push(error.stack);
} finally {
  await browser?.close();
  report.resources.browserClosed = true;
  const beforeStop = receipt();
  report.resources.beforeStop = beforeStop;
  if (beforeStop) {
    assert.deepEqual(beforeStop, report.resources.start, "Refuse to stop a replaced PID/lifetime/command");
    const exited = new Promise((resolve) => server.once("exit", resolve));
    server.kill();
    await exited;
  }
  report.resources.afterStop = receipt();
  await writeFile(path.join(output, "server.log"), log);
  await writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2));
}
console.log(
  JSON.stringify({
    output,
    errors: report.errors,
    rows: report.rows.map(({ id, width, scripts, coldCLS, interactionCLS, passedPageBudget }) => ({
      id,
      width,
      gzip: scripts.gzipBytes,
      coldCLS,
      interactionCLS,
      passedPageBudget,
    })),
  }),
);
if (report.errors.length || report.rows.some((row) => row.errors.length || row.scripts.errors.length))
  process.exitCode = 1;
