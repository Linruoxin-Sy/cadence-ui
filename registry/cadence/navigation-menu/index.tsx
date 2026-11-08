"use client";

import { NavigationMenu as NavigationMenuPrimitive } from "@base-ui/react/navigation-menu";
import { cva } from "class-variance-authority";
import { ChevronDownIcon } from "lucide-react";
import * as React from "react";
import { cn } from "../lib/cn";
import { popupClockStyle, popupStyle } from "../lib/popup-style";
import { type CadenceMotion, useCadenceMotionScope, withCadenceScope } from "../lib/provider";

/** Base UI 1.6 focus sentinels are tabbable. They must not be aria-hidden.
 * Empty generic spans need no accessible name and keep their native focus redirection.
 * Scope observation to this menu's two surfaces; never change tabindex or event handlers.
 */
function useNavigationGuards(ref: React.Ref<HTMLElement> | undefined) {
  return React.useCallback(
    (node: HTMLElement | null) => {
      let refCleanup: undefined | (() => void);
      if (typeof ref === "function") refCleanup = ref(node) || undefined;
      else if (ref) ref.current = node;
      if (!node) return;
      const repair = () => {
        for (const guard of node.querySelectorAll('[data-base-ui-focus-guard][aria-hidden="true"]')) {
          guard.removeAttribute("aria-hidden");
        }
      };
      repair();
      const observer = new MutationObserver(repair);
      observer.observe(node, { childList: true, subtree: true });
      return () => {
        observer.disconnect();
        if (typeof refCleanup === "function") refCleanup();
        else if (typeof ref === "function") ref(null);
        else if (ref) ref.current = null;
      };
    },
    [ref],
  );
}

// Portals and explicit nested modes must own their clock, including full inside none.
function clock(cm: CadenceMotion): React.CSSProperties {
  return popupClockStyle(cm);
}

// Preserve Base UI state callback classes; caller classes always merge last.
function classes<State>(base: string, value: string | ((state: State) => string | undefined) | undefined) {
  return typeof value === "function" ? (state: State) => cn(base, value(state)) : cn(base, value);
}

function NavigationMenu({
  align = "start",
  className,
  children,
  ref,
  ...props
}: NavigationMenuPrimitive.Root.Props & Pick<NavigationMenuPrimitive.Positioner.Props, "align">) {
  const guardRef = useNavigationGuards(ref);
  return (
    <NavigationMenuPrimitive.Root
      ref={guardRef}
      data-slot="navigation-menu"
      className={classes(
        "cn-navigation-menu group/navigation-menu relative flex max-w-max flex-1 items-center justify-center",
        className,
      )}
      {...props}
    >
      {children}
      <NavigationMenuPositioner align={align} />
    </NavigationMenuPrimitive.Root>
  );
}

function NavigationMenuList({ className, ...props }: React.ComponentPropsWithRef<typeof NavigationMenuPrimitive.List>) {
  return (
    <NavigationMenuPrimitive.List
      data-slot="navigation-menu-list"
      className={classes("group flex flex-1 list-none items-center justify-center gap-1", className)}
      {...props}
    />
  );
}

function NavigationMenuItem({ className, ...props }: React.ComponentPropsWithRef<typeof NavigationMenuPrimitive.Item>) {
  return (
    <NavigationMenuPrimitive.Item
      data-slot="navigation-menu-item"
      className={classes("cn-navigation-menu-item relative", className)}
      {...props}
    />
  );
}

const navigationMenuTriggerStyle = cva(
  "group/navigation-menu-trigger inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 data-disabled:pointer-events-none data-disabled:opacity-50 data-popup-open:bg-accent/50",
);

function NavigationMenuTrigger({ className, children, ...props }: NavigationMenuPrimitive.Trigger.Props) {
  return (
    <NavigationMenuPrimitive.Trigger
      data-slot="navigation-menu-trigger"
      className={classes(navigationMenuTriggerStyle(), className)}
      {...props}
    >
      {children} <ChevronDownIcon className="ml-1 size-3" aria-hidden="true" />
    </NavigationMenuPrimitive.Trigger>
  );
}

function NavigationMenuContent({ className, style, ...props }: NavigationMenuPrimitive.Content.Props) {
  const { cm, ref: scopeRef } = useCadenceMotionScope(props.ref);

  return withCadenceScope(
    cm,
    <NavigationMenuPrimitive.Content
      style={popupStyle(cm, style)}
      data-slot="navigation-menu-content"
      data-motion={cm.mode}
      data-reduced={cm.reduced || undefined}
      className={classes(
        cn(
          "h-full w-auto p-2 transition-opacity duration-(--motion-duration-fast) ease-cadence-out",
          cm.disabled && "transition-none",
          !cm.disabled && "data-ending-style:opacity-0 data-starting-style:opacity-0",
        ),
        className,
      )}
      {...props}
      ref={scopeRef}
    />,
  );
}

function NavigationMenuPositioner({
  className,
  ref,
  style,
  side = "bottom",
  sideOffset = 8,
  align = "start",
  alignOffset = 0,
  ...props
}: NavigationMenuPrimitive.Positioner.Props) {
  const guardRef = useNavigationGuards(ref);
  const { cm, ref: scopeRef } = useCadenceMotionScope(guardRef);

  return (
    <NavigationMenuPrimitive.Portal>
      {withCadenceScope(
        cm,
        <NavigationMenuPrimitive.Positioner
          ref={scopeRef}
          data-slot="navigation-menu-positioner"
          data-motion={cm.mode}
          data-cadence-scope=""
          style={popupStyle(cm, style)}
          side={side}
          sideOffset={sideOffset}
          align={align}
          alignOffset={alignOffset}
          className={classes(
            "isolate z-50 h-(--positioner-height) w-(--positioner-width) max-w-(--available-width)",
            className,
          )}
          {...props}
        >
          <NavigationMenuPrimitive.Popup
            style={clock(cm)}
            data-slot="navigation-menu-popup"
            data-motion={cm.mode}
            className={cn(
              "relative h-(--popup-height) w-(--popup-width) min-h-0 min-w-0 max-h-(--available-height) max-w-(--available-width) origin-(--transform-origin) rounded-md border bg-popover text-popover-foreground shadow-md ease-cadence-out duration-(--motion-duration-fast)",
              !cm.disabled && "data-ending-style:opacity-0 data-starting-style:opacity-0",
              cm.disabled
                ? "transition-none"
                : cm.reduced
                  ? "transition-opacity"
                  : "transition-[opacity,scale,width,height] duration-[var(--motion-duration-fast),var(--motion-duration-fast),var(--motion-duration-slow),var(--motion-duration-slow)] data-starting-style:scale-(--motion-scale-in) data-ending-style:scale-(--motion-scale-in)",
            )}
          >
            <NavigationMenuPrimitive.Viewport
              data-slot="navigation-menu-viewport"
              className="relative size-full overflow-auto"
            />
          </NavigationMenuPrimitive.Popup>
        </NavigationMenuPrimitive.Positioner>,
      )}
    </NavigationMenuPrimitive.Portal>
  );
}

function NavigationMenuLink({ className, ...props }: NavigationMenuPrimitive.Link.Props) {
  return (
    <NavigationMenuPrimitive.Link
      data-slot="navigation-menu-link"
      className={classes(
        "flex flex-col gap-1 rounded-sm p-2 text-sm outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 data-active:bg-accent/50",
        className,
      )}
      {...props}
    />
  );
}

function NavigationMenuIndicator({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof NavigationMenuPrimitive.Icon>) {
  return (
    <NavigationMenuPrimitive.Icon
      data-slot="navigation-menu-indicator"
      className={classes(
        "cn-navigation-menu-indicator top-full z-1 flex h-1.5 items-end justify-center overflow-hidden",
        className,
      )}
      {...props}
    >
      <div className="cn-navigation-menu-indicator-arrow relative top-[60%] h-2 w-2 rotate-45" />
    </NavigationMenuPrimitive.Icon>
  );
}

export {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuPositioner,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
};
