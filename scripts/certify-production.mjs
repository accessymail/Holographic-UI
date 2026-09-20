import { access, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const requiredFiles = [
  'package-lock.json',
  'src-tauri/Cargo.lock',
  'docs/ENTERPRISE-CERTIFICATION.md',
  'docs/FINDINGS-REGISTER.md'
];
const evidence = [
  ['immutable-source-history', 'Repository commit/review history is available and independently reviewable.'],
  ['dependency-lockfiles', 'package-lock.json and src-tauri/Cargo.lock are present.'],
  ['dependency-install', 'npm ci --ignore-scripts completed successfully in a clean environment.'],
  ['web-verification', 'Typecheck, unit tests, production build, and protocol validation passed.'],
  ['native-verification', 'Rust/Tauri compilation and native qualification passed on every supported target.'],
  ['security-scans', 'SAST, secrets scanning, dependency scanning, and CodeQL have no release blockers.'],
  ['native-authorization', 'Capability/session/expiry/replay/rate/fail-closed controls passed native tests.'],
  ['os-isolation', 'OS-level sandboxing and privilege separation are implemented and evidenced.'],
  ['ipc-fuzzing', 'Native IPC fuzzing/property testing is complete with no unresolved release findings.'],
  ['sbom', 'SBOM was generated from the exact release build.'],
  ['provenance', 'Build provenance/attestation exists for the exact release artifacts.'],
  ['signed-release', 'Release artifacts are signed and signature verification passed.'],
  ['cross-platform', 'All supported platform qualification gates passed.'],
  ['vulnerability-register', 'All release-blocking findings are closed or formally accepted by authorized reviewers.'],
  ['independent-pentest', 'Independent penetration testing is complete and release blockers are closed.']
];

const results = [];
for (const [id, description] of evidence) {
  if (id === 'dependency-lockfiles') {
    const missing = [];
    for (const f of requiredFiles.slice(0, 2)) {
      try { await access(resolve(root, f)); } catch { missing.push(f); }
    }
    results.push({ id, status: missing.length ? 'BLOCKED' : 'PASS', description, missing });
  } else {
    results.push({ id, status: 'REQUIRES_EVIDENCE', description });
  }
}

const blocked = results.filter(r => r.status === 'BLOCKED');
const unresolved = results.filter(r => r.status !== 'PASS');
const certification = blocked.length || unresolved.length ? 'NOT_CERTIFIED' : 'CERTIFIED';
const report = {
  schema: 'hui/production-certification/1',
  generatedAt: new Date().toISOString(),
  version: pkg.version,
  certification,
  principle: 'Missing evidence is never converted to PASS.',
  results
};
await writeFile(resolve(root, 'production-certification.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`Production certification: ${certification}`);
for (const r of results) console.log(`${r.status.padEnd(18)} ${r.id}`);
if (certification !== 'CERTIFIED') process.exit(1);
