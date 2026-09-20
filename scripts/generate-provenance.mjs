import fs from 'node:fs'; import crypto from 'node:crypto'; import {execFileSync} from 'node:child_process';
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
let gitSha=null; try { gitSha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(); } catch {}
const files=fs.readdirSync('.').filter(x=>x==='package.json'||x==='package-lock.json'||x==='Cargo.lock'||x==='rust-toolchain.toml');
const artifact={schemaVersion:'1.0',subject:{name:pkg.name,version:pkg.version},source:{gitCommit:gitSha,status:gitSha?'AVAILABLE':'NOT_AVAILABLE'},builder:{node:process.version},materials:files.map(f=>({path:f,sha256:crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')})),evidenceStatus:{buildExecuted:false,lockfilesPresent:files.includes('package-lock.json')&&files.includes('Cargo.lock'),signed:false}};
fs.writeFileSync('build-provenance.json',JSON.stringify(artifact,null,2)+'\n');
