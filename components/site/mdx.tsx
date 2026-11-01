import { compileMDX } from "next-mdx-remote/rsc";
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
interface HeadingNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HeadingNode[];
}

/** Assign anchors from actual rendered heading nodes, including inline code. */
export function headingPlugin(headings: Array<{ id: string; title: string }>) {
  return () => (tree: HeadingNode) => {
    const used = new Set<string>();
    const text = (node: HeadingNode): string => node.value ?? node.children?.map(text).join("") ?? "";
    const walk = (node: HeadingNode) => {
      if (node.type === "element" && /^h[23]$/.test(node.tagName ?? "")) {
        const title = text(node);
        const base =
          title
            .toLowerCase()
            .replace(/[^\p{L}\p{N}\s-]/gu, "")
            .trim()
            .replace(/\s+/g, "-") || "section";
        let id = base;
        let suffix = 1;
        while (used.has(id)) id = `${base}-${suffix++}`;
        used.add(id);
        node.properties = { ...node.properties, id, className: ["scroll-mt-24"] };
        headings.push({ id, title });
      }
      node.children?.forEach(walk);
    };
    walk(tree);
  };
}

export async function Mdx({ source, toc = false }: { source: string; toc?: boolean }) {
  const headings: Array<{ id: string; title: string }> = [];
  const { content } = await compileMDX({
    source,
    options: { mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [headingPlugin(headings)] } },
    components: {
      table: ({ children, ...props }: ComponentProps<"table">) => (
        <div className="overflow-x-auto">
          {/* biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard scroll target for wide documentation tables. */}
          <table className="docs-table" tabIndex={0} {...props}>
            {children}
          </table>
        </div>
      ),
      pre: ({ children }: ComponentProps<"pre">) => <MdxCodeFence>{children}</MdxCodeFence>,
    },
  });
  return (
    <>
      {toc && (
        <nav aria-label="On this page" className="my-8 rounded-lg border border-border p-4 text-sm">
          <p className="font-medium">On this page</p>
          <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
            {headings.map(({ id, title }) => (
              <li key={id}>
                <a className="text-muted-foreground underline underline-offset-4 hover:text-foreground" href={`#${id}`}>
                  {title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <div className="typeset typeset-docs">{content}</div>
    </>
  );
}
