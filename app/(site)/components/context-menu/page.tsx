import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { ContextMenuPreview } from "@/components/site/previews/context-menu";

export function generateMetadata() {
  return getComponentMetadata("context-menu");
}

export default function Page() {
  return <ComponentPage id="context-menu" preview={ContextMenuPreview} />;
}
