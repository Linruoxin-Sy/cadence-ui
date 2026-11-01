import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { expect, it, vi } from "vitest";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/registry/cadence/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/registry/cadence/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle, DrawerTrigger } from "@/registry/cadence/drawer";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/registry/cadence/hover-card";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { Popover, PopoverContent, PopoverDescription, PopoverTitle, PopoverTrigger } from "@/registry/cadence/popover";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/registry/cadence/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/registry/cadence/tooltip";

it("dialog preserves callbacks, render, refs, native events, controlled updates and local mode clocks", () => {
  const cleanup = vi.fn();
  const ref = vi.fn(() => cleanup);
  const key = vi.fn();
  const contentProps: ComponentProps<typeof DialogContent> = {
    className: (state) => (state.open ? "w-80 p-8 shadow-none callback" : "closed"),
    style: (state) => ({ opacity: state.open ? 0.9 : 0.2 }),
    ref,
    onKeyDown: (event) => key(event.nativeEvent.type),
    render: (props) => <section {...props} data-render="function" />,
  };
  function example({ mode = "full", open = true }: { mode?: "full" | "reduced" | "none"; open?: boolean }) {
    return (
      <CadenceProvider mode="none">
        <CadenceProvider mode={mode} timeScale={2}>
          <Dialog open={open}>
            <DialogTrigger>Open dialog</DialogTrigger>
            <DialogContent {...contentProps}>
              <DialogTitle className={() => "text-xl title-callback"}>Title</DialogTitle>
              <DialogDescription className={() => "description-callback"}>Description</DialogDescription>
            </DialogContent>
          </Dialog>
        </CadenceProvider>
      </CadenceProvider>
    );
  }
  const view = render(example({}));
  const node = document.querySelector('[data-slot="dialog-content"]') as HTMLElement;
  expect(node.tagName).toBe("SECTION");
  expect(node).toHaveClass("callback", "w-80", "p-8", "shadow-none");
  expect(node).not.toHaveClass("w-72", "w-64", "p-4", "shadow-md");
  expect(node.style.opacity).toBe("0.9");
  expect(node.style.getPropertyValue("--motion-duration-fast")).toBe("0.32s");
  fireEvent.keyDown(node, { key: "a" });
  expect(key).toHaveBeenCalledWith("keydown");
  for (const mode of ["reduced", "none", "full"] as const) {
    view.rerender(example({ mode }));
    expect(document.querySelector('[data-slot="dialog-content"]')).toBe(node);
    expect(node).toHaveAttribute("data-motion", mode);
    if (mode !== "full") expect(node.className).toContain(mode === "none" ? "transition-none" : "transition-opacity");
    if (mode === "none") {
      expect(node.style.getPropertyValue("--motion-duration-fast")).toBe("0s");
      expect(node.className).not.toContain(":opacity-0");
    }
  }
  view.rerender(example({ open: false, mode: "none" }));
  expect(screen.queryByText("Content")).not.toBeInTheDocument();
  view.unmount();
  expect(cleanup).toHaveBeenCalled();
});

it("alert-dialog preserves callbacks, render, refs, native events, controlled updates and local mode clocks", () => {
  const cleanup = vi.fn();
  const ref = vi.fn(() => cleanup);
  const key = vi.fn();
  const contentProps: ComponentProps<typeof AlertDialogContent> = {
    className: (state) => (state.open ? "w-80 p-8 shadow-none callback" : "closed"),
    style: (state) => ({ opacity: state.open ? 0.9 : 0.2 }),
    ref,
    onKeyDown: (event) => key(event.nativeEvent.type),
    render: (props) => <section {...props} data-render="function" />,
  };
  function example({ mode = "full", open = true }: { mode?: "full" | "reduced" | "none"; open?: boolean }) {
    return (
      <CadenceProvider mode="none">
        <CadenceProvider mode={mode} timeScale={2}>
          <AlertDialog open={open}>
            <AlertDialogTrigger>Open alert-dialog</AlertDialogTrigger>
            <AlertDialogContent {...contentProps}>
              <AlertDialogTitle className={() => "text-xl title-callback"}>Title</AlertDialogTitle>
              <AlertDialogDescription className={() => "description-callback"}>Description</AlertDialogDescription>
            </AlertDialogContent>
          </AlertDialog>
        </CadenceProvider>
      </CadenceProvider>
    );
  }
  const view = render(example({}));
  const node = document.querySelector('[data-slot="alert-dialog-content"]') as HTMLElement;
  expect(node.tagName).toBe("SECTION");
  expect(node).toHaveClass("callback", "w-80", "p-8", "shadow-none");
  expect(node).not.toHaveClass("w-72", "w-64", "p-4", "shadow-md");
  expect(node.style.opacity).toBe("0.9");
  expect(node.style.getPropertyValue("--motion-duration-fast")).toBe("0.32s");
  fireEvent.keyDown(node, { key: "a" });
  expect(key).toHaveBeenCalledWith("keydown");
  for (const mode of ["reduced", "none", "full"] as const) {
    view.rerender(example({ mode }));
    expect(document.querySelector('[data-slot="alert-dialog-content"]')).toBe(node);
    expect(node).toHaveAttribute("data-motion", mode);
    if (mode !== "full") expect(node.className).toContain(mode === "none" ? "transition-none" : "transition-opacity");
    if (mode === "none") {
      expect(node.style.getPropertyValue("--motion-duration-fast")).toBe("0s");
      expect(node.className).not.toContain(":opacity-0");
    }
  }
  view.rerender(example({ open: false, mode: "none" }));
  expect(screen.queryByText("Content")).not.toBeInTheDocument();
  view.unmount();
  expect(cleanup).toHaveBeenCalled();
});

it("sheet preserves callbacks, render, refs, native events, controlled updates and local mode clocks", () => {
  const cleanup = vi.fn();
  const ref = vi.fn(() => cleanup);
  const key = vi.fn();
  const contentProps: ComponentProps<typeof SheetContent> = {
    className: (state) => (state.open ? "w-80 p-8 shadow-none callback" : "closed"),
    style: (state) => ({ opacity: state.open ? 0.9 : 0.2 }),
    ref,
    onKeyDown: (event) => key(event.nativeEvent.type),
    render: (props) => <section {...props} data-render="function" />,
  };
  function example({ mode = "full", open = true }: { mode?: "full" | "reduced" | "none"; open?: boolean }) {
    return (
      <CadenceProvider mode="none">
        <CadenceProvider mode={mode} timeScale={2}>
          <Sheet open={open}>
            <SheetTrigger>Open sheet</SheetTrigger>
            <SheetContent {...contentProps}>
              <SheetTitle className={() => "text-xl title-callback"}>Title</SheetTitle>
              <SheetDescription className={() => "description-callback"}>Description</SheetDescription>
            </SheetContent>
          </Sheet>
        </CadenceProvider>
      </CadenceProvider>
    );
  }
  const view = render(example({}));
  const node = document.querySelector('[data-slot="sheet-content"]') as HTMLElement;
  expect(node.tagName).toBe("SECTION");
  expect(node).toHaveClass("callback", "w-80", "p-8", "shadow-none");
  expect(node).not.toHaveClass("w-72", "w-64", "p-4", "shadow-md");
  expect(node.style.opacity).toBe("0.9");
  expect(node.style.getPropertyValue("--motion-duration-fast")).toBe("0.32s");
  fireEvent.keyDown(node, { key: "a" });
  expect(key).toHaveBeenCalledWith("keydown");
  for (const mode of ["reduced", "none", "full"] as const) {
    view.rerender(example({ mode }));
    expect(document.querySelector('[data-slot="sheet-content"]')).toBe(node);
    expect(node).toHaveAttribute("data-motion", mode);
    if (mode !== "full") expect(node.className).toContain(mode === "none" ? "transition-none" : "transition-opacity");
    if (mode === "none") {
      expect(node.style.getPropertyValue("--motion-duration-fast")).toBe("0s");
      expect(node.className).not.toContain(":opacity-0");
    }
  }
  view.rerender(example({ open: false, mode: "none" }));
  expect(screen.queryByText("Content")).not.toBeInTheDocument();
  view.unmount();
  expect(cleanup).toHaveBeenCalled();
});

it("drawer preserves callbacks, render, refs, native events, controlled updates and local mode clocks", () => {
  const cleanup = vi.fn();
  const ref = vi.fn(() => cleanup);
  const key = vi.fn();
  const contentProps: ComponentProps<typeof DrawerContent> = {
    className: (state) => (state.open ? "w-80 p-8 shadow-none callback" : "closed"),
    style: (state) => ({ opacity: state.open ? 0.9 : 0.2 }),
    ref,
    onKeyDown: (event) => key(event.nativeEvent.type),
    render: (props) => <section {...props} data-render="function" />,
  };
  function example({ mode = "full", open = true }: { mode?: "full" | "reduced" | "none"; open?: boolean }) {
    return (
      <CadenceProvider mode="none">
        <CadenceProvider mode={mode} timeScale={2}>
          <Drawer open={open}>
            <DrawerTrigger>Open drawer</DrawerTrigger>
            <DrawerContent {...contentProps}>
              <DrawerTitle className={() => "text-xl title-callback"}>Title</DrawerTitle>
              <DrawerDescription className={() => "description-callback"}>Description</DrawerDescription>
            </DrawerContent>
          </Drawer>
        </CadenceProvider>
      </CadenceProvider>
    );
  }
  const view = render(example({}));
  const node = document.querySelector('[data-slot="drawer-popup"]') as HTMLElement;
  expect(node.tagName).toBe("SECTION");
  expect(node).toHaveClass("callback", "w-80", "p-8", "shadow-none");
  expect(node).not.toHaveClass("w-72", "w-64", "p-4", "shadow-md");
  expect(node.style.opacity).toBe("0.9");
  expect(node.style.getPropertyValue("--motion-duration-fast")).toBe("0.32s");
  fireEvent.keyDown(node, { key: "a" });
  expect(key).toHaveBeenCalledWith("keydown");
  for (const mode of ["reduced", "none", "full"] as const) {
    view.rerender(example({ mode }));
    expect(document.querySelector('[data-slot="drawer-popup"]')).toBe(node);
    expect(node).toHaveAttribute("data-motion", mode);
    if (mode !== "full") expect(node.className).toContain(mode === "none" ? "transition-none" : "transition-opacity");
    if (mode === "none") {
      expect(node.style.getPropertyValue("--motion-duration-fast")).toBe("0s");
      expect(node.className).not.toContain(":opacity-0");
    }
  }
  view.rerender(example({ open: false, mode: "none" }));
  expect(screen.queryByText("Content")).not.toBeInTheDocument();
  view.unmount();
  expect(cleanup).toHaveBeenCalled();
});

it("popover preserves callbacks, render, refs, native events, controlled updates and local mode clocks", () => {
  const cleanup = vi.fn();
  const ref = vi.fn(() => cleanup);
  const key = vi.fn();
  const contentProps: ComponentProps<typeof PopoverContent> = {
    className: (state) => (state.open ? "w-80 p-8 shadow-none callback" : "closed"),
    style: (state) => ({ opacity: state.open ? 0.9 : 0.2 }),
    ref,
    onKeyDown: (event) => key(event.nativeEvent.type),
    render: (props) => <section {...props} data-render="function" />,
  };
  function example({ mode = "full", open = true }: { mode?: "full" | "reduced" | "none"; open?: boolean }) {
    return (
      <CadenceProvider mode="none">
        <CadenceProvider mode={mode} timeScale={2}>
          <Popover open={open}>
            <PopoverTrigger>Open popover</PopoverTrigger>
            <PopoverContent {...contentProps}>
              <PopoverTitle className={() => "text-xl title-callback"}>Title</PopoverTitle>
              <PopoverDescription className={() => "description-callback"}>Description</PopoverDescription>
            </PopoverContent>
          </Popover>
        </CadenceProvider>
      </CadenceProvider>
    );
  }
  const view = render(example({}));
  const node = document.querySelector('[data-slot="popover-content"]') as HTMLElement;
  expect(node.tagName).toBe("SECTION");
  expect(node).toHaveClass("callback", "w-80", "p-8", "shadow-none");
  expect(node).not.toHaveClass("w-72", "w-64", "p-4", "shadow-md");
  expect(node.style.opacity).toBe("0.9");
  expect(node.style.getPropertyValue("--motion-duration-fast")).toBe("0.32s");
  fireEvent.keyDown(node, { key: "a" });
  expect(key).toHaveBeenCalledWith("keydown");
  for (const mode of ["reduced", "none", "full"] as const) {
    view.rerender(example({ mode }));
    expect(document.querySelector('[data-slot="popover-content"]')).toBe(node);
    expect(node).toHaveAttribute("data-motion", mode);
    if (mode !== "full") expect(node.className).toContain(mode === "none" ? "transition-none" : "transition-opacity");
    if (mode === "none") {
      expect(node.style.getPropertyValue("--motion-duration-fast")).toBe("0s");
      expect(node.className).not.toContain(":opacity-0");
    }
  }
  view.rerender(example({ open: false, mode: "none" }));
  expect(screen.queryByText("Content")).not.toBeInTheDocument();
  view.unmount();
  expect(cleanup).toHaveBeenCalled();
});

it("tooltip preserves callbacks, render, refs, native events, controlled updates and local mode clocks", () => {
  const cleanup = vi.fn();
  const ref = vi.fn(() => cleanup);
  const key = vi.fn();
  const contentProps: ComponentProps<typeof TooltipContent> = {
    className: (state) => (state.open ? "w-80 p-8 shadow-none callback" : "closed"),
    style: (state) => ({ opacity: state.open ? 0.9 : 0.2 }),
    ref,
    onKeyDown: (event) => key(event.nativeEvent.type),
    render: (props) => <section {...props} data-render="function" />,
  };
  function example({ mode = "full", open = true }: { mode?: "full" | "reduced" | "none"; open?: boolean }) {
    return (
      <CadenceProvider mode="none">
        <CadenceProvider mode={mode} timeScale={2}>
          <Tooltip open={open}>
            <TooltipTrigger>Open tooltip</TooltipTrigger>
            <TooltipContent {...contentProps}>
              <span>Content</span>
            </TooltipContent>
          </Tooltip>
        </CadenceProvider>
      </CadenceProvider>
    );
  }
  const view = render(example({}));
  const node = document.querySelector('[data-slot="tooltip-content"]') as HTMLElement;
  expect(node.tagName).toBe("SECTION");
  expect(node).toHaveClass("callback", "w-80", "p-8", "shadow-none");
  expect(node).not.toHaveClass("w-72", "w-64", "p-4", "shadow-md");
  expect(node.style.opacity).toBe("0.9");
  expect(node.style.getPropertyValue("--motion-duration-fast")).toBe("0.32s");
  fireEvent.keyDown(node, { key: "a" });
  expect(key).toHaveBeenCalledWith("keydown");
  for (const mode of ["reduced", "none", "full"] as const) {
    view.rerender(example({ mode }));
    expect(document.querySelector('[data-slot="tooltip-content"]')).toBe(node);
    expect(node).toHaveAttribute("data-motion", mode);
    if (mode !== "full") expect(node.className).toContain(mode === "none" ? "transition-none" : "transition-opacity");
    if (mode === "none") {
      expect(node.style.getPropertyValue("--motion-duration-fast")).toBe("0s");
      expect(node.className).not.toContain(":opacity-0");
    }
  }
  view.rerender(example({ open: false, mode: "none" }));
  expect(screen.queryByText("Content")).not.toBeInTheDocument();
  view.unmount();
  expect(cleanup).toHaveBeenCalled();
});

it("hover-card preserves callbacks, render, refs, native events, controlled updates and local mode clocks", () => {
  const cleanup = vi.fn();
  const ref = vi.fn(() => cleanup);
  const key = vi.fn();
  const contentProps: ComponentProps<typeof HoverCardContent> = {
    className: (state) => (state.open ? "w-80 p-8 shadow-none callback" : "closed"),
    style: (state) => ({ opacity: state.open ? 0.9 : 0.2 }),
    ref,
    onKeyDown: (event) => key(event.nativeEvent.type),
    render: (props) => <section {...props} data-render="function" />,
  };
  function example({ mode = "full", open = true }: { mode?: "full" | "reduced" | "none"; open?: boolean }) {
    return (
      <CadenceProvider mode="none">
        <CadenceProvider mode={mode} timeScale={2}>
          <HoverCard open={open}>
            <HoverCardTrigger>Open hover-card</HoverCardTrigger>
            <HoverCardContent {...contentProps}>
              <span>Content</span>
            </HoverCardContent>
          </HoverCard>
        </CadenceProvider>
      </CadenceProvider>
    );
  }
  const view = render(example({}));
  const node = document.querySelector('[data-slot="hover-card-content"]') as HTMLElement;
  expect(node.tagName).toBe("SECTION");
  expect(node).toHaveClass("callback", "w-80", "p-8", "shadow-none");
  expect(node).not.toHaveClass("w-72", "w-64", "p-4", "shadow-md");
  expect(node.style.opacity).toBe("0.9");
  expect(node.style.getPropertyValue("--motion-duration-fast")).toBe("0.32s");
  fireEvent.keyDown(node, { key: "a" });
  expect(key).toHaveBeenCalledWith("keydown");
  for (const mode of ["reduced", "none", "full"] as const) {
    view.rerender(example({ mode }));
    expect(document.querySelector('[data-slot="hover-card-content"]')).toBe(node);
    expect(node).toHaveAttribute("data-motion", mode);
    if (mode !== "full") expect(node.className).toContain(mode === "none" ? "transition-none" : "transition-opacity");
    if (mode === "none") {
      expect(node.style.getPropertyValue("--motion-duration-fast")).toBe("0s");
      expect(node.className).not.toContain(":opacity-0");
    }
  }
  view.rerender(example({ open: false, mode: "none" }));
  expect(screen.queryByText("Content")).not.toBeInTheDocument();
  view.unmount();
  expect(cleanup).toHaveBeenCalled();
});

it("Tooltip preserves caller cancellation without dangling description state", async () => {
  const cancel = vi.fn((_: boolean, details: { cancel: () => void }) => details.cancel());
  render(
    <Tooltip onOpenChange={cancel}>
      <TooltipTrigger>Cancelled tooltip</TooltipTrigger>
      <TooltipContent>Cancelled content</TooltipContent>
    </Tooltip>,
  );
  const trigger = screen.getByText("Cancelled tooltip");
  await userEvent.tab();
  expect(cancel).toHaveBeenCalled();
  expect(trigger).not.toHaveAttribute("aria-describedby");
  expect(screen.queryByText("Cancelled content")).not.toBeInTheDocument();
});

it("merges render element and native event handlers without losing React19 ref cleanup", () => {
  const elementKey = vi.fn();
  const callerKey = vi.fn();
  const elementCleanup = vi.fn();
  const callerCleanup = vi.fn();
  const view = render(
    <Dialog open>
      <DialogContent
        ref={() => callerCleanup}
        onKeyDown={callerKey}
        render={<section role="dialog" tabIndex={-1} onKeyDown={elementKey} ref={() => elementCleanup} />}
      >
        <DialogTitle>Render element</DialogTitle>
      </DialogContent>
    </Dialog>,
  );
  fireEvent.keyDown(screen.getByRole("dialog"), { key: "a" });
  expect(elementKey).toHaveBeenCalledOnce();
  expect(callerKey).toHaveBeenCalledOnce();
  view.unmount();
  expect(elementCleanup).toHaveBeenCalledOnce();
  expect(callerCleanup).toHaveBeenCalledOnce();
});
