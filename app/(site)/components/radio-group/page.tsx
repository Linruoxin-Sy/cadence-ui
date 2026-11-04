import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { RadioGroupPreview } from "@/components/site/previews/radio-group";

export function generateMetadata() {
  return getComponentMetadata("radio-group");
}

export default function Page() {
  return <ComponentPage id="radio-group" preview={RadioGroupPreview} />;
}
