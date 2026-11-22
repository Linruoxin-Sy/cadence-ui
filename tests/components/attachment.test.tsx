import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PresenceContext } from "motion/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "@/registry/cadence/attachment";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

const modes = ["full", "reduced", "none"] as const;

// The cold plan parses every live contract and installed closure once per suite;
// this suite additionally resolves the inherited Button action paths. That is a
// hang guard for the audit, not a performance acceptance deadline (ADR-023).
beforeAll(async () => {
  await prepareV2MotionPlan();
}, 300_000);

/** jsdom has no layout: give tiles a real on-screen box so the busy loop sees a
 * visible host and measured geometry commits a real destination. An unset
 * computed opacity is opaque, not zero, which is what a pulse requires. */
const computedStyle = window.getComputedStyle.bind(window);
beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    () =>
      ({
        x: 0,
        y: 0,
        left: 0,
        top: 0,
        right: 160,
        bottom: 44,
        width: 160,
        height: 44,
        toJSON() {},
      }) as DOMRect,
  );
  vi.spyOn(window, "getComputedStyle").mockImplementation((element: Element, pseudo?: string | null) => {
    const css = computedStyle(element, pseudo ?? undefined);
    return new Proxy(css, {
      get(target, key) {
        const value = Reflect.get(target, key);
        if (key === "opacity" && value === "") return "1";
        if (key === "animationName" && value === "") return "none";
        return typeof value === "function" ? value.bind(target) : value;
      },
    }) as CSSStyleDeclaration;
  });
});
afterEach(() => {
  vi.restoreAllMocks();
});

it("retains all nine slots, defaults and native attributes", () => {
  const { container } = render(
    <AttachmentGroup tabIndex={0}>
      <Attachment aria-invalid="true">
        <AttachmentMedia />
        <AttachmentContent>
          <AttachmentTitle>report.pdf</AttachmentTitle>
          <AttachmentDescription>PDF</AttachmentDescription>
        </AttachmentContent>
        <AttachmentActions>
          <AttachmentAction aria-label="Remove" />
        </AttachmentActions>
        <AttachmentTrigger aria-label="Open" />
      </Attachment>
    </AttachmentGroup>,
  );
  for (const slot of [
    "attachment",
    "attachment-group",
    "attachment-media",
    "attachment-content",
    "attachment-title",
    "attachment-description",
    "attachment-actions",
    "attachment-action",
    "attachment-trigger",
  ])
    expect(container.querySelector(`[data-slot="${slot}"]`)).toBeTruthy();
  const root = container.querySelector('[data-slot="attachment"]');
  expect(root).toHaveAttribute("data-state", "done");
  expect(root).toHaveAttribute("data-size", "default");
  expect(root).toHaveAttribute("data-orientation", "horizontal");
  expect(root).toHaveAttribute("aria-invalid", "true");
  expect(screen.getByRole("button", { name: "Remove" })).toHaveAttribute("data-variant", "ghost");
  expect(screen.getByRole("button", { name: "Remove" })).toHaveAttribute("data-size", "icon-xs");
  expect(screen.getByRole("button", { name: "Open" })).toHaveAttribute("type", "button");
  // Known display text lives on private spans so the public hosts keep their identity.
  expect(container.querySelector('[data-slot="attachment-text"]')).toBeTruthy();
});

it("keeps actions and trigger independent, forwards keyboard, disabled, callback class/style", async () => {
  const open = vi.fn();
  const remove = vi.fn();
  const { rerender } = render(
    <Attachment>
      <AttachmentTrigger aria-label="Open" onClick={open} />
      <AttachmentActions>
        <AttachmentAction
          aria-label="Remove"
          onClick={remove}
          className={(s) => (s.disabled ? "px-8 disabled-caller" : "enabled-caller")}
          style={(s) => ({ opacity: s.disabled ? 0.3 : 1 })}
        />
      </AttachmentActions>
    </Attachment>,
  );
  await userEvent.tab();
  await userEvent.keyboard("{Enter}");
  expect(open).toHaveBeenCalledTimes(1);
  await userEvent.tab();
  await userEvent.keyboard(" ");
  expect(remove).toHaveBeenCalledTimes(1);
  expect(open).toHaveBeenCalledTimes(1);
  rerender(
    <AttachmentAction
      aria-label="Remove"
      disabled
      onClick={remove}
      className={(s) => (s.disabled ? "px-8 disabled-caller" : "enabled-caller")}
      style={(s) => ({ opacity: s.disabled ? 0.3 : 1 })}
    />,
  );
  const button = screen.getByRole("button");
  expect(button).toHaveClass("disabled-caller", "px-8");
  expect(button).toHaveStyle({ opacity: "0.3" });
  await userEvent.click(button);
  expect(remove).toHaveBeenCalledTimes(1);
});

it("merges rendered link/button events and refs including React 19 cleanup", () => {
  const cleanup = vi.fn();
  const outer = vi.fn();
  const inner = vi.fn((event) => event.preventDefault());
  const { unmount } = render(
    <AttachmentTrigger
      aria-label="Download"
      onClick={outer}
      ref={() => cleanup}
      render={<a href="/file.pdf" download onClick={inner} />}
    />,
  );
  const link = screen.getByRole("link");
  expect(link).not.toHaveAttribute("type");
  expect(link).toHaveAttribute("download");
  fireEvent.click(link);
  expect(inner).toHaveBeenCalledTimes(1);
  expect(outer).toHaveBeenCalledTimes(1);
  unmount();
  expect(cleanup).toHaveBeenCalledTimes(1);
});

it("keeps caller render functions, native refs and state/size/media updates", () => {
  const cleanup = vi.fn();
  const renderFn = vi.fn((props) => <button {...props} data-custom="yes" />);
  const { container, rerender, unmount } = render(
    <Attachment
      state="error"
      size="xs"
      orientation="vertical"
      ref={() => cleanup}
      className="rounded-none"
      style={{ opacity: 0.8 }}
    >
      <AttachmentMedia variant="image" />
      <AttachmentTrigger render={renderFn} />
    </Attachment>,
  );
  const root = container.firstElementChild;
  expect(root).toHaveClass("rounded-none");
  expect(root).not.toHaveClass("rounded-xl");
  expect(root).toHaveStyle({ opacity: "0.8" });
  expect(container.querySelector('[data-variant="image"]')).toBeTruthy();
  expect(renderFn).toHaveBeenCalled();
  expect(screen.getByRole("button")).toHaveAttribute("data-custom", "yes");
  rerender(<Attachment state="processing" size="sm" orientation="horizontal" ref={() => cleanup} />);
  expect(container.firstElementChild).toBe(root);
  expect(root).toHaveAttribute("data-state", "processing");
  unmount();
  expect(cleanup).toHaveBeenCalled();
});

describe.each(modes)("motion %s", (mode) => {
  it("keeps the loop branch and the retained title through external state changes", () => {
    const tree = (state: "uploading" | "done") => (
      <CadenceProvider mode={mode}>
        <Attachment state={state}>
          <AttachmentTitle>File</AttachmentTitle>
          <AttachmentAction aria-label="Remove" />
        </Attachment>
      </CadenceProvider>
    );
    const { container, rerender } = render(tree("uploading"));
    const title = container.querySelector<HTMLElement>('[data-slot="attachment-title"]');
    const root = container.querySelector('[data-slot="attachment"]');
    expectMotionContract(mode, { parts: [root] });
    expect(title).toHaveAttribute("data-motion", mode);
    expect(title).toHaveAttribute("data-state", "uploading");
    expect(screen.getByRole("button")).toHaveAttribute("data-motion", mode);
    if (mode === "none") expect(title?.style.animation).toBe("none");
    else if (mode === "reduced") expect(title?.style.animation).toBe("none");
    else expect(title?.style.animation).toContain("--animate-pulse");
    rerender(tree("done"));
    expect(container.querySelector('[data-slot="attachment-title"]')).toBe(title);
    expect(title).toHaveAttribute("data-state", "done");
    expect(root).toHaveAttribute("data-state", "done");
  });
});

it("cancels to none and restores nested full without replacing the title or its text span", () => {
  const tree = (mode: "full" | "none") => (
    <CadenceProvider mode="none">
      <CadenceProvider mode={mode}>
        <Attachment state="uploading">
          <AttachmentTitle>File</AttachmentTitle>
        </Attachment>
      </CadenceProvider>
    </CadenceProvider>
  );
  const { container, rerender } = render(tree("full"));
  const title = container.querySelector<HTMLElement>('[data-slot="attachment-title"]');
  const text = container.querySelector('[data-slot="attachment-text"]');
  expect(title).toHaveAttribute("data-motion", "full");
  rerender(tree("none"));
  expect(container.querySelector('[data-slot="attachment-title"]')).toBe(title);
  expect(container.querySelector('[data-slot="attachment-text"]')).toBe(text);
  expect(title?.style.animation).toBe("none");
  rerender(tree("full"));
  expect(title?.style.animation).toContain("--animate-pulse");
});

describe.each(modes)("attachment v2 actions in %s", (mode) => {
  it("executes every owned action on one live instance", async () => {
    const frame = {
      root: true,
      parts: true,
      media: "first",
      state: "done" as "idle" | "uploading" | "processing" | "error" | "done",
      title: "report.pdf",
      description: "PDF · 2 pages" as string | number,
      paint: "",
      mediaPaint: "",
      titleTint: "",
      descTint: "",
      actionLabel: "Remove" as string | number,
      actionPaint: false,
      extra: false,
    };
    const draw = () => (
      <CadenceProvider mode={mode} timeScale={0}>
        <PresenceContext.Provider
          value={{
            id: "attachment-root",
            initial: false,
            isPresent: frame.root,
            register: () => () => {},
            onExitComplete: () => {},
          }}
        >
          <Attachment
            data-testid="tile"
            state={frame.state}
            style={frame.paint ? { backgroundColor: frame.paint } : undefined}
          >
            <PresenceContext.Provider
              value={{
                id: "attachment-parts",
                initial: false,
                isPresent: frame.parts,
                register: () => () => {},
                onExitComplete: () => {},
              }}
            >
              <AttachmentMedia
                variant="image"
                style={frame.mediaPaint ? { backgroundColor: frame.mediaPaint } : undefined}
              >
                {/* biome-ignore lint/performance/noImgElement: the supplied preview is the public AttachmentMedia composition. */}
                <img alt="" key={frame.media} src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" />
              </AttachmentMedia>
              <AttachmentActions>
                <AttachmentAction
                  style={{
                    color: frame.actionPaint ? "#222" : "#111",
                    backgroundColor: frame.actionPaint ? "#eee" : "#fff",
                  }}
                >
                  {frame.actionLabel}
                </AttachmentAction>
              </AttachmentActions>
            </PresenceContext.Provider>
            <AttachmentContent>
              <AttachmentTitle style={frame.titleTint ? { color: frame.titleTint } : undefined}>
                {frame.title}
              </AttachmentTitle>
              <AttachmentDescription style={frame.descTint ? { color: frame.descTint } : undefined}>
                {frame.description}
              </AttachmentDescription>
              {frame.extra ? <AttachmentDescription>attached 2026-11-22</AttachmentDescription> : null}
            </AttachmentContent>
          </Attachment>
        </PresenceContext.Provider>
      </CadenceProvider>
    );
    const view = render(draw());
    const update = (next: Partial<typeof frame>) => {
      Object.assign(frame, next);
      view.rerender(draw());
    };
    const owned = (binding: string, exercise: () => void) =>
      expectV2MotionAction("attachment", binding, mode, exercise).catch((error) => {
        throw new Error(`${binding}: ${(error as Error).message}\n${(error as Error).stack ?? ""}`);
      });
    const titleText = view.container.querySelector('[data-slot="attachment-title"] [data-slot="attachment-text"]');
    const description = view.container.querySelector('[data-slot="attachment-description"]');

    // Button keeps its own paint, label, box and quantity while the tile is quiet.
    await owned("attachment.action-paint.colour", () => update({ actionPaint: true }));
    await owned("attachment.action-label.replace", () => update({ actionLabel: "Remove file" }));
    await owned("attachment.action-box.resize", () => update({ actionLabel: "Remove" }));
    update({ actionLabel: 3 });
    await owned("attachment.action-quantity.roll", () => update({ actionLabel: 4 }));

    // Tile presence and the group's native membership.
    await owned("attachment.root.exit", () => update({ root: false }));
    await owned("attachment.root.enter", () => update({ root: true }));

    // A later media/action region leaves and enters on its own retained hosts.
    await owned("attachment.part.exit", () => update({ parts: false }));
    await owned("attachment.part.enter", () => update({ parts: true }));

    // Button keeps its own retained exit and entrance on the shared action host.
    await owned("attachment.action-exit.exit", () => update({ parts: false }));
    await owned("attachment.action-button.enter", () => update({ parts: true }));

    // The supplied preview and the supplied state share one media envelope.
    await owned("attachment.media.replace", () => update({ media: "second" }));
    await owned("attachment.media.update", () => update({ state: "processing" }));

    // Scoped colour on the tile and the preview, then the explicit display overrides.
    await owned("attachment.surface.colour", () => update({ paint: "rgb(32, 32, 32)", mediaPaint: "rgb(64, 64, 64)" }));
    await owned("attachment.text.colour", () => update({ titleTint: "rgb(24, 24, 24)", descTint: "rgb(96, 96, 96)" }));

    // The busy title loop keeps its live owner while the supplied state advances.
    await owned("attachment.title.busy", () => update({ state: "uploading" }));

    // Filename and description diffs keep the same spans.
    await owned("attachment.label.replace", () => update({ title: "report-final.pdf", description: "PDF · 3 pages" }));
    expect(view.container.querySelector('[data-slot="attachment-title"] [data-slot="attachment-text"]')).toBe(
      titleText,
    );
    expect(view.container.querySelector('[data-slot="attachment-description"]')).toBe(description);

    // A direct display quantity reels on its own span.
    update({ description: 4 });
    await owned("attachment.value.roll", () => update({ description: 6 }));

    // The owned tile box follows a committed structural revision.
    await owned("attachment.root.resize", () => update({ extra: true }));

    expectMotionContract(mode, { policy: ["loop", "color"] });
    view.unmount();

    // Inherited Button ownership stays a real boundary on the adapter host.
    const boundary = render(
      <CadenceProvider mode={mode}>
        <AttachmentAction aria-label="Remove" />
      </CadenceProvider>,
    );
    await expectV2NativeBoundaries("attachment", { container: boundary.container });
    boundary.unmount();
  });
});
