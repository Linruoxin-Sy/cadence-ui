import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxList } from "@/registry/cadence/combobox";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/registry/cadence/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/registry/cadence/dropdown-menu";
import { duration, reducedDurationScale } from "@/registry/cadence/lib/motion";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger } from "@/registry/cadence/menubar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/cadence/select";
import {
  createToastManager,
  Toast,
  ToastPortal,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  useToastManager,
} from "@/registry/cadence/toast";
import { parameterCalls } from "../motion-observer";

it("Combobox guards hidden tab stops without inert and restores caller ownership", async () => {
  const view = render(
    <CadenceProvider mode="none">
      <button type="button" data-testid="outside">
        Outside
      </button>
      {/* biome-ignore lint/a11y/noAriaHiddenOnFocusable: deliberately pre-existing caller state must remain caller-owned. */}
      {/* biome-ignore lint/a11y/noPositiveTabindex: non-default caller value makes restoration observable. */}
      <button type="button" aria-hidden="true" tabIndex={3} data-testid="hidden">
        Hidden
      </button>
      {/* biome-ignore lint/a11y/noPositiveTabindex: deliberately preserved caller value on an inert node. */}
      <button type="button" inert tabIndex={4} data-testid="inert">
        Inert
      </button>
      <Combobox items={["Alpha"]}>
        <ComboboxInput aria-label="Guard" />
        <ComboboxContent>
          <ComboboxList>
            {(value: string) => (
              <ComboboxItem key={value} value={value}>
                {value}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </CadenceProvider>,
  );
  await userEvent.click(screen.getByRole("combobox"));
  const outside = screen.getByTestId("outside");
  await waitFor(() => expect(outside).toHaveAttribute("tabindex", "-1"));
  expect(outside).not.toHaveAttribute("inert");
  expect(screen.getByTestId("hidden")).toHaveAttribute("tabindex", "3");
  expect(screen.getByTestId("inert")).toHaveAttribute("tabindex", "4");
  outside.setAttribute("tabindex", "2");
  fireEvent.keyDown(screen.getByRole("combobox"), { key: "Tab" });
  expect(outside).toHaveAttribute("tabindex", "2");
  view.unmount();
  expect(outside).toHaveAttribute("tabindex", "2");
});

it("SelectTrigger retains its internal DOM ref while React19 caller refs change", async () => {
  const firstCleanup = vi.fn();
  const secondCleanup = vi.fn();
  const first = vi.fn(() => firstCleanup);
  const second = vi.fn(() => secondCleanup);
  const tree = (updated: boolean) => (
    <CadenceProvider mode="none">
      <Select value="a">
        <SelectTrigger ref={updated ? second : first}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Alpha</SelectItem>
        </SelectContent>
      </Select>
    </CadenceProvider>
  );
  const view = render(tree(false));
  const trigger = screen.getByRole("combobox");
  trigger.focus();
  view.rerender(tree(true));
  expect(screen.getByRole("combobox")).toBe(trigger);
  expect(trigger).toHaveFocus();
  expect(firstCleanup).toHaveBeenCalledTimes(1);
  expect(second).toHaveBeenCalledWith(trigger);
  await userEvent.keyboard("{ArrowDown}");
  expect(await screen.findByRole("option")).toHaveTextContent("Alpha");
  view.unmount();
  expect(secondCleanup).toHaveBeenCalledTimes(1);
});

it("dropdown-menu preserves typed callbacks, render, refs, events, controlled updates and local clock", () => {
  const cleanup = vi.fn();
  const ref = vi.fn(() => cleanup);
  const key = vi.fn();
  const contentProps: import("react").ComponentProps<typeof DropdownMenuContent> = {
    className: () => "callback p-8 shadow-none",
    style: () => ({ opacity: 0.9 }),
    ref,
    onKeyDown: (e) => key(e.nativeEvent.type),
    render: (props) => <section {...props} data-render="function" />,
  };
  function example(mode: "full" | "reduced" | "none" = "full", open = true) {
    return (
      <CadenceProvider mode="none">
        <CadenceProvider mode={mode} timeScale={2}>
          <DropdownMenu open={open}>
            <DropdownMenuTrigger>Open</DropdownMenuTrigger>
            <DropdownMenuContent {...contentProps}>
              <DropdownMenuItem className={() => "item-callback p-8"}>One</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CadenceProvider>
      </CadenceProvider>
    );
  }
  const view = render(example());
  const node = document.querySelector('[data-slot="dropdown-menu-content"]') as HTMLElement;
  expect(node.tagName).toBe("SECTION");
  expect(node).toHaveClass("callback", "p-8", "shadow-none");
  expect(node.style.opacity).toBe("0.9");
  expect(node.style.getPropertyValue("--motion-duration-fast")).toBe("0.32s");
  expect(node.querySelector(".item-callback")).toBeInTheDocument();
  fireEvent.keyDown(node, { key: "a" });
  expect(key).toHaveBeenCalledWith("keydown");
  for (const mode of ["reduced", "none", "full"] as const) {
    view.rerender(example(mode));
    expect(document.querySelector('[data-slot="dropdown-menu-content"]')).toBe(node);
    expect(node).toHaveAttribute("data-motion", mode);
    if (mode === "none") {
      expect(node.className).toContain("transition-none");
      expect(node.className).not.toMatch(/data-(?:\[starting-style\]|starting-style):[^ ]*opacity-0/);
      expect(node.style.getPropertyValue("--motion-duration-fast")).toBe("0s");
    }
    if (mode === "reduced") expect(node.className).toContain("transition-opacity");
  }
  view.rerender(example("none", false));
  view.unmount();
  expect(cleanup).toHaveBeenCalled();
});
it("context-menu preserves typed callbacks, render, refs, events, controlled updates and local clock", () => {
  const cleanup = vi.fn();
  const ref = vi.fn(() => cleanup);
  const key = vi.fn();
  const contentProps: import("react").ComponentProps<typeof ContextMenuContent> = {
    className: () => "callback p-8 shadow-none",
    style: () => ({ opacity: 0.9 }),
    ref,
    onKeyDown: (e) => key(e.nativeEvent.type),
    render: (props) => <section {...props} data-render="function" />,
  };
  function example(mode: "full" | "reduced" | "none" = "full", open = true) {
    return (
      <CadenceProvider mode="none">
        <CadenceProvider mode={mode} timeScale={2}>
          <ContextMenu open={open}>
            <ContextMenuTrigger>Open</ContextMenuTrigger>
            <ContextMenuContent {...contentProps}>
              <ContextMenuItem className={() => "item-callback p-8"}>One</ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </CadenceProvider>
      </CadenceProvider>
    );
  }
  const view = render(example());
  const node = document.querySelector('[data-slot="context-menu-content"]') as HTMLElement;
  expect(node.tagName).toBe("SECTION");
  expect(node).toHaveClass("callback", "p-8", "shadow-none");
  expect(node.style.opacity).toBe("0.9");
  expect(node.style.getPropertyValue("--motion-duration-fast")).toBe("0.32s");
  expect(node.querySelector(".item-callback")).toBeInTheDocument();
  fireEvent.keyDown(node, { key: "a" });
  expect(key).toHaveBeenCalledWith("keydown");
  for (const mode of ["reduced", "none", "full"] as const) {
    view.rerender(example(mode));
    expect(document.querySelector('[data-slot="context-menu-content"]')).toBe(node);
    expect(node).toHaveAttribute("data-motion", mode);
    if (mode === "none") {
      expect(node.className).toContain("transition-none");
      expect(node.className).not.toMatch(/data-(?:\[starting-style\]|starting-style):[^ ]*opacity-0/);
      expect(node.style.getPropertyValue("--motion-duration-fast")).toBe("0s");
    }
    if (mode === "reduced") expect(node.className).toContain("transition-opacity");
  }
  view.rerender(example("none", false));
  view.unmount();
  expect(cleanup).toHaveBeenCalled();
});
it("menubar preserves typed callbacks, render, refs, events, controlled updates and local clock", () => {
  const cleanup = vi.fn();
  const ref = vi.fn(() => cleanup);
  const key = vi.fn();
  const contentProps: import("react").ComponentProps<typeof MenubarContent> = {
    className: () => "callback p-8 shadow-none",
    style: () => ({ opacity: 0.9 }),
    ref,
    onKeyDown: (e) => key(e.nativeEvent.type),
    render: (props) => <section {...props} data-render="function" />,
  };
  function example(mode: "full" | "reduced" | "none" = "full", open = true) {
    return (
      <CadenceProvider mode="none">
        <CadenceProvider mode={mode} timeScale={2}>
          <Menubar>
            <MenubarMenu open={open}>
              <MenubarTrigger>Open</MenubarTrigger>
              <MenubarContent {...contentProps}>
                <MenubarItem className={() => "item-callback p-8"}>One</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </CadenceProvider>
      </CadenceProvider>
    );
  }
  const view = render(example());
  const node = document.querySelector('[data-slot="menubar-content"]') as HTMLElement;
  expect(node.tagName).toBe("SECTION");
  expect(node).toHaveClass("callback", "p-8", "shadow-none");
  expect(node.style.opacity).toBe("0.9");
  expect(node.style.getPropertyValue("--motion-duration-fast")).toBe("0.32s");
  expect(node.querySelector(".item-callback")).toBeInTheDocument();
  fireEvent.keyDown(node, { key: "a" });
  expect(key).toHaveBeenCalledWith("keydown");
  for (const mode of ["reduced", "none", "full"] as const) {
    view.rerender(example(mode));
    expect(document.querySelector('[data-slot="menubar-content"]')).toBe(node);
    expect(node).toHaveAttribute("data-motion", mode);
    if (mode === "none") {
      expect(node.className).toContain("transition-none");
      expect(node.className).not.toMatch(/data-(?:\[starting-style\]|starting-style):[^ ]*opacity-0/);
      expect(node.style.getPropertyValue("--motion-duration-fast")).toBe("0s");
    }
    if (mode === "reduced") expect(node.className).toContain("transition-opacity");
  }
  view.rerender(example("none", false));
  view.unmount();
  expect(cleanup).toHaveBeenCalled();
});
it("select preserves typed callbacks, render, refs, events, controlled updates and local clock", () => {
  const cleanup = vi.fn();
  const ref = vi.fn(() => cleanup);
  const key = vi.fn();
  const contentProps: import("react").ComponentProps<typeof SelectContent> = {
    className: () => "callback p-8 shadow-none",
    style: () => ({ opacity: 0.9 }),
    ref,
    onKeyDown: (e) => key(e.nativeEvent.type),
    render: (props) => <section {...props} data-render="function" />,
  };
  function example(mode: "full" | "reduced" | "none" = "full", open = true) {
    return (
      <CadenceProvider mode="none">
        <CadenceProvider mode={mode} timeScale={2}>
          <Select open={open} value="one">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent {...contentProps}>
              <SelectItem value="one" className={() => "item-callback p-8"}>
                One
              </SelectItem>
            </SelectContent>
          </Select>
        </CadenceProvider>
      </CadenceProvider>
    );
  }
  const view = render(example());
  const node = document.querySelector('[data-slot="select-content"]') as HTMLElement;
  expect(node.tagName).toBe("SECTION");
  expect(node).toHaveClass("callback", "p-8", "shadow-none");
  expect(node.style.opacity).toBe("0.9");
  const expectNativeClock = (mode: "full" | "reduced" | "none") => {
    const policy = parameterCalls
      .filter((call) => call.form === "popup.anchored/presence" && call.origin?.exports.includes("SelectContent"))
      .at(-1);
    expect(policy?.mode).toBe(mode);
    const parameters = policy?.result as {
      kind: string;
      opacity: { duration: number };
      spatial: { duration?: number };
    };
    expect(parameters.kind).toBe("visual");
    expect(parameters.opacity.duration).toBeCloseTo(
      mode === "none" ? 0 : duration.base * 2 * (mode === "reduced" ? reducedDurationScale : 1),
    );
    if (mode !== "full") expect(parameters.spatial.duration).toBe(0);
    expect(node.style.getPropertyValue("--cadence-time-scale")).toBe("2");
    expect(node.style.opacity).toBe("0.9");
    // The caller's opacity remains authoritative; policy resolution cannot
    // authorize an independent timed appearance writer on that property.
    expect(
      node
        .getAnimations?.()
        .some(
          (animation) =>
            animation.playState === "running" &&
            (animation.effect as KeyframeEffect | null)?.getKeyframes().some((frame) => "opacity" in frame),
        ) ?? false,
    ).toBe(false);
  };
  expectNativeClock("full");
  expect(node.querySelector(".item-callback")).toBeInTheDocument();
  fireEvent.keyDown(node, { key: "a" });
  expect(key).toHaveBeenCalledWith("keydown");
  for (const mode of ["reduced", "none", "full"] as const) {
    view.rerender(example(mode));
    expect(document.querySelector('[data-slot="select-content"]')).toBe(node);
    expect(node).toHaveAttribute("data-motion", mode);
    expectNativeClock(mode);
    if (mode === "none") expect(node.style.transitionDuration).toBe("0s");
  }
  view.rerender(example("none", false));
  view.unmount();
  expect(cleanup).toHaveBeenCalled();
});
it("combobox preserves typed callbacks, render, refs, events, controlled updates and local clock", () => {
  const cleanup = vi.fn();
  const ref = vi.fn(() => cleanup);
  const key = vi.fn();
  const contentProps: import("react").ComponentProps<typeof ComboboxContent> = {
    className: () => "callback p-8 shadow-none",
    style: () => ({ opacity: 0.9 }),
    ref,
    onKeyDown: (e) => key(e.nativeEvent.type),
    render: (props) => <section {...props} data-render="function" />,
  };
  function example(mode: "full" | "reduced" | "none" = "full", open = true) {
    return (
      <CadenceProvider mode="none">
        <CadenceProvider mode={mode} timeScale={2}>
          <Combobox open={open} items={["one"]}>
            <ComboboxInput aria-label="Input" />
            <ComboboxContent {...contentProps}>
              <ComboboxList>
                <ComboboxItem value="one" className={() => "item-callback p-8"}>
                  One
                </ComboboxItem>
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </CadenceProvider>
      </CadenceProvider>
    );
  }
  const view = render(example());
  const node = document.querySelector('[data-slot="combobox-content"]') as HTMLElement;
  expect(node.tagName).toBe("SECTION");
  expect(node).toHaveClass("callback", "p-8", "shadow-none");
  expect(node.style.opacity).toBe("0.9");
  expect(node.style.getPropertyValue("--motion-duration-fast")).toBe("0.32s");
  expect(node.querySelector(".item-callback")).toBeInTheDocument();
  fireEvent.keyDown(node, { key: "a" });
  expect(key).toHaveBeenCalledWith("keydown");
  for (const mode of ["reduced", "none", "full"] as const) {
    view.rerender(example(mode));
    expect(document.querySelector('[data-slot="combobox-content"]')).toBe(node);
    expect(node).toHaveAttribute("data-motion", mode);
    if (mode === "none") {
      expect(node.className).toContain("transition-none");
      expect(node.className).not.toMatch(/data-(?:\[starting-style\]|starting-style):[^ ]*opacity-0/);
      expect(node.style.getPropertyValue("--motion-duration-fast")).toBe("0s");
    }
    if (mode === "reduced") expect(node.className).toContain("transition-opacity");
  }
  view.rerender(example("none", false));
  view.unmount();
  expect(cleanup).toHaveBeenCalled();
});

it("Select trigger keeps internal measurement ref and caller React 19 ref cleanup", async () => {
  const cleanup = vi.fn();
  const ref = vi.fn(() => cleanup);
  const click = vi.fn();
  const view = render(
    <CadenceProvider mode="none">
      <Select defaultValue="one">
        <SelectTrigger
          ref={ref}
          className={(s) => (s.open ? "opened" : "closed")}
          onClick={(e) => click(e.nativeEvent.type)}
          render={<button type="button" />}
        >
          <SelectValue className={() => "value-callback"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="one">One</SelectItem>
          <SelectItem value="two">Two</SelectItem>
        </SelectContent>
      </Select>
    </CadenceProvider>,
  );
  const trigger = document.querySelector('[data-slot="select-trigger"]') as HTMLElement;
  expect(trigger).toHaveClass("closed");
  expect(trigger.querySelector(".value-callback")).toBeInTheDocument();
  fireEvent.click(trigger);
  expect(click).toHaveBeenCalledWith("click");
  view.unmount();
  expect(cleanup).toHaveBeenCalled();
});

it("toast preserves real root state callbacks, render element, ref cleanup and live local clock", async () => {
  const manager = createToastManager();
  const cleanup = vi.fn();
  const ref = vi.fn(() => cleanup);
  function example(mode: "full" | "reduced" | "none" = "full") {
    return (
      <CadenceProvider mode="none">
        <CadenceProvider mode={mode} timeScale={2}>
          <ToastProvider toastManager={manager} timeout={0}>
            <ToastPortal>
              <ToastViewport>
                <ToastCallbackList toastRef={ref} />
              </ToastViewport>
            </ToastPortal>
          </ToastProvider>
        </CadenceProvider>
      </CadenceProvider>
    );
  }
  const view = render(example());
  act(() => {
    manager.add({ title: "Saved callback", type: "success" });
  });
  await screen.findByText("Saved callback");
  const node = document.querySelector('[data-slot="toast"]') as HTMLElement;
  expect(node.tagName).toBe("SECTION");
  expect(node).toHaveClass("callback", "p-8");
  expect(node.style.opacity).toBe("0.9");
  expect(node.style.getPropertyValue("--motion-duration-base")).toBe("0.44s");
  for (const mode of ["reduced", "none", "full"] as const) {
    view.rerender(example(mode));
    expect(document.querySelector('[data-slot="toast"]')).toBe(node);
    expect(node).toHaveAttribute("data-motion", mode);
    if (mode === "none") expect(node.className).toContain("transition-none");
  }
  view.unmount();
  expect(cleanup).toHaveBeenCalled();
});

function ToastCallbackList({ toastRef }: { toastRef: import("react").Ref<HTMLDivElement> }) {
  const { toasts } = useToastManager();
  return toasts.map((t) => (
    <Toast
      key={t.id}
      toast={t}
      ref={toastRef}
      render={<section />}
      className={(s) => (s.type === "success" ? "p-8 callback" : "p-2")}
      style={(s) => ({ opacity: s.type === "success" ? 0.9 : 1 })}
    >
      <ToastTitle />
    </Toast>
  ));
}

it("Select does not hand off a pointer label when the caller cancels selection", async () => {
  const view = render(
    <CadenceProvider mode="full">
      <Select defaultValue="one" onValueChange={(_, details) => details.cancel()}>
        <SelectTrigger aria-label="Cancel selection">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="one">One</SelectItem>
          <SelectItem value="two">Two</SelectItem>
        </SelectContent>
      </Select>
    </CadenceProvider>,
  );
  await userEvent.click(screen.getByRole("combobox", { name: "Cancel selection" }));
  const option = await screen.findByRole("option", { name: "Two" });
  const trigger = screen.getByRole("combobox", { name: "Cancel selection" });
  const rect = { left: 10, top: 20, width: 100, height: 20, right: 110, bottom: 40, x: 10, y: 20, toJSON: () => ({}) };
  Object.defineProperty(option.querySelector('[data-slot="select-item-text"]'), "getBoundingClientRect", {
    value: () => rect,
  });
  Object.defineProperty(
    trigger.querySelector('[data-slot="select-value"]')?.firstElementChild,
    "getBoundingClientRect",
    { value: () => rect },
  );
  await userEvent.click(await screen.findByRole("option", { name: "Two" }));
  expect(screen.getByRole("combobox", { name: "Cancel selection" })).toHaveTextContent("One");
  expect(document.querySelector('[data-slot="select-handoff"]')).toBeNull();
  view.unmount();
});
