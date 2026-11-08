import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useMotionHostRef } from "@/registry/cadence/lib/motion-ref";
import { createMotionTransaction } from "@/registry/cadence/lib/motion-transaction";
import { type CadenceMotion, CadenceProvider, useCadenceMotion } from "@/registry/cadence/lib/provider";
import { nativeTextContext, selectedTextContext } from "@/registry/cadence/lib/text-layout";
import { createTextPresentation } from "@/registry/cadence/lib/text-presentation";
import { useTextPresentation } from "@/registry/cadence/lib/use-text-presentation";

afterEach(() => {
  cleanup();
  document.getSelection()?.removeAllRanges();
});

function Probe({ receive }: { receive(cm: CadenceMotion): void }) {
  receive(useCadenceMotion());
  return null;
}

function Pilot({ value, entity = "same" }: { value: string; entity?: string }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useTextPresentation(node, value, cm, entity);
  return (
    <span ref={ref} data-testid="text" data-motion={cm.mode}>
      {text}
    </span>
  );
}

// These tests prove exact/native fallbacks. Actual raster/mask/WAAPI execution is
// intentionally tested by tests/runtime/text-presentation.mjs in real Chromium.
describe("internal native text boundary", () => {
  it.each(["full", "reduced", "none"] as const)("%s keeps one Text node and retained native ranges", (mode) => {
    const ui = (value: string) => (
      <CadenceProvider mode={mode}>
        <Pilot value={value} />
      </CadenceProvider>
    );
    const view = render(ui("aXbYc"));
    const host = view.getByTestId("text"),
      text = host.firstChild;
    const range = document.createRange();
    range.setStart(text as Text, 2);
    range.setEnd(text as Text, 3);
    document.getSelection()?.addRange(range);
    view.rerender(ui("aPbQc"));
    expect(host.textContent).toBe("aPbQc");
    expect(host.firstChild).toBe(text);
    expect(host.childNodes.length).toBe(1);
    expect(document.getSelection()?.toString()).toBe("b");
    expect(document.getSelection()?.anchorNode).toBe(text);
    expect(host).toHaveAttribute("data-motion", mode);
  });

  it("commits exact oversized values and recovers without a hidden renderer", () => {
    const view = render(<Pilot value="Save" />),
      host = view.getByTestId("text"),
      node = host.firstChild;
    view.rerender(<Pilot value={"x".repeat(2049)} />);
    expect(host.textContent).toBe("x".repeat(2049));
    view.rerender(<Pilot value="Saved" />);
    expect(host.textContent).toBe("Saved");
    expect(host.firstChild).toBe(node);
    expect(host.querySelectorAll("span,canvas")).toHaveLength(0);
  });

  it("resolves inherited/plaintext-only editing before any presentation node", () => {
    const outer = document.createElement("div"),
      island = document.createElement("div"),
      host = document.createElement("span");
    outer.setAttribute("contenteditable", "plaintext-only");
    outer.append(island);
    island.append(host);
    expect(nativeTextContext(host)).toBe(true);
    island.setAttribute("contenteditable", "false");
    expect(nativeTextContext(host)).toBe(false);
    host.setAttribute("contenteditable", "true");
    expect(nativeTextContext(host)).toBe(true);
    host.removeAttribute("contenteditable");
    island.setAttribute("contenteditable", "inherit");
    expect(nativeTextContext(host)).toBe(true);
  });

  it("selection only constrains its intersecting owned slot", () => {
    const view = render(
      <>
        <Pilot value="Save" />
        <span data-testid="other">other</span>
      </>,
    );
    const host = view.getByTestId("text"),
      other = view.getByTestId("other");
    const range = document.createRange();
    range.selectNodeContents(other);
    document.getSelection()?.addRange(range);
    expect(selectedTextContext(host)).toBe(false);
    expect(selectedTextContext(other)).toBe(true);
  });

  it("a closed motion transaction cannot reject committed semantic content", () => {
    let cm: CadenceMotion;
    render(
      <Probe
        receive={(value) => {
          cm = value;
        }}
      />,
    );
    const host = document.createElement("span");
    host.textContent = "Save";
    document.body.append(host);
    const tx = createMotionTransaction(),
      c = createTextPresentation(host, tx);
    act(() => {
      c.commit({ value: "Save", entity: host, revision: tx.revision("content", "Save"), cm });
      tx.close();
      c.commit({ value: "Saved", entity: host, revision: tx.revision("content", "Saved"), cm });
    });
    expect(host.textContent).toBe("Saved");
    c.dispose();
    host.remove();
  });

  it("foreign rich and native-value hosts keep their original tree/value", () => {
    let cm: CadenceMotion;
    render(
      <Probe
        receive={(value) => {
          cm = value;
        }}
      />,
    );
    const rich = document.createElement("span"),
      link = document.createElement("a"),
      input = document.createElement("input");
    link.textContent = "Save";
    rich.append(link);
    input.value = "native";
    document.body.append(rich, input);
    for (const host of [rich, input]) {
      const tx = createMotionTransaction(),
        c = createTextPresentation(host, tx);
      act(() => c.commit({ value: "Saved", entity: host, revision: tx.revision("content", "Saved"), cm }));
      c.dispose();
    }
    expect(rich.firstChild).toBe(link);
    expect(link.textContent).toBe("Save");
    expect(input.value).toBe("native");
    expect(input.childNodes.length).toBe(0);
    rich.remove();
    input.remove();
  });

  it("native mutation, editing entry/exit and same-target commits preserve the browser tree", async () => {
    const view = render(
      <div contentEditable suppressContentEditableWarning>
        <Pilot value="Save" />
      </div>,
    );
    const host = view.getByTestId("text"),
      text = host.firstChild as Text;
    act(() => text.replaceData(4, 0, "!"));
    await act(async () => {});
    view.rerender(
      <div contentEditable={false}>
        <Pilot value="Save" />
      </div>,
    );
    expect(host.firstChild).toBe(text);
    expect(host.textContent).toBe("Save!");
  });
});
