"use client";

import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { useRender } from "@base-ui/react/use-render";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import { cn } from "../lib/cn";
import { popupStyle } from "../lib/popup-style";
import { useCadenceMotionScope, withCadenceScope } from "../lib/provider";

function Accordion({ className, ...props }: AccordionPrimitive.Root.Props) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={(state) => cn("flex w-full flex-col", typeof className === "function" ? className(state) : className)}
      {...props}
    />
  );
}

function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={(state) =>
        cn("border-b last:border-b-0", typeof className === "function" ? className(state) : className)
      }
      {...props}
    />
  );
}

function AccordionTrigger({ className, children, ...props }: AccordionPrimitive.Trigger.Props) {
  return (
    <AccordionPrimitive.Header data-slot="accordion-header" className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={(state) =>
          cn(
            "group/accordion-trigger relative flex flex-1 items-start justify-between gap-4 rounded-md border border-transparent py-4 text-left text-sm font-medium outline-none hover:underline focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
            typeof className === "function" ? className(state) : className,
          )
        }
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
function AccordionBody({ className, children }: React.ComponentProps<"div">) {
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

function AccordionSurface({
  elementProps,
  state,
  render,
}: {
  elementProps: React.ComponentPropsWithRef<"div">;
  state: AccordionPrimitive.Panel.State;
  render: AccordionPrimitive.Panel.Props["render"];
}) {
  return useRender({
    defaultTagName: "div",
    render,
    props: { ...elementProps },
    state: { ...state },
    stateAttributesMapping: {
      open: () => null,
      disabled: () => null,
      transitionStatus: () => null,
      hidden: () => null,
      index: () => null,
      value: () => null,
      orientation: () => null,
    },
  });
}

function AccordionContent({ className, children, render, style, ...props }: AccordionPrimitive.Panel.Props) {
  const { cm, ref: scopeRef } = useCadenceMotionScope(props.ref);
  return withCadenceScope(
    cm,
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      data-motion={cm.mode}
      style={popupStyle(cm, style)}
      className={cn(
        "h-[max(0px,var(--cadence-disclosure-height,var(--accordion-panel-height)))] overflow-hidden text-sm data-[ending-style]:h-0 data-[starting-style]:h-0",
        cm.reduced
          ? "transition-none duration-0"
          : "transition-[height] duration-(--motion-duration-slow) ease-cadence-out",
      )}
      render={(elementProps, state) => (
        <AccordionSurface
          elementProps={{
            ...elementProps,
            children: (
              <AccordionBody className={typeof className === "function" ? className(state) : className}>
                {children}
              </AccordionBody>
            ),
          }}
          state={state}
          render={render}
        />
      )}
      {...props}
      ref={scopeRef}
    />,
  );
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
