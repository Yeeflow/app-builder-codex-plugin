import fs from 'node:fs';
import {isDeepStrictEqual} from 'node:util';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const same=isDeepStrictEqual;
const requiredBuild=s=>s?.['x-product']?.requiredForBuild===true||Object.values(s?.properties||{}).some(requiredBuild);
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const supported=new Set(['$ref','$defs','definitions','type','const','enum','required','properties','additionalProperties','items','minItems','maxItems','uniqueItems','minLength','maxLength','pattern','minimum','maximum','exclusiveMinimum','exclusiveMaximum','multipleOf','minProperties','maxProperties','allOf','anyOf','oneOf','not','if','then','else','format','x-product']);
export function loadRegistry(root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../docs/standards/product-schema')){return JSON.parse(fs.readFileSync(path.join(root,'contracts.json'),'utf8'));}
function reference(registry,id,ref){
 const [file,fragment='']=ref.split('#');const target=file?path.posix.normalize(path.posix.join(path.posix.dirname(id),file)):id;
 if(/^[a-z]+:/i.test(file)||target.startsWith('../')||!registry.resources[target])throw Error(`UNRESOLVED_REFERENCE ${id} ${ref}`);
 let schema=registry.resources[target].schema;
 if(fragment){if(!fragment.startsWith('/'))throw Error('UNSUPPORTED_ANCHOR');for(const part of fragment.slice(1).split('/')){const k=decodeURIComponent(part).replace(/~1/g,'/').replace(/~0/g,'~');if(!schema||!Object.hasOwn(schema,k))throw Error('UNRESOLVED_POINTER');schema=schema[k];}}
 return {id:target,schema};
}
export function validate(registry,id,value){
 const errors=[],blockers=[];const checked=new Set();
 function inspect(schema,resource){
  if(typeof schema==='boolean')return;
  for(const k of Object.keys(schema))if(!supported.has(k))blockers.push({resource,code:'UNSUPPORTED_KEYWORD',keyword:k});
  if(schema.format&&!['uuid'].includes(schema.format))blockers.push({resource,code:'UNSUPPORTED_FORMAT',format:schema.format});
  if(schema.$ref){try{const r=reference(registry,resource,schema.$ref);scanResource(r.id);const key=r.id+'#'+schema.$ref;if(!checked.has(key)){checked.add(key);inspect(r.schema,r.id);}}catch(e){blockers.push({resource,code:e.message});}}
  for(const k of ['properties','$defs','definitions'])for(const s of Object.values(schema[k]||{}))inspect(s,resource);
  for(const k of ['items','additionalProperties','not','if','then','else'])if(obj(schema[k]))inspect(schema[k],resource);
  for(const k of ['allOf','anyOf','oneOf'])for(const s of schema[k]||[])inspect(s,resource);
 }
 const scanned=new Set();
 function scanResource(resource){if(scanned.has(resource))return;scanned.add(resource);const r=registry.resources[resource];if(!r){blockers.push({resource,code:'RESOURCE_NOT_IN_BATCH'});return;}blockers.push(...r.issues.map(x=>({resource,...x})));inspect(r.schema,resource);}
 scanResource(id);if(blockers.length)return {status:'blocked',valid:false,errors,blockers};
 function check(s,v,resource,p='$',depth=0,parent){
  if(depth>160)throw Error('VALIDATION_DEPTH_LIMIT');
  const out=[];const err=code=>out.push({path:p,code});
  if(s===true)return out;if(s===false){err('FALSE_SCHEMA');return out;}
  const sub=(t,x=v,q=p,owner=parent)=>check(t,x,resource,q,depth+1,owner);
  const product=s['x-product']||{};
  if(product.valueTypeBy){
   const selector=product.valueTypeBy.property,tag=parent?.[selector],type=product.valueTypeBy[String(tag)];
   if(!['string','number','boolean','object','array','integer','null'].includes(type)){err('ADAPTER_DYNAMIC_CONTEXT_REQUIRED');return out;}
   s={...s,type};
  }
  if(product.acceptedValueTypes)s={...s,type:product.acceptedValueTypes};
  if(product.allowDevice===true&&Array.isArray(v)){
   if(product.baseValueType==='array')return out;
   v.forEach((x,i)=>{if(x!==null)out.push(...sub({...s,'x-product':{...product,allowDevice:false}},x,`${p}/${i}`));});return out;
  }
  if(product.isFormulaVars===true&&v!==null){err('ADAPTER_FORMULA_VARIABLE_CONTEXT_REQUIRED');return out;}
  if((product.isFormula===true||product.isFlowExpr===true||product.isEmailExpr===true)&&Array.isArray(v)&&v.length){err('ADAPTER_EXPRESSION_CONTEXT_REQUIRED');return out;}
  if(product.isCode===true&&v){err('ADAPTER_CODE_REVIEW_REQUIRED');return out;}
  if(s.$ref){const r=reference(registry,resource,s.$ref);out.push(...check(r.schema,v,r.id,p,depth+1));}
  const matches=t=>t==='null'?v===null:t==='array'?Array.isArray(v):t==='object'?obj(v):t==='integer'?Number.isInteger(v):t==='number'?typeof v==='number'&&Number.isFinite(v):typeof v===t;
  if(s.type&&!(Array.isArray(s.type)?s.type:[s.type]).some(matches)){err('TYPE');return out;}
  if(Object.hasOwn(s,'const')&&!same(s.const,v))err('CONST');if(s.enum&&!s.enum.some(x=>same(x,v)))err('ENUM');
  for(const t of s.allOf||[])out.push(...sub(t));
  if(s.anyOf&&!s.anyOf.some(t=>sub(t).length===0))err('ANY_OF');
  if(s.oneOf&&s.oneOf.filter(t=>sub(t).length===0).length!==1)err('ONE_OF');
  if(s.not&&sub(s.not).length===0)err('NOT');
  if(s.if){const branch=sub(s.if).length===0?s.then:s.else;if(branch!==undefined)out.push(...sub(branch));}
  if(typeof v==='string'){
   const len=[...v].length;if(s.minLength!==undefined&&len<s.minLength)err('MIN_LENGTH');if(s.maxLength!==undefined&&len>s.maxLength)err('MAX_LENGTH');
   if(s.pattern&&!new RegExp(s.pattern,'u').test(v))err('PATTERN');if(s.format==='uuid'&&!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v))err('UUID');
  }
  if(typeof v==='number'){
   for(const [k,f]of [['minimum',x=>v<x],['maximum',x=>v>x],['exclusiveMinimum',x=>v<=x],['exclusiveMaximum',x=>v>=x]])if(s[k]!==undefined&&f(s[k]))err(k);
   if(s.multipleOf!==undefined&&Math.abs(v/s.multipleOf-Math.round(v/s.multipleOf))>1e-9)err('MULTIPLE_OF');
  }
  if(Array.isArray(v)){
   if(s.minItems!==undefined&&v.length<s.minItems)err('MIN_ITEMS');if(s.maxItems!==undefined&&v.length>s.maxItems)err('MAX_ITEMS');
   if(s.uniqueItems&&v.some((x,i)=>v.slice(0,i).some(y=>same(x,y))))err('UNIQUE_ITEMS');
   if(s.items!==undefined)v.forEach((x,i)=>out.push(...sub(s.items,x,`${p}/${i}`)));
  }
  if(obj(v)){
   for(const k of [...new Set([...(s.required||[]),...Object.entries(s.properties||{}).filter(([,x])=>requiredBuild(x)).map(([k])=>k)])])if(!Object.hasOwn(v,k))out.push({path:`${p}/${k}`,code:'REQUIRED'});
   for(const k of Object.keys(v)){if(Object.hasOwn(s.properties||{},k))out.push(...sub(s.properties[k],v[k],`${p}/${k}`,v));else if(s.additionalProperties===false)out.push({path:`${p}/${k}`,code:'ADDITIONAL_PROPERTY'});else if(obj(s.additionalProperties))out.push(...sub(s.additionalProperties,v[k],`${p}/${k}`));}
   if(s.minProperties!==undefined&&Object.keys(v).length<s.minProperties)err('MIN_PROPERTIES');if(s.maxProperties!==undefined&&Object.keys(v).length>s.maxProperties)err('MAX_PROPERTIES');
  }
  return out;
 }
 try{errors.push(...check(registry.resources[id].schema,value,id));}catch(e){blockers.push({code:e.message});}
 for(let i=errors.length-1;i>=0;i--)if(errors[i].code.startsWith('ADAPTER_'))blockers.push(...errors.splice(i,1));
 return {status:blockers.length?'blocked':errors.length?'invalid':'structurally-valid',valid:!errors.length&&!blockers.length,errors,blockers,proof:'structure-only; product semantics and transport not established'};
}
export function createDraft(registry,id,values){const draft=structuredClone(values);const result=validate(registry,id,draft);if(!result.valid)throw Object.assign(Error('DRAFT_NOT_VALIDATED'),{result});return {resource:id,baselineCommit:registry.baselineCommit,draft,proof:result.proof};}
export function patchDraft(registry,id,current,changes){
 if(!obj(current)||!obj(changes))throw Error('OBJECT_PATCH_REQUIRED');
 for(const k of ['id','ID','resourceid','key'])if(Object.hasOwn(changes,k)&&!same(changes[k],current[k]))throw Error('IDENTITY_CHANGE_REJECTED');
 // Explicit top-level replacement: nested patches must be built from authoritative current content.
 return createDraft(registry,id,{...structuredClone(current),...structuredClone(changes)});
}
