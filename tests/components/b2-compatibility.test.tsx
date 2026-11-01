import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { BreadcrumbLink } from "@/registry/cadence/breadcrumb";
import { ButtonGroupSeparator, ButtonGroupText } from "@/registry/cadence/button-group";
import { Field, FieldError } from "@/registry/cadence/field";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/registry/cadence/input-group";
import { Item, ItemSeparator } from "@/registry/cadence/item";
import { PaginationNext, PaginationPrevious } from "@/registry/cadence/pagination";

it("evaluates inherited Base callbacks and merges caller classes last", () => {
  render(
    <>
      <ItemSeparator
        className={(s) => (s.orientation === "horizontal" ? "my-4 caller-item" : "my-1")}
        style={(s) => ({ opacity: s.orientation === "horizontal" ? 0.7 : 1 })}
      />
      <ButtonGroupSeparator
        className={(s) => (s.orientation === "vertical" ? "bg-primary caller-rule" : "bg-muted")}
        style={(s) => ({ opacity: s.orientation === "vertical" ? 0.6 : 1 })}
      />
      <InputGroupButton
        disabled
        className={(s) => (s.disabled ? "px-8 caller-button" : "px-1")}
        style={(s) => ({ opacity: s.disabled ? 0.5 : 1 })}
      >
        Action
      </InputGroupButton>
    </>,
  );
  const rules = screen.getAllByRole("separator");
  expect(rules[0]).toHaveClass("my-4", "caller-item");
  expect(rules[0]).not.toHaveClass("my-0");
  expect(rules[0]).toHaveStyle({ opacity: "0.7" });
  expect(rules[1]).toHaveClass("bg-primary", "caller-rule");
  expect(rules[1]).not.toHaveClass("bg-input");
  expect(rules[1]).toHaveStyle({ opacity: "0.6" });
  expect(screen.getByRole("button")).toHaveClass("px-8", "caller-button");
  expect(screen.getByRole("button")).not.toHaveClass("px-2");
  expect(screen.getByRole("button")).toHaveStyle({ opacity: "0.5" });
});

it("keeps render elements/functions, merged events and React19 ref cleanup", async () => {
  const cleanup = vi.fn();
  const inner = vi.fn();
  const caller = vi.fn();
  const view = render(
    <>
      <Item
        ref={() => cleanup}
        // biome-ignore lint/a11y/useValidAnchor: navigation link also verifies merged native events.
        render={<a href="#item" onClick={inner} />}
        onClick={caller}
        className="p-8"
        style={{ opacity: 0.8 }}
      >
        Row
      </Item>
      <ButtonGroupText render={(props) => <a {...props} href="#text" />}>Text</ButtonGroupText>
      <BreadcrumbLink render={<a href="#crumb" />}>Crumb</BreadcrumbLink>
      <InputGroupButton ref={() => cleanup} render={<button type="button" onClick={inner} />} onClick={caller}>
        Action
      </InputGroupButton>
      <ItemSeparator render={<hr />} ref={() => cleanup} />
      <ButtonGroupSeparator render={<hr />} ref={() => cleanup} />
    </>,
  );
  await userEvent.click(screen.getByRole("link", { name: "Row" }));
  await userEvent.click(screen.getByRole("button"));
  expect(caller).toHaveBeenCalledTimes(2);
  expect(inner).toHaveBeenCalledTimes(2);
  expect(screen.getByRole("link", { name: "Row" })).toHaveClass("p-8");
  expect(screen.getByRole("link", { name: "Row" })).toHaveStyle({ opacity: "0.8" });
  expect(screen.getByRole("link", { name: "Text" })).toHaveAttribute("data-slot", "button-group-text");
  expect(screen.getByRole("link", { name: "Crumb" })).toHaveAttribute("href", "#crumb");
  view.unmount();
  expect(cleanup).toHaveBeenCalledTimes(4);
});

it("preserves caller-owned invalid state, input selection, addon cancellation and pagination sizes", async () => {
  const change = vi.fn();
  const contents = (invalid: boolean) => (
    <Field data-invalid={invalid}>
      <InputGroup>
        <InputGroupInput aria-label="Native" aria-invalid={invalid} onChange={change} />
        <InputGroupAddon onClick={(e) => e.preventDefault()}>Prefix</InputGroupAddon>
      </InputGroup>
      <FieldError>{invalid ? "Caller error" : null}</FieldError>
      <PaginationPrevious size="sm" href="#previous" />
      <PaginationNext size="lg" href="#next" />
    </Field>
  );
  const view = render(contents(false));
  const input = screen.getByRole("textbox") as HTMLInputElement;
  await userEvent.type(input, "cadence");
  input.setSelectionRange(1, 4);
  view.rerender(contents(true));
  expect(screen.getByRole("textbox")).toBe(input);
  expect(input).toHaveFocus();
  expect([input.selectionStart, input.selectionEnd]).toEqual([1, 4]);
  expect(input).toHaveAttribute("aria-invalid", "true");
  expect(screen.getByRole("alert")).toHaveTextContent("Caller error");
  input.blur();
  fireEvent.click(screen.getByText("Prefix"));
  expect(input).not.toHaveFocus();
  expect(change).toHaveBeenCalled();
  expect(screen.getByLabelText("Go to previous page")).toHaveAttribute("data-size", "sm");
  expect(screen.getByLabelText("Go to next page")).toHaveAttribute("data-size", "lg");
});
