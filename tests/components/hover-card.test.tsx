import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CSSProperties } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/registry/cadence/hover-card";
import { CadenceProvider, type CadenceProviderProps } from "@/registry/cadence/lib/provider";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

const modes = ["full", "reduced", "none"] as const;
type Mode = (typeof modes)[number];

function Example() {
  return (
    <HoverCard>
      <HoverCardTrigger render={<button type="button" />}>@linruoxin</HoverCardTrigger>
      <HoverCardContent>
        <p>Lin Ruoxin</p>
        <button type="button">Follow</button>
      </HoverCardContent>
    </HoverCard>
  );
}

function panel() {
  return document.querySelector<HTMLElement>('[data-slot="hover-card-content"]');
}

function renderInMode(mode: NonNullable<CadenceProviderProps["mode"]>) {
  return render(
    <CadenceProvider mode={mode}>
      <Example />
    </CadenceProvider>,
  );
}

async function hover() {
  await userEvent.hover(screen.getByRole("button", { name: "@linruoxin" }));
  return screen.findByText("Lin Ruoxin");
}

describe("HoverCard", () => {
  it("opens on hover with upstream's portal and content slots", async () => {
    render(<Example />);
    expect(panel()).toBeNull();

    await hover();
    expect(panel()).toHaveAttribute("data-slot", "hover-card-content");
    // The trigger keeps its own name; the card is not wired as its description.
    const trigger = screen.getByRole("button", { name: "@linruoxin" });
    expect(trigger).toHaveAccessibleName("@linruoxin");
    expect(trigger).not.toHaveAttribute("aria-describedby");
    expect(document.querySelector('[data-slot="hover-card-portal"]')).not.toBeNull();
  });

  it("opens for a pointer already resting on the trigger when it appeared", async () => {
    // A trigger can mount under a pointer that is already on it: this route's preview
    // mounts seconds after the reader's first pointer move, so the entry that pointer
    // made was sent before this element could hear it, and a still pointer sends no
    // second one. jsdom has neither a hover state nor a media query, so both facts are
    // stated for this case instead of waited for.
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
      // No pointer event follows the mount: only completing the entry the pointer
      // already made can open this preview.
      await screen.findByText("Lin Ruoxin", undefined, { timeout: 3000 });
      expect(panel()).toHaveAttribute("data-slot", "hover-card-content");
    } finally {
      hovered.mockRestore();
      hovering.mockRestore();
    }
  });

  it("opens on keyboard focus and keeps its interactive content reachable", async () => {
    render(<Example />);
    await userEvent.tab();

    await screen.findByText("Lin Ruoxin");
    expect(screen.getByRole("button", { name: "@linruoxin" })).toHaveFocus();

    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Follow" })).toHaveFocus();
    expect(panel()).not.toBeNull();
  });

  it("closes on Escape and keeps focus on the trigger", async () => {
    render(<Example />);
    await userEvent.tab();
    await screen.findByText("Lin Ruoxin");

    await userEvent.keyboard("{Escape}");
    expect(panel()).toBeNull();
    expect(screen.getByRole("button", { name: "@linruoxin" })).toHaveFocus();
  });

  it.each(modes)("declares %s mode on the parts it owns", async (mode) => {
    renderInMode(mode);
    const content = await hover().then(() => panel());

    expectMotionContract(mode, { parts: [content] });
    expect(content).toHaveAttribute("data-motion", mode);
    // The anchor-side approach is a mode branch in the executor, never a CSS class.
    expect(content?.className).not.toContain("scale-(--motion-scale-in)");
    expect(content?.className).not.toContain("data-[starting-style]:");
    expect(content?.className).not.toContain("origin-(--transform-origin)");
    // The portal still owns its effective clock: none resolves every duration to
    // zero, and reduced runs the same tokens at the documented 0.6× scale.
    expect(content?.style.getPropertyValue("--motion-duration-fast")).toBe(
      mode === "none" ? "0s" : mode === "reduced" ? "0.096s" : "0.16s",
    );
  });

  it("keeps the positioner's native placement and the caller's render element", async () => {
    render(
      <CadenceProvider mode="none">
        <HoverCard open>
          <HoverCardTrigger>Placement</HoverCardTrigger>
          <HoverCardContent
            side="left"
            sideOffset={8}
            className={(state) => (state.open ? "caller-open" : "caller-closed")}
            style={() => ({ padding: 9 }) as CSSProperties}
            render={(props) => <section {...props} data-render="function" />}
          >
            Placement preview
          </HoverCardContent>
        </HoverCard>
      </CadenceProvider>,
    );
    const content = await screen.findByText("Placement preview");
    const surface = panel() as HTMLElement;
    expect(surface.tagName).toBe("SECTION");
    expect(surface).toHaveClass("caller-open");
    expect(surface.style.padding).toBe("9px");
    expect(content).toBeInTheDocument();
    // Base UI's positioner keeps its own coordinates; the surface never rewrites them.
    const positioner = surface.parentElement as HTMLElement;
    expect(positioner).toHaveAttribute("data-slot", "hover-card-positioner");
    expect(positioner.style.top).toBe("0px");
    expect(positioner.style.left).toBe("0px");
  });

  it("renders a primitive string in the owned text slot and a direct number in the quantity slot", async () => {
    const draw = (children: string | number) => (
      <CadenceProvider mode="none">
        <HoverCard open>
          <HoverCardTrigger>Display</HoverCardTrigger>
          <HoverCardContent>{children}</HoverCardContent>
        </HoverCard>
      </CadenceProvider>
    );
    const view = render(draw("Plain preview"));
    expect(document.querySelector('[data-slot="hover-card-text"]')).toHaveTextContent("Plain preview");
    expect(document.querySelector('[data-slot="hover-card-number"]')).toBeNull();

    view.rerender(draw(12));
    // The two display owners are distinct slots: a numeric quantity never replaces
    // characters, and the text slot is no longer the mounted one.
    expect(document.querySelector('[data-slot="hover-card-number"]')).toHaveTextContent("12");
    expect(document.querySelector('[data-slot="hover-card-text"]')).toBeNull();
  });
});

type Frame = { open: boolean; content: string | number; paint: boolean };

const initial = (): Frame => ({ open: true, content: "Lin Ruoxin", paint: false });

type OpenChange = NonNullable<React.ComponentProps<typeof HoverCard>["onOpenChange"]>;

function Scene({ mode, frame, onOpenChange }: { mode: Mode; frame: Frame; onOpenChange: OpenChange }) {
  return (
    <CadenceProvider mode={mode} timeScale={0}>
      <HoverCard open={frame.open} onOpenChange={onOpenChange}>
        <HoverCardTrigger>Preview trigger</HoverCardTrigger>
        <HoverCardContent style={frame.paint ? { backgroundColor: "#202020" } : undefined}>
          {frame.content}
        </HoverCardContent>
      </HoverCard>
    </CadenceProvider>
  );
}

describe("HoverCard v2 owners", () => {
  beforeAll(() => prepareV2MotionPlan());

  it.each(modes)("executes every owned hover-card action in %s", async (mode) => {
    let frame = initial();
    let view: ReturnType<typeof render>;
    const onOpenChange: OpenChange = (next, details) => {
      // Keep the closing preview so the owned exit runs before Base UI's own
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
    await screen.findByText("Lin Ruoxin");

    await expectV2MotionAction("hover-card", "hover-card.text.change", mode, () =>
      update({ content: "Lin Ruoxin, maintainer" }),
    );
    // Establish the numeric display owner, then revise it against that same slot.
    update({ content: 7 });
    await expectV2MotionAction("hover-card", "hover-card.quantity.change", mode, () => update({ content: 9 }));
    await expectV2MotionAction("hover-card", "hover-card.surface.colour", mode, () => update({ paint: true }));
    await expectV2MotionAction("hover-card", "hover-card.content.resize", mode, () =>
      update({
        paint: true,
        content: "A much longer preview that represents a real committed revision of the card's primitive content",
      }),
    );

    // Focus is what makes Escape a supported native dismissal here; the preview
    // must not take focus by itself.
    const trigger = screen.getByText("Preview trigger");
    trigger.focus();
    await expectV2MotionAction("hover-card", "hover-card.content.exit", mode, async () => {
      await userEvent.keyboard("{Escape}");
    });
    await expectV2MotionAction("hover-card", "hover-card.content.enter", mode, () => update({ open: true }));

    expectMotionContract(mode, { policy: ["color"] });
    // The positioner and the composed rich-content boundary own no Cadence writer.
    await expectV2NativeBoundaries("hover-card", { container: document.body });
  });

  it("settles a live full to reduced to none downgrade on an open preview", async () => {
    const draw = (mode: Mode) => (
      <CadenceProvider mode={mode}>
        <HoverCard open>
          <HoverCardTrigger>Downgrade</HoverCardTrigger>
          <HoverCardContent>Downgrade preview</HoverCardContent>
        </HoverCard>
      </CadenceProvider>
    );
    const view = render(draw("full"));
    const content = panel() as HTMLElement;
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

  it("reuses one preview node for another record as a new baseline, not a cross-record run", async () => {
    const draw = (preview: string) => (
      <CadenceProvider mode="none" timeScale={0}>
        <HoverCard open triggerId="reviewer-record">
          <HoverCardTrigger id="reviewer-record">Identity</HoverCardTrigger>
          <HoverCardContent>{preview}</HoverCardContent>
        </HoverCard>
      </CadenceProvider>
    );
    const view = render(draw("First reviewer"));
    const span = document.querySelector('[data-slot="hover-card-text"]') as HTMLElement;
    expect(span.textContent).toBe("First reviewer");

    view.rerender(draw("Second reviewer"));
    // The committed copy is always the exact current record: no outgoing runs survive.
    await waitFor(() => expect(span.textContent).toBe("Second reviewer"));
    // The display slot stays one node across a same-record revision.
    expect(document.querySelector('[data-slot="hover-card-text"]')).toBe(span);
  });

  it("preserves the caller's trigger open state and never moves focus into the preview", async () => {
    render(
      <CadenceProvider mode="full">
        <HoverCard>
          <HoverCardTrigger render={<a href="/docs/changelog" />}>Anchored trigger</HoverCardTrigger>
          <HoverCardContent>Supplemental preview</HoverCardContent>
        </HoverCard>
      </CadenceProvider>,
    );
    const trigger = screen.getByRole("link", { name: "Anchored trigger" });
    await userEvent.tab();
    await screen.findByText("Supplemental preview");
    expect(trigger).toHaveFocus();
    // The card is supplementary: it is neither a dialog nor the trigger's description.
    expect(panel()).not.toHaveAttribute("role");
    expect(trigger).not.toHaveAttribute("aria-describedby");
  });
});
