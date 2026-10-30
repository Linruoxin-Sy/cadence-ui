"use client";

import { Kbd, KbdGroup } from "@/registry/cadence/kbd/kbd";

export function KbdPreview() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Keys</p>
        <div className="flex flex-wrap items-center gap-2">
          <Kbd>Esc</Kbd>
          <Kbd>↵</Kbd>
          <Kbd>↑</Kbd>
          <Kbd>Tab</Kbd>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Combinations</p>
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            Search
            <KbdGroup>
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
          </span>
          <span className="inline-flex items-center gap-2">
            Command palette
            <KbdGroup>
              <Kbd>Ctrl</Kbd>
              <Kbd>Shift</Kbd>
              <Kbd>P</Kbd>
            </KbdGroup>
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-border">
        {[
          ["Open settings", "⌘,"],
          ["New file", "⌘N"],
          ["Close tab", "⌘W"],
        ].map(([label, keys]) => (
          <div
            key={label}
            className="flex items-center justify-between border-border border-b px-3 py-2 text-sm last:border-b-0"
          >
            {label}
            <Kbd>{keys}</Kbd>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        A hint is a label, not a control: it never enters the tab order and never animates.
      </p>
    </div>
  );
}
