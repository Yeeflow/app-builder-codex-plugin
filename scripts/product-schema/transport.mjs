import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export function loadEnvelopes(){return JSON.parse(fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../docs/standards/product-schema/mcp-envelopes.json'),'utf8'));}
export function validateEnvelope(contracts,componentType,detail){
 const contract=contracts.components[componentType],errors=[];if(!contract)return {valid:false,errors:[{code:'CONTRACT_NOT_CAPTURED'}],saveReady:false};
 function walk(schema,value,at){
  const type=schema.Type;const good=type==='object'?value!==null&&typeof value==='object'&&!Array.isArray(value):type==='array'?Array.isArray(value):type==='number'?typeof value==='number'&&Number.isFinite(value):typeof value===type;
  if(!good){errors.push({path:at,code:'TRANSPORT_TYPE'});return;}
  if(schema.Format==='Int32'&&(!Number.isInteger(value)||value< -2147483648||value>2147483647))errors.push({path:at,code:'INT32_RANGE'});
  if(schema.Format==='Int64'&&!/^-?\d+$/.test(value))errors.push({path:at,code:'INT64_STRING'});
  if(type==='object'){
   for(const k of schema.Required||[])if(!Object.hasOwn(value,k))errors.push({path:at+'/'+k,code:'REQUIRED'});
   for(const [k,v]of Object.entries(value)){if(schema.Properties?.[k])walk(schema.Properties[k],v,at+'/'+k);else if(schema.AdditionalProperties)walk(schema.AdditionalProperties,v,at+'/'+k);else errors.push({path:at+'/'+k,code:'PROPERTY_NOT_IN_OBSERVED_CONTRACT'});}
  }
  if(type==='array'&&schema.Items)value.forEach((x,i)=>walk(schema.Items,x,at+'/'+i));
 }
 walk(contract.Schema,detail,'detail');
 if(componentType==='DataList'&&(!Array.isArray(detail?.Fields)||!detail.Fields.length))errors.push({path:'detail/Fields',code:'NONEMPTY_FIELDS_REQUIRED_BY_TOOL'});
 return {valid:!errors.length,errors,saveReady:false,proof:'observed outer payload shape only; internal resource and identity mappings require confirmation'};
}
export function planMapping(componentType){
 const workflow=['ApprovalForm','ScheduleForm'].includes(componentType);
 return {componentType,operation:'appbuilder_component_save',payloadProperty:'detail',deleteMissing:false,
  confirmedEnvelope:workflow?{internalField:'DefResource',wireType:'string',encoding:'base64-encoded Brotli',codec:'utils_compress_resource'}:componentType==='Dashboard'?{internalField:'LayoutInResources[].Resource',wireType:'string'}:componentType==='DataList'?{internalField:'Workflows[].DefResource',fields:'Fields[]',layouts:'Layouts[]'}:null,
  saveReady:false,blockers:['PRODUCT_TO_PERSISTED_DEFINITION_MAPPING_NOT_ESTABLISHED','AUTHORITATIVE_IDENTITIES_REQUIRED','PRODUCT_SEMANTIC_VALIDATION_REQUIRED'],
  updatePrecondition:'appbuilder_component_get and preserve unchanged fields',creationPrecondition:'fresh appbuilder_component_contract; no inferred IDs or absent defaults'};
}
