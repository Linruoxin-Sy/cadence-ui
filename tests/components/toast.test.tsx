import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { createToastManager, Toaster } from "@/registry/cadence/toast";
import { expectMotionContract } from "../motion-contract";

describe("Toast", () => {
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
    expect(root?.className.includes("scale-(--motion-scale-in)")).toBe(mode === "full");
    expect(root?.className.includes("[transform:")).toBe(mode === "full");
    expect(root?.className).toContain("duration-(--motion-duration-base)");
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
