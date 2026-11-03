"use client";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useId, useState } from "react";
import { Button } from "@/registry/cadence/button";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/registry/cadence/input-otp";
import { Label } from "@/registry/cadence/label";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { PreviewStack } from "./shell";

export function ControlledCode() {
  const id = useId();
  const [code, setCode] = useState("");
  const [completed, setCompleted] = useState("Not completed");
  return (
    <div className="grid justify-items-start gap-3">
      <Label htmlFor={id}>Login code</Label>
      <InputOTP
        id={id}
        maxLength={6}
        value={code}
        onChange={setCode}
        onComplete={(value) => setCompleted(`Completed: ${value}`)}
      >
        <InputOTPGroup>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <InputOTPSlot key={index} index={index} />
          ))}
        </InputOTPGroup>
      </InputOTP>
      <p role="status" className="text-sm text-muted-foreground">
        {completed}
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setCode("");
          setCompleted("Not completed");
        }}
      >
        Clear login code
      </Button>
    </div>
  );
}
export function InvalidCode() {
  const id = useId();
  return (
    <div className="grid gap-3">
      <Label htmlFor={id}>Expired code</Label>
      <InputOTP id={id} maxLength={4} defaultValue="0000" aria-invalid="true" aria-describedby={`${id}-error`}>
        <InputOTPGroup>
          {[0, 1, 2, 3].map((index) => (
            <InputOTPSlot key={index} index={index} aria-invalid />
          ))}
        </InputOTPGroup>
      </InputOTP>
      <p id={`${id}-error`} className="text-sm text-destructive">
        This code has expired. Request another code.
      </p>
    </div>
  );
}
export function DisabledCodes() {
  const id = useId();
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor={`${id}-disabled`}>Unavailable code</Label>
        <InputOTP id={`${id}-disabled`} maxLength={4} disabled value="1234">
          <InputOTPGroup>
            {[0, 1, 2, 3].map((index) => (
              <InputOTPSlot key={index} index={index} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${id}-readonly`}>Read-only code</Label>
        <InputOTP id={`${id}-readonly`} maxLength={4} readOnly value="5678">
          <InputOTPGroup>
            {[0, 1, 2, 3].map((index) => (
              <InputOTPSlot key={index} index={index} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>
    </div>
  );
}
export function ShortCode() {
  return (
    <InputOTP maxLength={4} aria-label="PIN" containerClassName="justify-center">
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
        <InputOTPSlot index={3} />
      </InputOTPGroup>
    </InputOTP>
  );
}
export function PasteCode() {
  return (
    <InputOTP
      maxLength={6}
      aria-label="Pasted numeric code"
      inputMode="numeric"
      pattern={REGEXP_ONLY_DIGITS}
      pasteTransformer={(text) => text.replaceAll("-", "")}
    >
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  );
}
export function StaticCode() {
  return (
    <CadenceProvider mode="none">
      <div className="grid gap-4">
        <div data-testid="initial-none">
          <InputOTP maxLength={1} value="1" aria-label="Static code">
            <InputOTPGroup>
              <InputOTPSlot index={0} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <CadenceProvider mode="full">
          <div data-testid="explicit-full">
            <InputOTP maxLength={1} aria-label="Explicit full input-otp">
              <InputOTPGroup>
                <InputOTPSlot index={0} />
              </InputOTPGroup>
            </InputOTP>
          </div>
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}
function Specimen() {
  const id = useId();
  return (
    <div className="grid gap-3">
      <Label htmlFor={id}>Verification code</Label>
      <InputOTP id={id} maxLength={6} containerClassName="justify-center">
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
    </div>
  );
}
export function InputOtpPreview({ example }: { example?: string }) {
  return (
    <PreviewStack>
      {example === "controlled" ? (
        <ControlledCode />
      ) : example === "invalid" ? (
        <InvalidCode />
      ) : example === "disabled" ? (
        <DisabledCodes />
      ) : example === "without-separator" ? (
        <ShortCode />
      ) : example === "paste" ? (
        <PasteCode />
      ) : example === "without-motion" ? (
        <StaticCode />
      ) : (
        <Specimen />
      )}
    </PreviewStack>
  );
}
