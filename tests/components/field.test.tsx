import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
    expect(screen.getByText("We only use this to send receipts.")).toHaveAttribute("data-slot", "field-description");
    expect(screen.getByText("Email")).toHaveAttribute("data-slot", "field-label");
    expect(screen.getByText("Email").tagName).toBe("LABEL");
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

    expect(screen.getByText("Billing")).toHaveAttribute("data-slot", "field-legend");
    expect(screen.getByText("Billing").tagName).toBe("LEGEND");
    expect(screen.getByText("Address")).toHaveAttribute("data-slot", "field-label");
    expect(screen.getByText("or").closest('[data-slot="field-separator"]')).toHaveAttribute("data-content", "true");
    expect(screen.getByText("or")).toHaveAttribute("data-slot", "field-separator-content");
  });
});
