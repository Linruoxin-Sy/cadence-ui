import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";
import { chromium } from "@playwright/test";
import { installationCss } from "../../scripts/installation.mjs";

assert(process.env.PUBLIC_REVEAL_OUTPUT, "Use a fresh evidence directory");
const out = path.resolve(process.env.PUBLIC_REVEAL_OUTPUT);
await mkdir(out, { recursive: false });
const require = createRequire(import.meta.url);
const vite = require.resolve("vite", { paths: [require.resolve("vitest/node")] });
const { build } = await import(pathToFileURL(require.resolve("esbuild", { paths: [vite] })));
const hash = (b) => createHash("sha256").update(b).digest("hex");
const report = {
  scope: "S14 public manual payload installation and native composition",
  installed: {},
  profiles: [],
  inputs: {},
  failures: [],
  errors: [],
  resourcesClosed: false,
};
const styles = [];
// Each primitive resolves independently from the actual built payload, with no host aliases.
for (const entry of ["reveal", "reveal-group"]) {
  const root = path.join(out, entry, "components/cadence"),
    queue = [entry],
    seen = new Set(),
    files = [];
  while (queue.length) {
    const id = queue.shift();
    if (seen.has(id)) continue;
    seen.add(id);
    const bytes = await readFile(`public/r/${id}.json`),
      item = JSON.parse(bytes);
    report.inputs[`public/r/${id}.json`] = hash(bytes);
    if (entry === "reveal-group" && (item.css || item.cssVars)) styles.push(installationCss(item));
    for (const dep of item.registryDependencies ?? []) {
      assert(dep.startsWith("@cadence/"));
      queue.push(dep.slice(9));
    }
    for (const file of item.files ?? []) {
      assert(file.target.startsWith("@components/cadence/") && !file.target.includes(".."));
      const target = path.resolve(root, file.target.slice(20));
      assert(target.startsWith(root + path.sep));
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, file.content);
      assert.equal(hash(await readFile(file.path)), hash(file.content));
      files.push({ source: file.path, target, sha256: hash(file.content) });
    }
  }
  const consumer = `import {${entry === "reveal" ? "Reveal" : "RevealGroup"}} from './components/cadence/${entry}';export const Example=()=>${entry === "reveal" ? "<Reveal render={<section />}>Native</Reveal>" : '<RevealGroup replay="repeat" stagger="cycle">Native</RevealGroup>'};`;
  await writeFile(path.join(out, entry, "consumer.tsx"), consumer);
  await writeFile(
    path.join(out, entry, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "Bundler",
        jsx: "react-jsx",
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        lib: ["DOM", "DOM.Iterable", "ES2022"],
      },
      include: ["components/**/*", "consumer.tsx"],
    }),
  );
  const tsc = spawnSync(
    process.execPath,
    [require.resolve("typescript/bin/tsc"), "--project", path.join(out, entry, "tsconfig.json")],
    { encoding: "utf8", windowsHide: true },
  );
  await writeFile(path.join(out, entry, "typecheck.log"), tsc.stdout + tsc.stderr);
  assert.equal(tsc.status, 0, tsc.stdout + tsc.stderr);
  report.installed[entry] = { items: [...seen], files, typecheck: tsc.status };
}
const copied = path.join(out, "reveal-group/components/cadence");
const plugin = {
  name: "actual-installed-public-hosts",
  setup(b) {
    b.onResolve({ filter: /^\./ }, (args) => {
      const candidate = path.resolve(args.resolveDir, args.path),
        source = path.resolve("registry/cadence");
      if (!candidate.startsWith(source + path.sep)) return;
      const relative = path.relative(source, candidate),
        target = path.join(copied, relative);
      for (const extension of [".ts", ".tsx", "/index.tsx"])
        if (existsSync(target + extension)) return { path: target + extension };
    });
  },
};
const common = { bundle: true, write: false, jsx: "automatic", plugins: [plugin], metafile: true };
const ssr = await build({
  ...common,
  entryPoints: ["tests/runtime/public-reveal-ssr.jsx"],
  packages: "external",
  platform: "node",
  format: "cjs",
});
await writeFile(path.join(out, "ssr.cjs"), ssr.outputFiles[0].contents);
const render = require(path.join(out, "ssr.cjs")).render;
const html = render();
assert(!html.includes("data-cadence-reveal"));
const cssSource = '@import "tailwindcss";\n' + styles.join("\n");
await writeFile(path.join(out, "theme.css"), cssSource);
const css = (
  await require("postcss")([require("@tailwindcss/postcss")()]).process(cssSource, {
    from: path.join(out, "theme.css"),
  })
).css;
await writeFile(path.join(out, "theme-built.css"), css);
let browser,
  server,
  client,
  strict = false,
  initialMode = "full";
try {
  server = http.createServer((req, res) => {
    res.setHeader("Content-Type", req.url === "/client.js" ? "text/javascript" : "text/html");
    res.end(
      req.url === "/client.js"
        ? client
        : `<!doctype html><meta charset="utf-8"><style>${css}body{margin:0;min-height:4200px;font:18px system-ui}input{width:110px;border:1px solid}button{border:1px solid}section,article{color:inherit}@media(prefers-color-scheme:dark){body{background:#111;color:#eee}}</style><div id="root">${render(initialMode)}</div><script>window.publicInitialMode=${JSON.stringify(initialMode)};window.publicStrict=${strict}</script><script src="/client.js"></script>`,
    );
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const url = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true });
  report.browser = browser.version();
  const native = await browser.newContext({ javaScriptEnabled: false });
  const np = await native.newPage();
  await np.goto(url);
  report.noJS = await np.locator('[data-slot="reveal"]').evaluateAll((ns) =>
    ns.map((n) => ({
      id: n.id,
      opacity: getComputedStyle(n).opacity,
      transform: getComputedStyle(n).transform,
      text: n.textContent,
    })),
  );
  assert(report.noJS.every((n) => n.opacity === "1" && n.transform === "none"));
  await native.close();
  for (const profile of ["installed", "strict", "dark", "narrow", "os-reduced"]) {
    strict = profile === "strict";
    const bundled = await build({
      ...common,
      entryPoints: ["tests/runtime/public-reveal.jsx"],
      format: "iife",
      minify: true,
      define: { "process.env.NODE_ENV": JSON.stringify(strict ? "development" : "production") },
    });
    client = bundled.outputFiles[0].contents;
    await writeFile(path.join(out, `${profile}.js`), client);
    await writeFile(path.join(out, `${profile}-metafile.json`), JSON.stringify(bundled.metafile, null, 2));
    for (const f of Object.keys(bundled.metafile.inputs)) report.inputs[f] = hash(await readFile(f));
    const context = await browser.newContext({
      viewport: { width: profile === "narrow" ? 390 : 1280, height: 900 },
      colorScheme: profile === "dark" ? "dark" : "light",
      reducedMotion: profile === "os-reduced" ? "reduce" : "no-preference",
    });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    await page.addInitScript(() => {
      window.publicObserverCount = 0;
      const Native = IntersectionObserver;
      window.IntersectionObserver = class extends Native {
        constructor(...args) {
          super(...args);
          window.publicObserverCount++;
        }
      };
    });
    page.on("pageerror", (e) => report.errors.push({ profile, error: String(e) }));
    page.on("console", (m) => {
      if (m.type() === "error") report.errors.push({ profile, error: m.text() });
    });
    const result = { profile, cases: [] };
    report.profiles.push(result);
    const check = async (name, fn) => {
      await fn();
      result.cases.push(name);
    };
    const opacity = (id) => page.locator(`#${id}`).evaluate((n) => getComputedStyle(n).opacity);
    const pending = async (id = "a") => {
      await page.waitForFunction((id) => document.getElementById(id)?.dataset.cadenceReveal === "pending", id);
    };
    const reload = async () => {
      await page.goto(url);
      await page.waitForFunction(() => window.publicUpdate && window.publicMotion);
    };
    await page.route("**/client.js", async (route) => {
      report.beforeHydration ??= await page
        .locator('[data-slot="reveal"]')
        .evaluateAll((ns) => ns.map((n) => ({ id: n.id, opacity: getComputedStyle(n).opacity })));
      await route.continue();
    });
    await reload();
    assert.equal(await opacity("first"), "1");
    assert.equal(await opacity("nested"), "1");
    assert.equal(await opacity("editable"), "1");
    if (profile === "os-reduced") {
      assert.equal(await opacity("a"), "1");
      assert.equal(await page.locator("[data-cadence-reveal]").count(), 0);
      result.cases.push("OS ceiling: all native visible, no hidden public targets");
      await context.close();
      continue;
    }
    await check("actual installed SSR/hydration, nested consumption and editable fallback", async () => {
      await pending();
      assert.equal(await opacity("a"), "0");
      assert(report.beforeHydration.every((n) => n.opacity === "1"));
    });
    await check("native CSS first-style, actual handles and intermediate frame; default cycle", async () => {
      await page.locator("#a").evaluate((n) => n.scrollIntoView({ block: "center" }));
      await page.waitForFunction(() => document.getElementById("a").getAnimations().length > 0);
      result.entrance = await page.locator("#a").evaluate(async (n) => {
        const handles = n.getAnimations().map((a) => ({
          property: a.transitionProperty,
          frames: a.effect.getKeyframes(),
          timing: a.effect.getTiming(),
        }));
        await new Promise((r) => setTimeout(r, Number(handles[0]?.timing.delay ?? 0) + 100));
        return { handles, opacity: Number(getComputedStyle(n).opacity), transform: getComputedStyle(n).transform };
      });
      assert(
        result.entrance.handles.some(
          (a) => a.property === "opacity" && Number(a.frames[0].opacity) === 0 && Number(a.frames.at(-1).opacity) === 1,
        ),
      );
      assert(result.entrance.opacity > 0 && result.entrance.opacity < 1);
      await page.screenshot({ path: path.join(out, `${profile}-entering.png`) });
      await page.waitForFunction(() => !document.getElementById("a").hasAttribute("data-cadence-reveal"));
    });
    await check("once, live downgrade/cancel/restore and zero no replay", async () => {
      await page.evaluate(() => {
        window.scrollTo(0, 0);
        window.publicUpdate({ mode: "none" });
        window.publicUpdate({ mode: "full" });
      });
      assert.equal(await opacity("a"), "1");
      await reload();
      await pending();
      await page.locator("#a").evaluate((n) => n.scrollIntoView({ block: "center" }));
      await page.waitForFunction(() => document.getElementById("a").getAnimations().length > 0);
      await page.evaluate(() => window.publicUpdate({ mode: "reduced" }));
      assert.equal(await opacity("a"), "1");
      assert.equal(await page.locator("#a").evaluate((n) => n.getAnimations().length), 0);
      await page.evaluate(() => {
        window.scrollTo(0, 0);
        window.publicUpdate({ mode: "full" });
        window.publicUpdate({ timeScale: 0 });
      });
      assert.equal(await page.locator("[data-cadence-reveal]").count(), 0);
      await page.evaluate(() => window.publicUpdate({ timeScale: 4 }));
      assert.equal(await opacity("a"), "1");
    });
    await check("equivalent policy and keyed reorder preserve slot and physical lifetime", async () => {
      await reload();
      await pending();
      await page.evaluate(() => {
        window.savedA = document.getElementById("a");
        window.publicUpdate({ version: 1, timeScale: 1, ids: ["c", "a", "b"] });
      });
      assert(await page.evaluate(() => window.savedA === document.getElementById("a")));
      await pending();
      await page.locator("#a").evaluate((n) => n.scrollIntoView({ block: "center" }));
      await page.waitForFunction(() => document.getElementById("a").getAnimations().length > 0);
      const delay = await page.locator("#a").evaluate(
        (n) =>
          n
            .getAnimations()
            .find((a) => a.transitionProperty === "opacity")
            .effect.getTiming().delay,
      );
      assert.equal(delay, 55); // first-screen slot0, a slot1 at unit clock
      await page.evaluate(() => window.publicUpdate({ version: 2 }));
      assert(await page.locator("#a").evaluate((n) => n.getAnimations().length > 0));
    });
    await check("policy/root revisions consume current hosts; later mounts use current policy", async () => {
      await reload();
      await pending();
      await page.evaluate(() => window.publicUpdate({ amount: 0.2 }));
      assert.equal(await opacity("a"), "1");
      await page.evaluate(() => window.publicUpdate({ ids: ["a", "b", "c", "d"] }));
      await pending("d");
      await page.evaluate(() => window.publicUpdate({ root: document.getElementById("root") }));
      assert.equal(await opacity("d"), "1");
      await page.evaluate(() => window.publicUpdate({ root: null, amount: 0.08 }));
      assert.equal(await opacity("a"), "1");
    });
    await check("repeat leave/reentry, focused subtree never hidden", async () => {
      await reload();
      await page.evaluate(() => window.publicUpdate({ replay: "repeat", ids: ["a", "b", "c", "d"] }));
      await pending("d");
      await page.locator("#d").evaluate((n) => n.scrollIntoView({ block: "center" }));
      await page.waitForFunction(() => document.getElementById("d").getAnimations().length > 0);
      await page.waitForFunction(() => !document.getElementById("d").hasAttribute("data-cadence-reveal"));
      await page.evaluate(() => window.scrollTo(0, 0));
      await pending("d");
      await page.locator("#d button").focus();
      assert.equal(await opacity("d"), "1");
      await page.evaluate(() => window.scrollTo(0, 0));
      assert.equal(await opacity("d"), "1");
    });
    await check("invisible activation, trusted focus/keyboard/input and hash semantics", async () => {
      await reload();
      await pending();
      await page.locator("#a button").evaluate((n) => n.click());
      assert(!(await page.evaluate(() => window.publicEvents)).includes("a"));
      await page.locator("#a button").focus();
      assert.equal(await opacity("a"), "1");
      await page.locator("#a button").press("Space");
      assert((await page.evaluate(() => window.publicEvents)).includes("a"));
      await page.getByLabel("Edit a", { exact: true }).fill("native input");
      await page.evaluate(() => window.publicUpdate({ version: 4 }));
      assert.equal(await page.getByLabel("Edit a", { exact: true }).inputValue(), "native input");
      await page.evaluate(() => (location.hash = "callback"));
      await page.waitForFunction(() => getComputedStyle(document.getElementById("callback")).opacity === "1");
    });
    await check("Base render element/function merges refs/events/native host without wrapper", async () => {
      await reload();
      await page.locator("#rendered").focus();
      assert.equal(await page.locator("#rendered").evaluate((n) => n.tagName), "BUTTON");
      await page.locator("#rendered").click();
      const events = await page.evaluate(() => window.publicEvents);
      assert(events.includes("callerClick") && events.includes("renderClick") && events.includes("renderRef"));
      assert(
        await page
          .locator("#rendered")
          .evaluate((n) => n.classList.contains("render-class") && n.classList.contains("caller-class")),
      );
      await page.evaluate(() => {
        window.oldHost = document.getElementById("rendered");
        window.publicUpdate({ refVersion: 1 });
      });
      assert(await page.evaluate(() => window.oldHost === document.getElementById("rendered")));
      assert((await page.evaluate(() => window.publicEvents)).includes("cleanup1"));
      assert.equal(await page.locator("#callback").getAttribute("data-render-state"), "reveal");
    });
    await check("nested entrance with disjoint native press, measured size and size-linked projection", async () => {
      await reload();
      await pending("parent");
      await page.locator("#parent").evaluate((n) => n.scrollIntoView({ block: "center" }));
      await page.waitForFunction(() => document.getElementById("parent").getAnimations().length > 0);
      result.composition = await page.evaluate(async () => {
        const { createMeasuredGeometry, createMotionTransaction, createSizeLinkedGeometry } = window.publicTools,
          cm = window.publicMotion;
        const parent = document.getElementById("parent"),
          press = document.getElementById("press"),
          geo = document.getElementById("geometry"),
          gap = document.getElementById("gap"),
          panel = document.getElementById("panel");
        const nativePress = press.animate(
          [{ transform: "scale(1)" }, { transform: `scale(${cm.scope.tokens.scale.press})` }],
          { duration: Number(cm.transition("reveal").duration) * 1000, fill: "forwards" },
        );
        const transaction = createMotionTransaction(),
          geometry = createMeasuredGeometry(transaction);
        let size = 80;
        const release = geometry.register({
          host: { current: geo },
          content: document.getElementById("geometry-content"),
          axes: ["width"],
          measure: () => ({
            width: { size, min: 0, max: 280, readable: true, independent: true, resting: `${size}px` },
          }),
        });
        const policy = { reduced: false, transition: cm.transition("geometry.resize") };
        geometry.commit(transaction.revision("content", 80), policy);
        size = 160;
        geo.style.width = "160px";
        document.getElementById("geometry-content").style.width = "160px";
        geometry.commit(transaction.revision("content", 160), policy);
        const layout = createSizeLinkedGeometry({ current: gap }, { current: panel });
        const clock = cm.transition("geometry.resize");
        let revision = transaction.revision("layout", 80);
        layout.commit(revision, { gap: 80, width: 150, sign: 1 }, clock, false, layout.prepare(revision, clock, false));
        revision = transaction.revision("layout", 120);
        gap.style.width = "120px";
        layout.commit(
          revision,
          { gap: 120, width: 150, sign: 1 },
          clock,
          false,
          layout.prepare(revision, clock, false),
        );
        await new Promise((r) => setTimeout(r, 80));
        const sample = {
          parent: parent.getAnimations().map((a) => a.transitionProperty),
          nested: document.getElementById("nested").getAnimations().length,
          press: press.getAnimations().length,
          geometry: geo.getAnimations().length,
          gap: gap.getAnimations().length,
          panel: panel.getAnimations().length,
        };
        nativePress.cancel();
        release();
        geometry.dispose();
        layout.dispose();
        transaction.close();
        return sample;
      });
      assert(result.composition.parent.includes("opacity") && result.composition.parent.includes("transform"));
      assert.equal(result.composition.nested, 0);
      assert(
        result.composition.press > 0 &&
          result.composition.geometry > 0 &&
          result.composition.gap > 0 &&
          result.composition.panel > 0,
        JSON.stringify(result.composition),
      );
    });
    await check("actual Button press and pointer capture retain semantics through live none", async () => {
      await reload();
      await page.locator("#press").focus();
      assert.equal(await opacity("parent"), "1");
      const button = page.locator("#press");
      await button.scrollIntoViewIfNeeded();
      const box = await button.boundingBox();
      await button.evaluate((n) =>
        n.addEventListener("pointerdown", (e) => {
          n.setPointerCapture(e.pointerId);
          window.publicPointer = e.pointerId;
        }),
      );
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForFunction(() => {
        const t = getComputedStyle(document.getElementById("press")).transform;
        return t !== "none" && new DOMMatrix(t).a < 1;
      });
      await page.evaluate(() => window.publicUpdate({ mode: "none" }));
      assert(await button.evaluate((n) => n.hasPointerCapture(window.publicPointer)));
      await page.mouse.up();
      assert.equal((await page.evaluate(() => window.publicEvents)).filter((e) => e === "press").length, 1);
      assert.equal(await button.getAttribute("data-slot"), "button");
    });
    await check("standalone defaults and later nested entrance retain independent causes", async () => {
      await reload();
      await pending("solo");
      await page.locator("#solo").evaluate((n) => n.scrollIntoView({ block: "center" }));
      await page.waitForFunction(() => document.getElementById("solo").getAnimations().length > 0);
      assert.equal(await page.locator("#solo").evaluate((n) => n.getAnimations()[0].effect.getTiming().delay), 0);
      await page.waitForFunction(() => !document.getElementById("solo").hasAttribute("data-cadence-reveal"));
      await page.evaluate(() => window.scrollTo(0, 0));
      assert.equal(await opacity("solo"), "1");
      await reload();
      await pending("parent");
      await page.locator("#parent").evaluate((n) => n.scrollIntoView({ block: "center" }));
      await page.waitForFunction(() => !document.getElementById("parent").hasAttribute("data-cadence-reveal"));
      await page.evaluate(() => window.publicUpdate({ extra: true }));
      await pending("later-nested");
      await page.locator("#later-nested").evaluate((n) => n.scrollIntoView({ block: "center" }));
      await page.waitForFunction(() => document.getElementById("later-nested").getAnimations().length > 0);
      assert.equal(await page.locator("#parent").evaluate((n) => n.getAnimations().length), 0);
      await reload();
      await page.evaluate(() => window.publicUpdate({ replay: "repeat", parentVersion: 1 }));
      await pending("parent");
      await page.locator("#parent").evaluate((n) => n.scrollIntoView({ block: "center" }));
      await page.waitForFunction(() => !document.getElementById("parent").hasAttribute("data-cadence-reveal"));
      await page.evaluate(() => window.publicUpdate({ extra: true }));
      await pending("later-nested");
      await page.evaluate(() => window.scrollTo(0, 0));
      await pending("parent");
      assert.equal(await opacity("later-nested"), "1");
    });
    await check("print and actual unmount release native enhancement resources", async () => {
      await reload();
      await pending();
      await page.emulateMedia({ media: "print" });
      await page.waitForFunction(() => !document.getElementById("a").hasAttribute("data-cadence-reveal"));
      assert.equal(await opacity("a"), "1");
      await page.emulateMedia({ media: "screen" });
      assert.equal(await opacity("a"), "1");
      await page.evaluate(() => window.publicUpdate({ mounted: false }));
      assert.equal(await page.locator('[data-slot="reveal"]').count(), 0);
      assert.equal(
        await page
          .locator("style")
          .evaluateAll((ns) => ns.filter((n) => n.textContent.includes("@media print{[data-cadence-reveal]")).length),
        0,
      );
    });
    await check("initial reduced/none bypass observers and restore without rehide", async () => {
      for (const mode of ["reduced", "none"]) {
        initialMode = mode;
        await reload();
        assert.equal(await opacity("a"), "1");
        assert.equal(await page.locator("[data-cadence-reveal]").count(), 0);
        assert.equal(await page.evaluate(() => window.publicObserverCount), 0);
        await page.evaluate(() => window.publicUpdate({ mode: "full" }));
        assert.equal(await opacity("a"), "1");
      }
      initialMode = "full";
    });
    await context.close();
  }
  const mount = 'import {createRoot} from "react-dom/client";';
  const base = path.relative(process.cwd(), copied).replaceAll("\\", "/");
  const provider = `import {CadenceProvider} from "./${base}/lib/provider";`;
  report.cost = {};
  for (const [id, contents] of Object.entries({
    empty: `${mount}createRoot(document.getElementById("root")).render(<main>Baseline</main>);`,
    provider: `${mount}${provider}createRoot(document.getElementById("root")).render(<CadenceProvider><main>Baseline</main></CadenceProvider>);`,
    reveal: `${mount}${provider}import {Reveal} from "./${base}/reveal";createRoot(document.getElementById("root")).render(<CadenceProvider><Reveal>Baseline</Reveal></CadenceProvider>);`,
    group: `${mount}${provider}import {Reveal} from "./${base}/reveal";import {RevealGroup} from "./${base}/reveal-group";createRoot(document.getElementById("root")).render(<CadenceProvider><RevealGroup stagger="cycle"><Reveal>Baseline</Reveal></RevealGroup></CadenceProvider>);`,
  })) {
    const b = await build({
      stdin: { contents, resolveDir: process.cwd(), loader: "jsx" },
      bundle: true,
      write: false,
      format: "esm",
      jsx: "automatic",
      minify: true,
      metafile: true,
      define: { "process.env.NODE_ENV": '"production"' },
    });
    await writeFile(path.join(out, `cost-${id}.js`), b.outputFiles[0].contents);
    await writeFile(path.join(out, `cost-${id}-metafile.json`), JSON.stringify(b.metafile, null, 2));
    report.cost[id] = { gzip: gzipSync(b.outputFiles[0].contents).length, sha256: hash(b.outputFiles[0].contents) };
  }
  report.cost.dedicated = report.cost.group.gzip - report.cost.provider.gzip;
  report.cost.totalOverEmpty = report.cost.group.gzip - report.cost.empty.gzip;
  report.cost.limit = 8000;
  report.cost.pass = report.cost.dedicated <= 8000;
  assert.deepEqual(report.errors, []);
} catch (error) {
  report.failures.push(String(error.stack));
} finally {
  await browser?.close();
  if (server) await new Promise((r) => server.close(r));
  report.resourcesClosed = true;
  await writeFile(path.join(out, "report.json"), JSON.stringify(report, null, 2));
}
console.log(
  JSON.stringify({
    out,
    profiles: report.profiles.map((p) => ({ profile: p.profile, cases: p.cases.length })),
    failures: report.failures,
    errors: report.errors,
    cost: report.cost,
  }),
);
if (report.failures.length || report.errors.length) process.exitCode = 1;
