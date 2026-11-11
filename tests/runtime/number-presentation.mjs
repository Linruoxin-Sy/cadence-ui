import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";
import { chromium } from "@playwright/test";

assert.ok(process.env.NUMBER_PRESENTATION_OUTPUT, "Use a fresh evidence directory");
const output = path.resolve(process.env.NUMBER_PRESENTATION_OUTPUT);
await mkdir(output, { recursive: false });
const require = createRequire(import.meta.url);
const vite = require.resolve("vite", { paths: [require.resolve("vitest/node")] });
const { build } = await import(pathToFileURL(require.resolve("esbuild", { paths: [vite] })));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const relocated = path.join(output, "relocated", "registry", "cadence", "lib");
await cp("registry/cadence/lib", relocated, { recursive: true, errorOnExist: true });
// Preserve the consumer's ESM package boundary as well as source bytes.
await writeFile(path.join(output, "relocated", "package.json"), JSON.stringify({ private: true, type: "module" }));
const relocatedEntry = path.join(output, "relocated", "tests", "runtime", "number-presentation.jsx");
await mkdir(path.dirname(relocatedEntry), { recursive: true });
await cp("tests/runtime/number-presentation.jsx", relocatedEntry, { errorOnExist: true });
const report = {
  inputs: {},
  profiles: [],
  failures: [],
  errors: [],
  resourcesClosed: false,
  scope: "Internal numeric DOM/reel pilot and raw relocation; NOT public registry installation or catalogue migration",
};
let server, browser;
try {
  const ssr = await build({
    entryPoints: ["tests/runtime/number-presentation-ssr.jsx"],
    bundle: true,
    packages: "external",
    platform: "node",
    format: "cjs",
    write: false,
    jsx: "automatic",
  });
  const ssrPath = path.join(output, "ssr.cjs");
  await writeFile(ssrPath, ssr.outputFiles[0].text);
  const markup = require(ssrPath).render();
  let client = "",
    strict = false;
  server = http.createServer((req, res) => {
    res.setHeader("Content-Type", req.url === "/client.js" ? "text/javascript" : "text/html");
    res.end(
      req.url === "/client.js"
        ? client
        : `<!doctype html><style>body{font:20px 'Courier New',monospace;margin:30px}button{font:inherit;color:inherit} @media(prefers-color-scheme:dark){body{background:#111;color:#eee}button{background:#222}}</style><div id="root">${markup}</div><div id="fixtures"></div><script>window.numberStrict=${strict}</script><script src="/client.js"></script>`,
    );
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true });
  report.browser = browser.version();
  const noJS = await browser.newContext({ javaScriptEnabled: false });
  const native = await noJS.newPage();
  await native.goto(url);
  assert.equal(await native.locator("#owned").textContent(), "12");
  assert.equal(await native.locator("#owned > *").count(), 0);
  report.noJS = { actualValue: "12", plainText: true, markupSHA: hash(markup) };
  await noJS.close();
  for (const name of process.env.NUMBER_PRESENTATION_PROFILES?.split(",") ?? [
    "source",
    "strict",
    "dark",
    "narrow",
    "relocated",
  ]) {
    strict = name === "strict";
    const bundle = await build({
      entryPoints: [name === "relocated" ? relocatedEntry : "tests/runtime/number-presentation.jsx"],
      bundle: true,
      write: false,
      metafile: true,
      tsconfig: path.resolve("tsconfig.json"),
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
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => report.errors.push({ profile: name, error: String(error) }));
    page.on("console", (message) => {
      if (message.type() === "error") report.errors.push({ profile: name, error: message.text() });
    });
    await page.goto(url);
    await page.waitForFunction(() => window.numberPolicy && window.numberUpdate);
    const result = await page.evaluate(async () => {
      const {
        createNumberPresentation: controller,
        commitNumberPresentations: group,
        createNumberSnapshot: snapshot,
        createMotionTransaction: transaction,
        createTextPresentation,
        createMeasuredGeometry,
        naturalGeometry,
        bindMotionParameters,
        numberRoll,
      } = window.numberTools;
      const cases = [],
        failures = [],
        observations = [];
      const check = (name, pass, actual) => {
        cases.push({ name, pass: Boolean(pass) });
        if (!pass) failures.push({ name, actual });
      };
      const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
      const frames = async (count = 2) => {
        for (let i = 0; i < count; i++) await frame();
      };
      const root = document.getElementById("fixtures");
      let fixtureId = 0;
      const layer = (host) =>
        [...document.querySelectorAll("[data-cadence-number-layer]")].find(
          (n) => n.dataset.cadenceNumberOwner === host.id,
        );
      const fixture = (value = 1, cm = window.numberPolicy, tx = transaction()) => {
        const host = document.createElement("span");
        host.id = `f${fixtureId++}`;
        host.textContent = String(value);
        const br = document.createElement("br");
        root.append(host, br);
        const c = controller(host, tx),
          entity = {},
          source = {};
        let accepted = value,
          display;
        const commit = (next, patch = {}) => {
          accepted = next;
          display = patch.display ?? display;
          const options = {
            snapshot: snapshot(next, display),
            revision: tx.revision("value", next, source),
            cm,
            entity,
            cause: "independent",
            ...patch,
          };
          c.commit(options);
          return options;
        };
        commit(value);
        return {
          host,
          c,
          commit,
          tx,
          dispose() {
            c.dispose();
            host.remove();
            br.remove();
          },
          options(next, patch = {}) {
            return {
              snapshot: snapshot(next),
              revision: tx.revision("value", next, source),
              cm,
              entity,
              cause: "independent",
              ...patch,
            };
          },
          accepted: () => accepted,
        };
      };
      for (const [property, initial, target] of [
        ["background-color", "white", "black"],
        ["border-top-color", "black", "white"],
        ["box-shadow", "0 0 0 1px black", "0 0 0 1px white"],
      ]) {
        root.style.setProperty(property, initial);
        const f = fixture(1),
          text = f.host.firstChild;
        f.commit(2);
        check(`real numeric paint before ${property}`, Boolean(layer(f.host)));
        root.style.transition = `${property} 1s`;
        getComputedStyle(root).getPropertyValue(property);
        root.style.setProperty(property, target);
        await frames(2);
        check(
          `real numeric ancestor ${property} clock`,
          root.getAnimations().some((a) => a.playState === "running" && a.transitionProperty === property),
        );
        check(
          `numeric ${property} still cancels current reels`,
          !layer(f.host) && f.host.firstChild === text && f.host.textContent === "2",
        );
        f.commit(3);
        check(
          `numeric ${property} still rejects new reels`,
          !layer(f.host) && f.host.firstChild === text && f.host.textContent === "3",
        );
        f.dispose();
        for (const animation of root.getAnimations()) animation.cancel();
        root.style.cssText = "";
        await frames(2);
      }
      await frames();
      const host = document.getElementById("owned"),
        text = host.firstChild;
      check(
        "SSR hydration exact native baseline",
        host.textContent === "12" && host.childNodes.length === 1 && !layer(host),
      );
      window.numberUpdate({ value: 13 });
      check("accepted target semantic immediately", host.textContent === "13" && host.firstChild === text);
      check(
        "only units roll; unchanged tens never masked",
        layer(host)?.querySelectorAll("[data-cadence-reel]").length === 1 &&
          [...CSS.highlights.values()].flatMap((h) => [...h].map((r) => r.toString())).join("") === "3",
      );
      check(
        "pixel cells have no second semantic text",
        layer(host)?.textContent === "" && layer(host).inert && layer(host).querySelectorAll("canvas").length === 2,
      );
      await frames(5);
      const reel = layer(host)?.querySelector("[data-cadence-reel]"),
        phase = Number(reel?.dataset.phase);
      check(
        "actual subpixel in-flight presentation",
        phase > 0 && phase < 1 && [...reel.querySelectorAll("canvas")].some((n) => /\./.test(n.style.transform)),
        phase,
      );
      const offsets = [...reel.querySelectorAll("canvas")].map((n) => n.style.transform);
      window.numberUpdate({ value: 12 });
      check(
        "reversal reuses actual two cells and current offsets",
        layer(host)?.querySelector("[data-cadence-reel]") === reel &&
          JSON.stringify([...reel.querySelectorAll("canvas")].map((n) => n.style.transform)) ===
            JSON.stringify(offsets),
        {
          retained: layer(host)?.querySelector("[data-cadence-reel]") === reel,
          offsets,
          after: [...reel.querySelectorAll("canvas")].map((n) => n.style.transform),
          debug: host.dataset.numberDebug,
        },
      );
      const atReverse = Number(reel.dataset.phase);
      await frames(2);
      check("reverse drops opposing velocity before next frame", Number(reel.dataset.phase) <= atReverse, {
        atReverse,
        next: Number(reel.dataset.phase),
      });
      observations.push({ atReverse, next: Number(reel.dataset.phase), offsets });
      const atEqual = Number(reel.dataset.phase);
      window.numberUpdate({ value: 12 });
      check(
        "equal accepted rerender retains flight",
        layer(host)?.querySelector("[data-cadence-reel]") === reel && Number(reel.dataset.phase) === atEqual,
      );
      window.numberUpdate({ timeScale: 1 });
      check(
        "live nonzero clock retimes from same offset",
        layer(host)?.querySelector("[data-cadence-reel]") === reel && Number(reel.dataset.phase) === atEqual,
      );
      window.numberUpdate({ value: 14 });
      check(
        "third digit interruption exact immediate bounded fallback",
        host.textContent === "14" && !layer(host) && CSS.highlights.size === 0,
      );
      for (const mode of ["reduced", "none"]) {
        window.numberUpdate({ mode: "none", value: 14 });
        window.numberUpdate({ mode: "full", value: 15, timeScale: 3 });
        check(`${mode} live precondition real reel`, Boolean(layer(host)));
        window.numberUpdate({ mode });
        check(
          `${mode} live cancellation before next paint`,
          !layer(host) && CSS.highlights.size === 0 && host.textContent === "15",
        );
        window.numberUpdate({ value: 16 });
        check(`${mode} update exact with no delay`, host.textContent === "16" && !layer(host));
        window.numberUpdate({ mode: "full" });
        check(`${mode} restore never replays`, !layer(host));
        window.numberUpdate({ value: 14 });
      }
      window.numberUpdate({ mode: "none", value: 14 });
      window.numberUpdate({ mode: "full" });
      window.numberUpdate({ value: 15, timeScale: 3 });
      check("zero clock precondition", Boolean(layer(host)));
      window.numberUpdate({ timeScale: 0 });
      check("zero clock retires current writer", !layer(host) && host.textContent === "15");
      window.numberUpdate({ timeScale: 3 });
      check("clock restoration no replay", !layer(host));
      window.numberUpdate({ value: 16 });
      await frame();
      window.numberUpdate({ mounted: false });
      check(
        "physical detach cancels overlays and masks",
        !document.querySelector("[data-cadence-number-layer]") && CSS.highlights.size === 0,
      );
      window.numberUpdate({ mounted: true, value: 19 });
      check(
        "reattach baseline exact",
        document.getElementById("owned").textContent === "19" && !document.querySelector("[data-cadence-number-layer]"),
      );
      for (const [a, b] of [
        [9, 10],
        [99, 100],
        [100, 99],
        [-12, -11],
        [-1, 0],
        [0, -1],
        [1.29, 1.3],
        [19n, 20n],
      ]) {
        const f = fixture(a);
        f.commit(b);
        const cells = layer(f.host)?.querySelectorAll("canvas").length;
        check(`real initial reel ${a}→${b}`, Boolean(cells) && cells <= 24 && f.host.textContent === String(b), cells);
        check(`place identities ${a}→${b}`, f.c.active().size <= 12 && f.host.childNodes.length === 1);
        f.dispose();
      }
      for (const direction of ["up", "down", "shortest"]) {
        const f = fixture(2);
        f.commit(7, { direction });
        const target = layer(f.host)?.querySelector('[data-cadence-number-cell="target"]');
        check(
          `explicit ${direction} two-cell direction`,
          target &&
            (direction === "down" ? target.style.transform.includes("-") : !target.style.transform.includes("-")),
          target?.style.transform,
        );
        f.dispose();
      }
      for (const cause of ["query", "filter", "direct-input", "reset", "restore", "unknown"]) {
        const f = fixture(1);
        f.commit(2, { cause });
        await frames();
        f.commit(3, { cause });
        check(`delayed accepted ${cause} remains immediate`, f.host.textContent === "3" && !layer(f.host));
        f.commit(4);
        check(`later independent after ${cause} eligible`, Boolean(layer(f.host)));
        f.dispose();
      }
      const equalFormat = { kind: "intl", formatter: new Intl.NumberFormat("en", { maximumFractionDigits: 0 }) };
      const fractional = fixture(12);
      fractional.host.style.fontSize = "24px";
      await frames();
      fractional.commit(13);
      fractional.commit(14);
      check(
        "unproven fractional native glyph origins stay exact",
        fractional.host.textContent === "14" && !layer(fractional.host),
      );
      fractional.dispose();
      const precise = fixture(90071992547409910n);
      precise.commit(90071992547409911n);
      check(
        "large BigInt never loses precision during native fallback",
        precise.host.textContent === "90071992547409911",
      );
      precise.dispose();
      const forced = fixture(2);
      forced.commit(3, { direction: "up" });
      await frames(2);
      forced.commit(2, { direction: "up" });
      check("forced direction cannot reverse a reused lane", forced.host.textContent === "2" && !layer(forced.host));
      forced.dispose();
      const domain = fixture(1);
      domain.commit(2);
      domain.commit(2n);
      check(
        "equal spelling across numeric domains retires old reel",
        domain.host.textContent === "2" && !layer(domain.host),
      );
      domain.dispose();
      const equal = fixture(1);
      equal.commit(1.1, { display: equalFormat });
      equal.commit(1.2, { display: equalFormat });
      check("unchanged formatted output no reel", equal.host.textContent === "1" && !layer(equal.host));
      equal.dispose();
      const format = fixture(1234);
      format.commit(1235, { display: { kind: "intl", formatter: new Intl.NumberFormat("en") } });
      check("formatter-only boundary no invented growth", format.host.textContent === "1,235" && !layer(format.host));
      format.dispose();
      for (const value of [NaN, Infinity, 1e21, 10n ** 2049n]) {
        const f = fixture();
        f.commit(value);
        check(
          `exact unsupported ${String(value).slice(0, 20)}`,
          f.host.textContent === String(value) && !layer(f.host),
        );
        f.dispose();
      }
      for (const locale of ["ar", "ar-u-nu-latn"]) {
        const f = fixture();
        f.host.dir = "rtl";
        const display = { kind: "intl", formatter: new Intl.NumberFormat(locale) };
        f.commit(12, { display });
        f.commit(13, { display });
        check(
          `unsupported bidi layout ${locale} exact`,
          f.host.textContent === display.formatter.format(13) && !layer(f.host),
        );
        f.dispose();
      }
      const entity = fixture(1);
      entity.commit(2);
      entity.commit(3, { entity: {} });
      check("cross-entity cancels and baselines", !layer(entity.host) && entity.host.textContent === "3");
      entity.commit(4, { entity: {} });
      check("unrelated records no inherited reel", !layer(entity.host));
      entity.dispose();
      const edit = fixture(123);
      const editNode = edit.host.firstChild;
      edit.host.parentElement.setAttribute("contenteditable", "plaintext-only");
      await frames();
      edit.commit(124);
      check(
        "inherited plaintext-only tree stays native",
        edit.host.firstChild === editNode && edit.host.childNodes.length === 1 && !layer(edit.host),
      );
      edit.host.parentElement.removeAttribute("contenteditable");
      await frames();
      edit.commit(125);
      check("leaving edit establishes baseline", !layer(edit.host));
      edit.commit(126);
      check("independent display after baseline may roll", Boolean(layer(edit.host)));
      edit.host.setAttribute("contenteditable", "true");
      await frames();
      check("entering editing cancels live reel", !layer(edit.host) && edit.host.firstChild === editNode);
      edit.dispose();
      const selected = fixture(123);
      selected.commit(124);
      const range = document.createRange();
      range.selectNodeContents(selected.host);
      document.getSelection().addRange(range);
      await frames();
      check(
        "native selection cancels decoration",
        !layer(selected.host) && document.getSelection().toString() === "124",
      );
      selected.commit(125);
      check("selection preserved across native commit", document.getSelection().toString() === "125");
      document.getSelection().removeAllRanges();
      selected.dispose();
      for (const action of ["hidden", "font", "scroll", "copy", "find", "pagehide"]) {
        const f = fixture();
        f.commit(2);
        check(`${action} precondition`, Boolean(layer(f.host)));
        if (action === "hidden") f.host.hidden = true;
        if (action === "font") f.host.style.fontSize = "25px";
        if (action === "scroll") document.dispatchEvent(new Event("scroll"));
        if (action === "copy") f.host.dispatchEvent(new Event("copy"));
        if (action === "find") document.dispatchEvent(new KeyboardEvent("keydown", { key: "f", ctrlKey: true }));
        if (action === "pagehide") window.dispatchEvent(new Event("pagehide"));
        await frames();
        check(`${action} cancels without stale paint`, !layer(f.host));
        if (action === "pagehide") window.dispatchEvent(new Event("pageshow"));
        f.dispose();
      }
      const tx = transaction(),
        members = Array.from({ length: 13 }, () => fixture(1, window.numberPolicy, tx));
      group(members.map((f) => ({ controller: f.c, options: f.options(2) })));
      check(
        "known 13-column revision preflight allocates nothing",
        members.every((f) => f.host.textContent === "2" && !layer(f.host)) &&
          tx.activeWork("numericColumns").size === 0,
      );
      members.forEach((f) => {
        f.dispose();
      });
      const atCap = transaction(),
        twelve = Array.from({ length: 12 }, () => fixture(1, window.numberPolicy, atCap));
      group(twelve.map((f) => ({ controller: f.c, options: f.options(2) })));
      check(
        "exact 12-column coordinated revision really animates",
        twelve.every((f) => Boolean(layer(f.host))) &&
          [...atCap.activeWork("numericColumns").values()].reduce((a, b) => a + b, 0) === 12,
      );
      const extra = fixture(1, window.numberPolicy, atCap);
      extra.commit(2);
      check(
        "still-active aggregate overflow cancels numeric family",
        !layer(extra.host) && twelve.every((f) => !layer(f.host)) && atCap.activeWork("numericColumns").size === 0,
      );
      extra.dispose();
      for (const f of twelve) f.dispose();
      const mixed = transaction(),
        number = fixture(1, window.numberPolicy, mixed),
        label = document.createElement("span");
      label.id = "mixed-text";
      label.textContent = "Save";
      root.append(label);
      const textController = createTextPresentation(label, mixed),
        entityId = {},
        revisionA = mixed.revision("content", "A");
      textController.commit({ value: "Save", revision: revisionA, cm: window.numberPolicy, entity: entityId });
      const revisionB = mixed.revision("content", "B");
      number.commit(2, { revision: revisionB });
      textController.commit({ value: "Saved", revision: revisionB, cm: window.numberPolicy, entity: entityId });
      check(
        "mixed trusted masks allow actual text and reel work",
        Boolean(layer(number.host)) && Boolean(document.querySelector('[data-cadence-text-owner="mixed-text"]')),
      );
      check(
        "mixed transaction exact numeric/text targets",
        number.host.textContent === "2" && label.textContent === "Saved",
      );
      check(
        "mixed revision finite caps",
        [...mixed.activeWork("numericColumns").values()].reduce((a, b) => a + b, 0) <= 12 &&
          [...mixed.activeWork("changedGraphemes").values()].reduce((a, b) => a + b, 0) <= 64,
      );
      mixed.cancel();
      check(
        "mixed cancel retires both families",
        !layer(number.host) && !document.querySelector('[data-cadence-text-owner="mixed-text"]'),
      );
      number.dispose();
      textController.dispose();
      label.remove();
      const geoTx = transaction(),
        readout = fixture(9, window.numberPolicy, geoTx),
        shell = document.createElement("div"),
        content = document.createElement("div");
      shell.style.cssText = "width:max-content;overflow:hidden";
      content.style.cssText = "width:100px;height:20px";
      shell.append(content);
      root.append(shell);
      const geometry = createMeasuredGeometry(geoTx);
      geometry.register({
        host: { current: shell, identity: {} },
        content,
        axes: ["width"],
        measure: () => ({
          width: { size: naturalGeometry(content).width, min: 0, max: 240, readable: true, independent: true },
        }),
      });
      const policy = {
        reduced: false,
        transition: window.numberPolicy.parameters(bindMotionParameters(numberRoll, "number.roll/reels")).transition,
      };
      geometry.commit(geoTx.revision("value", 9), policy);
      content.style.width = "200px";
      const revision = geoTx.revision("value", 10);
      readout.commit(10, { revision, externalGeometry: true });
      geometry.commit(revision, policy);
      check(
        "geometry/readout share exact committed target with safe immediate readout",
        readout.host.textContent === "10" && !layer(readout.host) && shell.getAnimations().length === 1,
      );
      await frames(3);
      const size = shell.getBoundingClientRect().width;
      check("one real bounded geometry writer", size >= 100 && size <= 200 && shell.getAnimations().length === 1, size);
      geometry.dispose();
      readout.dispose();
      shell.remove();
      check(
        "all native fixtures dispose owned resources",
        !document.querySelector("[data-cadence-number-layer]") && CSS.highlights.size === 0,
      );
      return { cases, failures, observations };
    });
    report.profiles.push({ name, sha256: hash(client), gzip: gzipSync(client).length, ...result });
    report.failures.push(...result.failures.map((f) => ({ profile: name, ...f })));
    await page.evaluate(() => {
      window.numberUpdate({ mode: "none", value: 22 });
      window.numberUpdate({ mode: "full", timeScale: 1000000 });
      const shell = document.createElement("div");
      shell.id = "raster-shell";
      shell.style.display = "inline-block";
      const host = document.createElement("span");
      host.id = "raster-number";
      host.textContent = "22";
      shell.append(host);
      document.body.append(shell);
      const tools = window.numberTools,
        tx = tools.createMotionTransaction(),
        c = tools.createNumberPresentation(host, tx);
      const commit = (value) =>
        c.commit({
          snapshot: tools.createNumberSnapshot(value),
          revision: tx.revision("value", value),
          cm: window.numberPolicy,
          entity: "raster",
          cause: "independent",
        });
      commit(22);
      commit(23);
      window.rasterController = c;
    });
    assert.equal(await page.locator('[data-cadence-number-owner="raster-number"] canvas').count(), 2);
    const painted = await page.locator("#raster-shell").screenshot({ animations: "allow" });
    await writeFile(path.join(output, `${name}-painted.png`), painted);
    await page.evaluate(() => {
      window.rasterController.cancel();
      document.getElementById("raster-number").firstChild.data = "22";
    });
    const nativePaint = await page.locator("#raster-shell").screenshot({ animations: "allow" });
    await writeFile(path.join(output, `${name}-native.png`), nativePaint);
    const pixels = await page.evaluate(
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
        let outsideSubpixelEnvelope = 0,
          differences = 0;
        for (let i = 0; i < x.data.length; i += 4) {
          if ([0, 1, 2, 3].every((o) => x.data[i + o] === y.data[i + o])) continue;
          differences++;
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
        return { sameDimensions: x.width === y.width && x.height === y.height, differences, outsideSubpixelEnvelope };
      },
      {
        a: `data:image/png;base64,${painted.toString("base64")}`,
        b: `data:image/png;base64,${nativePaint.toString("base64")}`,
      },
    );
    report.profiles.at(-1).pixelCorrespondence = { ...pixels, paintedSHA: hash(painted), nativeSHA: hash(nativePaint) };
    if (!pixels.sameDimensions || pixels.outsideSubpixelEnvelope)
      report.failures.push({
        profile: name,
        name: "actual reel pixels preserve native endpoint coverage",
        actual: pixels,
      });
    await page.evaluate(() => {
      window.rasterController.dispose();
      document.getElementById("raster-shell").remove();
      window.numberUpdate({ mode: "none", value: 22, timeScale: 3 });
      window.numberUpdate({ mode: "full" });
    });
    await page.evaluate(() => window.numberUpdate({ value: 23 }));
    await page.waitForFunction(
      () =>
        Number(document.querySelector('[data-cadence-number-owner="owned"] [data-cadence-reel]')?.dataset.phase) > 0.15,
    );
    await page.screenshot({ path: path.join(output, `${name}-midflight.png`) });
    await page.evaluate(() => {
      document.getSelection().removeAllRanges();
      window.numberUpdate({ value: 22 });
    });
    await page.screenshot({ path: path.join(output, `${name}-reverse.png`) });
    // Trusted copy/find and native editing commands use the actual browser, not synthetic input.
    await page.evaluate(() => {
      window.numberUpdate({ value: 22, cause: "independent", timeScale: 3 });
      document.getSelection().removeAllRanges();
    });
    await page.locator("#owned").selectText();
    await page.keyboard.press("Control+c");
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    if (copied !== "22")
      report.failures.push({ profile: name, name: "trusted clipboard exact current number", copied });
    await page.evaluate(() => {
      const n = document.createElement("div");
      n.id = "editor";
      n.contentEditable = "true";
      const host = document.createElement("span");
      host.id = "native-number-editor";
      host.textContent = "123";
      n.append(host);
      document.body.append(n);
      const tools = window.numberTools,
        tx = tools.createMotionTransaction();
      window.editController = tools.createNumberPresentation(host, tx);
      window.editController.commit({
        snapshot: tools.createNumberSnapshot(123),
        revision: tx.revision("value", 123),
        cm: window.numberPolicy,
        entity: "editor",
        cause: "independent",
      });
    });
    await page.locator("#editor").click();
    await page.keyboard.press("End");
    await page.keyboard.type("4");
    await page.keyboard.press("Control+z");
    const undo = await page.locator("#editor").textContent();
    if (undo !== "123") report.failures.push({ profile: name, name: "native editing undo", undo });
    await page.evaluate(() => {
      window.editController.dispose();
      document.getElementById("editor").remove();
    });
    await page.evaluate(() => {
      document.getSelection().removeAllRanges();
      window.numberUpdate({ mode: "none", value: 23 });
      window.numberUpdate({ mode: "full" });
      window.numberUpdate({ value: 24 });
    });
    const find = await page.evaluate(() => ({ current: window.find("24"), outgoing: window.find("23") }));
    report.profiles.at(-1).trustedNative = { clipboard: copied, undo, find };
    if (!find.current || find.outgoing)
      report.failures.push({ profile: name, name: "native find has one current numeric value", actual: find });
    await page.screenshot({ path: path.join(output, `${name}.png`) });
    await context.close();
  }
  for (const name of ["os-reduced", "dpr2"]) {
    const context = await browser.newContext({
      reducedMotion: name === "os-reduced" ? "reduce" : "no-preference",
      deviceScaleFactor: name === "dpr2" ? 2 : 1,
    });
    const page = await context.newPage();
    await page.goto(url);
    await page.waitForFunction(() => window.numberUpdate && window.numberPolicy);
    const result = await page.evaluate(() => {
      window.numberUpdate({ value: 13 });
      return {
        text: document.getElementById("owned").textContent,
        mode: document.getElementById("owned").dataset.motion,
        layers: document.querySelectorAll("[data-cadence-number-layer]").length,
        masks: CSS.highlights.size,
      };
    });
    report[name] = result;
    if (result.text !== "13" || result.layers || result.masks || (name === "os-reduced" && result.mode !== "reduced"))
      report.failures.push({ profile: name, name: "native immediate ceiling", actual: result });
    await context.close();
  }
  const source = report.profiles.find((p) => p.name === "source"),
    copy = report.profiles.find((p) => p.name === "relocated");
  if (source && copy) {
    report.rawRelocationBytesIdentical = source.sha256 === copy.sha256;
    assert.ok(report.rawRelocationBytesIdentical);
  }
  assert.equal(report.failures.length, 0, JSON.stringify(report.failures));
  assert.equal(report.errors.length, 0, JSON.stringify(report.errors));
} catch (error) {
  report.error = String(error);
  process.exitCode = 1;
} finally {
  await browser?.close();
  if (server) await new Promise((resolve) => server.close(resolve));
  report.resourcesClosed = true;
  await writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2));
}
console.log(
  JSON.stringify({
    profiles: report.profiles.map((p) => ({ name: p.name, checks: p.cases.length, failed: p.failures.length })),
    failures: report.failures,
    errors: report.errors,
    error: report.error,
    resourcesClosed: report.resourcesClosed,
  }),
);
