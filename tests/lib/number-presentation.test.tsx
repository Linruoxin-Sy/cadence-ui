import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useMotionHostRef } from "@/registry/cadence/lib/motion-ref";
import { createMotionTransaction } from "@/registry/cadence/lib/motion-transaction";
import { createNumberSnapshot } from "@/registry/cadence/lib/number-plan";
import { commitNumberPresentations, createNumberPresentation } from "@/registry/cadence/lib/number-presentation";
import { CadenceProvider, useCadenceMotion } from "@/registry/cadence/lib/provider";
import { useNumberPresentation } from "@/registry/cadence/lib/use-number-presentation";
import { expectMotionContract } from "../motion-contract";

afterEach(() => {
  cleanup();
  document.getSelection()?.removeAllRanges();
});

function Pilot({ value, entity = "same" }: { value: number | bigint; entity?: string }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useNumberPresentation(node, value, cm, entity, { cause: "independent" });
  return (
    <span ref={ref} data-testid="number" data-slot="internal-number-pilot" data-motion={cm.mode}>
      {text}
    </span>
  );
}

function Policy({ receive }: { receive(cm: ReturnType<typeof useCadenceMotion>): void }) {
  receive(useCadenceMotion());
  return null;
}

describe("internal numeric native boundary", () => {
  it.each(["full", "reduced", "none"] as const)("%s commits exact semantic targets with one native Text", (mode) => {
    const ui = (value: number | bigint) => (
      <CadenceProvider mode={mode}>
        <Pilot value={value} />
      </CadenceProvider>
    );
    const view = render(ui(99)),
      host = view.getByTestId("number"),
      text = host.firstChild;
    const range = document.createRange();
    range.selectNodeContents(host);
    document.getSelection()?.addRange(range);
    view.rerender(ui(100));
    expectMotionContract(mode, {
      parts: [host],
      behavior: () => {
        expect(host.textContent).toBe("100");
        expect(host.firstChild).toBe(text);
        expect(host.childNodes).toHaveLength(1);
        expect(document.getSelection()?.toString()).toBe("100");
        expect(document.querySelectorAll("[data-cadence-number-layer]")).toHaveLength(0);
      },
    });
    view.rerender(ui(123456789012345678901234567890n));
    expect(host.textContent).toBe("123456789012345678901234567890");
    view.rerender(ui(1e21));
    expect(host.textContent).toBe("1e+21");
    view.rerender(ui(-0));
    expect(host.textContent).toBe("0");
  });

  it("keeps inherited editing tree, focus, caret and native event ownership", () => {
    const ui = (value: number) => (
      <div contentEditable suppressContentEditableWarning>
        <Pilot value={value} />
      </div>
    );
    const view = render(ui(120)),
      host = view.getByTestId("number"),
      text = host.firstChild;
    const selection = document.getSelection();
    selection?.setBaseAndExtent(text as Text, 2, text as Text, 2);
    view.rerender(ui(121));
    expect(host.firstChild).toBe(text);
    expect(selection?.anchorOffset).toBe(2);
    expect(host.textContent).toBe("121");
    expect(host.childNodes).toHaveLength(1);
  });

  it("known group overflow commits every exact value with no stale writer", () => {
    let cm: ReturnType<typeof useCadenceMotion>;
    render(
      <Policy
        receive={(value) => {
          cm = value;
        }}
      />,
    );
    const tx = createMotionTransaction();
    const items = Array.from({ length: 13 }, () => {
      const host = document.createElement("span");
      host.textContent = "1";
      document.body.append(host);
      return { host, controller: createNumberPresentation(host, tx) };
    });
    const commit = (value: number) => {
      const revision = tx.revision("value", value);
      commitNumberPresentations(
        items.map(({ controller }) => ({
          controller,
          options: { snapshot: createNumberSnapshot(value), revision, cm, entity: "same", cause: "independent" },
        })),
      );
    };
    commit(1);
    commit(2);
    for (const item of items) {
      expect(item.host.textContent).toBe("2");
      expect(item.controller.active().size).toBe(0);
      item.controller.dispose();
      item.host.remove();
    }
    expect(tx.activeWork("numericColumns").size).toBe(0);
  });
});
