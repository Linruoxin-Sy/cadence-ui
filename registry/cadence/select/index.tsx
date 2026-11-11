"use client";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import { useRender } from "@base-ui/react/use-render";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import {
  Children,
  type ComponentProps,
  createContext,
  isValidElement,
  type ReactNode,
  useContext,
  useEffect,
  useInsertionEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cn } from "../lib/cn";
import { ControlSpan } from "../lib/control-animation";
import { useStateColor } from "../lib/css-motion";
import { bindMotionParameters, motionLimits, stateIndicator } from "../lib/motion";
import { useMotionHostRef } from "../lib/motion-ref";
import { usePopupPresence } from "../lib/popup-presence";
import { stateClasses } from "../lib/popup-style";
import { useCadenceMotion, withCadenceScope } from "../lib/provider";
import { safeSelectPaint, selectColourReadable, selectColourScope } from "../lib/select-colour";
import {
  createSelectPopup,
  createSelectScope,
  type SelectCandidate,
  SelectDisplay,
  SelectMotion,
  selectOrigin,
  useSelectGeometry,
  useSelectTrigger,
} from "../lib/select-motion";

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;
const itemTypes = new WeakSet<object>();
const labelTypes = new WeakSet<object>();
const Labels = createContext<Map<unknown, ReactNode> | null>(null);
function selectStyle<S>(
  paint: React.CSSProperties | undefined,
  style: React.CSSProperties | ((state: S) => React.CSSProperties | undefined) | undefined,
) {
  return typeof style === "function" ? (state: S) => ({ ...paint, ...style(state) }) : { ...paint, ...style };
}
function collectLabels(children: ReactNode, labels = new Map<unknown, ReactNode>()) {
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (typeof child.type !== "string" && itemTypes.has(child.type)) {
      const item = child.props as { value?: unknown; children?: ReactNode };
      if (item.value !== undefined) labels.set(item.value, item.children);
    } else {
      const nested = (child.props as { children?: ReactNode }).children;
      if (nested) collectLabels(nested, labels);
    }
  });
  return labels;
}

function measuredContent(children: ReactNode, entries: [unknown, ReactNode][] = []) {
  Children.forEach(children, (child) => {
    if (!isValidElement(child) || entries.length > motionLimits.collectionVisuals) return;
    const props = child.props as { value?: unknown; children?: ReactNode };
    const primitive = typeof props.children === "string" || typeof props.children === "number" ? props.children : null;
    if (typeof child.type !== "string" && itemTypes.has(child.type)) entries.push([props.value, primitive]);
    else if (typeof child.type !== "string" && labelTypes.has(child.type))
      entries.push([child.key ?? child.type, primitive]);
    else if (props.children) measuredContent(props.children, entries);
  });
  return entries;
}

function useOptionRevision(children: ReactNode) {
  const previous = useRef<{ entries: [unknown, ReactNode][]; revision: object }>({ entries: [], revision: {} });
  const entries = measuredContent(children);
  const known = entries.length <= motionLimits.collectionVisuals;
  const old = previous.current;
  if (
    entries.length !== old.entries.length ||
    entries.some(
      ([key, label], index) => !Object.is(key, old.entries[index]?.[0]) || !Object.is(label, old.entries[index]?.[1]),
    )
  )
    previous.current = { entries, revision: {} };
  return { revision: previous.current.revision, known };
}

/** Requests supply provenance only. Value's native store supplies accepted state. */
function Select<Value, Multiple extends boolean | undefined = false>(
  props: SelectPrimitive.Root.Props<Value, Multiple>,
) {
  const [scope] = useState(createSelectScope);
  const [, requestCommit] = useState(0);
  committed(() => {
    scope.multiple = Boolean(props.multiple);
    scope.equal = (a, b) =>
      a == null || b == null
        ? Object.is(a, b)
        : (props.isItemEqualToValue?.(a as Value, b as Value) ?? Object.is(a, b));
  });
  committed(() => {
    if (
      scope.candidate?.approved &&
      (props.multiple || (props.value !== undefined && !scope.equal(props.value, scope.candidate.value)))
    )
      scope.retire();
    else if (scope.candidate?.approved) scope.candidate.capture?.retire();
  });
  committed(() => {
    const source = scope.candidate;
    if (source && (scope.trigger !== source.trigger || !scope.trigger?.querySelector("[data-select-value-text]")))
      scope.retire();
  });
  const input = useMotionHostRef<HTMLInputElement>(props.inputRef);

  committed(() => {
    const form = input.node.current?.form;
    if (!form) return;
    let alive = true;
    const reset = (event: Event) =>
      queueMicrotask(() => {
        if (!alive || event.defaultPrevented) return;
        scope.baseline++;
        scope.retire();
        scope.handoff.cancel();
        scope.transaction.cancel();
      });
    form.addEventListener("reset", reset);
    return () => {
      alive = false;
      form.removeEventListener("reset", reset);
    };
  });
  useInsertionEffect(
    () => () => {
      scope.retire();
      scope.handoff.dispose();
      scope.transaction.close();
    },
    [scope],
  );
  return (
    <SelectMotion value={scope}>
      <Labels value={props.items ? null : collectLabels(props.children)}>
        <SelectPrimitive.Root
          {...props}
          inputRef={input.ref}
          onValueChange={(value, details) => {
            props.onValueChange?.(value, details);
            const source = scope.candidate;
            if (details.isCanceled) scope.retire();
            else if (!props.multiple && source && source.event === details.event && scope.equal(source.value, value)) {
              source.approved = true;
              requestCommit((version) => version + 1);
            } else scope.retire();
            if (details.reason === "none") {
              scope.baseline++;
              scope.handoff.cancel();
              scope.transaction.cancel();
            }
          }}
        />
      </Labels>
    </SelectMotion>
  );
}

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return <SelectPrimitive.Group data-slot="select-group" className={stateClasses("", className)} {...props} />;
}
function SelectValue({ className, render, ...props }: SelectPrimitive.Value.Props) {
  const labels = useContext(Labels);
  const formatter =
    props.children ??
    (labels
      ? (value: unknown): ReactNode => {
          if (value == null || (Array.isArray(value) && value.length === 0)) return props.placeholder ?? null;
          if (Array.isArray(value)) return value.map((entry) => labels.get(entry) ?? (entry as ReactNode));
          return labels.get(value) ?? (value as ReactNode);
        }
      : undefined);
  return (
    <SelectPrimitive.Value
      {...props}
      className={stateClasses("block w-max", className)}
      render={(elementProps, state) => (
        <ValueSurface
          elementProps={elementProps}
          state={state}
          render={render}
          owned={typeof props.children !== "function"}
        />
      )}
    >
      {formatter}
    </SelectPrimitive.Value>
  );
}
function ValueSurface({
  elementProps,
  state,
  render,
  owned,
}: {
  elementProps: React.ComponentPropsWithRef<"span">;
  state: SelectPrimitive.Value.State;
  render: SelectPrimitive.Value.Props["render"];
  owned: boolean;
}) {
  const valueHost = useMotionHostRef<HTMLSpanElement>(elementProps.ref),
    width = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(valueHost.node);
  const ValueSurfacePaint = useStateColor(valueHost.ref, cm, ["color"], {
    readability: safeSelectPaint(elementProps) ? "verified" : "immediate",
    readabilityGate: selectColourReadable,
    readabilityScope: selectColourScope,
  });
  useSelectGeometry(width.node, valueHost.node, elementProps.children, cm, "width", Boolean(render));
  return (
    <span
      ref={width.ref}
      data-slot="select-value"
      data-motion={cm.mode}
      className="relative block min-w-0 overflow-hidden whitespace-nowrap"
    >
      {useRender({
        defaultTagName: "span",
        render,
        state: { ...state },
        props: {
          ...elementProps,
          ...ValueSurfacePaint,
          style: { ...ValueSurfacePaint.style, ...elementProps.style },
          "data-slot": "select-value-content",
          "data-motion": cm.mode,
          children:
            owned && !render ? (
              <SelectDisplay value={elementProps.children} selected={state.value} valueLane />
            ) : (
              elementProps.children
            ),
        },
      })}
    </span>
  );
}

function SelectTrigger({
  className,
  ref,
  size = "default",
  children,
  ...props
}: SelectPrimitive.Trigger.Props & { size?: "sm" | "default" }) {
  const host = useMotionHostRef<HTMLButtonElement>(ref),
    cm = useCadenceMotion(host.node);
  useSelectTrigger(host.node, cm);
  const SelectTriggerPaint = useStateColor(
    host.ref,
    cm,
    [
      "background-color",
      "color",
      "border-top-color",
      "border-right-color",
      "border-bottom-color",
      "border-left-color",
      "box-shadow",
    ],
    {
      readability: safeSelectPaint({ className, style: props.style }) ? "verified" : "immediate",
      readabilityGate: selectColourReadable,
      readabilityScope: selectColourScope,
    },
  );
  return (
    <SelectPrimitive.Trigger
      {...props}
      data-slot="select-trigger"
      data-size={size}
      className={stateClasses(
        cn(
          "relative flex h-9 w-fit items-center justify-between gap-2 overflow-hidden rounded-md border border-input bg-transparent px-3 pr-8 text-sm whitespace-nowrap shadow-xs outline-none select-none",
          "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
          "disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20",
          "data-[placeholder]:text-muted-foreground data-[size=default]:h-9 data-[size=sm]:h-8",
          "[&_[data-placeholder]]:text-muted-foreground",
          "dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:ring-destructive/40",
        ),
        className,
      )}
      {...SelectTriggerPaint}
      style={selectStyle(SelectTriggerPaint.style, props.style)}
    >
      {children}
      <SelectPrimitive.Icon
        render={
          <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 opacity-50" />
        }
      >
        {null}
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  alignItemWithTrigger = true,
  render,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<SelectPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger">) {
  const flow = useRef<HTMLDivElement>(null);
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        className="isolate z-50"
      >
        <SelectPrimitive.Popup
          {...props}
          data-align-trigger={alignItemWithTrigger}
          className={stateClasses(
            "relative z-50 max-h-(--available-height) w-(--anchor-width) min-w-[8rem] origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md outline-none",
            className,
          )}
          render={(elementProps, state) => (
            <PopupSurface
              elementProps={elementProps}
              state={state}
              render={render}
              aligned={alignItemWithTrigger}
              content={children}
              flow={flow}
            />
          )}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.List ref={flow} data-slot="select-list" className="p-1">
            {children}
          </SelectPrimitive.List>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}
function PopupSurface({
  elementProps,
  state,
  render,
  aligned,
  content,
  flow,
}: {
  elementProps: React.ComponentPropsWithRef<"div">;
  state: SelectPrimitive.Popup.State;
  render: SelectPrimitive.Popup.Props["render"];
  aligned: boolean;
  content: ReactNode;
  flow: React.RefObject<HTMLDivElement | null>;
}) {
  const options = useOptionRevision(content);
  const host = useMotionHostRef<HTMLDivElement>(elementProps.ref),
    cm = useCadenceMotion(host.node);
  const wrap = usePopupPresence(host.node, [], false, cm, "base");
  const controller = useRef<ReturnType<typeof createSelectPopup> | null>(null),
    connected = useRef<HTMLElement | null>(null);
  const PopupSurfacePaint = useStateColor(
    host.ref,
    cm,
    [
      "background-color",
      "color",
      "border-top-color",
      "border-right-color",
      "border-bottom-color",
      "border-left-color",
      "box-shadow",
    ],
    {
      readability: safeSelectPaint(elementProps) ? "verified" : "immediate",
      readabilityGate: selectColourReadable,
      readabilityScope: selectColourScope,
    },
  );
  committed(() => {
    if (connected.current !== host.node.current) {
      controller.current?.dispose();
      controller.current = null;
      connected.current = host.node.current;
    }
    if (host.node.current && !controller.current) controller.current = createSelectPopup(host.node.current);
    controller.current?.commit({ open: state.open, enter: state.open, cm });
  });
  useInsertionEffect(() => () => controller.current?.dispose(), []);
  useSelectGeometry(
    host.node,
    flow,
    options.revision,
    cm,
    "height",
    aligned || Boolean(render) || !state.open || !options.known,
  );
  return withCadenceScope(
    cm,
    wrap(
      useRender({
        defaultTagName: "div",
        render,
        state: { ...state, slot: "select-content" },
        props: {
          ...elementProps,
          ...PopupSurfacePaint,
          style: { ...PopupSurfacePaint.style, ...elementProps.style },
          "data-slot": "select-content",
          "data-motion": cm.mode,
          inert: state.open ? elementProps.inert : true,
          "aria-hidden": state.open ? elementProps["aria-hidden"] : true,
          children: elementProps.children,
        },
      }),
    ),
  );
}

function SelectLabel({ className, ref, children, ...props }: SelectPrimitive.GroupLabel.Props) {
  const host = useMotionHostRef<HTMLDivElement>(ref),
    cm = useCadenceMotion(host.node);
  const SelectLabelPaint = useStateColor(host.ref, cm, ["color"], {
    readability: safeSelectPaint({ className, style: props.style }) ? "verified" : "immediate",
    readabilityGate: selectColourReadable,
    readabilityScope: selectColourScope,
  });
  return (
    <SelectPrimitive.GroupLabel
      {...props}
      data-slot="select-label"
      className={stateClasses("px-2 py-1.5 text-xs text-muted-foreground", className)}
      {...SelectLabelPaint}
      style={selectStyle(SelectLabelPaint.style, props.style)}
    >
      <SelectDisplay value={children} />
    </SelectPrimitive.GroupLabel>
  );
}
function SelectSeparator({ className, ref, children, ...props }: SelectPrimitive.Separator.Props) {
  const host = useMotionHostRef<HTMLDivElement>(ref),
    cm = useCadenceMotion(host.node);
  const SelectSeparatorPaint = useStateColor(host.ref, cm, ["background-color"], {
    readability: safeSelectPaint({ className, style: props.style }) ? "verified" : "immediate",
    readabilityGate: selectColourReadable,
    readabilityScope: selectColourScope,
  });
  return (
    <SelectPrimitive.Separator
      {...props}
      data-slot="select-separator"
      className={stateClasses("pointer-events-none -mx-1 my-1 h-px bg-border", className)}
      {...SelectSeparatorPaint}
      style={selectStyle(SelectSeparatorPaint.style, props.style)}
    >
      {children}
    </SelectPrimitive.Separator>
  );
}
function SelectScrollUpButton({
  className,
  ref,
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
  const host = useMotionHostRef<HTMLDivElement>(ref),
    cm = useCadenceMotion(host.node);
  const SelectScrollUpButtonPaint = useStateColor(host.ref, cm, ["background-color", "color"], {
    readability: safeSelectPaint({ className, style: props.style }) ? "verified" : "immediate",
    readabilityGate: selectColourReadable,
    readabilityScope: selectColourScope,
  });
  return (
    <SelectPrimitive.ScrollUpArrow
      {...props}
      data-slot="select-scroll-up-button"
      className={stateClasses(
        "sticky top-0 z-[1] flex w-full cursor-default items-center justify-center bg-popover py-1",
        className,
      )}
      {...SelectScrollUpButtonPaint}
      style={selectStyle(SelectScrollUpButtonPaint.style, props.style)}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpArrow>
  );
}
function SelectScrollDownButton({
  className,
  ref,
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
  const host = useMotionHostRef<HTMLDivElement>(ref),
    cm = useCadenceMotion(host.node);
  const SelectScrollDownButtonPaint = useStateColor(host.ref, cm, ["background-color", "color"], {
    readability: safeSelectPaint({ className, style: props.style }) ? "verified" : "immediate",
    readabilityGate: selectColourReadable,
    readabilityScope: selectColourScope,
  });
  return (
    <SelectPrimitive.ScrollDownArrow
      {...props}
      data-slot="select-scroll-down-button"
      className={stateClasses(
        "sticky bottom-0 z-[1] flex w-full cursor-default items-center justify-center bg-popover py-1",
        className,
      )}
      {...SelectScrollDownButtonPaint}
      style={selectStyle(SelectScrollDownButtonPaint.style, props.style)}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownArrow>
  );
}

function SelectItem({ className, children, onClick, ref, ...props }: SelectPrimitive.Item.Props) {
  const host = useMotionHostRef<HTMLDivElement>(ref),
    cm = useCadenceMotion(host.node),
    scope = useContext(SelectMotion);
  const SelectItemPaint = useStateColor(host.ref, cm, ["background-color", "color"], {
    readability: safeSelectPaint({ className, style: props.style }) ? "verified" : "immediate",
    readabilityGate: selectColourReadable,
    readabilityScope: selectColourScope,
  });
  return (
    <SelectPrimitive.Item
      {...props}
      data-slot="select-item"
      className={stateClasses(
        cn(
          "relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none",
          "data-highlighted:bg-accent data-highlighted:text-accent-foreground",
          "data-disabled:pointer-events-none data-disabled:opacity-50",
          "[&_svg]:pointer-events-none [&_svg]:shrink-0",
        ),
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        if (!scope || scope.multiple || event.defaultPrevented || event.currentTarget.hasAttribute("data-selected"))
          return;
        scope.retire();
        const text = event.currentTarget.querySelector<HTMLElement>(
          '[data-slot="select-item-text"] [data-slot="select-text"]',
        );
        const previous = scope.trigger?.querySelector('[data-slot="select-value"]')?.textContent ?? "";
        const capture =
          text && event.detail > 0 && !cm.reduced ? selectOrigin(text, previous, text.textContent ?? "") : null;
        const candidate: SelectCandidate = {
          capture,
          value: props.value,
          trigger: scope.trigger,
          event: event.nativeEvent,
          approved: false,
        };
        scope.candidate = candidate;
        // Base has no request token for an asynchronous controlled echo. Do not
        // lend this origin to an unrelated later equal value or retain a queue.
        queueMicrotask(() => {
          if (scope.candidate === candidate && !candidate.approved) scope.retire();
        });
      }}
      {...SelectItemPaint}
      style={selectStyle(SelectItemPaint.style, props.style)}
    >
      <SelectPrimitive.ItemText data-slot="select-item-text" className="shrink-0 whitespace-nowrap">
        <SelectDisplay value={children} />
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        keepMounted
        render={(indicatorProps, state) => <SelectIndicator elementProps={indicatorProps} selected={state.selected} />}
      />
    </SelectPrimitive.Item>
  );
}
function SelectIndicator({
  elementProps,
  selected,
}: {
  elementProps: React.ComponentPropsWithRef<"span">;
  selected: boolean;
}) {
  const cm = useCadenceMotion();
  const parameters = cm.parameters(bindMotionParameters(stateIndicator, "state.morph/indicator"));
  if (parameters.kind !== "indicator") return null;
  return (
    <ControlSpan
      {...(elementProps as import("motion/react").HTMLMotionProps<"span">)}
      data-slot="select-item-indicator"
      data-motion={cm.mode}
      className={cn("absolute right-2 flex size-3.5 items-center justify-center", elementProps.className)}
      target={{ opacity: selected ? 1 : 0, scale: selected || cm.reduced ? 1 : parameters.scale }}
      transition={{ opacity: parameters.opacity, scale: parameters.spatial }}
    >
      <CheckIcon className="size-4" />
    </ControlSpan>
  );
}

itemTypes.add(SelectItem);
labelTypes.add(SelectLabel);

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
