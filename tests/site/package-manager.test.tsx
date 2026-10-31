import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  hasPackageManagerCommand,
  INSTALL_FENCE,
  installTarget,
  PACKAGE_MANAGER_FENCE,
  PACKAGE_MANAGERS,
  packageManagerCommands,
} from "@/components/site/package-manager";

/** What a component page's Installation section holds, newline included. */
const FENCE = "npx shadcn@latest add @cadence/button\n";

/** The fence the installation guide opens with: create, `cd`, initialize. */
const SETUP = "npx create-next-app@latest my-app --ts --tailwind --app\ncd my-app\nnpx shadcn@latest init -b base-ui\n";

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

describe("packageManagerCommands", () => {
  it("restates one install as three, pnpm first", () => {
    expect(packageManagerCommands(FENCE)).toEqual([
      { value: "pnpm", label: "pnpm", command: "pnpm dlx shadcn@latest add @cadence/button" },
      { value: "npm", label: "npm", command: "npx shadcn@latest add @cadence/button" },
      { value: "yarn", label: "yarn", command: "yarn dlx shadcn@latest add @cadence/button" },
    ]);
  });

  it("keeps the runner pin the fence wrote, so the page cannot drift from the CLI", () => {
    expect(packageManagerCommands("npx shadcn@2.1.0 add @cadence/button\n")[0]?.command).toBe(
      "pnpm dlx shadcn@2.1.0 add @cadence/button",
    );
  });

  it("rewrites every package-manager line of a sequence and leaves the rest alone", () => {
    const [pnpm, npm, yarn] = packageManagerCommands(SETUP);

    expect(pnpm?.command).toBe(
      "pnpm dlx create-next-app@latest my-app --ts --tailwind --app\ncd my-app\npnpm dlx shadcn@latest init -b base-ui",
    );
    // The canonical form is `npx`, so npm's panel is the source with its `cd` line intact.
    expect(npm?.command).toBe(SETUP.trimEnd());
    expect(yarn?.command).toBe(
      "yarn dlx create-next-app@latest my-app --ts --tailwind --app\ncd my-app\nyarn dlx shadcn@latest init -b base-ui",
    );
  });

  it("speaks each manager's verb for adding packages", () => {
    const commands = packageManagerCommands("npm install motion lucide-react @base-ui/react\n");

    expect(commands.map((entry) => entry.command)).toEqual([
      "pnpm add motion lucide-react @base-ui/react",
      "npm install motion lucide-react @base-ui/react",
      "yarn add motion lucide-react @base-ui/react",
    ]);
  });

  it("recognises a command whichever manager wrote it", () => {
    for (const source of [
      "npx create-vite@latest my-app\n",
      "pnpm dlx create-vite@latest my-app\n",
      "yarn dlx create-vite@latest my-app\n",
      "pnpm add motion\n",
      "npm i motion\n",
      "yarn add motion\n",
    ]) {
      expect(hasPackageManagerCommand(source)).toBe(true);
    }
  });

  it("returns nothing for a fence it cannot read, so the caller keeps a terminal block", () => {
    expect(packageManagerCommands("ls -la")).toEqual([]);
    expect(packageManagerCommands("cd my-app")).toEqual([]);
    expect(packageManagerCommands("pnpm registry:check")).toEqual([]);
    expect(packageManagerCommands("npm run build")).toEqual([]);
    expect(packageManagerCommands("")).toEqual([]);
  });

  it("offers exactly the three managers the tabs show, in order", () => {
    expect(PACKAGE_MANAGERS.map((entry) => entry.value)).toEqual(["pnpm", "npm", "yarn"]);
  });
});

/** The fences in one markdown file, as `[info, source]` pairs. */
function fences(body: string): Array<[string, string]> {
  const found: Array<[string, string]> = [];
  let info: string | null = null;
  let source: string[] = [];

  for (const line of body.split("\n")) {
    if (!line.startsWith("```")) {
      if (info !== null) source.push(line);
      continue;
    }
    if (info === null) {
      info = line.slice(3).trim();
      source = [];
    } else {
      found.push([info, source.join("\n")]);
      info = null;
    }
  }

  return found;
}

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

describe("the installation guide", () => {
  it(`marks every package-manager fence as \`${PACKAGE_MANAGER_FENCE}\` and leaves no command in a plain bash fence`, async () => {
    const body = await readFile(path.join(process.cwd(), "content", "docs", "installation.mdx"), "utf8");
    const parsed = fences(body);

    expect(parsed.length).toBeGreaterThan(3);

    const unmarked: string[] = [];
    const unreadable: string[] = [];
    for (const [info, source] of parsed) {
      if (info === PACKAGE_MANAGER_FENCE) {
        // A marked fence the rewriter cannot read would render as a terminal block,
        // which is the silent fallback this test exists to catch.
        if (!packageManagerCommands(source).length) unreadable.push(source);
        continue;
      }
      // A plain shell fence must stay literal; one that installs something would show
      // a single manager's command and ignore the reader's choice.
      if (hasPackageManagerCommand(source)) unmarked.push(source);
    }

    expect(unreadable).toEqual([]);
    expect(unmarked).toEqual([]);
  });
});
