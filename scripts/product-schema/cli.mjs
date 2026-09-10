import fs from 'node:fs';
import {loadRegistry,validate,createDraft,patchDraft} from './runtime.mjs';
import {validateVariables,validateAction,validateGraph,validateExpression} from './semantics.mjs';
import {loadEnvelopes,validateEnvelope,planMapping} from './transport.mjs';
const [mode,id,input,extra]=process.argv.slice(2);const reg=loadRegistry();
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
if(!['validate','draft','patch','variables','action','graph','expression','envelope','mapping'].includes(mode)||!id)throw Error('Usage: cli.mjs <validate|draft|patch|variables|action|graph|expression|envelope|mapping> <resource-id-or-component-type> [input.json] [changes-or-context.json]');
try{
 let result;
 if(mode==='mapping')result=planMapping(id);
 else{const data=read(input);result=mode==='validate'?validate(reg,id,data):mode==='draft'?createDraft(reg,id,data):mode==='patch'?patchDraft(reg,id,data,read(extra)):mode==='variables'?validateVariables(reg,data):mode==='action'?validateAction(reg,data,extra?read(extra):{}):mode==='graph'?validateGraph(reg,data):mode==='expression'?validateExpression(reg,data,extra?read(extra):{}):validateEnvelope(loadEnvelopes(),id,data);}
 console.log(JSON.stringify(result,null,2));if(result.valid===false)process.exitCode=1;
}catch(e){console.log(JSON.stringify({error:e.message,result:e.result},null,2));process.exitCode=1;}
