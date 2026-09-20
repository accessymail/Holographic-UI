import { access, readFile, stat } from 'node:fs/promises';
import { constants } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const results = [];
const check = (name, status, detail) => results.push({ name, status, detail });
const exists = async (file) => { try { await access(resolve(root, file), constants.F_OK); return true; } catch { return false; } };

async function sha256(file) {
  const hash = createHash('sha256');
  hash.update(await readFile(resolve(root, file)));
  return hash.digest('hex');
}

const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
check('package-version', /^1\.0\.0-rc\.\d+(?:-hardening|-production-candidate)?$/.test(pkg.version) ? 'PASS' : 'FAIL', pkg.version);
check('node-engine', pkg.engines?.node === '>=22.0.0 <23' ? 'PASS' : 'FAIL', pkg.engines?.node ?? 'missing');
check('npm-lock', await exists('package-lock.json') ? 'PASS' : 'BLOCKED', 'A committed npm lockfile is required for deterministic npm ci.');
check('cargo-lock', await exists('src-tauri/Cargo.lock') ? 'PASS' : 'BLOCKED', 'A committed Cargo.lock is required for deterministic Cargo builds.');
check('npmrc-lockfile', await exists('.npmrc') ? 'PASS' : 'WARN', '.npmrc present; review registry and install policy before stable release.');

for (const file of ['package.json', 'src-tauri/Cargo.toml', 'src-tauri/tauri.conf.json']) {
  check(`manifest:${file}`, 'PASS', await sha256(file));
}

if (await exists('package-lock.json')) {
  const lock = JSON.parse(await readFile(resolve(root, 'package-lock.json'), 'utf8'));
  check('npm-lock-version', lock.lockfileVersion >= 3 ? 'PASS' : 'FAIL', String(lock.lockfileVersion));
}
if (await exists('src-tauri/Cargo.lock')) {
  const size = (await stat(resolve(root, 'src-tauri/Cargo.lock'))).size;
  check('cargo-lock-size', size > 0 ? 'PASS' : 'FAIL', `${size} bytes`);
}

const blocked = results.filter(r => r.status === 'BLOCKED');
const failures = results.filter(r => r.status === 'FAIL');
const summary = { generatedAt: new Date().toISOString(), version: pkg.version, deterministic: blocked.length === 0 && failures.length === 0, results };
await import('node:fs/promises').then(fs => fs.writeFile(resolve(root, 'reproducibility-report.json'), JSON.stringify(summary, null, 2) + '\n'));
for (const r of results) console.log(`${r.status.padEnd(8)} ${r.name}: ${r.detail}`);
if (failures.length || blocked.length) process.exit(1);
