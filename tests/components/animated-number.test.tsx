import { fireEvent, render } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { AnimatedNumber } from "@/registry/cadence/animated-number";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { expectMotionContract } from "../motion-contract";

describe("AnimatedNumber", () => {
  it("yields native editing text to composition and establishes a baseline after editing", () => {
    const ui = (mode: "full" | "none", value: number, editing: boolean) => (
      <CadenceProvider mode={mode}>
        <div contentEditable={editing} suppressContentEditableWarning>
          <AnimatedNumber data-testid="number" value={value} />
        </div>
      </CadenceProvider>
    );
    const view = render(ui("full", 123, true));
    const host = view.getByTestId("number"),
      text = host.firstChild as Text;
    text.appendData("あ");
    fireEvent.compositionStart(host);
    view.rerender(ui("none", 456, true));
    expect(host.firstChild).toBe(text);
    expect(text.data).toBe("123あ");
    view.rerender(ui("none", 456, false));
    expect(host.firstChild).toBe(text);
    expect(text.data).toBe("456");
    expect(document.querySelectorAll("[data-cadence-number-layer]")).toHaveLength(0);
  });
  it.each(["full", "reduced", "none"] as const)("%s preserves exact native values and selection", (mode) => {
    const ui = (value: number | bigint) => (
      <CadenceProvider mode={mode}>
        <AnimatedNumber data-testid="number" value={value} />
      </CadenceProvider>
    );
    const view = render(ui(123));
    const host = view.getByTestId("number"),
      node = host.firstChild;
    const range = document.createRange();
    range.setStart(node as Text, 1);
    range.setEnd(node as Text, 2);
    document.getSelection()?.addRange(range);
    view.rerender(ui(124));
    expectMotionContract(mode, {
      parts: [host],
      behavior: () => {
        expect(host.textContent).toBe("124");
        expect(host.firstChild).toBe(node);
        expect(host.childNodes).toHaveLength(1);
        expect(document.getSelection()?.toString()).toBe("2");
        expect(document.querySelectorAll("[data-cadence-number-layer]")).toHaveLength(0);
      },
    });
    document.getSelection()?.removeAllRanges();
    view.rerender(ui(123456789012345678901234567890n));
    expect(host.textContent).toBe("123456789012345678901234567890");
  });

  it("retains raw defaults and explicit native Intl formatting", () => {
    const view = render(<AnimatedNumber data-testid="number" value={1234.56789} />);
    const host = view.getByTestId("number");
    expect(host.textContent).toBe("1234.56789");
    for (const value of [-0, Number.NaN, Infinity, 1e30]) {
      view.rerender(<AnimatedNumber data-testid="number" value={value} />);
      expect(host.textContent).toBe(String(value));
    }
    for (const locales of ["en-US", "de-DE", "ar-EG"]) {
      const format = { style: "currency", currency: "EUR" } as const;
      view.rerender(<AnimatedNumber data-testid="number" value={-1234.56} locales={locales} format={format} />);
      expect(host.textContent).toBe(new Intl.NumberFormat(locales, format).format(-1234.56));
    }
  });

  it("preserves ref, class, native activation and keyed entity baselines", () => {
    const ref = createRef<HTMLSpanElement>(),
      click = vi.fn();
    const ui = (value: number, key: string) => (
      <button type="button">
        <AnimatedNumber key={key} ref={ref} className="caller" onClick={click} value={value} />
      </button>
    );
    const view = render(ui(19, "a"));
    const button = view.getByRole("button", { name: "19" }),
      host = ref.current;
    expect(host).toHaveClass("caller");
    expect(host).toHaveAttribute("data-slot", "animated-number");
    button.focus();
    fireEvent.click(host as HTMLElement);
    expect(click).toHaveBeenCalledOnce();
    view.rerender(ui(20, "a"));
    expect(button).toHaveFocus();
    expect(button).toHaveAccessibleName("20");
    view.rerender(ui(30, "b"));
    expect(ref.current).not.toBe(host);
    expect(ref.current).not.toHaveAttribute("aria-live");
    view.unmount();
    expect(ref.current).toBeNull();
  });
});
