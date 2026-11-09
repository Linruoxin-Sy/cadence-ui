# Code block

> Install commands, source snippets, and tool output.

- Registry item: https://cadence.dev/r/code-block.json
- Install: `npx shadcn@latest add @cadence/code-block`
- Type: registry:ui
- Since: 0.5.0
- Motion recipes: data.transition, layout.shared, state.morph, geometry.resize

## Installation

**Command**

```install
npx shadcn@latest add @cadence/code-block
```

The block installs `button` for the copy and fold controls, and `code-highlight` — the Shiki adapter — for syntax
colouring. That second item is only downloaded when a block actually asks for a `language`.

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge motion @base-ui/react class-variance-authority shiki lucide-react
```

2. Copy the following registry dependencies in the listed dependency order. Each JSON link exposes every file's full `content` and `target`; copy all files, including multi-file helpers.

- [@cadence/cadence-motion](https://cadence.dev/r/cadence-motion.json) — direct registry dependency.
- [@cadence/cadence-utils](https://cadence.dev/r/cadence-utils.json) — direct registry dependency.
- [@cadence/cadence-theme](https://cadence.dev/r/cadence-theme.json) — transitive registry dependency.
- [@cadence/cadence-provider](https://cadence.dev/r/cadence-provider.json) — direct registry dependency.
- [@cadence/button](https://cadence.dev/r/button.json) — direct registry dependency.
- [@cadence/code-highlight](https://cadence.dev/r/code-highlight.json) — direct registry dependency.
- [@cadence/cadence-geometry](https://cadence.dev/r/cadence-geometry.json) — direct registry dependency.

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
| button | `@components/cadence/button/index.tsx` | [JSON files[].content](https://cadence.dev/r/button.json) |
| code-highlight | `@components/cadence/code-highlight/highlight.tsx` | [JSON files[].content](https://cadence.dev/r/code-highlight.json) |
| code-highlight | `@components/cadence/code-highlight/use-highlighted-code.tsx` | [JSON files[].content](https://cadence.dev/r/code-highlight.json) |
| cadence-geometry | `@components/cadence/lib/measured-geometry.ts` | [JSON files[].content](https://cadence.dev/r/cadence-geometry.json) |
| cadence-geometry | `@components/cadence/lib/size-linked-geometry.ts` | [JSON files[].content](https://cadence.dev/r/cadence-geometry.json) |
| cadence-geometry | `@components/cadence/lib/sidebar-geometry.ts` | [JSON files[].content](https://cadence.dev/r/cadence-geometry.json) |
| cadence-geometry | `@components/cadence/lib/sidebar-labels.ts` | [JSON files[].content](https://cadence.dev/r/cadence-geometry.json) |
| code-block | `@components/cadence/code-block/index.tsx` | [JSON files[].content](https://cadence.dev/r/code-block.json) |

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: button](https://cadence.dev/r/button.json)

[Source files: code-highlight](https://cadence.dev/r/code-highlight.json)

[Source files: cadence-geometry](https://cadence.dev/r/cadence-geometry.json)

[Source files: code-block](https://cadence.dev/r/code-block.json)

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

Copy all twelve target files, including Button, both Code Highlight files and
every shared `lib/` file. Keep the mirrored `cadence/` tree, relative imports
and shipped `"use client"` directives intact. The provider files and `motion`
are required imports; wrapping your application in `CadenceProvider` is optional.
Complete the base theme setup linked above, including Cadence's easing tokens,
and ensure Tailwind scans the copied files. These payloads contain no additional
code-block-specific CSS or assets. Usage, the top specimen and every example
use only the dependencies listed above, including `lucide-react` and Button;
there are no example-only packages to install.

The CLI installs Code Highlight's files and its `shiki` dependency along with
Code Block. The on-demand download described under Command means the browser's
dynamic highlighter and grammar imports, not an optional installation step.
A string child with `language` loads that client highlighter after hydration;
omitted or unknown languages remain plain text. `CodeBlockContent` can override
the root language. For server highlighting, await `highlightCode` from
`@/components/cadence/code-highlight/highlight` and render its returned lines
through `CodeBlockLine` inside `CodeBlockContent`, retaining the original string
for Copy. Handle its `null` result with plain source. The website's Usage fences
and these Manual source blocks already receive server-highlighted nodes; that
site pipeline is separate from a consumer passing `language`. Folding limits
visible height, not the amount of text tokenized.

In Next.js App Router, Controlled folding, Controlled tabs and Updating text
need client caller modules because they own state and event callbacks. Usage
and the other static compositions can be rendered by a Server Component with
serializable props. Adding handlers, refs or function-valued props requires a
client caller; synchronous `useId` alone does not. Keep each tab's `value`, its
panel's `value` and the `values` copy map aligned. For a server-composed tabbed
block, pass `defaultTab` explicitly as Content tabs does, or supply a controlled
`tab` from a client caller. Do not rely on automatic first-tab discovery across
the server/client boundary: omitting the initial selection leaves no selected
tab and shows every panel, including after hydration. A client caller can use
the automatic fallback. The site's preview shell and package-manager
preference are not consumer setup. Hydration enables Copy, tabs, highlighting
and folding; without JavaScript the complete source remains readable.

The caller owns source text, selected content, stream/network state, errors and
the exact copy string. Pass the full string to `CodeBlockCopyButton` as `value`,
or use `values` for tab-specific text; diff markers and removed rows are excluded
only when the caller excludes them from that string. Clipboard writes require
a secure context and browser permission. A refused or unavailable clipboard
announces failure; readers can select the source manually. Keep stable content
nodes while appending text rather than keying the block by its source.

`CodeBlock` defaults to the `default` variant and size. Folding is opt-in via
`maxLines`; `defaultExpanded` defaults to false, and `expanded` with
`onExpandedChange` makes it controlled. Place `CodeBlockExpandButton` in a
footer; it appears only for overflowing content. This Manual uses the existing
controlled 16-line fold per file, keeps the complete copy string, and retains
fold state when switching installation methods. Ordinary Usage fences remain
fully expanded. Content defaults to unwrapped, unnumbered source starting at
line 1; use `lineNumbers`, `startLine`, or `wrap` deliberately. Constrain the
parent width and use native source scrolling, or `wrap` with a bounded content
height for output. Give tab lists a meaningful `label` and keep native focus,
panel relationships and source scrolling intact.

## Usage

```tsx
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockTitle,
} from "@/components/cadence/code-block";

const install = `npx shadcn@latest add @cadence/code-block`;

export function Install() {
  return (
    <CodeBlock language="bash">
      <CodeBlockHeader>
        <CodeBlockTitle>Terminal</CodeBlockTitle>
        <CodeBlockActions>
          <CodeBlockCopyButton value={install} />
        </CodeBlockActions>
      </CodeBlockHeader>
      <CodeBlockContent>{install}</CodeBlockContent>
    </CodeBlock>
  );
}
```

## Line numbers

`lineNumbers` numbers each line from `startLine`. This excerpt begins at 42 and preserves the blank line. The gutter is generated content, excluded from selection and copied text.

<ComponentExample name="line-numbers" />

```tsx
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockTitle,
} from "@/components/cadence/code-block";

export function LineNumbersExample() {
  const source = "const response = await fetch(url);\n\nreturn response.json();";
  return (
    <CodeBlock>
      <CodeBlockHeader>
        <CodeBlockTitle>Lines 42–44</CodeBlockTitle>
        <CodeBlockActions><CodeBlockCopyButton value={source} /></CodeBlockActions>
      </CodeBlockHeader>
      <CodeBlockContent lineNumbers startLine={42}>{source}</CodeBlockContent>
    </CodeBlock>
  );
}

```

## Diff

Show `default`, `added`, `removed`, and `highlighted` lines directly. Added and removed rows carry + / − markers as well as colour. Highlighted calls attention without claiming a change. Here Copy deliberately returns the resulting source, excluding the removed row and all diff markers.

<ComponentExample name="diff" />

```tsx
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockLine,
  CodeBlockTitle,
} from "@/components/cadence/code-block";

export function DiffExample() {
  const result = "for await (const chunk of reader) {\n  controller.enqueue(chunk);\n}";
  return (
    <CodeBlock>
      <CodeBlockHeader>
        <CodeBlockTitle>Stream change</CodeBlockTitle>
        <CodeBlockActions><CodeBlockCopyButton value={result} /></CodeBlockActions>
      </CodeBlockHeader>
      <CodeBlockContent lineNumbers>
        <CodeBlockLine variant="removed">const chunks = await reader.read();</CodeBlockLine>
        <CodeBlockLine variant="added">{"for await (const chunk of reader) {"}</CodeBlockLine>
        <CodeBlockLine variant="highlighted">{"  controller.enqueue(chunk);"}</CodeBlockLine>
        <CodeBlockLine>{"}"}</CodeBlockLine>
      </CodeBlockContent>
    </CodeBlock>
  );
}

```

## Folding a long file

`maxLines` measures and clamps a fold without cropping the string. The footer reserves room for its measured toggle to avoid moving later sections during hydration. The first file starts collapsed, the second uses `defaultExpanded`, and the short file has no dead toggle. Copy still returns the entire source. Use the footer button to expand, collapse, or reverse the fold mid-flight.

<ComponentExample name="folding" />

```tsx
import { FileCode2Icon } from "lucide-react";
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockExpandButton,
  CodeBlockFooter,
  CodeBlockHeader,
  CodeBlockTitle,
} from "@/components/cadence/code-block";

const SOURCE = `export async function stream({ prompt, signal }: StreamOptions) {
  const response = await fetch("/api/chat", {
    method: "POST",
    body: JSON.stringify({ prompt }),
    signal,
  });

  if (!response.ok) throw new Error(await response.text());

  const reader = response.body?.pipeThrough(new TextDecoderStream());

  for await (const chunk of reader) {
    controller.enqueue(chunk);
    if (signal.aborted) break;
  }
};`;

export function SourceExample() {
  return (
    <CodeBlock maxLines={6} language="tsx">
      <CodeBlockHeader>
        <CodeBlockTitle><FileCode2Icon />app/api/chat/route.ts</CodeBlockTitle>
        <CodeBlockActions><CodeBlockCopyButton value={SOURCE} /></CodeBlockActions>
      </CodeBlockHeader>
      <CodeBlockContent lineNumbers>{SOURCE}</CodeBlockContent>
      <CodeBlockFooter className="min-h-[calc(--spacing(12)+1px)] justify-center"><CodeBlockExpandButton /></CodeBlockFooter>
    </CodeBlock>
  );
}


export function FoldingExample() {
  return (
    <div className="grid gap-4">
      <SourceExample />
      <CodeBlock maxLines={3} defaultExpanded>
        <CodeBlockHeader><CodeBlockTitle>Initially expanded</CodeBlockTitle></CodeBlockHeader>
        <CodeBlockContent>{SOURCE}</CodeBlockContent>
        <CodeBlockFooter className="min-h-[calc(--spacing(12)+1px)]"><CodeBlockExpandButton /></CodeBlockFooter>
      </CodeBlock>
      <CodeBlock maxLines={3}>
        <CodeBlockHeader><CodeBlockTitle>A short file needs no toggle</CodeBlockTitle></CodeBlockHeader>
        <CodeBlockContent>{"export const ready = true;"}</CodeBlockContent>
        <CodeBlockFooter className="min-h-[calc(--spacing(12)+1px)]"><CodeBlockExpandButton /></CodeBlockFooter>
      </CodeBlock>
    </div>
  );
}

```

## Tool output

Output uses `size="sm"`, `wrap`, and a bounded scrolling source. This fixed error uses `variant="destructive"`; the caller supplies the error text. No tokenizer or request is needed for plain tool output.

<ComponentExample name="tool-output" />

```tsx
import {
  CodeBlock,
  CodeBlockContent,
  CodeBlockHeader,
  CodeBlockTitle,
} from "@/components/cadence/code-block";

export function ToolOutputExample() {
  const stderr = "Error: Unable to write the generated report because the destination directory is read-only. Choose a writable destination and run the command again.\n\nNo files were changed.";
  return (
    <CodeBlock variant="destructive" size="sm">
      <CodeBlockHeader><CodeBlockTitle>run_shell · exit 1</CodeBlockTitle></CodeBlockHeader>
      <CodeBlockContent wrap className="max-h-48">{stderr}</CodeBlockContent>
    </CodeBlock>
  );
}

```

## Floating actions

Place `CodeBlockActions` directly inside the block, without a header. Hover or keyboard focus reveals Copy; a device without hover keeps it visible. The invisible action remains in the tab order so it can reveal itself on focus.

<ComponentExample name="floating-actions" />

```tsx
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
} from "@/components/cadence/code-block";

export function FloatingActionsExample() {
  const output = "Build complete.\nGenerated 74 routes.\nNo deployment was requested.";
  return (
    <CodeBlock>
      <CodeBlockActions><CodeBlockCopyButton value={output} /></CodeBlockActions>
      <CodeBlockContent>{output}</CodeBlockContent>
    </CodeBlock>
  );
}

```

## Content tabs

These are content tabs for the same install command, separate from the block’s visual `variant`. Arrow keys and Home/End select a panel. `values` makes Copy follow the current tab. Inactive panels remain mounted and hidden, retaining their source nodes and scroll position; only the active source is in the tab order.

<ComponentExample name="content-tabs" />

```tsx
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockPanel,
  CodeBlockTab,
  CodeBlockTabs,
} from "@/components/cadence/code-block";

const INSTALL = {
  pnpm: "pnpm dlx shadcn@latest add @cadence/code-block",
  npm: "npx shadcn@latest add @cadence/code-block",
  yarn: "yarn dlx shadcn@latest add @cadence/code-block",
};

export function ContentTabsExample() {
  return (
    <CodeBlock defaultTab="pnpm" language="bash">
      <CodeBlockHeader>
        <CodeBlockTabs label="Package manager">
          <CodeBlockTab value="pnpm">pnpm</CodeBlockTab>
          <CodeBlockTab value="npm">npm</CodeBlockTab>
          <CodeBlockTab value="yarn">yarn</CodeBlockTab>
        </CodeBlockTabs>
        <CodeBlockActions><CodeBlockCopyButton values={INSTALL} /></CodeBlockActions>
      </CodeBlockHeader>
      <CodeBlockPanel value="pnpm">{INSTALL.pnpm}</CodeBlockPanel>
      <CodeBlockPanel value="npm">{INSTALL.npm}</CodeBlockPanel>
      <CodeBlockPanel value="yarn">{INSTALL.yarn}</CodeBlockPanel>
    </CodeBlock>
  );
}

```

## Highlighting

A string child with `language="tsx"` loads the Shiki adapter and its grammar dynamically. The content can override the root language, as the JSON block does. An unknown language stays plain and readable. The initial server output stays visible while highlighting loads; theme token variables recolour it without replacing the code.

<ComponentExample name="highlighting" />

```tsx
import {
  CodeBlock,
  CodeBlockContent,
  CodeBlockHeader,
  CodeBlockTitle,
} from "@/components/cadence/code-block";

export function HighlightingExample() {
  const source = "export const greeting = (name: string) => name.toUpperCase();";
  return (
    <div className="grid gap-4">
      <CodeBlock language="tsx">
        <CodeBlockHeader><CodeBlockTitle>TypeScript highlighting</CodeBlockTitle></CodeBlockHeader>
        <CodeBlockContent lineNumbers>{source}</CodeBlockContent>
      </CodeBlock>
      <CodeBlock language="tsx">
        <CodeBlockHeader><CodeBlockTitle>Content language override</CodeBlockTitle></CodeBlockHeader>
        <CodeBlockContent language="json">{'{ "ready": true }'}</CodeBlockContent>
      </CodeBlock>
      <CodeBlock language="unbundled-example-language">
        <CodeBlockHeader><CodeBlockTitle>Unknown language stays readable</CodeBlockTitle></CodeBlockHeader>
        <CodeBlockContent>{source}</CodeBlockContent>
      </CodeBlock>
    </div>
  );
}

```

## Visual variants

`default` is the ordinary code surface. `destructive` marks failed output with semantic error colours. Both are fixed instances; choosing a content tab does not change this visual variant.

<ComponentExample name="visual-variants" />

```tsx
import {
  CodeBlock,
  CodeBlockContent,
  CodeBlockHeader,
  CodeBlockTitle,
} from "@/components/cadence/code-block";

export function VisualVariantsExample() {
  return (
    <div className="grid gap-4">
      <CodeBlock variant="default">
        <CodeBlockHeader><CodeBlockTitle>Successful output</CodeBlockTitle></CodeBlockHeader>
        <CodeBlockContent>{"Report generated."}</CodeBlockContent>
      </CodeBlock>
      <CodeBlock variant="destructive">
        <CodeBlockHeader><CodeBlockTitle>Failed output</CodeBlockTitle></CodeBlockHeader>
        <CodeBlockContent>{"Error: Destination is read-only."}</CodeBlockContent>
      </CodeBlock>
    </div>
  );
}

```

## Sizes

`default` suits source snippets. `sm` tightens header and content padding and uses smaller text for compact tool output. Size belongs to each block, rather than a shared demo selector.

<ComponentExample name="sizes" />

```tsx
import {
  CodeBlock,
  CodeBlockContent,
  CodeBlockHeader,
  CodeBlockTitle,
} from "@/components/cadence/code-block";

export function SizesExample() {
  return (
    <div className="grid gap-4">
      <CodeBlock size="default">
        <CodeBlockHeader><CodeBlockTitle>Default source</CodeBlockTitle></CodeBlockHeader>
        <CodeBlockContent>{"export const ready = true;"}</CodeBlockContent>
      </CodeBlock>
      <CodeBlock size="sm">
        <CodeBlockHeader><CodeBlockTitle>Compact output</CodeBlockTitle></CodeBlockHeader>
        <CodeBlockContent>{"Task completed."}</CodeBlockContent>
      </CodeBlock>
    </div>
  );
}

```

## Controlled folding

The caller owns `expanded` and handles `onExpandedChange`. The external buttons demonstrate API updates; the native fold button updates the same state. API updates keep the same source node; normal pointer and keyboard focus behavior still applies.

<ComponentExample name="controlled-fold" />

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/cadence/button";
import {
  CodeBlock,
  CodeBlockContent,
  CodeBlockExpandButton,
  CodeBlockFooter,
  CodeBlockHeader,
  CodeBlockTitle,
} from "@/components/cadence/code-block";

const SOURCE = `export async function stream({ prompt, signal }: StreamOptions) {
  const response = await fetch("/api/chat", {
    method: "POST",
    body: JSON.stringify({ prompt }),
    signal,
  });

  if (!response.ok) throw new Error(await response.text());

  const reader = response.body?.pipeThrough(new TextDecoderStream());

  for await (const chunk of reader) {
    controller.enqueue(chunk);
    if (signal.aborted) break;
  }
};`;

export function ControlledFoldExample() {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setExpanded(true)}>Expand from outside</Button>
        <Button variant="outline" onClick={() => setExpanded(false)}>Collapse from outside</Button>
      </div>
      <CodeBlock maxLines={4} expanded={expanded} onExpandedChange={setExpanded}>
        <CodeBlockHeader><CodeBlockTitle>Caller-owned fold</CodeBlockTitle></CodeBlockHeader>
        <CodeBlockContent lineNumbers>{SOURCE}</CodeBlockContent>
        <CodeBlockFooter className="min-h-[calc(--spacing(12)+1px)]"><CodeBlockExpandButton /></CodeBlockFooter>
      </CodeBlock>
    </div>
  );
}

```

## Controlled tabs

The caller owns `tab` and handles `onTabChange`. The external action selects the related output, while the tabs still support native keyboard navigation. Copy follows the controlled selection. This state is independent of the package-manager example.

<ComponentExample name="controlled-tabs" />

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/cadence/button";
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockPanel,
  CodeBlockTab,
  CodeBlockTabs,
} from "@/components/cadence/code-block";

export function ControlledTabsExample() {
  const [tab, setTab] = useState("source");
  const values = { source: "export const ready = true;", output: "ready: true" };
  return (
    <div className="grid gap-3">
      <Button variant="outline" onClick={() => setTab("output")}>Show output from outside</Button>
      <CodeBlock tab={tab} onTabChange={setTab}>
        <CodeBlockHeader>
          <CodeBlockTabs label="Source or output">
            <CodeBlockTab value="source">Source</CodeBlockTab>
            <CodeBlockTab value="output">Output</CodeBlockTab>
          </CodeBlockTabs>
          <CodeBlockActions><CodeBlockCopyButton values={values} /></CodeBlockActions>
        </CodeBlockHeader>
        <CodeBlockPanel value="source">{values.source}</CodeBlockPanel>
        <CodeBlockPanel value="output">{values.output}</CodeBlockPanel>
      </CodeBlock>
    </div>
  );
}

```

## Updating text

Append a local chunk to both a plain output string and highlighted source. These are explicit caller events, not a simulated network stream. Keep the same content nodes: plain output remains one text node, finished highlighted lines retain their identity, and Copy always receives the current complete string. Reset is also caller-owned.

<ComponentExample name="updating-text" />

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/cadence/button";
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockTitle,
} from "@/components/cadence/code-block";

export function UpdatingTextExample() {
  const [chunks, setChunks] = useState(0);
  const output = `Build started.\n${"Checked another route.\n".repeat(chunks)}`;
  const source = `export const ready = true;\n${"// Checked another route.\n".repeat(chunks)}`;
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setChunks((count) => count + 1)}>Append a local chunk</Button>
        <Button variant="outline" onClick={() => setChunks(0)}>Reset text</Button>
      </div>
      <CodeBlock>
        <CodeBlockHeader>
          <CodeBlockTitle>Plain output</CodeBlockTitle>
          <CodeBlockActions><CodeBlockCopyButton value={output} /></CodeBlockActions>
        </CodeBlockHeader>
        <CodeBlockContent className="max-h-48">{output}</CodeBlockContent>
      </CodeBlock>
      <CodeBlock language="tsx">
        <CodeBlockHeader>
          <CodeBlockTitle>Highlighted source</CodeBlockTitle>
          <CodeBlockActions><CodeBlockCopyButton value={source} /></CodeBlockActions>
        </CodeBlockHeader>
        <CodeBlockContent lineNumbers className="max-h-48">{source}</CodeBlockContent>
      </CodeBlock>
    </div>
  );
}

```

## Without motion

The first block explicitly uses `mode="none"`: copying and folding resolve immediately. The nested `mode="full"` block opts its content tabs back into full motion; the operating system’s reduced preference still takes precedence. Ordinary examples elsewhere on this page inherit the site header settings.

<ComponentExample name="without-motion" />

```tsx
import { FileCode2Icon } from "lucide-react";
import { CadenceProvider } from "@/components/cadence/lib/provider";
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockExpandButton,
  CodeBlockFooter,
  CodeBlockHeader,
  CodeBlockPanel,
  CodeBlockTab,
  CodeBlockTabs,
  CodeBlockTitle,
} from "@/components/cadence/code-block";

const SOURCE = `export async function stream({ prompt, signal }: StreamOptions) {
  const response = await fetch("/api/chat", {
    method: "POST",
    body: JSON.stringify({ prompt }),
    signal,
  });

  if (!response.ok) throw new Error(await response.text());

  const reader = response.body?.pipeThrough(new TextDecoderStream());

  for await (const chunk of reader) {
    controller.enqueue(chunk);
    if (signal.aborted) break;
  }
};`;

const INSTALL = {
  pnpm: "pnpm dlx shadcn@latest add @cadence/code-block",
  npm: "npx shadcn@latest add @cadence/code-block",
  yarn: "yarn dlx shadcn@latest add @cadence/code-block",
};

export function SourceExample() {
  return (
    <CodeBlock maxLines={6} language="tsx">
      <CodeBlockHeader>
        <CodeBlockTitle><FileCode2Icon />app/api/chat/route.ts</CodeBlockTitle>
        <CodeBlockActions><CodeBlockCopyButton value={SOURCE} /></CodeBlockActions>
      </CodeBlockHeader>
      <CodeBlockContent lineNumbers>{SOURCE}</CodeBlockContent>
      <CodeBlockFooter className="min-h-[calc(--spacing(12)+1px)] justify-center"><CodeBlockExpandButton /></CodeBlockFooter>
    </CodeBlock>
  );
}


export function ContentTabsExample() {
  return (
    <CodeBlock defaultTab="pnpm" language="bash">
      <CodeBlockHeader>
        <CodeBlockTabs label="Package manager">
          <CodeBlockTab value="pnpm">pnpm</CodeBlockTab>
          <CodeBlockTab value="npm">npm</CodeBlockTab>
          <CodeBlockTab value="yarn">yarn</CodeBlockTab>
        </CodeBlockTabs>
        <CodeBlockActions><CodeBlockCopyButton values={INSTALL} /></CodeBlockActions>
      </CodeBlockHeader>
      <CodeBlockPanel value="pnpm">{INSTALL.pnpm}</CodeBlockPanel>
      <CodeBlockPanel value="npm">{INSTALL.npm}</CodeBlockPanel>
      <CodeBlockPanel value="yarn">{INSTALL.yarn}</CodeBlockPanel>
    </CodeBlock>
  );
}


export function WithoutMotionExample() {
  return (
    <CadenceProvider mode="none">
      <div className="grid gap-4">
        <SourceExample />
        <CadenceProvider mode="full"><ContentTabsExample /></CadenceProvider>
      </div>
    </CadenceProvider>
  );
}

```

## When to use

- A source snippet the reader is meant to copy: an install command, a route handler, a config file.
- An answer from an assistant, where the block sits inside a message and the reader may want the code out of it.
- Tool calls and their output — a shell run, a stack trace, a JSON payload — where the reader scans rather than reads.
- A diff or a patch, where added and removed lines have to be distinguishable at a glance and without colour.
- A long file that would dominate the page: cap it with `maxLines` and let the reader unfold it.
- One snippet in several forms — an install per package manager, a source file and its output — where the reader
  should not have to scroll past variants that are not theirs.

## When not to use

- A single value the reader copies — an API key, a URL, an id. Use the copy button on its own; a bordered code
  surface gives a one-line value more weight than it deserves.
- Inline code in a sentence. Use `<code>`, which the page's typeset styles.
- Content that is not code and not output: a quote, a log line with no structure, a terminal transcript with
  interactive prompts. A block that looks like code but is not sets the wrong expectation about copying.
- A whole editor. This is a viewer; it has no caret, no selection model of its own, and no undo.

## API

| Part | Props | Notes |
| --- | --- | --- |
| `CodeBlock` | `variant`, `size`, native `div` props | `variant`: `default` \| `destructive`. `size`: `default` \| `sm`. |
| | `maxLines`, `expanded`, `defaultExpanded`, `onExpandedChange` | Additive fold. Uncontrolled unless `expanded` is passed. |
| | `language` | Additive. Highlights a string child; an unknown name renders plainly. |
| | `defaultTab`, `tab`, `onTabChange` | Additive switcher. Holds the selection the tabs, the panels and the copy button share. |
| `CodeBlockHeader` | native `div` props | Sits above the source and draws a full-width rule between the label and the code. |
| `CodeBlockTitle` | native `div` props | Truncates. The selected tab's text style — 12px, medium, foreground, on the same 24px line box — so a header reads the same with or without a switcher. Wrap it in an anchor to link to the file. |
| `CodeBlockTabs` | `label`, native `div` props | Additive. `role="tablist"`, one tab stop, arrow keys move within it. Needs a `CodeBlock` parent. |
| `CodeBlockTab` | `value` (required), native `button` props | Additive. `role="tab"`; only the selected one renders the shared pill. |
| `CodeBlockActions` | native `div` props | In a header it sits at the end; on its own it floats. |
| `CodeBlockCopyButton` | `value` or `values`, all `Button` props | Copies `value`, or `values[tab]` when the block switches variants. `variant` defaults to `ghost`, `size` to `icon-xs`. |
| `CodeBlockContent` | `wrap`, `lineNumbers`, `startLine`, `language`, native `pre` props | Always `dir="ltr"` and focusable (`tabIndex={0}`; pass `-1` to remove it). `language` overrides the block's. |
| `CodeBlockPanel` | `value` (required), all `CodeBlockContent` props | Additive. One variant: renders the content, stays mounted, hidden while another tab is selected. |
| `CodeBlockLine` | `variant`, native `span` props | `default` \| `added` \| `removed` \| `highlighted`. |
| `CodeBlockFooter` | native `div` props | Sits below the source and draws the matching rule above it. |
| `CodeBlockExpandButton` | all `Button` props | Additive. Renders nothing unless the block overflows. |

`CodeBlockContent` takes its `id` from the block, which is what `CodeBlockExpandButton` points
`aria-controls` at. If you pass an `id` of your own for an anchor link, pass the same value to the button's
`aria-controls` as well.

Highlighting is a second item, installed automatically as a dependency of `code-block`:

| `code-highlight` | Signature | Notes |
| --- | --- | --- |
| `highlightCode` | `(code: string, language: string) => Promise<ReactNode[][] \| null>` | For a Server Component or any await. `null` when the language is not bundled. |
| `useHighlightedCode` | `(code: string, language?: string) => ReactNode[] \| null` | Client hook. `null` until the grammar loads, so the caller keeps its plain text. |
| `loadHighlighter` | `(language: string) => Promise<Highlighter \| null>` | The lower-level form: `highlight(code, state)` returns lines plus the grammar state for the next chunk. |

Every part carries a `data-slot` (`code-block`, `code-block-header`, `code-block-title`, `code-block-tabs`,
`code-block-tab`, `code-block-tab-indicator`, `code-block-actions`, `code-block-copy-button`,
`code-block-panel`, `code-block-content`, `code-block-code`, `code-block-line`, `code-block-line-content`,
`code-block-footer`, plus the additive `code-block-viewport` and `code-block-expand-button`), so a consumer can
restyle without a wrapper.

## Motion contract

| Phase | Properties | Token | Interruptible |
| --- | --- | --- | --- |
| fold / unfold | viewport `height`, measured and clamped to the content | `geometry.resize` | yes (a second click retargets the spring) |
| floating actions | `opacity 0 → 1` on hover and focus-within | `data.transition` | yes |
| copy | glyph cross-fade + `scale` 0.96 → 1 | `state.morph` | yes |
| fold toggle | chevron `rotate 0 → 180`, label swaps | `state.morph` | yes |
| tab indicator | one pill shared between tabs, `layoutId` | `layout.shared` | yes (a third tab pressed mid-travel retargets it) |
| reduced | opacity stays; the chevron and height jump, the copy glyph swaps without scaling, and the tab pill appears in place instead of travelling | `geometry.resize` resolves to `{ duration: 0 }` | – |
| none | every transition resolves to zero duration; the block is in its end state on the first frame | – | – |

Three notes on the choices:

- The fold animates a **measured** height rather than a `max-height` in a class. A class would need a magic number
  per line count, and it would break the moment a line wraps. The spring is the token's, and the rendered height is
  clamped to the content so it can never settle above or below the real size.
- Under reduced motion the height change is a jump on purpose. Unfolding is information — the reader asked to see
  more lines — and a 200 ms layout tween is exactly the motion the reduced mode exists to remove.
- Explicit source and fold commits may resize in full mode. Font arrival, viewport reflow and unknown observer changes use current natural layout immediately. Hidden content establishes a fresh baseline when measurable; focus inside the source exposes its full height immediately. The source tree is never cloned for measurement, and completed expansion releases the temporary height to `auto`.
- The tab pill is a shared element only in full mode. Reduced motion drops the `layoutId`, so the pill is painted
  where the selection landed: which tab is current is information, the travel between them is not. A panel change
  never animates its height for the same reason.

## Keyboard interactions

| Keys | Action |
| --- | --- |
| Tab | Reaches the tab list (once), the selected tab, the copy button, the source, and the fold toggle. |
| Arrow Left / Right | Moves between tabs and selects the one it lands on — a tab list is one tab stop, not one stop per tab. |
| Home / End | Jumps to the first or the last tab. |
| Arrow keys / Page Up / Page Down | Scroll the source once it has focus; a long line or a capped block scrolls without moving the page. |
| Enter / Space | Copies, selects the focused tab, or toggles the fold. |
| Cmd/Ctrl + C | Copies the selection — line numbers and diff markers are excluded, blank lines are kept. |

## Accessibility

- The source is a real `pre` > `code` and is focusable, so a keyboard user can scroll a block that overflows. A
  `max-height` on the content keeps that true for capped blocks too.
- Line numbers are drawn with generated content, so they stay out of the text selection and out of the accessibility
  tree; the code is read as code, without a column of digits.
- The copy button's accessible name is `Copy`, then `Copied`; a polite live region repeats the result, so the tick
  is confirmation, not the only signal. A refused clipboard write leaves the glyph on `Copy` rather than claiming
  success.
- Diff lines carry a `+` / `−` marker next to the tint, so the change survives a monochrome display.
- The fold toggle is a real button with `aria-expanded` and `aria-controls` pointing at the source, and it is not
  rendered at all when there is nothing to unfold.
- The switcher is the ARIA tabs pattern: `role="tablist"` with a name (`label`, "Language" by default), tabs that
  carry `aria-selected` and point `aria-controls` at their panel, one tab stop with a roving `tabindex`, and
  `role="tabpanel"` panels labelled by their tab. Inactive panels are `hidden`, which takes their focusable source
  out of the tab order.
- The block is `dir="ltr"` throughout, because code reads left to right even on an RTL page. The header follows the
  page's direction.

## Responsive behavior

- `size="sm"` tightens the padding and drops the source to `text-xs` — the right weight for output inside a
  message or a tool row.
- Long lines scroll inside the block, never the page: the source owns the overflow, and the wrapper clips it.
  The bar is thin and drawn in the theme's own grey rather than the OS's, because a native scrollbar follows the
  operating system and not the page — a dark page on a light system would otherwise get a white bar down the code.
- `wrap` is for output, not for source. Wrapped source loses its indentation structure, which is the one thing code
  formatting carries.
- On a narrow screen the header's title truncates rather than wrapping, and the actions stay reachable — a touch
  device always shows them, because there is no hover to reveal them with. The tab list scrolls sideways on its
  own when three tabs and a title do not fit, so the copy button keeps its place. That row scrolls without a bar:
  a track in a 24px control strip reads as a second seam under the label, and the arrow keys and a swipe move it
  anyway.

## Performance

The initially folded viewport reserves the built-in line height and padding before hydration, so
measuring a fold does not pull later document anchors upward. With JavaScript disabled the cap is
absent and the complete source stays readable. Custom content line height or padding may change
that estimate; provide a suitable SSR layout if overriding those metrics.

- Without a `language`, a string child is one text node: streaming a chunk does not rebuild a subtree, only the
  changed text is painted. With a `language`, each finished line is one node that is never re-created, and the
  line being written is the only one re-tokenized.
- One `ResizeObserver` per foldable block, and none for a block that cannot fold. The measurement is a read inside
  the observer callback, never during render.
- The fold animates `height` — a layout property, and the one place in this component that touches layout. It is
  scoped to the source viewport and moves following document content, is clamped, and it resolves to zero duration under
  reduced and none.
- Everything else is `opacity` and `scale` on small elements: two glyphs and a chevron.
- Shiki is a dynamic import. A block with no `language` never loads it; a block with one loads the engine and a
  single grammar, both cached for the rest of the session. `getLoadedLanguages()` is checked first, so the second
  `tsx` block on a page does not re-load anything.
- Tokenizing runs on the main thread. Its cost depends on the grammar, source and device;
  a thousand-line file is not free: cap it with `maxLines`, or hand the nodes in from a Server Component with
  `highlightCode`.

## Notes for AI

- Reach for `code-block` for code, terminal output, tool calls, logs, diffs and stack traces. Never hand-roll a
  `<pre>` — the copy affordance, the focus ring, and the fold are the point.
- Give the block a `value` to copy that matches what is displayed. Passing a truncated string is the most common
  bug: the reader copies less than they can see.
- Tool output is not source: `size="sm"` with `wrap` and a `max-h-*` on the content. Errors use
  `variant="destructive"` on `CodeBlock`; do not recolour the text.
- When a stream is still arriving, keep rendering the same `<CodeBlockContent>` and let the string grow. Do not key
  the block by content, and do not remount it — a remount restarts the fold measurement, drops focus, and throws
  away the cached lines, so the whole block is tokenized again on the next chunk.
- Pass `language` for source, and leave it out for tool output, logs and stack traces: a tokenizer that guesses at
  output colours noise, and the plain path is the cheaper one.
- The first paint is plain while the highlighter chunk loads. Do not hide the block until it is coloured; showing
  the text immediately is the point.
- Use `maxLines` for anything longer than a screenful, with `CodeBlockExpandButton` in the footer. Do not cap the
  block by cropping the string.
- When a snippet has more than one right form — an install for pnpm, npm and yarn, a source and its output — use
  `CodeBlockTabs` / `CodeBlockTab` / `CodeBlockPanel`, and give the header's `CodeBlockCopyButton` `values` so it
  copies the variant on screen. Do not stack two blocks with a hand-rolled toggle, and do not put unrelated files
  behind tabs: a tab is the same snippet in another form, not a second snippet.

---

Full index: https://cadence.dev/llms.txt
