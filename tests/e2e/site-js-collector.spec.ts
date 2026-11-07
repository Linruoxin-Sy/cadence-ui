import { once } from "node:events";
import { createServer } from "node:http";
import { gzipSync } from "node:zlib";
import { expect, test } from "@playwright/test";
import { measureInitialScripts } from "../../scripts/site-js-budget.mjs";
import { scriptEntities } from "../fixtures/site-js-collector.mjs";

// A real HTTP negative control for the collector, never a complete-page budget fixture.
for (const scenario of ["complete", "missing", "truncated"] as const)
  test(`script collector retains automatic entities: ${scenario}`, async ({ page }, info) => {
    const broken = scenario !== "complete";
    const entities = scriptEntities(broken);
    const server = createServer((request, response) => {
      if (request.url === "/lost.js") {
        if (scenario === "truncated") {
          response.writeHead(200, { "Content-Type": "application/javascript", "Content-Length": "1000" });
          response.write("/* incomplete entity");
          // Transport failure after headers, not an animation or product delay.
          setTimeout(() => response.destroy(), 100);
        } else response.destroy();
        return;
      }
      const body = entities[request.url as keyof typeof entities];
      response.setHeader("Content-Type", body ? "application/javascript" : "text/html");
      response.end(body ?? '<main data-ready>Ready<script src="/entry.js"></script></main>');
    });
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    try {
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("Missing HTTP fixture address");
      const report = await measureInitialScripts(page, `http://127.0.0.1:${address.port}`, "[data-ready]");
      await info.attach("collector-evidence", { body: JSON.stringify(report), contentType: "application/json" });
      const counted = Object.entries(entities).filter(([url]) => !broken || url !== "/async.js");
      expect(report.files.map((file: { url: string }) => new URL(file.url).pathname).sort()).toEqual(
        counted.map(([url]) => url).sort(),
      );
      expect(report.gzipBytes).toBe(counted.reduce((sum, [, body]) => sum + gzipSync(body, { level: 6 }).length, 0));
      expect(
        report.requests.some(
          (event: { request: { url: string }; initiator: { type: string } }) =>
            event.request.url.endsWith("/automatic") && event.initiator.type === "script",
        ),
      ).toBe(true);
      if (broken) {
        expect(report.missingResponses.some((entry: { url: string }) => entry.url.endsWith("/lost.js"))).toBe(true);
        expect(report.errors.some((error: string) => error.startsWith("Request failed:"))).toBe(true);
        expect(report.errors.some((error: string) => error.startsWith("Missing script response:"))).toBe(true);
        if (scenario === "truncated")
          expect(report.errors.some((error: string) => error.startsWith("Missing response body:"))).toBe(true);
      } else {
        expect(report.missingResponses).toEqual([]);
        expect(report.errors).toEqual([]);
      }
    } finally {
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    }
  });
