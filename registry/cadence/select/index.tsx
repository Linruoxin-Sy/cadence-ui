"use client";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { animateSingleValue, type HTMLMotionProps, motion, useMotionValue, useTransform } from "motion/react";
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
import { captureHandoffOrigin, createCapturedHandoff } from "../lib/captured-handoff";
import { cn } from "../lib/cn";
import { ControlSpan } from "../lib/control-animation";
import { clampMeasuredSize } from "../lib/geometry";
import { motionLimits, scale } from "../lib/motion";
import { subscribeMotionEnvironment } from "../lib/motion-environment";
import { useMotionHostRef } from "../lib/motion-ref";
import { createMotionTransaction } from "../lib/motion-transaction";
import { popupClasses, popupStyle, stateClasses } from "../lib/popup-style";
import { useCadenceMotion, useCadenceMotionScope, withCadenceScope } from "../lib/provider";

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

interface HandoffSource {
  capture: ReturnType<typeof captureHandoffOrigin>;
  value: unknown;
  trigger: HTMLElement | null;
  event: Event;
  approved: boolean;
  taken?: boolean;
}

interface SelectContextValue {
  value: unknown;
  equal(a: unknown, b: unknown): boolean;
  candidate: { current: HandoffSource | null };
  trigger: { current: HTMLElement | null };
  pending: HandoffSource | null;
  setPending: (pending: HandoffSource | null) => void;
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
 * The slot keeps one native label. A captured plain replacement may transfer only
 * when it has no retained units; unsafe/missing origins remain immediate. A flight
 * never chases a moved destination or replays a cancelled revision.
 */
function Select<Value, Multiple extends boolean | undefined = false>(
  props: SelectPrimitive.Root.Props<Value, Multiple>,
) {
  const [pending, setPending] = useState<HandoffSource | null>(null);
  // This follows the primitive's accepted uncontrolled setter. Controlled
  // requests remain requests until the caller actually commits its value prop.
  const [nativeValue, setNativeValue] = useState<unknown>(() => props.defaultValue ?? (props.multiple ? [] : null));
  const controlled = useRef(props.value !== undefined).current;
  const trigger = useRef<HTMLElement | null>(null);
  const candidate = useRef<HandoffSource | null>(null);
  const capture = (next: HandoffSource | null) => {
    if (!candidate.current?.taken) candidate.current?.capture?.dispose();
    candidate.current = next;
    setPending(next);
  };
  useIsomorphicLayoutEffect(() => () => candidate.current?.capture?.dispose(), []);
  const labels = props.items ? null : collectLabels(props.children);
  const value = {
    value: controlled && props.value !== undefined ? props.value : nativeValue,
    equal: (a: unknown, b: unknown) =>
      a == null || b == null
        ? Object.is(a, b)
        : (props.isItemEqualToValue?.(a as Value, b as Value) ?? Object.is(a, b)),
    candidate,
    trigger,
    pending,
    setPending: capture,
    labels,
  };

  return (
    <SelectContext.Provider value={value}>
      <SelectPrimitive.Root
        {...props}
        onValueChange={(value, details) => {
          props.onValueChange?.(value, details);
          const source = candidate.current;
          if (details.isCanceled) capture(null);
          else {
            if (source && source.event === details.event) source.approved = true;
            if (!controlled) setNativeValue(() => value);
          }
        }}
      />
    </SelectContext.Provider>
  );
}

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return <SelectPrimitive.Group data-slot="select-group" className={stateClasses("", className)} {...props} />;
}

function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
  const cm = useCadenceMotion();
  const context = useContext(SelectContext);
  const hostRef = useRef<HTMLSpanElement>(null);
  const width = useMotionValue<number | "auto">("auto");
  const target = useRef(0);
  const floor = useRef(0);
  const clock = JSON.stringify(cm.transition("geometry.resize"));
  const activeClock = useRef(clock);
  const environment = useRef(false);
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
    let alive = true;
    const measure = () => {
      if (!alive || hostRef.current !== host) return;
      const next = (host.firstElementChild as HTMLElement | null)?.scrollWidth || host.scrollWidth;
      if (!next) return;
      const current = width.get();

      const transition = cm.transition("geometry.resize");
      const clockChanged = activeClock.current !== clock;
      activeClock.current = clock;
      if (current === "auto" || cm.reduced || environment.current || transition.duration === 0) {
        floor.current = 0;
        // Keep one MotionValue owner across mode changes. Switching from a
        // MotionValue to a React width prop lets queued Motion renders restore
        // the old numeric width after React has committed `auto`.
        const resting = cm.reduced || environment.current ? "auto" : next;
        width.jump(resting);
        host.style.width = typeof resting === "number" ? `${resting}px` : resting;
        target.current = next;
        return;
      }

      // A spring that inherits velocity can cross its target once. During a grow the
      // values below the target are the animation itself; during a shrink a value
      // below the target would clip the new label, so clamp only in that direction.
      floor.current = next < current ? next : 0;
      if (target.current === next && !clockChanged) return;
      target.current = next;
      animateSingleValue(width, next, transition);
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (host.firstElementChild) observer.observe(host.firstElementChild);
    return () => {
      alive = false;
      observer.disconnect();
    };
  });

  useIsomorphicLayoutEffect(() => () => width.stop(), [width]);
  useIsomorphicLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let alive = true;
    const unsubscribe = subscribeMotionEnvironment(host.ownerDocument, (next) => {
      if (!alive || hostRef.current !== host) return;
      environment.current = next.hidden || next.immediate;
      if (environment.current) {
        floor.current = 0;
        width.jump("auto");
        host.style.width = "auto";
      }
    });
    return () => {
      alive = false;
      unsubscribe();
    };
  }, [width]);

  return (
    <motion.span
      ref={hostRef}
      data-slot="select-value"
      data-motion={cm.mode}
      style={{ width: rendered }}
      className="relative block min-w-0 overflow-hidden whitespace-nowrap"
    >
      <SelectPrimitive.Value {...props} className={stateClasses("block w-max", className)}>
        {formatter}
      </SelectPrimitive.Value>
    </motion.span>
  );
}

function SelectTrigger({
  className,
  ref,
  size = "default",
  children,
  ...props
}: SelectPrimitive.Trigger.Props & {
  size?: "sm" | "default";
}) {
  const cm = useCadenceMotion();
  const context = useContext(SelectContext);
  const { node: triggerRef, ref: mergedRef } = useMotionHostRef<ComponentRef<typeof SelectPrimitive.Trigger>>(ref);
  useIsomorphicLayoutEffect(() => {
    if (!context) return;
    const node = triggerRef.current;
    context.trigger.current = node;
    return () => {
      if (context.trigger.current === node) context.trigger.current = null;
    };
  });
  const coordinator = useRef<ReturnType<typeof createCapturedHandoff> | null>(null);
  const transaction = useRef(createMotionTransaction());
  const latest = useRef(context);
  const semanticValue = useRef(context?.value);
  const active = useRef<Parameters<ReturnType<typeof createCapturedHandoff>["commit"]>[0] | null>(null);
  const ready = useRef(false);
  useIsomorphicLayoutEffect(() => {
    const owner = createCapturedHandoff(transaction.current);
    coordinator.current = owner;
    triggerRef.invalidate = () => owner.cancel();
    return () => {
      owner.dispose();
      active.current?.capture?.dispose();
      active.current = null;
      coordinator.current = null;
    };
  }, [triggerRef]);
  useIsomorphicLayoutEffect(() => {
    latest.current = context;
    const trigger = triggerRef.current;
    if (!context || !trigger) {
      coordinator.current?.cancel();
      return;
    }
    if (!context.equal(semanticValue.current, context.value)) semanticValue.current = context.value;
    const revision = transaction.current.revision("value", semanticValue.current, trigger);
    if (active.current && active.current.revision !== revision) {
      coordinator.current?.cancel();
      active.current?.capture?.dispose();
      active.current = null;
    }
    const source = context.pending;
    if (source) {
      const destination = trigger.querySelector<HTMLElement>('[data-slot="select-value"]')
        ?.firstElementChild as HTMLElement | null;
      source.taken = true;
      context.setPending(null);
      if (
        !source.approved ||
        !context.equal(context.value, source.value) ||
        source.trigger !== trigger ||
        !destination
      ) {
        source.capture?.dispose();
        return;
      }
      const identity = triggerRef.identity;
      active.current = {
        revision,
        slot: "select-handoff",
        capture: source.capture,
        destination,
        transition: cm.transition("handoff"),
        immediate: cm.reduced,
        sourceRetired: true,
        current: () =>
          triggerRef.current === trigger &&
          triggerRef.identity === identity &&
          Boolean(latest.current?.equal(latest.current.value, source.value)),
        fallback() {
          active.current = null;
        },
        terminal() {
          if (active.current?.revision === revision) active.current = null;
        },
      };
      // Base UI commits Value from its own store. Assess the actual label after
      // this commit's layout work, never by hiding the previous display or by
      // keeping a missing origin pending for a future content revision.
      ready.current = false;
      const accepted = active.current;
      queueMicrotask(() => {
        if (active.current !== accepted) return;
        ready.current = true;
        coordinator.current?.commit(accepted);
      });
    }
    if (active.current) {
      active.current.transition = cm.transition("handoff");
      active.current.immediate = cm.reduced;
      if (ready.current) coordinator.current?.commit(active.current);
    }
  });

  return (
    <SelectPrimitive.Trigger
      ref={mergedRef}
      data-slot="select-trigger"
      data-size={size}
      data-motion={cm.mode}
      className={stateClasses(
        cn(
          "relative flex h-9 w-fit items-center justify-between gap-2 overflow-hidden rounded-md border border-input bg-transparent px-3 pr-8 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none select-none",
          "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
          "disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20",
          "data-[placeholder]:text-muted-foreground data-[size=default]:h-9 data-[size=sm]:h-8",
          "[&_[data-placeholder]]:text-muted-foreground",
          "dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:ring-destructive/40",
        ),
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
  );
}

/**
 * The popup is CSS-only: Base UI's `data-starting-style` / `data-ending-style`
 * drive the opacity and scale classes, so the close can be interrupted by
 * reopening and `data-motion="none"` zeroes the duration variables.
 */
function SelectContent({
  className,
  style,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  alignItemWithTrigger = true,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<SelectPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger">) {
  const { cm, ref: scopeRef } = useCadenceMotionScope(props.ref);

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
        {withCadenceScope(
          cm,
          <SelectPrimitive.Popup
            data-slot="select-content"
            data-motion={cm.mode}
            data-cadence-scope=""
            data-align-trigger={alignItemWithTrigger}
            style={popupStyle(cm, style)}
            className={popupClasses(
              cm,
              cn(
                "relative z-50 max-h-(--available-height) w-(--anchor-width) min-w-[8rem] origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md outline-none",
                "transition-[opacity,scale] ease-cadence-out duration-(--motion-duration-fast) data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
                !cm.reduced &&
                  "data-[ending-style]:scale-(--motion-scale-in) data-[starting-style]:scale-(--motion-scale-in)",
              ),
              className,
            )}
            {...props}
            ref={scopeRef}
          >
            <SelectScrollUpButton />
            <SelectPrimitive.List className="p-1">{children}</SelectPrimitive.List>
            <SelectScrollDownButton />
          </SelectPrimitive.Popup>,
        )}
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({ className, ...props }: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={stateClasses(cn("px-2 py-1.5 text-xs text-muted-foreground"), className)}
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
        if (event.defaultPrevented || event.currentTarget.hasAttribute("data-selected")) return;

        const text = event.currentTarget.querySelector<HTMLElement>('[data-slot="select-item-text"]');
        const previous = context?.trigger.current?.querySelector('[data-slot="select-value"]')?.textContent ?? "";
        const next = text?.textContent ?? "";
        // Until the changed-run renderer is integrated, only a completely new,
        // bounded plain ASCII run can transfer. Any potentially retained unit,
        // rich label, shaping or editable content stays native and immediate.
        const disjoint =
          previous.length > 0 &&
          previous.length + next.length <= motionLimits.changedGraphemes &&
          /^[\x21-\x7e]+$/.test(previous) &&
          /^[\x21-\x7e]+$/.test(next) &&
          ![...previous].some((unit) => next.includes(unit));
        const capture =
          text && disjoint && event.detail > 0 && !cm.reduced
            ? captureHandoffOrigin(
                text,
                next,
                null,
                event.currentTarget.closest<HTMLElement>('[data-slot="select-content"]') ?? text,
              )
            : null;
        context?.setPending({
          capture,
          value: props.value,
          trigger: context?.trigger.current ?? null,
          event: event.nativeEvent,
          approved: false,
        });
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
            <ControlSpan
              {...(rest as HTMLMotionProps<"span">)}
              data-slot="select-item-indicator"
              data-motion={cm.mode}
              className={cn("absolute right-2 flex size-3.5 items-center justify-center", indicatorClassName)}
              target={state.selected ? { opacity: 1, scale: 1 } : { opacity: 0, scale: cm.reduced ? 1 : scale.in }}
              transition={{ ...cm.transition("state.morph"), ...(cm.reduced ? { scale: { duration: 0 } } : {}) }}
            >
              <CheckIcon className="size-4" />
            </ControlSpan>
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
      className={stateClasses(cn("pointer-events-none -mx-1 my-1 h-px bg-border"), className)}
      {...props}
    />
  );
}

function SelectScrollUpButton({ className, ...props }: ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={stateClasses(
        cn("sticky top-0 z-[1] flex w-full cursor-default items-center justify-center bg-popover py-1"),
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
      className={stateClasses(
        cn("sticky bottom-0 z-[1] flex w-full cursor-default items-center justify-center bg-popover py-1"),
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
