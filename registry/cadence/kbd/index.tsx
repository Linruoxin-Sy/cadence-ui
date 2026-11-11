"use client";

import { AnimatePresence, useIsPresent, usePresence } from "motion/react";
import {
  Children,
  type ComponentProps,
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
import { cn } from "../lib/cn";
import { useStateColor } from "../lib/css-motion";
import { createInlineEntrance } from "../lib/inline-entrance";
import { createInlinePresence } from "../lib/inline-presence";
import { createKbdExtent, createKbdKey, type KbdBox, kbdColourReadable, kbdScale } from "../lib/kbd-layout";
import { naturalGeometry } from "../lib/measured-geometry";
import { motionLimits } from "../lib/motion";
import {
  createPresentationScope,
  documentPresentation,
  MotionPresentation,
  usePresentationScope,
} from "../lib/motion-presence";
import { type MotionHostRef, useMotionHostRef } from "../lib/motion-ref";
import { type CadenceMotion, useCadenceMotion } from "../lib/provider";
import { nativeTextContext } from "../lib/text-layout";
import { useTextPresentation } from "../lib/use-text-presentation";

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;
const subscribe = () => () => {};
type Scope = ReturnType<typeof createPresentationScope>;
type Key = {
  host: HTMLElement;
  controller: ReturnType<typeof createKbdKey>;
  cm: CadenceMotion;
  value: unknown;
  present: boolean;
  box: KbdBox | null;
  exitBox?: KbdBox | null;
};
const Chord = createContext<{ keys: Map<object, Key>; scope: Scope; request(passive?: boolean): void } | null>(null);
const ChordPresent = createContext(true);

export interface KbdProps extends ComponentProps<"kbd"> {}

/** Key names are identities, including numeric labels; never keyboard state. */
function Kbd({ className, children, ...props }: KbdProps) {
  const { node, ref } = useMotionHostRef<HTMLElement>(props.ref);
  const cm = useCadenceMotion(node);
  const group = useContext(Chord);
  const groupPresent = useContext(ChordPresent);
  const parent = usePresentationScope();
  const [scope] = useState(() => createPresentationScope(node));
  const [present, remove] = usePresence();
  const hydrated = useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  );
  const initialHydration = useRef(hydrated),
    consumed = useRef(false);
  const controller = useRef<ReturnType<typeof createKbdKey> | null>(null);
  const record = useRef<Key | null>(null);
  const identity = useRef({});
  const single = useRef<{ value: unknown; policy: string } | null>(null);
  const lifecycle = useRef<ReturnType<typeof createInlinePresence> | null>(null);
  useParentCancellation(node, scope, parent, () =>
    lifecycle.current?.commit({ present, enter: false, cm: { ...cm, timeScale: 0 }, complete: () => remove?.() }),
  );
  const removal = useRef({ present, remove, ready: false, pending: false });
  useInsertionEffect(() => {
    Object.assign(removal.current, { present, remove, ready: false });
  });
  useEffect(() => {
    removal.current.ready = true;
    if (removal.current.pending && !present) remove?.();
    removal.current.pending = false;
  });
  const paint = useStateColor(
    ref,
    cm,
    ["background-color", "color", "border-top-color", "border-right-color", "border-bottom-color", "border-left-color"],
    { readability: "verified", readabilityGate: kbdColourReadable, readabilityScope: (node) => node.parentElement },
  );
  const exitBox =
    !present && group && record.current?.box ? (record.current.exitBox ?? controller.current?.sample()) : null;
  const plain = typeof children === "string" || typeof children === "number";
  useEffect(() => {
    if (!parent && node.current) documentPresentation(node.current.ownerDocument).presented = true;
  }, [parent, node]);
  committed(() => {
    const host = node.current;
    if (!host) return;
    if (!controller.current) controller.current = createKbdKey(node, group?.scope.transaction ?? scope.transaction);
    if (!lifecycle.current)
      lifecycle.current = createInlinePresence(host, group?.scope.transaction ?? scope.transaction);
    if (group && !present) {
      controller.current.prepare();
      if (record.current) record.current.exitBox = exitBox ?? null;
    } else if (record.current) record.current.exitBox = null;
    const baseline = parent ?? documentPresentation(host.ownerDocument);
    lifecycle.current.commit({
      present,
      cm: group && (!groupPresent || !group.scope.available() || (!present && !exitBox)) ? { ...cm, timeScale: 0 } : cm,
      enter:
        !consumed.current &&
        !initialHydration.current &&
        baseline.presented &&
        baseline.available() &&
        !baseline.node?.current?.hasAttribute("data-starting-style"),
      complete: () => {
        const delivery = removal.current;
        if (delivery.present) return;
        if (delivery.ready) delivery.remove?.();
        else delivery.pending = true;
      },
    });
    consumed.current = true;

    if (group) {
      const current = record.current ?? {
        host,
        controller: controller.current,
        cm,
        value: children,
        present,
        box: null,
      };
      Object.assign(current, { host, controller: controller.current, cm, value: children, present });
      record.current = current;
      group.keys.set(identity.current, current);
      group.request();
    } else {
      const policy = JSON.stringify([
        present,
        cm.mode,
        cm.timeScale,
        cm.scope.signature,
        className,
        Object.entries(props.style ?? {}).filter(([key]) => !/color|background|shadow|opacity/i.test(key)),
      ]);
      if (single.current && single.current.value === children && single.current.policy === policy) return;
      single.current = { value: children, policy };
      const origin = controller.current.prepare();
      const box = keyBox(host);
      controller.current.commit({
        revision: scope.transaction.revision("content", children),
        cm,
        destination: box ? { width: box.width, x: 0 } : null,
        origin,
        available:
          present &&
          !cm.reduced &&
          plain &&
          !interactiveParent(host) &&
          baseline.available() &&
          !nativeTextContext(host) &&
          !!kbdScale(host),
        moving: false,
        readable: !clipped(host),
      });
      controller.current.settlePosition();
      if (!baseline.available()) scope.transaction.cancel();
    }
  });
  committed(
    () => () => {
      group?.keys.delete(identity.current);
      group?.request();
      controller.current?.dispose();
      lifecycle.current?.dispose();
      controller.current = null;
      lifecycle.current = null;
    },
    [group],
  );
  return (
    <MotionPresentation scope={scope}>
      <kbd
        {...props}
        {...paint}
        ref={paint.ref}
        data-slot="kbd"
        data-motion={cm.mode}
        data-ending-style={present && groupPresent ? undefined : ""}
        aria-hidden={present && groupPresent ? props["aria-hidden"] : true}
        inert={!present || !groupPresent || props.inert || undefined}
        className={cn(
          "pointer-events-none inline-flex h-5 w-fit min-w-5 shrink-0 items-center justify-center gap-1 rounded-sm bg-muted px-1 font-sans text-xs font-medium whitespace-nowrap text-muted-foreground select-none",
          "[&_svg:not([class*='size-'])]:size-3",
          "[[data-slot=tooltip-content]_&]:bg-background/20 [[data-slot=tooltip-content]_&]:text-background dark:[[data-slot=tooltip-content]_&]:bg-background/10",
          className,
        )}
        style={{
          ...paint.style,
          ...(!present && group
            ? ({
                position: "absolute",
                left: exitBox?.x ?? 0,
                top: 0,
                ...(exitBox ? { width: exitBox.width } : {}),
              } as const)
            : {}),
          ...props.style,
        }}
      >
        {plain ? (
          <KeyText
            value={String(children)}
            scope={group?.scope ?? scope}
            visible={present && groupPresent && (!group || group.scope.available())}
          />
        ) : (
          children
        )}
      </kbd>
    </MotionPresentation>
  );
}

function KeyText({ value, scope, visible }: { value: string; scope: Scope; visible: boolean }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const identity = useRef({});
  const text = useTextPresentation(
    node,
    value,
    cm,
    identity.current,
    { characterStagger: false, visible, stripGeometry: true },
    scope.transaction,
  );
  return (
    <span ref={ref} data-slot="kbd-text" data-motion={cm.mode} className="inline-block shrink-0">
      {text}
    </span>
  );
}

export interface KbdGroupProps extends ComponentProps<"div"> {}

/** Stable caller keys retain native identity through membership revisions. */
function KbdGroup({ className, children, ...props }: KbdGroupProps) {
  const { node, ref } = useMotionHostRef<HTMLElement>(props.ref);
  const strip = useRef<HTMLSpanElement>(null);
  const cm = useCadenceMotion(node);
  const parent = usePresentationScope();
  const present = useIsPresent();
  const [scope] = useState(() => createPresentationScope(node));
  const [group] = useState(() => ({ keys: new Map<object, Key>(), scope, request: (_passive = false) => {} }));
  const hydrated = useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  );
  const initialHydration = useRef(hydrated),
    consumed = useRef(false);
  const presence = useRef<ReturnType<typeof createInlineEntrance> | null>(null);
  useParentCancellation(node, scope, parent, () =>
    presence.current?.commit({ present: false, enter: false, cm: { ...cm, timeScale: 0 } }),
  );
  const connection = useRef<{ flush(passive?: boolean): void; dispose(): void } | null>(null);
  const latest = useRef({ cm, present, children });
  useInsertionEffect(() => {
    if (present) scope.transaction.open();
    else scope.transaction.cancel();
  }, [scope, present]);
  useEffect(() => {
    if (!parent && node.current) documentPresentation(node.current.ownerDocument).presented = true;
  }, [parent, node]);
  committed(() => {
    latest.current = { cm, present, children };
    const host = node.current,
      content = strip.current;
    if (!host || !content) return;
    if (!presence.current) presence.current = createInlineEntrance(host);
    const baseline = parent ?? documentPresentation(host.ownerDocument);
    presence.current.commit({
      present,
      cm,
      enter:
        !consumed.current &&
        !initialHydration.current &&
        baseline.presented &&
        baseline.available() &&
        !baseline.node?.current?.hasAttribute("data-starting-style"),
    });
    consumed.current = true;
    if (!connection.current) {
      const geometry = createKbdExtent(node, content, scope.transaction);
      let alive = true,
        flushing = false,
        signature = "",
        policy = "";
      const richIds = new WeakMap<object, number>();
      const ids = new Map<object, number>();
      let id = 0;
      const redraw = () => {
        const keys = [...group.keys.values()].filter((key) => key.present);
        for (const key of keys) key.controller.write();
        if (!flushing && keys.every((key) => !key.controller.settling)) {
          for (const key of keys) key.controller.settlePosition();
          geometry.releaseAllocation();
        }
      };
      const flush = (passive = false) => {
        if (!alive || node.current !== host) return;
        const keys = [...group.keys.entries()]
          .filter(([, key]) => key.host.isConnected && key.present)
          .sort((a, b) => (a[1].host.compareDocumentPosition(b[1].host) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
        for (const key of ids.keys()) if (!group.keys.has(key)) ids.delete(key);
        const next = JSON.stringify(
          keys.map(([key, record]) => {
            if (!ids.has(key)) ids.set(key, id++);
            if (record.value && typeof record.value === "object" && !richIds.has(record.value))
              richIds.set(record.value, id++);
            return [
              ids.get(key),
              typeof record.value === "string" || typeof record.value === "number"
                ? record.value
                : record.value && typeof record.value === "object"
                  ? richIds.get(record.value)
                  : null,
            ];
          }),
        );
        const current = latest.current;
        const clock = JSON.stringify([
          current.cm.mode,
          current.cm.timeScale,
          current.cm.scope.signature,
          ...keys.map(([, key]) => [key.cm.mode, key.cm.timeScale, key.cm.scope.signature]),
        ]);
        if (!passive && next === signature && clock === policy) return;
        const semantic = signature !== "" && next !== signature;
        signature = next;
        policy = clock;
        const bounded = scope.transaction.preflightVisuals(
          new Set([host, content, ...[...group.keys.values()].map((key) => key.host)]),
        );
        if (!bounded) scope.transaction.cancel();
        const extentOrigin = geometry.prepare();
        const origins = new Map(keys.map(([, key]) => [key, key.controller.prepare()]));
        const scale = kbdScale(host);
        const rect = content.getBoundingClientRect();
        const style = getComputedStyle(content);
        let safe =
          bounded &&
          keys.length <= motionLimits.collectionVisuals &&
          keys.length === content.children.length - [...group.keys.values()].filter((key) => !key.present).length &&
          scale &&
          style.flexDirection === "row" &&
          style.flexWrap === "nowrap" &&
          style.direction === "ltr" &&
          keys.every(
            ([, key]) =>
              typeof key.value === "number" ||
              (typeof key.value === "string" && key.value.length <= motionLimits.changedGraphemes),
          ) &&
          !nativeTextContext(host) &&
          !host.contains(host.ownerDocument.activeElement);
        const boxes = new Map(
          keys.map(([, key]) => {
            if (!bounded) return [key, null] as const;
            const box = key.host.getBoundingClientRect();
            const natural = keyBox(key.host);
            return [key, natural && scale ? { width: natural.width, x: (box.left - rect.left) / scale.x } : null];
          }),
        );
        safe = safe && [...boxes.values()].every(Boolean);
        const revision = scope.transaction.revision("content", next, content);
        geometry.commit({
          cm: current.cm,
          revision,
          destination: naturalGeometry(host)?.width ?? null,
          allocation: naturalGeometry(content)?.width ?? null,
          origin: extentOrigin,
          available: !!safe && semantic && current.present && baseline.available() && !passive,
          clipped: clipped(host),
          delegate: !!host.closest('[data-slot="tooltip-content"]') || interactiveParent(host),
          complete: redraw,
          passive: () => group.request(true),
        });
        const ordered = keys.map(([, key]) => key);
        const overlap = ordered.some((key, index) => {
          const next = ordered[index + 1];
          const a = origins.get(key) ?? boxes.get(key),
            b = next && (origins.get(next) ?? boxes.get(next));
          const target = boxes.get(key);
          return a && b && target && a.x + Math.max(a.width, target.width) > b.x;
        });
        flushing = true;
        for (const key of ordered) {
          const box = boxes.get(key) ?? null;
          const origin = origins.get(key) ?? null;
          key.box = box;
          const before = ordered.slice(0, ordered.indexOf(key));
          key.controller.commit({
            revision,
            cm: key.cm,
            destination: box,
            origin,
            available: !!safe && semantic && current.present && baseline.available() && !passive,
            moving: !overlap,
            readable:
              !overlap &&
              !clipped(host) &&
              (ordered.indexOf(key) > 0 || firstKeyRoom(host, origin?.width ?? 0, box?.width ?? 0)),
            offset: () =>
              before.reduce((sum, sibling) => sum + sibling.controller.width - (sibling.box?.width ?? 0), 0),
            changed: redraw,
            passive: () => group.request(true),
          });
        }
        flushing = false;
        redraw();
      };
      const resize = () => flush(true);
      host.ownerDocument.defaultView?.addEventListener("resize", resize);
      host.ownerDocument.fonts?.addEventListener("loadingdone", resize);
      let queued = false,
        force = false;
      group.request = (passive = false) => {
        force ||= passive;
        if (!queued) {
          queued = true;
          queueMicrotask(() => {
            queued = false;
            const passive = force;
            force = false;
            if (alive) flush(passive);
          });
        }
      };
      connection.current = {
        flush,
        dispose() {
          alive = false;
          group.request = () => {};
          geometry.dispose();
          host.ownerDocument.defaultView?.removeEventListener("resize", resize);
          host.ownerDocument.fonts?.removeEventListener("loadingdone", resize);
        },
      };
    }
    connection.current.flush();
    if (!baseline.available()) scope.transaction.cancel();
  });
  committed(
    () => () => {
      connection.current?.dispose();
      connection.current = null;
      presence.current?.dispose();
      presence.current = null;
    },
    [],
  );
  return (
    <MotionPresentation scope={scope}>
      <Chord.Provider value={group}>
        <ChordPresent.Provider value={present}>
          <kbd
            {...props}
            ref={ref}
            aria-hidden={present ? props["aria-hidden"] : true}
            inert={!present || props.inert || undefined}
            data-slot="kbd-group"
            data-motion={cm.mode}
            data-ending-style={present ? undefined : ""}
            className={cn("inline-flex items-center gap-1", className)}
          >
            <span
              ref={strip}
              data-slot="kbd-strip"
              data-motion={cm.mode}
              className="relative inline-flex shrink-0 items-center gap-[inherit] [flex-flow:inherit] [justify-content:inherit]"
            >
              {Children.toArray(children).every(isValidElement) ? (
                <AnimatePresence initial={false}>{Children.toArray(children)}</AnimatePresence>
              ) : (
                children
              )}
            </span>
          </kbd>
        </ChordPresent.Provider>
      </Chord.Provider>
    </MotionPresentation>
  );
}

function clipped(host: HTMLElement) {
  for (let node: HTMLElement | null = host; node; node = node.parentElement) {
    const css = getComputedStyle(node);
    if (/(hidden|clip|scroll|auto)/.test(css.overflowX) || css.contain.includes("paint")) return true;
  }
  return false;
}

export { Kbd, KbdGroup };

/** A local cancellation envelope consumes parent close without sharing its revisions. */
function useParentCancellation(
  node: MotionHostRef<HTMLElement>,
  scope: Scope,
  parent: Scope | null,
  cancel: () => void,
) {
  const latest = useRef(cancel);
  committed(() => {
    latest.current = cancel;
  });
  committed(() => {
    const host = node.current;
    if (!parent || !host) return;
    const owner = parent.transaction.register(host);
    const join = () =>
      owner.begin(parent.transaction.revision("presence", host, host), [], {}, () => {
        scope.transaction.cancel();
        latest.current();
      });
    join();
    const off = parent.transaction.subscribeOpen(join);
    return () => {
      off();
      owner.dispose();
    };
  }, [node, scope, parent]);
}

/** Only the immediate native neighbour can constrain a growing first key. */
function firstKeyRoom(host: HTMLElement, previous: number, target: number) {
  if (target <= previous) return true;
  const sibling = host.previousSibling;
  if (!sibling) return true;
  let bounds: DOMRect;
  if (sibling.nodeType === Node.TEXT_NODE) {
    const text = sibling.textContent ?? "";
    if (text.length > motionLimits.changedGraphemes) return false;
    const length = text.trimEnd().length;
    if (!length) return true;
    const range = host.ownerDocument.createRange();
    range.setStart(sibling, 0);
    range.setEnd(sibling, length);
    bounds = range.getBoundingClientRect();
  } else if (sibling instanceof HTMLElement) bounds = sibling.getBoundingClientRect();
  else return false;
  const scale = kbdScale(host);
  const box = host.getBoundingClientRect();
  if (bounds.bottom <= box.top || bounds.top >= box.bottom) return true;
  return !!scale && (box.left - bounds.right) / scale.x >= (target - previous) / 2;
}

/** Reject caller-owned size/transform engines rather than replace their property. */
function keyBox(node: HTMLElement) {
  const css = getComputedStyle(node);
  if (
    css.transform !== "none" ||
    css.translate !== "none" ||
    css.rotate !== "none" ||
    css.scale !== "none" ||
    css.writingMode !== "horizontal-tb" ||
    !["static", "relative"].includes(css.position) ||
    css.whiteSpace !== "nowrap"
  )
    return null;
  const properties = css.transitionProperty.split(",").map((value) => value.trim()),
    times = css.transitionDuration.split(",").map(Number.parseFloat);
  if (
    properties.some(
      (property, index) =>
        ["all", "width", "height", "transform", "translate", "scale", "rotate"].includes(property) &&
        (times[index % times.length] ?? 0) > 0,
    )
  )
    return null;
  if (
    node
      .getAnimations?.()
      .some((animation) =>
        (animation.effect as KeyframeEffect | null)
          ?.getKeyframes()
          .some((frame) =>
            ["width", "height", "transform", "translate", "scale", "rotate"].some((key) => key in frame),
          ),
      )
  )
    return null;
  return naturalGeometry(node);
}

function interactiveParent(host: HTMLElement) {
  return !!host.parentElement?.closest(
    "button,a,summary,input,textarea,select,[contenteditable],[role=button],[role=menuitem],[role=option],[tabindex]",
  );
}
