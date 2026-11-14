import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/registry/cadence/collapsible";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

const modes = ["full", "reduced", "none"] as const;

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
    for (const slot of [
      "collapsible",
      "collapsible-trigger",
      "collapsible-content",
      "collapsible-content-inner",
      "collapsible-trigger-label",
      "collapsible-content-label",
    ])
      expect(container.querySelector(`[data-slot="${slot}"]`)).toBeTruthy();
    const panel = container.querySelector('[data-slot="collapsible-content"]');
    expect(panel?.tagName).toBe("SECTION");
    expect(panel).toHaveClass("panel-open");
    expect(panel).toHaveStyle({ color: "rgb(255, 0, 0)" });
    expect(ref).toHaveBeenCalledWith(panel);
    expect(screen.getByRole("button", { name: "Details" })).toHaveAttribute("aria-controls", panel?.id);
    expect(screen.getByRole("button", { name: "Details" })).toHaveAttribute("data-custom", "yes");
  });

  it("keeps state-dependent decoration on a persistent outer panel", async () => {
    const { container } = render(
      <Collapsible defaultOpen>
        <CollapsibleTrigger>Persistent decoration</CollapsibleTrigger>
        <CollapsibleContent
          keepMounted
          className={(state) => (state.open ? "p-4 border" : "p-2 border")}
          style={(state) => ({ paddingBottom: state.open ? 31 : 12, boxSizing: "content-box" })}
        >
          Retained detail
        </CollapsibleContent>
      </Collapsible>,
    );
    const panel = container.querySelector('[data-slot="collapsible-content"]');
    expect(panel).toHaveClass("p-4", "border");
    expect(panel).toHaveStyle({ paddingBottom: "31px", boxSizing: "content-box" });
    await userEvent.click(screen.getByRole("button", { name: "Persistent decoration" }));
    await waitFor(() => expect(panel).toHaveAttribute("hidden"));
    expect(panel).toHaveClass("p-2", "border");
    expect(panel).toHaveStyle({ paddingBottom: "12px" });
    expect(panel?.firstElementChild).not.toHaveAttribute("style");
    await userEvent.click(screen.getByRole("button", { name: "Persistent decoration" }));
    expect(panel).not.toHaveAttribute("hidden");
    expect(panel).toHaveStyle({ paddingBottom: "31px" });
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
});

describe("Collapsible v2 motion", () => {
  beforeAll(() => prepareV2MotionPlan());

  it.each(modes)("executes the measured content revision and changed labels in %s", async (mode) => {
    const draw = (label: string, body: string) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <Collapsible defaultOpen>
          <CollapsibleTrigger>{label}</CollapsibleTrigger>
          <CollapsibleContent keepMounted>{body}</CollapsibleContent>
        </Collapsible>
      </CadenceProvider>
    );
    const view = render(draw("First answer", "First body"));
    const panel = view.container.querySelector('[data-slot="collapsible-content"]') as HTMLElement;
    await expectV2MotionAction(
      "collapsible",
      "collapsible.content.resize",
      mode,
      () => view.rerender(draw("First answer", "A longer first body")),
      { container: view.container },
    );
    await expectV2MotionAction(
      "collapsible",
      "collapsible.label.replace",
      mode,
      () => view.rerender(draw("Second answer", "A longer second body")),
      { container: view.container },
    );
    expect(panel).toBe(view.container.querySelector('[data-slot="collapsible-content"]'));
    expectMotionContract(mode, { root: view.container, parts: [panel], policy: ["color"] });
  });

  it.each(modes)("executes changed quantities in %s", async (mode) => {
    const draw = (value: number) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <Collapsible defaultOpen>
          <CollapsibleTrigger>{value}</CollapsibleTrigger>
          <CollapsibleContent keepMounted>{value}</CollapsibleContent>
        </Collapsible>
      </CadenceProvider>
    );
    const view = render(draw(19));
    await expectV2MotionAction("collapsible", "collapsible.value.change", mode, () => view.rerender(draw(20)), {
      container: view.container,
    });
    expect(screen.getByRole("button", { name: "20" })).toBeTruthy();
    expectMotionContract(mode, { root: view.container });
  });

  it.each(modes)("executes the trigger colour owner in %s", async (mode) => {
    const paint = (on: boolean) => ({
      color: on ? "#112233" : "#445566",
      borderColor: on ? "#778899" : "#aabbcc",
    });
    const draw = (on: boolean) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <Collapsible defaultOpen>
          <CollapsibleTrigger style={paint(on)}>Paint</CollapsibleTrigger>
          <CollapsibleContent>Paint body</CollapsibleContent>
        </Collapsible>
      </CadenceProvider>
    );
    const view = render(draw(false));
    await expectV2MotionAction("collapsible", "collapsible.trigger.colour", mode, () => view.rerender(draw(true)), {
      container: view.container,
    });
    const trigger = view.container.querySelector('[data-slot="collapsible-trigger"]') as HTMLElement;
    expect(trigger.style.color).toBe("rgb(17, 34, 51)");
    expect(trigger.dataset.cadenceColor).toContain("color");
  });

  it.each(modes)("retains the inner content paint in %s", async (mode) => {
    const user = userEvent.setup();
    const view = render(
      <CadenceProvider mode={mode} timeScale={0}>
        <Collapsible defaultOpen>
          <CollapsibleTrigger>Retained</CollapsibleTrigger>
          <CollapsibleContent keepMounted>Retained body</CollapsibleContent>
        </Collapsible>
      </CadenceProvider>,
    );
    const panel = view.container.querySelector('[data-slot="collapsible-content"]') as HTMLElement;
    await expectV2MotionAction(
      "collapsible",
      "collapsible.content-paint.exit",
      mode,
      () => user.click(screen.getByRole("button", { name: "Retained" })),
      { container: view.container },
    );
    expect(panel).toHaveAttribute("hidden");
    await expectV2MotionAction(
      "collapsible",
      "collapsible.content-paint.enter",
      mode,
      () => user.click(screen.getByRole("button", { name: "Retained" })),
      { container: view.container },
    );
    expect(panel).not.toHaveAttribute("hidden");
    expectMotionContract(mode, { root: view.container, parts: [panel] });
  });

  it.each(modes)("keeps the composed rich-content regions native in %s", async (mode) => {
    const view = render(
      <CadenceProvider mode={mode} timeScale={0}>
        <Collapsible defaultOpen>
          <CollapsibleTrigger>Boundary label</CollapsibleTrigger>
          <CollapsibleContent>Boundary body</CollapsibleContent>
        </Collapsible>
        <Collapsible defaultOpen>
          <CollapsibleTrigger>{7}</CollapsibleTrigger>
          <CollapsibleContent>{7}</CollapsibleContent>
        </Collapsible>
      </CadenceProvider>,
    );
    await expectV2NativeBoundaries("collapsible", { container: view.container });
  });

  it.each(modes)("keeps the semantic open state and unmounts a closed panel in %s", async (mode) => {
    const view = render(
      <CadenceProvider mode={mode} timeScale={0}>
        <Collapsible defaultOpen>
          <CollapsibleTrigger>Shell</CollapsibleTrigger>
          <CollapsibleContent>Shell body</CollapsibleContent>
        </Collapsible>
      </CadenceProvider>,
    );
    const panel = view.container.querySelector('[data-slot="collapsible-content"]') as HTMLElement;
    expect(panel).not.toHaveAttribute("hidden");
    if (mode === "full") expect(panel.className).toContain("duration-(--motion-duration-slow)");
    else expect(panel.className).toContain("transition-none");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Shell" }));
    });
    await waitFor(() => expect(view.container.querySelector('[data-slot="collapsible-content"]')).toBeNull());
  });

  it("settles a live full to reduced to none downgrade on an unchanged open body", () => {
    const draw = (mode: (typeof modes)[number]) => (
      <CadenceProvider mode={mode}>
        <Collapsible defaultOpen>
          <CollapsibleTrigger>Downgrade</CollapsibleTrigger>
          <CollapsibleContent>Downgrade body</CollapsibleContent>
        </Collapsible>
      </CadenceProvider>
    );
    const view = render(draw("full"));
    const panel = view.container.querySelector('[data-slot="collapsible-content"]') as HTMLElement;
    expect(panel).toHaveAttribute("data-motion", "full");
    view.rerender(draw("reduced"));
    expect(panel).toHaveAttribute("data-motion", "reduced");
    expect(panel.className).toContain("transition-none");
    view.rerender(draw("none"));
    expect(panel).toHaveAttribute("data-motion", "none");
    expect(panel.className).toContain("duration-0");
    expect(panel).not.toHaveAttribute("hidden");
  });
});
