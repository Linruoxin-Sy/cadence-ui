import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { PopoverPreview } from "@/components/site/previews/popover";

export function generateMetadata() {
  return getComponentMetadata("popover");
}

export default function Page() {
  return <ComponentPage id="popover" preview={PopoverPreview} />;
}
