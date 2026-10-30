import { expect, type Page } from "@playwright/test";

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
export async function openComponent(page: Page, id: string, requested: Mode, slot: string, expected: Mode = requested) {
  await page.goto(`/components/${id}?motion=${requested}`);
  // The mode arrives after hydration, and hydration waits for this route's client
  // chunks; under parallel workers that is occasionally slower than the default
  // assertion timeout. The assertion itself stays exact.
  await expect(page.locator(scoped(id, `[data-slot="${slot}"]`)).first()).toHaveAttribute("data-motion", expected, {
    timeout: 15_000,
  });
  // `data-motion` is the *server* value too in the `full` + no-preference cell, so
  // the assertion above can pass before React has attached a single handler and the
  // click that follows becomes a no-op. Network idle means this route's chunks have
  // arrived; waiting for it is what makes that cell deterministic.
  await page.waitForLoadState("networkidle");
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
 * Reading *during* the press is deterministic; sampling a window from the test
 * side races the gesture and loses. Motion reaches the press scale in well under
 * the 350 ms held here.
 */
export async function pressScale(page: Page, selector: string): Promise<number> {
  const target = page.locator(selector).first();
  const box = await target.boundingBox();
  if (!box) throw new Error(`nothing to press at ${selector}`);

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(350);
  const scale = await target.evaluate((element) => {
    const transform = getComputedStyle(element).transform;
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
