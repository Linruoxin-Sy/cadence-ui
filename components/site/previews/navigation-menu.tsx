"use client";
import { useState } from "react";
import type { CadenceMode } from "@/registry/cadence/lib/motion";
import { CadenceProvider, useCadenceMotion } from "@/registry/cadence/lib/provider";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/registry/cadence/navigation-menu";

export function NavigationMenuPreview() {
  const inherited = useCadenceMotion();
  const [mode, setMode] = useState<CadenceMode>();
  const [value, setValue] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="flex min-h-96 w-full flex-col items-start gap-4">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label>
          Menu motion{" "}
          <select
            aria-label="Menu motion"
            value={mode ?? inherited.mode}
            onChange={(e) => setMode(e.target.value as CadenceMode)}
          >
            {["full", "reduced", "none"].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="rounded border px-2 py-1"
          onClick={() => setValue(value === "learn" ? "build" : "learn")}
        >
          Switch panel
        </button>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={expanded} onChange={(e) => setExpanded(e.target.checked)} />
          Extra links
        </label>
      </div>
      <CadenceProvider mode={mode}>
        <NavigationMenu className="flex-none" aria-label="Example navigation" value={value} onValueChange={setValue}>
          <NavigationMenuList>
            <NavigationMenuItem value="learn">
              <NavigationMenuTrigger>Learn</NavigationMenuTrigger>
              <NavigationMenuContent className="w-60" keepMounted>
                <button type="button" className="rounded p-2 text-sm underline" onClick={() => setExpanded((v) => !v)}>
                  Toggle details
                </button>
                <NavigationMenuLink href="#installation">Installation</NavigationMenuLink>
                <NavigationMenuLink href="#usage">Usage</NavigationMenuLink>
                {expanded && <NavigationMenuLink href="#motion-contract">Motion contract</NavigationMenuLink>}
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem value="build">
              <NavigationMenuTrigger>Build</NavigationMenuTrigger>
              <NavigationMenuContent className="grid w-80 grid-cols-2 gap-2" keepMounted>
                <button
                  type="button"
                  className="col-span-2 rounded p-2 text-sm underline"
                  onClick={() => setExpanded((v) => !v)}
                >
                  Toggle details
                </button>
                {expanded && <NavigationMenuLink href="#motion-contract">Motion contract</NavigationMenuLink>}
                {["Components", "Templates", "Themes", "Registry", "Accessibility", "Performance"].map((text) => (
                  <NavigationMenuLink key={text} href="#usage">
                    {text}
                  </NavigationMenuLink>
                ))}
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="#api">API</NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </CadenceProvider>
    </div>
  );
}
