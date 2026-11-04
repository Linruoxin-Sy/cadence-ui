import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { CollapsiblePreview } from "@/components/site/previews/collapsible";

export function generateMetadata() {
  return getComponentMetadata("collapsible");
}

export default function Page() {
  return <ComponentPage id="collapsible" preview={CollapsiblePreview} />;
}
