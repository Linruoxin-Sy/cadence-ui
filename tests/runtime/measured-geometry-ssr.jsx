import { renderToString } from "react-dom/server";
import { CodeBlock, CodeBlockContent } from "../../registry/cadence/code-block";
import { CadenceProvider } from "../../registry/cadence/lib/provider";
export const html = renderToString(
  <CadenceProvider mode="full" timeScale={3}>
    <CodeBlock maxLines={2} expanded={false}>
      <CodeBlockContent style={{ lineHeight: "20px", padding: "10px" }}>
        {Array.from({ length: 20 }, (_, i) => `Line ${i}`).join("\n")}
      </CodeBlockContent>
    </CodeBlock>
  </CadenceProvider>,
);
