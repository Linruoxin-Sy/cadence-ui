import { expect, test } from "@playwright/test";
import { installInitialControlProbe } from "./initial-control-probe";

test("initial probe rejects actual inserted opacity motion", async ({ page }) => {
  await installInitialControlProbe(page);
  await page.goto("/components/checkbox?motion=none");
  await page.evaluate(() => {
    const scope = document.createElement("div");
    scope.dataset.testid = "initial-none";
    // Replace only the test specimen: the new part starts a real browser animation
    // in the same insertion task, before the MutationObserver can run.
    document.querySelector('[data-testid="initial-none"]')?.remove();
    const part = document.createElement("span");
    part.dataset.slot = "negative-control";
    part.dataset.motion = "none";
    scope.append(part);
    document.body.append(scope);
    part.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 2000 });
  });
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as unknown as { initial: { slot: string; animations: number }[] }).initial.some(
          (s) => s.slot === "negative-control" && s.animations > 0,
        ),
      ),
    )
    .toBe(true);
});
