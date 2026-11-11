# Accordion

> Reveal related sections while keeping their headings easy to scan.

- Registry item: https://cadence.dev/r/accordion.json
- Install: `npx shadcn@latest add @cadence/accordion`
- Type: registry:ui
- Since: 0.4.0
- Motion recipes: geometry.resize

## Installation

**Command**

```install
npx shadcn@latest add @cadence/accordion
```

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge motion @base-ui/react lucide-react
```

2. Copy the following registry dependencies in the listed dependency order. Each JSON link exposes every file's full `content` and `target`; copy all files, including multi-file helpers.

- [@cadence/cadence-motion](https://cadence.dev/r/cadence-motion.json) — direct registry dependency.
- [@cadence/cadence-utils](https://cadence.dev/r/cadence-utils.json) — direct registry dependency.
- [@cadence/cadence-theme](https://cadence.dev/r/cadence-theme.json) — transitive registry dependency.
- [@cadence/cadence-provider](https://cadence.dev/r/cadence-provider.json) — direct registry dependency.

3. Place every file at its target below. `@components` means your components directory, for example `src/components`; keep the remaining `cadence/` tree and relative imports intact. Each source block on the website copies the entire file, including folded lines.

| Item | Target file | Full source |
| --- | --- | --- |
| cadence-motion | `@components/cadence/lib/motion.ts` | [JSON files[].content](https://cadence.dev/r/cadence-motion.json) |
| cadence-motion | `@components/cadence/lib/geometry.ts` | [JSON files[].content](https://cadence.dev/r/cadence-motion.json) |
| cadence-utils | `@components/cadence/lib/cn.ts` | [JSON files[].content](https://cadence.dev/r/cadence-utils.json) |
| cadence-provider | `@components/cadence/lib/provider.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/popup-style.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/control-animation.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/native-div.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/press-button.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/motion-scope.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/css-motion.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/motion-environment.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/motion-transaction.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/motion-presence.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/popup-presence.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/motion-ref.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/group-member.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/inline-presence.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| accordion | `@components/cadence/accordion/index.tsx` | [JSON files[].content](https://cadence.dev/r/accordion.json) |

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: accordion](https://cadence.dev/r/accordion.json)

4. Apply the required CSS/configuration below, then follow [Usage](#usage) for the component imports and composition.

Merge the CSS from [cadence-theme](https://cadence.dev/r/cadence-theme.json) into your global stylesheet after your base theme:

```css
@theme inline {
  --color-sidebar: var(--sidebar, var(--card));
  --color-sidebar-foreground: var(--sidebar-foreground, var(--card-foreground));
  --color-sidebar-primary: var(--sidebar-primary, var(--primary));
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground, var(--primary-foreground));
  --color-sidebar-accent: var(--sidebar-accent, var(--accent));
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground, var(--accent-foreground));
  --color-sidebar-border: var(--sidebar-border, var(--border));
  --color-sidebar-ring: var(--sidebar-ring, var(--ring));
}

:root {

}

@layer base {
  :root {
    --motion-source-duration-instant: 0.1s;
    --motion-source-duration-fast: 0.16s;
    --motion-source-duration-base: 0.22s;
    --motion-source-duration-slow: 0.32s;
    --motion-source-duration-page: 0.45s;
    --motion-distance-xs: 4px;
    --motion-distance-sm: 8px;
    --motion-distance-md: 12px;
    --motion-distance-lg: 24px;
    --motion-distance-xl: 48px;
    --motion-scale-in: 0.96;
    --motion-scale-pop: 1.02;
    --motion-scale-press: 0.97;
    --motion-rotation-half-turn: 180deg;
    --motion-stagger-char: 0.012s;
    --motion-stagger-word: 0.035s;
    --motion-stagger-item: 0.05s;
    --motion-spring-press-duration: 0.24s;
    --motion-spring-press-bounce: 0.12;
    --motion-spring-snappy-duration: 0.26s;
    --motion-spring-snappy-bounce: 0;
    --motion-spring-travel-duration: 0.3s;
    --motion-spring-travel-bounce: 0;
    --motion-spring-smooth-duration: 0.4s;
    --motion-spring-smooth-bounce: 0;
    --motion-spring-morph-duration: 0.42s;
    --motion-spring-morph-bounce: 0;
    --motion-spring-size-compact-duration: 0.28s;
    --motion-spring-size-compact-bounce: 0;
    --motion-spring-size-panel-duration: 0.36s;
    --motion-spring-size-panel-bounce: 0;
    --motion-duration-instant: var(--cadence-effective-instant, calc(var(--motion-source-duration-instant) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-fast: var(--cadence-effective-fast, calc(var(--motion-source-duration-fast) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-base: var(--cadence-effective-base, calc(var(--motion-source-duration-base) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-slow: var(--cadence-effective-slow, calc(var(--motion-source-duration-slow) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-page: var(--cadence-effective-page, calc(var(--motion-source-duration-page) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-source-version: 1;
    --motion-stagger-reveal: 0.055s;
  }
  [data-cadence-scope] {
    --motion-source-duration-instant: var(--cadence-inherited-motion-source-duration-instant, inherit);
    --motion-source-duration-fast: var(--cadence-inherited-motion-source-duration-fast, inherit);
    --motion-source-duration-base: var(--cadence-inherited-motion-source-duration-base, inherit);
    --motion-source-duration-slow: var(--cadence-inherited-motion-source-duration-slow, inherit);
    --motion-source-duration-page: var(--cadence-inherited-motion-source-duration-page, inherit);
    --motion-distance-xs: var(--cadence-inherited-motion-distance-xs, inherit);
    --motion-distance-sm: var(--cadence-inherited-motion-distance-sm, inherit);
    --motion-distance-md: var(--cadence-inherited-motion-distance-md, inherit);
    --motion-distance-lg: var(--cadence-inherited-motion-distance-lg, inherit);
    --motion-distance-xl: var(--cadence-inherited-motion-distance-xl, inherit);
    --motion-scale-in: var(--cadence-inherited-motion-scale-in, inherit);
    --motion-scale-pop: var(--cadence-inherited-motion-scale-pop, inherit);
    --motion-scale-press: var(--cadence-inherited-motion-scale-press, inherit);
    --motion-rotation-half-turn: var(--cadence-inherited-motion-rotation-half-turn, inherit);
    --motion-stagger-char: var(--cadence-inherited-motion-stagger-char, inherit);
    --motion-stagger-word: var(--cadence-inherited-motion-stagger-word, inherit);
    --motion-stagger-item: var(--cadence-inherited-motion-stagger-item, inherit);
    --ease-cadence-out: var(--cadence-inherited-ease-cadence-out, inherit);
    --ease-cadence-in-out: var(--cadence-inherited-ease-cadence-in-out, inherit);
    --ease-cadence-in: var(--cadence-inherited-ease-cadence-in, inherit);
    --motion-spring-press-duration: var(--cadence-inherited-motion-spring-press-duration, inherit);
    --motion-spring-press-bounce: var(--cadence-inherited-motion-spring-press-bounce, inherit);
    --motion-spring-snappy-duration: var(--cadence-inherited-motion-spring-snappy-duration, inherit);
    --motion-spring-snappy-bounce: var(--cadence-inherited-motion-spring-snappy-bounce, inherit);
    --motion-spring-travel-duration: var(--cadence-inherited-motion-spring-travel-duration, inherit);
    --motion-spring-travel-bounce: var(--cadence-inherited-motion-spring-travel-bounce, inherit);
    --motion-spring-smooth-duration: var(--cadence-inherited-motion-spring-smooth-duration, inherit);
    --motion-spring-smooth-bounce: var(--cadence-inherited-motion-spring-smooth-bounce, inherit);
    --motion-spring-morph-duration: var(--cadence-inherited-motion-spring-morph-duration, inherit);
    --motion-spring-morph-bounce: var(--cadence-inherited-motion-spring-morph-bounce, inherit);
    --motion-spring-size-compact-duration: var(--cadence-inherited-motion-spring-size-compact-duration, inherit);
    --motion-spring-size-compact-bounce: var(--cadence-inherited-motion-spring-size-compact-bounce, inherit);
    --motion-spring-size-panel-duration: var(--cadence-inherited-motion-spring-size-panel-duration, inherit);
    --motion-spring-size-panel-bounce: var(--cadence-inherited-motion-spring-size-panel-bounce, inherit);
    --motion-stagger-reveal: var(--cadence-inherited-motion-stagger-reveal, inherit);
  }
  [data-motion='full'] {
    --motion-duration-instant: var(--cadence-effective-instant, calc(var(--motion-source-duration-instant) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-fast: var(--cadence-effective-fast, calc(var(--motion-source-duration-fast) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-base: var(--cadence-effective-base, calc(var(--motion-source-duration-base) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-slow: var(--cadence-effective-slow, calc(var(--motion-source-duration-slow) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-page: var(--cadence-effective-page, calc(var(--motion-source-duration-page) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
  }
  [data-motion='reduced'] {
    --motion-duration-instant: var(--cadence-effective-instant, calc(var(--motion-source-duration-instant) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-fast: var(--cadence-effective-fast, calc(var(--motion-source-duration-fast) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-base: var(--cadence-effective-base, calc(var(--motion-source-duration-base) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-slow: var(--cadence-effective-slow, calc(var(--motion-source-duration-slow) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-page: var(--cadence-effective-page, calc(var(--motion-source-duration-page) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
  }
  [data-motion='none'] {
    --motion-duration-instant: calc(0s + 0s * 1);
    --motion-duration-fast: calc(0s + 0s * 1);
    --motion-duration-base: calc(0s + 0s * 1);
    --motion-duration-slow: calc(0s + 0s * 1);
    --motion-duration-page: calc(0s + 0s * 1);
  }
  @media (prefers-reduced-motion: reduce) {
    :root {
      --motion-duration-instant: var(--cadence-effective-instant, calc(var(--motion-source-duration-instant) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-fast: var(--cadence-effective-fast, calc(var(--motion-source-duration-fast) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-base: var(--cadence-effective-base, calc(var(--motion-source-duration-base) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-slow: var(--cadence-effective-slow, calc(var(--motion-source-duration-slow) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-page: var(--cadence-effective-page, calc(var(--motion-source-duration-page) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
    }
    [data-motion='full'] {
      --motion-duration-instant: var(--cadence-effective-instant, calc(var(--motion-source-duration-instant) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-fast: var(--cadence-effective-fast, calc(var(--motion-source-duration-fast) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-base: var(--cadence-effective-base, calc(var(--motion-source-duration-base) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-slow: var(--cadence-effective-slow, calc(var(--motion-source-duration-slow) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-page: var(--cadence-effective-page, calc(var(--motion-source-duration-page) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
    }
  }
}
@theme static {
  --ease-cadence-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-cadence-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-cadence-in: cubic-bezier(0.7, 0, 0.84, 0);
}
```

The provider files above are required imports. Wrapping your application is optional; standalone components respect the system motion preference. To control a subtree, wrap it once:

```tsx
import { CadenceProvider } from "@/components/cadence/lib/provider";

export function MotionRoot({ children }: { children: React.ReactNode }) {
  return <CadenceProvider mode="full">{children}</CadenceProvider>;
}
```

Copy all nine target files, keeping `accordion/index.tsx` and the shared
`lib/` directory in the same `cadence/` tree. Preserve relative imports and
the sources' `"use client"` directives. Copy every file in the motion,
utilities and provider payloads, including helpers not imported by Accordion
directly. The provider files and `motion` package are required imports even
without the optional `CadenceProvider` wrapper.

Complete the base theme setup linked above and ensure Tailwind scans the
copied files. Include the Cadence duration and easing tokens used by the
disclosure classes. No additional item-specific CSS or external asset is
required. Keep the inner measurement wrapper: full mode transitions the
nonnegative measured panel height, while reduced and none update it
immediately. Initially open server-rendered content retains its natural height.
Standalone components follow the system preference; use `CadenceProvider`
to choose a product mode or override an inherited scope.

The basic Usage and the static examples can be composed in a Server Component
with serializable values and children, including the `render={<section />}`
element. Use a client caller for controlled arrays and their change handlers,
the Changing content action, refs, or function-valued `render`, `className`
and `style` props. The Persistent content example retains its client directive;
synchronous `useId` alone does not require a client caller. Keep a meaningful
level-two section heading above the trigger's level-three headings.

The Controlled and Changing content examples additionally use
`@cadence/button`; Persistent content uses `@cadence/input` and
`@cadence/label`. Install those items separately, or copy every target and
recursive dependency from their Manual panels. The caller owns open-value
arrays, content updates and any input data; Accordion provides disclosure UI.

## Usage

The trigger includes a level-three heading. Place the accordion under a meaningful level-two section heading, such as the component questions in the preview.

```tsx
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/cadence/accordion";

export function Example() {
  return (
    <Accordion defaultValue={["shipping"]}>
      <AccordionItem value="shipping">
        <AccordionTrigger>When will my order arrive?</AccordionTrigger>
        <AccordionContent>Most orders arrive within five working days.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
```

## Controlled

Base UI uses arrays for both single and multiple selection. The caller owns the value; these external actions open or close the account section without resetting other examples.

<ComponentExample name="controlled" />

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/cadence/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/cadence/accordion";

export function ControlledExample() {
  const [value, setValue] = useState<string[]>([]);
  return <div className="grid gap-4">
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={() => setValue(["account"])}>Open account from outside</Button>
      <Button variant="outline" onClick={() => setValue([])}>Close from outside</Button>
    </div>
    <Accordion value={value} onValueChange={setValue}>
      <AccordionItem value="account">
        <AccordionTrigger>Account settings</AccordionTrigger>
        <AccordionContent>Your account details stay with the caller.</AccordionContent>
      </AccordionItem>
    </Accordion>
    <p role="status">Open sections: {value.join(", ") || "none"}</p>
  </div>;
}
```

## Multiple sections

Set multiple to keep several answers open. Both start open here; closing Delivery leaves Returns unchanged.

<ComponentExample name="multiple" />

```tsx
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/cadence/accordion";

export function MultipleExample() {
  return <Accordion multiple defaultValue={["delivery", "returns"]}>
    <AccordionItem value="delivery"><AccordionTrigger>Delivery</AccordionTrigger><AccordionContent>Track your delivery from your order history.</AccordionContent></AccordionItem>
    <AccordionItem value="returns"><AccordionTrigger>Returns</AccordionTrigger><AccordionContent>Start a return within thirty days.</AccordionContent></AccordionItem>
  </Accordion>;
}
```

## Disabled

An item can be unavailable while its neighbours remain usable. Root disabled applies to every trigger. Disabled triggers cannot activate and are skipped by Tab; initially open information can still be read.

<ComponentExample name="disabled" />

```tsx
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/cadence/accordion";

export function DisabledExample() {
  return <div className="grid gap-4">
    <Accordion defaultValue={["available"]}>
      <AccordionItem value="available"><AccordionTrigger>Available settings</AccordionTrigger><AccordionContent>You can edit these settings.</AccordionContent></AccordionItem>
      <AccordionItem value="locked" disabled><AccordionTrigger>Unavailable section</AccordionTrigger><AccordionContent>Not available yet.</AccordionContent></AccordionItem>
      <AccordionItem value="help"><AccordionTrigger>Settings help</AccordionTrigger><AccordionContent>Contact the workspace owner.</AccordionContent></AccordionItem>
    </Accordion>
    <Accordion disabled defaultValue={["readable"]}>
      <AccordionItem value="readable"><AccordionTrigger>Read-only summary</AccordionTrigger><AccordionContent>The whole group is disabled; this initial summary remains readable.</AccordionContent></AccordionItem>
      <AccordionItem value="later"><AccordionTrigger>Locked next step</AccordionTrigger><AccordionContent>Unavailable.</AccordionContent></AccordionItem>
    </Accordion>
  </div>;
}
```

## Persistent content

Closed panels normally unmount. Root keepMounted preserves the native input and its draft while hidden; the second group applies keepMounted to one panel instead. Each input has an independent label and ID. Hidden controls leave the tab order.

<ComponentExample name="persistent" />

```tsx
"use client";

import { useId } from "react";
import { Input } from "@/components/cadence/input";
import { Label } from "@/components/cadence/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/cadence/accordion";

export function PersistentExample() {
  const rootId = useId();
  const panelId = useId();
  return <div className="grid gap-4">
    <Accordion keepMounted defaultValue={["draft"]}>
      <AccordionItem value="draft"><AccordionTrigger>Workspace draft</AccordionTrigger><AccordionContent>
        <Label htmlFor={rootId}>Workspace note</Label><Input id={rootId} defaultValue="Keep this draft" />
      </AccordionContent></AccordionItem>
    </Accordion>
    <Accordion defaultValue={["local"]}>
      <AccordionItem value="local"><AccordionTrigger>Panel draft</AccordionTrigger><AccordionContent keepMounted>
        <Label htmlFor={panelId}>Panel note</Label><Input id={panelId} defaultValue="Keep this panel" />
      </AccordionContent></AccordionItem>
    </Accordion>
  </div>;
}
```

## Searchable content

hiddenUntilFound keeps a closed panel in the DOM with hidden="until-found", overriding keepMounted. In supporting browsers, search for “Cobalt delivery reference” using the browser’s Find command to reveal it. The second group applies the same option to one panel. Browser support and native find behavior remain browser responsibilities.

<ComponentExample name="searchable" />

```tsx
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/cadence/accordion";

export function SearchableExample() {
  return <div className="grid gap-4">
    <Accordion hiddenUntilFound>
      <AccordionItem value="reference"><AccordionTrigger>Delivery reference</AccordionTrigger><AccordionContent>Cobalt delivery reference: use your order number when contacting support.</AccordionContent></AccordionItem>
    </Accordion>
    <Accordion>
      <AccordionItem value="policy"><AccordionTrigger>Searchable policy</AccordionTrigger><AccordionContent hiddenUntilFound>Indigo returns reference: keep your receipt for a return.</AccordionContent></AccordionItem>
    </Accordion>
  </div>;
}
```

## Changing content

This caller-owned action inserts real detail into an open answer. Full mode follows the measured height and can reverse while opening or closing; reduced and none update height immediately. The section’s own trigger still controls disclosure.

<ComponentExample name="changing-content" />

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/cadence/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/cadence/accordion";

export function ChangingContentExample() {
  const [expanded, setExpanded] = useState(false);
  return <Accordion defaultValue={["motion"]}>
    <AccordionItem value="motion">
      <AccordionTrigger>Can I reduce the motion?</AccordionTrigger>
      <AccordionContent>
        <p>Yes. Your system preference is respected, and the provider can disable motion entirely.</p>
        <Button variant="outline" size="sm" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>Toggle details</Button>
        {expanded && <p className="mt-4">Disclosure heights update instantly in reduced and none modes. Full mode follows the measured content height and can reverse while moving.</p>}
      </AccordionContent>
    </AccordionItem>
  </Accordion>;
}
```

## Custom panel rendering

Use render to change the panel’s element while preserving the supplied children, props and ref. className styles the inner content; style applies to the outer measured panel. The existing trigger and heading remain native accessible controls.

<ComponentExample name="custom-render" />

```tsx
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/cadence/accordion";

export function CustomRenderExample() {
  return <Accordion defaultValue={["support"]}>
    <AccordionItem value="support">
      <AccordionTrigger>Where can I get help?</AccordionTrigger>
      <AccordionContent render={<section />} className="text-muted-foreground" style={{ scrollMarginTop: "6rem" }}>
        <a href="/docs/installation">Read the installation guide</a> before adding your first component.
      </AccordionContent>
    </AccordionItem>
  </Accordion>;
}
```

## Legacy orientation

vertical and horizontal are deprecated Base UI state values, shown separately below. Cadence retains a vertical layout for both; these props and loopFocus do not enable arrow-key roving focus. Use Tab and Shift+Tab to move between triggers.

<ComponentExample name="orientation" />

```tsx
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/cadence/accordion";

export function OrientationExample() {
  return <div className="grid gap-4">
    {(["vertical", "horizontal"] as const).map(orientation => <Accordion key={orientation} orientation={orientation} loopFocus defaultValue={["state"]}>
      <AccordionItem value="state"><AccordionTrigger>{orientation} state</AccordionTrigger><AccordionContent>Orientation is retained as state; keyboard navigation follows normal Tab order.</AccordionContent></AccordionItem>
      <AccordionItem value="next"><AccordionTrigger>Next {orientation} section</AccordionTrigger><AccordionContent>This is still a vertically stacked section.</AccordionContent></AccordionItem>
    </Accordion>)}
  </div>;
}
```

## Without motion

The first accordion has an explicit none provider from its first render. A nested full provider opts the second accordion back into the normal geometry recipe. The operating system’s reduced-motion preference still takes priority over full.

<ComponentExample name="without-motion" />

```tsx
"use client";

import { CadenceProvider } from "@/components/cadence/lib/provider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/cadence/accordion";

export function WithoutMotionExample() {
  return <CadenceProvider mode="none"><div className="grid gap-4">
    <Accordion defaultValue={["instant"]}><AccordionItem value="instant"><AccordionTrigger>Instant disclosure</AccordionTrigger><AccordionContent>No height transition runs here.</AccordionContent></AccordionItem></Accordion>
    <CadenceProvider mode="full"><Accordion defaultValue={["nested"]}><AccordionItem value="nested"><AccordionTrigger>Nested full disclosure</AccordionTrigger><AccordionContent>The operating system can still reduce this transition.</AccordionContent></AccordionItem></Accordion></CadenceProvider>
  </div></CadenceProvider>;
}
```

## When to use

- FAQ answers that readers scan by heading.
- Related settings sections with optional detail.
- Compact reference material with meaningful section titles.

## When not to use

- Use Collapsible for a single disclosure without grouped navigation.
- Use Tabs for peer views occupying one shared panel.
- Keep essential instructions visible rather than hiding them.

## API

### `Accordion`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` / `defaultValue` | `Value[]` | uncontrolled / `[]` | Expanded item values. |
| `onValueChange` | `(value, details) => void` | — | Caller-owned controlled state. |
| `multiple` | `boolean` | `false` | Permit several expanded items. |
| `disabled` | `boolean` | `false` | Disable all items. |
| `orientation` | `"vertical" | "horizontal"` | `"vertical"` | Deprecated; retained as state only. |
| `keepMounted` | `boolean` | `false` | Keep closed panels in the DOM. |
| `hiddenUntilFound` | `boolean` | `false` | Allow browser find-in-page to reveal content. |

### `AccordionItem`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `unknown` | generated | Stable identity for controlled state. |
| `disabled` | `boolean` | `false` | Disable this item's trigger. |

### `AccordionTrigger`

All Base UI Trigger props pass through, including `render`, `ref`, and `nativeButton`. A heading wraps
the trigger. Two decorative icons swap immediately with `aria-expanded`; no rotation is animated.

### `AccordionContent`

All Base UI Panel props pass through, including `keepMounted`, `hiddenUntilFound`, `render`, `style`,
and `ref`. `className` styles the inner content, matching upstream; `style` applies to the panel.
Root and Item classes merge last.

## Motion contract

Authored intensity is **medium**: The disclosure panel changes height for open and close; it does not yet animate arbitrary content resizes.

| Phase | Properties | Token | Interruptible |
| --- | --- | --- | --- |
| Open / close / content resize | Measured height clamped at zero | `geometry.resize/css-transition` CSS form: `duration.slow` / `ease.out` | Yes, native CSS reversal from current height |
| Initially open | Natural height, no entrance | — | — |
| Reduced | Instant height, no transform | Zero duration | Yes |
| None | Instant height, no transform or transition | Zero duration | Yes |

The CSS form preserves position on interruption rather than spring velocity. Base UI owns panel
mounting, hidden state, keyboard navigation, and find-in-page behavior. An inner ResizeObserver
retargets changes in content without observing the animated panel itself. The closed size is zero.

## Accessibility

Triggers expose expanded state and control labelled regions. Focus stays on the trigger when a
panel toggles. Give each trigger a meaningful heading; do not place interactive controls inside it.
Disabled items are skipped in tab navigation. Content controls remain in normal tab order.

## Keyboard interactions

| Keys | Action |
| --- | --- |
| Enter / Space | Toggle the focused trigger. |
| Tab / Shift+Tab | Follow normal page order through triggers and open content. |

Base UI 1.6 follows the updated APG guidance without arrow-key roving focus. `orientation` and
`loopFocus` are deprecated passthrough props; neither changes keyboard focus behavior.

## Responsive behavior

The root fills its container. Long headings wrap and the icons retain their size. Content is
remeasured when wrapping changes; there is no fixed maximum height or breakpoint-specific state.

## Performance

T3 budget: 12 KB gzip. One observer per mounted content slot; closed panels unmount by default.
Measurements run after commit and on content resize, never during render. No timers drive motion.
Server-rendered initially open content keeps its natural size before hydration.

## Notes for AI

- Use the Base UI array value API, not Radix `type="single"` or `collapsible` props.
- Preserve all four exports and the trigger-icon slot when customising.
- Keep the measurement wrapper and mode branch when editing motion.
- Related: Collapsible for a standalone disclosure; Tabs for alternate views.

---

Full index: https://cadence.dev/llms.txt
