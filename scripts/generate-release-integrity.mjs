import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, relative, join } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const excluded = new Set(['node_modules', '.git', 'dist', 'release-integrity.json', 'declared-dependencies.sbom.json']);
const hashFile = async file => {
  const hash = createHash('sha256');
  hash.update(await readFile(file));
  return hash.digest('hex');
};
const walk = async dir => {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (excluded.has(entry.name)) continue;
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(abs));
    else out.push(abs);
  }
  return out;
};
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const files = (await walk(root)).sort();
const records = [];
for (const file of files) records.push({ path: relative(root, file).replaceAll('\\', '/'), sha256: await hashFile(file) });
const manifest = {
  schema: 'hui/release-integrity/1',
  generatedAt: new Date().toISOString(),
  version: pkg.version,
  fileCount: records.length,
  files: records
};
await writeFile(resolve(root, 'release-integrity.json'), JSON.stringify(manifest, null, 2) + '\n');

const components = [];
for (const section of ['dependencies', 'devDependencies', 'peerDependencies']) {
  for (const [name, version] of Object.entries(pkg[section] ?? {})) {
    components.push({ type: 'library', name, version, scope: section });
  }
}
const sbom = {
  bomFormat: 'CycloneDX',
  specVersion: '1.6',
  version: 1,
  metadata: { component: { type: 'application', name: pkg.name, version: pkg.version } },
  components,
  properties: [{ name: 'hui.sbom.status', value: 'declared-dependencies-only' }, { name: 'hui.sbom.note', value: 'Resolved versions and integrity hashes require package-lock.json and a dependency-backed install.' }]
};
await writeFile(resolve(root, 'declared-dependencies.sbom.json'), JSON.stringify(sbom, null, 2) + '\n');
console.log(`Release integrity: ${records.length} files hashed`);
console.log(`Declared dependency SBOM: ${components.length} components`);
