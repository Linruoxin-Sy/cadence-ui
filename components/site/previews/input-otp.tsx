"use client";

import { useState } from "react";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/registry/cadence/input-otp";
import { Label } from "@/registry/cadence/label";
import { PreviewStack } from "./shell";

/**
 * The six-box code with a separator between the groups, and the invalid variant.
 * Type into the first one: the slots advance themselves, the caret follows, and the
 * last box is where the paste lands.
 */
export function InputOtpPreview() {
  const [code, setCode] = useState("");
  const [invalid, setInvalid] = useState("0000");

  return (
    <PreviewStack>
      <div className="grid gap-3">
        <Label htmlFor="otp">Verification code</Label>
        <InputOTP id="otp" maxLength={6} value={code} onChange={setCode} containerClassName="justify-center">
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

      <div className="grid gap-3">
        <Label htmlFor="otp-invalid">Invalid code</Label>
        <InputOTP
          id="otp-invalid"
          maxLength={4}
          value={invalid}
          onChange={setInvalid}
          containerClassName="justify-center"
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} aria-invalid />
            <InputOTPSlot index={1} aria-invalid />
            <InputOTPSlot index={2} aria-invalid />
            <InputOTPSlot index={3} aria-invalid />
          </InputOTPGroup>
        </InputOTP>
      </div>
    </PreviewStack>
  );
}
