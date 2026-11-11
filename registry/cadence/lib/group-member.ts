/** Explicit component identity, never displayName or caller-component inspection.
 * Membership layers are only offered by controls with a known plain native host. */
const controls = new WeakSet<object>();
export function registerGroupControl(control: object) {
  controls.add(control);
}
export function isGroupControl(control: unknown) {
  return (typeof control === "function" || (typeof control === "object" && control !== null)) && controls.has(control);
}
