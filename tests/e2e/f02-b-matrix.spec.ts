import { mkdir } from "node:fs/promises";
import { expect, type Page, test } from "@playwright/test";
import { effectiveMode, MODES } from "./helpers";

/**
 * F02-B (issue #132): the slice's edit/selection controls on their shipped route,
 * in the full 3 × 2 × 2 × 2 × 2 matrix — three modes, both OS motion preferences
 * (`prefers-reduced-motion`), both OS contrast preferences (`forced-colors`), both
 * themes and both widths — with one performed interaction and one screenshot per
 * cell.
 *
 * The cell is a pair of facts: which mode the provider actually resolved, and what
 * the interactive control does when it is used. A screenshot is evidence, not a
 * assertion, so it is written beside the cell name instead of into the report.
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

const SHOT_ROOT = ".cache/f02-b/shots";
// Run explicitly: `pnpm exec playwright test tests/e2e/f02-b-*.spec.ts`. This is an audit
// matrix over 11 components, so `scripts/ci/affected-e2e-specs.mjs` (which only replays
// `tests/e2e/<id>.spec.ts` for the ids a diff names) does not select it.

async function open(page: Page, id: Id, requested: (typeof MODES)[number], expected: string) {
  await page.goto(`/components/${id}?motion=${requested}`);
  const preview = page.locator(`[data-preview="${id}"]`);
  await expect(preview).toHaveAttribute("data-preview-motion", expected, { timeout: 20_000 });
  await page.waitForLoadState("networkidle");
  return preview;
}

/**
 * One real action per id. These are deliberately the same paths the component
 * specs already exercise, so a cell that breaks here points at the route/mode
 * combination rather than at an untested interaction.
 */
async function use(page: Page, id: Id) {
  const preview = page.locator(`[data-preview="${id}"]`);
  switch (id) {
    case "input": {
      const controlled = page.locator('[data-component-example="input/controlled"]');
      await controlled.getByRole("button", { name: "Use workspace name" }).click();
      await expect(controlled.getByRole("status")).toHaveText("Value: Cadence UI");
      const field = controlled.getByLabel("Workspace name");
      await field.fill("Ada");
      await field.pressSequentially(" Lovelace");
      await expect(field).toHaveValue("Ada Lovelace");
      await expect(controlled.getByRole("status")).toHaveText("Value: Ada Lovelace");
      break;
    }
    case "textarea": {
      const controlled = page.locator('[data-component-example="textarea/controlled"]');
      const field = controlled.getByLabel("Review note");
      await field.fill("Ready");
      await field.pressSequentially(" for review");
      await expect(field).toHaveValue("Ready for review");
      await expect(controlled.getByRole("status")).toHaveText("16 / 280 characters");
      break;
    }
    case "input-otp": {
      const controlled = page.locator('[data-component-example="input-otp/controlled"]');
      const input = controlled.locator('[data-slot="input-otp"]');
      await input.click();
      await input.pressSequentially("123456");
      await expect(controlled.locator('[data-slot="input-otp-slot"]')).toHaveText(["1", "2", "3", "4", "5", "6"]);
      await expect(controlled.getByRole("status")).toHaveText("Completed: 123456");
      break;
    }
    case "field": {
      const caller = page.locator('[data-component-example="field/caller-error"]');
      const toggle = caller.getByRole("button", { name: "Toggle supplied error" });
      const error = caller.locator('[data-slot="field-error"]');
      await expect(error).toBeVisible();
      await toggle.click();
      await expect(error).toHaveCount(0);
      await toggle.click();
      await expect(caller.locator('[data-slot="field-error"]')).toBeVisible();
      break;
    }
    case "input-group": {
      const clear = page.locator('[data-component-example="input-group/button"]');
      const input = clear.getByRole("textbox", { name: "Domain xs" });
      await input.fill("cadence.dev");
      await clear.getByRole("button", { name: "Clear domain xs" }).click();
      await expect(input).toHaveValue("");
      break;
    }
    case "checkbox": {
      const controlled = page.locator('[data-component-example="checkbox/controlled"]');
      const box = controlled.getByRole("checkbox");
      await controlled.locator("label").click();
      await expect(box).toBeChecked();
      await expect(controlled.getByRole("status")).toHaveText("Terms accepted");
      break;
    }
    case "radio-group": {
      const controlled = page.locator('[data-component-example="radio-group/controlled"]');
      await controlled.getByRole("radio", { name: "Scale" }).check();
      await expect(controlled.getByRole("status")).toHaveText("Selected plan: scale");
      break;
    }
    case "switch": {
      const controlled = page.locator('[data-component-example="switch/controlled"]');
      const control = controlled.getByRole("switch");
      await control.click();
      await expect(control).toBeChecked();
      await expect(controlled.getByRole("status")).toHaveText("Alerts on in this example");
      break;
    }
    case "slider": {
      const controlled = page.locator('[data-component-example="slider/controlled"]');
      const slider = controlled.getByRole("slider", { name: "Controlled volume" });
      const start = Number(await slider.getAttribute("aria-valuenow"));
      await slider.focus();
      await slider.press("ArrowRight");
      await expect.poll(async () => Number(await slider.getAttribute("aria-valuenow"))).toBe(start + 1);
      await expect(controlled.getByRole("status")).toHaveText(new RegExp(`^Volume: ${start + 1}%`));
      await slider.press("ArrowLeft");
      await expect.poll(async () => Number(await slider.getAttribute("aria-valuenow"))).toBe(start);
      break;
    }
    case "select": {
      const trigger = preview.getByRole("combobox", { name: "Framework", exact: true });
      await trigger.click();
      const list = page.getByRole("listbox");
      await expect(list).toBeVisible();
      await expect(list.getByRole("option")).toHaveCount(3);
      await page.keyboard.press("Escape");
      await expect(list).toHaveCount(0);
      await expect(trigger).toBeFocused();
      break;
    }
    case "combobox": {
      const card = page.locator('[data-component-example="combobox/groups"]');
      const input = card.getByRole("combobox", { name: "Stack", exact: true });
      await input.click();
      const popup = page.locator('[data-slot="combobox-content"]');
      await expect(popup).toBeVisible();
      await input.fill("Ru");
      await expect(popup.getByRole("option")).toHaveCount(1);
      await expect(popup.getByRole("option")).toHaveText("Rust");
      await page.keyboard.press("Escape");
      await expect(popup).toHaveCount(0);
      break;
    }
  }
}

const PREFERENCES = ["no-preference", "reduce"] as const;
const CONTRAST = ["none", "active"] as const;

for (const reducedMotion of PREFERENCES) {
  for (const forcedColors of CONTRAST) {
    test.describe(`os: prefers-reduced-motion=${reducedMotion}, forced-colors=${forcedColors}`, () => {
      test.use({ reducedMotion, forcedColors });

      for (const colorScheme of ["light", "dark"] as const) {
        test.describe(`theme: ${colorScheme}`, () => {
          test.use({ colorScheme });

          for (const requested of MODES) {
            for (const width of [1440, 390] as const) {
              for (const id of IDS) {
                const resolved = effectiveMode(requested, reducedMotion === "reduce");
                test(`${id}: ${requested} → ${resolved} @ ${width}`, async ({ page }) => {
                  await page.setViewportSize({ width, height: 900 });
                  await open(page, id, requested, resolved);

                  // A nested provider is not a reason for a second answer: every part
                  // that reports a mode inside the preview must report the resolved one.
                  const reported = await page
                    .locator(
                      `[data-component-example^="${id}/"]:not([data-component-example$="/without-motion"]) [data-motion]`,
                    )
                    .evaluateAll((nodes) => [...new Set(nodes.map((node) => node.getAttribute("data-motion")))]);
                  for (const mode of reported) expect(mode).toBe(resolved);

                  await use(page, id);

                  const frame = page.locator(`[data-preview="${id}"]`);
                  const geometry = await frame.evaluate((element) => ({
                    scrollWidth: element.scrollWidth,
                    clientWidth: element.clientWidth,
                  }));
                  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 2);

                  await mkdir(`${SHOT_ROOT}/${id}`, { recursive: true });
                  await page.screenshot({
                    path: `${SHOT_ROOT}/${id}/${requested}-${reducedMotion}-${forcedColors}-${colorScheme}-${width}.png`,
                    fullPage: false,
                  });
                });
              }
            }
          }
        });
      }
    });
  }
}
