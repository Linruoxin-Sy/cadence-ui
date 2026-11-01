import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/registry/cadence/navigation-menu";

function Items() {
  return (
    <NavigationMenuList>
      <NavigationMenuItem value="one">
        <NavigationMenuTrigger>
          Learn
          <NavigationMenuIndicator />
        </NavigationMenuTrigger>
        <NavigationMenuContent keepMounted>
          <NavigationMenuLink href="#docs">Docs</NavigationMenuLink>
          <input aria-label="Retained" />
        </NavigationMenuContent>
      </NavigationMenuItem>
      <NavigationMenuItem value="two">
        <NavigationMenuTrigger>Build</NavigationMenuTrigger>
        <NavigationMenuContent>
          <NavigationMenuLink href="#api">API</NavigationMenuLink>
        </NavigationMenuContent>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuTrigger disabled>Disabled</NavigationMenuTrigger>
      </NavigationMenuItem>
    </NavigationMenuList>
  );
}
describe("NavigationMenu", () => {
  for (const mode of ["full", "reduced", "none"] as const) {
    it(`keeps popup lifecycle and keyboard semantics in ${mode}`, async () => {
      const user = userEvent.setup();
      const view = render(
        <CadenceProvider mode={mode}>
          <NavigationMenu aria-label="Main">
            <Items />
          </NavigationMenu>
        </CadenceProvider>,
      );
      const trigger = screen.getByRole("button", { name: "Learn" });
      await user.click(trigger);
      const popup = document.querySelector('[data-slot="navigation-menu-popup"]');
      const content = screen.getByRole("link", { name: "Docs" }).closest('[data-slot="navigation-menu-content"]');
      expect(popup).toHaveAttribute("data-motion", mode);
      expect(content).toHaveAttribute("data-motion", mode);
      if (mode !== "full") expect(popup?.className).not.toContain("data-starting-style:scale-");
      expect(trigger).toHaveAttribute("aria-expanded", "true");
      await user.type(screen.getByLabelText("Retained"), "saved");
      expect(screen.getByLabelText("Retained")).toHaveValue("saved");
      view.rerender(
        <CadenceProvider mode="none">
          <NavigationMenu aria-label="Main">
            <Items />
          </NavigationMenu>
        </CadenceProvider>,
      );
      expect(document.querySelector('[data-slot="navigation-menu-popup"]')).toBe(popup);
      expect(popup).toHaveAttribute("data-motion", "none");
      await user.keyboard("{Escape}");
      await waitFor(() => expect(trigger).toHaveFocus());
      expect(screen.getByRole("button", { name: "Disabled" })).toHaveAttribute("aria-disabled", "true");
      await user.click(screen.getByRole("button", { name: "Disabled" }));
      expect(screen.getByRole("button", { name: "Disabled" })).toHaveAttribute("aria-expanded", "false");
    });
  }
  it("preserves refs, render, state callback classes/styles and cancellable controlled changes", async () => {
    const user = userEvent.setup();
    const triggerRef = createRef<HTMLButtonElement>();
    const contentRef = createRef<HTMLDivElement>();
    const change = vi.fn((_value, details) => details.cancel());
    const tree = (controlled: boolean) => (
      <NavigationMenu
        aria-label="Custom"
        {...(controlled ? { value: "one", onValueChange: change } : { defaultValue: "one" })}
        className={(s) => (s.open ? "caller-root" : "")}
      >
        <NavigationMenuList>
          <NavigationMenuItem value="one">
            <NavigationMenuTrigger
              ref={triggerRef}
              render={<button type="button" />}
              className={(s) => (s.open ? "caller-trigger" : "")}
            >
              Open
            </NavigationMenuTrigger>
            <NavigationMenuContent
              ref={contentRef}
              className={(s) => (s.open ? "caller-content w-72" : "")}
              style={(s) => ({ color: s.open ? "red" : "blue" })}
            >
              <NavigationMenuLink active render={<a href="#custom" />}>
                Custom link
              </NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    );
    render(tree(true));
    const trigger = screen.getByRole("button", { name: "Open" });
    expect(triggerRef.current).toBe(trigger);
    expect(trigger).toHaveClass("caller-trigger");
    const content = screen.getByRole("link", { name: "Custom link" }).parentElement;
    expect(contentRef.current).toBe(content);
    expect(content).toHaveClass("caller-content", "w-72");
    expect(content).toHaveStyle({ color: "rgb(255, 0, 0)" });
    await user.click(trigger);
    expect(change).toHaveBeenCalled();
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Custom link" })).toHaveAttribute("href", "#custom");
  });
});

it("keeps root ref cleanup, actions, native style overrides and retained switch state", async () => {
  const user = userEvent.setup();
  const cleanup = vi.fn();
  const rootRef = vi.fn(() => cleanup);
  const actions = createRef<{ close: () => void; unmount: () => void }>();
  const tree = (value: string) => (
    <CadenceProvider mode="none">
      <NavigationMenu
        ref={rootRef}
        actionsRef={actions}
        value={value}
        aria-label="Retained menu"
        style={(state) => ({ color: state.open ? "red" : "blue" })}
      >
        <Items />
      </NavigationMenu>
    </CadenceProvider>
  );
  const view = render(tree("one"));
  expect(rootRef).toHaveBeenCalledWith(screen.getByRole("navigation", { name: "Retained menu" }));
  await user.type(screen.getByLabelText("Retained"), "saved");
  const input = screen.getByLabelText("Retained");
  view.rerender(tree("two"));
  view.rerender(tree("one"));
  expect(screen.getByLabelText("Retained")).toBe(input);
  expect(input).toHaveValue("saved");
  expect(document.querySelector('[data-slot="navigation-menu-content"]')?.className).not.toContain(
    "data-starting-style:opacity-0",
  );
  expect(actions.current?.close).toBeTypeOf("function");
  act(() => actions.current?.close());
  view.unmount();
  expect(cleanup).toHaveBeenCalledTimes(1);
});
