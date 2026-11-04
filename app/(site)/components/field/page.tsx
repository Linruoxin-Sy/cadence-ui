import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { FieldPreview } from "@/components/site/previews/field";

export function generateMetadata() {
  return getComponentMetadata("field");
}

export default function Page() {
  return <ComponentPage id="field" preview={FieldPreview} />;
}
