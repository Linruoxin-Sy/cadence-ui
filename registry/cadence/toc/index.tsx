"use client";

import { animate, type Transition, useMotionValue } from "motion/react";
import { type ComponentProps, useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "../lib/cn";
import { useCadenceMotion } from "../lib/provider";

const useCommittedEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
type Placement = { id: string; top: number; height: number; railHeight: number };
type ScrollFlight = { cancel: () => void; finish: () => void; retime: (transition: Transition) => void };
function samePlacement(a: Placement | null, b: Placement | null) {
  return a?.id === b?.id && a?.top === b?.top && a?.height === b?.height && a?.railHeight === b?.railHeight;
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
  const cm = useCadenceMotion();
  const [trackedId, setTrackedId] = useState<string>();
  const [trackingReady, setTrackingReady] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const indicator = useRef<HTMLSpanElement>(null);
  const placements = useRef(new Map<string, Placement>());
  const [placement, setPlacement] = useState<Placement | null>(null);
  const top = useMotionValue(0);
  const bottom = useMotionValue(0);
  const placed = useRef(false);
  const flight = useRef<ScrollFlight | null>(null);
  const restoreFocus = useRef<(() => void) | null>(null);
  const currentId = activeId ?? (items.some(({ id }) => id === trackedId) ? trackedId : items[0]?.id);
  const navigation = cm.transition("scroll.navigate");
  const navigationClock = JSON.stringify(navigation);
  useCommittedEffect(() => {
    if (cm.reduced || navigation.duration === 0) flight.current?.finish();
    else flight.current?.retime(navigation);
  }, [cm.reduced, navigationClock]);
  useCommittedEffect(
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
    let done = false;
    const write = (value: number) => {
      if (done) return;
      const options = { top: value, left, behavior: "instant" as const };
      if (scroller) scroller.scrollTo(options);
      else window.scrollTo(options);
    };
    if (cm.reduced || navigation.duration === 0) {
      write(destination);
      focusHeading(target);
      return;
    }

    let controls: { stop: () => void } | undefined;
    const cleanup = () => {
      done = true;
      controls?.stop();
      for (const name of ["wheel", "touchstart", "pointerdown", "resize", "popstate", "hashchange"]) {
        window.removeEventListener(name, cancel);
      }
      window.removeEventListener("keydown", keydown);
      if (flight.current === current) flight.current = null;
    };
    const cancel = () => {
      if (!done) cleanup();
    };
    const finish = () => {
      if (done) return;
      write(destination);
      cleanup();
      focusHeading(target);
    };
    const keydown = (event: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " ", "Escape", "Tab"].includes(event.key))
        cancel();
    };
    const retime = (transition: Transition) => {
      if (done) return;
      controls?.stop();
      controls = animate(read(), destination, { ...transition, onUpdate: write, onComplete: finish });
    };
    const current: ScrollFlight = { cancel, finish, retime };
    flight.current = current;
    for (const name of ["wheel", "touchstart", "pointerdown", "resize", "popstate", "hashchange"]) {
      window.addEventListener(name, cancel, { passive: true });
    }
    window.addEventListener("keydown", keydown);
    retime(navigation);
  };

  useCommittedEffect(() => {
    const element = track.current;
    if (!element) return;
    const links = [...element.querySelectorAll<HTMLAnchorElement>("[data-toc-id]")];
    const measure = () => {
      const railHeight = element.offsetHeight;
      if (!railHeight) return; // A collapsed disclosure supplies no usable geometry.
      const next = new Map<string, Placement>();
      for (const link of links) {
        const id = link.dataset.tocId ?? "";
        next.set(id, { id, top: link.offsetTop, height: link.offsetHeight, railHeight });
      }
      placements.current = next;
      const target = next.get(currentId ?? "") ?? null;
      setPlacement((previous) => (samePlacement(previous, target) ? previous : target));
    };
    // Cached coordinates let a selection change retarget before paint, without a layout read.
    const cached = placements.current.get(currentId ?? "") ?? null;
    setPlacement((previous) => (samePlacement(previous, cached) ? previous : cached));
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    for (const link of links) observer.observe(link);
    return () => observer.disconnect();
  }, [currentId, items]);

  const transition = cm.transition("layout.shared");
  const clock = JSON.stringify(transition);
  const ready = Boolean(placement && placement.id === currentId && (activeId !== undefined || trackingReady));
  useCommittedEffect(() => {
    const element = indicator.current;
    if (!element || !placement) {
      placed.current = false;
      return;
    }
    if (!ready) return;
    const write = () => {
      if (cm.reduced) {
        element.style.transform = "none";
        element.style.top = `${placement.top}px`;
        element.style.height = `${placement.height}px`;
      } else {
        const start = Math.max(0, Math.min(placement.railHeight, top.get()));
        const end = Math.max(start, Math.min(placement.railHeight, bottom.get()));
        element.style.top = "";
        element.style.height = "";
        element.style.transform = `translateY(${start}px) scaleY(${end - start})`;
      }
    };
    const unlistenTop = top.on("change", write);
    const unlistenBottom = bottom.on("change", write);
    if (!placed.current || cm.reduced || transition.duration === 0) {
      top.jump(placement.top);
      bottom.jump(placement.top + placement.height);
      write();
    } else {
      // Explicit velocities survive cancellation/retargeting on the same values.
      animate(top, placement.top, { ...transition, velocity: top.getVelocity() });
      animate(bottom, placement.top + placement.height, { ...transition, velocity: bottom.getVelocity() });
      write();
    }
    placed.current = true;
    return () => {
      top.stop();
      bottom.stop();
      unlistenTop();
      unlistenBottom();
    };
  }, [placement, ready, cm.reduced, cm.mode, clock, top, bottom]);

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

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Delegates native anchor clicks, including keyboard-generated Enter activation.
    <nav
      aria-label={label}
      data-slot="toc"
      data-motion={cm.mode}
      className={cn("min-w-0 text-sm", className)}
      onClick={navigate}
      {...props}
    >
      <p data-slot="toc-title" className="mb-3 font-medium text-foreground">
        {label}
      </p>
      <div ref={track} data-slot="toc-track" className="relative">
        <span
          aria-hidden="true"
          data-slot="toc-rail"
          className="pointer-events-none absolute inset-y-0 left-0 w-px overflow-hidden"
        >
          <span
            ref={indicator}
            data-slot="toc-indicator"
            data-motion={cm.mode}
            className="absolute left-0 top-0 h-px w-px origin-top bg-foreground"
            style={{ visibility: ready ? "visible" : "hidden" }}
          />
        </span>
        <ol data-slot="toc-list" className="flex flex-col gap-1 border-l border-border">
          {items.map(({ id, title, depth = 2 }) => (
            <li key={id} data-slot="toc-item">
              <a
                data-slot="toc-link"
                data-toc-id={id}
                data-depth={depth}
                href={`#${encodeURIComponent(id)}`}
                aria-current={id === currentId ? "location" : undefined}
                className={cn(
                  "-ml-px block border-l border-transparent py-1 pl-4 pr-2 text-muted-foreground break-words hover:text-foreground focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  depth === 3 && "pl-7",
                  id === currentId && "font-medium text-foreground",
                  id === currentId && !ready && "border-foreground",
                )}
              >
                {title}
              </a>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
