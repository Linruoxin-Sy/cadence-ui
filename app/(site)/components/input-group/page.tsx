import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { InputGroupPreview } from "@/components/site/previews/input-group";

export function generateMetadata() {
  return getComponentMetadata("input-group");
}

export default function Page() {
  return <ComponentPage id="input-group" preview={InputGroupPreview} />;
}
