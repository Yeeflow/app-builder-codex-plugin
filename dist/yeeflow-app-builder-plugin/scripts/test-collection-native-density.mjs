import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {applyNativeCollectionDensity as apply,inspectNativeCollectionDensity as inspect,inferCollectionLayoutContext as context} from './lib/collection-native-density.cjs';
import {buildMaterialDashboardResource,collectDashboardDatasetRecords} from './materialize-full-app-generated-final.mjs';
const require=createRequire(import.meta.url);
const {validateCollectionControls}=require('./collection-control-generation-standard.js');
const fields=[
 {fieldName:'Title',displayName:'Title',controlType:'input'},
 {fieldName:'Text2',displayName:'State',controlType:'select',Rules:JSON.stringify({choices:[{value:'Awaiting approval'}]})},
 {fieldName:'Text3',displayName:'Owner',controlType:'user'},
 {fieldName:'Text4',displayName:'Next Action',controlType:'textarea'},
 {fieldName:'Datetime1',displayName:'Due Date',controlType:'date'},
 {fieldName:'Text5',displayName:'Receipt Reference',controlType:'input'},
];
function collection(){return {id:'native',type:'collection',attrs:{data:{list:{ListID:'synthetic'},ps:10,sort:[{SortName:'Title'}],filter:[{left:'Text2'}]},pagination:{p:{}},actions:[{id:'edit'}],tablecols:fields.map((f,i)=>({id:`column-${i}`,attrs:{title:{value:f.displayName},sortingEnabled:true,sortingField:f.fieldName},children:[{id:`cell-${i}`,type:f.controlType==='user'?'dynamic-user':'dynamic-field',attrs:{source:'3','obj-f':f.fieldName}}]}))},children:[{id:'mobile',type:'container',children:[{type:'dynamic-field',attrs:{'obj-f':'Text4','t-len':[null,250,null,90]}}]}]};}
const walk=n=>[n,...(n.children||[]).flatMap(walk),...(n.attrs?.tablecols||[]).flatMap(walk)];
let c=collection(),before=structuredClone(c);apply(c,{fields,context:'full',fullValueAccess:true});
assert.deepEqual(c.children,before.children);for(const k of ['data','pagination','actions'])assert.deepEqual(c.attrs[k],before.attrs[k]);
assert.deepEqual(c.attrs.tablecols.map(c=>c.id),before.attrs.tablecols.map(c=>c.id));
assert.equal(c.attrs.tablecols.reduce((sum,c)=>sum+c.attrs.cw[1],0),100);
assert.ok(c.attrs.tablecols[3].attrs.cw[1]>c.attrs.tablecols[1].attrs.cw[1]);
assert.equal(c.attrs.tablecols[3].children[0].attrs['t-len'][1],180);
assert.equal(c.attrs.tablecols[0].children[0].attrs['t-len'],undefined);
assert.equal(c.attrs.tablecols[5].children[0].attrs['t-len'],undefined);
assert.deepEqual(inspect(c,{requireWidths:true}),[]);
let half=collection();apply(half,{fields,context:'constrained',fullValueAccess:true});assert.ok(half.attrs.tablecols.every(c=>c.attrs.cwu[1]==='px'));assert.equal(half.attrs.tablecols[3].attrs.cw[1],320);
let operations=collection();const selection={id:'selection',attrs:{},children:[{type:'checkbox',attrs:{action:'select-current'}}]};operations.attrs.tablecols.unshift(selection);operations.attrs.tablecols.push({id:'operations',attrs:{},children:[{type:'dropbar',attrs:{actions:[{id:'edit-current'}]}}]});const selectionBefore=structuredClone(selection);apply(operations,{fields,context:'constrained',fullValueAccess:true});assert.equal(operations.attrs.tablecols[0].attrs.cw[1],48);assert.equal(operations.attrs.tablecols.at(-1).attrs.cw[1],48);assert.deepEqual(operations.attrs.tablecols[0].children,selectionBefore.children);
let many=collection();many.attrs.tablecols.push(...[0,1,2].map(i=>({id:`extra-${i}`,attrs:{},children:[]})));apply(many,{fields,context:'full'});assert.ok(many.attrs.tablecols.every(c=>c.attrs.cwu[1]==='px'));
c=collection();const unchanged=structuredClone(c);assert.equal(apply(c,{mode:'existing',fields}).status,'preserved-existing');assert.deepEqual(c,unchanged);
c.attrs.tablecols[0].attrs.cw=[null,310,220,180];c.attrs.tablecols[0].attrs.cwu=[null,'px',null,'px'];
apply(c,{mode:'existing',authorized:true,fields,columnWidths:{Title:'290px'},textLengths:{Text4:140},fullValueAccess:true});assert.deepEqual(c.attrs.tablecols[0].attrs.cw,[null,290,220,180]);assert.equal(c.attrs.tablecols[3].children[0].attrs['t-len'][1],140);
let noAccess=collection();const result=apply(noAccess,{fields});assert.equal(result.warnings.length,1);assert.equal(noAccess.attrs.tablecols[3].children[0].attrs['t-len'],undefined);
for(const opts of [
 {columnWidths:{Missing:'100px'}}, {columnWidths:{Title:'-5px'}}, {columnWidths:{Title:'120%'}},
 {columnWidths:{Title:'100%'}}, {columnWidths:{Title:'25%',Text2:'100px'}}, {columnWidths:'{bad'},
 {textLengths:{Text4:0},fullValueAccess:true}, {textLengths:{Text4:150}},
 {textLengths:{Title:30},fullValueAccess:true}, {textLengths:{Text5:30},fullValueAccess:true},
 {textLengths:{Text4:1.5},fullValueAccess:true},
]){const bad=collection(),original=structuredClone(bad);assert.throws(()=>apply(bad,{fields,...opts}),/COLLECTION_DENSITY_/);assert.deepEqual(bad,original);}
c=collection();apply(c,{fields,textLengths:{Text4:'full'},fullValueAccess:true});assert.equal(c.attrs.tablecols[3].children[0].attrs['t-len'][1],null);
c=collection();apply(c,{fields,context:'full',columnWidths:{Title:'30%'},fullValueAccess:true});assert.equal(c.attrs.tablecols[0].attrs.cw[1],30);assert.ok(Math.abs(c.attrs.tablecols.reduce((s,c)=>s+c.attrs.cw[1],0)-100)<0.001);
for(const mutate of [c=>delete c.attrs.tablecols[0].attrs.cw,c=>c.attrs.tablecols[0].attrs.cw=[null],c=>c.attrs.tablecols[0].attrs.cw=[null,101],c=>c.attrs.tablecols[0].attrs.cwu=[null,'em'],c=>c.attrs.tablecols[3].children[0].attrs['t-len']=160]){const bad=structuredClone(c);mutate(bad);assert.ok(inspect(bad,{requireWidths:true}).length);}
const slot={type:'container',children:[]}, row={type:'container',attrs:{style:{direction:[null,'row']}},children:[slot,{type:'container'}]}, root={children:[row]};assert.equal(context(root,slot),'constrained');assert.equal(context({children:[slot]},slot),'full');assert.equal(context({},slot),'unknown');
// End-to-end builder: actual planned fields, reference shape remapping, placement,
// page-size policy, action graph, and external validator remain connected.
const meta={listName:'Work',listId:'1002',detailLayoutId:'1003',fields};
const record={sourceResource:'Work',datasetRegion:'Work items',selectedTemplateId:'collection_control_responsive',displayFields:fields.map(f=>f.fieldName).join(',')};
function build(records=[record]){return buildMaterialDashboardResource({name:'Work Dashboard',layoutId:'1004',rootListSetId:'1001',listName:'Work',listId:'1002',listMeta:meta,listMetaByName:new Map([['work',meta]]),datasetRecords:records,dashboardFilters:[],dashboardAnalytics:[],dashboardSummaryMetrics:[],collectionId:'work_collection',summaryId:'summary',filterId:'filter'});}
let page=build([record,{...record,datasetRegion:'Related work'}]);const generated=walk(page).filter(n=>n.type==='collection');assert.equal(generated.length,2);
assert.equal(generated[0].collectionDensityPolicy.context,'full');assert.equal(generated[1].collectionDensityPolicy.context,'constrained');
for(const coll of generated){assert.deepEqual(inspect(coll,{requireWidths:true}),[]);assert.equal(coll.attrs.data.ps,10);assert.equal(walk(coll.attrs.tablecols[3]).find(n=>n.type==='dynamic-field').attrs['t-len'][1],180);assert.equal(walk(coll.attrs.tablecols[0]).find(n=>n.type==='dynamic-field').attrs['t-len'],undefined);}
const issues=[];let corrupt=structuredClone(page);walk(corrupt).find(n=>n.type==='collection').attrs.tablecols[0].attrs.cw=[null,-1];validateCollectionControls({page:corrupt,issue:(...args)=>issues.push(args)});assert.match(JSON.stringify(issues),/COLLECTION_DENSITY_WIDTH_INVALID/);
const markdown=`## 14. Dashboard Pages Plan\n### 14.1 Work Dashboard\n| Dataset region | Source list | Selected template | Display fields | Column widths | Text lengths | Full value access |\n|---|---|---|---|---|---|---|\n| Work items | Work | collection_control_responsive | Title, Text2, Text3, Text4, Datetime1, Text5 | {"Title":"30%"} | {"Text4":120} | source-list |\n`;
const records=collectDashboardDatasetRecords(markdown);assert.equal(records.length,1);page=build(records);const mapped=walk(page).find(n=>n.type==='collection');assert.equal(mapped.attrs.tablecols[0].attrs.cw[1],30);assert.equal(walk(mapped.attrs.tablecols[3]).find(n=>n.type==='dynamic-field').attrs['t-len'][1],120);
// A plan with invalid fields must fail during real generation, not silently default.
assert.throws(()=>build([{...record,columnWidths:'{"Unknown":"120px"}'}]),/FIELD_UNRESOLVED/);
console.log('Native density: responsive mapping, placement, field semantics, explicit plans, safe truncation, scope preservation and real generation/gate regressions passed');
