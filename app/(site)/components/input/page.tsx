import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { InputPreview } from "@/components/site/previews/input";

export function generateMetadata() {
  return getComponentMetadata("input");
}

export default function Page() {
  return <ComponentPage id="input" preview={InputPreview} />;
}
