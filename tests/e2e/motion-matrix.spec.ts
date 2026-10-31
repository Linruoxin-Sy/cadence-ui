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

test.describe("tooltip", () => {
  // Hover, not click: a tooltip is the one popup in the matrix that opens with a
  // pointer move, and it is also the component whose `aria-describedby` only exists
  // while the popup does.
  for (const prefersReduced of PREFERENCES) {
    test.describe(preferenceName(prefersReduced), () => {
      test.use({ reducedMotion: prefersReduced ? "reduce" : "no-preference" });

      for (const requested of MODES) {
        const mode = effectiveMode(requested, prefersReduced);

        test(`opening: ?motion=${requested} → ${mode}`, async ({ page }) => {
          await recordScale(page, '[data-slot="tooltip-content"]');
          await openComponent(page, "tooltip", requested, "tooltip-trigger", mode);

          await page.locator(scoped("tooltip", '[data-slot="tooltip-trigger"]')).first().hover();
          await expect(page.getByRole("tooltip")).toBeVisible();
          await page.waitForTimeout(300);

          const popup = page.locator('[data-slot="tooltip-content"]');
          await expect(popup).toHaveAttribute("data-motion", mode);
          expect(await computed(page, '[data-slot="tooltip-content"]', "transition-duration")).toBe(
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

    test("the label fades without the 0.96 settle", async ({ page }) => {
      await recordScale(page, '[data-slot="tooltip-content"]');
      await openComponent(page, "tooltip", "reduced", "tooltip-trigger");
      await page.locator(scoped("tooltip", '[data-slot="tooltip-trigger"]')).first().hover();
      await expect(page.getByRole("tooltip")).toBeVisible();
      await page.waitForTimeout(300);

      expect(await computed(page, '[data-slot="tooltip-content"]', "transition-property")).toContain("opacity");
      expect(await computed(page, '[data-slot="tooltip-content"]', "transition-duration")).toBe("0.096s");
      expect((await recordedScale(page)).min).toBe(1);
    });
  });
});

test.describe("hover-card", () => {
  // The third anchored panel, and the only one with no role: its content is not a
  // description, so the assertions target the content slot rather than a role.
  for (const prefersReduced of PREFERENCES) {
    test.describe(preferenceName(prefersReduced), () => {
      test.use({ reducedMotion: prefersReduced ? "reduce" : "no-preference" });

      for (const requested of MODES) {
        const mode = effectiveMode(requested, prefersReduced);

        test(`opening: ?motion=${requested} → ${mode}`, async ({ page }) => {
          await recordScale(page, '[data-slot="hover-card-content"]');
          await openComponent(page, "hover-card", requested, "hover-card-trigger", mode);

          await page.locator(scoped("hover-card", '[data-slot="hover-card-trigger"]')).first().hover();
          await expect(page.locator('[data-slot="hover-card-content"]')).toBeVisible();
          await page.waitForTimeout(300);

          const popup = page.locator('[data-slot="hover-card-content"]');
          await expect(popup).toHaveAttribute("data-motion", mode);
          expect(await computed(page, '[data-slot="hover-card-content"]', "transition-duration")).toBe(
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
      await recordScale(page, '[data-slot="hover-card-content"]');
      await openComponent(page, "hover-card", "reduced", "hover-card-trigger");
      await page.locator(scoped("hover-card", '[data-slot="hover-card-trigger"]')).first().hover();
      await expect(page.locator('[data-slot="hover-card-content"]')).toBeVisible();
      await page.waitForTimeout(300);

      expect(await computed(page, '[data-slot="hover-card-content"]', "transition-property")).toContain("opacity");
      expect(await computed(page, '[data-slot="hover-card-content"]', "transition-duration")).toBe("0.096s");
      expect((await recordedScale(page)).min).toBe(1);
    });
  });
});

test.describe("sheet", () => {
  // A dialog popup that moves: the panel slides by `translate`, not `scale`, so this
  // block pins the duration tokens and proves the panel lands flush against its edge
  // in every mode. The unit test owns the per-side class branch.
  for (const prefersReduced of PREFERENCES) {
    test.describe(preferenceName(prefersReduced), () => {
      test.use({ reducedMotion: prefersReduced ? "reduce" : "no-preference" });

      for (const requested of MODES) {
        const mode = effectiveMode(requested, prefersReduced);

        test(`opening: ?motion=${requested} → ${mode}`, async ({ page }) => {
          await openComponent(page, "sheet", requested, "sheet-trigger", mode);

          await page.locator(scoped("sheet", '[data-slot="sheet-trigger"]')).first().click();
          await expect(page.getByRole("dialog")).toBeVisible();
          await page.waitForTimeout(400);

          const sheet = page.locator('[data-slot="sheet-content"]');
          await expect(sheet).toHaveAttribute("data-motion", mode);
          await expect(sheet).toHaveAttribute("data-side", "right");
          expect(await computed(page, '[data-slot="sheet-content"]', "transition-duration")).toBe(
            { full: "0.22s", reduced: "0.132s", none: "0s" }[mode],
          );
          expect(await computed(page, '[data-slot="sheet-overlay"]', "transition-duration")).toBe(
            { full: "0.16s", reduced: "0.096s", none: "0s" }[mode],
          );

          // Settled: nothing is left to translate, and the panel is flush with the
          // right edge at every mode — the slide is entry dressing, not position.
          expect(await computed(page, '[data-slot="sheet-content"]', "translate")).toBe("none");
          const box = await sheet.boundingBox();
          const width = await page.evaluate(() => window.innerWidth);
          expect(Math.abs((box?.x ?? 0) + (box?.width ?? 0) - width)).toBeLessThan(1);
        });
      }
    });
  }
});

test.describe("drawer", () => {
  // The one component whose motion is partly the user's: the matrix pins the token
  // durations and the settled position, while the drag itself is Base UI's swipe
  // variables and is asserted through the class branch in the unit test.
  for (const prefersReduced of PREFERENCES) {
    test.describe(preferenceName(prefersReduced), () => {
      test.use({ reducedMotion: prefersReduced ? "reduce" : "no-preference" });

      for (const requested of MODES) {
        const mode = effectiveMode(requested, prefersReduced);

        test(`opening: ?motion=${requested} → ${mode}`, async ({ page }) => {
          await openComponent(page, "drawer", requested, "drawer-trigger", mode);

          await page.locator(scoped("drawer", '[data-slot="drawer-trigger"]')).first().click();
          await expect(page.getByRole("dialog")).toBeVisible();
          await page.waitForTimeout(500);

          const popup = page.locator('[data-slot="drawer-popup"]');
          await expect(popup).toHaveAttribute("data-motion", mode);
          expect(await computed(page, '[data-slot="drawer-popup"]', "transition-duration")).toBe(
            { full: "0.32s", reduced: "0.192s", none: "0s" }[mode],
          );
          expect(await computed(page, '[data-slot="drawer-overlay"]', "transition-duration")).toBe(
            { full: "0.16s", reduced: "0.096s", none: "0s" }[mode],
          );

          // Settled at the bottom edge: the drag offset is zero and nothing is left
          // to translate, so the sheet is where its placement says it is.
          const box = await popup.boundingBox();
          const height = await page.evaluate(() => window.innerHeight);
          expect(Math.abs((box?.y ?? 0) + (box?.height ?? 0) - height)).toBeLessThan(1);
        });
      }
    });
  }
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

test.describe("code-block", () => {
  // The layering check samples a full-mode travel, so it opts out of the OS preference
  // explicitly; the mode matrix below sets its own preference per cell.
  test.use({ reducedMotion: "no-preference" });

  /**
   * Paint order is invisible to jsdom and identical at the end of the travel, so the
   * only honest check is hit-testing mid-flight. The pill belongs to the tab being
   * entered, and when that tab is to the right of the one being left its button comes
   * later in the DOM: unlayered, the pill paints over the tab it left and wipes that
   * label for the length of the slide. Every label sits on `z-10`, above the pill.
   */
  test("the travelling pill paints underneath the tab labels", async ({ page }) => {
    await openComponent(page, "code-block", "full", "code-block", "full");

    const list = page.locator('[data-slot="code-block-tabs"]').first();
    const tabs = list.locator('[role="tab"]');

    // The sampler starts before the click so the first frames — the ones where the
    // pill still sits on the tab it is leaving — are part of the sample.
    await page.evaluate(() => {
      const blockList = document.querySelector('[data-slot="code-block-tabs"]');
      const first = blockList?.querySelector<HTMLElement>('[data-slot="code-block-tab"]');
      const store = window as unknown as { __pillLayers?: { pill: number; label: number; samples: number } };
      store.__pillLayers = { pill: 0, label: 0, samples: 0 };

      const tick = () => {
        const layers = store.__pillLayers as { pill: number; label: number; samples: number };
        // Re-read the label each frame: React replaces the span when the tab loses its
        // indicator, so a captured node would be detached by the time we sample it.
        const label = first?.lastElementChild;
        if (label) {
          const box = label.getBoundingClientRect();
          const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
          layers.samples++;
          if (hit?.getAttribute("data-slot") === "code-block-tab-indicator") layers.pill++;
          if (hit === label) layers.label++;
        }
        if (layers.samples < 90) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });

    await tabs.nth(2).click();
    await page.waitForTimeout(800);

    const hits = await page.evaluate(
      () => (window as unknown as { __pillLayers: { pill: number; label: number; samples: number } }).__pillLayers,
    );

    // The sample point is over the label, so it must have been hit at least once…
    expect(hits.label).toBeGreaterThan(0);
    // …and the travelling pill must never have been the element on top of it.
    expect(hits.pill).toBe(0);
  });

  for (const prefersReduced of PREFERENCES) {
    test.describe(preferenceName(prefersReduced), () => {
      test.use({ reducedMotion: prefersReduced ? "reduce" : "no-preference" });

      for (const requested of MODES) {
        const mode = effectiveMode(requested, prefersReduced);

        test(`tabs: ?motion=${requested} → ${mode}`, async ({ page }) => {
          await openComponent(page, "code-block", requested, "code-block", mode);

          const list = page.locator('[data-slot="code-block-tabs"]').first();
          const tabs = list.locator('[role="tab"]');
          const yarn = tabs.nth(2);
          await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "true");

          await yarn.click();
          await expect(yarn).toHaveAttribute("aria-selected", "true");
          await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "false");

          // The end state is the same in all three modes: one pill, over the tab that
          // was pressed, and the panel of that variant is the visible one. How the
          // pill gets there is the recipe's job — a shared element in `full`, an
          // in-place paint under `reduced` (no `layoutId`) and `none` (zero duration).
          const pill = list.locator('[data-slot="code-block-tab-indicator"]');
          await expect(pill).toHaveCount(1);
          // Polled rather than sampled once: in `full` the pill is still travelling
          // when the click returns, and "it lands on the pressed tab" is the claim.
          await expect
            .poll(async () => {
              const [pillBox, tabBox] = [await pill.boundingBox(), await yarn.boundingBox()];
              return Math.abs((pillBox?.x ?? 0) - (tabBox?.x ?? 0));
            })
            .toBeLessThan(1);

          // The panel swap is what the tabs are for: a hidden panel is not painted,
          // and the visible one holds this variant's command.
          await expect(page.locator('[data-slot="code-block-panel"]:not([hidden]) pre').first()).toHaveText(
            /yarn dlx shadcn@latest add/,
          );
        });

        test(`fold: ?motion=${requested} → ${mode}`, async ({ page }) => {
          await openComponent(page, "code-block", requested, "code-block", mode);

          // The preview's first block is capped at eight lines, so it opens folded.
          // The toggle is located by slot, not by name: its accessible name is the
          // state ("Show all" / "Show less"), so a name locator is stale after the
          // click it just performed.
          const viewport = page.locator(scoped("code-block", '[data-slot="code-block-viewport"]')).first();
          const toggle = page.locator(scoped("code-block", '[data-slot="code-block-expand-button"]')).first();
          await expect(toggle).toHaveAccessibleName("Show all");
          await expect(toggle).toHaveAttribute("aria-expanded", "false");

          const contentId = (await viewport.locator("pre").first().getAttribute("id")) ?? "";
          expect(contentId).not.toBe("");
          await expect(toggle).toHaveAttribute("aria-controls", contentId);

          const folded = await viewport.evaluate((element) => element.getBoundingClientRect().height);
          await toggle.click();
          await expect(toggle).toHaveAttribute("aria-expanded", "true");
          await expect(toggle).toHaveAccessibleName("Show less");

          // The end state is the same in every mode: the source is whole. What the
          // modes change is how it gets there — a spring in `full`, a jump under
          // `reduced` and `none` — which is the token's job, not this assertion's.
          await expect
            .poll(async () => viewport.evaluate((element) => element.getBoundingClientRect().height))
            .toBeGreaterThan(folded);

          // The fold is measured, so the viewport can never be shorter than the
          // content it clips, and the toggle is a real button that reports the state.
          await expect(viewport).toHaveAttribute("data-motion", mode);

          // The preview asks for `tsx`, so the highlighter chunk has to have loaded
          // and produced tokens — the one thing jsdom cannot prove, because there the
          // dynamic import resolves but no layout ever follows it.
          await expect(
            page.locator(scoped("code-block", '[data-slot="code-block-code"] span[style*="--shiki-light"]')).first(),
          ).toBeVisible();
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
