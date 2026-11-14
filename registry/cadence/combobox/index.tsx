"use client";

import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { useRender } from "@base-ui/react/use-render";
import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react";
import type { HTMLMotionProps } from "motion/react";
import * as React from "react";
import { useEffect, useLayoutEffect } from "react";
import { Button } from "../button";
import { InputGroup, InputGroupAddon, inputGroupButtonVariants } from "../input-group";
import { cn } from "../lib/cn";
import { createComboboxPopup } from "../lib/combobox-motion";
import { ControlSpan } from "../lib/control-animation";
import { useStateColor } from "../lib/css-motion";
import { createInlineEntrance } from "../lib/inline-entrance";
import { bindMotionParameters, stateIndicator } from "../lib/motion";
import { documentPresentation, usePresentationScope } from "../lib/motion-presence";
import { useMotionHostRef } from "../lib/motion-ref";
import { type CadenceMotion, useCadenceMotion, withCadenceScope } from "../lib/provider";

const Combobox = ComboboxPrimitive.Root;

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;
const subscribe = () => () => {};

/** The input group composes this trigger, so the button keeps its own owners. */
const ComposedTrigger = React.createContext(false);

/** Caller palettes are literal paint, not verified theme tokens. */
const callerPalette =
  /^(?:bg|text|border|ring|shadow|fill|stroke)-(?:\[[^\]]+\]|(?:white|black|(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3})\b)/;

function verifiedPaint(input: object) {
  const props = input as { className?: unknown; style?: unknown };
  if (typeof props.className === "function" || typeof props.style === "function") return false;
  if (
    Object.keys(props.style ?? {}).some(
      (key) => /color|background|shadow|filter|blend/i.test(key) || /^--(?!motion-|cadence-|ease-)/.test(key),
    )
  )
    return false;
  return !String(props.className ?? "")
    .split(/\s+/)
    .some((token) => callerPalette.test(token.split(":").pop() ?? ""));
}

/** Shared popup/chrome state classes; Base UI evaluates function classes before merging. */
function stateClasses<S>(base: string, value: string | ((state: S) => string | undefined) | undefined) {
  return typeof value === "function" ? (state: S) => cn(base, value(state)) : cn(base, value);
}

/** Base UI hides the outside from AT but leaves its tab stops. Suppress those
 * stops without inert, which also swallows outside pointer activation. Tab
 * releases the guard before native focus navigation. Pre-existing hidden/inert
 * nodes retain their owner; caller tabindex changes are never overwritten on cleanup.
 */
function ComboboxFocusSafety() {
  React.useLayoutEffect(() => {
    const existing = new Set(document.querySelectorAll('[aria-hidden="true"]'));
    const owned = new Set<HTMLElement>();
    const stops = new Map<HTMLElement, string | null>();
    const selector =
      'a[href],area[href],button,input,select,textarea,iframe,summary,[tabindex],[contenteditable="true"],audio[controls],video[controls]';
    let released = false;
    const restoreStop = (node: HTMLElement, previous: string | null) => {
      if (node.getAttribute("tabindex") !== "-1") return;
      if (previous === null) node.removeAttribute("tabindex");
      else node.setAttribute("tabindex", previous);
    };
    const restore = () => {
      for (const [node, previous] of stops) restoreStop(node, previous);
      stops.clear();
      owned.clear();
    };
    const sync = () => {
      for (const node of owned) {
        if (node.getAttribute("aria-hidden") !== "true") {
          owned.delete(node);
        }
      }
      if (released) return;
      for (const node of document.querySelectorAll<HTMLElement>('[aria-hidden="true"]')) {
        if (!existing.has(node) && !node.closest("[inert]")) {
          owned.add(node);
        }
      }
      for (const [node, previous] of stops) {
        if (![...owned].some((root) => root.contains(node))) {
          restoreStop(node, previous);
          stops.delete(node);
        }
      }
      for (const root of owned) {
        for (const node of [root, ...root.querySelectorAll<HTMLElement>(selector)]) {
          if (!node.matches(selector) || node.closest("[inert]") || node.tabIndex < 0 || stops.has(node)) continue;
          stops.set(node, node.getAttribute("tabindex"));
          node.tabIndex = -1;
        }
      }
    };
    const observer = new MutationObserver(sync);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["aria-hidden", "data-base-ui-inert"],
    });
    const tab = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        released = true;
        restore();
      }
    };
    document.addEventListener("keydown", tab, true);
    return () => {
      observer.disconnect();
      document.removeEventListener("keydown", tab, true);
      restore();
    };
  }, []);
  return null;
}

/** One insertion envelope for a later-inserted standalone host. */
function useLaterInsertion(host: React.RefObject<HTMLElement | null>, cm: CadenceMotion) {
  const entrance = React.useRef<ReturnType<typeof createInlineEntrance> | null>(null);
  const parent = usePresentationScope();
  const hydrated = React.useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  );
  const firstHydration = React.useRef(hydrated);
  const consumed = React.useRef(false);
  committed(() => {
    const node = host.current;
    if (!node) return;
    if (!entrance.current) entrance.current = createInlineEntrance(node);
    const baseline = parent ?? documentPresentation(node.ownerDocument);
    const visible = node.checkVisibility
      ? node.checkVisibility({ visibilityProperty: true, contentVisibilityAuto: true })
      : !node.hidden;
    const inherited =
      !visible ||
      Boolean(node.closest('[hidden],[inert],[aria-hidden="true"]')) ||
      !baseline.available() ||
      baseline.node?.current?.hasAttribute("data-starting-style");
    entrance.current.commit({
      present: true,
      cm: inherited ? { ...cm, timeScale: 0 } : cm,
      enter: !consumed.current && !firstHydration.current && baseline.presented && !inherited,
    });
    consumed.current = true;
  });
  React.useEffect(() => {
    if (!parent && host.current) documentPresentation(host.current.ownerDocument).presented = true;
  }, [parent, host]);
  React.useLayoutEffect(
    () => () => {
      entrance.current?.dispose();
      entrance.current = null;
    },
    [],
  );
}

function ComboboxValue({ ...props }: ComboboxPrimitive.Value.Props) {
  return <ComboboxPrimitive.Value data-slot="combobox-value" {...props} />;
}

const triggerClasses = cn(
  inputGroupButtonVariants({ size: "icon-xs" }),
  "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
  // A hand-placed trigger has no Button behind it, so the glyph size is declared here
  // too; composed into `ComboboxInput` it is the same value, deduped by tailwind-merge.
  "[&_svg:not([class*='size-'])]:size-3",
);

/**
 * The chevron of the field. It is Base UI's real `<button>`, so it stays keyboard
 * reachable and announces the popup; the chrome comes from the input-group button
 * scale, which keeps it inside the frame's 36px height.
 *
 * A hand-placed trigger owns its own insertion opacity, background and foreground.
 * Composed into `ComboboxInput` the very same node is a Button, which already owns
 * those families; the composed branch therefore installs no second writer, and the
 * frame's `input-group-button` slot stays the slot a consumer styles.
 *
 * `aria-label` is additive and comes before `{...props}`, so a caller can rename it. Base
 * UI names neither this button nor the clear one, and an icon-only control with no name
 * is a `button-name` violation — the field keeps its own name and the two icon buttons
 * say what they do.
 */
function ComboboxTrigger({ className, children, ...props }: ComboboxPrimitive.Trigger.Props) {
  const composed = React.useContext(ComposedTrigger);
  return composed ? (
    <InheritedTrigger className={className} {...props}>
      {children}
    </InheritedTrigger>
  ) : (
    <OwnedTrigger className={className} {...props}>
      {children}
    </OwnedTrigger>
  );
}

function TriggerBody({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ChevronDownIcon className="pointer-events-none" />
    </>
  );
}

function InheritedTrigger({ className, children, ...props }: ComboboxPrimitive.Trigger.Props) {
  return (
    <ComboboxPrimitive.Trigger
      aria-label="Show options"
      {...props}
      className={stateClasses(cn(triggerClasses, typeof className === "string" ? className : undefined), className)}
    >
      <TriggerBody>{children}</TriggerBody>
    </ComboboxPrimitive.Trigger>
  );
}

function OwnedTrigger({ className, children, ...props }: ComboboxPrimitive.Trigger.Props) {
  const { node, ref } = useMotionHostRef<HTMLButtonElement>(props.ref);
  const cm = useCadenceMotion(node);
  // The trigger owns its own surface and foreground. Base UI keeps the focus ring,
  // native activation and the popup anchor geometry.
  const paint = useStateColor(ref, cm, ["background-color", "color"], {
    readability: verifiedPaint(props) ? "verified" : "immediate",
  });
  useLaterInsertion(node, cm);
  return (
    <ComboboxPrimitive.Trigger
      data-slot="combobox-trigger"
      aria-label="Show options"
      {...props}
      {...paint}
      data-motion={cm.mode}
      style={{ ...paint.style, ...props.style }}
      className={stateClasses(cn(triggerClasses, typeof className === "string" ? className : undefined), className)}
    >
      <TriggerBody>{children}</TriggerBody>
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
      className={stateClasses(
        cn(
          inputGroupButtonVariants({ size: "icon-xs" }),
          "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          // `icon-xs` sizes the box but not the glyph, so without this the 24px Lucide default
          // fills it. 12px matches the chevron, whose size Button's own `icon-xs` variant sets.
          "[&_svg:not([class*='size-'])]:size-3",
        ),
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
 * clear button. The frame — not the input — owns the border and the focus ring.
 *
 * The composed Button is imported here rather than through the group's wrapper so its
 * slot and its migrated owner stay on the same physical node this contract names
 * (`input-group-button`). The editor is Base UI's own native input at the group's
 * `input-group-control` slot: the frame supplies its chrome and native editing stays the
 * primitive's, so Combobox adds no second colour/geometry owner there.
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
  return (
    <InputGroup className={cn("w-auto", typeof className === "string" ? className : undefined)}>
      <ComboboxPrimitive.Input
        data-slot="input-group-control"
        disabled={disabled}
        className={stateClasses(
          cn(
            // The editor keeps the exact chrome the composed Input used to contribute.
            // It is Base UI's native input at the group's control slot, so the frame
            // still owns the border/ring and native editing stays the primitive's.
            "h-9 w-full min-w-0 px-3 py-1 text-base outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
            "flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent",
          ),
          className,
        )}
        {...props}
      />
      <InputGroupAddon align="inline-end">
        {showTrigger && (
          // The composed trigger is the addon's button: the input-group frame supplies
          // the chrome, the trigger supplies the behaviour. The element that lands in
          // the DOM is the Button's, so `input-group-button` is the slot a consumer
          // styles; `combobox-trigger` is the standalone trigger's own slot.
          <ComposedTrigger.Provider value={true}>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              render={<ComboboxTrigger />}
              data-slot="input-group-button"
              className={cn(
                inputGroupButtonVariants({ size: "icon-xs" }),
                "group-has-data-[slot=combobox-clear]/input-group:hidden data-pressed:bg-transparent",
              )}
              disabled={disabled}
            />
          </ComposedTrigger.Provider>
        )}
        {showClear && <ComboboxClear disabled={disabled} />}
      </InputGroupAddon>
      {children}
    </InputGroup>
  );
}

type PopupState = ComboboxPrimitive.Popup.State;

/**
 * Motion contract (functional v2):
 * - full: the popup fades and grows in with the anchored `scale.in` pose, and fades back
 *   with the anchored ending pose; later-inserted Chips/Trigger/chips own one short
 *   opacity envelope each, the selection tick morphs, and owned surface colours tween.
 * - reduced: opacity only; the tick sits at full size and no spatial writer starts.
 * - none: every declared clock resolves to zero and the semantic state is painted first.
 *
 * The filter itself does not animate. Typing replaces the list on every keystroke, and a
 * list that moves under a moving caret is noise, not causality (P9).
 *
 * The popup is a flex column so the list can take the remaining height and scroll, with
 * the empty state as its sibling rather than a replacement for the whole panel.
 */
function ComboboxContent({
  className,
  style,
  side = "bottom",
  sideOffset = 6,
  align = "start",
  alignOffset = 0,
  anchor,
  render,
  ...props
}: ComboboxPrimitive.Popup.Props &
  Pick<ComboboxPrimitive.Positioner.Props, "side" | "align" | "sideOffset" | "alignOffset" | "anchor">) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxFocusSafety />
      <ComboboxPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        className="isolate z-50"
      >
        <ComboboxPrimitive.Popup
          {...props}
          data-chips={anchor ? true : undefined}
          className={className}
          style={style}
          render={(elementProps, state) => (
            <ComboboxSurface elementProps={elementProps} state={state} render={render} />
          )}
        />
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  );
}

/** Popup paint and presence on the actual rendered surface; Base UI keeps placement. */
function ComboboxSurface({
  elementProps,
  state,
  render,
}: {
  elementProps: React.ComponentPropsWithRef<"div">;
  state: PopupState;
  render: ComboboxPrimitive.Popup.Props["render"];
}) {
  const host = useMotionHostRef<HTMLDivElement>(elementProps.ref);
  const cm = useCadenceMotion(host.node);
  const paint = useStateColor(
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
    { readability: verifiedPaint(elementProps) ? "verified" : "immediate" },
  );
  const controller = React.useRef<ReturnType<typeof createComboboxPopup> | null>(null);
  const connected = React.useRef<HTMLElement | null>(null);
  committed(() => {
    if (connected.current !== host.node.current) {
      controller.current?.dispose();
      controller.current = null;
      connected.current = host.node.current;
    }
    const node = host.node.current;
    if (!node) return;
    if (!controller.current) controller.current = createComboboxPopup(node);
    controller.current.commit({ open: state.open, enter: state.open, cm });
  });
  React.useEffect(() => () => controller.current?.dispose(), []);
  return withCadenceScope(
    cm,
    useRender({
      defaultTagName: "div",
      render,
      state: { ...state, slot: "combobox-content" },
      props: {
        ...elementProps,
        ...paint,
        style: { ...paint.style, ...elementProps.style },
        "data-slot": "combobox-content",
        "data-motion": cm.mode,
        "data-cadence-scope": "",
        className: stateClasses(
          cn(
            "group/combobox-content relative flex max-h-(--available-height) w-(--anchor-width) max-w-(--available-width) min-w-[calc(var(--anchor-width)+--spacing(7))] flex-col overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md outline-hidden origin-(--transform-origin)",
            "data-[chips=true]:min-w-(--anchor-width)",
          ),
          elementProps.className,
        ),
      },
    }),
  );
}

function ComboboxList({ className, ...props }: ComboboxPrimitive.List.Props) {
  return (
    <ComboboxPrimitive.List
      data-slot="combobox-list"
      className={stateClasses(cn("min-h-0 flex-1 overflow-y-auto overscroll-contain p-1 data-empty:p-0"), className)}
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
function ComboboxItem({ className, children, style, ...props }: ComboboxPrimitive.Item.Props) {
  const { node, ref } = useMotionHostRef<HTMLDivElement>(props.ref);
  const cm = useCadenceMotion(node);
  const paint = useStateColor(ref, cm, ["background-color", "color"], {
    readability: verifiedPaint(props) ? "verified" : "immediate",
  });
  const parameters = cm.parameters(bindMotionParameters(stateIndicator, "state.morph/indicator"));
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      {...props}
      {...paint}
      data-motion={cm.mode}
      style={{ ...paint.style, ...style }}
      className={stateClasses(
        cn(
          "relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none",
          "data-highlighted:bg-accent data-highlighted:text-accent-foreground",
          "data-disabled:pointer-events-none data-disabled:opacity-50",
          "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        ),
        className,
      )}
    >
      {children}
      <ComboboxPrimitive.ItemIndicator
        keepMounted
        render={(indicatorProps, state) => {
          const { className: indicatorClassName, ...rest } = indicatorProps as React.HTMLProps<HTMLSpanElement>;
          // This exact preset/form pair always resolves to the indicator shape; a
          // different result would be an invalid binding, not a renderable state.
          if (parameters.kind !== "indicator")
            throw new RangeError("combobox indicator requires state.morph/indicator");

          return (
            <ControlSpan
              {...(rest as HTMLMotionProps<"span">)}
              data-slot="combobox-item-indicator"
              data-motion={cm.mode}
              className={cn(
                "pointer-events-none absolute right-2 flex size-4 items-center justify-center",
                indicatorClassName,
              )}
              target={{
                opacity: state.selected ? 1 : 0,
                scale: state.selected || cm.reduced ? 1 : parameters.scale,
              }}
              transition={{ opacity: parameters.opacity, scale: parameters.spatial }}
            >
              <CheckIcon className="size-4" />
            </ControlSpan>
          );
        }}
      />
    </ComboboxPrimitive.Item>
  );
}

function ComboboxGroup({ className, ...props }: ComboboxPrimitive.Group.Props) {
  return <ComboboxPrimitive.Group data-slot="combobox-group" className={stateClasses("", className)} {...props} />;
}

function ComboboxLabel({ className, ...props }: ComboboxPrimitive.GroupLabel.Props) {
  return (
    <ComboboxPrimitive.GroupLabel
      data-slot="combobox-label"
      className={stateClasses(cn("px-2 py-1.5 text-xs text-muted-foreground"), className)}
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
      className={stateClasses(
        cn(
          "hidden w-full justify-center py-2 text-center text-sm text-muted-foreground",
          "group-data-empty/combobox-content:flex",
        ),
        className,
      )}
      {...props}
    />
  );
}

function ComboboxSeparator({ className, ...props }: ComboboxPrimitive.Separator.Props) {
  const { node, ref } = useMotionHostRef<HTMLDivElement>(props.ref);
  const cm = useCadenceMotion(node);
  const paint = useStateColor(ref, cm, ["background-color"], {
    readability: verifiedPaint(props) ? "verified" : "immediate",
  });
  return (
    <ComboboxPrimitive.Separator
      data-slot="combobox-separator"
      {...props}
      {...paint}
      data-motion={cm.mode}
      style={{ ...paint.style, ...props.style }}
      className={stateClasses(cn("-mx-1 my-1 h-px bg-border"), className)}
    />
  );
}

interface ChipsFrame {
  presented: { current: boolean };
}
const ChipsContext = React.createContext<ChipsFrame | null>(null);

function ComboboxChips({ className, children, ...props }: React.ComponentPropsWithRef<typeof ComboboxPrimitive.Chips>) {
  const { node, ref } = useMotionHostRef<HTMLDivElement>(props.ref);
  const cm = useCadenceMotion(node);
  // The frame paints its own border, background, shadow and foreground. A composed
  // `showTrigger` button keeps its own button colour owner on its own node.
  const paint = useStateColor(
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
    { readability: verifiedPaint(props) ? "verified" : "immediate" },
  );
  const [frame] = React.useState<ChipsFrame>(() => ({ presented: { current: false } }));
  const presented = frame.presented;
  useLaterInsertion(node, cm);
  committed(() => {
    presented.current = true;
  });
  return (
    <ChipsContext.Provider value={frame}>
      <ComboboxPrimitive.Chips
        data-slot="combobox-chips"
        {...props}
        {...paint}
        data-motion={cm.mode}
        style={{ ...paint.style, ...props.style }}
        className={stateClasses(
          cn(
            "flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent bg-clip-padding px-2.5 py-1.5 text-sm shadow-xs",
            "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
            "has-aria-invalid:border-destructive has-aria-invalid:ring-[3px] has-aria-invalid:ring-destructive/20",
            "has-data-[slot=combobox-chip]:px-1.5 dark:bg-input/30 dark:has-aria-invalid:border-destructive/50 dark:has-aria-invalid:ring-destructive/40",
          ),
          className,
        )}
      >
        {children}
      </ComboboxPrimitive.Chips>
    </ChipsContext.Provider>
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
  const { node, ref } = useMotionHostRef<HTMLDivElement>(props.ref);
  const cm = useCadenceMotion(node);
  const frame = React.useContext(ChipsContext);
  // A chip owns its own pill paint; the frame owns the field chrome around it.
  const paint = useStateColor(ref, cm, ["background-color", "color"], {
    readability: verifiedPaint(props) ? "verified" : "immediate",
  });
  const entrance = React.useRef<ReturnType<typeof createInlineEntrance> | null>(null);
  const consumed = React.useRef(false);
  committed(() => {
    const host = node.current;
    if (!host) return;
    if (!entrance.current) entrance.current = createInlineEntrance(host);
    const visible = host.checkVisibility
      ? host.checkVisibility({ visibilityProperty: true, contentVisibilityAuto: true })
      : !host.hidden;
    const usable =
      visible && !host.closest('[hidden],[inert],[aria-hidden="true"]') && (frame?.presented.current ?? false);
    entrance.current.commit({
      present: true,
      cm: usable ? cm : { ...cm, timeScale: 0 },
      enter: !consumed.current && usable,
    });
    consumed.current = true;
  });
  React.useLayoutEffect(
    () => () => {
      entrance.current?.dispose();
      entrance.current = null;
    },
    [],
  );
  return (
    <ComboboxPrimitive.Chip
      data-slot="combobox-chip"
      {...props}
      {...paint}
      data-motion={cm.mode}
      style={{ ...paint.style, ...props.style }}
      className={stateClasses(
        cn(
          "flex h-5.5 w-fit items-center justify-center gap-1 rounded-sm bg-muted px-1.5 text-xs font-medium whitespace-nowrap text-foreground",
          "has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-50",
          "has-data-[slot=combobox-chip-remove]:pr-0",
        ),
        className,
      )}
    >
      {children}
      {showRemove && (
        <ComboboxPrimitive.ChipRemove
          data-slot="combobox-chip-remove"
          aria-label={typeof children === "string" ? `Remove ${children}` : "Remove"}
          className="-ml-0.5 flex size-5 items-center justify-center rounded-sm opacity-50 hover:bg-accent hover:opacity-100 focus-visible:opacity-100"
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
      className={stateClasses(cn("min-w-16 flex-1 outline-none"), className)}
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
