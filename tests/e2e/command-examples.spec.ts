import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { effectiveMode, MODES } from "./helpers";

const names = [
  "dialog",
  "keywords",
  "shortcuts",
  "controlled",
  "filter",
  "results",
  "navigation",
  "disabled",
  "mounted",
  "custom-input",
  "without-motion",
];
const card = (page: Page, name: string) => page.locator(`[data-component-example="command/${name}"]`);

test("command examples keep independent queries, actions and native focus", async ({ page }, info) => {
  await page.goto("/components/command?motion=none");
  await page.waitForLoadState("networkidle");
  const top = page.locator('[data-preview="command"]');
  await expect(top.getByRole("combobox")).toHaveCount(0);
  await expect(page.getByLabel("Popup motion", { exact: true })).toHaveCount(0);
  const opener = top.getByRole("button", { name: "Open command palette", exact: true });
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "Workspace commands", exact: true });
  await expect(dialog).toHaveAccessibleDescription("Find an action, then press Enter to run it.");
  const search = dialog.getByRole("combobox");
  await expect(search).toBeFocused();
  await search.fill("settings");
  await page.keyboard.press("Tab");
  await expect(search).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(search).toBeFocused();
  await info.attach("native-command-trap-focus", {
    body: JSON.stringify(
      await search.evaluate(async (input) => {
        await new Promise(requestAnimationFrame);
        return {
          same: document.activeElement === input,
          connected: input.isConnected,
          hidden: !!input.closest('[aria-hidden="true"],[inert]'),
          rect: input.getBoundingClientRect().toJSON(),
        };
      }),
    ),
    contentType: "application/json",
  });
  await search.press("Enter");
  await expect(dialog).toHaveCount(0);
  await expect(top.getByRole("status")).toHaveText("Executed: settings");
  await expect(opener).toBeFocused();
  await opener.click();
  await expect(dialog.getByRole("combobox")).toHaveValue("");
  await page.keyboard.press("Escape");
  await expect(opener).toBeFocused();

  const keywords = card(page, "keywords");
  const query = keywords.getByRole("combobox");
  const list = keywords.locator('[data-slot="command-list"]');
  const listNode = await list.elementHandle();
  await query.fill("user");
  await expect(keywords.getByRole("option")).toHaveCount(1);
  await expect(keywords.getByRole("option", { name: "Profile", exact: true })).toBeVisible();
  await query.press("Enter");
  await expect(keywords.getByRole("status")).toHaveText("profile");
  await query.fill("zzzz");
  await expect(keywords.getByText("No actions found.")).toBeVisible();
  await expect(query).toHaveAttribute("aria-expanded", "false");
  await expect(list).toBeHidden();
  expect(await list.evaluate((node, saved) => node === saved, listNode)).toBe(true);
  expect(
    (
      await new AxeBuilder({ page })
        .include('[data-component-example="command/keywords"]')
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await query.fill("");
  await expect(query).toHaveAttribute("aria-expanded", "true");
  await expect(list).toBeVisible();
  await query.press("End");
  await expect(keywords.getByRole("option", { name: "Profile", exact: true })).toHaveAttribute("aria-selected", "true");
  await expect(keywords.getByRole("option", { name: "Billing unavailable" })).toHaveAttribute("aria-disabled", "true");
  await query.press("ArrowDown");
  await query.press("Enter");
  await expect(keywords.getByRole("status")).toHaveText("profile");

  const hints = card(page, "shortcuts");
  await expect(hints.locator('[data-slot="command-shortcut"]')).toHaveText(["⌘,", "⌘P"]);
  await hints.getByRole("option", { name: "Projects", exact: false }).click();
  await expect(hints.getByRole("status")).toHaveText("projects");
  const controlled = card(page, "controlled");
  const controlledInput = controlled.getByRole("combobox");
  await controlled.getByRole("button").click();
  await expect(controlled.getByRole("status")).toContainText("highlighted: settings; executed: none");
  await controlledInput.focus();
  await controlledInput.press("Enter");
  await expect(controlled.getByRole("status")).toContainText("executed: settings");
  await controlledInput.fill("proj");
  await expect(controlled.getByRole("option")).toHaveText("projects");
  const saved = await controlledInput.elementHandle();
  await page
    .getByRole("group", { name: "Motion mode" })
    .getByRole("button", { name: "reduced", exact: true })
    .evaluate((node) => (node as HTMLButtonElement).click());
  await expect(controlledInput).toBeFocused();
  await expect(controlledInput).toHaveValue("proj");
  expect(await controlledInput.evaluate((node, saved) => node === saved, saved)).toBe(true);
  await expect(top.getByRole("status")).toHaveText("Executed: settings");
  await expect(query).toHaveValue("");

  const prefix = card(page, "filter");
  await prefix.getByRole("combobox").fill("pref");
  await expect(prefix.getByRole("option")).toHaveText("Settings");
  await prefix.getByRole("combobox").fill("ttings");
  await expect(prefix.getByText("No prefix matches.")).toBeVisible();
  await expect(prefix.getByRole("combobox")).toHaveAttribute("aria-expanded", "false");
  expect(
    (
      await new AxeBuilder({ page })
        .include('[data-component-example="command/filter"]')
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  const results = card(page, "results");
  await results.getByRole("combobox").fill("zz");
  await expect(results.getByText("No city found.")).toBeVisible();
  await expect(results.getByRole("combobox")).toHaveAttribute("aria-expanded", "false");
  expect(
    (
      await new AxeBuilder({ page })
        .include('[data-component-example="command/results"]')
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await results.getByRole("combobox").fill("Pa");
  await expect(results.getByRole("option")).toHaveText("Open Paris");
  await results.getByRole("option").click();
  await expect(results.getByRole("status")).toHaveText("Paris");
  const mounted = card(page, "mounted");
  await mounted.getByRole("combobox").fill("zzzz");
  await expect(mounted.getByRole("option")).toHaveText("Search the help center");
  await expect(mounted.locator('[data-slot="command-separator"]')).toBeVisible();
  await expect(mounted.getByRole("group", { name: "Workspace" })).toHaveCount(0);
  await expect(card(page, "disabled").getByRole("combobox")).toBeDisabled();
  const custom = card(page, "custom-input").getByRole("combobox");
  await expect(custom).toHaveAttribute("inputmode", "search");
  await custom.fill("set");
  await expect(card(page, "custom-input").getByRole("option")).toHaveText("Settings");
  const ids = await page.locator("[id]").evaluateAll((nodes) => nodes.map((node) => node.id));
  expect(new Set(ids).size).toBe(ids.length);
  await card(page, "dialog").getByRole("button").click();
  await expect(dialog.getByRole("button", { name: "Close", exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(card(page, "dialog").getByRole("button")).toBeFocused();
});

test("command bounded, looping, vim and pointer policies use real items", async ({ page }) => {
  await page.goto("/components/command?motion=none");
  await page.waitForLoadState("networkidle");
  const navigation = card(page, "navigation");
  const roots = navigation.locator('[data-slot="command"]');
  const bounded = roots.nth(0),
    looping = roots.nth(1);
  for (const [root, loop] of [
    [bounded, false],
    [looping, true],
  ] as const) {
    const input = root.getByRole("combobox");
    await input.focus();
    await input.press("End");
    await expect(root.getByRole("option", { name: "Last", exact: true })).toHaveAttribute("aria-selected", "true");
    await input.press("ArrowDown");
    await expect(root.getByRole("option", { name: loop ? "First" : "Last", exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await input.press("Home");
    await input.press("ArrowUp");
    await expect(root.getByRole("option", { name: loop ? "Last" : "First", exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await input.press("Home");
    await input.press("Control+n");
    await expect(root.getByRole("option", { name: loop ? "First" : "Last", exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await input.press("Home");
    await root.getByRole("option", { name: "Last", exact: true }).hover();
    await expect(root.getByRole("option", { name: loop ? "First" : "Last", exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await root.getByRole("option", { name: "Last", exact: true }).click();
    await expect(root.getByRole("option", { name: "Last", exact: true })).toHaveAttribute("aria-selected", "true");
    await expect(root.getByRole("option", { name: "Unavailable", exact: true })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  }
});

for (const os of [false, true])
  for (const mode of MODES)
    test(`command examples inherit header and fixed providers ${mode}/${os}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: os ? "reduce" : "no-preference" });
      await page.goto(`/components/command?motion=${mode}`);
      await page.waitForLoadState("networkidle");
      await expect(page.locator("article[data-document-entrance]")).toHaveCSS("clip-path", "none");
      expect(await page.evaluate(() => scrollY)).toBe(0);
      for (const name of names.filter((name) => name !== "without-motion")) {
        await expect(card(page, name)).toHaveAttribute("data-preview-motion", effectiveMode(mode, os));
        for (const root of await card(page, name).locator('[data-slot="command"]').all())
          await expect(root).toHaveAttribute("data-motion", effectiveMode(mode, os));
      }
      const fixed = card(page, "without-motion");
      for (const [label, expected] of [
        ["Open instant palette", "none"],
        ["Open nested full palette", effectiveMode("full", os)],
      ] as const) {
        const opener = fixed.getByRole("button", { name: label, exact: true });
        await opener.click();
        const popup = page.locator('[data-slot="dialog-content"]');
        await expect(popup).toHaveAttribute("data-motion", expected);
        if (expected === "none") expect(await popup.evaluate((node) => node.getAnimations().length)).toBe(0);
        await page.keyboard.press("Escape");
        await expect(popup).toHaveCount(0);
        await expect(opener).toBeFocused();
      }
    });

for (const theme of ["light", "dark"] as const)
  for (const width of [1280, 390])
    for (const name of names)
      test(`command ${name} visual and accessible ${theme}/${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.addInitScript((theme) => localStorage.setItem("cadence-theme", theme), theme);
        await page.goto("/components/command?motion=none");
        await page.waitForLoadState("networkidle");
        const specimen = card(page, name);
        await specimen.scrollIntoViewIfNeeded();
        expect(
          (
            await new AxeBuilder({ page })
              .include(`[data-component-example="command/${name}"]`)
              .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
              .analyze()
          ).violations,
        ).toEqual([]);
        await specimen.screenshot({ path: `.cache/b5-proof/command-${name}-${theme}-${width}.png` });
        if (name === "dialog" || name === "without-motion") {
          await specimen.getByRole("button").first().click();
          expect(
            (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations,
          ).toEqual([]);
          await page
            .getByRole("dialog")
            .screenshot({ path: `.cache/b5-proof/command-${name}-${theme}-${width}-open.png` });
          await page.keyboard.press("Escape");
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      });

test("command cold full deep link reveals its actual fixed palette", async ({ page }) => {
  await page.goto("/components/command?motion=full#without-motion");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("article[data-document-entrance]")).toHaveCSS("clip-path", "none");
  await expect(page.locator("h2#without-motion")).toBeInViewport();
  const opener = card(page, "without-motion").getByRole("button", { name: "Open instant palette", exact: true });
  await opener.click();
  await expect(page.getByRole("dialog")).toHaveAttribute("data-motion", "none");
  await page.keyboard.press("Escape");
  await expect(opener).toBeFocused();
});

for (const theme of ["light", "dark"] as const)
  for (const width of [1280, 390])
    test(`command empty states visual and accessible ${theme}/${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript((theme) => localStorage.setItem("cadence-theme", theme), theme);
      await page.goto("/components/command?motion=none");
      await page.waitForLoadState("networkidle");
      for (const name of ["keywords", "filter", "results"]) {
        const specimen = card(page, name);
        const input = specimen.getByRole("combobox");
        await input.fill("zzzzzz");
        await expect(specimen.locator('[data-slot="command-empty"]').getByRole("status")).toBeVisible();
        await expect(input).toHaveAttribute("aria-expanded", "false");
        await expect(input).toBeFocused();
        await expect(specimen.getByRole("option")).toHaveCount(0);
        await expect(specimen.locator('[data-slot="command-list"]')).toBeHidden();
        expect(
          (
            await new AxeBuilder({ page })
              .include(`[data-component-example="command/${name}"]`)
              .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
              .analyze()
          ).violations,
        ).toEqual([]);
        await specimen.screenshot({ path: `.cache/b5-proof/command-${name}-empty-${theme}-${width}.png` });
      }
      const opener = page.locator('[data-preview="command"]').getByRole("button");
      await opener.click();
      const dialog = page.getByRole("dialog");
      const input = dialog.getByRole("combobox");
      await input.fill("zzzzzz");
      await expect(dialog.getByRole("status")).toHaveText("No actions found.");
      await expect(input).toHaveAttribute("aria-expanded", "false");
      await expect(input).toBeFocused();
      await expect(dialog.getByRole("option")).toHaveCount(0);
      expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual(
        [],
      );
      await dialog.screenshot({ path: `.cache/b5-proof/command-dialog-empty-${theme}-${width}.png` });
      await page.keyboard.press("Escape");
      await expect(opener).toBeFocused();
    });
