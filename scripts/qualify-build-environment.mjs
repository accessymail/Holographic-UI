import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';

const run = (cmd, args) => {
  try { return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore','pipe','pipe'] }).trim(); }
  catch { return null; }
};

const checks = {
  node: run('node', ['--version']),
  npm: run('npm', ['--version']),
  cargo: run('cargo', ['--version']),
  rustc: run('rustc', ['--version']),
  packageLock: existsSync('package-lock.json'),
  cargoLock: existsSync('src-tauri/Cargo.lock'),
};

const blockers = [];
if (checks.node !== 'v22.16.0') blockers.push(`node must be v22.16.0; found ${checks.node ?? 'missing'}`);
if (!checks.npm) blockers.push('npm is missing');
if (!checks.cargo) blockers.push('cargo is missing');
if (!checks.rustc) blockers.push('rustc is missing');
if (!checks.packageLock) blockers.push('package-lock.json is missing');
if (!checks.cargoLock) blockers.push('src-tauri/Cargo.lock is missing');

const result = {
  schema_version: 1,
  status: blockers.length ? 'BLOCKED' : 'READY_FOR_BUILD',
  checks,
  blockers,
  generated_at: new Date().toISOString(),
};
writeFileSync('build-environment-qualification.json', JSON.stringify(result, null, 2) + '\n');
console.log(`Build environment qualification: ${result.status}`);
for (const b of blockers) console.log(`BLOCKER: ${b}`);
process.exitCode = blockers.length ? 2 : 0;
