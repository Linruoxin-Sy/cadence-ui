"use client";

import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible";
import { useRender } from "@base-ui/react/use-render";
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
import { useStateColor } from "../lib/css-motion";
import { createInlinePresence } from "../lib/inline-presence";
import { createMeasuredGeometry, naturalGeometry } from "../lib/measured-geometry";
import { bindMotionParameters, geometryCompact } from "../lib/motion";
import { createPresentationScope, MotionPresentation, usePresentationScope } from "../lib/motion-presence";
import { useMotionHostRef } from "../lib/motion-ref";
import { createMotionTransaction } from "../lib/motion-transaction";
import { disclosurePanelClasses, popupStyle } from "../lib/popup-style";
import { useCadenceMotion, withCadenceScope } from "../lib/provider";
import { useNumberPresentation } from "../lib/use-number-presentation";
import { useTextPresentation } from "../lib/use-text-presentation";

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;
const subscribe = () => () => {};

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

function Collapsible({ className, ...props }: CollapsiblePrimitive.Root.Props) {
  const [scope] = useState(() => createPresentationScope());
  return (
    <MotionPresentation scope={scope}>
      <CollapsiblePrimitive.Root
        data-slot="collapsible"
        className={(state) => cn(typeof className === "function" ? className(state) : className)}
        {...props}
      />
    </MotionPresentation>
  );
}

function CollapsibleTrigger({ className, children, style, ...props }: CollapsiblePrimitive.Trigger.Props) {
  const { node, ref } = useMotionHostRef<HTMLButtonElement>(props.ref);
  const cm = useCadenceMotion(node);
  const [entity] = useState(() => ({}));
  const paint = useStateColor(
    ref,
    cm,
    ["color", "border-top-color", "border-right-color", "border-bottom-color", "border-left-color"],
    { readability: knownPalette(className, style, props.render) ? "verified" : "immediate" },
  );
  return (
    <CollapsiblePrimitive.Trigger
      {...props}
      {...paint}
      data-slot="collapsible-trigger"
      data-motion={cm.mode}
      className={(state) => cn(typeof className === "function" ? className(state) : className)}
      style={mergeStyle(paint.style, style)}
    >
      {typeof children === "string" ? (
        <CollapsibleTriggerLabel value={children} entity={entity} />
      ) : typeof children === "number" ? (
        <CollapsibleTriggerValue value={children} entity={entity} />
      ) : (
        children
      )}
    </CollapsiblePrimitive.Trigger>
  );
}

function CollapsibleContent({
  className,
  children,
  render,
  style,
  ref: externalRef,
  ...props
}: CollapsiblePrimitive.Panel.Props) {
  const { node, ref } = useMotionHostRef<HTMLDivElement>(externalRef);
  const cm = useCadenceMotion(node);
  return (
    <CollapsiblePrimitive.Panel
      data-slot="collapsible-content"
      data-motion={cm.mode}
      className={(state) =>
        cn(
          disclosurePanelClasses(cm, "h-(--collapsible-panel-height)"),
          typeof className === "function" ? className(state) : className,
        )
      }
      style={popupStyle(cm, style)}
      render={(elementProps, panelState) => (
        <CollapsibleSurface
          elementProps={{
            ...elementProps,
            children: (
              <CollapsibleDisclosure panel={node} state={panelState} cm={cm}>
                {children}
              </CollapsibleDisclosure>
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

/** The retained inner body: the sole content paint and the natural measurement source. */
function CollapsibleDisclosure({
  panel,
  state,
  cm,
  children,
}: {
  panel: ReturnType<typeof useMotionHostRef<HTMLDivElement>>["node"];
  state: CollapsiblePrimitive.Panel.State;
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
          const css = content.ownerDocument.defaultView?.getComputedStyle(host);
          // Outer padding/border belong to the shell's own closing box minimum.
          const edges =
            css?.boxSizing === "border-box"
              ? ["padding-top", "padding-bottom", "border-top-width", "border-bottom-width"].reduce(
                  (sum, name) => sum + (Number.parseFloat(css.getPropertyValue(name)) || 0),
                  0,
                )
              : 0;
          const height = box.height + edges;
          return { height: { size: height, min: 0, max: height, readable: true, independent: true } };
        },
      });
    }
    const parameters = cm.parameters(bindMotionParameters(geometryCompact, "geometry.resize/measured"));
    if (parameters.kind !== "geometry") return;
    geometry.commit(
      transaction.revision(
        "content",
        typeof children === "string" || typeof children === "number" ? children : null,
        host,
      ),
      {
        reduced: cm.reduced,
        transition: parameters.transition,
        available: open && idle,
      },
    );
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
  return withCadenceScope(
    cm,
    <div ref={body} data-slot="collapsible-content-inner" data-motion={cm.mode} className="flow-root">
      {typeof children === "string" ? (
        <CollapsibleContentLabel value={children} entity={entity} />
      ) : typeof children === "number" ? (
        <CollapsibleContentValue value={children} entity={entity} />
      ) : (
        children
      )}
    </div>,
  );
}

function CollapsibleTriggerLabel({ value, entity }: { value: string; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useTextPresentation(node, value, cm, entity, { characterStagger: false });
  return (
    <span ref={ref} data-slot="collapsible-trigger-label" data-motion={cm.mode}>
      {text}
    </span>
  );
}

function CollapsibleTriggerValue({ value, entity }: { value: number; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useNumberPresentation(node, value, cm, entity, { compact: true });
  return (
    <span ref={ref} data-slot="collapsible-trigger-value" data-motion={cm.mode}>
      {text}
    </span>
  );
}

function CollapsibleContentLabel({ value, entity }: { value: string; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useTextPresentation(node, value, cm, entity, { characterStagger: false });
  return (
    <span ref={ref} data-slot="collapsible-content-label" data-motion={cm.mode}>
      {text}
    </span>
  );
}

function CollapsibleContentValue({ value, entity }: { value: number; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useNumberPresentation(node, value, cm, entity, { compact: true });
  return (
    <span ref={ref} data-slot="collapsible-content-value" data-motion={cm.mode}>
      {text}
    </span>
  );
}

/** Keep the primitive's own disclosure phase attributes; drop the rest of its state surface. */
const surfaceStateAttributes = {
  open: () => null,
  disabled: () => null,
};

/** Base render adapter, without a wrapper or a second physical ref registration. */
function CollapsibleSurface({
  elementProps,
  state,
  render,
}: {
  elementProps: React.ComponentPropsWithRef<"div">;
  state: CollapsiblePrimitive.Panel.State;
  render: CollapsiblePrimitive.Panel.Props["render"];
}) {
  return useRender({
    defaultTagName: "div",
    render,
    props: { ...elementProps },
    state: { ...state },
    stateAttributesMapping: surfaceStateAttributes,
  });
}

export { Collapsible, CollapsibleContent, CollapsibleTrigger };
