"use client";

import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import { cn } from "../lib/cn";
import { useCadenceMotion } from "../lib/provider";

function Accordion({ className, ...props }: AccordionPrimitive.Root.Props) {
  return <AccordionPrimitive.Root data-slot="accordion" className={cn("flex w-full flex-col", className)} {...props} />;
}

function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b last:border-b-0", className)}
      {...props}
    />
  );
}

function AccordionTrigger({ className, children, ...props }: AccordionPrimitive.Trigger.Props) {
  return (
    <AccordionPrimitive.Header data-slot="accordion-header" className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group/accordion-trigger relative flex flex-1 items-start justify-between gap-4 rounded-md border border-transparent py-4 text-left text-sm font-medium outline-none hover:underline focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon
          aria-hidden="true"
          data-slot="accordion-trigger-icon"
          className="pointer-events-none mt-0.5 size-4 shrink-0 text-muted-foreground group-aria-expanded/accordion-trigger:hidden"
        />
        <ChevronUpIcon
          aria-hidden="true"
          data-slot="accordion-trigger-icon"
          className="pointer-events-none mt-0.5 hidden size-4 shrink-0 text-muted-foreground group-aria-expanded/accordion-trigger:inline"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

/** geometry.resize CSS form: natural content measurement, never animated-panel feedback. */
function AccordionBody({ className, children }: Pick<AccordionPrimitive.Panel.Props, "className" | "children">) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const content = ref.current;
    if (!content) return;
    const measure = () => {
      content.parentElement?.style.setProperty(
        "--cadence-disclosure-height",
        `${Math.max(0, content.getBoundingClientRect().height)}px`,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      data-slot="accordion-content-inner"
      className={cn(
        "flow-root pt-0 pb-4 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

function AccordionContent({ className, children, ...props }: AccordionPrimitive.Panel.Props) {
  const cm = useCadenceMotion();
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      data-motion={cm.mode}
      className={cn(
        "h-[max(0px,var(--cadence-disclosure-height,var(--accordion-panel-height)))] overflow-hidden text-sm data-[ending-style]:h-0 data-[starting-style]:h-0",
        cm.reduced ? "duration-0" : "transition-[height] duration-(--motion-duration-slow) ease-cadence-out",
      )}
      {...props}
    >
      <AccordionBody className={className}>{children}</AccordionBody>
    </AccordionPrimitive.Panel>
  );
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
