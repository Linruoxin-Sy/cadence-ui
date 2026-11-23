import { expect, test } from "@playwright/test";
import { effectiveMode, MODES, openComponent, scoped } from "./helpers";

/**
 * The viewport-reveal contract in a real engine.
 *
 * `docs/motion/components/reveal.md` and `reveal-group.md` promise more than jsdom
 * can answer: the first screen stays visible, an entrance is *consumed* once, a
 * restrictive mode cannot re-hide content, and print/focus never wait for a
 * transition. jsdom has no layout and no print media, so these are sealed here.
 */
const HOST = scoped("reveal", '[data-slot="reveal"]');
const GROUP_HOST = scoped("reveal-group", '[data-slot="reveal"]');

async function scrollAwayAndBack(page: import("@playwright/test").Page) {
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(300);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
}

for (const prefersReduced of [false, true])
  for (const requested of MODES) {
    const mode = effectiveMode(requested, prefersReduced);

    test(`reveal requested ${requested} · prefers-reduced ${prefersReduced} settles ${mode} as a visible native host`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: prefersReduced ? "reduce" : "no-preference" });
      await openComponent(page, "reveal", requested, "reveal", mode);

      const host = page.locator(HOST).first();
      await expect(host).toBeVisible();
      // A first-screen target never enters the hidden state machine, in every mode.
      expect(await host.getAttribute("data-cadence-reveal")).toBeNull();
      expect(await host.evaluate((node) => getComputedStyle(node).opacity)).toBe("1");
      expect(
        await host.evaluate(
          (node) => node.getAnimations({ subtree: true }).filter((a) => a.playState === "running").length,
        ),
      ).toBe(0);
    });
  }

test("reveal consumes the first screen once and never replays on return", async ({ page }) => {
  await openComponent(page, "reveal", "full", "reveal", "full");
  const host = page.locator(HOST).first();

  // Let the first observation settle before leaving: a `pending` read on the very
  // first frame is the initial registration, not a re-hide.
  await page.waitForTimeout(700);
  expect(await host.getAttribute("data-cadence-reveal")).toBeNull();

  await scrollAwayAndBack(page);
  expect(await host.getAttribute("data-cadence-reveal")).toBeNull();
  expect(await host.evaluate((node) => getComputedStyle(node).opacity)).toBe("1");
  expect(
    await host.evaluate(
      (node) => node.getAnimations({ subtree: true }).filter((a) => a.playState === "running").length,
    ),
  ).toBe(0);
});

test("reveal-group applies the same once policy to its mounted target", async ({ page }) => {
  await openComponent(page, "reveal-group", "full", "reveal", "full");
  const host = page.locator(GROUP_HOST).first();

  await page.waitForTimeout(700);
  expect(await host.getAttribute("data-cadence-reveal")).toBeNull();
  await scrollAwayAndBack(page);
  expect(await host.getAttribute("data-cadence-reveal")).toBeNull();
  expect(await host.evaluate((node) => getComputedStyle(node).opacity)).toBe("1");
});

test("print keeps the revealed content opaque with no authored transition", async ({ page }) => {
  await openComponent(page, "reveal", "full", "reveal", "full");
  await page.emulateMedia({ media: "print" });
  await page.waitForTimeout(150);

  const host = page.locator(HOST).first();
  const printed = await host.evaluate((node) => ({
    opacity: getComputedStyle(node).opacity,
    durations: getComputedStyle(node).transitionDuration,
    attribute: node.getAttribute("data-cadence-reveal"),
  }));
  expect(printed.opacity).toBe("1");
  expect(printed.durations.split(",").every((value) => Number.parseFloat(value) === 0)).toBe(true);
  expect(printed.attribute).toBeNull();
});

test("reveal content is readable without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: "reduce" });
  const page = await context.newPage();
  const response = await page.goto("/components/reveal");
  expect(response?.status()).toBe(200);

  const host = page.locator(HOST).first();
  await expect(host).toBeVisible();
  expect((await host.innerText()).trim().length).toBeGreaterThan(0);
  expect(await host.evaluate((node) => getComputedStyle(node).opacity)).toBe("1");
  await context.close();
});
