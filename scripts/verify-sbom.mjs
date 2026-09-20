import fs from 'node:fs';
const x=JSON.parse(fs.readFileSync('declared-dependencies.sbom.json','utf8'));
if(x.bomFormat!=='CycloneDX'||x.specVersion!=='1.6'||!Array.isArray(x.components)) throw new Error('Invalid CycloneDX SBOM');
if(x.metadata?.properties?.find(p=>p.name==='evidence.status')?.value!=='DECLARED_DEPENDENCIES_ONLY') throw new Error('SBOM evidence status mismatch');
console.log(`SBOM structure: PASS (${x.components.length} declared components; not build-resolved)`);
