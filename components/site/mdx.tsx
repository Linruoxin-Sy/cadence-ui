import { MDXRemote } from "next-mdx-remote/rsc";
import type { ComponentProps } from "react";
import remarkGfm from "remark-gfm";
import { MdxCodeFence } from "./code-fence";

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
 * `pre` — a fenced block — is handed to the registry's `code-block` (see
 * `components/site/code-fence.tsx`). The markdown does not carry the treatment: the
 * fence, its language, and its copy control are the item's, so the docs site shows
 * the component it documents rather than a second implementation of it. The block's
 * own `pre` is focusable, which is what the `scrollable-region-focusable` rule asks
 * for, so the override no longer adds a tab stop by hand.
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
          pre: ({ children }: ComponentProps<"pre">) => <MdxCodeFence>{children}</MdxCodeFence>,
        }}
      />
    </div>
  );
}
