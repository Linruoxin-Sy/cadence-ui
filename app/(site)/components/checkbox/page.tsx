import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { CheckboxPreview } from "@/components/site/previews/checkbox";

export function generateMetadata() {
  return getComponentMetadata("checkbox");
}

export default function Page() {
  return <ComponentPage id="checkbox" preview={CheckboxPreview} />;
}
