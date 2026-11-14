"use client";

import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { useRender } from "@base-ui/react/use-render";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import {
  type CSSProperties,
  isValidElement,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { cn } from "../lib/cn";
import { ControlSpan } from "../lib/control-animation";
import { useStateColor } from "../lib/css-motion";
import { createInlineEntrance } from "../lib/inline-entrance";
import { createInlinePresence } from "../lib/inline-presence";
import { createMeasuredGeometry, naturalGeometry } from "../lib/measured-geometry";
import { bindMotionParameters, geometryContent, stateIndicator } from "../lib/motion";
import { createPresentationScope, MotionPresentation, usePresentationScope } from "../lib/motion-presence";
import { useMotionHostRef } from "../lib/motion-ref";
import { createMotionTransaction } from "../lib/motion-transaction";
import { disclosurePanelClasses, popupStyle } from "../lib/popup-style";
import { useCadenceMotion } from "../lib/provider";
import { useNumberPresentation } from "../lib/use-number-presentation";
import { useTextPresentation } from "../lib/use-text-presentation";

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;
const subscribe = () => () => {};

const triggerClasses =
  "group/accordion-trigger relative flex flex-1 items-start justify-between gap-4 rounded-md border border-transparent py-4 text-left text-sm font-medium outline-none hover:underline focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50";
const bodyClasses =
  "flow-root pt-0 pb-4 transition-none [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4";

/** A caller palette this component cannot verify keeps its paint immediate. */
const layoutClass =
  /^(?:[\w-]+:)*(?:w-|h-|size-|min-|max-|p[xytrblse]?-|m[xytrblse]?-|gap-|flex|inline-|block|grid|shrink|grow|basis-|items-|justify-|self-|order-|relative|absolute|fixed|sticky|inset-|top-|bottom-|left-|right-|overflow-|truncate|text-(?:xs|sm|base|lg|xl)$)/;

function knownPalette(
  className: string | ((state: never) => string | undefined) | undefined,
  style: CSSProperties | ((state: never) => CSSProperties | undefined) | undefined,
  render: unknown,
) {
  if (typeof className === "function" || typeof style === "function") return false;
  const layoutOnly = !className || className.split(/\s+/).every((name) => layoutClass.test(name));
  const knownStyle = !Object.keys(style ?? {}).some((key) =>
    /color|background|fill|stroke|shadow|filter|blend|^--(?!motion-|cadence-|ease-)/i.test(key),
  );
  const knownRender = !render || (isValidElement(render) && typeof render.type === "string");
  return layoutOnly && knownStyle && knownRender;
}

type StyleInput<S> = CSSProperties | ((state: S) => CSSProperties | undefined) | undefined;
function mergeStyle<S>(base: CSSProperties, caller: StyleInput<S>) {
  return typeof caller === "function" ? (state: S) => ({ ...base, ...caller(state) }) : { ...base, ...caller };
}

function Accordion({ className, ...props }: AccordionPrimitive.Root.Props) {
  const [scope] = useState(() => createPresentationScope());
  return (
    <MotionPresentation scope={scope}>
      <AccordionPrimitive.Root
        data-slot="accordion"
        className={(state) =>
          cn("flex w-full flex-col", typeof className === "function" ? className(state) : className)
        }
        {...props}
      />
    </MotionPresentation>
  );
}

function AccordionItem({ className, children, style, ...props }: AccordionPrimitive.Item.Props) {
  const { node, ref } = useMotionHostRef<HTMLDivElement>(props.ref);
  const cm = useCadenceMotion(node);
  const parent = usePresentationScope();
  const hydrated = useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  );
  const initialHydration = useRef(hydrated);
  const consumed = useRef(false);
  const entrance = useRef<ReturnType<typeof createInlineEntrance> | null>(null);
  const entranceHost = useRef<HTMLElement | null>(null);
  const paint = useStateColor(
    ref,
    cm,
    ["border-top-color", "border-right-color", "border-bottom-color", "border-left-color"],
    { readability: knownPalette(className, style, props.render) ? "verified" : "immediate" },
  );
  committed(() => {
    const host = node.current;
    if (host !== entranceHost.current) {
      entrance.current?.dispose();
      entrance.current = host ? createInlineEntrance(host) : null;
      entranceHost.current = host;
    }
    if (!host || !entrance.current) return;
    const enter = !consumed.current && !initialHydration.current && Boolean(parent?.presented);
    entrance.current.commit({ present: true, enter, cm });
    consumed.current = true;
  });
  committed(
    () => () => {
      entrance.current?.dispose();
      entrance.current = null;
      entranceHost.current = null;
    },
    [],
  );
  return (
    <AccordionPrimitive.Item
      {...props}
      {...paint}
      data-slot="accordion-item"
      data-motion={cm.mode}
      className={(state) =>
        cn("border-b last:border-b-0", typeof className === "function" ? className(state) : className)
      }
      style={mergeStyle(paint.style, style)}
    >
      {children}
    </AccordionPrimitive.Item>
  );
}

function AccordionTrigger({ className, children, style, ...props }: AccordionPrimitive.Trigger.Props) {
  const { node, ref } = useMotionHostRef<HTMLButtonElement>(props.ref);
  const cm = useCadenceMotion(node);
  const [entity] = useState(() => ({}));
  const paint = useStateColor(
    ref,
    cm,
    ["color", "border-top-color", "border-right-color", "border-bottom-color", "border-left-color"],
    { readability: knownPalette(className, style, props.render) ? "verified" : "immediate" },
  );
  const parameters = cm.parameters(bindMotionParameters(stateIndicator, "state.morph/indicator"));
  const [expanded, setExpanded] = useState(false);
  committed(() => {
    const host = node.current;
    if (!host) return;
    const sync = () => setExpanded(host.getAttribute("aria-expanded") === "true");
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(host, { attributes: true, attributeFilter: ["aria-expanded"] });
    return () => observer.disconnect();
  }, []);
  return (
    <AccordionPrimitive.Header data-slot="accordion-header" className="flex">
      <AccordionPrimitive.Trigger
        {...props}
        {...paint}
        data-slot="accordion-trigger"
        data-motion={cm.mode}
        className={(state) => cn(triggerClasses, typeof className === "function" ? className(state) : className)}
        style={mergeStyle(paint.style, style)}
      >
        {typeof children === "string" ? (
          <AccordionTriggerLabel value={children} entity={entity} />
        ) : typeof children === "number" ? (
          <AccordionTriggerValue value={children} entity={entity} />
        ) : (
          children
        )}
        <span aria-hidden="true" className="pointer-events-none mt-0.5 grid size-4 shrink-0 place-items-center">
          {parameters.kind === "indicator" ? (
            <>
              <ControlSpan
                data-slot="accordion-trigger-icon"
                data-motion={cm.mode}
                className="col-start-1 row-start-1 flex size-4 items-center justify-center text-muted-foreground"
                target={{ opacity: expanded ? 0 : 1 }}
                transition={parameters.opacity}
              >
                <ChevronDownIcon className="size-4" />
              </ControlSpan>
              <ControlSpan
                data-slot="accordion-trigger-icon"
                data-motion={cm.mode}
                className="col-start-1 row-start-1 flex size-4 items-center justify-center text-muted-foreground"
                target={{ opacity: expanded ? 1 : 0 }}
                transition={parameters.opacity}
              >
                <ChevronUpIcon className="size-4" />
              </ControlSpan>
            </>
          ) : null}
        </span>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  render,
  style,
  ref: externalRef,
  ...props
}: AccordionPrimitive.Panel.Props) {
  const { node, ref } = useMotionHostRef<HTMLDivElement>(externalRef);
  const cm = useCadenceMotion(node);
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      data-motion={cm.mode}
      className={disclosurePanelClasses(cm)}
      style={popupStyle(cm, style)}
      render={(elementProps, panelState) => (
        <AccordionSurface
          elementProps={{
            ...elementProps,
            children: (
              <AccordionDisclosure panel={node} state={panelState} className={className} cm={cm}>
                {children}
              </AccordionDisclosure>
            ),
          }}
          state={panelState}
          render={render}
        />
      )}
      {...props}
      ref={ref}
    />
  );
}

/** The retained content paint and the sole measured block-size owner of the panel. */
function AccordionDisclosure({
  panel,
  state,
  className,
  cm,
  children,
}: {
  panel: ReturnType<typeof useMotionHostRef<HTMLDivElement>>["node"];
  state: AccordionPrimitive.Panel.State;
  className: string | ((state: AccordionPrimitive.Panel.State) => string | undefined) | undefined;
  cm: ReturnType<typeof useCadenceMotion>;
  children: ReactNode;
}) {
  const body = useRef<HTMLDivElement | null>(null);
  const [transaction] = useState(createMotionTransaction);
  const [geometry] = useState(() => createMeasuredGeometry(transaction));
  const [entity] = useState(() => ({}));
  const parent = usePresentationScope();
  const hydrated = useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  );
  const initialHydration = useRef(hydrated);
  const presence = useRef<ReturnType<typeof createInlinePresence> | null>(null);
  const presenceHost = useRef<HTMLElement | null>(null);
  const release = useRef<(() => void) | null>(null);
  const registered = useRef<HTMLElement | null>(null);
  const open = state.open;
  const idle = state.transitionStatus === "idle";
  committed(() => {
    const host = panel.current;
    const content = body.current;
    if (!host || !content) {
      release.current?.();
      release.current = null;
      registered.current = null;
      presence.current?.dispose();
      presence.current = null;
      presenceHost.current = null;
      return;
    }
    if (content !== presenceHost.current) {
      presence.current?.dispose();
      presence.current = createInlinePresence(content);
      presenceHost.current = content;
    }
    const enter = !initialHydration.current && open && Boolean(parent?.presented);
    presence.current?.commit({
      // A clipped closed body has no visible exit paint to retain.
      present: open,
      enter,
      cm: open || !cm.reduced ? cm : { ...cm, timeScale: 0 },
    });
    if (host !== registered.current) {
      release.current?.();
      release.current = null;
      registered.current = host;
      release.current = geometry.register({
        host: panel,
        content,
        axes: ["height"],
        measure() {
          const box = naturalGeometry(content);
          if (!box) return null;
          return { height: { size: box.height, min: 0, max: box.height, readable: true, independent: true } };
        },
      });
    }
    const parameters = cm.parameters(bindMotionParameters(geometryContent, "geometry.resize/measured"));
    if (parameters.kind !== "geometry") return;
    geometry.commit(transaction.revision("content", typeof children === "string" ? children : null, host), {
      reduced: cm.reduced,
      transition: parameters.transition,
      available: open && idle,
    });
  });
  committed(
    () => () => {
      release.current?.();
      release.current = null;
      presence.current?.dispose();
      presence.current = null;
      geometry.dispose();
    },
    [],
  );
  return (
    <div
      ref={body}
      data-slot="accordion-content-inner"
      data-motion={cm.mode}
      className={cn(bodyClasses, typeof className === "function" ? className(state) : className)}
    >
      {typeof children === "string" ? (
        <AccordionContentLabel value={children} entity={entity} />
      ) : typeof children === "number" ? (
        <AccordionContentValue value={children} entity={entity} />
      ) : (
        children
      )}
    </div>
  );
}

function AccordionTriggerLabel({ value, entity }: { value: string; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useTextPresentation(node, value, cm, entity, { characterStagger: false });
  return (
    <span ref={ref} data-slot="accordion-trigger-label" data-motion={cm.mode}>
      {text}
    </span>
  );
}

function AccordionTriggerValue({ value, entity }: { value: number; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useNumberPresentation(node, value, cm, entity, { compact: true });
  return (
    <span ref={ref} data-slot="accordion-trigger-value" data-motion={cm.mode}>
      {text}
    </span>
  );
}

function AccordionContentLabel({ value, entity }: { value: string; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useTextPresentation(node, value, cm, entity, { characterStagger: false });
  return (
    <span ref={ref} data-slot="accordion-content-label" data-motion={cm.mode}>
      {text}
    </span>
  );
}

function AccordionContentValue({ value, entity }: { value: number; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useNumberPresentation(node, value, cm, entity, { compact: true });
  return (
    <span ref={ref} data-slot="accordion-content-value" data-motion={cm.mode}>
      {text}
    </span>
  );
}

/** Keep the primitive's own disclosure phase attributes; drop the rest of its state surface. */
const surfaceStateAttributes = {
  open: () => null,
  disabled: () => null,
  hidden: () => null,
  index: () => null,
  value: () => null,
  orientation: () => null,
};

/** Base render adapter, without a wrapper or a second physical ref registration. */
function AccordionSurface({
  elementProps,
  state,
  render,
}: {
  elementProps: React.ComponentPropsWithRef<"div">;
  state: AccordionPrimitive.Panel.State;
  render: AccordionPrimitive.Panel.Props["render"];
}) {
  return useRender({
    defaultTagName: "div",
    render,
    props: { ...elementProps },
    state: { ...state },
    stateAttributesMapping: surfaceStateAttributes,
  });
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
