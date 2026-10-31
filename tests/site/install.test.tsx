import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { INSTALL_FENCE, installCommands, installTarget } from "@/components/site/install";

/** What a component page's Installation section holds, newline included. */
const FENCE = "npx shadcn@latest add @cadence/button\n";

describe("installTarget", () => {
  it("reads the registry item a fence installs", () => {
    expect(installTarget(FENCE)).toBe("@cadence/button");
    expect(installTarget("pnpm dlx shadcn@latest add @cadence/input-otp")).toBe("@cadence/input-otp");
  });

  it("leaves anything else alone", () => {
    // `init` is not an install, and a different CLI is not ours to rewrite.
    expect(installTarget("npx shadcn@latest init -b base-ui")).toBeNull();
    expect(installTarget("pnpm add motion")).toBeNull();
    expect(installTarget("")).toBeNull();
  });
});

describe("installCommands", () => {
  it("restates one install as three, pnpm first", () => {
    expect(installCommands(FENCE)).toEqual([
      { value: "pnpm", label: "pnpm", command: "pnpm dlx shadcn@latest add @cadence/button" },
      { value: "npm", label: "npm", command: "npx shadcn@latest add @cadence/button" },
      { value: "yarn", label: "yarn", command: "yarn dlx shadcn@latest add @cadence/button" },
    ]);
  });

  it("keeps the runner pin the fence wrote, so the page cannot drift from the CLI", () => {
    expect(installCommands("npx shadcn@2.1.0 add @cadence/button\n")[0]?.command).toBe(
      "pnpm dlx shadcn@2.1.0 add @cadence/button",
    );
  });

  it("returns nothing for a fence it cannot read, so the caller keeps a terminal block", () => {
    expect(installCommands("ls -la")).toEqual([]);
  });
});

describe("the component docs", () => {
  it(`mark their Installation fence as \`${INSTALL_FENCE}\`, which is what turns it into the switcher`, async () => {
    const dir = path.join(process.cwd(), "content", "components");
    const files = (await readdir(dir)).filter((file) => file.endsWith(".mdx"));

    const offenders: string[] = [];
    for (const file of files) {
      const body = await readFile(path.join(dir, file), "utf8");
      const section = body.split("## Installation")[1]?.split("## ")[0] ?? "";
      if (!section.includes(`\`\`\`${INSTALL_FENCE}`)) offenders.push(file);
    }

    expect(files.length).toBeGreaterThan(30);
    expect(offenders).toEqual([]);
  });
});
