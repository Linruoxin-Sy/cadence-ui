"use client";

import { Suspense, useState } from "react";
import { Button } from "@/registry/cadence/button/button";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { Skeleton } from "@/registry/cadence/skeleton/skeleton";
import { useMotionMode } from "./motion-mode";
import { previews } from "./previews";

/** 0.25× on this preview only: `timeScale` multiplies the tokens, it never edits them. */
const SLOW_MOTION_SCALE = 4;

export function Preview({ id }: { id: string }) {
  const Component = previews[id];
  if (!Component) {
    return <p className="text-sm text-muted-foreground">Preview coming soon.</p>;
  }
  return <Component />;
}

/**
 * The frame every component page mounts.
 *
 * It does **not** own the motion mode. A mode is a setting, and the site has one
 * switch for it in the header (`MotionModeSwitch`); this frame reads the resolved
 * mode and says so, so a reader who switched to `none` on another page knows why
 * the preview is still.
 *
 * What it does own is the 0.25× slowdown, which is per-preview by nature: you slow
 * down the thing you are looking at, not the whole site. It is applied by a nested
 * provider that inherits the mode and only overrides `timeScale`.
 */
export function PreviewFrame({ id, initialSlow = false }: { id: string; initialSlow?: boolean }) {
  const { mode } = useMotionMode();
  const [slow, setSlow] = useState(initialSlow);

  return (
    <div data-preview={id} data-preview-motion={mode} className="rounded-xl border border-border bg-background">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
        <p className="text-[11px] text-muted-foreground">
          Motion <span className="font-medium text-foreground capitalize">{mode}</span>
          <span className="hidden sm:inline"> · change it in the header</span>
        </p>
        <Button
          size="xs"
          variant={slow ? "secondary" : "ghost"}
          aria-pressed={slow}
          onClick={() => setSlow((value) => !value)}
          title="Slow every animation in this preview to a quarter speed"
        >
          0.25×
        </Button>
      </div>

      <div className="p-6">
        <CadenceProvider timeScale={slow ? SLOW_MOTION_SCALE : 1}>
          <Suspense fallback={<Skeleton className="h-24 w-full" />}>
            <Preview id={id} />
          </Suspense>
        </CadenceProvider>
      </div>
    </div>
  );
}
