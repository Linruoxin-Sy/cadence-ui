"use client";
import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group";
import { useRender } from "@base-ui/react/use-render";
import type { VariantProps } from "class-variance-authority";
import {
  type ComponentPropsWithRef,
  type CSSProperties,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cn } from "../lib/cn";
import { ControlSpan } from "../lib/control-animation";
import { useStateColor } from "../lib/css-motion";
import { bindMotionParameters, feedbackPress, stateIndicator } from "../lib/motion";
import { useMotionHostRef } from "../lib/motion-ref";
import { useCadenceMotion } from "../lib/provider";
import { toggleGroupColourReadable, toggleGroupColourScope } from "../lib/toggle-group-colour";
import { ToggleGroupSurface, useToggleGroupItem, useToggleGroupTransaction } from "../lib/toggle-group-motion";
import { useTextPresentation } from "../lib/use-text-presentation";
import { toggleVariants } from "../toggle";

type ToggleGroupVariant = "default" | "outline" | "segmented";
type ToggleGroupAppearance = Omit<VariantProps<typeof toggleVariants>, "variant"> & {
  variant?: ToggleGroupVariant | null;
};

const ToggleGroupContext = createContext<
  ToggleGroupAppearance & {
    spacing?: number;
    orientation?: "horizontal" | "vertical";
    multiple?: boolean;
  }
>({
  size: "default",
  variant: "default",
  spacing: 0,
  orientation: "horizontal",
});

export interface ToggleGroupProps extends ToggleGroupPrimitive.Props, ToggleGroupAppearance {
  spacing?: number;
  orientation?: "horizontal" | "vertical";
}
export interface ToggleGroupItemProps extends TogglePrimitive.Props, ToggleGroupAppearance {}

function ToggleGroup({
  className,
  variant,
  size,
  style,
  spacing = 0,
  orientation = "horizontal",
  multiple = false,
  children,
  render,
  ...props
}: ToggleGroupProps) {
  return (
    <ToggleGroupPrimitive
      render={(elementProps, state) => (
        <ToggleGroupSurface
          elementProps={elementProps}
          state={{ ...state, slot: "toggle-group" }}
          render={render}
          variant={variant ?? "default"}
          knownPaint={safePaint(className, style)}
        />
      )}
      data-variant={variant}
      data-size={size}
      data-spacing={spacing}
      orientation={orientation}
      data-orientation={orientation}
      multiple={multiple}
      data-multiple={multiple ? "" : undefined}
      style={(state) =>
        ({ "--gap": spacing, ...(typeof style === "function" ? style(state) : style) }) as CSSProperties
      }
      className={(state) =>
        cn(
          // Orientation is a JS branch, not a `data-vertical:` variant: Base UI writes
          // `data-orientation="vertical"`, while the shorthand utility compiles to
          // `[data-vertical]`, which nothing ever sets — a vertical group would lay out
          // as a row.
          "group/toggle-group relative isolate flex w-fit max-w-full gap-[calc(var(--spacing)*var(--gap))] rounded-lg p-1",
          orientation === "vertical" ? "flex-col items-stretch" : "items-center",
          variant === "segmented" ? "rounded-full bg-muted/60" : "border border-border/60 bg-muted/40",
          variant === "outline" && "bg-background shadow-xs",
          typeof className === "function" ? className(state) : className,
        )
      }
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size, spacing, orientation, multiple }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive>
  );
}

function ItemSurface({
  elementProps,
  state,
  render,
  variant,
  value,
  content,
  knownPaint,
}: {
  elementProps: ComponentPropsWithRef<"button">;
  state: TogglePrimitive.State;
  render: TogglePrimitive.Props["render"];
  variant: ToggleGroupAppearance["variant"];
  value: unknown;
  content: React.ReactNode;
  knownPaint: boolean;
}) {
  const { node, ref } = useMotionHostRef(elementProps.ref);
  const cm = useCadenceMotion(node);
  const context = useContext(ToggleGroupContext);
  const ItemPaint = useStateColor(
    ref,
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
      readability: knownPaint ? "verified" : "immediate",
      readabilityGate: toggleGroupColourReadable,
      readabilityScope: toggleGroupColourScope,
    },
  );
  useToggleGroupItem(node, value, state.pressed, [
    typeof content === "string" || typeof content === "number" ? content : null,
    elementProps.className,
    elementProps.style,
  ]);
  const [held, setHeld] = useState(false);
  const owner = useRef<number | string | null>(null);
  const staleActivation = useRef(false);
  const release = useCallback(() => {
    owner.current = null;
    setHeld(false);
  }, []);
  const disabled = state.disabled || elementProps["aria-disabled"] === true || elementProps["aria-disabled"] === "true";
  const plain = typeof content === "string" || typeof content === "number";
  const press = cm.parameters(bindMotionParameters(feedbackPress, "feedback.press/scale"));
  const safePress = plain && !render;
  useLayoutEffect(() => {
    if (disabled) {
      if (owner.current !== null) staleActivation.current = true;
      release();
    }
  }, [disabled, release]);
  useEffect(() => {
    if (!held) return;
    const end = (event: PointerEvent) => {
      if (event.pointerId === owner.current) release();
    };
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, [held, release]);
  const signature = useRef("");
  useLayoutEffect(() => {
    const host = node.current;
    if (!host) return;
    const reconcile = () => {
      const next = JSON.stringify([
        value,
        host.tagName,
        ...["type", "form", "formaction", "href"].map((name) => host.getAttribute(name)),
      ]);
      if (signature.current && signature.current !== next) {
        if (owner.current !== null) staleActivation.current = true;
        release();
      }
      signature.current = next;
    };
    reconcile();
    const observer = new MutationObserver(reconcile);
    observer.observe(host, { attributes: true, attributeFilter: ["type", "form", "formaction", "href"] });
    return () => observer.disconnect();
  });
  const children = !render && plain ? <GroupText value={String(content)} identity={value} /> : elementProps.children;
  return useRender({
    defaultTagName: "button",
    render,
    state: { ...state, slot: "toggle-group-item" },
    stateAttributesMapping: { pressed: () => null, disabled: () => null },
    props: {
      ...elementProps,
      ...ItemPaint,
      "data-slot": "toggle-group-item",
      style: { ...ItemPaint.style, ...elementProps.style },
      ref: ItemPaint.ref,
      "data-motion": cm.mode,
      onPointerDown(event: React.PointerEvent<HTMLButtonElement>) {
        elementProps.onPointerDown?.(event);
        if (!disabled && event.button === 0 && event.isPrimary && owner.current === null) {
          staleActivation.current = false;
          owner.current = event.pointerId;
          setHeld(true);
        }
      },
      onPointerUp(event: React.PointerEvent<HTMLButtonElement>) {
        elementProps.onPointerUp?.(event);
        if (owner.current === event.pointerId) release();
      },
      onPointerCancel(event: React.PointerEvent<HTMLButtonElement>) {
        elementProps.onPointerCancel?.(event);
        if (owner.current === event.pointerId) release();
      },
      onLostPointerCapture(event: React.PointerEvent<HTMLButtonElement>) {
        elementProps.onLostPointerCapture?.(event);
        if (owner.current === event.pointerId) release();
      },
      onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
        elementProps.onKeyDown?.(event);
        if (
          !disabled &&
          (event.key === "Enter" || event.key === " ") &&
          event.target === event.currentTarget &&
          owner.current === null
        ) {
          staleActivation.current = false;
          owner.current = event.key;
          setHeld(true);
        }
      },
      onKeyUp(event: React.KeyboardEvent<HTMLButtonElement>) {
        elementProps.onKeyUp?.(event);
        if (owner.current === event.key) release();
      },
      onBlur(event: React.FocusEvent<HTMLButtonElement>) {
        elementProps.onBlur?.(event);
        release();
      },
      onClick(event: React.MouseEvent<HTMLButtonElement>) {
        if (staleActivation.current) {
          event.preventDefault();
          return;
        }
        elementProps.onClick?.(event);
      },
      children: (
        <>
          {context.multiple ? (
            <LocalIndicator selected={state.pressed} variant={variant} knownPaint={knownPaint} />
          ) : (
            state.pressed && (
              <span
                aria-hidden="true"
                data-slot="toggle-group-fallback"
                data-motion={cm.mode}
                className={cn(
                  "pointer-events-none absolute inset-0 -z-10 rounded-[inherit] bg-accent group-data-[marker-ready]/toggle-group:hidden",
                  variant === "segmented" && "bg-background shadow-sm dark:bg-input",
                )}
              />
            )
          )}
          {safePress && press.kind === "press" ? (
            <ControlSpan
              data-slot="toggle-group-content"
              data-motion={cm.mode}
              className="relative z-10 inline-flex items-center justify-center gap-[inherit]"
              target={{ scale: cm.reduced || disabled ? 1 : held ? press.scale : 1 }}
              transition={press.transition}
            >
              {children}
            </ControlSpan>
          ) : (
            children
          )}
        </>
      ),
    },
  });
}
function LocalIndicator({
  selected,
  variant,
  knownPaint,
}: {
  selected: boolean;
  variant: ToggleGroupAppearance["variant"];
  knownPaint: boolean;
}) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const LocalPaint = useStateColor(ref, cm, ["background-color", "box-shadow"], {
    readability: knownPaint ? "verified" : "immediate",
    readabilityGate: toggleGroupColourReadable,
    readabilityScope: toggleGroupColourScope,
  });
  const parameters = cm.parameters(bindMotionParameters(stateIndicator, "state.morph/indicator"));
  if (parameters.kind !== "indicator") return null;
  return (
    <ControlSpan
      {...LocalPaint}
      aria-hidden="true"
      data-slot="toggle-group-local-indicator"
      data-motion={cm.mode}
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 rounded-[inherit] bg-accent",
        variant === "segmented" && "bg-background shadow-sm dark:bg-input",
      )}
      target={{ opacity: selected ? 1 : 0, scale: cm.reduced || selected ? 1 : parameters.scale }}
      transition={{ opacity: parameters.opacity, scale: parameters.spatial }}
    />
  );
}
function GroupText({ value, identity }: { value: string; identity: unknown }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const entity = useRef({ identity, token: {} });
  if (!Object.is(identity, entity.current.identity)) entity.current = { identity, token: {} };
  const transaction = useToggleGroupTransaction();
  const text = useTextPresentation(
    node,
    value,
    cm,
    entity.current.token,
    { characterStagger: false, stripGeometry: true },
    transaction,
  );
  return (
    <span ref={ref} data-slot="toggle-group-text" data-motion={cm.mode}>
      {text}
    </span>
  );
}
function ToggleGroupItem({ className, children, variant, size, render, ...props }: ToggleGroupItemProps) {
  const cm = useCadenceMotion();
  const context = useContext(ToggleGroupContext);
  const resolvedVariant = context.variant ?? variant;
  const resolvedSize = context.size ?? size;
  // Neighbor joins follow the group's axis and use logical inline corners for RTL.
  const vertical = context.orientation === "vertical";
  const joined = context.spacing === 0;

  return (
    <TogglePrimitive
      data-variant={resolvedVariant}
      data-size={resolvedSize}
      data-spacing={context.spacing}
      data-motion={cm.mode}
      className={(state) =>
        cn(
          toggleVariants({ size: resolvedSize }),
          "relative w-auto min-w-0 shrink-0 rounded-md px-3 text-muted-foreground hover:bg-transparent hover:text-foreground data-pressed:bg-transparent data-pressed:text-foreground",
          resolvedVariant === "segmented" && "rounded-full",
          joined &&
            context.multiple &&
            (vertical
              ? "data-pressed:[&:has(+[data-pressed])]:rounded-b-none [&[data-pressed]+[data-pressed]]:rounded-t-none"
              : "data-pressed:[&:has(+[data-pressed])]:rounded-e-none [&[data-pressed]+[data-pressed]]:rounded-s-none"),
          typeof className === "function" ? className(state) : className,
        )
      }
      render={(elementProps, state) => (
        <ItemSurface
          elementProps={elementProps}
          state={state}
          render={render}
          variant={resolvedVariant}
          value={props.value}
          content={children}
          knownPaint={safePaint(className, props.style)}
        />
      )}
      {...props}
    >
      {children}
    </TogglePrimitive>
  );
}

export { ToggleGroup, ToggleGroupItem };

function safePaint(className: unknown, style: unknown) {
  return (
    typeof className !== "function" &&
    typeof style !== "function" &&
    !Object.keys((style ?? {}) as object).some((key) =>
      /color|background|shadow|opacity|filter|blend|^--(?!motion-|cadence-|ease-)/i.test(key),
    ) &&
    (typeof className !== "string" ||
      className
        .split(/\s+/)
        .every((name) =>
          /^(?:[\w-]+:)*(?:w-|h-|size-|min-|max-|p[xytrblse]?-|m[xytrblse]?-|gap-|flex|inline-|block|grid|shrink|grow|basis-|items-|justify-|self-|order-|relative|overflow-)/.test(
            name,
          ),
        ))
  );
}
