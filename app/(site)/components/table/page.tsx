import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { TablePreview } from "@/components/site/previews/table";

export function generateMetadata() {
  return getComponentMetadata("table");
}

export default function Page() {
  return <ComponentPage id="table" preview={TablePreview} />;
}
