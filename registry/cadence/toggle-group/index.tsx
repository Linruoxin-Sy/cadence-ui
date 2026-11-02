"use client";

import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group";
import { useRender } from "@base-ui/react/use-render";
import type { VariantProps } from "class-variance-authority";
import { LayoutGroup, motion } from "motion/react";
import { type ComponentPropsWithRef, type CSSProperties, createContext, useContext, useId } from "react";
import { cn } from "../lib/cn";
import { ControlSpan } from "../lib/control-animation";
import { scale } from "../lib/motion";
import { PressButton } from "../lib/press-button";
import { useCadenceMotion } from "../lib/provider";
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
  /** Gap between items in Tailwind's spacing steps; `0` joins adjacent pressed fills. */
  spacing?: number;
  orientation?: "horizontal" | "vertical";
}

export interface ToggleGroupItemProps extends TogglePrimitive.Props, ToggleGroupAppearance {}

/**
 * A shared strip of toggles, with a pill-shaped `segmented` variant.
 * Single selection moves only the decorative fill (`layout.shared`). Multiple
 * selection fades/scales independent fills (`state.morph`); adjacent fills join
 * at zero spacing. Button layout boxes never move. `feedback.press` adds the
 * same local press as a standalone toggle.
 *
 * Motion contract:
 * - full: shared fill travels, local fills morph, content compresses while held
 * - reduced: shared fill jumps, local fills fade, no press scale
 * - none: all state changes settle immediately
 *
 * a11y: Base UI renders `role="group"` with roving focus, so arrow keys move
 * between items and Space presses one. Pass `multiple` to allow more than one
 * pressed item.
 */
function ToggleGroup({
  className,
  variant,
  size,
  style,
  spacing = 0,
  orientation = "horizontal",
  multiple = false,
  children,
  ...props
}: ToggleGroupProps) {
  const id = useId();
  return (
    <LayoutGroup id={id}>
      <ToggleGroupPrimitive
        data-slot="toggle-group"
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
            "group/toggle-group isolate flex w-fit max-w-full gap-[calc(var(--spacing)*var(--gap))] rounded-lg p-1",
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
    </LayoutGroup>
  );
}

function ItemSurface({
  elementProps,
  state,
  render,
  variant,
}: {
  elementProps: ComponentPropsWithRef<"button">;
  state: TogglePrimitive.State;
  render: TogglePrimitive.Props["render"];
  variant: ToggleGroupAppearance["variant"];
}) {
  const cm = useCadenceMotion();
  const context = useContext(ToggleGroupContext);
  const fillProps = {
    "aria-hidden": true as const,
    "data-slot": "toggle-group-indicator",
    "data-motion": cm.mode,
    className: cn(
      "pointer-events-none absolute inset-0 -z-10 rounded-[inherit]",
      variant === "segmented" ? "bg-background shadow-sm dark:bg-input" : "bg-accent",
    ),
  };
  const indicator = context.multiple ? (
    <ControlSpan
      {...fillProps}
      target={{ opacity: state.pressed ? 1 : 0, scale: state.pressed || cm.reduced ? 1 : scale.in }}
      transition={cm.transition("state.morph")}
    />
  ) : (
    state.pressed &&
    (cm.reduced || cm.timeScale === 0 ? (
      <span {...fillProps} />
    ) : (
      <motion.span {...fillProps} layoutId="selection" initial={false} transition={cm.transition("layout.shared")} />
    ))
  );
  return useRender({
    defaultTagName: "button",
    render: render ?? (
      <PressButton
        contentOnly
        decoration={indicator}
        whileTap={cm.reduced ? undefined : { scale: scale.press }}
        transition={cm.transition("feedback.press")}
      />
    ),
    state: { ...state },
    stateAttributesMapping: { pressed: () => null, disabled: () => null },
    props: {
      ...elementProps,
      children: render ? (
        <>
          {indicator}
          <span
            data-slot="toggle-group-content"
            className="relative z-10 inline-flex items-center justify-center gap-[inherit]"
          >
            {elementProps.children}
          </span>
        </>
      ) : (
        elementProps.children
      ),
    },
  });
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
      data-slot="toggle-group-item"
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
        <ItemSurface elementProps={elementProps} state={state} render={render} variant={resolvedVariant} />
      )}
      {...props}
    >
      {children}
    </TogglePrimitive>
  );
}

export { ToggleGroup, ToggleGroupItem };
