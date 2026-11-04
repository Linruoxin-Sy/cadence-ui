import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { AspectRatioPreview } from "@/components/site/previews/aspect-ratio";

export function generateMetadata() {
  return getComponentMetadata("aspect-ratio");
}

export default function Page() {
  return <ComponentPage id="aspect-ratio" preview={AspectRatioPreview} />;
}
