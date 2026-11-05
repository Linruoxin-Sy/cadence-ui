/** Transform parsed Markdown, never split fences or prose with string slicing. */
interface Node {
  type: string;
  depth?: number;
  value?: string;
  url?: string;
  name?: string;
  attributes?: Array<{ type: string; name: string; value: string }>;
  children?: Node[];
}

const marker = (node: Node | undefined, label: string) =>
  node?.type === "paragraph" &&
  node.children?.length === 1 &&
  node.children[0]?.type === "strong" &&
  node.children[0].children?.length === 1 &&
  node.children[0].children[0]?.value === label;

const element = (name: string, children: Node[]): Node => ({
  type: "mdxJsxFlowElement",
  name,
  attributes: [],
  children,
});

export function installationPlugin() {
  return (tree: Node) => {
    const nodes = tree.children ?? [];
    const start = nodes.findIndex(
      (node) => node.type === "heading" && node.depth === 2 && node.children?.[0]?.value === "Installation",
    );
    if (start < 0) return;
    let end = nodes.findIndex((node, index) => index > start && node.type === "heading" && node.depth === 2);
    if (end < 0) end = nodes.length;
    const section = nodes.slice(start + 1, end);
    const command = section.findIndex((node) => marker(node, "Command"));
    const manual = section.findIndex((node) => marker(node, "Manual"));
    if (command < 0 || manual < 0) return;
    const manualNodes = section.slice(manual + 1).map((node) => {
      const link = node.children?.[0];
      const title = link?.children?.[0]?.value;
      if (
        node.type !== "paragraph" ||
        node.children?.length !== 1 ||
        link?.type !== "link" ||
        !title?.startsWith("Source files: ")
      )
        return node;
      const id = title.slice("Source files: ".length);
      if (!/^[a-z][a-z0-9-]*$/.test(id) || link.url !== `https://cadence.dev/r/${id}.json`)
        throw new Error("Invalid installation source link");
      return { ...element("InstallationSource", []), attributes: [{ type: "mdxJsxAttribute", name: "id", value: id }] };
    });
    nodes.splice(
      start + 1,
      end - start - 1,
      element("Installation", [
        element("InstallationCommand", section.slice(command + 1, manual)),
        element("InstallationManual", manualNodes),
      ]),
    );
  };
}

/** Keep component containers outside prose scopes, then restart prose per panel. */
export function documentFlowPlugin() {
  return (tree: Node) => {
    const output: Node[] = [];
    let prose: Node[] = [];
    const flush = () => {
      if (prose.length) output.push(element("DocumentProse", prose));
      prose = [];
    };
    for (const node of tree.children ?? []) {
      if (node.type === "mdxJsxFlowElement" && node.name === "Installation") {
        flush();
        output.push(node);
      } else prose.push(node);
    }
    flush();
    tree.children = output;
  };
}
