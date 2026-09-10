import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
export const COMMIT='41bdac08a55204bb033acea54cf3af8d7ca2f740';
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const priorities=['workflow/form','workflow/control','workflow/definition','workflow/node','workflow/step','workflow/action','workflow/variables','workflow/expression'];
const scalar=new Set(['type','const','enum','required','additionalProperties','minLength','maxLength','pattern','minimum','maximum','exclusiveMinimum','exclusiveMaximum','multipleOf','minItems','maxItems','uniqueItems','minProperties','maxProperties','format']);
const maps=new Set(['properties','$defs','definitions','patternProperties','dependentSchemas']);
const children=new Set(['items','contains','additionalProperties','propertyNames','not','if','then','else']);
const arrays=new Set(['allOf','anyOf','oneOf','prefixItems']);
const annotations=new Set(['description','title','$comment','$schema','$id','id','name','createdAt','control_types','actionCategories','scope','supportedScopes','allowDevice','isGuid','default','examples']);
export function normalize(input,at='',issues=[],profile='generic') {
 if(typeof input==='boolean')return input;
 if(!input||typeof input!=='object'||Array.isArray(input)){issues.push({path:at,code:'NON_SCHEMA_OBJECT'});return {};}
 let node={...input};
 if(typeof node.description==='string') {try{const embedded=JSON.parse(node.description);if(embedded&&typeof embedded==='object'&&!Array.isArray(embedded))node={...node,...embedded};}catch{}}
 let out={};
 const productKeys=['allowDevice','isFormula','isFormulaVars','isFlowExpr','isEmailExpr','requiredForBuild','isKeyAttribute','isCode','valueTypeBy','acceptedValueTypes'];
 const product=Object.fromEntries(productKeys.filter(k=>node[k]!==undefined).map(k=>[k,node[k]]));
 if(Object.keys(product).length)out['x-product']={...product,baseValueType:node.valueType,profile};
 if(node.configurations){out.type='object';out.properties=Object.fromEntries(Object.entries(node.configurations).map(([k,v])=>[k,normalize(v,`${at}/configurations/${k}`,issues,profile)]));}
 if(node.valueType!==undefined){
  if(['string','number','boolean','object','array','integer','null'].includes(node.valueType))out.type=node.valueType;
  else if(node.valueType==='any'){}
  else if(node.valueType==='enum'&&node.enum)out.enum=Array.isArray(node.enum)?node.enum:Object.keys(node.enum);
  else issues.push({path:at,code:'UNRESOLVED_VALUE_TYPE',value:node.valueType});
 }
 for(const [k,v]of Object.entries(node)){
  if(k==='configurations'||k==='valueType'||k==='enumDescriptions'||productKeys.includes(k)||annotations.has(k))continue;
  if(k==='$ref'){out.$ref=v;continue;}
  if(maps.has(k)){out[k]=Object.fromEntries(Object.entries(v).map(([n,s])=>[n,normalize(s,`${at}/${k}/${n}`,issues,profile)]));continue;}
  if(children.has(k)){out[k]=typeof v==='boolean'?v:normalize(v,`${at}/${k}`,issues,profile);continue;}
  if(arrays.has(k)){out[k]=v.map((s,i)=>normalize(s,`${at}/${k}/${i}`,issues,profile));continue;}
  if(scalar.has(k)){out[k]=k==='enum'&&!Array.isArray(v)?Object.keys(v):v;continue;}
  // Never silently interpret product extensions as standard validation rules.
  issues.push({path:`${at}/${k}`,code:'REQUIRES_PRODUCT_ADAPTER',keyword:k});
 }
 if(node.properties&&!out.type&&!node.$ref)out.type='object';
 if(node.isGuid===true&&!out.format)out.format='uuid';
 if(profile==='action'&&node.valueType==='enum'&&node.enum&&!Array.isArray(node.enum))out.enum=Object.keys(node.enum).flatMap(k=>/^-?\d+$/.test(k)&&Number.isSafeInteger(Number(k))?[k,Number(k)]:[k]);
 return out;
}
export function build(snapshot){
 const base=path.join(snapshot,'resources/schemas');const inventory=[],contracts={};
 function walk(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name<b.name?-1:1)){
  const full=path.join(dir,ent.name);if(ent.isSymbolicLink())throw Error('SYMLINK_NOT_ALLOWED');if(ent.isDirectory()){walk(full);continue;}if(!ent.isFile())continue;
  const id=path.relative(base,full).split(path.sep).join('/'),bytes=fs.readFileSync(full);const family=id.split('/').slice(0,2).join('/');
  const record={id,family,sha256:hash(bytes),bytes:bytes.length,priority:priorities.includes(family)?1:2,kind:'reference-document',proof:{parsed:false,localValidation:false,transportMapped:false,persistedReadback:false,runtime:false}};
  if(full.endsWith('.json')){
   let raw;try{raw=JSON.parse(bytes);}catch(e){throw Error(`INVALID_JSON ${id}: ${e.message}`);}
   record.proof.parsed=true;record.kind=Array.isArray(raw)?'resource-index':raw.configurations?'product-configurations':raw.$schema||raw.$defs||raw.required?'json-schema':'semantic-dictionary';
   record.sourceSchemaId=raw.$id||null;
   if(record.priority===1&&['json-schema','product-configurations'].includes(record.kind)){
    const issues=[];const schema=normalize(raw,'',issues,id.startsWith('workflow/step/')?'action':id.startsWith('workflow/node/')?'node':'form');contracts[id]={schema,issues,controlTypes:raw.control_types||[],actionCategories:raw.actionCategories||[],sourceSha256:record.sha256};record.contract=true;record.adapterIssueCount=issues.length;
   }
  }
  inventory.push(record);
 }}walk(base);
 const summary={files:inventory.length,json:inventory.filter(r=>r.proof.parsed).length,contracts:Object.keys(contracts).length,families:{}};
 for(const r of inventory){const s=summary.families[r.family]??={files:0,json:0,contracts:0};s.files++;if(r.proof.parsed)s.json++;if(r.contract)s.contracts++;}
 return {inventory:{formatVersion:1,baseline:{commit:COMMIT,sourceRoot:'resources/schemas',mode:'fixed-reviewed-snapshot'},summary,resources:inventory},contracts:{formatVersion:1,baselineCommit:COMMIT,resources:contracts}};
}
export function diffCatalog(before,after){const a=new Map(before.resources.map(x=>[x.id,x])),b=new Map(after.resources.map(x=>[x.id,x]));return {added:[...b.keys()].filter(x=>!a.has(x)),removed:[...a.keys()].filter(x=>!b.has(x)),changed:[...b.keys()].filter(x=>a.has(x)&&a.get(x).sha256!==b.get(x).sha256)};}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [snapshot,out,mode]=process.argv.slice(2);if(!snapshot||!out)throw Error('Usage: catalog.mjs <fixed-source> <output-dir> [--check]');
 if(!path.resolve(snapshot).split(path.sep).includes(COMMIT))throw Error('FIXED_COMMIT_PATH_REQUIRED');
 if(path.resolve(out).startsWith(path.resolve(snapshot)+path.sep))throw Error('READ_ONLY_SOURCE');
 const result=build(snapshot);fs.mkdirSync(out,{recursive:true});
 for(const [name,data]of Object.entries(result)){const f=path.join(out,name+'.json'),text=JSON.stringify(data,null,2)+'\n';if(mode==='--check'){if(fs.readFileSync(f,'utf8')!==text)throw Error(`BASELINE_DRIFT ${name}`);}else fs.writeFileSync(f,text);}
 console.log(JSON.stringify(result.inventory.summary));
}
