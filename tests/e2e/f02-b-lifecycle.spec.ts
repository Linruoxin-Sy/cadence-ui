import { expect, type Page, test } from "@playwright/test";
import { effectiveMode } from "./helpers";

/**
 * F02-B (issue #132): lifecycle cells that a first-paint screenshot cannot show —
 * a live mode change over a running animation, a same-target reversal, a nested
 * provider, forced colours, and leaving the route while work is in flight.
 *
 * Run explicitly (`pnpm exec playwright test tests/e2e/f02-b-*.spec.ts`):
 * `scripts/ci/affected-e2e-specs.mjs` only replays `tests/e2e/<id>.spec.ts`.
 */
const IDS = [
  "input",
  "textarea",
  "input-otp",
  "field",
  "input-group",
  "checkbox",
  "radio-group",
  "switch",
  "slider",
  "select",
  "combobox",
] as const;

type Id = (typeof IDS)[number];

// Each cell loads a production route, performs an interaction, and then waits for
// a clock to settle; 30 s is the default per-test budget and not the work.
test.describe.configure({ timeout: 60_000 });

async function open(page: Page, id: Id, motion: "full" | "reduced" | "none" = "full") {
  await page.goto(`/components/${id}?motion=${motion}`);
  await page.waitForLoadState("networkidle");
  const preview = page.locator(`[data-preview="${id}"]`);
  await expect(preview).toBeVisible();
  return preview;
}

/** Starts the component's own animation and returns the element it runs on. */
async function start(page: Page, id: Id): Promise<void> {
  const preview = page.locator(`[data-preview="${id}"]`);
  switch (id) {
    case "select":
      await preview.getByRole("combobox", { name: "Framework", exact: true }).click();
      await expect(page.getByRole("listbox")).toBeVisible();
      break;
    case "combobox":
      await page
        .locator('[data-component-example="combobox/groups"]')
        .getByRole("combobox", { name: "Stack", exact: true })
        .click();
      await expect(page.locator('[data-slot="combobox-content"]')).toBeVisible();
      break;
    case "checkbox":
      await page.locator('[data-component-example="checkbox/states"]').getByRole("checkbox").first().click();
      break;
    case "switch":
      await page.locator('[data-component-example="switch/controlled"]').getByRole("switch").click();
      break;
    case "radio-group":
      await page
        .locator('[data-component-example="radio-group/controlled"]')
        .getByRole("radio", { name: "Scale" })
        .check();
      break;
    case "slider": {
      const slider = page.locator('[data-component-example="slider/controlled"]').getByRole("slider");
      await slider.focus();
      await slider.press("ArrowRight");
      break;
    }
    case "input-otp": {
      const input = page.locator('[data-component-example="input-otp/controlled"] [data-slot="input-otp"]');
      await input.click();
      await input.pressSequentially("1");
      break;
    }
    case "input": {
      const field = page.locator('[data-component-example="input/controlled"]').getByLabel("Workspace name");
      await field.fill("Animation");
      break;
    }
    case "textarea": {
      const field = page.locator('[data-component-example="textarea/controlled"]').getByLabel("Review note");
      await field.fill("Animation");
      break;
    }
    case "field": {
      await page
        .locator('[data-component-example="field/caller-error"]')
        .getByRole("button", { name: "Toggle supplied error" })
        .click();
      break;
    }
    case "input-group": {
      const input = page.locator('[data-component-example="input-group/button"]').getByRole("textbox", {
        name: "Domain xs",
      });
      await input.fill("cadence");
      await page
        .locator('[data-component-example="input-group/button"]')
        .getByRole("button", { name: "Clear domain xs" })
        .click();
      break;
    }
  }
}

async function running(page: Page, selector: string): Promise<number> {
  return page.locator(selector).evaluate((element) => {
    const nodes = [element, ...element.querySelectorAll("*")];
    return nodes
      .flatMap((node) => node.getAnimations())
      .filter((animation) => animation.playState === "running" && animation.effect?.getComputedTiming().duration !== 0)
      .length;
  });
}

test.describe("live mode change over a running animation", () => {
  for (const next of ["reduced", "none"] as const) {
    for (const id of IDS) {
      test(`${id}: full → ${next} settles and keeps the control usable`, async ({ page }) => {
        const preview = await open(page, id, "full");
        await start(page, id);
        // The site header is outside the popup's modal scope, so the toggle is
        // reached by its DOM node: this cell changes a live setting, not focus.
        await page
          .locator('[aria-label="Motion mode"] button')
          .filter({ hasText: new RegExp(`^${next}$`) })
          .first()
          .evaluate((button: HTMLButtonElement) => button.click());

        await expect(preview).toHaveAttribute("data-preview-motion", effectiveMode(next, false));
        const reported = await page
          .locator(`[data-component-example^="${id}/"]:not([data-component-example$="/without-motion"]) [data-motion]`)
          .evaluateAll((nodes) => [...new Set(nodes.map((node) => node.getAttribute("data-motion")))]);
        for (const mode of reported) expect(mode).toBe(next);
        await expect.poll(async () => running(page, `[data-preview="${id}"]`), { timeout: 2_000 }).toBe(0);

        // The downgrade is a presentation change, not a control lock.
        const control = preview.locator("input, textarea, button, [role='combobox'], [role='checkbox']").first();
        await expect(control).toBeEnabled();
      });
    }
  }
});

test.describe("same-target cancellation and reversal", () => {
  test("select reopens on the same trigger without a stale popup", async ({ page }) => {
    const preview = await open(page, "select");
    const trigger = preview.getByRole("combobox", { name: "Framework", exact: true });
    await trigger.click();
    await expect(page.getByRole("listbox")).toHaveCount(1);
    await page.keyboard.press("Escape");
    await trigger.click();
    await expect(page.getByRole("listbox")).toHaveCount(1);
    await expect(trigger).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test("combobox reopen never replays a stale surface", async ({ page }) => {
    await open(page, "combobox");
    const card = page.locator('[data-component-example="combobox/groups"]');
    const input = card.getByRole("combobox", { name: "Stack", exact: true });
    await input.click();
    await expect(page.locator('[data-slot="combobox-content"]')).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect(page.locator('[data-slot="combobox-content"]')).toHaveCount(0);
    await input.click();
    await expect(page.locator('[data-slot="combobox-content"]')).toHaveCount(1);
    await expect(page.getByRole("option").first()).toBeVisible();
  });

  test("checkbox and switch reverse the same writer", async ({ page }) => {
    await open(page, "checkbox");
    const box = page.locator('[data-component-example="checkbox/controlled"]').getByRole("checkbox");
    const before = await box.isChecked();
    await page.locator('[data-component-example="checkbox/controlled"] label').click();
    await page.locator('[data-component-example="checkbox/controlled"] label').click();
    await expect(box).toBeChecked({ checked: before });
    expect(await running(page, '[data-preview="checkbox"]')).toBe(0);

    await open(page, "switch");
    const control = page.locator('[data-component-example="switch/controlled"]').getByRole("switch");
    await control.click();
    await control.click();
    await expect(control).not.toBeChecked();
    expect(await running(page, '[data-preview="switch"]')).toBe(0);
  });

  test("slider returns to its starting value", async ({ page }) => {
    await open(page, "slider");
    const slider = page.locator('[data-component-example="slider/controlled"]').getByRole("slider");
    const start = Number(await slider.getAttribute("aria-valuenow"));
    await slider.focus();
    await slider.press("ArrowRight");
    await slider.press("ArrowLeft");
    await expect.poll(async () => Number(await slider.getAttribute("aria-valuenow"))).toBe(start);
  });
});

test.describe("nested provider", () => {
  for (const id of ["checkbox", "radio-group", "switch", "slider", "input-otp", "combobox"] as const) {
    test(`${id}: an explicit inner provider keeps its own mode under an outer one`, async ({ page }) => {
      for (const outer of ["full", "none"] as const) {
        await open(page, id, outer);
        const card = page.locator(`[data-component-example="${id}/without-motion"]`);
        await expect(card).toBeVisible();
        const modes = await card
          .locator("[data-motion]")
          .evaluateAll((nodes) => [...new Set(nodes.map((node) => node.getAttribute("data-motion")))]);
        expect(modes).toContain("none");
        expect(modes).toContain("full");
      }
    });
  }
});

test.describe("forced colours", () => {
  test.use({ forcedColors: "active" });

  /**
   * Forced colours replaces author paints with system ones and removes the
   * box-shadow ring a bare `outline-none` control relied on. The question the
   * cell asks is not "which technique" but "does focus paint differently": a
   * drawn outline, a changed border colour or a changed shadow all count, and a
   * control with none of them has no focus indicator at all.
   */
  const SELECTOR: Record<Id, string> = {
    input: "input",
    textarea: "textarea",
    "input-otp": '[data-slot="input-otp"]',
    field: "input",
    "input-group": 'input[data-slot="input-group-control"]',
    checkbox: '[role="checkbox"]',
    "radio-group": '[role="radio"]',
    switch: '[role="switch"]',
    slider: 'input[type="range"]',
    select: '[role="combobox"]',
    combobox: '[role="combobox"]',
  };

  for (const id of IDS) {
    test(`${id}: control and focus stay distinguishable`, async ({ page }) => {
      const preview = await open(page, id, "none");
      const control = preview.locator(SELECTOR[id]).first();
      await expect(control).toBeVisible();

      const paint = () =>
        control.evaluate((element) => {
          const style = getComputedStyle(element);
          return {
            border: `${style.borderTopWidth} ${style.borderTopColor}`,
            outline: `${style.outlineStyle} ${style.outlineWidth}`,
            shadow: style.boxShadow,
          };
        });

      await page.mouse.click(5, 5);
      const unfocused = await paint();
      await control.focus();
      const focused = await paint();

      const drawWidth = Number.parseFloat(focused.outline.split(" ")[1] ?? "0");
      const outlineDrawn = focused.outline.startsWith("solid") && drawWidth > 0;
      const paintChanged = unfocused.border !== focused.border || unfocused.shadow !== focused.shadow;
      expect(outlineDrawn || paintChanged).toBe(true);
    });
  }
});

test.describe("route departure", () => {
  for (const id of IDS) {
    test(`${id}: leaving the route cancels the work it started`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(String(error)));
      await open(page, id);
      await start(page, id);
      await page.goto("/components");
      await page.waitForLoadState("networkidle");
      await expect(page.locator(`[data-preview="${id}"]`)).toHaveCount(0);
      expect(await page.locator('[data-slot="select-content"], [data-slot="combobox-content"]').count()).toBe(0);
      await expect
        .poll(
          async () =>
            page.evaluate(
              () =>
                document
                  .getAnimations()
                  .filter(
                    (animation) =>
                      animation.playState === "running" && animation.effect?.getComputedTiming().duration !== 0,
                  ).length,
            ),
          { timeout: 2_000 },
        )
        .toBe(0);
      expect(errors).toEqual([]);
    });
  }
});

test.describe("native editing, selection and copy", () => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  test("input keeps caret and clipboard through a live mode change", async ({ page }) => {
    await open(page, "input");
    const field = page.locator('[data-component-example="input/controlled"]').getByLabel("Workspace name");
    await field.click();
    await field.pressSequentially("Ada");
    await expect(field).toHaveValue("Ada");
    expect(await field.evaluate((node: HTMLInputElement) => node.selectionStart)).toBe(3);

    await page
      .locator('[aria-label="Motion mode"] button')
      .filter({ hasText: /^none$/ })
      .first()
      .evaluate((button: HTMLButtonElement) => button.click());
    await expect(field).toBeFocused();
    await expect(field).toHaveValue("Ada");
    expect(await field.evaluate((node: HTMLInputElement) => node.selectionStart)).toBe(3);

    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.press("ControlOrMeta+c");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("Ada");
    await field.pressSequentially("G");
    await expect(field).toHaveValue("G");
  });

  test("textarea keeps a multiline selection and native scroll", async ({ page }) => {
    await open(page, "textarea");
    const field = page.locator('[data-component-example="textarea/controlled"]').getByLabel("Review note");
    await field.click();
    await field.pressSequentially("one");
    await page.keyboard.press("Enter");
    await field.pressSequentially("two");
    await expect(field).toHaveValue("one\ntwo");

    await page.keyboard.press("Shift+ArrowUp");
    const selection = await field.evaluate((node: HTMLTextAreaElement) => ({
      start: node.selectionStart,
      end: node.selectionEnd,
      direction: node.selectionDirection,
    }));
    expect(selection.end).toBeGreaterThan(selection.start);

    await page
      .locator('[aria-label="Motion mode"] button')
      .filter({ hasText: /^reduced$/ })
      .first()
      .evaluate((button: HTMLButtonElement) => button.click());
    await expect(field).toBeFocused();
    const after = await field.evaluate((node: HTMLTextAreaElement) => ({
      start: node.selectionStart,
      end: node.selectionEnd,
    }));
    expect(after).toEqual({ start: selection.start, end: selection.end });
  });

  test("input-otp backspace and retype commit to the single native input", async ({ page }) => {
    await open(page, "input-otp");
    const card = page.locator('[data-component-example="input-otp/controlled"]');
    const input = card.locator('[data-slot="input-otp"]');
    await input.click();
    await input.pressSequentially("1234");
    await page.keyboard.press("Backspace");
    await expect(card.locator('[data-slot="input-otp-slot"]')).toHaveText(["1", "2", "3", "", "", ""]);
    await input.pressSequentially("5");
    await expect(card.locator('[data-slot="input-otp-slot"]')).toHaveText(["1", "2", "3", "5", "", ""]);
    await expect(card.locator('[data-slot="input-otp"]')).toHaveCount(1);
  });
});

test.describe("no-JS first paint", () => {
  for (const id of IDS) {
    test(`${id}: the shipped examples are visible before hydration`, async ({ browser, baseURL }) => {
      const context = await browser.newContext({ javaScriptEnabled: false });
      try {
        const page = await context.newPage();
        await page.goto(`${baseURL}/components/${id}?motion=none`);
        const card = page.locator(`[data-component-example^="${id}/"]`).first();
        await expect(card).toBeVisible();
        await expect(card.locator("[data-slot], input, textarea, button").first()).toBeVisible();
      } finally {
        await context.close();
      }
    });
  }
});
