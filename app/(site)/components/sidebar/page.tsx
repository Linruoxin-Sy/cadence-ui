import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { SidebarPreview } from "@/components/site/previews/sidebar";

export function generateMetadata() {
  return getComponentMetadata("sidebar");
}

export default function Page() {
  return <ComponentPage id="sidebar" preview={SidebarPreview} />;
}
