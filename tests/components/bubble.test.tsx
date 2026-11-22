import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PresenceContext } from "motion/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Bubble, BubbleContent, BubbleGroup, BubbleReactions } from "@/registry/cadence/bubble";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, prepareV2MotionPlan } from "../motion-v2-contract";

const modes = ["full", "reduced", "none"] as const;

// The cold plan parses every live contract and installed closure once per suite.
// That is a hang guard for the audit, not a performance acceptance deadline (ADR-023).
beforeAll(async () => {
  await prepareV2MotionPlan();
}, 300_000);

/** jsdom has no layout: give every host an on-screen box so the committed
 * geometry and placement destinations are real numbers, and report opaque
 * resting paint for a host with no explicit opacity. */
const computedStyle = window.getComputedStyle.bind(window);
beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    () =>
      ({
        x: 0,
        y: 0,
        left: 0,
        top: 0,
        right: 240,
        bottom: 48,
        width: 240,
        height: 48,
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
        if ((key === "width" || key === "height") && value === "") return "240px";
        return typeof value === "function" ? value.bind(target) : value;
      },
    }) as CSSStyleDeclaration;
  });
});
afterEach(() => {
  vi.restoreAllMocks();
});

const presence = (id: string, isPresent: boolean) => ({
  id,
  initial: false as const,
  isPresent,
  register: () => () => {},
  onExitComplete: () => {},
});

it("retains all public slots, defaults, variants and native attributes", () => {
  const { container } = render(
    <BubbleGroup aria-label="Thread">
      <Bubble aria-label="Message" style={{ maxWidth: 300 }}>
        <BubbleContent>Hi</BubbleContent>
        <BubbleReactions role="img" aria-label="Thumbs up">
          👍
        </BubbleReactions>
      </Bubble>
    </BubbleGroup>,
  );
  for (const slot of [
    "bubble-group",
    "bubble",
    "bubble-content",
    "bubble-text",
    "bubble-text-runs",
    "bubble-reactions",
    "bubble-reactions-text",
    "bubble-reactions-text-runs",
  ])
    expect(container.querySelector(`[data-slot="${slot}"]`)).toBeTruthy();
  const root = screen.getByLabelText("Message");
  expect(root).toHaveAttribute("data-variant", "default");
  expect(root).toHaveAttribute("data-align", "start");
  expect(screen.getByLabelText("Thread")).toHaveAttribute("data-slot", "bubble-group");
  expect(screen.getByRole("img")).toHaveAttribute("data-side", "bottom");
  expect(screen.getByRole("img")).toHaveAttribute("data-align", "end");
  for (const variant of ["secondary", "muted", "tinted", "outline", "ghost", "destructive"] as const) {
    const view = render(<Bubble variant={variant} align="end" />);
    expect(view.container.querySelector('[data-slot="bubble"]')).toHaveAttribute("data-variant", variant);
    expect(view.container.querySelector('[data-slot="bubble"]')).toHaveAttribute("data-align", "end");
    view.unmount();
  }
});

it("merges render handlers classes styles refs and React 19 cleanup on the same element", async () => {
  const own = vi.fn(),
    child = vi.fn(),
    cleanup = vi.fn(),
    ref = vi.fn(() => cleanup);
  const { unmount } = render(
    <BubbleContent
      ref={ref}
      className="px-8"
      style={{ color: "red" }}
      onClick={own}
      render={<button type="button" onClick={child} />}
    >
      Reply
    </BubbleContent>,
  );
  await userEvent.tab();
  expect(screen.getByRole("button")).toHaveFocus();
  await userEvent.keyboard("{Enter} ");
  expect(own).toHaveBeenCalledTimes(2);
  expect(child).toHaveBeenCalledTimes(2);
  expect(screen.getByRole("button")).toHaveClass("px-8");
  expect(screen.getByRole("button")).toHaveStyle({ color: "rgb(255, 0, 0)" });
  unmount();
  expect(cleanup).toHaveBeenCalledOnce();
});

it("passes render state and native link semantics without a wrapper", () => {
  render(
    <BubbleContent
      render={(props, state) => <a {...props} href="#details" data-seen={(state as { slot?: string }).slot} />}
    >
      Details
    </BubbleContent>,
  );
  expect(screen.getByRole("link")).toHaveAttribute("data-seen", "bubble-content");
  expect(screen.getByRole("link")).toHaveAttribute("href", "#details");
  expect(screen.getByRole("link")).toHaveAttribute("data-slot", "bubble-content");
  // The direct display value keeps one current copyable string inside the link.
  expect(screen.getByRole("link")).toHaveTextContent("Details");
  expect(screen.getByRole("link")).not.toHaveAttribute("data-ending-style");
});

it("keeps rich children and reaction controls untouched while the display span owns a plain value", () => {
  const { container } = render(
    <Bubble>
      <BubbleContent>
        <p data-testid="rich">
          Rich <a href="#x">content</a>
        </p>
      </BubbleContent>
      <BubbleReactions>
        <button type="button" aria-label="Thumbs up">
          👍 <span data-testid="count">1</span>
        </button>
      </BubbleReactions>
    </Bubble>,
  );
  expect(screen.getByTestId("rich").parentElement).toHaveAttribute("data-slot", "bubble-content");
  expect(container.querySelector('[data-slot="bubble-text"]')).toBeNull();
  expect(container.querySelector('[data-slot="bubble-reactions-text"]')).toBeNull();
  expect(screen.getByRole("button", { name: "Thumbs up" })).toBeInTheDocument();
});

it("keeps the focused content node, caret owner and reaction control across a text revision", async () => {
  const tree = (text: string) => (
    <CadenceProvider mode="full">
      <Bubble data-testid="bubble">
        <BubbleContent render={<button type="button" />}>{text}</BubbleContent>
        <BubbleReactions>
          <button type="button" aria-label="Thumbs up">
            👍
          </button>
        </BubbleReactions>
      </Bubble>
    </CadenceProvider>
  );
  const { rerender } = render(tree("First chunk"));
  const button = screen.getByRole("button", { name: "First chunk" }),
    reaction = screen.getByRole("button", { name: "Thumbs up" });
  button.focus();
  rerender(tree("First chunk second"));
  expect(screen.getByRole("button", { name: "First chunk second" })).toBe(button);
  expect(button).toHaveFocus();
  fireEvent.click(button);
  await userEvent.keyboard("{Tab}");
  expect(reaction).toHaveFocus();
  expect(reaction).toBe(screen.getByRole("button", { name: "Thumbs up" }));
});

for (const mode of modes)
  it(`keeps the semantic target on the same nodes in ${mode}`, () => {
    const tree = (text: string, align: "start" | "end") => (
      <CadenceProvider mode={mode}>
        <BubbleGroup>
          <Bubble data-testid="bubble" align={align}>
            <BubbleContent>{text}</BubbleContent>
            <BubbleReactions side="top" align="start">
              👍
            </BubbleReactions>
          </Bubble>
        </BubbleGroup>
      </CadenceProvider>
    );
    const { container, rerender } = render(tree("Ready", "start"));
    const root = screen.getByTestId("bubble");
    const content = container.querySelector('[data-slot="bubble-content"]');
    const reactions = container.querySelector('[data-slot="bubble-reactions"]');
    expectMotionContract(mode, { parts: [root] });
    expect(root).toHaveAttribute("data-motion", mode);
    expect(content).toHaveAttribute("data-motion", mode);
    expect(reactions).toHaveAttribute("data-motion", mode);
    rerender(tree("Ready for review", "end"));
    expect(screen.getByTestId("bubble")).toBe(root);
    expect(container.querySelector('[data-slot="bubble-content"]')).toBe(content);
    expect(container.querySelector('[data-slot="bubble-reactions"]')).toBe(reactions);
    expect(root).toHaveAttribute("data-align", "end");
    expect(content).toHaveTextContent("Ready for review");
  });

it("restores a nested full clock and settles a live none without replacing nodes", () => {
  const tree = (mode: "full" | "none") => (
    <CadenceProvider mode="none">
      <CadenceProvider mode={mode} timeScale={4}>
        <Bubble data-testid="b">
          <BubbleContent>Text</BubbleContent>
          <BubbleReactions>👍</BubbleReactions>
        </Bubble>
      </CadenceProvider>
    </CadenceProvider>
  );
  const { container, rerender } = render(tree("full"));
  const root = screen.getByTestId("b");
  const reactions = container.querySelector('[data-slot="bubble-reactions"]');
  expect(root).toHaveAttribute("data-motion", "full");
  rerender(tree("none"));
  expect(screen.getByTestId("b")).toBe(root);
  expect(container.querySelector('[data-slot="bubble-reactions"]')).toBe(reactions);
  expect(root).toHaveAttribute("data-motion", "none");
  for (const node of container.querySelectorAll<HTMLElement>("[data-motion][data-slot]"))
    expect(node).toHaveAttribute("data-motion", "none");
});

it("renders the first screen without an entrance animation and without dropping content", () => {
  const html = renderToString(
    <BubbleGroup>
      <Bubble variant="muted">
        <BubbleContent>Server rendered message</BubbleContent>
      </Bubble>
    </BubbleGroup>,
  );
  expect(html).toContain("Server rendered message");
  expect(html).toContain('data-slot="bubble"');
  expect(html).not.toContain("data-ending-style");
  expect(html).not.toMatch(/style="[^"]*opacity:\s*0/);
});

describe.each(modes)("bubble v2 actions in %s", (mode) => {
  it("executes every owned action on one live instance", async () => {
    const frame = {
      group: true,
      root: true,
      reaction: true,
      align: "start" as "start" | "end",
      side: "bottom" as "bottom" | "top",
      reactionAlign: "end" as "start" | "end",
      variant: "default" as "default" | "outline",
      paint: "",
      reactionPaint: "",
      tint: "",
      reactionTint: "",
      text: "First chunk" as string | number,
      reactionText: "👍" as string | number,
    };
    const draw = () => (
      <CadenceProvider mode={mode} timeScale={0}>
        <PresenceContext.Provider value={presence("bubble-group", frame.group)}>
          <BubbleGroup>
            <PresenceContext.Provider value={presence("bubble-message", frame.root)}>
              <Bubble
                data-testid="message"
                align={frame.align}
                variant={frame.variant}
                style={frame.paint ? { backgroundColor: frame.paint } : undefined}
              >
                <BubbleContent
                  style={{
                    ...(frame.paint ? { backgroundColor: frame.paint } : {}),
                    ...(frame.tint ? { color: frame.tint } : {}),
                  }}
                >
                  {frame.text}
                </BubbleContent>
                <PresenceContext.Provider value={presence("bubble-reactions", frame.reaction)}>
                  <BubbleReactions
                    side={frame.side}
                    align={frame.reactionAlign}
                    style={{
                      ...(frame.reactionPaint ? { backgroundColor: frame.reactionPaint } : {}),
                      ...(frame.reactionTint ? { color: frame.reactionTint } : {}),
                    }}
                  >
                    {frame.reactionText}
                  </BubbleReactions>
                </PresenceContext.Provider>
              </Bubble>
            </PresenceContext.Provider>
          </BubbleGroup>
        </PresenceContext.Provider>
      </CadenceProvider>
    );
    const view = render(draw());
    const update = (next: Partial<typeof frame>) => {
      Object.assign(frame, next);
      view.rerender(draw());
    };
    const owned = (binding: string, exercise: () => void) =>
      expectV2MotionAction("bubble", binding, mode, exercise).catch((error) => {
        throw new Error(`${binding}: ${(error as Error).message}\n${(error as Error).stack ?? ""}`);
      });
    const runs = () => view.container.querySelector('[data-slot="bubble-text-runs"]');
    const firstRuns = runs();

    // The initial group envelope and the message root own one opacity channel each.
    update({ root: false });
    await owned("bubble.root.enter", () => update({ root: true }));
    update({ group: false });
    await owned("bubble.group.enter", () => update({ group: true }));

    // A plain message revision keeps its prefix and its retained display span.
    await owned("bubble.text.replace", () => update({ text: "First chunk, then more" }));
    expect(runs()).toBe(firstRuns);
    expect(runs()).toHaveTextContent("First chunk, then more");

    // A direct number selects the quantity renderer on the same content host.
    update({ text: 2 });
    await owned("bubble.value.roll", () => update({ text: 3 }));

    // The content host owns its own block size after a low-frequency text revision.
    await owned("bubble.content.resize", () => update({ text: "First chunk, then even more text" }));

    // A retained overlay leaves and re-enters on its own retained host.
    await owned("bubble.reaction.exit", () => update({ reaction: false }));
    await owned("bubble.reaction.enter", () => update({ reaction: true }));

    // Its independent overlay box follows a committed reaction revision.
    await owned("bubble.reaction.resize", () => update({ reactionText: "👍👍" }));

    // The reaction display replaces changed runs, then rolls a direct quantity.
    await owned("bubble.reaction-text.replace", () => update({ reactionText: "👍👍👍" }));
    update({ reactionText: 5 });
    await owned("bubble.reaction-text.roll", () => update({ reactionText: 6 }));

    // Both placement owners reach one bounded destination after the anchor change.
    await owned("bubble.reactions.place", () => update({ side: "top" }));
    await owned("bubble.message.move", () => update({ align: "end" }));

    // One variant revision drives the declared surface and foreground families.
    await owned("bubble.surface.colour", () =>
      update({ variant: "outline", paint: "rgb(32, 32, 32)", reactionPaint: "rgb(64, 64, 64)" }),
    );
    await owned("bubble.foreground.colour", () => update({ tint: "rgb(24, 24, 24)", reactionTint: "rgb(96, 96, 96)" }));

    expectMotionContract(mode, { policy: ["color"] });
    view.unmount();
    for (const node of document.querySelectorAll("[data-slot]")) expect(node).not.toBeInTheDocument();
  });
});
