import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PresenceContext } from "motion/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/registry/cadence/alert-dialog";
import { Button } from "@/registry/cadence/button";
import { CadenceProvider, type CadenceProviderProps } from "@/registry/cadence/lib/provider";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

/** A presence boundary the composed action can be flipped through without a mount. */
const presence = (present: boolean) => ({
  id: "retained",
  initial: false as const,
  isPresent: present,
  register: () => () => {},
  onExitComplete: () => {},
});

const modes = ["full", "reduced", "none"] as const;
type Mode = (typeof modes)[number];

function Example({ onConfirm }: { onConfirm?: () => void } = {}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="outline" />}>Delete project</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <span aria-hidden="true">!</span>
          </AlertDialogMedia>
          <AlertDialogTitle>Delete project</AlertDialogTitle>
          <AlertDialogDescription>Every deployment goes with it.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep project</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function renderInMode(mode: NonNullable<CadenceProviderProps["mode"]>) {
  return render(
    <CadenceProvider mode={mode}>
      <Example />
    </CadenceProvider>,
  );
}

async function open() {
  await userEvent.click(screen.getByRole("button", { name: "Delete project" }));
  return screen.findByRole("alertdialog");
}

describe("AlertDialog", () => {
  it("opens as an alert dialog with an accessible name and upstream's slots", async () => {
    render(<Example />);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();

    const dialog = await open();
    expect(dialog).toHaveAttribute("data-slot", "alert-dialog-content");
    expect(dialog).toHaveAccessibleName("Delete project");
    expect(dialog).toHaveAttribute("data-size", "default");
    // Focus lands on the cancel control, not on the destructive one: a stray Enter
    // must not be able to confirm the action.
    expect(screen.getByRole("button", { name: "Keep project" })).toHaveFocus();

    for (const slot of [
      "alert-dialog-header",
      "alert-dialog-media",
      "alert-dialog-title",
      "alert-dialog-description",
      "alert-dialog-footer",
    ]) {
      expect(document.querySelector(`[data-slot="${slot}"]`)).not.toBeNull();
    }
  });

  it("confirms through the action without silently closing the confirmation workflow", async () => {
    const onConfirm = vi.fn();
    render(<Example onConfirm={onConfirm} />);
    const trigger = screen.getByRole("button", { name: "Delete project" });
    await open();

    const action = screen.getByRole("button", { name: "Delete" });
    expect(action).toHaveAttribute("data-slot", "alert-dialog-action");
    await userEvent.click(action);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Keep project" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("cancels through its own control", async () => {
    render(<Example />);
    await open();

    const cancel = screen.getByRole("button", { name: "Keep project" });
    expect(cancel).toHaveAttribute("data-slot", "alert-dialog-cancel");
    await userEvent.click(cancel);

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("refuses an outside press, which is what makes it an alert dialog", async () => {
    render(<Example />);
    await open();

    await userEvent.click(document.body);
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("cancels on Escape, the one dismissal path besides the two buttons", async () => {
    render(<Example />);
    await open();

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it.each(modes)("fades the panel and backdrop with one owner each in %s", async (mode) => {
    renderInMode(mode);
    const dialog = await open();

    const overlay = document.querySelector('[data-slot="alert-dialog-overlay"]');
    expect(dialog).toHaveAttribute("data-motion", mode);
    expect(overlay).toHaveAttribute("data-motion", mode);
    // Presence is a managed opacity/scale writer, never a competing CSS transition family.
    expect(dialog.className).not.toMatch(/transition-(?:opacity|\[)/);
    expect(overlay?.className).not.toMatch(/transition-(?:opacity|\[)/);
    expect(dialog.className).not.toContain("scale-(--motion-scale-in)");
    expectMotionContract(mode, { policy: ["color"] });
  });

  it("preserves caller render, class/style callbacks and React 19 ref cleanup", () => {
    const cleanup = vi.fn();
    const ref = vi.fn(() => cleanup);
    const view = render(
      <CadenceProvider mode="none">
        <AlertDialog open>
          <AlertDialogContent
            ref={ref}
            render={<section />}
            className={(state) => (state.open ? "open-class" : "closed-class")}
            style={(state) => ({ opacity: state.open ? 0.9 : 0.2 })}
          >
            <AlertDialogTitle>Rendered panel</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      </CadenceProvider>,
    );
    const node = document.querySelector('[data-slot="alert-dialog-content"]') as HTMLElement;
    expect(node.tagName).toBe("SECTION");
    expect(node).toHaveClass("open-class");
    expect(node).not.toHaveClass("closed-class");
    expect(node.style.opacity).toBe("0.9");
    expect(ref).toHaveBeenCalledWith(node);
    view.unmount();
    expect(cleanup).toHaveBeenCalled();
  });

  it("keeps the alert's own dismissal when a controlled close is refused", async () => {
    render(
      <AlertDialog
        onOpenChange={(next, details) => {
          if (!next) details.cancel();
        }}
      >
        <AlertDialogTrigger render={<Button variant="outline" />}>Controlled</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Controlled alert</AlertDialogTitle>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Controlled" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog.contains(document.activeElement)).toBe(true);
    await userEvent.keyboard("{Escape}");
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });
});

type Frame = {
  open: boolean;
  title: string | number;
  description: string | number;
  body: string;
  paint: boolean;
  media: boolean;
  foreground: boolean;
};

type OpenChange = NonNullable<React.ComponentProps<typeof AlertDialog>["onOpenChange"]>;

const initial = (): Frame => ({
  open: true,
  title: "Delete project",
  description: "Every deployment goes with it.",
  body: "Short message.",
  paint: false,
  media: false,
  foreground: false,
});

function Scene({ mode, frame, onOpenChange }: { mode: Mode; frame: Frame; onOpenChange: OpenChange }) {
  return (
    <CadenceProvider mode={mode} timeScale={0}>
      <AlertDialog open={frame.open} onOpenChange={onOpenChange}>
        <AlertDialogContent style={frame.paint ? { backgroundColor: "#202020" } : undefined}>
          <AlertDialogHeader>
            <AlertDialogMedia style={frame.media ? { backgroundColor: "#303030" } : undefined}>
              <span aria-hidden="true">!</span>
            </AlertDialogMedia>
            <AlertDialogTitle style={frame.foreground ? { color: "#123456" } : undefined}>
              {frame.title}
            </AlertDialogTitle>
            <AlertDialogDescription style={frame.foreground ? { color: "#654321" } : undefined}>
              {frame.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <p>{frame.body}</p>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep project</AlertDialogCancel>
            <AlertDialogAction>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CadenceProvider>
  );
}

describe("AlertDialog v2 owners", () => {
  beforeAll(() => prepareV2MotionPlan());

  it.each(modes)("executes every owned alert-dialog action in %s", async (mode) => {
    let frame = initial();
    let view: ReturnType<typeof render>;
    const onOpenChange: OpenChange = (next, details) => {
      // Keep the closing surface so the owned exit can run before Base UI's own
      // completion decides when the modal parts actually leave the DOM.
      if (!next) details.preventUnmountOnClose();
      frame = { ...frame, open: next };
      view.rerender(scene());
    };
    const scene = () => <Scene mode={mode} frame={frame} onOpenChange={onOpenChange} />;
    const update = (next: Partial<Frame>) => {
      frame = { ...frame, ...next };
      view.rerender(scene());
    };
    // Cancel is the alert's own dismiss path; Escape and outside presses are not.
    const close = async () => {
      const cancel = document.querySelector('[data-slot="alert-dialog-cancel"]');
      expect(cancel).toBeTruthy();
      await userEvent.click(cancel as Element);
    };

    view = render(scene());
    await screen.findByRole("alertdialog");

    await expectV2MotionAction("alert-dialog", "alert-dialog.title.change", mode, () =>
      update({ title: "Delete this project" }),
    );
    await expectV2MotionAction("alert-dialog", "alert-dialog.description.change", mode, () =>
      update({ description: "Every deployment and its logs go with it." }),
    );
    // Establish the numeric display owner, then revise it against that same slot.
    update({ title: 7, description: 8 });
    await expectV2MotionAction("alert-dialog", "alert-dialog.quantity.change", mode, () =>
      update({ title: 9, description: 11 }),
    );
    // The panel and the media region own their surface paint separately.
    await expectV2MotionAction("alert-dialog", "alert-dialog.surface.colour", mode, () =>
      update({ paint: true, media: true }),
    );
    await expectV2MotionAction("alert-dialog", "alert-dialog.foreground.colour", mode, () =>
      update({ paint: true, media: true, foreground: true }),
    );
    await expectV2MotionAction("alert-dialog", "alert-dialog.content.resize", mode, () =>
      update({
        paint: true,
        media: true,
        foreground: true,
        body: "A much longer message that represents a real committed content revision.",
      }),
    );

    await expectV2MotionAction("alert-dialog", "alert-dialog.content.exit", mode, close);
    await expectV2MotionAction("alert-dialog", "alert-dialog.content.enter", mode, () => update({ open: true }));
    await expectV2MotionAction("alert-dialog", "alert-dialog.overlay.exit", mode, close);
    await expectV2MotionAction("alert-dialog", "alert-dialog.overlay.enter", mode, () => update({ open: true }));

    expectMotionContract(mode, { policy: ["color"] });
    // The composed action and cancel are inherited boundaries, never local writers.
    await expectV2NativeBoundaries("alert-dialog", { container: document.body });
  });

  it.each(modes)("keeps each composed action's own Button owners in %s", async (mode) => {
    let frame = { present: true, label: "Delete" as string | number, text: "Delete this project?", paint: false };
    let view: ReturnType<typeof render>;
    const draw = () => (
      <CadenceProvider mode={mode} timeScale={0}>
        <PresenceContext.Provider value={presence(frame.present)}>
          <AlertDialog open>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{frame.text}</AlertDialogTitle>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction style={frame.paint ? { backgroundColor: "#303030" } : undefined}>
                  {frame.label}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </PresenceContext.Provider>
      </CadenceProvider>
    );
    const update = (next: Partial<typeof frame>) => {
      frame = { ...frame, ...next };
      view.rerender(draw());
    };
    view = render(draw());
    const action = document.querySelector('[data-slot="alert-dialog-action"]') as HTMLButtonElement;
    expect(action).toBeInstanceOf(HTMLButtonElement);

    // Button keeps one press visual on its own inner layer.
    await expectV2MotionAction("alert-dialog", "alert-dialog.actions-feedback.press", mode, () => {
      fireEvent.pointerDown(action.querySelector('[data-slot="button-feedback"]') ?? action, {
        button: 0,
        pointerId: 1,
        isPrimary: true,
      });
    });
    fireEvent.pointerUp(action, { pointerId: 1 });
    // …one surface/foreground family on the root it renders…
    await expectV2MotionAction("alert-dialog", "alert-dialog.actions.colour", mode, () =>
      update({ paint: true, text: "Delete this project now?" }),
    );
    // …one measured box, one label owner and one quantity owner.
    await expectV2MotionAction(
      "alert-dialog",
      "alert-dialog.actions.resize",
      mode,
      () => update({ label: "Delete and archive" }),
      { properties: ["height", "width"] },
    );
    await expectV2MotionAction("alert-dialog", "alert-dialog.actions-label.replace", mode, () =>
      update({ label: "Delete and archive now" }),
    );
    update({ label: 7 });
    await expectV2MotionAction("alert-dialog", "alert-dialog.actions-number.roll", mode, () => update({ label: 8 }));
    // …and one retained exit, owned by Button rather than by the alert.
    await expectV2MotionAction("alert-dialog", "alert-dialog.actions.exit", mode, () => update({ present: false }));
    view.unmount();
  });

  it("settles a live full to reduced to none downgrade on an open alert", async () => {
    const draw = (mode: Mode) => (
      <CadenceProvider mode={mode}>
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogTitle>Downgrade</AlertDialogTitle>
            <AlertDialogDescription>Downgrade body</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      </CadenceProvider>
    );
    const view = render(draw("full"));
    const content = document.querySelector('[data-slot="alert-dialog-content"]') as HTMLElement;
    expect(content).toHaveAttribute("data-motion", "full");
    view.rerender(draw("reduced"));
    expect(content).toHaveAttribute("data-motion", "reduced");
    view.rerender(draw("none"));
    expect(content).toHaveAttribute("data-motion", "none");
    expect(content.style.transitionDuration).toBe("0s");
    await waitFor(() =>
      expect(
        [...(content.getAnimations?.() ?? [])].filter((animation) => animation.playState === "running"),
      ).toHaveLength(0),
    );
  });
});
