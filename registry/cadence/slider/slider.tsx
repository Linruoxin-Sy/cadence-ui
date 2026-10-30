"use client";

import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { type HTMLMotionProps, motion } from "motion/react";
import type * as React from "react";
import { useMemo } from "react";
import { cn } from "../lib/cn";
import { scale } from "../lib/motion";
import { useCadenceMotion } from "../lib/provider";

export interface SliderProps<Value extends number | readonly number[] = number | readonly number[]>
  extends SliderPrimitive.Root.Props<Value> {}

/**
 * A value picked by dragging a thumb along a track. One thumb for a value, two
 * for a range.
 *
 * Recipe: `feedback.press` — the thumb compresses while it is being dragged, the
 * same press language as `button` and `toggle`.
 *
 * Motion contract:
 * - full: the dragged thumb scales to 0.97 and springs back on release
 * - reduced / none: no scale; the ring and the fill carry the interaction
 *
 * The fill is never animated: it is glued to the pointer, and a transition
 * would make it lag behind the thumb by one frame per move.
 *
 * a11y: Base UI renders a native `input[type=range]` inside every thumb, so the
 * slider is keyboard-reachable and arrow keys step the value. `aria-label` is
 * forwarded to each thumb with a distinct suffix — a range slider with two thumbs
 * and one shared name reads as two controls with the same name. Invalid state
 * comes from `aria-invalid`; the component does not validate (P11).
 */
function Slider<Value extends number | readonly number[] = number | readonly number[]>({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...props
}: SliderProps<Value>) {
  const cm = useCadenceMotion();
  const _values = useMemo(
    () => (Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [min, max]),
    [value, defaultValue, min, max],
  );
  const thumbCount = _values.length;

  const labelFor = (index: number) => {
    if (!ariaLabel || thumbCount === 1) return ariaLabel;
    if (thumbCount === 2) return `${ariaLabel} (${index === 0 ? "minimum" : "maximum"})`;
    return `${ariaLabel} (${index + 1} of ${thumbCount})`;
  };

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      data-motion={cm.mode}
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge"
      className={cn("data-horizontal:w-full data-vertical:h-full", className)}
      {...props}
    >
      <SliderPrimitive.Control className="relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:w-auto data-vertical:flex-col">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative grow overflow-hidden rounded-full bg-muted select-none data-horizontal:h-1.5 data-horizontal:w-full data-vertical:h-full data-vertical:w-1.5"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="bg-primary select-none data-horizontal:h-full data-vertical:w-full"
          />
        </SliderPrimitive.Track>
        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            // biome-ignore lint/suspicious/noArrayIndexKey: a thumb has no identity beyond its position in the value array — Base UI's own `index` prop is the same number.
            key={index}
            index={index}
            aria-label={labelFor(index)}
            aria-labelledby={ariaLabelledBy}
            render={(thumbProps, state) => {
              const { className: thumbClassName, ...rest } = thumbProps as React.HTMLProps<HTMLDivElement>;

              return (
                <motion.div
                  {...(rest as HTMLMotionProps<"div">)}
                  className={cn(
                    "block size-4 shrink-0 rounded-full border border-primary bg-white shadow-sm ring-ring/50 outline-none transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4",
                    "data-disabled:pointer-events-none data-disabled:opacity-50",
                    thumbClassName,
                  )}
                  initial={false}
                  animate={{ scale: state.dragging && !cm.reduced ? scale.press : 1 }}
                  transition={cm.transition("feedback.press")}
                />
              );
            }}
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };
