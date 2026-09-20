import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const workflowDir = join(root, '.github', 'workflows');
const files = (await readdir(workflowDir)).filter((name) => /\.(yml|yaml)$/.test(name));
const findings = [];
const warnings = [];
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const stable = !String(pkg.version).includes('-');

for (const file of files) {
  const path = join(workflowDir, file);
  const text = await readFile(path, 'utf8');
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    const match = line.match(/^\s*-?\s*uses:\s*([^\s#]+)(?:\s*#.*)?$/);
    if (!match) return;
    const ref = match[1];
    if (ref.startsWith('./') || ref.startsWith('docker://')) return;
    const at = ref.lastIndexOf('@');
    if (at < 0) {
      const message = `${file}:${index + 1}: action_without_ref:${ref}`;
      if (stable) findings.push(message); else warnings.push(message);
      return;
    }
    const sha = ref.slice(at + 1);
    if (!/^[0-9a-f]{40}$/.test(sha)) {
      const message = `${file}:${index + 1}: action_not_pinned_to_full_sha:${ref}`;
      if (stable) findings.push(message); else warnings.push(message);
    }
  });
}

if (findings.length) {
  console.error('Workflow pin verification: BLOCKED');
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}
console.log(`Workflow pin verification: OK (${files.length} workflow files)`);
for (const warning of warnings) console.log(`warning: ${warning}`);
