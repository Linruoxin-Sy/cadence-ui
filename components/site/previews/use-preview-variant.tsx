"use client";

import { useEffect, useRef, useState } from "react";

/** Site URL convention only: callers apply the result to their own real API. */
export function usePreviewVariant<const V extends string>(label: string, options: readonly V[]) {
  const [variant, setVariant] = useState<V | "all">("all");
  const [invalid, setInvalid] = useState(false);
  const selector = useRef<HTMLSelectElement>(null);
  const previousFocus = useRef<Element | null>(null);
  useEffect(() => {
    if (variant !== "all" && previousFocus.current?.closest("[hidden]")) selector.current?.focus();
  }, [variant]);
  useEffect(() => {
    const read = () => {
      previousFocus.current = document.activeElement;
      const value = new URLSearchParams(window.location.search).get("variant");
      const valid = options.find((option) => option === value);
      setVariant(valid ?? "all");
      setInvalid(Boolean(value && value !== "all" && !valid));
    };
    read();
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, [options]);

  function select(value: V | "all") {
    previousFocus.current = document.activeElement;
    setVariant(value);
    setInvalid(false);
    const url = new URL(window.location.href);
    if (value === "all") url.searchParams.delete("variant");
    else url.searchParams.set("variant", value);
    if (url.href !== window.location.href) window.history.pushState(window.history.state, "", url);
  }

  return {
    variant,
    select,
    choose: (authored: V): V => (variant === "all" ? authored : variant),
    control: (
      <div className="grid w-full gap-1 text-sm">
        <label className="flex flex-wrap items-center gap-2">
          {label} variant
          <select
            ref={selector}
            aria-label={`${label} variant`}
            className="rounded border bg-background p-1"
            value={variant}
            onChange={(event) => select(event.target.value as V | "all")}
          >
            <option value="all">All variants (original examples)</option>
            {options.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <p role="status">{invalid ? "Unknown variant. Showing all original examples." : ""}</p>
      </div>
    ),
  };
}
