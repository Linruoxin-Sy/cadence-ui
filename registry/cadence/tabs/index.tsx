"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";
import { useMotionHostRef } from "../lib/motion-ref";
import { useCadenceMotion } from "../lib/provider";
import { TabsListSurface, TabsMotionRoot, TabsPanelSurface, TabsRootSurface, useTabsTrigger } from "../lib/tabs-motion";

function Tabs({ className, orientation = "horizontal", render, ...props }: TabsPrimitive.Root.Props) {
  return (
    <TabsMotionRoot>
      <TabsPrimitive.Root
        data-slot="tabs"
        data-orientation={orientation}
        orientation={orientation}
        render={(elementProps, state) => <TabsRootSurface elementProps={elementProps} state={state} render={render} />}
        className={(state) =>
          cn(
            "group/tabs flex gap-2 data-[orientation=horizontal]:flex-col",
            typeof className === "function" ? className(state) : className,
          )
        }
        {...props}
      />
    </TabsMotionRoot>
  );
}

const tabsListVariants = cva(
  "group/tabs-list relative isolate inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-[orientation=horizontal]/tabs:h-9 group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: { variant: { default: "bg-muted", line: "gap-1 bg-transparent" } },
    defaultVariants: { variant: "default" },
  },
);

function TabsList({
  className,
  variant = "default",
  render,
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      render={(elementProps, state) => (
        <TabsListSurface
          elementProps={elementProps}
          state={{ ...state }}
          render={render}
          variant={variant ?? "default"}
        />
      )}
      className={(state) =>
        cn(tabsListVariants({ variant }), typeof className === "function" ? className(state) : className)
      }
      {...props}
    />
  );
}

// Base UI supplies active state and its merged ref. useRender preserves both forms of caller render.
function TriggerSurface({
  elementProps,
  state,
  render,
  value,
}: {
  value: unknown;
  elementProps: React.ComponentPropsWithRef<"button">;
  state: TabsPrimitive.Tab.State;
  render: TabsPrimitive.Tab.Props["render"];
}) {
  const { node, ref } = useMotionHostRef(elementProps.ref);
  useTabsTrigger(node, value, state.active);
  return useRender({
    defaultTagName: "button",
    render,
    state: { ...state },
    stateAttributesMapping: {
      active: () => null,
      disabled: () => null,
      orientation: () => null,
      tabActivationDirection: () => null,
    },
    props: {
      ...elementProps,
      ref,
    },
  });
}

function TabsTrigger({ className, render, ...props }: TabsPrimitive.Tab.Props) {
  const cm = useCadenceMotion();
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      data-motion={cm.mode}
      className={(state) =>
        cn(
          "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-foreground after:opacity-0 group-data-[orientation=vertical]/tabs:after:inset-y-0 group-data-[orientation=vertical]/tabs:after:right-0 group-data-[orientation=vertical]/tabs:after:left-auto group-data-[orientation=vertical]/tabs:after:w-0.5 group-data-[orientation=vertical]/tabs:after:h-auto group-data-[variant=line]/tabs-list:data-active:after:opacity-100 group-data-[marker-ready]/tabs-list:after:opacity-0 relative isolate inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap text-muted-foreground group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-active:text-foreground data-active:bg-background dark:data-active:bg-input/30 group-data-[marker-ready]/tabs-list:data-active:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
          typeof className === "function" ? className(state) : className,
        )
      }
      render={(elementProps, state) => (
        <TriggerSurface elementProps={elementProps} state={state} render={render} value={props.value} />
      )}
      {...props}
    />
  );
}

function TabsContent({ className, render, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      render={(elementProps, state) => (
        <TabsPanelSurface elementProps={elementProps} state={{ ...state }} render={render} value={props.value} />
      )}
      className={(state) => cn("flex-1 outline-none", typeof className === "function" ? className(state) : className)}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger, tabsListVariants };
