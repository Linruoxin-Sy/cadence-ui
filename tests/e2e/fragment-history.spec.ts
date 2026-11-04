import { readFile } from "node:fs/promises";
import { expect, type Locator, type Page, test } from "@playwright/test";

async function queryHistory(page: Page, button: Locator) {
  await button.focus();
  await expect(button).toBeFocused();
  const original = await button.elementHandle();
  await page.evaluate(() => {
    const url = new URL(location.href);
    url.searchParams.set("variant", "secondary");
    history.pushState({ ...history.state, callerToken: "retained" }, "", url);
  });
  const states = [];
  for (const direction of ["back", "forward"] as const) {
    if (direction === "back") await page.goBack();
    else await page.goForward();
    await page.evaluate(
      () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
    );
    expect(await button.evaluate((node, held) => node === held, original)).toBe(true);
    states.push(
      await page.evaluate(() => ({
        active: document.activeElement?.tagName,
        hash: location.hash,
        variant: new URL(location.href).searchParams.get("variant"),
        callerToken: history.state?.callerToken,
        scrollY,
      })),
    );
  }
  await original?.dispose();
  return states;
}

for (const mode of ["full", "reduced", "none"] as const) {
  for (const width of [1440, 390]) {
    test(`same-fragment query history retains native focus navigation: ${mode}, ${width}`, async ({
      page,
      context,
    }, info) => {
      await page.setViewportSize({ width, height: 1000 });
      const native = await context.newPage();
      await native.setViewportSize({ width, height: 1000 });
      try {
        await native.route("**/__fixtures/native-fragment-history?*", async (route) =>
          route.fulfill({
            contentType: "text/html",
            body: await readFile("tests/fixtures/native-fragment-history.html", "utf8"),
          }),
        );
        await native.goto(`/__fixtures/native-fragment-history?motion=${mode}&variant=outline#usage`);
        const reference = await queryHistory(native, native.getByRole("button", { name: "Before Usage" }));
        // Chromium's native same-document traversal revisits the fragment and clears
        // element focus. This reference has no application scripts or focus handlers.
        expect(reference.map(({ active, hash, variant }) => ({ active, hash, variant }))).toEqual([
          { active: "BODY", hash: "#usage", variant: "outline" },
          { active: "BODY", hash: "#usage", variant: "secondary" },
        ]);
        await native.keyboard.press("Tab");
        await expect(native.getByRole("button", { name: "After Usage" })).toBeFocused();

        await page.goto(`/components/button?motion=${mode}&variant=outline#usage`);
        await page.waitForLoadState("networkidle");
        await expect(page.locator("article")).toHaveCSS("clip-path", "none");
        const actual = await queryHistory(page, page.locator('[data-preview="button"] button').first());
        expect(actual.map(({ active, hash, variant }) => ({ active, hash, variant }))).toEqual(
          reference.map(({ active, hash, variant }) => ({ active, hash, variant })),
        );
        expect(actual[1]?.callerToken).toBe("retained");
        await page.keyboard.press("Tab");
        const usage = page.locator("#usage + [data-slot=code-block]");
        await expect(usage.getByRole("button", { name: "Copy", exact: true })).toBeFocused();
        await expect(page.locator('[data-preview="button"] button')).toHaveCount(3);
        await expect(page.locator("[data-component-example]")).toHaveCount(5);
        await info.attach("native-and-product-fragment-history", {
          body: JSON.stringify({ reference, actual }, null, 2),
          contentType: "application/json",
        });
      } finally {
        await native.close();
      }
    });
  }
}
