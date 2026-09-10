import {isDeepStrictEqual} from 'node:util';
const copy=v=>JSON.parse(JSON.stringify(v));
function requireValue(ok,message){if(!ok)throw new Error(message);}
// Bounded patch of an existing native Designer draft, not a general workflow compiler.
export function patchNativeWorkflow(definition,change){
 const result=copy(definition);
 requireValue(Array.isArray(result.childshapes)&&Array.isArray(result.pageurls),'NATIVE_BASELINE_REQUIRED');
 requireValue(change && ['inputLabel','assignmentText'].includes(change.kind),'UNSUPPORTED_NATIVE_PATCH');
 if(change.kind==='inputLabel'){
  const page=result.pageurls.filter(p=>p.id===change.pageId);requireValue(page.length===1,'PAGE_ID_NOT_UNIQUE');
  const matches=[];function visit(c){if(c.id===change.controlId)matches.push(c);for(const x of c.children||[])visit(x);}visit(page[0].formdef);
  requireValue(matches.length===1&&matches[0].type==='input','INPUT_ID_NOT_UNIQUE');
  requireValue(typeof change.label==='string'&&change.label.trim().length>0,'LABEL_REQUIRED');matches[0].label=change.label;
 }else{
  const nodes=result.childshapes.filter(n=>n.id===change.nodeId);requireValue(nodes.length===1&&nodes[0].stencil?.id==='SetVariableTask','SET_VARIABLE_NODE_REQUIRED');
  requireValue(nodes[0].properties?.formtype==='current','CURRENT_WORKFLOW_REQUIRED');
  const rows=nodes[0].properties.variablesetting?.filter(v=>v.id===change.variableId)||[];
  requireValue(rows.length===1&&rows[0].type==='text','TEXT_ASSIGNMENT_REQUIRED');
  requireValue(result.variables?.basic?.some(v=>v.id===change.variableId&&v.type==='text'),'VARIABLE_BINDING_REQUIRED');
  requireValue(Array.isArray(change.expression)&&change.expression.length>0&&change.expression.every(t=>t.type==='text'&&typeof t.value==='string'&&Object.keys(t).every(k=>['type','value'].includes(k))),'TEXT_SEGMENTS_ONLY');
  rows[0].value=change.expression.map(t=>({type:'str',value:t.value}));
 }
 return result;
}
export function prepareNativeEnvelope(detail,compressedResource){
 requireValue(typeof compressedResource==='string'&&compressedResource.length>0,'COMPRESSED_RESOURCE_REQUIRED');
 const next=copy(detail);requireValue(typeof next.ProcModelID==='string'&&/^\d+$/.test(next.ProcModelID),'EXISTING_ID_REQUIRED');
 for(const key of ['AppID','Status','WorkflowType']){const v=next[key];requireValue((typeof v==='number'||typeof v==='string'&&/^-?\d+$/.test(v))&&Number.isInteger(Number(v))&&Number(v)>=-2147483648&&Number(v)<=2147483647,'INT32_REQUIRED:'+key);next[key]=Number(v);}
 next.DefResource=compressedResource;return next;
}
export function verifyNativeReadback(intended,actual){return {persistedReadback:isDeepStrictEqual(intended,actual),designerOpen:false,runtime:false};}
export function validateNativeGraph(definition){
 const errors=[],shapes=definition?.childshapes;if(!Array.isArray(shapes))return {valid:false,errors:['NATIVE_SHAPES_REQUIRED']};
 const ids=new Map();for(const n of shapes){if(typeof n.id!=='string'||!n.id||n.id!==n.resourceid||ids.has(n.id))errors.push('INVALID_OR_DUPLICATE_ID');ids.set(n.id,n);}
 const flows=shapes.filter(n=>n.stencil?.id==='SequenceFlow');
 for(const edge of flows){const source=ids.get(edge.source?.id),target=ids.get(edge.target?.id);if(!source||!target||source.stencil?.id==='SequenceFlow'||target.stencil?.id==='SequenceFlow'){errors.push('DANGLING_FLOW');continue;}
  if(edge.source.resourceid!==source.resourceid||edge.target.resourceid!==target.resourceid||!(source.outgoing||[]).some(r=>r.id===edge.id&&r.resourceid===edge.resourceid)||!(target.incoming||[]).some(r=>r.id===edge.id&&r.resourceid===edge.resourceid))errors.push('NONRECIPROCAL_FLOW');
 }
 for(const node of shapes.filter(n=>n.stencil?.id!=='SequenceFlow'))for(const direction of ['incoming','outgoing'])for(const ref of node[direction]||[]){const edge=ids.get(ref.id);if(edge?.stencil?.id!=='SequenceFlow'||ref.resourceid!==edge.resourceid||edge[direction==='incoming'?'target':'source']?.id!==node.id)errors.push('INVALID_NODE_EDGE_REFERENCE');}
 return {valid:errors.length===0,errors,proof:'native identity and edge reciprocity only; publication and runtime remain separate'};
}
