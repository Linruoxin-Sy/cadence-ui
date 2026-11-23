import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

/**
 * F02-B (issue #132): one axe scan on each shipped route in the slice, in both
 * themes and at both widths, in the state a reader can actually reach — the
 * select and combobox popups are open, because a closed popup makes a portal's
 * contrast and naming rules invisible to the scanner.
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

/** The shipped example count each route carries; the scan waits for them all. */
const EXAMPLES: Record<Id, number> = {
  input: 4,
  textarea: 6,
  "input-otp": 6,
  field: 5,
  "input-group": 4,
  checkbox: 7,
  "radio-group": 7,
  switch: 5,
  slider: 7,
  select: 8,
  combobox: 14,
};

async function reach(page: Page, id: Id) {
  await page.goto(`/components/${id}?motion=none`);
  await page.waitForLoadState("networkidle");
  // A scan taken while the route is still settling reads half-painted content:
  // the same accessible names resolve, but axe's visibility checks see the
  // entrance state instead of the page a reader receives. Wait for the shipped
  // examples to be on the page, then for one paint before scanning.
  await page.waitForFunction(
    (count) => document.querySelectorAll("[data-component-example]").length >= count,
    EXAMPLES[id],
    { timeout: 20_000 },
  );
  await page.waitForTimeout(400);
  const preview = page.locator(`[data-preview="${id}"]`);
  await expect(preview).toBeVisible();
  switch (id) {
    case "select": {
      await preview.getByRole("combobox", { name: "Framework", exact: true }).click();
      await expect(page.getByRole("listbox")).toBeVisible();
      break;
    }
    case "combobox": {
      const card = page.locator('[data-component-example="combobox/groups"]');
      await card.getByRole("combobox", { name: "Stack", exact: true }).click();
      await expect(page.locator('[data-slot="combobox-content"]')).toBeVisible();
      break;
    }
    case "input-otp": {
      await page.locator('[data-component-example="input-otp/controlled"] [data-slot="input-otp"]').focus();
      break;
    }
    case "slider": {
      await preview.getByRole("slider", { name: "Volume" }).focus();
      break;
    }
    case "field": {
      await page.locator('[data-component-example="field/caller-error"] [data-slot="field-error"]').first().waitFor();
      break;
    }
    default: {
      const first = preview
        .locator("input, textarea, button, [role='checkbox'], [role='radio'], [role='switch']")
        .first();
      if (await first.count()) await first.focus();
    }
  }
}

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`theme: ${colorScheme}`, () => {
    test.use({ colorScheme });

    for (const width of [1440, 390] as const) {
      for (const id of IDS) {
        test(`${id} @ ${width}: zero violations`, async ({ page }) => {
          test.slow();
          await page.setViewportSize({ width, height: 900 });
          await reach(page, id);
          const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
          expect(results.violations).toEqual([]);
        });
      }
    }
  });
}
