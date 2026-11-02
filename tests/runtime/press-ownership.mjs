import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

// Real CDP touch input: dispatchEvent cannot establish primary pointer ownership.
const require = createRequire(import.meta.url);
const { createServer, transformWithEsbuild } = await import(
  pathToFileURL(require.resolve("vite", { paths: [path.dirname(require.resolve("vitest/node"))] }))
);
const config = (await import("./vite.config.mjs")).default;
const file = path.resolve("registry/cadence/lib/press-button.tsx");
const sourceText = readFileSync(file, "utf8");
const hash = () => createHash("sha256").update(readFileSync(file)).digest("hex");
const negative = process.argv.includes("--negative");
const report = {
  source: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  sourceSha256: hash(),
  sourceText,
  cases: [],
  failures: [],
};
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  for (const version of negative ? ["legacy50cc262", "current"] : ["current"]) {
    const virtual = "\0press-ownership-legacy.tsx";
    const legacy = negative
      ? execFileSync("git", ["show", "50cc262:registry/cadence/lib/press-button.tsx"], { encoding: "utf8" })
      : "";
    if (negative) report.legacySourceText = legacy;
    const plugin = {
      name: "exact-read-only-legacy",
      enforce: "pre",
      resolveId(id, importer) {
        if (id.endsWith("/press-button") || id === "./press-button") return virtual;
        if (importer === virtual && id === "./control-animation")
          return path.resolve("registry/cadence/lib/control-animation.tsx");
      },
      async load(id) {
        if (id === virtual) return (await transformWithEsbuild(legacy, file, { loader: "tsx", jsx: "automatic" })).code;
      },
    };
    const server = await createServer({
      ...config,
      configFile: false,
      logLevel: "error",
      esbuild: { jsx: "automatic" },
      server: { ...config.server, port: 3178 },
      plugins: version.startsWith("legacy") ? [plugin] : [],
    });
    try {
      await server.listen();
      for (const os of negative ? ["no-preference"] : ["no-preference", "reduce"])
        for (const mode of negative ? ["full"] : ["full", "reduced", "none"])
          for (const ending of negative ? ["release"] : ["release", "cancel", "disabled", "none", "blur", "unmount"]) {
            const context = await browser.newContext({
              hasTouch: true,
              reducedMotion: os,
              viewport: { width: 1100, height: 900 },
            });
            try {
              const page = await context.newPage();
              const c = { version, os, mode, ending, samples: [], events: [], errors: [] };
              report.cases.push(c);
              page.on("pageerror", (e) => c.errors.push(e.message));
              await page.goto("http://127.0.0.1:3178/");
              await page.waitForFunction(() => typeof window.updateRuntime === "function");
              await page.evaluate(
                ({ mode }) => {
                  window.updateRuntime({ mode, timeScale: 1, disabled: false });
                  document.documentElement.style.touchAction = "none";
                  document.body.style.touchAction = "none";
                  window.ownershipEvents = [];
                  for (const type of ["pointerdown", "pointerup", "pointercancel", "click", "focusin", "focusout"])
                    document.addEventListener(
                      type,
                      (e) =>
                        window.ownershipEvents.push({
                          type,
                          target: e.target.textContent,
                          pointerId: e.pointerId,
                          isPrimary: e.isPrimary,
                          trusted: e.isTrusted,
                        }),
                      true,
                    );
                },
                { mode },
              );
              const primary = page.getByRole("button", { name: "Press", exact: true });
              const secondary = page.getByRole("button", { name: "Toggle", exact: true });
              await primary.waitFor();
              await page.waitForTimeout(150);
              await primary.evaluate((n) => {
                window.ownershipPrimary = n;
              });
              const sample = async (label) =>
                c.samples.push(
                  await page.evaluate((label) => {
                    const a = window.ownershipPrimary,
                      b = [...document.querySelectorAll("button")].find((n) => n.textContent === "Toggle");
                    const read = (n) =>
                      n
                        ? {
                            scale: new DOMMatrixReadOnly(getComputedStyle(n).transform).a,
                            transform: getComputedStyle(n).transform,
                            mode: n.dataset.motion,
                            pressed: n.getAttribute("aria-pressed"),
                            connected: n.isConnected,
                          }
                        : null;
                    return {
                      label,
                      primary: read(a),
                      secondary: read(b),
                      sameNode: a === [...document.querySelectorAll("button")].find((n) => n.textContent === "Press"),
                      active: document.activeElement?.textContent,
                    };
                  }, label),
                );
              const a = await primary.boundingBox(),
                b = await secondary.boundingBox();
              assert.ok(a && b);
              const p1 = { x: a.x + a.width / 2, y: a.y + a.height / 2, id: 1, radiusX: 1, radiusY: 1, force: 1 };
              const p2 = { x: b.x + b.width / 2, y: b.y + b.height / 2, id: 2, radiusX: 1, radiusY: 1, force: 1 };
              const cdp = await context.newCDPSession(page);
              const touch = (type, touchPoints) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints });
              await sample("initial");
              await touch("touchStart", [p1]);
              await page.waitForTimeout(180);
              await sample("primary-held");
              await touch("touchStart", [p1, p2]);
              await page.waitForTimeout(180);
              await sample("secondary-held");
              // CDP touchEnd lists the touch being ended; the other touch stays held.
              await touch("touchEnd", [p2]);
              await page.waitForTimeout(200);
              await sample("secondary-released-primary-held");
              if (ending === "disabled") await page.evaluate(() => window.updateRuntime({ disabled: true }));
              if (ending === "none") await page.evaluate(() => window.updateRuntime({ mode: "none" }));
              if (ending === "blur") {
                await primary.focus();
                await secondary.focus();
              }
              if (ending === "unmount") await page.evaluate(() => window.unmountRuntime());
              if (["disabled", "none", "blur"].includes(ending)) {
                await page.waitForTimeout(250);
                await sample("cancelled-while-held");
              }
              await touch(ending === "cancel" ? "touchCancel" : "touchEnd", []);
              await page.waitForTimeout(250);
              if (ending !== "unmount") {
                await page.evaluate(({ mode }) => window.updateRuntime({ disabled: false, mode }), { mode });
                await page.waitForTimeout(200);
              }
              await sample("all-released");
              c.events = await page.evaluate(() => window.ownershipEvents);
              const check = (name, fn) => {
                try {
                  fn();
                } catch (e) {
                  report.failures.push({ version, os, mode, ending, name, error: e.message });
                }
              };
              const full = mode === "full" && os === "no-preference";
              check("trusted primary and nonprimary contacts", () => {
                const d = c.events.filter((e) => e.type === "pointerdown");
                assert.equal(d.length, 2);
                assert.ok(d[0].trusted && d[0].isPrimary);
                assert.ok(d[1].trusted && !d[1].isPrimary);
                assert.notEqual(d[0].pointerId, d[1].pointerId);
                const up = c.events.find((e) => e.type === "pointerup");
                assert.equal(up.pointerId, d[1].pointerId);
              });
              check("secondary never presses", () => {
                for (const s of c.samples.slice(0, 4)) {
                  assert.equal(s.secondary.scale, 1);
                  assert.equal(s.secondary.pressed, "false");
                }
              });
              check("primary stays held until its own end", () => {
                for (const s of c.samples.slice(1, 4)) {
                  assert.ok(s.sameNode);
                  if (full) assert.ok(s.primary.scale < 0.98 && s.primary.scale > 0.95);
                  else assert.equal(s.primary.scale, 1);
                }
              });
              check("owner ends and cleanup settles", () => {
                const s = c.samples.at(-1);
                if (ending !== "unmount") {
                  assert.ok(s.sameNode);
                  assert.equal(s.primary.scale, 1);
                } else assert.equal(s.primary.connected, false);
                assert.deepEqual(c.errors, []);
              });
              check("native activation", () => {
                if (ending === "release") {
                  assert.equal(c.events.filter((e) => e.type === "click" && e.target === "Press").length, 0);
                  assert.equal(c.samples.at(-1).secondary.pressed, "false");
                }
                if (ending === "cancel" || ending === "disabled")
                  assert.equal(c.events.filter((e) => e.type === "click" && e.target === "Press").length, 0);
              });
              check("lifecycle cancellation while pointer remains down", () => {
                const s = c.samples.find((s) => s.label === "cancelled-while-held");
                if (s) {
                  assert.equal(s.primary.scale, 1);
                  assert.ok(s.sameNode);
                }
              });
              if (!negative && ending === "release") {
                const count = () =>
                  page.evaluate(() => window.ownershipEvents.filter((e) => e.type === "click").length);
                const before = await count();
                await secondary.tap();
                await page.waitForTimeout(250);
                c.singleTouch = {
                  pressed: await secondary.getAttribute("aria-pressed"),
                  clicks: (await count()) - before,
                };
                await primary.focus();
                const keyboardBefore = await count();
                await page.keyboard.down("Enter");
                await page.waitForTimeout(180);
                await sample("Enter-held");
                await page.keyboard.up("Enter");
                await page.waitForTimeout(250);
                await sample("Enter-ended");
                c.keyboardClicks = (await count()) - keyboardBefore;
                await primary.hover();
                await page.mouse.down();
                await page.waitForTimeout(180);
                await sample("mouse-held");
                await page.mouse.move(1000, 850);
                await page.mouse.up();
                await page.waitForTimeout(250);
                await sample("outside-release");
                check("native single touch and Enter activation; external release", () => {
                  assert.deepEqual(c.singleTouch, { pressed: "true", clicks: 1 });
                  assert.equal(c.keyboardClicks, 1);
                  for (const label of ["Enter-held", "mouse-held"]) {
                    const s = c.samples.find((s) => s.label === label);
                    assert.ok(s.sameNode);
                    if (full) assert.ok(s.primary.scale < 0.98);
                    else assert.equal(s.primary.scale, 1);
                  }
                  for (const label of ["Enter-ended", "outside-release"])
                    assert.equal(c.samples.find((s) => s.label === label).primary.scale, 1);
                });
              }
            } finally {
              await context.close();
            }
          }
    } finally {
      await server.close();
    }
  }
} finally {
  await browser.close();
}
assert.equal(hash(), report.sourceSha256, "source unchanged during probe");
const output = negative ? "docs/evidence/press-ownership-negative.json" : "docs/evidence/press-ownership-runtime.json";
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ output, cases: report.cases.length, failures: report.failures }, null, 2));
if (report.failures.length) process.exitCode = 1;
