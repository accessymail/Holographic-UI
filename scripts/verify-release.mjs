import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const required = [
  'README.md','SECURITY.md','CONTRIBUTING.md','docs/THREAT-MODEL.md',
  'docs/RELEASE-GATES.md','docs/PRODUCTION-READINESS.md',
  'docs/security/NATIVE-CAPABILITY-TOKENS.md',
  '.github/dependabot.yml','.github/CODEOWNERS',
  'src-tauri/src/main.rs','src-tauri/Cargo.toml','src-tauri/capabilities/default.json'
];
const errors=[];
for (const file of required) {
  try { await access(resolve(root,file),constants.F_OK); }
  catch { errors.push(`missing_required_file:${file}`); }
}
const pkg=JSON.parse(await readFile(resolve(root,'package.json'),'utf8'));
if (pkg.license !== 'MIT') errors.push('license_must_be_MIT');
if (!String(pkg.version).includes('-')) {
  for (const f of ['package-lock.json','src-tauri/Cargo.lock']) {
    try { await access(resolve(root,f),constants.F_OK); } catch { errors.push(`lockfile_missing:${f}`); }
  }
}
if (errors.length) {
  console.error('Release verification: BLOCKED');
  errors.forEach(e=>console.error(`- ${e}`));
  process.exit(1);
}
console.log('Release verification: PASS (hardening baseline; certification gates remain external)');
