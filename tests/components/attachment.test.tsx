import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
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

describe.each(["full", "reduced", "none"] as const)("motion %s", (mode) => {
  it("keeps mode branches and nodes through external state changes", () => {
    const tree = (state: "uploading" | "done") => (
      <CadenceProvider mode={mode}>
        <Attachment state={state}>
          <AttachmentTitle>File</AttachmentTitle>
          <AttachmentAction aria-label="Remove" />
        </Attachment>
      </CadenceProvider>
    );
    const { container, rerender } = render(tree("uploading"));
    const title = screen.getByText("File");
    const root = container.querySelector('[data-slot="attachment"]');
    expect(root).toHaveAttribute("data-motion", mode);
    expect(title).toHaveAttribute("data-motion", mode);
    expect(screen.getByRole("button")).toHaveAttribute("data-motion", mode);
    if (mode === "none") expect(title).toHaveClass("animate-none");
    else expect(title.className).toContain("animate-pulse");
    if (mode !== "full") expect(title).toHaveClass("transform-none");
    rerender(tree("done"));
    expect(screen.getByText("File")).toBe(title);
    expect(root).toHaveAttribute("data-state", "done");
  });
});

it("cancels to none and restores nested full without replacing the title", () => {
  const tree = (mode: "full" | "none") => (
    <CadenceProvider mode="none">
      <CadenceProvider mode={mode}>
        <Attachment state="uploading">
          <AttachmentTitle>File</AttachmentTitle>
        </Attachment>
      </CadenceProvider>
    </CadenceProvider>
  );
  const { rerender } = render(tree("full"));
  const title = screen.getByText("File");
  expect(title).toHaveAttribute("data-motion", "full");
  rerender(tree("none"));
  expect(screen.getByText("File")).toBe(title);
  expect(title).toHaveClass("animate-none");
  rerender(tree("full"));
  expect(title.className).toContain("animate-pulse");
});
