import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { ButtonGroupPreview } from "@/components/site/previews/button-group";

export function generateMetadata() {
  return getComponentMetadata("button-group");
}

export default function Page() {
  return <ComponentPage id="button-group" preview={ButtonGroupPreview} />;
}
