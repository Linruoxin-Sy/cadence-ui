import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PresenceContext } from "motion/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@/registry/cadence/field";
import { Input } from "@/registry/cadence/input";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { expectV2MotionAction, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

const presence = (isPresent: boolean, id: string) => ({
  id,
  initial: false as const,
  isPresent,
  register: () => () => {},
  onExitComplete: () => {},
});
const modes = ["full", "reduced", "none"] as const;

describe("Field", () => {
  it("names the control it labels", () => {
    render(
      <Field>
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <FieldContent>
          <Input id="email" />
          <FieldDescription>We only use this to send receipts.</FieldDescription>
        </FieldContent>
      </Field>,
    );

    expect(screen.getByRole("textbox", { name: "Email" })).toBeInTheDocument();
    expect(screen.getByText("We only use this to send receipts.").closest("p")).toHaveAttribute(
      "data-slot",
      "field-description",
    );
    // One additive display host carries the changed runs; the part keeps its own slot.
    expect(screen.getByText("We only use this to send receipts.")).toHaveAttribute("data-slot", "field-text");
    const label = screen.getByText("Email").closest("label");
    expect(label).toHaveAttribute("data-slot", "field-label");
    expect(label).toHaveAttribute("for", "email");
  });

  it("exposes orientation through data-orientation", () => {
    render(
      <FieldGroup>
        <Field orientation="horizontal" data-testid="row" />
      </FieldGroup>,
    );

    expect(screen.getByTestId("row")).toHaveAttribute("data-slot", "field");
    expect(screen.getByTestId("row")).toHaveAttribute("data-orientation", "horizontal");
    expect(screen.getByTestId("row").className).toContain("flex-row");
  });

  it("renders an error it is given, deduplicated", () => {
    render(<FieldError errors={[{ message: "Required" }, { message: "Required" }, { message: "Too long" }]} />);

    const error = screen.getByRole("alert");
    expect(error).toHaveAttribute("data-slot", "field-error");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("Required")).toBeInTheDocument();
  });

  it("renders nothing when there is no error to show", () => {
    render(<FieldError errors={[]} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps the set, legend, title and separator parts addressable", () => {
    render(
      <FieldSet>
        <FieldLegend>Billing</FieldLegend>
        <FieldTitle>Address</FieldTitle>
        <FieldSeparator>or</FieldSeparator>
      </FieldSet>,
    );

    expect(screen.getByText("Billing").closest("legend")).toHaveAttribute("data-slot", "field-legend");
    expect(screen.getByText("Address").closest('[data-slot="field-label"]')).toHaveAttribute(
      "data-slot",
      "field-label",
    );
    expect(screen.getByText("or").closest('[data-slot="field-separator"]')).toHaveAttribute("data-content", "true");
    expect(screen.getByText("or").closest('[data-slot="field-separator-content"]')).toBeInTheDocument();
  });

  it("keeps falsy errors and captions out of the rendered output", () => {
    const { container, rerender } = render(
      <>
        <FieldError errors={[]}>{0}</FieldError>
        <FieldSeparator>{0}</FieldSeparator>
      </>,
    );
    expect(container.querySelector('[data-slot="field-error"]')).toBeNull();
    expect(container.querySelector('[data-slot="field-separator-content"]')).toBeNull();

    rerender(
      <>
        <FieldError errors={[{ message: "Required" }]}>{0}</FieldError>
        <FieldSeparator>or</FieldSeparator>
      </>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Required");
    expect(container.querySelector('[data-slot="field-separator-content"]')).toHaveTextContent("or");
  });

  it("keeps native association, activation and ref cleanup", async () => {
    const cleanup = vi.fn(),
      ref = vi.fn(() => cleanup);
    render(
      <>
        <FieldLabel htmlFor="company" ref={ref}>
          Company
        </FieldLabel>
        <Input id="company" defaultValue="Cadence" />
      </>,
    );
    const input = screen.getByRole("textbox");
    await userEvent.click(screen.getByText("Company"));
    expect(input).toHaveFocus();
    expect(ref).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("textbox", { name: "Company" })).toHaveValue("Cadence");
  });
});

describe("Field v2", () => {
  beforeAll(() => prepareV2MotionPlan());

  it.each(modes)("enters an independent structure and owns the message block in %s", async (mode) => {
    const draw = (hidden: boolean, text: string) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <FieldSet hidden={hidden}>
          <FieldGroup hidden={hidden}>
            <Field>
              <FieldContent>
                <FieldDescription>{text}</FieldDescription>
              </FieldContent>
            </Field>
          </FieldGroup>
        </FieldSet>
      </CadenceProvider>
    );
    const view = render(draw(true, "Use the invoice number."));
    await expectV2MotionAction("field", "field.structure.enter", mode, () =>
      view.rerender(draw(false, "Use the invoice number.")),
    );
    expect(view.container.querySelector('[data-slot="field-set"]')).not.toHaveAttribute("hidden");
    await expectV2MotionAction(
      "field",
      "field.content.resize",
      mode,
      () => view.rerender(draw(false, "Use the invoice number printed in the top-left corner of the invoice.")),
      { container: view.container },
    );
    view.unmount();
  });

  it.each(modes)("enters a field and fades a retained message row in %s", async (mode) => {
    const draw = (hidden: boolean, visible: boolean) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <Field hidden={hidden}>
          <PresenceContext.Provider value={presence(visible, "messages")}>
            <FieldDescription>Use the invoice number.</FieldDescription>
            <FieldError errors={[{ message: "That number has the wrong length." }]} />
          </PresenceContext.Provider>
        </Field>
      </CadenceProvider>
    );
    const view = render(draw(true, true));
    await expectV2MotionAction("field", "field.root.enter", mode, () => view.rerender(draw(false, true)));
    await expectV2MotionAction("field", "field.message.exit", mode, () => view.rerender(draw(false, false)));
    const rule = view.container.querySelector('[data-slot="field-description"]');
    expect(rule).toHaveAttribute("inert");
    expect(rule).toHaveAttribute("aria-hidden", "true");
    await expectV2MotionAction("field", "field.message.enter", mode, () => view.rerender(draw(false, true)));
    expect(rule).not.toHaveAttribute("inert");
    expect(view.container.querySelector('[data-slot="field-error"]')).not.toHaveAttribute("inert");
    view.unmount();
  });

  it.each(modes)("replaces every plain display run in %s", async (mode) => {
    const draw = (value: string) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <Field>
          <FieldLabel>{`Name ${value}`}</FieldLabel>
          <FieldTitle>{`Title ${value}`}</FieldTitle>
          <FieldLegend>{`Legend ${value}`}</FieldLegend>
          <FieldDescription>{`Help ${value}`}</FieldDescription>
          <FieldError>{`Error ${value}`}</FieldError>
          <FieldSeparator>{`or ${value}`}</FieldSeparator>
        </Field>
      </CadenceProvider>
    );
    const view = render(draw("one"));
    const spans = Array.from(view.container.querySelectorAll('[data-slot="field-text"]')).map(
      (node) => node.firstChild,
    );
    expect(spans).toHaveLength(6);
    await expectV2MotionAction("field", "field.text.replace", mode, () => view.rerender(draw("two")));
    expect(
      Array.from(view.container.querySelectorAll('[data-slot="field-text"]')).map((node) => node.firstChild),
    ).toEqual(spans);
    expect(
      Array.from(view.container.querySelectorAll('[data-slot="field-text"]')).map((node) => node.textContent),
    ).toEqual(["Name two", "Title two", "Legend two", "Help two", "Error two", "or two"]);
    view.unmount();
  });

  it.each(modes)("reels every direct quantity in %s", async (mode) => {
    const draw = (value: number) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <Field>
          <FieldLabel>{value}</FieldLabel>
          <FieldTitle>{value}</FieldTitle>
          <FieldLegend>{value}</FieldLegend>
          <FieldDescription>{value}</FieldDescription>
          <FieldError>{value}</FieldError>
          <FieldSeparator>{value}</FieldSeparator>
        </Field>
      </CadenceProvider>
    );
    const view = render(draw(19));
    const spans = Array.from(view.container.querySelectorAll('[data-slot="field-number"]')).map(
      (node) => node.firstChild,
    );
    expect(spans).toHaveLength(6);
    await expectV2MotionAction("field", "field.value.roll", mode, () => view.rerender(draw(20)));
    expect(
      Array.from(view.container.querySelectorAll('[data-slot="field-number"]')).map((node) => node.firstChild),
    ).toEqual(spans);
    expect(
      Array.from(view.container.querySelectorAll('[data-slot="field-number"]')).map((node) => node.textContent),
    ).toEqual(["20", "20", "20", "20", "20", "20"]);
    view.unmount();
  });

  it.each(modes)("settles the declared foreground and surface paint in %s", async (mode) => {
    const draw = (invalid: boolean) => {
      const text = { color: invalid ? "#b91c1c" : "#111111" };
      return (
        <CadenceProvider mode={mode} timeScale={0}>
          <Field>
            <FieldLabel style={{ ...text, backgroundColor: invalid ? "#fee2e2" : "#ffffff" }}>Name</FieldLabel>
            <FieldTitle style={text}>Title</FieldTitle>
            <FieldLegend style={text}>Legend</FieldLegend>
            <FieldDescription style={text}>Help</FieldDescription>
            <FieldError style={text}>{invalid ? "Required" : "Fine"}</FieldError>
          </Field>
        </CadenceProvider>
      );
    };
    const view = render(draw(false));
    await expectV2MotionAction("field", "field.foreground.colour", mode, () => view.rerender(draw(true)));
    await expectV2MotionAction("field", "field.surface.colour", mode, () => view.rerender(draw(false)));
    view.unmount();
  });

  it.each(modes)("keeps the composed rule on Separator's owners in %s", async (mode) => {
    const draw = (visible: boolean, width: number, colour: string) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <PresenceContext.Provider value={presence(visible, "rule")}>
          <FieldSeparator ruleStyle={{ width, backgroundColor: colour }}>or</FieldSeparator>
        </PresenceContext.Provider>
      </CadenceProvider>
    );
    const view = render(draw(true, 120, "#555555"));
    const rule = view.container.querySelector('[data-slot="separator"]');
    await expectV2MotionAction(
      "field",
      "field.separator.resize",
      mode,
      () => view.rerender(draw(true, 160, "#555555")),
      { container: view.container },
    );
    expect(view.container.querySelector('[data-slot="separator"]')).toBe(rule);
    await expectV2MotionAction("field", "field.separator.colour", mode, () =>
      view.rerender(draw(true, 160, "#777777")),
    );
    await expectV2MotionAction("field", "field.separator.exit", mode, () => view.rerender(draw(false, 160, "#777777")));
    expect(rule).toHaveAttribute("inert");
    await expectV2MotionAction("field", "field.separator.enter", mode, () => view.rerender(draw(true, 160, "#777777")));
    expect(rule).not.toHaveAttribute("inert");
    view.unmount();
  });

  it.each(modes)("records the composed rich and native boundaries in %s", async (mode) => {
    const view = render(
      <CadenceProvider mode={mode}>
        <Field>
          <FieldLabel htmlFor="bound">
            Company
            <input id="bound" />
          </FieldLabel>
          <FieldTitle>
            <strong>Rich title</strong>
          </FieldTitle>
          <FieldLegend>
            <strong>Rich legend</strong>
          </FieldLegend>
          <FieldDescription>
            <em>Rich description</em>
          </FieldDescription>
          <FieldError errors={[{ message: "Required" }, { message: "Too long" }]} />
          <FieldSeparator>
            <strong>or</strong>
          </FieldSeparator>
        </Field>
      </CadenceProvider>,
    );
    await expectV2NativeBoundaries("field", { container: view.container });
    expect(screen.getByRole("textbox", { name: "Company" })).toBeInTheDocument();
    view.unmount();
  });

  it("converges on the latest helper text and releases the region on unmount", () => {
    const draw = (text: string) => (
      <Field>
        <FieldContent>
          <FieldDescription>{text}</FieldDescription>
        </FieldContent>
      </Field>
    );
    const view = render(draw("one"));
    for (const text of ["two", "three", "four"]) view.rerender(draw(text));
    expect(view.container.querySelector('[data-slot="field-text"]')).toHaveTextContent("four");
    expect(view.container.querySelector('[data-slot="field-content"]')).toHaveAttribute("data-motion", "full");
    view.unmount();
    expect(view.container.querySelector('[data-slot="field-content"]')).toBeNull();
  });

  it("keeps the focused editor usable while a helper text revision commits", async () => {
    const draw = (text: string) => (
      <Field>
        <FieldLabel htmlFor="edit">Name</FieldLabel>
        <FieldContent>
          <Input id="edit" defaultValue="unchanged" />
          <FieldDescription>{text}</FieldDescription>
        </FieldContent>
      </Field>
    );
    const view = render(draw("Short help."));
    const input = screen.getByRole("textbox");
    await userEvent.click(input);
    (input as HTMLInputElement).setSelectionRange(2, 5);
    view.rerender(draw("A much longer helper text that wraps onto a second line inside the field content."));
    expect(input).toHaveFocus();
    expect((input as HTMLInputElement).selectionStart).toBe(2);
    fireEvent.input(input, { target: { value: "typing" } });
    expect(input).toHaveValue("typing");
    view.unmount();
  });
});
