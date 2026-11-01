"use client";

import { type ReactNode, useState } from "react";
import type { CadenceMode } from "@/registry/cadence/lib/motion";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { PreviewStack } from "./shell";

/** Local mode overrides let readers compare the control without replacing it. */
export function ControlMotionScope({ children, staticControl }: { children: ReactNode; staticControl: ReactNode }) {
  const [mode, setMode] = useState<CadenceMode | "inherit">("inherit");
  return (
    <PreviewStack>
      <label className="flex items-center gap-2 text-sm">
        Control motion
        <select
          aria-label="Control motion"
          value={mode}
          onChange={(e) => setMode(e.target.value as CadenceMode | "inherit")}
          className="rounded border bg-background px-2"
        >
          {["inherit", "full", "reduced", "none"].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      <CadenceProvider mode={mode === "inherit" ? undefined : mode}>{children}</CadenceProvider>
      <CadenceProvider mode="none">
        <div data-testid="initial-none" className="flex w-full max-w-sm items-center gap-3 text-sm">
          {staticControl}
          <span>Motion disabled from the first render</span>
        </div>
      </CadenceProvider>
    </PreviewStack>
  );
}
