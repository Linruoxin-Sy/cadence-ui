import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { InputOtpPreview } from "@/components/site/previews/input-otp";

export function generateMetadata() {
  return getComponentMetadata("input-otp");
}

export default function Page() {
  return <ComponentPage id="input-otp" preview={InputOtpPreview} />;
}
