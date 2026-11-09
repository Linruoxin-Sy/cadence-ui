"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

interface Entry {
  slug: string;
  title: string;
  description: string;
  categories: string[];
  intensity?: string;
  complexity?: string;
}
const EMPTY = { q: "", category: "", intensity: "", complexity: "" };
const label = (value: string) => (value === "ai" ? "AI" : value.charAt(0).toUpperCase() + value.slice(1));

export function ComponentCatalog({ components }: { components: Entry[] }) {
  const [filters, setFilters] = useState(EMPTY);
  const [draft, setDraft] = useState("");
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const previousFocus = useRef<Element | null>(null);
  const search = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const uid = useId();
  const categories = [...new Set(components.flatMap((entry) => entry.categories))].sort();
  const choices = { category: categories, intensity: ["subtle", "medium", "expressive"], complexity: ["S", "M", "L"] };
  // URL parsing runs after hydration; server HTML always contains the whole catalogue.
  useEffect(() => {
    const read = () => {
      previousFocus.current = document.activeElement;
      const params = new URLSearchParams(window.location.search);
      const next = { ...EMPTY, q: params.get("q") ?? "" };
      let unknown = false;
      for (const key of ["category", "intensity", "complexity"] as const) {
        const value = params.get(key) ?? "";
        const valid =
          key === "category"
            ? components.some((entry) => entry.categories.includes(value))
            : (key === "intensity" ? ["subtle", "medium", "expressive"] : ["S", "M", "L"]).includes(value);
        next[key] = valid ? value : "";
        unknown ||= Boolean(value && !valid);
      }
      setFilters(next);
      setDraft(next.q);
      setInvalid(unknown);
      setReady(true);
    };
    read();
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, [components]);
  useEffect(() => {
    if (
      previousFocus.current &&
      list.current?.contains(previousFocus.current) &&
      previousFocus.current.closest("[hidden]")
    )
      search.current?.focus();
  });
  const apply = (next: typeof EMPTY) => {
    setFilters(next);
    setDraft(next.q);
    setInvalid(false);
    const url = new URL(window.location.href);
    for (const key of Object.keys(EMPTY) as Array<keyof typeof EMPTY>) {
      if (next[key]) url.searchParams.set(key, next[key]);
      else url.searchParams.delete(key);
    }
    if (url.href !== window.location.href) window.history.pushState(window.history.state, "", url);
  };
  const matches = components.map((entry) => {
    const text = `${entry.slug} ${entry.title} ${entry.description}`.toLowerCase();
    return (
      filters.q
        .toLowerCase()
        .trim()
        .split(/\s+/)
        .every((word) => text.includes(word)) &&
      (!filters.category || entry.categories.includes(filters.category)) &&
      (!filters.intensity || entry.intensity === filters.intensity) &&
      (!filters.complexity || entry.complexity === filters.complexity)
    );
  });
  const count = matches.filter(Boolean).length;
  const control = "min-w-0 rounded-md border border-border bg-background px-3 py-2 text-sm";
  return (
    <>
      <form
        className="mt-8"
        onSubmit={(event) => {
          event.preventDefault();
          apply({ ...filters, q: draft.trim() });
        }}
      >
        <fieldset disabled={!ready} className="grid min-w-0 gap-4 sm:grid-cols-3">
          <legend className="sr-only">Filter components</legend>
          <label className="grid gap-1 text-sm sm:col-span-3" htmlFor={`${uid}-search`}>
            Search components
            <input
              ref={search}
              id={`${uid}-search`}
              type="search"
              className={control}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
          </label>
          {(["category", "intensity", "complexity"] as const).map((key) => (
            <label key={key} className="grid gap-1 text-sm" htmlFor={`${uid}-${key}`}>
              {label(key)}
              <select
                id={`${uid}-${key}`}
                className={control}
                value={filters[key]}
                onChange={(event) => apply({ ...filters, [key]: event.target.value })}
              >
                <option value="">
                  All {key === "category" ? "categories" : key === "intensity" ? "intensities" : "complexities"}
                </option>
                {choices[key].map((value) => (
                  <option key={value} value={value}>
                    {label(value)}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <div className="flex gap-3 sm:col-span-3">
            <button className={control} type="submit">
              Search
            </button>
            <button className={control} type="button" onClick={() => apply(EMPTY)}>
              Clear filters
            </button>
          </div>
        </fieldset>
      </form>
      <p className="mt-3 text-sm text-muted-foreground">
        Intensity describes authored scope: subtle is local feedback or native UI; medium moves a surface or collection;
        expressive transfers identity across surfaces. Local text and digit changes can be subtle. Mode, capabilities
        and installation size are separate.
      </p>
      <noscript>
        <p className="mt-3 text-sm">Enable JavaScript to filter. All components are listed below.</p>
      </noscript>
      <p className="mt-4 text-sm text-muted-foreground" role="status">
        {count} of {components.length} components
        {invalid ? ". Unknown filter ignored; showing matching components." : ""}
      </p>
      {count === 0 && <p className="py-8">No components match. Try another search or clear filters.</p>}
      <div ref={list} data-catalog-results className="mt-6 divide-y divide-border border-y border-border">
        {components.map((entry, index) => (
          <div key={entry.slug} hidden={!matches[index]}>
            <Link
              href={`/components/${entry.slug}`}
              className="group flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h2 className="text-sm font-semibold group-hover:underline">
                  {entry.title} <span className="font-mono text-xs text-muted-foreground">{entry.complexity}</span>
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{entry.description}</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2 text-xs text-muted-foreground">
                <span>{entry.categories.map(label).join(", ")}</span>
                <span>· {entry.intensity}</span>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}
