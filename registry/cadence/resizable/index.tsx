"use client";

import { GripVerticalIcon } from "lucide-react";
import { usePresence } from "motion/react";
import { type Ref, useEffect, useLayoutEffect, useRef } from "react";
import { Group, type GroupProps, Panel, type PanelProps, Separator, type SeparatorProps } from "react-resizable-panels";
import { cn } from "../lib/cn";
import { useStateColor } from "../lib/css-motion";
import { createInlinePresence } from "../lib/inline-presence";
import { useMotionHostRef } from "../lib/motion-ref";
import { useCadenceMotion } from "../lib/provider";

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * The panel library binds its root element through `elementRef`, not the React 19
 * `ref` prop, so these shells are the hosted element and hand the composed ref to
 * the attribute that actually attaches. The library keeps the native root; the
 * shells never add a DOM node or a second geometry writer.
 */
function ResizableGroupSurface({
  "data-slot": slot,
  elementRef,
  ref,
  ...props
}: GroupProps & { ref?: Ref<HTMLDivElement>; "data-slot"?: string }) {
  return <Group data-slot={slot} elementRef={elementRef ?? ref} {...props} />;
}

function ResizablePanelSurface({
  "data-slot": slot,
  elementRef,
  ref,
  ...props
}: PanelProps & { ref?: Ref<HTMLDivElement>; "data-slot"?: string }) {
  return <Panel data-slot={slot} elementRef={elementRef ?? ref} {...props} />;
}

/** Native flex geometry stays with the panel library in every mode. */
function ResizablePanelGroup({ className, ref, ...props }: GroupProps & { ref?: Ref<HTMLDivElement> }) {
  return (
    <ResizableGroupSurface
      data-slot="resizable-panel-group"
      ref={ref}
      className={cn("flex h-full w-full aria-[orientation=vertical]:flex-col", className)}
      {...props}
    />
  );
}

/** Panel allocation is native; children are caller content and keep their exact tree. */
function ResizablePanel({ children, ref, ...props }: PanelProps & { ref?: Ref<HTMLDivElement> }) {
  return (
    <ResizablePanelSurface data-slot="resizable-panel" ref={ref} {...props}>
      {children}
    </ResizablePanelSurface>
  );
}

/** The rule surface fades in on insertion and owns its own hover/active paint. */
function ResizableHandle({
  withHandle,
  className,
  ...props
}: SeparatorProps & {
  withHandle?: boolean;
}) {
  // The panel library keeps the hit region and geometry on `elementRef`; the rule
  // surface is a native child, so no second size/transform writer exists.
  const { node, ref } = useMotionHostRef<HTMLDivElement>();
  const cm = useCadenceMotion(node);
  const [present] = usePresence();
  // The rule carries no text and its own paint is the only scoped surface owner.
  const paint = useStateColor(ref, cm, ["background-color", "color"], {
    readability: "verified",
    readabilityGate: (host) => !host.textContent,
  });
  const presence = useRef<ReturnType<typeof createInlinePresence> | null>(null);
  const presenceHost = useRef<HTMLDivElement | null>(null);
  // A grip that mounted with its rule is inside that rule's entrance envelope.
  const initialGrip = useRef(Boolean(withHandle));
  committed(() => {
    const host = node.current;
    if (host !== presenceHost.current) {
      presence.current?.dispose();
      presence.current = host ? createInlinePresence(host) : null;
      presenceHost.current = host;
    }
    presence.current?.commit({ present, enter: true, cm });
  });
  committed(
    () => () => {
      presence.current?.dispose();
      presence.current = null;
      presenceHost.current = null;
    },
    [],
  );
  return (
    <Separator
      data-slot="resizable-handle"
      {...props}
      className={cn(
        "group relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-hidden aria-[orientation=horizontal]:h-px aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:after:left-0 aria-[orientation=horizontal]:after:h-1 aria-[orientation=horizontal]:after:w-full aria-[orientation=horizontal]:after:translate-x-0 aria-[orientation=horizontal]:after:-translate-y-1/2 [&[aria-orientation=horizontal]_[data-slot=resizable-handle-grip]]:rotate-90",
        className,
      )}
    >
      <div
        data-slot="resizable-handle-rule"
        {...paint}
        className="pointer-events-none absolute inset-0 flex items-center justify-center text-muted-foreground group-data-[separator=hover]:bg-ring/40 group-data-[separator=active]:bg-ring"
      >
        {withHandle && <ResizableHandleGrip mountedWithRule={initialGrip.current} />}
      </div>
    </Separator>
  );
}

/** The decorative grip owns only its own opacity; panel layout and the rule stay untouched. */
function ResizableHandleGrip({ mountedWithRule }: { mountedWithRule: boolean }) {
  const { node, ref } = useMotionHostRef<HTMLDivElement>();
  const cm = useCadenceMotion(node);
  const [present] = usePresence();
  const presence = useRef<ReturnType<typeof createInlinePresence> | null>(null);
  const presenceHost = useRef<HTMLDivElement | null>(null);
  committed(() => {
    const host = node.current;
    if (host !== presenceHost.current) {
      presence.current?.dispose();
      presence.current = host ? createInlinePresence(host) : null;
      presenceHost.current = host;
    }
    presence.current?.commit({ present, enter: !mountedWithRule, cm });
  });
  committed(
    () => () => {
      presence.current?.dispose();
      presence.current = null;
      presenceHost.current = null;
    },
    [],
  );
  return (
    <div
      ref={ref}
      data-slot="resizable-handle-grip"
      data-motion={cm.mode}
      className="z-10 flex h-4 w-3 items-center justify-center rounded-xs border bg-border"
    >
      <GripVerticalIcon aria-hidden="true" className="size-2.5" />
    </div>
  );
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup };
