import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { fenceTitle, readFence } from "@/components/site/fence";
import { INSTALL_FENCE, PACKAGE_MANAGER_FENCE } from "@/components/site/package-manager";
import { resolveLanguage } from "@/registry/cadence/code-highlight/highlight";

/** The shape MDX emits for a fence: `pre > code.language-<id> > "source"`. */
function mdxPre(language: string | null, source: string) {
  const className = language ? `language-${language}` : undefined;
  return createElement("code", { className }, source);
}

describe("readFence", () => {
  it("reads the language and the source out of an MDX fence", () => {
    const fence = readFence(mdxPre("tsx", "const answer = 42;\n"));

    expect(fence?.language).toBe("tsx");
    expect(fence?.source).toBe("const answer = 42;\n");
  });

  it("normalises the info string, which an author can write in any case", () => {
    expect(readFence(mdxPre("TSX", "x"))?.language).toBe("tsx");
  });

  it("keeps a fence without an info string, so it still renders as a block", () => {
    const fence = readFence(mdxPre(null, "?motion=full | reduced | none\n"));

    expect(fence?.language).toBeUndefined();
    expect(fence?.source).toBe("?motion=full | reduced | none\n");
  });

  it("keeps an empty fence, which is a block with nothing in it, not a missing block", () => {
    expect(readFence(mdxPre("bash", ""))).toEqual({ language: "bash", source: "" });
  });

  it("reads through a code element that holds several text nodes", () => {
    const children = createElement("code", { className: "language-json" }, '{"a":', " 1}", "\n");

    expect(readFence(children)?.source).toBe('{"a": 1}\n');
  });

  it("reads a code element a body has mapped to its own component", () => {
    // JSX in an MDX body survives as an element; a fence's `code` may be mapped, and
    // the language class is the one thing that survives both paths.
    const custom = createElement("Code", { className: "language-bash" }, "npm i");

    expect(readFence(custom)?.language).toBe("bash");
    expect(readFence(custom)?.source).toBe("npm i");
  });

  it("leaves a pre that is not a fence to the caller", () => {
    expect(readFence(createElement("div", null, "not code"))).toBeNull();
    expect(readFence(null)).toBeNull();
  });

  it("still treats a -pre- whose child is bare text as a fence, so a hand-written one is not left naked", () => {
    expect(readFence("just output\n")).toEqual({ language: undefined, source: "just output\n" });
  });
});

describe("fenceTitle", () => {
  it("calls a shell fence a terminal, because that is what the reader runs it in", () => {
    expect(fenceTitle("bash")).toBe("Terminal");
    expect(fenceTitle("sh")).toBe("Terminal");
  });

  it("title-cases the languages that would otherwise look like typos", () => {
    expect(fenceTitle("tsx")).toBe("TSX");
    expect(fenceTitle("json")).toBe("JSON");
    expect(fenceTitle("typescript")).toBe("TypeScript");
  });

  it("falls back to the info string, then to a plain label", () => {
    expect(fenceTitle("rust")).toBe("rust");
    expect(fenceTitle()).toBe("Code");
  });
});

/**
 * The docs are highlighted at build time, so a language the item does not bundle is
 * not an error — it is a fence that silently renders as plain text. This guards the
 * silent half: a new fence written in a language nobody added to `code-highlight`
 * fails here instead of shipping uncoloured.
 */
describe("content fences", () => {
  const root = process.cwd();

  it("only uses languages the code-block item highlights", async () => {
    const files = await Promise.all(
      ["content/components", "content/docs"].map(async (dir) => {
        const names = await readdir(path.join(root, dir));
        return names.filter((name) => name.endsWith(".mdx")).map((name) => path.join(dir, name));
      }),
    ).then((groups) => groups.flat());

    expect(files.length).toBeGreaterThan(0);

    const unhighlighted: string[] = [];
    for (const file of files) {
      const lines = (await readFile(path.join(root, file), "utf8")).split("\n");
      let inside = false;
      for (const line of lines) {
        if (!line.startsWith("```")) continue;
        if (inside) {
          inside = false;
          continue;
        }
        inside = true;
        const language = line.slice(3).trim();
        // A fence with no info string is deliberate: it holds plain output.
        // `install` and `package-manager` are not languages either: the site renders
        // those fences as the package-manager switcher (see
        // `components/site/package-manager-block.tsx`) and colours their commands with
        // the `bash` grammar itself.
        if (!language || language === INSTALL_FENCE || language === PACKAGE_MANAGER_FENCE) continue;
        if (!resolveLanguage(language)) unhighlighted.push(`${file}: ${language}`);
      }
    }

    expect(unhighlighted).toEqual([]);
  });
});
