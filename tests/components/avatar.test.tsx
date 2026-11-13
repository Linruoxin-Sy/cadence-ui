import { render, screen } from "@testing-library/react";
import { PresenceContext } from "motion/react";
import { createRef } from "react";
import { beforeAll, describe, expect, it } from "vitest";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/registry/cadence/avatar";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

const presence = (present: boolean) => ({
  id: "avatar-test",
  initial: false as const,
  isPresent: present,
  register: () => () => {},
  onExitComplete: () => {},
});

describe("Avatar", () => {
  it("renders the image and the fallback with their slots", () => {
    render(
      <Avatar>
        <AvatarImage src="/ada.png" alt="Ada Lovelace" />
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>,
    );

    expect(screen.getByText("AL")).toHaveAttribute("data-slot", "avatar-fallback");
    const root = screen.getByText("AL").closest('[data-slot="avatar"]');
    expect(root).toHaveAttribute("data-size", "default");
  });

  it("keeps the initials reachable when the image never loads", () => {
    // jsdom never fires `load`, so this is the error path in practice.
    render(
      <Avatar>
        <AvatarImage src="/missing.png" alt="Ada Lovelace" />
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>,
    );

    expect(screen.getByText("AL")).toBeVisible();
  });

  it("exposes the size on the root", () => {
    render(
      <Avatar size="lg">
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>,
    );

    expect(screen.getByText("AL").closest('[data-slot="avatar"]')).toHaveAttribute("data-size", "lg");
  });

  it("stacks avatars with a count tile and a presence dot", () => {
    render(
      <AvatarGroup>
        <Avatar>
          <AvatarFallback>AL</AvatarFallback>
          <AvatarBadge aria-label="Online" />
        </Avatar>
        <AvatarGroupCount>+3</AvatarGroupCount>
      </AvatarGroup>,
    );

    expect(
      screen.getByText("AL").closest('[data-slot="avatar"]')?.querySelector("[data-slot=avatar-badge]"),
    ).toBeInTheDocument();
    const group = screen.getByText("+3").closest('[data-slot="avatar-group"]');
    expect(group).toHaveAttribute("data-slot", "avatar-group");
    expect(screen.getByText("+3").closest('[data-slot="avatar-group-count"]')).toHaveAttribute(
      "data-slot",
      "avatar-group-count",
    );
  });

  it("keeps a caller ref and native handlers across size revisions", () => {
    const ref = createRef<HTMLSpanElement>();
    const draw = (size: "default" | "lg") => (
      <Avatar ref={ref} size={size} aria-label="Ada" data-note="kept">
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
    );
    const view = render(draw("default"));
    const host = view.container.querySelector('[data-slot="avatar"]');
    expect(ref.current).toBe(host);
    view.rerender(draw("lg"));
    expect(view.container.querySelector('[data-slot="avatar"]')).toBe(host);
    expect(host).toHaveAttribute("data-note", "kept");
    expect(host).toHaveAttribute("data-size", "lg");
    view.unmount();
    expect(host?.isConnected).toBe(false);
  });
});

describe("Avatar v2", () => {
  beforeAll(() => prepareV2MotionPlan(), 30000);

  it.each(["full", "reduced", "none"] as const)("executes the standalone avatar actions in %s", async (mode) => {
    type State = {
      present: boolean;
      badgePresent: boolean;
      size: "default" | "sm" | "lg";
      src: string;
    };
    const draw = (state: State) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <PresenceContext.Provider value={presence(state.present)}>
          <Avatar size={state.size} aria-label="Ada Lovelace" data-testid="viewer">
            <AvatarImage src={state.src} alt="Ada Lovelace" keepMounted />
            <AvatarFallback data-testid="initials">AL</AvatarFallback>
            <PresenceContext.Provider value={presence(state.badgePresent)}>
              <AvatarBadge data-testid="badge">Online</AvatarBadge>
            </PresenceContext.Provider>
          </Avatar>
        </PresenceContext.Provider>
      </CadenceProvider>
    );
    const base: State = { present: false, badgePresent: false, size: "default", src: "/ada.png" };
    const view = render(draw(base));

    await expectV2MotionAction("avatar", "avatar.root.enter", mode, () =>
      view.rerender(draw({ ...base, present: true })),
    );
    await expectV2MotionAction("avatar", "avatar.badge.enter", mode, () =>
      view.rerender(draw({ ...base, present: true, badgePresent: true })),
    );
    await expectV2MotionAction("avatar", "avatar.image.replace", mode, () =>
      view.rerender(draw({ ...base, present: true, badgePresent: true, src: "/grace.png" })),
    );
    await expectV2MotionAction("avatar", "avatar.root.resize", mode, () =>
      view.rerender(draw({ ...base, present: true, badgePresent: true, src: "/grace.png", size: "lg" })),
    );
    await expectV2MotionAction("avatar", "avatar.badge.exit", mode, () =>
      view.rerender(draw({ ...base, present: true, src: "/grace.png", size: "lg" })),
    );
    await expectV2MotionAction("avatar", "avatar.root.exit", mode, () =>
      view.rerender(draw({ ...base, src: "/grace.png", size: "lg" })),
    );
    expectMotionContract(mode, { policy: ["color"] });
    await expectV2NativeBoundaries("avatar", { container: view.container });
    view.unmount();
  });

  it.each(["full", "reduced", "none"] as const)("executes the group, count and display actions in %s", async (mode) => {
    type State = {
      present: boolean;
      countPresent: boolean;
      members: number;
      count: string | number;
      initials: string;
      badge: string;
      colour: boolean;
    };
    const draw = (state: State) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <PresenceContext.Provider value={presence(state.present)}>
          <AvatarGroup aria-label="Reviewers" data-testid="group">
            <Avatar size="lg" aria-label="Ada Lovelace">
              <AvatarFallback style={state.colour ? { backgroundColor: "#222", color: "#ddd" } : undefined}>
                {state.initials}
              </AvatarFallback>
              <AvatarBadge style={state.colour ? { backgroundColor: "#333", color: "#eee" } : undefined}>
                {state.badge}
              </AvatarBadge>
            </Avatar>
            {state.members > 1 && (
              <Avatar size="lg" aria-label="Grace Hopper">
                <AvatarFallback>GH</AvatarFallback>
              </Avatar>
            )}
            <PresenceContext.Provider value={presence(state.countPresent)}>
              <AvatarGroupCount
                data-testid="count"
                style={state.colour ? { backgroundColor: "#444", color: "#ccc" } : undefined}
              >
                {state.count}
              </AvatarGroupCount>
            </PresenceContext.Provider>
          </AvatarGroup>
        </PresenceContext.Provider>
      </CadenceProvider>
    );
    const base: State = {
      present: false,
      countPresent: false,
      members: 1,
      count: "+3",
      initials: "AL",
      badge: "Online",
      colour: false,
    };
    const view = render(draw(base));

    await expectV2MotionAction("avatar", "avatar.group.enter", mode, () =>
      view.rerender(draw({ ...base, present: true })),
    );
    await expectV2MotionAction("avatar", "avatar.member.enter", mode, () =>
      view.rerender(draw({ ...base, present: true, countPresent: true })),
    );
    // One display revision across the fallback, badge and count text owners.
    await expectV2MotionAction("avatar", "avatar.text.replace", mode, () =>
      view.rerender(
        draw({ ...base, present: true, countPresent: true, initials: "A. L.", badge: "Away", count: "+5" }),
      ),
    );
    // One palette revision across the fallback, badge and count surfaces.
    await expectV2MotionAction("avatar", "avatar.palette.colour", mode, () =>
      view.rerender(
        draw({
          ...base,
          present: true,
          countPresent: true,
          initials: "A. L.",
          badge: "Away",
          count: "+5",
          colour: true,
        }),
      ),
    );
    // A direct numeric quantity owns the number display instead of the text one.
    view.rerender(
      draw({ ...base, present: true, countPresent: true, initials: "A. L.", badge: "Away", count: 3, colour: true }),
    );
    await expectV2MotionAction("avatar", "avatar.count.roll", mode, () =>
      view.rerender(
        draw({ ...base, present: true, countPresent: true, initials: "A. L.", badge: "Away", count: 4, colour: true }),
      ),
    );
    await expectV2MotionAction("avatar", "avatar.member.exit", mode, () =>
      view.rerender(draw({ ...base, present: true, initials: "A. L.", badge: "Away", count: 4, colour: true })),
    );
    await expectV2MotionAction("avatar", "avatar.group.resize", mode, () =>
      view.rerender(
        draw({
          ...base,
          present: true,
          members: 2,
          initials: "A. L.",
          badge: "Away",
          count: 4,
          colour: true,
        }),
      ),
    );
    expectMotionContract(mode, { policy: ["color"] });
    view.unmount();
  });

  it("retargets changed initials and a size reversal on the same retained hosts", () => {
    const draw = (initials: string, size: "default" | "lg") => (
      <CadenceProvider mode="full">
        <Avatar size={size}>
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </CadenceProvider>
    );
    const view = render(draw("AL", "default"));
    const root = view.container.querySelector('[data-slot="avatar"]');
    const display = view.container.querySelector('[data-slot="avatar-fallback"]');
    view.rerender(draw("A. L.", "lg"));
    expect(view.container.querySelector('[data-slot="avatar"]')).toBe(root);
    expect(view.container.querySelector('[data-slot="avatar-fallback"]')).toBe(display);
    expect(display?.textContent).toBe("A. L.");
    view.rerender(draw("A. L.", "default"));
    expect(root).toHaveAttribute("data-size", "default");
  });

  it("keeps a formatted count as text and a direct quantity as a reel", () => {
    const draw = (count: string | number) => (
      <CadenceProvider mode="full">
        <AvatarGroup>
          <Avatar>
            <AvatarFallback>AL</AvatarFallback>
          </Avatar>
          <AvatarGroupCount>{count}</AvatarGroupCount>
        </AvatarGroup>
      </CadenceProvider>
    );
    const view = render(draw("+3"));
    expect(view.container.querySelector('[data-slot="avatar-group-count-text"]')?.textContent).toBe("+3");
    expect(view.container.querySelector('[data-slot="avatar-group-count-number"]')).toBeNull();
    view.rerender(draw(3));
    expect(view.container.querySelector('[data-slot="avatar-group-count-number"]')?.textContent).toBe("3");
    expect(view.container.querySelector('[data-slot="avatar-group-count-text"]')).toBeNull();
  });

  it("disposes the image controller on unmount without a later writer", () => {
    const draw = (src: string) => (
      <CadenceProvider mode="full">
        <Avatar>
          <AvatarImage src={src} alt="Ada" keepMounted />
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
      </CadenceProvider>
    );
    const view = render(draw("/ada.png"));
    const image = view.container.querySelector('[data-slot="avatar-image"]') as HTMLImageElement;
    view.rerender(draw("/grace.png"));
    view.unmount();
    expect(image.isConnected).toBe(false);
    expect(image.getAnimations?.() ?? []).toHaveLength(0);
  });

  it("keeps the native fallback swap outside the motion system", () => {
    const view = render(
      <Avatar>
        <AvatarImage src="/ada.png" alt="Ada" />
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>,
    );
    // jsdom never loads the image, so Base UI keeps the real fallback visible and
    // mounts no image layer of its own.
    expect(screen.getByText("AL")).toBeVisible();
    expect(view.container.querySelector('[data-slot="avatar-image"]')).toBeNull();
  });
});
