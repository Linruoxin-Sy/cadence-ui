import { expect, test } from "@playwright/test";
import { effectiveMode, MODES } from "./helpers";

for (const os of ["no-preference", "reduce"] as const)
  for (const mode of MODES)
    test(`Checkbox examples: independent states, native fields and caller updates ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os });
      await page.goto(`/components/checkbox?motion=${mode}`);
      await page.waitForLoadState("networkidle");
      const top = page.locator('[data-preview="checkbox"]');
      expect(
        await page
          .locator(
            '[data-component-example^="checkbox/"]:not([data-component-example$="/without-motion"]) [data-motion]',
          )
          .evaluateAll((nodes) => [...new Set(nodes.map((node) => node.getAttribute("data-motion")))]),
      ).toEqual([effectiveMode(mode, os === "reduce")]);
      await expect(top.getByRole("combobox")).toHaveCount(0);
      await expect(top.getByRole("checkbox")).toHaveCount(5);
      await expect(top.getByRole("checkbox", { name: "Indeterminate", exact: true })).toHaveAttribute(
        "aria-checked",
        "mixed",
      );
      await expect(top.getByRole("checkbox", { name: "Disabled", exact: true })).toBeDisabled();
      await expect(top.getByRole("checkbox", { name: "Unchecked", exact: true })).toHaveAttribute(
        "data-motion",
        effectiveMode(mode, os === "reduce"),
      );
      const controlled = page.locator('[data-component-example="checkbox/controlled"]');
      const box = controlled.getByRole("checkbox");
      const saved = await box.elementHandle();
      await controlled.locator("label").click();
      await expect(box).toBeChecked();
      await expect(controlled.getByRole("status")).toHaveText("Terms accepted");
      await expect(top.getByRole("checkbox", { name: "Unchecked", exact: true })).not.toBeChecked();
      await box.focus();
      await page
        .getByRole("group", { name: "Motion mode" })
        .getByRole("button", { name: "none", exact: true })
        .evaluate((button: HTMLButtonElement) => button.click());
      await expect(box).toBeFocused();
      await expect(box).toBeChecked();
      expect(await box.evaluate((node, saved) => node === saved, saved)).toBe(true);
      await box.press(" ");
      await expect(box).not.toBeChecked();
      await box.press(" ");
      await controlled.getByRole("button", { name: "Reset acceptance" }).click();
      await expect(box).not.toBeChecked();
      const states = page.locator('[data-component-example="checkbox/states"]');
      await expect(states.getByRole("checkbox").first()).toBeChecked();
      const mixed = states.getByRole("checkbox").last();
      await expect(mixed).toHaveAttribute("aria-checked", "mixed");
      expect(
        await states
          .locator('input[type="checkbox"]')
          .last()
          .evaluate((node: HTMLInputElement) => node.indeterminate),
      ).toBe(true);
      const invalid = page.locator('[data-component-example="checkbox/invalid"]');
      const invalidBox = invalid.getByRole("checkbox");
      await expect(invalidBox).toHaveAttribute("aria-invalid", "true");
      await expect(invalidBox).toHaveAccessibleDescription("You must accept the terms to continue.");
      await invalidBox.click();
      await expect(invalidBox).toHaveAttribute("aria-invalid", "true");
      const disabled = page.locator('[data-component-example="checkbox/disabled"]');
      for (const node of await disabled.getByRole("checkbox").all()) {
        if (await node.isDisabled()) continue;
        await node.focus();
        await node.press(" ");
        await expect(node).toBeFocused();
        await expect(node).toBeChecked();
      }
      await expect(disabled.getByRole("checkbox").nth(0)).not.toBeChecked();
      await expect(disabled.getByRole("checkbox").nth(1)).toBeChecked();
      await expect(disabled.locator("label").first()).toHaveCSS("opacity", "0.5");
      const settings = page.locator('[data-component-example="checkbox/settings"]');
      await expect(settings.getByRole("checkbox")).toHaveAccessibleDescription("Every Monday, 09:00.");
      const form = page.locator('[data-component-example="checkbox/form-submission"]');
      const native = form.locator('input[type="checkbox"]');
      await form.getByRole("button", { name: "Submit consent" }).click();
      expect(await native.evaluate((node: HTMLInputElement) => node.validity.valueMissing)).toBe(true);
      await expect(form.getByRole("status")).toHaveText("Not submitted");
      await form.locator("label").click();
      await form.getByRole("button", { name: "Submit consent" }).click();
      await expect(form.getByRole("status")).toHaveText("Submitted consent: accepted");
      const ids = await page
        .locator('[data-component-example] [id], [data-preview="checkbox"] [id]')
        .evaluateAll((nodes) => nodes.map((node) => node.id));
      expect(new Set(ids).size).toBe(ids.length);
    });

for (const os of ["no-preference", "reduce"] as const)
  for (const mode of MODES)
    test(`Radio Group examples: roving focus, disabled choices and native forms ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os });
      await page.goto(`/components/radio-group?motion=${mode}`);
      await page.waitForLoadState("networkidle");
      const top = page.locator('[data-preview="radio-group"]');
      expect(
        await page
          .locator(
            '[data-component-example^="radio-group/"]:not([data-component-example$="/without-motion"]) [data-motion]',
          )
          .evaluateAll((nodes) => [...new Set(nodes.map((node) => node.getAttribute("data-motion")))]),
      ).toEqual([effectiveMode(mode, os === "reduce")]);
      await expect(top.getByRole("combobox")).toHaveCount(0);
      await expect(top.getByRole("radio")).toHaveCount(3);
      await expect(top.getByRole("radio", { name: "Team", exact: true })).toBeChecked();
      await expect(top.getByRole("radio").first()).toHaveAttribute("data-motion", effectiveMode(mode, os === "reduce"));
      const controlled = page.locator('[data-component-example="radio-group/controlled"]');
      const scale = controlled.getByRole("radio", { name: "Scale", exact: true });
      const saved = await scale.elementHandle();
      await controlled.locator("label").last().click();
      await expect(scale).toBeChecked();
      await expect(controlled.getByRole("status")).toHaveText("Selected plan: scale");
      await scale.focus();
      await page
        .getByRole("group", { name: "Motion mode" })
        .getByRole("button", { name: "none", exact: true })
        .evaluate((button: HTMLButtonElement) => button.click());
      await expect(scale).toBeFocused();
      await expect(scale).toBeChecked();
      expect(await scale.evaluate((node, saved) => node === saved, saved)).toBe(true);
      await controlled.getByRole("button", { name: "Choose Team" }).click();
      await expect(controlled.getByRole("radio", { name: "Team", exact: true })).toBeChecked();
      await expect(top.getByRole("radio", { name: "Team", exact: true })).toBeChecked();
      const available = page.locator('[data-component-example="radio-group/disabled"]');
      const starter = available.getByRole("radio", { name: "Starter", exact: true });
      const last = available.getByRole("radio", { name: "Scale", exact: true });
      const disabled = available.getByRole("radio", { name: "Enterprise (unavailable)", exact: true });
      await expect(disabled).toBeDisabled();
      await starter.focus();
      await starter.press("ArrowDown");
      await expect(last).toBeFocused();
      await expect(last).toBeChecked();
      await last.press("ArrowUp");
      await expect(starter).toBeFocused();
      await expect(starter).toBeChecked();
      await starter.press("ArrowLeft");
      await expect(last).toBeFocused();
      await last.press("ArrowRight");
      await expect(starter).toBeFocused();
      expect(
        await available
          .getByRole("radio")
          .evaluateAll((nodes) => nodes.filter((node) => (node as HTMLElement).tabIndex === 0).length),
      ).toBe(1);
      const invalid = page.locator('[data-component-example="radio-group/invalid"]');
      await expect(invalid.getByRole("radiogroup")).toHaveAccessibleDescription("Choose a plan to continue.");
      await expect(invalid.getByRole("radiogroup")).toHaveAttribute("aria-invalid", "true");
      for (const radio of await invalid.getByRole("radio").all())
        await expect(radio).toHaveAttribute("aria-invalid", "true");
      await invalid.locator("label").first().click();
      await expect(invalid.getByRole("radiogroup")).toHaveAttribute("aria-invalid", "true");
      const locked = page.locator('[data-component-example="radio-group/locked"]');
      for (const radio of await locked
        .getByRole("radiogroup", { name: "Disabled plan", exact: true })
        .getByRole("radio")
        .all())
        await expect(radio).toBeDisabled();
      const readOnly = locked.getByRole("radiogroup", { name: "Read-only plan", exact: true });
      const readOnlyTeam = readOnly.getByRole("radio").first();
      await readOnlyTeam.focus();
      await readOnlyTeam.press(" ");
      await readOnly.getByRole("radio").last().click();
      await expect(readOnlyTeam).toBeChecked();
      const horizontal = page.locator('[data-component-example="radio-group/horizontal"]');
      const rects = await horizontal
        .getByRole("radio")
        .evaluateAll((nodes) =>
          nodes.map((node) => ({ x: node.getBoundingClientRect().x, y: node.getBoundingClientRect().y })),
        );
      expect(rects[0]?.y).toBe(rects[1]?.y);
      expect(rects[1]?.x).toBeGreaterThan(rects[0]?.x ?? 0);
      const form = page.locator('[data-component-example="radio-group/form-submission"]');
      await form.getByRole("button", { name: "Submit shipping" }).click();
      await expect(form.getByRole("status")).toHaveText("Not submitted");
      expect(
        await form
          .locator("input")
          .evaluateAll((nodes) => nodes.some((node) => (node as HTMLInputElement).validity.valueMissing)),
      ).toBe(true);
      await form.locator("label").last().click();
      await form.getByRole("button", { name: "Submit shipping" }).click();
      await expect(form.getByRole("status")).toHaveText("Shipping: express");
      const ids = await page
        .locator('[data-component-example] [id], [data-preview="radio-group"] [id]')
        .evaluateAll((nodes) => nodes.map((node) => node.id));
      expect(new Set(ids).size).toBe(ids.length);
    });

for (const os of ["no-preference", "reduce"] as const)
  for (const mode of MODES)
    test(`Switch examples: fixed sizes, immediate state and read-only settings ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os });
      await page.goto(`/components/switch?motion=${mode}&variant=sm`);
      await page.waitForLoadState("networkidle");
      const top = page.locator('[data-preview="switch"]');
      expect(
        await page
          .locator('[data-component-example^="switch/"]:not([data-component-example$="/without-motion"]) [data-motion]')
          .evaluateAll((nodes) => [...new Set(nodes.map((node) => node.getAttribute("data-motion")))]),
      ).toEqual([effectiveMode(mode, os === "reduce")]);
      await expect(top.getByRole("combobox")).toHaveCount(0);
      await expect(top.getByRole("switch")).toHaveCount(5);
      await expect(top.getByRole("switch").first()).toHaveAttribute(
        "data-motion",
        effectiveMode(mode, os === "reduce"),
      );
      const sizes = page.locator('[data-component-example="switch/sizes"]');
      const switches = sizes.getByRole("switch");
      expect(await switches.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-size")))).toEqual([
        "default",
        "default",
        "sm",
        "sm",
      ]);
      for (let i = 0; i < 4; i++) {
        const control = switches.nth(i);
        const thumb = control.locator('[data-slot="switch-thumb"]');
        const geometry = await control.evaluate((node) => {
          const thumb = node.querySelector('[data-slot="switch-thumb"]');
          if (!thumb) throw new Error("missing thumb");
          return {
            width: node.getBoundingClientRect().width,
            thumb: thumb.getBoundingClientRect().width,
            travel: node.clientWidth - (thumb as HTMLElement).offsetWidth,
            x: new DOMMatrixReadOnly(getComputedStyle(thumb).transform).m41,
          };
        });
        expect(geometry.width).toBe(i < 2 ? 32 : 24);
        expect(geometry.thumb).toBe(i < 2 ? 16 : 12);
        expect(geometry.x).toBeCloseTo(i % 2 ? geometry.travel : 0, 1);
        await control.focus();
        await control.press(" ");
        await expect(control).toHaveAttribute("aria-checked", i % 2 ? "false" : "true");
        await expect
          .poll(() => thumb.evaluate((node) => new DOMMatrixReadOnly(getComputedStyle(node).transform).m41))
          .toBeCloseTo(i % 2 ? 0 : geometry.travel, 1);
      }
      const controlled = page.locator('[data-component-example="switch/controlled"]');
      const control = controlled.getByRole("switch");
      const saved = await control.elementHandle();
      await controlled.locator("label").click();
      await expect(control).toBeChecked();
      await expect(controlled.getByRole("status")).toHaveText("Alerts on in this example");
      await control.focus();
      await control.press("Enter");
      await expect(control).not.toBeChecked();
      await control.press(" ");
      await expect(control).toBeChecked();
      await page
        .getByRole("group", { name: "Motion mode" })
        .getByRole("button", { name: "none", exact: true })
        .evaluate((button: HTMLButtonElement) => button.click());
      await expect(control).toBeFocused();
      await expect(control).toBeChecked();
      expect(await control.evaluate((node, saved) => node === saved, saved)).toBe(true);
      await controlled.getByRole("button", { name: "Turn alerts off" }).click();
      await expect(control).not.toBeChecked();
      await expect(top.getByRole("switch", { name: "Off", exact: true })).not.toBeChecked();
      const disabled = page.locator('[data-component-example="switch/disabled"]');
      await expect(disabled.getByRole("switch").nth(0)).toBeDisabled();
      await expect(disabled.getByRole("switch").nth(1)).toBeDisabled();
      await expect(disabled.getByRole("switch").nth(0)).not.toBeChecked();
      await expect(disabled.getByRole("switch").nth(1)).toBeChecked();
      await expect(disabled.locator("label").first()).toHaveCSS("opacity", "0.5");
      const readonly = disabled.getByRole("switch", { name: "Read-only setting", exact: true });
      await expect(readonly).toHaveAttribute("aria-readonly", "true");
      await readonly.focus();
      await readonly.press(" ");
      await expect(readonly).toBeFocused();
      await expect(readonly).toBeChecked();
      await readonly.click();
      await expect(readonly).toBeChecked();
      const inputs = disabled.locator('input[type="checkbox"]');
      expect(
        await inputs.evaluateAll((nodes) =>
          nodes.map((node) => ({
            disabled: (node as HTMLInputElement).disabled,
            checked: (node as HTMLInputElement).checked,
            readonly: (node as HTMLInputElement).readOnly,
          })),
        ),
      ).toEqual([
        { disabled: true, checked: false, readonly: false },
        { disabled: true, checked: true, readonly: false },
        { disabled: false, checked: true, readonly: false },
      ]);
      const settings = page.locator('[data-component-example="switch/settings"]');
      await expect(settings.getByRole("switch")).toHaveAccessibleDescription("A notification for every failed build.");
      await settings.locator("label").click();
      await expect(settings.getByRole("switch")).toBeChecked();
      const ids = await page
        .locator('[data-component-example] [id], [data-preview="switch"] [id]')
        .evaluateAll((nodes) => nodes.map((node) => node.id));
      expect(new Set(ids).size).toBe(ids.length);
    });

for (const os of ["no-preference", "reduce"] as const)
  for (const mode of MODES)
    test(`Slider examples: native events, ranges, axes, alignment and collisions ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os });
      await page.goto(`/components/slider?motion=${mode}&variant=vertical`);
      await page.waitForLoadState("networkidle");
      const top = page.locator('[data-preview="slider"]');
      await expect(top.getByRole("combobox")).toHaveCount(0);
      await expect(top.getByRole("slider")).toHaveCount(1);
      const volume = top.getByRole("slider", { name: "Volume", exact: true });
      await expect(top.locator('[data-slot="slider"]')).toHaveAttribute("data-orientation", "horizontal");
      expect(
        await page
          .locator('[data-component-example^="slider/"]:not([data-component-example$="/without-motion"]) [data-motion]')
          .evaluateAll((nodes) => [...new Set(nodes.map((node) => node.getAttribute("data-motion")))]),
      ).toEqual([effectiveMode(mode, os === "reduce")]);
      await volume.focus();
      await volume.press("Home");
      await expect(volume).toHaveValue("0");
      await volume.press("ArrowRight");
      await expect(volume).toHaveValue("1");
      await volume.press("PageUp");
      await expect(volume).toHaveValue("11");
      await volume.press("PageDown");
      await expect(volume).toHaveValue("1");
      const controlled = page.locator('[data-component-example="slider/controlled"]');
      const input = controlled.getByRole("slider");
      const saved = await input.elementHandle();
      await input.focus();
      await input.press("ArrowRight");
      await expect(controlled.getByRole("status")).toHaveText("Volume: 61%; last committed: 61%");
      await page
        .getByRole("group", { name: "Motion mode" })
        .getByRole("button", { name: "none", exact: true })
        .evaluate((button: HTMLButtonElement) => button.click());
      await expect(input).toBeFocused();
      await expect(input).toHaveValue("61");
      expect(await input.evaluate((node, saved) => node === saved, saved)).toBe(true);
      await controlled.getByRole("button", { name: "Reset volume" }).click();
      await expect(controlled.getByRole("status")).toHaveText("Volume: 60%; last committed: 61%");
      await expect(volume).toHaveValue("1");
      await top.scrollIntoViewIfNeeded();
      const thumb = top.locator('[data-slot="slider-thumb"]');
      const thumbBox = await thumb.boundingBox();
      const trackBox = await top.locator('[data-slot="slider-track"]').boundingBox();
      if (!thumbBox || !trackBox) throw new Error("missing volume geometry");
      await page.mouse.move(thumbBox.x + thumbBox.width / 2, thumbBox.y + thumbBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(trackBox.x + trackBox.width * 0.7, thumbBox.y + thumbBox.height / 2, { steps: 5 });
      await page.mouse.up();
      expect(Number(await volume.inputValue())).toBeGreaterThan(50);
      const range = page.locator('[data-component-example="slider/range"]');
      const low = range.getByRole("slider", { name: "Price (minimum)", exact: true });
      const high = range.getByRole("slider", { name: "Price (maximum)", exact: true });
      await expect(low).toHaveAttribute("aria-valuetext", "$120 start range");
      await expect(high).toHaveAttribute("aria-valuetext", "$480 end range");
      await low.focus();
      await low.press("Home");
      await expect(low).toHaveValue("0");
      await low.press("ArrowRight");
      await expect(low).toHaveValue("10");
      await low.press("End");
      expect(Number(await high.inputValue()) - Number(await low.inputValue())).toBeGreaterThanOrEqual(20);
      await high.focus();
      await high.press("End");
      await expect(high).toHaveValue("600");
      const vertical = page.locator('[data-component-example="slider/vertical"]');
      const level = vertical.getByRole("slider");
      await expect(vertical.locator('[data-slot="slider"]')).toHaveAttribute("data-orientation", "vertical");
      const verticalTrack = await vertical.locator('[data-slot="slider-track"]').boundingBox();
      expect(verticalTrack?.height).toBe(160);
      expect(verticalTrack?.width).toBe(6);
      await level.focus();
      await level.press("ArrowUp");
      await expect(level).toHaveValue("65");
      await level.press("Home");
      await expect(level).toHaveValue("0");
      await level.press("End");
      await expect(level).toHaveValue("100");
      const verticalThumb = await vertical.locator('[data-slot="slider-thumb"]').boundingBox();
      if (!verticalThumb) throw new Error("missing vertical thumb");
      await page.mouse.move(verticalThumb.x + verticalThumb.width / 2, verticalThumb.y + verticalThumb.height / 2);
      await page.mouse.down();
      await page.mouse.move(verticalThumb.x + verticalThumb.width / 2, verticalThumb.y + 80, { steps: 5 });
      await page.mouse.up();
      expect(Number(await level.inputValue())).toBeLessThan(100);
      const disabled = page.locator('[data-component-example="slider/disabled"]');
      await expect(disabled.getByRole("slider")).toBeDisabled();
      await disabled.scrollIntoViewIfNeeded();
      const disabledTrack = await disabled.locator('[data-slot="slider-track"]').boundingBox();
      if (!disabledTrack) throw new Error("missing disabled track");
      await page.mouse.click(disabledTrack.x + disabledTrack.width * 0.8, disabledTrack.y + 3);
      await expect(disabled.getByRole("slider")).toHaveValue("40");
      for (const behavior of ["push", "swap", "none"] as const) {
        const min = page.getByRole("slider", { name: `${behavior} range (minimum)`, exact: true });
        const parent = min.locator('xpath=ancestor::*[@data-slot="slider"]');
        await parent.scrollIntoViewIfNeeded();
        const first = await parent.locator('[data-slot="slider-thumb"]').first().boundingBox();
        const track = await parent.locator('[data-slot="slider-track"]').boundingBox();
        if (!first || !track) throw new Error("missing collision geometry");
        await page.mouse.move(first.x + first.width / 2, first.y + first.height / 2);
        await page.mouse.down();
        await page.mouse.move(track.x + track.width * 0.9, first.y + first.height / 2, { steps: 8 });
        await page.mouse.up();
        const values = await parent
          .getByRole("slider")
          .evaluateAll((nodes) => nodes.map((node) => Number((node as HTMLInputElement).value)));
        if (behavior === "push") expect(values.every((value) => value > 80)).toBe(true);
        else if (behavior === "swap") {
          expect(values[0]).toBe(60);
          expect(values[1]).toBeGreaterThan(80);
        } else expect(values).toEqual([60, 60]);
      }
      const alignment = page.locator('[data-component-example="slider/alignment"]');
      for (const name of ["edge", "center", "edge-client-only"]) {
        const native = alignment.getByRole("slider", { name: `${name} alignment`, exact: true });
        const parent = native.locator('xpath=ancestor::*[@data-slot="slider"]');
        await parent.scrollIntoViewIfNeeded();
        const left = await parent.evaluate((node) => {
          const thumb = node.querySelector('[data-slot="slider-thumb"]')?.getBoundingClientRect();
          const track = node.querySelector('[data-slot="slider-track"]')?.getBoundingClientRect();
          if (!thumb || !track) throw new Error("missing alignment geometry");
          return thumb.x - track.x;
        });
        expect(left).toBeCloseTo(name === "center" ? -8 : 0, 0);
        await native.focus();
        await native.press("End");
        await expect(native).toHaveValue("100");
      }
    });
