import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [];
try {
  for (const reducedMotion of ["no-preference", "reduce"]) {
    const page = await browser.newPage({ reducedMotion });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("http://127.0.0.1:3161");
    await page.waitForLoadState("networkidle");
    assert.equal(await page.locator("#version").textContent(), "19.0.0");
    const parts = page.locator('[data-testid^="adapter-"]');
    await parts.first().waitFor();
    await parts.evaluateAll((ns) => (window.nodes = ns));
    const sample = () =>
      parts.evaluateAll(async (ns) => {
        const frames = [];
        for (let i = 0; i < 12; i++) {
          await new Promise(requestAnimationFrame);
          frames.push(
            ns.map((n) => ({
              opacity: +getComputedStyle(n).opacity,
              transform: getComputedStyle(n).transform,
              animations: n
                .getAnimations()
                .map((a) => ({ state: a.playState, time: a.currentTime, frames: a.effect.getKeyframes() })),
            })),
          );
        }
        return frames;
      });
    for (const mode of ["full", "reduced", "none"]) {
      await page.getByLabel("Mode").selectOption(mode);
      await page.locator("#value").click();
      const frames = await sample();
      if (mode !== "none") assert(frames.some((row) => row.some((s) => s.opacity > 0.4 && s.opacity < 1)));
      if (mode !== "full" || reducedMotion === "reduce")
        assert(frames.every((row) => row.every((s) => s.transform === "none")));
      if (mode === "none") assert(frames.every((row) => row.every((s) => s.animations.length === 0)));
      const input = page.getByRole("textbox", { name: "Code" });
      await input.press("ControlOrMeta+A");
      await input.press("Backspace");
      assert.equal(await input.inputValue(), "");
      await input.pressSequentially("7");
      const span = page.locator('[data-slot="input-otp-slot"] > span').first();
      await span.evaluate((n) => (window.character = n));
      await input.focus();
      await page.getByLabel("Mode").selectOption("none");
      await input.focus();
      const stopped = await sample();
      assert(stopped.every((row) => row.every((s) => s.animations.length === 0)));
      assert.equal(new Set(stopped.map((row) => JSON.stringify(row))).size, 1);
      assert(await parts.evaluateAll((ns) => ns.every((n, i) => n === window.nodes[i])));
      assert(await span.evaluate((n) => n === window.character));
      assert(await input.evaluate((n) => n === document.activeElement));
      assert.equal(await span.evaluate((n) => getComputedStyle(n).opacity), "1");
      results.push({ reducedMotion, mode, frames, stopped });
    }
    // Keep references to real WAAPI animations while an unrelated committed render occurs.
    await page.getByLabel("Mode").selectOption("full");
    await page.locator("#value").click();
    await page.evaluate(() => new Promise(requestAnimationFrame));
    const active = await parts.evaluateAll((ns) => {
      window.running = ns.map((n) => n.getAnimations()[0]);
      return window.running.every(Boolean);
    });
    assert(active);
    await page.locator("#noise").click();
    assert(await parts.evaluateAll((ns) => ns.every((n, i) => n.getAnimations().includes(window.running[i]))));
    await page.locator("#clock").click();
    if (reducedMotion === "no-preference") {
      // The full adapter uses physics and retimes its active trajectory.
      assert(await parts.evaluateAll((ns) => ns.every((n, i) => !n.getAnimations().includes(window.running[i]))));
    } else {
      // Reduction resolves the same recipe to a finite opacity tween, whose
      // already-running positive clock is captured by the v2 contract.
      assert(await parts.evaluateAll((ns) => ns.every((n, i) => n.getAnimations().includes(window.running[i]))));
    }
    await page.getByLabel("Mode").selectOption("none");
    assert((await sample()).every((row) => row.every((s) => s.animations.length === 0)));
    const otp = page.getByRole("textbox", { name: "Code" });
    await otp.press("ControlOrMeta+A");
    await otp.press("Backspace");
    assert.equal(await otp.inputValue(), "");
    await page.getByLabel("Mode").selectOption("full");
    await otp.pressSequentially("8");
    const character = page.locator('[data-slot="input-otp-slot"] > span').first();
    await page.evaluate(() => new Promise(requestAnimationFrame));
    const opacityBefore = await character.evaluate((n) => +getComputedStyle(n).opacity);
    assert(opacityBefore < 1, (await character.evaluate((n) => n.parentElement.outerHTML)) + (await otp.inputValue()));
    await page.locator("#noise").click();
    const opacityAfter = await character.evaluate((n) => +getComputedStyle(n).opacity);
    assert(opacityAfter > opacityBefore && opacityAfter < 1);
    await page.getByLabel("Mode").selectOption("none");
    const otpStopped = await character.evaluate(async (n) => {
      const values = [];
      for (let i = 0; i < 12; i++) {
        await new Promise(requestAnimationFrame);
        values.push({ opacity: getComputedStyle(n).opacity, transform: getComputedStyle(n).transform });
      }
      return values;
    });
    assert(otpStopped.every((s) => s.opacity === "1" && s.transform === "none"));
    results.push({
      reducedMotion,
      sameTargetClockCancelled: reducedMotion === "no-preference",
      reducedFiniteClockCaptured: reducedMotion === "reduce",
      unrelatedRenderRetainedAnimation: true,
      otp: { opacityBefore, opacityAfter, stopped: otpStopped },
    });
    // Real native event and React 19 cleanup contract on the public native adapter.
    await page.locator('[data-testid="adapter-2"]').dispatchEvent("drag");
    assert.equal(await page.evaluate(() => window.proof.drags), 1);
    const before = await page.evaluate(() => structuredClone(window.proof));
    await page.locator("#noise").click();
    assert.deepEqual(await page.evaluate(() => window.proof), before);
    await page.locator("#mount").click();
    const after = await page.evaluate(() => window.proof);
    assert(after.cleanups.every((n, i) => n === before.cleanups[i] + 1));
    assert.deepEqual(errors, []);
    results.push({ reducedMotion, refsBefore: before, refsAfter: after, errors });
    await page.close();
  }
} finally {
  await browser.close();
}
console.log(JSON.stringify({ react: "19.0.0", reactDOM: "19.0.0", strictMode: true, results }, null, 2));
