import { readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const fail = msg => { console.error(`FAIL: ${msg}`); process.exit(1); };
const exists = async p => { try { await access(resolve(root, p), constants.F_OK); return true; } catch { return false; } };
if (!(await exists('release-integrity.json'))) fail('release-integrity.json missing');
if (!(await exists('declared-dependencies.sbom.json'))) fail('declared-dependencies.sbom.json missing');
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const manifest = JSON.parse(await readFile(resolve(root, 'release-integrity.json'), 'utf8'));
if (manifest.version !== pkg.version) fail(`manifest version ${manifest.version} != package ${pkg.version}`);
const hashFile = async path => {
  const hash = createHash('sha256');
  hash.update(await readFile(resolve(root, path)));
  return hash.digest('hex');
};
for (const record of manifest.files) {
  if (!(await exists(record.path))) fail(`missing manifest file: ${record.path}`);
  const actual = await hashFile(record.path);
  if (actual !== record.sha256) fail(`hash mismatch: ${record.path}`);
}
console.log(`Release integrity: PASS (${manifest.fileCount} files)`);
console.log(`SBOM status: declared-dependencies-only until lockfile-backed resolution`);
