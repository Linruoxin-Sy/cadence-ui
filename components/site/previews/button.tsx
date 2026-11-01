"use client";

import { PlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/registry/cadence/button";
import type { CadenceMode } from "@/registry/cadence/lib/motion";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { PreviewRow, PreviewStack } from "./shell";

/**
 * Six variants, then the eight sizes (four labelled, four square), then the two
 * states that change a button's texture rather than its shape: a leading icon,
 * which tightens the horizontal padding through `has-[>svg]`, and `disabled`.
 */
const variants = ["default", "secondary", "destructive", "outline", "ghost", "link"] as const;

export function ButtonPreview() {
  const [variant, setVariant] = useState("all");
  useEffect(() => {
    const read = () => {
      const value = new URLSearchParams(window.location.search).get("variant");
      setVariant(value && variants.some((variant) => variant === value) ? value : "all");
    };
    read();
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, []);
  const [mode, setMode] = useState<CadenceMode | undefined>();
  return (
    <PreviewStack>
      <label className="flex items-center gap-2 text-sm">
        Button variant
        <select
          aria-label="Button variant"
          value={variant}
          onChange={(event) => {
            const value = event.target.value;
            setVariant(value);
            const url = new URL(window.location.href);
            if (value === "all") url.searchParams.delete("variant");
            else url.searchParams.set("variant", value);
            window.history.pushState(null, "", url);
          }}
        >
          <option value="all">All variants</option>
          {variants.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
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
