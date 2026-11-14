import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { effectiveMode, MODES, openComponent } from "./helpers";
import { installInitialControlProbe } from "./initial-control-probe";

const examples: Record<string, string[]> = JSON.parse(await readFile("components/site/previews/examples.json", "utf8"));

const parts = {
  checkbox: ["checkbox", "checkbox-indicator"],
  "radio-group": ["radio-group-item", "radio-group-indicator"],
  switch: ["switch", "switch-thumb"],
  slider: ["slider", "slider-thumb"],
  toggle: ["toggle", "toggle"],
  "toggle-group": ["toggle-group-item", "press-button-content"],
  "input-otp": ["input-otp", "input-otp-slot"],
  progress: ["progress", "progress-indicator"],
} as const;
type Id = keyof typeof parts;
const ids = Object.keys(parts) as Id[];
async function setMode(page: Page, mode: "full" | "reduced" | "none") {
  await page
    .getByRole("group", { name: "Motion mode" })
    .getByRole("button", { name: mode, exact: true })
    .evaluate((button: HTMLButtonElement) => button.click());
}

type Frame = { scale: number; x: number; opacity: number; animations: number };
async function record(page: Page, selector: string) {
  await page.evaluate((selector) => {
    const store = window as unknown as { frames: Frame[]; recording: boolean; observed: Element | null };
    store.frames = [];
    store.recording = true;
    store.observed = document.querySelector(selector);
    const tick = () => {
      const node = document.querySelector(selector);
      if (node) {
        const style = getComputedStyle(node);
        const matrix = new DOMMatrixReadOnly(style.transform === "none" ? undefined : style.transform);
        store.frames.push({
          scale: matrix.a,
          x: matrix.m41,
          opacity: Number(style.opacity),
          animations: node
            .getAnimations()
            .filter(
              (animation) =>
                animation.effect instanceof KeyframeEffect &&
                animation.effect
                  .getKeyframes()
                  .some((frame) => "opacity" in frame || "transform" in frame || "filter" in frame || "scale" in frame),
            ).length,
        });
      }
      if (store.recording) requestAnimationFrame(tick);
    };
    tick();
  }, selector);
}
async function frames(page: Page) {
  await page.waitForTimeout(460);
  return page.evaluate(() => {
    const store = window as unknown as { frames: Frame[]; recording: boolean };
    store.recording = false;
    return store.frames;
  });
}
function controlScope(id: Id) {
  return id === "progress" ? '[data-component-example="progress/caller-progress"]' : `[data-preview="${id}"]`;
}
async function act(page: Page, id: Id, held = false) {
  const p = page.locator(controlScope(id));
  if (id === "checkbox") await p.getByRole("checkbox", { name: "Unchecked", exact: true }).click();
  if (id === "radio-group")
    await p
      .getByRole("radio", {
        name:
          (await p.getByRole("radio", { name: "Starter", exact: true }).getAttribute("aria-checked")) === "true"
            ? "Team"
            : "Starter",
        exact: true,
      })
      .click();
  if (id === "switch") await p.getByRole("switch", { name: "Off", exact: true }).click();
  if (id === "input-otp")
    await p.getByRole("textbox", { name: "Verification code", exact: true }).pressSequentially("7");
  if (id === "progress")
    await p
      .getByRole("slider", { name: "Upload progress" })
      .fill((await p.getByRole("slider", { name: "Upload progress" }).inputValue()) === "20" ? "80" : "20");
  if (["slider", "toggle", "toggle-group"].includes(id)) {
    const node = p.locator(`[data-slot="${parts[id][1]}"]`).first();
    await node.scrollIntoViewIfNeeded();
    const box = await node.boundingBox();
    if (!box) throw new Error("missing control");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    if (!held) {
      await page.waitForTimeout(300);
      await page.mouse.up();
    }
  }
}
for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test.describe(`B3 ${reducedMotion}`, () => {
    test.use({ reducedMotion });
    for (const mode of MODES)
      for (const id of ids)
        test(`${id} recipe frames, cancellation and stable controls ${mode}`, async ({ page }, testInfo) => {
          const selector = `${controlScope(id)} [data-slot="${parts[id][1]}"]${id === "input-otp" ? " > span" : ""}`;
          await installInitialControlProbe(page);
          const actual = effectiveMode(mode, reducedMotion === "reduce");
          await openComponent(page, id, mode, parts[id][0], actual);
          const p = page.locator(controlScope(id));
          const node = page.locator(selector).first();
          expect(
            await page.evaluate(
              () =>
                (window as unknown as { initial: { animations: number }[] }).initial.length > 0 &&
                (window as unknown as { initial: { animations: number }[] }).initial.every((s) => s.animations === 0),
            ),
          ).toBe(true);
          const expectedPart = id === "input-otp" ? "input-otp-slot-text" : parts[id][1];
          expect(
            await page.evaluate(
              (slot) => (window as unknown as { initial: { slot: string }[] }).initial.some((s) => s.slot === slot),
              expectedPart,
            ),
          ).toBe(true);
          if (id === "checkbox" || id === "radio-group") {
            expect(
              await page.evaluate(
                (slot) =>
                  (
                    window as unknown as {
                      initial: { slot: string; mode: string; opacity: string; transform: string }[];
                    }
                  ).initial
                    .filter((s) => s.slot === slot)
                    .every((s) => s.mode === "none" && s.opacity === "1" && s.transform === "none"),
                expectedPart,
              ),
            ).toBe(true);
          }
          const staticScope = page.getByTestId("initial-none");
          expect(await staticScope.evaluate((n) => n.getAnimations({ subtree: true }).length)).toBe(0);
          await node.evaluate((n) => {
            (window as unknown as { stable: Element }).stable = n;
          });
          await record(page, selector);
          await act(page, id, true);
          const samples = await frames(page);
          await testInfo.attach("raw-control-frames", {
            body: JSON.stringify(
              await page.evaluate(
                (samples) => ({
                  initial: (window as unknown as { initial: unknown }).initial,
                  samples,
                  staticDOM: document.querySelector('[data-testid="initial-none"]')?.outerHTML,
                }),
                samples,
              ),
              null,
              2,
            ),
            contentType: "application/json",
          });
          expect(samples.length).toBeGreaterThan(4);
          if (["checkbox", "radio-group"].includes(id)) {
            if (actual === "full") expect(samples.some((s) => s.scale < 0.999)).toBe(true);
            else expect(samples.every((s) => s.scale === 1)).toBe(true);
            if (actual !== "none") expect(samples.some((s) => s.opacity > 0 && s.opacity < 1)).toBe(true);
          }
          if (id === "input-otp") {
            // v2 changed text owns the slot's own character lane: opacity only, inside a
            // fixed box, so the character never scales or travels. The exact character is
            // already committed when the text engine cannot prove its glyph copy.
            expect(samples.every((s) => s.scale === 1)).toBe(true);
            await expect(p.locator('[data-slot="input-otp-slot"]')).toHaveText(["7", "", "", "", "", ""]);
          }
          if (id === "switch") {
            expect(samples.at(-1)?.x).toBeGreaterThan(5);
            if (actual === "full") expect(new Set(samples.map((s) => s.x.toFixed(2))).size).toBeGreaterThan(3);
            else expect(new Set(samples.map((s) => s.x.toFixed(2))).size).toBeLessThanOrEqual(2);
          }
          if (["slider", "toggle", "toggle-group"].includes(id)) {
            if (actual === "full") expect(samples.at(-1)?.scale).toBeLessThan(0.99);
            else expect(samples.every((s) => s.scale === 1)).toBe(true);
          }
          if (id === "progress") {
            expect(samples.at(-1)?.scale).toBeCloseTo(0.2, 2);
            if (actual === "full") expect(new Set(samples.map((s) => s.scale.toFixed(3))).size).toBeGreaterThan(3);
            else expect(new Set(samples.map((s) => s.scale.toFixed(3))).size).toBeLessThanOrEqual(2);
            const pulse = page
              .locator('[data-preview="progress"]')
              .getByRole("progressbar", { name: "Preparing preview" })
              .locator('[data-slot="progress-indicator"]');
            const opacity = await pulse.evaluate(async (n) => {
              const values: string[] = [];
              const end = performance.now() + 400;
              while (performance.now() < end) {
                await new Promise(requestAnimationFrame);
                values.push(getComputedStyle(n).opacity);
              }
              return values;
            });
            expect(new Set(opacity).size > 1).toBe(actual !== "none");
          }
          // Cancel a running recipe on the same node, including a held press.
          await setMode(page, "full");
          if (["slider", "toggle", "toggle-group"].includes(id)) await page.mouse.up();
          if (id === "input-otp") {
            const input = p.getByRole("textbox", { name: "Verification code", exact: true });
            await input.press("ControlOrMeta+A");
            await input.press("Backspace");
            await expect(input).toHaveValue("");
            await expect(p.locator('[data-slot="input-otp-slot"]').first()).toHaveText("");
          }
          await record(page, selector);
          await act(page, id, true);
          await setMode(page, "none");
          await expect(p.locator(`[data-slot="${parts[id][0]}"]`).first()).toHaveAttribute("data-motion", "none");
          await record(page, selector);
          const stopped = await frames(page);
          expect(stopped.every((s) => s.animations === 0)).toBe(true);
          expect(new Set(stopped.map((s) => `${s.scale}/${s.x}/${s.opacity}`)).size).toBe(1);
          if (["slider", "toggle", "toggle-group"].includes(id)) await page.mouse.up();
          // Restore the same ordinary control via the header.
          await page
            .getByRole("group", { name: "Motion mode" })
            .getByRole("button", { name: "none", exact: true })
            .click();
          await setMode(page, "full");
          await expect(p.locator(`[data-slot="${parts[id][0]}"]`).first()).toHaveAttribute(
            "data-motion",
            effectiveMode("full", reducedMotion === "reduce"),
          );
          expect(await node.evaluate((n) => n === (window as unknown as { stable: Element }).stable)).toBe(true);
          if (id === "input-otp") {
            const input = p.getByRole("textbox", { name: "Verification code", exact: true });
            await input.press("ControlOrMeta+A");
            await input.press("Backspace");
            await expect(input).toHaveValue("");
            await expect(p.locator('[data-slot="input-otp-slot"]').first()).toHaveText("");
          }
          await record(page, selector);
          await act(page, id, true);
          const restored = await frames(page);
          if (reducedMotion === "no-preference" && id !== "input-otp") {
            const values = restored.map((s) =>
              id === "switch" ? s.x : ["checkbox", "radio-group"].includes(id) ? s.opacity : s.scale,
            );
            expect(new Set(values.map((v) => v.toFixed(4))).size).toBeGreaterThan(2);
          }
          if (id === "input-otp") {
            // The restored control writes the accepted character; its lane never scales.
            await expect(p.locator('[data-slot="input-otp-slot"]')).toHaveText(["7", "", "", "", "", ""]);
          }
          if (["slider", "toggle", "toggle-group"].includes(id)) await page.mouse.up();
          if (["toggle", "toggle-group", "input-otp", "progress"].includes(id)) {
            await setMode(page, "none");
            const scope = page.locator(`[data-component-example="${id}/without-motion"] [data-testid="explicit-full"]`);
            const part = scope.locator(`[data-slot="${parts[id][1]}"]${id === "input-otp" ? " > span" : ""}`).first();
            await expect(part).toHaveAttribute("data-motion", effectiveMode("full", reducedMotion === "reduce"));
            await scope.scrollIntoViewIfNeeded();
            const saved = await part.elementHandle();
            const nestedSelector = `[data-component-example="${id}/without-motion"] [data-testid="explicit-full"] [data-slot="${parts[id][1]}"]${id === "input-otp" ? " > span" : ""}`;
            await record(page, nestedSelector);
            if (id === "toggle" || id === "toggle-group") {
              const box = await part.boundingBox();
              if (!box) throw Error("missing explicit full control");
              await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
              await page.mouse.down();
            } else if (id === "input-otp") await scope.getByRole("textbox").pressSequentially("7");
            else await scope.getByRole("slider").fill("80");
            const samples = await frames(page);
            if (id === "toggle" || id === "toggle-group") await page.mouse.up();
            expect(samples.length).toBeGreaterThan(4);
            if (id === "input-otp") {
              // An explicit nested full scope keeps the same character lane: no scale,
              // and the accepted character is committed on this very node.
              expect(samples.every((s) => s.scale === 1)).toBe(true);
              await expect(scope.locator('[data-slot="input-otp-slot"]')).toHaveText(["7"]);
            } else if (reducedMotion === "no-preference")
              expect(new Set(samples.map((s) => s.scale.toFixed(4))).size).toBeGreaterThan(2);
            else expect(new Set(samples.map((s) => s.scale.toFixed(4))).size).toBeLessThanOrEqual(2);
            expect(await part.evaluate((n, saved) => n === saved, saved)).toBe(true);
            expect(
              await staticScope.evaluate((n) => n.querySelector("[data-motion]")?.getAttribute("data-motion")),
            ).toBe("none");
            await setMode(page, "full");
            await p.scrollIntoViewIfNeeded();
          } else {
            await setMode(page, "none");
            const nested = page.getByRole(
              id === "checkbox" ? "checkbox" : id === "radio-group" ? "radio" : id === "switch" ? "switch" : "slider",
              { name: `Explicit full ${id === "radio-group" ? "radio" : id}`, exact: true },
            );
            const nestedRoot = nested.locator(id === "slider" ? "xpath=../.." : "xpath=.");
            const nestedPart = nestedRoot.locator(`[data-slot="${parts[id][1]}"]`).first();
            await expect(nestedPart).toHaveAttribute("data-motion", effectiveMode("full", reducedMotion === "reduce"));
            await nested.scrollIntoViewIfNeeded();
            const saved = await nestedPart.elementHandle();
            const nestedSelector = `[data-component-example="${id}/without-motion"] [data-motion="${effectiveMode("full", reducedMotion === "reduce")}"][data-slot="${parts[id][1]}"]`;
            await record(page, nestedSelector);
            if (id === "slider") {
              const box = await nestedPart.boundingBox();
              if (!box) throw new Error("missing nested thumb");
              await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
              await page.mouse.down();
            } else await nested.click();
            const nestedFrames = await frames(page);
            if (id === "slider") await page.mouse.up();
            expect(nestedFrames.length).toBeGreaterThan(4);
            if (reducedMotion === "no-preference") {
              const values = nestedFrames.map((s) => (id === "switch" ? s.x : id === "slider" ? s.scale : s.opacity));
              expect(new Set(values.map((v) => v.toFixed(4))).size).toBeGreaterThan(2);
            } else if (id === "checkbox" || id === "radio-group") {
              expect(nestedFrames.every((s) => s.scale === 1)).toBe(true);
              expect(nestedFrames.some((s) => s.opacity > 0 && s.opacity < 1)).toBe(true);
            } else expect(new Set(nestedFrames.map((s) => `${s.scale}/${s.x}`)).size).toBeLessThanOrEqual(2);
            expect(await nestedPart.evaluate((node, saved) => node === saved, saved)).toBe(true);
            expect(
              await staticScope.evaluate((node) => node.querySelector("[data-motion]")?.getAttribute("data-motion")),
            ).toBe("none");
            await setMode(page, "full");
            await p.scrollIntoViewIfNeeded();
          }
          // Keyboard semantics, focused node and selection survive resize/mode changes.
          if (id === "checkbox" || id === "switch") {
            const control = p.getByRole(id === "checkbox" ? "checkbox" : "switch").first();
            await control.focus();
            await control.press(" ");
            await expect(control).toBeFocused();
            expect(await control.evaluate((n) => getComputedStyle(n).boxShadow)).not.toBe("none");
          }
          if (id === "radio-group") {
            const radio = p.getByRole("radio", { name: "Starter", exact: true });
            await radio.focus();
            await radio.press("ArrowDown");
            await expect(p.getByRole("radio", { name: "Team", exact: true })).toBeFocused();
          }
          if (id === "toggle" || id === "toggle-group") {
            const control = p.locator(`[data-slot="${parts[id][0]}"]`).first();
            await control.focus();
            await control.press("Enter");
            await control.press(" ");
            await expect(control).toBeFocused();
          }
          if (id === "toggle-group") {
            const vertical = page
              .locator('[data-component-example="toggle-group/vertical"]')
              .getByRole("group", { name: "Vertical alignment", exact: true });
            const first = vertical.getByRole("button").first();
            await first.focus();
            await first.press("ArrowDown");
            await expect(vertical.getByRole("button").nth(1)).toBeFocused();
          }
          if (id === "slider") {
            const input = p.getByRole("slider", { name: "Volume", exact: true });
            await input.focus();
            await input.press("Home");
            await expect(input).toHaveValue("0");
            await input.press("ArrowRight");
            await expect(input).toHaveValue("1");
          }
          if (id === "input-otp") {
            const input = p.getByRole("textbox", { name: "Verification code", exact: true });
            await input.press("ControlOrMeta+A");
            await input.press("Backspace");
            await expect(input).toHaveValue("");
            await input.pressSequentially("123456");
            await expect(input).toHaveValue("123456");
            await input.press("Backspace");
            await expect(input).toHaveValue("12345");
            await input.evaluate((n: HTMLInputElement) => n.setSelectionRange(1, 3));
            await page.setViewportSize({ width: 390, height: 1000 });
            await expect(input).toBeFocused();
            expect(await input.evaluate((n: HTMLInputElement) => [n.selectionStart, n.selectionEnd])).toEqual([1, 3]);
          }
          if (id === "input-otp") {
            await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
            await page.evaluate(() => navigator.clipboard.writeText("654321"));
            const input = p.getByRole("textbox", { name: "Verification code", exact: true });
            await input.press("ControlOrMeta+A");
            await input.press("ControlOrMeta+V");
            await expect(input).toHaveValue("654321");
            // Header mode controls are intentionally hidden at 390px.
            await page.setViewportSize({ width: 1280, height: 900 });
            await expect(input).toBeFocused();
          }
          if (id === "slider") {
            const input = p.getByRole("slider", { name: "Volume", exact: true });
            const thumb = p.locator('[data-slot="slider-thumb"]').first();
            const box = await thumb.boundingBox();
            if (!box) throw new Error("missing thumb");
            await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
            await page.mouse.down();
            await page.mouse.move(box.x + 70, box.y + box.height / 2, { steps: 5 });
            await page.mouse.up();
            expect(Number(await input.inputValue())).toBeGreaterThan(1);
          }
          if (["checkbox", "switch", "toggle", "toggle-group"].includes(id)) {
            const control = p.locator(`[data-slot="${parts[id][0]}"]`).first();
            for (let i = 0; i < 4; i++) await control.click();
          }
          for (let i = 0; i < 4; i++) await setMode(page, i % 2 ? "none" : "reduced");
          const focus =
            id === "slider"
              ? p.getByRole("slider", { name: "Volume", exact: true })
              : id === "progress"
                ? p.getByRole("slider", { name: "Upload progress" })
                : id === "input-otp"
                  ? p.getByRole("textbox", { name: "Verification code", exact: true })
                  : p.locator(`[data-slot="${parts[id][0]}"]`).first();
          await focus.focus();
          await page.setViewportSize({ width: 390, height: 1000 });
          await expect(focus).toBeFocused();
          expect(await node.evaluate((n) => n === (window as unknown as { stable: Element }).stable)).toBe(true);
        });
  });
}
for (const colorScheme of ["light", "dark"] as const)
  test.describe(`B3 ${colorScheme}`, () => {
    test.use({ colorScheme });
    for (const id of ids)
      test(`${id} complete page visual and axe`, async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (e) => errors.push(e.message));
        await page.goto(`/components/${id}?motion=none`);
        await page.waitForLoadState("networkidle");
        await expect(page.locator("html")).toHaveClass(colorScheme === "dark" ? /dark/ : /^(?!.*dark)/);
        for (const width of [1280, 390]) {
          await page.setViewportSize({ width, height: 1100 });
          expect(
            (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations,
          ).toEqual([]);
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
          await page.screenshot({
            path: `.cache/shared-cleanup-proof/b3/${id}-${colorScheme}-${width}.png`,
            fullPage: true,
          });
          await page
            .locator(`[data-preview="${id}"]`)
            .screenshot({ path: `.cache/shared-cleanup-proof/b3/${id}-${colorScheme}-${width}-preview.png` });
        }
        const names = examples[id];
        if (!names?.length) throw new Error(`Missing ${id} examples`);
        for (const name of names) {
          await page
            .locator(`[data-component-example="${id}/${name}"]`)
            .screenshot({ path: `.cache/shared-cleanup-proof/b3/${id}-${colorScheme}-390-${name}.png` });
        }
        expect(errors).toEqual([]);
      });
  });
