import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { DrawerPreview } from "@/components/site/previews/drawer";

export function generateMetadata() {
  return getComponentMetadata("drawer");
}

export default function Page() {
  return <ComponentPage id="drawer" preview={DrawerPreview} />;
}
