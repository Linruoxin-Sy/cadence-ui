import { MDXRemote } from "next-mdx-remote/rsc";
import type { ComponentProps } from "react";
import remarkGfm from "remark-gfm";

/**
 * Renders the markdown body of a component or guide.
 *
 * `typeset` turns shadcn/typeset on and `typeset-docs` is the preset that sets the
 * reading rhythm (see app/globals.css). Element styles live in app/typeset.css, so a
 * new markdown element is styled there, not here.
 *
 * Tables get a scroll container. Typeset keeps them as real tables and lets them
 * wrap to fit, which is what we want down to the tablet breakpoint; below that a
 * prop table's min-content width is wider than the column, and without a wrapper the
 * overflow lands on the page. `typeset-scroll` is typeset's own wrapper, but it sets
 * `width: max-content` on the table, so the props table would stop wrapping at every
 * width. This wrapper scrolls only when the table cannot shrink further.
 *
 * `pre` is focusable because a code block that overflows scrolls horizontally, and a
 * scroll container with no keyboard-reachable content is an axe violation
 * (`scrollable-region-focusable`) — the tooltip's usage example was the first block
 * long enough to trigger it. One extra tab stop per block is the price of not
 * hiding the tail of a line from keyboard users.
 */
export async function Mdx({ source }: { source: string }) {
  return (
    <div className="typeset typeset-docs">
      <MDXRemote
        source={source}
        options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
        components={{
          table: ({ children, ...props }: ComponentProps<"table">) => (
            <div className="overflow-x-auto">
              <table {...props}>{children}</table>
            </div>
          ),
          pre: ({ children, ...props }: ComponentProps<"pre">) => (
            // biome-ignore lint/a11y/noNoninteractiveTabindex: axe's scrollable-region-focusable rule requires a horizontally scrollable code block to be keyboard reachable
            <pre tabIndex={0} {...props}>
              {children}
            </pre>
          ),
        }}
      />
    </div>
  );
}
