import { access, readFile, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const results = [];
const check = (name, status, detail) => results.push({ name, status, detail });
const exists = async file => { try { await access(resolve(root, file), constants.F_OK); return true; } catch { return false; } };
const run = (name, args, timeout = 120000) => {
  try {
    const out = execFileSync(name, args, { cwd: root, encoding: 'utf8', timeout, stdio: ['ignore','pipe','pipe'] });
    return { ok: true, output: out.trim() };
  } catch (e) {
    return { ok: false, output: `${e.stdout ?? ''}\n${e.stderr ?? ''}`.trim(), code: e.status ?? null };
  }
};

const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
check('version-format', /^1\.0\.0-rc\.\d+$/.test(pkg.version) ? 'PASS' : 'FAIL', pkg.version);
check('node-runtime', /^v22\./.test(process.version) ? 'PASS' : 'BLOCKED', process.version);
check('package-lock', await exists('package-lock.json') ? 'PASS' : 'BLOCKED', 'required for npm ci');
check('cargo-lock', await exists('src-tauri/Cargo.lock') ? 'PASS' : 'BLOCKED', 'required for deterministic Cargo builds');

if (await exists('package-lock.json')) {
  const npmCi = run('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund'], 180000);
  check('npm-ci', npmCi.ok ? 'PASS' : 'FAIL', npmCi.output.split('\n').slice(-3).join(' '));
  if (npmCi.ok) {
    for (const [name, args] of [['typecheck',['run','typecheck']],['tests',['run','test']],['build',['run','build']]]) {
      const r = run('npm', args, 180000);
      check(name, r.ok ? 'PASS' : 'FAIL', r.output.split('\n').slice(-3).join(' '));
    }
  } else {
    for (const name of ['typecheck','tests','build']) check(name, 'BLOCKED', 'npm ci did not complete');
  }
} else {
  for (const name of ['npm-ci','typecheck','tests','build']) check(name, 'BLOCKED', 'package-lock.json unavailable');
}

const cargo = run('cargo', ['--version'], 10000);
check('cargo-toolchain', cargo.ok ? 'PASS' : 'BLOCKED', cargo.ok ? cargo.output : 'cargo unavailable');
if (cargo.ok && await exists('src-tauri/Cargo.lock')) {
  const r = run('cargo', ['check','--locked','--manifest-path','src-tauri/Cargo.toml'], 180000);
  check('cargo-check-locked', r.ok ? 'PASS' : 'FAIL', r.output.split('\n').slice(-3).join(' '));
} else check('cargo-check-locked', 'BLOCKED', 'Cargo toolchain or Cargo.lock unavailable');

const summary = {
  generatedAt: new Date().toISOString(),
  version: pkg.version,
  environment: { node: process.version, platform: process.platform, arch: process.arch },
  results,
  certification: results.some(r => r.status === 'FAIL') ? 'FAIL' : results.some(r => r.status === 'BLOCKED') ? 'BLOCKED' : 'PASS'
};
await writeFile(resolve(root, 'build-qualification.json'), JSON.stringify(summary, null, 2) + '\n');
for (const r of results) console.log(`${r.status.padEnd(8)} ${r.name}: ${r.detail}`);
if (summary.certification === 'FAIL') process.exit(1);
