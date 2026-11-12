import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AnimatePresence, PresenceContext } from "motion/react";
import { createRef } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { Button } from "@/registry/cadence/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  type EmptyProps,
  EmptyTitle,
} from "@/registry/cadence/empty";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

function Example({
  value = "Message pending",
  changed = false,
  native,
}: {
  value?: string | number;
  changed?: boolean;
  native?: Pick<EmptyProps, "role" | "aria-live" | "aria-hidden" | "inert">;
}) {
  const paint = { color: changed ? "#222" : "#111" };
  return (
    <Empty {...native} style={{ ...paint, backgroundColor: changed ? "#eee" : "#fff" }}>
      <EmptyHeader>
        <EmptyMedia variant="icon" style={{ ...paint, backgroundColor: changed ? "#ddd" : "#fff" }}>
          <svg key={changed ? "new" : "old"} aria-hidden="true" viewBox="0 0 24 24">
            <path d="M2 2H22V22H2Z" />
          </svg>
        </EmptyMedia>
        <EmptyTitle style={paint}>{value}</EmptyTitle>
        <EmptyDescription style={paint}>{value}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent style={paint}>{value}</EmptyContent>
      <button type="button">Recover</button>
    </Empty>
  );
}
function StaticExample({ variant }: { variant?: "default" | "icon" }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant={variant} data-testid="media" />
        <EmptyTitle>No invoices yet</EmptyTitle>
        <EmptyDescription>Invoices you send will land here.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm">Create invoice</Button>
      </EmptyContent>
    </Empty>
  );
}

describe("Empty", () => {
  beforeAll(() => prepareV2MotionPlan(), 30000);

  it.each(["full", "reduced", "none"] as const)(
    "preserves all six native parts and explicit overrides in %s",
    (mode) => {
      const refs = Array.from({ length: 6 }, () => createRef<HTMLDivElement>()),
        callbacks = Array.from({ length: 6 }, () => vi.fn());
      const slots = ["empty", "empty-header", "empty-icon", "empty-title", "empty-description", "empty-content"];
      const cleanup = Array.from({ length: 6 }, () => vi.fn());
      const registrations = refs.map((ref, i) =>
        vi.fn((node: HTMLDivElement | null) => {
          ref.current = node;
          return cleanup[i];
        }),
      );
      const native = (i: number, stage: number) => ({
        id: `part-${i}`,
        ref: registrations[i],
        className: `caller-${i}`,
        style: { paddingTop: 13 },
        onClick: callbacks[i],
        ...(stage === 0 ? {} : { "data-slot": stage === 1 ? `custom-${i}` : undefined }),
      });
      const draw = (stage: number) => (
        <CadenceProvider mode={mode} timeScale={0}>
          <Empty
            {...native(0, stage)}
            role={stage === 1 ? "status" : undefined}
            aria-live="off"
            inert={false}
            aria-hidden={false}
          >
            <EmptyHeader {...native(1, stage)}>
              <EmptyMedia {...native(2, stage)} variant={stage === 1 ? null : undefined} />
              <EmptyTitle {...native(3, stage)}>Title</EmptyTitle>
              <EmptyDescription {...native(4, stage)}>Description</EmptyDescription>
            </EmptyHeader>
            <EmptyContent {...native(5, stage)}>
              <button type="button">Recover</button>
            </EmptyContent>
          </Empty>
        </CadenceProvider>
      );
      const view = render(draw(0)),
        nodes = refs.map((ref) => ref.current);
      for (const stage of [0, 1, 2, 0]) {
        view.rerender(draw(stage));
        nodes.forEach((node, i) => {
          expect(refs[i]?.current).toBe(node);
          expect(node?.tagName).toBe("DIV");
          expect(node?.style.paddingTop).toBe("13px");
          expect(node).toHaveClass(`caller-${i}`);
          if (stage === 2) expect(node).not.toHaveAttribute("data-slot");
          else expect(node).toHaveAttribute("data-slot", stage === 1 ? `custom-${i}` : slots[i]);
        });
        if (stage === 1) expect(nodes[0]).toHaveAttribute("role", "status");
        else expect(nodes[0]).not.toHaveAttribute("role");
        expect(nodes[2]?.getAttribute("data-variant")).toBe(stage === 1 ? null : "default");
        expect(nodes[0]).not.toHaveAttribute("inert");
        expect(nodes[0]).toHaveAttribute("aria-hidden", "false");
      }
      for (const node of [nodes[2], nodes[3], nodes[4], nodes[5]]) if (node) fireEvent.click(node);
      expect(callbacks[0]).toHaveBeenCalledTimes(4);
      for (const i of [2, 3, 4, 5]) expect(callbacks[i]).toHaveBeenCalledTimes(1);
      for (const callback of registrations) expect(callback).toHaveBeenCalledTimes(1);
      for (const callback of cleanup) expect(callback).not.toHaveBeenCalled();
      view.unmount();
      for (const callback of cleanup) expect(callback).toHaveBeenCalledTimes(1);
    },
  );
  it.each(["full", "reduced", "none"] as const)("executes all actual message owners in %s", async (mode) => {
    const draw = (value: string | number, changed = false) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <Example value={value} changed={changed} />
      </CadenceProvider>
    );
    const view = render(draw("Message pending"));
    const texts = Array.from(view.container.querySelectorAll('[data-slot="empty-text"]')).map(
      (node) => node.firstChild,
    );
    await expectV2MotionAction("empty", "empty.text.replace", mode, () => view.rerender(draw("Message ready")));
    expect(
      Array.from(view.container.querySelectorAll('[data-slot="empty-text"]')).map((node) => node.firstChild),
    ).toEqual(texts);
    await expectV2MotionAction("empty", "empty.root.resize", mode, () =>
      view.rerender(draw("Longer current message ready", true)),
    );
    await expectV2MotionAction("empty", "empty.surface.colour", mode, () =>
      view.rerender(draw("Message ready", false)),
    );
    await expectV2MotionAction("empty", "empty.foreground.colour", mode, () =>
      view.rerender(draw("Message ready", true)),
    );
    await expectV2MotionAction("empty", "empty.media.replace", mode, () => view.rerender(draw("Message ready", false)));
    view.rerender(draw(19));
    await expectV2MotionAction("empty", "empty.value.roll", mode, () => view.rerender(draw(20)));
    expect(
      Array.from(view.container.querySelectorAll('[data-slot="empty-number"]')).map((node) => node.textContent),
    ).toEqual(["20", "20", "20"]);
    expectMotionContract(mode, { parts: Array.from(view.container.querySelectorAll("[data-motion]")) });
    view.rerender(
      <CadenceProvider mode={mode}>
        <Empty>
          <EmptyTitle>
            <strong>Rich current title</strong>
          </EmptyTitle>
          <EmptyDescription>
            <em>Rich description</em>
          </EmptyDescription>
          <EmptyContent>
            <strong>Rich recovery</strong>
          </EmptyContent>
        </Empty>
      </CadenceProvider>,
    );
    await expectV2NativeBoundaries("empty", { container: view.container });
  });
  it.each(["full", "reduced", "none"] as const)("retains one inert surface and reverses it in %s", async (mode) => {
    const draw = (present: boolean) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <PresenceContext.Provider
          value={{
            id: "empty",
            isPresent: present,
            initial: false,
            register: () => () => {},
            onExitComplete: () => {},
          }}
        >
          <Example native={{ role: "status", "aria-live": "polite", "aria-hidden": false, inert: false }} />
        </PresenceContext.Provider>
      </CadenceProvider>
    );
    const view = render(draw(true));
    const root = screen.getByRole("status");
    await expectV2MotionAction("empty", "empty.root.exit", mode, () => view.rerender(draw(false)));
    expect(root).toHaveAttribute("inert");
    expect(root).not.toHaveAttribute("role");
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    await expectV2MotionAction("empty", "empty.root.enter", mode, () => view.rerender(draw(true)));
    expect(screen.getByRole("status")).toBe(root);
    expect(root).not.toHaveAttribute("inert");
    expect(root).toHaveAttribute("aria-hidden", "false");
    expect(root).toHaveAttribute("aria-live", "polite");
    expectMotionContract(mode, { parts: [root] });
  });
  it.each(["full", "reduced", "none"] as const)(
    "keeps native editing, refs, controls and native container in %s",
    async (mode) => {
      const ref = vi.fn();
      const click = vi.fn();
      const draw = (value: string | number, editable = true) => (
        <CadenceProvider mode={mode}>
          <div contentEditable={editable} suppressContentEditableWarning>
            <Empty ref={ref}>
              <EmptyTitle>{value}</EmptyTitle>
              <EmptyDescription>
                <em>Rich current message</em>
              </EmptyDescription>
              <EmptyContent>
                <button type="button" onClick={click}>
                  Retry
                </button>
                <input aria-label="Memo" defaultValue="draft" />
              </EmptyContent>
              <span data-native="untouched">Arbitrary root content</span>
            </Empty>
          </div>
        </CadenceProvider>
      );
      const view = render(draw(19));
      const root = view.container.querySelector('[data-slot="empty"]') as HTMLDivElement;
      const input = screen.getByRole("textbox");
      const span = view.container.querySelector('[data-slot="empty-number"]');
      const text = span?.firstChild as Text;
      text.replaceData(0, text.length, "Native buffer");
      document.getSelection()?.setBaseAndExtent(text, 3, text, 3);
      for (const value of ["ERR_042", 20, "Current", 22]) {
        view.rerender(draw(value));
        expect(view.container.querySelector('[data-slot="empty-text"],[data-slot="empty-number"]')).toBe(span);
        expect(span?.firstChild).toBe(text);
        expect(text.data).toBe("Native buffer");
        expect(document.getSelection()?.anchorNode).toBe(text);
      }
      view.rerender(draw(22, false));
      view.rerender(draw(23, false));
      expect(text.data).toBe("23");
      document.getSelection()?.removeAllRanges();
      expect(view.container.querySelector('[data-slot="empty"]') as HTMLDivElement).toBe(root);
      expect(screen.getByRole("textbox")).toBe(input);
      fireEvent.change(input, { target: { value: "user draft" } });
      await userEvent.click(screen.getByRole("button", { name: "Retry" }));
      expect(click).toHaveBeenCalledTimes(1);
      expect(input).toHaveValue("user draft");
      expect(ref.mock.calls.filter(([node]) => node === root)).toHaveLength(1);
      expect(root.querySelector("em")?.parentElement?.childElementCount).toBe(1);
      expect(root.querySelector('[data-native="untouched"]')?.textContent).toBe("Arbitrary root content");
      expect(view.container.querySelectorAll('[data-slot="empty"]')).toHaveLength(1);
      expectMotionContract(mode, { parts: [root, span as Element] });
    },
  );
  it("completes caller-owned removal at zero without keeping a tab stop", async () => {
    const draw = (show: boolean) => (
      <CadenceProvider timeScale={0}>
        <AnimatePresence>
          {show && (
            <Empty key="notice">
              <EmptyContent>
                <button type="button">Dismiss</button>
              </EmptyContent>
            </Empty>
          )}
        </AnimatePresence>
      </CadenceProvider>
    );
    const view = render(draw(true));
    view.rerender(draw(false));
    await waitFor(() => expect(view.container.querySelector('[data-slot="empty"]')).toBeNull());
  });
  it("renders every part with its slot", () => {
    render(<StaticExample />);

    const root = screen.getByText("No invoices yet").closest('[data-slot="empty"]');
    expect(root).toBeInTheDocument();
    expect(screen.getByText("No invoices yet").closest('[data-slot="empty-title"]')).toBeInTheDocument();
    expect(
      screen.getByText("Invoices you send will land here.").closest('[data-slot="empty-description"]'),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create invoice" })).toBeInTheDocument();

    const header = screen.getByText("No invoices yet").closest('[data-slot="empty-header"]');
    expect(header).toBeInTheDocument();
    expect(screen.getByRole("button").closest('[data-slot="empty-content"]')).toBeInTheDocument();
  });

  it("exposes the media variant through data-variant", () => {
    render(<StaticExample variant="icon" />);
    expect(screen.getByTestId("media")).toHaveAttribute("data-slot", "empty-icon");
    expect(screen.getByTestId("media")).toHaveAttribute("data-variant", "icon");
    expect(screen.getByTestId("media").className).toContain("bg-muted");
  });

  it("is a container, not a landmark or a live region", () => {
    render(<StaticExample />);
    const root = screen.getByText("No invoices yet").closest('[data-slot="empty"]');

    expect(root?.tagName).toBe("DIV");
    expect(root).not.toHaveAttribute("role");
  });
});
