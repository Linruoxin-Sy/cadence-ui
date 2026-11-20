import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PresenceContext } from "motion/react";
import { useEffect, useState } from "react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import {
  createToastManager,
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastDescription,
  Toaster,
  ToastPortal,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  useToastManager,
} from "@/registry/cadence/toast";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

describe("Toast", () => {
  it("forwards named viewport props and refs while retaining the default and each manager's list", async () => {
    const manager = createToastManager();
    const other = createToastManager();
    const cleanup = vi.fn();
    const ref = vi.fn(() => cleanup);
    const { unmount } = render(
      <CadenceProvider mode="none">
        <Toaster toastManager={manager} timeout={0} />
        <Toaster
          toastManager={other}
          timeout={0}
          viewportProps={{ "aria-label": "Export notifications", className: "caller", ref, lang: "en" }}
        />
      </CadenceProvider>,
    );
    expect(screen.getByRole("region", { name: "Notifications" })).toHaveAttribute("aria-live", "polite");
    const viewport = screen.getByRole("region", { name: "Export notifications" });
    expect(viewport).toHaveClass("caller");
    expect(viewport).toHaveAttribute("lang", "en");
    expect(viewport).toHaveAttribute("data-slot", "toast-viewport");
    expect(ref).toHaveBeenCalledWith(viewport);
    act(() => {
      manager.add({ title: "Saved here", type: "success" });
      other.add({ title: "Export ready", actionProps: { children: "Download" } });
    });
    await screen.findByText("Export ready");
    expect(viewport).toContainElement(screen.getByRole("button", { name: "Download" }));
    expect(viewport).not.toContainElement(screen.getByText("Saved here"));
    act(() => other.close());
    await waitFor(() => expect(screen.queryByText("Export ready")).not.toBeInTheDocument());
    expect(screen.getByText("Saved here")).toBeVisible();
    unmount();
    expect(cleanup).toHaveBeenCalledOnce();
  });
  it.each(["full", "reduced", "none"] as const)("renders slots with %s motion", async (mode) => {
    const manager = createToastManager();
    render(
      <CadenceProvider mode={mode}>
        <Toaster toastManager={manager} timeout={0} />
      </CadenceProvider>,
    );
    act(() => {
      manager.add({
        title: "Saved",
        description: "Workspace updated",
        type: "success",
        actionProps: { children: "Undo" },
      });
    });
    await screen.findByText("Saved");
    const root = document.querySelector('[data-slot="toast"]');
    expectMotionContract(mode, { parts: [root] });
    // The root's scale envelope and the swipe release family are owned by their
    // executors, not by authored `scale-*`/`duration-*` utility classes.
    expect(root?.className).not.toMatch(/(?:^|\s)scale-/);
    // The only remaining authored family is the primitive's own swipe release
    // channel: a token clock in full, removed entirely when motion is restricted.
    expect(root?.className.includes("duration-(--motion-duration-base)")).toBe(mode === "full");
    expect(root?.className.includes("transition-none")).toBe(mode !== "full");
    for (const slot of [
      "toast-viewport",
      "toast-content",
      "toast-title",
      "toast-description",
      "toast-icon",
      "toast-action",
      "toast-close",
    ]) {
      expect(document.querySelector(`[data-slot="${slot}"]`)).not.toBeNull();
    }
    expect(document.querySelector('[data-slot="toast-close"]')).toHaveAttribute("aria-label", "Close toast");
  });
  it.each(["full", "reduced", "none"] as const)("keeps limited notifications hidden under %s", async (mode) => {
    const manager = createToastManager();
    render(
      <CadenceProvider mode={mode}>
        <Toaster toastManager={manager} timeout={0} limit={2} />
      </CadenceProvider>,
    );
    act(() => {
      for (const title of ["First", "Second", "Third"]) manager.add({ title });
    });
    await screen.findByText("Third");
    const limited = document.querySelector('[data-slot="toast"][data-limited]');
    expect(limited).not.toBeNull();
    expect(limited?.className).toContain("data-limited:opacity-0");
    expect(limited).toHaveAttribute("inert");
    expectMotionContract(mode);
  });
  it("updates caller state, executes a keyboard action, and removes the toast", async () => {
    const manager = createToastManager();
    const onClick = vi.fn();
    render(
      <CadenceProvider mode="none">
        <Toaster toastManager={manager} timeout={0} />
      </CadenceProvider>,
    );
    let id = "";
    act(() => {
      id = manager.add({ title: "Queued", type: "loading" });
    });
    await screen.findByText("Queued");
    act(() => {
      manager.update(id, { title: "Ready", actionProps: { children: "Open", onClick } });
    });
    const action = await screen.findByRole("button", { name: "Open" });
    act(() => action.focus());
    await userEvent.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getByText("Ready")).toBeInTheDocument();
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(document.querySelector('[data-slot="toast"]')).toBeNull());
  });
  it("isolates managers and supports explicit close and onRemove", async () => {
    const manager = createToastManager();
    const other = createToastManager();
    const onRemove = vi.fn();
    render(
      <CadenceProvider mode="none">
        <Toaster toastManager={manager} timeout={0} />
      </CadenceProvider>,
    );
    act(() => {
      other.add({ title: "Elsewhere" });
      manager.add({ id: "local", title: "Here", onRemove });
    });
    await screen.findByText("Here");
    expect(screen.queryByText("Elsewhere")).not.toBeInTheDocument();
    act(() => manager.close("local"));
    await waitFor(() => expect(document.querySelector('[data-slot="toast"]')).toBeNull());
    expect(onRemove).toHaveBeenCalledOnce();
  });
});

function RetainedList() {
  const { toasts } = useToastManager();
  const [item, setItem] = useState<unknown>(null);
  useEffect(() => {
    if (toasts[0]) setItem(toasts[0]);
  }, [toasts]);
  if (!item) return null;
  return (
    <Toast toast={item as never}>
      <ToastContent>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <ToastTitle>Saved</ToastTitle>
          <ToastDescription>Workspace updated</ToastDescription>
        </div>
        <ToastAction>Undo</ToastAction>
        <ToastClose />
      </ToastContent>
    </Toast>
  );
}

const modes = ["full", "reduced", "none"] as const;

type PaintFrame = {
  surface: string;
  foreground: string;
  paint: boolean;
  present: boolean;
  label: string | number;
};

/** The shipped list holds no caller paint, so this scene supplies the component's own
 * known tokens for the surface and foreground regions and one Button-backed action whose
 * paint, label, quantity, press and retained exit stay Button's owners. */
function PaintedList({ frame }: { frame: PaintFrame }) {
  const { toasts } = useToastManager();
  const [item, setItem] = useState<unknown>(null);
  useEffect(() => {
    if (toasts[0]) setItem(toasts[0]);
  }, [toasts]);
  if (!item) return null;
  return (
    <Toast toast={item as never} className={frame.surface}>
      <ToastContent>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <ToastTitle className={frame.foreground}>Saved</ToastTitle>
          <ToastDescription className={frame.foreground}>Workspace updated</ToastDescription>
        </div>
        <PresenceContext.Provider value={retainedPresence(frame.present)}>
          <ToastAction
            style={
              frame.paint
                ? {
                    backgroundColor: "#303030",
                    borderColor: "#404040",
                    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.4)",
                    color: "#fafafa",
                  }
                : undefined
            }
          >
            {frame.label}
          </ToastAction>
        </PresenceContext.Provider>
      </ToastContent>
    </Toast>
  );
}

/** A presence boundary the composed action can be flipped through without a mount. */
const retainedPresence = (present: boolean) => ({
  id: "toast-action",
  initial: false as const,
  isPresent: present,
  register: () => () => {},
  onExitComplete: () => {},
});

/** jsdom applies no Tailwind stylesheet, so the stand-in below also resolves the
 * component's own known paint tokens. That is the palette the toast treats as
 * readable; a caller's inline palette deliberately settles immediately instead. */
const tokenPaint: Record<string, Record<string, string>> = {
  "bg-popover": { "background-color": "rgb(255, 255, 255)" },
  "bg-muted": { "background-color": "rgb(244, 244, 245)" },
  "text-foreground": { color: "rgb(9, 9, 11)" },
  "text-muted-foreground": { color: "rgb(113, 113, 122)" },
};

/** jsdom has no Web Animations and no computed animation name. Give every host a
 * readable computed paint so a released theme-clock loop reports `none` and the
 * owned envelopes can commit their endpoints. */
function installComputedPaint() {
  const original = window.getComputedStyle.bind(window);
  vi.spyOn(window, "getComputedStyle").mockImplementation((element: Element) => {
    const host = element as HTMLElement;
    const css = original(element);
    const tokens: Record<string, string> = {};
    for (const name of host.classList ?? []) Object.assign(tokens, tokenPaint[name]);
    const read = (name: string, fallback = "") =>
      host.style?.getPropertyValue?.(name) || tokens[name] || css.getPropertyValue(name) || fallback;
    return {
      width: css.width,
      height: css.height,
      opacity: read("opacity") || "1",
      color: read("color"),
      backgroundColor: read("background-color"),
      transform: read("transform") || "none",
      translate: read("translate") || "none",
      scale: read("scale") || "none",
      display: css.display || "block",
      visibility: css.visibility || "visible",
      transitionProperty: read("transition-property") || "none",
      transitionDuration: read("transition-duration") || "0s",
      transitionDelay: read("transition-delay") || "0s",
      transitionTimingFunction: read("transition-timing-function") || "ease",
      animation: host.style?.animation ?? "",
      animationName: host.style?.animation ? "cadence-spin" : "none",
      animationDuration: read("animation-duration") || "0s",
      animationDelay: read("animation-delay") || "0s",
      animationIterationCount: read("animation-iteration-count") || "1",
      getPropertyValue: (name: string) => read(name),
    } as unknown as CSSStyleDeclaration;
  });
}

describe("Toast v2 owners", () => {
  beforeEach(() => installComputedPaint());
  afterEach(() => vi.restoreAllMocks());
  beforeAll(async () => {
    await prepareV2MotionPlan();
  });

  it.each(modes)("executes the shipped list's owned actions in %s", async (mode) => {
    const manager = createToastManager();
    const view = render(
      <CadenceProvider mode={mode} timeScale={0}>
        <Toaster toastManager={manager} timeout={0} />
      </CadenceProvider>,
    );
    let id = "";
    act(() => {
      id = manager.add({
        title: "Saved",
        description: "Workspace updated",
        type: "loading",
        actionProps: { children: "Undo" },
      });
    });
    await screen.findByText("Saved");
    const owned = (binding: string, exercise: () => void | Promise<void>) =>
      expectV2MotionAction("toast", `toast.${binding}`, mode, exercise).catch((error) => {
        throw new Error(`${binding}: ${(error as Error).message}\n${(error as Error).stack ?? ""}`);
      });

    await owned("title.change", () => act(() => manager.update(id, { title: "Saved and synced" })));
    await owned("description.change", () =>
      act(() => manager.update(id, { description: "Every workspace is current" })),
    );
    act(() => manager.update(id, { title: 4, description: 8 }));
    await owned("quantity.change", () => act(() => manager.update(id, { title: 5, description: 9 })));
    await owned("icon.activity", () => act(() => manager.update(id, { type: "success" })));
    await expectV2NativeBoundaries("toast", { container: document.body });
    view.unmount();
  });

  it.each(modes)("retains one closing root for its owned exit in %s", async (mode) => {
    // Base UI removes a toast as soon as its own completion sees no pending work, so
    // this list keeps the exact ending host mounted to observe the owned envelope.
    const manager = createToastManager();
    let id = "";
    void 0;
    const view = render(
      <CadenceProvider mode={mode} timeScale={0}>
        <ToastProvider toastManager={manager} timeout={0}>
          <ToastPortal>
            <ToastViewport>
              <RetainedList />
            </ToastViewport>
          </ToastPortal>
        </ToastProvider>
      </CadenceProvider>,
    );
    act(() => {
      id = manager.add({ title: "Saved", description: "Workspace updated" });
    });
    await screen.findByText("Saved");
    await expectV2MotionAction("toast", "toast.root.exit", mode, () => act(() => manager.close(id)));
    await expectV2MotionAction("toast", "toast.root.enter", mode, () =>
      act(() => {
        id = manager.add({ title: "Saved", description: "Workspace updated" });
      }),
    );
    view.unmount();
  });

  it.each(modes)("executes the list's surface, foreground and inherited action owners in %s", async (mode) => {
    const manager = createToastManager();
    // The shipped list holds no caller paint, so this scene supplies the component's
    // own known tokens (surface/foreground) and one Button-backed action whose paint,
    // label, quantity, press and retained exit stay Button's owners.
    let frame: PaintFrame = {
      surface: "bg-popover",
      foreground: "text-foreground",
      paint: false,
      present: true,
      label: "Undo",
    };
    let view: ReturnType<typeof render>;
    const update = (next: Partial<PaintFrame>) => {
      frame = { ...frame, ...next };
      view.rerender(scene());
    };
    const scene = () => (
      <CadenceProvider mode={mode} timeScale={0}>
        <ToastProvider toastManager={manager} timeout={0}>
          <ToastPortal>
            <ToastViewport>
              <PaintedList frame={frame} />
            </ToastViewport>
          </ToastPortal>
        </ToastProvider>
      </CadenceProvider>
    );
    view = render(scene());
    act(() => {
      manager.add({ title: "Saved", description: "Workspace updated" });
    });
    await screen.findByText("Saved");
    const action = document.querySelector('[data-slot="toast-action"]') as HTMLButtonElement;
    expect(action).toBeInstanceOf(HTMLButtonElement);

    await expectV2MotionAction("toast", "toast.surface.colour", mode, () => update({ surface: "bg-muted" }));
    await expectV2MotionAction("toast", "toast.foreground.colour", mode, () =>
      update({ foreground: "text-muted-foreground" }),
    );
    await expectV2MotionAction("toast", "toast.actions-surface.colour", mode, () => update({ paint: true }));
    await expectV2MotionAction("toast", "toast.actions-label.replace", mode, () => update({ label: "Undo it" }));
    update({ label: 7 });
    await expectV2MotionAction("toast", "toast.actions-number.roll", mode, () => update({ label: 8 }));
    await expectV2MotionAction("toast", "toast.actions.press", mode, () => {
      fireEvent.pointerDown(action.querySelector('[data-slot="button-feedback"]') ?? action, {
        button: 0,
        pointerId: 1,
        isPrimary: true,
      });
    });
    // Button keeps the retained exit on its own host; the toast adds no second fade.
    await expectV2MotionAction("toast", "toast.actions-surface.exit", mode, () => update({ present: false }));
    view.unmount();
  });
});
