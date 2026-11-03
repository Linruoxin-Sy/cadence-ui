"use client";

import { Button } from "@/registry/cadence/button";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { Spinner } from "@/registry/cadence/spinner";
import { PreviewRow, PreviewStack } from "./shell";

export function SavingButton() {
  return (
    <Button disabled size="sm" aria-busy="true">
      <Spinner aria-hidden="true" />
      Saving
    </Button>
  );
}

export function SpinnerSizes() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      <Spinner className="size-3 text-muted-foreground" />
      <Spinner />
      <Spinner className="size-6" />
      <Spinner className="size-8" />
    </div>
  );
}

export function SavingInvoice() {
  return <Spinner aria-label="Saving invoice" />;
}

export function StaticSpinner() {
  return (
    <CadenceProvider mode="none">
      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner aria-label="Static loading" data-testid="static-spinner" />
        Loading the registry…
      </span>
    </CadenceProvider>
  );
}

function Specimen() {
  return (
    <>
      <PreviewRow>
        <Spinner className="size-3" />
        <Spinner />
        <Spinner className="size-6" />
      </PreviewRow>
      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner />
        Loading the registry…
      </span>
    </>
  );
}

export function SpinnerPreview({ example }: { example?: string }) {
  return (
    <PreviewStack>
      {example === "button" ? (
        <SavingButton />
      ) : example === "sizes" ? (
        <SpinnerSizes />
      ) : example === "label" ? (
        <SavingInvoice />
      ) : example === "without-motion" ? (
        <StaticSpinner />
      ) : (
        <Specimen />
      )}
    </PreviewStack>
  );
}
