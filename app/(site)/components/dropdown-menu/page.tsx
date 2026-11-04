import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { DropdownMenuPreview } from "@/components/site/previews/dropdown-menu";

export function generateMetadata() {
  return getComponentMetadata("dropdown-menu");
}

export default function Page() {
  return <ComponentPage id="dropdown-menu" preview={DropdownMenuPreview} />;
}
