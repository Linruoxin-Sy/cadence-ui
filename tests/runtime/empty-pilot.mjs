import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import tailwind from "@tailwindcss/postcss";
import postcss from "postcss";
import { installationPlan } from "../../scripts/installation.mjs";

assert(process.env.EMPTY_OUTPUT);
const output = path.resolve(process.env.EMPTY_OUTPUT);
await mkdir(output, { recursive: false });
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const require = createRequire(import.meta.url);
const vite = require.resolve("vite", { paths: [require.resolve("vitest/node")] });
const { build } = await import(pathToFileURL(require.resolve("esbuild", { paths: [vite] })));
let copy;
const report = { cases: [], errors: [], screenshots: [], inputs: {}, installation: null };
if (process.env.EMPTY_INSTALL) {
  const items = new Map(),
    queue = ["empty", "card"];
  while (queue.length) {
    const id = queue.shift();
    if (items.has(id)) continue;
    const bytes = await readFile(`public/r/${id}.json`),
      item = JSON.parse(bytes);
    items.set(id, item);
    report.inputs[`public/r/${id}.json`] = hash(bytes);
    for (const dep of item.registryDependencies ?? []) {
      assert(dep.startsWith("@cadence/"));
      queue.push(dep.slice(9));
    }
  }
  const group = installationPlan([...items.values()], "empty"),
    button = installationPlan([...items.values()], "card");
  const files = new Map([...group.files, ...button.files].map((file) => [file.target, file]));
  copy = path.join(output, "installed/components/cadence");
  for (const file of files.values()) {
    assert(file.target.startsWith("@components/cadence/") && !file.target.includes(".."));
    const target = path.resolve(copy, file.target.slice(20));
    assert(target.startsWith(copy + path.sep));
    assert.equal(file.content, await readFile(file.path, "utf8"));
    assert(!/from\s+["']@\//.test(file.content));
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, file.content);
  }
  report.installation = {
    items: [...items.keys()],
    files: [...files.values()].map((file) => ({ target: file.target, sha: hash(file.content) })),
  };
  const consumer = path.join(output, "consumer.tsx");
  await writeFile(
    consumer,
    'import {Empty,EmptyTitle,EmptyDescription,EmptyContent,type EmptyProps} from "./installed/components/cadence/empty";const props:EmptyProps={ref:node=>{if(node)return()=>{};}};export const example=<Empty {...props}><EmptyTitle>Current</EmptyTitle><EmptyDescription>{19}</EmptyDescription><EmptyContent><button type="button">Retry</button></EmptyContent></Empty>',
  );
  execFileSync(
    process.execPath,
    [
      require.resolve("typescript/bin/tsc"),
      "--noEmit",
      "--skipLibCheck",
      "--strict",
      "--jsx",
      "react-jsx",
      "--target",
      "ES2022",
      "--module",
      "ESNext",
      "--moduleResolution",
      "bundler",
      "--lib",
      "ES2022,DOM,DOM.Iterable",
      consumer,
    ],
    { windowsHide: true, stdio: "pipe" },
  );
  report.installation.typecheck = true;
}
const plugins = copy
  ? [
      {
        name: "copied-only",
        setup(builder) {
          builder.onResolve({ filter: /registry[\\/]cadence[\\/]/ }, (args) => {
            const target = path.resolve(copy, args.path.replaceAll("\\", "/").split("registry/cadence/")[1]);
            const file = [`${target}.tsx`, `${target}.ts`, path.join(target, "index.tsx")].find(existsSync);
            assert(file, "no workspace source fallback");
            return { path: file };
          });
        },
      },
    ]
  : [];
const client = await build({
  entryPoints: ["tests/runtime/empty-pilot.jsx"],
  plugins,
  bundle: true,
  write: false,
  metafile: true,
  jsx: "automatic",
  format: "iife",
  define: { "process.env.NODE_ENV": '"production"' },
});
const ssr = await build({
  entryPoints: ["tests/runtime/empty-pilot-ssr.jsx"],
  plugins,
  bundle: true,
  write: false,
  metafile: true,
  jsx: "automatic",
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
for (const file of [
  ...Object.keys(client.metafile.inputs),
  "registry.json",
  "docs/motion/components/empty.md",
  "content/components/empty.mdx",
  "tests/runtime/empty-pilot.mjs",
  "app/globals.css",
  "upstream/manifest.json",
])
  report.inputs[file] = hash(await readFile(file));
report.clientGzip = gzipSync(js).length;
const server = http.createServer((req, res) => {
  const mode = new URL(req.url, "http://localhost").searchParams.get("mode") ?? "full";
  if (req.url === "/late.svg") {
    const timer = setTimeout(() => {
      res.setHeader("content-type", "image/svg+xml");
      res.end(
        '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="red"/></svg>',
      );
    }, 400);
    res.on("close", () => clearTimeout(timer));
    return;
  }
  res.setHeader("content-type", req.url === "/bundle.js" ? "text/javascript" : "text/html");
  res.end(
    req.url === "/bundle.js"
      ? js
      : `<!doctype html><html lang="en"><title>Empty runtime</title><style>${css}</style><div id="root">${render(mode)}</div><aside id="portal" aria-label="Portal example"></aside><script>window.emptySSRHost=document.querySelector('#message');window.emptySSRText=document.querySelector('#title [data-slot="empty-text"]').firstChild;window.emptyInitialMode=${JSON.stringify(mode)}</script><script src="/bundle.js"></script>`,
  );
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true });
const update = (page, patch) => page.evaluate((patch) => window.emptyUpdate(patch), patch);
const observe = (page) =>
  page.evaluate(() => {
    const root = document.getElementById("message"),
      media = document.getElementById("media");
    const anchors = [...document.querySelectorAll("[data-cadence-layout-anchor]")];
    const allLayers = [...document.querySelectorAll("[data-cadence-text-layer],[data-cadence-number-layer]")];
    const layers = allLayers.filter((layer) =>
      anchors.some(
        (host) =>
          host.closest("#message,#quantity,#identifier") &&
          layer.style.left.includes(`--cadence-display-${host.getAttribute("data-cadence-layout-anchor")} `),
      ),
    );
    const displays = layers.map((layer) => {
      const native = anchors.find((host) =>
        layer.style.left.includes(`--cadence-display-${host.getAttribute("data-cadence-layout-anchor")} `),
      );
      const canvases = [...layer.querySelectorAll("canvas")].map((canvas) => {
        const bytes = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
        let alpha = 0,
          signature = 0;
        for (let i = 0; i < bytes.length; i++) {
          signature = (signature * 31 + bytes[i]) >>> 0;
          if (i % 4 === 3) alpha += bytes[i];
        }
        return {
          alpha,
          signature,
          opacity: +getComputedStyle(canvas).opacity,
          transform: getComputedStyle(canvas).transform,
        };
      });
      return {
        host: native?.parentElement?.id,
        kind: layer.hasAttribute("data-cadence-text-layer") ? "text" : "number",
        opacity: getComputedStyle(layer).opacity,
        canvases,
        phases: [...layer.querySelectorAll("[data-cadence-reel]")].map((reel) => +reel.dataset.phase),
      };
    });
    const paint = Object.fromEntries(
      ["message", "media", "title", "description", "content"].map((id) => {
        const node = document.getElementById(id),
          css = node && getComputedStyle(node);
        return [id, css && { color: css.color, bg: css.backgroundColor, opacity: +css.opacity }];
      }),
    );
    return {
      height: root?.getBoundingClientRect().height,
      styleHeight: root?.style.height,
      paint,
      displays,
      nestedDisplays: allLayers.flatMap((layer) => {
        const host = anchors.find(
          (host) =>
            host.closest("#nested") &&
            layer.style.left.includes(`--cadence-display-${host.getAttribute("data-cadence-layout-anchor")} `),
        );
        return host
          ? [
              {
                host: host.parentElement.id,
                canvases: [...layer.querySelectorAll("canvas")].map((canvas) => ({
                  ink: canvas
                    .getContext("2d")
                    .getImageData(0, 0, canvas.width, canvas.height)
                    .data.some((value, index) => index % 4 === 3 && value > 0),
                  opacity: +getComputedStyle(canvas).opacity,
                })),
              },
            ]
          : [];
      }),
      title: document.getElementById("title")?.textContent,
      description: document.getElementById("description")?.textContent,
      content: document.getElementById("content")?.textContent,
      quantities: ["number-title", "number-description", "number-content"].map(
        (id) => document.getElementById(id)?.textContent,
      ),
      identity: root === window.emptySSRHost,
      textIdentity:
        document.querySelector('#title [data-slot="empty-text"],#title [data-slot="empty-number"]')?.firstChild ===
        window.emptySSRText,
      mediaOpacity: media && +getComputedStyle(media).opacity,
      rootOpacity: root && +getComputedStyle(root).opacity,
      active: document
        .getAnimations()
        .filter(
          (a) =>
            a.playState === "running" &&
            (a.effect.target?.closest?.("#message,#quantity,#identifier") ||
              layers.some((layer) => layer.contains(a.effect.target))),
        )
        .map((a) => ({ id: a.effect.target?.id, frames: a.effect.getKeyframes() })),
      nestedHeight: document.getElementById("nested")?.style.height,
      outerHeight: document.getElementById("outer")?.getBoundingClientRect().height,
      bounds:
        root &&
        Math.max(...[...root.children].map((n) => n.getBoundingClientRect().bottom)) <=
          root.getBoundingClientRect().bottom + 1,
      focused: document.activeElement?.id,
    };
  });
const frames = async (page, count = 12) => {
  const rows = [];
  for (let i = 0; i < count; i++) {
    await page.evaluate(() => new Promise(requestAnimationFrame));
    rows.push(await observe(page));
  }
  return rows;
};
const settles = async (page) => {
  await page.waitForFunction(
    () =>
      !document.querySelector("[data-cadence-text-layer],[data-cadence-number-layer]") &&
      !document
        .getAnimations()
        .some((a) => a.playState === "running" || a.effect.getKeyframes().some((frame) => "height" in frame)),
  );
};
try {
  for (const os of ["no-preference", "reduce"])
    for (const mode of ["full", "reduced", "none"]) {
      const context = await browser.newContext({ reducedMotion: os, viewport: { width: 1280, height: 1100 } }),
        page = await context.newPage();
      const record = { os, mode };
      report.cases.push(record);
      page.on("pageerror", (e) => report.errors.push(e.stack));
      page.on("console", (m) => {
        if (m.type() === "error") report.errors.push(m.text());
      });
      await page.goto(`${base}?mode=${mode}`);
      await page.waitForFunction(() => window.emptyReady && document.getElementById("portal-empty"));
      const effective = mode === "none" ? "none" : os === "reduce" ? "reduced" : mode;
      await page.waitForFunction((m) => document.getElementById("message").dataset.motion === m, effective);
      record.initial = await observe(page);
      assert(record.initial.identity && record.initial.textIdentity && record.initial.height > 0);
      assert.equal(record.initial.displays.length, 0);
      assert.equal(record.initial.active.length, 0);
      await page.evaluate(() => {
        window.emptyQuantityTexts = ["number-title", "number-description", "number-content"].map(
          (id) => document.querySelector(`#${id} [data-slot="empty-number"]`).firstChild,
        );
        window.emptyRecovery = document.getElementById("recover");
      });
      await update(page, {
        title: "Nothing ready",
        description: "Review ready",
        content: "Collection ready",
        count: 20,
        pad: 90,
        media: "folder",
      });
      record.change = await frames(page);
      assert(
        record.change.every(
          (row) =>
            row.title === "Nothing ready" &&
            row.description === "Review ready" &&
            row.content === "Collection ready" &&
            row.quantities.every((n) => n === "20") &&
            row.identity &&
            row.textIdentity &&
            row.bounds,
        ),
      );
      if (effective !== "none") {
        for (const host of ["title", "description", "content"])
          assert(
            record.change.some((row) =>
              row.displays.some(
                (d) =>
                  d.host === host &&
                  d.kind === "text" &&
                  d.canvases.some((c) => c.alpha > 0 && c.opacity > 0 && c.opacity < 1),
              ),
            ),
            `actual changed ink on ${host}`,
          );
        assert(
          record.change.some((row) => row.mediaOpacity > 0 && row.mediaOpacity < 1),
          "current media has intermediate opacity",
        );
      } else assert(record.change.every((row) => row.displays.length === 0 && row.active.length === 0));
      if (effective === "full") {
        for (const host of ["number-title", "number-description", "number-content"]) {
          const digits = record.change.flatMap((row) =>
            row.displays.filter((d) => d.host === host && d.kind === "number"),
          );
          assert(
            digits.some((d) => d.canvases.some((c) => c.alpha > 0)),
            `actual number ink on ${host}`,
          );
          assert(new Set(digits.flatMap((d) => d.phases)).size > 1, `moving number pixels on ${host}`);
          assert(
            new Set(digits.map((d) => d.canvases.map((canvas) => canvas.transform).join("|"))).size > 1,
            `computed moving ink on ${host}`,
          );
        }
        assert(
          new Set(record.change.map((row) => row.height)).size > 2,
          "measured root height has intermediate values",
        );
      } else assert(record.change.every((row) => row.displays.every((d) => d.kind !== "number")));
      await settles(page);
      record.settled = await observe(page);
      assert.equal(record.settled.styleHeight, "");
      assert(
        await page.evaluate(
          () =>
            window.emptyQuantityTexts.every(
              (text, index) =>
                document.querySelector(
                  `#${["number-title", "number-description", "number-content"][index]} [data-slot="empty-number"]`,
                ).firstChild === text,
            ) && document.getElementById("recover") === window.emptyRecovery,
        ),
      );
      await update(page, { media: "only-art", mediaVariant: "default" });
      record.mediaOnly = await frames(page, 5);
      assert(
        record.mediaOnly.every(
          (row) => row.rootOpacity === 1 && row.title === "Nothing ready" && row.displays.length === 0,
        ),
      );
      if (effective !== "none") assert(record.mediaOnly.some((row) => row.mediaOpacity > 0 && row.mediaOpacity < 1));
      await settles(page);
      await update(page, { later: true });
      record.entrance = await page.locator("#later").evaluate(async (node) => {
        const values = [];
        for (let i = 0; i < 5; i++) {
          await new Promise(requestAnimationFrame);
          values.push(+getComputedStyle(node).opacity);
        }
        return values;
      });
      if (effective !== "none") assert(record.entrance.some((value) => value > 0 && value < 1));
      else assert(record.entrance.every((value) => value === 1));
      await update(page, { later: false });
      await settles(page);
      // A native opacity engine takes over the same actual media host mid-flight.
      await update(page, { media: "native-takeover" });
      await frames(page, 2);
      record.nativeMedia = await page.locator("#media").evaluate(async (node) => {
        const previous = node
          .getAnimations()
          .filter((a) => a.effect.getKeyframes().some((frame) => "opacity" in frame));
        const native = node.animate([{ opacity: 0.4 }, { opacity: 0.6 }], { duration: 1000, fill: "both" });
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const result = {
          cancelled: previous.every((a) => a.playState === "idle"),
          native: native.playState,
          opacity: +getComputedStyle(node).opacity,
        };
        native.cancel();
        return result;
      });
      assert(
        record.nativeMedia.cancelled &&
          record.nativeMedia.native === "running" &&
          record.nativeMedia.opacity > 0 &&
          record.nativeMedia.opacity < 1,
      );
      // Exact display owners change together with root and media palette owners.
      await update(page, { tone: true });
      record.colors = await frames(page, 8);
      await settles(page);
      record.colorTarget = await observe(page);
      if (effective !== "none")
        for (const id of ["message", "media", "title", "description", "content"])
          assert(
            record.colors.some(
              (row) =>
                row.paint[id].color !== record.settled.paint[id].color &&
                row.paint[id].color !== record.colorTarget.paint[id].color,
            ),
            `intermediate foreground ${id}`,
          );
      // Original concurrent copy/foreground cause: the known colour writer keeps
      // its middle paint; the shared stable-ink policy settles readout rasters.
      await update(page, {
        tone: false,
        title: "Concurrent newest",
        description: "Concurrent review",
        content: "Concurrent collection",
        count: 21,
        media: "concurrent",
        pad: 95,
      });
      record.concurrent = await frames(page, 8);
      assert(
        record.concurrent.every(
          (row) =>
            row.title === "Concurrent newest" &&
            row.description === "Concurrent review" &&
            row.content === "Concurrent collection" &&
            row.quantities.every((value) => value === "21") &&
            row.textIdentity &&
            row.displays.every((display) => !["title", "description", "content"].includes(display.host)),
        ),
      );
      if (effective !== "none")
        for (const id of ["message", "title", "description", "content"])
          assert(
            new Set(record.concurrent.map((row) => row.paint[id].color)).size > 1,
            `known concurrent state.color on ${id}`,
          );
      await update(page, { mode: "none" });
      record.concurrentNone = await frames(page, 2);
      assert(
        record.concurrentNone.every(
          (row) =>
            row.displays.length === 0 && row.active.length === 0 && row.mediaOpacity === 1 && row.styleHeight === "",
        ),
      );
      await update(page, { mode, clock: 4 });
      await settles(page);
      await update(page, { title: 19, description: 19, content: 19, tone: false });
      await settles(page);
      await update(page, { title: 20, description: 20, content: 20, tone: true });
      record.concurrentNumbers = await frames(page, 8);
      assert(
        record.concurrentNumbers.every(
          (row) =>
            row.title === "20" &&
            row.description === "20" &&
            row.content === "20" &&
            row.textIdentity &&
            row.displays.every((display) => !["title", "description", "content"].includes(display.host)),
        ),
      );
      if (effective !== "none")
        for (const id of ["message", "title", "description", "content"])
          assert(
            new Set(record.concurrentNumbers.map((row) => row.paint[id].color)).size > 1,
            `known concurrent numeric state.color on ${id}`,
          );
      await update(page, { clock: 0 });
      const numericEnd = await frames(page, 2);
      assert(numericEnd.every((row) => row.active.length === 0 && row.displays.length === 0));
      await update(page, { clock: 4 });
      await settles(page);
      if (effective !== "none")
        for (const id of ["message", "media"])
          assert(
            record.colors.some(
              (row) =>
                row.paint[id].bg !== record.settled.paint[id].bg &&
                row.paint[id].bg !== record.colorTarget.paint[id].bg,
            ),
            `intermediate surface ${id}`,
          );
      // Each live same-target restriction must terminate already-visible work.
      record.cancellations = [];
      for (const restriction of [{ mode: "none" }, { clock: 0 }, { mode: "reduced" }]) {
        await update(page, {
          mode,
          clock: 4,
          title: "Nothing pending",
          description: "Review pending",
          content: "Collection pending",
          count: 19,
          pad: 48,
          media: "inbox",
          tone: false,
        });
        await settles(page);
        await update(page, {
          title: "Nothing newest",
          description: "Review newest",
          content: "Collection newest",
          count: 29,
          pad: 100,
          media: "latest",
        });
        const before = await frames(page, 2);
        if (effective === "full") {
          for (const host of [
            "title",
            "description",
            "content",
            "number-title",
            "number-description",
            "number-content",
          ])
            assert(
              before.some((row) =>
                row.displays.some(
                  (display) => display.host === host && display.canvases.some((canvas) => canvas.alpha > 0),
                ),
              ),
              `live ${host} before restriction`,
            );
          assert(before.some((row) => row.mediaOpacity > 0 && row.mediaOpacity < 1));
        }
        await update(page, restriction);
        const immediate = await frames(page, 2);
        if (restriction.mode === "reduced")
          assert(
            immediate.every(
              (row) => row.styleHeight === "" && row.displays.every((display) => display.kind !== "number"),
            ),
          );
        else
          assert(
            immediate.every(
              (row) =>
                row.styleHeight === "" &&
                row.displays.length === 0 &&
                row.active.length === 0 &&
                row.mediaOpacity === 1,
            ),
            "same-target restriction cancels before natural completion",
          );
        await settles(page);
        const end = await observe(page);
        record.cancellations.push({ restriction, before, immediate, end });
        assert.equal(end.title, "Nothing newest");
        assert.equal(end.mediaOpacity, 1);
        assert.equal(end.styleHeight, "");
        assert.equal(end.displays.length, 0);
      }
      await update(page, { mode, clock: 4 });
      // Keyboard and editing: same original controls, value/ref identity and native form data.
      await page.locator("#memo").fill("user draft");
      await page.locator("#recover").focus();
      await page.keyboard.press("Enter");
      assert.equal(await page.locator("#recover").textContent(), "Recover 1");
      await update(page, {
        title: "Localized résumé",
        description: "保存した項目はありません",
        content: "Recover now",
        pad: 80,
      });
      assert.equal(await page.locator("#memo").inputValue(), "user draft");
      assert.equal(await page.evaluate(() => new FormData(document.getElementById("form")).get("memo")), "user draft");
      assert.equal(await page.evaluate(() => document.activeElement.id), "recover");
      await page.locator("#outside").focus();
      await settles(page);
      await update(page, { edit: true });
      await page.evaluate(() => {
        const text = document.querySelector('#title [data-slot="empty-text"]').firstChild;
        text.replaceData(0, text.length, "Native buffer");
        document.getSelection().setBaseAndExtent(text, 3, text, 3);
        window.emptyNativeText = text;
      });
      await update(page, { title: 20 });
      await update(page, { title: "ID_042" });
      assert.equal(await page.locator("#title").textContent(), "Native buffer");
      assert(await page.evaluate(() => document.getSelection().anchorNode === window.emptyNativeText));
      await page.evaluate(() => document.getSelection().removeAllRanges());
      await update(page, { edit: false, title: "Final copy" });
      await settles(page);
      // Responsive/passive child size is native, not a semantic height flight.
      await page.evaluate(() => window.emptyPassive());
      await frames(page, 3);
      assert.equal((await observe(page)).styleHeight, "");
      await page.setViewportSize({ width: 390, height: 1000 });
      await frames(page, 3);
      assert.equal((await observe(page)).styleHeight, "");
      await page.setViewportSize({ width: 1280, height: 1100 });
      for (const boundary of [{ fixed: true }, { ratio: true }, { transform: true }, { features: true }]) {
        await update(page, { ...boundary, title: "Pending fallback", count: 31 });
        await settles(page);
        assert.equal((await observe(page)).displays.length, 0);
        await update(page, { fixed: false, ratio: false, transform: false, features: false });
        await settles(page);
      }
      // Shared parent size and nested provider modes: there is no duplicate child height writer.
      await page.setViewportSize({ width: 1280, height: 3000 });
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await page.waitForTimeout(200);
      record.nested = [];
      for (const outer of ["none", "full"]) {
        await update(page, { outer, child: "full", title: "Nothing pending", description: "Review pending", pad: 48 });
        await settles(page);
        await update(page, { title: "Nothing ready", description: "Review ready", pad: 90 });
        const rows = await frames(page, 8);
        const geometry = await page.locator("#outer").evaluate(async (node) => {
          const values = [];
          for (let i = 0; i < 65; i++) {
            await new Promise(requestAnimationFrame);
            values.push(node.getBoundingClientRect().height);
          }
          return values;
        });
        record.nested.push({ outer, rows, geometry });
        for (const host of ["nested-title", "nested-description"])
          if (os !== "reduce")
            assert(
              rows.some((row) =>
                row.nestedDisplays.some(
                  (display) =>
                    display.host === host &&
                    display.canvases.some((canvas) => canvas.ink && canvas.opacity > 0 && canvas.opacity < 1),
                ),
              ),
              `actual nested ${outer}/${host}`,
            );
        assert(rows.every((row) => row.nestedHeight === ""));
        if (outer === "full" && os !== "reduce")
          assert(
            new Set([...rows.map((row) => row.outerHeight), ...geometry]).size > 2,
            "caller region owns actual middle height",
          );
        await settles(page);
      }
      await update(page, { outer: "full", child: "none", pad: 110 });
      record.parent = await frames(page, 5);
      assert(record.parent.every((row) => row.nestedHeight === ""));
      await update(page, { outer: "none", child: "full", pad: 48 });
      await frames(page, 3);
      assert.equal((await observe(page)).nestedHeight, "");
      assert.equal(
        await page.locator("#portal-empty").getAttribute("data-motion"),
        os === "reduce" ? "reduced" : "full",
      );
      // Retention reverses in the same host; outgoing recovery is immediately inert.
      await update(page, { mode, clock: 4, show: false });
      assert.equal(await page.locator("#populated").textContent(), "Current populated results");
      if (effective !== "none") {
        assert((await page.locator("#message").getAttribute("inert")) !== null);
        assert.equal(await page.locator("#message").getAttribute("aria-hidden"), "true");
        await update(page, { show: true, title: "Restored empty", media: "restored" });
        assert((await observe(page)).identity);
      } else {
        await page.waitForFunction(() => !document.getElementById("message"));
        await update(page, { show: true });
      }
      await settles(page);
      await update(page, { media: "late" });
      await update(page, { show: false });
      await page.waitForFunction(() => !document.getElementById("message"));
      await page.waitForTimeout(450);
      assert.equal(await page.locator("#message").count(), 0);
      assert.equal(await page.locator("#populated").count(), 1);
      assert.equal(await page.locator("[data-cadence-text-layer],[data-cadence-number-layer]").count(), 0);
      await update(page, { show: true, media: "inbox", title: "Current empty", rich: true });
      await settles(page);
      assert.equal(await page.locator("#rich-description a").getAttribute("href"), "#destination");
      const axe = await new AxeBuilder({ page }).analyze();
      assert.deepEqual(axe.violations, []);
      record.axe = 0;
      await page.evaluate(() => window.emptyUnmount());
      assert.equal(await page.locator("[data-cadence-text-layer],[data-cadence-number-layer]").count(), 0);
      assert.equal(
        await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length),
        0,
      );
      record.passed = true;
      await context.close();
    }
  for (const theme of ["light", "dark"])
    for (const width of [390, 1280]) {
      const page = await browser.newPage({ viewport: { width, height: 1100 }, colorScheme: theme });
      await page.goto(base);
      await page.waitForFunction(() => window.emptyReady);
      await page.evaluate((theme) => document.documentElement.classList.toggle("dark", theme === "dark"), theme);
      await settles(page);
      const file = `${theme}-${width}.png`;
      await page.screenshot({ path: path.join(output, file), fullPage: true });
      report.screenshots.push(file);
      await page.close();
    }
  const noJS = await browser.newPage({ javaScriptEnabled: false });
  await noJS.goto(base);
  assert(await noJS.locator("#message").isVisible());
  assert.equal(await noJS.locator("#title").textContent(), "Nothing pending");
  assert.equal(await noJS.locator("#number-content").textContent(), "19");
  assert.equal(await noJS.locator("#actions a").getAttribute("href"), "#destination");
  await noJS.close();
  report.noJS = true;
  assert.deepEqual(report.errors, []);
  report.passed = true;
} catch (error) {
  report.failure = error.stack;
  throw error;
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  report.closed = true;
  await writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2));
}
console.log(
  JSON.stringify({
    passed: report.passed,
    cases: report.cases.length,
    installed: report.installation?.files.length,
    noJS: report.noJS,
  }),
);
