import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ComponentCatalog } from "@/components/site/component-catalog";
import { Sidebar } from "@/components/site/sidebar";
import { CadenceProvider } from "@/registry/cadence/lib/provider";

vi.mock("next/navigation", () => ({ usePathname: () => "/components/button" }));

describe("catalogue and site navigation", () => {
  it("retains real multi-category results and recovers focused results on history", () => {
    window.history.replaceState({ test: true }, "", "/components");
    const { container } = render(
      <ComponentCatalog
        components={[
          {
            slug: "button",
            title: "Button",
            description: "Commands",
            categories: ["form", "feedback"],
            intensity: "subtle",
            complexity: "S",
          },
          {
            slug: "select",
            title: "Select",
            description: "Choices",
            categories: ["form"],
            intensity: "expressive",
            complexity: "L",
          },
        ]}
      />,
    );
    const button = container.querySelector('a[href="/components/button"]') as HTMLAnchorElement;
    button.focus();
    window.history.pushState({ test: true }, "", "/components?category=form&intensity=expressive");
    fireEvent.popState(window);
    expect(button.closest("[hidden]")).not.toBeNull();
    expect(screen.getByRole("searchbox")).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(button.closest("[hidden]")).toBeNull();
    expect(window.history.state).toEqual({ test: true });
  });
  for (const mode of ["full", "reduced", "none"] as const)
    it(`keeps regions, IDs, nested state and mode ${mode}`, () => {
      const { container } = render(
        <CadenceProvider mode={mode}>
          <Sidebar
            groups={[{ id: "B1", title: "Atoms", components: [{ slug: "button", title: "Button" }] }]}
            guides={[{ slug: "motion", title: "Motion" }]}
          />
        </CadenceProvider>,
      );
      const navigation = screen.getAllByRole("navigation", { name: "Documentation", hidden: true });
      const buttons = navigation.map((nav) => within(nav).getByRole("button", { name: "Atoms 1" }));
      if (!buttons[0] || !navigation[0]) throw new Error("Missing navigation");
      const ids = buttons.map((button) => button.getAttribute("aria-controls"));
      expect(new Set(ids).size).toBe(2);
      const panel = container.querySelector(`[id="${ids[0]}"]`);
      fireEvent.click(buttons[0]);
      expect(panel).toHaveAttribute("inert");
      expect(panel).toHaveAttribute("data-motion", mode);
      expect(within(navigation[0]).getByRole("link", { name: "Button", hidden: true })).toHaveAttribute(
        "aria-current",
        "page",
      );
      fireEvent.click(buttons[0]);
      expect(container.querySelector(`[id="${ids[0]}"]`)).toBe(panel);
      expect(panel).not.toHaveAttribute("inert");
    });
});
