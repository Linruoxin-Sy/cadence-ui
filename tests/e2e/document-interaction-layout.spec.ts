import { expect, type Page, test } from "@playwright/test";
import { assessBudget, reportBudget } from "../../scripts/performance-policy.mjs";
import { summarizeLayoutShifts } from "../../scripts/site-js-budget.mjs";
import { openComponentSource } from "./installation-helpers";

type Shift = {
  value: number;
  startTime: number;
  hadRecentInput: boolean;
  sources: { selector: string; previous: unknown; current: unknown }[];
};
type LayoutProof = {
  supported: boolean;
  shifts: Shift[];
  actions: { name: string; time: number; scrollY: number }[];
  trustedInputs: { type: string; time: number }[];
};
type ProofWindow = Window & typeof globalThis & { documentLayoutProof: LayoutProof };
const runtimeErrors = new WeakMap<Page, string[]>();

async function observe(page: Page) {
  const errors: string[] = [];
  runtimeErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400) errors.push(`HTTP ${response.status()} ${response.url()}`);
  });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await page.addInitScript(() => {
    const proof: LayoutProof = {
      supported: PerformanceObserver.supportedEntryTypes.includes("layout-shift"),
      shifts: [],
      actions: [],
      trustedInputs: [],
    };
    (window as ProofWindow).documentLayoutProof = proof;
    for (const type of ["pointerdown", "keydown", "input", "change"])
      addEventListener(type, (event) => {
        if (event.isTrusted) proof.trustedInputs.push({ type, time: performance.now() });
      });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & {
          value: number;
          hadRecentInput: boolean;
          sources: { node: Node | null; previousRect: DOMRectReadOnly; currentRect: DOMRectReadOnly }[];
        };
        proof.shifts.push({
          value: shift.value,
          startTime: shift.startTime,
          hadRecentInput: shift.hadRecentInput,
          sources: shift.sources.map(({ node, previousRect, currentRect }) => {
            const element = node instanceof Element ? node : node?.parentElement;
            return {
              selector: element
                ? `${node?.nodeName} in ${element.tagName}#${element.id}[data-slot=${element.getAttribute("data-slot")}] ${element.getAttribute("class")}`
                : (node?.nodeName ?? "detached"),
              previous: previousRect.toJSON(),
              current: currentRect.toJSON(),
            };
          }),
        });
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  return errors;
}

test.afterEach(async ({ page }, info) => {
  const proof = await page.evaluate(() => (window as ProofWindow).documentLayoutProof);
  if (proof)
    await info.attach("layout-window-including-failed-assertions", {
      body: JSON.stringify(
        { proof, cls: summarizeLayoutShifts(proof.shifts), errors: runtimeErrors.get(page) },
        null,
        2,
      ),
      contentType: "application/json",
    });
});

async function mark(page: Page, name: string) {
  await page.evaluate((name) => {
    (window as ProofWindow).documentLayoutProof.actions.push({ name, time: performance.now(), scrollY });
  }, name);
}

async function documentControls(page: Page, width: number) {
  await mark(page, "open component source");
  await openComponentSource(page, new URL(page.url()).pathname.split("/").at(-1) ?? "");
  const installation = page.locator("[data-installation]");
  if (await installation.count()) await installation.getByRole("tab", { name: "Command", exact: true }).click();
  await mark(page, "switch installation command to npm");
  await page.getByRole("tab", { name: "npm", exact: true }).click();
  await expect(page.getByRole("tab", { name: "npm", exact: true })).toHaveAttribute("aria-selected", "true");
  if (width < 1280) await page.locator("[data-mobile-toc] summary").click();
  await mark(page, "navigate to API through the real Toc");
  await page
    .locator(width < 1280 ? "[data-mobile-toc]" : "[data-document-toc]")
    .getByRole("link", { name: "API", exact: true })
    .click();
  await expect(page.locator("h2#api")).toBeFocused();
  await expect(page).toHaveURL(/keep=layout#api$/);
}

// These are bounded, complete-route interaction windows, including delayed shifts.
// They retain recent-input entries in the evidence; only the CLS calculation excludes them.
for (const width of [1440, 390])
  for (const mode of ["full", "reduced", "none"] as const)
    for (const id of ["button", "data-table"] as const)
      test(`complete ${id} interaction CLS ${width}/${mode}`, async ({ page }, info) => {
        test.setTimeout(90_000);
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion: "no-preference" });
        const errors = await observe(page);
        await page.goto(`/components/${id}?motion=${mode}&keep=layout`);
        await page.waitForLoadState("networkidle");
        await expect(page.locator("article")).toHaveCSS("transform", "none");
        await expect(page.locator(`[data-preview="${id}"]`)).toHaveAttribute("data-preview-motion", mode);
        await mark(page, "hydrated document ready");
        if (id === "button") {
          const composition = page.locator('[data-component-example="button/composition"] button');
          await mark(page, "increment composition count");
          await composition.click();
          await expect(composition).toHaveText("Count: 1");
        } else {
          const top = page.locator('[data-preview="data-table"]');
          const input = top.getByRole("textbox", { name: "Filter emails" });
          const savedInput = await input.elementHandle();
          const savedTable = await top.getByRole("table").elementHandle();
          await mark(page, "sort top table ascending");
          await top.getByRole("button", { name: "Email", exact: true }).click();
          await expect(top.locator("tbody tr").first()).toContainText("person01@example.com");
          await mark(page, "select top page and paginate to last page");
          await top.getByRole("checkbox", { name: "Select all", exact: true }).press("Space");
          await expect(top.getByRole("status")).toContainText("10 of 23");
          await top.getByRole("button", { name: "Next", exact: true }).click();
          await top.getByRole("button", { name: "Next", exact: true }).click();
          await expect(top.locator("tbody tr")).toHaveCount(3);
          await expect(top.getByRole("button", { name: "Next", exact: true })).toBeDisabled();
          for (const [filter, text] of [
            ["person01", "person01@example.com"],
            ["missing", "No results."],
            ["", "person01@example.com"],
          ] as const) {
            await mark(page, `filter top table: ${filter || "clear"}`);
            await input.fill(filter);
            await expect(top.getByText(text, { exact: true })).toBeVisible();
            await expect(input).toBeFocused();
            await page.waitForTimeout(1200);
          }
          await mark(page, "toggle status column and restore it");
          for (const hidden of [true, false]) {
            await top.getByRole("button", { name: "Columns", exact: true }).click();
            await page.getByRole("menuitemcheckbox", { name: "status", exact: true }).click();
            await page.keyboard.press("Escape");
            await expect(top.getByRole("columnheader", { name: "Status", exact: true })).toHaveCount(hidden ? 0 : 1);
            await page.waitForTimeout(1200);
          }
          expect(await input.evaluate((node, saved) => node === saved, savedInput)).toBe(true);
          expect(await top.getByRole("table").evaluate((node, saved) => node === saved, savedTable)).toBe(true);
          const controlled = page.locator('[data-component-example="data-table/controlled-sorting-and-pagination"]');
          await mark(page, "controlled page size expands to twenty rows, then resets");
          await controlled.getByLabel("Rows per page").selectOption("20");
          await expect(controlled.locator("tbody tr")).toHaveCount(20);
          await page.waitForTimeout(1200);
          await controlled.getByRole("button", { name: "Reset sorting and page" }).click();
          await expect(controlled.locator("tbody tr")).toHaveCount(5);
          const updates = page.locator('[data-component-example="data-table/updating-rows"]');
          await mark(page, "update, reverse, remove and restore application records");
          await updates.getByRole("button", { name: "Update first payment", exact: true }).click();
          await expect(updates.getByText("$999.00", { exact: true })).toBeVisible();
          await updates.getByRole("button", { name: "Reverse records", exact: true }).click();
          await expect(updates.locator("tbody tr").first()).toContainText("max@example.com");
          await updates.getByRole("button", { name: "Remove first payment", exact: true }).click();
          await expect(updates.locator("tbody tr")).toHaveCount(3);
          await page.waitForTimeout(1200);
          await updates.getByRole("button", { name: "Restore records", exact: true }).click();
          await expect(updates.getByText("$42.00", { exact: true })).toBeVisible();
          await expect(top.getByRole("textbox")).toHaveValue("");
        }
        await documentControls(page, width);
        await mark(page, "begin final fifteen-second dwell");
        await page.waitForTimeout(15_000);
        await page.waitForLoadState("networkidle");
        const proof = await page.evaluate(() => ({
          ...(window as ProofWindow).documentLayoutProof,
          endTime: performance.now(),
        }));
        const cls = summarizeLayoutShifts(proof.shifts);
        await info.attach("complete-route-layout-window", {
          body: JSON.stringify(
            {
              id,
              width,
              mode,
              cls,
              errors,
              proof,
              budgetAssessment: reportBudget(assessBudget(`${id} interaction CLS`, cls, 0.02, "below")),
            },
            null,
            2,
          ),
          contentType: "application/json",
        });
        expect(proof.supported).toBe(true);
        expect(proof.trustedInputs.some((event) => event.type === "pointerdown")).toBe(true);
        expect(errors).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        // Numeric CLS comparison is advisory; native interaction/layout assertions remain above.
      });
