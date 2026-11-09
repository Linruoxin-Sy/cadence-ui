// Browser transport for the same compiler's passive observations. No Vitest
// mocks, timing replacements or implementation wrappers in the browser bundle.
export const controlSamples = new Map();
export const cssPolicySamples = new Map();
export const presentationSamples = new Map();
export const parameterSamples = new WeakMap();
export const parameterCalls = [];
export const controllerWrites = new Map();
export const nativeNodeWrites = new WeakMap();
export const nativePropertyWrites = new WeakMap();
export const controllerPropertyWrites = new Map();
export const nativeEffects = new Map();
export const controllerOrigins = new WeakMap();
export const controllerSources = new WeakMap();
export const policyScopes = new WeakMap();
export function parameterClockIsZero() {
  return false;
}
export function onTestFinished() {}
export function createHmac() {
  throw new Error("Vitest-only evidence signing cannot run in the browser matrix");
}
