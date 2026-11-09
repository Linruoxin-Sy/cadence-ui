import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";
import { chromium } from "@playwright/test";

const output = path.resolve(process.env.TEXT_PRESENTATION_OUTPUT);
await mkdir(output, { recursive: true });
const require = createRequire(import.meta.url);
const vite = require.resolve("vite", { paths: [require.resolve("vitest/node")] });
const { build } = await import(pathToFileURL(require.resolve("esbuild", { paths: [vite] })));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const relocated = path.join(output, "relocated", "lib");
await cp("registry/cadence/lib", relocated, { recursive: true, errorOnExist: false });
const report = {
  inputs: {},
  profiles: [],
  errors: [],
  failures: [],
  resources: {},
  scope: "Internal DOM controller/pilot; raw relocation is NOT a CLI install or public primitive",
};
const css = `body{font:20px 'Courier New',monospace;margin:30px}button{font:inherit;color:inherit} @media(prefers-color-scheme:dark){body{background:#111;color:#eee}button{background:#222;border-color:#888}} [data-cadence-handoff-paint]::before{content:attr(data-cadence-flight-text)}`;
let server, browser;
try {
  const ssr = await build({
    entryPoints: ["tests/runtime/text-presentation-ssr.jsx"],
    bundle: true,
    platform: "node",
    packages: "external",
    write: false,
    format: "cjs",
    jsx: "automatic",
  });
  const ssrPath = path.join(output, "ssr.cjs");
  await writeFile(ssrPath, ssr.outputFiles[0].text);
  const markup = require(ssrPath).render();
  let client = "",
    strict = false;
  server = http.createServer((req, res) => {
    if (req.url === "/client.js") {
      res.setHeader("Content-Type", "text/javascript");
      res.end(client);
    } else {
      res.setHeader("Content-Type", "text/html");
      res.end(
        `<!doctype html><style>${css}</style><div id="root">${markup}</div><script>window.textStrict=${strict}</script><script src="/client.js"></script>`,
      );
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true });
  const noJS = await browser.newContext({ javaScriptEnabled: false });
  const native = await noJS.newPage();
  await native.goto(url);
  assert.equal(await native.locator("#owned").textContent(), "Save");
  assert.equal(await native.locator("#owned > *").count(), 0);
  report.noJS = { readable: true, plainText: true, markupSHA: hash(markup) };
  await noJS.close();
  const names = process.env.TEXT_PRESENTATION_PROFILES?.split(",") ?? ["source", "strict", "dark", "relocated"];
  for (const name of names) {
    strict = name === "strict";
    const plugins =
      name === "relocated"
        ? [
            {
              name: "raw-relocated",
              setup(builder) {
                builder.onResolve({ filter: /registry[\\/]cadence[\\/]lib[\\/]/ }, (args) => ({
                  path: [".ts", ".tsx"]
                    .map((extension) =>
                      path.join(
                        relocated,
                        args.path.replaceAll("\\", "/").split("registry/cadence/lib/")[1] + extension,
                      ),
                    )
                    .find(existsSync),
                }));
              },
            },
          ]
        : [];
    if (process.env.TEXT_PRESENTATION_FAULT)
      plugins.push({
        name: "negative-live-policy",
        setup(builder) {
          builder.onLoad({ filter: /[\\/]text-presentation\.ts$/ }, async (args) => {
            const source = await readFile(args.path, "utf8"),
              anchor = "stop(); // live-text-policy";
            assert.equal(source.split(anchor).length, 2);
            const executed = source.replace(anchor, "void 0; // exact negative: omit live policy cancellation");
            report.fault = {
              original: hash(source),
              executed: hash(executed),
              name: process.env.TEXT_PRESENTATION_FAULT,
            };
            await writeFile(path.join(output, "fault.ts"), executed);
            return { contents: executed, loader: "ts" };
          });
        },
      });
    const bundle = await build({
      entryPoints: ["tests/runtime/text-presentation.jsx"],
      bundle: true,
      write: false,
      metafile: true,
      format: "iife",
      jsx: "automatic",
      minify: true,
      plugins,
      define: { "process.env.NODE_ENV": JSON.stringify(strict ? "development" : "production") },
    });
    client = bundle.outputFiles[0].text;
    await writeFile(path.join(output, `${name}.js`), client);
    await writeFile(path.join(output, `${name}-metafile.json`), JSON.stringify(bundle.metafile, null, 2));
    for (const file of Object.keys(bundle.metafile.inputs)) report.inputs[file] = hash(await readFile(file));
    const context = await browser.newContext({
      colorScheme: name === "dark" ? "dark" : "light",
      reducedMotion: name === "os-reduced" ? "reduce" : "no-preference",
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => report.errors.push({ profile: name, error: String(error) }));
    page.on("console", (message) => {
      if (message.type() === "error") report.errors.push({ profile: name, error: message.text() });
    });
    await page.goto(url);
    await page.waitForFunction(() => window.textUpdate && window.textPolicy);
    const result = await page.evaluate(async () => {
      const cases = [],
        failures = [];
      const diagnostic = (() => {
        const host = document.getElementById("owned");
        const css = getComputedStyle(host);
        const fields = Object.fromEntries(
          [
            "font",
            "fontVariant",
            "textDecorationLine",
            "fontFeatureSettings",
            "fontVariationSettings",
            "textTransform",
            "letterSpacing",
            "wordSpacing",
            "opacity",
            "scale",
            "rotate",
            "translate",
            "zoom",
          ].map((key) => [key, css[key]]),
        );
        const original = host.firstChild;
        const canvas = document.createElement("canvas");
        canvas.width = 500;
        canvas.height = 100;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.font = css.font;
        ctx.fontKerning = css.fontKerning;
        ctx.fillText("Save", 20, 50);
        const a = ctx.getImageData(0, 0, 500, 100).data;
        ctx.clearRect(0, 0, 500, 100);
        let x = 20;
        for (const char of "Save") {
          ctx.fillText(char, x, 50);
          x += ctx.measureText(char).width;
        }
        const b = ctx.getImageData(0, 0, 500, 100).data;
        const reference = document.createElement("span");
        reference.textContent = "Save";
        document.body.append(reference);
        const boxes = () => {
          let offset = 0;
          return [...reference.childNodes].flatMap((node) =>
            [...node.textContent].map((_char) => {
              const range = document.createRange();
              range.setStart(node, reference.childNodes.length === 1 ? offset : 0);
              range.setEnd(node, reference.childNodes.length === 1 ? ++offset : 1);
              return range.getBoundingClientRect().toJSON();
            }),
          );
        };
        const natural = boxes(),
          naturalSize = reference.getBoundingClientRect().toJSON();
        reference.replaceChildren(...[..."Save"].map((char) => document.createTextNode(char)));
        const split = boxes(),
          splitSize = reference.getBoundingClientRect().toJSON();
        reference.remove();
        return {
          fields,
          children: host.childNodes.length,
          rasterDifferences: a.reduce((sum, byte, index) => sum + (byte !== b[index] ? 1 : 0), 0),
          originalText: original?.textContent,
          natural,
          split,
          naturalSize,
          splitSize,
        };
      })();
      const check = (name, predicate, detail) => {
        if (!predicate) throw new Error(`${name}: ${JSON.stringify(detail)}`);
      };
      const test = async (name, run) => {
        try {
          await run();
          cases.push(name);
        } catch (error) {
          failures.push({ name, error: String(error), stack: error.stack });
        }
      };
      const frame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const {
        createTextPresentation,
        createMotionTransaction,
        captureHandoffOrigin,
        createCapturedHandoff,
        proveTextLayout,
        createTextSnapshot,
      } = window.textTools;
      const all = (host) => [
        ...host.getAnimations({ subtree: true }),
        ...[...document.querySelectorAll("[data-cadence-text-layer]")]
          .filter((layer) => layer.dataset.cadenceTextOwner === host.id)
          .flatMap((layer) => layer.getAnimations({ subtree: true })),
      ];
      const masked = (host) =>
        [...CSS.highlights.values()].flatMap((highlight) =>
          [...highlight].filter((range) => range.intersectsNode(host)).map((range) => range.toString()),
        );
      let nextFixture = 0;
      const own = [];
      const make = (value, options = {}) => {
        const container = document.createElement("div");
        if (options.editable) container.contentEditable = options.editable;
        container.style.cssText = options.containerStyle ?? "";
        const host = document.createElement("span");
        host.id = `text-fixture-${++nextFixture}`;
        host.style.cssText = options.style ?? "";
        host.textContent = value;
        container.append(host);
        document.body.append(container);
        const tx = options.tx ?? createMotionTransaction();
        const source = {};
        const controller = createTextPresentation(host, tx, options.handoff ? createCapturedHandoff(tx) : undefined);
        let entity = "same";
        const commit = (next, extra = {}) => {
          if ("entity" in extra) entity = extra.entity;
          controller.commit({
            value: next,
            revision: tx.revision("content", next, source),
            cm: window.textPolicy,
            entity,
            ...extra,
          });
        };
        commit(value);
        const fixture = {
          host,
          container,
          tx,
          controller,
          commit,
          dispose() {
            controller.dispose();
            container.remove();
          },
        };
        own.push(fixture);
        return fixture;
      };
      try {
        await test("SSR/hydration baseline is visible without entrance", () => {
          const host = document.getElementById("owned");
          check("plain semantic text", host.textContent === "Save");
          check("no initial animation", all(host).length === 0);
          check("one native Text node", host.childNodes.length === 1 && host.firstChild.nodeType === 3);
        });
        await test("actual React pilot preserves retained nodes and native button", () => {
          const host = document.getElementById("owned"),
            button = document.getElementById("native-button");
          const retained = [...host.childNodes];
          button.focus();
          window.textUpdate({ value: "Saved" });
          check("immediate semantics", button.textContent === "Saved");
          check(
            "retained nodes",
            retained.every((node, index) => node === host.childNodes[index]),
          );
          check("only d animates", all(host).length === 1 && JSON.stringify(masked(host)) === '["d"]');
          check("focus", document.activeElement === button);
          window.textUpdate({ mode: "none" });
          check("same-target cancel prepaint", all(host).length === 0);
          window.textUpdate({ mode: "full" });
          check("no replay", all(host).length === 0);
        });
        for (const [before, after, changes] of [
          ["Send", "Sent", ["t"]],
          ["aba", "aaba", ["a"]],
          ["aXbYc", "aPbQc", ["P", "Q"]],
        ]) {
          await test(`actual DOM changed-only ${before} -> ${after}`, () => {
            const f = make(before),
              old = [...f.host.childNodes];
            f.commit(after);
            check("exact", f.host.textContent === after);
            const nodes = [...f.host.childNodes];
            const retained = old.filter((node) => nodes.includes(node));
            check("retained", retained.length === 1 && f.host.childNodes.length === 1);
            check(
              "no retained fades",
              all(f.host).every((animation) => !retained.includes(animation.effect.target)),
            );
            check("has changed effect", all(f.host).length > 0, { children: f.host.innerHTML });
            check(
              "only incoming changes masked",
              JSON.stringify(masked(f.host)) === JSON.stringify(changes),
              masked(f.host),
            );
            f.dispose();
          });
        }
        for (const mode of ["full", "reduced", "none"]) {
          await test(`mode ${mode}: changed opacity and zero travel`, () => {
            window.textUpdate({ mode, timeScale: 1 });
            const f = make("Save");
            f.commit("Saved");
            const animations = all(f.host);
            check("mode animation count", animations.length === (mode === "none" ? 0 : 1));
            check(
              "explicit mode",
              animations.every((animation) => animation.effect.target.dataset.motion === mode),
            );
            check(
              "only opacity",
              animations.every((a) =>
                a.effect.getKeyframes().every((key) => !("transform" in key) && !("filter" in key)),
              ),
            );
            check(
              "no built-in stagger",
              animations.every((a) => a.effect.getTiming().delay === 0),
            );
            f.dispose();
          });
        }
        window.textUpdate({ mode: "full" });
        await test("positive clock captured; zero clock and restoration cancel without replay", async () => {
          const f = make("Save");
          f.commit("Saved");
          const handle = all(f.host)[0];
          window.textUpdate({ timeScale: 2 });
          f.commit("Saved");
          await frame();
          check("same finite handle", all(f.host)[0] === handle);
          window.textUpdate({ timeScale: 0 });
          f.commit("Saved");
          check("zero no effects", all(f.host).length === 0 && f.host.textContent === "Saved");
          window.textUpdate({ timeScale: 1 });
          f.commit("Saved");
          check("no restoration replay", all(f.host).length === 0);
          f.dispose();
        });
        await test("standalone character clock12ms, final120ms cap,20 moving", () => {
          const f = make("");
          f.commit("abcdefghijklmnopqrstuv", { characterStagger: true });
          const timings = all(f.host).map((a) => a.effect.getTiming());
          check("20 moving", timings.length === 20, timings.length);
          check("120 cap", Math.max(...timings.map((t) => t.delay)) <= 120);
          f.dispose();
          const short = make("");
          short.commit("abc", { characterStagger: true });
          check("12ms default", all(short.host)[1]?.effect.getTiming().delay === 12);
          short.dispose();
        });
        await test("slow effective clock caps final delay after scaling", () => {
          window.textUpdate({ timeScale: 4 });
          const f = make("");
          f.commit("abcdefghijklmnop", { characterStagger: true });
          check("cap after scale", Math.max(...all(f.host).map((a) => a.effect.getTiming().delay)) <= 120);
          f.dispose();
          window.textUpdate({ timeScale: 1 });
        });
        await test("reduced standalone removes all character delay", () => {
          window.textUpdate({ mode: "reduced" });
          const f = make("");
          f.commit("abc", { characterStagger: true });
          check("reduced fade", all(f.host).length === 3);
          check(
            "no delay",
            all(f.host).every((a) => a.effect.getTiming().delay === 0),
          );
          f.dispose();
          window.textUpdate({ mode: "full" });
        });
        await test("rapid revisions retire obsolete paint; retained nodes do not replay", async () => {
          const f = make("aXbYc");
          f.commit("aPbQc");
          const obsolete = all(f.host);
          const retained = [...f.host.childNodes].filter((node) => node.nodeType === 3);
          f.commit("aRbSc");
          check(
            "old canceled",
            obsolete.every((a) => a.playState === "idle"),
          );
          check("current", f.host.textContent === "aRbSc");
          check(
            "retained identity",
            retained.every((node) => node.parentNode === f.host),
          );
          f.controller.cancel();
          await frame();
          check("no queued old write", all(f.host).length === 0 && f.host.textContent === "aRbSc");
          f.dispose();
        });
        await test("aggregate active outgoing+incoming64 exact and65 overflow", () => {
          const tx = createMotionTransaction();
          const a = make("", { tx }),
            b = make("", { tx });
          a.commit("a".repeat(32));
          b.commit("b".repeat(32));
          check("64 active", [...tx.activeWork("changedGraphemes").values()].reduce((a, b) => a + b, 0) === 64);
          const c = make("", { tx });
          c.commit("c");
          check("overflow exact", c.host.textContent === "c" && all(c.host).length === 0);
          check(
            "settles prior lane",
            all(a.host).length + all(b.host).length === 0 && tx.activeWork("changedGraphemes").size === 0,
          );
          a.dispose();
          b.dispose();
          c.dispose();
        });
        await test("one owner overlapping revisions cannot reset live work budget", () => {
          const f = make("");
          f.commit("a".repeat(40));
          f.commit("a".repeat(40) + "b".repeat(25));
          check("65 live identities immediate", all(f.host).length === 0 && f.host.textContent.length === 65);
          f.dispose();
        });
        await test("2049 input and4096 comparison overflow are exact, recovery baseline", () => {
          const f = make("Save");
          f.commit("x".repeat(2049));
          check("oversized exact", f.host.textContent.length === 2049 && all(f.host).length === 0);
          f.commit("Save");
          check("recovery no replay", f.host.textContent === "Save" && all(f.host).length === 0);
          f.commit("Saved");
          check("later change eligible", all(f.host).length === 1);
          f.dispose();
          const g = make("a".repeat(65));
          g.commit("b".repeat(65));
          check("comparison exact", g.host.textContent === "b".repeat(65) && all(g.host).length === 0);
          g.dispose();
        });
        for (const [before, after, style] of [
          ["office", "ofXice", "font:24px Georgia,serif;font-variant-ligatures:common-ligatures"],
          ["سلام", "سالم", ""],
          ["abc", "אבג", "direction:rtl"],
          ["é👩🏽‍💻", "é👨‍👩‍👧‍👦", ""],
          ["a\nb\tc", "a\nB\tc", "white-space:pre-wrap"],
          ["Save", "Saved", "letter-spacing:2px"],
          ["Save", "Saved", "text-transform:uppercase"],
        ]) {
          await test(`unsafe typography stays native exact: ${JSON.stringify(before)} ${style}`, () => {
            const f = make(before, { style });
            const text = f.host.firstChild;
            f.commit(after);
            check("exact", f.host.textContent === after);
            check("no unproven fade", all(f.host).length === 0);
            check("native Text identity", f.host.firstChild === text && f.host.childNodes.length === 1);
            f.dispose();
          });
        }
        await test("real wrapping matches unsplit reference without inline-block or font override", () => {
          const style = "display:block;width:100px;white-space:normal";
          const f = make("one two three four", { style });
          f.commit("one two three five");
          const reference = document.createElement("span");
          reference.style.cssText = style;
          reference.textContent = f.host.textContent;
          f.container.append(reference);
          const a = f.host.getBoundingClientRect(),
            b = reference.getBoundingClientRect();
          check("natural size", a.width === b.width && a.height === b.height, { a: a.toJSON(), b: b.toJSON() });
          check(
            "no layout override",
            [...f.host.querySelectorAll("span")].every(
              (node) => getComputedStyle(node).display === "inline" && !node.style.font,
            ),
          );
          f.dispose();
        });
        await test("truncation paint respects clipping and native scroll extent", () => {
          const f = make("abcdefghij", {
            style: "display:block;width:60px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap",
          });
          const width = document.documentElement.scrollWidth;
          f.commit("abcdXfghij");
          check("no document overflow", document.documentElement.scrollWidth === width);
          check("exact clipped text", f.host.textContent === "abcdXfghij");
          f.dispose();
        });
        await test("unknown containing blocks and shaped clipping never acquire paint", () => {
          for (const style of ["contain:paint", "clip-path:circle(40%)", "transform:scale(1.1)"]) {
            const f = make("Save", { containerStyle: style }),
              text = f.host.firstChild;
            f.commit("Saved");
            check(
              "exact native fallback",
              f.host.textContent === "Saved" && f.host.firstChild === text && all(f.host).length === 0,
              style,
            );
            f.dispose();
          }
        });
        await test("rounded clips accept only a fully interior candidate paint region", () => {
          for (const radius of ["9999px", "50%", "24px / 16px", "40% 10% 35% 15% / 35% 20% 40% 15%"]) {
            const f = make("Save", {
              containerStyle: `display:inline-flex;padding:18px;border:1px solid;overflow:hidden;border-radius:${radius}`,
            });
            const text = f.host.firstChild;
            f.commit("Same");
            check("interior opacity executes", all(f.host).length > 0, radius);
            check("semantic identity retained", f.host.firstChild === text && f.host.textContent === "Same");
            f.dispose();
          }
          for (const radius of ["9999px", "50%", "100% 0 0 0 / 100% 0 0 0"]) {
            const f = make("S", {
              containerStyle: `display:inline-flex;border:1px solid;overflow:hidden;border-radius:${radius}`,
            });
            f.commit("M");
            check(
              "corner-clipped candidate remains native",
              all(f.host).length === 0 && f.host.textContent === "M",
              radius,
            );
            f.dispose();
          }
        });
        await test("native anchor transport follows layout without moving the semantic host", async () => {
          const f = make("Save", { containerStyle: "display:flex;justify-content:center;width:250px" });
          f.commit("Same");
          const id = f.host.getAttribute("data-cadence-layout-anchor");
          const layer = [...document.querySelectorAll("[data-cadence-text-layer]")].find(
            (node) => node.dataset.cadenceTextOwner === f.host.id,
          );
          check("actual private anchor", Boolean(id && layer));
          const origin = f.host.getBoundingClientRect().left;
          const width = f.container.animate([{ width: "250px" }, { width: "150px" }], { duration: 500, fill: "both" });
          await frame();
          check(
            "root coordinates follow native layout",
            Math.abs(layer.getBoundingClientRect().left - (f.host.getBoundingClientRect().left - origin)) < 0.02,
          );
          f.host.setAttribute("data-cadence-layout-anchor", "caller");
          await Promise.resolve();
          await Promise.resolve();
          check(
            "caller claim revokes only owned paint",
            all(f.host).length === 0 &&
              f.host.textContent === "Same" &&
              f.host.getAttribute("data-cadence-layout-anchor") === "caller",
          );
          width.cancel();
          f.dispose();
          const caller = make("Save", { style: "anchor-name:--caller" });
          caller.commit("Same");
          check(
            "existing anchor remains caller owned",
            all(caller.host).length === 0 &&
              caller.host.style.anchorName === "--caller" &&
              caller.host.textContent === "Same",
          );
          caller.dispose();
        });
        await test("foreign rich child tree is untouched", () => {
          const f = make("Save");
          f.dispose();
          const host = document.createElement("span");
          const link = document.createElement("a");
          link.href = "#rich";
          link.textContent = "Save";
          host.append(link);
          document.body.append(host);
          const tx = createMotionTransaction(),
            c = createTextPresentation(host, tx);
          c.commit({
            value: "Saved",
            entity: "rich",
            revision: tx.revision("content", "Saved"),
            cm: window.textPolicy,
          });
          check("same caller tree", host.firstChild === link && link.textContent === "Save");
          c.dispose();
          host.remove();
        });
        for (const editable of ["true", "plaintext-only"]) {
          await test(`inherited ${editable} never splits before eligibility`, () => {
            const f = make("Save", { editable });
            const node = f.host.firstChild;
            f.commit("Saved");
            check(
              "native tree",
              f.host.childNodes.length === 1 && f.host.firstChild === node && f.host.textContent === "Saved",
            );
            check("no effects", all(f.host).length === 0);
            f.dispose();
          });
        }
        await test("active selection survives an unchanged retained Text node", () => {
          const f = make("Save");
          const node = f.host.firstChild;
          const range = document.createRange();
          range.setStart(node, 0);
          range.setEnd(node, 1);
          const selection = getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
          f.commit("Saved");
          check("same range", selection.anchorNode === node && selection.toString() === "S");
          check("selection fallback", all(f.host).length === 0);
          selection.removeAllRanges();
          f.dispose();
        });
        await test("retained middle selection and backward direction survive multiple edits", () => {
          const f = make("aXbYc"),
            text = f.host.firstChild;
          getSelection().setBaseAndExtent(text, 3, text, 2);
          f.commit("aPbQc");
          check("retained b", getSelection().toString() === "b");
          check("backward direction", getSelection().anchorOffset === 3 && getSelection().focusOffset === 2);
          check("no mask on selection", all(f.host).length === 0 && masked(f.host).length === 0);
          getSelection().removeAllRanges();
          f.dispose();
        });
        await test("foreign Highlight preserves exact native rendering", () => {
          const f = make("Save");
          const range = document.createRange();
          range.selectNodeContents(f.host);
          const foreign = new Highlight(range);
          CSS.highlights.set("foreign-fixture", foreign);
          f.commit("Saved");
          check("foreign authoritative", all(f.host).length === 0 && CSS.highlights.get("foreign-fixture") === foreign);
          CSS.highlights.delete("foreign-fixture");
          f.commit("Saved!");
          check("later independent update", all(f.host).length === 1);
          f.dispose();
        });
        await test("passive reflow and direct copy settle all mask and pixel paint", async () => {
          const f = make("Save");
          f.commit("Saved");
          f.host.style.fontSize = "24px";
          await Promise.resolve();
          check("font change canceled", all(f.host).length === 0 && masked(f.host).length === 0);
          f.commit("Saved!");
          f.host.dispatchEvent(new ClipboardEvent("copy"));
          check("copy canceled", all(f.host).length === 0 && masked(f.host).length === 0);
          f.dispose();
        });
        await test("editing entry cancels without rewriting tree/caret; leaving has no replay", async () => {
          const f = make("Save");
          f.commit("Saved");
          const nodes = [...f.host.childNodes],
            last = f.host.firstChild;
          const range = document.createRange();
          range.setStart(last, 5);
          range.collapse(true);
          getSelection().removeAllRanges();
          getSelection().addRange(range);
          f.container.contentEditable = "plaintext-only";
          await Promise.resolve();
          check(
            "same editing tree",
            nodes.every((node, i) => node === f.host.childNodes[i]),
          );
          check("same caret", getSelection().anchorNode === last && getSelection().anchorOffset === 5);
          check("paint canceled", all(f.host).length === 0);
          f.container.contentEditable = "false";
          await Promise.resolve();
          f.commit("Saved");
          check("leaving no replay", all(f.host).length === 0);
          getSelection().removeAllRanges();
          f.dispose();
        });
        await test("same-host entity switch is immediate; later same-entity edit remains eligible", () => {
          const f = make("Save");
          f.commit("Sent", { entity: "other" });
          check("entity baseline", all(f.host).length === 0 && f.host.textContent === "Sent");
          f.commit("Sents");
          check("later edit", all(f.host).length === 1);
          f.dispose();
        });
        await test("hidden, environment downgrade and dispose cancel without queued writes", async () => {
          const f = make("Save");
          f.commit("Saved");
          f.commit("Saved", { visible: false });
          check("hidden owner", all(f.host).length === 0);
          f.commit("Saved", { visible: true });
          check("hidden restore no replay", all(f.host).length === 0);
          f.commit("Saved!");
          const effects = all(f.host);
          f.dispose();
          await frame();
          check(
            "disposed",
            effects.every((a) => a.playState === "idle"),
          );
        });
        await test("real one-unit captured origin shares the text revision without local double fade", async () => {
          const source = document.createElement("span");
          source.textContent = "d";
          document.body.append(source);
          const f = make("", { containerStyle: "height:23px", handoff: true });
          const capture = captureHandoffOrigin(source, "d");
          check("actual capture", Boolean(capture));
          f.commit("d", { capture });
          check("one flight", document.querySelectorAll("[data-cadence-handoff-layer]").length === 1);
          check("no local replay", all(f.host).length === 1 && all(f.host)[0].effect.getTiming().duration === 0);
          const paint = document.querySelector("[data-cadence-handoff-paint]");
          window.textUpdate({ timeScale: 2 });
          f.commit("d", { capture });
          await Promise.resolve();
          check("physics clock retimes same paint", document.querySelector("[data-cadence-handoff-paint]") === paint);
          capture.invalidate();
          await Promise.resolve();
          check(
            "cancel exposes semantic destination",
            document.querySelectorAll("[data-cadence-handoff-layer]").length === 0 &&
              all(f.host).length === 0 &&
              f.host.textContent === "d",
          );
          f.commit("d");
          check("no canceled revision replay", all(f.host).length === 0);
          f.dispose();
          source.remove();
          window.textUpdate({ timeScale: 1 });
        });
        await test("invalid origin uses local changed-only replacement", () => {
          const source = document.createElement("span");
          source.textContent = "d";
          document.body.append(source);
          const f = make("Save", { handoff: true }),
            capture = captureHandoffOrigin(source, "d");
          capture.invalidate();
          f.commit("Saved", { capture });
          check("local d only", all(f.host).length === 1 && JSON.stringify(masked(f.host)) === '["d"]');
          f.dispose();
          source.remove();
        });
        await test("captured incoming identity counts once when retargeted into a64-unit replacement", () => {
          const source = document.createElement("span");
          source.textContent = "d";
          document.body.append(source);
          const f = make("", { containerStyle: "height:23px", handoff: true });
          const capture = captureHandoffOrigin(source, "d");
          f.commit("d", { capture });
          check("real flight", document.querySelectorAll("[data-cadence-handoff-layer]").length === 1);
          f.commit("e".repeat(63));
          check("64 changed units eligible", all(f.host).length === 64, all(f.host).length);
          check("old handoff retired", document.querySelectorAll("[data-cadence-handoff-layer]").length === 0);
          f.dispose();
          source.remove();
        });
        await test("raster allocation cap cannot authorize huge glyph splitting", () => {
          const f = make("Save", { style: "font-size:2000px" });
          check("no proof", proveTextLayout(f.host, createTextSnapshot("Save")) === null);
          f.commit("Saved");
          check("exact no fade", f.host.textContent === "Saved" && all(f.host).length === 0);
          f.dispose();
        });
      } finally {
        for (const f of own) f.dispose();
        window.textUpdate({ mode: "full", timeScale: 1 });
      }
      window.textBrowserCases = { cases, failures };
      return { cases, failures, diagnostic };
    });
    report.profiles.push({
      name,
      ...result,
      bundleBytes: Buffer.byteLength(client),
      gzipBytes: gzipSync(client).length,
      bundleSHA: hash(client),
    });
    report.failures.push(...result.failures.map((item) => ({ profile: name, ...item })));
    // Real clipboard and browser find: the current semantic value appears once;
    // canvas exits never enter clipboard/find text or the accessible name.
    const liveFind = await page.evaluate(() => {
      window.textUpdate({ value: "Send" });
      window.textUpdate({ value: "Sent" });
      return { exits: document.querySelectorAll('[data-cadence-text-kind="exit"]').length, old: window.find("Send") };
    });
    if (liveFind.exits < 1 || liveFind.old)
      report.failures.push({ profile: name, name: "find excludes active outgoing pixels", actual: liveFind });
    await page.evaluate(() => {
      const range = document.createRange();
      range.selectNodeContents(document.getElementById("owned"));
      getSelection().removeAllRanges();
      getSelection().addRange(range);
    });
    await page.keyboard.press("Control+c");
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    if (clipboard !== "Sent") report.failures.push({ profile: name, name: "real clipboard", actual: clipboard });
    const find = await page.evaluate(() => {
      getSelection().removeAllRanges();
      return {
        current: window.find("Sent"),
        old: window.find("Send"),
        text: document.getElementById("native-button").textContent,
      };
    });
    if (!find.current || find.old || find.text !== "Sent")
      report.failures.push({ profile: name, name: "native browser find", actual: find });
    const aria = await page.locator("#native-button").ariaSnapshot();
    if (!aria.includes('button "Sent"')) report.failures.push({ profile: name, name: "accessible name", actual: aria });
    await page.evaluate(() => getSelection().removeAllRanges());
    await page.evaluate(() => {
      window.textUpdate({ mode: "full", timeScale: 1, value: "" });
      window.textUpdate({ value: "Save" });
      for (const canvas of document.querySelectorAll('[data-cadence-text-owner="owned"] canvas'))
        for (const animation of canvas.getAnimations()) {
          animation.pause();
          animation.effect.setKeyframes([{ opacity: 1 }, { opacity: 1 }]);
          animation.currentTime = 0;
        }
    });
    const painted = await page.locator("#native-button").screenshot({ animations: "allow" });
    await writeFile(path.join(output, `${name}-painted.png`), painted);
    await page.evaluate(() => window.textUpdate({ mode: "none" }));
    const nativePaint = await page.locator("#native-button").screenshot({ animations: "allow" });
    await writeFile(path.join(output, `${name}-native.png`), nativePaint);
    report.profiles.at(-1).pixelCorrespondence = {
      paintedSHA: hash(painted),
      nativeSHA: hash(nativePaint),
      exact: hash(painted) === hash(nativePaint),
    };
    if (hash(painted) !== hash(nativePaint))
      report.profiles.at(-1).pixelCorrespondence.diff = await page.evaluate(
        async ({ a, b }) => {
          const decode = async (url) => {
            const image = new Image();
            image.src = url;
            await image.decode();
            const canvas = document.createElement("canvas");
            canvas.width = image.width;
            canvas.height = image.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(image, 0, 0);
            return {
              width: image.width,
              height: image.height,
              data: ctx.getImageData(0, 0, image.width, image.height).data,
            };
          };
          const x = await decode(a),
            y = await decode(b);
          let pixels = 0,
            maxDelta = 0;
          const bounds = [x.width, x.height, 0, 0];
          for (let i = 0; i < x.data.length; i += 4)
            if ([0, 1, 2, 3].some((offset) => x.data[i + offset] !== y.data[i + offset])) {
              pixels++;
              const px = (i / 4) % x.width,
                py = Math.floor(i / 4 / x.width);
              bounds[0] = Math.min(bounds[0], px);
              bounds[1] = Math.min(bounds[1], py);
              bounds[2] = Math.max(bounds[2], px);
              bounds[3] = Math.max(bounds[3], py);
              for (let offset = 0; offset < 4; offset++)
                maxDelta = Math.max(maxDelta, Math.abs(x.data[i + offset] - y.data[i + offset]));
            }
          const chromatic = (image) => {
            let n = 0;
            for (let i = 0; i < image.data.length; i += 4)
              if (image.data[i] !== image.data[i + 1] || image.data[i + 1] !== image.data[i + 2]) n++;
            return n;
          };
          let outsideSubpixelEnvelope = 0;
          for (let i = 0; i < x.data.length; i += 4) {
            if ([0, 1, 2, 3].every((offset) => x.data[i + offset] === y.data[i + offset])) continue;
            const low = Math.min(...y.data.slice(i, i + 3)),
              high = Math.max(...y.data.slice(i, i + 3));
            if (
              x.data[i] < low ||
              x.data[i] > high ||
              x.data[i] !== x.data[i + 1] ||
              x.data[i + 1] !== x.data[i + 2] ||
              x.data[i + 3] !== y.data[i + 3]
            )
              outsideSubpixelEnvelope++;
          }
          return {
            width: x.width,
            height: x.height,
            pixels,
            maxDelta,
            bounds,
            paintChromatic: chromatic(x),
            nativeChromatic: chromatic(y),
            outsideSubpixelEnvelope,
          };
        },
        {
          a: `data:image/png;base64,${painted.toString("base64")}`,
          b: `data:image/png;base64,${nativePaint.toString("base64")}`,
        },
      );
    // Windows native text uses LCD subpixel AA; canvas uses grayscale AA.
    // Do not assert identical RGB. Every grayscale pixel must lie in that SAME
    // pixel's native RGB coverage envelope, with no shifted/extra glyph pixel.
    // The stricter exploratory RGB failures remain in earlier retained reports.
    const correspondence = report.profiles.at(-1).pixelCorrespondence;
    correspondence.sameNativePixelCoverage = correspondence.exact || correspondence.diff.outsideSubpixelEnvelope === 0;
    if (!correspondence.sameNativePixelCoverage)
      report.failures.push({
        profile: name,
        name: "painted glyphs preserve native pixel coverage",
        actual: correspondence,
      });
    await page.evaluate(() => window.textUpdate({ mode: "full" }));
    await page.evaluate(() => {
      window.nativeEditors = {};
      for (const kind of ["control", "controller"]) {
        const editor = document.createElement("div");
        editor.id = `editor-${kind}`;
        editor.contentEditable = "plaintext-only";
        const host = document.createElement("span");
        host.textContent = "edit";
        editor.append(host);
        document.body.append(editor);
        const events = [];
        for (const type of ["beforeinput", "input", "compositionstart", "compositionupdate", "compositionend"])
          editor.addEventListener(type, (event) =>
            events.push({ type, inputType: event.inputType, data: event.data, trusted: event.isTrusted }),
          );
        let controller;
        if (kind === "controller") {
          const tx = window.textTools.createMotionTransaction();
          controller = window.textTools.createTextPresentation(host, tx);
          controller.commit({
            value: "edit",
            entity: host,
            revision: tx.revision("content", "edit"),
            cm: window.textPolicy,
          });
        }
        window.nativeEditors[kind] = { editor, host, node: host.firstChild, events, controller };
      }
    });
    const editing = {};
    const cdp = await context.newCDPSession(page);
    for (const kind of ["control", "controller"]) {
      await page.locator(`#editor-${kind}`).click();
      await page.keyboard.press("Control+End");
      await page.keyboard.type("!");
      const typed = await page.evaluate(
        (kind) => ({ value: window.nativeEditors[kind].editor.textContent, offset: getSelection().anchorOffset }),
        kind,
      );
      await page.keyboard.press("Control+z");
      const undo = await page.evaluate((kind) => window.nativeEditors[kind].editor.textContent, kind);
      await cdp.send("Input.imeSetComposition", { text: "拼", selectionStart: 1, selectionEnd: 1 });
      const composing = await page.evaluate((kind) => window.nativeEditors[kind].editor.textContent, kind);
      await cdp.send("Input.insertText", { text: "拼" });
      await page.keyboard.press("Control+z");
      editing[kind] = await page.evaluate(
        ({ kind, typed, undo, composing }) => {
          const f = window.nativeEditors[kind];
          return {
            typed,
            undo,
            composing,
            final: f.editor.textContent,
            events: f.events,
            sameNativeNode: f.host.firstChild === f.node,
            nodes: f.host.childNodes.length,
          };
        },
        { kind, typed, undo, composing },
      );
    }
    if (
      JSON.stringify(editing.control) !== JSON.stringify(editing.controller) ||
      editing.controller.typed.value !== "edit!" ||
      editing.controller.undo !== "edit" ||
      !editing.controller.events.some((event) => event.type === "compositionstart" && event.trusted)
    )
      report.failures.push({ profile: name, name: "trusted native editing/IME/undo parity", actual: editing });
    report.profiles.at(-1).nativeEditing = editing;
    await page.evaluate(() => {
      for (const f of Object.values(window.nativeEditors)) {
        f.controller?.dispose();
        f.editor.remove();
      }
    });
    await page.screenshot({ path: path.join(output, `${name}.png`) });
    await context.close();
  }
  // OS ceiling before client code and live downgrade; text never has a hidden
  // SSR state. Record the first frame after the actual media-query change.
  strict = false;
  const os = await browser.newContext({ reducedMotion: "reduce" });
  const osPage = await os.newPage();
  osPage.on("pageerror", (error) => report.errors.push({ profile: "os-policy", error: String(error) }));
  await osPage.goto(url);
  await osPage.waitForFunction(() => window.textPolicy?.mode === "reduced");
  const initial = await osPage.evaluate(() => ({
    mode: window.textPolicy.mode,
    text: document.getElementById("owned").textContent,
    nodes: document.getElementById("owned").childNodes.length,
    masks: CSS.highlights.size,
    effects: document.getAnimations().length,
  }));
  await osPage.emulateMedia({ reducedMotion: "no-preference" });
  await osPage.waitForFunction(() => window.textPolicy.mode === "full");
  await osPage.evaluate(() => {
    window.textUpdate({ value: "Saved", timeScale: 4 });
    window.osFirstFrame = null;
    matchMedia("(prefers-reduced-motion: reduce)").addEventListener(
      "change",
      () =>
        requestAnimationFrame(() => {
          window.osFirstFrame = {
            masks: CSS.highlights.size,
            paints: document.querySelectorAll("[data-cadence-text-layer]").length,
            text: document.getElementById("owned").textContent,
            effects: document.getAnimations().length,
          };
        }),
      { once: true },
    );
  });
  await osPage.emulateMedia({ reducedMotion: "reduce" });
  await osPage.waitForFunction(() => window.osFirstFrame !== null);
  const downgrade = await osPage.evaluate(() => window.osFirstFrame);
  report.osPolicy = { initial, downgrade };
  if (
    initial.text !== "Save" ||
    initial.nodes !== 1 ||
    initial.masks !== 0 ||
    initial.effects !== 0 ||
    downgrade.text !== "Saved" ||
    downgrade.masks !== 0 ||
    downgrade.paints !== 0 ||
    downgrade.effects !== 0
  )
    report.failures.push({ name: "actual OS first paint/live first-frame downgrade", actual: report.osPolicy });
  await os.close();
  const unsupported = await browser.newContext();
  await unsupported.addInitScript(() => {
    Object.defineProperty(window, "Highlight", { value: undefined, configurable: true });
  });
  const noHighlight = await unsupported.newPage();
  noHighlight.on("pageerror", (error) => report.errors.push({ profile: "unsupported", error: String(error) }));
  await noHighlight.goto(url);
  await noHighlight.waitForFunction(() => window.textUpdate && window.textPolicy);
  report.unsupported = await noHighlight.evaluate(() => {
    const host = document.getElementById("owned"),
      text = host.firstChild;
    window.textUpdate({ value: "Saved" });
    return {
      exact: host.textContent === "Saved",
      sameText: host.firstChild === text,
      masks: CSS.highlights.size,
      paint: document.querySelectorAll("[data-cadence-text-layer]").length,
    };
  });
  if (!report.unsupported.exact || !report.unsupported.sameText || report.unsupported.masks || report.unsupported.paint)
    report.failures.push({ name: "unsupported Highlight immediate native fallback", actual: report.unsupported });
  await unsupported.close();
  const scaled = await browser.newContext({ deviceScaleFactor: 2 });
  const scaledPage = await scaled.newPage();
  scaledPage.on("pageerror", (error) => report.errors.push({ profile: "dpr2-fallback", error: String(error) }));
  await scaledPage.goto(url);
  await scaledPage.waitForFunction(() => window.textUpdate && window.textPolicy);
  report.dpr2Fallback = await scaledPage.evaluate(() => {
    const host = document.getElementById("owned"),
      text = host.firstChild;
    window.textUpdate({ value: "Saved" });
    const range = document.createRange();
    range.setStart(text, 0);
    range.setEnd(text, 1);
    getSelection().removeAllRanges();
    getSelection().addRange(range);
    window.textUpdate({ value: "Saves" });
    return {
      exact: host.textContent === "Saves",
      sameText: host.firstChild === text,
      selection: getSelection().toString(),
      masks: CSS.highlights.size,
      paint: document.querySelectorAll("[data-cadence-text-layer]").length,
      effects: document.getAnimations().length,
    };
  });
  if (
    !report.dpr2Fallback.exact ||
    !report.dpr2Fallback.sameText ||
    report.dpr2Fallback.selection !== "S" ||
    report.dpr2Fallback.masks ||
    report.dpr2Fallback.paint ||
    report.dpr2Fallback.effects
  )
    report.failures.push({ name: "DPR2 unproven raster stays exact native", actual: report.dpr2Fallback });
  await scaled.close();
  const zoom = await browser.newContext();
  const zoomPage = await zoom.newPage();
  zoomPage.on("pageerror", (error) => report.errors.push({ profile: "visual-viewport", error: String(error) }));
  await zoomPage.goto(url);
  await zoomPage.waitForFunction(() => window.textUpdate && window.textPolicy);
  await zoomPage.evaluate(() => window.textUpdate({ value: "Saved", timeScale: 4 }));
  const zoomCDP = await zoom.newCDPSession(zoomPage);
  await zoomCDP.send("Emulation.setPageScaleFactor", { pageScaleFactor: 2 });
  await zoomPage.waitForFunction(() => visualViewport.scale === 2);
  report.visualViewport = await zoomPage.evaluate(() => {
    const host = document.getElementById("owned"),
      text = host.firstChild;
    window.textUpdate({ value: "Saves" });
    return {
      scale: visualViewport.scale,
      exact: host.textContent === "Saves",
      sameText: host.firstChild === text,
      masks: CSS.highlights.size,
      paint: document.querySelectorAll("[data-cadence-text-layer]").length,
      effects: document.getAnimations().length,
    };
  });
  if (
    !report.visualViewport.exact ||
    !report.visualViewport.sameText ||
    report.visualViewport.masks ||
    report.visualViewport.paint ||
    report.visualViewport.effects
  )
    report.failures.push({ name: "unknown visual-viewport mapping exact fallback", actual: report.visualViewport });
  await zoom.close();
} finally {
  await browser?.close();
  if (server) await new Promise((resolve) => server.close(resolve));
  report.resources = { ownBrowserClosed: true, ownHTTPServerClosed: true, persistentProcesses: 0, deletionAttempts: 0 };
  await writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2));
}
console.log(
  JSON.stringify(
    {
      profiles: report.profiles.map((p) => ({
        name: p.name,
        passed: p.cases.length,
        failed: p.failures.length,
        gzipBytes: p.gzipBytes,
      })),
      failures: report.failures,
      errors: report.errors,
      resources: report.resources,
    },
    null,
    2,
  ),
);
assert.equal(report.errors.length, 0);
assert.equal(report.failures.length, 0);
