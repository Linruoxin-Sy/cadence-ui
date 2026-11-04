import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { MenubarPreview } from "@/components/site/previews/menubar";

export function generateMetadata() {
  return getComponentMetadata("menubar");
}

export default function Page() {
  return <ComponentPage id="menubar" preview={MenubarPreview} />;
}
