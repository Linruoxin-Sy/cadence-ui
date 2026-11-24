import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CSSProperties } from "react";
import { useState } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { Button } from "@/registry/cadence/button";
import { CadenceProvider, type CadenceProviderProps } from "@/registry/cadence/lib/provider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/registry/cadence/tooltip";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

const modes = ["full", "reduced", "none"] as const;
type Mode = (typeof modes)[number];

function Example() {
  return (
    <TooltipProvider delay={0}>
      <Tooltip>
        <TooltipTrigger render={<Button variant="ghost" size="icon-sm" />} aria-label="Bold">
          B
        </TooltipTrigger>
        <TooltipContent>Bold (⌘B)</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function renderInMode(mode: NonNullable<CadenceProviderProps["mode"]>) {
  return render(
    <CadenceProvider mode={mode}>
      <Example />
    </CadenceProvider>,
  );
}

async function hover() {
  await userEvent.hover(screen.getByRole("button", { name: "Bold" }));
  return screen.findByRole("tooltip");
}

describe("Tooltip", () => {
  it("opens on hover and describes the trigger instead of naming it", async () => {
    render(<Example />);
    const trigger = screen.getByRole("button", { name: "Bold" });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    const tooltip = await hover();
    expect(tooltip).toHaveAttribute("data-slot", "tooltip-content");
    expect(tooltip).toHaveTextContent("Bold (⌘B)");
    // The hint is the description; the button keeps its own accessible name.
    expect(trigger).toHaveAccessibleName("Bold");
    expect(trigger).toHaveAccessibleDescription("Bold (⌘B)");
  });

  it("opens for a pointer already resting on the trigger when it appeared", async () => {
    // A trigger can mount under a pointer that is already on it: a streamed route
    // mounts its preview seconds after the reader's first pointer move. That pointer
    // sends no entry, and the primitive blocks hover moves until it hears one, so the
    // hint would stay closed until the pointer left and returned. jsdom has neither a
    // hover state nor a media query, so both facts are stated for this case.
    const matches = HTMLElement.prototype.matches;
    const hovered = vi.spyOn(HTMLElement.prototype, "matches").mockImplementation(function (
      this: HTMLElement,
      selector: string,
    ) {
      return selector === ":hover" ? true : matches.call(this, selector);
    });
    const media = window.matchMedia;
    const hovering = vi
      .spyOn(window, "matchMedia")
      .mockImplementation((query: string) => ({ ...media(query), matches: query === "(hover: hover)" }));

    try {
      render(<Example />);
      const tooltip = await screen.findByRole("tooltip", undefined, { timeout: 3000 });
      expect(tooltip).toHaveTextContent("Bold (⌘B)");
      expect(screen.getByRole("button", { name: "Bold" })).toHaveAccessibleDescription("Bold (⌘B)");
    } finally {
      hovered.mockRestore();
      hovering.mockRestore();
    }
  });

  it("opens on keyboard focus, which is the only reason a tooltip is usable without a pointer", async () => {
    render(<Example />);
    await userEvent.tab();

    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent("Bold (⌘B)");
    expect(screen.getByRole("button", { name: "Bold" })).toHaveFocus();
  });

  it("hides on Escape and keeps focus on the trigger", async () => {
    render(<Example />);
    await userEvent.tab();
    await screen.findByRole("tooltip");

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bold" })).toHaveFocus();
  });

  it.each(modes)("declares %s mode on the parts it owns", async (mode) => {
    renderInMode(mode);
    const tooltip = await hover();

    expectMotionContract(mode, { parts: [tooltip] });
    expect(tooltip).toHaveAttribute("data-motion", mode);
    expect(document.querySelector('[data-slot="tooltip-text"]')).toHaveAttribute("data-motion", mode);
    // Presence and geometry are committed executors, never a CSS starting/ending family.
    expect(tooltip.className).not.toContain("scale-(--motion-scale-in)");
    expect(tooltip.className).not.toContain("data-[starting-style]:");
    // The portal still owns its effective clock: none resolves every duration to
    // zero, and reduced runs the same tokens at the documented 0.6× scale.
    expect(tooltip.style.getPropertyValue("--motion-duration-fast")).toBe(
      mode === "none" ? "0s" : mode === "reduced" ? "0.096s" : "0.16s",
    );
  });

  it("keeps the positioner's native placement and the caller's render element", async () => {
    render(
      <CadenceProvider mode="none">
        <Tooltip open>
          <TooltipTrigger>Placement</TooltipTrigger>
          <TooltipContent
            side="top"
            sideOffset={8}
            className={(state) => (state.open ? "caller-open" : "caller-closed")}
            style={() => ({ padding: 9 }) as CSSProperties}
            render={(props) => <section {...props} data-render="function" />}
          >
            Placement hint
          </TooltipContent>
        </Tooltip>
      </CadenceProvider>,
    );
    const content = await screen.findByRole("tooltip");
    expect(content.tagName).toBe("SECTION");
    expect(content).toHaveClass("caller-open");
    expect(content.style.padding).toBe("9px");
    // Base UI's positioner keeps its own coordinates; the surface never rewrites them.
    const positioner = content.parentElement as HTMLElement;
    expect(positioner).toHaveAttribute("data-slot", "tooltip-positioner");
    expect(positioner.style.top).toBe("0px");
    expect(positioner.style.left).toBe("0px");
  });
});

type Frame = { open: boolean; hint: string | number; paint: boolean };

const initial = (): Frame => ({ open: true, hint: "Bold (⌘B)", paint: false });

type OpenChange = NonNullable<React.ComponentProps<typeof Tooltip>["onOpenChange"]>;

function Scene({ mode, frame, onOpenChange }: { mode: Mode; frame: Frame; onOpenChange: OpenChange }) {
  return (
    <CadenceProvider mode={mode} timeScale={0}>
      <Tooltip open={frame.open} onOpenChange={onOpenChange}>
        <TooltipTrigger>Hint trigger</TooltipTrigger>
        <TooltipContent style={frame.paint ? { backgroundColor: "#202020" } : undefined}>{frame.hint}</TooltipContent>
      </Tooltip>
    </CadenceProvider>
  );
}

describe("Tooltip v2 owners", () => {
  beforeAll(() => prepareV2MotionPlan());

  it.each(modes)("executes every owned tooltip action in %s", async (mode) => {
    let frame = initial();
    let view: ReturnType<typeof render>;
    const onOpenChange: OpenChange = (next, details) => {
      // Keep the closing hint so the owned exit runs before Base UI's own
      // completion decides when the portal node actually leaves the DOM.
      if (!next) details.preventUnmountOnClose();
      frame = { ...frame, open: next };
      view.rerender(scene());
    };
    const scene = () => <Scene mode={mode} frame={frame} onOpenChange={onOpenChange} />;
    const update = (next: Partial<Frame>) => {
      frame = { ...frame, ...next };
      view.rerender(scene());
    };

    view = render(scene());
    await screen.findByRole("tooltip");

    await expectV2MotionAction("tooltip", "tooltip.text.change", mode, () => update({ hint: "Bold shortcut applied" }));
    // Establish the numeric display owner, then revise it against that same slot.
    update({ hint: 7 });
    await expectV2MotionAction("tooltip", "tooltip.quantity.change", mode, () => update({ hint: 9 }));
    await expectV2MotionAction("tooltip", "tooltip.surface.colour", mode, () => update({ paint: true }));
    await expectV2MotionAction("tooltip", "tooltip.content.resize", mode, () =>
      update({ paint: true, hint: "A much longer hint that represents a real committed revision of the description" }),
    );

    // Default focus keeps the hint's own accessible relationship; Escape is the
    // native dismissal path and must run the owned exit on the same instance.
    const trigger = screen.getByRole("button", { name: "Hint trigger" });
    trigger.focus();
    await expectV2MotionAction("tooltip", "tooltip.content.exit", mode, async () => {
      await userEvent.keyboard("{Escape}");
    });
    await expectV2MotionAction("tooltip", "tooltip.content.enter", mode, () => update({ open: true }));

    expectMotionContract(mode, { policy: ["color"] });
    // The positioner and the composed rich-content boundary own no Cadence writer.
    await expectV2NativeBoundaries("tooltip", { container: document.body });
  });

  it("settles a live full to reduced to none downgrade on an open hint", async () => {
    const draw = (mode: Mode) => (
      <CadenceProvider mode={mode}>
        <Tooltip open>
          <TooltipTrigger>Downgrade</TooltipTrigger>
          <TooltipContent>Downgrade hint</TooltipContent>
        </Tooltip>
      </CadenceProvider>
    );
    const view = render(draw("full"));
    const content = document.querySelector('[data-slot="tooltip-content"]') as HTMLElement;
    expect(content).toHaveAttribute("data-motion", "full");
    view.rerender(draw("reduced"));
    expect(content).toHaveAttribute("data-motion", "reduced");
    view.rerender(draw("none"));
    expect(content).toHaveAttribute("data-motion", "none");
    await waitFor(() =>
      expect(
        [...(content.getAnimations?.() ?? [])].filter((animation) => animation.playState === "running"),
      ).toHaveLength(0),
    );
  });

  it("reuses one hint node for another trigger as a new baseline, not a cross-trigger run", async () => {
    const draw = (hint: string) => (
      <CadenceProvider mode="none" timeScale={0}>
        <Tooltip open>
          <TooltipTrigger>Identity</TooltipTrigger>
          <TooltipContent>{hint}</TooltipContent>
        </Tooltip>
      </CadenceProvider>
    );
    const view = render(draw("First hint"));
    const span = document.querySelector('[data-slot="tooltip-text"]') as HTMLElement;
    expect(span.textContent).toBe("First hint");

    view.rerender(draw("Second hint"));
    // The committed copy is always the exact current hint: no outgoing runs survive.
    await waitFor(() => expect(span.textContent).toBe("Second hint"));
    // The display slot stays one node across a same-entity revision.
    expect(document.querySelector('[data-slot="tooltip-text"]')).toBe(span);
  });

  it("keeps the trigger's described relationship while the hint updates", async () => {
    render(<DescribedHint />);
    const trigger = screen.getByRole("button", { name: "Described" });
    expect(trigger).toHaveAccessibleDescription("Stable hint");
    await userEvent.click(screen.getByRole("button", { name: "Update" }));
    expect(trigger).toHaveAccessibleDescription("Updated hint");
  });
});

function DescribedHint() {
  const [hint, setHint] = useState("Stable hint");
  return (
    <CadenceProvider mode="none">
      <Tooltip open>
        <TooltipTrigger>Described</TooltipTrigger>
        <TooltipContent>{hint}</TooltipContent>
      </Tooltip>
      <Button onClick={() => setHint("Updated hint")}>Update</Button>
    </CadenceProvider>
  );
}
