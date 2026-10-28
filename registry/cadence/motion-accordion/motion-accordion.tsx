"use client";

import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useId, useState } from "react";
import { cn } from "../lib/cn";
import { useCadenceMotion } from "../lib/provider";

export interface AccordionItem {
  value: string;
  trigger: ReactNode;
  content: ReactNode;
}

export interface MotionAccordionProps {
  items: AccordionItem[];
  /** `single` allows one open item at a time; `multiple` allows any number. */
  type?: "single" | "multiple";
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  /** Allow closing the open item in `single` mode. */
  collapsible?: boolean;
  className?: string;
}

const toArray = (value: string | string[] | undefined) =>
  value === undefined ? [] : Array.isArray(value) ? value : [value];

/**
 * An accordion whose panels animate their height on a spring.
 *
 * Motion contract:
 * - open/close: height 0 ↔ auto and a 4px content lift (`state.morph`, 0.42s)
 * - chevron: rotate 180° on the press spring
 * - reduced: height snaps, content fades, chevron jumps
 * - none: instant
 *
 * a11y: buttons carry `aria-expanded` and `aria-controls`; panels are `region`s
 * labelled by their trigger and stay in the DOM (hidden with `height: 0` and
 * `aria-hidden` is avoided by rendering the panel only while open).
 */
export function MotionAccordion({
  items,
  type = "single",
  value: valueProp,
  defaultValue,
  onValueChange,
  collapsible = true,
  className,
}: MotionAccordionProps) {
  const cm = useCadenceMotion();
  const baseId = useId();
  const [uncontrolled, setUncontrolled] = useState<string[]>(toArray(defaultValue));
  const openValues = toArray(valueProp ?? uncontrolled);

  const toggle = (value: string) => {
    const isOpen = openValues.includes(value);
    let next: string[];
    if (type === "single") next = isOpen ? (collapsible ? [] : openValues) : [value];
    else next = isOpen ? openValues.filter((item) => item !== value) : [...openValues, value];

    if (valueProp === undefined) setUncontrolled(next);
    onValueChange?.(type === "single" ? (next[0] ?? "") : next);
  };

  return (
    <div
      data-slot="motion-accordion"
      data-motion={cm.mode}
      className={cn("divide-y divide-border rounded-xl border border-border", className)}
    >
      {items.map((item) => {
        const open = openValues.includes(item.value);
        const panelId = `${baseId}-panel-${item.value}`;
        const triggerId = `${baseId}-trigger-${item.value}`;
        return (
          <div key={item.value} className="px-4">
            <h3 className="m-0">
              <button
                type="button"
                id={triggerId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => toggle(item.value)}
                className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span>{item.trigger}</span>
                <motion.span
                  aria-hidden="true"
                  animate={{ rotate: open ? 180 : 0 }}
                  transition={cm.transition(open ? "state.morph" : "exit.fade")}
                  className="text-muted-foreground"
                >
                  <ChevronDown className="size-4" />
                </motion.span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {open ? (
                <motion.div
                  key="panel"
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={cm.transition("state.morph")}
                  className="overflow-hidden"
                >
                  <div className="pb-4 text-sm text-muted-foreground">{item.content}</div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
