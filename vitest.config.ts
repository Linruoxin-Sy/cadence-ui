import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(process.cwd()) },
  },
  test: {
    // Registry CLI fixtures and the nested real Vitest run share CPU and disk
    // with this pool. Bound contention; retain their original deadlines.
    maxWorkers: 4,
    reporters: ["default", "./tests/motion-contract-reporter.mjs"],
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.tsx"],
    css: false,
  },
});
