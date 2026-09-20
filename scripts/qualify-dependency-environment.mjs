import { access, readFile, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const results = [];
const check = (name, status, detail) => results.push({ name, status, detail });
const exists = async file => { try { await access(resolve(root, file), constants.F_OK); return true; } catch { return false; } };
const run = (name, args, timeout = 10000) => {
  try {
    const output = execFileSync(name, args, { cwd: root, encoding: 'utf8', timeout, stdio: ['ignore','pipe','pipe'] });
    return { ok: true, output: output.trim() };
  } catch (error) {
    return { ok: false, output: `${error.stdout ?? ''}\n${error.stderr ?? ''}`.trim(), code: error.status ?? null };
  }
};
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
check('version', /^1\.0\.0-rc\.\d+$/.test(pkg.version) ? 'PASS' : 'FAIL', pkg.version);
check('node-engine', /^v22\./.test(process.version) ? 'PASS' : 'BLOCKED', process.version);
const npm = run('npm', ['--version']);
check('npm', npm.ok ? 'PASS' : 'BLOCKED', npm.ok ? npm.output : 'npm unavailable');
const cache = run('npm', ['cache', 'verify'], 30000);
check('npm-cache', cache.ok ? 'PASS' : 'BLOCKED', cache.ok ? cache.output.split('\n').slice(-2).join(' ') : 'npm cache unavailable');
check('package-lock', await exists('package-lock.json') ? 'PASS' : 'BLOCKED', 'package-lock.json required for npm ci');
const cargo = run('cargo', ['--version']);
check('cargo', cargo.ok ? 'PASS' : 'BLOCKED', cargo.ok ? cargo.output : 'cargo unavailable');
check('cargo-lock', await exists('src-tauri/Cargo.lock') ? 'PASS' : 'BLOCKED', 'Cargo.lock required for cargo check --locked');
const blocked = results.filter(x => x.status === 'BLOCKED').length;
const failed = results.filter(x => x.status === 'FAIL').length;
const report = { schema: 'hui/dependency-environment/1', generatedAt: new Date().toISOString(), version: pkg.version, environment: { node: process.version, npm: npm.ok ? npm.output : null, platform: process.platform, arch: process.arch }, results, certification: failed ? 'FAIL' : blocked ? 'BLOCKED' : 'PASS' };
await writeFile(resolve(root, 'dependency-environment.json'), JSON.stringify(report, null, 2) + '\n');
for (const r of results) console.log(`${r.status.padEnd(8)} ${r.name}: ${r.detail}`);
if (failed) process.exit(1);
