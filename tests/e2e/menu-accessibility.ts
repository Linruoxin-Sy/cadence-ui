import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

/**
 * axe-core 4.14 focusableNotTabbableEvaluate treats an aria-hidden focus relay as
 * manual review when actualNode.onfocus exists. React delegates Base UI's onFocus,
 * so that property is null. Its fallback modal detector also depends on whether a
 * fullscreen backdrop's trigger cutout intersects one of five viewport samples.
 * Keep the rule enabled. Adjudicate only empty, clipped native guards, and require
 * every reported guard to transfer focus to a visible real target before paint.
 * Preserve the raw report and runtime proof; all other findings still fail.
 */
export async function expectMenuAccessibility(page: Page, reopen: () => Promise<void>) {
  const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(audit.violations.filter((finding) => finding.id !== "aria-hidden-focus")).toEqual([]);
  const indices = new Set<number>();
  for (const finding of audit.violations) {
    for (const node of finding.nodes) {
      if (!node.target.every((selector) => typeof selector === "string"))
        throw new Error("Unreviewed shadow focus target");
      const element = page.locator(node.target.join(" "));
      const index = await element.evaluate((node) => {
        const style = getComputedStyle(node);
        if (
          !node.matches('[data-base-ui-focus-guard][aria-hidden="true"][tabindex="0"]') ||
          node.childNodes.length ||
          style.clipPath !== "inset(50%)" ||
          style.width !== "1px" ||
          style.height !== "1px"
        )
          return -1;
        return [...document.querySelectorAll("[data-base-ui-focus-guard]")].indexOf(node);
      });
      if (index < 0) throw new Error("Unreviewed aria-hidden focus violation");
      indices.add(index);
    }
  }
  const proof = [];
  for (const index of indices) {
    await reopen();
    const result = await page
      .locator("[data-base-ui-focus-guard]")
      .nth(index)
      .evaluate(async (node) => {
        (node as HTMLElement).focus();
        await new Promise(requestAnimationFrame);
        const active = document.activeElement;
        return {
          forwarded:
            active !== node &&
            active !== document.body &&
            !!active?.isConnected &&
            !active.closest('[data-base-ui-focus-guard], [aria-hidden="true"], [inert]') &&
            getComputedStyle(active).visibility === "visible",
          target: active?.getAttribute("data-slot") ?? active?.tagName,
        };
      });
    if (!result.forwarded) throw new Error("Native focus guard retained hidden focus before paint");
    proof.push({ index, ...result });
  }
  if (indices.size) {
    await test.info().attach("reviewed-native-focus-relays", {
      body: JSON.stringify({ rawViolations: audit.violations, beforePaintProof: proof }),
      contentType: "application/json",
    });
    await reopen();
  }
}
