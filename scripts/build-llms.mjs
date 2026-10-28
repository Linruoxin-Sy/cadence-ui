/**
 * llms.txt, llms-full.txt, catalog and per-item markdown are produced by the
 * registry build (they need the same docs and payloads). This command exists as
 * a discoverable alias and regenerates them from scratch.
 *
 *   node scripts/build-llms.mjs
 */
import { execFileSync } from "node:child_process";

execFileSync(process.execPath, ["scripts/build-registry.mjs"], { stdio: "inherit" });
