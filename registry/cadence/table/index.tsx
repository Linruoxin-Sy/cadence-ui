"use client";

import type * as React from "react";
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "../lib/cn";
import { useStateColor } from "../lib/css-motion";
import {
  createPresentationScope,
  documentPresentation,
  MotionPresentation,
  usePresentationScope,
} from "../lib/motion-presence";
import { useMotionHostRef } from "../lib/motion-ref";
import { useCadenceMotion } from "../lib/provider";
import { createSurfacePresence } from "../lib/surface-presence";
import { nativeTextContext } from "../lib/text-layout";

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;
const subscribe = () => () => {};

/** Caller paint is unverified; scoring, alignment and rule-width utilities stay eligible. */
function statedPaint(className?: string, style?: React.CSSProperties) {
  if (
    Object.keys(style ?? {}).some((key) =>
      /color|background|fill|stroke|shadow|opacity|filter|blend|^--(?!motion-|cadence-|ease-)/i.test(key),
    )
  )
    return false;
  return !(className ?? "")
    .split(/\s+/)
    .some(
      (name) =>
        /(?:^|:)(?:bg-|text-|border-|shadow-|fill-|stroke-)/.test(name) &&
        !/(?:^|:)(?:text-(?:xs|sm|base|lg|xl|left|right|center|justify|start|end|nowrap|balance|pretty)|border-(?:b|t|l|r|x|y|border|0|2|4|8))$/.test(
          name,
        ),
    );
}

/** One stable surface: a later-inserted whole table fades in once, and every
 * border/background decision stays on the native engine. */
function Table({ className, children, ...props }: React.ComponentProps<"table">) {
  const container = useRef<HTMLDivElement>(null);
  const cm = useCadenceMotion(container);
  const parent = usePresentationScope();
  const [scope] = useState(() => createPresentationScope(container));
  const hydration = useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  );
  const initialHydration = useRef(hydration);
  const consumed = useRef(false);
  const presence = useRef<ReturnType<typeof createSurfacePresence> | null>(null);
  useEffect(() => {
    if (!parent && container.current) documentPresentation(container.current.ownerDocument).presented = true;
  }, [parent]);
  committed(() => {
    const host = container.current;
    if (!host) return;
    if (!presence.current) presence.current = createSurfacePresence(host);
    const baseline = parent ?? documentPresentation(host.ownerDocument);
    const enter =
      !consumed.current &&
      !initialHydration.current &&
      Boolean(baseline.presented && baseline.available() && !nativeTextContext(host));
    consumed.current = true;
    scope.presented = true;
    presence.current.commit({ present: true, enter, cm });
  });
  committed(
    () => () => {
      presence.current?.dispose();
      presence.current = null;
    },
    [],
  );
  return (
    <div ref={container} data-slot="table-container" data-motion={cm.mode} className="relative w-full overflow-x-auto">
      <MotionPresentation scope={scope}>
        <table data-slot="table" className={cn("w-full caption-bottom text-sm", className)} {...props}>
          {children}
        </table>
      </MotionPresentation>
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead data-slot="table-header" className={cn("[&_tr]:border-b", className)} {...props} />;
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody data-slot="table-body" className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

/** The existing footer paint is one scoped surface owner; its rule stays native. */
function TableFooter({ className, ref: external, ...props }: React.ComponentProps<"tfoot">) {
  const host = useMotionHostRef<HTMLTableSectionElement>(external);
  const cm = useCadenceMotion(host.node);
  const FooterPaint = useStateColor(host.ref, cm, ["background-color", "color", "border-top-color"], {
    readability: statedPaint(className, props.style) ? "verified" : "immediate",
  });
  return (
    <tfoot
      {...props}
      {...FooterPaint}
      data-slot="table-footer"
      data-motion={cm.mode}
      className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)}
      style={{ ...FooterPaint.style, ...props.style }}
    />
  );
}

/** Hover, expanded and caller-selected state share the row's one paint owner. */
function TableRow({ className, ref: external, ...props }: React.ComponentProps<"tr">) {
  const host = useMotionHostRef<HTMLTableRowElement>(external);
  const cm = useCadenceMotion(host.node);
  const RowPaint = useStateColor(host.ref, cm, ["background-color", "color"], {
    readability: statedPaint(className, props.style) ? "verified" : "immediate",
  });
  return (
    <tr
      {...props}
      {...RowPaint}
      data-slot="table-row"
      data-motion={cm.mode}
      className={cn(
        "border-b hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
        className,
      )}
      style={{ ...RowPaint.style, ...props.style }}
    />
  );
}

/** Cell content stays the caller's own native text: a table cell is a readout, not a
 *  staged display, so no per-cell text or quantity controller is allocated here. */
function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  );
}

function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return (
    <caption data-slot="table-caption" className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />
  );
}

export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow };
