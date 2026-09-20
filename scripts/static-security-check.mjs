import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const skip = new Set(['node_modules','.git','dist','scripts']);
const forbidden = [
  [/\beval\s*\(/, 'dynamic eval'],
  [/\bnew\s+Function\s*\(/, 'dynamic Function constructor'],
  [/javascript:/i, 'javascript: URL'],
  [/postMessage\([^,]+,\s*["']\*["']\s*\)/, 'wildcard postMessage target'],
  [/targetOrigin\s*:\s*["']\*["']/, 'wildcard targetOrigin']
];

async function walk(dir) {
  const out=[];
  for (const entry of await readdir(dir, {withFileTypes:true})) {
    if (skip.has(entry.name)) continue;
    const path=join(dir,entry.name);
    if (entry.isDirectory()) out.push(...await walk(path));
    else if (/\.(ts|tsx|js|mjs|json|rs|html|css)$/.test(entry.name)) out.push(path);
  }
  return out;
}
const files=await walk(root); const findings=[];
for (const file of files) {
  const text=await readFile(file,'utf8');
  for (const [regex,label] of forbidden) if (regex.test(text)) findings.push(`${file}: ${label}`);
}
if (findings.length) { console.error(findings.join('\n')); process.exit(1); }
console.log(`Static security scan: OK (${files.length} files)`);
