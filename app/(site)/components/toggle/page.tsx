import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { TogglePreview } from "@/components/site/previews/toggle";

export function generateMetadata() {
  return getComponentMetadata("toggle");
}

export default function Page() {
  return <ComponentPage id="toggle" preview={TogglePreview} />;
}
