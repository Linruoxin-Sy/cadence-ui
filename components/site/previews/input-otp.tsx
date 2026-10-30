"use client";

import { useState } from "react";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/registry/cadence/input-otp/input-otp";
import { Label } from "@/registry/cadence/label/label";

export function InputOtpPreview() {
  const [code, setCode] = useState("");

  return (
    <div className="flex flex-col items-center gap-6">
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
        <p className="text-sm text-muted-foreground">
          {code.length === 6 ? "Code complete. Verifying…" : `${6 - code.length} digits left.`}
        </p>
      </div>

      <div className="grid gap-3">
        <Label htmlFor="otp-invalid">Invalid code</Label>
        <InputOTP id="otp-invalid" maxLength={4} defaultValue="0000" containerClassName="justify-center">
          <InputOTPGroup>
            <InputOTPSlot index={0} aria-invalid />
            <InputOTPSlot index={1} aria-invalid />
            <InputOTPSlot index={2} aria-invalid />
            <InputOTPSlot index={3} aria-invalid />
          </InputOTPGroup>
        </InputOTP>
        <p className="text-sm text-destructive">That code expired. Request a new one.</p>
      </div>
    </div>
  );
}
