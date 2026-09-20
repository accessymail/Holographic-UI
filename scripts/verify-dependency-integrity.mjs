import { access, readFile, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const result = { schema: 'holographic-ui/dependency-integrity/v1', generatedAt: new Date().toISOString(), checks: [] };
const add = (name,status,detail) => result.checks.push({name,status,detail});
const exists = async p => { try { await access(resolve(root,p), constants.F_OK); return true; } catch { return false; } };

const pkg = JSON.parse(await readFile(resolve(root,'package.json'),'utf8'));
const cargo = await readFile(resolve(root,'src-tauri/Cargo.toml'),'utf8');
const tauri = JSON.parse(await readFile(resolve(root,'src-tauri/tauri.conf.json'),'utf8'));
const versionFiles = ['package.json','src-tauri/Cargo.toml','src-tauri/tauri.conf.json','VERSION','RELEASE'];
const versions=[];
for (const f of versionFiles) {
  const s=await readFile(resolve(root,f),'utf8');
  const m=f==='package.json'?pkg.version:f.endsWith('.json')?tauri.version:s.match(/^version = "([^"]+)"/m)?.[1] ?? s.trim().split(/\r?\n/)[0];
  versions.push({file:f,version:m});
}
const unique=[...new Set(versions.map(x=>x.version))];
add('release-version-consistency', unique.length===1?'PASS':'FAIL', JSON.stringify(versions));
add('package-lock-present', await exists('package-lock.json')?'PASS':'BLOCKED','Exact npm dependency graph required.');
add('cargo-lock-present', await exists('src-tauri/Cargo.lock')?'PASS':'BLOCKED','Exact Cargo dependency graph required.');

if (await exists('package-lock.json')) {
  const lock=JSON.parse(await readFile(resolve(root,'package-lock.json'),'utf8'));
  add('npm-lockfile-version', lock.lockfileVersion===3?'PASS':'FAIL', String(lock.lockfileVersion));
  for (const [name,ver] of Object.entries({...pkg.dependencies,...pkg.devDependencies})) {
    const entry=lock.packages?.[`node_modules/${name}`];
    add(`npm:${name}`, entry?.version===ver?'PASS':'FAIL', `declared=${ver}; locked=${entry?.version??'missing'}`);
  }
} else add('npm-dependency-graph','BLOCKED','Cannot verify without package-lock.json.');

const cargoPins=[['tauri','2.8.1'],['tauri-build','2.4.1'],['serde_json','1'],['base64','0.22'],['ed25519-dalek','2.1']];
if (await exists('src-tauri/Cargo.lock')) add('cargo-lock-available','PASS','Cargo.lock present; cargo --locked must be executed in controlled runner.');
else add('cargo-dependency-graph','BLOCKED',`Declared requirements: ${cargoPins.map(x=>x.join('=')).join(', ')}`);

const expected='1.0.0-rc.18-production-candidate';
add('expected-release-version', pkg.version===expected?'PASS':'FAIL',pkg.version);
result.certification=result.checks.some(x=>x.status==='FAIL')?'FAIL':result.checks.some(x=>x.status==='BLOCKED')?'BLOCKED':'PASS';
await writeFile(resolve(root,'dependency-integrity.json'),JSON.stringify(result,null,2)+'\n');
for(const x of result.checks) console.log(`${x.status.padEnd(8)} ${x.name}: ${x.detail}`);
process.exit(result.certification==='PASS'?0:2);
