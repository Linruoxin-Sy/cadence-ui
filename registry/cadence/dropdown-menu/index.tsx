"use client";

import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { useRender } from "@base-ui/react/use-render";
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";
import type { HTMLMotionProps } from "motion/react";
import type * as React from "react";
import {
  Children,
  type CSSProperties,
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
import { createAnchoredPresence } from "../lib/anchored-presence";
import { cn } from "../lib/cn";
import { ControlSpan } from "../lib/control-animation";
import { useStateColor } from "../lib/css-motion";
import { createMeasuredGeometry, naturalGeometry } from "../lib/measured-geometry";
import { bindMotionParameters, geometryCompact, stateIndicator } from "../lib/motion";
import { useMotionHostRef } from "../lib/motion-ref";
import { createMotionTransaction } from "../lib/motion-transaction";
import { usePopupPresence } from "../lib/popup-presence";
import { popupClockStyle, stateClasses } from "../lib/popup-style";
import { type CadenceMotion, useCadenceMotion, withCadenceScope } from "../lib/provider";
import { useTextPresentation } from "../lib/use-text-presentation";

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Portal clock variables only; presence, geometry and colour own their properties. */
function clockVariables(cm: CadenceMotion): CSSProperties {
  const variables: Record<string, string | number> = { ...popupClockStyle(cm) };
  delete variables.transition;
  return variables as CSSProperties;
}

/** A caller palette this surface cannot verify keeps its paint immediate. */
const layoutClass =
  /^(?:[\w-]+:)*(?:w-|h-|size-|min-|max-|p[xytrblse]?-|m[xytrblse]?-|gap-|flex|inline-|block|grid|shrink|grow|basis-|items-|justify-|self-|order-|relative|absolute|fixed|sticky|inset-|top-|bottom-|left-|right-|overflow-|truncate|text-(?:xs|sm|base|lg|xl)$)/;

function knownPalette(className: unknown, style: unknown) {
  if (typeof className === "function" || typeof style === "function") return false;
  const layoutOnly =
    !className ||
    String(className)
      .split(/\s+/)
      .every((name) => layoutClass.test(name));
  const knownStyle =
    !style ||
    !Object.keys(style as object).some((key) =>
      /color|background|fill|stroke|shadow|filter|blend|opacity|^--(?!motion-|cadence-|ease-)/i.test(key),
    );
  return layoutOnly && knownStyle;
}

type StyleInput<S> = CSSProperties | ((state: S) => CSSProperties | undefined) | undefined;
function mergeStyle<S>(base: CSSProperties, caller: StyleInput<S>) {
  return typeof caller === "function" ? (state: S) => ({ ...base, ...caller(state) }) : { ...base, ...caller };
}

/** A stable, committed content signature: the shell is measured against what it
 * actually renders, never against a render counter. */
function contentRevision(children: ReactNode): string {
  const shape = (child: ReactNode, depth: number): unknown => {
    if (typeof child === "string" || typeof child === "number") return child;
    if (!isValidElement(child) || depth > 4) return null;
    const type = child.type;
    const name =
      typeof type === "string"
        ? type
        : ((type as { displayName?: string; name?: string }).displayName ?? (type as { name?: string }).name ?? "part");
    const nested = (child.props as { children?: ReactNode }).children;
    return [name, child.key, Children.toArray(nested).map((next) => shape(next, depth + 1))];
  };
  return JSON.stringify(Children.toArray(children).map((child) => shape(child, 0)));
}

/** One physical owner per item region: pointer/checked/disabled/destructive and
 * theme targets are merged by the cascade, so one scoped family writes them. */

function DropdownMenu({ ...props }: MenuPrimitive.Root.Props) {
  return <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuPortal({ ...props }: MenuPrimitive.Portal.Props) {
  return <MenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />;
}

function DropdownMenuTrigger({ ...props }: MenuPrimitive.Trigger.Props) {
  const cm = useCadenceMotion();

  return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" data-motion={cm.mode} {...props} />;
}

/**
 * Motion contract: the popup is its own visual layer. Base UI owns mounting,
 * placement, item focus, typeahead and the actual unmount completion; the shared
 * anchored presence adds one opacity envelope with a short approach along the
 * resolved side, and the popup's own measured shell owns content-driven size. A
 * submenu renders this same surface, so one controller instance serves each
 * branch with its own slot instead of a second implementation.
 */
function DropdownMenuContent({
  align = "start",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  className,
  style,
  children,
  render,
  ...props
}: MenuPrimitive.Popup.Props & Pick<MenuPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset">) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        className="isolate z-50 outline-hidden"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
      >
        <MenuPrimitive.Popup
          {...props}
          className={className}
          style={style}
          render={(elementProps, state) => (
            <DropdownMenuContentSurface elementProps={elementProps} state={state} render={render}>
              {children}
            </DropdownMenuContentSurface>
          )}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

function DropdownMenuContentSurface({
  elementProps,
  state,
  render,
  children,
}: {
  elementProps: React.ComponentPropsWithRef<"div">;
  state: MenuPrimitive.Popup.State;
  render: MenuPrimitive.Popup.Props["render"];
  children?: ReactNode;
}) {
  const host = useMotionHostRef<HTMLDivElement>(elementProps.ref);
  const cm = useCadenceMotion(host.node);
  const wrap = usePopupPresence(host.node, [], false, cm, "base");
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
    {
      readability: knownPalette(elementProps.className, elementProps.style) ? "verified" : "immediate",
    },
  );
  const controller = useRef<ReturnType<typeof createAnchoredPresence> | null>(null);
  const connected = useRef<HTMLElement | null>(null);
  const lastOpen = useRef<boolean | null>(null);
  const [transaction] = useState(createMotionTransaction);
  const geometry = useRef<ReturnType<typeof createMeasuredGeometry> | null>(null);
  const release = useRef<(() => void) | null>(null);
  const geometryHost = useRef<HTMLElement | null>(null);
  const revision = contentRevision(children);

  committed(() => {
    const node = host.node.current;
    if (connected.current !== node) {
      controller.current?.dispose();
      controller.current = null;
      connected.current = node;
    }
    if (node && !controller.current) controller.current = createAnchoredPresence(node, true);
    const open = state.open;
    controller.current?.commit({
      open,
      enter: open && (state.transitionStatus === "starting" || lastOpen.current === false),
      cm,
    });
    lastOpen.current = open;
  });
  committed(() => {
    const node = host.node.current;
    if (!node) return;
    if (!geometry.current) geometry.current = createMeasuredGeometry(transaction);
    if (geometryHost.current !== node) {
      release.current?.();
      release.current = null;
      geometryHost.current = node;
      release.current = geometry.current.register({
        host: host.node,
        content: node,
        axes: ["width", "height"],
        observeChildren: true,
        measure() {
          const box = naturalGeometry(node);
          if (!box) return null;
          const css = node.ownerDocument.defaultView?.getComputedStyle(node);
          const view = node.ownerDocument.defaultView;
          // Base UI's `size()` clamp is the real available space; a missing value
          // never narrows the menu below its own natural box.
          const availableWidth = Number.parseFloat(css?.getPropertyValue("--available-width") ?? "");
          const availableHeight = Number.parseFloat(css?.getPropertyValue("--available-height") ?? "");
          return {
            // Never animate below the natural box: required labels stay laid out.
            width: {
              size: box.width,
              min: 0,
              max: Math.max(box.width, Number.isFinite(availableWidth) ? availableWidth : box.width),
              readable: true,
              independent: true,
            },
            height: {
              size: box.height,
              min: 0,
              max: Math.max(
                box.height,
                Number.isFinite(availableHeight) ? availableHeight : (view?.innerHeight ?? box.height),
              ),
              readable: true,
              independent: true,
            },
          };
        },
      });
    }
    const parameters = cm.parameters(bindMotionParameters(geometryCompact, "geometry.resize/measured"));
    if (parameters.kind !== "geometry") return;
    geometry.current.commit(transaction.revision("content", revision, node), {
      reduced: cm.reduced,
      transition: parameters.transition,
      available: state.open,
    });
  });
  committed(
    () => () => {
      release.current?.();
      release.current = null;
      geometry.current?.dispose();
      controller.current?.dispose();
    },
    [],
  );

  const authored = (elementProps as Record<string, unknown>)["data-slot"];

  return withCadenceScope(
    cm,
    wrap(
      useRender({
        defaultTagName: "div",
        render,
        // The render state carries the actual slot, so a submenu reports its own while
        // both branches still mount one shared controller implementation.
        state:
          authored === "dropdown-menu-sub-content"
            ? { ...state, slot: "dropdown-menu-sub-content" }
            : { ...state, slot: "dropdown-menu-content" },
        props: {
          "data-slot": "dropdown-menu-content",
          ...elementProps,
          ...paint,
          "data-motion": cm.mode,
          "data-cadence-scope": "",
          className: cn(
            "z-50 max-h-(--available-height) min-w-[8rem] origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-hidden",
            elementProps.className,
          ),
          style: { ...paint.style, ...clockVariables(cm), ...elementProps.style },
          children,
        },
      }),
    ),
  );
}

/**
 * Base UI 1.9 throws when `Menu.GroupLabel` renders outside `Menu.Group` (`MenuGroupContext
 * is missing`), and shadcn's Base UI source renders the label at the top level of a menu.
 * The label therefore follows the group it is in: inside `DropdownMenuGroup` it is the
 * group's `aria-labelledby`, and outside one it is a plain caption element with the same
 * slot, which is what `new-york-v4` renders for the ungrouped case.
 */
const DropdownMenuGroupContext = createContext(false);

function DropdownMenuGroup({ ...props }: MenuPrimitive.Group.Props) {
  return (
    <DropdownMenuGroupContext.Provider value>
      <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
    </DropdownMenuGroupContext.Provider>
  );
}

function DropdownMenuLabel({
  className,
  inset,
  children,
  style,
  ...props
}: React.ComponentProps<"div"> & {
  inset?: boolean;
}) {
  const inGroup = useContext(DropdownMenuGroupContext);
  const host = useMotionHostRef<HTMLElement>(props.ref);
  const cm = useCadenceMotion(host.node);
  const [entity] = useState(() => ({}));
  const paint = useStateColor(host.ref, cm, ["color"], {
    readability: knownPalette(className, style) ? "verified" : "immediate",
  });
  // One authored host for both group and caption branches: the tag follows the
  // group context, while the physical slot, paint and text owners do not move.
  const Tag = (inGroup ? MenuPrimitive.GroupLabel : "div") as React.ElementType;

  return (
    <Tag
      data-slot="dropdown-menu-label"
      data-inset={inset}
      {...props}
      {...paint}
      data-motion={cm.mode}
      className={cn("px-2 py-1.5 text-sm font-medium data-[inset]:pl-8", className)}
      style={mergeStyle(paint.style as CSSProperties, style)}
    >
      {typeof children === "string" ? <DropdownMenuLabelText value={children} entity={entity} /> : children}
    </Tag>
  );
}

const itemChrome =
  "relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none";

const itemVariantChrome =
  "data-[variant=destructive]:text-destructive data-[variant=destructive]:data-highlighted:bg-destructive/10 data-[variant=destructive]:data-highlighted:text-destructive dark:data-[variant=destructive]:data-highlighted:bg-destructive/20";

const itemIconChrome =
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground";

/** One physical row: its own `state.color` owner merges pointer highlight, checked,
 * disabled, destructive and theme paint without a travelling row plate. */
function DropdownMenuItem({
  className,
  children,
  inset,
  variant = "default",
  style,
  ...props
}: MenuPrimitive.Item.Props & {
  inset?: boolean;
  variant?: "default" | "destructive";
}) {
  const host = useMotionHostRef<HTMLDivElement>(props.ref);
  const cm = useCadenceMotion(host.node);
  const [entity] = useState(() => ({}));
  const paint = useStateColor(host.ref, cm, ["background-color", "color"], {
    readability: knownPalette(className, style) ? "verified" : "immediate",
  });

  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      {...props}
      {...paint}
      data-motion={cm.mode}
      className={stateClasses(
        cn(
          itemChrome,
          "data-highlighted:bg-accent data-highlighted:text-accent-foreground",
          "data-disabled:pointer-events-none data-disabled:opacity-50",
          "data-[inset]:pl-8",
          itemVariantChrome,
          itemIconChrome,
          "data-[variant=destructive]:*:[svg]:text-destructive!",
        ),
        className,
      )}
      style={mergeStyle(paint.style as CSSProperties, style)}
    >
      {typeof children === "string" ? <DropdownMenuItemText value={children} entity={entity} /> : children}
    </MenuPrimitive.Item>
  );
}

function DropdownMenuSub({ ...props }: MenuPrimitive.SubmenuRoot.Props) {
  return <MenuPrimitive.SubmenuRoot data-slot="dropdown-menu-sub" {...props} />;
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  style,
  ...props
}: MenuPrimitive.SubmenuTrigger.Props & {
  inset?: boolean;
}) {
  const host = useMotionHostRef<HTMLDivElement>(props.ref);
  const cm = useCadenceMotion(host.node);
  const [entity] = useState(() => ({}));
  const paint = useStateColor(host.ref, cm, ["background-color", "color"], {
    readability: knownPalette(className, style) ? "verified" : "immediate",
  });

  return (
    <MenuPrimitive.SubmenuTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      {...props}
      {...paint}
      data-motion={cm.mode}
      className={stateClasses(
        cn(
          itemChrome,
          "data-popup-open:bg-accent data-popup-open:text-accent-foreground data-highlighted:bg-accent data-highlighted:text-accent-foreground",
          "data-[inset]:pl-8",
          itemIconChrome,
        ),
        className,
      )}
      style={mergeStyle(paint.style as CSSProperties, style)}
    >
      {typeof children === "string" ? <DropdownMenuSubTriggerText value={children} entity={entity} /> : children}
      <ChevronRightIcon className="ml-auto size-4" />
    </MenuPrimitive.SubmenuTrigger>
  );
}

function DropdownMenuSubContent({
  align = "start",
  alignOffset = -3,
  side = "right",
  sideOffset = 0,
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuContent>) {
  return (
    <DropdownMenuContent
      data-slot="dropdown-menu-sub-content"
      className={stateClasses("w-auto", className)}
      align={align}
      alignOffset={alignOffset}
      side={side}
      sideOffset={sideOffset}
      {...props}
    />
  );
}

/**
 * `state.morph` on the tick: checked and unchecked are the same slot, so the mark
 * scales in from the preset's `scale.in` and the item never shifts. The indicator is
 * `keepMounted`, which is what gives the unchecked state something to animate from;
 * under `reduced` it cross-fades at full size, and `none` resolves to zero duration.
 */
function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  inset,
  style,
  ...props
}: MenuPrimitive.CheckboxItem.Props & {
  inset?: boolean;
}) {
  const host = useMotionHostRef<HTMLDivElement>(props.ref);
  const cm = useCadenceMotion(host.node);
  const [entity] = useState(() => ({}));
  const paint = useStateColor(host.ref, cm, ["background-color", "color"], {
    readability: knownPalette(className, style) ? "verified" : "immediate",
  });

  return (
    <MenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      data-inset={inset}
      {...props}
      {...paint}
      data-motion={cm.mode}
      className={stateClasses(
        cn(
          "relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none",
          "data-highlighted:bg-accent data-highlighted:text-accent-foreground",
          "data-disabled:pointer-events-none data-disabled:opacity-50",
          itemIconChrome,
        ),
        className,
      )}
      style={mergeStyle(paint.style as CSSProperties, style)}
      checked={checked}
    >
      <span
        data-slot="dropdown-menu-checkbox-item-indicator"
        className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center"
      >
        <MenuPrimitive.CheckboxItemIndicator
          keepMounted
          render={(indicatorProps, state) => {
            const { className: indicatorClassName, ...rest } = indicatorProps as HTMLProps<HTMLSpanElement>;
            const parameters = cm.parameters(bindMotionParameters(stateIndicator, "state.morph/indicator"));
            if (parameters.kind !== "indicator")
              throw new RangeError("dropdown-menu checkbox item requires state.morph/indicator");
            return (
              <ControlSpan
                {...(rest as HTMLMotionProps<"span">)}
                data-slot="dropdown-menu-checkbox-item-mark"
                data-motion={cm.mode}
                className={cn("flex items-center justify-center", indicatorClassName)}
                target={{
                  opacity: state.checked ? 1 : 0,
                  scale: state.checked || cm.reduced ? 1 : parameters.scale,
                }}
                transition={{ opacity: parameters.opacity, scale: parameters.spatial }}
              >
                <CheckIcon className="size-4" />
              </ControlSpan>
            );
          }}
        />
      </span>
      {typeof children === "string" ? <DropdownMenuCheckboxItemText value={children} entity={entity} /> : children}
    </MenuPrimitive.CheckboxItem>
  );
}

function DropdownMenuRadioGroup({ ...props }: MenuPrimitive.RadioGroup.Props) {
  return <MenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />;
}

function DropdownMenuRadioItem({
  className,
  children,
  inset,
  style,
  ...props
}: MenuPrimitive.RadioItem.Props & {
  inset?: boolean;
}) {
  const host = useMotionHostRef<HTMLDivElement>(props.ref);
  const cm = useCadenceMotion(host.node);
  const [entity] = useState(() => ({}));
  const paint = useStateColor(host.ref, cm, ["background-color", "color"], {
    readability: knownPalette(className, style) ? "verified" : "immediate",
  });

  return (
    <MenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      data-inset={inset}
      {...props}
      {...paint}
      data-motion={cm.mode}
      className={stateClasses(
        cn(
          "relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none",
          "data-highlighted:bg-accent data-highlighted:text-accent-foreground",
          "data-disabled:pointer-events-none data-disabled:opacity-50",
          itemIconChrome,
        ),
        className,
      )}
      style={mergeStyle(paint.style as CSSProperties, style)}
    >
      <span
        data-slot="dropdown-menu-radio-item-indicator"
        className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center"
      >
        <MenuPrimitive.RadioItemIndicator
          keepMounted
          render={(indicatorProps, state) => {
            const { className: indicatorClassName, ...rest } = indicatorProps as HTMLProps<HTMLSpanElement>;
            const parameters = cm.parameters(bindMotionParameters(stateIndicator, "state.morph/indicator"));
            if (parameters.kind !== "indicator")
              throw new RangeError("dropdown-menu radio item requires state.morph/indicator");
            return (
              <ControlSpan
                {...(rest as HTMLMotionProps<"span">)}
                data-slot="dropdown-menu-radio-item-mark"
                data-motion={cm.mode}
                className={cn("flex items-center justify-center", indicatorClassName)}
                target={{
                  opacity: state.checked ? 1 : 0,
                  scale: state.checked || cm.reduced ? 1 : parameters.scale,
                }}
                transition={{ opacity: parameters.opacity, scale: parameters.spatial }}
              >
                <CircleIcon className="size-2 fill-current" />
              </ControlSpan>
            );
          }}
        />
      </span>
      {typeof children === "string" ? <DropdownMenuRadioItemText value={children} entity={entity} /> : children}
    </MenuPrimitive.RadioItem>
  );
}

function DropdownMenuSeparator({ className, style, ...props }: MenuPrimitive.Separator.Props) {
  const host = useMotionHostRef<HTMLDivElement>(props.ref);
  const cm = useCadenceMotion(host.node);
  const paint = useStateColor(host.ref, cm, ["background-color"], {
    readability: knownPalette(className, style) ? "verified" : "immediate",
  });

  return (
    <MenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      {...props}
      {...paint}
      data-motion={cm.mode}
      className={stateClasses("-mx-1 my-1 h-px bg-border", className)}
      style={mergeStyle(paint.style as CSSProperties, style)}
    />
  );
}

function DropdownMenuShortcut({ className, children, style, ...props }: React.ComponentProps<"span">) {
  const host = useMotionHostRef<HTMLSpanElement>(props.ref);
  const cm = useCadenceMotion(host.node);
  const [entity] = useState(() => ({}));
  const paint = useStateColor(host.ref, cm, ["color"], {
    readability: knownPalette(className, style) ? "verified" : "immediate",
  });

  return (
    <span
      data-slot="dropdown-menu-shortcut"
      {...props}
      {...paint}
      data-motion={cm.mode}
      className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)}
      style={{ ...paint.style, ...style }}
    >
      {typeof children === "string" ? <DropdownMenuShortcutText value={children} entity={entity} /> : children}
    </span>
  );
}

/**
 * Plain owned display slots: one native text host each, so only changed
 * graphemes are replaced and unchanged content keeps its identity. Rich item or
 * label content is never split by the menu; it keeps its composed owners.
 */
function DropdownMenuItemText({ value, entity }: { value: string; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useTextPresentation(node, value, cm, entity, { characterStagger: false });
  return (
    <span ref={ref} data-slot="dropdown-menu-item-text" data-motion={cm.mode}>
      {text}
    </span>
  );
}

function DropdownMenuCheckboxItemText({ value, entity }: { value: string; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useTextPresentation(node, value, cm, entity, { characterStagger: false });
  return (
    <span ref={ref} data-slot="dropdown-menu-checkbox-item-text" data-motion={cm.mode}>
      {text}
    </span>
  );
}

function DropdownMenuRadioItemText({ value, entity }: { value: string; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useTextPresentation(node, value, cm, entity, { characterStagger: false });
  return (
    <span ref={ref} data-slot="dropdown-menu-radio-item-text" data-motion={cm.mode}>
      {text}
    </span>
  );
}

function DropdownMenuSubTriggerText({ value, entity }: { value: string; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useTextPresentation(node, value, cm, entity, { characterStagger: false });
  return (
    <span ref={ref} data-slot="dropdown-menu-sub-trigger-text" data-motion={cm.mode}>
      {text}
    </span>
  );
}

function DropdownMenuLabelText({ value, entity }: { value: string; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useTextPresentation(node, value, cm, entity, { characterStagger: false });
  return (
    <span ref={ref} data-slot="dropdown-menu-label-text" data-motion={cm.mode}>
      {text}
    </span>
  );
}

function DropdownMenuShortcutText({ value, entity }: { value: string; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useTextPresentation(node, value, cm, entity, { characterStagger: false });
  return (
    <span ref={ref} data-slot="dropdown-menu-shortcut-text" data-motion={cm.mode}>
      {text}
    </span>
  );
}

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
};
