"use client";

import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { Button } from "@/registry/cadence/button";
import { cn } from "@/registry/cadence/lib/cn";
import type { CadenceMode } from "@/registry/cadence/lib/motion";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/cadence/select";

/** Remembered across visits, like the theme. */
const MODE_KEY = "cadence-motion";
const SPEED_KEY = "cadence-motion-speed";
/** The manual switch wins over the stored value, so a shared `?motion=` link always lands. */
const MODES: CadenceMode[] = ["full", "reduced", "none"];

/**
 * The gears the header offers, as playback speed rather than as the multiplier the
 * provider wants: a reader thinks "quarter speed", not "timeScale 4". `1 / speed` is
 * the only conversion on the site, and it happens once, in the provider below.
 *
 * `2×` is here because the same question runs the other way — a 220ms reveal reads
 * slow to one reviewer and sluggish to another — and a gear that can only go slower
 * looks like a debugging switch rather than a setting.
 */
const SPEEDS = [2, 1, 0.5, 0.25] as const;
type MotionSpeed = (typeof SPEEDS)[number];

interface MotionSettingsValue {
  mode: CadenceMode;
  setMode: (mode: CadenceMode) => void;
  /** Playback speed: `1` is the authored timing. */
  speed: MotionSpeed;
  setSpeed: (speed: MotionSpeed) => void;
  /** `1 / speed` — the multiplier `CadenceProvider` applies to every duration. */
  timeScale: number;
}

const MotionModeContext = createContext<MotionSettingsValue | null>(null);

function isMode(value: string | null): value is CadenceMode {
  return value === "full" || value === "reduced" || value === "none";
}

function parseSpeed(value: string | null): MotionSpeed | null {
  const parsed = Number(value);
  return (SPEEDS as readonly number[]).includes(parsed) ? (parsed as MotionSpeed) : null;
}

function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    // Storage can be unavailable; the caller's default is the safe answer.
    return null;
  }
}

/**
 * Site motion settings: the mode and the playback speed, held in the header rather
 * than in each component page. A setting repeated 29 times is 29 chances to
 * disagree, and both of these are settings — one about what may move, one about how
 * fast it moves.
 *
 * Precedence on load, per setting: URL (`?motion=`, `?speed=`) → `localStorage` →
 * `full` / `1×`. A choice is written back to both, so the URL stays shareable and
 * the next visit remembers it.
 *
 * The OS preference still wins over `full` inside `CadenceProvider`, so a visitor
 * who asked for reduced motion sees it without touching this control. Speed has no
 * such override: someone in slow motion asked for slow motion.
 */
export function MotionModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<CadenceMode>("full");
  const [speed, setSpeedState] = useState<MotionSpeed>(1);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const fromUrl = params.get("motion");
    if (isMode(fromUrl)) {
      setModeState(fromUrl);
    } else {
      const stored = readStored(MODE_KEY);
      if (isMode(stored)) setModeState(stored);
    }

    const speedFromUrl = parseSpeed(params.get("speed"));
    if (speedFromUrl) {
      setSpeedState(speedFromUrl);
    } else {
      const stored = parseSpeed(readStored(SPEED_KEY));
      if (stored) setSpeedState(stored);
    }
  }, []);

  const setMode = (next: CadenceMode) => {
    setModeState(next);
    try {
      localStorage.setItem(MODE_KEY, next);
    } catch {
      // the switch still works for this page.
    }
    const url = new URL(window.location.href);
    if (next === "full") url.searchParams.delete("motion");
    else url.searchParams.set("motion", next);
    window.history.replaceState(null, "", url);
  };

  const setSpeed = (next: MotionSpeed) => {
    setSpeedState(next);
    try {
      localStorage.setItem(SPEED_KEY, String(next));
    } catch {
      // the select still works for this page.
    }
    const url = new URL(window.location.href);
    if (next === 1) url.searchParams.delete("speed");
    else url.searchParams.set("speed", String(next));
    window.history.replaceState(null, "", url);
  };

  const value: MotionSettingsValue = { mode, setMode, speed, setSpeed, timeScale: 1 / speed };

  return (
    <MotionModeContext.Provider value={value}>
      <CadenceProvider mode={mode} timeScale={value.timeScale}>
        {children}
      </CadenceProvider>
    </MotionModeContext.Provider>
  );
}

/** Read the site-wide motion settings. Falls back to `full` / `1×` outside the provider. */
export function useMotionMode(): MotionSettingsValue {
  return (
    useContext(MotionModeContext) ?? {
      mode: "full",
      setMode: () => {},
      speed: 1,
      setSpeed: () => {},
      timeScale: 1,
    }
  );
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

/**
 * The playback gear, beside the mode switch because the two are the same kind of
 * thing: a site-wide motion setting. A `Select` rather than a fourth segment
 * because three modes plus four speeds in one row is a wall of numbers, and the
 * reader only needs to see the gear that is active.
 *
 * The trigger shows the speed (`0.25×`), never the multiplier (`4`): the multiplier
 * is an implementation detail of `transitionFor()`.
 */
export function MotionSpeedSelect({ className }: { className?: string }) {
  const { speed, setSpeed } = useMotionMode();

  return (
    <Select
      value={String(speed)}
      onValueChange={(value) => {
        const next = parseSpeed(value);
        if (next) setSpeed(next);
      }}
    >
      <SelectTrigger
        size="sm"
        aria-label="Motion speed"
        title="Playback speed for the whole site"
        className={cn("text-[11px]", className)}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end" sideOffset={6} alignItemWithTrigger={false}>
        {SPEEDS.map((value) => (
          <SelectItem key={value} value={String(value)} className="text-xs">
            {value}×
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
