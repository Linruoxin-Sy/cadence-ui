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
