import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { effectiveMode, MODES } from "./helpers";

const catalog: Record<string, string[]> = JSON.parse(await readFile("components/site/previews/examples.json", "utf8"));
const ids = ["dialog", "alert-dialog", "popover", "tooltip"].filter((id) => catalog[id]);
const card = (page: Page, id: string, name: string) => page.locator(`[data-component-example="${id}/${name}"]`);
const popup = (page: Page, id: string) => page.locator(`[data-slot="${id}-content"]`);
async function setMode(page: Page, value: string) {
  await page
    .locator('[role=group][aria-label="Motion mode"] button')
    .filter({ hasText: new RegExp(`^${value}$`) })
    .evaluate((node) => (node as HTMLButtonElement).click());
}
async function dismiss(page: Page, id: string) {
  await page.keyboard.press("Escape");
  await expect(popup(page, id)).toHaveCount(0);
  await page.mouse.move(0, 0);
}

for (const id of ids) {
  for (const mode of MODES)
    for (const os of [false, true])
      test(`${id} body popups inherit modes and keep unique portal references ${mode}/${os}`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
        await page.goto(`/components/${id}?motion=${mode}`);
        await page.waitForLoadState("networkidle");
        for (const name of (catalog[id] ?? []).filter((name) => name !== "without-motion")) {
          const specimen = card(page, id, name);
          await expect(specimen).toHaveAttribute("data-preview-motion", effectiveMode(mode, os));
          // Controlled examples also support an external opener without a primitive trigger.
          const triggers = specimen.locator(`[data-slot="${id}-trigger"]`);
          const openers = (await triggers.count()) ? triggers : specimen.getByRole("button").first();
          for (const opener of await openers.all()) {
            await opener.scrollIntoViewIfNeeded();
            if (id === "tooltip") await opener.focus();
            else await opener.click();
            const surface = popup(page, id);
            await expect(surface).toBeVisible();
            await expect(surface).toHaveAttribute("data-motion", effectiveMode(mode, os));
            expect(await surface.evaluate((node) => !node.closest("[data-component-example]"))).toBe(true);
            const reference = await (id === "tooltip" ? opener : surface).getAttribute(
              id === "tooltip" ? "aria-describedby" : "aria-labelledby",
            );
            expect(reference).toBeTruthy();
            expect(
              await page.evaluate(
                (value) =>
                  value
                    ?.split(" ")
                    .every(
                      (id) => [...document.querySelectorAll("[id]")].filter((node) => node.id === id).length === 1,
                    ),
                reference,
              ),
            ).toBe(true);
            if (effectiveMode(mode, os) !== "full")
              expect(await surface.evaluate((node) => getComputedStyle(node).scale)).toBe("none");
            if (mode === "none") expect(await surface.evaluate((node) => node.getAnimations().length)).toBe(0);
            await dismiss(page, id);
          }
        }
      });

  for (const os of [false, true])
    test(`${id} explicit none first insertion and nested full clock ${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
      await page.addInitScript((id) => {
        const state = window as unknown as {
          popupFirstFrames: { mode: string | null; opacity: string; scale: string; animations: number }[];
          stopPopupProbe: boolean;
        };
        state.popupFirstFrames = [];
        const sample = () => {
          const nodes = document.querySelectorAll(`[data-testid="initial-none"], [data-slot="${id}-overlay"]`);
          for (const node of nodes) {
            const s = getComputedStyle(node);
            state.popupFirstFrames.push({
              mode: node.getAttribute("data-motion"),
              opacity: s.opacity,
              scale: s.scale,
              animations: node.getAnimations().length,
            });
          }
        };
        const observer = new MutationObserver(sample);
        observer.observe(document, { childList: true, subtree: true, attributes: true });
        const tick = () => {
          sample();
          if (!state.stopPopupProbe) requestAnimationFrame(tick);
          else observer.disconnect();
        };
        tick();
      }, id);
      await page.goto(`/components/${id}?motion=full`);
      await page.waitForLoadState("networkidle");
      const scopes = card(page, id, "without-motion");
      const none = scopes.getByText("Open without motion", { exact: true });
      if (id === "tooltip") await none.focus();
      else await none.click();
      await expect(page.getByTestId("initial-none")).toBeVisible();
      await page.waitForTimeout(180);
      const frames = await page.evaluate(() => {
        const state = window as unknown as {
          popupFirstFrames: { mode: string; opacity: string; scale: string; animations: number }[];
          stopPopupProbe: boolean;
        };
        state.stopPopupProbe = true;
        return state.popupFirstFrames;
      });
      expect(frames.length).toBeGreaterThan(3);
      expect(
        frames.every(
          (frame) => frame.mode === "none" && frame.opacity === "1" && frame.scale === "none" && frame.animations === 0,
        ),
      ).toBe(true);
      await dismiss(page, id);
      const full = scopes.getByText("Open nested full", { exact: true });
      if (id === "tooltip") await full.focus();
      else await full.click();
      const surface = page.getByTestId("nested-full");
      await expect(surface).toHaveAttribute("data-motion", effectiveMode("full", os));
      await expect.poll(() => surface.evaluate((node) => node.getAnimations().length)).toBeGreaterThan(0);
      await dismiss(page, id);
    });

  for (const theme of ["light", "dark"])
    for (const width of [1280, 390])
      test(`${id} body popup visual and accessible ${theme}/${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.addInitScript((theme) => localStorage.setItem("cadence-theme", theme), theme);
        await page.goto(`/components/${id}?motion=none`);
        await page.waitForLoadState("networkidle");
        for (const name of (catalog[id] ?? []).filter((name) => name !== "without-motion")) {
          const specimen = card(page, id, name);
          await specimen.scrollIntoViewIfNeeded();
          await specimen.screenshot({ path: `.cache/b4-proof/${id}-${name}-${theme}-${width}.png` });
          const triggers = specimen.locator(`[data-slot="${id}-trigger"]`);
          const trigger = (await triggers.count()) ? triggers.first() : specimen.getByRole("button").first();
          if (id === "tooltip") await trigger.focus();
          else await trigger.click();
          const surface = popup(page, id);
          await expect(surface).toBeVisible();
          expect(
            (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations,
          ).toEqual([]);
          const box = await surface.boundingBox();
          if (!box) throw new Error("missing popup bounds");
          expect(box.x).toBeGreaterThanOrEqual(0);
          expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
          await page.screenshot({ path: `.cache/b4-proof/${id}-${name}-${theme}-${width}-open.png` });
          await dismiss(page, id);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      });
}

if (catalog.dialog)
  test("dialog edits, independent drafts, controlled close, long scrolling and modality", async ({ page }) => {
    await page.goto("/components/dialog?motion=none");
    await page.waitForLoadState("networkidle");
    const editing = card(page, "dialog", "editing");
    const opener = editing.getByRole("button", { name: "Rename project" });
    await opener.click();
    const surface = popup(page, "dialog");
    const input = surface.getByLabel("Project name");
    await input.fill("New draft");
    const savedInput = await input.elementHandle();
    await input.focus();
    for (const mode of ["full", "reduced", "none"]) {
      await setMode(page, mode);
      await expect(input).toHaveValue("New draft");
      await expect(input).toBeFocused();
      expect(await input.evaluate((node, saved) => node === saved, savedInput)).toBe(true);
    }
    await surface.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(opener).toBeFocused();
    await expect(editing.getByRole("status")).toHaveText("Project: cadence-ui");
    await opener.click();
    await expect(input).toHaveValue("New draft");
    await surface.getByRole("button", { name: "Save name" }).click();
    await expect(editing.getByRole("status")).toHaveText("Project: New draft");
    await expect(page.locator('[data-preview="dialog"]').getByRole("status")).toHaveText("Project: cadence-ui");
    const controlled = card(page, "dialog", "controlled");
    await controlled.getByRole("button").click();
    await surface.getByRole("button", { name: "Finish task" }).click();
    await expect(controlled.getByRole("button")).toBeFocused();
    await expect(controlled.getByRole("status")).toHaveText("Dialog closed");
    await card(page, "dialog", "without-close").getByRole("button").click();
    await expect(surface.getByRole("button")).toHaveCount(1);
    await surface.getByRole("button", { name: "Done reviewing" }).click();
    await card(page, "dialog", "footer-close").getByRole("button").click();
    await surface.getByRole("button", { name: "Prepare export" }).click();
    await expect(surface.getByRole("status")).toHaveText("Export prepared");
    await surface.locator('[data-slot="dialog-footer"]').getByRole("button", { name: "Close", exact: true }).click();
    await card(page, "dialog", "long-content").getByRole("button").click();
    expect(
      await surface.evaluate(
        (node) => node.scrollHeight > node.clientHeight && node.clientHeight <= innerHeight * 0.7 + 1,
      ),
    ).toBe(true);
    await surface.hover();
    await page.mouse.wheel(0, 1000);
    await expect.poll(() => surface.evaluate((node) => node.scrollTop)).toBeGreaterThan(100);
    await surface.locator('[data-slot="dialog-footer"]').getByRole("button").click();
    for (const value of ["true", "false", "trap-focus"]) {
      const trigger = card(page, "dialog", "modality").getByRole("button", { name: value, exact: true });
      await trigger.click();
      await expect(surface).toBeVisible();
      if (value !== "false")
        for (let i = 0; i < 4; i++) {
          await page.keyboard.press("Tab");
          expect(await surface.evaluate((node) => node.contains(document.activeElement))).toBe(true);
        }
      expect(
        await page.evaluate(
          () =>
            getComputedStyle(document.body).overflow === "hidden" ||
            getComputedStyle(document.documentElement).overflow === "hidden",
        ),
      ).toBe(value === "true");
      await dismiss(page, "dialog");
    }
  });

if (catalog.popover)
  test("popover placement axes, columns, retained form, controlled anchor and modal close parts", async ({ page }) => {
    await page.goto("/components/popover?motion=none");
    await page.waitForLoadState("networkidle");
    const surface = popup(page, "popover");
    const columns = card(page, "popover", "columns");
    await columns.getByRole("button").click();
    await surface.getByRole("checkbox", { name: "Updated", exact: true }).check();
    await expect(surface.locator('[data-slot="popover-description"]')).toHaveText("4 of four columns are shown.");
    await dismiss(page, "popover");
    await page.locator('[data-preview="popover"]').getByRole("button").click();
    await expect(surface.getByRole("checkbox", { name: "Updated", exact: true })).not.toBeChecked();
    await dismiss(page, "popover");
    for (const side of ["top", "right", "bottom", "left"]) {
      const trigger = card(page, "popover", "sides").getByRole("button", { name: side, exact: true });
      await trigger.scrollIntoViewIfNeeded();
      await trigger.click();
      await expect(surface).toHaveAttribute("data-side", side);
      const anchor = await trigger.boundingBox();
      const panel = await surface.boundingBox();
      if (!anchor || !panel) throw new Error("missing anchored geometry");
      if (side === "top") expect(panel.y + panel.height).toBeLessThan(anchor.y);
      if (side === "bottom") expect(panel.y).toBeGreaterThan(anchor.y + anchor.height);
      if (side === "left") expect(panel.x + panel.width).toBeLessThan(anchor.x);
      if (side === "right") expect(panel.x).toBeGreaterThan(anchor.x + anchor.width);
      await dismiss(page, "popover");
    }
    for (const align of ["start", "center", "end"]) {
      const trigger = card(page, "popover", "alignments").getByRole("button", { name: align, exact: true });
      await trigger.click();
      const anchor = await trigger.boundingBox();
      const panel = await surface.boundingBox();
      if (!anchor || !panel) throw new Error("missing alignment geometry");
      const fraction = { start: 0, center: 0.5, end: 1 }[align] ?? 0;
      expect(Math.abs(panel.x + panel.width * fraction - anchor.x - anchor.width * fraction)).toBeLessThan(1);
      await dismiss(page, "popover");
    }
    for (const side of ["inline-start", "inline-end"]) {
      const trigger = card(page, "popover", "logical-sides").getByRole("button", { name: side, exact: true });
      await trigger.click();
      const anchor = await trigger.boundingBox();
      const panel = await surface.boundingBox();
      if (!anchor || !panel) throw new Error("missing logical geometry");
      if (side === "inline-start") expect(panel.x).toBeGreaterThan(anchor.x + anchor.width);
      else expect(panel.x + panel.width).toBeLessThan(anchor.x);
      await dismiss(page, "popover");
    }
    const form = card(page, "popover", "form");
    await setMode(page, "full");
    await form.getByRole("button").click();
    const input = surface.getByLabel("View name");
    await input.fill("Release review");
    const saved = await input.elementHandle();
    await input.focus();
    for (const reducedMotion of ["reduce", "no-preference"] as const) {
      await page.emulateMedia({ reducedMotion });
      await expect(input).toHaveValue("Release review");
      await expect(input).toBeFocused();
      expect(await input.evaluate((node, saved) => node === saved, saved)).toBe(true);
    }
    const triggerNode = await form.getByRole("button").elementHandle();
    for (const mode of ["reduced", "none", "full"]) {
      // A real header press is also an outside press: preserve that dismissal.
      await page.getByRole("group", { name: "Motion mode" }).getByRole("button", { name: mode, exact: true }).click();
      await expect(surface).toHaveCount(0);
      expect(await form.getByRole("button").evaluate((node, saved) => node === saved, triggerNode)).toBe(true);
      await form.getByRole("button").click();
      await expect(input).toHaveValue("Release review");
    }
    await dismiss(page, "popover");
    await expect(form.getByRole("status")).toHaveText("View: Open PRs");
    await form.getByRole("button").click();
    await expect(input).toHaveValue("Release review");
    await input.press("Enter");
    await expect(form.getByRole("status")).toHaveText("View: Release review");
    const controlled = card(page, "popover", "controlled");
    await controlled.getByRole("button", { name: "Open from application state" }).click();
    await expect(controlled.getByRole("button", { name: "View options" })).toHaveAttribute("aria-expanded", "true");
    await surface.getByRole("button", { name: "Finish editing" }).click();
    await expect(controlled.getByRole("button", { name: "Open from application state" })).toBeFocused();
    for (const value of ["false", "true", "trap-focus"]) {
      await card(page, "popover", "modal").getByRole("button", { name: value, exact: true }).click();
      await expect(surface.getByRole("button", { name: "Close options" })).toBeFocused();
      if (value !== "false")
        for (let i = 0; i < 4; i++) {
          await page.keyboard.press("Tab");
          expect(await surface.evaluate((node) => node.contains(document.activeElement))).toBe(true);
        }
      expect(
        await page.evaluate(
          () =>
            getComputedStyle(document.body).overflow === "hidden" ||
            getComputedStyle(document.documentElement).overflow === "hidden",
        ),
      ).toBe(value === "true");
      await surface.getByRole("button", { name: "Close options" }).click();
      await expect(surface).toHaveCount(0);
    }
  });

if (catalog["alert-dialog"])
  test("alert-dialog sizes, outside protection, focus, confirmation and caller-owned pending", async ({ page }) => {
    await page.goto("/components/alert-dialog?motion=none");
    await page.waitForLoadState("networkidle");
    const surface = popup(page, "alert-dialog");
    const sizes = card(page, "alert-dialog", "sizes");
    for (const size of ["default", "sm"]) {
      const trigger = sizes.getByRole("button", { name: size === "sm" ? "Archive" : "Delete project", exact: true });
      await trigger.click();
      await expect(surface).toHaveAttribute("data-size", size);
      expect((await surface.boundingBox())?.width).toBe(size === "sm" ? 320 : 512);
      await expect(surface.locator('[data-slot="alert-dialog-cancel"]')).toBeFocused();
      await page.mouse.click(8, 300);
      await expect(surface).toBeVisible();
      await surface.locator('[data-slot="alert-dialog-cancel"]').press("Enter");
      await expect(surface).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await trigger.click();
      await surface.locator('[data-slot="alert-dialog-action"]').click();
      await expect(surface).toHaveCount(0);
      await expect(sizes.getByRole("status").nth(size === "sm" ? 1 : 0)).toContainText(
        size === "sm" ? "archived" : "deleted",
      );
    }
    const icon = card(page, "alert-dialog", "icon");
    await icon.getByRole("button").click();
    await expect(surface.locator('[data-slot="alert-dialog-media"] svg')).toHaveAttribute("aria-hidden", "true");
    await dismiss(page, "alert-dialog");
    const controlled = card(page, "alert-dialog", "controlled");
    await controlled.getByRole("button").click();
    await surface.getByRole("button", { name: "Revoke key", exact: true }).click();
    await expect(controlled.getByRole("status")).toHaveText("Key revoked locally");
    await expect(controlled.getByRole("button")).toBeFocused();
    const pending = card(page, "alert-dialog", "pending");
    await pending.getByRole("button").click();
    await surface.getByRole("button", { name: "Delete draft", exact: true }).click();
    await expect(surface.getByRole("status")).toHaveText("Deletion pending");
    await expect(surface.getByRole("button", { name: "Deleting…", exact: true })).toBeDisabled();
    await expect(surface.getByRole("button", { name: "Keep draft", exact: true })).toBeDisabled();
    await page.keyboard.press("Escape");
    await expect(surface).toBeVisible();
    const saved = await surface.elementHandle();
    for (const mode of ["full", "reduced", "none"]) {
      await setMode(page, mode);
      await expect(surface.getByRole("status")).toHaveText("Deletion pending");
      expect(await surface.evaluate((node, saved) => node === saved, saved)).toBe(true);
    }
    await surface.getByRole("button", { name: "Complete request", exact: true }).click();
    await expect(surface).toHaveCount(0);
    await expect(pending.getByRole("status")).toHaveText("Draft deleted locally");
    await expect(pending.getByRole("button")).toBeFocused();
    await page.setViewportSize({ width: 390, height: 900 });
    await sizes.getByRole("button", { name: "Archive", exact: true }).click();
    expect((await surface.boundingBox())?.width).toBe(320);
    await expect(surface.locator('[data-slot="alert-dialog-footer"]')).toHaveCSS(
      "grid-template-columns",
      "131px 131px",
    );
    await dismiss(page, "alert-dialog");
  });
