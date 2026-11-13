import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { Textarea } from "@/registry/cadence/textarea";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

describe("Textarea", () => {
  it("renders a textarea with its slot", () => {
    render(<Textarea aria-label="Comment" />);
    const textarea = screen.getByRole("textbox", { name: "Comment" });
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea).toHaveAttribute("data-slot", "textarea");
  });

  it("accepts multi-line input and native props", async () => {
    render(<Textarea aria-label="Comment" rows={4} maxLength={120} />);
    const textarea = screen.getByRole("textbox", { name: "Comment" }) as HTMLTextAreaElement;

    await userEvent.type(textarea, "first line{enter}second line");

    expect(textarea).toHaveValue("first line\nsecond line");
    expect(textarea).toHaveAttribute("rows", "4");
    expect(textarea).toHaveAttribute("maxlength", "120");
  });

  it("keeps the invalid state attribute-driven", () => {
    render(<Textarea aria-label="Bio" aria-invalid="true" aria-describedby="bio-error" />);
    const textarea = screen.getByRole("textbox", { name: "Bio" });

    expect(textarea).toHaveAttribute("aria-invalid", "true");
    expect(textarea).toHaveAttribute("aria-describedby", "bio-error");
  });
});

describe("Textarea v2", () => {
  beforeAll(() => prepareV2MotionPlan());
  it.each(["full", "reduced", "none"] as const)("executes each owned action in %s", async (mode) => {
    const draw = ({ present = true, paint = "#111", rows = 2 } = {}) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <Textarea aria-label="Note" hidden={!present} style={{ color: paint }} rows={rows} defaultValue={"one\ntwo"} />
      </CadenceProvider>
    );
    const view = render(draw({ present: false }));
    const host = view.container.querySelector("textarea") as HTMLTextAreaElement;
    await expectV2MotionAction("textarea", "textarea.root.enter", mode, () => view.rerender(draw()));
    expect(view.container.querySelector("textarea")).toBe(host);
    expect(host).not.toHaveAttribute("hidden");
    // A caller `rows` revision is the one explicit block size this owner interpolates.
    await expectV2MotionAction("textarea", "textarea.root.resize", mode, () => view.rerender(draw({ rows: 6 })));
    expect(host).toHaveAttribute("rows", "6");
    await expectV2MotionAction("textarea", "textarea.root.colour", mode, () =>
      view.rerender(draw({ rows: 6, paint: "#333" })),
    );
    expect(host.style.color).toBe("rgb(51, 51, 51)");
    expectMotionContract(mode, { policy: ["color"], parts: [host] });
    await expectV2NativeBoundaries("textarea", { container: view.container });
  });

  it("keeps the verified colour clock and settles focus, invalid and unverified palettes", async () => {
    const draw = (options: { paint?: string; invalid?: boolean } = {}) => (
      <CadenceProvider timeScale={1}>
        <Textarea
          aria-label="Chrome"
          aria-invalid={options.invalid || undefined}
          style={options.paint ? { color: options.paint } : undefined}
        />
      </CadenceProvider>
    );
    const view = render(draw());
    const host = view.container.querySelector("textarea") as HTMLTextAreaElement;
    // The declared chrome owns one explicit paint clock while it is eligible.
    await vi.waitFor(() => expect(Number.parseFloat(host.style.transitionDuration)).toBe(0.16));
    expect(host.style.transitionProperty).not.toContain("all");
    expect(host.style.transitionDelay).toBe("0s");
    // DOM focus settles every declared paint property immediately.
    host.focus();
    await vi.waitFor(() => expect(Number.parseFloat(host.style.transitionDuration)).toBe(0));
    expect(host).toHaveFocus();
    // Blur restores the eligible clock without replaying a suppressed update.
    host.blur();
    await vi.waitFor(() => expect(Number.parseFloat(host.style.transitionDuration)).toBe(0.16));
    // Invalid state takes the same immediate path.
    view.rerender(draw({ invalid: true }));
    await vi.waitFor(() => expect(Number.parseFloat(host.style.transitionDuration)).toBe(0));
    // A caller palette we cannot prove settles at its target instead of tweening.
    view.rerender(draw({ paint: "#333" }));
    await vi.waitFor(() => expect(Number.parseFloat(host.style.transitionDuration)).toBe(0));
    expect(host.style.color).toBe("rgb(51, 51, 51)");
  });

  it("keeps the native editor: value, selection, form association and no wrapper", async () => {
    const draw = (rows: number) => (
      <CadenceProvider timeScale={0}>
        <form aria-label="Note form">
          <Textarea aria-label="Review" name="review" rows={rows} defaultValue="acme" />
        </form>
      </CadenceProvider>
    );
    const view = render(draw(2));
    const host = view.container.querySelector("textarea") as HTMLTextAreaElement;
    const wrapper = view.container.querySelector("[data-cadence-scope]") as HTMLElement;
    const form = view.container.querySelector("form");
    expect(host.tagName).toBe("TEXTAREA");
    // The native control is the only host: no editor, mirror or presentation wrapper.
    expect(host.parentElement).toBe(form);
    expect(form?.parentElement).toBe(wrapper);
    expect(wrapper.children).toHaveLength(1);
    expect(host.form).toBe(form);
    await userEvent.type(host, "-ui");
    expect(host).toHaveValue("acme-ui");
    host.setSelectionRange(2, 4);
    // A focused editor keeps its own geometry: focus, selection and scroll are native.
    view.rerender(draw(8));
    expect(host).toHaveFocus();
    expect(host.selectionStart).toBe(2);
    expect(host.selectionEnd).toBe(4);
    expect(host).toHaveAttribute("rows", "8");
    expect(host.style.height).toBe("");
    // No text mirror and no width/height writer on the real element.
    const written = (host.getAnimations?.() ?? [])
      .flatMap((animation) => (animation.effect as KeyframeEffect | null)?.getKeyframes() ?? [])
      .flatMap((frame) => Object.keys(frame));
    expect(written.filter((key) => /^(?:width|height)$/.test(key))).toEqual([]);
    // The only text node is the native default value React seeded; nothing mirrors it.
    expect(host.childElementCount).toBe(0);
    expect(host.value).toBe("acme-ui");
    expect(host.style.transitionProperty).not.toContain("all");
    view.unmount();
    expect(document.querySelector("[data-cadence-geometry-probe]")).toBeNull();
  });
});
