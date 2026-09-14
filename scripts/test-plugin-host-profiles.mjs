#!/usr/bin/env node
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,readdirSync,existsSync,rmSync,mkdirSync} from 'node:fs';
import {resolve,dirname,relative} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {execFileSync,spawnSync} from 'node:child_process';
import {validateApps,profileOptions,services} from './plugin-host-profile.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const temp=mkdtempSync(resolve(tmpdir(),'yeeflow-host-profiles-'));
const apps={apps:Object.fromEntries(services.map((key,i)=>[key,{id:`asdk_app_fixture${i}`}]))};
assert.deepEqual(validateApps(apps),apps);
for(const id of ['plugin_asdk_app_bad','asdk_app_','asdk_app_/bad','asdk_app_bad.value']) {
 const bad=structuredClone(apps);bad.apps.admin.id=id;assert.throws(()=>validateApps(bad),/PLUGIN_APP_ID_INVALID/);
}
const missing=structuredClone(apps);delete missing.apps.admin;assert.throws(()=>validateApps(missing),/SERVICE_SET/);
const dup=structuredClone(apps);dup.apps.admin.id=dup.apps.operations.id;assert.throws(()=>validateApps(dup),/DUPLICATE/);
assert.throws(()=>profileOptions(['--profile','other']),/PROFILE_INVALID/);
assert.throws(()=>profileOptions(['--profile','chatgpt-web']),/APPS_REQUIRED/);
assert.throws(()=>profileOptions(['--profile','chatgpt-web','--apps','x','--name','../escape']),/NAME_INVALID/);
assert.throws(()=>profileOptions(['--name','review']),/WEB_OPTIONS/);
function files(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(resolve(dir,e.name)):[resolve(dir,e.name)]);}
try {
 const mapping=resolve(temp,'apps.json');writeFileSync(mapping,JSON.stringify(apps));
 const folders={};
 for(const profile of ['codex','chatgpt-web']) {
  const archive=resolve(temp,`${profile}.zip`),out=resolve(temp,profile);mkdirSync(out);
  execFileSync(process.execPath,[resolve(root,'scripts/build-plugin-archive.mjs'),'--tracked-only','--profile',profile,'--output',archive,...(profile==='chatgpt-web'?['--apps',mapping,'--name','yeeflow-app-builder-web-review','--display-name','Yeeflow App Builder — Web Review']:[])],{cwd:temp,stdio:'pipe'});
  execFileSync('unzip',['-q',archive,'-d',out]);
  const dir=resolve(out,profile==='codex'?'yeeflow-app-builder-plugin':'yeeflow-app-builder-web-review');folders[profile]=dir;
  const manifest=JSON.parse(readFileSync(resolve(dir,'.codex-plugin/plugin.json')));
  const skills=readdirSync(resolve(dir,'skills')).filter(x=>existsSync(resolve(dir,'skills',x,'SKILL.md')));
  assert.equal(skills.length,27);
  for(const skill of skills) assert.match(readFileSync(resolve(dir,'skills',skill,'SKILL.md'),'utf8'),/Portable access to bundled resources/);
  if(profile==='codex') {assert.equal(manifest.mcpServers,'./.mcp.json');assert.ok(existsSync(resolve(dir,'.mcp.json')));}
  else {assert.equal(manifest.name,'yeeflow-app-builder-web-review');assert.equal(manifest.apps,'./.app.json');assert.equal(manifest.mcpServers,undefined);assert.ok(!existsSync(resolve(dir,'.mcp.json')));assert.ok(!existsSync(resolve(dir,'mcp.json')));assert.deepEqual(JSON.parse(readFileSync(resolve(dir,'.app.json'))),apps);}
  const result=spawnSync(process.execPath,[resolve(dir,'scripts/test-skill-entrypoint-compat.mjs')],{cwd:temp,encoding:'utf8'});
  assert.equal(result.status,0,result.stdout+result.stderr);assert.match(result.stdout,/guardrail tests passed/);
 }
 // Shared payload must survive host projection byte-for-byte, apart from explicit transport metadata.
 const codex=folders.codex,web=folders['chatgpt-web'];
 for(const file of files(codex)) {
  const rel=relative(codex,file);if(['.codex-plugin/plugin.json','.mcp.json','mcp.json','.app.json'].includes(rel))continue;
  assert.deepEqual(readFileSync(resolve(web,rel)),readFileSync(file),`host payload drift: ${rel}`);
 }
 console.log('PLUGIN_HOST_PROFILES_PASS: 2 archives; 27 skills each; shared payload parity; both entrypoint regressions; invalid mappings rejected');
}finally{rmSync(temp,{recursive:true,force:true});}
