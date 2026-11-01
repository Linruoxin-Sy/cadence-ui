"use client";

import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible";
import { useLayoutEffect, useRef } from "react";
import { cn } from "../lib/cn";
import { useCadenceMotion } from "../lib/provider";

function Collapsible({ ...props }: CollapsiblePrimitive.Root.Props) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
}

function CollapsibleTrigger({ ...props }: CollapsiblePrimitive.Trigger.Props) {
  return <CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" {...props} />;
}

/** geometry.resize CSS form: natural content measurement, never animated-panel feedback. */
function CollapsibleBody({ children }: Pick<CollapsiblePrimitive.Panel.Props, "children">) {
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
    <div ref={ref} data-slot="collapsible-content-inner" className="flow-root">
      {children}
    </div>
  );
}

function CollapsibleContent({ className, children, ...props }: CollapsiblePrimitive.Panel.Props) {
  const cm = useCadenceMotion();
  return (
    <CollapsiblePrimitive.Panel
      data-slot="collapsible-content"
      data-motion={cm.mode}
      className={(state) =>
        cn(
          "h-[max(0px,var(--cadence-disclosure-height,var(--collapsible-panel-height)))] overflow-hidden data-[ending-style]:h-0 data-[starting-style]:h-0",
          cm.reduced ? "duration-0" : "transition-[height] duration-(--motion-duration-slow) ease-cadence-out",
          typeof className === "function" ? className(state) : className,
        )
      }
      {...props}
    >
      <CollapsibleBody>{children}</CollapsibleBody>
    </CollapsiblePrimitive.Panel>
  );
}

export { Collapsible, CollapsibleContent, CollapsibleTrigger };
