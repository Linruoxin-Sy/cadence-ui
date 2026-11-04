import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { BreadcrumbPreview } from "@/components/site/previews/breadcrumb";

export function generateMetadata() {
  return getComponentMetadata("breadcrumb");
}

export default function Page() {
  return <ComponentPage id="breadcrumb" preview={BreadcrumbPreview} />;
}
