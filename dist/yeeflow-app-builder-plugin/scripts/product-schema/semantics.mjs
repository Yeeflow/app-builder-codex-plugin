import {validate} from './runtime.mjs';
export function deviceValue(value){return [null,structuredClone(value)];}
export function validateVariables(registry,value){
 const result=validate(registry,'workflow/variables/schema.json',value);if(!result.valid)return result;
 const errors=[];const unique=(arr,path)=>{const ids=new Set();for(const x of arr){if(ids.has(x.id))errors.push({path,code:'DUPLICATE_ID',id:x.id});ids.add(x.id);}return ids;};
 for(const kind of ['basic','listref','filter','tempVars'])unique(value[kind],kind);
 const lists=new Set(value.listref.map(x=>x.id)),used=new Set();
 for(const v of value.basic)if(['dict','list'].includes(v.type)){used.add(v.value);if(!lists.has(v.value))errors.push({path:'basic',code:'LIST_REFERENCE_MISSING',id:v.value});}
 for(const list of value.listref){unique(list.fields,`listref/${list.id}/fields`);if(!used.has(list.id))errors.push({path:'listref',code:'ORPHAN_LIST_REFERENCE',id:list.id});}
 return {...result,valid:!errors.length,status:errors.length?'invalid':'product-rules-validated',errors,proof:'variable schema plus namespace/list-reference rules; no runtime proof'};
}
export function validateAction(registry,action,{baseline}={}){
 const result=validate(registry,'workflow/action/schema.json',action);if(!result.valid)return result;
 const errors=[],blockers=[];
 if(baseline&&(action.id!==baseline.id||action.type!==baseline.type))errors.push({path:'$',code:'ACTION_IDENTITY_OR_CATEGORY_CHANGED'});
 for(const [i,step]of action.steps.entries()){
  const path=`$/steps/${i}`,id=`workflow/step/${step.type}/schema.json`,resource=registry.resources[id];
  if(!/^[A-Za-z][A-Za-z0-9_-]*$/.test(step.type)||!resource||!resource.controlTypes.includes(step.type)){errors.push({path,code:'UNKNOWN_STEP_TYPE'});continue;}
  if(resource.actionCategories.length&&!resource.actionCategories.includes(action.type))errors.push({path,code:'STEP_CATEGORY_MISMATCH'});
  const attrs=structuredClone(resource.schema.properties?.attrs||{type:'object',properties:{}});
  function close(s){if(s.properties){s.additionalProperties=false;for(const v of Object.values(s.properties))close(v);}}
  close(attrs);
  const local={...registry,resources:{...registry.resources,[id]:{...resource,schema:attrs}}};const r=validate(local,id,step.attrs||{});
  errors.push(...r.errors.map(x=>({...x,path:path+'/attrs'+x.path.slice(1)})));blockers.push(...r.blockers.map(x=>({...x,step:i})));
  if(step.condition?.length)blockers.push({path,code:'ACTION_CONDITION_CONTEXT_REQUIRED'});
 }
 return {valid:!errors.length&&!blockers.length,status:blockers.length?'blocked':errors.length?'invalid':'product-rules-validated',errors,blockers,proof:'action schema, step dispatch, attrs and category only; expression scopes and execution not established'};
}
export function validateGraph(registry,elements){
 const errors=[],blockers=[];if(!Array.isArray(elements))return {valid:false,status:'invalid',errors:[{code:'NODES_ARRAY_REQUIRED'}],blockers};
 const uuid=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i,seen=new Set();
 for(const e of elements){const r=validate(registry,'workflow/node/definition/schema.json',e);errors.push(...r.errors);blockers.push(...r.blockers);if(!e||!uuid.test(e.id)||e.id!==e.resourceid)errors.push({code:'GRAPH_IDENTITY_INVALID'});if(seen.has(e?.id))errors.push({code:'DUPLICATE_GRAPH_ID'});seen.add(e?.id);}
 if(errors.length||blockers.length)return {valid:false,status:blockers.length?'blocked':'invalid',errors,blockers};
 const nodes=new Map(elements.filter(x=>x.stencil.id!=='SequenceFlow').map(x=>[x.id,x])),flows=new Map(elements.filter(x=>x.stencil.id==='SequenceFlow').map(x=>[x.id,x]));
 if(!nodes.size)errors.push({code:'WORKFLOW_NODE_REQUIRED'});
 const pairs=new Set();
 for(const flow of flows.values()){
  const source=nodes.get(flow.source?.id),target=nodes.get(flow.target?.id);
  if(!source||!source.outgoing?.some(x=>x.id===flow.id))errors.push({code:'FLOW_SOURCE_OR_OUTGOING_MISSING',id:flow.id});
  if(!target||!target.incoming?.some(x=>x.id===flow.id))errors.push({code:'FLOW_TARGET_OR_INCOMING_MISSING',id:flow.id});
  if(target?.stencil.id==='StartNoneEvent')errors.push({code:'FLOW_BACK_TO_START',id:flow.id});
  const key=JSON.stringify([flow.source?.id,flow.target?.id]);if(pairs.has(key))errors.push({code:'DUPLICATE_DIRECTED_FLOW'});pairs.add(key);
  for(const condition of flow.properties?.conditioninfo||[])for(const side of ['left','right'])if(typeof condition[side]==='string'&&!condition[side].trim())errors.push({code:'EMPTY_FLOW_EXPRESSION'});
 }
 for(const node of nodes.values())for(const [side,endpoint]of [['incoming','target'],['outgoing','source']])for(const ref of node[side]||[])if(flows.get(ref.id)?.[endpoint]?.id!==node.id)errors.push({code:'INVALID_NODE_FLOW_REFERENCE',id:node.id});
 return {valid:!errors.length,status:errors.length?'invalid':'graph-integrity-valid',errors,blockers,saveReady:false,proof:'graph identity and reciprocal edges only; node properties, routing semantics, layout and execution need separate validation'};
}
export function validateExpression(registry,segments,{scope,variables}={}){
 const id='workflow/expression/schema.json',source=registry.resources[id];
 if(!source)return {valid:false,status:'blocked',blockers:[{code:'EXPRESSION_SCHEMA_MISSING'}],errors:[]};
 // These two dictionaries describe template/context semantics, not JSON validation keywords.
 // They are covered only for the explicit text/basic-variable/constant subset below.
 const local={...registry,resources:{...registry.resources,[id]:{...source,issues:source.issues.filter(x=>!['referenceTemplates','variableSources'].includes(x.keyword))}}};
 const result=validate(local,id,segments);if(!result.valid)return result;
 const errors=[],blockers=[];
 if(!['workflow','list.workflow','list.notification'].includes(scope))blockers.push({code:'EXPRESSION_SCOPE_REQUIRED'});
 for(const [i,s]of segments.entries()){
  if(s.type==='text'||!s.type)continue;
  if(s.type==='variable'&&typeof s.param?.id==='string'&&!s.prop){
   if(scope==='list.notification')errors.push({path:`$/${i}`,code:'VARIABLE_NOT_AVAILABLE_IN_SCOPE'});
   if(!variables?.basic)blockers.push({path:`$/${i}`,code:'AUTHORITATIVE_VARIABLES_REQUIRED'});
   else if(!variables.basic.some(x=>x.id===s.param.id))errors.push({path:`$/${i}`,code:'UNKNOWN_VARIABLE'});
  }else blockers.push({path:`$/${i}`,code:'REFERENCE_TEMPLATE_CONTEXT_ADAPTER_REQUIRED'});
 }
 return {valid:!errors.length&&!blockers.length,status:blockers.length?'blocked':errors.length?'invalid':'expression-reference-valid',errors,blockers,saveReady:false,proof:'text/constants/direct basic-variable references only; no expression evaluation or calculation-formula mapping'};
}
