"use client";

import { motion } from "motion/react";
import { type KeyboardEvent, type ReactNode, useId, useRef, useState } from "react";
import { cn } from "../lib/cn";
import { useCadenceMotion } from "../lib/provider";

export interface AnimatedTabItem {
  value: string;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

export interface AnimatedTabsProps {
  items: AnimatedTabItem[];
  /** Controlled active value. */
  value?: string;
  /** Initial value when uncontrolled. Defaults to the first enabled item. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

/**
 * Tabs with a shared-element indicator and an animated panel swap.
 *
 * Motion contract:
 * - indicator: `layoutId` slides between tabs on the `layout.shared` spring
 * - panel: 8px lift + fade in when selected (`reveal`); the previous panel unmounts immediately
 * - reduced: indicator jumps, panels fade only
 * - none: instant
 *
 * a11y: implements the WAI-ARIA tabs pattern (roving tabindex, arrow keys,
 * Home/End, aria-selected/controls/labelledby). Panels are unmounted when
 * inactive, so local state inside a panel is reset on switch.
 */
export function AnimatedTabs({ items, value: valueProp, defaultValue, onValueChange, className }: AnimatedTabsProps) {
  const cm = useCadenceMotion();
  const baseId = useId();
  const firstEnabled = items.find((item) => !item.disabled)?.value ?? "";
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? firstEnabled);
  const active = valueProp ?? uncontrolled;
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeItem = items.find((item) => item.value === active) ?? items[0];

  const select = (next: string) => {
    if (valueProp === undefined) setUncontrolled(next);
    onValueChange?.(next);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const enabled = items.filter((item) => !item.disabled);
    if (!enabled.length) return;
    const index = Math.max(
      0,
      enabled.findIndex((item) => item.value === active),
    );
    const next =
      event.key === "Home"
        ? enabled[0]
        : event.key === "End"
          ? enabled[enabled.length - 1]
          : enabled[(index + (event.key === "ArrowRight" ? 1 : -1) + enabled.length) % enabled.length];
    if (!next) return;
    select(next.value);
    tabRefs.current[items.findIndex((item) => item.value === next.value)]?.focus();
  };

  return (
    <div data-slot="animated-tabs" data-motion={cm.mode} className={cn("w-full", className)}>
      <div
        role="tablist"
        aria-label="Tabs"
        onKeyDown={onKeyDown}
        className="relative inline-flex items-center gap-1 rounded-xl bg-muted/40 p-1"
      >
        {items.map((item) => {
          const selected = item.value === active;
          return (
            <button
              key={item.value}
              ref={(node) => {
                tabRefs.current[items.indexOf(item)] = node;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${item.value}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${item.value}`}
              tabIndex={selected ? 0 : -1}
              disabled={item.disabled}
              onClick={() => select(item.value)}
              className={cn(
                "relative isolate inline-flex h-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                item.disabled && "cursor-not-allowed opacity-50",
              )}
            >
              {selected ? (
                cm.reduced ? (
                  <span aria-hidden="true" className="absolute inset-0 -z-10 rounded-lg bg-background shadow-sm" />
                ) : (
                  <motion.span
                    aria-hidden="true"
                    layoutId={`${baseId}-indicator`}
                    className="absolute inset-0 -z-10 rounded-lg bg-background shadow-sm"
                    transition={cm.transition("layout.shared")}
                  />
                )
              ) : null}
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="relative mt-4">
        {activeItem ? (
          <motion.div
            key={activeItem.value}
            role="tabpanel"
            id={`${baseId}-panel-${activeItem.value}`}
            aria-labelledby={`${baseId}-tab-${activeItem.value}`}
            tabIndex={0}
            initial={cm.reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={cm.transition("reveal")}
            className="rounded-xl border border-border bg-background p-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {activeItem.content}
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
