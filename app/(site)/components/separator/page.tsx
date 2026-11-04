import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { SeparatorPreview } from "@/components/site/previews/separator";

export function generateMetadata() {
  return getComponentMetadata("separator");
}

export default function Page() {
  return <ComponentPage id="separator" preview={SeparatorPreview} />;
}
