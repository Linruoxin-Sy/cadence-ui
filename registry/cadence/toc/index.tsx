"use client";

import { type ComponentProps, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "../lib/cn";
import { useStateColor } from "../lib/css-motion";
import { createInlineEntrance } from "../lib/inline-entrance";
import { createMeasuredGeometry, type GeometryDestination, naturalGeometry } from "../lib/measured-geometry";
import { bindMotionParameters, geometryCompact, layoutSelection, motionLimits } from "../lib/motion";
import { documentPresentation } from "../lib/motion-presence";
import { useMotionHostRef } from "../lib/motion-ref";
import { createMotionTransaction } from "../lib/motion-transaction";
import { useCadenceMotion, useCadenceMotionScope, useEngineEnvironment, withCadenceScope } from "../lib/provider";
import {
  createScrollFlight,
  type ScrollFlight,
  scrollNavigationClock,
  writeNativeScroll,
} from "../lib/scroll-navigation";
import { createSelectionProjection, type SelectionBox } from "../lib/selection-projection";
import { nativeTextContext } from "../lib/text-layout";
import { useTextPresentation } from "../lib/use-text-presentation";

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Track-local coordinates of one entry, cached for a selection retarget. */
type Placement = { id: string; top: number; height: number; railHeight: number };
function samePlacement(a: Placement | null, b: Placement | null) {
  return a?.id === b?.id && a?.top === b?.top && a?.height === b?.height && a?.railHeight === b?.railHeight;
}

/** The indicator's box in the track's own content plane, clamped to the rail. */
function indicatorBox(placement: Placement | null): SelectionBox | null {
  if (!placement || !(placement.railHeight > 0)) return null;
  const rail = placement.railHeight;
  const top = Math.max(0, Math.min(rail, placement.top));
  const bottom = Math.max(top, Math.min(rail, placement.top + placement.height));
  if (!(bottom > top)) return null;
  return { x: 0, y: top, width: 1, height: bottom - top };
}

/** Known-content block size of the entry list: natural `auto` height, no caller
 * dimension engine and no continuous rewrap. Anything unresolved stays native. */
function tocListDestination(host: HTMLElement): GeometryDestination | null {
  if (nativeTextContext(host)) return null;
  const view = host.ownerDocument.defaultView;
  const css = view?.getComputedStyle(host);
  const box = naturalGeometry(host);
  if (!view || !css || !box || !(box.height > 0)) return null;
  if (!["auto", "fit-content", "max-content"].includes(host.computedStyleMap?.().get("height")?.toString() ?? ""))
    return null;
  if (css.aspectRatio !== "auto" || !css.display.includes("flex") || css.flexDirection !== "column") return null;
  if (css.flexWrap && css.flexWrap !== "nowrap") return null;
  const entries = Array.from(host.children);
  if (!entries.length || entries.length > motionLimits.collectionVisuals) return null;
  let depth = 0;
  for (let ancestor: HTMLElement | null = host; ancestor; ancestor = ancestor.parentElement) {
    if (++depth > motionLimits.collectionVisuals) return null;
    const style = view.getComputedStyle(ancestor);
    if (style.rotate !== "none" || style.perspective !== "none") return null;
    if (style.scale !== "none" && style.scale.split(/\s+/).some((value) => !(Number.parseFloat(value) > 0)))
      return null;
    if (style.transform !== "none") {
      if (typeof DOMMatrixReadOnly === "undefined") return null;
      const matrix = new DOMMatrixReadOnly(style.transform);
      if (matrix.b !== 0 || matrix.c !== 0 || matrix.a <= 0 || matrix.d <= 0) return null;
    }
  }
  const properties = css.transitionProperty.split(",").map((value) => value.trim());
  const durations = css.transitionDuration.split(",").map(Number.parseFloat);
  if (
    properties.some(
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
  // The final entries must stay fully readable while the host is still smaller.
  const required = Math.max(0, ...entries.map((entry) => (entry.getBoundingClientRect().bottom - rect.top) / scale));
  return {
    height: {
      size: box.height,
      min: Math.min(box.height, required),
      max: Number.POSITIVE_INFINITY,
      readable: true,
      independent: true,
    },
  };
}

export interface TocEntry {
  /** The heading's DOM id, without the leading #. */
  id: string;
  title: string;
  depth?: 2 | 3;
}

export interface TocProps extends Omit<ComponentProps<"nav">, "children"> {
  items: readonly TocEntry[];
  label?: string;
  /** Supply this to own the active section and disable automatic tracking. */
  activeId?: string;
  /** Viewport offset used by scroll tracking; match the headings' scroll margin. */
  scrollOffset?: number;
}

/** One persistent reading indicator; links retain native navigation and immediate state. */
export function Toc({
  items,
  label = "On this page",
  activeId,
  scrollOffset = 96,
  className,
  onClick,
  ...props
}: TocProps) {
  const { cm, ref: scopeRef, element } = useCadenceMotionScope(props.ref);
  const [trackedId, setTrackedId] = useState<string>();
  const [trackingReady, setTrackingReady] = useState(false);
  const flight = useRef<ScrollFlight | null>(null);
  const settleIndicator = useRef(() => {});
  const cancelFlight = useRef(() => {
    flight.current?.cancel();
    settleIndicator.current();
  });
  const cancelIndicator = useRef(() => settleIndicator.current());
  useEngineEnvironment(element, cancelIndicator.current);
  const navigationEnvironment = useEngineEnvironment(element, cancelFlight.current, false);
  const restoreFocus = useRef<(() => void) | null>(null);
  const currentId = activeId ?? (items.some(({ id }) => id === trackedId) ? trackedId : items[0]?.id);
  const navigation = scrollNavigationClock(cm);
  const navigationClock = JSON.stringify(navigation);
  const entrance = useRef<ReturnType<typeof createInlineEntrance> | null>(null);
  const entranceHost = useRef<HTMLElement | null>(null);
  const entered = useRef(new Set<HTMLElement>());
  const hydration = useSyncExternalStore(
    () => () => {},
    () => false,
    () => true,
  );
  const initialHydration = useRef(hydration);

  useEffect(() => {
    // The document baseline is not an application event bus: it only marks that a
    // later insertion is an entrance rather than the initial, already-visible navigation.
    if (typeof document !== "undefined") documentPresentation(document).presented = true;
  });

  committed(() => {
    const host = element;
    if (!host) return;
    if (entranceHost.current !== host) {
      entrance.current?.dispose();
      entrance.current = null;
      entranceHost.current = host;
    }
    if (!entrance.current) entrance.current = createInlineEntrance(host);
    const baseline = documentPresentation(host.ownerDocument);
    const enter =
      !initialHydration.current &&
      baseline.presented &&
      baseline.available() &&
      !entered.current.has(host) &&
      !host.hasAttribute("data-starting-style");
    entrance.current.commit({
      present: true,
      enter,
      cm: nativeTextContext(host) ? { ...cm, timeScale: 0 } : cm,
    });
    entered.current.add(host);
    baseline.presented = true;
  }, [element, cm.mode, cm.timeScale, cm.scope.signature]);

  committed(
    () => () => {
      entrance.current?.dispose();
      entrance.current = null;
      entranceHost.current = null;
    },
    [],
  );

  committed(() => {
    const active = flight.current;
    if (!active) return;
    if (navigationEnvironment.blocked.current) active.cancel();
    else if (cm.reduced || navigation.duration === 0) active.finish();
    else active.retime(navigation);
  }, [cm.reduced, navigationClock]);

  committed(
    () => () => {
      flight.current?.cancel();
      restoreFocus.current?.();
    },
    [],
  );

  const focusHeading = (target: HTMLElement) => {
    restoreFocus.current?.();
    if (!target.hasAttribute("tabindex")) {
      target.setAttribute("tabindex", "-1");
      const restore = () => {
        if (target.getAttribute("tabindex") === "-1") target.removeAttribute("tabindex");
        target.removeEventListener("blur", restore);
        if (restoreFocus.current === restore) restoreFocus.current = null;
      };
      restoreFocus.current = restore;
      target.addEventListener("blur", restore, { once: true });
    }
    target.focus({ preventScroll: true });
  };

  const navigate: NonNullable<ComponentProps<"nav">["onClick"]> = (event) => {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      event.shiftKey
    )
      return;
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[data-toc-id]") : null;
    if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;
    const target = document.getElementById(link.dataset.tocId ?? "");
    if (!target) return;

    // Measure once at activation, then write scroll offsets without per-frame layout reads.
    let host: HTMLElement | null = target.parentElement;
    while (host && host !== document.body && host !== document.documentElement) {
      if (/(auto|scroll|hidden)/.test(getComputedStyle(host).overflowY) && host.scrollHeight > host.clientHeight) break;
      host = host.parentElement;
    }
    const scroller = host && host !== document.body && host !== document.documentElement ? host : null;
    const read = () => (scroller ? scroller.scrollTop : window.scrollY);
    const left = scroller ? scroller.scrollLeft : window.scrollX;
    const margin = Number.parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
    const padding = Number.parseFloat(getComputedStyle(scroller ?? document.documentElement).scrollPaddingTop) || 0;
    const relativeTop =
      target.getBoundingClientRect().top - (scroller ? scroller.getBoundingClientRect().top + scroller.clientTop : 0);
    const limit = Math.max(
      0,
      scroller
        ? scroller.scrollHeight - scroller.clientHeight
        : document.documentElement.scrollHeight - window.innerHeight,
    );
    const destination = Math.max(0, Math.min(limit, read() + relativeTop - margin - padding));
    event.preventDefault();
    flight.current?.cancel();

    const previousURL = window.location.href;
    const url = new URL(previousURL);
    url.hash = link.hash;
    if (url.href !== previousURL) {
      window.history.pushState(window.history.state, "", url);
      window.dispatchEvent(new HashChangeEvent("hashchange", { oldURL: previousURL, newURL: url.href }));
    }
    if (cm.reduced || navigation.duration === 0 || navigationEnvironment.blocked.current) {
      writeNativeScroll(scroller, destination, left);
      focusHeading(target);
      return;
    }
    flight.current = createScrollFlight(
      {
        target,
        scroller,
        destination,
        left,
        read,
        focus: () => focusHeading(target),
        retire: (ended) => {
          if (flight.current === ended) flight.current = null;
        },
      },
      navigation,
    );
  };

  useEffect(() => {
    if (activeId !== undefined || items.length === 0) return;

    const headings = items.flatMap(({ id }) => {
      const element = document.getElementById(id);
      return element ? [element] : [];
    });
    const update = () => {
      let current = headings[0]?.id;
      for (const heading of headings) {
        // Native anchor alignment can round to a fractional CSS pixel.
        if (heading.getBoundingClientRect().top > scrollOffset + 1) break;
        current = heading.id;
      }
      // Short final sections cannot always reach the top of the viewport.
      if (window.scrollY > 0 && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1) {
        current = headings.at(-1)?.id;
      }
      setTrackedId(current);
      setTrackingReady(true);
    };

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    // The initial observer notification also handles deep links after layout.
    const observer = new ResizeObserver(update);
    observer.observe(document.documentElement);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      observer.disconnect();
    };
  }, [items, activeId, scrollOffset]);

  if (!items.length) return null;

  return withCadenceScope(
    cm,
    // biome-ignore lint/a11y/useKeyWithClickEvents: Delegates native anchor clicks, including keyboard-generated Enter activation.
    <nav
      aria-label={label}
      data-slot="toc"
      data-motion={cm.mode}
      className={cn("min-w-0 text-sm transition-none", className)}
      onClick={navigate}
      {...props}
      ref={scopeRef}
    >
      <TocTitle label={label} />
      <TocTrack
        items={items}
        currentId={currentId}
        ready={activeId !== undefined || trackingReady}
        settle={settleIndicator}
      />
    </nav>,
  );
}

/** The visible title is an owned string: unchanged graphemes survive a rename. */
function TocTitle({ label }: { label: string }) {
  const { node, ref } = useMotionHostRef<HTMLParagraphElement>();
  const cm = useCadenceMotion(node);
  const [entity] = useState(() => ({}));
  const text = useTextPresentation(node, label, cm, entity, { characterStagger: false });
  return (
    <p ref={ref} data-slot="toc-title" data-motion={cm.mode} className="mb-3 font-medium text-foreground">
      {text}
    </p>
  );
}

/**
 * The track owns the two independent decorations: one persistent indicator that
 * follows the active entry, and one measured block size for a known entries/label
 * revision. Passive reading never resizes the shell and never navigates.
 */
function TocTrack({
  items,
  currentId,
  ready,
  settle,
}: {
  items: readonly TocEntry[];
  currentId: string | undefined;
  ready: boolean;
  settle: { current: () => void };
}) {
  const { node: indicatorNode, ref: indicatorRef } = useMotionHostRef<HTMLSpanElement>();
  const indicatorCm = useCadenceMotion(indicatorNode);
  const railPaint = useStateColor(indicatorRef, indicatorCm, ["background-color"], { readability: "verified" });
  const { node: listNode, ref: listRef } = useMotionHostRef<HTMLOListElement>();
  const listCm = useCadenceMotion(listNode);
  const track = useRef<HTMLDivElement>(null);
  const placements = useRef(new Map<string, Placement>());
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [owned] = useState(() => {
    const transaction = createMotionTransaction();
    return { transaction, geometry: createMeasuredGeometry(transaction) };
  });
  const holder = useRef<{
    node: HTMLElement;
    identity?: object;
    controller: ReturnType<typeof createSelectionProjection>;
  } | null>(null);
  const registered = useRef<{ host: HTMLElement; identity?: object; release(): void } | null>(null);
  const placed = useRef(false);
  const signature = JSON.stringify(items.map(({ id, title, depth = 2 }) => [id, title, depth]));

  committed(() => {
    const element = track.current;
    if (!element) return;
    const links = [...element.querySelectorAll<HTMLAnchorElement>("[data-toc-id]")];
    const measure = () => {
      const railHeight = element.offsetHeight;
      const next = new Map<string, Placement>();
      for (const link of links)
        next.set(link.dataset.tocId ?? "", {
          id: link.dataset.tocId ?? "",
          top: link.offsetTop,
          height: link.offsetHeight,
          railHeight,
        });
      placements.current = next;
      const target = next.get(currentId ?? "") ?? null;
      setPlacement((previous) => (samePlacement(previous, target) ? previous : target));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    for (const link of links) observer.observe(link);
    return () => observer.disconnect();
  }, [items]);

  // Passive reading only selects a cached entry box; it never reads layout again.
  committed(() => {
    const cached = placements.current.get(currentId ?? "") ?? null;
    setPlacement((previous) => (samePlacement(previous, cached) ? previous : cached));
  }, [currentId]);

  const bounded = items.length <= motionLimits.collectionVisuals;
  const destination = bounded && ready ? indicatorBox(placement) : null;
  const selectionClock = indicatorCm.parameters(bindMotionParameters(layoutSelection, "layout.shared/selection"));
  const selection = selectionClock.kind === "layout" ? selectionClock.transition : { duration: 0 };

  committed(() => {
    const node = indicatorNode.current;
    if (!node) return;
    // A re-attached ref is a new committed owner: the projection keeps the identity it
    // was created with, so a replaced host must get its own registration.
    if (holder.current?.node !== node || holder.current.identity !== indicatorNode.identity) {
      holder.current?.controller.dispose();
      holder.current = {
        node,
        identity: indicatorNode.identity,
        controller: createSelectionProjection(indicatorNode, owned.transaction),
      };
    }
    const projection = holder.current.controller;
    // Initial placement and a reappearance after a cleared selection jump; later
    // selection changes are the only ones that travel.
    if (!destination) placed.current = false;
    const revision = owned.transaction.revision(
      "value",
      destination ? `${placement?.id}:${destination.y}:${destination.height}` : null,
      node,
    );
    // A spring has no numeric duration: only an explicit zero clock is immediate.
    projection.commit(
      revision,
      destination,
      selection,
      indicatorCm.reduced || !destination || selection.duration === 0 || !placed.current,
    );
    if (destination) placed.current = true;
    settle.current = () => projection.cancel();
  });

  committed(
    () => () => {
      holder.current?.controller.dispose();
      holder.current = null;
      settle.current = () => {};
    },
    [owned, settle],
  );

  committed(() => {
    const host = listNode.current;
    if (!host) return;
    if (registered.current?.host !== host || registered.current.identity !== listNode.identity) {
      registered.current?.release();
      registered.current = {
        host,
        identity: listNode.identity,
        release: owned.geometry.register({
          host: listNode,
          content: host,
          axes: ["height"],
          observeChildren: true,
          measure: () => tocListDestination(host),
        }),
      };
    }
    const revision = owned.transaction.revision("content", signature, host);
    const parameters = listCm.parameters(bindMotionParameters(geometryCompact, "geometry.resize/measured"));
    if (parameters.kind !== "geometry") return;
    owned.geometry.commit(revision, {
      reduced: listCm.reduced || !bounded,
      transition: parameters.transition,
      available: bounded,
    });
  });

  committed(
    () => () => {
      registered.current?.release();
      registered.current = null;
      owned.geometry.dispose();
    },
    [owned],
  );

  return (
    <div ref={track} data-slot="toc-track" className="relative">
      <span
        aria-hidden="true"
        data-slot="toc-rail"
        className="pointer-events-none absolute inset-y-0 left-0 w-px overflow-hidden"
      >
        <span data-slot="toc-indicator" className="absolute left-0 top-0 bg-foreground" {...railPaint} />
      </span>
      <ol
        data-slot="toc-list"
        data-motion={listCm.mode}
        ref={listRef}
        className="flex flex-col gap-1 border-l border-border"
      >
        {items.map(({ id, title, depth = 2 }) => (
          <li key={id} data-slot="toc-item">
            <TocLink id={id} title={title} depth={depth} active={id === currentId} ready={ready} />
          </li>
        ))}
      </ol>
    </div>
  );
}

/** One retained entry: a real link with its own foreground clock and its own label. */
function TocLink({
  id,
  title,
  depth,
  active,
  ready,
}: {
  id: string;
  title: string;
  depth: 2 | 3;
  active: boolean;
  ready: boolean;
}) {
  const { node, ref } = useMotionHostRef<HTMLAnchorElement>();
  const cm = useCadenceMotion(node);
  const { node: labelNode, ref: labelRef } = useMotionHostRef<HTMLSpanElement>();
  const labelCm = useCadenceMotion(labelNode);
  const [entity] = useState(() => ({}));
  const paint = useStateColor(ref, cm, ["color"], { readability: "verified" });
  const label = useTextPresentation(labelNode, title, labelCm, entity, { characterStagger: false });
  return (
    <a
      data-slot="toc-link"
      data-toc-id={id}
      data-depth={depth}
      href={`#${encodeURIComponent(id)}`}
      aria-current={active ? "location" : undefined}
      className={cn(
        "-ml-px block border-l border-transparent py-1 pl-4 pr-2 break-words hover:text-foreground focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        depth === 3 && "pl-7",
        active && "font-medium",
        active && !ready && "border-foreground",
      )}
      {...paint}
    >
      <span ref={labelRef} data-slot="toc-link-text" data-motion={labelCm.mode}>
        {label}
      </span>
    </a>
  );
}
