"use client";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { animate, type HTMLMotionProps, motion, useMotionValue, useTransform } from "motion/react";
import {
  Children,
  type ComponentProps,
  type ComponentRef,
  createContext,
  type HTMLProps,
  isValidElement,
  type ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/cn";
import { clampMeasuredSize, measureOrigin, type Origin } from "../lib/geometry";
import { scale } from "../lib/motion";
import { useCadenceMotion } from "../lib/provider";

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

interface HandoffSource {
  rect: DOMRect;
  text: string;
}

interface SelectContextValue {
  pending: HandoffSource | null;
  setPending: (pending: HandoffSource | null) => void;
  flying: boolean;
  setFlying: (flying: boolean) => void;
  labels: Map<unknown, ReactNode> | null;
}

const SelectContext = createContext<SelectContextValue | null>(null);

/**
 * Base UI only resolves item labels from the `items` prop; without it `SelectValue`
 * would render the raw value. Most shadcn call sites pass `<SelectItem value="next">
 * Next.js</SelectItem>` and expect the label, so derive the map from the children
 * when `items` is absent. A custom item wrapper is simply not in the map, and the
 * value falls back to itself.
 */
function collectLabels(children: ReactNode, labels = new Map<unknown, ReactNode>()) {
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === SelectItem) {
      const item = child.props as { value?: unknown; children?: ReactNode };
      if (item.value !== undefined) labels.set(item.value, item.children);
      return;
    }
    const nested = (child.props as { children?: ReactNode }).children;
    if (nested) collectLabels(nested, labels);
  });
  return labels;
}

/**
 * Motion contract (`geometry.resize` + `handoff` + `state.morph` + `popup.anchored`):
 * - full: the trigger's value slot folds to its new width (`geometry.resize`), a pointer
 *   selection flies the label from the item to that slot (`handoff`), and the check mark
 *   scales in (`state.morph`).
 * - reduced: the width jumps, the handoff is skipped (the value is simply shown), and the
 *   check mark appears at full size; the popup still cross-fades.
 * - none: every transition resolves to zero duration.
 *
 * The label is laid out at its final width inside a clipped slot. Animating the slot's
 * width therefore folds the surface without re-wrapping the text, and the handoff's
 * destination does not move while the width settles.
 */
function Select<Value, Multiple extends boolean | undefined = false>(
  props: SelectPrimitive.Root.Props<Value, Multiple>,
) {
  const [pending, setPending] = useState<HandoffSource | null>(null);
  const [flying, setFlying] = useState(false);
  const labels = props.items ? null : collectLabels(props.children);
  const value = { pending, setPending, flying, setFlying, labels };

  return (
    <SelectContext.Provider value={value}>
      <SelectPrimitive.Root {...props} />
    </SelectContext.Provider>
  );
}

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return <SelectPrimitive.Group data-slot="select-group" className={cn(className)} {...props} />;
}

function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
  const cm = useCadenceMotion();
  const context = useContext(SelectContext);
  const hostRef = useRef<HTMLSpanElement>(null);
  const width = useMotionValue<number | "auto">("auto");
  const target = useRef(0);
  const floor = useRef(0);
  const rendered = useTransform(width, (value) =>
    typeof value === "number" ? clampMeasuredSize(value, floor.current) : value,
  );
  const formatter =
    props.children ??
    (context?.labels
      ? (value: unknown): ReactNode => {
          if (value == null || (Array.isArray(value) && value.length === 0)) return props.placeholder ?? null;
          if (Array.isArray(value)) return value.map((entry) => context.labels?.get(entry) ?? (entry as ReactNode));
          return context.labels?.get(value) ?? (value as ReactNode);
        }
      : undefined);

  useIsomorphicLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const next = host.scrollWidth;
    if (!next) return;
    const current = width.get();

    if (current === "auto" || cm.reduced) {
      floor.current = 0;
      width.jump(next);
      target.current = next;
      return;
    }

    // A spring that inherits velocity can cross its target once. During a grow the
    // values below the target are the animation itself; during a shrink a value
    // below the target would clip the new label, so clamp only in that direction.
    floor.current = next < current ? next : 0;
    if (target.current === next) return;
    target.current = next;
    animate(width, next, cm.transition("geometry.resize"));
  });

  return (
    <motion.span
      ref={hostRef}
      data-slot="select-value"
      data-motion={cm.mode}
      style={{ width: rendered, opacity: context?.flying ? 0 : 1 }}
      className={cn("relative block min-w-0 overflow-hidden whitespace-nowrap", className)}
    >
      <SelectPrimitive.Value {...props} className="block w-max">
        {formatter}
      </SelectPrimitive.Value>
    </motion.span>
  );
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: SelectPrimitive.Trigger.Props & {
  size?: "sm" | "default";
}) {
  const cm = useCadenceMotion();
  const context = useContext(SelectContext);
  const triggerRef = useRef<ComponentRef<typeof SelectPrimitive.Trigger>>(null);
  const [flight, setFlight] = useState<{ origin: Origin; text: string; rect: DOMRect } | null>(null);

  useIsomorphicLayoutEffect(() => {
    if (!context?.pending) return;
    if (cm.reduced) {
      context.setPending(null);
      return;
    }

    const trigger = triggerRef.current;
    const slot = trigger?.querySelector<HTMLElement>('[data-slot="select-value"]');
    const text = slot?.firstElementChild as HTMLElement | null;
    const rect = (text ?? slot)?.getBoundingClientRect();
    if (!rect?.width) {
      context.setPending(null);
      return;
    }

    setFlight({ origin: measureOrigin(context.pending.rect, rect), text: context.pending.text, rect });
    context.setFlying(true);
    context.setPending(null);
  }, [context, cm.reduced]);

  const finish = () => {
    setFlight(null);
    context?.setFlying(false);
  };

  return (
    <>
      <SelectPrimitive.Trigger
        ref={triggerRef}
        data-slot="select-trigger"
        data-size={size}
        data-motion={cm.mode}
        className={cn(
          "relative flex h-9 w-fit items-center justify-between gap-2 overflow-hidden rounded-md border border-input bg-transparent px-3 pr-8 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none select-none",
          "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
          "disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20",
          "data-[placeholder]:text-muted-foreground data-[size=default]:h-9 data-[size=sm]:h-8",
          "[&_[data-placeholder]]:text-muted-foreground",
          "dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:ring-destructive/40",
          className,
        )}
        {...props}
      >
        {children}
        <SelectPrimitive.Icon
          render={
            <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 opacity-50" />
          }
        />
      </SelectPrimitive.Trigger>
      {flight && typeof document !== "undefined"
        ? createPortal(
            <motion.span
              aria-hidden
              data-slot="select-handoff"
              initial={{ x: flight.origin.x, y: flight.origin.y }}
              animate={{ x: 0, y: 0 }}
              transition={cm.transition("handoff")}
              onAnimationComplete={finish}
              style={{
                position: "fixed",
                left: flight.rect.left,
                top: flight.rect.top,
                width: flight.rect.width,
                height: flight.rect.height,
              }}
              className="pointer-events-none z-[60] flex items-center overflow-hidden text-sm whitespace-nowrap"
            >
              {flight.text}
            </motion.span>,
            document.body,
          )
        : null}
    </>
  );
}

/**
 * The popup is CSS-only: Base UI's `data-starting-style` / `data-ending-style`
 * drive the opacity and scale classes, so the close can be interrupted by
 * reopening and `data-motion="none"` zeroes the duration variables.
 */
function SelectContent({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  alignItemWithTrigger = true,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<SelectPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger">) {
  const cm = useCadenceMotion();

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
          data-slot="select-content"
          data-motion={cm.mode}
          data-align-trigger={alignItemWithTrigger}
          className={cn(
            "relative z-50 max-h-(--available-height) w-(--anchor-width) min-w-[8rem] origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md outline-none",
            "transition-[opacity,scale] ease-cadence-out duration-(--motion-duration-fast) data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
            !cm.reduced &&
              "data-[ending-style]:scale-(--motion-scale-in) data-[starting-style]:scale-(--motion-scale-in)",
            className,
          )}
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.List className="p-1">{children}</SelectPrimitive.List>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({ className, ...props }: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cn("px-2 py-1.5 text-xs text-muted-foreground", className)}
      {...props}
    />
  );
}

function SelectItem({ className, children, onClick, ...props }: SelectPrimitive.Item.Props) {
  const cm = useCadenceMotion();
  const context = useContext(SelectContext);

  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none",
        "data-highlighted:bg-accent data-highlighted:text-accent-foreground",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || event.currentTarget.hasAttribute("data-selected")) return;

        const text = event.currentTarget.querySelector<HTMLElement>('[data-slot="select-item-text"]');
        const rect = (text ?? event.currentTarget).getBoundingClientRect();
        context?.setPending({ rect, text: text?.textContent?.trim() ?? "" });
      }}
      {...props}
    >
      <SelectPrimitive.ItemText data-slot="select-item-text" className="shrink-0 whitespace-nowrap">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        keepMounted
        render={(indicatorProps, state) => {
          const { className: indicatorClassName, ...rest } = indicatorProps as HTMLProps<HTMLSpanElement>;

          return (
            <motion.span
              {...(rest as HTMLMotionProps<"span">)}
              data-slot="select-item-indicator"
              data-motion={cm.mode}
              className={cn("absolute right-2 flex size-3.5 items-center justify-center", indicatorClassName)}
              initial={false}
              animate={state.selected ? { opacity: 1, scale: 1 } : { opacity: 0, scale: cm.reduced ? 1 : scale.in }}
              transition={cm.transition("state.morph")}
            >
              <CheckIcon className="size-4" />
            </motion.span>
          );
        }}
      />
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({ className, ...props }: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}

function SelectScrollUpButton({ className, ...props }: ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn(
        "sticky top-0 z-[1] flex w-full cursor-default items-center justify-center bg-popover py-1",
        className,
      )}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpArrow>
  );
}

function SelectScrollDownButton({ className, ...props }: ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn(
        "sticky bottom-0 z-[1] flex w-full cursor-default items-center justify-center bg-popover py-1",
        className,
      )}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownArrow>
  );
}

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
