import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { ButtonPreview } from "@/components/site/previews/button";

export function generateMetadata() {
  return getComponentMetadata("button");
}

export default function Page() {
  return <ComponentPage id="button" preview={ButtonPreview} />;
}
