import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const run = (cmd, args) => execFileSync(cmd, args, { cwd: root, stdio: 'inherit', encoding: 'utf8' });
const failures = [];
const required = ['package.json', 'src-tauri/Cargo.toml', 'rust-toolchain.toml'];
for (const p of required) if (!existsSync(resolve(root, p))) failures.push(`missing ${p}`);

if (failures.length) { console.error(failures.join('\n')); process.exit(2); }

const evidence = {
  schema: 'holographic-ui/controlled-build/v1',
  generated_at: new Date().toISOString(),
  node: process.version,
  rust_toolchain_file: 'rust-toolchain.toml',
  required_toolchain: '1.98.1',
  actions: []
};

const attempt = (name, cmd, args) => {
  try { run(cmd, args); evidence.actions.push({ name, status: 'PASS' }); }
  catch { evidence.actions.push({ name, status: 'BLOCKED_OR_FAILED' }); }
};

if (!existsSync(resolve(root, 'package-lock.json'))) {
  attempt('generate-package-lock', 'npm', ['install', '--package-lock-only', '--ignore-scripts', '--no-audit', '--no-fund']);
}
if (!existsSync(resolve(root, 'src-tauri/Cargo.lock'))) {
  attempt('generate-cargo-lock', 'cargo', ['generate-lockfile', '--manifest-path', 'src-tauri/Cargo.toml']);
}

writeFileSync(resolve(root, 'controlled-build-bootstrap.json'), JSON.stringify(evidence, null, 2) + '\n');
const blocked = !existsSync(resolve(root, 'package-lock.json')) || !existsSync(resolve(root, 'src-tauri/Cargo.lock'));
process.exit(blocked ? 2 : 0);
