import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import tailwind from "@tailwindcss/postcss";
import postcss from "postcss";
import { installationPlan } from "../../scripts/installation.mjs";

// Cross-component functional gate. Run against real copied registry payloads,
// retaining individual pilot suites as the exhaustive per-component evidence.
assert(process.env.PILOTS_OUTPUT);
const output = path.resolve(process.env.PILOTS_OUTPUT);
await mkdir(output, { recursive: false });
const hash = (b) => createHash("sha256").update(b).digest("hex");
const require = createRequire(import.meta.url);
const vite = require.resolve("vite", { paths: [require.resolve("vitest/node")] });
const { build } = await import(pathToFileURL(require.resolve("esbuild", { paths: [vite] })));
const roots = ["button", "badge", "card", "tabs", "select"];
const payloads = new Map(),
  queue = [...roots];
while (queue.length) {
  const id = queue.shift();
  if (payloads.has(id)) continue;
  const bytes = await readFile(`public/r/${id}.json`),
    item = JSON.parse(bytes);
  payloads.set(id, { item, sha: hash(bytes) });
  for (const dependency of item.registryDependencies ?? []) {
    assert(dependency.startsWith("@cadence/"));
    queue.push(dependency.slice(9));
  }
}
const plans = roots.map((id) =>
  installationPlan(
    [...payloads.values()].map((p) => p.item),
    id,
  ),
);
const files = [...new Map(plans.flatMap((p) => p.files).map((f) => [f.target, f])).values()];
const copy = path.join(output, "installed", "components", "cadence"),
  installed = [];
for (const file of files) {
  assert(file.target.startsWith("@components/cadence/") && !file.target.includes(".."));
  const target = path.resolve(copy, file.target.slice("@components/cadence/".length));
  assert(target.startsWith(copy + path.sep));
  assert.equal(file.content, await readFile(file.path, "utf8"));
  assert(!/from\s+["']@\//.test(file.content));
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, file.content);
  installed.push({ target: file.target, sha: hash(file.content) });
}
const plugins = [
  {
    name: "copied-only",
    setup(b) {
      b.onResolve({ filter: /registry[\\/]cadence[\\/]/ }, (args) => {
        const target = path.resolve(copy, args.path.replaceAll("\\", "/").split("registry/cadence/")[1]);
        const file = [`${target}.tsx`, `${target}.ts`, path.join(target, "index.tsx")].find(existsSync);
        assert(file, "No workspace fallback");
        return { path: file };
      });
    },
  },
];
const options = { plugins, bundle: true, write: false, metafile: true, jsx: "automatic" };
const client = await build({
  ...options,
  entryPoints: ["tests/runtime/pilots.jsx"],
  format: "iife",
  define: { "process.env.NODE_ENV": '"production"' },
});
const ssr = await build({
  ...options,
  entryPoints: ["tests/runtime/pilots-ssr.jsx"],
  platform: "node",
  packages: "external",
  format: "cjs",
});
await writeFile(path.join(output, "ssr.cjs"), ssr.outputFiles[0].text);
const { render } = require(path.join(output, "ssr.cjs"));
const css = (
  await postcss([tailwind()]).process(await readFile("app/globals.css", "utf8"), {
    from: path.resolve("app/globals.css"),
  })
).css;
const js = client.outputFiles[0].text;
await writeFile(path.join(output, "executed.js"), js);
await writeFile(path.join(output, "compiled.css"), css);
await writeFile(path.join(output, "runner.mjs"), await readFile(new URL(import.meta.url)));
const report = {
  runnerSHA: hash(await readFile(new URL(import.meta.url))),
  inputs: Object.fromEntries(
    await Promise.all(
      [
        ...new Set([
          ...Object.keys(client.metafile.inputs),
          ...Object.keys(ssr.metafile.inputs),
          "app/globals.css",
          "pnpm-lock.yaml",
          "tests/runtime/pilots.mjs",
        ]),
      ].map(async (f) => [f, hash(await readFile(f))]),
    ),
  ),
  installation: {
    items: [...payloads].map(([id, p]) => ({ id, sha: p.sha })),
    files: installed,
    dependencies: [...new Set(plans.flatMap((p) => p.dependencies))],
  },
  cases: [],
  visuals: [],
  errors: [],
  resources: {
    pid: process.pid,
    identity: JSON.parse(
      execFileSync(
        "powershell.exe",
        [
          "-NoProfile",
          "-Command",
          `Get-CimInstance Win32_Process -Filter 'ProcessId = ${process.pid}' | Select-Object ProcessId,CreationDate,CommandLine | ConvertTo-Json -Compress`,
        ],
        { encoding: "utf8", windowsHide: true },
      ),
    ),
  },
};
const server = http.createServer((req, res) => {
  const mode = new URL(req.url, "http://localhost").searchParams.get("mode") ?? "full";
  res.setHeader("content-type", req.url === "/bundle.js" ? "text/javascript" : "text/html");
  res.end(
    req.url === "/bundle.js"
      ? js
      : `<!doctype html><html lang="en"><head><title>Pilot ownership</title><style>${css}</style></head><body><div id="root">${render(mode)}</div><script>window.pilotsInitialMode=${JSON.stringify(mode)}</script><script src="/bundle.js"></script></body></html>`,
  );
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const url = `http://127.0.0.1:${server.address().port}`;
let browser, currentPage;
const layers = "[data-cadence-text-layer],[data-cadence-number-layer],[data-cadence-handoff-layer]";
const inspect = () => {
  const rows = [...document.querySelectorAll("#outer,#outer *")].flatMap((node, host) =>
    node.getAnimations().map((a) => ({
      host,
      id: node.id,
      slot: node.dataset.slot,
      state: a.playState,
      properties: [
        ...new Set(
          a.effect
            .getKeyframes()
            .flatMap((f) =>
              Object.keys(f).filter((k) => !["offset", "computedOffset", "easing", "composite"].includes(k)),
            ),
        ),
      ],
    })),
  );
  return {
    rows,
    size: document.getElementById("outer").getBoundingClientRect().toJSON(),
    labelWidth: (() => {
      const range = document.createRange();
      range.selectNodeContents(document.querySelector('#label-button [data-slot="button-text"]'));
      return range.getBoundingClientRect().width;
    })(),
    scroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
  };
};
function singleOwners(sample) {
  const owners = new Map();
  // Geometry uses a zero-duration replace effect updated by its physics value.
  // Its native playState is finished while it still owns and changes geometry.
  for (const r of sample.rows)
    for (const p of r.properties) {
      const key = `${r.host}:${p}`;
      assert(!owners.has(key), `Two retained writers on ${r.id || r.slot}:${p}`);
      owners.set(key, true);
    }
}
async function accessible(page, reopen) {
  const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  report.lastAccessibility = audit.violations;
  assert.deepEqual(
    audit.violations.filter((v) => v.id !== "aria-hidden-focus"),
    [],
  );
  const proof = [],
    indices = new Set();
  // Same actual-focus adjudication as tests/e2e/menu-accessibility.ts. Do not
  // disable the rule or excuse a real hidden control as a native relay.
  for (const finding of audit.violations)
    for (const node of finding.nodes) {
      assert(node.target.every((s) => typeof s === "string"));
      const guard = page.locator(node.target.join(" "));
      const index = await guard.evaluate((n) => {
        const style = getComputedStyle(n);
        if (
          !n.matches('[data-base-ui-focus-guard][aria-hidden="true"][tabindex="0"]') ||
          n.childNodes.length ||
          style.clipPath !== "inset(50%)" ||
          style.width !== "1px" ||
          style.height !== "1px"
        )
          return -1;
        return [...document.querySelectorAll("[data-base-ui-focus-guard]")].indexOf(n);
      });
      assert(index >= 0, "unreviewed hidden focus finding");
      indices.add(index);
    }
  for (const index of indices) {
    await reopen();
    const forwarded = await page
      .locator("[data-base-ui-focus-guard]")
      .nth(index)
      .evaluate(async (n) => {
        n.focus();
        await new Promise(requestAnimationFrame);
        const active = document.activeElement;
        return (
          active !== n &&
          active !== document.body &&
          active?.isConnected &&
          !active.closest('[data-base-ui-focus-guard],[aria-hidden="true"],[inert]') &&
          getComputedStyle(active).visibility === "visible"
        );
      });
    assert(forwarded, "native guard must forward to a visible real focus owner before paint");
    proof.push({ index, forwarded });
  }
  if (proof.length) await reopen();
  return { rawViolations: audit.violations, relayProof: proof, unresolved: 0 };
}
try {
  browser = await chromium.launch({ channel: "msedge", headless: true });
  for (const os of ["no-preference", "reduce"])
    for (const mode of ["full", "reduced", "none"]) {
      const context = await browser.newContext({ reducedMotion: os, viewport: { width: 1280, height: 1300 } });
      const page = await context.newPage();
      currentPage = page;
      page.on("pageerror", (e) => report.errors.push(e.stack));
      page.on("console", (m) => {
        if (m.type() === "error") report.errors.push(m.text());
      });
      await page.goto(`${url}?mode=${mode}`);
      await page.waitForFunction(() => window.pilotsReady);
      const effective = mode === "none" ? "none" : os === "reduce" ? "reduced" : mode;
      const row = { os, mode, effective, checks: [] };
      report.cases.push(row);
      const update = (patch) => page.evaluate((p) => window.pilotsUpdate(p), patch);
      const idle = () =>
        page.waitForFunction(
          () =>
            document.getAnimations().every((a) => {
              const host = a.effect?.target;
              // Select may keep its original popup for native label discovery.
              // A finished zero-clock hidden envelope is a terminal presentation,
              // not active work or permission to force that native tree to unmount.
              return (
                host instanceof HTMLElement &&
                host.inert &&
                host.getAttribute("aria-hidden") === "true" &&
                !host.checkVisibility() &&
                a.playState === "finished" &&
                a.effect.getTiming().duration === 0 &&
                a.effect.getKeyframes().every((f) => f.opacity === "0")
              );
            }) &&
            !document.querySelector(
              "[data-cadence-text-layer],[data-cadence-number-layer],[data-cadence-handoff-layer]",
            ),
          null,
          { timeout: 15000 },
        );
      assert.equal(await page.locator("#outer").getAttribute("data-motion"), effective);
      assert.equal(await page.locator("#label-button").textContent(), "Status alpha");
      assert.equal(await page.evaluate(() => document.getAnimations().length), 0);
      await page.evaluate(() => {
        window.pilotOriginal = {
          input: document.getElementById("memo"),
          mounts: window.pilotMounts,
          refs: window.pilotRefs.length,
          texts: [
            "#title [data-slot=card-text]",
            "#label-button [data-slot=button-text]",
            "#label-badge [data-slot=badge-text]",
          ].map((s) => document.querySelector(s).firstChild),
        };
      });
      await update({ label: "Status bravo", count: 20 });
      await page.waitForTimeout(45);
      row.shared = await page.evaluate(() => ({
        identity: [
          "#title [data-slot=card-text]",
          "#label-button [data-slot=button-text]",
          "#label-badge [data-slot=badge-text]",
        ].every((s, i) => document.querySelector(s).firstChild === window.pilotOriginal.texts[i]),
        labels: ["label-button", "label-badge", "title"].map((id) => document.getElementById(id).textContent),
        paint: document.querySelectorAll("[data-cadence-text-layer] canvas").length,
        reels: document.querySelectorAll("[data-cadence-reel]").length,
        text: [...document.querySelectorAll("[data-slot=button-number],[data-slot=badge-number]")].map(
          (n) => n.textContent,
        ),
        duplicateIDs: [...document.querySelectorAll("[id]")].map((n) => n.id).filter((id, i, a) => a.indexOf(id) !== i),
      }));
      assert(row.shared.identity);
      assert.deepEqual(row.shared.labels, Array(3).fill("Status bravo"));
      assert.deepEqual(row.shared.text, ["20", "20"]);
      assert.deepEqual(row.shared.duplicateIDs, []);
      if (effective !== "none") assert(row.shared.paint > 0, "shared plain content must paint actual changed runs");
      else assert.equal(row.shared.paint, 0);
      if (effective === "full") assert(row.shared.reels > 0, "direct quantities must execute actual reels");
      else assert.equal(row.shared.reels, 0);
      row.checks.push("shared Button/Badge content with retained native Text and exact quantities");
      await idle();
      await update({ size: "sm" });
      row.geometry = [];
      for (let i = 0; i < 4; i++) {
        await page.waitForTimeout(25);
        const sample = await page.evaluate(inspect);
        singleOwners(sample);
        row.geometry.push(sample);
      }
      const sizes = row.geometry.flatMap((s) =>
        s.rows.filter((r) => r.properties.some((p) => p === "width" || p === "height")),
      );
      if (effective === "full") {
        assert(
          sizes.some((r) => r.id === "outer"),
          "outer Card must execute the shared geometry transaction",
        );
        assert(
          Math.abs(row.geometry[0].size.height - row.geometry.at(-1).size.height) > 0.1,
          "shared geometry must actually interpolate across sampled frames",
        );
      } else assert.equal(sizes.length, 0);
      assert(
        row.geometry.every((sample) => Math.abs(sample.labelWidth - row.geometry[0].labelWidth) < 0.1),
        "nested geometry must never stretch the native label",
      );
      assert(
        !sizes.some((r) => ["inner", "label-button", "number-button", "label-badge", "number-badge"].includes(r.id)),
        "nested same-cause size must delegate to Card",
      );
      await page.evaluate(() => {
        window.pilotSizeHandles = document.getElementById("outer").getAnimations();
      });
      await update({ refKey: 1 });
      row.refHandoff = await page.evaluate(() => ({
        before: window.pilotSizeHandles.length,
        after: document.getElementById("outer").getAnimations().length,
        same: window.pilotSizeHandles.every((a) => document.getElementById("outer").getAnimations().includes(a)),
      }));
      if (effective === "full")
        assert(row.refHandoff.before > 0 && row.refHandoff.same, "ref handoff must preserve the parent owner");
      await update({ childMode: "none" });
      row.childPolicy = await page.evaluate(() => ({
        before: window.pilotSizeHandles.length,
        after: document.getElementById("outer").getAnimations().length,
        same: window.pilotSizeHandles.every((a) => document.getElementById("outer").getAnimations().includes(a)),
        mode: document.getElementById("inner").dataset.motion,
      }));
      assert.equal(row.childPolicy.mode, "none");
      if (effective === "full")
        assert(row.childPolicy.before > 0 && row.childPolicy.same, "child None must preserve the parent owner");
      await page.evaluate(() => {
        const text = document.getElementById("memo").firstChild;
        text.replaceData(0, text.length, text.data);
      });
      if (effective === "full")
        assert(
          await page.evaluate(() =>
            window.pilotSizeHandles.every((a) => document.getElementById("outer").getAnimations().includes(a)),
          ),
          "equal character-data writes retain the current geometry owner",
        );
      await page.evaluate(() => {
        document.getElementById("memo").firstChild.data = "A genuinely changed native default";
      });
      await page.waitForFunction(() => document.getElementById("outer").getAnimations().length === 0);
      row.checks.push("equal native default-text writes preserve geometry; actual text mutation invalidates it");
      await update({ mode: "none" });
      await idle();
      await page.setViewportSize({ width: 760, height: 1300 });
      await update({ wide: false });
      row.resting = await page.evaluate(() => ({
        width: document.getElementById("outer").getBoundingClientRect().width,
        style: document.getElementById("outer").style.cssText,
        inner: document.getElementById("inner").style.cssText,
      }));
      assert(row.resting.width <= 350 && row.resting.width > 200);
      assert(
        !/\b(?:width|height):\s*\d+px/.test(row.resting.style),
        "temporary dimensions must release to native layout",
      );
      row.checks.push("one nested Card geometry owner, child mode/ref isolation and responsive resting layout");
      await update({ mode, childMode: undefined, wide: true });
      await idle();
      await page.locator("#memo").fill("retained user draft");
      await page.locator("#local").click();
      await page.locator("#tab-b").focus();
      await page.keyboard.press("Enter");
      await page.waitForFunction(() => document.getElementById("tab-b").getAttribute("aria-selected") === "true");
      assert.equal(await page.locator('[data-pilot-panel="a"]').getAttribute("hidden"), "");
      await page.locator("#tab-a").focus();
      await page.keyboard.press("Enter");
      await idle();
      assert(
        await page.evaluate(
          () =>
            document.getElementById("memo") === window.pilotOriginal.input &&
            window.pilotMounts === window.pilotOriginal.mounts,
        ),
      );
      assert.equal(await page.locator("#memo").inputValue(), "retained user draft");
      assert.equal(await page.locator("#local").textContent(), "Local 1");
      assert.equal(await page.locator("#memo").count(), 1);
      assert(
        await page
          .locator("#tab-a")
          .evaluate(
            (n) => document.getElementById(n.getAttribute("aria-controls"))?.getAttribute("data-pilot-panel") === "a",
          ),
      );
      row.checks.push("Tabs native keyboard selection and keepMounted form/state identity through nested surfaces");
      await page.locator("#select").click();
      await page.waitForFunction(() => document.activeElement?.id === "option-a");
      assert(await page.locator("#popup").evaluate((n) => !document.getElementById("outer").contains(n)));
      await page.locator("#option-b").click();
      row.flight = await page.evaluate(() => ({
        text: document.querySelector("#select [data-select-value-text]").textContent,
        paint: document.querySelector("[data-cadence-handoff-paint]")?.dataset.cadenceFlightText ?? null,
        selections: window.pilotSelections,
        entries: [...new FormData(document.getElementById("form"))],
      }));
      assert.equal(row.flight.text, "Plan BBB");
      assert.equal(row.flight.selections, 1);
      assert.deepEqual(row.flight.entries, [
        ["memo", "retained user draft"],
        ["plan", "b"],
      ]);
      if (effective === "full")
        assert.equal(row.flight.paint, "BBB", "nested real accepted source must hand off only its changed run");
      else assert.equal(row.flight.paint, null);
      await update({ refKey: 2 });
      if (effective === "full") assert.equal(await page.locator("[data-cadence-handoff-paint]").count(), 1);
      await update({ mode: "reduced" });
      assert.equal(await page.locator("[data-cadence-handoff-paint]").count(), 0);
      await update({ mode: "none", clock: 0 });
      await idle();
      await page.waitForFunction(
        () =>
          !document.getElementById("popup")?.checkVisibility() &&
          document.activeElement?.id === "select" &&
          window.pilotOpenCompletions?.at(-1) === false,
      );
      row.retainedNativeClose = await page.locator("#popup").count();
      assert.equal(await page.evaluate(() => window.pilotSelections), 1);
      row.checks.push(
        "Select portalled changed-run handoff, immediate form commit, local ref continuity and live cancellation",
      );
      await update({ mode, clock: 4, later: true });
      const insertion = await page.locator("#inserted").evaluate((n) => ({
        parent: n.getAnimations().length,
        child: [...n.querySelectorAll("#inserted-button,#inserted-badge")].flatMap((c) => c.getAnimations()).length,
      }));
      if (effective !== "none") assert(insertion.parent > 0, "one Card insertion envelope");
      assert.equal(insertion.child, 0, "parent insertion consumes child entrances once");
      await update({ later: false, mode: "none", clock: 0 });
      await page.waitForFunction(() => !document.getElementById("inserted"));
      await update({ show: false });
      await idle();
      assert.equal(await page.locator(layers).count(), 0);
      assert.equal(await page.evaluate(() => window.pilotMounts - window.pilotUnmounts), 0);
      assert.equal(
        await page.evaluate(
          () => window.pilotRefs.filter((r) => !r.cleanup).length - window.pilotRefs.filter((r) => r.cleanup).length,
        ),
        0,
      );
      await update({ mode, clock: 4, label: "Status delta" });
      assert.equal(await page.locator("#independent-badge").textContent(), "Status delta");
      row.checks.push("parent entrance/zero-clock exit, unmount cleanup and surviving independent owner");
      await context.close();
    }
  for (const theme of ["light", "dark"])
    for (const width of [390, 1280]) {
      const context = await browser.newContext({ viewport: { width, height: 1300 } }),
        page = await context.newPage();
      await page.goto(url);
      await page.waitForFunction(() => window.pilotsReady);
      await page.evaluate((theme) => document.documentElement.classList.toggle("dark", theme === "dark"), theme);
      await page.evaluate(() => window.pilotsUpdate({ mode: "none" }));
      const reopen = async () => {
        if (!(await page.locator("#popup").isVisible())) await page.locator("#select").click();
        await page.waitForFunction(() => document.getElementById("option-a")?.checkVisibility());
      };
      const closed = await accessible(page, reopen);
      await page.screenshot({ path: path.join(output, `${theme}-${width}.png`), fullPage: true });
      await page.locator("#select").click();
      await page.waitForFunction(() => document.activeElement?.id === "option-a");
      const open = await accessible(page, reopen);
      await page.screenshot({ path: path.join(output, `${theme}-${width}-popup.png`), fullPage: true });
      report.visuals.push({ theme, width, closed, open });
      await context.close();
    }
  const context = await browser.newContext({ javaScriptEnabled: false }),
    page = await context.newPage();
  await page.goto(url);
  assert.equal(await page.locator("#label-button").textContent(), "Status alpha");
  assert.equal(await page.locator("#label-badge").textContent(), "Status alpha");
  assert.equal(await page.locator("#select [data-slot=select-value]").textContent(), "Plan AAA");
  assert.equal(await page.locator(layers).count(), 0);
  await context.close();
  report.noJS = true;
  assert.deepEqual(report.errors, []);
  report.passed = true;
} catch (e) {
  report.failure = e.stack;
  report.terminal = await currentPage
    ?.evaluate(() => ({
      animations: document.getAnimations().map((a) => ({
        id: a.effect?.target?.id,
        slot: a.effect?.target?.dataset?.slot,
        state: a.playState,
        frames: a.effect?.getKeyframes(),
      })),
      layers: [
        ...document.querySelectorAll(
          "[data-cadence-text-layer],[data-cadence-number-layer],[data-cadence-handoff-layer]",
        ),
      ].map((n) => n.outerHTML),
      focus: document.activeElement?.id,
    }))
    .catch(() => null);
  process.exitCode = 1;
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
  report.resources.closed = true;
  await writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2));
}
