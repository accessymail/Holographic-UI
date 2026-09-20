import { access, readFile, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { platform, arch, release } from 'node:os';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const results = [];
const check = (name, status, detail) => results.push({ name, status, detail });
const exists = async (file) => { try { await access(resolve(root, file), constants.F_OK); return true; } catch { return false; } };
const command = (name, args) => {
  try { return execFileSync(name, args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim(); }
  catch { return null; }
};

const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const expected = {
  'linux-x64': 'linux-x64',
  'linux-arm64': 'linux-arm64',
  'darwin-x64': 'macos-x64',
  'darwin-arm64': 'macos-arm64',
  'win32-x64': 'windows-x64',
};
const key = `${platform()}-${arch()}`;
check('runtime-platform', expected[key] ? 'PASS' : 'WARN', `${key} (${release()})`);
check('node-runtime', /^v22\./.test(process.version) ? 'PASS' : 'BLOCKED', process.version);
check('package-version', /^1\.0\.0-rc\.\d+(?:-hardening)?$/.test(pkg.version) ? 'PASS' : 'FAIL', pkg.version);
check('package-lock', await exists('package-lock.json') ? 'PASS' : 'BLOCKED', 'npm ci requires a committed package-lock.json');
check('dependencies-installed', await exists('node_modules') ? 'PASS' : 'BLOCKED', 'node_modules required for local dependency-backed qualification');

if (await exists('package-lock.json') && await exists('node_modules')) {
  for (const [name, args] of [
    ['typecheck', ['run', 'typecheck']],
    ['unit-tests', ['test']],
    ['production-build', ['run', 'build']],
  ]) {
    const output = command('npm', args);
    check(name, output !== null ? 'PASS' : 'FAIL', output?.split('\n').slice(-1)[0] ?? 'command failed');
  }
} else {
  check('typecheck', 'BLOCKED', 'Dependency-backed verification unavailable');
  check('unit-tests', 'BLOCKED', 'Dependency-backed verification unavailable');
  check('production-build', 'BLOCKED', 'Dependency-backed verification unavailable');
}

const summary = {
  generatedAt: new Date().toISOString(),
  version: pkg.version,
  environment: { platform: platform(), arch: arch(), release: release(), node: process.version },
  results,
};
await writeFile(resolve(root, 'cross-platform-qualification.json'), JSON.stringify(summary, null, 2) + '\n');
for (const r of results) console.log(`${r.status.padEnd(8)} ${r.name}: ${r.detail}`);
if (results.some(r => r.status === 'FAIL' || r.status === 'BLOCKED')) process.exit(1);
