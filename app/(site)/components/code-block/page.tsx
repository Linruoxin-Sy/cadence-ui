import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { CodeBlockPreview } from "@/components/site/previews/code-block";

export function generateMetadata() {
  return getComponentMetadata("code-block");
}

export default function Page() {
  return <ComponentPage id="code-block" preview={CodeBlockPreview} />;
}
