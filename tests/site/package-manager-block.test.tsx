import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PACKAGE_MANAGER_KEY, packageManagerCommands } from "@/components/site/package-manager";
import { PackageManagerBlock, type PackageManagerPanel } from "@/components/site/package-manager-block";
import { PackageManagerProvider } from "@/components/site/package-manager-preference";

/**
 * The block itself is the registry's code block; what this file proves is the part the
 * site adds — that every switcher renders one shared, remembered choice. The commands
 * are highlighted on the server, so `lines: null` exercises the plain-text path.
 */
const PANELS: PackageManagerPanel[] = packageManagerCommands("npx shadcn@latest add @cadence/button\n").map(
  (entry) => ({ ...entry, lines: null }),
);

function TwoBlocks() {
  return (
    <PackageManagerProvider>
      <PackageManagerBlock panels={PANELS} />
      <PackageManagerBlock panels={PANELS} />
    </PackageManagerProvider>
  );
}

/** Every block's tab list, in DOM order. */
function tabLists() {
  return screen.getAllByRole("tablist", { name: "Package manager" });
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("PackageManagerBlock", () => {
  it("renders a switcher per fence, all showing the default manager", () => {
    render(<TwoBlocks />);

    const lists = tabLists();
    expect(lists).toHaveLength(2);

    for (const list of lists) {
      expect(within(list).getByRole("tab", { name: "pnpm" })).toHaveAttribute("aria-selected", "true");
      expect(within(list).getByRole("tab", { name: "npm" })).toHaveAttribute("aria-selected", "false");
    }

    // One visible panel per block: the other variants are hidden, not unmounted.
    expect(screen.getAllByRole("tabpanel")).toHaveLength(2);
    for (const panel of screen.getAllByRole("tabpanel")) {
      expect(panel).toHaveTextContent("pnpm dlx shadcn@latest add @cadence/button");
    }
  });

  it("switches every block from one click and remembers the choice", async () => {
    const { unmount } = render(<TwoBlocks />);
    const [first] = tabLists();

    await userEvent.click(within(first as HTMLElement).getByRole("tab", { name: "npm" }));

    // The point of the shared context: the second block moved without being clicked.
    for (const list of tabLists()) {
      expect(within(list).getByRole("tab", { name: "npm" })).toHaveAttribute("aria-selected", "true");
      expect(within(list).getByRole("tab", { name: "pnpm" })).toHaveAttribute("aria-selected", "false");
    }
    for (const panel of screen.getAllByRole("tabpanel")) {
      expect(panel).toHaveTextContent("npx shadcn@latest add @cadence/button");
    }

    expect(localStorage.getItem(PACKAGE_MANAGER_KEY)).toBe("npm");

    // A new visit reads the stored value, so the reader does not choose twice.
    unmount();
    render(<TwoBlocks />);

    await waitFor(() => {
      for (const list of tabLists()) {
        expect(within(list).getByRole("tab", { name: "npm" })).toHaveAttribute("aria-selected", "true");
      }
    });
  });

  it("falls back to the default manager when the stored value is not one of the three", async () => {
    localStorage.setItem(PACKAGE_MANAGER_KEY, "bun");

    render(<TwoBlocks />);

    await waitFor(() => {
      for (const list of tabLists()) {
        expect(within(list).getByRole("tab", { name: "pnpm" })).toHaveAttribute("aria-selected", "true");
      }
    });
    // The stored value is ignored, not rewritten: a manager the switcher cannot show
    // falls back to the default until the reader makes a real choice.
    expect(localStorage.getItem(PACKAGE_MANAGER_KEY)).toBe("bun");
  });

  it("copies the command the shared selection is showing", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });

    render(<TwoBlocks />);

    await userEvent.click(within(tabLists()[0] as HTMLElement).getByRole("tab", { name: "yarn" }));
    await userEvent.click(screen.getAllByRole("button", { name: "Copy" })[1] as HTMLElement);

    expect(writeText).toHaveBeenLastCalledWith("yarn dlx shadcn@latest add @cadence/button");
  });
});
