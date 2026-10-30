"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { type HTMLMotionProps, motion } from "motion/react";
import { type Ref, type RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "../lib/cn";
import { useCadenceMotion } from "../lib/provider";

export interface SwitchProps extends SwitchPrimitive.Root.Props {
  /** Track and thumb scale. Upstream's Base UI source ships the same prop. */
  size?: "sm" | "default";
}

type ThumbRenderProps = React.HTMLProps<HTMLSpanElement> & { ref?: Ref<HTMLSpanElement> };

/** `useLayoutEffect` warns on the server; the fallback keeps SSR quiet without a flash on first paint. */
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * An on/off control with a thumb that travels from one end of the track to the
 * other. The travel distance is measured, not written down: the track and the
 * thumb are sized by CSS, so a consumer who restyles `--size-*` keeps a correct
 * end position.
 *
 * Recipe: `state.morph` — the thumb morphs between the two states.
 *
 * Motion contract:
 * - full: the thumb springs to the other end while the track recolours
 * - reduced: the thumb jumps to the end position; only the colour changes
 * - none: no transition at all
 *
 * a11y: Base UI renders `role="switch"` plus a hidden input, so Space toggles it
 * and forms submit the value. Colour is never the only signal: the thumb
 * position, `aria-checked`, and the track colour all change together.
 */
function Switch({ className, size = "default", ...props }: SwitchProps) {
  const cm = useCadenceMotion();
  const thumbRef = useRef<HTMLSpanElement | null>(null);
  /**
   * `null` until the track has been measured. The first render has no travel to
   * apply — a checked switch that animated from that position would slide into
   * place on every page load, and `initial={false}` does not prevent it because
   * the value *changes* after the layout effect rather than at mount.
   */
  const [travel, setTravel] = useState<number | null>(null);
  /**
   * False until the measured travel has been painted once. Only then may a state
   * change animate: the transition from "no distance yet" to "the real distance"
   * is a jump, not a movement.
   */
  const [settled, setSettled] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const thumb = thumbRef.current;
    const track = thumb?.parentElement;
    if (!thumb || !track) return;

    const measure = () => setTravel(Math.max(0, track.clientWidth - thumb.offsetWidth));
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(track);
    observer.observe(thumb);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (travel !== null && !settled) setSettled(true);
  }, [travel, settled]);

  const mergedRef = useCallback((node: HTMLSpanElement | null) => {
    thumbRef.current = node;
  }, []);

  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      data-motion={cm.mode}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent shadow-xs outline-none transition-[color,box-shadow] after:absolute after:-inset-x-3 after:-inset-y-2",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "data-disabled:cursor-not-allowed data-disabled:opacity-50",
        "data-[size=default]:h-[1.15rem] data-[size=default]:w-8 data-[size=sm]:h-3.5 data-[size=sm]:w-6",
        "data-checked:bg-primary data-unchecked:bg-input dark:data-unchecked:bg-input/80",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        render={(thumbProps, state) => {
          const { className: thumbClassName, ref: forwardedRef, ...rest } = thumbProps as ThumbRenderProps;

          return (
            <motion.span
              {...(rest as HTMLMotionProps<"span">)}
              ref={(node: HTMLSpanElement | null) => {
                mergedRef(node);
                if (typeof forwardedRef === "function") forwardedRef(node);
                else if (forwardedRef) (forwardedRef as RefObject<HTMLSpanElement | null>).current = node;
              }}
              className={cn(
                "pointer-events-none block rounded-full bg-background ring-0",
                "group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3",
                "dark:data-checked:bg-primary-foreground dark:data-unchecked:bg-foreground",
                thumbClassName,
              )}
              initial={false}
              animate={{ x: state.checked ? (travel ?? 0) : 0 }}
              // Until the measured distance has been painted, there is nothing to
              // animate *between*: jump into place, then spring on user input.
              transition={!settled || cm.reduced ? { duration: 0 } : cm.transition("state.morph")}
            />
          );
        }}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
