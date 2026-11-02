"use client";

import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible";
import { useLayoutEffect, useRef } from "react";
import { cn } from "../lib/cn";
import { popupStyle } from "../lib/popup-style";
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
    const panel = content.parentElement;
    const view = content.ownerDocument.defaultView;
    if (!panel || !view) return;
    const measure = () => {
      const style = view.getComputedStyle(panel);
      const edges =
        style.boxSizing === "border-box"
          ? [style.paddingTop, style.paddingBottom, style.borderTopWidth, style.borderBottomWidth].reduce(
              (sum, value) => sum + (Number.parseFloat(value) || 0),
              0,
            )
          : 0;
      const height = `${Math.max(0, content.getBoundingClientRect().height + edges)}px`;
      // Attribute observation includes our own write; avoid another mutation when unchanged.
      if (panel.style.getPropertyValue("--cadence-disclosure-height") !== height)
        panel.style.setProperty("--cadence-disclosure-height", height);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(content, { box: "border-box" });
    const attributes = new MutationObserver(measure);
    attributes.observe(panel, { attributes: true, attributeFilter: ["class", "style"] });
    view.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      attributes.disconnect();
      view.removeEventListener("resize", measure);
    };
  }, []);
  return (
    <div ref={ref} data-slot="collapsible-content-inner" className="flow-root">
      {children}
    </div>
  );
}

function CollapsibleContent({ className, children, style, ...props }: CollapsiblePrimitive.Panel.Props) {
  const cm = useCadenceMotion();
  return (
    <CollapsiblePrimitive.Panel
      data-slot="collapsible-content"
      data-motion={cm.mode}
      style={popupStyle(cm, style)}
      className={(state) =>
        cn(
          "h-[max(0px,var(--cadence-disclosure-height,var(--collapsible-panel-height)))] overflow-hidden data-[ending-style]:h-0 data-[starting-style]:h-0",
          cm.reduced
            ? "transition-none duration-0"
            : "transition-[height] duration-(--motion-duration-slow) ease-cadence-out",
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
