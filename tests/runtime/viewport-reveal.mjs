import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";
import { chromium } from "@playwright/test";

assert(process.env.REVEAL_OUTPUT, "Use a new evidence directory");
const output = path.resolve(process.env.REVEAL_OUTPUT);
await mkdir(output, { recursive: false });
const require = createRequire(import.meta.url);
const vite = require.resolve("vite", { paths: [require.resolve("vitest/node")] });
const { build } = await import(pathToFileURL(require.resolve("esbuild", { paths: [vite] })));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const report = {
  scope: "S13 internal controller and actual pilot, raw relocation; no S14 registry/public helper claim",
  profiles: [],
  failures: [],
  errors: [],
  inputs: {},
  resourcesClosed: false,
};
let server, browser;
try {
  const relocated = path.join(output, "relocated");
  await cp("registry/cadence/lib", path.join(relocated, "registry/cadence/lib"), {
    recursive: true,
    errorOnExist: true,
  });
  await mkdir(path.join(relocated, "tests/runtime"), { recursive: true });
  await cp("tests/runtime/viewport-reveal.jsx", path.join(relocated, "tests/runtime/viewport-reveal.jsx"));
  await writeFile(path.join(relocated, "package.json"), '{"type":"module","private":true}');
  const ssr = await build({
    entryPoints: ["tests/runtime/viewport-reveal-ssr.jsx"],
    bundle: true,
    packages: "external",
    platform: "node",
    format: "cjs",
    write: false,
    jsx: "automatic",
  });
  await writeFile(path.join(output, "ssr.cjs"), ssr.outputFiles[0].text);
  const markup = require(path.join(output, "ssr.cjs")).render();
  let client = "",
    strict = false;
  server = http.createServer((req, res) => {
    res.setHeader("Content-Type", req.url === "/client.js" ? "text/javascript" : "text/html");
    res.end(
      req.url === "/client.js"
        ? client
        : `<!doctype html><meta charset="utf-8"><title>Viewport reveal pilot</title><style>body{margin:0;font:20px system-ui;min-height:4000px}button{font:inherit}#fixtures{position:relative;top:2600px}@media(prefers-color-scheme:dark){body{background:#111;color:#eee}button{color:inherit;background:#222}}</style><div id="root">${markup}</div><div id="fixtures"></div><script>window.revealStrict=${strict}</script><script src="/client.js"></script>`,
    );
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true });
  report.browser = browser.version();
  const noJS = await browser.newContext({ javaScriptEnabled: false });
  const native = await noJS.newPage();
  await native.goto(url);
  report.noJS = await native.locator("#first,#later").evaluateAll((nodes) =>
    nodes.map((n) => ({
      text: n.textContent,
      opacity: getComputedStyle(n).opacity,
      transform: getComputedStyle(n).transform,
      hidden: n.hidden,
    })),
  );
  assert(report.noJS.every((n) => n.opacity === "1" && n.transform === "none" && !n.hidden));
  await noJS.close();
  for (const name of process.env.REVEAL_PROFILES?.split(",") ?? [
    "source",
    "strict",
    "dark",
    "narrow",
    "relocated",
    "os-reduced",
  ]) {
    strict = name === "strict";
    const bundle = await build({
      entryPoints: [
        name === "relocated"
          ? path.join(relocated, "tests/runtime/viewport-reveal.jsx")
          : "tests/runtime/viewport-reveal.jsx",
      ],
      bundle: true,
      write: false,
      metafile: true,
      format: "iife",
      jsx: "automatic",
      minify: true,
      define: { "process.env.NODE_ENV": JSON.stringify(strict ? "development" : "production") },
    });
    client = bundle.outputFiles[0].text;
    await writeFile(path.join(output, `${name}.js`), client);
    await writeFile(path.join(output, `${name}-metafile.json`), JSON.stringify(bundle.metafile, null, 2));
    for (const file of Object.keys(bundle.metafile.inputs)) report.inputs[file] = hash(await readFile(file));
    const context = await browser.newContext({
      viewport: { width: name === "narrow" ? 390 : 1280, height: 900 },
      colorScheme: name === "dark" ? "dark" : "light",
      reducedMotion: name === "os-reduced" ? "reduce" : "no-preference",
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => report.errors.push({ profile: name, error: String(error) }));
    page.on("console", (m) => {
      if (m.type() === "error") report.errors.push({ profile: name, error: m.text() });
    });
    await page.addInitScript(() => {
      window.revealIO = [];
      window.revealRO = [];
      const RO = window.ResizeObserver;
      window.ResizeObserver = class extends RO {
        constructor(callback) {
          super(callback);
          this.record = { nodes: new Set(), active: true };
          window.revealRO.push(this.record);
        }
        observe(node, options) {
          this.record.nodes.add(node);
          return super.observe(node, options);
        }
        unobserve(node) {
          this.record.nodes.delete(node);
          return super.unobserve(node);
        }
        disconnect() {
          this.record.active = false;
          this.record.nodes.clear();
          return super.disconnect();
        }
      };
      const IO = window.IntersectionObserver;
      window.IntersectionObserver = class extends IO {
        constructor(callback, options) {
          const record = { options, nodes: new Set(), active: true, entries: [] };
          super((entries, observer) => {
            record.entries.push(
              ...entries.map((e) => ({
                id: e.target.id,
                ratio: e.intersectionRatio,
                intersecting: e.isIntersecting,
                root: e.rootBounds?.toJSON(),
              })),
            );
            callback(entries, observer);
          }, options);
          record.callback = callback;
          record.observer = this;
          this.record = record;
          window.revealIO.push(record);
        }
        observe(node) {
          this.record.nodes.add(node);
          return super.observe(node);
        }
        unobserve(node) {
          this.record.nodes.delete(node);
          return super.unobserve(node);
        }
        disconnect() {
          this.record.active = false;
          this.record.nodes.clear();
          return super.disconnect();
        }
      };
    });
    await page.route("**/client.js", async (route) => {
      report.beforeHydration ??= await page
        .locator("#first,#later")
        .evaluateAll((nodes) => nodes.map((n) => ({ opacity: getComputedStyle(n).opacity, text: n.textContent })));
      await route.continue();
    });
    await page.goto(url);
    await page.waitForFunction(() => window.revealMotion && window.revealTools);
    const initial = await page.evaluate(() => ({
      first: getComputedStyle(document.getElementById("first")).opacity,
      later: getComputedStyle(document.getElementById("later")).opacity,
      activeObservers: window.revealIO.filter((r) => r.active && r.nodes.size).length,
      createdObservers: window.revealIO.length,
    }));
    assert.equal(initial.first, "1");
    if (name === "os-reduced") {
      assert.equal(initial.later, "1");
      assert.equal(initial.activeObservers, 0);
      assert.equal(initial.createdObservers, 0);
      report.profiles.push({
        name,
        initial,
        cases: [{ name: "OS ceiling: no hidden first frame or observer", pass: true }],
      });
      await context.close();
      continue;
    }
    assert.equal(initial.later, "0");
    // Native CSS transition first style/active handle/intermediate/final proof; rAF is only sampling.
    await page.evaluate(() => document.getElementById("later").scrollIntoView({ block: "center" }));
    await page.waitForFunction(() => document.getElementById("later").getAnimations().length > 0);
    const entrance = await page.evaluate(async () => {
      const node = document.getElementById("later");
      const handles = node.getAnimations();
      const start = handles.map((a) => ({
        property: a.transitionProperty,
        frames: a.effect.getKeyframes(),
        timing: a.effect.getTiming(),
        currentTime: a.currentTime,
      }));
      await new Promise((r) => setTimeout(r, 100));
      const intermediate = {
        opacity: Number(getComputedStyle(node).opacity),
        transform: getComputedStyle(node).transform,
      };
      return { start, intermediate };
    });
    assert(
      entrance.start.some(
        (a) => a.property === "opacity" && Number(a.frames[0].opacity) === 0 && Number(a.frames.at(-1).opacity) === 1,
      ),
    );
    assert(entrance.intermediate.opacity > 0 && entrance.intermediate.opacity < 1);
    await page.screenshot({ path: path.join(output, `${name}-entering.png`) });
    await page.waitForFunction(() => !document.getElementById("later").hasAttribute("data-cadence-reveal"));
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.evaluate(() => {
      window.revealUpdate({ mode: "none" });
      window.revealUpdate({ mode: "full" });
    });
    assert.equal(await page.locator("#later").evaluate((n) => getComputedStyle(n).opacity), "1");
    const result = await page.evaluate(async () => {
      const { createViewportReveal, createMotionTransaction } = window.revealTools;
      const cases = [],
        failures = [],
        observations = [];
      const check = (name, pass, actual) => {
        cases.push({ name, pass: !!pass });
        if (!pass) failures.push({ name, actual });
      };
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const until = async (test) => {
        for (let i = 0; i < 120; i++) {
          if (test()) return true;
          await wait(20);
        }
        return false;
      };
      const activeIO = () => window.revealIO.filter((r) => r.active && r.nodes.size);
      const retired = new Set();
      const fixture = (options = {}, count = 1, cm = window.revealMotion) => {
        const root = document.createElement("div");
        root.style.cssText = "position:relative;width:300px;height:400px;overflow:auto;border:0;";
        const space = document.createElement("div");
        space.style.height = "4000px";
        root.append(space);
        document.getElementById("fixtures").append(root);
        const group = createViewportReveal({ root, ...options });
        const nodes = [],
          registrations = [],
          ids = [];
        for (let i = 0; i < count; i++) {
          const node = document.createElement("section");
          node.id = `fixture-${cases.length}-${i}`;
          node.style.cssText = "position:absolute;top:800px;left:0;width:280px;height:80px";
          node.innerHTML = '<button type="button">Action</button><span contenteditable="true">Edit</span>';
          space.append(node);
          const id = {};
          ids.push(id);
          nodes.push(node);
          registrations.push(group.register(node, id, cm));
        }
        return {
          root,
          group,
          nodes,
          registrations,
          ids,
          dispose() {
            group.dispose();
            retired.add(root);
            for (const node of nodes) retired.add(node);
            root.remove();
          },
        };
      };
      // Put the explicit scroll root on screen; no document scan discovers targets.
      document.getElementById("fixtures").scrollIntoView({ block: "start" });
      const a = fixture();
      a.root.scrollIntoView({ block: "start" });
      check("default once begins eligible offscreen pending", a.registrations[0].state === "pending");
      const matching = activeIO().filter((r) => r.nodes.has(a.nodes[0]));
      const margin = matching[0]?.options.rootMargin;
      check("height-derived pixel margins", margin === "-12px 0px -32px 0px", margin);
      check("amount threshold is explicit", matching[0]?.options.threshold.includes(0.08), matching[0]?.options);
      // Same root/options, different group must share the actual native observer.
      const other = createViewportReveal({ root: a.root });
      const second = a.nodes[0].cloneNode(true);
      second.removeAttribute("data-cadence-reveal");
      second.style.cssText = "position:absolute;top:800px;left:0;width:280px;height:80px";
      second.id = "other-group";
      a.nodes[0].parentNode.append(second);
      const secondTarget = other.register(second, {}, window.revealMotion);
      check(
        "independent groups share matching native observer",
        activeIO().some((r) => r.nodes.has(a.nodes[0]) && r.nodes.has(second)),
      );
      check(
        "same root shares actual resize observation too",
        window.revealRO.filter((r) => r.active && r.nodes.has(a.root) && r.nodes.has(a.nodes[0]) && r.nodes.has(second))
          .length === 1,
      );
      a.root.scrollTop = 436 + window.revealMotion.distance.md;
      check(
        "native partial intersection stays pending below amount",
        (await until(() =>
          window.revealIO.some((r) =>
            r.entries.some((e) => e.id === a.nodes[0].id && e.intersecting && e.ratio > 0 && e.ratio < 0.08),
          ),
        )) && a.registrations[0].state === "pending",
      );
      a.root.scrollTop = 700;
      check("native root entry really starts CSS", await until(() => a.nodes[0].getAnimations().length > 0));
      const handles = a.nodes[0].getAnimations();
      window.revealUpdate({ mode: "none" });
      a.registrations[0].commit(window.revealMotion);
      secondTarget.commit(window.revealMotion);
      check(
        "live none cancels native writers synchronously",
        handles.every((h) => h.playState === "idle") &&
          a.nodes[0].getAnimations().length === 0 &&
          getComputedStyle(a.nodes[0]).opacity === "1",
      );
      await wait(100);
      check(
        "retired completion cannot rehide",
        a.registrations[0].state === "visible" && a.nodes[0].getAnimations().length === 0,
      );
      window.revealUpdate({ mode: "full" });
      a.registrations[0].commit(window.revealMotion);
      a.root.scrollTop = 0;
      check("restored full does not replay consumed offscreen target", a.registrations[0].state === "visible");
      other.dispose();
      second.remove();
      a.dispose();

      for (const restriction of [{ mode: "reduced" }, { timeScale: 0 }]) {
        const live = fixture();
        live.root.scrollIntoView({ block: "start" });
        live.root.scrollTop = 700;
        await until(() => live.nodes[0].getAnimations().length > 0);
        const native = live.nodes[0].getAnimations();
        window.revealUpdate(restriction);
        live.registrations[0].commit(window.revealMotion);
        check(
          `live ${JSON.stringify(restriction)} cancels before next paint`,
          native.length === 2 &&
            native.every((a) => a.playState === "idle") &&
            getComputedStyle(live.nodes[0]).opacity === "1",
        );
        window.revealUpdate({ mode: "full", timeScale: 4 });
        live.registrations[0].commit(window.revealMotion);
        check(
          `restoring ${JSON.stringify(restriction)} keeps target consumed`,
          live.registrations[0].state === "visible",
        );
        live.dispose();
      }
      const positive = fixture();
      positive.root.scrollIntoView({ block: "start" });
      positive.root.scrollTop = 700;
      await until(() => positive.nodes[0].getAnimations().length > 0);
      const preserved = positive.nodes[0].getAnimations();
      window.revealUpdate({ timeScale: 2 });
      positive.registrations[0].commit(window.revealMotion);
      check(
        "positive clock update keeps finite captured handles",
        preserved.every((a) => positive.nodes[0].getAnimations().includes(a)),
      );
      positive.root.scrollTop = 0;
      const leftAt = performance.now();
      check(
        "once entrance leaving the root cancels hidden work without replay",
        (await until(() => positive.registrations[0].state === "visible")) &&
          performance.now() - leftAt < 300 &&
          preserved.every((a) => a.playState === "idle"),
      );
      positive.dispose();
      window.revealUpdate({ timeScale: 4 });

      for (const mode of ["reduced", "none"]) {
        window.revealUpdate({ mode });
        const before = activeIO().length;
        const f = fixture();
        check(
          `${mode} never arms or creates observer`,
          f.registrations[0].state === "visible" &&
            activeIO().length === before &&
            getComputedStyle(f.nodes[0]).opacity === "1",
        );
        f.dispose();
      }
      window.revealUpdate({ mode: "full", timeScale: 0 });
      const zero = fixture();
      check("zero clock never arms", zero.registrations[0].state === "visible");
      zero.dispose();
      window.revealUpdate({ timeScale: 4 });
      const focus = fixture();
      let clicks = 0;
      focus.nodes[0].addEventListener("click", () => clicks++);
      focus.nodes[0].querySelector("button").click();
      check("pending synthetic invisible activation is blocked", clicks === 0);
      focus.nodes[0].querySelector("button").focus();
      check(
        "focus exposes native subtree synchronously without delay",
        focus.registrations[0].state === "visible" &&
          getComputedStyle(focus.nodes[0]).opacity === "1" &&
          focus.nodes[0].getAnimations().length === 0,
      );
      focus.nodes[0].querySelector("button").click();
      check("visible activation retains native handler", clicks === 1);
      focus.dispose();
      const fragment = fixture();
      location.hash = fragment.nodes[0].id;
      await until(() => fragment.registrations[0].state === "visible");
      check(
        "hash reveals target without delay",
        getComputedStyle(fragment.nodes[0]).opacity === "1" && fragment.nodes[0].getAnimations().length === 0,
      );
      history.replaceState(null, "", location.pathname);
      fragment.dispose();
      const resize = fixture();
      resize.root.scrollIntoView({ block: "start" });
      resize.root.style.height = "600px";
      check(
        "root resize recomputes pixel margins",
        await until(() =>
          activeIO().some((r) => r.nodes.has(resize.nodes[0]) && r.options.rootMargin === "-18px 0px -48px 0px"),
        ),
      );
      resize.dispose();
      const huge = fixture();
      huge.root.scrollIntoView({ block: "start" });
      huge.nodes[0].style.height = "20000px";
      check(
        "huge target receives reachable threshold",
        await until(() =>
          activeIO().some((r) => r.nodes.has(huge.nodes[0]) && Math.max(...r.options.threshold) < 0.08),
        ),
      );
      huge.root.scrollTop = 900;
      check(
        "huge target really enters with native intersection",
        await until(() => huge.registrations[0].state !== "pending"),
      );
      huge.dispose();
      const repeat = fixture({ replay: "repeat" });
      repeat.root.scrollIntoView({ block: "start" });
      repeat.root.scrollTop = 700;
      check("repeat entrance", await until(() => repeat.registrations[0].state === "entering"));
      await until(() => repeat.registrations[0].state === "visible");
      repeat.root.scrollTop = 0;
      check("native repeat leave actually resets", await until(() => repeat.registrations[0].state === "pending"));
      repeat.root.scrollTop = 700;
      check("native repeat reentry actually plays", await until(() => repeat.registrations[0].state === "entering"));
      await until(() => repeat.registrations[0].state === "visible");
      const rec = activeIO().find((r) => r.nodes.has(repeat.nodes[0]));
      const fake = (ratio) =>
        rec.callback([{ target: repeat.nodes[0], isIntersecting: true, intersectionRatio: ratio }], rec.observer);
      fake(0.06);
      check("repeat half-threshold hysteresis retains visible", repeat.registrations[0].state === "visible");
      fake(0.03);
      check(
        "repeat below leave threshold resets without delayed exit",
        repeat.registrations[0].state === "pending" && repeat.nodes[0].style.transition === "none",
      );
      repeat.nodes[0].querySelector("button").focus();
      fake(0);
      check("repeat cannot rehide focused subtree", repeat.registrations[0].state === "visible");
      repeat.dispose();

      window.revealUpdate({ timeScale: 1 });
      const exactCycle = fixture({ stagger: "cycle" }, 3);
      exactCycle.root.scrollIntoView({ block: "start" });
      exactCycle.root.scrollTop = 700;
      await until(() => exactCycle.nodes[0].getAnimations().length > 0);
      const exactDelays = exactCycle.nodes.map((n) => parseFloat(n.style.getPropertyValue("--cadence-reveal-delay")));
      check(
        "three stable cycle slots really use 0/55/110ms",
        exactDelays.every((n, i) => Math.abs(n - i * 0.055) < 0.000001),
        exactDelays,
      );
      exactCycle.dispose();
      window.revealUpdate({ timeScale: 4 });

      const cycle = fixture({ stagger: "cycle", replay: "repeat" }, 24);
      cycle.root.scrollIntoView({ block: "start" });
      const slot = cycle.registrations.map((r) => r.slot);
      cycle.nodes.reverse().forEach((n) => {
        n.parentNode.append(n);
      });
      check(
        "mounted identity slots survive reorder",
        cycle.registrations.every((r, i) => r.slot === slot[i]),
      );
      cycle.root.scrollTop = 700;
      await until(() => cycle.nodes.some((n) => n.getAnimations().length));
      const moving = cycle.nodes.filter((n) => n.getAnimations().length);
      const delays = moving.map((n) => parseFloat(n.style.getPropertyValue("--cadence-reveal-delay")));
      check(
        "maximum20 native moving hosts, overflow immediate",
        moving.length === 20 && cycle.registrations.filter((r) => r.state === "visible").length === 4,
        { moving: moving.length, states: cycle.registrations.map((r) => r.state) },
      );
      check("aggregate delay clamps after clock scaling", delays.reduce((a, b) => a + b, 0) <= 0.400001, delays);
      observations.push({ budget: { moving: moving.length, delays, total: delays.reduce((a, b) => a + b, 0) } });
      const earlier = cycle.nodes[0].cloneNode(true);
      earlier.id = "active-union-overflow";
      earlier.removeAttribute("data-cadence-reveal");
      earlier.style.cssText = "position:absolute;top:1600px;left:0;width:280px;height:80px";
      cycle.nodes[0].parentNode.append(earlier);
      const overflow = cycle.group.register(earlier, {}, window.revealMotion);
      earlier.style.top = "800px";
      check(
        "later delivery includes still-active union without queuing",
        (await until(() => overflow.state !== "pending")) &&
          overflow.state === "visible" &&
          moving.some((n) => n.getAnimations().length > 0),
        overflow.state,
      );
      check(
        "later delivery does not exceed20 writers",
        cycle.nodes.concat(earlier).filter((n) => n.getAnimations().length).length <= 20,
      );
      const oldHandles = moving.flatMap((n) => n.getAnimations());
      cycle.dispose();
      check(
        "scope disposal cancels all active handles",
        oldHandles.every((h) => h.playState === "idle"),
      );
      const reused = fixture({}, 2);
      const reusedObserver = activeIO().find((r) => r.nodes.has(reused.nodes[0]));
      const queued = reused.nodes.map((target) => ({
        target,
        time: performance.now(),
        isIntersecting: true,
        intersectionRatio: 1,
      }));
      const nativeTakeRecords = reusedObserver.observer.takeRecords.bind(reusedObserver.observer);
      let drains = 0;
      reusedObserver.observer.takeRecords = () => {
        drains++;
        return queued.splice(0).concat(nativeTakeRecords());
      };
      reused.registrations[0].dispose();
      const rebound = reused.group.register(reused.nodes[0], {}, window.revealMotion);
      reusedObserver.callback(queued.splice(0), reusedObserver.observer);
      check(
        "queued retired target drains before DOM rebound, live sibling records survive",
        drains > 0 && rebound.state === "pending" && reused.registrations[1].state === "entering",
      );
      reusedObserver.observer.takeRecords = nativeTakeRecords;
      reused.dispose();
      const lifecycle = fixture();
      const stale = activeIO().find((r) => r.nodes.has(lifecycle.nodes[0]));
      lifecycle.dispose();
      stale.callback([{ target: lifecycle.nodes[0], isIntersecting: true, intersectionRatio: 1 }], stale.observer);
      check(
        "disposed observer callback cannot write",
        !lifecycle.nodes[0].hasAttribute("data-cadence-reveal") && lifecycle.nodes[0].style.opacity === "",
      );
      const print = fixture();
      window.dispatchEvent(new Event("beforeprint"));
      check(
        "print exposes pending native content",
        print.registrations[0].state === "visible" && getComputedStyle(print.nodes[0]).opacity === "1",
      );
      window.dispatchEvent(new Event("afterprint"));
      check("afterprint does not replay", print.registrations[0].state === "visible");
      print.dispose();
      const hidden = fixture();
      window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true }));
      check("pagehide consumes pending work", hidden.registrations[0].state === "visible");
      const hiddenInsert = fixture();
      check("insertion while page suspended stays native", hiddenInsert.registrations[0].state === "visible");
      window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));
      check("pageshow cannot replay consumed target", hidden.registrations[0].state === "visible");
      hidden.dispose();
      hiddenInsert.dispose();
      const IO = window.IntersectionObserver;
      window.IntersectionObserver = class extends IO {
        observe() {
          throw new Error("intentional failed setup");
        }
      };
      const failed = fixture();
      check(
        "failed observation never hides and retires pool",
        failed.registrations[0].state === "visible" && getComputedStyle(failed.nodes[0]).opacity === "1",
      );
      failed.dispose();
      window.IntersectionObserver = IO;
      const unavailable = fixture({}, 2);
      unavailable.nodes[0].style.width = "0px";
      check(
        "target geometry failure cancels shared root and restores all live siblings",
        (await until(() => unavailable.registrations.every((r) => r.state === "visible"))) &&
          unavailable.nodes.every((n) => getComputedStyle(n).opacity === "1"),
      );
      unavailable.dispose();
      const noObserver = window.IntersectionObserver;
      window.IntersectionObserver = undefined;
      const unsupported = fixture();
      check(
        "unsupported enhancement stays readable",
        unsupported.registrations[0].state === "visible" && getComputedStyle(unsupported.nodes[0]).opacity === "1",
      );
      unsupported.dispose();
      window.IntersectionObserver = noObserver;
      const changed = fixture();
      changed.nodes[0].style.setProperty("opacity", ".4", "important");
      changed.registrations[0].commit(window.revealMotion);
      check(
        "live caller property takeover releases own writer",
        changed.registrations[0].state === "visible" &&
          changed.nodes[0].style.opacity === "0.4" &&
          changed.nodes[0].style.getPropertyPriority("opacity") === "important",
      );
      changed.dispose();
      const native = fixture();
      native.registrations[0].dispose();
      native.nodes[0].style.opacity = ".6";
      const conflict = native.group.register(native.nodes[0], {}, window.revealMotion);
      check(
        "caller-owned opacity uses native fallback",
        conflict.state === "visible" && native.nodes[0].style.opacity === "0.6",
      );
      native.dispose();
      const ownership = fixture(),
        tx = createMotionTransaction(),
        foreign = tx.register(ownership.nodes[0]);
      const blocked = foreign.begin(tx.revision("state", 1), ["opacity"], {}, () => {});
      check("pending reveal reserves properties in the shared writer registry", blocked === null);
      ownership.registrations[0].dispose();
      const permitted = foreign.begin(tx.revision("state", 2), ["opacity"], {}, () => {});
      const yielded = ownership.group.register(ownership.nodes[0], {}, window.revealMotion);
      check(
        "existing shared owner forces native reveal fallback without a second writer",
        !!permitted && yielded.state === "visible" && getComputedStyle(ownership.nodes[0]).opacity === "1",
      );
      permitted?.finish();
      foreign.dispose();
      tx.close();
      ownership.dispose();
      check(
        "all temporary observers disconnected",
        activeIO().length === 0,
        activeIO().map((r) => r.options),
      );
      check(
        "actual resize observers release every retired root/target",
        !window.revealRO.some((r) => r.active && [...r.nodes].some((n) => retired.has(n))),
      );
      return { cases, failures, observations };
    });
    report.profiles.push({ name, initial, entrance, ...result });
    report.failures.push(...result.failures.map((f) => ({ profile: name, ...f })));
    await page.screenshot({ path: path.join(output, `${name}-final.png`) });
    await context.close();
    await writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2));
  }
  // Unpatched native execution and trusted interaction, separate from observer instrumentation.
  const rawContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const raw = await rawContext.newPage();
  raw.on("pageerror", (e) => report.errors.push({ profile: "uninstrumented", error: String(e) }));
  await raw.goto(url);
  await raw.waitForFunction(() => window.revealUpdate);
  const uninstrumented = { cases: [] };
  assert.equal(await raw.evaluate(() => window.revealIO), undefined);
  assert.equal(await raw.locator("#first").evaluate((n) => getComputedStyle(n).opacity), "1");
  assert.equal(await raw.locator("#later").evaluate((n) => getComputedStyle(n).opacity), "0");
  await raw.locator("#later").evaluate((n) => n.scrollIntoView({ block: "center" }));
  await raw.waitForFunction(() => document.getElementById("later").getAnimations().length === 2);
  await raw.evaluate(() => window.revealUpdate({ mode: "reduced" }));
  assert.equal(await raw.locator("#later").evaluate((n) => n.getAnimations().length), 0);
  assert.equal(await raw.locator("#later").evaluate((n) => getComputedStyle(n).opacity), "1");
  uninstrumented.cases.push("unpatched native entry and before-paint reduced cancellation");
  const editor = raw.locator("#later [contenteditable]");
  const editorNode = await editor.elementHandle();
  await editor.fill("Native编辑");
  await editor.press("End");
  await editor.press("!");
  assert.equal(await editor.textContent(), "Native编辑!");
  await raw.evaluate(() => {
    window.revealUpdate({ mode: "none" });
    window.revealUpdate({ mode: "full" });
  });
  assert.equal(await editor.textContent(), "Native编辑!");
  assert(await editorNode.evaluate((n) => n === document.activeElement));
  uninstrumented.cases.push("trusted native editing, focus and DOM survive live mode edits");
  const button = raw.locator("#later button");
  await button.evaluate((n) => {
    n.addEventListener("pointerdown", (e) => {
      n.setPointerCapture(e.pointerId);
      window.revealPointer = e.pointerId;
    });
  });
  const box = await button.boundingBox();
  await raw.mouse.move(box.x + 10, box.y + 10);
  await raw.mouse.down();
  await raw.evaluate(() => window.revealUpdate({ mode: "none" }));
  assert(await button.evaluate((n) => n.hasPointerCapture(window.revealPointer)));
  await raw.mouse.up();
  assert.equal(await raw.evaluate(() => window.revealClicks), 1);
  uninstrumented.cases.push("trusted native activation/pointer capture retained across downgrade");
  await raw.reload();
  await raw.waitForFunction(() => window.revealUpdate);
  await raw.emulateMedia({ media: "print" });
  await raw.waitForFunction(() => getComputedStyle(document.getElementById("later")).opacity === "1");
  await raw.emulateMedia({ media: "screen" });
  assert.equal(await raw.locator("#later").evaluate((n) => getComputedStyle(n).opacity), "1");
  uninstrumented.cases.push("actual print media exposes content without post-print replay");
  await raw.evaluate(() => window.revealUpdate({ mounted: false }));
  assert.equal(await raw.locator("[data-cadence-reveal]").count(), 0);
  assert.equal(
    await raw.evaluate(
      () => [...document.querySelectorAll("style")].filter((n) => n.textContent.includes("data-cadence-reveal")).length,
    ),
    0,
  );
  uninstrumented.cases.push("actual React physical unmount releases pending host and print resource");
  report.uninstrumented = uninstrumented;
  await rawContext.close();
  // Exact compiled addition over an explicit provider baseline; not a full route certificate.
  const cost = async (contents, id) => {
    const bundle = await build({
      stdin: { contents, resolveDir: process.cwd(), sourcefile: "reveal-cost.jsx", loader: "jsx" },
      bundle: true,
      write: false,
      format: "esm",
      jsx: "automatic",
      minify: true,
      define: { "process.env.NODE_ENV": '"production"' },
      metafile: true,
    });
    if (id) {
      await writeFile(path.join(output, `${id}.js`), bundle.outputFiles[0].contents);
      await writeFile(path.join(output, `${id}-metafile.json`), JSON.stringify(bundle.metafile, null, 2));
    }
    return {
      gzip: gzipSync(bundle.outputFiles[0].contents, { level: 6 }).length,
      hash: hash(bundle.outputFiles[0].contents),
      inputs: bundle.metafile.inputs,
    };
  };
  const baseline = await cost('export { CadenceProvider, useCadenceMotion } from "./registry/cadence/lib/provider";');
  const reveal = await cost(
    'export { CadenceProvider, useCadenceMotion } from "./registry/cadence/lib/provider";export { createViewportReveal } from "./registry/cadence/lib/viewport-reveal";export { useViewportReveal } from "./registry/cadence/lib/use-viewport-reveal";',
  );
  report.cost = {
    baseline,
    reveal,
    dedicated: reveal.gzip - baseline.gzip,
    limit: 8000,
    pass: reveal.gzip - baseline.gzip <= 8000,
    boundary: "minified compiled shared internal exports; public installed/route budgets remain separate",
  };
  const copied = `./${path.relative(process.cwd(), relocated).replaceAll("\\", "/")}/registry/cadence/lib`;
  const mount = 'import {createRoot} from "react-dom/client";';
  const providerImport = `import {CadenceProvider,useCadenceMotion} from ${JSON.stringify(`${copied}/provider`)};`;
  const empty = await cost(
    `${mount}createRoot(document.getElementById("root")).render(<main>Baseline</main>);`,
    "consumer-empty",
  );
  const providerOnly = await cost(
    `${mount}${providerImport}createRoot(document.getElementById("root")).render(<CadenceProvider><main>Baseline</main></CadenceProvider>);`,
    "consumer-provider",
  );
  const consumer = await cost(
    `${mount}${providerImport}import {useMotionHostRef} from ${JSON.stringify(`${copied}/motion-ref`)};import {useViewportReveal} from ${JSON.stringify(`${copied}/use-viewport-reveal`)};import {createViewportReveal} from ${JSON.stringify(`${copied}/viewport-reveal`)};const group=createViewportReveal();function Pilot(){const {node,ref}=useMotionHostRef();const cm=useCadenceMotion(node);useViewportReveal(node,cm,group);return <main ref={ref} data-motion={cm.mode}>Baseline</main>}createRoot(document.getElementById("root")).render(<CadenceProvider><Pilot/></CadenceProvider>);`,
    "consumer-reveal",
  );
  report.consumerCost = {
    input: "actual byte-identical raw relocation, not an installable S14 helper",
    empty,
    provider: providerOnly,
    reveal: consumer,
    dedicated: consumer.gzip - providerOnly.gzip,
    totalOverEmpty: consumer.gzip - empty.gzip,
    limit: 8000,
    pass: consumer.gzip - providerOnly.gzip <= 8000,
  };
} catch (error) {
  report.failures.push({ fatal: String(error.stack) });
} finally {
  await browser?.close();
  if (server) await new Promise((resolve) => server.close(resolve));
  report.resourcesClosed = true;
  await writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2));
}
console.log(
  JSON.stringify({
    output,
    profiles: report.profiles.map((p) => ({ name: p.name, cases: p.cases.length })),
    failures: report.failures,
    errors: report.errors,
    dedicated: report.cost?.dedicated,
  }),
);
if (report.failures.length || report.errors.length) process.exitCode = 1;
