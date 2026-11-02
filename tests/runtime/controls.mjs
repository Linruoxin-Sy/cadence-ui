import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const report = {
  source: process.env.CADENCE_RUNTIME_SOURCE || "working-tree",
  sourceHashes: Object.fromEntries(
    [
      "lib/press-button",
      "lib/control-animation",
      "lib/provider",
      "checkbox/index",
      "radio-group/index",
      "switch/index",
      "slider/index",
      "progress/index",
      "input-otp/index",
    ].map((p) => [
      p,
      createHash("sha256")
        .update(readFileSync(`registry/cadence/${p}.tsx`))
        .digest("hex"),
    ]),
  ),
  fixture: "tests/runtime/controls.jsx",
  cases: [],
  checks: 0,
  failures: [],
};
let tick = 0;
const check = (name, fn) => {
  report.checks++;
  try {
    fn();
  } catch (e) {
    report.failures.push({ name, error: e.message });
  }
};
const part = (frame, name) => {
  const p = frame.parts.find((p) => p.probe === name);
  assert.ok(p, `missing ${name}`);
  return p;
};
const first = (frames) => {
  const paints = frames.filter((f) => ["paint1", "paint2"].includes(f.phase));
  assert.equal(paints.length, 2);
  return paints;
};
for (const os of ["no-preference", "reduce"])
  for (const mode of ["full", "reduced", "none"]) {
    const page = await browser.newPage({ reducedMotion: os });
    await page.addInitScript(() => {
      window.controlObservers = [];
      const NativeObserver = window.ResizeObserver;
      window.ResizeObserver = class extends NativeObserver {
        constructor(callback) {
          const record = { targets: new Set(), active: new Set(), calls: [] };
          super((entries, observer) => {
            record.calls.push(
              entries.map((entry) => ({ slot: entry.target.dataset.slot, width: entry.contentRect.width })),
            );
            callback(entries, observer);
          });
          this.record = record;
          window.controlObservers.push(record);
        }
        observe(target, options) {
          this.record.targets.add(target);
          this.record.active.add(target);
          return super.observe(target, options);
        }
        unobserve(target) {
          this.record.active.delete(target);
          return super.unobserve(target);
        }
        disconnect() {
          this.record.active.clear();
          return super.disconnect();
        }
      };
    });
    const cell = { os, mode, steps: [], errors: [] };
    report.cases.push(cell);
    page.on("pageerror", (e) => cell.errors.push(e.message));
    await page.goto(`http://127.0.0.1:3165/controls.html?mode=${mode}`);
    await page.waitForFunction(() => window.controlFrames?.some((f) => f.phase === "paint2"));
    const capture = async (name, patch, delay = 85) => {
      if (!patch && name !== "initial") patch = { unrelated: ++tick };
      if (patch)
        await page.evaluate((p) => {
          window.controlFrames = [];
          window.updateControls(p);
        }, patch);
      await page.waitForTimeout(delay);
      const frames = await page.evaluate(() => window.controlFrames);
      cell.steps.push({ name, frames });
      return frames;
    };
    const initial = await capture("initial");
    check(`${os}/${mode} initial actual hosts`, () => {
      for (const f of first(initial))
        for (const name of [
          "button",
          "focusable",
          "toggle",
          "group",
          "checkbox",
          "radio-a",
          "radio-b",
          "switch",
          "slider",
          "progress",
          "composed",
          "composed-default",
          "otp",
        ]) {
          const p = part(f, name);
          assert.ok(p.connected);
          assert.equal(p.mode, mode === "none" ? "none" : os === "reduce" ? "reduced" : mode);
        }
    });
    const active = mode === "full" && os === "no-preference";
    const change = await capture("external controlled commit", { checked: true, value: 80, char: "7" });
    check(`${os}/${mode} first controlled semantics`, () => {
      for (const f of first(change)) {
        for (const name of ["progress", "composed", "composed-default"]) {
          const p = part(f, name);
          if (!active) assert.ok(Math.abs(p.scale - 0.8) < 0.0001);
          else assert.ok(p.scale > 0.2 && p.scale < 0.8);
        }
        const sw = part(f, "switch");
        if (!active) assert.equal(sw.x, sw.parentWidth - sw.width);
        else assert.ok(sw.x < sw.parentWidth - sw.width);
        const otp = part(f, "otp");
        assert.equal(otp.text, "7");
        if (mode === "none") assert.equal(otp.opacity, 1);
        else assert.ok(otp.opacity < 1);
        if (!active) for (const name of ["checkbox", "radio-a", "radio-b", "otp"]) assert.equal(part(f, name).scale, 1);
      }
    });
    const unrelated = await capture("unrelated render", { unrelated: 1 });
    check(`${os}/${mode} unrelated character no replay`, () => {
      assert.ok(part(first(unrelated)[0], "otp").opacity >= part(first(change)[1], "otp").opacity);
    });
    const clock = await capture("same target inherited clock", { clock: 4 });
    check(`${os}/${mode} clock-only OTP settles without replay`, () => {
      for (const f of first(clock)) {
        assert.equal(part(f, "otp").opacity, 1);
        assert.equal(part(f, "otp").scale, 1);
      }
    });
    const explicit = await capture("same target explicit clock", { explicit: 2 });
    check(`${os}/${mode} inherited and explicit clocks retarget real engines`, () => {
      for (const frames of [clock, explicit]) {
        for (const f of first(frames))
          for (const name of ["switch", "progress", "composed", "composed-default", "checkbox", "radio-a", "radio-b"])
            assert.equal(part(f, name).id, part(first(change)[0], name).id);
      }
      if (active) {
        const duration = (frames) => part(first(frames)[1], "checkbox").animations[0]?.timing.duration;
        assert.ok(duration(change) > 0);
        assert.ok(duration(clock) > 0 && duration(clock) < duration(change));
        assert.ok(duration(explicit) > 0 && duration(explicit) < duration(clock));
        for (const frames of [clock, explicit]) {
          const f = first(frames)[1];
          assert.ok(part(f, "switch").x > 0 && part(f, "switch").x < 32);
          assert.ok(part(f, "progress").scale > 0.2 && part(f, "progress").scale < 0.8);
        }
      }
    });
    const zero = await capture("same target none cancellation", { mode: "none" });
    check(`${os}/${mode} none first paint semantic terminal`, () => {
      for (const f of first(zero)) {
        for (const name of ["progress", "composed", "composed-default"])
          assert.ok(Math.abs(part(f, name).scale - 0.8) < 0.0001);
        for (const name of ["checkbox", "radio-a", "otp"]) {
          assert.equal(part(f, name).opacity, 1);
          assert.equal(part(f, name).scale, 1);
        }
        assert.equal(part(f, "radio-b").opacity, 0);
        const sw = part(f, "switch");
        assert.equal(sw.x, sw.parentWidth - sw.width);
      }
    });
    const reverse = await capture("external reversal and character replacement", {
      mode,
      explicit: 8,
      checked: false,
      value: 35,
      char: "8",
    });
    const reduced = await capture("partial same target mode reduced", { mode: "reduced" });
    const none = await capture("partial same target mode none", { mode: "none" });
    check(`${os}/${mode} reversal then cancellation first paint`, () => {
      assert.equal(part(first(reverse)[0], "otp").text, "8");
      for (const f of first(reduced))
        for (const name of ["checkbox", "radio-a", "radio-b", "otp"]) assert.equal(part(f, name).scale, 1);
      for (const f of first(none)) {
        assert.equal(part(f, "switch").x, 0);
        for (const name of ["progress", "composed", "composed-default"])
          assert.ok(Math.abs(part(f, name).scale - 0.35) < 0.0001);
        for (const [name, opacity] of [
          ["checkbox", 0],
          ["radio-a", 0],
          ["radio-b", 1],
          ["otp", 1],
        ])
          assert.equal(part(f, name).opacity, opacity);
      }
    });
    const resize = await capture("none checked resize observer", { checked: true, width: 64 });
    const deletion = await capture("character deletion", { char: "" });
    check(`${os}/${mode} measured static endpoint and deletion`, () => {
      const sw = part(first(resize)[1], "switch");
      assert.equal(sw.x, 48);
      for (const f of first(deletion)) assert.equal(part(f, "otp").text, "");
    });
    await capture("restore requested mode", { mode, explicit: undefined, clock: 8, disabled: true });
    for (const name of ["button", "focusable", "toggle", "group"]) {
      const node = page.locator(`[data-probe=${name}]`);
      await node.hover({ force: true });
      await page.mouse.down();
      const disabled = await capture(`initial disabled pointer ${name}`);
      await page.mouse.up();
      await node.evaluate((n) => n.focus());
      await page.keyboard.down("Enter");
      const keyboard = await capture(`initial disabled Enter ${name}`);
      await page.keyboard.up("Enter");
      check(`${os}/${mode} initial disabled ${name}`, () => {
        for (const frames of [disabled, keyboard]) {
          assert.ok(frames.length);
          for (const f of frames) assert.equal(part(f, name).scale, 1);
        }
      });
    }
    await capture("enable", { disabled: false });
    for (const name of ["button", "focusable", "toggle", "group"]) {
      const node = page.locator(`[data-probe=${name}]`);
      await node.focus();
      await node.hover();
      await page.mouse.down();
      const pointerHeld = await capture(`pointer held ${name}`, { unrelated: ++tick });
      const pointerDisabled = await capture(`pointer disabled ${name}`, { disabled: true });
      await page.mouse.up();
      const pointerEnabled = await capture(`pointer release reenable ${name}`, { disabled: false });
      check(`${os}/${mode} pointer disable-release-reenable ${name}`, () => {
        if (active) assert.ok(pointerHeld.some((f) => part(f, name).scale < 1));
        else for (const f of first(pointerHeld)) assert.equal(part(f, name).scale, 1);
        for (const frames of [pointerDisabled, pointerEnabled])
          for (const f of first(frames)) assert.equal(part(f, name).scale, 1);
        assert.equal(part(first(pointerHeld)[0], name).id, part(first(pointerEnabled)[0], name).id);
      });
      await node.focus();
      await page.keyboard.down("Enter");
      const held = await capture(`Enter actual ${name}`, { unrelated: ++tick });
      await capture(`Enter inherited clock ${name}`, { clock: 4 });
      const cancelled = await capture(`Enter none cancellation ${name}`, { mode: "none" });
      await page.keyboard.up("Enter");
      const released = await capture(`Enter release ${name}`, { unrelated: ++tick });
      check(`${os}/${mode} keyboard recipe ${name}`, () => {
        if (active) assert.ok(first(held).some((f) => part(f, name).scale < 1));
        else for (const f of first(held)) assert.equal(part(f, name).scale, 1);
        for (const f of first(released)) assert.equal(part(f, name).scale, 1);
        assert.equal(part(first(held)[0], name).id, part(first(cancelled)[0], name).id);
      });
      await capture("reset clock", { explicit: undefined, mode });
    }
    const thumb = page.locator("[data-probe=slider]");
    await page.evaluate(() => {
      window.pointerEvents = [];
      for (const type of ["pointerdown", "pointermove", "pointerup", "pointercancel", "lostpointercapture"])
        document.addEventListener(
          type,
          (e) =>
            window.pointerEvents.push({
              type,
              target: e.target.outerHTML?.slice(0, 120),
              buttons: e.buttons,
              defaultPrevented: e.defaultPrevented,
            }),
          false,
        );
    });
    cell.sliderBefore = await thumb.evaluate((n) => {
      const r = n.getBoundingClientRect();
      return { html: n.outerHTML, hit: document.elementFromPoint(r.x + 8, r.y + 8)?.outerHTML };
    });
    await thumb.hover();
    await page.mouse.down();
    cell.sliderDown = await page.locator("[data-slot=slider]").evaluate((n) => n.outerHTML);
    const box = await thumb.boundingBox();
    await page.mouse.move(box.x + 55, box.y + 8, { steps: 12 });
    const drag = await capture("actual dragged thumb", { unrelated: 2 });
    cell.pointerEvents = await page.evaluate(() => window.pointerEvents);
    cell.sliderState = await page.evaluate(() => window.sliderState);
    const dragClock = await capture("drag same target explicit clock", { explicit: 2 });
    const dragReduced = await capture("drag same target reduced cancellation", { mode: "reduced" });
    const dragDisabled = await capture("drag disabled async commit", { disabled: true });
    await page.mouse.up();
    const valueCommit = await capture("disabled external value commit", { value: 60 });
    check(`${os}/${mode} actual slider feedback vs semantic position`, () => {
      if (active) assert.ok(first(drag).some((f) => part(f, "slider").scale < 1));
      else for (const f of first(drag)) assert.equal(part(f, "slider").scale, 1);
      for (const f of first(dragDisabled)) assert.equal(part(f, "slider").scale, 1);
      for (const f of first(dragReduced)) assert.equal(part(f, "slider").scale, 1);
      const a = part(first(dragDisabled)[0], "slider"),
        b = part(first(valueCommit)[0], "slider");
      assert.equal(a.id, b.id);
      assert.notEqual(a.inline, b.inline);
      assert.equal(part(first(dragClock)[0], "slider").id, a.id);
    });
    await capture("start before cleanup", {
      disabled: false,
      explicit: undefined,
      mode: "full",
      checked: false,
      value: 90,
      char: "9",
    });
    await capture("unmount actual hosts", { mounted: false });
    const detached = await page.evaluate(async () => {
      const read = () =>
        window.controlNodes.map((n) => ({
          probe: n.dataset.probe,
          connected: n.isConnected,
          style: n.getAttribute("style"),
          animations: n.getAnimations().map((a) => a.playState),
        }));
      const before = read();
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      return { before, after: read(), refs: window.refEvents };
    });
    cell.cleanup = detached;
    cell.observers = await page.evaluate(() =>
      window.controlObservers
        .filter((r) => [...r.targets].some((n) => n.dataset.slot === "switch-thumb"))
        .map((r) => ({ targets: [...r.targets].map((n) => n.dataset.slot), active: r.active.size, calls: r.calls })),
    );
    check(`${os}/${mode} real ResizeObserver delivery and disconnect`, () => {
      assert.equal(cell.observers.length, 1);
      assert.ok(cell.observers[0].calls.length > 0);
      assert.equal(cell.observers[0].active, 0);
    });
    check(`${os}/${mode} cleanup no later writes and callback cleanup`, () => {
      assert.ok(detached.before.length >= 13);
      assert.ok(detached.before.every((p) => !p.connected));
      assert.deepEqual(detached.before, detached.after);
      assert.ok(detached.refs.some((r) => r.phase === "cleanup"));
      assert.deepEqual(cell.errors, []);
    });
    await page.close();
  }
await browser.close();
writeFileSync(process.argv[2] || "docs/evidence/basic-controls-runtime.json", `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ checks: report.checks, failures: report.failures }, null, 2));
process.exitCode = report.failures.length ? 1 : 0;
