import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { SelectPreview } from "@/components/site/previews/select";

export function generateMetadata() {
  return getComponentMetadata("select");
}

export default function Page() {
  return <ComponentPage id="select" preview={SelectPreview} />;
}
