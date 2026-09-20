import { access } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const required = [
  'fuzz/native-ipc/Cargo.toml',
  'fuzz/native-ipc/fuzz_target.rs',
  'docs/IPC-FUZZING-PLAN.md'
];
const missing=[];
for (const f of required) { try { await access(resolve(root,f)); } catch { missing.push(f); } }
if (missing.length) {
  console.error(`IPC fuzzing qualification: BLOCKED (${missing.join(', ')})`);
  process.exit(1);
}
console.log('IPC fuzzing qualification: SCAFFOLD PRESENT — CAMPAIGN EVIDENCE REQUIRED');
process.exit(2);
