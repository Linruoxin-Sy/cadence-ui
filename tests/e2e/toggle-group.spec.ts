import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, test } from "@playwright/test";
import { effectiveMode, MODES, openComponent } from "./helpers";

async function aligned(button: Locator) {
  await expect
    .poll(() =>
      button.evaluate((el) => {
        const fill = el.querySelector('[data-slot="toggle-group-indicator"]');
        if (!fill) return Infinity;
        const a = el.getBoundingClientRect(),
          b = fill.getBoundingClientRect();
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.width - b.width) + Math.abs(a.height - b.height);
      }),
    )
    .toBeLessThan(2);
}

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test.describe(`toggle-group system ${reducedMotion}`, () => {
    test.use({ reducedMotion });
    for (const requested of MODES) {
      test(`shared selection, independent fills and keyboard ${requested}`, async ({ page }) => {
        const mode = effectiveMode(requested, reducedMotion === "reduce");
        await openComponent(page, "toggle-group", requested, "toggle-group-item", mode);
        const preview = page.locator('[data-preview="toggle-group"]');
        const range = page
          .locator('[data-component-example="toggle-group/variants"]')
          .getByRole("group", { name: "segmented range", exact: true });
        const month = range.getByRole("button", { name: "Month", exact: true });
        const samples = await month.evaluate(async (el) => {
          const root = el.closest('[data-slot="toggle-group"]');
          if (!root) throw Error("Missing toggle group");
          const first = root.querySelector("button");
          if (!first) throw Error("Missing first item");
          const position = () => {
            const fill = root.querySelector('[data-slot="toggle-group-indicator"]');
            if (!fill) throw Error("Missing selected fill");
            return { x: fill.getBoundingClientRect().x, transform: getComputedStyle(fill).transform };
          };
          (el as HTMLElement).click();
          const frames = [];
          for (let i = 0; i < 6; i++) {
            await new Promise(requestAnimationFrame);
            frames.push(position());
          }
          const before = position();
          first.click();
          const immediate = position();
          for (let i = 0; i < 6; i++) {
            await new Promise(requestAnimationFrame);
            frames.push(position());
          }
          (el as HTMLElement).click();
          return { frames, before, immediate };
        });
        await aligned(month);
        if (mode === "full") {
          expect(samples.frames.some((p) => p.transform !== "none")).toBe(true);
          expect(Math.abs(samples.before.x - samples.immediate.x)).toBeLessThan(2);
        } else {
          expect(samples.frames.every((p) => p.transform === "none")).toBe(true);
        }
        await expect(range.getByRole("button", { pressed: true })).toHaveText("Month");
        // Another single-selection group retains its own indicator and value.
        await expect(
          preview
            .getByRole("group", { name: "Text alignment", exact: true })
            .getByRole("button", { name: "Align left" }),
        ).toHaveAttribute("aria-pressed", "true");
        await month.focus();
        await page.keyboard.press("Home");
        const day = range.getByRole("button", { name: "Day", exact: true });
        await expect(day).toBeFocused();
        await expect(month).toHaveAttribute("aria-pressed", "true");
        await page.keyboard.press("Space");
        await aligned(day);
        await page.keyboard.press("Space");
        await expect(range.locator('[data-slot="toggle-group-indicator"]')).toHaveCount(0);

        const marks = page
          .locator('[data-component-example="toggle-group/multiple"]')
          .getByRole("group", { name: "Text style", exact: true });
        const bold = marks.getByRole("button", { name: "Bold", exact: true });
        const italic = marks.getByRole("button", { name: "Italic", exact: true });
        await italic.click();
        await expect(bold).toHaveAttribute("aria-pressed", "true");
        await expect(italic).toHaveAttribute("aria-pressed", "true");
        await expect
          .poll(() =>
            italic
              .locator('[data-slot="toggle-group-indicator"]')
              .evaluate((el) => Number(getComputedStyle(el).opacity)),
          )
          .toBe(1);
        const corners = await marks.getByRole("button").evaluateAll((items) =>
          items.slice(0, 2).map((el) => {
            const s = getComputedStyle(el);
            return { start: s.borderTopLeftRadius, end: s.borderTopRightRadius };
          }),
        );
        expect(corners[0]?.end).toBe("0px");
        expect(corners[1]?.start).toBe("0px");
        await bold.click();
        await expect
          .poll(() =>
            bold.locator('[data-slot="toggle-group-indicator"]').evaluate((el) => Number(getComputedStyle(el).opacity)),
          )
          .toBe(0);
        if (mode !== "full") {
          expect(
            await italic
              .locator('[data-slot="toggle-group-indicator"]')
              .evaluate((el) => getComputedStyle(el).transform),
          ).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
        }
      });
    }
  });
}

test("live downgrade cancels shared movement and preserves focused controls", async ({ page }) => {
  await openComponent(page, "toggle-group", "full", "toggle-group-item");
  const month = page
    .locator('[data-component-example="toggle-group/variants"]')
    .getByRole("group", { name: "segmented range", exact: true })
    .getByRole("button", { name: "Month", exact: true });
  const frames = await month.evaluate(async (el) => {
    const root = el.closest('[data-slot="toggle-group"]');
    const none =
      document.querySelector<HTMLButtonElement>('[role="group"][aria-label="Motion mode"] button[aria-label="none"]') ??
      [...document.querySelectorAll<HTMLButtonElement>('[role="group"][aria-label="Motion mode"] button')].find(
        (n) => n.textContent === "none",
      );
    if (!root || !none) throw Error("Missing mode controls");
    (el as HTMLElement).focus();
    (el as HTMLElement).click();
    for (let i = 0; i < 3; i++) await new Promise(requestAnimationFrame);
    none.click();
    const samples = [];
    for (let i = 0; i < 5; i++) {
      await new Promise(requestAnimationFrame);
      const fill = el.querySelector('[data-slot="toggle-group-indicator"]');
      if (!fill) throw Error("Missing fill after downgrade");
      samples.push({
        transform: getComputedStyle(fill).transform,
        animations: fill.getAnimations().length,
        focused: document.activeElement === el,
      });
    }
    return samples;
  });
  expect(frames).toEqual(Array.from({ length: 5 }, () => ({ transform: "none", animations: 0, focused: true })));
  await aligned(month);
  expect(
    await month
      .locator('[data-slot="toggle-group-indicator"]')
      .evaluate((el) => ({ transform: getComputedStyle(el).transform, animations: el.getAnimations().length })),
  ).toEqual({ transform: "none", animations: 0 });
  await expect(month).toBeFocused();
  const header = page.getByRole("group", { name: "Motion mode", exact: true });
  await header.getByRole("button", { name: "none", exact: true }).click();
  await header.getByRole("button", { name: "none", exact: true }).click();
  await expect(header.getByRole("button", { name: "none", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(header.getByRole("button", { name: "none", exact: true })).toBeFocused();
  expect(await page.evaluate(() => localStorage.getItem("cadence-motion"))).toBe("none");
  await expect(page).toHaveURL(/motion=none/);
});

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`toggle-group ${colorScheme}`, () => {
    test.use({ colorScheme });
    for (const variant of ["default", "outline", "segmented"]) {
      test(`travelling ${variant} fill stays below crossed labels`, async ({ page }) => {
        await openComponent(page, "toggle-group", "full", "toggle-group-item");
        const group = page
          .locator('[data-component-example="toggle-group/variants"]')
          .getByRole("group", { name: `${variant} range`, exact: true });
        await group.scrollIntoViewIfNeeded();
        const day = group.getByRole("button", { name: "Day", exact: true });
        await day.click();
        await aligned(day);
        const month = group.getByRole("button", { name: "Month", exact: true });
        await month.focus();
        const result = await month.evaluate(async (el) => {
          const root = el.closest('[data-slot="toggle-group"]');
          if (!root) throw Error("Missing group");
          const buttons = [...root.querySelectorAll<HTMLElement>('[data-slot="toggle-group-item"]')];
          const samples: { label: string | null; above: boolean; direction: "forward" | "reverse" }[] = [];
          let direction: "forward" | "reverse" = "forward";
          const sample = () => {
            const fill = root.querySelector<HTMLElement>('[data-slot="toggle-group-indicator"]');
            if (!fill) throw Error("Missing shared fill");
            const box = fill.getBoundingClientRect();
            // Include decoration in hit-testing to inspect the browser's actual paint order.
            fill.style.pointerEvents = "auto";
            for (const button of buttons) {
              if (button.contains(fill)) continue;
              const content =
                button.querySelector('[data-slot="press-button-content"], [data-slot="toggle-group-content"]') ??
                button;
              const r = content.getBoundingClientRect(),
                x = r.x + r.width / 2,
                y = r.y + r.height / 2;
              if (x <= box.left || x >= box.right || y <= box.top || y >= box.bottom) continue;
              const stack = document.elementsFromPoint(x, y);
              const labelIndex = stack.indexOf(content),
                fillIndex = stack.indexOf(fill);
              // A transformed bounding box can include subpixel/rounded edges
              // outside the browser's actual fill hit region. Only compare paint
              // order where the fill participates in this point's hit stack.
              if (fillIndex < 0) continue;
              samples.push({
                label: button.textContent,
                above: labelIndex >= 0 && labelIndex < fillIndex,
                direction,
              });
            }
            fill.style.removeProperty("pointer-events");
          };
          (el as HTMLElement).click();
          for (let i = 0; i < 24; i++) {
            await new Promise(requestAnimationFrame);
            sample();
            // Reverse a travelling fill while it is still between items.
            if (i === 7) {
              direction = "reverse";
              buttons[0]?.click();
            }
          }
          return samples;
        });
        expect(result.length, "sample actual crossings rather than just final placement").toBeGreaterThan(0);
        for (const direction of ["forward", "reverse"] as const)
          expect(
            result.some((sample) => sample.direction === direction),
            `${direction} crosses a label`,
          ).toBe(true);
        expect(
          result.filter((s) => !s.above),
          "all crossed labels paint above the moving fill",
        ).toEqual([]);
      });
    }
    test("accessible in both themes and fits a narrow viewport", async ({ page }, testInfo) => {
      await openComponent(page, "toggle-group", "none", "toggle-group-item");
      // Explicitly set the site's theme; stored theme is independent of the OS.
      const dark = await page.locator("html").evaluate((el) => el.classList.contains("dark"));
      if (dark !== (colorScheme === "dark")) await page.getByRole("button", { name: "Toggle color theme" }).click();
      await page
        .locator('[data-component-example="toggle-group/multiple"]')
        .getByRole("group", { name: "Text style", exact: true })
        .getByRole("button", { name: "Italic", exact: true })
        .click();
      expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual(
        [],
      );
      await page.screenshot({ path: testInfo.outputPath(`toggle-group-${colorScheme}.png`) });
      await page.setViewportSize({ width: 390, height: 844 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await aligned(
        page
          .locator('[data-component-example="toggle-group/variants"]')
          .getByRole("group", { name: "segmented range", exact: true })
          .getByRole("button", { name: "Week", exact: true }),
      );
    });
  });
}
