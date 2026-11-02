import { writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const reports = [];
for (const os of ["no-preference", "reduce"]) {
  const page = await browser.newPage({ reducedMotion: os });
  page.setDefaultTimeout(5000);
  page.on("pageerror", (e) => console.error(e));
  await page.goto("http://127.0.0.1:3165");
  await page.waitForFunction(() => window.updateRuntime);
  await page.waitForTimeout(100);
  const update = async (patch) => {
    await page.evaluate((patch) => {
      window.runtimeCommits = [];
      window.updateRuntime(patch);
    }, patch);
    await page.waitForTimeout(55);
    return page.evaluate(() => window.runtimeCommits);
  };
  const select = await update({ checked: true, value: "7" });
  const downgrade = await update({ mode: "reduced" });
  const none = await update({ mode: "none", checked: false, value: "8" });
  reports.push({ os, select, downgrade, none });
  await update({ mode: "full", expanded: true });
  await page.getByRole("button", { name: "Copy", exact: true }).click({ force: true });
  const blockFull = await update({ timeScale: 6 });
  const blockReduced = await update({ mode: "reduced" });
  const blockNone = await update({ mode: "none" });
  reports.push({ os, blockFull, blockReduced, blockNone });
  if (os === "no-preference") {
    await update({ mode: "full", disabled: false });
    for (const name of ["Press", "Focusable press", "Toggle", "Group"]) {
      const node = page.getByRole("button", { name, exact: true });
      await node.hover();
      await page.mouse.down();
      await page.waitForTimeout(180);
      const before = await node.evaluate((n) => getComputedStyle(n).transform);
      const disabled = await update({ disabled: true });
      const after = await node.evaluate((n) => getComputedStyle(n).transform);
      reports.push({ os, name, before, after, disabled });
      await page.mouse.up();
      await update({ disabled: false });
    }
    const thumb = page.locator('[data-slot="slider-thumb"]');
    await thumb.hover();
    await page.mouse.down();
    await page.mouse.move(200, await thumb.evaluate((n) => n.getBoundingClientRect().y + 8));
    await page.waitForTimeout(180);
    const before = await thumb.evaluate((n) => ({ transform: getComputedStyle(n).transform, html: n.outerHTML }));
    await update({ disabled: true });
    const after = await thumb.evaluate((n) => ({ transform: getComputedStyle(n).transform, html: n.outerHTML }));
    reports.push({ os, slider: { before, after } });
    await page.mouse.up();
  }
  await page.close();
}
writeFileSync(process.argv[2] ?? ".cache/engine-runtime-original.json", JSON.stringify(reports, null, 2));
await browser.close();
