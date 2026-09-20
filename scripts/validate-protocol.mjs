import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const files = ['protocols/command.schema.json','protocols/event.schema.json'];
const extensionFile = 'protocols/extension-manifest.schema.json';
for (const file of files) {
  const value = JSON.parse(await readFile(resolve(root, file), 'utf8'));
  if (value.$schema !== 'https://json-schema.org/draft/2020-12/schema') throw new Error(`${file}: unexpected schema draft`);
  if (value.properties?.protocol?.const !== 'hui/1.0') throw new Error(`${file}: missing hui/1.0 protocol constant`);
}
const extension = JSON.parse(await readFile(resolve(root, extensionFile), 'utf8'));
if (extension.$schema !== 'https://json-schema.org/draft/2020-12/schema' || extension.properties?.isolation?.enum?.length !== 2) throw new Error('extension manifest schema invalid');
const command = JSON.parse(await readFile(resolve(root, 'protocols/command.schema.json'), 'utf8'));
if (!command.properties.type.enum.includes('APPROVAL_DECISION')) throw new Error('command schema missing APPROVAL_DECISION');
console.log('Protocol schemas: OK');
