import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import {
  computed,
  effectiveMode,
  MODES,
  markPresencePhase,
  recordedPresence,
  recordedScale,
  recordPresence,
  recordScale,
  scoped,
} from "./helpers";

/** Both modal surfaces this palette composes: the Dialog panel and its backdrop. */
const PRESENCE = '[data-slot="dialog-content"], [data-slot="dialog-overlay"]';

/** The declared clock of `enter.pop/surface` (panel) and `enter.pop/opacity` (backdrop). */
const PANEL = {
  full: { opacity: [220], spatial: [220] },
  reduced: { opacity: [132], spatial: [] },
  none: { opacity: [], spatial: [] },
};
const OVERLAY = {
  full: { opacity: [220], spatial: [] },
  reduced: { opacity: [132], spatial: [] },
  none: { opacity: [], spatial: [] },
};

async function openCommandPage(page: Page, requested: string, expected: string) {
  await page.goto(`/components/command?motion=${requested}`);
  await page.waitForLoadState("networkidle");
  await expect(page.locator('[data-preview="command"]')).toHaveAttribute("data-preview-motion", expected);
}

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test.describe(`command ${reducedMotion}`, () => {
    test.use({ reducedMotion });
    for (const requested of MODES) {
      test(`popup motion ${requested}`, async ({ page }) => {
        const mode = effectiveMode(requested, reducedMotion === "reduce");
        await recordScale(page, '[data-slot="dialog-content"]');
        await recordPresence(page, PRESENCE);
        await openCommandPage(page, requested, mode);
        const trigger = page.getByRole("button", { name: "Open command palette" });
        await markPresencePhase(page, "first-open");
        await trigger.click();
        const popup = page.getByRole("dialog", { name: "Workspace commands" });
        await expect(popup).toBeVisible();
        await expect(popup.getByRole("combobox")).toBeFocused();
        await expect(popup).toHaveAttribute("data-motion", mode);
        await expect.poll(() => computed(page, '[data-slot="dialog-content"]', "opacity")).toBe("1");
        // The panel's entrance is the presence controller's own Web Animation, so the
        // declared clock is read from the writer it started. `transition-duration` on
        // this node describes the colour family, which focus settles to 0s, and says
        // nothing about whether `enter.pop/surface` ran.
        expect(await recordedPresence(page, "first-open", "dialog-content")).toEqual(PANEL[mode]);
        // The backdrop keeps its own single opacity writer on the same transaction.
        expect(await recordedPresence(page, "first-open", "dialog-overlay")).toEqual(OVERLAY[mode]);
        // That backdrop clock is a real CSS transition family, so its token binding is
        // still observable as a computed duration.
        expect(await computed(page, '[data-slot="dialog-overlay"]', "transition-duration")).toBe(
          { full: "0.16s", reduced: "0.096s", none: "0s" }[mode],
        );
        const samples = await recordedScale(page);
        if (mode === "full") expect(samples.min).toBeLessThan(0.99);
        else expect(samples.min).toBe(1);
        await popup.getByRole("combobox").fill("zzzzzz");
        await expect(popup.getByText("No actions found.")).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(popup).not.toBeVisible();
        await expect(trigger).toBeFocused();

        // A reopen is a second entrance on a fresh surface, not an already-visible
        // render: the `enter` gate only declines a panel that mounts already open.
        await markPresencePhase(page, "reopen");
        await trigger.click();
        await expect(popup).toBeVisible();
        await expect(popup.getByRole("combobox")).toBeFocused();
        await expect.poll(() => computed(page, '[data-slot="dialog-content"]', "opacity")).toBe("1");
        expect(await recordedPresence(page, "reopen", "dialog-content")).toEqual(PANEL[mode]);
        expect(await recordedPresence(page, "reopen", "dialog-overlay")).toEqual(OVERLAY[mode]);
      });
    }
  });
}
for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`command ${colorScheme}`, () => {
    test.use({ colorScheme });
    test("keyboard path, axe and screenshots", async ({ page }, testInfo) => {
      await openCommandPage(page, "none", "none");
      const preview = page.locator('[data-preview="command"]');
      await preview.screenshot({ path: testInfo.outputPath(`command-${colorScheme}-top.png`) });
      expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual(
        [],
      );
      await page.getByRole("button", { name: "Open command palette" }).click();
      const popup = page.getByRole("dialog");
      await expect(popup.getByRole("combobox")).toBeFocused();
      expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual(
        [],
      );
      await popup.screenshot({ path: testInfo.outputPath(`command-${colorScheme}-dialog.png`) });
      await page.keyboard.press("Home");
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Enter");
      await expect(popup).not.toBeVisible();
      await expect(page.locator(scoped("command", '[role="status"]'))).toHaveText("Executed: settings");
    });
  });
}
