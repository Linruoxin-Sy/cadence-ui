"use client";

import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/registry/cadence/button";
import type { CadenceMode } from "@/registry/cadence/lib/motion";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { PreviewRow, PreviewStack } from "./shell";
import { usePreviewVariant } from "./use-preview-variant";

/**
 * Six variants, then the eight sizes (four labelled, four square), then the two
 * states that change a button's texture rather than its shape: a leading icon,
 * which tightens the horizontal padding through `has-[>svg]`, and `disabled`.
 */
const variants = ["default", "secondary", "destructive", "outline", "ghost", "link"] as const;

export function ButtonPreview() {
  const { variant, control } = usePreviewVariant("Button", variants);
  const [mode, setMode] = useState<CadenceMode | undefined>();
  return (
    <PreviewStack>
      {control}
      <label className="flex items-center gap-2 text-sm">
        Button motion
        <select
          aria-label="Button motion"
          value={mode ?? "inherit"}
          onChange={(e) => setMode(e.target.value === "inherit" ? undefined : (e.target.value as CadenceMode))}
        >
          <option value="inherit">Inherit</option>
          <option value="full">Full</option>
          <option value="reduced">Reduced</option>
          <option value="none">None</option>
        </select>
      </label>
      <CadenceProvider mode={mode}>
        <PreviewRow>
          {variants.map((value) => (
            <span key={value} hidden={variant !== "all" && variant !== value}>
              <Button variant={value}>
                {value[0]?.toUpperCase()}
                {value.slice(1)}
              </Button>
            </span>
          ))}
        </PreviewRow>

        <PreviewRow>
          <Button size="xs">Xs</Button>
          <Button size="sm">Sm</Button>
          <Button>Default</Button>
          <Button size="lg">Lg</Button>
          <Button size="icon-xs" aria-label="Add">
            <PlusIcon />
          </Button>
          <Button size="icon-sm" aria-label="Add">
            <PlusIcon />
          </Button>
          <Button size="icon" aria-label="Add">
            <PlusIcon />
          </Button>
          <Button size="icon-lg" aria-label="Add">
            <PlusIcon />
          </Button>
        </PreviewRow>

        <PreviewRow>
          <Button>
            <PlusIcon />
            New file
          </Button>
          <Button variant="outline" disabled>
            Disabled
          </Button>
        </PreviewRow>
      </CadenceProvider>
    </PreviewStack>
  );
}
