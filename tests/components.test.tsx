import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AnimatedTabs } from "@/registry/cadence/animated-tabs/animated-tabs";
import { FadeIn } from "@/registry/cadence/fade-in/fade-in";
import { MorphButton } from "@/registry/cadence/morph-button/morph-button";
import { MotionAccordion } from "@/registry/cadence/motion-accordion/motion-accordion";
import { NumberFlow } from "@/registry/cadence/number-flow/number-flow";
import { TextReveal } from "@/registry/cadence/text-reveal/text-reveal";

describe("FadeIn", () => {
  it("renders children and a stable slot", () => {
    render(
      <FadeIn>
        <p>Hello</p>
      </FadeIn>,
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(document.querySelector('[data-slot="fade-in"]')).toBeTruthy();
  });
});

describe("TextReveal", () => {
  it("exposes the full sentence while hiding the split words", () => {
    render(<TextReveal as="h2">Motion that explains cause</TextReveal>);
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveAttribute("aria-label", "Motion that explains cause");
    expect(heading.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });
});

describe("MorphButton", () => {
  it("calls onClick when idle", async () => {
    const onClick = vi.fn();
    render(<MorphButton onClick={onClick}>Save</MorphButton>);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("keeps focusable and swallows clicks while loading", async () => {
    const onClick = vi.fn();
    render(
      <MorphButton state="loading" onClick={onClick}>
        Save
      </MorphButton>,
    );
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeEnabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("NumberFlow", () => {
  it("exposes the formatted final value", () => {
    render(<NumberFlow value={12480} prefix="$" />);
    expect(screen.getByLabelText("$12,480")).toBeInTheDocument();
  });
});

describe("AnimatedTabs", () => {
  it("switches panels and updates aria-selected", async () => {
    render(
      <AnimatedTabs
        defaultValue="one"
        items={[
          { value: "one", label: "One", content: "First panel" },
          { value: "two", label: "Two", content: "Second panel" },
        ]}
      />,
    );
    expect(screen.getByRole("tab", { name: "One" })).toHaveAttribute("aria-selected", "true");
    await userEvent.click(screen.getByRole("tab", { name: "Two" }));
    expect(screen.getByRole("tab", { name: "Two" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Second panel")).toBeInTheDocument();
  });
});

describe("MotionAccordion", () => {
  it("toggles a panel with aria-expanded", async () => {
    render(<MotionAccordion items={[{ value: "a", trigger: "Question", content: "Answer" }]} />);
    const trigger = screen.getByRole("button", { name: "Question" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Answer")).toBeInTheDocument();
  });
});
