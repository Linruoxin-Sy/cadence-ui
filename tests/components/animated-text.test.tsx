import { fireEvent, render } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { AnimatedText } from "@/registry/cadence/animated-text";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { expectMotionContract } from "../motion-contract";

describe("AnimatedText", () => {
  it.each(["full", "reduced", "none"] as const)(
    "%s preserves one native text, selection and final semantics",
    (mode) => {
      const ui = (value: string) => (
        <CadenceProvider mode={mode}>
          <AnimatedText data-testid="text" value={value} />
        </CadenceProvider>
      );
      const view = render(ui("aXbYc"));
      const host = view.getByTestId("text"),
        node = host.firstChild;
      const range = document.createRange();
      range.setStart(node as Text, 2);
      range.setEnd(node as Text, 3);
      document.getSelection()?.addRange(range);
      view.rerender(ui("aPbQc"));
      expectMotionContract(mode, {
        parts: [host],
        behavior: () => {
          expect(host.textContent).toBe("aPbQc");
          expect(host.firstChild).toBe(node);
          expect(host.childNodes).toHaveLength(1);
          expect(document.getSelection()?.toString()).toBe("b");
          expect(document.querySelectorAll("[data-cadence-text-layer]")).toHaveLength(0);
        },
      });
      document.getSelection()?.removeAllRanges();
    },
  );

  it("keeps the native ref, focus, events, classes and one button name", () => {
    const ref = createRef<HTMLSpanElement>(),
      click = vi.fn();
    const view = render(
      <button type="button">
        <AnimatedText ref={ref} className="caller" onClick={click} value="Save" />
      </button>,
    );
    const button = view.getByRole("button", { name: "Save" });
    expect(ref.current?.tagName).toBe("SPAN");
    expect(ref.current).toHaveClass("caller");
    expect(ref.current).toHaveAttribute("data-slot", "animated-text");
    button.focus();
    fireEvent.click(ref.current as HTMLElement);
    expect(click).toHaveBeenCalledOnce();
    view.rerender(
      <button type="button">
        <AnimatedText ref={ref} className="caller" onClick={click} value="Saved" />
      </button>,
    );
    expect(button).toHaveFocus();
    expect(button).toHaveAccessibleName("Saved");
    view.unmount();
    expect(ref.current).toBeNull();
  });

  it("handles empty/oversized strings, word mode and keyed entity baselines", () => {
    const view = render(<AnimatedText data-testid="text" value="" granularity="word" locale="en" />);
    const host = view.getByTestId("text");
    view.rerender(<AnimatedText data-testid="text" value={"x".repeat(2049)} granularity="word" />);
    expect(host.textContent).toBe("x".repeat(2049));
    view.rerender(<AnimatedText key="new-entity" data-testid="text" value="New" />);
    expect(view.getByTestId("text")).not.toBe(host);
    expect(view.getByTestId("text")).not.toHaveAttribute("aria-live");
  });
});
