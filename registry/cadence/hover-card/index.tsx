"use client";

import { PreviewCard as PreviewCardPrimitive } from "@base-ui/react/preview-card";
import { useRender } from "@base-ui/react/use-render";
import {
  Children,
  type CSSProperties,
  createContext,
  isValidElement,
  type ReactNode,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createAnchoredPresence } from "../lib/anchored-presence";
import { cn } from "../lib/cn";
import { useStateColor } from "../lib/css-motion";
import { createMeasuredGeometry, naturalGeometry } from "../lib/measured-geometry";
import { bindMotionParameters, geometryCompact } from "../lib/motion";
import { useMotionHostRef } from "../lib/motion-ref";
import { createMotionTransaction } from "../lib/motion-transaction";
import { popupClockStyle } from "../lib/popup-style";
import { type CadenceMotion, useCadenceMotion, withCadenceScope } from "../lib/provider";
import { useNumberPresentation } from "../lib/use-number-presentation";
import { useTextPresentation } from "../lib/use-text-presentation";

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * One preview is one record. Base UI's root already knows which trigger a preview
 * belongs to (`triggerId` for a caller-driven open, the mounted trigger otherwise),
 * so the display owners below start from an exact baseline when a reused Content
 * node is assigned to another record instead of replacing the previous preview's
 * characters. The composition carries no new prop and no second state.
 */
const HoverCardContext = createContext<object | undefined>(undefined);

/** A caller palette this surface cannot verify keeps its paint immediate. */
const layoutClass =
  /^(?:[\w-]+:)*(?:w-|h-|size-|min-|max-|p[xytrblse]?-|m[xytrblse]?-|gap-|flex|inline-|block|grid|shrink|grow|basis-|items-|justify-|self-|order-|relative|absolute|fixed|sticky|inset-|top-|bottom-|left-|right-|overflow-|truncate|text-(?:xs|sm|base|lg|xl)$)/;

/** The card's own paint classes are tokens; only an unprovable caller palette is
 * forced immediate, so an unverified contrast pair is never interpolated. */
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

/** A stable, committed content signature: the preview's natural size is measured
 * against what it actually renders, never against a render counter. */
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

function HoverCard({ children, triggerId, ...props }: PreviewCardPrimitive.Root.Props) {
  const id = useId();
  const entity = useMemo(() => ({ key: triggerId ?? id }), [triggerId, id]);

  return (
    <HoverCardContext.Provider value={entity}>
      <PreviewCardPrimitive.Root data-slot="hover-card" triggerId={triggerId} {...props}>
        {children}
      </PreviewCardPrimitive.Root>
    </HoverCardContext.Provider>
  );
}

function HoverCardTrigger({ ...props }: PreviewCardPrimitive.Trigger.Props) {
  return <PreviewCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />;
}

/**
 * Motion contract: a preview is a coherent anchored surface, not a second page.
 * The panel fades in with a `distance.xs` approach from the side Base UI resolved
 * and fades out without moving its anchor; the positioner keeps its coordinates,
 * so collision flips and anchor moves stay native and immediate. A changed preview
 * re-measures its natural width and height once and animates only the shell, and a
 * primitive string or a directly supplied number owns its own display slot inside.
 */
function HoverCardContent({
  className,
  style,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 4,
  render,
  ...props
}: PreviewCardPrimitive.Popup.Props &
  Pick<PreviewCardPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset">) {
  const entity = useContext(HoverCardContext);

  return (
    <PreviewCardPrimitive.Portal data-slot="hover-card-portal">
      <PreviewCardPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
        data-slot="hover-card-positioner"
      >
        <PreviewCardPrimitive.Popup
          {...props}
          className={className}
          style={style}
          render={(elementProps, state) => (
            <HoverCardContentSurface elementProps={elementProps} state={state} render={render} entity={entity}>
              {children}
            </HoverCardContentSurface>
          )}
        />
      </PreviewCardPrimitive.Positioner>
    </PreviewCardPrimitive.Portal>
  );
}

function HoverCardContentSurface({
  elementProps,
  state,
  render,
  entity,
  children,
}: {
  elementProps: React.ComponentPropsWithRef<"div">;
  state: PreviewCardPrimitive.Popup.State;
  render: PreviewCardPrimitive.Popup.Props["render"];
  entity?: object;
  children?: ReactNode;
}) {
  const host = useMotionHostRef<HTMLDivElement>(elementProps.ref);
  const cm = useCadenceMotion(host.node);
  // One declared palette on the panel: its surface paint and the foreground that
  // plain preview content inherits. Independently styled children keep their own.
  const paint = useStateColor(
    host.ref,
    cm,
    ["background-color", "border-top-color", "border-right-color", "border-bottom-color", "border-left-color", "color"],
    {
      readability: knownPalette(elementProps.className, elementProps.style) ? "verified" : "immediate",
    },
  );
  const controller = useRef<ReturnType<typeof createAnchoredPresence> | null>(null);
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
      controller.current?.dispose();
      controller.current = null;
      connected.current = node;
    }
    if (node && !controller.current) controller.current = createAnchoredPresence(node);
    const open = state.open;
    controller.current?.commit({
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
          // Base UI's measured available space is the ceiling; a missing value
          // never narrows the preview below its own natural box.
          const availableWidth = Number.parseFloat(css?.getPropertyValue("--available-width") ?? "");
          const availableHeight = Number.parseFloat(css?.getPropertyValue("--available-height") ?? "");
          return {
            // Never animate below the natural box: required preview text stays laid out.
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
      controller.current?.dispose();
    },
    [],
  );

  return withCadenceScope(
    cm,
    useRender({
      defaultTagName: "div",
      render,
      state: { ...state, slot: "hover-card-content" },
      props: {
        ...elementProps,
        ...paint,
        "data-slot": "hover-card-content",
        "data-motion": cm.mode,
        className: cn(
          "z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
          elementProps.className,
        ),
        style: { ...paint.style, ...clockVariables(cm), ...elementProps.style },
        children: (
          <>
            {typeof children === "string" ? (
              <HoverCardText value={children} entity={entity} visible={state.open} />
            ) : typeof children === "number" ? (
              <HoverCardValue value={children} entity={entity} visible={state.open} />
            ) : (
              children
            )}
          </>
        ),
      },
    }),
  );
}

/** A primitive preview string replaces only its changed runs, with no stagger: a
 * hover card is a glance, and per-character entrances would delay its reading. */
function HoverCardText({
  value,
  entity,
  visible,
}: {
  value: string;
  entity: object | undefined;
  /** A closing preview settles its current text immediately instead of animating. */
  visible: boolean;
}) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useTextPresentation(node, value, cm, entity, { characterStagger: false, visible });
  return (
    <span ref={ref} data-slot="hover-card-text" data-motion={cm.mode}>
      {text}
    </span>
  );
}

/** A supported direct numeric preview rolls only its changed places; strings,
 * codes and numeric identities stay text. */
function HoverCardValue({
  value,
  entity,
  visible,
}: {
  value: number;
  entity: object | undefined;
  /** A closing preview settles its current quantity immediately instead of rolling. */
  visible: boolean;
}) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useNumberPresentation(node, value, cm, entity, { compact: true, visible });
  return (
    <span ref={ref} data-slot="hover-card-number" data-motion={cm.mode}>
      {text}
    </span>
  );
}

export { HoverCard, HoverCardContent, HoverCardTrigger };
