import { expect, type Locator, type Page, test } from "@playwright/test";
import { duration, reducedDurationScale } from "../../registry/cadence/lib/motion";
import { effectiveMode, MODES } from "./helpers";

async function navigation(page: Page, width: number) {
  if (width >= 768) return page.getByRole("complementary", { name: "Documentation sidebar" });
  const disclosure = page.locator("details").filter({ has: page.locator("summary").filter({ hasText: /^Browse/ }) });
  if (!(await disclosure.evaluate((node) => node.hasAttribute("open")))) {
    await disclosure.locator("summary").click();
  }
  return disclosure;
}

async function follow(page: Page, width: number, id: string) {
  const nav = await navigation(page, width);
  const link = nav.locator(`a[href="/components/${id}"]`);
  await link.focus();
  await link.press("Enter");
  await expect(page).toHaveURL(new RegExp(`/components/${id}$`));
  await expect(page.locator(`[data-preview="${id}"]`)).toBeVisible();
  await page.waitForLoadState("networkidle");
}

// Observe a real node without changing its writer or clock. Start the detached
// window after React's removal/cleanup paint, retaining connected samples as a
// positive control. This proves a bounded absence of late writes, not heap/CPU use.
async function watchRemoval(target: Locator) {
  return target.evaluateHandle((node) => {
    const result = {
      node,
      removed: false,
      detachedFrames: 0,
      connectedTransforms: [] as string[],
      lateMutations: [] as string[],
      detachedAnimations: [] as number[],
      stop: () => {},
    };
    let stopped = false;
    let armed = false;
    const observer = new MutationObserver((records) => {
      if (armed) result.lateMutations.push(...records.map((record) => `${record.type}:${record.attributeName}`));
    });
    observer.observe(node, { attributes: true, childList: true, subtree: true });
    let frame = 0;
    const tick = () => {
      if (stopped) return;
      if (node.isConnected) result.connectedTransforms.push(getComputedStyle(node).transform);
      else {
        result.removed = true;
        result.detachedFrames++;
        if (result.detachedFrames >= 2) {
          armed = true;
          result.detachedAnimations.push(node.getAnimations({ subtree: true }).length);
        }
      }
      frame = requestAnimationFrame(tick);
    };
    result.stop = () => {
      stopped = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
    frame = requestAnimationFrame(tick);
    return result;
  });
}

for (const width of [1280, 390]) {
  for (const os of ["no-preference", "reduce"] as const) {
    for (const mode of MODES) {
      test(`route cleanup preserves shared settings ${width}/${mode}/${os}`, async ({ page }, info) => {
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
        page.on("console", (message) => {
          if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
        });
        page.on("response", (response) => {
          if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`);
        });
        const theme = width === 390 ? "dark" : "light";
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion: os, colorScheme: theme });
        await page.goto(`/components/toast?motion=${mode}&speed=0.25`);
        await page.waitForLoadState("networkidle");
        const effective = effectiveMode(mode, os === "reduce");
        const header = await page.getByRole("banner").elementHandle();
        const sidebar = await page
          .getByRole("complementary", { name: "Documentation sidebar", includeHidden: true })
          .elementHandle();
        const documentNode = await page.locator("html").elementHandle();
        const assertShared = async (id: string) => {
          expect(await page.locator("html").evaluate((node, saved) => node === saved, documentNode)).toBe(true);
          expect(await page.getByRole("banner").evaluate((node, saved) => node === saved, header)).toBe(true);
          expect(
            await page
              .getByRole("complementary", { name: "Documentation sidebar", includeHidden: true })
              .evaluate((node, saved) => node === saved, sidebar),
          ).toBe(true);
          expect(await page.locator("html").evaluate((node) => node.classList.contains("dark"))).toBe(theme === "dark");
          await expect(page.locator(`[data-preview="${id}"]`)).toHaveAttribute("data-preview-motion", effective);
          await expect(
            page.getByLabel("Motion speed", { exact: true }).locator('[data-slot="select-value"]'),
          ).toHaveText("0.25×");
        };
        await assertShared("toast");

        // Both an indefinite portal and a real pending five-second timer leave
        // with their route. The other examples' managers must remain independent.
        await page
          .locator('[data-preview="toast"]')
          .getByRole("button", { name: "Show notification", exact: true })
          .click();
        const timers = page.locator('[data-component-example="toast/timers"]');
        await timers.getByRole("button", { name: "Add timed notification", exact: true }).click();
        await expect(page.locator('[data-slot="toast"]')).toHaveCount(2);
        await expect(page.locator('[data-slot="toast-viewport"][aria-label="Timer notifications"]')).toHaveCount(1);
        const toast = page.locator('[data-slot="toast"]').filter({ hasText: "Timed notification" });
        const toastProbe = await watchRemoval(toast);
        await follow(page, width, "carousel");
        await assertShared("carousel");
        await expect(page.locator('[data-slot="toast"]')).toHaveCount(0);
        await expect(page.locator('[data-slot="toast-viewport"][aria-label="Timer notifications"]')).toHaveCount(0);

        const carousel = page.locator('[data-preview="carousel"]');
        const track = carousel.locator('[data-slot="carousel-content"] > div');
        const trackProbe = await watchRemoval(track);
        await carousel.getByRole("region", { name: "Project highlights", exact: true }).focus();
        await page.keyboard.press("ArrowRight");
        await expect(carousel.getByRole("button", { name: "Previous slide", exact: true })).toBeEnabled();
        const motion = await track.evaluate(async (node) => {
          const samples: string[] = [];
          for (let frame = 0; frame < 6; frame++) {
            await new Promise(requestAnimationFrame);
            samples.push(getComputedStyle(node).transform);
          }
          return samples;
        });
        expect(new Set(motion).size)[effective === "full" ? "toBeGreaterThan" : "toBe"](1);
        await follow(page, width, "input");
        await assertShared("input");
        await expect(page.locator('[data-slot="carousel"]')).toHaveCount(0);
        const input = page.locator('[data-preview="input"]').getByRole("textbox", { name: "Workspace", exact: true });
        await input.fill("Route cleanup checked");
        await expect(input).toBeFocused();

        // Observe beyond the abandoned toast's original timeout, with focus on
        // the new route. A stale timer/portal must not return or steal that focus.
        await page.waitForTimeout(5_500);
        await expect(input).toHaveValue("Route cleanup checked");
        await expect(input).toBeFocused();
        await expect(page.locator('[data-slot="toast"]')).toHaveCount(0);
        const removals = [];
        for (const [name, probe] of [
          ["toast", toastProbe],
          ["carousel-track", trackProbe],
        ] as const) {
          const result = await probe.evaluate((record) => {
            record.stop();
            return {
              removed: record.removed,
              detachedFrames: record.detachedFrames,
              connectedTransforms: record.connectedTransforms,
              lateMutations: record.lateMutations,
              detachedAnimations: record.detachedAnimations,
            };
          });
          removals.push({ name, ...result });
          expect(result.removed).toBe(true);
          expect(result.detachedFrames).toBeGreaterThan(2);
          expect(result.connectedTransforms.length).toBeGreaterThan(0);
          expect(result.lateMutations).toEqual([]);
          expect(result.detachedAnimations.every((count) => count === 0)).toBe(true);
          await probe.dispose();
        }
        await follow(page, width, "toast");
        await assertShared("toast");
        await expect(page.locator('[data-slot="toast"]')).toHaveCount(0);
        await page
          .locator('[data-preview="toast"]')
          .getByRole("button", { name: "Show notification", exact: true })
          .click();
        const fresh = page.locator('[data-slot="toast"]');
        await expect(fresh).toHaveCount(1);
        await expect(fresh).toHaveAttribute("data-motion", effective);
        const clock =
          effective === "none" ? 0 : duration.base * 4 * (effective === "reduced" ? reducedDurationScale : 1);
        await expect(fresh).toHaveCSS("transition-duration", `${clock}s`);
        await page.keyboard.press("F6");
        await page.keyboard.press("Tab");
        await expect(fresh).toBeFocused();
        await page.keyboard.press("Tab");
        await expect(fresh.getByRole("button", { name: "Close toast", exact: true })).toBeFocused();
        await page.keyboard.press("Enter");
        await expect(fresh).toHaveCount(0);
        await info.attach("route-lifecycle", {
          body: JSON.stringify({ width, os, mode, effective, theme, motion, removals, errors }),
          contentType: "application/json",
        });
        expect(errors).toEqual([]);
      });
      test(`history departure releases modal ownership ${width}/${mode}/${os}`, async ({ page }, info) => {
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
        page.on("console", (message) => {
          if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
        });
        page.on("response", (response) => {
          if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`);
        });
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion: os });
        await page.goto(`/components/input?motion=${mode}&speed=0.25`);
        await page.waitForLoadState("networkidle");
        const documentNode = await page.locator("html").elementHandle();
        const bodyState = () =>
          page.evaluate(() => ({
            overflow: getComputedStyle(document.body).overflow,
            htmlOverflow: getComputedStyle(document.documentElement).overflow,
            pointerEvents: getComputedStyle(document.body).pointerEvents,
          }));
        const before = await bodyState();
        await follow(page, width, "dialog");
        await page
          .locator('[data-preview="dialog"]')
          .getByRole("button", { name: "Rename project", exact: true })
          .click();
        const dialog = page.getByRole("dialog", { name: "Rename project", exact: true });
        await expect(dialog).toBeVisible();
        await expect(dialog).toHaveAttribute("data-motion", effectiveMode(mode, os === "reduce"));
        await dialog.getByRole("textbox", { name: "Project name", exact: true }).fill("Abandoned dialog draft");
        await expect(dialog.getByRole("textbox", { name: "Project name", exact: true })).toBeFocused();
        const modalState = await bodyState();
        const probe = await watchRemoval(dialog);
        await page.goBack();
        await expect(page).toHaveURL(new RegExp(`/components/input\\?motion=${mode}&speed=0.25$`));
        await expect(page.locator('[data-preview="input"]')).toBeVisible();
        await expect(page.locator('[data-slot="dialog-content"], [data-slot="dialog-overlay"]')).toHaveCount(0);
        expect(await page.locator("html").evaluate((node, saved) => node === saved, documentNode)).toBe(true);
        await expect.poll(bodyState).toEqual(before);
        const input = page.locator('[data-preview="input"]').getByRole("textbox", { name: "Workspace", exact: true });
        await input.fill("Returned from modal");
        await expect(input).toBeFocused();
        await page.waitForTimeout(600);
        await expect(input).toBeFocused();
        const removed = await probe.evaluate((record) => {
          record.stop();
          return {
            removed: record.removed,
            detachedFrames: record.detachedFrames,
            lateMutations: record.lateMutations,
            detachedAnimations: record.detachedAnimations,
          };
        });
        await probe.dispose();
        await info.attach("history-modal-lifecycle", {
          body: JSON.stringify({ width, mode, os, before, modalState, removed, errors }),
          contentType: "application/json",
        });
        expect(removed.removed).toBe(true);
        expect(removed.detachedFrames).toBeGreaterThan(2);
        expect(removed.lateMutations).toEqual([]);
        expect(removed.detachedAnimations.every((count) => count === 0)).toBe(true);
        expect(errors).toEqual([]);
      });
    }
  }
}
