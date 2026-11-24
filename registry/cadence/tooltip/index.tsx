"use client";

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { useRender } from "@base-ui/react/use-render";
import {
  Children,
  type CSSProperties,
  createContext,
  isValidElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "../lib/cn";
import { useStateColor } from "../lib/css-motion";
import { createMeasuredGeometry, naturalGeometry } from "../lib/measured-geometry";
import { bindMotionParameters, geometryCompact } from "../lib/motion";
import { useMotionHostRef } from "../lib/motion-ref";
import { createMotionTransaction } from "../lib/motion-transaction";
import { popupClockStyle } from "../lib/popup-style";
import { type CadenceMotion, useCadenceMotion, withCadenceScope } from "../lib/provider";
import { createTooltipPresence } from "../lib/tooltip-presence";
import { useNumberPresentation } from "../lib/use-number-presentation";
import { useTextPresentation } from "../lib/use-text-presentation";

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Base UI's tooltip wires neither `role="tooltip"` nor `aria-describedby`, so a
 * screen reader gets no announcement at all. The ARIA tooltip pattern needs both,
 * and the pair has to agree on an id, which is the one thing this context carries.
 * `open` is here because a dangling `aria-describedby` id is an axe violation: the
 * reference only exists while the popup does.
 *
 * `entity` is the hint's identity: one Tooltip root is one hint, so reusing a
 * Content node for another trigger starts a fresh text/reel baseline instead of
 * replacing the previous hint's characters.
 */
interface TooltipContextValue {
  id: string;
  open: boolean;
  entity: object;
}

const TooltipContext = createContext<TooltipContextValue | null>(null);

/** A caller palette this surface cannot verify keeps its paint immediate. */
const layoutClass =
  /^(?:[\w-]+:)*(?:w-|h-|size-|min-|max-|p[xytrblse]?-|m[xytrblse]?-|gap-|flex|inline-|block|grid|shrink|grow|basis-|items-|justify-|self-|order-|relative|absolute|fixed|sticky|inset-|top-|bottom-|left-|right-|overflow-|truncate|text-(?:xs|sm|base|lg|xl)$)/;

/** The hint's own paint classes are tokens; only an unprovable caller palette is
 * forced immediate, and the arrow is never a second colour writer. */
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

/** A stable, committed content signature: the measured hint is what it renders,
 * never a render counter, so an unrelated render is not a size revision. */
function contentRevision(children: ReactNode): string {
  const shape = (child: ReactNode, depth: number): unknown => {
    if (typeof child === "string" || typeof child === "number") return child;
    if (!isValidElement(child) || depth > 4) return null;
    const type = child.type;
    const name =
      typeof type === "string"
        ? type
        : ((type as { displayName?: string; name?: string }).displayName ?? (type as { name?: string }).name ?? "part");
    const nested = (child.props as { children?: ReactNode }).children;
    return [name, child.key, Children.toArray(nested).map((next) => shape(next, depth + 1))];
  };
  return JSON.stringify(Children.toArray(children).map((child) => shape(child, 0)));
}

/** Portal clock variables only; presence, geometry and colour own their properties. */
function clockVariables(cm: CadenceMotion): CSSProperties {
  const variables: Record<string, string | number> = { ...popupClockStyle(cm) };
  delete variables.transition;
  return variables as CSSProperties;
}

/** Optional app-level provider: one delay for every tooltip inside it. */
function TooltipProvider({ delay = 0, ...props }: TooltipPrimitive.Provider.Props) {
  return <TooltipPrimitive.Provider data-slot="tooltip-provider" delay={delay} {...props} />;
}

function Tooltip({
  children,
  open,
  defaultOpen = false,
  onOpenChange,
  triggerId,
  ...props
}: TooltipPrimitive.Root.Props) {
  const id = useId();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isOpen = open ?? uncontrolledOpen;
  // One hint identity per trigger: a reused Content node for another trigger
  // establishes an exact baseline instead of replacing the old hint's runs.
  const entity = useMemo(() => ({ key: triggerId ?? id }), [triggerId, id]);

  return (
    <TooltipContext.Provider value={{ id, open: isOpen, entity }}>
      <TooltipPrimitive.Root
        data-slot="tooltip"
        open={open}
        defaultOpen={defaultOpen}
        triggerId={triggerId}
        onOpenChange={(next, details) => {
          onOpenChange?.(next, details);
          if (!details.isCanceled) setUncontrolledOpen(next);
        }}
        {...props}
      >
        {children}
      </TooltipPrimitive.Root>
    </TooltipContext.Provider>
  );
}

/**
 * A trigger can appear under a pointer that is already resting on it — a streamed
 * route mounts its preview seconds after the first pointer move, and any trigger
 * rendered conditionally does the same. That pointer never sent this element an
 * entry, and Base UI starts with hover moves blocked until it hears one, so the hint
 * stays closed for as long as the pointer rests and no amount of movement inside the
 * trigger re-arms it: only leaving and returning does.
 *
 * The trigger therefore completes the interaction the pointer already made, once per
 * mount: on a device that can hover, with the pointer really over this element, it
 * re-enters itself and Base UI's own intent delay, open state and unmount decide the
 * rest. Nothing here opens the hint itself, so the primitive stays the only writer;
 * a device without hover is left alone, where a sticky `:hover` after a tap would be
 * a tap rather than an intent to read a hint.
 */
function useRestingEntry(node: { readonly current: HTMLElement | null }, open: boolean, disabled: boolean | undefined) {
  const replayed = useRef(false);

  useEffect(() => {
    if (replayed.current) return;
    replayed.current = true;
    const element = node.current;
    if (!element || open || disabled) return;
    const view = element.ownerDocument.defaultView;
    if (!view?.matchMedia("(hover: hover)").matches) return;
    if (!element.matches(":hover")) return;
    // `mouseenter` is what clears the primitive's blocked-move state; `mousemove` is
    // what arms its rest delay, which a still pointer never sends on its own.
    element.dispatchEvent(new MouseEvent("mouseenter", { relatedTarget: null }));
    element.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, relatedTarget: null }));
  }, [node, open, disabled]);
}

function TooltipTrigger({ ref, ...props }: TooltipPrimitive.Trigger.Props) {
  const tooltip = useContext(TooltipContext);
  const node = useRef<HTMLButtonElement | null>(null);
  // The caller's ref may hand React its own teardown instead of accepting `null`
  // (React 19 ref cleanup); that teardown, not a second `null` call, detaches it.
  const detach = useRef<(() => void) | null>(null);
  const setNode = useCallback(
    (element: HTMLButtonElement | null) => {
      node.current = element;
      const attachedWithCleanup = detach.current !== null;
      detach.current?.();
      detach.current = null;
      if (attachedWithCleanup && element === null) return;
      if (typeof ref === "function") {
        const returned = ref(element);
        if (typeof returned === "function") detach.current = returned;
      } else if (ref) (ref as { current: HTMLButtonElement | null }).current = element;
    },
    [ref],
  );

  useRestingEntry(node, tooltip?.open ?? false, props.disabled);

  return (
    <TooltipPrimitive.Trigger
      data-slot="tooltip-trigger"
      aria-describedby={tooltip?.open ? tooltip.id : undefined}
      {...props}
      ref={setNode}
    />
  );
}

/**
 * Motion contract: a hint is a small visual layer, not a second reading surface.
 * It fades in over `duration.instant` and fades out on the same channel, with no
 * travel or scale. The positioner, the arrow and the provider's intent delays
 * stay native: `TooltipPrimitive.Portal`/`Positioner` keep the coordinates, the
 * arrow is a child of the fading surface, and `sideOffset`/`alignOffset` are
 * never animated. A changed hint re-measures its natural width and height once
 * and animates only the shell, so the text never rewraps through intermediate
 * widths, and a change of only the hint's characters replaces the changed runs.
 */
function TooltipContent({
  className,
  style,
  side = "top",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  children,
  render,
  ...props
}: TooltipPrimitive.Popup.Props &
  Pick<TooltipPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset">) {
  const tooltip = useContext(TooltipContext);

  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
        data-slot="tooltip-positioner"
      >
        <TooltipPrimitive.Popup
          {...props}
          className={className}
          style={style}
          render={(elementProps, state) => (
            <TooltipContentSurface
              elementProps={elementProps}
              state={state}
              render={render}
              entity={tooltip?.entity}
              describedBy={tooltip?.id}
            >
              {children}
            </TooltipContentSurface>
          )}
        />
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

function TooltipContentSurface({
  elementProps,
  state,
  render,
  entity,
  describedBy,
  children,
}: {
  elementProps: React.ComponentPropsWithRef<"div">;
  state: TooltipPrimitive.Popup.State;
  render: TooltipPrimitive.Popup.Props["render"];
  entity?: object;
  /** The id the trigger's `aria-describedby` points at while the hint is open. */
  describedBy?: string;
  children?: ReactNode;
}) {
  const host = useMotionHostRef<HTMLDivElement>(elementProps.ref);
  const cm = useCadenceMotion(host.node);
  const paint = useStateColor(host.ref, cm, ["background-color", "color"], {
    readability: knownPalette(elementProps.className, elementProps.style) ? "verified" : "immediate",
  });
  const presence = useRef<ReturnType<typeof createTooltipPresence> | null>(null);
  const connected = useRef<HTMLElement | null>(null);
  const lastOpen = useRef<boolean | null>(null);
  const [transaction] = useState(createMotionTransaction);
  const geometry = useRef<ReturnType<typeof createMeasuredGeometry> | null>(null);
  const release = useRef<(() => void) | null>(null);
  const geometryHost = useRef<HTMLElement | null>(null);
  const revision = contentRevision(children);

  committed(() => {
    const node = host.node.current;
    if (connected.current !== node) {
      presence.current?.dispose();
      presence.current = null;
      connected.current = node;
    }
    if (node && !presence.current) presence.current = createTooltipPresence(node);
    const open = state.open;
    presence.current?.commit({
      open,
      enter: open && (state.transitionStatus === "starting" || lastOpen.current === false),
      cm,
    });
    lastOpen.current = open;
  });
  committed(() => {
    const node = host.node.current;
    if (!node) return;
    if (!geometry.current) geometry.current = createMeasuredGeometry(transaction);
    if (geometryHost.current !== node) {
      release.current?.();
      release.current = null;
      geometryHost.current = node;
      release.current = geometry.current.register({
        host: host.node,
        content: node,
        axes: ["width", "height"],
        observeChildren: true,
        measure() {
          const box = naturalGeometry(node);
          if (!box) return null;
          const css = node.ownerDocument.defaultView?.getComputedStyle(node);
          const view = node.ownerDocument.defaultView;
          // Base UI clamps the hint to the measured available space; a missing
          // value never narrows it below its own natural box.
          const availableWidth = Number.parseFloat(css?.getPropertyValue("--available-width") ?? "");
          const availableHeight = Number.parseFloat(css?.getPropertyValue("--available-height") ?? "");
          return {
            // Never animate below the natural box: the required hint stays laid out.
            width: {
              size: box.width,
              min: 0,
              max: Math.max(box.width, Number.isFinite(availableWidth) ? availableWidth : box.width),
              readable: true,
              independent: true,
            },
            height: {
              size: box.height,
              min: 0,
              max: Math.max(
                box.height,
                Number.isFinite(availableHeight) ? availableHeight : (view?.innerHeight ?? box.height),
              ),
              readable: true,
              independent: true,
            },
          };
        },
      });
    }
    const parameters = cm.parameters(bindMotionParameters(geometryCompact, "geometry.resize/measured"));
    if (parameters.kind !== "geometry") return;
    geometry.current.commit(transaction.revision("content", revision, node), {
      reduced: cm.reduced,
      transition: parameters.transition,
      available: state.open,
    });
  });
  committed(
    () => () => {
      release.current?.();
      release.current = null;
      geometry.current?.dispose();
      presence.current?.dispose();
      presence.current = null;
    },
    [],
  );

  return withCadenceScope(
    cm,
    useRender({
      defaultTagName: "div",
      render,
      state: { ...state, slot: "tooltip-content" },
      props: {
        ...elementProps,
        ...paint,
        // The trigger's description id and the ARIA tooltip role are what make the
        // hint announceable at all; a caller-supplied role still wins.
        id: describedBy ?? elementProps.id,
        role: elementProps.role ?? "tooltip",
        "data-slot": "tooltip-content",
        "data-motion": cm.mode,
        className: cn(
          "z-50 w-fit origin-(--transform-origin) max-w-xs rounded-md bg-foreground px-3 py-1.5 text-xs text-balance text-background outline-none",
          elementProps.className,
        ),
        style: { ...paint.style, ...clockVariables(cm), ...elementProps.style },
        children: (
          <>
            {typeof children === "string" ? (
              <TooltipText value={children} entity={entity} visible={state.open} />
            ) : typeof children === "number" ? (
              <TooltipValue value={children} entity={entity} visible={state.open} />
            ) : (
              children
            )}
            <TooltipPrimitive.Arrow
              className={cn(
                "z-50 size-2.5 rotate-45 rounded-[2px] bg-inherit fill-foreground",
                "data-[side=bottom]:top-1 data-[side=left]:top-1/2! data-[side=left]:-right-1",
                "data-[side=left]:-translate-y-1/2 data-[side=right]:top-1/2! data-[side=right]:-left-1",
                "data-[side=right]:-translate-y-1/2 data-[side=top]:-bottom-2.5",
              )}
            />
          </>
        ),
      },
    }),
  );
}

/** A primitive hint string replaces only its changed runs, with no stagger: the
 * tooltip is too small for a per-character entrance. */
function TooltipText({
  value,
  entity,
  visible,
}: {
  value: string;
  entity: object | undefined;
  /** A closing hint commits its current text immediately instead of animating. */
  visible: boolean;
}) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useTextPresentation(node, value, cm, entity, { characterStagger: false, visible });
  return (
    <span ref={ref} data-slot="tooltip-text" data-motion={cm.mode}>
      {text}
    </span>
  );
}

/** A supported direct numeric hint rolls only its changed places; strings,
 * shortcuts, codes and dates stay text. */
function TooltipValue({
  value,
  entity,
  visible,
}: {
  value: number;
  entity: object | undefined;
  /** A closing hint settles its current quantity immediately instead of rolling. */
  visible: boolean;
}) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useNumberPresentation(node, value, cm, entity, { compact: true, visible });
  return (
    <span ref={ref} data-slot="tooltip-number" data-motion={cm.mode}>
      {text}
    </span>
  );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
