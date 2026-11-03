import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { compileDocument } from "@/components/site/mdx";

vi.mock("@/components/site/code-fence", () => ({ MdxCodeFence: () => null }));

describe("document heading data", () => {
  it("collects rendered heading text and depth, with unique, working anchors", async () => {
    const { headings, content } = await compileDocument(
      "## Usage\n\n### `Toc` props\n\n## Usage\n\n## Usage-1\n\n## 中文章节\n\n## !!!\n\n```md\n## Not a heading\n```",
    );
    expect(headings).toEqual([
      { id: "usage", title: "Usage", depth: 2 },
      { id: "toc-props", title: "Toc props", depth: 3 },
      { id: "usage-1", title: "Usage", depth: 2 },
      { id: "usage-1-1", title: "Usage-1", depth: 2 },
      { id: "中文章节", title: "中文章节", depth: 2 },
      { id: "section", title: "!!!", depth: 2 },
    ]);
    render(content);
    for (const { id, title } of headings) expect(document.getElementById(id)).toHaveTextContent(title);
    expect(screen.queryByRole("heading", { name: "Not a heading" })).toBeNull();
  });
});
