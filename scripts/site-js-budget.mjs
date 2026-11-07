import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";

// Explicit decimal KB convention for animation-system §7; gzip each HTTP entity.
export const INITIAL_JS_LIMIT = 120_000;
export function summarizeLayoutShifts(entries) {
  let start = -Infinity;
  let last = -Infinity;
  let session = 0;
  let cls = 0;
  for (const entry of entries.filter((entry) => !entry.hadRecentInput)) {
    if (entry.startTime - last >= 1000 || entry.startTime - start >= 5000) {
      session = 0;
      start = entry.startTime;
    }
    session += entry.value;
    last = entry.startTime;
    cls = Math.max(cls, session);
  }
  return cls;
}
export function summarizeScripts(scripts) {
  const unique = new Map();
  for (const { url, body, ...details } of scripts) {
    const identity = new URL(url).href;
    if (!unique.has(identity)) {
      unique.set(identity, {
        url: identity,
        bytes: body.length,
        gzip: gzipSync(body, { level: 6 }).length,
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
  const isJavaScriptURL = (url) => /\.m?js$/.test(new URL(url).pathname);
  session.on("Network.requestWillBeSent", (event) => {
    // Retain fetch/prefetch initiators too: a JavaScript MIME response need not
    // have a .js URL or a Script resource type.
    requests.push(event);
  });
  const onError = (error) => errors.push(error.message);
  const onConsole = (message) => {
    if (message.type() === "error") errors.push(`Console: ${message.text()}`);
  };
  const onFailed = (request) => errors.push(`Request failed: ${request.url()}: ${request.failure()?.errorText}`);
  page.on("pageerror", onError);
  page.on("console", onConsole);
  page.on("requestfailed", onFailed);
  const collect = (response) => {
    if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`);
    if (
      response.request().resourceType() === "script" ||
      isJavaScriptURL(response.url()) ||
      /(?:java|ecma)script/i.test(response.headers()["content-type"] ?? "")
    ) {
      responses.push(
        (async () => {
          return {
            url: response.url(),
            status: response.status(),
            body: await response.body(),
            request: response.request(),
          };
        })().catch((error) => {
          errors.push(`Missing response body: ${response.url()}: ${error.message}`);
          return null;
        }),
      );
    }
  };
  page.on("response", collect);
  try {
    await page.goto(url);
    await page.locator(readySelector).first().waitFor();
    await page.waitForLoadState("networkidle");
    // An observation window, not a deferral: retain every automatic asynchronous load.
    // Keep listening after networkidle (which alone can precede hydration imports).
    await page.waitForTimeout(10_000);
    await page.waitForLoadState("networkidle");
  } catch (error) {
    errors.push(`Observation failed: ${error.message}`);
  } finally {
    page.off("response", collect);
    page.off("pageerror", onError);
    page.off("console", onConsole);
    page.off("requestfailed", onFailed);
  }
  const completed = (await Promise.all(responses)).filter(Boolean).flatMap(({ request, ...file }) => {
    // Chromium can expose a partial body before reporting a transport failure.
    // Check completion after the observation window, when failure is known.
    // response.finished() can remain pending for a truncated entity in Chromium.
    const failure = request.failure();
    if (!failure) return [file];
    errors.push(`Missing response body: ${file.url}: ${failure.errorText}`);
    return [];
  });
  const summary = summarizeScripts(completed);
  const missingResponses = requests
    .filter((event) => event.type === "Script" || isJavaScriptURL(event.request.url))
    .filter((event) => !summary.files.some((file) => file.url === new URL(event.request.url).href))
    .map((event) => ({ url: event.request.url, requestId: event.requestId, initiator: event.initiator }));
  for (const missing of missingResponses) errors.push(`Missing script response: ${missing.url}`);
  await session.detach();
  return {
    ...summary,
    requests,
    missingResponses,
    errors,
    observation: "load + networkidle + 10s + networkidle, no interaction",
  };
}
