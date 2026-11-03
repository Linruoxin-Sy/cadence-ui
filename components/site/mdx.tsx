import { compileMDX } from "next-mdx-remote/rsc";
import type { ComponentProps } from "react";
import remarkGfm from "remark-gfm";
import { assertComponentExample } from "@/lib/component-examples";
import type { TocEntry } from "@/registry/cadence/toc";
import { MdxCodeFence } from "./code-fence";
import { PreviewFrame } from "./preview";

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
export function headingPlugin(headings: TocEntry[]) {
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
        headings.push({ id, title, depth: node.tagName === "h3" ? 3 : 2 });
      }
      node.children?.forEach(walk);
    };
    walk(tree);
  };
}

function DocumentExample(componentId: string | undefined, { name }: { name: string }) {
  assertComponentExample(componentId, name);
  return (
    <div data-not-typeset className="my-6">
      <PreviewFrame id={componentId} example={name} />
    </div>
  );
}

export async function compileDocument(source: string, componentId?: string) {
  const headings: TocEntry[] = [];
  const { content } = await compileMDX({
    source,
    options: { mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [headingPlugin(headings)] } },
    components: {
      ComponentExample: DocumentExample.bind(null, componentId),
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
  return { headings, content: <div className="typeset typeset-docs">{content}</div> };
}

export async function Mdx({ source }: { source: string }) {
  return (await compileDocument(source)).content;
}
