import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * The accessibility rules the site promises, checked in a real engine. jsdom
 * cannot answer these either: axe's landmark, contrast and ARIA rules need a
 * rendered box tree and computed styles.
 *
 * Scanned on the pages a reader actually lands on, in both themes: the component
 * pages are where the sidebar, the mode switch and the previews meet.
 */
const PAGES = [
  { path: "/", name: "home" },
  { path: "/components", name: "component index" },
  { path: "/components/button", name: "button" },
  { path: "/components/dialog", name: "dialog" },
  { path: "/components/alert-dialog", name: "alert dialog" },
  { path: "/components/popover", name: "popover" },
  { path: "/components/tooltip", name: "tooltip" },
  { path: "/components/hover-card", name: "hover card" },
  { path: "/components/sheet", name: "sheet" },
  { path: "/components/drawer", name: "drawer" },
  { path: "/components/dropdown-menu", name: "dropdown menu" },
  { path: "/components/context-menu", name: "context menu" },
  { path: "/components/menubar", name: "menubar" },
  { path: "/components/combobox", name: "combobox" },
  { path: "/components/switch?motion=none", name: "switch in none mode" },
  { path: "/components/code-block", name: "code block" },
  { path: "/docs", name: "guide index" },
  { path: "/docs/installation", name: "installation" },
  { path: "/docs/motion", name: "motion guide" },
  { path: "/docs/motion-modes", name: "motion modes guide" },
] as const;

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`${colorScheme} theme`, () => {
    test.use({ colorScheme });

    for (const { path, name } of PAGES) {
      test(`no axe violations on ${name}`, async ({ page }) => {
        await page.goto(path);
        // The motion mode and the theme both resolve on mount; scanning the
        // server HTML would measure a page no visitor ever sees.
        await page.waitForLoadState("networkidle");

        const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
        expect(results.violations).toEqual([]);
      });
    }
  });
}

for (const id of ["breadcrumb", "pagination", "toggle"])
  for (const width of [1440, 390])
    for (const colorScheme of ["light", "dark"] as const)
      test(`complete ${id} document retains visible names and unique landmarks ${width}/${colorScheme}`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ colorScheme });
        await page.goto(`/components/${id}?motion=none`);
        await page.waitForLoadState("networkidle");
        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations).toEqual([]);
      });

// Both visible desktop asides need distinct names; WCAG-only scans omit landmark-unique.
for (const width of [1440, 390])
  for (const colorScheme of ["light", "dark"] as const)
    test(`complete component document has unique landmarks ${width}/${colorScheme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme });
      await page.goto("/components/button?motion=none");
      await page.waitForLoadState("networkidle");
      if (width === 1440) {
        await expect(page.getByRole("complementary", { name: "Documentation sidebar" })).toBeVisible();
        await expect(page.getByRole("complementary", { name: "Page sections" })).toBeVisible();
      }
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });
