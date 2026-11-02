"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { LayoutGroup, motion } from "motion/react";
import { useId } from "react";
import { cn } from "../lib/cn";
import { useCadenceMotion } from "../lib/provider";

function Tabs({ className, orientation = "horizontal", ...props }: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      orientation={orientation}
      className={(state) =>
        cn(
          "group/tabs flex gap-2 data-[orientation=horizontal]:flex-col",
          typeof className === "function" ? className(state) : className,
        )
      }
      {...props}
    />
  );
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-[orientation=horizontal]/tabs:h-9 group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: { variant: { default: "bg-muted", line: "gap-1 bg-transparent" } },
    defaultVariants: { variant: "default" },
  },
);

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  const id = useId();
  return (
    <LayoutGroup id={id}>
      <TabsPrimitive.List
        data-slot="tabs-list"
        data-variant={variant}
        className={(state) =>
          cn(tabsListVariants({ variant }), typeof className === "function" ? className(state) : className)
        }
        {...props}
      />
    </LayoutGroup>
  );
}

// Base UI supplies active state and its merged ref. useRender preserves both forms of caller render.
function TriggerSurface({
  elementProps,
  state,
  render,
}: {
  elementProps: React.ComponentPropsWithRef<"button">;
  state: TabsPrimitive.Tab.State;
  render: TabsPrimitive.Tab.Props["render"];
}) {
  const cm = useCadenceMotion();
  const indicatorClass =
    "pointer-events-none absolute inset-0 -z-10 rounded-md bg-background shadow-sm dark:bg-input/30 group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=line]/tabs-list:bg-foreground group-data-[variant=line]/tabs-list:shadow-none group-data-[variant=line]/tabs-list:inset-auto group-data-[variant=line]/tabs-list:bottom-[-5px] group-data-[variant=line]/tabs-list:inset-x-0 group-data-[variant=line]/tabs-list:h-0.5 group-data-[orientation=vertical]/tabs:group-data-[variant=line]/tabs-list:inset-y-0 group-data-[orientation=vertical]/tabs:group-data-[variant=line]/tabs-list:left-auto group-data-[orientation=vertical]/tabs:group-data-[variant=line]/tabs-list:-right-1 group-data-[orientation=vertical]/tabs:group-data-[variant=line]/tabs-list:h-auto group-data-[orientation=vertical]/tabs:group-data-[variant=line]/tabs-list:w-0.5";
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
      children: (
        <>
          {state.active &&
            (cm.reduced || cm.timeScale === 0 ? (
              <span aria-hidden="true" data-slot="tabs-indicator" data-motion={cm.mode} className={indicatorClass} />
            ) : (
              <motion.span
                aria-hidden="true"
                data-slot="tabs-indicator"
                data-motion={cm.mode}
                className={indicatorClass}
                layoutId="selection"
                initial={false}
                transition={cm.transition("layout.shared")}
              />
            ))}
          {elementProps.children}
        </>
      ),
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
          "relative isolate inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-active:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
          typeof className === "function" ? className(state) : className,
        )
      }
      render={(elementProps, state) => <TriggerSurface elementProps={elementProps} state={state} render={render} />}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={(state) => cn("flex-1 outline-none", typeof className === "function" ? className(state) : className)}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger, tabsListVariants };
