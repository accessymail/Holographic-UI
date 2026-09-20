import fs from 'node:fs';
import crypto from 'node:crypto';
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const components=[];
for (const [scope, deps] of [['runtime',pkg.dependencies||{}],['development',pkg.devDependencies||{}]]) for (const [name,version] of Object.entries(deps)) components.push({type:'library',name,version,scope,purl:`pkg:npm/${encodeURIComponent(name)}@${version}`});
const sbom={bomFormat:'CycloneDX',specVersion:'1.6',serialNumber:`urn:uuid:${crypto.randomUUID()}`,version:1,metadata:{timestamp:new Date().toISOString(),component:{type:'application',name:pkg.name,version:pkg.version},properties:[{name:'evidence.status',value:'DECLARED_DEPENDENCIES_ONLY'},{name:'evidence.lockfiles',value:'NOT_PRESENT'}]},components};
fs.writeFileSync('declared-dependencies.sbom.json',JSON.stringify(sbom,null,2)+'\n');
