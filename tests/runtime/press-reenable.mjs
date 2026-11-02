import { writeFileSync } from "node:fs";
import { chromium, expect } from "@playwright/test";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const reports = [];
for (const gesture of ["pointer", "Enter"])
  for (const name of ["Press", "Focusable press", "Toggle", "Group"]) {
    const page = await browser.newPage();
    await page.goto("http://127.0.0.1:3165");
    await page.waitForFunction(() => window.updateRuntime);
    const n = page.getByRole("button", { name, exact: true });
    await n.focus();
    await page.waitForTimeout(30);
    if (gesture === "pointer") {
      await n.hover();
      await page.mouse.down();
    } else await page.keyboard.down(gesture);
    await page.waitForTimeout(180);
    const before = await n.evaluate((n) => getComputedStyle(n).transform);
    await page.evaluate(() => window.updateRuntime({ disabled: true }));
    await page.waitForTimeout(55);
    const disabled = await n.evaluate((n) => ({
      transform: getComputedStyle(n).transform,
      focus: n === document.activeElement,
      html: n.outerHTML,
    }));
    if (gesture === "pointer") await page.mouse.up();
    else await page.keyboard.up(gesture);
    await page.evaluate(() => window.updateRuntime({ disabled: false }));
    await page.waitForTimeout(200);
    const after = await n.evaluate((n) => getComputedStyle(n).transform);
    reports.push({ gesture, name, before, disabled, after });
    await page.close();
  }
writeFileSync(".cache/engine-press-reenable.json", JSON.stringify(reports, null, 2));
await browser.close();
expect(reports.every((x) => x.disabled.transform === "none" && x.after === "none")).toBe(true);
console.log("8 held pointer/keyboard disable-release-reenable paths passed");
