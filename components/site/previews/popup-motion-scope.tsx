"use client";
import { type ReactNode, useState } from "react";
import type { CadenceMode } from "@/registry/cadence/lib/motion";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { PreviewStack } from "./shell";

export function PopupMotionScope({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<CadenceMode | "inherit">("inherit");
  return (
    <PreviewStack>
      <label className="flex items-center gap-2 text-sm">
        Popup motion
        <select
          aria-label="Popup motion"
          className="rounded border bg-background px-2"
          value={mode}
          onChange={(e) => setMode(e.target.value as CadenceMode | "inherit")}
        >
          {["inherit", "full", "reduced", "none"].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      <CadenceProvider mode={mode === "inherit" ? undefined : mode}>{children}</CadenceProvider>
    </PreviewStack>
  );
}
