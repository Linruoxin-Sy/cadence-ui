import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/registry/cadence/accordion";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { expectMotionContract } from "../motion-contract";

function Items() {
  return (
    <>
      <AccordionItem value="one">
        <AccordionTrigger>First</AccordionTrigger>
        <AccordionContent className="custom-content">First answer</AccordionContent>
      </AccordionItem>
      <AccordionItem value="disabled" disabled>
        <AccordionTrigger>Disabled</AccordionTrigger>
        <AccordionContent>Disabled answer</AccordionContent>
      </AccordionItem>
      <AccordionItem value="two">
        <AccordionTrigger>Second</AccordionTrigger>
        <AccordionContent>Second answer</AccordionContent>
      </AccordionItem>
    </>
  );
}

function Controlled({ change }: { change: (...args: unknown[]) => void }) {
  const [value, setValue] = useState<string[]>(["one"]);
  return (
    <Accordion
      multiple
      value={value}
      onValueChange={(next, details) => {
        change(next, details);
        setValue(next);
      }}
    >
      <Items />
    </Accordion>
  );
}

describe("Accordion", () => {
  it("preserves slots, heading, labelled region and inner classes", () => {
    const { container } = render(
      <Accordion defaultValue={["one"]}>
        <Items />
      </Accordion>,
    );
    for (const slot of [
      "accordion",
      "accordion-item",
      "accordion-trigger",
      "accordion-trigger-icon",
      "accordion-content",
    ])
      expect(container.querySelector(`[data-slot="${slot}"]`)).toBeTruthy();
    expect(screen.getByRole("region", { name: "First" })).toHaveTextContent("First answer");
    expect(screen.getByRole("heading", { name: "First" })).toBeTruthy();
    expect(screen.getByText("First answer")).toHaveClass("custom-content");
    expect(screen.getByRole("button", { name: "First" })).toHaveAttribute("aria-expanded", "true");
  });

  it("toggles with Enter and Space and tabs past disabled items", async () => {
    const user = userEvent.setup();
    render(
      <Accordion>
        <Items />
      </Accordion>,
    );
    const first = screen.getByRole("button", { name: "First" });
    first.focus();
    await user.keyboard("{Enter}");
    expect(first).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{ArrowDown}");
    expect(first).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Second" })).toHaveFocus();
    await user.keyboard(" ");
    expect(first).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "Second" })).toHaveAttribute("aria-expanded", "true");
  });

  it("supports controlled arrays, multiple panels, root disabled and render/ref", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    const { unmount } = render(<Controlled change={change} />);
    await user.click(screen.getByRole("button", { name: "Second" }));
    expect(change.mock.calls[0]?.[0]).toEqual(["one", "two"]);
    expect(screen.getAllByRole("region")).toHaveLength(2);
    unmount();
    const ref = vi.fn();
    render(
      <Accordion disabled defaultValue={["x"]}>
        <AccordionItem value="x">
          <AccordionTrigger render={<button type="button" data-custom="yes" />} ref={ref}>
            Locked
          </AccordionTrigger>
          <AccordionContent>Locked answer</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    expect(screen.getByRole("button", { name: "Locked" })).toHaveAttribute("data-custom", "yes");
    expect(ref).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Locked" }));
    expect(screen.getByRole("button", { name: "Locked" })).toHaveAttribute("aria-expanded", "true");
  });

  it("keeps closed panels mounted on request and forwards hidden-until-found", () => {
    const { container } = render(
      <Accordion keepMounted hiddenUntilFound>
        <Items />
      </Accordion>,
    );
    const panel = container.querySelector('[data-slot="accordion-content"]');
    expect(panel).toHaveAttribute("hidden", "until-found");
    fireEvent(panel as Element, new Event("beforematch"));
    expect(screen.getByRole("button", { name: "First" })).toHaveAttribute("aria-expanded", "true");
  });

  for (const mode of ["full", "reduced", "none"] as const) {
    it(`uses real geometry branches in ${mode}`, async () => {
      const { container } = render(
        <CadenceProvider mode={mode}>
          <Accordion defaultValue={["one"]}>
            <Items />
          </Accordion>
        </CadenceProvider>,
      );
      const panel = screen.getByRole("region", { name: "First" });
      expectMotionContract(mode, { parts: [panel] });
      expect(panel.className.includes("transition-[height]")).toBe(mode === "full");
      if (mode !== "full") expect(panel).toHaveClass("duration-0");
      expect(panel.className).not.toMatch(/transform|scale|translate/);
      expect(panel.style.transform).toBe("");
      expect(panel.style.getPropertyValue("--cadence-disclosure-height")).toBe("0px");
      await userEvent.click(screen.getByRole("button", { name: "First" }));
      await waitFor(() => expect(container.querySelector('[data-slot="accordion-content"]')).toBeNull());
    });
  }
});
