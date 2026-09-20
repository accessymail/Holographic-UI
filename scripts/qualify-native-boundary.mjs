import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const checks = [
  ['src/adapters/native-host-boundary.ts', /sandbox\.read_text/],
  ['src/adapters/native-host-boundary.ts', /native_host_replay/],
  ['src-tauri/src/main.rs', /sandbox_required/],
  ['src-tauri/src/main.rs', /sandbox_path_escape/],
  ['src-tauri/src/main.rs', /sandbox_file_too_large/],
  ['src/core/host-recovery.ts', /host_recovery_not_allowed/],
  ['src/core/platform-security.ts', /processExecutionAllowed: false/]
];
for (const [file, pattern] of checks) {
  const text = await readFile(resolve(root, file), 'utf8');
  if (!pattern.test(text)) throw new Error(`qualification_failed:${file}:${pattern}`);
}
console.log(`Native boundary qualification: PASS (${checks.length} controls)`);
