import { mkdir } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("section clicks scroll through intermediate positions, focus the heading and preserve fragment history", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/components/button?motion=full&speed=0.25&keep=yes");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("article")).toHaveCSS("transform", "none");
  await page.evaluate(() => {
    window.history.replaceState({ ...window.history.state, tocProof: "kept" }, "", window.location.href);
    (window as unknown as { hashNotifications: number }).hashNotifications = 0;
    window.addEventListener(
      "hashchange",
      () => (window as unknown as { hashNotifications: number }).hashNotifications++,
    );
  });
  const toc = page.locator("[data-document-toc] nav");
  const api = page.locator("h2#api");
  const destination = await api.evaluate(
    (node) =>
      window.scrollY +
      node.getBoundingClientRect().top -
      (Number.parseFloat(getComputedStyle(node).scrollMarginTop) || 0),
  );
  await toc.getByRole("link", { name: "API", exact: true }).click();
  await expect(page).toHaveURL(/keep=yes#api$/);
  const frames = await page.evaluate(async () => {
    const positions: number[] = [];
    for (let i = 0; i < 20; i++) {
      await new Promise(requestAnimationFrame);
      positions.push(window.scrollY);
    }
    return positions;
  });
  expect(frames.some((position) => position > 1 && position < destination - 1)).toBe(true);
  expect(new Set(frames).size).toBeGreaterThan(3);
  await expect(api).toBeFocused();
  expect(await api.evaluate((node) => Math.abs(node.getBoundingClientRect().top - 96))).toBeLessThanOrEqual(1);
  expect(await page.evaluate(() => window.history.state.tocProof)).toBe("kept");
  expect(await page.evaluate(() => (window as unknown as { hashNotifications: number }).hashNotifications)).toBe(1);
  await toc.getByRole("link", { name: "Usage", exact: true }).click();
  await expect(page.locator("h2#usage")).toBeFocused();
  await expect(api).not.toHaveAttribute("tabindex");
  await page.goBack();
  await expect(page).toHaveURL(/#api$/);
  await expect(api).toBeInViewport();
  await page.goForward();
  await expect(page).toHaveURL(/#usage$/);
  await expect(page.locator("h2#usage")).toBeInViewport();
});

test("rapid link changes retarget the trip and manual interruption stops further scroll writes", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/components/button?motion=full&speed=0.25");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("article")).toHaveCSS("transform", "none");
  const toc = page.locator("[data-document-toc] nav");
  await toc.getByRole("link", { name: "API", exact: true }).click();
  await toc.getByRole("link", { name: "Usage", exact: true }).click();
  await expect(page.locator("h2#usage")).toBeFocused();
  await expect(page).toHaveURL(/#usage$/);
  await toc.getByRole("link", { name: "API", exact: true }).click();
  await page.evaluate(async () => {
    for (let i = 0; i < 6; i++) await new Promise(requestAnimationFrame);
  });
  await page.keyboard.press("Escape");
  const stopped = await page.evaluate(async () => {
    const positions: number[] = [];
    for (let i = 0; i < 12; i++) {
      await new Promise(requestAnimationFrame);
      positions.push(window.scrollY);
    }
    return positions;
  });
  expect(Math.max(...stopped) - Math.min(...stopped)).toBeLessThan(1);
  await expect(page.locator("h2#api")).not.toBeFocused();
});

for (const setting of [
  { mode: "reduced", os: "no-preference" },
  { mode: "none", os: "no-preference" },
  { mode: "full", os: "reduce" },
] as const) {
  test(`section navigation is instant for ${setting.mode}/${setting.os}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: setting.os });
    await page.goto(`/components/button?motion=${setting.mode}`);
    await page.waitForLoadState("networkidle");
    await page.locator("[data-document-toc] nav").getByRole("link", { name: "API", exact: true }).click();
    await expect(page.locator("h2#api")).toBeFocused();
    const positions = await page.evaluate(async () => {
      const values = [window.scrollY];
      for (let i = 0; i < 8; i++) {
        await new Promise(requestAnimationFrame);
        values.push(window.scrollY);
      }
      return values;
    });
    expect(Math.max(...positions) - Math.min(...positions)).toBeLessThan(1);
  });
}

test("mobile section links also scroll smoothly", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/components/button?motion=full&speed=0.25");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("article")).toHaveCSS("transform", "none");
  const disclosure = page.locator("[data-mobile-toc]");
  await disclosure.locator("summary").click();
  await disclosure.getByRole("link", { name: "API", exact: true }).click();
  const positions = await page.evaluate(async () => {
    const values: number[] = [];
    for (let i = 0; i < 12; i++) {
      await new Promise(requestAnimationFrame);
      values.push(window.scrollY);
    }
    return values;
  });
  expect(new Set(positions).size).toBeGreaterThan(3);
  await expect(page.locator("h2#api")).toBeFocused();
});

test("one indicator slides, resizes for wrapping, reverses and cancels before the next paint", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/components/button?motion=full&speed=0.25");
  await page.waitForLoadState("networkidle");
  const toc = page.locator("[data-document-toc] nav");
  const marker = toc.locator('[data-slot="toc-indicator"]');
  await expect(marker).toHaveCSS("visibility", "visible");
  await marker.evaluate((node) => {
    (window as unknown as { tocIndicator: Element }).tocIndicator = node;
  });
  await page.locator("h2#api").evaluate((heading) => heading.scrollIntoView());
  await expect(toc.getByRole("link", { name: "API", exact: true })).toHaveAttribute("aria-current", "location");
  const moving = await toc.evaluate(async (nav) => {
    const marker = nav.querySelector<HTMLElement>('[data-slot="toc-indicator"]');
    const rail = nav.querySelector<HTMLElement>('[data-slot="toc-track"]');
    const target = nav.querySelector<HTMLElement>('[aria-current="location"]');
    if (!marker || !rail || !target) throw new Error("Missing Toc geometry");
    const frames: number[] = [];
    for (let i = 0; i < 12; i++) {
      await new Promise(requestAnimationFrame);
      frames.push(marker.getBoundingClientRect().top - rail.getBoundingClientRect().top);
    }
    return { frames, target: target.offsetTop };
  });
  expect(moving.frames.some((top) => top > 1 && top < moving.target - 1)).toBe(true);
  expect(new Set(moving.frames.map((top) => top.toFixed(2))).size).toBeGreaterThan(3);
  // Reverse while still moving, then force none on that same destination/node.
  await page.locator("h2#usage").evaluate((heading) => heading.scrollIntoView());
  await page.getByRole("button", { name: "none", exact: true }).click();
  await expect(marker).toHaveAttribute("data-motion", "none");
  const settled = await toc.evaluate(async (nav) => {
    const marker = nav.querySelector<HTMLElement>('[data-slot="toc-indicator"]');
    const target = nav.querySelector<HTMLElement>('[aria-current="location"]');
    if (!marker || !target) throw new Error("Missing Toc destination");
    const frames = [];
    for (let i = 0; i < 8; i++) {
      await new Promise(requestAnimationFrame);
      frames.push({
        top: marker.offsetTop,
        height: marker.getBoundingClientRect().height,
        transform: getComputedStyle(marker).transform,
      });
    }
    return { frames, top: target.offsetTop, height: target.offsetHeight };
  });
  for (const frame of settled.frames) {
    expect(frame.top).toBe(settled.top);
    expect(frame.height).toBeCloseTo(settled.height, 1);
    expect(frame.transform).toBe("none");
  }
  expect(await marker.evaluate((node) => node === (window as unknown as { tocIndicator: Element }).tocIndicator)).toBe(
    true,
  );
  const wrapped = toc.getByRole("link", { name: "Installation", exact: true });
  await wrapped.click();
  await page.getByRole("button", { name: "full", exact: true }).click();
  // Resize the actual container so its first label wraps, away from the page-bottom rule.
  await toc.evaluate((node) => {
    node.style.width = "6rem";
  });
  const targetHeight = await wrapped.evaluate((node) => (node as HTMLElement).offsetHeight);
  expect(targetHeight).toBeGreaterThan(30);
  await expect.poll(() => marker.evaluate((node) => node.getBoundingClientRect().height)).toBeCloseTo(targetHeight, 1);
});

for (const os of ["no-preference", "reduce"] as const) {
  for (const mode of ["full", "reduced", "none"] as const) {
    test(`indicator honours ${mode} with OS ${os}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.emulateMedia({ reducedMotion: os });
      await page.goto(`/components/button?motion=${mode}`);
      await page.waitForLoadState("networkidle");
      const effective = mode === "none" ? "none" : os === "reduce" ? "reduced" : mode;
      const toc = page.locator("[data-document-toc] nav");
      const marker = toc.locator('[data-slot="toc-indicator"]');
      await expect(marker).toHaveAttribute("data-motion", effective);
      await page.locator("h2#api").evaluate((heading) => heading.scrollIntoView());
      await expect(toc.getByRole("link", { name: "API", exact: true })).toHaveAttribute("aria-current", "location");
      await expect
        .poll(() =>
          toc.evaluate((nav) => {
            const marker = nav.querySelector('[data-slot="toc-indicator"]')?.getBoundingClientRect();
            const link = nav.querySelector('[aria-current="location"]')?.getBoundingClientRect();
            if (!marker || !link) throw new Error("Missing Toc destination");
            return Math.abs(marker.top - link.top) + Math.abs(marker.height - link.height);
          }),
        )
        .toBeLessThan(1);
      if (effective !== "full") await expect(marker).toHaveCSS("transform", "none");
    });
  }
}

test("deep links select the matching heading in every motion mode", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const mode of ["full", "reduced", "none"]) {
    await page.goto(`/components/dialog?motion=${mode}&speed=0.25#api`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("[data-document-toc]").getByRole("link", { name: "API", exact: true })).toHaveAttribute(
      "aria-current",
      "location",
    );
    const difference = await page.locator("[data-document-toc] nav").evaluate((nav) => {
      const marker = nav.querySelector('[data-slot="toc-indicator"]')?.getBoundingClientRect();
      const link = nav.querySelector('[aria-current="location"]')?.getBoundingClientRect();
      if (!marker || !link) throw new Error("Missing initial indicator");
      return Math.abs(marker.top - link.top);
    });
    expect(difference).toBeLessThan(1);
  }
});

for (const theme of ["light", "dark"] as const) {
  test(`upper right Toc tracks headings and keyboard fragments in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/components/button?motion=none");
    await page.waitForLoadState("networkidle");
    await page.evaluate((dark) => document.documentElement.classList.toggle("dark", dark), theme === "dark");
    const toc = page.locator("[data-document-toc] nav");
    const article = page.locator("article");
    const rail = await toc.boundingBox();
    const body = await article.boundingBox();
    expect(rail && body && rail.x > body.x + body.width).toBeTruthy();
    expect(rail?.y).toBeLessThan(140);
    const api = toc.getByRole("link", { name: "API", exact: true });
    await api.focus();
    await api.press("Enter");
    await expect(page).toHaveURL(/#api$/);
    await expect(page.locator("h2#api")).toBeInViewport();
    await expect(api).toHaveAttribute("aria-current", "location");
    expect((await toc.boundingBox())?.y).toBeCloseTo(80, 0);
    await page.locator("h2#usage").evaluate((heading) => heading.scrollIntoView());
    await expect(toc.getByRole("link", { name: "Usage", exact: true })).toHaveAttribute("aria-current", "location");
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(toc.getByRole("link").last()).toHaveAttribute("aria-current", "location");
    await page.evaluate(() => window.scrollTo(0, 0));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual(
      [],
    );
    await mkdir(".cache/toc-proof", { recursive: true });
    await page.screenshot({ path: `.cache/toc-proof/desktop-${theme}.png` });
  });
}

for (const javaScriptEnabled of [true, false]) {
  test(`mobile Toc works with JavaScript ${javaScriptEnabled}`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled, viewport: { width: 390, height: 844 } });
    try {
      const page = await context.newPage();
      await page.goto(`${baseURL}/components/dialog?motion=none`);
      const disclosure = page.locator("[data-mobile-toc]");
      await expect(page.locator("[data-document-toc]")).toBeHidden();
      await disclosure.locator("summary").focus();
      await page.keyboard.press("Enter");
      const toc = disclosure.getByRole("navigation", { name: "On this page" });
      await expect(toc).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await mkdir(".cache/toc-proof", { recursive: true });
      await page.screenshot({ path: `.cache/toc-proof/mobile-js-${javaScriptEnabled}.png` });
      await toc.getByRole("link", { name: "API", exact: true }).click();
      await expect(page.locator("h2#api")).toBeInViewport();
      await expect(page).toHaveURL(/#api$/);
      await page.reload();
      await expect(page.locator("h2#api")).toBeInViewport();
    } finally {
      await context.close();
    }
  });
}
