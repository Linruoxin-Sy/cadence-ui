import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { TocPreview } from "@/components/site/previews/toc";

export function generateMetadata() {
  return getComponentMetadata("toc");
}

export default function Page() {
  return <ComponentPage id="toc" preview={TocPreview} />;
}
