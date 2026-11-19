"use client";

import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from "lucide-react";
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
import { type ButtonProps, buttonVariants } from "../button";
import { createGroupPositions, type GroupPosition } from "../lib/button-group-layout";
import { cn } from "../lib/cn";
import { useStateColor } from "../lib/css-motion";
import { createInlineEntrance } from "../lib/inline-entrance";
import { createInlinePresence } from "../lib/inline-presence";
import { createMeasuredGeometry, type GeometryDestination, naturalGeometry } from "../lib/measured-geometry";
import { bindMotionParameters, geometryCompact, layoutCompact, layoutSelection, motionLimits } from "../lib/motion";
import {
  createPresentationScope,
  documentPresentation,
  MotionPresentation,
  usePresentationScope,
} from "../lib/motion-presence";
import { type MotionHostRef, useMotionHostRef } from "../lib/motion-ref";
import { createMotionTransaction, type MotionRevision } from "../lib/motion-transaction";
import { type CadenceMotion, useCadenceMotion } from "../lib/provider";
import { createSelectionProjection, type SelectionBox } from "../lib/selection-projection";
import { nativeTextContext } from "../lib/text-layout";
import { useTextPresentation } from "../lib/use-text-presentation";

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;
const subscribe = () => () => {};
type Scope = ReturnType<typeof createPresentationScope>;

/** A caller that adds its own colour, response or filter paint keeps the native
 * cascade: no library colour clock and no shared decoration may claim that palette. */
const callerPaint =
  /(?:^|:)(?:bg|text|border|ring|shadow|fill|stroke|from|via|to|decoration|outline|accent|caret|divide|placeholder|selection)-/;

function knownPalette(className: unknown, style: unknown) {
  if (typeof className === "function" || typeof style === "function") return false;
  const layoutOnly =
    !className ||
    String(className)
      .split(/\s+/)
      .filter(Boolean)
      .every((name) => !callerPaint.test(name));
  const knownStyle =
    !style ||
    !Object.keys(style as object).some((key) =>
      /color|background|fill|stroke|shadow|filter|blend|opacity|^--(?!motion-|cadence-|ease-)/i.test(key),
    );
  return layoutOnly && knownStyle;
}

/** One retained destination: its own presence channel, its own projection. */
type Member = {
  host: MotionHostRef<HTMLElement>;
  cm: CadenceMotion;
  positions: ReturnType<typeof createGroupPositions>;
  present: boolean;
  box?: GroupPosition | null;
};

type Trail = {
  scope: Scope;
  present: boolean;
  members: Map<object, Member>;
  request(passive?: boolean): void;
  forget(identity: object): void;
};
const TrailContext = createContext<Trail | null>(null);

const SURFACE_HINT =
  "pointer-events-none absolute inset-0 -z-10 rounded-[inherit] border bg-background shadow-xs dark:border-input dark:bg-input/30";
const MARKER =
  "pointer-events-none absolute -z-10 rounded-md border bg-background shadow-xs dark:border-input dark:bg-input/30";

function boxWithin(node: HTMLElement, list: HTMLElement, rect: DOMRect, scale: number): GroupPosition {
  const box = node.getBoundingClientRect();
  return {
    x: (box.left - rect.left) / scale + list.scrollLeft,
    y: (box.top - rect.top) / scale + list.scrollTop,
    width: box.width / scale,
    height: box.height / scale,
  };
}

/** The marker may only leave its own content coordinate space when every
 * ancestor between it and the list keeps an untransformed, positively scaled box. */
function pathSafe(link: HTMLElement, list: HTMLElement) {
  for (let node: HTMLElement | null = link; node && node !== list; node = node.parentElement) {
    const css = node.ownerDocument.defaultView?.getComputedStyle(node);
    if (!css) return false;
    if (css.rotate !== "none" || css.perspective !== "none" || css.transform.startsWith("matrix3d")) return false;
    if (css.scale !== "none" && css.scale.split(/\s+/).some((value) => !(Number.parseFloat(value) > 0))) return false;
    if (css.transform !== "none") {
      if (typeof DOMMatrixReadOnly === "undefined") return false;
      const matrix = new DOMMatrixReadOnly(css.transform);
      if (matrix.b !== 0 || matrix.c !== 0 || matrix.a <= 0 || matrix.d <= 0) return false;
    }
  }
  return true;
}

function paginationDestination(host: HTMLElement): GeometryDestination | null {
  if (nativeTextContext(host)) return null;
  const view = host.ownerDocument.defaultView;
  const css = view?.getComputedStyle(host);
  const box = naturalGeometry(host);
  if (!view || !css || !box || !(box.height > 0)) return null;
  if (!["auto", "fit-content", "max-content"].includes(host.computedStyleMap?.().get("height")?.toString() ?? ""))
    return null;
  if (css.aspectRatio !== "auto" || !css.display.includes("flex")) return null;
  if (css.flexWrap && css.flexWrap !== "nowrap") return null;
  const parts = Array.from(host.children).filter(
    (child) => !(child as HTMLElement).hasAttribute("data-pagination-indicator"),
  );
  if (!parts.length || parts.length > motionLimits.collectionVisuals) return null;
  const family = css.transitionProperty.split(",").map((value) => value.trim());
  const durations = css.transitionDuration.split(",").map(Number.parseFloat);
  if (
    family.some(
      (property, index) => ["all", "height"].includes(property) && (durations[index % durations.length] ?? 0) > 0,
    ) ||
    host
      .getAnimations()
      .some((animation) =>
        (animation.effect as KeyframeEffect | null)?.getKeyframes().some((frame) => "height" in frame),
      )
  )
    return null;
  const rect = host.getBoundingClientRect();
  const scale = rect.height / host.offsetHeight;
  if (!Number.isFinite(scale) || scale <= 0) return null;
  return {
    height: { size: box.height, min: box.height, max: Number.POSITIVE_INFINITY, readable: true, independent: true },
  };
}

/**
 * One committed range revision. The content measures the mounted destinations once,
 * each retained destination projects from its own previous box, the content owns its
 * block height and one decoration follows the single active link.
 */
function createPaginationTrail(input: {
  host: MotionHostRef<HTMLElement>;
  marker: MotionHostRef<HTMLElement>;
  members: Map<object, Member>;
  transaction: ReturnType<typeof createMotionTransaction>;
  geometry: ReturnType<typeof createMeasuredGeometry>;
  latest: () => { cm: CadenceMotion; present: boolean; available: boolean };
}) {
  let alive = true;
  let queued = false;
  let passive = false;
  /* The projection is a committed owner: create it inside the layout pass, never in
   * the deferred flush, so its execution scope belongs to the mounted export. */
  let projection: ReturnType<typeof createSelectionProjection> | null = input.marker.current
    ? createSelectionProjection(input.marker, input.transaction)
    : null;
  const selection = new Map<object, string | null>();
  const flush = () => {
    const list = input.host.current;
    const active = input.latest();
    if (!list || !alive) {
      /* A passive request may land after the host or the trail is gone. */
    } else {
      const entries: { identity: object; member: Member; node: HTMLElement }[] = [];
      for (const [identity, member] of input.members) {
        const node = member.host.current;
        if (!node || !node.isConnected || node.parentElement !== list) continue;
        if (entries.length >= motionLimits.collectionVisuals) {
          passive = true;
          break;
        }
        entries.push({ identity, member, node });
      }
      const links = Array.from(
        list.querySelectorAll<HTMLElement>('a[data-slot="pagination-link"][aria-current="page"]'),
      );
      const signature = JSON.stringify([
        entries.map(({ node }) => [
          node.getAttribute("data-slot"),
          (node.textContent ?? "").slice(0, 96),
          node.childElementCount,
        ]),
        links.map((link) => [link.getAttribute("href"), (link.textContent ?? "").slice(0, 48)]),
      ]);
      const revision = input.transaction.revision("content", signature, list);
      const rect = list.getBoundingClientRect();
      const scale = list.offsetWidth > 0 && rect.width > 0 ? rect.width / list.offsetWidth : 1;
      const bounded =
        rect.width > 0 && Number.isFinite(scale) && scale > 0 && entries.length <= motionLimits.collectionVisuals;
      const available = !passive && bounded && active.available;
      const markerHost = input.marker.current;
      const only = links.length === 1 ? links[0] : null;
      const palette =
        list.getAttribute("data-cadence-palette") === "known" &&
        (!only || only.getAttribute("data-cadence-palette") !== "caller");
      const target: SelectionBox | null =
        only && palette && available && markerHost && pathSafe(only, list) ? boxWithin(only, list, rect, scale) : null;
      const readable = Boolean(target) && target !== null && target.width > 0 && target.height > 0 && target.y >= 0;
      if (markerHost) markerHost.hidden = !readable;

      const geometry = active.cm.parameters(bindMotionParameters(geometryCompact, "geometry.resize/measured"));
      if (geometry.kind === "geometry")
        input.geometry.commit(revision, {
          reduced: active.cm.reduced,
          transition: geometry.transition,
          available: active.present && available,
        });

      for (const { member, node } of entries) {
        const previous = member.positions.prepare();
        const from = new Map<HTMLElement, GroupPosition>();
        const before = previous.get(node);
        if (before) from.set(node, before);
        const box = boxWithin(node, list, rect, scale);
        member.box = box;
        member.positions.commit({
          host: member.host,
          revision,
          cm: member.cm,
          boxes: new Map([[node, box]]),
          from,
          available: available && !member.cm.reduced,
          axis: "x",
        });
      }

      if (markerHost) {
        if (!projection) {
          markerHost.hidden = true;
          projection = createSelectionProjection(input.marker, input.transaction);
        }
        const identity = only
          ? JSON.stringify([only.getAttribute("href"), only.textContent ?? "", markerHost.getAttribute("data-slot")])
          : "";
        const previous = selection.get(list) ?? null;
        const next = identity ? input.transaction.revision("state", identity, list) : null;
        if (previous !== identity || !next) {
          selection.set(list, identity);
          if (!next) projection.invalidate();
        }
        if (next) {
          const parameters = active.cm.parameters(bindMotionParameters(layoutSelection, "layout.shared/selection"));
          const transition = parameters.kind === "layout" ? parameters.transition : { duration: 0 };
          projection.commit(
            next as MotionRevision,
            readable ? target : null,
            transition,
            active.cm.reduced || !readable,
          );
        }
      }
      list.toggleAttribute("data-marker-ready", readable);
    }
  };
  const request = (isPassive = false) => {
    passive ||= isPassive;
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      if (alive) flush();
      passive = false;
    });
  };
  return {
    request: request,
    forget(identity: object) {
      input.members.delete(identity);
    },
    dispose() {
      alive = false;
      projection?.dispose();
      projection = null;
    },
  };
}

export interface PaginationProps extends React.ComponentProps<"nav"> {}

/**
 * Page navigation for a list that is longer than one screen. The destination links
 * stay stable; only a committed range/selection revision owns motion.
 *
 * a11y: the `nav` is labelled "pagination". The current page is a link with
 * `aria-current="page"` — either a real `href` or, for local state, an
 * `onClick` that changes it.
 */
function Pagination({ className, ...props }: PaginationProps) {
  return (
    <nav
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

export interface PaginationContentProps extends React.ComponentProps<"ul"> {}

/**
 * The surviving owner of one range revision. It measures final link boxes once after
 * a committed membership, label or active-target change, keeps the list's own block
 * size and publishes one active decoration.
 */
function PaginationContent({ className, children, ...props }: PaginationContentProps) {
  const { node, ref } = useMotionHostRef<HTMLUListElement>(props.ref);
  const { node: markerNode, ref: markerRef } = useMotionHostRef<HTMLLIElement>();
  const cm = useCadenceMotion(node);
  const markerCm = useCadenceMotion(markerNode);
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
    const members = new Map<object, Member>();
    const transaction = createMotionTransaction();
    return { members, transaction, geometry: createMeasuredGeometry(transaction) };
  });
  const markerPaint = useStateColor(
    markerRef,
    markerCm,
    [
      "background-color",
      "border-top-color",
      "border-right-color",
      "border-bottom-color",
      "border-left-color",
      "box-shadow",
    ],
    { readability: "verified" },
  );
  const trail = useRef<ReturnType<typeof createPaginationTrail> | null>(null);
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
          measure: () => paginationDestination(host),
        }),
      };
    }
    if (!trail.current)
      trail.current = createPaginationTrail({
        host: node,
        marker: markerNode,
        members: owned.members,
        transaction: owned.transaction,
        geometry: owned.geometry,
        latest: () => latest.current,
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
        <ul
          data-slot="pagination-content"
          data-cadence-palette={knownPalette(className, props.style) ? "known" : "caller"}
          className={cn("group/pagination relative isolate flex flex-row items-center gap-1", className)}
          {...props}
          ref={ref}
          data-motion={cm.mode}
          data-ending-style={present ? undefined : ""}
          aria-hidden={present ? props["aria-hidden"] : true}
          inert={!present || props.inert || undefined}
        >
          <li
            aria-hidden="true"
            role="presentation"
            data-slot="pagination-active-indicator"
            data-pagination-indicator=""
            className={MARKER}
            {...markerPaint}
          />
          {children}
        </ul>
      </TrailContext.Provider>
    </MotionPresentation>
  );
}

/** One retained destination: its own presence channel and its own projection. */
function useMember(node: MotionHostRef<HTMLElement>, cm: CadenceMotion) {
  const trail = useContext(TrailContext);
  const parent = usePresentationScope();
  const [entity] = useState(() => ({}));
  const [positions] = useState(() => createGroupPositions(trail?.scope.transaction));
  const [member] = useState<Member>(() => ({ host: node, cm, positions, present: true }));
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
    /** A leaving destination keeps a noninteractive visual at its last committed box. */
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

export interface PaginationItemProps extends React.ComponentProps<"li"> {}

function PaginationItem({ className, children, ...props }: PaginationItemProps) {
  const { node, ref } = useMotionHostRef<HTMLLIElement>(props.ref);
  const cm = useCadenceMotion(node);
  const member = useMember(node, cm);
  return (
    <li
      data-slot="pagination-item"
      className={cn(className)}
      {...props}
      ref={ref}
      data-motion={cm.mode}
      data-ending-style={member.present ? undefined : ""}
      aria-hidden={member.present ? props["aria-hidden"] : true}
      inert={!member.present || props.inert || undefined}
      style={{ ...member.style, ...props.style }}
    >
      {children}
    </li>
  );
}

/** One plain label on the stable link node. Only changed graphemes are replaced. */
function PageLabel({ value, entity, className }: { value: string; entity: object; className?: string }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useTextPresentation(node, value, cm, entity, { characterStagger: false });
  return (
    <span ref={ref} data-slot="pagination-link-text" data-motion={cm.mode} className={className}>
      {text}
    </span>
  );
}

export interface PaginationLinkProps extends React.ComponentProps<"a"> {
  /** Marks the current page: outline instead of ghost, plus `aria-current="page"`. */
  isActive?: boolean;
  /** Reuses the button's size scale; `icon` by default. */
  size?: ButtonProps["size"];
}

function plainAnchor(className: string | undefined, isActive: boolean, size: PaginationLinkProps["size"]) {
  return cn(buttonVariants({ variant: isActive ? "outline" : "ghost", size }), "aria-disabled:opacity-50", className);
}

/**
 * Always an anchor: pagination is navigation, so the control has to be announced
 * as a link. The shape comes from `buttonVariants` rather than from `Button`,
 * because Base UI's button applies `role="button"` to any element it renders —
 * see the deviation note in docs/parity-plan.md §7.2.
 *
 * Surface and foreground paints are disjoint properties of one colour owner.
 * A known caller palette lets a local decoration stand in for the active fill;
 * the content publishes the shared decoration over it when the active path is safe.
 */
function PaginationLink({ className, children, isActive, size = "icon", ...props }: PaginationLinkProps) {
  const { node, ref } = useMotionHostRef<HTMLAnchorElement>(props.ref);
  const cm = useCadenceMotion(node);
  const [entity] = useState(() => ({}));
  const known = knownPalette(className, props.style);
  const linkPaint = useStateColor(
    ref,
    cm,
    [
      /* Surface and foreground: Previous/Next labels inherit this clock. */
      "background-color",
      "color",
      "border-top-color",
      "border-right-color",
      "border-bottom-color",
      "border-left-color",
      "box-shadow",
    ],
    {
      readability: "verified",
      immediate: !known,
    },
  );
  const plain = typeof children === "string" || typeof children === "number";
  return (
    <a
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      data-variant={isActive ? "outline" : "ghost"}
      data-size={size}
      data-cadence-palette={known ? "known" : "caller"}
      {...props}
      {...linkPaint}
      data-motion={cm.mode}
      className={cn(
        plainAnchor(className, Boolean(isActive), size),
        isActive && known
          ? "relative isolate border-transparent bg-transparent shadow-none hover:bg-transparent dark:border-transparent dark:bg-transparent dark:hover:bg-transparent"
          : null,
      )}
      style={{ ...linkPaint.style, ...props.style }}
    >
      {isActive && known ? (
        <span aria-hidden="true" data-slot="pagination-link-fallback" className={SURFACE_HINT} />
      ) : null}
      {plain ? <PageLabel value={String(children)} entity={entity} /> : children}
    </a>
  );
}

/** Previous/Next keep the real pagination-link host, but their foreground is inherited
 * from that same anchor rather than starting a second colour clock. */
function NeighbourLink({ className, children, isActive, size = "default", ...props }: PaginationLinkProps) {
  const { node, ref } = useMotionHostRef<HTMLAnchorElement>(props.ref);
  const cm = useCadenceMotion(node);
  return (
    <a
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      data-variant={isActive ? "outline" : "ghost"}
      data-size={size}
      data-cadence-palette="caller"
      {...props}
      ref={ref}
      data-motion={cm.mode}
      className={plainAnchor(className, Boolean(isActive), size)}
    >
      {children}
    </a>
  );
}

export interface PaginationPreviousProps extends React.ComponentProps<typeof PaginationLink> {
  /** Label text; hidden below `sm`, where the chevron carries the meaning. */
  text?: string;
}

function PaginationPrevious({ className, text = "Previous", ...props }: PaginationPreviousProps) {
  const [entity] = useState(() => ({}));
  return (
    <NeighbourLink
      aria-label="Go to previous page"
      size="default"
      className={cn("gap-1 px-2.5 sm:pl-2.5", className)}
      {...props}
    >
      <ChevronLeftIcon />
      <PageLabel value={text} entity={entity} className="hidden sm:block" />
    </NeighbourLink>
  );
}

export interface PaginationNextProps extends React.ComponentProps<typeof PaginationLink> {
  text?: string;
}

function PaginationNext({ className, text = "Next", ...props }: PaginationNextProps) {
  const [entity] = useState(() => ({}));
  return (
    <NeighbourLink
      aria-label="Go to next page"
      size="default"
      className={cn("gap-1 px-2.5 sm:pr-2.5", className)}
      {...props}
    >
      <PageLabel value={text} entity={entity} className="hidden sm:block" />
      <ChevronRightIcon />
    </NeighbourLink>
  );
}

export interface PaginationEllipsisProps extends React.ComponentProps<"span"> {}

/** A skipped range. It is not a link: it is hidden from assistive tech and says nothing. */
function PaginationEllipsis({ className, children, ...props }: PaginationEllipsisProps) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>(props.ref);
  const cm = useCadenceMotion(node);
  const member = useMember(node, cm);
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
      ref={ref}
      data-motion={cm.mode}
      data-ending-style={member.present ? undefined : ""}
      inert={!member.present || props.inert || undefined}
      style={{ ...member.style, ...props.style }}
    >
      <MoreHorizontalIcon className="size-4" />
      <span className="sr-only">More pages</span>
      {children}
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
