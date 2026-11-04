import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { NavigationMenuPreview } from "@/components/site/previews/navigation-menu";

export function generateMetadata() {
  return getComponentMetadata("navigation-menu");
}

export default function Page() {
  return <ComponentPage id="navigation-menu" preview={NavigationMenuPreview} />;
}
