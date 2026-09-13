import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import {validateDashboardDatasetPresentationGoldenReferences} from './validate-dashboard-dataset-presentation-golden-references.mjs';
import assert from 'node:assert/strict';
import {applyDashboardCollectionPagination,buildChoiceStyleCondition,buildCollectionChoiceStyleRule} from './lib/dashboard-collection-presentation.mjs';
import {buildMaterialDashboardResource} from './materialize-full-app-generated-final.mjs';
const coll=(ps=20)=>({type:'collection',attrs:{data:{ps,filter:[{left:'Status'}]},pagination:{p:{sp:[null,12]}}}});
let c=coll();const paging=JSON.stringify(c.attrs.pagination);applyDashboardCollectionPagination(c);assert.equal(c.attrs.data.ps,10);assert.equal(JSON.stringify(c.attrs.pagination),paging);assert.equal(c.attrs.data.filter[0].left,'Status');
c=coll(25);applyDashboardCollectionPagination(c,{recordsPerPage:25});assert.equal(c.attrs.data.ps,25);
c=coll(20);applyDashboardCollectionPagination(c,{mode:'existing'});assert.equal(c.attrs.data.ps,20);
c=coll(1);c.attrs.data.limit=true;applyDashboardCollectionPagination(c);assert.equal(c.attrs.data.ps,1);
for(const n of [0,-1,1.5,'invalid'])assert.throws(()=>applyDashboardCollectionPagination(coll(),{recordsPerPage:n}),/INVALID/);
const one=buildChoiceStyleCondition({field:'Text2',label:'Status',value:'Review'});assert.equal(one[1].op,'==');
const multi=buildChoiceStyleCondition({field:'Text3',label:'Channel',value:'Web',multiple:true,storage:'array'});
assert.equal(multi[0].func,'arrayIndex');assert.equal(multi[0].params[0][0].id,'Text3');assert.equal(multi[0].params[1][0].value,'Web');assert.equal(multi[1].op,'>=');
assert.throws(()=>buildChoiceStyleCondition({field:'Text3',label:'Channel',value:'Web',multiple:true,storage:'comma-string'}),/STORAGE_PROOF/);
const rule=buildCollectionChoiceStyleRule({id:'rule',controlId:'badge',field:'Text2',label:'Status',value:'Review',background:'#FFF3C4',border:'#FFE9A1',color:'#946200'});
const style=JSON.parse(rule.actions.attrs.action_style).normal;assert.equal(style.bgcolor,'#FFF3C4');assert.equal(style.border.color,'#FFE9A1');assert.equal(style.color,'#946200');assert.equal(rule.controlId,'badge');
// Exercise the real Dashboard materializer, not just the default-value helper.
const meta={listName:'Items',listId:'1002',detailLayoutId:'1003',fields:[{FieldName:'Title',DisplayName:'Title',FieldType:'Text',Type:'input'}]};
function build(recordsPerPage,pageLayoutTemplateId='dashboard-page-layouts-v1.1'){
 return buildMaterialDashboardResource({name:'Items Dashboard',layoutId:'1004',pageLayoutTemplateId,rootListSetId:'1001',listName:'Items',listId:'1002',listMeta:meta,listMetaByName:new Map([['items',meta]]),datasetRecords:[{sourceResource:'Items',datasetRegion:'Items',selectedTemplateId:'collection_control_responsive',displayFields:'Title',recordsPerPage}],dashboardFilters:[],dashboardAnalytics:[],dashboardSummaryMetrics:[],collectionId:'items_collection',summaryId:'summary',filterId:'filter'});
}
function collections(root){const out=[];function w(n){if(!n||typeof n!=='object')return;if(n.type==='collection')out.push(n);for(const c of n.children||[])w(c);for(const c of n.attrs?.tablecols||[])w(c);}w(root);return out;}
assert.equal(collections(build()).find(c=>c.id==='items_collection').attrs.data.ps,10);
assert.equal(collections(build(25)).find(c=>c.id==='items_collection').attrs.data.ps,25);
const generated=build();
function allNodes(n){return [n,...(n.children||[]).flatMap(allNodes),...(n.attrs?.tablecols||[]).flatMap(allNodes)];}
const menus=allNodes(generated).filter(n=>n.type==='dropbar');assert.ok(menus.length);
for(const menu of menus){
 assert.equal(menu.attrs.settings.autoposition,true);
 assert.equal(menu.attrs.settings.position[1],'bottomRight');
 if(menu.attrs.content?.normal?.bgColor==='var(--c--neutral-dark-active)')for(const button of allNodes(menu).filter(n=>n.type==='action_button'))assert.match(button.attrs.common.css,/color:#FFFFFF!important/);
}
const master=collections(build(15,'dashboard-page-layouts-two-panel-workspace'));
assert.equal(master.find(c=>c.dashboardWorkspaceCollectionRole==='left-panel-list').attrs.data.ps,15);
assert.equal(master.find(c=>c.dashboardWorkspaceCollectionRole==='current-item-detail').attrs.data.ps,1);
console.log('Dashboard Collection presentation: materialized default/override/detail paging, exact choice membership and three independent style channels passed');

// Validate the generated artifact through the public package gate, then corrupt
// independent responsive settings to prove the compatibility exception is bounded.
const validationDir=fs.mkdtempSync(path.join(os.tmpdir(),'collection-presentation-gate-'));
try {
 const packageFile=path.join(validationDir,'synthetic.yapk');
 function validate(resource){
  const decoded={ListSet:{ListID:'1001',Title:'Synthetic'},Childs:[{ListID:'1002',Title:'Items',Fields:meta.fields}],Pages:[{ID:'1004',Type:103,Title:'Items Dashboard',LayoutInResources:[{Resource:JSON.stringify(resource)}]}]};
  fs.writeFileSync(packageFile,JSON.stringify({Resource:zlib.brotliCompressSync(Buffer.from(JSON.stringify(decoded))).toString('base64')}));
  return validateDashboardDatasetPresentationGoldenReferences({package:packageFile});
 }
 const valid=validate(generated); assert.equal(valid.status,'pass',JSON.stringify(valid.findings));
 for(const mutate of [m=>m.attrs.settings.position[3]='bottomLeft',m=>m.attrs.settings.autoposition=false,m=>m.attrs.settings.position[1]='invented']){
  const bad=structuredClone(generated);for(const menu of allNodes(bad).filter(n=>n.type==='dropbar'))mutate(menu);
  assert.ok(validate(bad).findings.some(f=>f.code==='DASH_DATASET_RESPONSIVE_OP_MENU_POSITION_INVALID'));
 }
 console.log('Generated responsive menu validation: desktop autoposition accepted; mobile drift, disabled auto and invalid placement rejected');
} finally {fs.rmSync(validationDir,{recursive:true,force:true});}
