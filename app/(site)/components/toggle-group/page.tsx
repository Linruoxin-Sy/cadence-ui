import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { ToggleGroupPreview } from "@/components/site/previews/toggle-group";

export function generateMetadata() {
  return getComponentMetadata("toggle-group");
}

export default function Page() {
  return <ComponentPage id="toggle-group" preview={ToggleGroupPreview} />;
}
