import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Bubble, BubbleContent, BubbleGroup, BubbleReactions } from "@/registry/cadence/bubble";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { expectMotionContract } from "../motion-contract";

it("preserves slots defaults variants alignment and native props", () => {
  const { container } = render(
    <BubbleGroup>
      <Bubble aria-label="Message" style={{ maxWidth: 300 }}>
        <BubbleContent>Hi</BubbleContent>
        <BubbleReactions role="img" aria-label="Thumbs up">
          👍
        </BubbleReactions>
      </Bubble>
    </BubbleGroup>,
  );
  for (const slot of ["bubble-group", "bubble", "bubble-content", "bubble-reactions"])
    expect(container.querySelector(`[data-slot="${slot}"]`)).toBeTruthy();
  expect(screen.getByLabelText("Message")).toHaveAttribute("data-variant", "default");
  expect(screen.getByLabelText("Message")).toHaveAttribute("data-align", "start");
  expect(screen.getByRole("img")).toHaveAttribute("data-side", "bottom");
  expect(screen.getByRole("img")).toHaveAttribute("data-align", "end");
});
it("merges render handlers classes styles refs and React19 cleanup", async () => {
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
it("passes render state and native link semantics", () => {
  render(
    <BubbleContent
      render={(props, state) => <a {...props} href="#details" data-seen={(state as { slot?: string }).slot} />}
    >
      Details
    </BubbleContent>,
  );
  expect(screen.getByRole("link")).toHaveAttribute("data-seen", "bubble-content");
  expect(screen.getByRole("link")).toHaveAttribute("href", "#details");
});
for (const mode of ["full", "reduced", "none"] as const)
  it(`proves ${mode}, caller overrides and stable text updates`, () => {
    const tree = (text: string) => (
      <CadenceProvider mode={mode}>
        <Bubble data-testid="bubble">
          <BubbleContent render={<button type="button" />}>{text}</BubbleContent>
        </Bubble>
      </CadenceProvider>
    );
    const { rerender } = render(tree("First chunk"));
    const root = screen.getByTestId("bubble"),
      button = screen.getByRole("button");
    expectMotionContract(mode, { parts: [root] });
    expect(root.style.transitionDuration).toBe(mode === "none" ? "0s" : mode === "reduced" ? "0.132s" : "0.22s");
    if (mode !== "full") expect(root).toHaveClass("transform-none");
    if (mode === "none") {
      expect(root).toHaveClass("transition-none");
      expect(root).not.toHaveClass("starting:opacity-0");
    }
    button.focus();
    rerender(tree("Second chunk"));
    expect(screen.getByRole("button")).toBe(button);
    expect(button).toHaveFocus();
    fireEvent.click(button);
  });
it("restores nested full clock and cancels live none without replacing nodes", () => {
  const tree = (mode: "full" | "none") => (
    <CadenceProvider mode="none">
      <CadenceProvider mode={mode} timeScale={4}>
        <Bubble data-testid="b">
          <BubbleContent>Text</BubbleContent>
        </Bubble>
      </CadenceProvider>
    </CadenceProvider>
  );
  const { rerender } = render(tree("full"));
  const el = screen.getByTestId("b");
  expect(el.style.transitionDuration).toBe("0.88s");
  rerender(tree("none"));
  expect(screen.getByTestId("b")).toBe(el);
  expect(el.style.transitionDuration).toBe("0s");
});
