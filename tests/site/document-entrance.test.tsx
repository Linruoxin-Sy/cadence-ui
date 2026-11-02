import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DocumentEntrance } from "@/components/site/document-entrance";
import { CadenceProvider } from "@/registry/cadence/lib/provider";

describe("DocumentEntrance server state", () => {
  for (const as of ["article", "section", "div"] as const) {
    it.each(["full", "reduced", "none"] as const)(`${as} renders the explicit %s initial state`, (mode) => {
      const html = renderToString(
        <CadenceProvider mode={mode}>
          <DocumentEntrance as={as}>Readable</DocumentEntrance>
        </CadenceProvider>,
      );
      const root = document.createElement("div");
      root.innerHTML = html;
      const host = root.querySelector<HTMLElement>(`${as}[data-document-entrance]`);
      expect(host).not.toBeNull();
      expect(host?.dataset.motion).toBe(mode);
      expect(host?.style.opacity).toBe(mode === "none" ? "1" : "0");
      expect(host?.style.filter).toBe(mode === "full" ? "blur(4px)" : "none");
      expect(host?.style.clipPath).toBe(mode === "full" ? "inset(0% 0% 100% 0%)" : "none");
    });
  }
});
