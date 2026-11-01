import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { ScrollArea, ScrollBar } from "@/registry/cadence/scroll-area";

// jsdom has no Web Animations API; real computed motion is covered in Playwright.
Element.prototype.getAnimations = () => [];

describe("ScrollArea", () => {
  it("preserves root render/ref, native props, styles and state classes", async () => {
    const ref = createRef<HTMLDivElement>();
    const onClick = vi.fn();
    render(
      <ScrollArea
        ref={ref}
        render={<section />}
        aria-label="Notes"
        className={() => "h-48 caller"}
        style={() => ({ padding: 12 })}
        onClick={onClick}
      >
        <button type="button">Read</button>
      </ScrollArea>,
    );
    expect(ref.current?.tagName).toBe("SECTION");
    expect(ref.current).toHaveAttribute("data-slot", "scroll-area");
    expect(ref.current).toHaveAttribute("aria-label", "Notes");
    expect(ref.current).toHaveClass("caller", "h-48");
    expect(ref.current).toHaveStyle({ padding: "12px" });
    const viewport = ref.current?.querySelector('[data-slot="scroll-area-viewport"]');
    expect(viewport).toHaveAttribute("tabindex", "-1");
    expect(viewport).not.toHaveClass("caller");
    expect(screen.getByRole("button").parentElement).toBe(viewport);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
    await act(async () => {});
  });

  it("forwards both scrollbar orientations, keepMounted, render, callbacks and refs", async () => {
    const x = createRef<HTMLDivElement>();
    const y = createRef<HTMLDivElement>();
    const onPointerDown = vi.fn();
    render(
      <ScrollArea>
        <ScrollBar keepMounted ref={y} className={() => "w-4 custom-y"} />
        <ScrollBar
          ref={x}
          keepMounted
          orientation="horizontal"
          render={<div title="Timeline track" />}
          className={() => "h-4 custom-x"}
          style={() => ({ backgroundColor: "red" })}
          onPointerDown={onPointerDown}
        />
      </ScrollArea>,
    );
    expect(y.current).toHaveAttribute("data-orientation", "vertical");
    expect(y.current).toHaveClass("w-4", "custom-y");
    expect(y.current).not.toHaveClass("w-2.5");
    expect(x.current).toHaveAttribute("data-orientation", "horizontal");
    expect(x.current).toHaveClass("h-4", "custom-x", "flex-col");
    expect(x.current).toHaveStyle({ backgroundColor: "rgb(255, 0, 0)" });
    expect(x.current).toHaveAttribute("title", "Timeline track");
    expect(x.current?.querySelector('[data-slot="scroll-area-thumb"]')).toBeInTheDocument();
    fireEvent.pointerDown(x.current as HTMLElement, { button: 1 });
    expect(onPointerDown).toHaveBeenCalledOnce();
    await act(async () => {});
  });

  it("keeps the viewport and its controls in the native tab path", async () => {
    const user = userEvent.setup();
    render(
      <>
        <ScrollArea>
          <button type="button">Read</button>
        </ScrollArea>
        <button type="button">After</button>
      </>,
    );
    await user.tab();
    expect(screen.getByRole("button", { name: "Read" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Read" })).toHaveFocus();
  });

  it.each(["full", "reduced", "none"] as const)("adds no animation in %s", async (mode) => {
    const { container } = render(
      <CadenceProvider mode={mode}>
        <ScrollArea>
          <ScrollBar keepMounted />
        </ScrollArea>
      </CadenceProvider>,
    );
    await act(async () => {});
    for (const node of container.querySelectorAll<HTMLElement>('[data-slot^="scroll-area"]')) {
      expect(node).not.toHaveAttribute("data-motion");
      expect(node.className).not.toMatch(/animate-|transition-(all|transform|opacity)/);
      expect(node.style.transitionDuration).toBe("");
    }
  });
});
