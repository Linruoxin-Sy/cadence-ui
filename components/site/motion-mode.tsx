"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Button } from "@/registry/cadence/button/button";
import { cn } from "@/registry/cadence/lib/cn";
import type { CadenceMode } from "@/registry/cadence/lib/motion";
import { CadenceProvider } from "@/registry/cadence/lib/provider";

/** Remembered across visits, like the theme. */
const STORAGE_KEY = "cadence-motion";
/** The manual switch wins over the stored value, so a shared `?motion=` link always lands. */
const MODES: CadenceMode[] = ["full", "reduced", "none"];

interface MotionModeValue {
  mode: CadenceMode;
  setMode: (mode: CadenceMode) => void;
}

const MotionModeContext = createContext<MotionModeValue | null>(null);

function isMode(value: string | null): value is CadenceMode {
  return value === "full" || value === "reduced" || value === "none";
}

/**
 * One motion mode for the whole site, held in the header rather than in each
 * component page: a mode is a setting, and a setting repeated 29 times is 29
 * chances to disagree.
 *
 * Precedence on load: `?motion=` → `localStorage` → `full`. A choice made in the
 * switch is written back to both, so the URL stays shareable and the next visit
 * remembers it.
 *
 * The OS preference still wins over `full` inside `CadenceProvider`, so a visitor
 * who asked for reduced motion sees it without touching this control.
 */
export function MotionModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<CadenceMode>("full");

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("motion");
    if (isMode(fromUrl)) {
      setModeState(fromUrl);
      return;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (isMode(stored)) setModeState(stored);
    } catch {
      // storage can be unavailable; `full` is a safe default.
    }
  }, []);

  const setMode = useCallback((next: CadenceMode) => {
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // the switch still works for this page.
    }
    const url = new URL(window.location.href);
    if (next === "full") url.searchParams.delete("motion");
    else url.searchParams.set("motion", next);
    window.history.replaceState(null, "", url);
  }, []);

  const value = useMemo(() => ({ mode, setMode }), [mode, setMode]);

  return (
    <MotionModeContext.Provider value={value}>
      <CadenceProvider mode={mode}>{children}</CadenceProvider>
    </MotionModeContext.Provider>
  );
}

/** Read the site-wide mode. Falls back to `full` outside the provider. */
export function useMotionMode(): MotionModeValue {
  return useContext(MotionModeContext) ?? { mode: "full", setMode: () => {} };
}

/**
 * The one place the three modes are switched. Segmented rather than cycling:
 * three states are few enough to show at once, and a reviewer comparing `reduced`
 * with `none` should not have to click through the third one.
 *
 * Hidden below `sm` because the header has no room, not because the mode matters
 * less there — the OS setting covers that case without any UI.
 */
export function MotionModeSwitch({ className }: { className?: string }) {
  const { mode, setMode } = useMotionMode();

  return (
    <fieldset
      aria-label="Motion mode"
      className={cn("hidden items-center gap-0.5 rounded-md border border-border p-0.5 sm:flex", className)}
    >
      {MODES.map((value) => (
        <Button
          key={value}
          size="xs"
          variant={mode === value ? "secondary" : "ghost"}
          aria-pressed={mode === value}
          onClick={() => setMode(value)}
          className="h-6 px-2 text-[11px] capitalize"
        >
          {value}
        </Button>
      ))}
    </fieldset>
  );
}
