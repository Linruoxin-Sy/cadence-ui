import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AnimatePresence, PresenceContext } from "motion/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { Badge } from "@/registry/cadence/badge";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

describe("Badge", () => {
  beforeAll(() => prepareV2MotionPlan()); // Cold full-library source/installation audit.
  it.each(["full", "reduced", "none"] as const)("executes owned display/size/paint changes in %s", async (mode) => {
    const draw = (value: string | number, paint = false) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <Badge style={{ color: paint ? "#222" : "#111", backgroundColor: paint ? "#eee" : "#fff" }}>{value}</Badge>
      </CadenceProvider>
    );
    const view = render(draw("Status pending"));
    const host = view.container.querySelector('[data-slot="badge"]');
    if (!host) throw new Error("Badge root missing");
    const text = host.querySelector('[data-slot="badge-text"]')?.firstChild;
    await expectV2MotionAction("badge", "badge.label.replace", mode, () => view.rerender(draw("Status ready")));
    expect(host.querySelector('[data-slot="badge-text"]')?.firstChild).toBe(text);
    await expectV2MotionAction("badge", "badge.root.resize", mode, () => view.rerender(draw("Ready")));
    await expectV2MotionAction("badge", "badge.root.colour", mode, () => view.rerender(draw("Ready", true)));
    view.rerender(draw(19));
    await expectV2MotionAction("badge", "badge.value.roll", mode, () => view.rerender(draw(20)));
    expect(host.textContent).toBe("20");
    expectMotionContract(mode, { parts: [host] });
    view.rerender(
      <CadenceProvider mode={mode}>
        <Badge>
          <span>Rich</span>
        </Badge>
      </CadenceProvider>,
    );
    await expectV2NativeBoundaries("badge", { container: view.container });
  });
  it.each(["full", "reduced", "none"] as const)("reverses same-host retained presence in %s", async (mode) => {
    const click = vi.fn();
    const draw = (present: boolean) => (
      <CadenceProvider mode={mode} timeScale={mode === "full" ? 0 : 1}>
        <PresenceContext.Provider
          value={{
            id: "badge-retention",
            isPresent: present,
            initial: false,
            register: () => () => {},
            onExitComplete: () => {},
          }}
        >
          <Badge onClick={click}>Retained</Badge>
        </PresenceContext.Provider>
      </CadenceProvider>
    );
    const view = render(draw(true));
    const host = view.container.querySelector('[data-slot="badge"]');
    if (!host) throw new Error("Badge root missing");
    await expectV2MotionAction("badge", "badge.root.exit", mode, () => view.rerender(draw(false)));
    expect(host).toHaveAttribute("inert");
    expect(host).toHaveAttribute("aria-hidden", "true");
    fireEvent.click(host);
    expect(click).not.toHaveBeenCalled();
    await expectV2MotionAction("badge", "badge.root.enter", mode, () => view.rerender(draw(true)));
    expect(host).not.toHaveAttribute("inert");
    expect(view.container.querySelector('[data-slot="badge"]')).toBe(host);
  });
  it.each(["full", "none"] as const)("completes actual AnimatePresence removal at zero clock in %s", async (mode) => {
    const draw = (show: boolean) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <AnimatePresence>{show && <Badge key="status">Optional</Badge>}</AnimatePresence>
      </CadenceProvider>
    );
    const view = render(draw(true));
    view.rerender(draw(false));
    await waitFor(() => expect(view.container.querySelector('[data-slot="badge"]')).toBeNull());
  });
  it("preserves anchor focus, caller ref cleanup and cancelled activation", async () => {
    const clean = vi.fn(),
      attach = vi.fn(() => clean),
      click = vi.fn((e) => e.preventDefault());
    const view = render(
      <Badge ref={attach} render={<a href="#release" />} onClick={click}>
        Release
      </Badge>,
    );
    const link = screen.getByRole("link");
    await userEvent.tab();
    expect(link).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(click).toHaveBeenCalledTimes(1);
    view.rerender(
      <Badge ref={attach} render={<a href="#next" />} onClick={click}>
        Next release
      </Badge>,
    );
    expect(screen.getByRole("link")).toBe(link);
    expect(link).toHaveFocus();
    expect(attach).toHaveBeenCalledTimes(1);
    view.unmount();
    expect(clean).toHaveBeenCalledTimes(1);
  });
  it("does not interpolate an unverified caller render palette", () => {
    render(
      <CadenceProvider mode="full">
        <Badge render={<a href="#release" style={{ color: "white", backgroundColor: "black" }} />}>
          Caller palette
        </Badge>
        <Badge render={<a href="#release" />}>Native palette</Badge>
      </CadenceProvider>,
    );
    expect(screen.getByRole("link", { name: "Caller palette" }).style.transitionDuration).toBe("0s");
    expect(
      Number.parseFloat(screen.getByRole("link", { name: "Native palette" }).style.transitionDuration),
    ).toBeGreaterThan(0);
  });
  it("renders a span with the upstream slot and variant", () => {
    render(<Badge>Beta</Badge>);
    const badge = screen.getByText("Beta").closest('[data-slot="badge"]');
    if (!badge) throw new Error("Badge root missing");
    expect(badge).toHaveAttribute("data-slot", "badge");
    expect(badge).toHaveAttribute("data-variant", "default");
    expect(badge.tagName).toBe("SPAN");
  });

  it("switches the variant attribute without changing the node", () => {
    render(<Badge variant="destructive">Failed</Badge>);
    const badge = screen.getByText("Failed").closest('[data-slot="badge"]');
    if (!badge) throw new Error("Badge root missing");
    expect(badge).toHaveAttribute("data-variant", "destructive");
  });

  it("composes through render instead of asChild", () => {
    render(
      <Badge variant="outline" render={<a href="/releases" />}>
        3 releases
      </Badge>,
    );

    const link = screen.getByRole("link", { name: "3 releases" });
    expect(link).toHaveAttribute("data-slot", "badge");
    expect(link).toHaveAttribute("href", "/releases");
  });

  it("is a label, not a control", () => {
    render(<Badge>Beta</Badge>);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("Beta")).not.toHaveAttribute("tabindex");
  });
});
