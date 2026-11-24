import { expect, type Locator, test } from "@playwright/test";
import { MODES, type Mode } from "./helpers";

/**
 * Avatar's explicit size change is a measured geometry interpolation, not a CSS
 * jump (`avatar.root.resize` → `geometry.compact` → `geometry.resize/measured`).
 *
 * jsdom cannot prove it: with no layout the origin and the destination are both
 * zero, so the unit test sees an empty 0 → 0 flight either way. The assertion
 * here is therefore a real-engine frame series: the root box must cross the
 * distance instead of arriving in the first frame, and the mode contract must
 * still land instantly outside `full`.
 */
const EXAMPLE = '[data-component-example="avatar/changing"]';

type Frame = { width: number; animations: number };

/** Click "Toggle size" and record the root border box on every animation frame. */
async function toggleAndSample(frame: Locator, count: number, mode: Mode) {
  return frame.evaluate(
    async (node, options) => {
      const button = [...node.querySelectorAll("button")].find((item) => item.textContent === "Toggle size");
      const avatar = node.querySelector('[data-slot="avatar"]');
      if (!button || !avatar) throw new Error(`avatar/changing is incomplete for ${options.mode}`);
      const frames: Frame[] = [];
      button.click();
      for (let index = 0; index < options.count; index++) {
        await new Promise(requestAnimationFrame);
        const keyframes = (animation: Animation) => (animation.effect as KeyframeEffect | null)?.getKeyframes?.() ?? [];
        frames.push({
          width: Math.round(avatar.getBoundingClientRect().width * 100) / 100,
          animations: avatar
            .getAnimations({ subtree: true })
            .filter((animation) => keyframes(animation).some((keyframe) => "width" in keyframe || "height" in keyframe))
            .length,
        });
      }
      await new Promise((resolve) => setTimeout(resolve, 400));
      return {
        frames,
        size: avatar.getAttribute("data-size"),
        final: avatar.getBoundingClientRect().width,
      };
    },
    { count, mode },
  );
}

const widthOf = (locator: Locator) => locator.evaluate((node) => node.getBoundingClientRect().width);

for (const mode of MODES)
  test(`Avatar root resize walks the measured box in ${mode}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(`/components/avatar?motion=${mode}`);
    await page.waitForLoadState("networkidle");

    const frame = page.locator(EXAMPLE);
    const avatar = frame.locator('[data-slot="avatar"]');
    const toggle = frame.getByRole("button", { name: "Toggle size", exact: true });
    await expect(avatar).toHaveAttribute("data-motion", mode);
    await expect(avatar).toHaveAttribute("data-size", "default");
    expect(await widthOf(avatar)).toBe(32);

    // Two clicks prove the control is hydrated before the sampled run starts;
    // their own flights are not the assertion, so a slow first paint cannot
    // silently turn the sample into a no-op.
    await toggle.click();
    await expect(avatar).toHaveAttribute("data-size", "lg");
    await expect.poll(() => widthOf(avatar)).toBe(40);
    await toggle.click();
    await expect(avatar).toHaveAttribute("data-size", "default");
    await expect.poll(() => widthOf(avatar)).toBe(32);

    const run = await toggleAndSample(frame, mode === "full" ? 60 : 10, mode);
    expect(run.size).toBe("lg");
    expect(run.final).toBe(40);
    const widths = run.frames.map((sample) => sample.width);
    const between = widths.filter((width) => width > 32.5 && width < 39.5);

    if (mode === "full") {
      // 32 → 40 is eight pixels; a one-frame jump has no intermediate frame at all.
      expect(between.length).toBeGreaterThanOrEqual(3);
      expect(widths[0]).toBeLessThan(36);
      // The walk is the adapter's own WAAPI overlay, inspected on the root.
      expect(run.frames.some((sample) => sample.animations > 0)).toBe(true);
      expect(widths.at(-1)).toBe(40);
      expect(await avatar.evaluate((node) => node.getAnimations({ subtree: true }).length)).toBe(0);
    } else {
      // reduced and none reach the semantic target in the first sampled frame.
      expect(between).toHaveLength(0);
      expect(Math.min(...widths)).toBe(40);
      expect(run.frames.every((sample) => sample.animations === 0)).toBe(true);
    }
  });
