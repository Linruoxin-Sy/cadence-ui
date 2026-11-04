import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { LabelPreview } from "@/components/site/previews/label";

export function generateMetadata() {
  return getComponentMetadata("label");
}

export default function Page() {
  return <ComponentPage id="label" preview={LabelPreview} />;
}
