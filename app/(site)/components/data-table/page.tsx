import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { DataTablePreview } from "@/components/site/previews/data-table";

export function generateMetadata() {
  return getComponentMetadata("data-table");
}

export default function Page() {
  return <ComponentPage id="data-table" preview={DataTablePreview} />;
}
