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
  process.env.CADENCE_GEOMETRY_OUTPUT ?? `.cache/motion-v2-execution/s07-measured-geometry/browser-${Date.now()}`,
);
await mkdir(output, { recursive: false });
const runnerSource = await readFile(new URL(import.meta.url));
await writeFile(path.join(output, "runner.mjs"), runnerSource);
const require = createRequire(import.meta.url);
const vite = require.resolve("vite", { paths: [require.resolve("vitest/node")] });
const { build } = await import(pathToFileURL(require.resolve("esbuild", { paths: [vite] })));
const plugins = process.env.GEOMETRY_COPY
  ? [
      {
        name: "installed-geometry",
        setup(build) {
          build.onResolve({ filter: /registry[\\/]cadence[\\/]/ }, (args) => {
            const target = path.resolve(
              process.env.GEOMETRY_COPY,
              args.path.replaceAll("\\", "/").split("registry/cadence/")[1],
            );
            const file = [`${target}.tsx`, `${target}.ts`, path.join(target, "index.tsx")].find(existsSync);
            assert(file, "installed target without workspace fallback");
            return { path: file };
          });
        },
      },
    ]
  : [];
if (process.env.GEOMETRY_REACT_ROOT)
  plugins.push({
    name: "copied-react",
    setup(build) {
      build.onResolve({ filter: /^(react|react-dom)(\/.*)?$/ }, (args) => ({
        path: require.resolve(args.path, { paths: [process.env.GEOMETRY_REACT_ROOT] }),
      }));
    },
  });
let fault;
if (process.env.GEOMETRY_FAULT)
  plugins.push({
    name: "geometry-negative",
    setup(build) {
      build.onLoad({ filter: /measured-geometry\.ts$/ }, async (args) => {
        const original = await readFile(args.path, "utf8");
        const anchor = "if (committed?.revision === revision && committed.policy === signature) return;";
        assert.equal(original.split(anchor).length, 2);
        const executed = original.replace(anchor, "/* exact negative: restart same revision */");
        fault = {
          name: process.env.GEOMETRY_FAULT,
          original: createHash("sha256").update(original).digest("hex"),
          executed: createHash("sha256").update(executed).digest("hex"),
        };
        await writeFile(path.join(output, "fault.ts"), executed);
        return { contents: executed, loader: "ts" };
      });
    },
  });
const bundle = await build({
  plugins,
  entryPoints: ["tests/runtime/measured-geometry.jsx"],
  bundle: true,
  write: false,
  metafile: true,
  define: { "process.env.NODE_ENV": JSON.stringify(process.env.GEOMETRY_STRICT ? "development" : "production") },
  jsx: "automatic",
  format: "iife",
});
const report = {
  inputs: {},
  cases: [],
  failures: [],
  errors: [],
  fault,
  runnerSHA: createHash("sha256").update(runnerSource).digest("hex"),
};
for (const file of Object.keys(bundle.metafile.inputs))
  report.inputs[file] = createHash("sha256")
    .update(await readFile(file))
    .digest("hex");
let client = bundle.outputFiles[0].text;
if (process.env.GEOMETRY_HISTORICAL_CLIENT) {
  const historical = process.env.GEOMETRY_HISTORICAL_CLIENT;
  client = await readFile(historical, "utf8");
  const binding = await readFile(path.join(path.dirname(historical), "report.json"));
  report.inputs = JSON.parse(binding).inputs;
  report.historicalClient = {
    path: historical,
    sha: createHash("sha256").update(client).digest("hex"),
    bindingSHA: createHash("sha256").update(binding).digest("hex"),
  };
}
await writeFile(path.join(output, "executed.js"), client);
const base = (
  await postcss([tailwind()]).process(await readFile("app/globals.css", "utf8"), {
    from: path.resolve("app/globals.css"),
  })
).css;
const ssr = await build({
  plugins,
  entryPoints: ["tests/runtime/measured-geometry-ssr.jsx"],
  bundle: true,
  write: false,
  platform: "node",
  packages: process.env.GEOMETRY_REACT_ROOT ? undefined : "external",
  metafile: true,
  format: "cjs",
  jsx: "automatic",
});
const ssrFile = path.join(output, "ssr.cjs");
await writeFile(ssrFile, ssr.outputFiles[0].text);
const markup = require(ssrFile).html;
report.ssrInputs = Object.fromEntries(
  await Promise.all(
    Object.keys(ssr.metafile.inputs).map(async (f) => [
      f,
      createHash("sha256")
        .update(await readFile(f))
        .digest("hex"),
    ]),
  ),
);
report.react = {
  requestedRoot: process.env.GEOMETRY_REACT_ROOT ?? null,
  resolvedPackage: require.resolve(
    "react/package.json",
    process.env.GEOMETRY_REACT_ROOT ? { paths: [process.env.GEOMETRY_REACT_ROOT] } : undefined,
  ),
};
const css =
  base +
  `body{font:16px sans-serif;background:${process.env.GEOMETRY_DARK ? "#111;color:#eee" : "#fff;color:#111"}}[data-slot=code-block-viewport]{overflow:hidden}pre{margin:0}#outer,#inner{overflow:hidden}#outer{width:300px;padding:7px;border:3px solid;box-sizing:border-box}#natural,#leaf{display:flow-root}#leaf{height:80px}input{display:block}`;
await writeFile(path.join(output, "compiled.css"), css);
const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", req.url === "/bundle.js" ? "text/javascript" : "text/html");
  res.end(
    req.url === "/bundle.js"
      ? client
      : `<!doctype html><html class="${process.env.GEOMETRY_DARK ? "dark" : ""}"><style>${css}</style><div id="root">${markup}</div><form id="compound"></form><script>window.geometrySSR=true;window.geometryStrict=${Boolean(process.env.GEOMETRY_STRICT)}</script><script src="/bundle.js"></script>`,
  );
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ deviceScaleFactor: Number(process.env.GEOMETRY_DPR ?? 1) });
page.on("pageerror", (e) => report.errors.push(e.stack));
const sample = () =>
  page.evaluate(() => {
    const n = document.querySelector("[data-slot=code-block-viewport]");
    return {
      height: n?.getBoundingClientRect().height,
      layoutHeight: n?.offsetHeight,
      inline: n?.style.height,
      effects: n?.getAnimations().length,
      pre: document.querySelector("pre")?.scrollHeight,
    };
  });
async function check(name, fn) {
  if (process.env.GEOMETRY_ONLY && !name.includes(process.env.GEOMETRY_ONLY)) return;
  try {
    const evidence = await fn();
    report.cases.push({ name, evidence, passed: true });
  } catch (e) {
    report.cases.push({ name, passed: false });
    report.failures.push({ name, message: e.stack });
  }
}
try {
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => window.geometryReady);
  report.react.actualBrowser = await page.evaluate(() => window.geometryReactVersion);
  report.devicePixelRatio = await page.evaluate(() => devicePixelRatio);
  report.theme = await page.evaluate(() => ({
    dark: document.documentElement.classList.contains("dark"),
    foreground: getComputedStyle(document.documentElement).getPropertyValue("--foreground"),
  }));
  assert.equal(report.theme.dark, Boolean(process.env.GEOMETRY_DARK));
  assert.equal(report.react.actualBrowser, JSON.parse(await readFile(report.react.resolvedPackage, "utf8")).version);
  await check("initial folded baseline", async () => {
    const s = await sample();
    assert.equal(s.height, 50);
    return s;
  });
  await check("SSR remains readable without scripting", async () => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    try {
      const native = await context.newPage();
      await native.goto(`http://127.0.0.1:${server.address().port}`);
      assert.equal(await native.locator("pre").count(), 1);
      assert((await native.locator("pre").textContent()).includes("Line 19"));
      return { height: await native.locator("[data-slot=code-block-viewport]").evaluate((n) => n.offsetHeight) };
    } finally {
      await context.close();
    }
  });
  for (const mode of ["full", "reduced", "none"]) {
    await page.evaluate((mode) => window.updateGeometry({ mode, expanded: false }), mode);
    await page.waitForTimeout(40);
    await check(`${mode} expansion and first frame`, async () => {
      await page.evaluate(() => window.updateGeometry({ expanded: true }));
      await page.waitForTimeout(35);
      const s = await sample();
      if (mode === "full") assert(s.height > 50 && s.height < s.pre);
      else assert.equal(s.height, s.pre);
      return s;
    });
    await check(`${mode} live downgrade and zero`, async () => {
      await page.evaluate(() => window.updateGeometry({ mode: "none" }));
      await page.waitForTimeout(25);
      let s = await sample();
      assert.equal(s.height, s.pre);
      assert.equal(s.effects, 0);
      await page.evaluate(() => window.updateGeometry({ mode: "full", clock: 0, expanded: false }));
      await page.waitForTimeout(25);
      s = await sample();
      assert.equal(s.height, 50);
      assert.equal(s.effects, 0);
      await page.evaluate(() => window.updateGeometry({ clock: 3 }));
      return s;
    });
  }
  await check("rapid reverse latest target and passive viewport", async () => {
    await page.evaluate(() => window.updateGeometry({ mode: "full", expanded: true }));
    await page.waitForTimeout(50);
    await page.evaluate(() => window.updateGeometry({ expanded: false }));
    await page.waitForTimeout(35);
    let s = await sample();
    assert(s.height >= 50);
    await page.setViewportSize({ width: 390, height: 700 });
    await page.waitForTimeout(30);
    s = await sample();
    assert.equal(s.height, 50);
    assert.equal(s.effects, 0);
    return s;
  });
  await check("unmount retires writer", async () => {
    await page.evaluate(() => window.updateGeometry({ expanded: true }));
    await page.waitForTimeout(30);
    await page.evaluate(() => {
      window.retired = document.querySelector("[data-slot=code-block-viewport]");
      window.updateGeometry({ mounted: false });
    });
    await page.waitForTimeout(30);
    assert.equal(await page.evaluate(() => window.retired.getAnimations().length), 0);
  });
  await check("retarget starts at the clamped visible size instead of hidden spring overshoot", async () => {
    await page.evaluate(() => window.updateGeometry({ mounted: true, expanded: true, lines: 20 }));
    await page.waitForTimeout(300);
    await page.evaluate(() => window.updateGeometry({ lines: 4 }));
    await page.waitForTimeout(40);
    const before = await sample();
    assert.equal(before.height, 100);
    await page.evaluate(() => window.updateGeometry({ lines: 30 }));
    await page.waitForFunction(() => window.geometryCommits.some((s) => s.lines === 30));
    const commit = await page.evaluate(() => window.geometryCommits.filter((s) => s.lines === 30).at(-1));
    assert(commit.height <= 101, JSON.stringify({ before, commit }));
    await page.evaluate(() => window.updateGeometry({ lines: 20, expanded: false }));
    return { before, commit };
  });
  await check("actual folded source reveals focused native editor before paint", async () => {
    await page.evaluate(() => window.updateGeometry({ mounted: true, expanded: false }));
    await page.waitForTimeout(30);
    const s = await page.evaluate(() => {
      const input = document.createElement("input");
      input.name = "source-editor";
      input.value = "editable";
      document.querySelector("pre code").append(input);
      input.focus();
      input.setSelectionRange(1, 4);
      const host = document.querySelector("[data-slot=code-block-viewport]");
      return {
        height: host.offsetHeight,
        full: document.querySelector("pre").scrollHeight,
        effects: host.getAnimations().length,
        selection: [input.selectionStart, input.selectionEnd],
        count: document.querySelectorAll("[name=source-editor]").length,
      };
    });
    assert.equal(s.height, s.full);
    assert.equal(s.effects, 0);
    assert.deepEqual(s.selection, [1, 4]);
    assert.equal(s.count, 1);
    return s;
  });
  await check("compound final destinations and no frame reads", async () => {
    await page.evaluate(() => window.mountCompound());
    await page.waitForTimeout(40);
    await page.evaluate(() => {
      document.querySelector("#leaf").style.height = "300px";
      window.commitCompound(1);
      window.readStart = window.reads;
    });
    await page.waitForTimeout(80);
    await page.waitForFunction(() => document.querySelector("#outer").offsetHeight > 100, { timeout: 1000 });
    const s = await page.evaluate(() => ({
      outer: document.querySelector("#outer").offsetHeight,
      inner: document.querySelector("#inner").offsetHeight,
      effects: document.querySelector("#inner").getAnimations().length,
      reads: window.reads,
      start: window.readStart,
    }));
    assert.equal(s.inner, 300);
    assert.equal(s.effects, 0);
    assert(s.outer > 100 && s.outer < 320, JSON.stringify(s));
    assert.equal(s.reads, s.start);
    return s;
  });
  await check("native focused editor and single real form tree", async () => {
    await page.locator("#editor").focus();
    await page.evaluate(() => {
      const e = document.querySelector("#editor");
      e.setSelectionRange(1, 5);
      document.querySelector("#leaf").style.height = "150px";
      window.commitCompound(2);
    });
    const s = await page.evaluate(() => ({
      outer: document.querySelector("#outer").offsetHeight,
      effects: document.querySelector("#outer").getAnimations().length,
      selection: [document.activeElement.selectionStart, document.activeElement.selectionEnd],
      fields: [...new FormData(document.querySelector("form")).entries()],
      ids: document.querySelectorAll("#editor").length,
    }));
    assert.equal(s.outer, 170);
    assert.equal(s.effects, 0);
    assert.deepEqual(s.selection, [1, 5]);
    assert.equal(s.ids, 1);
    assert.deepEqual(s.fields, [["unique", "selection"]]);
    return s;
  });
  await check("hidden recovery establishes native baseline", async () => {
    await page.evaluate(() => {
      document.activeElement.blur();
      document.querySelector("#outer").style.display = "none";
      window.commitCompound(3);
    });
    await page.waitForTimeout(30);
    await page.evaluate(() => {
      document.querySelector("#leaf").style.height = "250px";
      document.querySelector("#outer").style.display = "block";
    });
    await page.waitForTimeout(70);
    const s = await page.evaluate(() => ({
      height: document.querySelector("#outer").offsetHeight,
      effects: document.querySelector("#outer").getAnimations().length,
    }));
    assert.equal(s.height, 270);
    assert.equal(s.effects, 0);
    return s;
  });
  await check("same target render retains writer", async () => {
    await page.evaluate(() => {
      document.querySelector("#leaf").style.height = "400px";
      window.commitCompound(4);
      window.effectBefore = document.querySelector("#outer").getAnimations()[0];
      window.commitCompound(4);
    });
    assert.equal(
      await page.evaluate(() => document.querySelector("#outer").getAnimations()[0] === window.effectBefore),
      true,
    );
  });
  await check("passive font readiness and zero-clock restoration stay native", async () => {
    await page.evaluate(() => document.fonts.dispatchEvent(new Event("loadingdone")));
    assert.equal(await page.evaluate(() => document.querySelector("#outer").getAnimations().length), 0);
    assert.equal(await page.locator("#outer").evaluate((n) => n.offsetHeight), 420);
    const restored = await page.evaluate(() => {
      window.commitCompound("stable-instant", "none", 0);
      document.querySelector("#leaf").style.height = "200px";
      window.commitCompound("stable-instant", "full", 3);
      return {
        height: document.querySelector("#outer").offsetHeight,
        effects: document.querySelector("#outer").getAnimations().length,
      };
    });
    assert.equal(restored.height, 220);
    assert.equal(restored.effects, 0);
    return { fontHeight: 420, restored };
  });
  await check("unsafe destination width uses final readable layout", async () => {
    await page.evaluate(() => {
      window.mountCompound("width");
      document.querySelector("#outer").style.width = "220px";
      window.commitCompound(5);
    });
    assert.equal(await page.locator("#outer").evaluate((n) => n.offsetWidth), 220);
    assert.equal(await page.locator("#outer").evaluate((n) => n.getAnimations().length), 0);
  });
  await check("safe width keeps the complete destination label readable in three modes", async () => {
    const rows = [];
    for (const mode of ["full", "reduced", "none"]) {
      await page.evaluate((mode) => {
        window.mountSafeWidth(mode);
        document.querySelector("[data-slot=geometry-width-native]>span").textContent = "A required longer action label";
        window.commitCompound("width-label", mode);
      }, mode);
      await page.waitForTimeout(30);
      const row = await page.locator("[data-slot=geometry-width-native]").evaluate((n) => {
        const text = n.firstElementChild,
          r = text.getBoundingClientRect();
        return {
          mode: n.dataset.motion,
          width: n.getBoundingClientRect().width,
          natural: text.offsetWidth,
          effects: n.getAnimations().length,
          overflow: getComputedStyle(n).overflow,
          transform: getComputedStyle(text).transform,
          labelVisible: r.left >= 0 && r.right <= innerWidth,
          text: text.textContent,
        };
      });
      assert.equal(row.mode, mode);
      assert.equal(row.transform, "none");
      assert.equal(row.labelVisible, true);
      assert.equal(row.text, "A required longer action label");
      if (mode === "full") {
        assert.equal(row.effects, 1);
        assert(row.width < row.natural);
        assert.equal(row.overflow, "visible");
        await page.locator("[data-slot=geometry-width-native]").focus();
        assert.equal(
          await page.locator("[data-slot=geometry-width-native]").evaluate((n) => n.getAnimations().length),
          0,
        );
      } else {
        assert.equal(row.effects, 0);
        assert(row.width >= row.natural);
      }
      rows.push(row);
    }
    return rows;
  });
  await check("cyclic measurement is explicitly native", async () => {
    await page.evaluate(() => {
      window.mountCompound("cycle");
      document.querySelector("#leaf").style.height = "200px";
      window.commitCompound(6);
    });
    assert.equal(await page.locator("#outer").evaluate((n) => n.getAnimations().length), 0);
    assert.equal(await page.locator("#outer").evaluate((n) => n.offsetHeight), 220);
  });
  await check("fixed axis and box sizing survive transformed ancestors", async () => {
    await page.evaluate(() => {
      window.mountCompound();
      const n = document.querySelector("#outer");
      n.style.height = "160px";
      n.style.transform = "scale(.8)";
      document.querySelector("#leaf").style.height = "500px";
      window.commitCompound(7);
    });
    assert.equal(await page.locator("#outer").evaluate((n) => n.offsetHeight), 160);
    assert.equal(
      await page.locator("#outer").evaluate((n) => getComputedStyle(n).transform),
      "matrix(0.8, 0, 0, 0.8, 0, 0)",
    );
  });
  await check("latest caller native policy remains after cancellation", async () => {
    await page.evaluate(() => {
      window.mountCompound();
      document.querySelector("#leaf").style.height = "300px";
      window.commitCompound(8);
      document.querySelector("#outer").style.height = "175px";
      window.disposeCompound();
    });
    assert.equal(await page.locator("#outer").evaluate((n) => n.offsetHeight), 175);
    assert.equal(await page.locator("#outer").evaluate((n) => n.getAnimations().length), 0);
  });
  await check("genuine empty layout differs from hidden", async () => {
    await page.evaluate(() => {
      window.mountCompound();
      document.querySelector("#leaf").replaceChildren();
      document.querySelector("#leaf").style.height = "0px";
      window.commitCompound(9, "none");
    });
    assert.equal(await page.locator("#outer").evaluate((n) => n.offsetHeight), 20);
  });
  await check("logical observer boxes preserve physical geometry in vertical writing", async () => {
    await page.evaluate(() => {
      window.mountCompound("single");
      document.querySelector("#natural").style.writingMode = "vertical-rl";
    });
    await page.waitForTimeout(60);
    await page.evaluate(() => {
      document.querySelector("#leaf").style.height = "300px";
      window.commitCompound("vertical");
      window.verticalReads = window.reads;
    });
    await page.waitForFunction(() => document.querySelector("#outer").offsetHeight > 100);
    const s = await page.evaluate(() => ({
      height: document.querySelector("#outer").offsetHeight,
      effects: document.querySelector("#outer").getAnimations().length,
      reads: window.reads,
      start: window.verticalReads,
    }));
    assert.equal(s.effects, 1);
    assert.equal(s.reads, s.start);
    await page.evaluate(() => (document.querySelector("#natural").style.writingMode = "horizontal-tb"));
    await page.waitForTimeout(40);
    assert.equal(await page.locator("#outer").evaluate((n) => n.getAnimations().length), 0);
    return s;
  });
  await check("one shell with eighty static descendants remains one moving owner", async () => {
    await page.evaluate(() => {
      window.mountCollection(80, true);
      document.querySelector("[data-geometry-host]>div").style.height = "200px";
      window.commitCompound("eighty-static");
    });
    assert.equal(await page.locator("[data-geometry-host]").count(), 1);
    assert.equal(await page.locator("[data-geometry-host]").evaluate((n) => n.getAnimations().length), 1);
    assert.equal(await page.evaluate(() => window.reads), 2);
  });
  await check("fifty-one real owners fall back before per-owner measurement", async () => {
    await page.evaluate(() => {
      window.mountCollection(50);
      for (const n of document.querySelectorAll("[data-geometry-host]>div")) n.style.height = "60px";
      window.commitCompound("fifty-active");
      window.addCollectionOwner();
      document.querySelector("[data-geometry-host]:last-child>div").style.height = "60px";
      window.reads = 0;
      window.captureReads = 0;
      const original = Element.prototype.getClientRects;
      Element.prototype.getClientRects = function () {
        if (this.hasAttribute("data-geometry-host")) window.captureReads++;
        return original.call(this);
      };
      try {
        window.commitCompound("fifty-one");
      } finally {
        Element.prototype.getClientRects = original;
      }
    });
    const s = await page.evaluate(() => ({
      reads: window.reads,
      captureReads: window.captureReads,
      effects: [...document.querySelectorAll("[data-geometry-host]")].reduce((s, n) => s + n.getAnimations().length, 0),
      heights: [...document.querySelectorAll("[data-geometry-host]")].map((n) => n.offsetHeight),
    }));
    assert.equal(s.reads, 0);
    assert.equal(s.captureReads, 0);
    assert.equal(s.effects, 0);
    assert(s.heights.every((h) => h === 60));
    return s;
  });
  await check("exactly fifty independent hosts animate within the bound", async () => {
    await page.evaluate(() => {
      document.activeElement.blur();
      window.mountCollection(50);
      for (const n of document.querySelectorAll("[data-geometry-host]>div")) n.style.height = "60px";
      window.commitCompound("fifty");
    });
    const s = await page.evaluate(() => ({
      reads: window.reads,
      effects: [...document.querySelectorAll("[data-geometry-host]")].reduce((s, n) => s + n.getAnimations().length, 0),
    }));
    assert.equal(s.reads, 100);
    assert.equal(s.effects, 50);
    return s;
  });
  await check("one outer owner with sixty registered same-axis delegates", async () => {
    await page.evaluate(() => {
      window.mountDelegated(60);
      for (const n of document.querySelectorAll("[data-geometry-host]>div>div>div")) n.style.height = "60px";
      window.commitCompound("sixty-delegates");
    });
    const s = await page.evaluate(() => ({
      reads: window.reads,
      effects: [...document.querySelectorAll("#compound *")].reduce((s, n) => s + n.getAnimations().length, 0),
      count: document.querySelector("[data-geometry-host]>div").children.length,
    }));
    assert.equal(s.reads, 1);
    assert.equal(s.effects, 1);
    assert.equal(s.count, 60);
    return s;
  });
  await check("native editor scroll selection and pointer capture survive geometry commit", async () => {
    await page.evaluate(() => {
      window.mountCompound("single");
      const old = document.querySelector("#editor"),
        n = document.createElement("textarea");
      n.id = "native-editor";
      n.value = Array.from({ length: 80 }, (_, i) => `Line ${i}`).join("\n");
      n.style.cssText = "height:30px;width:200px;overflow:auto";
      old.replaceWith(n);
      n.addEventListener("pointerdown", (e) => {
        n.setPointerCapture(e.pointerId);
        window.nativePointer = e.pointerId;
      });
    });
    await page.locator("#native-editor").scrollIntoViewIfNeeded();
    const box = await page.locator("#native-editor").boundingBox();
    await page.mouse.move(box.x + 5, box.y + 5);
    await page.mouse.down();
    try {
      const s = await page.evaluate(() => {
        const n = document.querySelector("#native-editor");
        n.setSelectionRange(2, 7);
        n.scrollTop = 120;
        document.querySelector("#leaf").style.height = "300px";
        window.commitCompound("native-edit");
        return {
          selection: [n.selectionStart, n.selectionEnd],
          scroll: n.scrollTop,
          captured: n.hasPointerCapture(window.nativePointer),
          effects: document.querySelector("#outer").getAnimations().length,
          height: document.querySelector("#outer").offsetHeight,
        };
      });
      assert.deepEqual(s.selection, [2, 7]);
      assert.equal(s.scroll, 120);
      assert.equal(s.captured, true);
      assert.equal(s.effects, 0);
      assert.equal(s.height, 320);
      return s;
    } finally {
      await page.mouse.up();
    }
  });
  await check("detached and restored host retires its previous writer", async () => {
    await page.evaluate(() => {
      document.activeElement.blur();
      window.mountCompound("single");
      document.querySelector("#leaf").style.height = "300px";
      window.commitCompound("detach");
      window.detachedGeometry = document.querySelector("#outer");
      window.detachedGeometry.remove();
    });
    await page.waitForTimeout(50);
    await page.evaluate(() => document.querySelector("#compound").append(window.detachedGeometry));
    await page.waitForTimeout(60);
    const s = await page
      .locator("#outer")
      .evaluate((n) => ({ height: n.offsetHeight, effects: n.getAnimations().length }));
    assert.equal(s.height, 320);
    assert.equal(s.effects, 0);
    return s;
  });
  await check("native disconnected callback revokes only its own lifetime", async () => {
    const s = await page.evaluate(() => {
      window.disposeCompound();
      window.mountNativeLifetimes();
      const a = document.querySelector("#native-life-0"),
        b = document.querySelector("#native-life-1");
      window.updateNativeLife(a, 300);
      window.updateNativeLife(b, 200);
      const old = a.getAnimations()[0],
        other = b.getAnimations()[0];
      a.remove();
      const retired = old.playState;
      document.querySelector("#compound").append(a);
      const baseline = { height: a.offsetHeight, effects: a.getAnimations().length };
      window.updateNativeLife(a, 400);
      return {
        retired,
        baseline,
        otherPreserved: b.getAnimations()[0] === other,
        fresh: a.getAnimations()[0] !== old,
        effects: a.getAnimations().length,
      };
    });
    assert.equal(s.retired, "idle");
    assert.deepEqual(s.baseline, { height: 300, effects: 0 });
    assert.equal(s.otherPreserved, true);
    assert.equal(s.fresh, true);
    assert.equal(s.effects, 1);
    return s;
  });
  await check("adapter failure releases geometry authority and propagates the error", async () => {
    const s = await page.evaluate(() => {
      window.mountCompound("single");
      document.querySelector("#leaf").style.height = "300px";
      window.commitCompound("before-error");
      window.failGeometryMeasure = true;
      let error;
      try {
        window.commitCompound("error");
      } catch (e) {
        error = e.message;
      } finally {
        window.failGeometryMeasure = false;
      }
      return {
        error,
        effects: document.querySelector("#outer").getAnimations().length,
        height: document.querySelector("#outer").offsetHeight,
      };
    });
    assert.equal(s.error, "expected adapter failure");
    assert.equal(s.effects, 0);
    assert.equal(s.height, 320);
    return s;
  });
  await check("native popup close retires child geometry before exit completes", async () => {
    await page.evaluate(() =>
      window.updateGeometry({
        popup: true,
        open: true,
        mounted: true,
        expanded: false,
        lines: 20,
        mode: "full",
        clock: 3,
      }),
    );
    await page.waitForTimeout(80);
    await page.evaluate(() => window.updateGeometry({ expanded: true }));
    await page.waitForTimeout(40);
    assert.equal(
      await page.evaluate(() => {
        window.popupGeometryEffect = document.querySelector("[data-slot=code-block-viewport]").getAnimations()[0];
        return Boolean(window.popupGeometryEffect);
      }),
      true,
    );
    await page.evaluate(() => window.updateGeometry({ open: false }));
    await page.waitForTimeout(30);
    const state = await page.evaluate(() => window.popupGeometryEffect.playState);
    assert.equal(state, "idle");
    await page.evaluate(() => window.updateGeometry({ open: true }));
    await page.waitForTimeout(50);
    const s = await sample();
    assert.equal(s.layoutHeight, s.pre);
    assert.equal(s.effects, 0);
    await page.evaluate(() => window.updateGeometry({ popup: false, expanded: false }));
    // The next case mutates the real viewport's box model. Wait for the native
    // portal-to-inline host replacement, rather than writing the retired popup.
    await page.waitForFunction(() => {
      const viewport = document.querySelector("[data-slot=code-block-viewport]");
      return (
        viewport &&
        document.getElementById("root").contains(viewport) &&
        window.geometryCommits?.at(-1)?.popup === false
      );
    });
    return { closedWriter: state, reopened: s };
  });
  await check("fixed native pre with borders keeps fold lines and releases without a size jump", async () => {
    await page.evaluate(() => {
      const n = document.querySelector("[data-slot=code-block-viewport]");
      n.style.padding = "3px";
      n.style.border = "2px solid";
      n.style.boxSizing = "border-box";
      window.updateGeometry({
        preStyles: { height: "90px", boxSizing: "content-box", border: "4px solid" },
        expanded: false,
        lines: 20,
      });
    });
    await page.waitForTimeout(50);
    const folded = await sample();
    assert.equal(folded.layoutHeight, 64);
    await page.evaluate(() => window.updateGeometry({ expanded: true, clock: 0 }));
    await page.waitForTimeout(30);
    const full = await sample();
    assert.equal(full.layoutHeight, 128);
    assert.equal(full.effects, 0);
    await page.evaluate(() => window.updateGeometry({ expanded: false, clock: 3 }));
    await page.waitForTimeout(35);
    const moving = await sample();
    assert(moving.layoutHeight >= 64 && moving.layoutHeight <= 128);
    assert.equal(moving.effects, 1);
    await page.evaluate(() => {
      const n = document.querySelector("[data-slot=code-block-viewport]");
      n.style.padding = "";
      n.style.border = "";
      n.style.boxSizing = "";
      window.updateGeometry({ preStyles: undefined });
    });
    await page.waitForTimeout(40);
    return { folded, full, moving };
  });
  await check("immediate commit and first-paint policy", async () => {
    const samples = await page.evaluate(() => ({ commits: window.geometryCommits, paints: window.geometryPaints }));
    for (const phase of [samples.commits, samples.paints])
      for (const s of phase.filter((s) => s.mounted && !s.preStyles && (s.mode !== "full" || s.clock === 0))) {
        assert.equal(s.height, s.expanded ? s.full : 50);
        assert.equal(s.effects, 0);
      }
    return samples;
  });
  await check("fractional CSS pixels retain geometry and strict native bounds", async () => {
    const bounds = await page.evaluate(() => {
      const values = [];
      for (const height of ["50.499px", "90.499px"]) {
        const n = document.createElement("div");
        n.style.cssText = `position:fixed;visibility:hidden;overflow:hidden;width:0;height:${height};padding:0;border:0;box-sizing:border-box`;
        document.body.append(n);
        values.push({ css: Number.parseFloat(getComputedStyle(n).height), offset: n.offsetHeight });
        n.remove();
      }
      window.updateGeometry({
        popup: false,
        mounted: true,
        mode: "full",
        clock: 0,
        expanded: false,
        lines: 20,
        preStyles: { padding: "10.499px", height: "90.499px", boxSizing: "border-box", border: "0px" },
      });
      return values;
    });
    await page.waitForTimeout(40);
    const folded = await page
      .locator("[data-slot=code-block-viewport]")
      .evaluate((n) => ({ css: Number.parseFloat(getComputedStyle(n).height), effects: n.getAnimations().length }));
    assert.equal(folded.css, bounds[0].css);
    assert.equal(folded.effects, 0);
    await page.evaluate(() => window.updateGeometry({ expanded: true }));
    await page.waitForTimeout(30);
    assert.equal(
      await page
        .locator("[data-slot=code-block-viewport]")
        .evaluate((n) => Number.parseFloat(getComputedStyle(n).height)),
      bounds[1].css,
    );
    await page.evaluate(() => window.updateGeometry({ expanded: false, clock: 1 }));
    await page.waitForTimeout(25);
    assert.equal(await page.locator("[data-slot=code-block-viewport]").evaluate((n) => n.getAnimations().length), 1);
    const frames = await page.evaluate(
      () =>
        new Promise((resolve) => {
          const frames = [];
          function tick() {
            const n = document.querySelector("[data-slot=code-block-viewport]"),
              effect = n.getAnimations()[0];
            frames.push({
              used: Number.parseFloat(getComputedStyle(n).height),
              written: effect?.effect.getKeyframes()[0].height,
            });
            if (frames.length < 12) requestAnimationFrame(tick);
            else resolve(frames);
          }
          requestAnimationFrame(tick);
        }),
    );
    for (const frame of frames) {
      assert(frame.used >= bounds[0].css && frame.used <= bounds[1].css);
      if (frame.written) {
        const raw = Number.parseFloat(frame.written);
        assert(raw >= 50.499 && raw <= bounds[1].css);
      }
    }
    await page.waitForFunction(
      () => document.querySelector("[data-slot=code-block-viewport]").getAnimations().length === 0,
    );
    assert.equal(
      await page
        .locator("[data-slot=code-block-viewport]")
        .evaluate((n) => Number.parseFloat(getComputedStyle(n).height)),
      bounds[0].css,
    );
    assert.equal(await page.locator("[data-cadence-geometry-probe]").count(), 0);
    const policy = await page.evaluate(() =>
      [...(window.geometryCommits ?? []), ...(window.geometryPaints ?? [])].filter(
        (s) => s.clock === 0 && s.preStyles?.padding === "10.499px",
      ),
    );
    for (const state of policy) {
      assert.equal(state.height, bounds[state.expanded ? 1 : 0].offset);
      assert.equal(state.effects, 0);
    }
    await page.evaluate(() => window.updateGeometry({ preStyles: undefined, clock: 3 }));
    return { bounds, folded, frames, policy };
  });
  await check("opaque child rerender cannot turn passive font reflow into a semantic resize", async () => {
    await page.evaluate(() =>
      window.updateGeometry({
        popup: false,
        mounted: true,
        rich: true,
        expanded: true,
        clock: 0,
        mode: "full",
        preStyles: undefined,
        lines: 20,
      }),
    );
    await page.waitForTimeout(40);
    await page.evaluate(() => window.updateGeometry({ clock: 3 }));
    await page.waitForTimeout(25);
    await page.evaluate(() => {
      document.querySelector("pre").style.lineHeight = "30px";
      window.updateGeometry({ unrelated: 1 });
    });
    await page.waitForTimeout(30);
    const s = await page.locator("[data-slot=code-block-viewport]").evaluate((n) => ({
      height: n.offsetHeight,
      natural: document.querySelector("pre").offsetHeight,
      effects: n.getAnimations().length,
    }));
    assert.equal(s.effects, 0);
    assert.equal(s.height, s.natural);
    await page.evaluate(() => {
      document.querySelector("pre").style.lineHeight = "20px";
      window.updateGeometry({ rich: false, expanded: false, clock: 0 });
    });
    await page.waitForTimeout(30);
    return s;
  });
  await page.screenshot({ path: path.join(output, "geometry.png"), fullPage: true });
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  report.verdict = report.failures.length || report.errors.length ? "failed" : "passed";
  await writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2));
}
console.log(
  JSON.stringify({
    output,
    verdict: report.verdict,
    cases: report.cases.length,
    failures: report.failures,
    errors: report.errors,
  }),
);
if (report.verdict !== "passed") process.exitCode = 1;
