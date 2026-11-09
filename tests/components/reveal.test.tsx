import { fireEvent, render } from "@testing-library/react";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { Reveal } from "@/registry/cadence/reveal";
import { expectMotionContract } from "../motion-contract";

it.each(["full", "reduced", "none"] as const)("%s keeps public native content and mode evidence", (mode) => {
  const ui = (
    <CadenceProvider mode={mode}>
      <Reveal>
        <button type="button">Read</button>
      </Reveal>
    </CadenceProvider>
  );
  expect(renderToString(ui)).not.toContain("data-cadence-reveal");
  const view = render(ui);
  const host = view.getByRole("button").parentElement as HTMLElement;
  expectMotionContract(mode, {
    parts: [host],
    behavior: () => {
      expect(host).toHaveAttribute("data-slot", "reveal");
      expect(host).not.toHaveAttribute("data-cadence-reveal");
      expect(host.style.opacity).toBe("");
      view.getByRole("button").focus();
      expect(view.getByRole("button")).toHaveFocus();
    },
  });
});

it("merges native render refs/events/classes without an extra host", () => {
  const ref = createRef<HTMLDivElement>(),
    renderedRef = vi.fn(),
    click = vi.fn(),
    renderedClick = vi.fn();
  const view = render(
    <Reveal
      ref={ref}
      render={<button type="button" ref={renderedRef} onClick={renderedClick} className="rendered" />}
      onClick={click}
      className="caller"
    >
      Continue
    </Reveal>,
  );
  const button = view.getByRole("button");
  expect(ref.current).toBe(button);
  expect(button).toHaveClass("rendered", "caller");
  expect(view.container.children).toHaveLength(1);
  fireEvent.click(button);
  expect(click).toHaveBeenCalledOnce();
  expect(renderedClick).toHaveBeenCalledOnce();
  expect(renderedRef).toHaveBeenCalledWith(button);
  view.unmount();
  expect(ref.current).toBeNull();
});

it("forwards render-function props and preserves an editable native tree", () => {
  const view = render(
    <Reveal render={(props) => <section {...props} />}>
      <span contentEditable suppressContentEditableWarning>
        Native
      </span>
      <input aria-label="Edit" defaultValue="value" />
    </Reveal>,
  );
  const input = view.getByRole("textbox");
  fireEvent.input(input, { target: { value: "changed" } });
  view.rerender(
    <Reveal render={(props) => <section {...props} />}>
      <span contentEditable suppressContentEditableWarning>
        Native
      </span>
      <input aria-label="Edit" defaultValue="value" />
    </Reveal>,
  );
  expect(view.getByRole("textbox")).toBe(input);
  expect(input).toHaveValue("changed");
});
