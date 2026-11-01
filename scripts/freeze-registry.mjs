import { freezeSnapshot } from "./registry-snapshots.mjs";

console.log(await freezeSnapshot(process.cwd()));
