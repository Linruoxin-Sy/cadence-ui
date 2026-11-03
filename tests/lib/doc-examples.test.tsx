import { describe, expect, it } from "vitest";
import { validateDocTemplate } from "../../scripts/doc-template.mjs";

const item = { name: "fixture", meta: { tier: "T0" } };
const catalog = { fixture: ["sizes"] };
const example = `## Sizes

Compare the compact and default forms.

<ComponentExample name="sizes" />

\`\`\`tsx
import { Fixture } from "@/components/cadence/fixture";

export function Sizes() { return <Fixture />; }
\`\`\`
`;
const body = `## Installation

Install it.

## Usage

Use it.

${example}
## When to use

For a fixture.

## When not to use

Other tasks.

## API

No extra props.

## Motion contract

Static.

## Accessibility

Native semantics.

## Responsiveness and performance

Caller sizes it.

## Notes for AI

Keep it simple.
`;
const validate = (source: string, entries: Record<string, string[]> = catalog) =>
  validateDocTemplate(source, item, "fixture.mdx", entries);

describe("named component example contract", () => {
  it("accepts a fixed named preview with explanation and runnable code", () => {
    expect(validate(body)).toEqual([]);
  });

  it.each([
    ["unknown id", body.replace('name="sizes"', 'name="missing"'), "unknown component example fixture/missing"],
    ["missing preview", body.replace('<ComponentExample name="sizes" />', ""), "needs a ComponentExample"],
    ["missing code", body.replace(/```tsx[\s\S]*?```/, ""), "needs runnable tsx example code with imports"],
    ["missing imports", body.replace('import { Fixture } from "@/components/cadence/fixture";', ""), "with imports"],
    ["missing explanation", body.replace("Compare the compact and default forms.", ""), "needs an explanation"],
    ["dynamic id", body.replace('name="sizes"', 'name={"sizes"}'), "standalone <ComponentExample"],
    ["cross-component reference", body.replace('name="sizes"', 'id="button" name="sizes"'), "standalone"],
    [
      "extra section",
      body.replace("## When to use", "## Another form\n\nText.\n\n## When to use"),
      "needs a ComponentExample",
    ],
    [
      "late reference",
      `${body.replace('<ComponentExample name="sizes" />', "")}\n<ComponentExample name="sizes" />`,
      "after Usage and before When to use",
    ],
    [
      "commented preview",
      body.replace('<ComponentExample name="sizes" />', '<!-- <ComponentExample name="sizes" /> -->'),
      "needs a ComponentExample",
    ],
    [
      "preview only in code",
      body.replace('<ComponentExample name="sizes" />', '```md\n<ComponentExample name="sizes" />\n```'),
      "needs a ComponentExample",
    ],
  ])("rejects %s", (_, source, diagnostic) => {
    expect(validate(source).join("\n")).toContain(diagnostic);
  });

  it("does not certify unmigrated pages and rejects unregistered references", () => {
    expect(validate(body, {}).join("\n")).toContain("unknown component example fixture/sizes");
    expect(validate(body.replace('<ComponentExample name="sizes" />', ""), {})).toEqual([]);
  });
});
