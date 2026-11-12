import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { componentExecutionPlugin } from "./tests/component-execution-plugin.mjs";
import jointMotionItems from "./tests/fixtures/joint-motion/items.json";

const cliSuites = [
  "tests/lib/motion-targets.test.tsx",
  "tests/lib/motion-contract.test.tsx",
  "tests/lib/motion-docs.test.tsx",
  "tests/lib/doc-template.test.tsx",
  "tests/lib/joint-motion-reporter.test.tsx",
  "tests/lib/motion-v2-reporter.test.tsx",
  "tests/lib/motion-v2-projection.test.tsx",
];

export default defineConfig({
  plugins: [componentExecutionPlugin(jointMotionItems), react()],
  resolve: {
    alias: { "@": path.resolve(process.cwd()) },
  },
  test: {
    // Run subprocess-heavy gates serially after ordinary tests. Keep every
    // assertion; cold full-library audit deadlines are set in their suites.
    //
    // Per-test deadlines below are hang guards, not performance acceptance: several
    // suites cold-start `check-registry.mjs` or parse the whole live catalogue in a
    // fresh fixture, so their wall clock tracks host throughput (AV scanning, disk
    // pressure) far more than code regression. Vitest's 5s default is not a budget
    // this project ever adopted, so the floor is raised globally and explicit but
    // tight values were lifted to match. A real hang still trips 120s.
    testTimeout: 120_000,
    hookTimeout: 120_000,
    maxWorkers: 4,
    reporters: ["default", "./tests/motion-contract-reporter.mjs"],
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    css: false,
    projects: [
      {
        extends: true,
        test: { name: "runtime", include: ["tests/**/*.test.tsx"], exclude: cliSuites, sequence: { groupOrder: 0 } },
      },
      {
        extends: true,
        test: {
          name: "cli-gates",
          include: cliSuites,
          pool: "forks",
          poolOptions: { forks: { singleFork: true } },
          sequence: { groupOrder: 1 },
        },
      },
    ],
  },
});
