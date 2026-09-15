#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {resolve,dirname,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const source=existsSync(resolve(root,'dist/yeeflow-app-builder-plugin/.codex-plugin/plugin.json'));
const dist=source?resolve(root,'dist/yeeflow-app-builder-plugin'):root;
const json=p=>JSON.parse(readFileSync(p,'utf8'));
const old=/yeeflow_(?:app_builder|operations|admin|service_portal)_mcp|https:\/\/api\.yeeflow\.com\/v1\/mcp\/(?:app-builder|operations|admin|service-portal)|four (?:scoped |hosted )?MCP services/;
function walk(p){return readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(resolve(p,e.name)):[resolve(p,e.name)]);}
assert.deepEqual(json(resolve(dist,'.mcp.json')),{mcpServers:{yeeflow_mcp:{type:'http',url:'https://api.yeeflow.com/v1/mcp'}}});
assert.equal(existsSync(resolve(dist,'.app.json')),false,'Codex payload must not retain registered legacy Apps');
const skills=readdirSync(resolve(dist,'skills')).filter(s=>existsSync(resolve(dist,'skills',s,'SKILL.md')));
assert.equal(skills.length,27);
for(const name of skills){
 const body=readFileSync(resolve(dist,'skills',name,'SKILL.md'),'utf8');
 assert.match(body,/## Unified Yeeflow MCP connection/);
 assert.match(body,/single `yeeflow_mcp` connection/);
 assert.match(body,/Editor\/Visitor access is not application-administrator access/);
}
for(const file of walk(dist)){
 const rel=relative(dist,file);
 if(!/\.(md|json|yaml|yml|js|mjs|cjs)$/.test(rel))continue;
 // Versioned reports preserve what was installed then. Test code may name forbidden input fixtures.
 if(rel.startsWith('docs/releases/')||rel==='CHANGELOG.md'||rel.startsWith('scripts/test-'))continue;
 assert.doesNotMatch(readFileSync(file,'utf8'),old,`retired connection instruction: ${rel}`);
}
if(source){
 for(const name of skills){
  const file=resolve(root,'skills/installed',name,'SKILL.md');
  if(existsSync(file)) assert.doesNotMatch(readFileSync(file,'utf8'),old);
 }
}
console.log('UNIFIED_MCP_MIGRATION_PASS: one credential-free connection; all 27 skills; no active retired connection instructions');
