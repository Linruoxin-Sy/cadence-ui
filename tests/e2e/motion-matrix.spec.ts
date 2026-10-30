import { expect, test } from "@playwright/test";
import {
  computed,
  effectiveMode,
  MODES,
  openComponent,
  pressScale,
  recordedScale,
  recordScale,
  scoped,
} from "./helpers";

/**
 * The 3 × 2 matrix from `docs/animation-system.md` §9: three modes against two
 * system preferences. Every cell is a pair of facts — which mode the component
 * reports, and whether the motion property is really in the computed style.
 *
 * `?motion=` drives the requested mode; `test.use({ reducedMotion })` drives the
 * OS preference the provider itself honours.
 */
const PREFERENCES = [false, true] as const;
const preferenceName = (prefersReduced: boolean) =>
  prefersReduced ? "prefers-reduced-motion: reduce" : "prefers-reduced-motion: no-preference";

test.describe("button", () => {
  for (const prefersReduced of PREFERENCES) {
    test.describe(preferenceName(prefersReduced), () => {
      test.use({ reducedMotion: prefersReduced ? "reduce" : "no-preference" });

      for (const requested of MODES) {
        const mode = effectiveMode(requested, prefersReduced);

        test(`reports ${mode} for ?motion=${requested}`, async ({ page }) => {
          await openComponent(page, "button", requested, "button", mode);
          await expect(page.getByRole("button", { name: "Button", exact: true })).toHaveAttribute("data-motion", mode);
        });

        test(`press scale: ?motion=${requested} → ${mode}`, async ({ page }) => {
          await openComponent(page, "button", requested, "button", mode);
          const scale = await pressScale(page, scoped("button", '[data-slot="button"]'));

          if (mode === "full") {
            // `scale.press` is 0.97; a spring that has not quite arrived is still a
            // press, so the assertion is "visibly below 1", not "exactly 0.97".
            expect(scale).toBeLessThan(0.99);
          } else {
            expect(scale).toBe(1);
          }
        });
      }
    });
  }
});

test.describe("dialog", () => {
  for (const prefersReduced of PREFERENCES) {
    test.describe(preferenceName(prefersReduced), () => {
      test.use({ reducedMotion: prefersReduced ? "reduce" : "no-preference" });

      for (const requested of MODES) {
        const mode = effectiveMode(requested, prefersReduced);

        test(`opening: ?motion=${requested} → ${mode}`, async ({ page }) => {
          await recordScale(page, '[data-slot="dialog-content"]');
          await openComponent(page, "dialog", requested, "dialog-trigger", mode);

          await page.getByRole("button", { name: "Rename project" }).click();
          await expect(page.getByRole("dialog", { name: "Rename project" })).toBeVisible();
          await page.waitForTimeout(300);

          const popup = page.locator('[data-slot="dialog-content"]');
          await expect(popup).toHaveAttribute("data-motion", mode);

          // Durations come from the tokens the component is wired to, so this also
          // proves `none` zeroes them instead of falling back to `reduced`.
          expect(await computed(page, '[data-slot="dialog-content"]', "transition-duration")).toBe(
            { full: "0.22s", reduced: "0.132s", none: "0s" }[mode],
          );
          expect(await computed(page, '[data-slot="dialog-overlay"]', "transition-duration")).toBe(
            { full: "0.16s", reduced: "0.096s", none: "0s" }[mode],
          );

          const enter = await recordedScale(page);
          expect(enter.frames).toBeGreaterThan(3);
          if (mode === "full") expect(enter.min).toBeLessThan(0.99);
          else expect(enter.min).toBe(1);
        });
      }
    });
  }

  test.describe("reduced keeps the fade and drops only the scale", () => {
    test.use({ reducedMotion: "reduce" });

    test("the panel fades without the 0.96 settle", async ({ page }) => {
      await recordScale(page, '[data-slot="dialog-content"]');
      await openComponent(page, "dialog", "reduced", "dialog-trigger");
      await page.getByRole("button", { name: "Rename project" }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.waitForTimeout(300);

      expect(await computed(page, '[data-slot="dialog-content"]', "transition-property")).toContain("opacity");
      expect(await computed(page, '[data-slot="dialog-content"]', "transition-duration")).toBe("0.132s");
      expect((await recordedScale(page)).min).toBe(1);
    });
  });
});

test.describe("alert-dialog", () => {
  // A second overlay in the matrix on purpose: it shares the dialog's popup CSS but
  // not its markup, so a token or a `data-*-style` regression would show up in only
  // one of the two files if this block did not exist.
  for (const prefersReduced of PREFERENCES) {
    test.describe(preferenceName(prefersReduced), () => {
      test.use({ reducedMotion: prefersReduced ? "reduce" : "no-preference" });

      for (const requested of MODES) {
        const mode = effectiveMode(requested, prefersReduced);

        test(`opening: ?motion=${requested} → ${mode}`, async ({ page }) => {
          await recordScale(page, '[data-slot="alert-dialog-content"]');
          await openComponent(page, "alert-dialog", requested, "alert-dialog-trigger", mode);

          await page.locator(scoped("alert-dialog", '[data-slot="alert-dialog-trigger"]')).first().click();
          await expect(page.getByRole("alertdialog")).toBeVisible();
          await page.waitForTimeout(300);

          const popup = page.locator('[data-slot="alert-dialog-content"]');
          await expect(popup).toHaveAttribute("data-motion", mode);

          // The same duration tokens as `dialog`: `none` must zero them on the
          // element, not fall back to the reduced values.
          expect(await computed(page, '[data-slot="alert-dialog-content"]', "transition-duration")).toBe(
            { full: "0.22s", reduced: "0.132s", none: "0s" }[mode],
          );
          expect(await computed(page, '[data-slot="alert-dialog-overlay"]', "transition-duration")).toBe(
            { full: "0.16s", reduced: "0.096s", none: "0s" }[mode],
          );

          const enter = await recordedScale(page);
          expect(enter.frames).toBeGreaterThan(3);
          if (mode === "full") expect(enter.min).toBeLessThan(0.99);
          else expect(enter.min).toBe(1);
        });
      }
    });
  }

  test.describe("reduced keeps the fade and drops only the scale", () => {
    test.use({ reducedMotion: "reduce" });

    test("the panel fades without the 0.96 settle", async ({ page }) => {
      await recordScale(page, '[data-slot="alert-dialog-content"]');
      await openComponent(page, "alert-dialog", "reduced", "alert-dialog-trigger");
      await page.locator(scoped("alert-dialog", '[data-slot="alert-dialog-trigger"]')).first().click();
      await expect(page.getByRole("alertdialog")).toBeVisible();
      await page.waitForTimeout(300);

      expect(await computed(page, '[data-slot="alert-dialog-content"]', "transition-property")).toContain("opacity");
      expect(await computed(page, '[data-slot="alert-dialog-content"]', "transition-duration")).toBe("0.132s");
      expect((await recordedScale(page)).min).toBe(1);
    });
  });
});

test.describe("popover", () => {
  // The first anchored panel in the matrix: it animates the scale from
  // `--transform-origin` instead of the dialog's fixed centre, and it is the first
  // component to read `--motion-scale-in`, so `none` and `reduced` are asserted on
  // the same element that carries the transform.
  for (const prefersReduced of PREFERENCES) {
    test.describe(preferenceName(prefersReduced), () => {
      test.use({ reducedMotion: prefersReduced ? "reduce" : "no-preference" });

      for (const requested of MODES) {
        const mode = effectiveMode(requested, prefersReduced);

        test(`opening: ?motion=${requested} → ${mode}`, async ({ page }) => {
          await recordScale(page, '[data-slot="popover-content"]');
          await openComponent(page, "popover", requested, "popover-trigger", mode);

          await page.locator(scoped("popover", '[data-slot="popover-trigger"]')).first().click();
          await expect(page.getByRole("dialog")).toBeVisible();
          await page.waitForTimeout(300);

          const popup = page.locator('[data-slot="popover-content"]');
          await expect(popup).toHaveAttribute("data-motion", mode);
          expect(await computed(page, '[data-slot="popover-content"]', "transition-duration")).toBe(
            { full: "0.16s", reduced: "0.096s", none: "0s" }[mode],
          );

          const enter = await recordedScale(page);
          expect(enter.frames).toBeGreaterThan(3);
          if (mode === "full") expect(enter.min).toBeLessThan(0.99);
          else expect(enter.min).toBe(1);
        });
      }
    });
  }

  test.describe("reduced keeps the fade and drops only the scale", () => {
    test.use({ reducedMotion: "reduce" });

    test("the panel fades without the 0.96 settle", async ({ page }) => {
      await recordScale(page, '[data-slot="popover-content"]');
      await openComponent(page, "popover", "reduced", "popover-trigger");
      await page.locator(scoped("popover", '[data-slot="popover-trigger"]')).first().click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.waitForTimeout(300);

      expect(await computed(page, '[data-slot="popover-content"]', "transition-property")).toContain("opacity");
      expect(await computed(page, '[data-slot="popover-content"]', "transition-duration")).toBe("0.096s");
      expect((await recordedScale(page)).min).toBe(1);
    });
  });
});

test.describe("switch", () => {
  for (const prefersReduced of PREFERENCES) {
    test.describe(preferenceName(prefersReduced), () => {
      test.use({ reducedMotion: prefersReduced ? "reduce" : "no-preference" });

      for (const requested of MODES) {
        const mode = effectiveMode(requested, prefersReduced);

        test(`thumb travel: ?motion=${requested} → ${mode}`, async ({ page }) => {
          await openComponent(page, "switch", requested, "switch", mode);
          const thumb = page.locator('[data-slot="switch-thumb"]').nth(1);
          const x = () => thumb.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m41);

          const start = await x();
          await page.getByRole("switch", { name: "Deploy alerts" }).click();
          await page.waitForTimeout(450);

          expect(await x()).toBeGreaterThan(start);
        });
      }
    });
  }

  test("an initially checked switch is already at its end position on the first frame", async ({ page }) => {
    // The thumb measures its travel in a layout effect, so the first render has no
    // distance to apply. If that zero is animated to the measured value, a checked
    // switch visibly slides on every load — which it did, 12.8px, before this test.
    await page.addInitScript(() => {
      const samples: number[] = [];
      (window as unknown as { __thumbSamples: number[] }).__thumbSamples = samples;
      const tick = () => {
        const thumb = document.querySelector('[data-slot="switch-thumb"]');
        if (thumb) {
          const transform = getComputedStyle(thumb).transform;
          samples.push(transform === "none" ? 0 : new DOMMatrixReadOnly(transform).m41);
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });

    await page.goto("/components/switch?motion=full");
    await expect(page.locator(scoped("switch", '[data-slot="switch"]')).first()).toHaveAttribute("data-motion", "full");
    await page.waitForTimeout(600);

    const samples = await page.evaluate(() => (window as unknown as { __thumbSamples: number[] }).__thumbSamples);
    expect(samples.length).toBeGreaterThan(3);
    const positioned = samples.filter((value) => value > 1);
    expect(positioned.length).toBeGreaterThan(0);
    expect(Math.max(...positioned) - Math.min(...positioned)).toBeLessThan(0.5);
  });
});

test.describe("progress", () => {
  for (const prefersReduced of PREFERENCES) {
    test.describe(preferenceName(prefersReduced), () => {
      test.use({ reducedMotion: prefersReduced ? "reduce" : "no-preference" });

      for (const requested of MODES) {
        const mode = effectiveMode(requested, prefersReduced);

        test(`fill: ?motion=${requested} → ${mode}`, async ({ page }) => {
          await openComponent(page, "progress", requested, "progress", mode);
          const indicator = page.locator('[data-slot="progress-indicator"]').first();
          await expect(page.locator(scoped("progress", '[data-slot="progress"]')).first()).toHaveAttribute(
            "data-motion",
            mode,
          );

          // The fill is a `scaleX` on a full-width element: a width transition would
          // relayout the track on every frame. Base UI writes `width: <n>%` itself,
          // so this also pins which side wins the style merge.
          const { width, scale } = await indicator.evaluate((element) => ({
            width: (element as HTMLElement).style.width,
            scale: new DOMMatrixReadOnly(getComputedStyle(element).transform).a,
          }));
          expect(width).toBe("100%");
          expect(scale).toBeGreaterThan(0);
          expect(scale).toBeLessThan(1);
        });
      }
    });
  }
});

/** Guards the one thing the matrix cannot: that a mode is reachable without a URL. */
test("the header switch drives the same modes the URL does", async ({ page }) => {
  await page.goto("/components/button");
  const group = page.getByRole("group", { name: "Motion mode" });
  await group.getByRole("button", { name: "none" }).click();
  await expect(page).toHaveURL(/motion=none/);
  await expect(page.locator(scoped("button", '[data-slot="button"]')).first()).toHaveAttribute("data-motion", "none");
});
