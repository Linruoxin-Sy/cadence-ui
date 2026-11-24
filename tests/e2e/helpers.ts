import { expect, type Locator, type Page } from "@playwright/test";

export const MODES = ["full", "reduced", "none"] as const;
export type Mode = (typeof MODES)[number];

/**
 * The mode a component actually resolves to, following `CadenceProvider`'s
 * precedence: an explicit `none` wins over everything, otherwise a system
 * `prefers-reduced-motion` setting wins over `full`.
 */
export function effectiveMode(requested: Mode, prefersReduced: boolean): Mode {
  if (requested === "none") return "none";
  return prefersReduced ? "reduced" : requested;
}

/**
 * Scopes a selector to one component's preview frame. The header also renders
 * `[data-slot="button"]` (the mode switch and the theme toggle), so selecting by
 * slot alone silently asserts against the chrome, not the component.
 */
export function scoped(id: string, selector: string): string {
  return `[data-preview="${id}"] ${selector}`;
}

/**
 * Opens a component page with the mode in the URL and waits for the resolved mode to
 * reach the DOM. The mode arrives through an effect (the provider reads `?motion=` on
 * mount), so the server-rendered HTML is always `full`.
 *
 * `requested` is what the URL asks for; `expected` is what the provider resolves it to.
 * They differ whenever the system preference forces `reduced` over `full`, so callers
 * that know the cell of the 3 × 2 matrix must pass both.
 */
export async function openComponent(
  page: Page,
  id: string,
  requested: Mode,
  slot: string,
  expected: Mode = requested,
  readiness: { inheritedMode?: boolean } = {},
) {
  await page.goto(`/components/${id}?motion=${requested}`);
  // The mode arrives after hydration, and hydration waits for this route's client
  // chunks; under parallel workers that is occasionally slower than the default
  // assertion timeout. The assertion itself stays exact.
  // Only explicitly opted-in native triggers inherit their owner's mode. Animated
  // parts retain the direct attribute assertion; popup assertions follow opening.
  const part = page.locator(scoped(id, `[data-slot="${slot}"]`)).first();
  const owner = readiness.inheritedMode ? part.locator("xpath=ancestor-or-self::*[@data-motion][1]") : part;
  await expect(owner).toHaveAttribute("data-motion", expected, {
    timeout: 15_000,
  });
  // `data-motion` is the *server* value too in the `full` + no-preference cell, so
  // the assertion above can pass before React has attached a single handler and the
  // click that follows becomes a no-op. Network idle means this route's chunks have
  // arrived; waiting for it is what makes that cell deterministic.
  await page.waitForLoadState("networkidle");
}

/**
 * Waits until a native range's input events reach the component's state.
 *
 * `data-motion` is server-rendered, so in the `full` + no-preference cell it cannot tell
 * "hydrated" from "not yet": React hydrates this long docs page progressively and
 * `networkidle` can arrive first, leaving the range as a plain input whose value never
 * reaches the owner. A keyboard nudge is the probe least likely to disturb the thing
 * under test — pressing right must move the progressbar by one step and pressing left
 * must restore it, which only happens once the controlling component is mounted. It
 * does not touch the motion mode, so the animation that follows stays a first-party
 * observation instead of a post-probe artifact.
 */
export async function awaitRangeStepper(range: Locator, progressbar: Locator) {
  const start = await range.inputValue();
  await range.focus();
  await expect
    .poll(
      async () => {
        await range.press("ArrowRight");
        return progressbar.getAttribute("aria-valuenow");
      },
      { timeout: 20_000 },
    )
    .toBe(String(Number(start) + 1));
  await expect
    .poll(
      async () => {
        await range.press("ArrowLeft");
        return progressbar.getAttribute("aria-valuenow");
      },
      { timeout: 20_000 },
    )
    .toBe(start);
}

/** One computed property, resolved by the engine rather than by jsdom's empty defaults. */
export async function computed(page: Page, selector: string, property: string): Promise<string> {
  return page
    .locator(selector)
    .first()
    .evaluate((element, name) => getComputedStyle(element).getPropertyValue(name), property);
}

/**
 * Presses and holds a control, then reports the scale it holds while pressed.
 *
 * `target` is the host that owns the property under test: Button's `button-feedback` layer when
 * a press pose is expected, or the native root when the assertion is that it stays at rest. A
 * `Locator` is accepted as well, so the sampled element cannot drift to a sibling that happens
 * to match a page-wide selector first.
 *
 * Reading *during* the press is deterministic; sampling a window from the test
 * side races the gesture and loses. Motion reaches the press scale in well under
 * the 350 ms held here.
 */
export async function pressScale(page: Page, target: string | Locator): Promise<number> {
  const element = (typeof target === "string" ? page.locator(target) : target).first();
  const box = await element.boundingBox();
  if (!box) throw new Error(`nothing to press at ${typeof target === "string" ? target : "the passed locator"}`);

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(350);
  const scale = await element.evaluate((node) => {
    const transform = getComputedStyle(node).transform;
    return transform === "none" ? 1 : new DOMMatrixReadOnly(transform).a;
  });
  await page.mouse.up();
  return scale;
}

/**
 * Records the scale of an element on every frame, starting before the page loads.
 *
 * For a popup there is no element to attach to until it opens, and a sampler
 * started after the click loses the frames that matter: `data-starting-style` is
 * exactly one paint. Recording from `addInitScript` misses nothing.
 */
export async function recordScale(page: Page, selector: string) {
  await page.addInitScript((target) => {
    const store = window as unknown as { __scaleSamples: number[] };
    store.__scaleSamples = [];
    const tick = () => {
      const element = document.querySelector(target);
      if (element) {
        const style = getComputedStyle(element);
        // Tailwind v4's `scale-*` utilities write the independent `scale` property,
        // not `transform`; a component may use either. Read whichever is set.
        const scale = style.scale;
        const transform = style.transform;
        const value =
          scale && scale !== "none"
            ? Number.parseFloat(scale)
            : transform === "none"
              ? 1
              : new DOMMatrixReadOnly(transform).a;
        store.__scaleSamples.push(value);
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, selector);
}

export async function recordedScale(page: Page): Promise<{ min: number; max: number; frames: number }> {
  const samples = await page.evaluate(() => (window as unknown as { __scaleSamples: number[] }).__scaleSamples);
  return {
    min: samples.length ? Math.min(...samples) : Number.POSITIVE_INFINITY,
    max: samples.length ? Math.max(...samples) : 0,
    frames: samples.length,
  };
}

/**
 * Records the presence writer a surface actually starts, and under which phase.
 *
 * A modal panel's entrance is a Web Animation (`createModalPresence`), not a CSS
 * transition: `dialog-content` deliberately carries no `transition` shorthand, so
 * `transition-duration` describes a colour clock rather than the presence. Reading the
 * calls themselves is the only way to tell "the declared envelope ran" from "nothing
 * started": the returned clock is the one the recipe resolved, and the property list is
 * which half of `enter.pop/surface` the mode selected.
 *
 * Recording starts before the page loads because the envelope can be settled by Base
 * UI's own initial focus a few frames after mount; a sampler started after the click
 * would race it. `markPresencePhase` labels what follows, so one recording can prove a
 * first open and a reopen separately.
 */
export async function recordPresence(page: Page, selector: string) {
  await page.addInitScript((target: string) => {
    const store = window as unknown as {
      __presenceCalls: { phase: string; slot: string; duration: number; properties: string[] }[];
      __presencePhase: string;
    };
    store.__presenceCalls = [];
    store.__presencePhase = "initial";
    const animate = Element.prototype.animate;
    Element.prototype.animate = function patched(
      this: Element,
      keyframes: Keyframe[] | PropertyIndexedKeyframes,
      timing: number | KeyframeAnimationOptions,
    ) {
      if (this.matches(target)) {
        const frames = Array.isArray(keyframes) ? keyframes : [keyframes];
        const properties = [
          ...new Set(
            frames.flatMap((frame) =>
              Object.keys(frame ?? {}).filter(
                (key) => !["offset", "computedOffset", "easing", "composite"].includes(key),
              ),
            ),
          ),
        ].sort();
        store.__presenceCalls.push({
          phase: store.__presencePhase,
          slot: this.getAttribute("data-slot") ?? "",
          duration: typeof timing === "number" ? timing : Number(timing?.duration ?? 0),
          properties,
        });
      }
      return animate.call(this, keyframes, timing);
    } as typeof Element.prototype.animate;
  }, selector);
}

/** Labels the calls that follow, so a reopen is not counted as part of the first open. */
export async function markPresencePhase(page: Page, phase: string) {
  await page.evaluate((value) => {
    (window as unknown as { __presencePhase: string }).__presencePhase = value;
  }, phase);
}

/**
 * The clocks one surface started in one phase, split by the property each one writes.
 *
 * `enter.pop/surface` is opacity plus the `scale.in` envelope, `enter.pop/opacity` is the
 * stationary fade a backdrop and a reduced panel keep. The two lists are separate because
 * they are separate writers on separate properties.
 */
export async function recordedPresence(
  page: Page,
  phase: string,
  slot: string,
): Promise<{ opacity: number[]; spatial: number[] }> {
  const calls = await page.evaluate(
    () =>
      (
        window as unknown as {
          __presenceCalls: { phase: string; slot: string; duration: number; properties: string[] }[];
        }
      ).__presenceCalls,
  );
  const mine = calls.filter((call) => call.phase === phase && call.slot === slot);
  return {
    opacity: mine.filter((call) => call.properties.includes("opacity")).map((call) => call.duration),
    spatial: mine.filter((call) => call.properties.includes("transform")).map((call) => call.duration),
  };
}

/**
 * T0 surfaces may animate color/shadow feedback, never authored motion or geometry.
 *
 * `data-motion` is mandatory on every animated part (AGENTS.md, motion conformance item 4),
 * so after the v2 migrations a static surface declares the mode it resolved to — `none` after a
 * live downgrade, `full` or `reduced` from the route — instead of carrying no attribute at all.
 * "Static" therefore means *declared mode + no authored property in flight*, not "the attribute
 * is missing": the absence shape is pre-migration and no longer describes this DOM.
 */
export async function expectStaticSurface(surface: Locator, mode: Mode) {
  const observed = await surface.evaluateAll((nodes) =>
    nodes.map((node) => ({
      motion: node.getAttribute("data-motion"),
      properties: node
        .getAnimations()
        .map((animation) =>
          animation instanceof CSSTransition ? animation.transitionProperty : animation.constructor.name,
        ),
    })),
  );
  for (const node of observed) {
    expect(node.motion).toBe(mode);
    for (const property of node.properties)
      expect([
        "color",
        "background-color",
        "border-color",
        "border-top-color",
        "border-right-color",
        "border-bottom-color",
        "border-left-color",
        "box-shadow",
      ]).toContain(property);
  }
}
