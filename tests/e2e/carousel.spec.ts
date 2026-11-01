import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, test } from "@playwright/test";

async function frames(track: Locator, count = 18) {
  return track.evaluate(async (el, n) => {
    const values: string[] = [];
    for (let i = 0; i < n; i++) {
      await new Promise(requestAnimationFrame);
      values.push(getComputedStyle(el).transform);
    }
    return values;
  }, count);
}
async function aligned(root: Locator, slide: number, vertical = false) {
  await expect
    .poll(() =>
      root.evaluate(
        (el, args) => {
          const viewport = el.querySelector('[data-slot="carousel-content"]')?.getBoundingClientRect();
          const item = el
            .querySelectorAll('[data-slot="carousel-item"]')
            [args.slide - 1]?.firstElementChild?.getBoundingClientRect();
          if (!viewport || !item) throw Error("Missing geometry");
          return Math.abs(args.vertical ? item.top - viewport.top : item.left - viewport.left);
        },
        { slide, vertical },
      ),
    )
    .toBeLessThan(2);
}

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test.describe(`carousel ${reducedMotion}`, () => {
    test.use({ reducedMotion });
    for (const mode of ["full", "reduced", "none"] as const) {
      test(`${mode}: engine modes, API, drag, axes, resize and loop`, async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (e) => errors.push(e.message));
        await page.goto(`/components/carousel?motion=${mode}`);
        await page.waitForLoadState("networkidle");
        const preview = page.locator('[data-preview="carousel"]');
        const root = preview.getByRole("region", { name: "Project highlights" });
        const track = root.locator('[data-slot="carousel-content"] > div');
        const effective = mode === "none" ? "none" : reducedMotion === "reduce" ? "reduced" : mode;
        await expect(root).toHaveAttribute("data-motion", effective);
        await expect(preview.getByText("Slide 1 of 4 · Ready")).toBeVisible();
        await expect(root.getByRole("button", { name: "Previous slide" })).toBeDisabled();
        await root.getByRole("button", { name: "Next slide" }).click();
        const samples = await frames(track);
        if (effective === "full") expect(new Set(samples).size).toBeGreaterThan(2);
        else expect(new Set(samples).size).toBe(1);
        await aligned(root, 2);
        if (effective === "full") {
          const interruption = await root.evaluate(async (el) => {
            const track = el.querySelector('[data-slot="carousel-content"] > div');
            const next = el.querySelector<HTMLButtonElement>('[data-slot="carousel-next"]');
            const prev = el.querySelector<HTMLButtonElement>('[data-slot="carousel-previous"]');
            if (!track || !next || !prev) throw Error("Missing controls");
            const read = () => new DOMMatrixReadOnly(getComputedStyle(track).transform).m41;
            const start = read();
            next.click();
            for (let i = 0; i < 6; i++) await new Promise(requestAnimationFrame);
            const before = read();
            prev.click();
            const after = read();
            return { travel: Math.abs(before - start), jump: Math.abs(after - before) };
          });
          expect(interruption.travel).toBeGreaterThan(5);
          expect(interruption.jump).toBeLessThan(1);
          await aligned(root, 2);
        }
        // The pinned arrow capture remains available on either axis.
        await root.focus();
        await page.keyboard.press("ArrowRight");
        await page.keyboard.press("ArrowLeft");
        await aligned(root, 2);
        await preview.getByRole("button", { name: "Go to last slide" }).click();
        const apiSamples = await frames(track);
        if (effective !== "full") expect(new Set(apiSamples).size).toBe(1);
        await aligned(root, 4);
        await expect(root.getByRole("button", { name: "Next slide" })).toBeDisabled();
        await preview.getByRole("button", { name: "Resize track" }).click();
        await aligned(root, 4);
        await preview.getByRole("button", { name: "Change slides" }).click();
        await expect(root.locator('[data-slot="carousel-item"]')).toHaveCount(5);
        await preview.getByRole("button", { name: "Go to last slide" }).click();
        await aligned(root, 5);
        await preview.getByRole("button", { name: "Toggle loop" }).click();
        await root.getByRole("button", { name: "Next slide" }).click();
        await expect(preview.getByText("Slide 1 of 5 · Ready")).toBeVisible();
        await aligned(root, 1);
        // Native mouse dragging remains enabled under reduced/none.
        const box = await root.locator('[data-slot="carousel-content"]').boundingBox();
        if (!box) throw Error("Missing viewport");
        await page.mouse.move(box.x + box.width * 0.85, box.y + 70);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width * 0.15, box.y + 70, { steps: 12 });
        await page.mouse.up();
        const dragSamples = await frames(track);
        if (effective !== "full") expect(new Set(dragSamples).size).toBe(1);
        await expect(preview.getByText("Slide 1 of 5 · Ready")).toHaveCount(0);
        await preview.getByRole("button", { name: "Toggle loop" }).click();
        await preview.getByRole("button", { name: "Toggle orientation" }).click();
        await preview.getByRole("button", { name: "Go to last slide" }).click();
        await aligned(root, 5, true);
        await root.focus();
        await page.keyboard.press("ArrowLeft");
        await aligned(root, 4, true);
        // Resize through actual viewport wrapping; no document-level overflow.
        await page.setViewportSize({ width: 390, height: 844 });
        await aligned(root, 4, true);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        expect(errors).toEqual([]);
      });
    }
  });
}
test("live downgrade, RTL, free dragging and caller drag disable", async ({ page }) => {
  await page.goto("/components/carousel?motion=full&speed=0.25");
  await page.waitForLoadState("networkidle");
  const preview = page.locator('[data-preview="carousel"]');
  const root = preview.getByRole("region", { name: "Project highlights" });
  const track = root.locator('[data-slot="carousel-content"] > div');
  await preview.getByRole("button", { name: "Go to last slide" }).click();
  await page.getByRole("group", { name: "Motion mode" }).getByRole("button", { name: "none", exact: true }).click();
  await expect(root).toHaveAttribute("data-motion", "none");
  await aligned(root, 4);
  expect(new Set(await frames(track)).size).toBe(1);
  await expect(preview.getByText("Slide 4 of 4 · Ready")).toBeVisible();
  await preview.getByRole("button", { name: "Toggle RTL" }).click();
  await root.getByRole("button", { name: "Previous slide" }).click();
  await expect(preview.getByText("Slide 3 of 4 · Ready")).toBeVisible();
  await expect
    .poll(() =>
      root.evaluate((el) => {
        const viewport = el.querySelector('[data-slot="carousel-content"]')?.getBoundingClientRect();
        const slide = el.querySelectorAll('[data-slot="carousel-item"]')[2]?.firstElementChild?.getBoundingClientRect();
        if (!viewport || !slide) throw Error("Missing RTL geometry");
        // Compare the visible card edge; upstream physical padding remains inside each slide.
        return Math.abs(viewport.right - slide.right);
      }),
    )
    .toBeLessThan(2);
  await preview.getByRole("button", { name: "Toggle RTL" }).click();
  await root.getByRole("button", { name: "Previous slide" }).click();
  await aligned(root, 2);
  await preview.getByRole("button", { name: "Toggle dragging" }).click();
  const before = await track.evaluate((el) => getComputedStyle(el).transform);
  const box = await root.boundingBox();
  if (!box) throw Error("Missing root");
  await page.mouse.move(box.x + box.width * 0.8, box.y + 70);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.2, box.y + 70, { steps: 10 });
  await page.mouse.up();
  expect(new Set(await frames(track))).toEqual(new Set([before]));
  await preview.getByRole("button", { name: "Toggle dragging" }).click();
  await preview.getByRole("button", { name: "Toggle free drag" }).click();
  await page.mouse.move(box.x + box.width * 0.8, box.y + 70);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.45, box.y + 70, { steps: 20 });
  await page.mouse.up();
  const free = await frames(track);
  expect(new Set(free).size).toBe(1);
  expect(free[0]).not.toBe(before);
  await page.setViewportSize({ width: 390, height: 844 });
  await preview.getByRole("button", { name: "Go to last slide" }).click();
  expect(new Set(await frames(track)).size).toBe(1);
  await aligned(root, 4);
});

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`carousel ${colorScheme}`, () => {
    test.use({ colorScheme });
    test("axe, keyboard focus and screenshots", async ({ page }, info) => {
      await page.goto("/components/carousel?motion=none");
      await page.waitForLoadState("networkidle");
      const preview = page.locator('[data-preview="carousel"]');
      const root = preview.getByRole("region", { name: "Project highlights" });
      await root.focus();
      await page.keyboard.press("Tab");
      await expect(root.getByRole("button", { name: "Next slide" })).toBeFocused();
      await page.keyboard.press("Enter");
      await aligned(root, 2);
      await preview.screenshot({ path: info.outputPath(`carousel-${colorScheme}-selected.png`) });
      expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual(
        [],
      );
      await page.setViewportSize({ width: 390, height: 844 });
      await preview.screenshot({ path: info.outputPath(`carousel-${colorScheme}-narrow.png`) });
      await preview.getByRole("button", { name: "Toggle orientation" }).click();
      await preview.getByRole("button", { name: "Go to last slide" }).click();
      await aligned(root, 4, true);
      await preview.screenshot({ path: info.outputPath(`carousel-${colorScheme}-vertical.png`) });
      expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual(
        [],
      );
    });
  });
}
