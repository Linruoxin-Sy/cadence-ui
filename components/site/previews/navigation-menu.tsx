"use client";

import { DirectionProvider } from "@base-ui/react/direction-provider";
import { useId, useRef, useState } from "react";
import { Button } from "@/registry/cadence/button";
import { Input } from "@/registry/cadence/input";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/registry/cadence/navigation-menu";
import { PreviewStack } from "./shell";

export function GroupedLinksExample({ label = "Learning resources" }: { label?: string } = {}) {
  return (
    <NavigationMenu aria-label={label}>
      <NavigationMenuList>
        <NavigationMenuItem value="learn">
          <NavigationMenuTrigger>Learn</NavigationMenuTrigger>
          <NavigationMenuContent className="w-60">
            <NavigationMenuLink href="/docs/installation">Installation</NavigationMenuLink>
            <NavigationMenuLink href="/docs/motion">Motion guide</NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem value="build">
          <NavigationMenuTrigger>Build</NavigationMenuTrigger>
          <NavigationMenuContent className="grid w-80 max-w-full grid-cols-2 gap-2">
            <NavigationMenuLink href="/components">Components</NavigationMenuLink>
            <NavigationMenuLink href="/docs/registry">Registry</NavigationMenuLink>
            <NavigationMenuLink href="/docs/theming">Themes</NavigationMenuLink>
            <NavigationMenuLink href="/docs/accessibility">Accessibility</NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="/docs/changelog" className={navigationMenuTriggerStyle()}>
            News
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

export function ControlledNavigationExample() {
  const [value, setValue] = useState<string | null>(null);
  const [reason, setReason] = useState("No interaction yet");
  const actions = useRef<{ close: () => void; unmount: () => void } | null>(null);
  return (
    <div className="grid justify-items-start gap-3">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setValue("learn")}>
          Open Learn
        </Button>
        <Button variant="outline" onClick={() => setValue("build")}>
          Open Build
        </Button>
      </div>
      <p role="status" className="text-sm text-muted-foreground">
        {value ?? "Closed"} · {reason}
      </p>
      <NavigationMenu
        aria-label="Controlled resources"
        value={value}
        actionsRef={actions}
        onValueChange={(next, details) => {
          setValue(next);
          setReason(details.reason);
        }}
      >
        <NavigationMenuList>
          <NavigationMenuItem value="learn">
            <NavigationMenuTrigger>Learn</NavigationMenuTrigger>
            <NavigationMenuContent className="w-56">
              <NavigationMenuLink href="/docs/installation">Installation</NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem value="build">
            <NavigationMenuTrigger>Build</NavigationMenuTrigger>
            <NavigationMenuContent className="w-72">
              <NavigationMenuLink href="/components">Browse components</NavigationMenuLink>
              <NavigationMenuLink href="/docs/registry">Registry integration</NavigationMenuLink>
              <Button variant="outline" onClick={() => actions.current?.close()}>
                Close navigation
              </Button>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}

export function ActiveLinksExample() {
  const link = useRef<HTMLAnchorElement>(null);
  return (
    <div className="grid justify-items-start gap-3">
      <NavigationMenu aria-label="Current page resources" render={<nav data-custom-root="resources" />}>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink
              active
              href="/components/navigation-menu"
              ref={link}
              render={<a href="/components/navigation-menu" />}
              className={navigationMenuTriggerStyle()}
            >
              Navigation Menu
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem value="resources">
            <NavigationMenuTrigger
              render={<button type="button" />}
              className={(state) => (state.open ? "bg-accent" : "")}
            >
              Resources
              <NavigationMenuIndicator aria-hidden="true" />
            </NavigationMenuTrigger>
            <NavigationMenuContent className="w-60" style={(state) => ({ padding: state.open ? 12 : 8 })}>
              <NavigationMenuLink render={<a href="/docs/installation" />}>Installation</NavigationMenuLink>
              <NavigationMenuLink render={<a href="/docs/changelog" />}>Changelog</NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <Button variant="outline" onClick={() => link.current?.focus()}>
        Focus current page
      </Button>
    </div>
  );
}

export function RetainedContentExample() {
  const id = useId();
  return (
    <NavigationMenu aria-label="Retained resource draft">
      <NavigationMenuList>
        <NavigationMenuItem value="notes">
          <NavigationMenuTrigger>Notes</NavigationMenuTrigger>
          <NavigationMenuContent keepMounted className="grid w-64 gap-2">
            <label htmlFor={id} className="text-sm font-medium">
              Resource note
            </label>
            <Input id={id} defaultValue="Read the install guide" />
            <NavigationMenuLink href="/docs/installation">Installation</NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem value="guides">
          <NavigationMenuTrigger>Guides</NavigationMenuTrigger>
          <NavigationMenuContent keepMounted className="w-72">
            <NavigationMenuLink href="/docs/motion">Motion guide</NavigationMenuLink>
            <NavigationMenuLink href="/docs/theming">Theming guide</NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

export function ChangingContentExample() {
  const [expanded, setExpanded] = useState(false);
  return (
    <NavigationMenu aria-label="Growing resource list">
      <NavigationMenuList>
        <NavigationMenuItem value="resources">
          <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
          <NavigationMenuContent className={expanded ? "w-80" : "w-60"}>
            <Button variant="outline" aria-expanded={expanded} onClick={() => setExpanded((current) => !current)}>
              {expanded ? "Show fewer guides" : "Show more guides"}
            </Button>
            <NavigationMenuLink href="/docs/installation">Installation</NavigationMenuLink>
            {expanded && (
              <>
                <NavigationMenuLink href="/docs/motion">Motion guide</NavigationMenuLink>
                <NavigationMenuLink href="/docs/theming">Theming guide</NavigationMenuLink>
                <NavigationMenuLink href="/docs/accessibility">Accessibility guide</NavigationMenuLink>
              </>
            )}
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

export function VerticalExample() {
  return (
    <NavigationMenu orientation="vertical" aria-label="Vertical resources">
      <NavigationMenuList className="flex-col items-stretch">
        <NavigationMenuItem value="learn">
          <NavigationMenuTrigger>Learn</NavigationMenuTrigger>
          <NavigationMenuContent className="w-60">
            <NavigationMenuLink href="/docs/installation">Installation</NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem value="build">
          <NavigationMenuTrigger>Build</NavigationMenuTrigger>
          <NavigationMenuContent className="w-72">
            <NavigationMenuLink href="/docs/registry">Registry integration</NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

export function AlignmentExample() {
  return (
    <div className="flex flex-wrap gap-6">
      {(["start", "center", "end"] as const).map((align) => (
        <NavigationMenu key={align} align={align} aria-label={`${align} aligned resources`}>
          <NavigationMenuList>
            <NavigationMenuItem value="resources">
              <NavigationMenuTrigger>{align}</NavigationMenuTrigger>
              <NavigationMenuContent className="w-64">
                <NavigationMenuLink href="/docs/installation">Installation</NavigationMenuLink>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      ))}
    </div>
  );
}

export function DisabledTriggersExample() {
  return (
    <NavigationMenu aria-label="Available resources">
      <NavigationMenuList>
        <NavigationMenuItem value="guides">
          <NavigationMenuTrigger>Guides</NavigationMenuTrigger>
          <NavigationMenuContent className="w-60">
            <NavigationMenuLink href="/docs/installation">Installation</NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem value="upcoming">
          <NavigationMenuTrigger disabled>Upcoming</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuLink href="/docs/changelog">Changelog</NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink className={navigationMenuTriggerStyle()} href="/docs/changelog">
            News
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

export function LinkBehaviorExample() {
  const id = useId();
  return (
    <div className="grid gap-3">
      <NavigationMenu aria-label="Link closing behavior">
        <NavigationMenuList>
          <NavigationMenuItem value="links">
            <NavigationMenuTrigger>On this page</NavigationMenuTrigger>
            <NavigationMenuContent className="w-64">
              <NavigationMenuLink href={`#${id}`} closeOnClick={false}>
                Keep menu open
              </NavigationMenuLink>
              <NavigationMenuLink href={`#${id}`} closeOnClick>
                Close menu on follow
              </NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <p id={id} className="text-sm text-muted-foreground">
        Local resource summary
      </p>
    </div>
  );
}

export function HoverDelayExample() {
  return (
    <NavigationMenu aria-label="Delayed resources" delay={300} closeDelay={200}>
      <NavigationMenuList>
        <NavigationMenuItem value="guides">
          <NavigationMenuTrigger>Guides</NavigationMenuTrigger>
          <NavigationMenuContent className="w-60">
            <NavigationMenuLink href="/docs/installation">Installation</NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

export function RtlExample() {
  return (
    <DirectionProvider direction="rtl">
      <div dir="rtl" lang="ar">
        <NavigationMenu aria-label="موارد التعلم">
          <NavigationMenuList>
            <NavigationMenuItem value="learn">
              <NavigationMenuTrigger>تعلم</NavigationMenuTrigger>
              <NavigationMenuContent dir="rtl" lang="ar" className="w-60">
                <NavigationMenuLink href="/docs/installation">التثبيت</NavigationMenuLink>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem value="build">
              <NavigationMenuTrigger>بناء</NavigationMenuTrigger>
              <NavigationMenuContent dir="rtl" lang="ar" className="w-72">
                <NavigationMenuLink href="/docs/registry">السجل</NavigationMenuLink>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </DirectionProvider>
  );
}

export function WithoutMotionExample() {
  return (
    <CadenceProvider mode="none">
      <NavigationMenu aria-label="Instant resources">
        <NavigationMenuList>
          <NavigationMenuItem value="guides">
            <NavigationMenuTrigger>Guides</NavigationMenuTrigger>
            <NavigationMenuContent className="w-60">
              <NavigationMenuLink href="/docs/installation">Installation</NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </CadenceProvider>
  );
}

const examples = {
  "grouped-links": GroupedLinksExample,
  "controlled-navigation": ControlledNavigationExample,
  "active-links": ActiveLinksExample,
  "retained-content": RetainedContentExample,
  "changing-content": ChangingContentExample,
  vertical: VerticalExample,
  alignment: AlignmentExample,
  "disabled-triggers": DisabledTriggersExample,
  "link-behavior": LinkBehaviorExample,
  "hover-delay": HoverDelayExample,
  rtl: RtlExample,
  "without-motion": WithoutMotionExample,
};

export function NavigationMenuPreview({ example }: { example?: string }) {
  const Example = example ? examples[example as keyof typeof examples] : undefined;
  return (
    <PreviewStack className="min-h-40 items-start">
      {example ? Example && <Example /> : <GroupedLinksExample label="Primary site navigation" />}
    </PreviewStack>
  );
}
