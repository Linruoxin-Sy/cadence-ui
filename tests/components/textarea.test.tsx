import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Textarea } from "@/registry/cadence/textarea/textarea";

describe("Textarea", () => {
  it("renders a textarea with its slot", () => {
    render(<Textarea aria-label="Comment" />);
    const textarea = screen.getByRole("textbox", { name: "Comment" });
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea).toHaveAttribute("data-slot", "textarea");
  });

  it("accepts multi-line input and native props", async () => {
    render(<Textarea aria-label="Comment" rows={4} maxLength={120} />);
    const textarea = screen.getByRole("textbox", { name: "Comment" });

    await userEvent.type(textarea, "first line{enter}second line");

    expect(textarea).toHaveValue("first line\nsecond line");
    expect(textarea).toHaveAttribute("rows", "4");
    expect(textarea).toHaveAttribute("maxlength", "120");
  });

  it("keeps the invalid state attribute-driven", () => {
    render(<Textarea aria-label="Bio" aria-invalid="true" aria-describedby="bio-error" />);
    const textarea = screen.getByRole("textbox", { name: "Bio" });

    expect(textarea).toHaveAttribute("aria-invalid", "true");
    expect(textarea).toHaveAttribute("aria-describedby", "bio-error");
  });
});
