import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const results = [];
const check = (name, status, detail) => results.push({ name, status, detail });
const exists = async (file) => { try { await access(resolve(root,file), constants.F_OK); return true; } catch { return false; } };

function command(name, args) {
  try { return execFileSync(name,args,{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim(); }
  catch { return null; }
}

const node = command(process.execPath,['--version']);
check('node-runtime', /^v22\./.test(node ?? '') ? 'PASS' : 'BLOCKED', node ?? 'node unavailable');
const npm = command('npm',['--version']);
check('npm-runtime', npm ? 'PASS' : 'BLOCKED', npm ?? 'npm unavailable');
const cargo = command('cargo',['--version']);
check('cargo-runtime', cargo ? 'PASS' : 'BLOCKED', cargo ?? 'cargo unavailable in qualification environment');

const pkg = JSON.parse(await readFile(resolve(root,'package.json'),'utf8'));
check('package-version', /^1\.0\.0-rc\.\d+(?:-hardening)?$/.test(pkg.version) ? 'PASS' : 'FAIL', pkg.version);
check('package-lock', await exists('package-lock.json') ? 'PASS' : 'BLOCKED', 'Deterministic npm install requires package-lock.json');
check('cargo-lock', await exists('src-tauri/Cargo.lock') ? 'PASS' : 'BLOCKED', 'Deterministic Cargo build requires Cargo.lock');
check('github-config', !String(pkg.homepage).includes('YOUR_ORG') ? 'PASS' : 'BLOCKED', 'Replace repository placeholders before release');

const dependencyDir = await exists('node_modules');
check('dependency-install', dependencyDir ? 'PASS' : 'BLOCKED', dependencyDir ? 'node_modules present' : 'node_modules absent; npm ci not verifiable');
if (dependencyDir) {
  check('typecheck', command('npm',['run','typecheck']) !== null ? 'PASS' : 'FAIL', 'dependency-backed TypeScript typecheck');
  check('unit-tests', command('npm',['test']) !== null ? 'PASS' : 'FAIL', 'dependency-backed test execution');
  check('production-build', command('npm',['run','build']) !== null ? 'PASS' : 'FAIL', 'production web build');
} else {
  check('typecheck','BLOCKED','Dependencies unavailable');
  check('unit-tests','BLOCKED','Dependencies unavailable');
  check('production-build','BLOCKED','Dependencies unavailable');
}

const summary = { generatedAt: new Date().toISOString(), version: pkg.version, results };
await import('node:fs/promises').then(fs => fs.writeFile(resolve(root,'production-qualification.json'), JSON.stringify(summary,null,2)+'\n'));
for (const r of results) console.log(`${r.status.padEnd(8)} ${r.name}: ${r.detail}`);
const failures = results.filter(r=>r.status==='FAIL');
const blocked = results.filter(r=>r.status==='BLOCKED');
if (failures.length || blocked.length) process.exit(1);
