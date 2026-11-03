import { expect, test } from "@playwright/test";
import { effectiveMode, MODES } from "./helpers";

for (const os of ["no-preference", "reduce"] as const)
  for (const mode of MODES)
    test(`CSS navigation content actual part ${mode}/${os}`, async ({ page }, info) => {
      await page.emulateMedia({ reducedMotion: os });
      await page.goto(`/components/navigation-menu?motion=${mode}&speed=0.25`);
      await page.waitForLoadState("networkidle");
      const preview = page.locator('[data-preview="navigation-menu"]');
      await preview.getByRole("button", { name: "Learn", exact: true }).click();
      const frames = await preview.evaluate(async (root) => {
        const button = [...root.querySelectorAll("button")].find((n) => n.textContent === "Switch panel");
        if (!button) throw new Error("missing real switch control");
        button.click();
        const frames = [];
        for (let i = 0; i < 24; i++) {
          await new Promise(requestAnimationFrame);
          frames.push(
            [...document.querySelectorAll('[data-slot="navigation-menu-content"]')].map((node) => ({
              open: node.hasAttribute("data-open"),
              mode: node.getAttribute("data-motion"),
              opacity: getComputedStyle(node).opacity,
              animations: node.getAnimations().map((a) => ({
                kind: a.constructor.name,
                time: a.currentTime,
                state: a.playState,
                timing: a.effect?.getTiming(),
                frames: (a.effect as KeyframeEffect).getKeyframes(),
              })),
            })),
          );
        }
        return frames;
      });
      await info.attach("raw navigation content", { body: JSON.stringify(frames), contentType: "application/json" });
      const active = frames.flat().filter((f) => f.open);
      expect(active.length).toBeGreaterThan(3);
      const actual = effectiveMode(mode, os === "reduce");
      if (actual === "none") expect(active.every((f) => f.opacity === "1" && f.animations.length === 0)).toBe(true);
      else expect(active.some((f) => Number(f.opacity) > 0 && Number(f.opacity) < 1)).toBe(true);
    });

test("CSS cold OS reduced specimen first paint", async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    const state = window as unknown as { coldCSS: { translate: string; mode: string | null; time: number }[] };
    state.coldCSS = [];
    const sample = () => {
      const n = document.querySelector('[data-preview="skeleton"] [data-preview-body] .gap-5');
      if (n)
        state.coldCSS.push({
          translate: getComputedStyle(n).translate,
          mode: n.getAttribute("data-motion"),
          time: performance.now(),
        });
    };
    new MutationObserver(sample).observe(document, { childList: true, subtree: true });
    let remaining = 120;
    const tick = () => {
      sample();
      if (--remaining) requestAnimationFrame(tick);
    };
    tick();
  });
  await page.goto("/components/skeleton");
  await page.waitForLoadState("networkidle");
  const frames = await page.evaluate(() => (window as unknown as { coldCSS: { translate: string }[] }).coldCSS);
  await info.attach("raw cold OS CSS", { body: JSON.stringify(frames), contentType: "application/json" });
  expect(frames.length).toBeGreaterThan(0);
  expect(frames.every((f) => f.translate === "none")).toBe(true);
});

for (const id of ["dropdown-menu", "context-menu", "menubar"])
  for (const os of ["no-preference", "reduce"] as const)
    for (const mode of MODES)
      test(`CSS submenu actual part ${id}/${mode}/${os}`, async ({ page }, info) => {
        await page.emulateMedia({ reducedMotion: os });
        await page.goto(`/components/${id}?motion=${mode}&speed=0.25`);
        await page.waitForLoadState("networkidle");
        const trigger = page
          .locator(`[data-preview="${id}"] [data-slot="${id}-trigger"]`)
          .nth(id === "menubar" ? 1 : 0);
        await trigger.click(id === "context-menu" ? { button: "right" } : {});
        const sub = page.locator(`[data-slot="${id}-sub-trigger"]`).first();
        await sub.focus();
        await page.evaluate((slot) => {
          const state = window as unknown as { cssFrames: unknown[]; cssRecording: boolean };
          state.cssFrames = [];
          state.cssRecording = true;
          const sample = () => {
            const node = document.querySelector(`[data-slot="${slot}"]`);
            if (!node) return;
            const s = getComputedStyle(node);
            state.cssFrames.push({
              time: performance.now(),
              mode: node.getAttribute("data-motion"),
              opacity: Number(s.opacity),
              scale: s.scale,
              duration: s.transitionDuration,
              animations: node.getAnimations().map((a) => ({
                kind: a.constructor.name,
                state: a.playState,
                time: a.currentTime,
                timing: a.effect?.getTiming(),
                frames: (a.effect as KeyframeEffect).getKeyframes(),
              })),
            });
          };
          const observer = new MutationObserver(sample);
          observer.observe(document.body, { subtree: true, childList: true, attributes: true });
          const tick = () => {
            sample();
            if (state.cssRecording) requestAnimationFrame(tick);
            else observer.disconnect();
          };
          tick();
        }, `${id}-sub-content`);
        await page.keyboard.press("ArrowRight");
        const popup = page.locator(`[data-slot="${id}-sub-content"]`);
        await expect(popup).toBeVisible();
        await page.waitForTimeout(240);
        const frames = await page.evaluate(() => {
          const state = window as unknown as {
            cssFrames: { opacity: number; scale: string; animations: unknown[] }[];
            cssRecording: boolean;
          };
          state.cssRecording = false;
          return state.cssFrames;
        });
        await info.attach("raw submenu insertion", { body: JSON.stringify(frames), contentType: "application/json" });
        expect(frames.length).toBeGreaterThan(3);
        const actual = effectiveMode(mode, os === "reduce");
        if (actual === "none") expect(frames.every((f) => f.opacity === 1 && f.animations.length === 0)).toBe(true);
        else expect(frames.some((f) => f.opacity > 0 && f.opacity < 1)).toBe(true);
        if (actual !== "full") expect(frames.every((f) => f.scale === "none")).toBe(true);
        const saved = await popup.elementHandle();
        await page.getByLabel("Popup motion", { exact: true }).evaluate((node) => {
          (node as HTMLSelectElement).value = "none";
          node.dispatchEvent(new Event("change", { bubbles: true }));
        });
        await expect(popup).toHaveAttribute("data-motion", "none");
        expect(await popup.evaluate((node, saved) => node === saved && node.getAnimations().length === 0, saved)).toBe(
          true,
        );
        await page.keyboard.press("ArrowLeft");
        await expect(sub).toBeFocused();
      });

for (const id of ["accordion", "collapsible"])
  test(`CSS disclosure inherited clock ${id}`, async ({ page }) => {
    await page.goto(`/components/${id}?motion=full&speed=0.25`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator(`[data-preview="${id}"] [data-slot="${id}-content"]`).first()).toHaveCSS(
      "transition-duration",
      "1.28s",
    );
  });

for (const os of ["no-preference", "reduce"] as const)
  for (const mode of MODES)
    test(`CSS specimen insertion ${mode}/${os}`, async ({ page }, info) => {
      await page.emulateMedia({ reducedMotion: os });
      await page.goto(`/components/skeleton?motion=${mode}`);
      await page.waitForLoadState("networkidle");
      const expected = effectiveMode(mode, os === "reduce");
      await expect(page.locator('[data-preview="skeleton"]')).toHaveAttribute("data-preview-motion", expected);
      // Reinsert the actual authored CSS surface, without descendants' independent engines.
      // This isolates @starting-style from the article's Motion entrance and hydration timing.
      const frames = await page
        .locator('[data-preview="skeleton"] [data-preview-body] .gap-5')
        .first()
        .evaluate(async (source) => {
          const node = source.cloneNode(false) as HTMLElement;
          node.textContent = "CSS insertion probe";
          source.parentElement?.append(node);
          const frames = [];
          for (let i = 0; i < 24; i++) {
            const s = getComputedStyle(node);
            frames.push({
              time: performance.now(),
              opacity: Number(s.opacity),
              translate: s.translate,
              animations: node.getAnimations().map((a) => ({
                kind: a.constructor.name,
                state: a.playState,
                time: a.currentTime,
                timing: a.effect?.getTiming(),
                frames: (a.effect as KeyframeEffect).getKeyframes(),
              })),
            });
            await new Promise(requestAnimationFrame);
          }
          node.remove();
          return frames;
        });
      await info.attach("raw CSS insertion", { body: JSON.stringify(frames), contentType: "application/json" });
      expect(frames.length).toBe(24);
      if (expected !== "full") expect(frames.every((f) => f.translate === "none")).toBe(true);
      if (expected === "none") expect(frames.every((f) => f.opacity === 1 && f.animations.length === 0)).toBe(true);
      else expect(frames.some((f) => f.opacity > 0 && f.opacity < 1)).toBe(true);
    });

for (const id of ["skeleton", "spinner", "progress", "attachment"])
  test(`CSS theme clock and cancellation ${id}`, async ({ page }, info) => {
    await page.goto(`/components/${id}?motion=full&speed=0.25`);
    await page.waitForLoadState("networkidle");
    const selector =
      id === "progress"
        ? '[aria-label="Preparing preview"] [data-slot="progress-indicator"]'
        : id === "attachment"
          ? '[data-testid="live-attachment"] [data-slot="attachment-title"]'
          : `[data-slot="${id}"]`;
    const part = page.locator(`[data-preview="${id}"] ${selector}`).first();
    const result = await part.evaluate(async (node, id) => {
      const variable = id === "spinner" ? "--animate-spin" : "--animate-pulse";
      const name = id === "spinner" ? "spin" : "pulse";
      const before = getComputedStyle(node).animationDuration;
      (node as HTMLElement).style.setProperty(variable, `${name} 0.4s linear infinite`);
      const samples = [];
      for (let i = 0; i < 32; i++) {
        await new Promise(requestAnimationFrame);
        const s = getComputedStyle(node);
        samples.push({
          opacity: s.opacity,
          transform: s.transform,
          duration: s.animationDuration,
          animations: node.getAnimations().map((a) => ({
            kind: a.constructor.name,
            state: a.playState,
            time: a.currentTime,
            timing: a.effect?.getTiming(),
            frames: (a.effect as KeyframeEffect).getKeyframes(),
          })),
        });
      }
      return { before, samples };
    }, id);
    await info.attach("raw loop theme clock", { body: JSON.stringify(result), contentType: "application/json" });
    expect(result.before).toBe(id === "spinner" ? "1s" : "2s");
    expect(result.samples.every((f) => f.duration === "0.4s")).toBe(true);
    expect(new Set(result.samples.map((f) => (id === "spinner" ? f.transform : f.opacity))).size).toBeGreaterThan(3);
    if (id === "attachment") await page.getByLabel("Attachment motion", { exact: true }).selectOption("reduced");
    else
      await page
        .getByRole("group", { name: "Motion mode" })
        .getByRole("button", { name: "reduced", exact: true })
        .click();
    await expect(part).toHaveAttribute("data-motion", "reduced");
    expect(await part.evaluate((n) => n.getAnimations().some((a) => a instanceof CSSAnimation))).toBe(true);
    if (id === "attachment") await page.getByLabel("Attachment motion", { exact: true }).selectOption("none");
    else
      await page.getByRole("group", { name: "Motion mode" }).getByRole("button", { name: "none", exact: true }).click();
    await expect(part).toHaveAttribute("data-motion", "none");
    expect(await part.evaluate((n) => n.getAnimations().length)).toBe(0);
  });
