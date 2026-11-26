import { expect, type Locator, test } from "@playwright/test";
import {
  computed,
  effectiveMode,
  MODES,
  openComponent,
  pressScale,
  recordedPresence,
  recordedScale,
  recordPresence,
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

/**
 * The declared entrance clocks of every surface in the matrix, as the recipe resolves them
 * per mode, split by the property each animation writes.
 *
 * A panel's entrance is the presence controller's Web Animation, not a CSS transition: the
 * v2 panel deliberately carries no `opacity`/`transform` family so the controller is its
 * only writer, and the longhands left on it belong to the colour owner. `transition-duration`
 * therefore reports a colour clock and can never prove the fade ran — the writer itself is
 * the observable, read from the calls it made before Base UI's own initial focus settles the
 * envelope. Reduced keeps the opacity half at 0.6× and resolves the spatial half to a zero
 * clock; `none` starts no envelope at all.
 *
 * - `modal`: `presence.surface` on a dialog panel — base clock plus the `scale.in` pose.
 * - `backdrop`: `presence.surface` on a modal backdrop — opacity only.
 * - `popup`: `presence.popup` on an anchored panel — base clock plus a `distance.xs` approach.
 * - `menu`: `presence.menu` on a menu panel — the same form on the fast clock.
 * - `sheet`: `presence.sheet` on a sheet or drawer panel — slow clock plus the edge flight.
 * - `inline`: `presence.inline` on an overlay that fades on its own — fast clock, opacity only.
 */
const CLOCKS = {
  modal: {
    full: { opacity: [220], spatial: [220] },
    reduced: { opacity: [132], spatial: [] },
    none: { opacity: [], spatial: [] },
  },
  backdrop: {
    full: { opacity: [220], spatial: [] },
    reduced: { opacity: [132], spatial: [] },
    none: { opacity: [], spatial: [] },
  },
  popup: {
    full: { opacity: [220], spatial: [220] },
    reduced: { opacity: [132], spatial: [] },
    none: { opacity: [], spatial: [] },
  },
  menu: {
    full: { opacity: [160], spatial: [160] },
    reduced: { opacity: [96], spatial: [] },
    none: { opacity: [], spatial: [] },
  },
  sheet: {
    full: { opacity: [320], spatial: [320] },
    reduced: { opacity: [192], spatial: [] },
    none: { opacity: [], spatial: [] },
  },
  inline: {
    full: { opacity: [160], spatial: [] },
    reduced: { opacity: [96], spatial: [] },
    none: { opacity: [], spatial: [] },
  },
} as const;
const MODAL = CLOCKS.modal;
const BACKDROP = CLOCKS.backdrop;
const PRESENCE =
  '[data-slot="dialog-content"], [data-slot="dialog-overlay"], [data-slot="alert-dialog-content"], [data-slot="alert-dialog-overlay"]';

/**
 * The colour families the panels declare, in each component's own property order.
 *
 * These are the only CSS transition families an anchored or modal panel installs, and each
 * belongs to exactly one paint owner: surface tokens plus the scoped shadow, the foreground
 * `color` beside them, or — for the drawer — the primitive's swipe release channel. A colour
 * clock that has to interpolate requires a verified readable palette; where the caller's
 * palette cannot be verified the contract settles that family immediately, so the deliberate
 * expectation there is a zero clock on every longhand rather than a fade clock.
 */
const SURFACE_SHADOW =
  "background-color, border-top-color, border-right-color, border-bottom-color, border-left-color, box-shadow";
const SURFACE_FOREGROUND_SHADOW =
  "background-color, color, border-top-color, border-right-color, border-bottom-color, border-left-color, box-shadow";
const SURFACE_THEN_FOREGROUND =
  "background-color, border-top-color, border-right-color, border-bottom-color, border-left-color, color";

/**
 * An immediate colour family: every declared longhand settles at a zero clock.
 *
 * The length of the list is deliberately not part of the claim. A surface that declares
 * `transition-duration` once and one that declares it per property settle identically, and
 * Chrome serialises the computed value as one entry or as one per property depending on which
 * of the two the paint owner reconciled.
 */
const ZERO_COLOUR_CLOCK = /^0s(?:, 0s)*$/;

/**
 * Whether a surface holds focus once it is open.
 *
 * This is what decides between the two colour clocks the matrix meets. A region that holds
 * focus settles its own declared paint immediately rather than interpolating through the focus
 * ring (popover.md, sheet.md), so its family reports a zero clock; a surface that keeps focus
 * outside — the combobox, whose input stays focused, and a hover card, which never takes focus
 * — keeps a real colour clock on a verified palette. Asserting the focus is what ties each
 * expectation below to its cause instead of to a comment.
 */
const holdsFocus = (surface: Locator) => surface.evaluate((node) => node.contains(node.ownerDocument.activeElement));

test.describe("button", () => {
  for (const prefersReduced of PREFERENCES) {
    test.describe(preferenceName(prefersReduced), () => {
      test.use({ reducedMotion: prefersReduced ? "reduce" : "no-preference" });

      for (const requested of MODES) {
        const mode = effectiveMode(requested, prefersReduced);

        test(`reports ${mode} for ?motion=${requested}`, async ({ page }) => {
          await openComponent(page, "button", requested, "button", mode);
          // The preview's first button is the default one; it is located by slot rather
          // than by label so restyling the specimen does not break the matrix.
          await expect(page.locator(scoped("button", '[data-slot="button"]')).first()).toHaveAttribute(
            "data-motion",
            mode,
          );
        });

        test(`press scale: ?motion=${requested} → ${mode}`, async ({ page }) => {
          await openComponent(page, "button", requested, "button", mode);
          // `feedback.press/scale` owns a safe label layer inside the button, never the
          // root: the root keeps its hit, focus and anchor geometry at rest in every mode.
          // The preview's first button pairs an icon with its label, and a rich label keeps
          // its own structure instead of gaining a feedback wrapper — the contract omits the
          // pose there rather than inserting an incompatible layer. So the sample is the
          // first button that owns a plain label, and therefore a feedback layer at all.
          const feedback = page.locator(scoped("button", '[data-slot="button-feedback"]')).first();
          await expect(feedback).toBeVisible();

          const scale = await pressScale(page, feedback);
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
          await recordPresence(page, PRESENCE);
          await openComponent(page, "dialog", requested, "dialog-trigger", mode);

          await page.locator(scoped("dialog", "button")).filter({ hasText: "Rename project" }).click();
          await expect(page.getByRole("dialog", { name: "Rename project" })).toBeVisible();
          await page.waitForTimeout(300);

          const popup = page.locator('[data-slot="dialog-content"]');
          await expect(popup).toHaveAttribute("data-motion", mode);

          // The declared panel and backdrop clocks, read from the writers that ran. The
          // backdrop's colour family is still a CSS transition, so its token binding is
          // also asserted on the computed style; the panel's presence is not CSS at all.
          expect(await recordedPresence(page, "initial", "dialog-content")).toEqual(MODAL[mode]);
          expect(await recordedPresence(page, "initial", "dialog-overlay")).toEqual(BACKDROP[mode]);
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
      await recordPresence(page, PRESENCE);
      await openComponent(page, "dialog", "reduced", "dialog-trigger");
      await page.locator(scoped("dialog", "button")).filter({ hasText: "Rename project" }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.waitForTimeout(300);

      // The short opacity path and no scale envelope: the panel's reduced writer, not a
      // CSS family the v2 panel no longer installs.
      expect(await recordedPresence(page, "initial", "dialog-content")).toEqual({ opacity: [132], spatial: [] });
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
          await recordPresence(page, PRESENCE);
          await openComponent(page, "alert-dialog", requested, "alert-dialog-trigger", mode);

          await page.locator(scoped("alert-dialog", '[data-slot="alert-dialog-trigger"]')).first().click();
          await expect(page.getByRole("alertdialog")).toBeVisible();
          await page.waitForTimeout(300);

          const popup = page.locator('[data-slot="alert-dialog-content"]');
          await expect(popup).toHaveAttribute("data-motion", mode);

          // The same writers as `dialog`: `none` must start no envelope at all rather
          // than falling back to the reduced one. This backdrop owns no CSS colour
          // family, so its computed clock is genuinely `0s` and only the writer is an
          // observation.
          expect(await recordedPresence(page, "initial", "alert-dialog-content")).toEqual(MODAL[mode]);
          expect(await recordedPresence(page, "initial", "alert-dialog-overlay")).toEqual(BACKDROP[mode]);

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
      await recordPresence(page, PRESENCE);
      await openComponent(page, "alert-dialog", "reduced", "alert-dialog-trigger");
      await page.locator(scoped("alert-dialog", '[data-slot="alert-dialog-trigger"]')).first().click();
      await expect(page.getByRole("alertdialog")).toBeVisible();
      await page.waitForTimeout(300);

      expect(await recordedPresence(page, "initial", "alert-dialog-content")).toEqual({ opacity: [132], spatial: [] });
      expect((await recordedScale(page)).min).toBe(1);
    });
  });
});

test.describe("popover", () => {
  // The first anchored panel in the matrix. Its entrance is the panel's own visual layer
  // fading while it approaches from the side Base UI resolved, so the cell reads the
  // presence writer and the settled placement — the positioner keeps its coordinates, and
  // the panel carries no opacity/transform family for a second writer to own.
  for (const prefersReduced of PREFERENCES) {
    test.describe(preferenceName(prefersReduced), () => {
      test.use({ reducedMotion: prefersReduced ? "reduce" : "no-preference" });

      for (const requested of MODES) {
        const mode = effectiveMode(requested, prefersReduced);

        test(`opening: ?motion=${requested} → ${mode}`, async ({ page }) => {
          await recordScale(page, '[data-slot="popover-content"]');
          await recordPresence(page, '[data-slot="popover-content"]');
          await openComponent(page, "popover", requested, "popover-trigger", mode);

          await page.locator(scoped("popover", '[data-slot="popover-trigger"]')).first().click();
          await expect(page.getByRole("dialog")).toBeVisible();
          await page.waitForTimeout(300);

          const popup = page.locator('[data-slot="popover-content"]');
          await expect(popup).toHaveAttribute("data-motion", mode);

          // `presence.popup` is the panel's entrance writer: one opacity animation, plus a
          // `distance.xs` approach of the panel's own visual layer in `full`. Reading the
          // calls is the only way to tell "the declared envelope ran" from "nothing
          // started"; the computed family below is a different owner's property.
          expect(await recordedPresence(page, "initial", "popover-content")).toEqual(CLOCKS.popup[mode]);

          // The only family the panel installs belongs to the colour owner. Base UI focuses
          // the panel as it opens (which is also what settles the entry a frame later), and a
          // focused region settles that paint immediately: a zero clock on every longhand is
          // the correct expectation, deliberately, and it is not the fade.
          expect(await holdsFocus(popup)).toBe(true);
          expect(await computed(page, '[data-slot="popover-content"]', "transition-property")).toBe(SURFACE_SHADOW);
          expect(await computed(page, '[data-slot="popover-content"]', "transition-duration")).toMatch(
            ZERO_COLOUR_CLOCK,
          );

          // The approach is a 4px translation, not a scale: this panel never shrinks, and it
          // lands with nothing left to transform in any mode.
          const enter = await recordedScale(page);
          expect(enter.frames).toBeGreaterThan(3);
          expect(enter.min).toBe(1);
          expect(await computed(page, '[data-slot="popover-content"]', "transform")).toBe("none");
        });
      }
    });
  }

  test.describe("reduced keeps the fade and drops the spatial half", () => {
    test.use({ reducedMotion: "reduce" });

    test("the panel fades without an approach", async ({ page }) => {
      await recordScale(page, '[data-slot="popover-content"]');
      await recordPresence(page, '[data-slot="popover-content"]');
      await openComponent(page, "popover", "reduced", "popover-trigger");
      await page.locator(scoped("popover", '[data-slot="popover-trigger"]')).first().click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.waitForTimeout(300);

      // The short opacity path through the same writer and no spatial half: the panel has no
      // scale to drop, and no opacity transition for a second writer to own.
      expect(await recordedPresence(page, "initial", "popover-content")).toEqual(CLOCKS.popup.reduced);
      expect(await computed(page, '[data-slot="popover-content"]', "transition-property")).toBe(SURFACE_SHADOW);
      expect(await computed(page, '[data-slot="popover-content"]', "transition-duration")).toMatch(ZERO_COLOUR_CLOCK);
      expect((await recordedScale(page)).min).toBe(1);
    });
  });
});

test.describe("tooltip", () => {
  // Hover, not click: a tooltip is the one popup in the matrix that opens with a
  // pointer move, and it is also the component whose `aria-describedby` only exists
  // while the popup does.
  //
  // Unlike the anchored panels around it, the hint has no scale envelope and no CSS
  // opacity longhand: `presence.tooltip` fades opacity through `element.animate()`,
  // while the only CSS family on the popup belongs to the paint owner
  // (`state.color` → `background-color, color`). So this block reads the fade from
  // the writer that ran and the colour clock from the computed style, and asserts the
  // hint's `scale`/`transform` stays at rest in every mode.
  const FADE = { full: [100], reduced: [60] } as const;
  const PAINT = { full: "0.16s", reduced: "0.096s", none: "0s" } as const;

  for (const prefersReduced of PREFERENCES) {
    test.describe(preferenceName(prefersReduced), () => {
      test.use({ reducedMotion: prefersReduced ? "reduce" : "no-preference" });

      for (const requested of MODES) {
        const mode = effectiveMode(requested, prefersReduced);

        test(`opening: ?motion=${requested} → ${mode}`, async ({ page }) => {
          await recordScale(page, '[data-slot="tooltip-content"]');
          await recordPresence(page, '[data-slot="tooltip-content"]');
          await openComponent(page, "tooltip", requested, "tooltip-trigger", mode);

          await page.locator(scoped("tooltip", '[data-slot="tooltip-trigger"]')).first().hover();
          await expect(page.getByRole("tooltip")).toBeVisible();
          await page.waitForTimeout(300);

          const popup = page.locator('[data-slot="tooltip-content"]');
          await expect(popup).toHaveAttribute("data-motion", mode);

          // The presence owner's own clock: one opacity animation over `duration.instant`
          // (100 ms / 60 ms), and a zero clock under `none` — never a `transform` half in
          // either mode. `none` may re-commit a zero-length animation while the portal
          // mounts, so the claim there is "no envelope", not how many times it settled.
          const presence = await recordedPresence(page, "initial", "tooltip-content");
          expect(presence.spatial).toEqual([]);
          if (mode === "none") {
            expect(presence.opacity.length).toBeGreaterThan(0);
            expect(presence.opacity.every((duration) => duration === 0)).toBe(true);
          } else {
            expect(presence.opacity).toEqual(FADE[mode]);
          }

          // The popup's computed family is the paint owner's, and it settles to the
          // colour clock: this is not the fade, and must not be read as one.
          expect(await computed(page, '[data-slot="tooltip-content"]', "transition-property")).toBe(
            "background-color, color",
          );
          expect(await computed(page, '[data-slot="tooltip-content"]', "transition-duration")).toBe(PAINT[mode]);

          // No scale at rest in any mode — the v2 hint has none to settle, so `full`
          // must not be asked for a 0.96 envelope either.
          const enter = await recordedScale(page);
          expect(enter.frames).toBeGreaterThan(3);
          expect(enter.min).toBe(1);
          expect(enter.max).toBe(1);
        });
      }
    });
  }

  test.describe("reduced keeps the fade and has no scale to drop", () => {
    test.use({ reducedMotion: "reduce" });

    test("the label fades without a scale settle", async ({ page }) => {
      await recordScale(page, '[data-slot="tooltip-content"]');
      await recordPresence(page, '[data-slot="tooltip-content"]');
      await openComponent(page, "tooltip", "reduced", "tooltip-trigger");
      await page.locator(scoped("tooltip", '[data-slot="tooltip-trigger"]')).first().hover();
      await expect(page.getByRole("tooltip")).toBeVisible();
      await page.waitForTimeout(300);

      // Reduced keeps the short opacity path through the same writer, and the popup
      // still carries no opacity transition for a second writer to own.
      expect(await recordedPresence(page, "initial", "tooltip-content")).toEqual({ opacity: [60], spatial: [] });
      expect(await computed(page, '[data-slot="tooltip-content"]', "transition-property")).toBe(
        "background-color, color",
      );
      expect(await computed(page, '[data-slot="tooltip-content"]', "transition-duration")).toBe("0.096s");

      const enter = await recordedScale(page);
      expect(enter.frames).toBeGreaterThan(3);
      expect(enter.min).toBe(1);
      expect(enter.max).toBe(1);
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
          await recordPresence(page, '[data-slot="hover-card-content"]');
          await openComponent(page, "hover-card", requested, "hover-card-trigger", mode, { inheritedMode: true });

          await page.locator(scoped("hover-card", '[data-slot="hover-card-trigger"]')).first().hover();
          await expect(page.locator('[data-slot="hover-card-content"]')).toBeVisible();
          await page.waitForTimeout(300);

          const popup = page.locator('[data-slot="hover-card-content"]');
          await expect(popup).toHaveAttribute("data-motion", mode);

          // The same `presence.popup` writer as the popover, and the same split: opacity
          // plus the `distance.xs` approach, read from the calls rather than from CSS.
          expect(await recordedPresence(page, "initial", "hover-card-content")).toEqual(CLOCKS.popup[mode]);

          // A hover opens without moving focus, so this panel's colour family is not settled
          // by the focus rule and its clock runs at the fast token. It is still the colour
          // owner's clock and not the fade.
          expect(await holdsFocus(popup)).toBe(false);
          expect(await computed(page, '[data-slot="hover-card-content"]', "transition-property")).toBe(
            SURFACE_THEN_FOREGROUND,
          );
          expect(await computed(page, '[data-slot="hover-card-content"]', "transition-duration")).toBe(
            { full: "0.16s", reduced: "0.096s", none: "0s" }[mode],
          );

          // The approach is a translation; the card itself never scales.
          const enter = await recordedScale(page);
          expect(enter.frames).toBeGreaterThan(3);
          expect(enter.min).toBe(1);
        });
      }
    });
  }

  test.describe("reduced keeps the fade and drops the spatial half", () => {
    test.use({ reducedMotion: "reduce" });

    test("the panel fades without an approach", async ({ page }) => {
      await recordScale(page, '[data-slot="hover-card-content"]');
      await recordPresence(page, '[data-slot="hover-card-content"]');
      await openComponent(page, "hover-card", "reduced", "hover-card-trigger", "reduced", { inheritedMode: true });
      await page.locator(scoped("hover-card", '[data-slot="hover-card-trigger"]')).first().hover();
      await expect(page.locator('[data-slot="hover-card-content"]')).toBeVisible();
      await page.waitForTimeout(300);

      // The short fade through the presence writer, and no spatial half to drop. The
      // computed family is the colour owner's — it never contained the fade, so asking it
      // for `opacity` was asking the wrong writer.
      expect(await recordedPresence(page, "initial", "hover-card-content")).toEqual(CLOCKS.popup.reduced);
      expect(await computed(page, '[data-slot="hover-card-content"]', "transition-property")).toBe(
        SURFACE_THEN_FOREGROUND,
      );
      expect(await computed(page, '[data-slot="hover-card-content"]', "transition-duration")).toBe("0.096s");
      expect((await recordedScale(page)).min).toBe(1);
    });
  });
});

test.describe("sheet", () => {
  // A modal popup that moves: the panel's edge flight is the presence controller's Web
  // Animation over its own extent, so this block reads the writer for the travel and the
  // fade, the colour owner's clock for the paint, and proves the panel lands flush
  // against its edge in every mode. The unit test owns the per-side class branch.
  for (const prefersReduced of PREFERENCES) {
    test.describe(preferenceName(prefersReduced), () => {
      test.use({ reducedMotion: prefersReduced ? "reduce" : "no-preference" });

      for (const requested of MODES) {
        const mode = effectiveMode(requested, prefersReduced);

        test(`opening: ?motion=${requested} → ${mode}`, async ({ page }) => {
          await recordPresence(page, '[data-slot="sheet-content"], [data-slot="sheet-overlay"]');
          await openComponent(page, "sheet", requested, "sheet-trigger", mode);

          await page.locator(scoped("sheet", '[data-slot="sheet-trigger"]')).first().click();
          await expect(page.getByRole("dialog")).toBeVisible();
          await page.waitForTimeout(400);

          const sheet = page.locator('[data-slot="sheet-content"]');
          await expect(sheet).toHaveAttribute("data-motion", mode);
          await expect(sheet).toHaveAttribute("data-side", "right");

          // `presence.sheet` writes the slide and the fade together in `full`; `presence.surface`
          // gives the backdrop its own opacity clock so the two never share a writer.
          expect(await recordedPresence(page, "initial", "sheet-content")).toEqual(CLOCKS.sheet[mode]);
          expect(await recordedPresence(page, "initial", "sheet-overlay")).toEqual(CLOCKS.backdrop[mode]);

          // The panel's colour family is the only CSS transition it declares, and the panel
          // holds focus as it opens, so the contract settles that paint immediately: `0s` on
          // every longhand is the deliberate expectation. The backdrop is not focused, so its
          // colour clock runs at the fast token — still not the fade.
          expect(await holdsFocus(sheet)).toBe(true);
          expect(await computed(page, '[data-slot="sheet-content"]', "transition-property")).toBe(SURFACE_SHADOW);
          expect(await computed(page, '[data-slot="sheet-content"]', "transition-duration")).toMatch(ZERO_COLOUR_CLOCK);
          expect(await computed(page, '[data-slot="sheet-overlay"]', "transition-property")).toBe("background-color");
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
  // The one component whose motion is partly the user's: the drag, the snap configuration
  // and the release trajectory are Base UI's, and the matrix pins what Cadence authors
  // around them — the declared clocks and the settled position. The drag itself is
  // asserted through the class branch in the unit test.
  for (const prefersReduced of PREFERENCES) {
    test.describe(preferenceName(prefersReduced), () => {
      test.use({ reducedMotion: prefersReduced ? "reduce" : "no-preference" });

      for (const requested of MODES) {
        const mode = effectiveMode(requested, prefersReduced);

        test(`opening: ?motion=${requested} → ${mode}`, async ({ page }) => {
          await recordPresence(page, '[data-slot="drawer-popup"], [data-slot="drawer-overlay"]');
          await openComponent(page, "drawer", requested, "drawer-trigger", mode);

          await page.locator(scoped("drawer", '[data-slot="drawer-trigger"]')).first().click();
          await expect(page.getByRole("dialog")).toBeVisible();
          await page.waitForTimeout(500);

          const popup = page.locator('[data-slot="drawer-popup"]');
          await expect(popup).toHaveAttribute("data-motion", mode);

          // The popup carries exactly one CSS family: the primitive's own release glide,
          // which `drawerSwipeClasses` backs with the sheet clock in `full` and removes
          // entirely under reduced/none. It is not a colour or presence family, so the
          // panel spends no colour clock here and the reduced/none fade below is the only
          // owner left.
          expect(await computed(page, '[data-slot="drawer-popup"]', "transition-property")).toBe(
            mode === "full" ? "transform, translate" : "none",
          );
          expect(await computed(page, '[data-slot="drawer-popup"]', "transition-duration")).toBe(
            { full: "0.32s", reduced: "0s", none: "0s" }[mode],
          );

          const presence = await recordedPresence(page, "initial", "drawer-popup");
          if (mode === "full") {
            // Nothing else writes the panel while that family is installed: the presence
            // controller yields to it instead of starting a second animation. This cell
            // records the current shape and not the contract — the declared edge flight is
            // therefore unobservable in `full`; #173 tracks that gap, and when it lands this
            // cell has to assert the envelope rather than its absence.
            expect(presence).toEqual({ opacity: [], spatial: [] });
          } else {
            expect(presence).toEqual(CLOCKS.sheet[mode]);
          }

          // The backdrop owns its own opacity channel: its declared `background-color` family
          // stays at a zero clock, so the fade asserted next is the inline presence writer and
          // never this one.
          expect(await computed(page, '[data-slot="drawer-overlay"]', "transition-property")).toBe("background-color");
          expect(await computed(page, '[data-slot="drawer-overlay"]', "transition-duration")).toBe("0s");
          expect(await recordedPresence(page, "initial", "drawer-overlay")).toEqual(CLOCKS.inline[mode]);

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
          // The preview's first switch is the off one, so the press has somewhere to
          // travel to. Both are addressed by id: their visible labels are decorative copy
          // that changes with the specimen.
          const thumb = page
            .locator(scoped("switch", '[data-slot="switch"]'))
            .first()
            .locator('[data-slot="switch-thumb"]');
          const x = () => thumb.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m41);

          const start = await x();
          await page.locator(scoped("switch", '[data-slot="switch"]')).first().click();
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
        // The checked switch, not the first one on the page: an unchecked thumb has no
        // travel to measure, and the claim is about the one that starts at its end.
        const switches = document.querySelectorAll('[data-slot="switch"]');
        const thumb = switches[1]?.querySelector('[data-slot="switch-thumb"]');
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

    const list = page.locator('[data-component-example="code-block/content-tabs"] [data-slot="code-block-tabs"]');
    const tabs = list.locator('[role="tab"]');

    // The sampler starts before the click so the first frames — the ones where the
    // pill still sits on the tab it is leaving — are part of the sample.
    await page.evaluate(() => {
      const blockList = document.querySelector(
        '[data-component-example="code-block/content-tabs"] [data-slot="code-block-tabs"]',
      );
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

          const list = page.locator('[data-component-example="code-block/content-tabs"] [data-slot="code-block-tabs"]');
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
          await expect(pill).toHaveAttribute("data-motion", mode);
          // The copy button owns two stacked icon layers (copy and check), each with its
          // own hidden/live pose. Named by slot so a label span added beside them later
          // cannot turn this into a count of something else.
          const glyphs = page
            .locator(scoped("code-block", '[data-slot="code-block-copy-button"]'))
            .first()
            .locator('span[data-slot="code-block-copy-icon"]');
          await expect(glyphs).toHaveCount(2);
          for (const glyph of await glyphs.all()) await expect(glyph).toHaveAttribute("data-motion", mode);

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
          await expect(
            page.locator(
              '[data-component-example="code-block/content-tabs"] [data-slot="code-block-panel"]:not([hidden]) pre',
            ),
          ).toHaveText(/yarn dlx shadcn@latest add/);
        });

        test(`fold: ?motion=${requested} → ${mode}`, async ({ page }) => {
          await openComponent(page, "code-block", requested, "code-block", mode);

          // The preview's block is capped at six lines, so it opens folded.
          // The toggle is located by slot, not by name: its accessible name is the
          // state ("Show all" / "Show less"), so a name locator is stale after the
          // click it just performed.
          const viewport = page.locator(scoped("code-block", '[data-slot="code-block-viewport"]')).first();
          const toggle = page.locator(scoped("code-block", '[data-slot="code-block-expand-button"]')).first();
          // The toggle renders a label span and a decorative chevron span, and both carry
          // `data-motion`. Each is named by its slot: a bare `span[data-motion]` matches
          // both and is a strict-mode violation, not a stricter assertion.
          //
          // It also only exists once the block has measured itself as capped, so it appears
          // a beat after the viewport — and under parallel workers that beat is occasionally
          // longer than the default allowance. That wait is the hydration budget
          // `openComponent` already grants, not a relaxed claim.
          await expect(toggle).toBeVisible({ timeout: 15_000 });
          await expect(toggle).toHaveAccessibleName("Show all");
          await expect(toggle.locator('[data-slot="code-block-expand-text"]')).toHaveAttribute("data-motion", mode);
          await expect(toggle.locator('[data-slot="code-block-expand-icon"]')).toHaveAttribute("data-motion", mode);

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

test.describe("combobox", () => {
  // The batch's one field-with-a-popup: same `presence.popup` entrance and the same
  // `state.morph` tick as the menus, but anchored to an input rather than a button, so the
  // panel is the only popup here that keeps a scale pose. Proving it keeps the token from
  // being menu-specific.
  for (const prefersReduced of PREFERENCES) {
    test.describe(preferenceName(prefersReduced), () => {
      test.use({ reducedMotion: prefersReduced ? "reduce" : "no-preference" });

      for (const requested of MODES) {
        const mode = effectiveMode(requested, prefersReduced);

        test(`opening: ?motion=${requested} → ${mode}`, async ({ page }) => {
          await recordScale(page, '[data-slot="combobox-content"]');
          await recordPresence(page, '[data-slot="combobox-content"]');
          await openComponent(page, "combobox", requested, "input-group", mode);

          const input = page.locator(scoped("combobox", '[data-slot="input-group-control"]')).first();
          await input.click();
          await input.press("ArrowDown");
          await expect(page.getByRole("listbox")).toBeVisible();
          await page.waitForTimeout(300);

          const panel = page.locator('[data-slot="combobox-content"]');
          await expect(panel).toHaveAttribute("data-motion", mode);

          // The entrance is the popup controller's own animation — opacity plus the
          // `scale.in` pose, which is what this panel writes instead of an approach.
          expect(await recordedPresence(page, "initial", "combobox-content")).toEqual(CLOCKS.popup[mode]);

          // The input keeps focus while the panel opens, so this surface's colour family is
          // not settled by the focus rule and its clock runs at the fast token. It is the
          // colour owner's, never the fade's.
          expect(await holdsFocus(panel)).toBe(false);
          expect(await computed(page, '[data-slot="combobox-content"]', "transition-property")).toBe(
            SURFACE_FOREGROUND_SHADOW,
          );
          expect(await computed(page, '[data-slot="combobox-content"]', "transition-duration")).toBe(
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

  test.describe("reduced keeps the fade and drops the scale", () => {
    test.use({ reducedMotion: "reduce" });

    test("the panel fades without the 0.96 settle", async ({ page }) => {
      await recordScale(page, '[data-slot="combobox-content"]');
      await recordPresence(page, '[data-slot="combobox-content"]');
      await openComponent(page, "combobox", "reduced", "input-group");
      const input = page.locator(scoped("combobox", '[data-slot="input-group-control"]')).first();
      await input.click();
      await input.press("ArrowDown");
      await expect(page.getByRole("listbox")).toBeVisible();
      await page.waitForTimeout(300);

      // Reduced keeps the short fade through the same writer and resolves the spatial half
      // to a zero clock, so the panel never scales — and the computed family below stays the
      // colour owner it always was, which is why asking it for `opacity` was wrong.
      expect(await recordedPresence(page, "initial", "combobox-content")).toEqual(CLOCKS.popup.reduced);
      expect(await computed(page, '[data-slot="combobox-content"]', "transition-property")).toBe(
        SURFACE_FOREGROUND_SHADOW,
      );
      expect(await computed(page, '[data-slot="combobox-content"]', "transition-duration")).toBe("0.096s");
      expect((await recordedScale(page)).min).toBe(1);
    });
  });
});

test.describe("dropdown-menu", () => {
  // The first menu in the matrix. Its panel fades and approaches through `presence.menu` on
  // Base UI's menu state attributes, and its check mark is the only JavaScript animation in
  // B5, so this block pins the entrance clocks, the colour owner's clock and the absence of
  // a scale pose in every mode.
  for (const prefersReduced of PREFERENCES) {
    test.describe(preferenceName(prefersReduced), () => {
      test.use({ reducedMotion: prefersReduced ? "reduce" : "no-preference" });

      for (const requested of MODES) {
        const mode = effectiveMode(requested, prefersReduced);

        test(`opening: ?motion=${requested} → ${mode}`, async ({ page }) => {
          await recordScale(page, '[data-slot="dropdown-menu-content"]');
          await recordPresence(page, '[data-slot="dropdown-menu-content"]');
          await openComponent(page, "dropdown-menu", requested, "dropdown-menu-trigger", mode);

          await page.locator(scoped("dropdown-menu", '[data-slot="dropdown-menu-trigger"]')).first().click();
          await expect(page.getByRole("menu")).toBeVisible();
          await page.waitForTimeout(300);

          const panel = page.locator('[data-slot="dropdown-menu-content"]');
          await expect(panel).toHaveAttribute("data-motion", mode);

          // `presence.menu` is the same form as the popup on the fast clock: opacity plus a
          // `distance.xs` approach, and no scale pose for `reduced` to drop.
          expect(await recordedPresence(page, "initial", "dropdown-menu-content")).toEqual(CLOCKS.menu[mode]);

          // Opening the menu moves focus into it, so the panel's own colour family settles
          // immediately: a zero clock on every longhand, deliberately. That family is the
          // colour owner's and was never the fade.
          expect(await holdsFocus(panel)).toBe(true);
          expect(await computed(page, '[data-slot="dropdown-menu-content"]', "transition-property")).toBe(
            SURFACE_FOREGROUND_SHADOW,
          );
          expect(await computed(page, '[data-slot="dropdown-menu-content"]', "transition-duration")).toMatch(
            ZERO_COLOUR_CLOCK,
          );

          const enter = await recordedScale(page);
          expect(enter.frames).toBeGreaterThan(3);
          expect(enter.min).toBe(1);
        });
      }
    });
  }

  test.describe("reduced keeps the fade and drops the spatial half", () => {
    test.use({ reducedMotion: "reduce" });

    test("the panel fades without an approach", async ({ page }) => {
      await recordScale(page, '[data-slot="dropdown-menu-content"]');
      await recordPresence(page, '[data-slot="dropdown-menu-content"]');
      await openComponent(page, "dropdown-menu", "reduced", "dropdown-menu-trigger");
      await page.locator(scoped("dropdown-menu", '[data-slot="dropdown-menu-trigger"]')).first().click();
      await expect(page.getByRole("menu")).toBeVisible();
      await page.waitForTimeout(300);

      expect(await recordedPresence(page, "initial", "dropdown-menu-content")).toEqual(CLOCKS.menu.reduced);
      expect(await computed(page, '[data-slot="dropdown-menu-content"]', "transition-property")).toBe(
        SURFACE_FOREGROUND_SHADOW,
      );
      expect(await computed(page, '[data-slot="dropdown-menu-content"]', "transition-duration")).toMatch(
        ZERO_COLOUR_CLOCK,
      );
      expect((await recordedScale(page)).min).toBe(1);
    });
  });
});

test.describe("context-menu", () => {
  // The same panel as `dropdown-menu` with one difference that matters: it approaches from
  // the pointer rather than from a trigger edge. Its classes are a separate copy, so a token
  // regression in that copy would otherwise pass the whole suite.
  for (const prefersReduced of PREFERENCES) {
    test.describe(preferenceName(prefersReduced), () => {
      test.use({ reducedMotion: prefersReduced ? "reduce" : "no-preference" });

      for (const requested of MODES) {
        const mode = effectiveMode(requested, prefersReduced);

        test(`opening: ?motion=${requested} → ${mode}`, async ({ page }) => {
          await recordScale(page, '[data-slot="context-menu-content"]');
          await recordPresence(page, '[data-slot="context-menu-content"]');
          await openComponent(page, "context-menu", requested, "context-menu-trigger", mode);

          await page
            .locator(scoped("context-menu", '[data-slot="context-menu-trigger"]'))
            .first()
            .click({ button: "right" });
          await expect(page.getByRole("menu")).toBeVisible();
          await page.waitForTimeout(300);

          const panel = page.locator('[data-slot="context-menu-content"]');
          await expect(panel).toHaveAttribute("data-motion", mode);

          // Same writer and clocks as the dropdown menu; only the resolved side differs, and
          // the side is Base UI's placement, not a Cadence input.
          expect(await recordedPresence(page, "initial", "context-menu-content")).toEqual(CLOCKS.menu[mode]);
          expect(await holdsFocus(panel)).toBe(true);
          expect(await computed(page, '[data-slot="context-menu-content"]', "transition-property")).toBe(
            SURFACE_FOREGROUND_SHADOW,
          );
          expect(await computed(page, '[data-slot="context-menu-content"]', "transition-duration")).toMatch(
            ZERO_COLOUR_CLOCK,
          );

          const enter = await recordedScale(page);
          expect(enter.frames).toBeGreaterThan(3);
          expect(enter.min).toBe(1);
        });
      }
    });
  }
});

test.describe("menubar", () => {
  // The composed menu: its parts come from `dropdown-menu` through a registry dependency, so
  // this block proves the entrance survives the composition and the menubar slots land on
  // the same panel element.
  for (const prefersReduced of PREFERENCES) {
    test.describe(preferenceName(prefersReduced), () => {
      test.use({ reducedMotion: prefersReduced ? "reduce" : "no-preference" });

      for (const requested of MODES) {
        const mode = effectiveMode(requested, prefersReduced);

        test(`opening: ?motion=${requested} → ${mode}`, async ({ page }) => {
          await recordScale(page, '[data-slot="menubar-content"]');
          await recordPresence(page, '[data-slot="menubar-content"]');
          await openComponent(page, "menubar", requested, "menubar-trigger", mode);

          await page.locator(scoped("menubar", '[data-slot="menubar-trigger"]')).first().click();
          await expect(page.getByRole("menu")).toBeVisible();
          await page.waitForTimeout(300);

          const panel = page.locator('[data-slot="menubar-content"]');
          await expect(panel).toHaveAttribute("data-motion", mode);

          // The composed panel resolves the same `presence.menu` binding and the same colour
          // owner as its source component.
          expect(await recordedPresence(page, "initial", "menubar-content")).toEqual(CLOCKS.menu[mode]);
          expect(await holdsFocus(panel)).toBe(true);
          expect(await computed(page, '[data-slot="menubar-content"]', "transition-property")).toBe(
            SURFACE_FOREGROUND_SHADOW,
          );
          expect(await computed(page, '[data-slot="menubar-content"]', "transition-duration")).toMatch(
            ZERO_COLOUR_CLOCK,
          );

          const enter = await recordedScale(page);
          expect(enter.frames).toBeGreaterThan(3);
          expect(enter.min).toBe(1);
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
