#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const version=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version;
const archive=path.resolve(root,process.argv[2] || `dist/yeeflow-app-builder-plugin-${version}.zip`);
const dist=path.join(root,'dist/yeeflow-app-builder-plugin');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/standards/product-14.5/distribution-files.json'),'utf8'));
for(const extra of ['docs/templates/dashboard-page-layouts-custom-code/distribution-files.json','docs/standards/product-schema/distribution-files.json']) manifest.mirrors.push(...JSON.parse(fs.readFileSync(path.join(root,extra),'utf8')).mirrors);
for(const {source,destination} of manifest.mirrors){
 let bytes=fs.readFileSync(path.join(root,source));
 if(source==='skills/installed/yeeflow-custom-code-generator/SKILL.md') bytes=Buffer.from(bytes.toString('utf8').replaceAll('../../../docs/','../../docs/'));
 assert.deepEqual(fs.readFileSync(path.join(dist,destination)),bytes,`source/dist ${destination}`);
 assert.deepEqual(execFileSync('unzip',['-p',archive,`yeeflow-app-builder-plugin/${destination}`],{maxBuffer:32*1024*1024}),bytes,`archive ${destination}`);
}
const entries=execFileSync('unzip',['-Z1',archive],{encoding:'utf8'}).trim().split('\n');
const allowed = new Set([
 ...execFileSync('git',['ls-files','-z','--','dist/yeeflow-app-builder-plugin'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean).map(p=>p.replace(/^dist\//,'')),
 ...manifest.mirrors.map(e=>`yeeflow-app-builder-plugin/${e.destination}`),
]);
for(const entry of entries.filter(p=>!p.endsWith('/'))) assert.ok(allowed.has(entry),`unreviewed archive entry: ${entry}`);
assert.ok(!entries.some(p=>/ [2-9]\.|\/node_modules\/|\/\.env$|\.(?:cs|yap|yapk|ydl|ywf)$/.test(p)), 'archive contains local copies, raw upstream source or generated application payloads');
for(const icon of ['assets/logo.png','assets/icon.png']){
 const original=execFileSync('git',['show',`HEAD:dist/yeeflow-app-builder-plugin/${icon}`],{cwd:root});
 assert.deepEqual(execFileSync('unzip',['-p',archive,`yeeflow-app-builder-plugin/${icon}`]),original,'official icon preserved');
}
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'yeeflow-145-extract-'));
try{
 execFileSync('unzip',['-q',archive,'-d',temp]);
 const payload=path.join(temp,'yeeflow-app-builder-plugin');
 const nativeTests=fs.readdirSync(path.join(payload,'scripts/product-schema')).filter(p=>p.endsWith('.test.mjs')).map(p=>'scripts/product-schema/'+p);
 execFileSync(process.execPath,['--test',...nativeTests],{cwd:payload,stdio:'pipe'});
 execFileSync(process.execPath,['--test','scripts/test-product-14.5-contracts.mjs'],{cwd:payload,stdio:'pipe'});
 for(const module of ['./yeeflow-control-field-schema-utils.js','./scripts/yeeflow-control-field-schema-utils.js','./skills/yeeflow-application-generator/scripts/yeeflow-control-field-schema-utils.js'])
  execFileSync(process.execPath,['-e',`require(${JSON.stringify(module)})`],{cwd:payload,stdio:'pipe'});
 assert.equal(JSON.parse(fs.readFileSync(path.join(payload,'.codex-plugin/plugin.json'),'utf8')).version,version);
}finally{fs.rmSync(temp,{recursive:true,force:true});}
console.log(`PRODUCT_145_DISTRIBUTION_OK mirrors=${manifest.mirrors.length}; extracted-module tests only; no plugin installation`);
