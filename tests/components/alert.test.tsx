import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AnimatePresence, PresenceContext } from "motion/react";
import { createRef } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { Alert, AlertAction, AlertDescription, type AlertProps, AlertTitle } from "@/registry/cadence/alert";
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
  native?: Pick<AlertProps, "role" | "aria-live" | "aria-hidden" | "inert">;
}) {
  const paint = { color: changed ? "#222" : "#111" };
  return (
    <Alert
      {...native}
      variant={changed ? "destructive" : "default"}
      style={{ ...paint, backgroundColor: changed ? "#eee" : "#fff" }}
    >
      <svg key={changed ? "warning" : "info"} aria-hidden="true" viewBox="0 0 24 24">
        <path d={changed ? "M2 22L12 2L22 22Z" : "M2 2H22V22H2Z"} />
      </svg>
      <AlertTitle style={paint}>{value}</AlertTitle>
      <AlertDescription style={paint}>{value}</AlertDescription>
      <AlertAction>
        <button type="button">Retry</button>
      </AlertAction>
    </Alert>
  );
}

describe("Alert", () => {
  beforeAll(() => prepareV2MotionPlan());
  it.each(["full", "reduced", "none"] as const)(
    "preserves original native defaults, explicit overrides, props and ref lifetime in %s",
    (mode) => {
      const cleanup = { root: vi.fn(), title: vi.fn(), description: vi.fn() };
      const refs = {
        root: vi.fn((_node: HTMLDivElement | null) => cleanup.root),
        title: vi.fn((_node: HTMLDivElement | null) => cleanup.title),
        description: vi.fn((_node: HTMLDivElement | null) => cleanup.description),
      };
      const actionRef = createRef<HTMLDivElement>();
      const clicks = { root: vi.fn(), title: vi.fn(), description: vi.fn(), action: vi.fn() };
      const slot = (stage: "default" | "custom" | "undefined", name: string) =>
        stage === "default" ? {} : { "data-slot": stage === "custom" ? `caller-${name}` : undefined };
      const draw = (stage: "default" | "custom" | "undefined") => (
        <CadenceProvider mode={mode} timeScale={0}>
          <Alert
            {...slot(stage, "alert")}
            {...(stage === "default" ? {} : { role: stage === "custom" ? ("status" as const) : undefined })}
            variant={stage === "custom" ? null : undefined}
            id="caller-root"
            ref={refs.root}
            aria-live="off"
            title="Native tooltip"
            className="px-7 caller-root"
            style={{ paddingTop: 13 }}
            onClick={clicks.root}
          >
            <AlertTitle
              {...slot(stage, "alert-title")}
              id="caller-title"
              ref={refs.title}
              className="caller-title"
              style={{ paddingLeft: 11 }}
              onClick={clicks.title}
            >
              Current title
            </AlertTitle>
            <AlertDescription
              {...slot(stage, "alert-description")}
              id="caller-description"
              ref={refs.description}
              className="caller-description"
              style={{ paddingBottom: 9 }}
              onClick={clicks.description}
            >
              Current description
            </AlertDescription>
            <AlertAction
              {...slot(stage, "alert-action")}
              id="caller-action"
              ref={actionRef}
              style={{ marginLeft: 7 }}
              onClick={clicks.action}
            >
              Native action
            </AlertAction>
          </Alert>
        </CadenceProvider>
      );
      const view = render(draw("default"));
      const root = screen.getByRole("alert");
      const title = view.container.querySelector("#caller-title") as HTMLDivElement;
      const description = view.container.querySelector("#caller-description") as HTMLDivElement;
      const action = view.container.querySelector("#caller-action") as HTMLDivElement;
      const titleText = title.querySelector("span")?.firstChild;
      const parts = [root, title, description, action];
      const names = ["alert", "alert-title", "alert-description", "alert-action"];
      for (const stage of ["default", "custom", "undefined", "default"] as const) {
        view.rerender(draw(stage));
        for (const [index, part] of parts.entries()) {
          expect(view.container.querySelector(`#${part.id}`)).toBe(part);
          if (stage === "undefined") expect(part).not.toHaveAttribute("data-slot");
          else expect(part).toHaveAttribute("data-slot", stage === "custom" ? `caller-${names[index]}` : names[index]);
        }
        if (stage === "undefined") expect(root).not.toHaveAttribute("role");
        else expect(root).toHaveAttribute("role", stage === "custom" ? "status" : "alert");
        expect(root).toHaveAttribute("aria-live", "off");
        expect(root).toHaveAttribute("title", "Native tooltip");
        expect(root.classList.contains("bg-card")).toBe(stage !== "custom");
        expect(root).toHaveClass("px-7", "caller-root");
        expect(root).not.toHaveClass("px-4");
        expect(root.style.paddingTop).toBe("13px");
        expect(title.style.paddingLeft).toBe("11px");
        expect(description.style.paddingBottom).toBe("9px");
        expect(action.style.marginLeft).toBe("7px");
        expect(title.querySelector("span")?.firstChild).toBe(titleText);
        expect(view.container.querySelectorAll('[role="alert"],[role="status"]')).toHaveLength(
          stage === "undefined" ? 0 : 1,
        );
        expect(actionRef.current).toBe(action);
      }
      fireEvent.click(title);
      fireEvent.click(description);
      fireEvent.click(action);
      expect(clicks.root).toHaveBeenCalledTimes(3);
      for (const name of ["title", "description", "action"] as const) expect(clicks[name]).toHaveBeenCalledTimes(1);
      for (const name of ["root", "title", "description"] as const) {
        expect(refs[name]).toHaveBeenCalledTimes(1);
        expect(cleanup[name]).not.toHaveBeenCalled();
      }
      view.unmount();
      for (const name of ["root", "title", "description"] as const) expect(cleanup[name]).toHaveBeenCalledTimes(1);
      expect(actionRef.current).toBeNull();
    },
  );
  it("keeps the original keyed SVG ref registration and exact cleanup lifetime", () => {
    const cleanup = vi.fn();
    const source = vi.fn(() => cleanup);
    const draw = (key: string, title: string) => (
      <Alert>
        <svg key={key} ref={source} aria-hidden="true" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
        </svg>
        <AlertTitle>{title}</AlertTitle>
      </Alert>
    );
    const view = render(draw("first", "Pending"));
    const svg = view.container.querySelector("svg");
    view.rerender(draw("first", "Ready"));
    expect(view.container.querySelector("svg")).toBe(svg);
    expect(source).toHaveBeenCalledTimes(1);
    expect(cleanup).not.toHaveBeenCalled();
    view.rerender(draw("second", "Newest"));
    expect(view.container.querySelector("svg")).not.toBe(svg);
    expect(source).toHaveBeenCalledTimes(2);
    expect(cleanup).toHaveBeenCalledTimes(1);
    view.unmount();
    expect(cleanup).toHaveBeenCalledTimes(2);
  });
  it.each(["full", "reduced", "none"] as const)("executes all actual message owners in %s", async (mode) => {
    const draw = (value: string | number, changed = false) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <Example value={value} changed={changed} />
      </CadenceProvider>
    );
    const view = render(draw("Message pending"));
    const texts = Array.from(view.container.querySelectorAll('[data-slot="alert-text"]')).map(
      (node) => node.firstChild,
    );
    await expectV2MotionAction("alert", "alert.text.replace", mode, () => view.rerender(draw("Message ready")));
    expect(
      Array.from(view.container.querySelectorAll('[data-slot="alert-text"]')).map((node) => node.firstChild),
    ).toEqual(texts);
    await expectV2MotionAction("alert", "alert.root.resize", mode, () =>
      view.rerender(draw("Longer current message ready", true)),
    );
    await expectV2MotionAction("alert", "alert.surface.colour", mode, () =>
      view.rerender(draw("Message ready", false)),
    );
    await expectV2MotionAction("alert", "alert.foreground.colour", mode, () =>
      view.rerender(draw("Message ready", true)),
    );
    await expectV2MotionAction("alert", "alert.icon.replace", mode, () => view.rerender(draw("Message ready", false)));
    view.rerender(draw(19));
    await expectV2MotionAction("alert", "alert.value.roll", mode, () => view.rerender(draw(20)));
    expect(
      Array.from(view.container.querySelectorAll('[data-slot="alert-number"]')).map((node) => node.textContent),
    ).toEqual(["20", "20"]);
    expectMotionContract(mode, { parts: Array.from(view.container.querySelectorAll("[data-motion]")) });
    view.rerender(
      <CadenceProvider mode={mode}>
        <Alert>
          <AlertTitle>
            <strong>Rich current title</strong>
          </AlertTitle>
          <AlertDescription>
            <em>Rich description</em>
          </AlertDescription>
        </Alert>
      </CadenceProvider>,
    );
    await expectV2NativeBoundaries("alert", { container: view.container });
  });
  it.each(["full", "reduced", "none"] as const)("retains one inert surface and reverses it in %s", async (mode) => {
    const draw = (present: boolean) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <PresenceContext.Provider
          value={{
            id: "alert",
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
    await expectV2MotionAction("alert", "alert.root.exit", mode, () => view.rerender(draw(false)));
    expect(root).toHaveAttribute("inert");
    expect(root).not.toHaveAttribute("role");
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    await expectV2MotionAction("alert", "alert.root.enter", mode, () => view.rerender(draw(true)));
    expect(screen.getByRole("status")).toBe(root);
    expect(root).not.toHaveAttribute("inert");
    expect(root).toHaveAttribute("aria-hidden", "false");
    expect(root).toHaveAttribute("aria-live", "polite");
    expectMotionContract(mode, { parts: [root] });
  });
  it.each(["full", "reduced", "none"] as const)(
    "keeps native editing, refs, controls and one announcement in %s",
    async (mode) => {
      const ref = vi.fn();
      const click = vi.fn();
      const draw = (value: string | number, editable = true) => (
        <CadenceProvider mode={mode}>
          <div contentEditable={editable} suppressContentEditableWarning>
            <Alert ref={ref}>
              <AlertTitle>{value}</AlertTitle>
              <AlertDescription>
                <em>Rich current message</em>
              </AlertDescription>
              <AlertAction>
                <button type="button" onClick={click}>
                  Retry
                </button>
                <input aria-label="Memo" defaultValue="draft" />
              </AlertAction>
              <span data-native="untouched">Arbitrary root content</span>
            </Alert>
          </div>
        </CadenceProvider>
      );
      const view = render(draw(19));
      const root = screen.getByRole("alert");
      const input = screen.getByRole("textbox");
      const span = view.container.querySelector('[data-slot="alert-number"]');
      const text = span?.firstChild as Text;
      text.replaceData(0, text.length, "Native buffer");
      document.getSelection()?.setBaseAndExtent(text, 3, text, 3);
      for (const value of ["ERR_042", 20, "Current", 22]) {
        view.rerender(draw(value));
        expect(view.container.querySelector('[data-slot="alert-text"],[data-slot="alert-number"]')).toBe(span);
        expect(span?.firstChild).toBe(text);
        expect(text.data).toBe("Native buffer");
        expect(document.getSelection()?.anchorNode).toBe(text);
      }
      view.rerender(draw(22, false));
      view.rerender(draw(23, false));
      expect(text.data).toBe("23");
      document.getSelection()?.removeAllRanges();
      expect(screen.getByRole("alert")).toBe(root);
      expect(screen.getByRole("textbox")).toBe(input);
      fireEvent.change(input, { target: { value: "user draft" } });
      await userEvent.click(screen.getByRole("button", { name: "Retry" }));
      expect(click).toHaveBeenCalledTimes(1);
      expect(input).toHaveValue("user draft");
      expect(ref.mock.calls.filter(([node]) => node === root)).toHaveLength(1);
      expect(root.querySelector("em")?.parentElement?.childElementCount).toBe(1);
      expect(root.querySelector('[data-native="untouched"]')?.textContent).toBe("Arbitrary root content");
      expect(screen.getAllByRole("alert")).toHaveLength(1);
      expectMotionContract(mode, { parts: [root, span as Element] });
    },
  );
  it("completes caller-owned removal at zero without keeping a tab stop", async () => {
    const draw = (show: boolean) => (
      <CadenceProvider timeScale={0}>
        <AnimatePresence>
          {show && (
            <Alert key="notice">
              <AlertAction>
                <button type="button">Dismiss</button>
              </AlertAction>
            </Alert>
          )}
        </AnimatePresence>
      </CadenceProvider>
    );
    const view = render(draw(true));
    view.rerender(draw(false));
    await waitFor(() => expect(view.container.querySelector('[data-slot="alert"]')).toBeNull());
  });
  it("renders every part with its slot", () => {
    render(
      <Alert>
        <AlertTitle>Deploy failed</AlertTitle>
        <AlertDescription>Build 42 exited with code 1.</AlertDescription>
        <AlertAction>Retry</AlertAction>
      </Alert>,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("data-slot", "alert");
    expect(screen.getByText("Deploy failed").closest('[data-slot="alert-title"]')).toBe(
      alert.querySelector('[data-slot="alert-title"]'),
    );
    expect(screen.getByText("Build 42 exited with code 1.").closest('[data-slot="alert-description"]')).toBe(
      alert.querySelector('[data-slot="alert-description"]'),
    );
    expect(screen.getByText("Retry")).toHaveAttribute("data-slot", "alert-action");
  });

  it("is one assertive live region, not one per part", () => {
    render(
      <Alert>
        <AlertTitle>Sync paused</AlertTitle>
        <AlertDescription>Reconnect the drive to resume.</AlertDescription>
      </Alert>,
    );

    expect(screen.getAllByRole("alert")).toHaveLength(1);
  });

  it("uses the destructive token without changing the surface", () => {
    render(<Alert variant="destructive">Payment declined</Alert>);
    const alert = screen.getByRole("alert");

    expect(alert.className).toContain("text-destructive");
    expect(alert.className).toContain("bg-card");
  });

  it("keeps the neutral surface by default", () => {
    render(<Alert>Heads up</Alert>);
    expect(screen.getByRole("alert").className).toContain("text-card-foreground");
  });
});
