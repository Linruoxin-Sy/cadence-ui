# Sidebar

> Workspace navigation for dashboards and application shells.

- Registry item: https://cadence.dev/r/sidebar.json
- Install: `npx shadcn@latest add @cadence/sidebar`
- Type: registry:ui
- Since: 0.5.0
- Motion recipes: layout.move, geometry.resize, data.transition

## Installation

**Command**

```install
npx shadcn@latest add @cadence/sidebar
```

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge motion @base-ui/react class-variance-authority lucide-react
```

2. Copy the following registry dependencies in the listed dependency order. Each JSON link exposes every file's full `content` and `target`; copy all files, including multi-file helpers.

- [@cadence/cadence-utils](https://cadence.dev/r/cadence-utils.json) — direct registry dependency.
- [@cadence/cadence-motion](https://cadence.dev/r/cadence-motion.json) — direct registry dependency.
- [@cadence/cadence-theme](https://cadence.dev/r/cadence-theme.json) — transitive registry dependency.
- [@cadence/cadence-provider](https://cadence.dev/r/cadence-provider.json) — direct registry dependency.
- [@cadence/cadence-geometry](https://cadence.dev/r/cadence-geometry.json) — direct registry dependency.
- [@cadence/use-mobile](https://cadence.dev/r/use-mobile.json) — direct registry dependency.
- [@cadence/button](https://cadence.dev/r/button.json) — direct registry dependency.
- [@cadence/input](https://cadence.dev/r/input.json) — direct registry dependency.
- [@cadence/separator](https://cadence.dev/r/separator.json) — direct registry dependency.
- [@cadence/sheet](https://cadence.dev/r/sheet.json) — direct registry dependency.
- [@cadence/skeleton](https://cadence.dev/r/skeleton.json) — direct registry dependency.
- [@cadence/tooltip](https://cadence.dev/r/tooltip.json) — direct registry dependency.

3. Place every file at its target below. `@components` means your components directory, for example `src/components`; keep the remaining `cadence/` tree and relative imports intact. Each source block on the website copies the entire file, including folded lines.

| Item | Target file | Full source |
| --- | --- | --- |
| cadence-utils | `@components/cadence/lib/cn.ts` | [JSON files[].content](https://cadence.dev/r/cadence-utils.json) |
| cadence-motion | `@components/cadence/lib/motion.ts` | [JSON files[].content](https://cadence.dev/r/cadence-motion.json) |
| cadence-motion | `@components/cadence/lib/geometry.ts` | [JSON files[].content](https://cadence.dev/r/cadence-motion.json) |
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
| cadence-geometry | `@components/cadence/lib/measured-geometry.ts` | [JSON files[].content](https://cadence.dev/r/cadence-geometry.json) |
| cadence-geometry | `@components/cadence/lib/size-linked-geometry.ts` | [JSON files[].content](https://cadence.dev/r/cadence-geometry.json) |
| cadence-geometry | `@components/cadence/lib/sidebar-geometry.ts` | [JSON files[].content](https://cadence.dev/r/cadence-geometry.json) |
| cadence-geometry | `@components/cadence/lib/sidebar-labels.ts` | [JSON files[].content](https://cadence.dev/r/cadence-geometry.json) |
| use-mobile | `@components/cadence/lib/hooks/use-mobile.ts` | [JSON files[].content](https://cadence.dev/r/use-mobile.json) |
| button | `@components/cadence/button/index.tsx` | [JSON files[].content](https://cadence.dev/r/button.json) |
| input | `@components/cadence/input/index.tsx` | [JSON files[].content](https://cadence.dev/r/input.json) |
| separator | `@components/cadence/separator/index.tsx` | [JSON files[].content](https://cadence.dev/r/separator.json) |
| sheet | `@components/cadence/sheet/index.tsx` | [JSON files[].content](https://cadence.dev/r/sheet.json) |
| skeleton | `@components/cadence/skeleton/index.tsx` | [JSON files[].content](https://cadence.dev/r/skeleton.json) |
| tooltip | `@components/cadence/tooltip/index.tsx` | [JSON files[].content](https://cadence.dev/r/tooltip.json) |
| sidebar | `@components/cadence/sidebar/index.tsx` | [JSON files[].content](https://cadence.dev/r/sidebar.json) |

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: cadence-geometry](https://cadence.dev/r/cadence-geometry.json)

[Source files: use-mobile](https://cadence.dev/r/use-mobile.json)

[Source files: button](https://cadence.dev/r/button.json)

[Source files: input](https://cadence.dev/r/input.json)

[Source files: separator](https://cadence.dev/r/separator.json)

[Source files: sheet](https://cadence.dev/r/sheet.json)

[Source files: skeleton](https://cadence.dev/r/skeleton.json)

[Source files: tooltip](https://cadence.dev/r/tooltip.json)

[Source files: sidebar](https://cadence.dev/r/sidebar.json)

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

Copy all 16 target files, including `lib/hooks/use-mobile.ts` and every
`cadence-motion` and `cadence-provider` helper. Keep their relative imports,
the `cadence/` directory structure and the shipped `"use client"` directives.
Complete the linked manual base setup, including Cadence theme CSS, and ensure
Tailwind CSS v4 scans the copied files. Its `--color-sidebar*` mappings supply
the sidebar utilities with semantic colour fallbacks; set matching
`--sidebar*` light/dark variables to customize them. No separate Sidebar
stylesheet is required. Apply `bg-background text-foreground` to your application
root so the main content inherits the active theme's text colour.
The registry graph already includes Button, Input,
Separator, Sheet, Skeleton, Tooltip and `lucide-react` used by these examples;
they require no additional example-only installation.

Keep `SidebarProvider`, navigation and `SidebarInset` together as in
[Usage](#usage). `SidebarProvider` is required for sidebar state and
`useSidebar`; it is separate from the optional `CadenceProvider` motion wrapper.
No `TooltipProvider` is required; add one only to share tooltip delay settings.
Use the default main element for application content, or
`SidebarInset render={<section />}` with a unique accessible name for an
embedded shell inside an existing main.

Serializable props, children and native elements such as `render={<a href="/" />}`
can be composed from a Server Component. Keep search state, controlled
`open`/`onOpenChange`, handlers, refs, `useSidebar` and function-valued
`render`/class/style props inside a `"use client"` caller, as the interactive
examples do. Supply real destinations or your router's link element through
`render`, not `asChild`; the caller owns routing, filtering and active state.
Set `aria-current="page"` on the current link as well as `isActive` for styling.

Desktop starts expanded unless `defaultOpen` or controlled `open` says otherwise.
Controlled callers must apply requested `onOpenChange` values themselves.
Desktop `open` does not control `openMobile`, which starts false. Below 768px,
collapsible sidebars switch to an 18rem modal Sheet after hydration; server
rendering initially uses the desktop tree. `collapsible="none"` remains static.
Desktop collapse retains children, while breakpoint changes and mobile closing
can unmount them: keep persistent drafts above Sidebar. Include a visible mobile
close control when needed; Sheet also provides Escape, outside dismissal and
focus management. Its built-in close button is hidden by Sidebar.

The desktop setter writes `sidebar_state=true` or `false` for seven days at
path `/`; it never reads the cookie. To restore it, read the request cookie on
the server and pass a boolean `defaultOpen`, using a consistent server/client
initial value. Otherwise a reload uses the default again. This cookie records
desktop state only. Ctrl+B or Cmd+B also toggles inside inputs and broadcasts
to every mounted provider; prefer one application provider. The rail is not
in Tab order, so retain the labelled trigger.

Desktop widths default to 16rem and 3rem for the icon rail; override
`--sidebar-width` and `--sidebar-width-icon` through provider style. Mobile
uses its own 18rem width; customize Sidebar style when needed. The 12rem widths,
containing transform and absolute desktop panels in these embedded examples
are local layout choices. Caller `style.transform` on Sidebar takes ownership
of desktop positioning and suppresses its offcanvas motion.

Sidebar coordinates desktop offcanvas translation and icon widths from the occupied gap in full;
reduced and none update geometry immediately. Unsupported layouts use native immediate geometry. Mobile Sheet, buttons, tooltips and loading
skeletons keep
their own inherited motion contracts; install their helpers even if you only
use desktop navigation.

## Usage

A minimal embedded application shell with real search and links. At the application root, use the default main semantics of SidebarInset. For an embedded shell, use Cadence's additive `render` prop to render a uniquely named section. The default element remains main.

```tsx
"use client";

import { Home, Inbox, Settings } from "lucide-react";
import { type CSSProperties, type ReactNode, useId, useState } from "react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInput, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger } from "@/components/cadence/sidebar";

function Frame({
  label,
  children,
  content,
  side = "left",
  defaultOpen = true,
  open,
  onOpenChange,
}: {
  label: string;
  children: ReactNode;
  content?: ReactNode;
  side?: "left" | "right";
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
      style={{ "--sidebar-width": "12rem" } as CSSProperties}
      className={`relative isolate h-96 min-h-96 overflow-hidden rounded-lg border [transform:translateZ(0)] ${side === "right" ? "flex-row-reverse" : ""}`}
    >
      {children}
      <SidebarInset render={<section />} aria-label={`${label} content`} className="min-w-0 gap-3 p-3">
        <SidebarTrigger aria-label={`Toggle ${label}`} />
        <p className="text-sm font-medium">Project overview</p>
        {content ?? <p className="text-xs text-muted-foreground">Your workspace content.</p>}
      </SidebarInset>
    </SidebarProvider>
  );
}

function Navigation({ label }: { label: string }) {
  const target = useId();
  const [query, setQuery] = useState("");
  return (
    <>
      <SidebarHeader>
        <strong className="truncate text-sm group-data-[collapsible=icon]:hidden">Acme workspace</strong>
        <SidebarInput
          className="group-data-[collapsible=icon]:hidden" aria-label={`Search ${label}`}
          placeholder="Search workspace"
          value={query}
          onValueChange={setQuery}
        />
      </SidebarHeader>
      <SidebarContent>
        <nav aria-label={label}>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {(
                  [
                    [Home, "Overview"],
                    [Inbox, "Inbox"],
                    [Settings, "Settings"],
                  ] as const
                )
                  .filter(([, text]) => text.toLowerCase().includes(query.toLowerCase()))
                  .map(([Icon, text]) => (
                    <SidebarMenuItem key={text}>
                      <SidebarMenuButton
                        render={<a href={`#${target}`} aria-current={text === "Overview" ? "page" : undefined} />}
                        isActive={text === "Overview"}
                        tooltip={text}
                      >
                        <Icon aria-hidden="true" />
                        <span>{text}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
            <p id={target} className="sr-only">
              Workspace navigation destination
            </p>
          </SidebarGroup>
        </nav>
      </SidebarContent>
      <SidebarFooter>
        <span className="truncate text-xs group-data-[collapsible=icon]:hidden">Acme team</span>
      </SidebarFooter>
      <SidebarRail />
    </>
  );
}

function Workspace({
  label,
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  defaultOpen = true,
}: {
  label: string;
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
  defaultOpen?: boolean;
}) {
  return (
    <Frame label={label} side={side} defaultOpen={defaultOpen}>
      <Sidebar side={side} variant={variant} collapsible={collapsible} className="md:absolute md:h-full">
        <Navigation label={label} />
      </Sidebar>
    </Frame>
  );
}

export function Example() {
  return <Workspace label="Workspace navigation" />;
}
```

## Icon navigation

The fixed icon rail starts collapsed on desktop. Keep icon and text in each button; the text still names the link, and the string tooltip appears on focus or hover. Rail and container widths share one size owner. Supported plain labels wait for actual expansion completion before fading in; unsupported label layouts expand immediately. Search remains a real filter when expanded; the compact rail hides its header text, search and footer text.

<ComponentExample name="icon-navigation" />

```tsx
"use client";

import { Home, Inbox, Settings } from "lucide-react";
import { type CSSProperties, type ReactNode, useId, useState } from "react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInput, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger } from "@/components/cadence/sidebar";

function Frame({
  label,
  children,
  content,
  side = "left",
  defaultOpen = true,
  open,
  onOpenChange,
}: {
  label: string;
  children: ReactNode;
  content?: ReactNode;
  side?: "left" | "right";
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
      style={{ "--sidebar-width": "12rem" } as CSSProperties}
      className={`relative isolate h-96 min-h-96 overflow-hidden rounded-lg border [transform:translateZ(0)] ${side === "right" ? "flex-row-reverse" : ""}`}
    >
      {children}
      <SidebarInset render={<section />} aria-label={`${label} content`} className="min-w-0 gap-3 p-3">
        <SidebarTrigger aria-label={`Toggle ${label}`} />
        <p className="text-sm font-medium">Project overview</p>
        {content ?? <p className="text-xs text-muted-foreground">Your workspace content.</p>}
      </SidebarInset>
    </SidebarProvider>
  );
}

function Navigation({ label }: { label: string }) {
  const target = useId();
  const [query, setQuery] = useState("");
  return (
    <>
      <SidebarHeader>
        <strong className="truncate text-sm group-data-[collapsible=icon]:hidden">Acme workspace</strong>
        <SidebarInput
          className="group-data-[collapsible=icon]:hidden" aria-label={`Search ${label}`}
          placeholder="Search workspace"
          value={query}
          onValueChange={setQuery}
        />
      </SidebarHeader>
      <SidebarContent>
        <nav aria-label={label}>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {(
                  [
                    [Home, "Overview"],
                    [Inbox, "Inbox"],
                    [Settings, "Settings"],
                  ] as const
                )
                  .filter(([, text]) => text.toLowerCase().includes(query.toLowerCase()))
                  .map(([Icon, text]) => (
                    <SidebarMenuItem key={text}>
                      <SidebarMenuButton
                        render={<a href={`#${target}`} aria-current={text === "Overview" ? "page" : undefined} />}
                        isActive={text === "Overview"}
                        tooltip={text}
                      >
                        <Icon aria-hidden="true" />
                        <span>{text}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
            <p id={target} className="sr-only">
              Workspace navigation destination
            </p>
          </SidebarGroup>
        </nav>
      </SidebarContent>
      <SidebarFooter>
        <span className="truncate text-xs group-data-[collapsible=icon]:hidden">Acme team</span>
      </SidebarFooter>
      <SidebarRail />
    </>
  );
}

function Workspace({
  label,
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  defaultOpen = true,
}: {
  label: string;
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
  defaultOpen?: boolean;
}) {
  return (
    <Frame label={label} side={side} defaultOpen={defaultOpen}>
      <Sidebar side={side} variant={variant} collapsible={collapsible} className="md:absolute md:h-full">
        <Navigation label={label} />
      </Sidebar>
    </Frame>
  );
}

export function Example() {
  return <Workspace label="Icon navigation" collapsible="icon" defaultOpen={false} />;
}
```

## Controlled navigation

The caller owns desktop open and observes every requested change. Only this behavior example adds external controls. useSidebar exposes state, open, setOpen, openMobile, setOpenMobile, isMobile and toggleSidebar. Desktop open does not control the mobile Sheet; opening mobile while on desktop only records that separate state. The setter writes sidebar_state for seven days at path / but never reads it. Read a cookie on the server and supply defaultOpen to restore an uncontrolled shell.

<ComponentExample name="controlled-navigation" />

```tsx
"use client";

import { Home, Inbox, Settings } from "lucide-react";
import { type CSSProperties, type ReactNode, useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInput, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger, useSidebar } from "@/components/cadence/sidebar";

function Frame({
  label,
  children,
  content,
  side = "left",
  defaultOpen = true,
  open,
  onOpenChange,
}: {
  label: string;
  children: ReactNode;
  content?: ReactNode;
  side?: "left" | "right";
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
      style={{ "--sidebar-width": "12rem" } as CSSProperties}
      className={`relative isolate h-96 min-h-96 overflow-hidden rounded-lg border [transform:translateZ(0)] ${side === "right" ? "flex-row-reverse" : ""}`}
    >
      {children}
      <SidebarInset render={<section />} aria-label={`${label} content`} className="min-w-0 gap-3 p-3">
        <SidebarTrigger aria-label={`Toggle ${label}`} />
        <p className="text-sm font-medium">Project overview</p>
        {content ?? <p className="text-xs text-muted-foreground">Your workspace content.</p>}
      </SidebarInset>
    </SidebarProvider>
  );
}

function Navigation({ label }: { label: string }) {
  const target = useId();
  const [query, setQuery] = useState("");
  return (
    <>
      <SidebarHeader>
        <strong className="truncate text-sm group-data-[collapsible=icon]:hidden">Acme workspace</strong>
        <SidebarInput
          className="group-data-[collapsible=icon]:hidden" aria-label={`Search ${label}`}
          placeholder="Search workspace"
          value={query}
          onValueChange={setQuery}
        />
      </SidebarHeader>
      <SidebarContent>
        <nav aria-label={label}>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {(
                  [
                    [Home, "Overview"],
                    [Inbox, "Inbox"],
                    [Settings, "Settings"],
                  ] as const
                )
                  .filter(([, text]) => text.toLowerCase().includes(query.toLowerCase()))
                  .map(([Icon, text]) => (
                    <SidebarMenuItem key={text}>
                      <SidebarMenuButton
                        render={<a href={`#${target}`} aria-current={text === "Overview" ? "page" : undefined} />}
                        isActive={text === "Overview"}
                        tooltip={text}
                      >
                        <Icon aria-hidden="true" />
                        <span>{text}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
            <p id={target} className="sr-only">
              Workspace navigation destination
            </p>
          </SidebarGroup>
        </nav>
      </SidebarContent>
      <SidebarFooter>
        <span className="truncate text-xs group-data-[collapsible=icon]:hidden">Acme team</span>
      </SidebarFooter>
      <SidebarRail />
    </>
  );
}

function Workspace({
  label,
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  defaultOpen = true,
}: {
  label: string;
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
  defaultOpen?: boolean;
}) {
  return (
    <Frame label={label} side={side} defaultOpen={defaultOpen}>
      <Sidebar side={side} variant={variant} collapsible={collapsible} className="md:absolute md:h-full">
        <Navigation label={label} />
      </Sidebar>
    </Frame>
  );
}

function HookControls() {
  const { state, openMobile, isMobile, setOpen, setOpenMobile, toggleSidebar } = useSidebar();
  return (
    <div className="flex flex-col items-start gap-2 text-xs">
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Expand desktop
      </Button>
      <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
        Collapse desktop
      </Button>
      <Button size="sm" variant="outline" onClick={toggleSidebar}>
        Toggle navigation
      </Button>
      <Button size="sm" variant="outline" onClick={() => setOpenMobile(true)}>
        Open mobile
      </Button>
      <Button size="sm" variant="outline" onClick={() => setOpenMobile(false)}>
        Close mobile
      </Button>
      <output data-sidebar-state>
        {state} / {openMobile ? "mobile open" : "mobile closed"} / {isMobile ? "mobile" : "desktop"}
      </output>
    </div>
  );
}

function ControlledNavigation() {
  const [open, setOpen] = useState(true);
  const [changes, setChanges] = useState(0);
  return (
    <Frame
      label="Controlled navigation"
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        setChanges((n) => n + 1);
      }}
      content={
        <>
          <HookControls />
          <output aria-label="Desktop changes">Desktop changes: {changes}</output>
        </>
      }
    >
      <Sidebar className="md:absolute md:h-full">
        <Navigation label="Controlled navigation" />
      </Sidebar>
    </Frame>
  );
}

export function Example() {
  return <ControlledNavigation />;
}
```

## Variants

These fixed shells compare sidebar, floating and inset separately. Floating adds a padded rounded panel; inset styles its sibling SidebarInset. In this embedded documentation each inset uses `render={<section />}` with a unique accessible name because the page already has a main; use its default main landmark at your application root. The containing transform and absolute panel keep each desktop specimen inside its own card. The local 12rem desktop width is an embedding choice, not a library default.

<ComponentExample name="variants" />

```tsx
"use client";

import { Home, Inbox, Settings } from "lucide-react";
import { type CSSProperties, type ReactNode, useId, useState } from "react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInput, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger } from "@/components/cadence/sidebar";

function Frame({
  label,
  children,
  content,
  side = "left",
  defaultOpen = true,
  open,
  onOpenChange,
}: {
  label: string;
  children: ReactNode;
  content?: ReactNode;
  side?: "left" | "right";
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
      style={{ "--sidebar-width": "12rem" } as CSSProperties}
      className={`relative isolate h-96 min-h-96 overflow-hidden rounded-lg border [transform:translateZ(0)] ${side === "right" ? "flex-row-reverse" : ""}`}
    >
      {children}
      <SidebarInset render={<section />} aria-label={`${label} content`} className="min-w-0 gap-3 p-3">
        <SidebarTrigger aria-label={`Toggle ${label}`} />
        <p className="text-sm font-medium">Project overview</p>
        {content ?? <p className="text-xs text-muted-foreground">Your workspace content.</p>}
      </SidebarInset>
    </SidebarProvider>
  );
}

function Navigation({ label }: { label: string }) {
  const target = useId();
  const [query, setQuery] = useState("");
  return (
    <>
      <SidebarHeader>
        <strong className="truncate text-sm group-data-[collapsible=icon]:hidden">Acme workspace</strong>
        <SidebarInput
          className="group-data-[collapsible=icon]:hidden" aria-label={`Search ${label}`}
          placeholder="Search workspace"
          value={query}
          onValueChange={setQuery}
        />
      </SidebarHeader>
      <SidebarContent>
        <nav aria-label={label}>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {(
                  [
                    [Home, "Overview"],
                    [Inbox, "Inbox"],
                    [Settings, "Settings"],
                  ] as const
                )
                  .filter(([, text]) => text.toLowerCase().includes(query.toLowerCase()))
                  .map(([Icon, text]) => (
                    <SidebarMenuItem key={text}>
                      <SidebarMenuButton
                        render={<a href={`#${target}`} aria-current={text === "Overview" ? "page" : undefined} />}
                        isActive={text === "Overview"}
                        tooltip={text}
                      >
                        <Icon aria-hidden="true" />
                        <span>{text}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
            <p id={target} className="sr-only">
              Workspace navigation destination
            </p>
          </SidebarGroup>
        </nav>
      </SidebarContent>
      <SidebarFooter>
        <span className="truncate text-xs group-data-[collapsible=icon]:hidden">Acme team</span>
      </SidebarFooter>
      <SidebarRail />
    </>
  );
}

function Workspace({
  label,
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  defaultOpen = true,
}: {
  label: string;
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
  defaultOpen?: boolean;
}) {
  return (
    <Frame label={label} side={side} defaultOpen={defaultOpen}>
      <Sidebar side={side} variant={variant} collapsible={collapsible} className="md:absolute md:h-full">
        <Navigation label={label} />
      </Sidebar>
    </Frame>
  );
}

export function Example() {
  return <div className="grid gap-5">{(["sidebar", "floating", "inset"] as const).map(variant => <Workspace key={variant} label={`${variant} navigation`} variant={variant} />)}</div>;
}
```

## Right side

side="right" chooses the physical desktop and mobile edge. Reverse the provider row so its gap and application content match that edge. This fixed example does not change the document reading direction.

<ComponentExample name="right-side" />

```tsx
"use client";

import { Home, Inbox, Settings } from "lucide-react";
import { type CSSProperties, type ReactNode, useId, useState } from "react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInput, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger } from "@/components/cadence/sidebar";

function Frame({
  label,
  children,
  content,
  side = "left",
  defaultOpen = true,
  open,
  onOpenChange,
}: {
  label: string;
  children: ReactNode;
  content?: ReactNode;
  side?: "left" | "right";
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
      style={{ "--sidebar-width": "12rem" } as CSSProperties}
      className={`relative isolate h-96 min-h-96 overflow-hidden rounded-lg border [transform:translateZ(0)] ${side === "right" ? "flex-row-reverse" : ""}`}
    >
      {children}
      <SidebarInset render={<section />} aria-label={`${label} content`} className="min-w-0 gap-3 p-3">
        <SidebarTrigger aria-label={`Toggle ${label}`} />
        <p className="text-sm font-medium">Project overview</p>
        {content ?? <p className="text-xs text-muted-foreground">Your workspace content.</p>}
      </SidebarInset>
    </SidebarProvider>
  );
}

function Navigation({ label }: { label: string }) {
  const target = useId();
  const [query, setQuery] = useState("");
  return (
    <>
      <SidebarHeader>
        <strong className="truncate text-sm group-data-[collapsible=icon]:hidden">Acme workspace</strong>
        <SidebarInput
          className="group-data-[collapsible=icon]:hidden" aria-label={`Search ${label}`}
          placeholder="Search workspace"
          value={query}
          onValueChange={setQuery}
        />
      </SidebarHeader>
      <SidebarContent>
        <nav aria-label={label}>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {(
                  [
                    [Home, "Overview"],
                    [Inbox, "Inbox"],
                    [Settings, "Settings"],
                  ] as const
                )
                  .filter(([, text]) => text.toLowerCase().includes(query.toLowerCase()))
                  .map(([Icon, text]) => (
                    <SidebarMenuItem key={text}>
                      <SidebarMenuButton
                        render={<a href={`#${target}`} aria-current={text === "Overview" ? "page" : undefined} />}
                        isActive={text === "Overview"}
                        tooltip={text}
                      >
                        <Icon aria-hidden="true" />
                        <span>{text}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
            <p id={target} className="sr-only">
              Workspace navigation destination
            </p>
          </SidebarGroup>
        </nav>
      </SidebarContent>
      <SidebarFooter>
        <span className="truncate text-xs group-data-[collapsible=icon]:hidden">Acme team</span>
      </SidebarFooter>
      <SidebarRail />
    </>
  );
}

function Workspace({
  label,
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  defaultOpen = true,
}: {
  label: string;
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
  defaultOpen?: boolean;
}) {
  return (
    <Frame label={label} side={side} defaultOpen={defaultOpen}>
      <Sidebar side={side} variant={variant} collapsible={collapsible} className="md:absolute md:h-full">
        <Navigation label={label} />
      </Sidebar>
    </Frame>
  );
}

export function Example() {
  return <Workspace label="Right navigation" side="right" />;
}
```

## Collapse modes

The three shells start with desktop defaultOpen=false. Offcanvas removes its gap and makes hidden navigation inert; icon retains a compact rail; none stays static and visible on every viewport. A none sidebar still receives provider state, but its trigger cannot visually hide it. On small screens offcanvas and icon both become a Sheet; none remains in the document.

<ComponentExample name="collapse-modes" />

```tsx
"use client";

import { Home, Inbox, Settings } from "lucide-react";
import { type CSSProperties, type ReactNode, useId, useState } from "react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInput, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger } from "@/components/cadence/sidebar";

function Frame({
  label,
  children,
  content,
  side = "left",
  defaultOpen = true,
  open,
  onOpenChange,
}: {
  label: string;
  children: ReactNode;
  content?: ReactNode;
  side?: "left" | "right";
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
      style={{ "--sidebar-width": "12rem" } as CSSProperties}
      className={`relative isolate h-96 min-h-96 overflow-hidden rounded-lg border [transform:translateZ(0)] ${side === "right" ? "flex-row-reverse" : ""}`}
    >
      {children}
      <SidebarInset render={<section />} aria-label={`${label} content`} className="min-w-0 gap-3 p-3">
        <SidebarTrigger aria-label={`Toggle ${label}`} />
        <p className="text-sm font-medium">Project overview</p>
        {content ?? <p className="text-xs text-muted-foreground">Your workspace content.</p>}
      </SidebarInset>
    </SidebarProvider>
  );
}

function Navigation({ label }: { label: string }) {
  const target = useId();
  const [query, setQuery] = useState("");
  return (
    <>
      <SidebarHeader>
        <strong className="truncate text-sm group-data-[collapsible=icon]:hidden">Acme workspace</strong>
        <SidebarInput
          className="group-data-[collapsible=icon]:hidden" aria-label={`Search ${label}`}
          placeholder="Search workspace"
          value={query}
          onValueChange={setQuery}
        />
      </SidebarHeader>
      <SidebarContent>
        <nav aria-label={label}>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {(
                  [
                    [Home, "Overview"],
                    [Inbox, "Inbox"],
                    [Settings, "Settings"],
                  ] as const
                )
                  .filter(([, text]) => text.toLowerCase().includes(query.toLowerCase()))
                  .map(([Icon, text]) => (
                    <SidebarMenuItem key={text}>
                      <SidebarMenuButton
                        render={<a href={`#${target}`} aria-current={text === "Overview" ? "page" : undefined} />}
                        isActive={text === "Overview"}
                        tooltip={text}
                      >
                        <Icon aria-hidden="true" />
                        <span>{text}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
            <p id={target} className="sr-only">
              Workspace navigation destination
            </p>
          </SidebarGroup>
        </nav>
      </SidebarContent>
      <SidebarFooter>
        <span className="truncate text-xs group-data-[collapsible=icon]:hidden">Acme team</span>
      </SidebarFooter>
      <SidebarRail />
    </>
  );
}

function Workspace({
  label,
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  defaultOpen = true,
}: {
  label: string;
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
  defaultOpen?: boolean;
}) {
  return (
    <Frame label={label} side={side} defaultOpen={defaultOpen}>
      <Sidebar side={side} variant={variant} collapsible={collapsible} className="md:absolute md:h-full">
        <Navigation label={label} />
      </Sidebar>
    </Frame>
  );
}

export function Example() {
  return <div className="grid gap-5">{(["offcanvas", "icon", "none"] as const).map(collapsible => <Workspace key={collapsible} label={`${collapsible} collapse navigation`} collapsible={collapsible} defaultOpen={false} />)}</div>;
}
```

## Mobile behavior

Below 768px the real trigger opens a right-edge Sheet. The explicit close control calls setOpenMobile(false); Escape and backdrop dismissal also close it. Desktop and mobile trees can remount, and closing the default Sheet unmounts its children. Keep a draft above Sidebar, as here, to survive close/reopen and viewport changes. Search inside Navigation is intentionally local and resets when its tree remounts.

<ComponentExample name="mobile-behavior" />

```tsx
"use client";

import { Home, Inbox, Settings, X } from "lucide-react";
import { type CSSProperties, type ReactNode, useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInput, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger, useSidebar } from "@/components/cadence/sidebar";

function Frame({
  label,
  children,
  content,
  side = "left",
  defaultOpen = true,
  open,
  onOpenChange,
}: {
  label: string;
  children: ReactNode;
  content?: ReactNode;
  side?: "left" | "right";
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
      style={{ "--sidebar-width": "12rem" } as CSSProperties}
      className={`relative isolate h-96 min-h-96 overflow-hidden rounded-lg border [transform:translateZ(0)] ${side === "right" ? "flex-row-reverse" : ""}`}
    >
      {children}
      <SidebarInset render={<section />} aria-label={`${label} content`} className="min-w-0 gap-3 p-3">
        <SidebarTrigger aria-label={`Toggle ${label}`} />
        <p className="text-sm font-medium">Project overview</p>
        {content ?? <p className="text-xs text-muted-foreground">Your workspace content.</p>}
      </SidebarInset>
    </SidebarProvider>
  );
}

function Navigation({ label }: { label: string }) {
  const target = useId();
  const [query, setQuery] = useState("");
  return (
    <>
      <SidebarHeader>
        <strong className="truncate text-sm group-data-[collapsible=icon]:hidden">Acme workspace</strong>
        <SidebarInput
          className="group-data-[collapsible=icon]:hidden" aria-label={`Search ${label}`}
          placeholder="Search workspace"
          value={query}
          onValueChange={setQuery}
        />
      </SidebarHeader>
      <SidebarContent>
        <nav aria-label={label}>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {(
                  [
                    [Home, "Overview"],
                    [Inbox, "Inbox"],
                    [Settings, "Settings"],
                  ] as const
                )
                  .filter(([, text]) => text.toLowerCase().includes(query.toLowerCase()))
                  .map(([Icon, text]) => (
                    <SidebarMenuItem key={text}>
                      <SidebarMenuButton
                        render={<a href={`#${target}`} aria-current={text === "Overview" ? "page" : undefined} />}
                        isActive={text === "Overview"}
                        tooltip={text}
                      >
                        <Icon aria-hidden="true" />
                        <span>{text}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
            <p id={target} className="sr-only">
              Workspace navigation destination
            </p>
          </SidebarGroup>
        </nav>
      </SidebarContent>
      <SidebarFooter>
        <span className="truncate text-xs group-data-[collapsible=icon]:hidden">Acme team</span>
      </SidebarFooter>
      <SidebarRail />
    </>
  );
}

function Workspace({
  label,
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  defaultOpen = true,
}: {
  label: string;
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
  defaultOpen?: boolean;
}) {
  return (
    <Frame label={label} side={side} defaultOpen={defaultOpen}>
      <Sidebar side={side} variant={variant} collapsible={collapsible} className="md:absolute md:h-full">
        <Navigation label={label} />
      </Sidebar>
    </Frame>
  );
}

function MobileClose() {
  const { isMobile, setOpenMobile } = useSidebar();
  return isMobile ? (
    <Button variant="ghost" size="sm" onClick={() => setOpenMobile(false)}>
      <X aria-hidden="true" />
      Close navigation
    </Button>
  ) : null;
}

function MobileBehavior() {
  const [draft, setDraft] = useState("");
  return (
    <Frame label="Mobile workspace" side="right" content={<p className="text-xs">Navigation becomes a Sheet below 768px.</p>}>
      <Sidebar side="right" className="md:absolute md:h-full">
        <SidebarHeader>
          <MobileClose />
          <SidebarInput
            aria-label="Persistent mobile draft"
            placeholder="Caller-owned draft"
            value={draft}
            onValueChange={setDraft}
          />
        </SidebarHeader>
        <SidebarContent>
          <Navigation label="Mobile workspace" />
        </SidebarContent>
      </Sidebar>
    </Frame>
  );
}

export function Example() {
  return <MobileBehavior />;
}
```

## Menu styles

Compare the default and outline menu-button variants and the sm/default/lg size axis without multiplying every combination. isActive controls styling; aria-pressed belongs to the caller for a command. Use aria-current on a real navigation link. Native disabled prevents command activation. These are ordinary controls and links, with normal Tab order rather than menu arrow navigation.

<ComponentExample name="menu-styles" />

```tsx
"use client";

import { Home, Inbox } from "lucide-react";
import { type CSSProperties, type ReactNode } from "react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/cadence/sidebar";

function Frame({
  label,
  children,
  content,
  side = "left",
  defaultOpen = true,
  open,
  onOpenChange,
}: {
  label: string;
  children: ReactNode;
  content?: ReactNode;
  side?: "left" | "right";
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
      style={{ "--sidebar-width": "12rem" } as CSSProperties}
      className={`relative isolate h-96 min-h-96 overflow-hidden rounded-lg border [transform:translateZ(0)] ${side === "right" ? "flex-row-reverse" : ""}`}
    >
      {children}
      <SidebarInset render={<section />} aria-label={`${label} content`} className="min-w-0 gap-3 p-3">
        <SidebarTrigger aria-label={`Toggle ${label}`} />
        <p className="text-sm font-medium">Project overview</p>
        {content ?? <p className="text-xs text-muted-foreground">Your workspace content.</p>}
      </SidebarInset>
    </SidebarProvider>
  );
}

function MenuStyles() {
  return (
    <Frame label="Menu styles">
      <Sidebar collapsible="none" className="h-full">
        <SidebarContent>
          <nav aria-label="Menu styles">
            <SidebarGroup>
              <SidebarGroupLabel>Commands</SidebarGroupLabel>
              <SidebarMenu>
                {(["sm", "default", "lg"] as const).map((size) => (
                  <SidebarMenuItem key={size}>
                    <SidebarMenuButton size={size}>
                      <Home aria-hidden="true" />
                      <span>{size} command</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                <SidebarMenuItem>
                  <SidebarMenuButton variant="outline">
                    <Inbox aria-hidden="true" />
                    <span>Outline command</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive aria-pressed="true">
                    Active command
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton disabled>Disabled command</SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </nav>
        </SidebarContent>
      </Sidebar>
    </Frame>
  );
}

export function Example() {
  return <MenuStyles />;
}
```

## Groups and actions

Header, footer, separator, group label and group content organize navigation. Add project is a real caller-owned action; each new stable name receives its own menu action. The badge is a non-interactive count. The fixed footer action is always visible, while showOnHover reveals row actions on hover or keyboard focus. Icon collapse hides group labels, badges and actions. A group label may render as a heading.

<ComponentExample name="groups-and-actions" />

```tsx
"use client";

import { Home, MoreHorizontal, Plus, Settings } from "lucide-react";
import { type CSSProperties, type ReactNode, useState } from "react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuAction, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarSeparator, SidebarTrigger } from "@/components/cadence/sidebar";

function Frame({
  label,
  children,
  content,
  side = "left",
  defaultOpen = true,
  open,
  onOpenChange,
}: {
  label: string;
  children: ReactNode;
  content?: ReactNode;
  side?: "left" | "right";
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
      style={{ "--sidebar-width": "12rem" } as CSSProperties}
      className={`relative isolate h-96 min-h-96 overflow-hidden rounded-lg border [transform:translateZ(0)] ${side === "right" ? "flex-row-reverse" : ""}`}
    >
      {children}
      <SidebarInset render={<section />} aria-label={`${label} content`} className="min-w-0 gap-3 p-3">
        <SidebarTrigger aria-label={`Toggle ${label}`} />
        <p className="text-sm font-medium">Project overview</p>
        {content ?? <p className="text-xs text-muted-foreground">Your workspace content.</p>}
      </SidebarInset>
    </SidebarProvider>
  );
}

function GroupsAndActions() {
  const [projects, setProjects] = useState(["Website"]);
  const [action, setAction] = useState("No project action");
  return (
    <Frame label="Project actions" content={<output>{action}</output>}>
      <Sidebar className="md:absolute md:h-full" collapsible="icon">
        <SidebarHeader>
          <span className="truncate text-sm font-medium">Acme projects</span>
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          <nav aria-label="Project actions">
            <SidebarGroup>
              <SidebarGroupLabel render={<h3 aria-label="Projects" />}>Projects</SidebarGroupLabel>
              <SidebarGroupAction
                aria-label="Add project"
                onClick={() => setProjects((rows) => [...rows, `Project ${rows.length + 1}`])}
              >
                <Plus aria-hidden="true" />
              </SidebarGroupAction>
              <SidebarGroupContent>
                <SidebarMenu>
                  {projects.map((name, i) => (
                    <SidebarMenuItem key={name}>
                      <SidebarMenuButton onClick={() => setAction(`Opened ${name}`)}>
                        <Home aria-hidden="true" />
                        <span>{name}</span>
                      </SidebarMenuButton>
                      {i === 0 ? (
                        <SidebarMenuBadge aria-label="3 updates">3</SidebarMenuBadge>
                      ) : (
                        <SidebarMenuAction
                          showOnHover
                          aria-label={`Options for ${name}`}
                          onClick={() => setAction(`Options for ${name}`)}
                        >
                          <MoreHorizontal aria-hidden="true" />
                        </SidebarMenuAction>
                      )}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </nav>
        </SidebarContent>
        <SidebarSeparator />
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setAction("Opened settings")}>
                <Settings aria-hidden="true" />
                <span>Settings</span>
              </SidebarMenuButton>
              <SidebarMenuAction aria-label="Settings options" onClick={() => setAction("Settings options")}>
                <MoreHorizontal aria-hidden="true" />
              </SidebarMenuAction>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </Frame>
  );
}

export function Example() {
  return <GroupsAndActions />;
}
```

## Sub-navigation

Sub lists remain semantic ul/li navigation. Compare md and sm sub-buttons; the active link supplies aria-current. The unavailable link has no href and leaves the Tab order. Icon collapse hides the sublist immediately. Compose Collapsible separately when disclosure behavior is needed; this list does not invent a disclosure or animate its height.

<ComponentExample name="sub-navigation" />

```tsx
"use client";

import { Home } from "lucide-react";
import { type CSSProperties, type ReactNode, useId } from "react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarProvider, SidebarRail, SidebarTrigger } from "@/components/cadence/sidebar";

function Frame({
  label,
  children,
  content,
  side = "left",
  defaultOpen = true,
  open,
  onOpenChange,
}: {
  label: string;
  children: ReactNode;
  content?: ReactNode;
  side?: "left" | "right";
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
      style={{ "--sidebar-width": "12rem" } as CSSProperties}
      className={`relative isolate h-96 min-h-96 overflow-hidden rounded-lg border [transform:translateZ(0)] ${side === "right" ? "flex-row-reverse" : ""}`}
    >
      {children}
      <SidebarInset render={<section />} aria-label={`${label} content`} className="min-w-0 gap-3 p-3">
        <SidebarTrigger aria-label={`Toggle ${label}`} />
        <p className="text-sm font-medium">Project overview</p>
        {content ?? <p className="text-xs text-muted-foreground">Your workspace content.</p>}
      </SidebarInset>
    </SidebarProvider>
  );
}

function SubNavigation() {
  const id = useId();
  return (
    <Frame label="Nested navigation">
      <Sidebar collapsible="icon" className="md:absolute md:h-full">
        <SidebarContent>
          <nav aria-label="Nested navigation">
            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <Home aria-hidden="true" />
                    <span>Projects</span>
                  </SidebarMenuButton>
                  <SidebarMenuSub>
                    {(["md", "sm"] as const).map((size) => (
                      <SidebarMenuSubItem key={size}>
                        <SidebarMenuSubButton
                          size={size}
                          href={`#${id}`}
                          isActive={size === "md"}
                          aria-current={size === "md" ? "page" : undefined}
                        >
                          {size} project
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton aria-disabled="true" tabIndex={-1}>
                        Unavailable project
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </nav>
          <span id={id} className="sr-only">
            Project destination
          </span>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
    </Frame>
  );
}

export function Example() {
  return <SubNavigation />;
}
```

## Loading navigation

The caller swaps two deterministic skeleton rows for a real navigation row. showIcon adds a skeleton glyph. The loading status supplies an accessible label; skeleton widths are stable between server and client. Pulse follows Skeleton's own inherited motion contract and stops in none.

<ComponentExample name="loading-navigation" />

```tsx
"use client";

import { type CSSProperties, type ReactNode, useState } from "react";
import { Button } from "@/components/cadence/button";
import { Sidebar, SidebarContent, SidebarGroup, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSkeleton, SidebarProvider, SidebarTrigger } from "@/components/cadence/sidebar";

function Frame({
  label,
  children,
  content,
  side = "left",
  defaultOpen = true,
  open,
  onOpenChange,
}: {
  label: string;
  children: ReactNode;
  content?: ReactNode;
  side?: "left" | "right";
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
      style={{ "--sidebar-width": "12rem" } as CSSProperties}
      className={`relative isolate h-96 min-h-96 overflow-hidden rounded-lg border [transform:translateZ(0)] ${side === "right" ? "flex-row-reverse" : ""}`}
    >
      {children}
      <SidebarInset render={<section />} aria-label={`${label} content`} className="min-w-0 gap-3 p-3">
        <SidebarTrigger aria-label={`Toggle ${label}`} />
        <p className="text-sm font-medium">Project overview</p>
        {content ?? <p className="text-xs text-muted-foreground">Your workspace content.</p>}
      </SidebarInset>
    </SidebarProvider>
  );
}

function LoadingNavigation() {
  const [ready, setReady] = useState(false);
  return (
    <Frame
      label="Loading navigation"
      content={
        <Button size="sm" variant="outline" onClick={() => setReady((value) => !value)}>
          {ready ? "Reload navigation" : "Show navigation"}
        </Button>
      }
    >
      <Sidebar className="md:absolute md:h-full">
        <SidebarContent>
          <SidebarGroup>
            {ready ? (
              <nav aria-label="Loaded projects">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton>Website</SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </nav>
            ) : (
              <div role="status" aria-label="Loading projects">
                <SidebarMenuSkeleton />
                <SidebarMenuSkeleton showIcon />
              </div>
            )}
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </Frame>
  );
}

export function Example() {
  return <LoadingNavigation />;
}
```

## Caller updates

Only this named behavior example adds and removes application data. Stable keys preserve surviving menu nodes. The input value lives above Sidebar and survives desktop toggles, header mode changes and mobile remounts. Sidebar does not fetch data, own permissions, validate the draft or animate row insertion.

<ComponentExample name="caller-updates" />

```tsx
"use client";

import { type CSSProperties, type ReactNode, useState } from "react";
import { Button } from "@/components/cadence/button";
import { Sidebar, SidebarContent, SidebarGroup, SidebarHeader, SidebarInput, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger } from "@/components/cadence/sidebar";

function Frame({
  label,
  children,
  content,
  side = "left",
  defaultOpen = true,
  open,
  onOpenChange,
}: {
  label: string;
  children: ReactNode;
  content?: ReactNode;
  side?: "left" | "right";
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
      style={{ "--sidebar-width": "12rem" } as CSSProperties}
      className={`relative isolate h-96 min-h-96 overflow-hidden rounded-lg border [transform:translateZ(0)] ${side === "right" ? "flex-row-reverse" : ""}`}
    >
      {children}
      <SidebarInset render={<section />} aria-label={`${label} content`} className="min-w-0 gap-3 p-3">
        <SidebarTrigger aria-label={`Toggle ${label}`} />
        <p className="text-sm font-medium">Project overview</p>
        {content ?? <p className="text-xs text-muted-foreground">Your workspace content.</p>}
      </SidebarInset>
    </SidebarProvider>
  );
}

function CallerUpdates() {
  const [projects, setProjects] = useState(["Website", "Mobile app"]);
  const [draft, setDraft] = useState("");
  return (
    <Frame
      label="Caller updates"
      content={
        <Button
          size="sm"
          variant="outline"
          onClick={() => setProjects((rows) => (rows.length === 2 ? [...rows, "Desktop app"] : rows.slice(0, 2)))}
        >
          {projects.length === 2 ? "Add project" : "Remove project"}
        </Button>
      }
    >
      <Sidebar className="md:absolute md:h-full">
        <SidebarHeader>
          <SidebarInput
            aria-label="Project draft"
            value={draft}
            onValueChange={setDraft}
            placeholder="Caller-owned draft"
          />
        </SidebarHeader>
        <SidebarContent>
          <nav aria-label="Caller updates">
            <SidebarGroup>
              <SidebarMenu>
                {projects.map((name) => (
                  <SidebarMenuItem key={name}>
                    <SidebarMenuButton>{name}</SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </nav>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
    </Frame>
  );
}

export function Example() {
  return <CallerUpdates />;
}
```

## Custom parts

Base UI render accepts a native element; the anchor ref, native event and hash destination stay usable. The external focus action is desktop-only, where the link stays mounted. dir="rtl" follows the panel through its mobile portal. A tooltip props object configures the collapsed tooltip. This example deliberately supplies style.transform="none": caller ownership suppresses desktop offcanvas travel, so collapsing makes content inert without moving that caller-positioned surface. Manage its position yourself or omit transform for standard offcanvas behavior.

<ComponentExample name="custom-parts" />

```tsx
"use client";

import { Home } from "lucide-react";
import { type CSSProperties, type ReactNode, useId, useRef, useState } from "react";
import { Button } from "@/components/cadence/button";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/cadence/sidebar";

function Frame({
  label,
  children,
  content,
  side = "left",
  defaultOpen = true,
  open,
  onOpenChange,
}: {
  label: string;
  children: ReactNode;
  content?: ReactNode;
  side?: "left" | "right";
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
      style={{ "--sidebar-width": "12rem" } as CSSProperties}
      className={`relative isolate h-96 min-h-96 overflow-hidden rounded-lg border [transform:translateZ(0)] ${side === "right" ? "flex-row-reverse" : ""}`}
    >
      {children}
      <SidebarInset render={<section />} aria-label={`${label} content`} className="min-w-0 gap-3 p-3">
        <SidebarTrigger aria-label={`Toggle ${label}`} />
        <p className="text-sm font-medium">Project overview</p>
        {content ?? <p className="text-xs text-muted-foreground">Your workspace content.</p>}
      </SidebarInset>
    </SidebarProvider>
  );
}

function CustomParts() {
  const link = useRef<HTMLAnchorElement>(null);
  const id = useId();
  const [clicks, setClicks] = useState(0);
  return (
    <Frame
      label="Custom parts"
      side="right"
      content={
        <>
          <Button className="hidden md:inline-flex" size="sm" variant="outline" onClick={() => link.current?.focus()}>
            Focus project link
          </Button>
          <output>Native clicks: {clicks}</output>
        </>
      }
    >
      <Sidebar side="right" dir="rtl" style={{ transform: "none" }} className="md:absolute md:h-full">
        <SidebarContent>
          <nav aria-label="Custom parts">
            <SidebarGroup>
              <SidebarGroupLabel render={<h3 aria-label="Projects" />}>المشاريع</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<a ref={link} href={`#${id}`} lang="ar" />}
                    onClick={() => setClicks((n) => n + 1)}
                    tooltip={{ children: "Website", side: "left" }}
                  >
                    <Home aria-hidden="true" />
                    <span>الموقع</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </nav>
          <span id={id} className="sr-only">
            Custom project destination
          </span>
        </SidebarContent>
      </Sidebar>
    </Frame>
  );
}

export function Example() {
  return <CustomParts />;
}
```

## Without motion

This explicit local provider is fixed to none from the first render. Desktop positions and gaps update immediately; mobile Sheet, composed buttons and tooltips also inherit none. Other examples inherit the site header and system preference. This override does not configure neighboring examples.

<ComponentExample name="without-motion" />

```tsx
"use client";

import { Home, Inbox, Settings } from "lucide-react";
import { type CSSProperties, type ReactNode, useId, useState } from "react";
import { CadenceProvider } from "@/components/cadence/lib/provider";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInput, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger } from "@/components/cadence/sidebar";

function Frame({
  label,
  children,
  content,
  side = "left",
  defaultOpen = true,
  open,
  onOpenChange,
}: {
  label: string;
  children: ReactNode;
  content?: ReactNode;
  side?: "left" | "right";
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
      style={{ "--sidebar-width": "12rem" } as CSSProperties}
      className={`relative isolate h-96 min-h-96 overflow-hidden rounded-lg border [transform:translateZ(0)] ${side === "right" ? "flex-row-reverse" : ""}`}
    >
      {children}
      <SidebarInset render={<section />} aria-label={`${label} content`} className="min-w-0 gap-3 p-3">
        <SidebarTrigger aria-label={`Toggle ${label}`} />
        <p className="text-sm font-medium">Project overview</p>
        {content ?? <p className="text-xs text-muted-foreground">Your workspace content.</p>}
      </SidebarInset>
    </SidebarProvider>
  );
}

function Navigation({ label }: { label: string }) {
  const target = useId();
  const [query, setQuery] = useState("");
  return (
    <>
      <SidebarHeader>
        <strong className="truncate text-sm group-data-[collapsible=icon]:hidden">Acme workspace</strong>
        <SidebarInput
          className="group-data-[collapsible=icon]:hidden" aria-label={`Search ${label}`}
          placeholder="Search workspace"
          value={query}
          onValueChange={setQuery}
        />
      </SidebarHeader>
      <SidebarContent>
        <nav aria-label={label}>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {(
                  [
                    [Home, "Overview"],
                    [Inbox, "Inbox"],
                    [Settings, "Settings"],
                  ] as const
                )
                  .filter(([, text]) => text.toLowerCase().includes(query.toLowerCase()))
                  .map(([Icon, text]) => (
                    <SidebarMenuItem key={text}>
                      <SidebarMenuButton
                        render={<a href={`#${target}`} aria-current={text === "Overview" ? "page" : undefined} />}
                        isActive={text === "Overview"}
                        tooltip={text}
                      >
                        <Icon aria-hidden="true" />
                        <span>{text}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
            <p id={target} className="sr-only">
              Workspace navigation destination
            </p>
          </SidebarGroup>
        </nav>
      </SidebarContent>
      <SidebarFooter>
        <span className="truncate text-xs group-data-[collapsible=icon]:hidden">Acme team</span>
      </SidebarFooter>
      <SidebarRail />
    </>
  );
}

function Workspace({
  label,
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  defaultOpen = true,
}: {
  label: string;
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
  defaultOpen?: boolean;
}) {
  return (
    <Frame label={label} side={side} defaultOpen={defaultOpen}>
      <Sidebar side={side} variant={variant} collapsible={collapsible} className="md:absolute md:h-full">
        <Navigation label={label} />
      </Sidebar>
    </Frame>
  );
}

export function Example() {
  return <CadenceProvider mode="none"><Workspace label="Instant navigation" /></CadenceProvider>;
}
```

## When to use

- Persistent workspace navigation in dashboards.
- Application shells with a compact icon rail.
- Navigation that becomes a modal panel on narrow screens.

## When not to use

Use Navigation Menu for short top-level menus and Sheet for a task panel. This component does not
provide routing, permissions, or application state.

## API

### `SidebarProvider`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| defaultOpen | boolean | true | Initial desktop state. |
| open / onOpenChange | boolean / callback | — | Controlled desktop state. |
| style | CSSProperties | — | Overrides `--sidebar-width` (16rem) and `--sidebar-width-icon` (3rem). |
| native div props / ref | native | — | Forwarded to wrapper. |

### `Sidebar`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| side | left / right | left | Physical panel edge. |
| variant | sidebar / floating / inset | sidebar | Surface treatment. |
| collapsible | offcanvas / icon / none | offcanvas | Hide, compact, or remain visible. |
| dir | string | — | Native panel direction in desktop, static and mobile layouts. |
| className / style / ref | native | — | Desktop container; static sidebar or mobile popup respectively. |

`SidebarTrigger` accepts Button props and calls caller `onClick` before toggling. `SidebarRail`
accepts native button props and is excluded from Tab order; the trigger is the keyboard control.
`SidebarInset` defaults to a main landmark and accepts native main props/ref. Cadence adds the Base UI `render` prop (an element or render function) so embedded shells can use a uniquely named section, as above. This preserves the sidebar-inset slot and peer-dependent styling without nesting main landmarks or overriding a main element's role.
`SidebarInput` and `SidebarSeparator` accept their corresponding component props.

`SidebarHeader`, `SidebarFooter`, `SidebarContent`, `SidebarGroup`, `SidebarGroupContent`,
`SidebarMenuBadge`, and `SidebarMenuSkeleton` accept div props. Skeleton supports `showIcon=false`;
its deterministic text width avoids hydration mismatch. `SidebarMenu`/`SidebarMenuSub` render ul;
`SidebarMenuItem`/`SidebarMenuSubItem` render li.

`SidebarGroupLabel`, `SidebarGroupAction`, `SidebarMenuAction`, `SidebarMenuButton`, and
`SidebarMenuSubButton` accept Base UI `render` (element or state callback), native props and refs.
MenuButton supports `isActive=false`, `variant="default"|"outline"`, `size="default"|"sm"|"lg"`,
and `tooltip` (string or TooltipContent props). MenuAction supports `showOnHover=false`.
SubButton supports `size="md"|"sm"` and `isActive=false`. Classes merge caller last; native events
and useRender event merging remain available. `useSidebar` requires a provider.

## Motion contract

Authored intensity is **medium**: The reserved gap and panel position share a size-linked owner while destination-width labels stay readable.

| Phase | Properties | Token | Interruptible |
| --- | --- | --- | --- |
| Desktop offcanvas position | transform projected from actual occupied width | `layout.move/size-linked` | Yes, one shared size scalar. |
| Desktop offcanvas gap and icon gap/container | measured, clamped widths | `geometry.resize/measured` | Yes, one scalar maps both icon endpoints. |
| Safe icon label reveal | opacity after actual size completion | `data.transition/one-shot` | Yes, cancelled on reversal, input or invalidation. |

Full drives the actual gap and panel position from one clamped size spring. Initial state is native;
there is no mounting reveal. Reduced, none and zero clock reach the current destinations immediately.
Icon gap/container widths use the same scalar, including floating/inset endpoint differences. Plain
GroupLabel text and a MenuButton with an icon and a final plain text span use destination-width label
layout. The label stays hidden until the size owner actually completes, then may fade in. Collapse
establishes compact visibility immediately and never waits for paint. Rich or interactive label
layouts and known composed submenus use immediate geometry. Labels keep their accessible names
and controls are never copied. Native CSS supplies the resting widths and
positions; temporary effects are released on completion or cancellation. Caller `style.transform`
owns panel placement and suppresses this coupled animation. Unsupported or unavailable geometry
uses immediate native layout. Focused editing in the Sidebar/Inset, native pointer capture, passive
width/viewport changes and live mode downgrades settle both dependent properties. The same desktop
panel and input nodes survive toggles.

Mobile delegates `popup.anchored` / `exit.fade` to Sheet. Button press, tooltip popup and Skeleton pulse
are owned by those dependencies, not extra Sidebar recipes. Their effective mode follows the provider.

## Accessibility

Wrap navigation links in a named nav landmark. `isActive` styles the item; add `aria-current="page"`
to the active link yourself. Offcanvas desktop contents are inert while closed. The mobile Sheet
has a hidden title and description, traps focus, dismisses with Escape/outside click and restores
focus. Place a visible close control inside long mobile navigation when needed. Each example here has a separate provider and unique targets. The window shortcut broadcasts to every mounted provider, so use the individual triggers when comparing several shells on one page.

## Keyboard interactions

| Keys | Action |
| --- | --- |
| Ctrl+B / Cmd+B | Toggle desktop state or mobile sheet. Also applies inside inputs, matching upstream. Every mounted provider listens on window; multiple independent shells all respond. |
| Tab / Shift+Tab | Normal links and controls; no menu-style arrow navigation. |
| Enter / Space | Activate the trigger. |
| Escape | Dismiss the mobile sheet. |

## Responsive behavior

Below 768px, collapsible navigation uses an 18rem Sheet. `collapsible="none"` remains static on all
widths. Left/right and all three variants remain supported. Desktop toggles retain child state;
switching between desktop and mobile uses upstream's separate trees and can remount children.
Default mobile closing unmounts content. Store drafts outside Sidebar if they must survive that.

## Performance

Desktop offcanvas uses one measured size scalar for its gap and panel projection. Reads occur at
committed changes and invalidation, never on animation frames; no interactive content is cloned.
Icon labels use explicit part registrations and bounded destination reads. Their known paint and
viewport regions join the shared 50-visual preflight before measurement. There is no persistent
will-change or animation timer. Child input
values survive desktop state and motion-mode updates. Render only the navigation items the application needs.

## Notes for AI

Keep the provider, navigation landmark and main content together. Use `render`, never `asChild`.
Do not assume the cookie is read or desktop `open` controls the mobile sheet. Use an icon plus a plain final span for MenuButton labels to enable the safe expansion envelope. Rich labels retain immediate native expansion. Other v2 capabilities remain pending.

---

Full index: https://cadence.dev/llms.txt
