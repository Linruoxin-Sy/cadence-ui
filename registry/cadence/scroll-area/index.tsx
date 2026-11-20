"use client";

import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area";
import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "../lib/cn";
import { useStateColor } from "../lib/css-motion";
import { createInlinePresence } from "../lib/inline-presence";
import { useMotionHostRef } from "../lib/motion-ref";
import { useCadenceMotion } from "../lib/provider";
import { useNumberPresentation } from "../lib/use-number-presentation";
import { useTextPresentation } from "../lib/use-text-presentation";

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;

function ScrollArea({ className, children, ...props }: ScrollAreaPrimitive.Root.Props) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={(state) => cn("relative", typeof className === "function" ? className(state) : className)}
      {...props}
    >
      <ScrollAreaViewport>{children}</ScrollAreaViewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

/** Native overflow stays the scroll owner; the viewport only owns its declared paint. */
function ScrollAreaViewport({ children }: { children: ReactNode }) {
  const { node, ref } = useMotionHostRef<HTMLDivElement>();
  const cm = useCadenceMotion(node);
  const viewportPaint = useStateColor(ref, cm, ["background-color", "color", "box-shadow"], {
    readability: "verified",
  });
  return (
    <ScrollAreaPrimitive.Viewport
      data-slot="scroll-area-viewport"
      className="size-full rounded-[inherit] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1"
      {...viewportPaint}
    >
      {typeof children === "string" ? (
        <ScrollAreaText value={children} />
      ) : typeof children === "number" ? (
        <ScrollAreaNumber value={children} />
      ) : (
        children
      )}
    </ScrollAreaPrimitive.Viewport>
  );
}

/** One native Text node for a direct plain string child; rich children keep their tree. */
function ScrollAreaText({ value }: { value: string }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const [entity] = useState(() => ({}));
  const text = useTextPresentation(node, value, cm, entity, { characterStagger: false });
  return (
    <span ref={ref} data-slot="scroll-area-text" data-motion={cm.mode}>
      {text}
    </span>
  );
}

/** One native display quantity for a direct numeric child; identifiers are never counters. */
function ScrollAreaNumber({ value }: { value: number }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const [entity] = useState(() => ({}));
  const text = useNumberPresentation(node, value, cm, entity, { compact: true, cause: "independent" });
  return (
    <span ref={ref} data-slot="scroll-area-number" data-motion={cm.mode}>
      {text}
    </span>
  );
}

/** The primitive mounts the track only while the viewport has overflow. */
function ScrollBar({
  className,
  orientation = "vertical",
  ref: forwardedRef,
  ...props
}: ScrollAreaPrimitive.Scrollbar.Props) {
  const { node, ref } = useMotionHostRef<HTMLDivElement>(forwardedRef);
  const cm = useCadenceMotion(node);
  const trackPaint = useStateColor(ref, cm, ["background-color"]);
  const presence = useRef<ReturnType<typeof createInlinePresence> | null>(null);
  const presenceHost = useRef<HTMLDivElement | null>(null);
  committed(() => {
    const host = node.current;
    if (host !== presenceHost.current) {
      presence.current?.dispose();
      presence.current = host ? createInlinePresence(host) : null;
      presenceHost.current = host;
    }
    if (!host) return;
    // The track is a later insertion by the primitive, so its own entrance fades
    // in from the current paint. A hidden track removes the host instead of
    // keeping a second, unchecked visibility policy.
    presence.current?.commit({ present: true, enter: true, cm });
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
    <ScrollAreaPrimitive.Scrollbar
      {...props}
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      className={(state) =>
        cn(
          "flex touch-none p-px select-none",
          orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent",
          orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent",
          typeof className === "function" ? className(state) : className,
        )
      }
      orientation={orientation}
      {...trackPaint}
      style={(state) => {
        const caller = props.style;
        return { ...(typeof caller === "function" ? caller(state) : caller), ...trackPaint.style };
      }}
    >
      <ScrollAreaThumb />
    </ScrollAreaPrimitive.Scrollbar>
  );
}

/** Thumb paint is the only scoped surface owner; native size and position stay direct. */
function ScrollAreaThumb() {
  const { node, ref } = useMotionHostRef<HTMLDivElement>();
  const cm = useCadenceMotion(node);
  const paint = useStateColor(ref, cm, ["background-color"]);
  return (
    <ScrollAreaPrimitive.Thumb
      data-slot="scroll-area-thumb"
      {...paint}
      className="relative flex-1 rounded-full bg-border"
    />
  );
}

export { ScrollArea, ScrollBar };
