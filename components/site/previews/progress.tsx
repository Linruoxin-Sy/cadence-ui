"use client";
import { useId, useState } from "react";
import { Button } from "@/registry/cadence/button";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { Progress, ProgressIndicator, ProgressLabel, ProgressTrack, ProgressValue } from "@/registry/cadence/progress";
import { PreviewStack } from "./shell";

export function LabelledProgress() {
  return (
    <Progress value={62} className="max-w-sm">
      <div className="flex w-full items-center justify-between">
        <ProgressLabel>Uploading assets</ProgressLabel>
        <ProgressValue />
      </div>
    </Progress>
  );
}
export function IndeterminateProgress() {
  return (
    <Progress value={null} aria-label="Preparing preview" className="max-w-sm">
      <ProgressLabel>Preparing preview</ProgressLabel>
    </Progress>
  );
}
export function CompleteProgress() {
  return (
    <div className="grid w-full max-w-sm gap-3">
      <Progress value={100}>
        <div className="flex w-full items-center justify-between">
          <ProgressLabel>Upload complete</ProgressLabel>
          <ProgressValue />
        </div>
      </Progress>
      <p role="status" className="text-sm text-muted-foreground">
        All files uploaded.
      </p>
    </div>
  );
}
export function CustomProgressRange() {
  return (
    <Progress
      value={3}
      min={0}
      max={5}
      aria-label="Build steps"
      getAriaValueText={() => "Step 3 of 5"}
      className="max-w-sm"
    >
      <ProgressValue />
    </Progress>
  );
}
export function ComposedProgress() {
  return (
    <Progress value={72} aria-label="Storage" className="max-w-sm">
      <ProgressTrack className="h-1.5 bg-muted">
        <ProgressIndicator className="bg-foreground" />
      </ProgressTrack>
    </Progress>
  );
}
export function CallerProgress() {
  const id = useId();
  const [value, setValue] = useState(62);
  return (
    <div className="grid w-full max-w-sm gap-4">
      <label htmlFor={id} className="grid gap-2 text-sm">
        Upload progress
        <input
          id={id}
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(event) => setValue(Number(event.target.value))}
        />
      </label>
      <Progress value={value} aria-label="Uploading assets">
        <div className="flex w-full items-center justify-between">
          <ProgressLabel>Uploading assets</ProgressLabel>
          <ProgressValue />
        </div>
      </Progress>
      <p role="status" className="text-sm text-muted-foreground">
        {value === 100 ? "Upload complete" : `Uploaded ${value}%`}
      </p>
      <Button variant="outline" size="sm" onClick={() => setValue(100)}>
        Complete upload
      </Button>
    </div>
  );
}
export function StaticProgress() {
  const id = useId();
  const [value, setValue] = useState(20);
  return (
    <CadenceProvider mode="none">
      <div className="grid w-full max-w-sm gap-4">
        <div data-testid="initial-none">
          <Progress value={null} aria-label="Static progress" />
        </div>
        <CadenceProvider mode="full">
          <div data-testid="explicit-full" className="grid gap-3">
            <label htmlFor={id} className="grid gap-2 text-sm">
              Explicit full progress
              <input
                id={id}
                type="range"
                min={0}
                max={100}
                value={value}
                onChange={(event) => setValue(Number(event.target.value))}
              />
            </label>
            <Progress value={value} aria-label="Explicit full progress" />
          </div>
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}
function Specimen() {
  return (
    <div className="grid w-full max-w-sm gap-5">
      <Progress value={62}>
        <div className="flex w-full items-center justify-between">
          <ProgressLabel>Uploading assets</ProgressLabel>
          <ProgressValue />
        </div>
      </Progress>
      <Progress value={null} aria-label="Preparing preview">
        <ProgressLabel>Preparing preview</ProgressLabel>
      </Progress>
      <Progress value={100} aria-label="Complete">
        <ProgressLabel>Complete</ProgressLabel>
      </Progress>
    </div>
  );
}
export function ProgressPreview({ example }: { example?: string }) {
  return (
    <PreviewStack>
      {example === "labelled" ? (
        <LabelledProgress />
      ) : example === "indeterminate" ? (
        <IndeterminateProgress />
      ) : example === "complete" ? (
        <CompleteProgress />
      ) : example === "range" ? (
        <CustomProgressRange />
      ) : example === "composed" ? (
        <ComposedProgress />
      ) : example === "caller-progress" ? (
        <CallerProgress />
      ) : example === "without-motion" ? (
        <StaticProgress />
      ) : (
        <Specimen />
      )}
    </PreviewStack>
  );
}
