/**
 * S02-A runtime cost of the production site routes.
 *
 *   page    production initial JavaScript per route, plus cold-window CLS, using the
 *           repository's existing measureInitialScripts protocol (load + networkidle
 *           + 10 s + networkidle, no interaction, cache disabled).
 *   frames  a scripted interaction window on representative routes: rAF frame
 *           cadence, long-animation-frame entries and interaction CLS.
 *
 * A production server must already be running (`pnpm build && pnpm start --port 3000`).
 * Raw output goes to `.cache/s02-a/`; nothing is compared against a budget.
 *
 *   node scripts/measure-routes.mjs page --base http://127.0.0.1:3100 --width 1280
 *   node scripts/measure-routes.mjs frames --base http://127.0.0.1:3100 --width 1280
 */
import { execFileSync } from "node:child_process";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { chromium } from "@playwright/test";
import { measureInitialScripts, summarizeLayoutShifts } from "./site-js-budget.mjs";

const root = process.cwd();
const args = process.argv.slice(2);
const metric = args[0];
const option = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index > 0 ? args[index + 1] : fallback;
};
const base = option("base", "http://127.0.0.1:3100");
const width = Number(option("width", "1280"));
const height = width === 390 ? 844 : 720;
const out = path.resolve(option("out", ".cache/s02-a"));
const commit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const channel = process.env.PLAYWRIGHT_CHANNEL ?? "msedge";
const limit = Number(option("limit", "0"));
// Component and docs pages render a preview or an article; the two index routes have
// neither, so they get an explicit main element instead of a 30 s wait.
const readySelector = option("ready", "[data-preview], article");
await mkdir(out, { recursive: true });

const registry = JSON.parse(await readFile(path.join(root, "registry.json"), "utf8"));
const ids = registry.items.filter((item) => item.meta?.tier).map((item) => item.name);
const docs = (await readdir(path.join(root, "content/docs"))).filter((file) => file.endsWith(".mdx"));
const routes = [
  ...ids.map((id) => ({ route: `/components/${id}`, kind: "component", id })),
  { route: "/components", kind: "shared" },
  { route: "/docs", kind: "shared" },
  ...docs.map((file) => ({ route: `/docs/${file.replace(/\.mdx$/, "")}`, kind: "docs" })),
];
const only = option("only", "");
const measuredRoutes = only
  ? routes.filter((entry) => only.split(",").includes(entry.route))
  : limit > 0
    ? routes.slice(0, limit)
    : routes;

const buildId = (await readFile(path.join(root, ".next/BUILD_ID"), "utf8").catch(() => "")).trim();
const environment = {
  commit,
  buildId,
  base,
  viewport: { width, height },
  deviceScaleFactor: 1,
  isMobile: width === 390,
  headless: true,
  browserChannel: channel,
  os: `${os.type()} ${os.release()} (${os.platform()} ${os.arch()})`,
  cpu: os.cpus()[0]?.model ?? "unknown",
  cpus: os.cpus().length,
  totalMemoryBytes: os.totalmem(),
  freeMemoryBytes: os.freemem(),
  node: process.version,
};

/** Cold-window layout shifts, buffered from navigation. Mirrors site-js-budget.spec.ts. */
const coldShiftScript = () => {
  const entries = [];
  Object.assign(window, { s02ColdShifts: entries });
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      entries.push({
        value: entry.value,
        startTime: entry.startTime,
        hadRecentInput: entry.hadRecentInput,
        sources: (entry.sources ?? []).map((source) => ({
          slot: source.node instanceof Element ? source.node.getAttribute("data-slot") : null,
          tag: source.node?.nodeName ?? null,
        })),
      });
    }
  }).observe({ type: "layout-shift", buffered: true });
};

const browser = await chromium.launch({ channel, headless: true });

try {
  if (metric === "page") {
    const context = await browser.newContext({
      viewport: { width, height },
      isMobile: width === 390,
      reducedMotion: "no-preference",
      deviceScaleFactor: 1,
    });
    const rows = [];
    for (const entry of measuredRoutes) {
      const page = await context.newPage();
      const consoleErrors = [];
      const httpErrors = [];
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });
      page.on("response", (response) => {
        if (response.status() >= 400) httpErrors.push({ url: response.url(), status: response.status() });
      });
      await page.addInitScript(coldShiftScript);
      const started = Date.now();
      const report = await measureInitialScripts(page, `${base}${entry.route}`, readySelector);
      const elapsedMs = Date.now() - started;
      // Split the collector's total into scripts the document declares and chunks
      // fetched afterwards (router prefetch, async example bundles).
      let declaredJsGzip = null;
      let declaredScripts = null;
      try {
        const declared = await page.evaluate(() =>
          [...document.querySelectorAll("script[src]")].map((node) => new URL(node.src).pathname),
        );
        declaredScripts = new Set(declared);
        declaredJsGzip = report.files
          .filter((file) => declaredScripts.has(new URL(file.url).pathname))
          .reduce((sum, file) => sum + file.gzip, 0);
      } catch (error) {
        consoleErrors.push(`Declared script read failed: ${error.message}`);
      }
      let coldCls = null;
      let shiftCount = null;
      try {
        const shifts = await page.evaluate(() => window.s02ColdShifts ?? []);
        coldCls = summarizeLayoutShifts(shifts);
        shiftCount = shifts.length;
      } catch (error) {
        consoleErrors.push(`CLS read failed: ${error.message}`);
      }
      rows.push({
        ...entry,
        elapsedMs,
        jsGzip: report.gzipBytes,
        scriptsDetail: report.files.map((file) => ({ url: new URL(file.url).pathname, gzip: file.gzip })),
        scripts: report.files.length,
        declaredScripts: declaredScripts ? declaredScripts.size : null,
        declaredJsGzip,
        fetchedJsGzip: declaredJsGzip == null ? null : report.gzipBytes - declaredJsGzip,
        coldCls,
        shiftCount,
        errors: report.errors,
        missingResponses: report.missingResponses.length,
        consoleErrors,
        httpErrors,
      });
      console.log(`${entry.route} js=${report.gzipBytes} cls=${coldCls} errors=${report.errors.length}`);
      await page.close();
    }
    // ADR-026 attributes the same bytes two ways: the total the user pays, and the part one
    // route adds above the chunk set every component route loads. The shell is a union of
    // observed URLs, not a build-manifest guess, and the total is still recorded unchanged.
    const componentRows = rows.filter((row) => row.kind === "component");
    const seen = new Map();
    for (const row of componentRows) {
      for (const file of row.scriptsDetail) seen.set(file.url, (seen.get(file.url) ?? 0) + 1);
    }
    const shellUrls = new Set(
      [...seen.entries()].filter(([, count]) => count === componentRows.length).map(([url]) => url),
    );
    const shellGzip = componentRows
      .flatMap((row) => row.scriptsDetail.filter((file) => shellUrls.has(file.url)))
      .filter((file, index, files) => files.findIndex((other) => other.url === file.url) === index)
      .reduce((sum, file) => sum + file.gzip, 0);
    for (const row of componentRows) {
      row.shellGzip = shellGzip;
      row.routeRemainderGzip = row.jsGzip - shellGzip;
    }
    await writeFile(
      path.join(out, `page-${width}.json`),
      `${JSON.stringify(
        {
          metric: "page",
          protocol:
            "production next start; per route a fresh page in one context, cache disabled, load + networkidle + 10s + networkidle with no interaction; default motion mode (no query parameter); JS total = gzip6 of every JavaScript HTTP entity the page fetched (measureInitialScripts, prefetch and async included); declaredJs = the scripts the document declares with <script src>, fetchedJs = the remainder fetched afterwards; cold CLS = session-window CLS of layout-shift entries with no recent input, from navigation to the end of the observation window",
          environment,
          browserVersion: browser.version(),
          shell: {
            scope: `URLs present on all ${componentRows.length} component routes`,
            files: shellUrls.size,
            gzip: shellGzip,
            protocol:
              "route remainder = page total minus the shell union above; the total is recorded unchanged, and the shared documentation routes are not part of the shell",
          },
          routes: rows.length,
          rows,
        },
        null,
        2,
      )}\n`,
    );
    console.log(JSON.stringify({ metric, viewport: width, routes: rows.length }));
  }

  if (metric === "frames") {
    // Representative interactive routes. Controls were read from the current previews;
    // the rest are entrance/scroll windows. A control that has moved is recorded as a
    // failed interaction, never silently treated as a passing one.
    const interactive = [
      {
        id: "accordion",
        steps: async (preview, tab) => {
          const trigger = preview.getByRole("button", { name: "Can I reduce the motion?", exact: true });
          await trigger.click();
          await tab.waitForTimeout(500);
          await trigger.click();
        },
      },
      {
        id: "tabs",
        steps: async (preview, tab) => {
          await preview.getByRole("tab", { name: "Activity", exact: true }).click();
          await tab.waitForTimeout(600);
          await preview.getByRole("tab", { name: "Overview", exact: true }).click();
        },
      },
      {
        id: "select",
        steps: async (preview, tab) => {
          await preview.getByRole("combobox").first().click();
          await tab.waitForTimeout(600);
          await tab.keyboard.press("Escape");
        },
      },
      {
        id: "dialog",
        steps: async (preview, tab) => {
          await preview.getByRole("button", { name: "Rename project", exact: true }).click();
          await tab.waitForTimeout(600);
          await tab.keyboard.press("Escape");
        },
      },
      { id: "animated-text", steps: null },
      { id: "reveal", steps: null },
      { id: "data-table", steps: null },
    ];
    const frameScript = () => {
      const frames = [];
      const loaf = [];
      const shifts = [];
      Object.assign(window, { s02Frames: frames, s02Loaf: loaf, s02Shifts: shifts, s02Recording: false });
      const tick = (time) => {
        if (window.s02Recording) frames.push(time);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries())
          if (window.s02Recording)
            loaf.push({ startTime: entry.startTime, duration: entry.duration, renderStart: entry.renderStart });
      }).observe({ type: "long-animation-frame", buffered: false });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries())
          if (window.s02Recording && !entry.hadRecentInput)
            shifts.push({ value: entry.value, startTime: entry.startTime });
      }).observe({ type: "layout-shift", buffered: false });
    };
    const context = await browser.newContext({
      viewport: { width, height },
      isMobile: width === 390,
      reducedMotion: "no-preference",
      deviceScaleFactor: 1,
    });
    const rows = [];
    for (const target of interactive) {
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.addInitScript(frameScript);
      await page.goto(`${base}/components/${target.id}?motion=full`);
      await page.waitForLoadState("networkidle");
      const preview = page.locator(`[data-preview="${target.id}"]`).first();
      await preview.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1200);
      await page.evaluate(() => {
        window.s02Frames.length = 0;
        window.s02Loaf.length = 0;
        window.s02Shifts.length = 0;
        window.s02Recording = true;
      });
      let interaction = target.steps ? "scripted" : "scroll";
      if (target.steps) {
        try {
          await target.steps(preview, page);
        } catch (error) {
          interaction = "scripted (failed)";
          errors.push(`Interaction failed: ${error.message.split("\n")[0]}`);
        }
      } else await page.evaluate(() => window.scrollBy({ top: 240, behavior: "instant" }));
      await page.waitForTimeout(2000);
      const sample = await page.evaluate(() => {
        window.s02Recording = false;
        return { frames: window.s02Frames, loaf: window.s02Loaf, shifts: window.s02Shifts };
      });
      const intervals = sample.frames.slice(1).map((time, index) => time - sample.frames[index]);
      // A long-animation frame that began before the window opened is not part of it.
      const windowStart = sample.frames[0] ?? Number.POSITIVE_INFINITY;
      const loaf = sample.loaf.filter((entry) => entry.startTime >= windowStart);
      const span = intervals.reduce((sum, value) => sum + value, 0);
      const sorted = [...intervals].sort((left, right) => left - right);
      const percentile = (p) =>
        sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] : null;
      rows.push({
        id: target.id,
        interaction,
        frames: sample.frames.length,
        windowMs: Math.round(span),
        fps: span ? Number(((intervals.length / span) * 1000).toFixed(1)) : null,
        frameIntervalP50: percentile(0.5),
        frameIntervalP95: percentile(0.95),
        longFramesOver25ms: intervals.filter((value) => value > 25).length,
        longAnimationFrames: loaf.length,
        longestAnimationFrameMs: loaf.length ? Math.max(...loaf.map((entry) => entry.duration)) : 0,
        interactionCls: summarizeLayoutShifts(sample.shifts),
        errors,
      });
      console.log(
        `${target.id} fps=${rows.at(-1).fps} p95=${rows.at(-1).frameIntervalP95} cls=${rows.at(-1).interactionCls}`,
      );
      await page.close();
    }
    await writeFile(
      path.join(out, `frames-${width}.json`),
      `${JSON.stringify(
        {
          metric: "frames",
          protocol:
            "production next start, headless Chromium; after load+networkidle and scrolling the preview into view, a 2s window records every requestAnimationFrame timestamp, long-animation-frame entries and no-recent-input layout shifts. fps = observed rAF callbacks / observed span; p50/p95 are frame intervals. This is main-thread animation cadence: compositor-presented frames are not directly observable in this headless environment and are not reported",
          environment,
          browserVersion: browser.version(),
          rows,
        },
        null,
        2,
      )}\n`,
    );
    console.log(JSON.stringify({ metric, viewport: width, routes: rows.length }));
  }
} finally {
  await browser.close();
}

if (!["page", "frames"].includes(metric)) {
  console.error("usage: node scripts/measure-routes.mjs page|frames --base <url> --width <px> [--limit n]");
  process.exit(1);
}
