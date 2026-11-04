import { expect, type Locator, type Page, test } from "@playwright/test";
import { effectiveMode, MODES } from "./helpers";
import { openPopupMotionFixture } from "./popup-motion-fixture";

// Samples belong to the actual node, including native animation identities across clock commits.
async function record(page: Page, selector: string) {
  await page.evaluate((selector) => {
    const ids = new WeakMap<object, number>();
    let next = 0;
    const id = (o: object) => {
      if (!ids.has(o)) ids.set(o, ++next);
      return ids.get(o);
    };
    const state = { stage: "initial", frames: [] as unknown[], stop: false };
    Object.assign(window, { cssLifecycle: state });
    const sample = () => {
      for (const node of document.querySelectorAll(selector)) {
        const s = getComputedStyle(node);
        state.frames.push({
          stage: state.stage,
          at: performance.now(),
          node: id(node),
          mode: node.getAttribute("data-motion"),
          open: node.hasAttribute("data-open"),
          ending: node.hasAttribute("data-ending-style"),
          connected: node.isConnected,
          opacity: s.opacity,
          transform: s.transform,
          translate: s.translate,
          filter: s.filter,
          rotate: s.rotate,
          display: s.display,
          duration: s.transitionDuration,
          animations: node.getAnimations().map((a) => ({
            id: id(a),
            kind: a.constructor.name,
            property: (a as CSSTransition).transitionProperty,
            time: a.currentTime,
            state: a.playState,
            timing: a.effect?.getTiming(),
            frames: (a.effect as KeyframeEffect).getKeyframes(),
          })),
        });
      }
    };
    const observer = new MutationObserver(sample);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true });
    const tick = () => {
      sample();
      if (!state.stop) requestAnimationFrame(tick);
      else observer.disconnect();
    };
    tick();
  }, selector);
}
type Frame = {
  stage: string;
  at: number;
  node: number;
  mode: string;
  open: boolean;
  ending: boolean;
  opacity: string;
  transform: string;
  translate: string;
  filter: string;
  rotate: string;
  display: string;
  duration: string;
  animations: {
    id: number;
    kind: string;
    property: string;
    time: number;
    state: string;
    timing: { duration: number };
    frames: unknown[];
  }[];
};
async function stage(page: Page, name: string) {
  await page.evaluate((name) => {
    (window as unknown as { cssLifecycle: { stage: string } }).cssLifecycle.stage = name;
  }, name);
}
async function finish(page: Page, info: import("@playwright/test").TestInfo) {
  const frames = await page.evaluate(() => {
    const s = (window as unknown as { cssLifecycle: { stop: boolean; frames: Frame[] } }).cssLifecycle;
    s.stop = true;
    return s.frames;
  });
  await info.attach("raw actual lifecycle", { body: JSON.stringify(frames), contentType: "application/json" });
  expect(frames.length).toBeGreaterThan(3);
  for (const value of ["reduced", "none"]) {
    if (frames.some((f) => f.stage === value)) expect(frames.filter((f) => f.mode === value).length).toBeGreaterThan(0);
  }
  return frames;
}
async function mode(page: Page, value: string) {
  await page
    .getByRole("group", { name: "Motion mode", includeHidden: true })
    .getByRole("button", { name: value, exact: true, includeHidden: true })
    .evaluate((n: HTMLButtonElement) => n.click());
}
async function change(select: Locator, value: string) {
  await select.evaluate((n: HTMLSelectElement, value) => {
    n.value = value;
    n.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}

for (const os of ["no-preference", "reduce"] as const)
  for (const m of MODES)
    test(`CSS Reveal initial actual row ${m}/${os}`, async ({ page }, info) => {
      await page.emulateMedia({ reducedMotion: os });
      await page.goto(`/components?motion=${m}&speed=0.25`);
      await page.waitForLoadState("networkidle");
      const row = page.locator("aside [data-site-reveal]").last();
      await row.evaluate((n) => n.setAttribute("data-css-initial-reveal", ""));
      await expect(row).toHaveAttribute("data-motion", effectiveMode(m, os === "reduce"));
      await expect(row).toHaveCSS("opacity", m === "none" ? "1" : "0");
      await record(page, "[data-css-initial-reveal]");
      await row.evaluate((n) => n.scrollIntoView({ block: "center" }));
      await page.waitForTimeout(170);
      const f = await finish(page, info);
      if (m === "none") expect(f.every((s) => s.opacity === "1" && s.animations.length === 0)).toBe(true);
      else expect(f.some((s) => Number(s.opacity) > 0 && Number(s.opacity) < 1)).toBe(true);
      if (effectiveMode(m, os === "reduce") !== "full")
        expect(f.every((s) => s.transform === "none" && s.filter === "none")).toBe(true);
      else expect(f.some((s) => s.animations.some((a) => a.property === "transform"))).toBe(true);
    });

for (const os of ["no-preference", "reduce"] as const)
  for (const m of MODES) {
    test(`CSS Preparing loop initial ${m}/${os}`, async ({ page }, info) => {
      await page.emulateMedia({ reducedMotion: os });
      await page.goto(`/components/progress?motion=${m}`);
      await page.waitForLoadState("networkidle");
      await record(page, '[aria-label="Preparing preview"] [data-slot="progress-indicator"]');
      await page.waitForTimeout(400);
      const f = await finish(page, info);
      expect(f.every((s) => s.mode === effectiveMode(m, os === "reduce"))).toBe(true);
      if (m === "none") expect(f.every((s) => s.animations.length === 0 && s.opacity === "1")).toBe(true);
      else {
        expect(new Set(f.map((s) => s.opacity)).size).toBeGreaterThan(3);
        expect(f.every((s) => s.animations.some((a) => a.kind === "CSSAnimation" && a.timing.duration === 2000))).toBe(
          true,
        );
      }
    });

    for (const mobile of [false, true])
      test(`CSS actual chevron ${mobile ? "Browse" : "group"} ${m}/${os}`, async ({ page }, info) => {
        await page.emulateMedia({ reducedMotion: os });
        if (mobile) await page.setViewportSize({ width: 390, height: 844 });
        await page.goto(`/components?motion=${m}&speed=0.25`);
        await page.waitForLoadState("networkidle");
        const toggle = mobile
          ? page.locator("summary").first()
          : page.locator("aside").getByRole("button", { name: /^Atoms/ });
        await toggle.locator("[data-motion]").evaluate((n) => n.setAttribute("data-css-chevron", ""));
        await record(page, "[data-css-chevron]");
        await toggle.evaluate((n: HTMLElement) => n.click());
        await page.waitForTimeout(130);
        await stage(page, "reversal");
        await toggle.evaluate((n: HTMLElement) => n.click());
        await page.waitForTimeout(100);
        if (effectiveMode(m, os === "reduce") === "full") {
          await stage(page, "reduced");
          await mode(page, "reduced");
          await expect(toggle.locator("[data-motion]")).toHaveAttribute("data-motion", "reduced");
        }
        await stage(page, "none");
        await mode(page, "none");
        await expect(toggle.locator("[data-motion]")).toHaveAttribute("data-motion", "none");
        await page.waitForTimeout(60);
        const f = await finish(page, info);
        const start = f.filter((s) => s.stage === "initial");
        if (effectiveMode(m, os === "reduce") === "full") {
          expect(start.some((s) => s.animations.some((a) => a.property === (mobile ? "rotate" : "transform")))).toBe(
            true,
          );
          expect(new Set(start.map((s) => (mobile ? s.rotate : s.transform))).size).toBeGreaterThan(3);
        } else expect(start.every((s) => s.animations.length === 0)).toBe(true);
        expect(new Set(f.map((s) => s.node)).size).toBe(1);
        expect(f.filter((s) => s.mode === "none").every((s) => s.animations.length === 0)).toBe(true);
      });
  }

for (const os of ["no-preference", "reduce"] as const)
  test(`CSS real Reveal entrance and downgrade ${os}`, async ({ page }, info) => {
    await page.emulateMedia({ reducedMotion: os });
    await page.goto("/components?motion=full&speed=0.25");
    await page.waitForLoadState("networkidle");
    const target = page.locator("aside [data-site-reveal]").last();
    await target.evaluate((n) => n.setAttribute("data-css-reveal", ""));
    await expect(target).toHaveCSS("opacity", "0");
    await record(page, "[data-css-reveal]");
    await target.evaluate((n) => n.scrollIntoView({ block: "center" }));
    await expect.poll(() => target.evaluate((n) => Number(getComputedStyle(n).opacity))).toBeGreaterThan(0);
    await stage(page, "reduced");
    await mode(page, "reduced");
    await expect(target).toHaveAttribute("data-motion", "reduced");
    await page.waitForTimeout(60);
    await stage(page, "none");
    await mode(page, "none");
    await expect(target).toHaveAttribute("data-motion", "none");
    await page.waitForTimeout(60);
    const f = await finish(page, info);
    expect(f.some((s) => Number(s.opacity) > 0 && Number(s.opacity) < 1)).toBe(true);
    if (os === "no-preference") expect(f.some((s) => s.animations.some((a) => a.property === "transform"))).toBe(true);
    expect(f.filter((s) => s.mode === "reduced").every((s) => s.transform === "none" && s.filter === "none")).toBe(
      true,
    );
    expect(f.filter((s) => s.mode === "none").every((s) => s.opacity === "1" && s.animations.length === 0)).toBe(true);
    expect(new Set(f.map((s) => s.node)).size).toBe(1);
  });

for (const id of ["accordion", "collapsible"])
  for (const next of ["reduced", "none"])
    test(`CSS disclosure running cancel ${id}/${next}`, async ({ page }, info) => {
      await page.goto(`/components/${id}?motion=full&speed=0.25`);
      await page.waitForLoadState("networkidle");
      const preview = page.locator(`[data-preview="${id}"]`);
      const trigger = preview.locator(`[data-slot="${id}-trigger"]`).first();
      const content = preview.locator(`[data-slot="${id}-content"]`).first();
      await mode(page, "none");
      if ((await trigger.getAttribute("aria-expanded")) === "true") await trigger.click();
      await expect(content).toHaveCount(0);
      await mode(page, "full");
      await record(page, `[data-preview="${id}"] [data-slot="${id}-content"]`);
      await trigger.evaluate((n: HTMLButtonElement) => n.click());
      await page.waitForTimeout(70);
      await stage(page, next);
      await mode(page, next);
      await expect(content).toHaveAttribute("data-motion", next);
      await page.waitForTimeout(60);
      const f = await finish(page, info);
      expect(f.some((s) => s.mode === "full" && s.animations.some((a) => a.property === "height"))).toBe(true);
      expect(f.filter((s) => s.mode === next).every((s) => s.animations.length === 0)).toBe(true);
    });

test("CSS Navigation popup active opacity none cancellation", async ({ page }, info) => {
  await openPopupMotionFixture(page, "navigation-menu", "full", 4);
  await page.waitForLoadState("networkidle");
  await record(page, '[data-slot="navigation-menu-popup"]');
  const preview = page.locator('[data-preview="navigation-menu"]');
  await preview.getByRole("button", { name: "Learn", exact: true }).evaluate((n: HTMLButtonElement) => n.click());
  const popup = page.locator('[data-slot="navigation-menu-popup"]');
  await expect(popup).toBeVisible();
  await page.waitForTimeout(40);
  await stage(page, "none");
  await change(page.getByLabel("Fixture motion", { exact: true }), "none");
  await expect(popup).toHaveAttribute("data-motion", "none");
  await page.waitForTimeout(60);
  const f = await finish(page, info);
  expect(f.some((s) => s.mode === "full" && s.animations.some((a) => a.property === "opacity"))).toBe(true);
  expect(f.filter((s) => s.mode === "none").every((s) => s.animations.length === 0 && s.opacity === "1")).toBe(true);
  expect(new Set(f.map((s) => s.node)).size).toBe(1);
});

test("CSS actual PreviewStack live same node", async ({ page }, info) => {
  await page.goto("/components/button?motion=full&speed=0.25");
  await page.waitForLoadState("networkidle");
  await record(page, '[data-preview="skeleton"] [data-preview-stack]');
  await page.locator('aside a[href="/components/skeleton"]').click();
  const stack = page.locator('[data-preview="skeleton"] [data-preview-stack]').first();
  await expect(stack).toHaveAttribute("data-motion", "full");
  await stage(page, "reduced");
  await mode(page, "reduced");
  await expect(stack).toHaveAttribute("data-motion", "reduced");
  await page.waitForTimeout(60);
  await stage(page, "none");
  await mode(page, "none");
  await expect(stack).toHaveAttribute("data-motion", "none");
  await page.waitForTimeout(60);
  const f = await finish(page, info);
  expect(f.some((s) => s.mode === "full" && s.animations.some((a) => a.property === "translate"))).toBe(true);
  expect(f.filter((s) => s.mode === "reduced").every((s) => s.translate === "none")).toBe(true);
  expect(f.some((s) => s.mode === "reduced" && s.animations.some((a) => a.property === "opacity"))).toBe(true);
  expect(f.filter((s) => s.mode === "none").every((s) => s.opacity === "1" && s.animations.length === 0)).toBe(true);
  expect(new Set(f.map((s) => s.node)).size).toBe(1);
});

for (const os of ["no-preference", "reduce"] as const)
  test(`CSS Content keepMounted exit reopen and live downgrade ${os}`, async ({ page }, info) => {
    await page.emulateMedia({ reducedMotion: os });
    await openPopupMotionFixture(page, "navigation-menu", "none", 4);
    await page.waitForLoadState("networkidle");
    const preview = page.locator('[data-preview="navigation-menu"]');
    await change(page.getByLabel("Fixture motion", { exact: true }), "full");
    const learn = preview.getByRole("button", { name: "Learn", exact: true });
    await learn.click();
    const content = page
      .locator('[data-slot="navigation-menu-content"]')
      .filter({ has: page.getByRole("link", { name: "Installation", exact: true, includeHidden: true }) });
    await expect(content).toBeVisible();
    await expect(content).toHaveAttribute("data-motion", os === "reduce" ? "reduced" : "full");
    await expect(content).toHaveCSS("transition-duration", os === "reduce" ? "0.384s" : "0.64s");
    await expect.poll(() => content.evaluate((n) => n.getAnimations().length)).toBe(0);
    await content.evaluate((n) => n.setAttribute("data-css-content", ""));
    await record(page, "[data-css-content]");
    await stage(page, "exit");
    await preview
      .getByRole("button", { name: "Switch panel", exact: true })
      .evaluate((n: HTMLButtonElement) => n.click());
    await page.waitForTimeout(90);
    await stage(page, "reopen");
    await preview
      .getByRole("button", { name: "Switch panel", exact: true })
      .evaluate((n: HTMLButtonElement) => n.click());
    await page.waitForTimeout(60);
    await stage(page, "reduced");
    await change(page.getByLabel("Fixture motion", { exact: true }), "reduced");
    await expect(content).toHaveAttribute("data-motion", "reduced");
    await page.waitForTimeout(40);
    await stage(page, "none");
    await change(page.getByLabel("Fixture motion", { exact: true }), "none");
    await expect(content).toHaveAttribute("data-motion", "none");
    await page.waitForTimeout(60);
    const f = await finish(page, info);
    expect(new Set(f.map((s) => s.node)).size).toBe(1);
    expect(f.some((s) => s.stage === "exit" && s.ending && Number(s.opacity) > 0 && Number(s.opacity) < 1)).toBe(true);
    expect(f.some((s) => s.stage === "reopen" && s.open && s.animations.length > 0)).toBe(true);
    expect(f.some((s) => s.mode === "reduced" && s.animations.some((a) => a.property === "opacity"))).toBe(true);
    expect(f.filter((s) => s.mode === "none").every((s) => s.animations.length === 0 && s.opacity === "1")).toBe(true);
    await page.keyboard.press("Escape");
    await expect(learn).toBeFocused();
    // keepMounted retains Content during a switch; closing the owning Portal unmounts it.
    await expect(content).toHaveCount(0);
    await record(page, '[data-slot="navigation-menu-content"]');
    await learn.press("Enter");
    await expect(content).toBeVisible();
    expect(await content.evaluate((n) => n.hasAttribute("data-css-content"))).toBe(false);
    await page.waitForTimeout(60);
    const reopened = await finish(page, info);
    expect(reopened.some((s) => s.open)).toBe(true);
    expect(
      reopened.filter((s) => s.open).every((s) => s.mode === "none" && s.opacity === "1" && s.animations.length === 0),
    ).toBe(true);
  });

test("CSS inherited running native clock identity and reversal", async ({ page }, info) => {
  await page.goto("/components/accordion?motion=full&speed=0.25");
  await page.waitForLoadState("networkidle");
  const preview = page.locator('[data-preview="accordion"]');
  const trigger = preview.getByRole("button", { name: "How do I install a component?" });
  const content = preview.locator('[data-slot="accordion-content"]').first();
  await expect.poll(() => content.evaluate((n) => n.getAnimations().length)).toBe(0);
  await content.evaluate((n) => n.setAttribute("data-css-clock", ""));
  await record(page, "[data-css-clock]");
  await trigger.evaluate((n: HTMLButtonElement) => n.click());
  await page.waitForTimeout(70);
  await stage(page, "clock");
  await page.getByLabel("Motion speed", { exact: true }).evaluate((n: HTMLButtonElement) => n.click());
  await page.getByRole("option", { name: "1×", exact: true }).evaluate((n: HTMLElement) => n.click());
  await page.waitForTimeout(70);
  await stage(page, "retarget");
  await trigger.evaluate((n: HTMLButtonElement) => n.click());
  await page.waitForTimeout(70);
  const f = await finish(page, info);
  const before = f
    .filter((s) => s.stage === "initial")
    .flatMap((s) => s.animations)
    .filter((a) => a.property === "height");
  const after = f
    .filter((s) => s.stage === "clock" && s.duration === "0.32s")
    .flatMap((s) => s.animations)
    .filter((a) => a.property === "height");
  expect(before.length).toBeGreaterThan(2);
  expect(after.length).toBeGreaterThan(2);
  expect(before.every((a) => a.timing.duration === 1280)).toBe(true);
  expect(after.every((a) => a.id === before[0]?.id && a.timing.duration === 1280)).toBe(true);
  const reversal = f
    .filter((s) => s.stage === "retarget")
    .flatMap((s) => s.animations)
    .filter((a) => a.property === "height");
  expect(reversal.length).toBeGreaterThan(0);
  expect(reversal.some((a) => a.id !== before[0]?.id && Number(a.timing.duration) <= 320)).toBe(true);
  expect(new Set(f.map((s) => s.node)).size).toBe(1);
});

for (const os of ["no-preference", "reduce"] as const)
  test(`CSS explicit nested clock under outer none ${os}`, async ({ page }, info) => {
    await page.emulateMedia({ reducedMotion: os });
    await page.goto("/components/date-picker?motion=none&speed=1");
    await page.waitForLoadState("networkidle");
    await record(page, '[data-slot="popover-content"]');
    await page
      .locator('[data-preview="date-picker"]')
      .getByRole("button", { name: /Appointment:/ })
      .click();
    await page.waitForTimeout(100);
    const popup = page.getByRole("dialog", { name: "Appointment" });
    await expect(popup).toHaveAttribute("data-motion", os === "reduce" ? "reduced" : "full");
    await expect(popup).toHaveCSS("transition-duration", os === "reduce" ? "0.384s" : "0.64s");
    const f = await finish(page, info);
    expect(
      f.some((s) =>
        s.animations.some((a) => a.property === "opacity" && a.timing.duration === (os === "reduce" ? 384 : 640)),
      ),
    ).toBe(true);
    expect(f.some((s) => Number(s.opacity) > 0 && Number(s.opacity) < 1)).toBe(true);
    if (os === "reduce") expect(f.every((s) => !s.animations.some((a) => a.property === "scale"))).toBe(true);
    else expect(f.some((s) => s.animations.some((a) => a.property === "scale"))).toBe(true);
  });
