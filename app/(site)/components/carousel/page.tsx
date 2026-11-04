import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { CarouselPreview } from "@/components/site/previews/carousel";

export function generateMetadata() {
  return getComponentMetadata("carousel");
}

export default function Page() {
  return <ComponentPage id="carousel" preview={CarouselPreview} />;
}
