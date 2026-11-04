import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { AvatarPreview } from "@/components/site/previews/avatar";

export function generateMetadata() {
  return getComponentMetadata("avatar");
}

export default function Page() {
  return <ComponentPage id="avatar" preview={AvatarPreview} />;
}
