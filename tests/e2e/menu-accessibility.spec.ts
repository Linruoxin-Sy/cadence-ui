import { expect, test } from "@playwright/test";
import { expectMenuAccessibility } from "./menu-accessibility";

test("menu accessibility rejects a hidden focusable button", async ({ page }) => {
  await page.setContent(
    '<html lang="en"><title>Negative focus fixture</title><body><main><div aria-hidden="true"><button>Hidden action</button></div></main></body></html>',
  );
  await expect(expectMenuAccessibility(page, async () => {})).rejects.toThrow("Unreviewed aria-hidden focus violation");
});
test("menu accessibility rejects a guard that keeps hidden focus", async ({ page }) => {
  await page.setContent(
    '<html lang="en"><title>Negative guard fixture</title><body><main><button>Outside</button><span data-base-ui-focus-guard aria-hidden="true" tabindex="0" style="clip-path:inset(50%);width:1px;height:1px;position:fixed"></span></main></body></html>',
  );
  await expect(expectMenuAccessibility(page, async () => {})).rejects.toThrow(
    "Native focus guard retained hidden focus before paint",
  );
});
