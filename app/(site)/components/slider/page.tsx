import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { SliderPreview } from "@/components/site/previews/slider";

export function generateMetadata() {
  return getComponentMetadata("slider");
}

export default function Page() {
  return <ComponentPage id="slider" preview={SliderPreview} />;
}
