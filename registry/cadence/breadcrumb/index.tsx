// biome-ignore-all lint/a11y/useSemanticElements: BreadcrumbPage mirrors shadcn's Base UI markup, which keeps the current page a span and marks it with aria-current instead of rendering a second link.
// biome-ignore-all lint/a11y/useFocusableInteractive: the current page is deliberately not focusable; a tab stop that goes nowhere is worse than the ARIA pattern.
"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import { useIsPresent, usePresence } from "motion/react";
import type * as React from "react";
import {
  createContext,
  useContext,
  useEffect,
  useInsertionEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { type BreadcrumbMember, breadcrumbDestination, createBreadcrumbTrail } from "../lib/breadcrumb-layout";
import { createGroupPositions } from "../lib/button-group-layout";
import { cn } from "../lib/cn";
import { useStateColor } from "../lib/css-motion";
import { createInlineEntrance } from "../lib/inline-entrance";
import { createInlinePresence } from "../lib/inline-presence";
import { createMeasuredGeometry } from "../lib/measured-geometry";
import { bindMotionParameters, geometryCompact } from "../lib/motion";
import {
  createPresentationScope,
  documentPresentation,
  MotionPresentation,
  usePresentationScope,
} from "../lib/motion-presence";
import { type MotionHostRef, useMotionHostRef } from "../lib/motion-ref";
import { createMotionTransaction } from "../lib/motion-transaction";
import { type CadenceMotion, useCadenceMotion } from "../lib/provider";
import { nativeTextContext } from "../lib/text-layout";
import { useTextPresentation } from "../lib/use-text-presentation";

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;
const subscribe = () => () => {};
type Scope = ReturnType<typeof createPresentationScope>;

/**
 * The trail's committed path: every retained crumb owns its own projection, so the
 * list only publishes measurement and the shared revision.
 */
type Trail = {
  scope: Scope;
  present: boolean;
  members: Map<object, BreadcrumbMember>;
  request(passive?: boolean): void;
  forget(identity: object): void;
};
const TrailContext = createContext<Trail | null>(null);

export interface BreadcrumbProps extends React.ComponentProps<"nav"> {}

/**
 * The path to the current page. The landmark itself is static: its position in the
 * page is navigation, not decoration.
 *
 * a11y: the `nav` is labelled "breadcrumb", so a screen reader lists it as its own
 * landmark. The last crumb is a `BreadcrumbPage` (not a link) marked
 * `aria-current="page"`.
 */
function Breadcrumb({ className, ...props }: BreadcrumbProps) {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" className={cn(className)} {...props} />;
}

export interface BreadcrumbListProps extends React.ComponentProps<"ol"> {}

/**
 * The surviving owner of one path revision. It measures final crumb boxes once after a
 * committed membership or label change, keeps the path's own block size and never
 * chases a child's interpolated size. Passive viewport/font reflow stays native.
 */
function BreadcrumbList({ className, children, ...props }: BreadcrumbListProps) {
  const { node, ref } = useMotionHostRef<HTMLOListElement>(props.ref);
  const cm = useCadenceMotion(node);
  const parent = usePresentationScope();
  const [scope] = useState(() => createPresentationScope(node));
  const present = useIsPresent();
  const hydrated = useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  );
  const initialHydration = useRef(hydrated);
  const consumed = useRef(false);
  const entrance = useRef<ReturnType<typeof createInlineEntrance> | null>(null);
  const [owned] = useState(() => {
    const members = new Map<object, BreadcrumbMember>();
    const transaction = createMotionTransaction();
    return { members, transaction, geometry: createMeasuredGeometry(transaction) };
  });
  const trail = useRef<ReturnType<typeof createBreadcrumbTrail> | null>(null);
  const registered = useRef<{ host: HTMLElement; release(): void } | null>(null);
  const latest = useRef({ cm, present, available: true });
  const [trailValue] = useState<Trail>(() => ({
    scope,
    present: true,
    members: owned.members,
    request: (passive) => trail.current?.request(passive),
    forget: (identity) => {
      owned.members.delete(identity);
      trail.current?.forget(identity);
    },
  }));
  useEffect(() => {
    if (!parent && node.current) documentPresentation(node.current.ownerDocument).presented = true;
  }, [parent, node]);
  committed(() => {
    latest.current = { cm, present, available: scope.available() && (!parent || parent.available()) };
    trailValue.present = present;
    const host = node.current;
    if (!host) return;
    if (!entrance.current) entrance.current = createInlineEntrance(host);
    const baseline = parent ?? documentPresentation(host.ownerDocument);
    entrance.current.commit({
      present,
      enter:
        !consumed.current &&
        !initialHydration.current &&
        baseline.presented &&
        baseline.available() &&
        !host.hasAttribute("data-starting-style"),
      cm: nativeTextContext(host) ? { ...cm, timeScale: 0 } : cm,
    });
    consumed.current = true;
    if (registered.current?.host !== host) {
      registered.current?.release();
      registered.current = {
        host,
        release: owned.geometry.register({
          host: node,
          content: host,
          axes: ["height"],
          observeChildren: true,
          measure: () => breadcrumbDestination(host),
        }),
      };
    }
    if (!trail.current)
      trail.current = createBreadcrumbTrail({
        host: node,
        members: owned.members,
        preflight: (visuals) => owned.transaction.preflightVisuals(visuals),
        revision: (signature) => owned.transaction.revision("content", signature, host),
        resize: (revision) => {
          const parameters = latest.current.cm.parameters(
            bindMotionParameters(geometryCompact, "geometry.resize/measured"),
          );
          if (parameters.kind !== "geometry") return;
          owned.geometry.commit(revision, {
            reduced: latest.current.cm.reduced,
            transition: parameters.transition,
            available: latest.current.present && latest.current.available,
          });
        },
      });
    if (present) scope.transaction.open();
    else scope.transaction.close();
    scope.presented = present;
    trail.current.request();
  });
  committed(
    () => () => {
      entrance.current?.dispose();
      entrance.current = null;
      registered.current?.release();
      registered.current = null;
      trail.current?.dispose();
      trail.current = null;
      owned.geometry.dispose();
    },
    [owned],
  );
  const resize = useRef<() => void>(() => {});
  resize.current = () => trail.current?.request(true);
  committed(() => {
    const host = node.current;
    const view = host?.ownerDocument.defaultView;
    const fonts = host?.ownerDocument.fonts;
    const request = () => resize.current();
    view?.addEventListener("resize", request);
    fonts?.addEventListener("loadingdone", request);
    return () => {
      view?.removeEventListener("resize", request);
      fonts?.removeEventListener("loadingdone", request);
    };
  }, [node]);
  return (
    <MotionPresentation scope={scope}>
      <TrailContext.Provider value={trailValue}>
        <ol
          data-slot="breadcrumb-list"
          className={cn(
            "relative flex flex-wrap items-center gap-1.5 text-sm break-words text-muted-foreground sm:gap-2.5",
            className,
          )}
          {...props}
          ref={ref}
          data-motion={cm.mode}
          data-ending-style={present ? undefined : ""}
          aria-hidden={present ? props["aria-hidden"] : true}
          inert={!present || props.inert || undefined}
        >
          {children}
        </ol>
      </TrailContext.Provider>
    </MotionPresentation>
  );
}

/** One retained crumb: its own presence channel, its own projection and - where the
 * part paints its own foreground - its own scoped colour owner. */
function useCrumb(node: MotionHostRef<HTMLElement>, cm: CadenceMotion) {
  const trail = useContext(TrailContext);
  const parent = usePresentationScope();
  const [entity] = useState(() => ({}));
  const [positions] = useState(() => createGroupPositions(trail?.scope.transaction));
  const [member] = useState<BreadcrumbMember>(() => ({
    host: node,
    cm,
    positions,
    present: true,
  }));
  const scope = trail?.scope ?? parent;
  const [present, remove] = usePresence();
  const removal = useRef({ ready: false, pending: false, present, complete: remove });
  useInsertionEffect(() => {
    Object.assign(removal.current, { ready: false, present, complete: remove });
  });
  useEffect(() => {
    const batch = removal.current;
    batch.ready = true;
    if (batch.pending && !batch.present) batch.complete?.();
    batch.pending = false;
  });
  const hydrated = useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  );
  const initialHydration = useRef(hydrated);
  const consumed = useRef(false);
  const lifecycle = useRef<ReturnType<typeof createInlinePresence> | null>(null);
  const registered = useRef<HTMLElement | null>(null);
  committed(() => {
    const host = node.current;
    if (!host) return;
    if (registered.current !== host) {
      if (registered.current) trail?.forget(entity);
      registered.current = host;
      trail?.members.set(entity, member);
    }
    Object.assign(member, { host: node, cm, positions, present });
    if (!lifecycle.current) lifecycle.current = createInlinePresence(host, scope?.transaction);
    const baseline = parent ?? documentPresentation(host.ownerDocument);
    const available = scope ? scope.available() : baseline.available();
    lifecycle.current.commit({
      present,
      enter:
        !consumed.current &&
        !initialHydration.current &&
        baseline.presented &&
        Boolean(available) &&
        !host.hasAttribute("data-starting-style"),
      cm: nativeTextContext(host) ? { ...cm, timeScale: 0 } : cm,
      complete: () => {
        const delivery = removal.current;
        if (delivery.present) return;
        if (delivery.ready) delivery.complete?.();
        else delivery.pending = true;
      },
    });
    consumed.current = true;
    trail?.request();
  });
  committed(
    () => () => {
      lifecycle.current?.dispose();
      lifecycle.current = null;
      positions.dispose();
      if (registered.current) trail?.forget(entity);
      registered.current = null;
    },
    [entity, positions, trail],
  );
  return {
    present,
    /** A leaving crumb keeps a noninteractive visual at its last committed box. */
    style:
      !present && member.box
        ? ({
            position: "absolute",
            left: member.box.x,
            top: member.box.y,
            width: member.box.width,
          } as const)
        : {},
  };
}

export interface BreadcrumbItemProps extends React.ComponentProps<"li"> {}

function BreadcrumbItem({ className, children, ...props }: BreadcrumbItemProps) {
  const { node, ref } = useMotionHostRef<HTMLLIElement>(props.ref);
  const cm = useCadenceMotion(node);
  const crumb = useCrumb(node, cm);
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
      ref={ref}
      data-motion={cm.mode}
      data-ending-style={crumb.present ? undefined : ""}
      aria-hidden={crumb.present ? props["aria-hidden"] : true}
      inert={!crumb.present || props.inert || undefined}
      style={{ ...crumb.style, ...props.style }}
    >
      {children}
    </li>
  );
}

/** A caller palette this owner cannot verify keeps its paint immediate. */
const layoutClass =
  /^(?:[\w-]+:)*(?:w-|h-|size-|min-|max-|p[xytrblse]?-|m[xytrblse]?-|gap-|flex|inline-|block|grid|shrink|grow|basis-|items-|justify-|self-|order-|relative|absolute|fixed|sticky|inset-|top-|bottom-|left-|right-|overflow-|truncate|whitespace-)/;

function knownPalette(className: unknown, style: unknown) {
  if (typeof className === "function" || typeof style === "function") return false;
  const layoutOnly =
    !className ||
    String(className)
      .split(/\s+/)
      .every((name) => layoutClass.test(name));
  const knownStyle =
    !style ||
    !Object.keys(style as object).some((key) =>
      /color|background|fill|stroke|shadow|filter|blend|opacity|^--(?!motion-|cadence-|ease-)/i.test(key),
    );
  return layoutOnly && knownStyle;
}

export interface BreadcrumbLinkProps extends useRender.ComponentProps<"a"> {}

/**
 * `render` (Base UI) is how a client-side router link gets in: pass the router's
 * own link element and keep `data-slot="breadcrumb-link"`.
 *
 * A direct plain label is one owned display host, so only changed graphemes are
 * replaced. Rich children and `render` callbacks keep their own structure.
 */
function BreadcrumbLink({ className, children, render, ...props }: BreadcrumbLinkProps) {
  const { node, ref } = useMotionHostRef<HTMLAnchorElement>(props.ref);
  const cm = useCadenceMotion(node);
  const [entity] = useState(() => ({}));
  const paint = useStateColor(ref, cm, ["color"], {
    readability: "verified",
    immediate: !knownPalette(className, props.style),
  });
  const plain = typeof children === "string" || typeof children === "number";
  return (
    <BreadcrumbLinkHost
      {...props}
      {...paint}
      data-slot="breadcrumb-link"
      data-motion={cm.mode}
      render={render}
      className={cn("hover:text-foreground", className)}
      style={{ ...paint.style, ...props.style }}
    >
      {plain ? <BreadcrumbLinkText value={String(children)} entity={entity} /> : children}
    </BreadcrumbLinkHost>
  );
}

/** Base render adapter: one physical anchor, no wrapper and no second ref. */
function BreadcrumbLinkHost({ className, render, ...props }: BreadcrumbLinkProps) {
  return useRender({
    defaultTagName: "a",
    props: mergeProps<"a">({ className }, props),
    render,
    // `state` is what emits `data-slot` — Base UI converts state keys to data-* attributes.
    state: { slot: "breadcrumb-link" },
  });
}

function BreadcrumbLinkText({ value, entity }: { value: string; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useTextPresentation(node, value, cm, entity, { characterStagger: false });
  return (
    <span ref={ref} data-slot="breadcrumb-link-text" data-motion={cm.mode}>
      {text}
    </span>
  );
}

export interface BreadcrumbPageProps extends React.ComponentProps<"span"> {}

function BreadcrumbPage({ className, children, ...props }: BreadcrumbPageProps) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>(props.ref);
  const cm = useCadenceMotion(node);
  const [entity] = useState(() => ({}));
  const paint = useStateColor(ref, cm, ["color"], {
    readability: "verified",
    immediate: !knownPalette(className, props.style),
  });
  const plain = typeof children === "string" || typeof children === "number";
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      {...props}
      {...paint}
      data-motion={cm.mode}
      className={cn("font-normal text-foreground", className)}
      style={{ ...paint.style, ...props.style }}
    >
      {plain ? <BreadcrumbPageText value={String(children)} entity={entity} /> : children}
    </span>
  );
}

function BreadcrumbPageText({ value, entity }: { value: string; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useTextPresentation(node, value, cm, entity, { characterStagger: false });
  return (
    <span ref={ref} data-slot="breadcrumb-page-text" data-motion={cm.mode}>
      {text}
    </span>
  );
}

export interface BreadcrumbSeparatorProps extends React.ComponentProps<"li"> {}

function BreadcrumbSeparator({ children, className, ...props }: BreadcrumbSeparatorProps) {
  const { node, ref } = useMotionHostRef<HTMLLIElement>(props.ref);
  const cm = useCadenceMotion(node);
  const crumb = useCrumb(node, cm);
  const paint = useStateColor(ref, cm, ["color"], {
    readability: "verified",
    immediate: !knownPalette(className, props.style),
  });
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      {...props}
      {...paint}
      data-motion={cm.mode}
      data-ending-style={crumb.present ? undefined : ""}
      inert={!crumb.present || props.inert || undefined}
      className={cn("[&>svg]:size-3.5", className)}
      style={{ ...paint.style, ...crumb.style, ...props.style }}
    >
      {children ?? <ChevronRight />}
    </li>
  );
}

export interface BreadcrumbEllipsisProps extends React.ComponentProps<"span"> {}

/** The collapsed middle of a deep trail; put a `DropdownMenu` trigger beside it. */
function BreadcrumbEllipsis({ className, ...props }: BreadcrumbEllipsisProps) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>(props.ref);
  const cm = useCadenceMotion(node);
  const crumb = useCrumb(node, cm);
  const paint = useStateColor(ref, cm, ["color"], {
    readability: "verified",
    immediate: !knownPalette(className, props.style),
  });
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      {...props}
      {...paint}
      data-motion={cm.mode}
      data-ending-style={crumb.present ? undefined : ""}
      inert={!crumb.present || props.inert || undefined}
      className={cn("flex size-9 items-center justify-center", className)}
      style={{ ...paint.style, ...crumb.style, ...props.style }}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">More</span>
    </span>
  );
}

export {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
};
