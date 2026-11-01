import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/registry/cadence/collapsible";
import { CadenceProvider } from "@/registry/cadence/lib/provider";

function Example({ defaultOpen = false, disabled = false }) {
  return (
    <Collapsible defaultOpen={defaultOpen} disabled={disabled}>
      <CollapsibleTrigger>Details</CollapsibleTrigger>
      <CollapsibleContent>Optional content</CollapsibleContent>
    </Collapsible>
  );
}

function Controlled({ change }: { change: (...args: unknown[]) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible
      open={open}
      onOpenChange={(next, details) => {
        change(next, details.reason);
        setOpen(next);
      }}
    >
      <CollapsibleTrigger>Controlled</CollapsibleTrigger>
      <CollapsibleContent>Controlled content</CollapsibleContent>
    </Collapsible>
  );
}

describe("Collapsible", () => {
  it("preserves slots, outer classes/styles, state callbacks and render/ref", () => {
    const ref = vi.fn();
    const { container } = render(
      <Collapsible defaultOpen className={(state) => (state.open ? "root-open" : "root-closed")}>
        <CollapsibleTrigger render={<button type="button" data-custom="yes" />}>Details</CollapsibleTrigger>
        <CollapsibleContent
          ref={ref}
          render={<section />}
          className={(state) => (state.open ? "panel-open" : "panel-closed")}
          style={{ color: "red" }}
        >
          Optional content
        </CollapsibleContent>
      </Collapsible>,
    );
    for (const slot of ["collapsible", "collapsible-trigger", "collapsible-content", "collapsible-content-inner"])
      expect(container.querySelector(`[data-slot="${slot}"]`)).toBeTruthy();
    const panel = container.querySelector('[data-slot="collapsible-content"]');
    expect(panel?.tagName).toBe("SECTION");
    expect(panel).toHaveClass("panel-open");
    expect(panel).toHaveStyle({ color: "rgb(255, 0, 0)" });
    expect(ref).toHaveBeenCalledWith(panel);
    expect(screen.getByRole("button", { name: "Details" })).toHaveAttribute("aria-controls", panel?.id);
    expect(screen.getByRole("button", { name: "Details" })).toHaveAttribute("data-custom", "yes");
  });

  it("toggles with Enter/Space and keeps trigger focus", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.tab();
    const trigger = screen.getByRole("button", { name: "Details" });
    expect(trigger).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    await user.keyboard(" ");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

  it("supports controlled state, cancellation and disabled root", async () => {
    const change = vi.fn();
    const { unmount } = render(<Controlled change={change} />);
    await userEvent.click(screen.getByRole("button", { name: "Controlled" }));
    expect(change).toHaveBeenCalledWith(true, "trigger-press");
    expect(screen.getByText("Controlled content")).toBeVisible();
    unmount();
    const cancelled = render(
      <Collapsible onOpenChange={(_, details) => details.cancel()}>
        <CollapsibleTrigger>Cancelled</CollapsibleTrigger>
        <CollapsibleContent>Never open</CollapsibleContent>
      </Collapsible>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Cancelled" }));
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "false");
    cancelled.unmount();
    render(<Example disabled />);
    await userEvent.click(screen.getByRole("button", { name: "Details" }));
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "false");
  });

  it("retains closed content and supports find-in-page", () => {
    const { container, unmount } = render(
      <Collapsible>
        <CollapsibleTrigger>Persistent</CollapsibleTrigger>
        <CollapsibleContent keepMounted>Retained</CollapsibleContent>
      </Collapsible>,
    );
    expect(container.querySelector('[data-slot="collapsible-content"]')).toHaveAttribute("hidden");
    unmount();
    const found = render(
      <Collapsible>
        <CollapsibleTrigger>Find</CollapsibleTrigger>
        <CollapsibleContent hiddenUntilFound>Searchable</CollapsibleContent>
      </Collapsible>,
    );
    const panel = found.container.querySelector('[data-slot="collapsible-content"]');
    expect(panel).toHaveAttribute("hidden", "until-found");
    fireEvent(panel as Element, new Event("beforematch"));
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
  });

  for (const mode of ["full", "reduced", "none"] as const)
    it(`implements ${mode} geometry and unmounts`, async () => {
      const { container } = render(
        <CadenceProvider mode={mode}>
          <Example defaultOpen />
        </CadenceProvider>,
      );
      const panel = container.querySelector('[data-slot="collapsible-content"]') as HTMLElement;
      expect(panel).toHaveAttribute("data-motion", mode);
      expect(panel.className.includes("transition-[height]")).toBe(mode === "full");
      if (mode !== "full") expect(panel).toHaveClass("duration-0");
      expect(panel.className).not.toMatch(/transform|scale|translate/);
      expect(panel.style.transform).toBe("");
      expect(panel.style.getPropertyValue("--cadence-disclosure-height")).toBe("0px");
      await userEvent.click(screen.getByRole("button", { name: "Details" }));
      await waitFor(() => expect(container.querySelector('[data-slot="collapsible-content"]')).toBeNull());
    });
});
