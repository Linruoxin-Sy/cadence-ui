"use client";

import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react";
import { type HTMLMotionProps, motion } from "motion/react";
import * as React from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  inputGroupButtonVariants,
} from "../input-group";
import { cn } from "../lib/cn";
import { scale } from "../lib/motion";
import { useCadenceMotion } from "../lib/provider";

const Combobox = ComboboxPrimitive.Root;

function ComboboxValue({ ...props }: ComboboxPrimitive.Value.Props) {
  return <ComboboxPrimitive.Value data-slot="combobox-value" {...props} />;
}

/**
 * The chevron on the right of the field. It is Base UI's real `<button>`, so it stays
 * keyboard reachable and announces the popup; the chrome comes from the input-group
 * button scale, which keeps it inside the frame's 36px height.
 *
 * `aria-label` is additive and comes before `{...props}`, so a caller can rename it. Base
 * UI names neither this button nor the clear one, and an icon-only control with no name
 * is a `button-name` violation — the field keeps its own name and the two icon buttons
 * say what they do.
 */
function ComboboxTrigger({ className, children, ...props }: ComboboxPrimitive.Trigger.Props) {
  return (
    <ComboboxPrimitive.Trigger
      data-slot="combobox-trigger"
      aria-label="Show options"
      className={cn(
        inputGroupButtonVariants({ size: "icon-xs" }),
        "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        // A hand-placed trigger has no Button behind it, so the glyph size is declared here
        // too; composed into `ComboboxInput` it is the same value, deduped by tailwind-merge.
        "[&_svg:not([class*='size-'])]:size-3",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDownIcon className="pointer-events-none" />
    </ComboboxPrimitive.Trigger>
  );
}

/**
 * Upstream keeps the clear control internal, and so does this file: a component that
 * renders its own undo affordance should not also hand out a half-configured one. The
 * name is additive for the same reason as the trigger's.
 */
function ComboboxClear({ className, ...props }: ComboboxPrimitive.Clear.Props) {
  return (
    <ComboboxPrimitive.Clear
      data-slot="combobox-clear"
      aria-label="Clear"
      className={cn(
        inputGroupButtonVariants({ size: "icon-xs" }),
        "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        // `icon-xs` sizes the box but not the glyph, so without this the 24px Lucide default
        // fills it. 12px matches the chevron, whose size Button's own `icon-xs` variant sets.
        "[&_svg:not([class*='size-'])]:size-3",
        className,
      )}
      {...props}
    >
      <XIcon className="pointer-events-none" />
    </ComboboxPrimitive.Clear>
  );
}

/**
 * The control: a bare input inside the input-group frame, the chevron, and optionally a
 * clear button. The frame — not the input — owns the border and the focus ring, which is
 * why the input is rendered through `InputGroupInput`.
 *
 * The trigger hides while the clear button is mounted, through the frame's
 * `group/input-group` hook: two icon buttons on a 36px field leave the text nowhere to go.
 */
function ComboboxInput({
  className,
  children,
  disabled = false,
  showTrigger = true,
  showClear = false,
  ...props
}: ComboboxPrimitive.Input.Props & {
  showTrigger?: boolean;
  showClear?: boolean;
}) {
  const cm = useCadenceMotion();

  return (
    <InputGroup data-motion={cm.mode} className={cn("w-auto", className)}>
      <ComboboxPrimitive.Input render={<InputGroupInput disabled={disabled} />} {...props} />
      <InputGroupAddon align="inline-end">
        {showTrigger && (
          // The trigger is the addon's button, composed the way upstream composes it: the
          // input-group frame supplies the chrome, the trigger supplies the behaviour. The
          // element that lands in the DOM is the trigger's, so `combobox-trigger` is the slot
          // a consumer styles; `input-group-button` is the frame's name for the same control.
          <InputGroupButton
            size="icon-xs"
            variant="ghost"
            render={<ComboboxTrigger />}
            data-slot="input-group-button"
            className="group-has-data-[slot=combobox-clear]/input-group:hidden data-pressed:bg-transparent"
            disabled={disabled}
          />
        )}
        {showClear && <ComboboxClear disabled={disabled} />}
      </InputGroupAddon>
      {children}
    </InputGroup>
  );
}

/**
 * Motion contract (CSS-only, Base UI `data-starting-style` / `data-ending-style`):
 * - full: the panel fades and grows out of the field, from `--transform-origin` (which
 *   Base UI writes) and `--motion-scale-in`, on `duration.fast`
 * - reduced: the fade stays, the scale is dropped
 * - none: `--motion-duration-*` resolves to 0ms, so the panel appears on the first frame
 *
 * The filter itself does not animate. Typing replaces the list on every keystroke, and a
 * list that moves under a moving caret is noise, not causality (P9).
 *
 * The popup is a flex column so the list can take the remaining height and scroll, with
 * the empty state as its sibling rather than a replacement for the whole panel.
 */
function ComboboxContent({
  className,
  side = "bottom",
  sideOffset = 6,
  align = "start",
  alignOffset = 0,
  anchor,
  ...props
}: ComboboxPrimitive.Popup.Props &
  Pick<ComboboxPrimitive.Positioner.Props, "side" | "align" | "sideOffset" | "alignOffset" | "anchor">) {
  const cm = useCadenceMotion();

  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        className="isolate z-50"
      >
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          data-motion={cm.mode}
          data-chips={!!anchor}
          className={cn(
            "group/combobox-content relative flex max-h-(--available-height) w-(--anchor-width) max-w-(--available-width) min-w-[calc(var(--anchor-width)+--spacing(7))] flex-col overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md outline-hidden",
            "origin-(--transform-origin) transition-[opacity,scale] ease-cadence-out duration-(--motion-duration-fast) data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
            !cm.reduced &&
              "data-[ending-style]:scale-(--motion-scale-in) data-[starting-style]:scale-(--motion-scale-in)",
            "data-[chips=true]:min-w-(--anchor-width)",
            className,
          )}
          {...props}
        />
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  );
}

function ComboboxList({ className, ...props }: ComboboxPrimitive.List.Props) {
  return (
    <ComboboxPrimitive.List
      data-slot="combobox-list"
      className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain p-1 data-empty:p-0", className)}
      {...props}
    />
  );
}

/**
 * `state.morph` on the tick: selected and unselected are the same slot, so the mark
 * scales in from `scale.in` and the row never shifts. The indicator is `keepMounted`,
 * which is what gives the unselected state something to animate from; under `reduced` it
 * cross-fades at full size, and `none` resolves to zero duration.
 */
function ComboboxItem({ className, children, ...props }: ComboboxPrimitive.Item.Props) {
  const cm = useCadenceMotion();

  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none",
        "data-highlighted:bg-accent data-highlighted:text-accent-foreground",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
      <ComboboxPrimitive.ItemIndicator
        keepMounted
        render={(indicatorProps, state) => {
          const { className: indicatorClassName, ...rest } = indicatorProps as React.HTMLProps<HTMLSpanElement>;

          return (
            <motion.span
              {...(rest as HTMLMotionProps<"span">)}
              data-slot="combobox-item-indicator"
              data-motion={cm.mode}
              className={cn(
                "pointer-events-none absolute right-2 flex size-4 items-center justify-center",
                indicatorClassName,
              )}
              initial={false}
              animate={state.selected ? { opacity: 1, scale: 1 } : { opacity: 0, scale: cm.reduced ? 1 : scale.in }}
              transition={cm.transition("state.morph")}
            >
              <CheckIcon className="size-4" />
            </motion.span>
          );
        }}
      />
    </ComboboxPrimitive.Item>
  );
}

function ComboboxGroup({ className, ...props }: ComboboxPrimitive.Group.Props) {
  return <ComboboxPrimitive.Group data-slot="combobox-group" className={cn(className)} {...props} />;
}

function ComboboxLabel({ className, ...props }: ComboboxPrimitive.GroupLabel.Props) {
  return (
    <ComboboxPrimitive.GroupLabel
      data-slot="combobox-label"
      className={cn("px-2 py-1.5 text-xs text-muted-foreground", className)}
      {...props}
    />
  );
}

function ComboboxCollection({ ...props }: ComboboxPrimitive.Collection.Props) {
  return <ComboboxPrimitive.Collection data-slot="combobox-collection" {...props} />;
}

function ComboboxEmpty({ className, ...props }: ComboboxPrimitive.Empty.Props) {
  return (
    <ComboboxPrimitive.Empty
      data-slot="combobox-empty"
      className={cn(
        "hidden w-full justify-center py-2 text-center text-sm text-muted-foreground",
        "group-data-empty/combobox-content:flex",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxSeparator({ className, ...props }: ComboboxPrimitive.Separator.Props) {
  return (
    <ComboboxPrimitive.Separator
      data-slot="combobox-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}

function ComboboxChips({ className, ...props }: React.ComponentPropsWithRef<typeof ComboboxPrimitive.Chips>) {
  return (
    <ComboboxPrimitive.Chips
      data-slot="combobox-chips"
      className={cn(
        "flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent bg-clip-padding px-2.5 py-1.5 text-sm shadow-xs transition-[color,box-shadow]",
        "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
        "has-aria-invalid:border-destructive has-aria-invalid:ring-[3px] has-aria-invalid:ring-destructive/20",
        "has-data-[slot=combobox-chip]:px-1.5 dark:bg-input/30 dark:has-aria-invalid:border-destructive/50 dark:has-aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxChip({
  className,
  children,
  showRemove = true,
  ...props
}: ComboboxPrimitive.Chip.Props & {
  showRemove?: boolean;
}) {
  return (
    <ComboboxPrimitive.Chip
      data-slot="combobox-chip"
      className={cn(
        "flex h-5.5 w-fit items-center justify-center gap-1 rounded-sm bg-muted px-1.5 text-xs font-medium whitespace-nowrap text-foreground",
        "has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-50",
        "has-data-[slot=combobox-chip-remove]:pr-0",
        className,
      )}
      {...props}
    >
      {children}
      {showRemove && (
        <ComboboxPrimitive.ChipRemove
          data-slot="combobox-chip-remove"
          aria-label={typeof children === "string" ? `Remove ${children}` : "Remove"}
          className="-ml-0.5 flex size-5 items-center justify-center rounded-sm opacity-50 transition-opacity hover:bg-accent hover:opacity-100"
        >
          <XIcon className="pointer-events-none size-3" />
        </ComboboxPrimitive.ChipRemove>
      )}
    </ComboboxPrimitive.Chip>
  );
}

function ComboboxChipsInput({ className, ...props }: ComboboxPrimitive.Input.Props) {
  return (
    <ComboboxPrimitive.Input
      data-slot="combobox-chip-input"
      className={cn("min-w-16 flex-1 outline-none", className)}
      {...props}
    />
  );
}

/**
 * The anchor for the chip layout: the popup hangs from the chips container rather than
 * from the input inside it, so it lines up with the field the reader is typing in.
 */
function useComboboxAnchor() {
  return React.useRef<HTMLDivElement | null>(null);
}

export {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
};
