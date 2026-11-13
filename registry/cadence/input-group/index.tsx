// biome-ignore-all lint/a11y/useSemanticElements: the frame and the addon are divs with role="group" so they can wrap an input, a textarea, or a button set without changing the markup per control.
// biome-ignore-all lint/a11y/useKeyWithClickEvents: the click handler only moves focus into the control; keyboard users tab there directly, so no key equivalent is owed.
"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { AnimatePresence, useIsPresent, usePresence } from "motion/react";
import type * as React from "react";
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useInsertionEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Button } from "../button";
import { Input } from "../input";
import { createGroupPositions, type GroupPosition } from "../lib/button-group-layout";
import { cn } from "../lib/cn";
import { useStateColor } from "../lib/css-motion";
import { createInlineEntrance } from "../lib/inline-entrance";
import { createInlinePresence } from "../lib/inline-presence";
import { createMeasuredGeometry, type GeometryDestination, naturalGeometry } from "../lib/measured-geometry";
import { bindMotionParameters, geometryCompact, layoutCompact, motionLimits } from "../lib/motion";
import {
  createPresentationScope,
  documentPresentation,
  MotionPresentation,
  usePresentationScope,
} from "../lib/motion-presence";
import { useMotionHostRef } from "../lib/motion-ref";
import type { MotionRevision } from "../lib/motion-transaction";
import { useCadenceMotion } from "../lib/provider";
import { useNumberPresentation } from "../lib/use-number-presentation";
import { useTextPresentation } from "../lib/use-text-presentation";
import { Textarea } from "../textarea";

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;
const subscribe = () => () => {};

type Scope = ReturnType<typeof createPresentationScope>;
const Group = createContext<{
  scope: Scope;
  present: boolean;
  request(): void;
  attach(
    host: HTMLElement,
    project: (from: GroupPosition, to: GroupPosition, revision: MotionRevision, animate: boolean) => void,
  ): () => void;
} | null>(null);

export interface InputGroupProps extends React.ComponentProps<"div"> {}

/**
 * A field with furniture: a prefix, a unit, a button, a keyboard hint.
 *
 * The frame is the presentation owner for insertion, surface paint and its own
 * block size; the controls keep native editing, caret and selection. Membership
 * is retained only for keyed children, so a keyed addon can fade out while an
 * unkeyed one is removed immediately — the group never invents an identity.
 */
function InputGroup({ className, style, children, ...props }: InputGroupProps) {
  const { node } = useMotionHostRef<HTMLDivElement>(props.ref);
  const cm = useCadenceMotion(node);
  // Caller palettes are unverified; unknown paint settles at its target.
  // The frame paints its own chrome. Foreground belongs to the control and the
  // display text, so this list never claims `color`.
  const paint = useStateColor(
    node,
    cm,
    [
      "background-color",
      "border-top-color",
      "border-right-color",
      "border-bottom-color",
      "border-left-color",
      "box-shadow",
    ],
    {
      readability: surfaceVerified(className, style) ? "verified" : "immediate",
    },
  );
  const parent = usePresentationScope();
  const present = useIsPresent();
  const [scope] = useState(() => createPresentationScope(node));
  const [geometry] = useState(() => createMeasuredGeometry(scope.transaction));
  // Each addon projects its own retained position; the frame only publishes the
  // committed boxes, so no component writes another component's transform.
  const projections = useRef(
    new Map<
      HTMLElement,
      (from: GroupPosition, to: GroupPosition, revision: MotionRevision, animate: boolean) => void
    >(),
  );
  const hydrated = useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  );
  const firstHydration = useRef(hydrated);
  const consumed = useRef(false);
  const entrance = useRef<ReturnType<typeof createInlineEntrance> | null>(null);
  const release = useRef<(() => void) | null>(null);
  const registered = useRef<HTMLDivElement | null>(null);
  const boxes = useRef(new Map<HTMLElement, GroupPosition>());
  const signature = useRef("");
  const captured = useRef(0);
  const alive = useRef(true);
  const pending = useRef(false);
  const flush = useRef(() => {});
  const members = Children.toArray(children);
  let keyed = true;
  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.key === null) keyed = false;
  });
  const request = useRef(() => {
    if (pending.current) return;
    pending.current = true;
    queueMicrotask(() => {
      pending.current = false;
      if (alive.current) flush.current();
    });
  });
  useEffect(() => {
    if (!parent && node.current) documentPresentation(node.current.ownerDocument).presented = true;
  }, [parent, node]);
  committed(() => {
    const host = node.current;
    if (!host) return;
    const baseline = parent ?? documentPresentation(host.ownerDocument);
    if (!entrance.current) entrance.current = createInlineEntrance(host);
    const visible = host.checkVisibility
      ? host.checkVisibility({ visibilityProperty: true, contentVisibilityAuto: true })
      : host.getClientRects().length > 0;
    // A presenting parent owns this entrance; an unusable or hidden host keeps
    // native paint instead of fading an already-visible frame.
    const inherited =
      !visible ||
      Boolean(host.closest('[hidden],[inert],[aria-hidden="true"]')) ||
      !baseline.available() ||
      baseline.node?.current?.hasAttribute("data-starting-style");
    entrance.current.commit({
      present,
      cm: inherited ? { ...cm, timeScale: 0 } : cm,
      enter: !consumed.current && !firstHydration.current && baseline.presented && !inherited,
    });
    consumed.current = true;
    if (registered.current !== host) {
      release.current?.();
      release.current = null;
      registered.current = host;
      release.current = geometry.register({
        host: node,
        content: host,
        // The inline size is parent-owned (`w-full`); only the block axis is an
        // owned, addon/content-driven frame extent.
        axes: ["height"],
        observeChildren: true,
        measure: (reason) => frameHeight(host, reason, captured.current),
      });
    }
    flush.current();
  });
  flush.current = () => {
    const host = node.current;
    if (!host) return;
    const tracked = [...host.children].filter(
      (child): child is HTMLElement =>
        child instanceof HTMLElement &&
        ["input-group-addon", "input-group-button"].includes(child.getAttribute("data-slot") ?? "") &&
        !child.hasAttribute("data-ending-style") &&
        !child.hasAttribute("hidden"),
    );
    const next = JSON.stringify([
      cm.mode,
      cm.timeScale,
      cm.scope.signature,
      present,
      tracked.map((child) => [
        child.getAttribute("data-slot"),
        child.getAttribute("data-align"),
        child.className,
        child.textContent,
      ]),
    ]);
    const previous = signature.current;
    signature.current = next;
    const changed = previous !== "" && previous !== next;
    const available =
      present &&
      scope.available() &&
      captured.current === 0 &&
      !editor(host) &&
      host.children.length + 1 <= motionLimits.collectionVisuals;
    const parameters = cm.parameters(bindMotionParameters(geometryCompact, "geometry.resize/measured"));
    if (parameters.kind !== "geometry") return;
    const measured = new Map<HTMLElement, GroupPosition>();
    if (available) {
      const root = host.getBoundingClientRect();
      for (const child of tracked) {
        const box = child.getBoundingClientRect();
        measured.set(child, { x: box.x - root.x, y: box.y - root.y, width: box.width, height: box.height });
      }
    }
    const revision = scope.transaction.revision("content", next, host);
    geometry.commit(revision, {
      reduced: cm.reduced,
      transition: parameters.transition,
      available,
    });
    // Every commit publishes the current revision, so a retained addon settles
    // its own projection instead of keeping a superseded one alive.
    for (const [element, project] of projections.current) {
      const to = measured.get(element) ?? boxes.current.get(element),
        from = boxes.current.get(element) ?? to;
      if (to && from) project(from, to, revision, available && changed);
    }
    if (available) boxes.current = measured;
  };
  committed(() => {
    const host = node.current;
    const doc = host?.ownerDocument;
    if (!doc || !host) return;
    // Frame geometry yields to the editor: a pointer, a composition or a focused
    // editor settles the frame before paint instead of moving its content box.
    const hold = () => {
      captured.current++;
      geometry.settle();
    };
    const release_ = () => {
      captured.current = Math.max(0, captured.current - 1);
      request.current();
    };
    const focus = () => {
      if (editor(host)) geometry.settle();
      request.current();
    };
    const passive = () => {
      signature.current = "";
      geometry.settle();
      request.current();
    };
    host.addEventListener("pointerdown", hold, true);
    host.addEventListener("compositionstart", hold, true);
    host.addEventListener("focusin", focus, true);
    host.addEventListener("focusout", release_, true);
    doc.addEventListener("pointerup", release_, true);
    doc.addEventListener("pointercancel", release_, true);
    doc.addEventListener("compositionend", release_, true);
    doc.addEventListener("scroll", passive, true);
    doc.defaultView?.addEventListener("resize", passive);
    return () => {
      host.removeEventListener("pointerdown", hold, true);
      host.removeEventListener("compositionstart", hold, true);
      host.removeEventListener("focusin", focus, true);
      host.removeEventListener("focusout", release_, true);
      doc.removeEventListener("pointerup", release_, true);
      doc.removeEventListener("pointercancel", release_, true);
      doc.removeEventListener("compositionend", release_, true);
      doc.removeEventListener("scroll", passive, true);
      doc.defaultView?.removeEventListener("resize", passive);
    };
  }, []);
  committed(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      entrance.current?.dispose();
      entrance.current = null;
      release.current?.();
      release.current = null;
      geometry.dispose();
      boxes.current.clear();
      projections.current.clear();
      registered.current = null;
    };
  }, []);
  return (
    <MotionPresentation scope={scope}>
      <Group.Provider
        value={{
          scope,
          present,
          request: request.current,
          attach(host, project) {
            projections.current.set(host, project);
            return () => projections.current.delete(host);
          },
        }}
      >
        <div
          data-slot="input-group"
          role="group"
          {...props}
          {...paint}
          data-motion={cm.mode}
          className={cn(
            "group/input-group relative flex w-full min-w-0 items-center rounded-md border border-input shadow-xs outline-none dark:bg-input/30",
            "h-9 has-[>textarea]:h-auto",

            // Alignment decides which side the control gives up padding on.
            "has-[>[data-align=inline-start]]:[&>input]:pl-2",
            "has-[>[data-align=inline-end]]:[&>input]:pr-2",
            "has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>[data-align=block-start]]:[&>input]:pb-3",
            "has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-end]]:[&>input]:pt-3",

            // Focus and invalid state are borrowed from the control, not owned here.
            "has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-[3px] has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50",
            "has-[[data-slot][aria-invalid=true]]:border-destructive has-[[data-slot][aria-invalid=true]]:ring-destructive/20 dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40",

            className,
          )}
          style={{ ...paint.style, ...style }}
        >
          {keyed ? <AnimatePresence initial={false}>{members}</AnimatePresence> : members}
        </div>
      </Group.Provider>
    </MotionPresentation>
  );
}

/** Unknown palettes commit at their target rather than through unreadable paint. */
function surfaceVerified(className: InputGroupProps["className"], style: InputGroupProps["style"]) {
  if (typeof className === "function" || typeof style === "function") return false;
  if (
    Object.keys(style ?? {}).some((key) =>
      /color|background|shadow|opacity|filter|blend|^--(?!motion-|cadence-|ease-)/i.test(key),
    )
  )
    return false;
  return !(typeof className === "string" ? className : "")
    .split(/\s+/)
    .some(
      (name) =>
        /(?:^|:)(?:bg-|text-|border-|shadow-|ring-)/.test(name) &&
        !/(?:^|:)(?:border-(?:input|ring|destructive)|shadow-xs|bg-input\/30|ring-(?:ring\/50|destructive\/(?:20|40)|\[3px\]))$/.test(
          name,
        ),
    );
}

const inputGroupAddonVariants = cva(
  "flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-sm font-medium text-muted-foreground select-none group-data-[disabled=true]/input-group:opacity-50 [&>kbd]:rounded-[calc(var(--radius)-5px)] [&>svg:not([class*='size-'])]:size-4",
  {
    variants: {
      align: {
        "inline-start": "order-first pl-3 has-[>button]:ml-[-0.45rem] has-[>kbd]:ml-[-0.35rem]",
        "inline-end": "order-last pr-3 has-[>button]:mr-[-0.45rem] has-[>kbd]:mr-[-0.35rem]",
        "block-start":
          "order-first w-full justify-start px-3 pt-3 group-has-[>input]/input-group:pt-2.5 [.border-b]:pb-3",
        "block-end": "order-last w-full justify-start px-3 pb-3 group-has-[>input]/input-group:pb-2.5 [.border-t]:pt-3",
      },
    },
    defaultVariants: {
      align: "inline-start",
    },
  },
);

export interface InputGroupAddonProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof inputGroupAddonVariants> {}

/**
 * The furniture around the control. Clicking it focuses the input — unless the
 * click landed on a button, which has its own job, or the caller cancelled it.
 *
 * Presence is its own opacity channel: a later-inserted addon fades in, a
 * retained one fades out, and the frame's geometry stays the group's business.
 */
function InputGroupAddon({ className, align = "inline-start", children, onClick, ...props }: InputGroupAddonProps) {
  const { node, ref } = useMotionHostRef<HTMLDivElement>(props.ref);
  const cm = useCadenceMotion(node);
  const group = useContext(Group);
  const [present, remove] = usePresence();
  const delivery = useRef({ ready: false, pending: false, present, complete: remove });
  useInsertionEffect(() => {
    Object.assign(delivery.current, { ready: false, present, complete: remove });
  });
  useEffect(() => {
    const entry = delivery.current;
    entry.ready = true;
    // A zero-clock layout completion precedes the parent's presence bookkeeping.
    if (entry.pending && !entry.present) entry.complete?.();
    entry.pending = false;
  });
  const hydrated = useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  );
  const firstHydration = useRef(hydrated);
  const consumed = useRef(false);
  const lifecycle = useRef<ReturnType<typeof createInlinePresence> | null>(null);
  const registered = useRef<HTMLDivElement | null>(null);
  // The addon owns its own projected position: the frame publishes committed
  // boxes, and no component writes another component's transform.
  const [positions] = useState(() => createGroupPositions(group?.scope.transaction));
  const projection = useRef({ cm, present });
  projection.current = { cm, present };
  const plain = typeof children === "string" || typeof children === "number";
  useEffect(() => {
    const host = node.current;
    if (!host || !group) return;
    return group.attach(host, (from, to, revision, animate) => {
      const current = projection.current;
      const parameters = current.cm.parameters(bindMotionParameters(layoutCompact, "layout.move/position"));
      if (parameters.kind !== "layout") return;
      positions.commit({
        host: node,
        revision,
        cm: current.cm,
        boxes: new Map([[host, to]]),
        from: new Map([[host, from]]),
        available: animate,
        axis: "x",
      });
    });
  }, [group, node, positions]);
  committed(() => {
    const host = node.current;
    if (!host) return;
    if (registered.current !== host) {
      lifecycle.current?.dispose();
      lifecycle.current = createInlinePresence(host, group?.scope.transaction);
      registered.current = host;
    }
    const baseline = group?.scope ?? documentPresentation(host.ownerDocument);
    const visible = host.checkVisibility
      ? host.checkVisibility({ visibilityProperty: true, contentVisibilityAuto: true })
      : host.getClientRects().length > 0;
    const inherited =
      !visible ||
      Boolean(host.closest('[hidden],[inert],[aria-hidden="true"]')) ||
      !baseline.available() ||
      baseline.node?.current?.hasAttribute("data-starting-style");
    lifecycle.current?.commit({
      present,
      cm: inherited ? { ...cm, timeScale: 0 } : cm,
      enter: !consumed.current && !firstHydration.current && (group?.present ?? true) && !inherited,
      complete: () => {
        const entry = delivery.current;
        if (entry.present) return;
        if (entry.ready) entry.complete?.();
        else entry.pending = true;
      },
    });
    consumed.current = true;
    group?.request();
  });
  committed(
    () => () => {
      lifecycle.current?.dispose();
      lifecycle.current = null;
      registered.current = null;
      positions.dispose();
      group?.request();
    },
    [],
  );
  return (
    <div
      role="group"
      data-slot="input-group-addon"
      data-align={align}
      {...props}
      ref={ref}
      data-motion={cm.mode}
      data-ending-style={present ? undefined : ""}
      inert={!present || props.inert || undefined}
      aria-hidden={present ? props["aria-hidden"] : true}
      className={cn(inputGroupAddonVariants({ align }), className)}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if ((event.target as HTMLElement).closest("button")) {
          return;
        }
        event.currentTarget.parentElement?.querySelector("input")?.focus();
      }}
    >
      {plain ? (
        typeof children === "number" ? (
          <GroupNumber value={children} />
        ) : (
          <GroupText value={children} />
        )
      ) : (
        children
      )}
    </div>
  );
}

const inputGroupButtonVariants = cva("flex items-center gap-2 text-sm shadow-none", {
  variants: {
    size: {
      xs: "h-6 gap-1 rounded-[calc(var(--radius)-5px)] px-2 has-[>svg]:px-2 [&>svg:not([class*='size-'])]:size-3.5",
      sm: "h-8 gap-1.5 rounded-md px-2.5 has-[>svg]:px-2.5",
      "icon-xs": "size-6 rounded-[calc(var(--radius)-5px)] p-0 has-[>svg]:p-0",
      "icon-sm": "size-8 p-0 has-[>svg]:p-0",
    },
  },
  defaultVariants: {
    size: "xs",
  },
});

export interface InputGroupButtonProps
  extends Omit<React.ComponentProps<typeof Button>, "size">,
    VariantProps<typeof inputGroupButtonVariants> {
  type?: "button" | "submit" | "reset";
}

/**
 * A button inside the frame. It sizes itself from the addon scale rather than the
 * page scale, so a clear button does not tower over a 36px field.
 *
 * It renders Button itself, so the composed action keeps Button's own
 * `data-slot="button"` and owners; a caller may retarget the slot (Combobox names
 * it `input-group-button`), but the group contract still points at Button's host.
 */
function InputGroupButton({
  className,
  type = "button",
  variant = "ghost",
  size = "xs",
  ...props
}: InputGroupButtonProps) {
  return (
    <Button
      type={type}
      variant={variant}
      size={size}
      className={(state) =>
        cn(inputGroupButtonVariants({ size }), typeof className === "function" ? className(state) : className)
      }
      {...props}
    />
  );
}

export interface InputGroupTextProps extends React.ComponentProps<"span"> {}

/** Display text in the frame; owns its foreground and its changed runs. */
function InputGroupText({ className, style, children, ...props }: InputGroupTextProps) {
  const { node } = useMotionHostRef<HTMLSpanElement>(props.ref);
  const cm = useCadenceMotion(node);
  const paint = useStateColor(node, cm, ["color"], { readability: "verified" });
  const plain = typeof children === "string" || typeof children === "number";
  return (
    <span
      data-slot="input-group-text"
      {...props}
      {...paint}
      data-motion={cm.mode}
      className={cn(
        "flex items-center gap-2 text-sm text-muted-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      style={{ ...paint.style, ...style }}
    >
      {plain ? (
        typeof children === "number" ? (
          <GroupNumber value={children} />
        ) : (
          <GroupText value={children} />
        )
      ) : (
        children
      )}
    </span>
  );
}

/** Only a known plain label supplies an independent changed-run owner. */
function GroupText({ value }: { value: string }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const group = useContext(Group);
  const entity = useRef({});
  const text = useTextPresentation(
    node,
    value,
    cm,
    entity.current,
    { characterStagger: false, stripGeometry: true, visible: group?.present ?? true },
    group?.scope.transaction,
  );
  return (
    <span ref={ref} data-slot="input-group-label" data-motion={cm.mode}>
      {text}
    </span>
  );
}

function GroupNumber({ value }: { value: number }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const group = useContext(Group);
  const entity = useRef({});
  const text = useNumberPresentation(
    node,
    value,
    cm,
    entity.current,
    { compact: true, visible: group?.present ?? true, retainEditedContent: true, cause: "independent" },
    group?.scope.transaction,
  );
  return (
    <span ref={ref} data-slot="input-group-number" data-motion={cm.mode}>
      {text}
    </span>
  );
}

export interface InputGroupInputProps extends React.ComponentProps<"input"> {}

/**
 * The control, stripped of its own chrome: `data-slot="input-group-control"` is
 * what the frame's `:has()` selectors watch for focus and invalid state. The
 * composition names its native element, so the editor stays an `<input>` and
 * never becomes a second, non-native editing surface.
 */
function InputGroupInput({ className, ...props }: InputGroupInputProps) {
  return (
    <Input
      data-slot="input-group-control"
      {...props}
      render={<input />}
      className={cn(
        "flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent",
        className,
      )}
    />
  );
}

export interface InputGroupTextareaProps extends React.ComponentProps<"textarea"> {}

function InputGroupTextarea({ className, ...props }: InputGroupTextareaProps) {
  return (
    <Textarea
      data-slot="input-group-control"
      {...props}
      className={cn(
        "flex-1 resize-none rounded-none border-0 bg-transparent py-3 shadow-none focus-visible:ring-0 dark:bg-transparent",
        className,
      )}
    />
  );
}

/** A focused editor owns its own box; a captured pointer or IME owns it too. */
function editor(host: HTMLElement | null) {
  if (!host) return false;
  const active = host.ownerDocument.activeElement;
  if (!active || !host.contains(active)) return false;
  return Boolean(active.closest("input,textarea,[contenteditable]:not([contenteditable=false])"));
}

/** Only a committed, editor-free frame is interpolated, and only when readable. */
function frameHeight(host: HTMLDivElement, reason: string, captured: number): GeometryDestination | null {
  if (reason !== "commit" || !host.isConnected || captured > 0) return null;
  if (editor(host)) return null;
  const box = naturalGeometry(host);
  const css = host.ownerDocument.defaultView?.getComputedStyle(host);
  if (!box || !css) return null;
  if (callerHeightClock(host, css)) return null;
  const min = boundedLength(css.minHeight) ?? 0;
  const max = boundedLength(css.maxHeight) ?? Number.POSITIVE_INFINITY;
  if (max < min) return null;
  return {
    height: {
      size: box.height,
      min,
      max,
      readable: host.scrollHeight <= Math.ceil(box.height),
      independent: true,
    },
  };
}

function boundedLength(value: string) {
  return /^\d+(?:\.\d+)?px$/.test(value) ? Number.parseFloat(value) : null;
}

/** A caller transition or animation on the block axis owns its own clock. */
function callerHeightClock(host: HTMLElement, css: CSSStyleDeclaration) {
  const family = css.transitionProperty.split(",").map((property) => property.trim());
  const times = css.transitionDuration.split(",").map(Number.parseFloat);
  if (
    family.some(
      (property, index) => (property === "all" || property === "height") && (times[index % times.length] ?? 0) > 0,
    )
  )
    return true;
  return (host.getAnimations?.() ?? [])
    .slice(0, motionLimits.collectionVisuals)
    .some((handle) =>
      ((handle.effect as KeyframeEffect | null)?.getKeyframes() ?? []).some((frame) => "height" in frame),
    );
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
  inputGroupAddonVariants,
  inputGroupButtonVariants,
};
