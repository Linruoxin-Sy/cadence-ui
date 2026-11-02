import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";

// Explicit decimal KB convention for animation-system §7; gzip each HTTP entity.
export const INITIAL_JS_LIMIT = 120_000;
export function summarizeScripts(scripts) {
  const unique = new Map();
  for (const { url, body, ...details } of scripts) {
    const identity = new URL(url).href;
    if (!unique.has(identity)) {
      unique.set(identity, {
        url: identity,
        bytes: body.length,
        gzip: gzipSync(body).length,
        sha256: createHash("sha256").update(body).digest("hex"),
        ...details,
      });
    }
  }
  const files = [...unique.values()].sort((a, b) => a.url.localeCompare(b.url));
  return { limit: INITIAL_JS_LIMIT, gzipBytes: files.reduce((sum, file) => sum + file.gzip, 0), files };
}

/** No request blocking, prefetch exclusions, cache, scrolling or interaction. */
export async function measureInitialScripts(page, url, readySelector = '[data-preview="button"] button') {
  const session = await page.context().newCDPSession(page);
  await session.send("Network.enable");
  await session.send("Network.setCacheDisabled", { cacheDisabled: true });
  const requests = [];
  const responses = [];
  const errors = [];
  session.on("Network.requestWillBeSent", (event) => {
    if (event.type === "Script" || event.request.headers["Next-Router-Prefetch"]) requests.push(event);
  });
  page.on("pageerror", (error) => errors.push(error.message));
  const collect = (response) => {
    if (response.request().resourceType() === "script") {
      responses.push((async () => ({ url: response.url(), status: response.status(), body: await response.body() }))());
    }
  };
  page.on("response", collect);
  await page.goto(url);
  await page.locator(readySelector).first().waitFor();
  await page.waitForLoadState("networkidle");
  // An observation window, not a deferral: retain every automatic asynchronous load.
  // Keep listening after networkidle (which alone can precede hydration imports).
  await page.waitForTimeout(10_000);
  await page.waitForLoadState("networkidle");
  page.off("response", collect);
  const summary = summarizeScripts(await Promise.all(responses));
  await session.detach();
  return { ...summary, requests, errors, observation: "load + networkidle + 10s + networkidle, no interaction" };
}
