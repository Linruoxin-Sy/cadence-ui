import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";
import tailwind from "@tailwindcss/postcss";
import postcss from "postcss";
import { themeItemToCss } from "../../scripts/motion-tokens.mjs";

const output = path.resolve(process.env.CADENCE_MOTION_AUDIT_DIR ?? `.cache/audits/motion-parameters-${Date.now()}`);
await mkdir(output, { recursive: false });
await writeFile(path.join(output, "runner.mjs"), await readFile(new URL(import.meta.url)));
await writeFile(path.join(output, "fixture.jsx"), await readFile("tests/runtime/motion-parameters.jsx"));
const require = createRequire(import.meta.url);
const vite = require.resolve("vite", { paths: [require.resolve("vitest/node")] });
const { build } = await import(pathToFileURL(require.resolve("esbuild", { paths: [vite] })));
const reactEnvironment = process.env.CADENCE_MOTION_REACT_ENV ?? "production";
const bundle = await build({
  entryPoints: ["tests/runtime/motion-parameters.jsx"],
  bundle: true,
  write: false,
  platform: "browser",
  format: "iife",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": JSON.stringify(reactEnvironment) },
});
const css = await postcss([tailwind()]).process(await readFile("app/globals.css", "utf8"), {
  from: path.resolve("app/globals.css"),
});
await writeFile(path.join(output, "compiled.css"), css.css);
await writeFile(path.join(output, "fixture.js"), bundle.outputFiles[0].text);
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL ?? "msedge", headless: true });
const report = {
  cases: [],
  failures: [],
  errors: [],
  consoleErrors: [],
  hashes: {
    css: createHash("sha256").update(css.css).digest("hex"),
    js: createHash("sha256").update(bundle.outputFiles[0].text).digest("hex"),
  },
};
const page = await browser.newPage({ reducedMotion: "no-preference" });
page.on("pageerror", (error) => report.errors.push(error.stack));
page.on("console", (message) => {
  if (message.type() === "error") report.consoleErrors.push(message.text());
});
const near = (actual, expected) => assert(Math.abs(actual - expected) < 0.00001, `${actual} != ${expected}`);
async function sample(id) {
  return page.evaluate((id) => {
    const element = document.querySelector(`[data-scope="${id}"]`);
    const info = JSON.parse(document.querySelector(`[data-info="${id}"]`).textContent);
    const css = getComputedStyle(element);
    return {
      id,
      info,
      css: {
        // A stopped property family has no running transition, even when an
        // authored effective token retains its positive value in the cascade.
        duration: css.transitionProperty === "none" ? 0 : parseFloat(css.transitionDuration),
        rawDuration: css.transitionDuration,
        property: css.transitionProperty,
        handles: element.getAnimations().length,
        delay: parseFloat(css.transitionDelay),
        ease: css.transitionTimingFunction,
        fast: element.querySelector("[data-fast]")
          ? parseFloat(getComputedStyle(element.querySelector("[data-fast]")).transitionDuration)
          : parseFloat(css.transitionDuration),
        legacy: css.getPropertyValue("--motion-duration-fast").trim(),
        source: css.getPropertyValue("--motion-source-duration-fast").trim(),
        angle: element.querySelector("[data-angle]")
          ? getComputedStyle(element.querySelector("[data-angle]")).rotate
          : null,
        distance: element.querySelector("[data-distance]")
          ? getComputedStyle(element.querySelector("[data-distance]")).translate
          : null,
        delays: [...element.querySelectorAll("[data-stagger]")].map((node) =>
          parseFloat(getComputedStyle(node).transitionDelay),
        ),
      },
    };
  }, id);
}
async function settle() {
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
async function patch(value) {
  await page.evaluate((value) => window.patchMotionScope(value), value);
  await settle();
}
async function check(label, id, expected, fast = false) {
  const value = await sample(id);
  report.cases.push({ label, ...value });
  const seconds = fast ? (value.info.fast.duration ?? 0) : (value.info.base.duration ?? 0);
  near(seconds, expected);
  near(fast ? value.css.fast : value.css.duration, expected);
  near(value.css.fast, value.info.colour.transition.duration ?? 0);
  if (id === "portal" && fast) near(value.css.duration, expected);
  if (expected === 0 && value.css.property === "none") {
    assert.equal(value.css.handles, 0, "disabled family must cancel actual native handles");
    assert.equal(value.css.delay, 0);
  }
  return value;
}
try {
  let styles = `<style>${css.css}</style>`;
  if (process.env.CADENCE_MOTION_CSS_URL) {
    const url = process.env.CADENCE_MOTION_CSS_URL;
    const htmlResponse = await page.request.get(url);
    assert.equal(htmlResponse.status(), 200);
    const html = await htmlResponse.text();
    const links = [
      ...new Set(
        [...html.matchAll(/href="([^"<>]+\.css(?:\?[^"<>]*)?)"/g)].map((match) => new URL(match[1], url).href),
      ),
    ];
    assert(links.length > 0);
    const files = [];
    for (const [index, link] of links.entries()) {
      const response = await page.request.get(link);
      assert.equal(response.status(), 200);
      const body = await response.body();
      await writeFile(path.join(output, `served-${index}.css`), body);
      files.push({
        url: link,
        status: response.status(),
        bytes: body.length,
        sha256: createHash("sha256").update(body).digest("hex"),
      });
    }
    report.servedCSS = { url, files };
    styles = links.map((link) => `<link rel="stylesheet" href="${link}">`).join("");
  }
  const theme = JSON.parse(await readFile("registry.json", "utf8")).items.find((item) => item.name === "cadence-theme");
  const consumerCSS = await postcss([tailwind()]).process(`@import "tailwindcss";\n${themeItemToCss(theme)}`, {
    from: path.resolve("app/consumer-motion.css"),
  });
  await writeFile(path.join(output, "consumer.css"), consumerCSS.css);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setContent(
    `<style>${consumerCSS.css}</style><span data-consumer data-motion="full" style="transition-duration:var(--motion-duration-fast)">Copied consumer</span>`,
  );
  const copiedConsumer = await page
    .locator("[data-consumer]")
    .evaluate((node) => parseFloat(getComputedStyle(node).transitionDuration));
  near(copiedConsumer, 0.096);
  report.cases.push({ label: "actual registry theme CSS retains OS ceiling order", copiedConsumer });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setContent(
    `${styles}<style id="scope-theme"></style><span data-static data-motion="full" class="transition-opacity duration-(--motion-duration-fast)">SSR CSS</span><div id="root"></div>`,
  );
  const firstCSS = await page
    .locator("[data-static]")
    .evaluate((node) => parseFloat(getComputedStyle(node).transitionDuration));
  near(firstCSS, 0.096);
  await page.evaluate(() => document.documentElement.style.setProperty("--motion-source-duration-fast", ".5s"));
  const overrideCSS = await page
    .locator("[data-static]")
    .evaluate((node) => parseFloat(getComputedStyle(node).transitionDuration));
  near(overrideCSS, 0.3);
  report.cases.push({ label: "pre-JS full node obeys OS ceiling and root authored input", firstCSS, overrideCSS });
  await page.evaluate(() => document.documentElement.style.removeProperty("--motion-source-duration-fast"));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  await page.waitForSelector('[data-scope="portal"]');
  await settle();
  const strict = await page.evaluate(() => window.scopeStrict);
  report.cases.push({ label: "actual React effect lifecycle", reactEnvironment, strict });
  if (reactEnvironment === "development") {
    assert.equal(strict.setups, 2);
    assert.equal(strict.cleanups, 1);
  } else {
    assert.equal(strict.setups, 1);
    assert.equal(strict.cleanups, 0);
  }
  await check("standalone defaults", "standalone", 0.22);
  await page.evaluate(() => {
    document.documentElement.style.setProperty("--motion-source-duration-fast", ".5s");
    document.documentElement.style.setProperty("--motion-source-duration-base", ".6s");
  });
  await settle();
  await check("no-provider root authored input", "standalone", 0.6);
  await check("root authored input crosses portal", "portal", 0.5, true);
  await patch({ outerClass: "outer [--motion-source-duration-fast:.45s]" });
  await check("Tailwind authored utility overrides scope fallback", "portal", 0.45, true);
  await patch({ outerClass: "outer [--motion-duration-fast:.13s]" });
  await check("Tailwind effective utility retains compatibility override", "portal", 0.13, true);
  await patch({ outerClass: "outer" });
  await check("removing utility restores root input", "portal", 0.5, true);
  const callerTransition = {
    transitionProperty: "opacity",
    transitionDuration: "0.23s",
    transitionTimingFunction: "linear",
    transitionDelay: "0.03s",
    transitionBehavior: "allow-discrete",
    color: "red",
  };
  const transitionStyle = (scope = "portal") =>
    page.locator(`[data-scope="${scope}"]`).evaluate((node) => {
      const css = getComputedStyle(node);
      return {
        property: css.transitionProperty,
        duration: css.transitionDuration,
        delay: css.transitionDelay,
        easing: css.transitionTimingFunction,
        behavior: css.transitionBehavior,
        color: css.color,
        longhands: [...node.style].filter((name) => name.startsWith("transition-")),
      };
    });
  await patch({ portalStyle: callerTransition, localStyle: callerTransition });
  const callerBefore = await transitionStyle();
  assert.equal(callerBefore.property, "opacity");
  assert.equal(callerBefore.duration, "0.23s");
  assert.equal(callerBefore.delay, "0.03s");
  assert.equal(callerBefore.easing, "linear");
  assert.equal(callerBefore.behavior, "allow-discrete");
  for (const [label, override] of [
    ["none", { outerMode: "none" }],
    ["zero", { outerMode: "full", innerScale: 0 }],
  ]) {
    await patch(override);
    // The local probe explicitly owns its whole transition family. Real popups
    // coordinate their own family and yield to an actual caller override (S06).
    // Exercise both boundaries: cancellation must not erase caller authority.
    const stopped = await transitionStyle("local");
    assert.equal(stopped.property, "none");
    assert.equal(stopped.duration, "0s");
    assert.equal(stopped.delay, "0s");
    assert.equal(stopped.color, "rgb(255, 0, 0)");
    // CSSStyleDeclaration may expand a shorthand; every member must be its stopped value.
    assert.equal(stopped.easing, "ease");
    assert.equal(stopped.behavior, "normal");
    const caller = await transitionStyle();
    assert.deepEqual(caller, callerBefore);
    report.cases.push({ label: `owned family settles and caller popup family survives ${label}`, stopped, caller });
  }
  await patch({ innerScale: undefined });
  const callerRestored = await transitionStyle();
  assert.deepEqual(callerRestored, callerBefore);
  report.cases.push({ label: "caller transition family restored after stop", callerBefore, callerRestored });
  await patch({ portalStyle: {}, localStyle: {} });
  for (const os of ["no-preference", "reduce"])
    for (const mode of ["full", "reduced", "none"]) {
      await page.emulateMedia({ reducedMotion: os });
      await patch({
        outerMode: mode,
        innerMode: undefined,
        outerScale: 4,
        innerScale: undefined,
        portalStyle: { "--motion-duration-fast": ".9s" },
      });
      const expected = mode === "none" ? 0 : mode === "reduced" || os === "reduce" ? 1.44 : 2.4;
      await check(`three modes x OS ${mode}/${os}`, "local", expected);
      await check(`legacy override x three modes x OS ${mode}/${os}`, "portal", mode === "none" ? 0 : 0.9, true);
      await patch({ innerScale: 0 });
      await check(`zero x legacy override ${mode}/${os}`, "portal", 0, true);
    }
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await patch({ outerMode: "full", innerMode: undefined, innerScale: undefined, portalStyle: {} });
  await patch({ outerScale: 4 });
  await check("exactly once outer scale four", "local", 2.4);
  await check("portal exactly once scale four", "portal", 2, true);
  await patch({ ancestorStyle: { "--motion-source-duration-base": ".7s" } });
  await check("ordinary DOM ancestor inside provider", "local", 2.8);
  await patch({ outerMode: "none", innerMode: "full", innerScale: 1 });
  await check("full child restores authored input under none", "local", 0.7);
  await check("portal full child restores authored input", "portal", 0.5, true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await settle();
  await check("OS ceiling on explicit full", "local", 0.42);
  await check("OS ceiling on explicit full portal", "portal", 0.3, true);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await patch({
    outerMode: "full",
    innerMode: undefined,
    outerScale: 1,
    innerScale: undefined,
    ancestorStyle: {},
    localStyle: {
      "--motion-source-duration-base": "calc(.2s + 80ms)",
      "--motion-rotation-half-turn": "90deg",
      "--motion-distance-xs": "10px",
      "--motion-stagger-char": ".1s",
      "--ease-cadence-out": "cubic-bezier(.1,.2,.3,1)",
    },
  });
  const values = await check("calc and local parameter consumers", "local", 0.28);
  assert.equal(values.info.indicator.rotation, 90);
  assert.equal(values.css.angle, "90deg");
  assert.equal(values.info.tokens.distance.xs, 10);
  assert.equal(values.css.distance, "10px");
  assert.deepEqual(values.info.base.ease, [0.1, 0.2, 0.3, 1]);
  assert.match(values.css.ease, /0.1, 0.2, 0.3, 1/);
  assert.equal(Math.max(...values.css.delays), 0.12);
  assert.equal(values.info.stagger.moving, 20);
  await page.evaluate(() => {
    document.documentElement.style.setProperty("--motion-duration-fast", ".5s");
    document.getElementById("scope-theme").textContent = ".outer { --motion-duration-fast:.7s }";
  });
  await settle();
  await check("logical provider legacy wins physical portal root", "portal", 0.7, true);
  await patch({ ancestorStyle: { "--motion-duration-fast": ".9s" } });
  await check("ordinary DOM ancestor legacy wins logical provider", "local", 0.9, true);
  await patch({ ancestorStyle: {} });
  await check("removing ordinary DOM legacy restores provider", "local", 0.7, true);
  await patch({ portalStyle: { "--motion-duration-fast": ".9s" } });
  await check("popup caller legacy override wins logical owner", "portal", 0.9, true);
  await check("portal descendant inherits its local root clock", "portal-child", 0.9, true);
  await check("nested portal inherits actual part context", "nested-child", 0.9, true);
  await patch({ innerScale: 4 });
  await check("effective override is not scaled twice", "portal", 0.9, true);
  await patch({ innerScale: 0 });
  await check("zero wins nonzero effective override", "portal", 0, true);
  await patch({ innerScale: 1, outerMode: "none", innerMode: "full", portalStyle: {} });
  await page.evaluate(() => {
    document.getElementById("scope-theme").textContent = ".outer { --motion-duration-fast:0s }";
  });
  await settle();
  await check("explicit consumer zero differs from generated none zero", "portal", 0, true);
  await page.evaluate(() => {
    document.documentElement.style.removeProperty("--motion-duration-fast");
    document.getElementById("scope-theme").textContent = "";
  });
  await settle();
  await check("removing consumer zero restores authored full", "portal", 0.5, true);
  await check("nested portal restores after override removal", "nested-child", 0.5, true);
  await page.evaluate(() => {
    document.documentElement.style.setProperty("--motion-source-duration-base", ".22s");
    document.getElementById("scope-theme").textContent =
      ".outer {--motion-source-duration-base:.6s;--motion-duration-fast:.7s} .bubble-test {--motion-source-duration-base:.8s;--motion-duration-fast:.9s} [data-slot=navigation-menu-positioner] {--motion-duration-fast:.9s}";
  });
  await settle();
  await page.waitForSelector('[data-scope="nav"]');
  await settle();
  await check("actual Bubble local source reaches children", "bubble-child", 0.8);
  near(
    await page
      .locator('[data-scope="bubble"]')
      .evaluate((node) => parseFloat(getComputedStyle(node).transitionDuration)),
    0.8,
  );
  await check("actual Bubble local legacy reaches children", "bubble-child", 0.9, true);
  await check("actual Navigation Positioner legacy reaches Content", "nav-child", 0.9, true);
  await page.evaluate(() => {
    document.getElementById("scope-theme").textContent =
      ".outer {--motion-source-duration-base:.6s;--motion-duration-fast:.7s}";
  });
  await settle();
  await check("Bubble removal restores provider class source", "bubble-child", 0.6);
  near(
    await page
      .locator('[data-scope="bubble"]')
      .evaluate((node) => parseFloat(getComputedStyle(node).transitionDuration)),
    0.6,
  );
  await check("Bubble removal restores provider legacy", "bubble-child", 0.7, true);
  await check("Navigation Content removal restores provider legacy", "nav-child", 0.7, true);
  assert.equal(await page.evaluate(() => document.body.textContent.includes("withCadenceScope")), false);
  await page.evaluate(() => {
    document.documentElement.style.setProperty("--motion-source-duration-base", ".6s");
    document.getElementById("scope-theme").textContent = "";
  });
  await settle();
  await patch({ outerMode: "full", innerMode: undefined, localStyle: {} });
  await page.evaluate(() => {
    document.getElementById("scope-theme").textContent = ".local { --motion-source-duration-base:.8s }";
  });
  await settle();
  await check("StrictMode local stylesheet text refresh without root change", "local", 0.8);
  await page.evaluate(() => {
    document.getElementById("scope-theme").sheet.insertRule(".local { --motion-source-duration-base:.9s }", 1);
    window.refreshCadenceMotionTokens();
  });
  await settle();
  await check("explicit CSSOM refresh signal", "local", 0.9);
  await page.evaluate(() => {
    document.documentElement.style.setProperty("--motion-duration-fast", ".5s");
    document.getElementById("scope-theme").textContent =
      ".outer { --motion-duration-fast:.7s } .late { --motion-duration-fast:.09s }";
  });
  await settle();
  await patch({ surfacesOpen: false });
  await page.waitForSelector('[data-scope="portal"]', { state: "detached" });
  await page.waitForSelector('[data-slot="navigation-menu-popup"]', { state: "detached" });
  for (const kind of ["object", "callback", "cleanup", "render"]) {
    await page.evaluate((kind) => window.setLateKind(kind), kind);
    await settle();
    await page.locator("[data-late-trigger]").scrollIntoViewIfNeeded();
    const hit = await page.locator("[data-late-trigger]").evaluate((node) => {
      const rect = node.getBoundingClientRect();
      const target = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
      return {
        matches: node === target || node.contains(target),
        target: target?.outerHTML.slice(0, 300),
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      };
    });
    report.cases.push({ label: `native delayed trigger hit ${kind}`, hit });
    assert.equal(hit.matches, true);
    await page.locator("[data-late-trigger]").click();
    await page.waitForSelector('[data-scope="late"]');
    await settle();
    const initial = await page.locator('[data-scope="late"]').evaluate((node) => ({
      transport: getComputedStyle(node).getPropertyValue("--cadence-effective-fast"),
      tag: node.tagName,
    }));
    assert.match(initial.transport, /0\.09s/);
    await page.evaluate(() => {
      document.getElementById("scope-theme").textContent =
        ".outer { --motion-duration-fast:.7s } .late { --motion-duration-fast:.11s }";
    });
    await settle();
    const updated = await page
      .locator('[data-scope="late"]')
      .evaluate((node) => getComputedStyle(node).getPropertyValue("--cadence-effective-fast"));
    assert.match(updated, /0\.11s/);
    if (kind === "object")
      assert.equal(
        await page.evaluate(() => window.lateObject.current === document.querySelector('[data-scope="late"]')),
        true,
      );
    if (kind === "render") {
      assert.equal(initial.tag, "SECTION");
      await page.evaluate(() => window.setLateKind("cleanup"));
      await settle();
      assert.equal(await page.locator('[data-scope="late"]').evaluate((node) => node.tagName), "DIV");
    }
    await page.locator('[data-scope="late"]').evaluate((node) => {
      window.detachedLate = node;
    });
    await page.locator("[data-late-close]").click();
    await page.waitForFunction(() => !document.querySelector('[data-scope="late"]'));
    if (kind === "object") assert.equal(await page.evaluate(() => window.lateObject.current), null);
    const detachedReads = await page.evaluate(async () => {
      const original = window.getComputedStyle;
      let reads = 0;
      window.getComputedStyle = function (node, ...args) {
        if (node === window.detachedLate) reads += 1;
        return original.call(this, node, ...args);
      };
      window.detachedLate.style.setProperty("--motion-duration-fast", ".13s");
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      window.getComputedStyle = original;
      return reads;
    });
    assert.equal(detachedReads, 0);
    report.cases.push({ label: `delayed portal attach/reopen/render refs ${kind}`, initial, updated, detachedReads });
    await page.evaluate(() => {
      document.getElementById("scope-theme").textContent =
        ".outer { --motion-duration-fast:.7s } .late { --motion-duration-fast:.09s }";
    });
    await settle();
  }
  const refs = await page.evaluate(() => window.lateRefs);
  const openEvents = await page.evaluate(() => window.lateOpenEvents);
  report.cases.push({ label: "native object/callback/React19 cleanup/render ref ownership", refs, openEvents });
  assert(openEvents.filter((value) => value.open && value.trusted).length >= 4);
  for (const kind of ["callback", "cleanup", "render"])
    assert(
      refs.some((value) => value.kind === kind && value.attached),
      `${kind} must actually attach`,
    );
  assert.equal(
    refs.filter((value) => value.kind === "callback" && value.attached).length,
    refs.filter((value) => value.kind === "callback" && !value.attached).length,
  );
  assert.equal(
    refs.filter((value) => value.kind === "cleanup" && value.attached).length,
    refs.filter((value) => value.kind === "cleaned").length,
  );
  assert.equal(refs.filter((value) => value.kind === "cleanup" && !value.attached).length, 0);
  assert.equal(
    refs.filter((value) => value.kind === "render" && value.attached).length,
    refs.filter((value) => value.kind === "render-cleaned").length,
  );
  await page.evaluate(() => {
    document.documentElement.style.removeProperty("--motion-duration-fast");
    document.getElementById("scope-theme").textContent = "";
  });
  await settle();
  const native = await page.evaluate(() =>
    [...document.querySelectorAll("[data-native]")].map((element) => {
      element.focus();
      if (element.setSelectionRange) element.setSelectionRange(2, 5);
      if (element.isContentEditable) {
        const range = document.createRange();
        range.setStart(element.firstChild, 1);
        range.setEnd(element.firstChild, 5);
        const selection = getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      }
      const selection = () => {
        const value = getSelection();
        return {
          text: value.toString(),
          anchor: value.anchorOffset,
          focus: value.focusOffset,
          node: value.anchorNode?.textContent,
        };
      };
      const before = {
        html: element.innerHTML,
        children: element.childNodes.length,
        start: element.selectionStart,
        end: element.selectionEnd,
        active: document.activeElement === element,
        selection: selection(),
      };
      let mutations = 0;
      const observer = new MutationObserver((records) => {
        mutations += records.length;
      });
      observer.observe(element, { childList: true, subtree: true });
      const result = window.readMotionTokenScope(element);
      mutations += observer.takeRecords().length;
      observer.disconnect();
      return {
        before,
        after: {
          html: element.innerHTML,
          children: element.childNodes.length,
          start: element.selectionStart,
          end: element.selectionEnd,
          active: document.activeElement === element,
          selection: selection(),
        },
        mutations,
        duration: result.tokens.duration.base,
        distance: result.tokens.distance.xs,
      };
    }),
  );
  report.cases.push({ label: "isolated probes preserve native subtree and selection", native });
  for (const value of native) {
    assert.deepEqual(value.before, value.after);
    assert.equal(value.mutations, 0);
    near(value.duration, 0.28);
  }
  assert.equal(native[0].distance, 40);
  const invalid = await page.evaluate(() =>
    [
      ["--motion-source-duration-fast", "4px"],
      ["--motion-distance-xs", "2s"],
      ["--motion-scale-in", "1deg"],
      ["--motion-source-duration-fast", "4"],
    ].map(([key, value]) => {
      const input = document.querySelector("input");
      input.style.setProperty(key, value);
      let error;
      try {
        window.readMotionTokenScope(input);
      } catch (e) {
        error = e.message;
      }
      input.style.removeProperty(key);
      return { key, value, error };
    }),
  );
  report.cases.push({ label: "wrong and missing units rejected", invalid });
  assert(invalid.every((value) => value.error));
  await page.evaluate(() => {
    document.getElementById("scope-theme").textContent =
      ".outer { --motion-spring-press-duration:0s } .local { --motion-spring-morph-duration:0s }";
  });
  await settle();
  await patch({ target: 200 });
  await settle();
  assert.equal(await page.evaluate(() => window.scopeValues.local.get()), 200);
  assert.equal(await page.evaluate(() => window.scopeValues.local.isAnimating()), false);
  await page.locator("[data-source-zero]").hover();
  await page.mouse.down();
  await settle();
  const scale = await page.locator("[data-source-zero]").evaluate(async (node) => {
    const samples = [];
    for (let i = 0; i < 2; i++) {
      await new Promise(requestAnimationFrame);
      const matrix = new DOMMatrixReadOnly(getComputedStyle(node).transform);
      samples.push({
        x: matrix.a,
        y: matrix.d,
        animations: node
          .getAnimations()
          .filter((value) => value.playState === "running")
          .map((value) => ({
            type: value.constructor.name,
            property: value.transitionProperty,
            playState: value.playState,
            keyframes: value.effect?.getKeyframes(),
          })),
      });
    }
    return samples;
  });
  report.cases.push({ label: "actual Button held press at source spring zero", scale });
  for (const value of scale) {
    near(value.x, 0.97);
    near(value.y, 0.97);
    assert.equal(
      value.animations.filter(
        (animation) =>
          /transform|scale|translate/.test(animation.property ?? "") ||
          animation.keyframes?.some((frame) => "transform" in frame || "scale" in frame || "translate" in frame),
      ).length,
      0,
    );
  }
  await page.mouse.up();
  await page.evaluate(() => {
    document.getElementById("scope-theme").textContent = "";
    window.tokenReads = 0;
    const original = window.getComputedStyle;
    window.getComputedStyle = function (node, ...rest) {
      if (node.matches?.('[data-scope="local"]')) window.tokenReads += 1;
      return original.call(this, node, ...rest);
    };
  });
  await settle();
  await patch({ target: 400 });
  await page.waitForTimeout(40);
  const before = await page.evaluate(() => ({ reads: window.tokenReads, value: window.scopeValues.local.get() }));
  await page.waitForTimeout(120);
  const after = await page.evaluate(() => ({ reads: window.tokenReads, value: window.scopeValues.local.get() }));
  report.cases.push({ label: "Motion frame styles do not resample tokens", before, after });
  assert.equal(after.reads, before.reads);
  assert.notEqual(after.value, before.value);
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.consoleErrors, []);
  await page.screenshot({ path: path.join(output, "light.png"), fullPage: true });
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await settle();
  await page.screenshot({ path: path.join(output, "dark.png"), fullPage: true });
} catch (error) {
  report.failures.push(error.stack);
  await page.screenshot({ path: path.join(output, "failure.png"), fullPage: true });
  await writeFile(path.join(output, "failure.html"), await page.content());
} finally {
  await browser.close();
  await writeFile(path.join(output, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
}
console.log({
  output,
  cases: report.cases.length,
  failures: report.failures,
  errors: report.errors,
  consoleErrors: report.consoleErrors,
});
if (report.failures.length || report.errors.length || report.consoleErrors.length) process.exitCode = 1;
