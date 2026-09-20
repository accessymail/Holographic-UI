import fs from 'node:fs';
const x=JSON.parse(fs.readFileSync('build-provenance.json','utf8'));
if(x.schemaVersion!=='1.0'||!x.subject?.name||!Array.isArray(x.materials)) throw new Error('Invalid provenance');
if(x.evidenceStatus?.buildExecuted===true && x.evidenceStatus?.lockfilesPresent!==true) throw new Error('Build cannot be marked executed without lockfiles');
console.log(`Provenance structure: PASS (buildExecuted=${x.evidenceStatus.buildExecuted})`);
