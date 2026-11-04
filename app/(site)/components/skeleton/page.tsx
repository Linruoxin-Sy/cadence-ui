import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { SkeletonPreview } from "@/components/site/previews/skeleton";

export function generateMetadata() {
  return getComponentMetadata("skeleton");
}

export default function Page() {
  return <ComponentPage id="skeleton" preview={SkeletonPreview} />;
}
