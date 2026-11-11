import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";
import tailwind from "@tailwindcss/postcss";
import postcss from "postcss";

const output = path.resolve(
  process.env.HANDOFF_OUTPUT ?? `.cache/motion-v2-execution/s08c-captured-origin/browser-${Date.now()}`,
);
await mkdir(output, { recursive: false });
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const require = createRequire(import.meta.url);
const vite = require.resolve("vite", { paths: [require.resolve("vitest/node")] });
const { build } = await import(pathToFileURL(require.resolve("esbuild", { paths: [vite] })));
const plugins = [];
if (process.env.HANDOFF_COPY)
  plugins.push({
    name: "installed-only",
    setup(b) {
      b.onResolve({ filter: /registry[\\/]cadence[\\/]/ }, (args) => {
        const dest = path.resolve(
          process.env.HANDOFF_COPY,
          args.path.replaceAll("\\", "/").split("registry/cadence/")[1],
        );
        const file = [`${dest}.tsx`, `${dest}.ts`, path.join(dest, "index.tsx")].find(existsSync);
        assert(file, "No workspace fallback");
        return { path: file };
      });
    },
  });
if (process.env.HANDOFF_REACT_ROOT)
  plugins.push({
    name: "consumer-react",
    setup(b) {
      b.onResolve({ filter: /^(react|react-dom)(\/.*)?$/ }, (args) => ({
        path: require.resolve(args.path, { paths: [process.env.HANDOFF_REACT_ROOT] }),
      }));
    },
  });
if (process.env.HANDOFF_FAULT)
  plugins.push({
    name: "invalid-mapping-negative",
    setup(b) {
      b.onLoad({ filter: /captured-handoff\.ts$/ }, async (args) => {
        const source = await readFile(args.path, "utf8");
        const next = source.replace('const stop = () => finish("cancel");', "const stop = () => {};");
        assert.notEqual(next, source);
        await writeFile(path.join(output, "fault.ts"), next);
        return { contents: next, loader: "ts" };
      });
    },
  });
if (!process.env.HANDOFF_FAULT)
  plugins.push({
    name: "observe-installed-handoff-drivers",
    setup(b) {
      b.onLoad({ filter: /captured-handoff\.ts$/ }, async (args) => {
        const source = await readFile(args.path, "utf8");
        return {
          loader: "ts",
          contents:
            source.replace(
              "import { animateSingleValue,",
              "import { animateSingleValue as installedAnimateSingleValue,",
            ) +
            `
function animateSingleValue(...args) { const controls = installedAnimateSingleValue(...args); (window.handoffDrivers ??= []).push({value:args[0], target:args[1], options:args[2], controls}); return controls; }
`,
        };
      });
    },
  });
const common = {
  plugins,
  bundle: true,
  write: false,
  metafile: true,
  jsx: "automatic",
  define: { "process.env.NODE_ENV": JSON.stringify(process.env.HANDOFF_STRICT ? "development" : "production") },
};
const bundle = await build({ ...common, entryPoints: ["tests/runtime/captured-handoff.jsx"], format: "iife" });
const ssr = await build({
  ...common,
  entryPoints: ["tests/runtime/captured-handoff-ssr.jsx"],
  format: "cjs",
  platform: "node",
  packages: process.env.HANDOFF_REACT_ROOT ? undefined : "external",
});
await writeFile(path.join(output, "ssr.cjs"), ssr.outputFiles[0].text);
const markup = require(path.join(output, "ssr.cjs")).html;
const css = (
  await postcss([tailwind()]).process(await readFile("app/globals.css", "utf8"), {
    from: path.resolve("app/globals.css"),
  })
).css;
const client = bundle.outputFiles[0].text;
await writeFile(path.join(output, "executed.js"), client);
await writeFile(path.join(output, "compiled.css"), css);
await writeFile(path.join(output, "runner.mjs"), await readFile(new URL(import.meta.url)));
const report = {
  runnerSHA: hash(await readFile(new URL(import.meta.url))),
  inputs: {},
  ssrInputs: {},
  clientSHA: hash(client),
  cssSHA: hash(css),
  cases: [],
  failures: [],
  errors: [],
  consoleErrors: [],
  resources: {},
};
for (const [name, meta] of [
  ["inputs", bundle.metafile],
  ["ssrInputs", ssr.metafile],
])
  for (const file of Object.keys(meta.inputs)) report[name][file] = hash(await readFile(file));
const server = http.createServer((req, res) => {
  res.setHeader(
    "content-type",
    req.url === "/bundle.js" ? "text/javascript; charset=utf-8" : "text/html; charset=utf-8",
  );
  res.end(
    req.url === "/bundle.js"
      ? client
      : `<!doctype html><html class="${process.env.HANDOFF_DARK ? "dark" : ""}"><style>${css}</style><div id="root">${markup}</div><script>window.handoffSSR=true;window.handoffStrict=${Boolean(process.env.HANDOFF_STRICT)}</script><script src="/bundle.js"></script>`,
  );
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
page.setDefaultTimeout(5000);
page.on("pageerror", (e) => report.errors.push(e.stack));
page.on("console", (m) => {
  if (m.type() === "error") report.consoleErrors.push(m.text());
});
const frames = () =>
  page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const test = async (name, fn) => {
  if (process.env.HANDOFF_FILTER && !new RegExp(process.env.HANDOFF_FILTER).test(name)) return;
  try {
    const evidence = await fn();
    report.cases.push({ name, passed: true, evidence });
    console.log(JSON.stringify({ name, passed: true }));
  } catch (e) {
    report.failures.push({
      name,
      error: e.stack,
      debug: await page.evaluate(() => ({
        trace: window.handoffTrace,
        html: document.getElementById("native-form")?.outerHTML,
      })),
    });
    report.cases.push({ name, passed: false });
    console.log(JSON.stringify({ name, passed: false, error: e.message }));
  }
};
const setup = (options) => page.evaluate((options) => window.directSetup(options), options);
const sample = () => page.evaluate(() => window.direct.sample());
const flight = page.locator("[data-cadence-handoff-paint]");
async function reset() {
  await page.evaluate(() => {
    window.direct?.owner?.dispose();
    window.handoffReset();
  });
  await frames();
}
async function select(label = "BBB") {
  const trigger = page.getByRole("combobox", { name: "Pilot", exact: true });
  await trigger.click();
  await page.getByRole("option", { name: label, exact: true }).waitFor();
  await page.waitForTimeout(180);
  await page.getByRole("option", { name: label, exact: true }).click();
  return trigger;
}
try {
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => window.handoffReady);
  report.react = await page.evaluate(() => window.handoffReact);
  await test("SSR hydration has current native baseline without flight", async () => {
    assert(!markup.includes("data-cadence-handoff-layer"));
    assert.equal(await flight.count(), 0);
    return { react: report.react, htmlSHA: hash(markup) };
  });
  for (const mode of ["full", "reduced", "none"])
    await test(`direct actual ${mode} policy and paint-only retention`, async () => {
      await page.evaluate((mode) => window.handoffUpdate({ mode }), mode);
      const start = await setup();
      assert.equal(start.after.paint, mode === "full");
      assert.equal(start.after.opacity, mode === "full" ? "0" : "1");
      assert.deepEqual(start.after.extent, start.before.extent);
      assert.deepEqual(start.after.fields, start.before.fields);
      assert.deepEqual(start.after.ids, start.before.ids);
      if (mode === "full") {
        assert.deepEqual(start.after.decoration, {
          text: "",
          children: 0,
          layerChildren: 1,
          inert: true,
          hidden: "true",
          ids: 0,
        });
        await frames();
        assert((await sample()).paint);
      }
      await page.evaluate(() => window.direct.cancel());
      const end = await sample();
      assert.equal(end.opacity, "1");
      assert(!end.paint);
      return { start, end };
    });
  await page.evaluate(() => window.handoffUpdate({ mode: "full" }));
  for (const options of [{ hidden: true }, { unsafe: true }, { editable: true }])
    await test(`missing/unsafe source ${JSON.stringify(options)} never restores an origin`, async () => {
      const start = await setup(options);
      assert(!start.after.paint);
      assert.deepEqual(start.after.events, ["fallback"]);
      await page.evaluate(() => window.direct.commit());
      assert(!(await sample()).paint);
      return start;
    });
  await test("captured source retires through its native lifecycle", async () => {
    const start = await setup({ retire: true });
    assert(start.after.paint);
    await frames();
    const end = await sample();
    assert(end.paint);
    assert.equal(end.sourceReads, 1);
    return { start, end };
  });
  await test("ordinary completion releases decoration and native current paint", async () => {
    await setup();
    await flight.waitFor({ state: "attached" });
    await flight.waitFor({ state: "detached", timeout: 15000 });
    const end = await sample();
    assert.deepEqual(end.events, ["complete"]);
    assert.equal(end.opacity, "1");
    return end;
  });
  for (const [name, action] of [
    [
      "differential source scroll",
      () => {
        window.direct.outer.scrollTop = 10;
      },
    ],
    [
      "destination passive relocation",
      () => {
        window.direct.dest.style.left = "240px";
      },
    ],
    [
      "destination portal reparent",
      () => {
        document.body.append(window.direct.dest);
      },
    ],
    [
      "viewport mapping correction",
      () => {
        window.visualViewport.dispatchEvent(new Event("scroll"));
      },
    ],
    [
      "page visibility suspension",
      () => {
        window.dispatchEvent(new Event("pagehide"));
      },
    ],
    [
      "print",
      () => {
        window.dispatchEvent(new Event("beforeprint"));
      },
    ],
    [
      "destination host retirement",
      () => {
        window.direct.dest.remove();
      },
    ],
    [
      "direction change",
      () => {
        window.direct.dest.dir = "rtl";
      },
    ],
  ])
    await test(`${name} cancels without destination fallback replay`, async () => {
      await setup();
      assert((await sample()).paint);
      await page.evaluate(action);
      await frames();
      const end = await sample();
      assert(!end.paint);
      if (name === "destination host retirement") assert.equal(end.opacity, "");
      else assert.equal(end.opacity, "1");
      assert.deepEqual(end.events, ["cancel"]);
      await page.evaluate(() => {
        window.direct.commit();
        window.dispatchEvent(new Event("pageshow"));
        window.dispatchEvent(new Event("afterprint"));
      });
      assert(!(await sample()).paint);
      return end;
    });
  await test("genuine common ancestor local scrolling preserves the flight", async () => {
    const start = await setup({ local: true });
    assert(start.after.paint);
    await page.evaluate(() => {
      window.direct.outer.scrollTop = 10;
    });
    await frames();
    const after = await sample();
    assert(after.paint);
    assert.deepEqual(after.events, []);
    await page.evaluate(() => window.direct.cancel());
    return { start, after };
  });
  await test("inner-frame differential scroll still cancels local flight", async () => {
    await setup({ local: true });
    await page.evaluate(() => {
      window.direct.frame.style.overflow = "auto";
      window.direct.frame.dispatchEvent(new Event("scroll"));
    });
    await frames();
    const after = await sample();
    assert(!after.paint);
    assert.deepEqual(after.events, ["cancel"]);
    return after;
  });
  for (const count of [48, 49])
    await test(`aggregate visual preflight includes shell and outgoing work at ${count}+2`, async () => {
      const start = await setup({ work: count });
      assert.equal(start.after.paint, count === 48);
      if (count === 49) {
        assert.equal(start.after.destReads, 0);
        assert.deepEqual(start.after.events, ["prior-cancel", "fallback"]);
      }
      return start;
    });
  await test("positive physics retime keeps host, zero cancels and same revision never restarts", async () => {
    await setup();
    const before = await sample();
    const after = await page.evaluate(() => {
      const host = document.querySelector("[data-cadence-handoff-paint]");
      window.direct.commit({ transition: { ...window.handoffCM.transition("handoff"), visualDuration: 4 } });
      return { same: host === document.querySelector("[data-cadence-handoff-paint]"), sample: window.direct.sample() };
    });
    assert(after.same);
    await page.evaluate(() => window.direct.commit({ transition: { duration: 0 } }));
    const zero = await sample();
    assert(!zero.paint);
    assert.deepEqual(zero.events, ["cancel"]);
    await page.evaluate(() => window.direct.commit());
    assert(!(await sample()).paint);
    return { before, after, zero };
  });
  await test("cancel before first paint, retired callback and owner replacement stay terminal", async () => {
    const result = await setup();
    await page.evaluate(() => {
      window.direct.cancel();
      window.direct.tx.cancel();
      window.direct.commit();
    });
    await frames();
    const end = await sample();
    assert(!end.paint);
    assert.deepEqual(end.events, ["cancel"]);
    return { result, end };
  });
  await test("repeated snapshot disposal preserves the newer shared environment registration", async () => {
    const result = await page.evaluate(() => window.captureDisposalIsolation());
    assert.deepEqual(result, { afterRepeatedDispose: 1, afterNewCapture: 1, afterCleanup: 0 });
    return result;
  });
  await test("disposed capture cannot be revived by a new revision", async () => {
    const start = await setup({ disposed: true });
    assert(!start.after.paint);
    assert.equal(start.after.opacity, "1");
    assert.deepEqual(start.after.events, ["fallback"]);
    return start;
  });
  await test("disposing capture cancels its active flight without replacement replay", async () => {
    await setup();
    await page.evaluate(() => window.direct.capture.dispose());
    await frames();
    const end = await sample();
    assert(!end.paint);
    assert.equal(end.opacity, "1");
    assert.deepEqual(end.events, ["cancel"]);
    await page.evaluate(() => window.direct.commit());
    assert(!(await sample()).paint);
    return end;
  });
  await test("coincident endpoints finish without an animation-only wait", async () => {
    const start = await setup({ coincident: true });
    assert(!start.after.paint);
    assert.equal(start.after.opacity, "1");
    assert.deepEqual(start.after.events, ["fallback"]);
    return start;
  });
  await test("live caller opacity is preserved on cancellation", async () => {
    await setup();
    await page.evaluate(() => {
      window.direct.dest.style.opacity = "0.6";
    });
    await frames();
    const end = await sample();
    assert(!end.paint);
    assert.equal(end.opacity, "0.6");
    assert.deepEqual(end.events, ["cancel"]);
    return end;
  });
  await test("actual OS reduction and forced colours cancel without restoring old flight", async () => {
    await setup();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await frames();
    const reduced = await sample();
    assert(!reduced.paint);
    assert.deepEqual(reduced.events, ["cancel"]);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await frames();
    await setup();
    await page.emulateMedia({ forcedColors: "active" });
    await frames();
    const forced = await sample();
    assert(!forced.paint);
    assert.deepEqual(forced.events, ["cancel"]);
    await page.emulateMedia({ forcedColors: "none" });
    await frames();
    await page.evaluate(() => window.direct.commit());
    assert(!(await sample()).paint);
    return { reduced, forced };
  });
  await test("actual viewport resize invalidates captured viewport mapping without restoration replay", async () => {
    await setup();
    assert((await sample()).paint);
    await page.setViewportSize({ width: 1200, height: 950 });
    await frames();
    const end = await sample();
    assert(!end.paint);
    assert.deepEqual(end.events, ["cancel"]);
    await page.setViewportSize({ width: 1280, height: 1000 });
    await page.evaluate(() => window.direct.commit());
    assert(!(await sample()).paint);
    return end;
  });
  await test("retired source outside authorized native lifecycle cancels", async () => {
    await setup();
    await page.evaluate(() => window.direct.retire());
    await frames();
    const end = await sample();
    assert(!end.paint);
    assert.deepEqual(end.events, ["cancel"]);
    return end;
  });
  await test("old driver completion cannot release a new revision", async () => {
    await setup();
    await page.evaluate(() => {
      window.oldHandoffCompletions = window.handoffDrivers.slice(-2).map((driver) => driver.options.onComplete);
    });
    await setup();
    const before = await sample();
    await page.evaluate(() =>
      window.oldHandoffCompletions.forEach((done) => {
        done();
      }),
    );
    await frames();
    const after = await sample();
    assert(after.paint);
    assert.deepEqual(after.events, []);
    return { before, after };
  });
  await test("independent identical revision keys keep separate native hosts and terminal callbacks", async () => {
    await setup();
    const both = await page.evaluate(() => window.direct.startOther());
    assert(both);
    await frames();
    assert.equal(await flight.count(), 2);
    await page.evaluate(() => window.direct.cancel());
    await frames();
    assert.equal(await flight.count(), 1);
    assert.deepEqual((await sample()).events, ["cancel"]);
    return { remaining: await flight.count() };
  });
  await test("no frame-time endpoint tracking and explicit source mapping invalidation", async () => {
    await setup();
    await frames();
    const before = await sample();
    await page.waitForTimeout(100);
    const during = await sample();
    assert.equal(during.sourceReads, before.sourceReads);
    assert.equal(during.destReads, before.destReads);
    await page.evaluate(() => window.direct.capture.invalidate());
    await frames();
    const after = await sample();
    assert.deepEqual(after.events, ["cancel"]);
    assert(!after.paint);
    return { before, during, after };
  });
  await test("live native editor keeps selection, input and pointer capture during disjoint flight", async () => {
    await setup();
    const result = await page.evaluate(() => {
      const input = document.getElementById("native-editor");
      input.focus();
      input.setSelectionRange(1, 3);
      input.addEventListener("pointerdown", (e) => input.setPointerCapture(e.pointerId), { once: true });
      return {
        value: input.value,
        selection: [input.selectionStart, input.selectionEnd],
        focused: document.activeElement === input,
        flight: window.direct.sample().paint,
      };
    });
    assert.deepEqual(result, { value: "saved", selection: [1, 3], focused: true, flight: true });
    await page.keyboard.type("X");
    assert.equal(await page.locator("#native-editor").inputValue(), "sXed");
    await page.mouse.move(70, 10);
    await page.mouse.down();
    const captured = await page.evaluate(() => document.getElementById("native-editor").hasPointerCapture(1));
    await page.evaluate(() => window.direct.cancel());
    await page.mouse.up();
    assert(captured);
    return { result, captured };
  });
  await test("real Select accepts event-linked disjoint labels and preserves form/focus", async () => {
    await reset();
    const trigger = await select();
    await flight.waitFor({ state: "attached" });
    assert.equal(await trigger.locator('[data-slot="select-value"]').textContent(), "BBB");
    const initialFocus = await page.evaluate(() => document.activeElement?.getAttribute("data-slot"));
    await page.waitForFunction(() => document.activeElement === document.querySelector('[aria-label="Pilot"]'));
    const active = await page.evaluate(() => document.activeElement?.getAttribute("data-slot"));
    assert.equal(active, "select-trigger");
    const semantic = await page.evaluate(() => ({
      fields: [...new FormData(document.getElementById("native-form"))],
      ids: [...document.querySelectorAll("[id]")].map((n) => n.id),
    }));
    assert.equal(semantic.fields.filter(([key]) => key === "choice").length, 1);
    await page.screenshot({ path: path.join(output, "select-flight.png") });
    await page.evaluate(() => window.handoffUpdate({ clock: 0 }));
    await frames();
    assert.equal(await flight.count(), 0);
    assert.equal(await trigger.locator('[data-slot="select-value"]').textContent(), "BBB");
    return { initialFocus, active, semantic };
  });
  await test("real Select native object equality preserves the same accepted flight", async () => {
    await reset();
    await page.evaluate(() => window.handoffUpdate({ object: true }));
    await select();
    await flight.waitFor({ state: "attached" });
    const result = await page.evaluate(() => {
      const paint = document.querySelector("[data-cadence-handoff-paint]");
      const host = document.querySelector('[aria-label="Pilot"]');
      const drivers = window.handoffDrivers.length;
      window.handoffUpdate({ tick: 1 });
      return {
        samePaint: paint === document.querySelector("[data-cadence-handoff-paint]"),
        sameHost: host === document.querySelector('[aria-label="Pilot"]'),
        drivers: window.handoffDrivers.length - drivers,
      };
    });
    assert.deepEqual(result, { samePaint: true, sameHost: true, drivers: 0 });
    await frames();
    assert.equal(await flight.count(), 1);
    return result;
  });
  await test("real Select transfers only a single changed range while retaining native AA", async () => {
    await reset();
    const before = await page
      .getByRole("combobox", { name: "Pilot", exact: true })
      .locator("[data-select-value-text]")
      .evaluate((n) => {
        window.nativeSelectText = n.firstChild;
        return n.textContent;
      });
    const trigger = await select("AAB");
    await flight.waitFor({ state: "attached" });
    assert.equal(await flight.getAttribute("data-cadence-flight-text"), "B");
    assert.equal(await trigger.locator('[data-slot="select-value"]').textContent(), "AAB");
    assert(await trigger.locator("[data-select-value-text]").evaluate((n) => n.firstChild === window.nativeSelectText));
    return { before, changedRun: "B", retained: "AA" };
  });
  for (const mode of ["reduced", "none"])
    await test(`real Select ${mode} starts and stays native`, async () => {
      await reset();
      await page.evaluate((mode) => window.handoffUpdate({ mode }), mode);
      await select();
      await frames();
      assert.equal(await flight.count(), 0);
      return { mode };
    });
  for (const [name, patch, label] of [
    ["rejected request", { reject: true }, "BBB"],
    ["delayed accepted echo", { delay: true }, "BBB"],
    ["callback formatter", { format: true }, "BBB"],
    ["rich label", { rich: true }, "BBB"],
  ])
    await test(`real Select ${name} never borrows an unsafe origin`, async () => {
      await reset();
      await page.evaluate((patch) => window.handoffUpdate(patch), patch);
      const trigger = await select(label);
      await frames();
      assert.equal(await flight.count(), 0);
      if (patch.delay) {
        await page.evaluate(() => window.handoffUpdate({ value: window.handoffPending }));
        await frames();
        assert.equal(await flight.count(), 0);
      }
      return { text: await trigger.textContent() };
    });
  await test("real Select live none cancels two isolated instances only within provider scope", async () => {
    await reset();
    await select();
    await flight.waitFor({ state: "attached" });
    await page.evaluate(() => window.handoffUpdate({ mode: "none" }));
    await frames();
    assert.equal(await flight.count(), 0);
    assert.equal(
      await page
        .getByRole("combobox", { name: "Independent", exact: true })
        .locator('[data-slot="select-value"]')
        .textContent(),
      "AAA",
    );
    return {};
  });
  await page.screenshot({ path: path.join(output, "terminal.png") });
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  report.resources = { browserClosed: true, serverClosed: !server.listening };
  await writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2));
}
console.log(
  JSON.stringify({
    output,
    cases: report.cases.length,
    failures: report.failures,
    errors: report.errors,
    consoleErrors: report.consoleErrors,
  }),
);
if (report.failures.length || report.errors.length || report.consoleErrors.length) process.exitCode = 1;
