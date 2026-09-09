#!/usr/bin/env node
import assert from 'node:assert/strict';
import { test } from 'node:test';
import c from './product-14.5-contracts.cjs';
import { projectProperties } from './project-product-14.5-capabilities.mjs';
import schemaUtils from '../yeeflow-control-field-schema-utils.js';
const has = (issues, code) => issues.some(i => i.code === code);
const clone = structuredClone;
const field = { Type:'input_number', DefaultValue:'0', Rules:{number_min:0,number_max:10,number_step:1,readonly:false} };
const plan = () => ({host:'dashboard', supportedTypes:['search-filter','select-filter'], sources:[{id:'items',fields:['Status']}], controls:[{id:'rows',type:'data-list',conditionVariables:['q','s']},{id:'apply',type:'apply-button'}], filters:[{id:'search',type:'search-filter',variable:'q',mode:'immediate',dependents:['rows'],reload:['rows']},{id:'status',type:'select-filter',variable:'s',mode:'apply-button',applyButton:'apply',dependents:['rows'],listId:'items',field:'Status',options:'runtime-distinct'}]});
const sublist = () => { const state = {host:'workflow', id:'sublist', binding:'items', fields:[{id:'amount',type:'number',editor:{type:'currency',attrs:{placeholder:'Cost'},readonly:false}},{id:'lookup',type:'lookup',editor:{type:'lookup',attrs:{addition:[{FieldName:'Cost',RelationName:'amount',IsShow:false}]}}}], sourceFields:[{FieldName:'Cost',type:'number'}], actions:[{id:'changed'}], controls:[{id:'slot',children:[{id:'copy',type:'currency',binding:'amount',attrs:{placeholder:'Cost',list_field_binding:'items',list_control_id:'sublist',list_field:true},readonly:false}]}]}; for (const f of state.fields) {f.editor.binding=f.id;Object.assign(f.editor.attrs ??= {},{list_field_binding:state.binding,list_control_id:state.id,list_field:true});} return state; };
const report = () => ({profile:'product-14.5',source:{Key:'approval',fieldTypes:{v_amount:'number',v_flag:'boolean'}},report:{ID:'report',DefKey:'approval',Attr:JSON.stringify({isExport:false,isViewDetail:false}),Settings:JSON.stringify({Fields:[{ID:'variable',Key:'v_amount',Type:'number',L_Type:'currency'}],Filters:[{key:'condition',pre:'and',left:'v_flag',op:'b.isFalse',right:null}]})},list:{ListModel:{ListID:'report',Type:32},Defs:[{FieldID:'backing',FieldName:'Decimal1',InternalName:'v_amount'}],Layouts:[{ListID:'report',LayoutView:JSON.stringify({Attr_IsViewDetail:false,layout:[{FieldName:'Decimal1'}]})}]},filterFieldTypes:{v_flag:'boolean'}});
test('fixed catalog: 20 string defaults and 7 undeclared; no capability inflation',()=>{assert.equal(c.capability.defaultStringTypes.length,20);assert.equal(c.capability.defaultUndeclaredTypes.length,7);assert.equal(Object.keys(c.capability.fields).length,27);});
test('projection reads normal/configuration/embedded JSON/dynamic schema forms',()=>{
 const p=projectProperties({configurations:{Rows:{valueType:'array',description:JSON.stringify({type:'array',items:{type:'object',properties:{name:{type:'string'},value:{valueSchemaBy:{property:'kind',lookup:{type:'object'}}}}}})}}});
 assert.deepEqual(p['Rows.*.name'].types,['string']);assert.deepEqual(p['Rows.*.value.$dynamic'].variants,['lookup']);
 assert.deepEqual(projectProperties({properties:{flag:{type:'boolean'}}}).flag.types,['boolean']);
});
for(const type of c.capability.defaultStringTypes) test(`DefaultValue stays string: ${type}`,()=>{
 assert.ok(!has(c.validateField({Type:type,DefaultValue:'0'}),'FIELD_PRODUCT_TYPE_MISMATCH'));
 assert.ok(has(c.validateField({Type:type,DefaultValue:0}),'FIELD_PRODUCT_TYPE_MISMATCH'));
});
test('existing extra types remain warning only',()=>assert.equal(c.validateField({Type:'flowstatus'})[0].level,'warning'));
test('undeclared default is retained and warned',()=>assert.equal(c.patchField({Type:'richtext',DefaultValue:'old'},{DisplayName:'Body'}).DefaultValue,'old'));
test('defaults are neither encoded nor double encoded',()=>{
 const v=JSON.stringify({value:'A'});assert.equal(c.patchField({Type:'input',DefaultValue:v},{DisplayName:'New'}).DefaultValue,v);
 assert.ok(has(c.validateField({Type:'input',DefaultValue:JSON.stringify(v)}),'FIELD_DEFAULT_DOUBLE_ENCODING'));
});
test('IsFilter is not mapped to IsSort',()=>{
 assert.throws(()=>c.patchField(field,{IsFilter:false}),/ISFILTER/);
 assert.equal(c.patchField({...field,IsSort:true},{IsFilter:false},{confirmedIsFilterTransport:true}).IsSort,true);
});
test('field Rules merge preserves false and unspecified settings',()=>{
 const old={...field,Rules:JSON.stringify(field.Rules)};const next=c.patchField(old,{Rules:{number_max:20}});
 assert.deepEqual(JSON.parse(next.Rules),{...field.Rules,number_max:20});assert.equal(old.Rules,JSON.stringify(field.Rules));
});
for(const [patch, code] of [[{number_min:20},'FIELD_NUMERIC_RANGE_REVERSED'],[{number_step:0},'FIELD_NUMERIC_STEP_INVALID'],[{'rounded-to':-1},'FIELD_PRECISION_INVALID']]) test(code,()=>assert.ok(has(c.validateField({...field,Rules:{...field.Rules,...patch}}),code)));
test('upload units stay separate; version and extension checks',()=>{
 assert.ok(has(c.validateField({Type:'file-upload',Rules:{PROP_MAXSIZE:10}}),'FIELD_LIBRARY_UPLOAD_SCOPE_INVALID'));
 assert.ok(has(c.validateField({Type:'file-upload',Rules:{ver:2}}),'FIELD_UPLOAD_VERSION_INVALID'));
 assert.ok(has(c.validateField({Type:'file-upload',Rules:{file_typeslimit:true,file_types:{value:['other'],cusValue:'PDF'}}}),'FIELD_UPLOAD_EXTENSIONS_INVALID'));
});
test('embedded row type and required lookup value checked',()=>{
 const issues=c.validateField({Type:'list',Rules:{'list-variables':[{idx:'row',id:'x',name:'x',type:'lookup',editable:false}]}});
 assert.ok(has(issues,'SUBLIST_LOOKUP_VALUE_INVALID'));
});
test('existing schema entrypoint includes product advisory constraints',()=>assert.ok(has(schemaUtils.validateFieldAgainstSchema({...field,DefaultValue:0},schemaUtils.loadControlFieldSchemas()),'FIELD_PRODUCT_TYPE_MISMATCH')));
test('filter behavior generation has exact staged reset scope',()=>{
 const p=plan();assert.deepEqual(c.validateFilterPlan(p),[]);assert.deepEqual(c.buildFilterBehavior(p).resetTargets,['s']);
 p.resetTargets=[];assert.deepEqual(c.buildFilterBehavior(p).resetTargets,[]);
 p.resetTargets=['q'];assert.deepEqual(c.buildFilterBehavior(p).resetTargets,['q']);
});
for(const [name, mutate, code] of [
 ['missing condition',p=>p.controls[0].conditionVariables=['q'],'FILTER_CONDITION_UNCONSUMED'],
 ['missing reload',p=>p.filters[0].reload=[],'FILTER_RELOAD_MISSING'],
 ['missing apply',p=>p.filters[1].applyButton='missing','FILTER_APPLY_BUTTON_INVALID'],
 ['button variable',p=>p.controls[1].variable='x','FILTER_APPLY_BUTTON_VARIABLE_FORBIDDEN'],
 ['options enumerated',p=>p.filters[1].options=['A'],'FILTER_SELECTION_OPTIONS_INVALID'],
 ['default selected',p=>p.filters[1].defaultValue='A','FILTER_SELECTION_OPTIONS_INVALID'],
 ['wrong field',p=>p.filters[1].field='label','FILTER_BOUND_FIELD_UNRESOLVED'],
 ['wrong reset',p=>p.resetTargets=['missing'],'FILTER_RESET_TARGET_UNRESOLVED'],
 ['unsupported host',p=>p.host='public-form','FILTER_HOST_UNVERIFIED'],
]) test(`filter ${name}`,()=>{const p=plan();mutate(p);assert.ok(has(c.validateFilterPlan(p),code));});
test('actual encoded filter checks do not accept disconnected binding',()=>{
 const r={children:[{id:'s',type:'search-filter',binding:'q',attrs:{apply_t:'2',apply_btn:'missing'}}]};
 assert.ok(has(c.validateFilterResource(r),'FILTER_CONDITION_UNCONSUMED'));
 r.children.push({id:'rows',type:'collection',attrs:{data:{list:{ListID:'items'},filter:[{right:[{type:'expr',id:'__filter_q'}]}]}}});
 assert.ok(!has(c.validateFilterResource(r),'FILTER_CONDITION_UNCONSUMED'));
 assert.ok(has(c.validateFilterResource(r),'FILTER_APPLY_BUTTON_INVALID'));
});
test('workflow sublist updates preserve editor, business type and layout position',()=>{
 const s=sublist(), before=clone(s);assert.deepEqual(c.validateSublist(s),[]);
 const updated=c.patchSublistField(s,'amount',{'/readonly':true},{allowedStaticPaths:['/readonly']});
 assert.equal(updated.fields[0].editor.type,'currency');assert.equal(updated.fields[0].type,'number');
 assert.equal(updated.controls[0].children[0].id,'copy');assert.equal(updated.controls[0].children[0].readonly,true);assert.deepEqual(s,before);
});
for(const [name, mutate, code] of [
 ['wrong editor',s=>s.fields[0].editor.type='textarea','SUBLIST_EDITOR_INCOMPATIBLE'],
 ['label as target',s=>s.fields[1].editor.attrs.addition[0].RelationName='Cost','SUBLIST_LOOKUP_TARGET_INVALID'],
 ['source missing',s=>s.sourceFields=[],'SUBLIST_LOOKUP_SOURCE_INVALID'],
 ['type mismatch',s=>s.sourceFields[0].type='text','SUBLIST_LOOKUP_TARGET_INVALID'],
 ['action missing',s=>s.fields[0].changeAction='missing','SUBLIST_ACTION_UNRESOLVED'],
 ['DataList protected',s=>s.host='data-list','SUBLIST_HOST_PROFILE_UNVERIFIED']
]) test(`sublist ${name}`,()=>{const s=sublist();mutate(s);assert.ok(has(c.validateSublist(s),code));});
test('lookup display-only empty relation is legal',()=>{const s=sublist();s.fields[1].editor.attrs.addition[0].RelationName='';assert.deepEqual(c.validateSublist(s),[]);});
test('static patch rejects formula and structural replacement',()=>{
 assert.throws(()=>c.patchSublistField(sublist(),'amount',{'/label_var':[]},{allowedStaticPaths:['/label_var']}),/STATIC/);
 assert.throws(()=>c.patchSublistField(sublist(),'amount',{'/attrs/value':[{exprType:'variable'}]},{allowedStaticPaths:['/attrs/value']}),/FORMULA/);
});
test('FormReport complete dependency and false flags pass unchanged',()=>{const r=report(), old=clone(r);assert.deepEqual(c.validateReportClosure(r),[]);assert.deepEqual(r,old);});
for(const [name, mutate, code] of [
 ['source missing',r=>r.source=null,'REPORT_SOURCE_UNRESOLVED'],
 ['backing list wrong',r=>r.list.ListModel.Type=1,'REPORT_BACKING_LIST_UNRESOLVED'],
 ['all fields lost',r=>r.list.Defs=[],'REPORT_BACKING_FIELDS_MISMATCH'],
 ['same count wrong field',r=>r.list.Defs[0].InternalName='other','REPORT_BACKING_FIELDS_MISMATCH'],
 ['views missing',r=>r.list.Layouts=[],'REPORT_VIEWS_MISSING'],
 ['view field missing',r=>r.list.Layouts[0].LayoutView=JSON.stringify({layout:[{FieldName:'Deleted'}]}),'REPORT_VIEW_FIELD_UNRESOLVED'],
 ['false string',r=>r.report.Attr=JSON.stringify({isExport:'false'}),'REPORT_FLAG_INVALID'],
]) test(`report ${name}`,()=>{const r=report();mutate(r);assert.ok(has(c.validateReportClosure(r),code));});
test('Boolean false is explicit string equality or null predicate; not truthiness',()=>{
 for(const right of ['false','true']) assert.deepEqual(c.validateReportFilters([{key:'a',pre:'and',left:'flag',op:'b.=',right}],{flag:'boolean'}),[]);
 assert.ok(has(c.validateReportFilters([{key:'a',pre:'and',left:'flag',op:'b.=',right:false}],{flag:'boolean'}),'REPORT_FILTER_VALUE_OR_OPERATOR_INVALID'));
});
test('groups reject nested groups, empty children and inconsistent connectors',()=>{
 const leaf={key:'a',pre:'and',left:'n',op:'n.=',right:0};const group={key:'g',pre:'and',left:'FormID',op:'s.=',right:null,conditions:[leaf]};
 assert.deepEqual(c.validateReportFilters([group],{n:'number'}),[]);
 assert.ok(has(c.validateReportFilters([{...group,conditions:[]}],{n:'number'}),'REPORT_FILTER_LAYER_EMPTY'));
 assert.ok(has(c.validateReportFilters([{...group,conditions:[{...group,key:'nested'}]}],{n:'number'}),'REPORT_FILTER_GROUP_INVALID'));
 assert.ok(has(c.validateReportFilters([leaf,{...leaf,key:'b',pre:'or'}],{n:'number'}),'REPORT_FILTER_CONNECTOR_INVALID'));
});
test('invalid date is an issue, never an exception',()=>assert.ok(has(c.validateReportFilters([{key:'a',pre:'and',left:'date',op:'dt.=',right:'2026-99-99'}],{date:'date'}),'REPORT_FILTER_VALUE_OR_OPERATOR_INVALID')));

test('report finalization refuses pending views and unresolved source fields',()=>{
 const r=report();r.pendingViewIds=['unapplied'];assert.throws(()=>c.finalizeReport(r),/REPORT_VIEWS_PENDING/);
 delete r.pendingViewIds;r.source.fieldTypes={v_flag:'boolean'};assert.throws(()=>c.finalizeReport(r),/REPORT_FIELD_SOURCE_UNRESOLVED/);
});
test('sublist report mappings use Key, not repeated parent ID',()=>{
 const r=report(), s=JSON.parse(r.report.Settings);s.Fields.push({...s.Fields[0],Key:'v_second'});
 r.report.Settings=JSON.stringify(s);r.source.fieldTypes.v_second='number';r.list.Defs.push({FieldID:'other',FieldName:'Decimal2',InternalName:'v_second'});
 assert.deepEqual(c.validateReportClosure(r),[]);
});

test('sublist layout copies preserve hidden table labels',()=>{
 const s=sublist();s.controls[0].type='list-columns';s.controls[0].children[0].displayLabel=[null,false];
 const n=c.patchSublistField(s,'amount',{'/displayLabel':[null,true]},{allowedStaticPaths:['/displayLabel']});
 assert.deepEqual(n.controls[0].children[0].displayLabel,[null,false]);
});
test('sublist native attrs binding mismatch is rejected',()=>{
 const s=sublist();s.fields[0].editor.attrs.list_control_id='other';assert.ok(has(c.validateSublist(s),'SUBLIST_EDITOR_BINDING_INVALID'));
});
