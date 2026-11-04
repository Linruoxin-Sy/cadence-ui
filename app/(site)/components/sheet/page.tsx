import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { SheetPreview } from "@/components/site/previews/sheet";

export function generateMetadata() {
  return getComponentMetadata("sheet");
}

export default function Page() {
  return <ComponentPage id="sheet" preview={SheetPreview} />;
}
