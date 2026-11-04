import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { TooltipPreview } from "@/components/site/previews/tooltip";

export function generateMetadata() {
  return getComponentMetadata("tooltip");
}

export default function Page() {
  return <ComponentPage id="tooltip" preview={TooltipPreview} />;
}
