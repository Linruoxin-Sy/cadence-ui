import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { PaginationPreview } from "@/components/site/previews/pagination";

export function generateMetadata() {
  return getComponentMetadata("pagination");
}

export default function Page() {
  return <ComponentPage id="pagination" preview={PaginationPreview} />;
}
